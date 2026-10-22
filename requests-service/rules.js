// Правила заявок по объектам — единственное место, где решается, кто что может сделать с заявкой и что при этом меняется.
// Без ввода-вывода: сервер (server.js) собирает контекст, зовёт эти функции и записывает результат. Проверка — rules.test.js.
//
// Решения владельца 21.10: система — для учёта KPI управляющих (главный управляющий Коледа, операционный директор).
//   - управляющий (ответственный) НЕ отменяет заявку, НЕ переносит срок, НЕ передаёт другому сам — только запрос,
//     решает контролёр (роль «Контроль заявок») или админ, и не тот, кто просил;
//   - срок ставится по срочности автоматически, руками его не вводят;
//   - свою работу ответственный не принимает: принимает арендатор / тот, кто поручил / контролёр;
//   - контролёр, который сам ответственный по заявке, в ней — обычный управляющий.
'use strict';

const OPEN = ['new', 'in_work', 'waiting', 'dept'];
const SOURCES = { portal: 'Портал арендатора', phone: 'Звонок или письмо арендатора', inspection: 'Обход, своя находка', order: 'Поручение руководства', dept: 'От отдела', other: 'Другое' };
const TENANT_WAIT = 'ответа арендатора';   // только это ожидание останавливает часы срока
const DEF = {   // значения по умолчанию — те же, что в src/_crm-config.js (страница «Настройки CRM» может поменять)
  urgency: { normal: { l: 'Обычная', d: 5, r: 24 }, urgent: { l: 'Срочно', d: 1, r: 4 }, emergency: { l: 'Авария', d: 0, r: 1 } },
  deptDays: 3
};

// ---------- даты ----------
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// ponytail: только выходные, праздники не учитываются — производственный календарь, если сроки начнут спорить
function addWorkDays(from, n) {
  const d = new Date(from.getTime());
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) i++; }
  return iso(d);
}
function ru(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function urg(cfg, k) { const u = Object.assign({}, DEF.urgency, (cfg && cfg.urgency) || {}); return Object.assign({}, DEF.urgency[k] || DEF.urgency.normal, u[k] || {}); }

// ---------- кто есть кто ----------
// ctx: { me, isAdmin, isCtl, depts: [названия отделов пользователя], r: заявка, pending: [запросы на решение по заявке] }
function role(ctx) {
  const r = ctx.r || {}, me = Number(ctx.me);
  const resp = Number(r.responsible_id) === me;
  return { resp: resp, boss: (ctx.isAdmin || ctx.isCtl) && !resp, dept: r.status === 'dept' && ((ctx.depts || []).indexOf(r.dept) !== -1 || Number(r.dept_user_id) === me) };
}
function canAccept(ctx) {
  const r = ctx.r, x = role(ctx);
  if (x.resp) return false;
  return x.boss || (r.accept_mode === 'user' && Number(r.accept_user_id) === Number(ctx.me));
}

// какие действия доступны пользователю по заявке (ключи — те же, что принимает apply)
function actions(ctx) {
  const r = ctx.r, x = role(ctx), st = r.status, open = OPEN.indexOf(st) !== -1, a = [];
  const ask = function(kind) { return !(ctx.pending || []).some(function(p) { return p.kind === kind && p.status === 'pending'; }); };
  if (st === 'new' && (x.resp || x.boss)) a.push('take');
  if (st === 'in_work' && (x.resp || x.boss)) a.push('wait', 'to_dept');
  if (st === 'waiting' && (x.resp || x.boss)) a.push('resume');
  if ((st === 'in_work' || st === 'waiting') && (x.resp || x.boss)) a.push('done');
  if (st === 'dept' && (x.dept || x.boss)) a.push('dept_back');
  if (st === 'done' && canAccept(ctx)) a.push('accept', 'reopen');
  if (open && x.boss) a.push('due', 'assign', 'cancel');
  else if (open && x.resp) ['due', 'assign', 'cancel'].forEach(function(k) { if (ask(k)) a.push('ask_' + k); });
  if ((ctx.pending || []).some(function(p) { return p.status === 'pending' && Number(p.author_id) !== Number(ctx.me); }) && (ctx.isAdmin || ctx.isCtl) && !x.resp) a.push('decide');
  if (r.accept_mode === 'tenant' && (open || st === 'done') && (x.resp || x.boss || x.dept)) a.push('reply');   // ответ арендатору — виден на портале
  a.push('comment');
  return a;
}

// ---------- новая заявка ----------
// input: object_name, contract_id, tenant_label, kind, urgency, title, description, source, responsible_id (учитывается только у контролёра/админа)
// obj: объект (contract_objects) — управляющий по умолчанию; now: Date
function create(ctx, input, obj, cfg, now) {
  const v = input || {}, boss = ctx.isAdmin || ctx.isCtl, me = Number(ctx.me);
  if (!v.object_name) return { err: 'Выберите объект', field: 'object_name' };
  if (!v.kind) return { err: 'Выберите тип', field: 'kind' };
  if (!String(v.title || '').trim()) return { err: 'Опишите суть заявки', field: 'title' };
  const source = SOURCES[v.source] && v.source !== 'portal' ? v.source : 'other';
  if (source === 'order' && !boss) return { err: 'Поручение может дать только руководитель', field: 'source' };
  const k = DEF.urgency[v.urgency] ? v.urgency : 'normal', u = urg(cfg, k);
  let resp = Number(obj && obj.manager_user_id) || Number(obj && obj.senior_user_id) || me, note = '';
  if (boss && Number(v.responsible_id)) resp = Number(v.responsible_id);
  else if (!(obj && obj.manager_user_id)) note = obj && obj.senior_user_id ? ' (у объекта не указан управляющий с учёткой — назначена старшему)' : ' (у объекта не указан управляющий с учёткой)';
  // кто принимает работу: арендатор, тот кто поручил / попросил, или контролёр, если ответственный создал заявку сам себе
  let mode = 'controller', acc = null;
  if (source === 'phone') mode = 'tenant';
  else if (me !== resp) { mode = 'user'; acc = me; }
  const values = {
    object_name: v.object_name, contract_id: Number(v.contract_id) || null, tenant_label: v.tenant_label || null, kind: v.kind, urgency: k,
    title: String(v.title).trim().slice(0, 250), description: String(v.description || '').trim(), status: 'new', source: source,
    responsible_id: resp, author_id: me, accept_mode: mode, accept_user_id: acc,
    due_date: addWorkDays(now, u.d), react_due_at: new Date(now.getTime() + u.r * 3600e3).toISOString(), due_moved: 0, reopen_count: 0
  };
  const title = values.title, notify = [[resp, (k === 'emergency' ? 'АВАРИЯ: ' : k === 'urgent' ? 'Срочно: ' : 'Новая заявка: ') + title + ' (срок ' + ru(values.due_date) + ')']];
  if (k === 'emergency' && obj && obj.senior_user_id) notify.push([obj.senior_user_id, 'АВАРИЯ: ' + title]);
  return { values: values, event: 'Заявка создана · ' + SOURCES[source] + ' · срок ' + ru(values.due_date) + ' по срочности «' + u.l + '»' + note, notify: notify };
}

// ---------- действие ----------
// in: { v, v2, user_id, date, approval_id, approve } — что ввёл пользователь; ap — запрос на решение (для decide); now: Date
// Результат: { err, field } | { upd, events: [[kind, text]], notify: [[userId, text]], approval: {...} новый запрос | decided: {...} }
function apply(ctx, a, inp, cfg, now, ap) {
  const r = ctx.r, v = String((inp && inp.v) || '').trim(), v2 = String((inp && inp.v2) || '').trim(), nowIso = now.toISOString();
  if (actions(ctx).indexOf(a) === -1) return { err: 'Это действие вам недоступно', code: 403 };
  const out = { upd: null, events: [], notify: [] }, me = Number(ctx.me), resp = r.responsible_id;
  const st = function(upd, kind, text) { out.upd = Object.assign(out.upd || {}, upd); out.events.push([kind, text]); };
  if (a === 'take') { st({ status: 'in_work', taken_at: nowIso }, 'status', 'Взята в работу'); out.notify.push([r.author_id, 'Взята в работу: ' + r.title]); }
  if (a === 'wait') {
    if (!v) return { err: 'Выберите, чего ждём', field: 1 };
    st({ status: 'waiting', wait_reason: v, waiting_since: nowIso }, 'status', 'Ждём ' + v + (v === TENANT_WAIT ? ' — срок на паузе' : ''));
  }
  if (a === 'resume') {
    const upd = { status: 'in_work', wait_reason: null, waiting_since: null };
    let text = 'Снова в работе';
    if (r.wait_reason === TENANT_WAIT && r.waiting_since && r.due_date) {   // ждали арендатора — срок сдвигается на время ожидания
      const days = Math.floor((now - new Date(r.waiting_since)) / 864e5);
      if (days > 0) { const d = new Date(String(r.due_date).slice(0, 10) + 'T00:00:00'); d.setDate(d.getDate() + days); upd.due_date = iso(d); text += ' · срок сдвинут на ' + days + ' дн. (ждали арендатора): ' + ru(upd.due_date); }
    }
    st(upd, 'status', text);
  }
  if (a === 'to_dept') {
    if (!v) return { err: 'Выберите отдел', field: 1 };
    if (!v2) return { err: 'Напишите, что нужно от отдела', field: 2 };
    const days = Number(cfg && cfg.deptDays) >= 0 ? Number(cfg.deptDays) : DEF.deptDays;
    st({ status: 'dept', dept: v, dept_user_id: Number(inp.user_id) || null, dept_since: nowIso, dept_due: addWorkDays(now, days) }, 'dept', 'Передана в отдел «' + v + '» (срок отдела ' + ru(addWorkDays(now, days)) + '): ' + v2);
    if (Number(inp.user_id)) out.notify.push([Number(inp.user_id), 'Вам заявка из отдела «' + v + '»: ' + r.title]);
    out.notifyDept = v;
  }
  if (a === 'dept_back') {
    if (!v) return { err: 'Напишите, что сделал отдел', field: 1 };
    st({ status: 'in_work', dept: null, dept_user_id: null, dept_since: null, dept_due: null }, 'dept', 'Отдел «' + r.dept + '» вернул управляющему: ' + v);
    out.notify.push([resp, 'Отдел «' + r.dept + '» вернул заявку: ' + v]);
  }
  if (a === 'done') {
    if (!v) return { err: 'Напишите, что сделано', field: 1 };
    st({ status: 'done', result: v, done_at: nowIso, wait_reason: null, waiting_since: null }, 'status', 'Решена: ' + v);
    if (r.accept_mode === 'user') out.notify.push([r.accept_user_id, 'Решена, проверьте и примите: ' + r.title]);
    else out.notifyCtl = 'Решена, ждёт приёмки: ' + r.title;
  }
  if (a === 'accept') { st({ status: 'closed', closed_at: nowIso }, 'status', 'Работа принята, заявка закрыта'); out.notify.push([resp, 'Принята и закрыта: ' + r.title]); }
  if (a === 'reopen') {
    if (!v) return { err: 'Напишите, что не так', field: 1 };
    st({ status: 'in_work', done_at: null, reopen_count: (Number(r.reopen_count) || 0) + 1 }, 'status', 'Не принята, возвращена в работу: ' + v);
    out.notify.push([resp, 'Вернули в работу: ' + v]);
  }
  // перенос / передача / отмена: контролёр — сразу, ответственный — запрос на решение
  if (a === 'due' || a === 'ask_due') {
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(String(inp && inp.date || ''))) return { err: 'Укажите новый срок', field: 1 };
    if (!v2) return { err: 'Укажите причину переноса', field: 2 };
  }
  if ((a === 'assign' || a === 'ask_assign') && (!Number(inp && inp.user_id) || Number(inp.user_id) === Number(resp))) return { err: 'Выберите, кому передать', field: 1 };
  if ((a === 'assign' || a === 'ask_assign') && !v2) return { err: 'Укажите причину', field: 2 };
  if ((a === 'cancel' || a === 'ask_cancel') && !v2) return { err: 'Укажите причину отмены', field: 2 };
  if (a === 'due') Object.assign(out, change(r, 'due', { date: inp.date }, v2, null, nowIso));
  if (a === 'assign') Object.assign(out, change(r, 'assign', { user_id: Number(inp.user_id) }, v2, null, nowIso));
  if (a === 'cancel') Object.assign(out, change(r, 'cancel', {}, v2, null, nowIso));
  if (a.indexOf('ask_') === 0) {
    const kind = a.slice(4), payload = kind === 'due' ? { date: inp.date } : kind === 'assign' ? { user_id: Number(inp.user_id) } : {};
    out.approval = { request_id: r.id, kind: kind, payload: payload, reason: v2, status: 'pending', author_id: me };
    out.events.push(['ask', 'Запрос: ' + askText(kind, payload, ctx) + ' — ' + v2]);
    out.notifyCtl = 'Запрос на решение: ' + askText(kind, payload, ctx) + ' · ' + r.title;
  }
  if (a === 'decide') {
    if (!ap || ap.status !== 'pending' || Number(ap.request_id) !== Number(r.id)) return { err: 'Запрос уже решён', field: 1 };
    if (Number(ap.author_id) === me) return { err: 'Свой запрос решает другой руководитель', code: 403 };
    const yes = !!(inp && inp.approve);
    if (!yes && !v) return { err: 'Напишите, почему отказ', field: 1 };
    out.decided = { id: ap.id, status: yes ? 'approved' : 'rejected', decided_by: me, decided_at: nowIso, decision_note: v || null };
    if (yes) { const c = change(r, ap.kind, ap.payload || {}, ap.reason, v || 'одобрено', nowIso); out.upd = c.upd; out.events = c.events; out.notify = c.notify; }
    else out.events.push(['ask', 'Отказано: ' + askText(ap.kind, ap.payload || {}, ctx) + ' — ' + v]);
    out.notify.push([ap.author_id, (yes ? 'Одобрено: ' : 'Отказано: ') + askText(ap.kind, ap.payload || {}, ctx) + (v ? ' — ' + v : '')]);
  }
  if (a === 'reply') {
    if (!v) return { err: 'Напишите ответ арендатору', field: 1 };
    out.events.push(['comment', v, inp && inp.file_id ? Number(inp.file_id) : null, 'public']);
    out.mailTenant = v;
  }
  if (a === 'comment') {
    if (!v && !(inp && inp.file_id)) return { err: 'Напишите сообщение', field: 1 };
    out.events.push(['comment', v, inp && inp.file_id ? Number(inp.file_id) : null]);
    [resp, r.author_id].forEach(function(u) { if (u && Number(u) !== me) out.notify.push([u, 'Сообщение: ' + (v || 'файл').slice(0, 200)]); });
  }
  return out;
}
function askText(kind, p, ctx) {
  return kind === 'due' ? 'перенести срок на ' + ru(p.date) : kind === 'assign' ? 'передать другому (' + ((ctx && ctx.userName && ctx.userName(p.user_id)) || '#' + p.user_id) + ')' : 'отменить заявку';
}
// изменение, которое одобрили или сделал сам контролёр
function change(r, kind, p, reason, note, nowIso) {
  const extra = note ? ' (решение: ' + note + ')' : '';
  if (kind === 'due') return { upd: { due_date: p.date, due_moved: (Number(r.due_moved) || 0) + 1, reminded_on: null, escalated_at: null },
    events: [['due', 'Срок перенесён с ' + ru(r.due_date) + ' на ' + ru(p.date) + ': ' + reason + extra]], notify: [[r.responsible_id, 'Срок перенесён на ' + ru(p.date)]] };
  if (kind === 'assign') return { upd: { responsible_id: p.user_id, reminded_on: null, escalated_at: null },
    events: [['assign', 'Передана другому ответственному: ' + reason + extra]], notify: [[p.user_id, 'Вам передана заявка: ' + r.title + ' (срок ' + ru(r.due_date) + ')'], [r.responsible_id, 'Заявка передана другому: ' + r.title]] };
  return { upd: { status: 'cancelled', closed_at: nowIso, result: reason },
    events: [['status', 'Отменена: ' + reason + extra]], notify: [[r.responsible_id, 'Отменена: ' + r.title]] };
}

// ---------- портал арендатора ----------
// t: { contracts: [id договоров], email, name } — кто вошёл (по коду на почту из договора или по личной ссылке).
// Арендатор видит заявки своих договоров, которые принимает он сам (accept_mode = tenant), — свои с портала и записанные со звонка.
// Его события — видимость public (их показывает портал); внутренняя переписка сотрудников ему не видна.
function tenantSees(t, r) { return !!r && r.accept_mode === 'tenant' && (t.contracts || []).indexOf(Number(r.contract_id)) !== -1; }
function tenantActions(t, r) {
  if (!tenantSees(t, r)) return [];
  if (r.status === 'done') return ['accept', 'reopen', 'comment'];
  return OPEN.indexOf(r.status) !== -1 ? ['comment'] : [];
}
// contract — договор (rental_contracts), obj — его объект (contract_objects), kinds — допустимые типы
function tenantCreate(t, input, contract, obj, kinds, cfg, now) {
  const v = input || {};
  if (!contract || (t.contracts || []).indexOf(Number(contract.id)) === -1) return { err: 'Выберите договор', field: 'contract_id' };
  if (!v.kind || (kinds || []).indexOf(v.kind) === -1) return { err: 'Выберите тему заявки', field: 'kind' };
  if (!String(v.title || '').trim()) return { err: 'Коротко опишите проблему', field: 'title' };
  const k = DEF.urgency[v.urgency] ? v.urgency : 'normal', u = urg(cfg, k);
  const resp = Number(obj && obj.manager_user_id) || Number(obj && obj.senior_user_id) || null;
  const values = {
    object_name: contract.object_name, contract_id: Number(contract.id), tenant_label: contract.tenant_name || null, kind: v.kind, urgency: k,
    title: String(v.title).trim().slice(0, 250), description: String(v.description || '').trim().slice(0, 5000), status: 'new', source: 'portal',
    responsible_id: resp, author_id: null, accept_mode: 'tenant', accept_user_id: null,
    due_date: addWorkDays(now, u.d), react_due_at: new Date(now.getTime() + u.r * 3600e3).toISOString(), due_moved: 0, reopen_count: 0,
    contact_name: String(v.contact_name || '').trim().slice(0, 200) || null, contact_email: t.email || String(v.contact_email || '').trim().slice(0, 200) || null,
    contact_phone: String(v.contact_phone || '').trim().slice(0, 50) || null
  };
  const head = (k === 'emergency' ? 'АВАРИЯ с портала: ' : k === 'urgent' ? 'Срочно, с портала: ' : 'Заявка с портала: ') + values.title;
  const notify = resp ? [[resp, head + ' (срок ' + ru(values.due_date) + ')']] : [];
  if (k === 'emergency' && obj && obj.senior_user_id && Number(obj.senior_user_id) !== resp) notify.push([obj.senior_user_id, head]);
  return { values: values, event: 'Заявка подана арендатором на портале · срок ' + ru(values.due_date) + ' по срочности «' + u.l + '»' + (resp ? '' : ' · у объекта нет управляющего с учёткой'),
    notify: notify, notifyCtl: resp ? null : head + ' — некому назначить, назначьте ответственного' };
}
// in: { v, rating } ; результат как у apply: { err } | { upd, events: [[kind, text, file, visibility]], notify }
function tenantApply(t, r, a, inp, now) {
  if (tenantActions(t, r).indexOf(a) === -1) return { err: 'Это действие недоступно', code: 403 };
  const v = String((inp && inp.v) || '').trim().slice(0, 5000);   // автор событий арендатора — пустой (author_id null, видимость public)
  const out = { upd: null, events: [], notify: [] }, resp = r.responsible_id;
  if (a === 'comment') {   // файлы (фото) — отдельными событиями, их добавляет сервер
    const files = (inp && inp.file_ids || []).length;
    if (!v && !files) return { err: 'Напишите сообщение или приложите фото', field: 1 };
    if (v) out.events.push(['comment', v, null, 'public']);
    out.notify.push([resp, 'Арендатор пишет: ' + (v ? v.slice(0, 200) : 'приложил фото')]);
  }
  if (a === 'accept') {
    const rating = Math.round(Number(inp && inp.rating));
    out.upd = { status: 'closed', closed_at: now.toISOString() };
    if (rating >= 1 && rating <= 5) { out.upd.rating = rating; out.upd.rating_note = v || null; }
    out.events.push(['status', 'Работа принята, заявка закрыта' + (out.upd.rating ? ' · оценка ' + rating + ' из 5' : '') + (v ? ': ' + v : ''), null, 'public']);
    out.notify.push([resp, 'Арендатор принял работу' + (out.upd.rating ? ', оценка ' + rating + ' из 5' : '') + ': ' + r.title]);
  }
  if (a === 'reopen') {
    if (!v) return { err: 'Напишите, что не так', field: 1 };
    out.upd = { status: 'in_work', done_at: null, reopen_count: (Number(r.reopen_count) || 0) + 1 };
    out.events.push(['status', 'Работа не принята, возвращена в работу: ' + v, null, 'public']);
    out.notify.push([resp, 'Арендатор вернул в работу: ' + v.slice(0, 200)]);
  }
  out.notify = out.notify.filter(function(n) { return n[0]; });
  return out;
}

module.exports = { OPEN, SOURCES, TENANT_WAIT, DEF, addWorkDays, actions, create, apply, role, tenantSees, tenantActions, tenantCreate, tenantApply };
