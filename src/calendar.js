// Календарь сроков — один код на все дашборды (блоки calblock01/02/03 на «Дашборд», «Дашборд HR», «Дашборд АХО»; scripts/setup_calendar.py).
// Сам блок ничего не показывает: рисует календарь в «слот» <div data-crm-calendar></div>, который модуль оставляет на своём главном
// экране (dashboard.js, crm-hr.js, crm-aho.js) и после отрисовки зовёт window.__crmCalendarRender(). Ушли в раздел — слота нет,
// календаря нет; вернулись — календарь снова на месте.
// Сроки берутся из разделов через API с правами пользователя: нет доступа к разделу — его сроков просто нет.
// Какие разделы показывать по умолчанию — по странице (CAL_DEFAULTS), человек может включить/выключить, выбор запоминается.
const CAL_GROUPS = {
  contracts: { l: 'Договоры', c: '#1c2d58' }, requests: { l: 'Заявки', c: '#d46b08' }, tasks: { l: 'Задачи', c: '#13a8a8' },
  aho: { l: 'АХО', c: '#722ed1' }, hr: { l: 'Кадры', c: '#389e0d' }
};
const CAL_DEFAULTS = { '/admin/hrdash01': ['hr', 'tasks'], '/admin/ahodash01': ['aho', 'tasks', 'requests'] };   // остальные — все разделы
const CAL_AHEAD = 14;           // «Ближайшие»: на сколько дней вперёд (дальше — «Месяц»)
const CAL_DAY_MAX = 4;          // строк в дне, остальное — по клику «ещё N»
const CAL_REFRESH_MS = 5 * 60 * 1000;
const P_REG = '/admin/b5znz7yxpy3', P_REQ = '/admin/j3a32zo1jzo', P_TSK = '/admin/tskpage01', P_AHO = '/admin/ahodash01', P_HRD = '/admin/hrdash01', P_HR = '/admin/hrpage01';

function cEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function cIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function cToday() { return cIso(new Date()); }
function cAdd(iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return cIso(d); }
function cD(v) { return String(v || '').slice(0, 10); }
function cDM(iso) { return iso.slice(8, 10) + '.' + iso.slice(5, 7); }
function cDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
function cRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function cToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function cGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function cSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* не запомним — не страшно */ } }

const cal = { me: null, items: null, avail: {}, loadedAt: 0, view: cGet('crm-cal-view') || 'agenda', mine: cGet('crm-cal-mine') !== '0',
  groups: null, month: null, day: null, lateOpen: false, openDays: {} };
(function() {
  const saved = cGet('crm-cal-groups:' + location.pathname);
  cal.groups = saved ? saved.split(',').filter(function(g) { return CAL_GROUPS[g]; }) : (CAL_DEFAULTS[location.pathname] || Object.keys(CAL_GROUPS)).slice();
})();

// ---------- данные ----------
async function cList(coll, params) {
  try { return cRows(await ctx.api.resource(coll).list(Object.assign({ paginate: false }, params || {}))); } catch (e) { return null; }   // нет прав — раздела нет
}
async function cLoad() {
  const t = cToday();
  if (!cal.me) {
    try { cal.me = ((await (await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + cToken() } })).json()) || {}).data || {}; } catch (e) { cal.me = {}; }
  }
  const r = await Promise.all([
    cList('rental_contracts', { fields: ['id', 'tenant_name', 'object_name', 'termination_date'] }),
    cList('contract_price_periods', { fields: ['id', 'contract_ref_id', 'date_from'], filter: { contract_type: 'active' } }),
    cList('object_requests', { fields: ['id', 'title', 'object_name', 'due_date', 'status', 'responsible_id', 'author_id'], filter: { status: { $in: ['new', 'in_work', 'waiting'] } } }),
    cList('crm_tasks', { fields: ['id', 'title', 'due_date', 'status', 'executor_id', 'controller_id', 'author_id'], filter: { status: { $in: ['new', 'in_work', 'waiting'] } } }),
    cList('crm_aho_routines', { fields: ['id', 'title', 'next_on', 'period', 'active'] }),
    cList('crm_aho_subs', { fields: ['id', 'title', 'next_pay_on', 'amount', 'active'] }),
    cList('crm_aho_expenses', { fields: ['id', 'title', 'due_on', 'amount', 'status'], filter: { status: { $in: ['new', 'approval', 'approved'] } } }),
    cList('crm_aho_poa', { fields: ['id', 'to_whom', 'purpose', 'valid_until', 'status'] }),
    cList('crm_aho_fire', { fields: ['id', 'object_name', 'tenant', 'deadline_on', 'fixed_on'] }),
    cList('crm_aho_mail', { fields: ['id', 'subject', 'due_on', 'status'] }),
    cList('crm_aho_fines', { fields: ['id', 'amount', 'discount_until', 'paid_on'] }),
    cList('crm_employees', { fields: ['id', 'full_name', 'birthday', 'contract_until', 'status', 'employment_type'] }),
    cList('crm_vacations', { fields: ['id', 'employee_id', 'start_date', 'end_date', 'kind'] }),
    cList('crm_hr_events', { fields: ['id', 'title', 'event_date'] }),
    cList('crm_safety', { fields: ['id', 'employee_id', 'kind', 'area', 'next_on'] }),
    cList('crm_sout', { fields: ['id', 'workplace', 'next_on'] }),
    cList('crm_lna', { fields: ['id', 'title', 'review_on'] }),
    cList('crm_candidates', { fields: ['id', 'full_name', 'stage', 'interview_on', 'interview_time', 'start_on'] }),
    cList('crm_vacancies', { fields: ['id', 'title', 'due_on', 'status'] })
  ]);
  const [contracts, prices, reqs, tasks, routines, subs, exps, poa, fire, mail, fines, emps, vacs, events, safety, sout, lna, cands, vacancies] = r;
  const me = Number(cal.me.id), items = [], avail = {};
  const add = function(group, date, title, url, o) { if (date) items.push(Object.assign({ group: group, date: cD(date), title: title, url: url, canLate: true }, o || {})); };
  const empName = {}; (emps || []).forEach(function(e) { empName[e.id] = e.full_name; });
  const tenantOf = {}; (contracts || []).forEach(function(c) { tenantOf[c.id] = c.tenant_name || c.object_name; });

  if (contracts) { avail.contracts = 1; contracts.forEach(function(c) { add('contracts', c.termination_date, 'Расторжение: ' + (c.tenant_name || 'договор #' + c.id), P_REG + '?open=active:' + c.id, { sub: c.object_name, canLate: false }); }); }
  if (prices) prices.forEach(function(p) { add('contracts', p.date_from, 'Новая ставка' + (tenantOf[p.contract_ref_id] ? ': ' + tenantOf[p.contract_ref_id] : ''), P_REG + '?open=active:' + p.contract_ref_id, { canLate: false }); });
  if (reqs) { avail.requests = 1; reqs.forEach(function(x) { add('requests', x.due_date, 'Заявка №' + x.id + ': ' + (x.title || ''), P_REQ + '?open=req:' + x.id, { sub: x.object_name, mine: Number(x.responsible_id) === me || Number(x.author_id) === me }); }); }
  if (tasks) { avail.tasks = 1; tasks.forEach(function(x) { add('tasks', x.due_date, 'Задача №' + x.id + ': ' + (x.title || ''), P_TSK + '?open=task:' + x.id, { mine: [x.executor_id, x.controller_id, x.author_id].map(Number).indexOf(me) !== -1 }); }); }
  if (routines || exps || subs) avail.aho = 1;
  (routines || []).forEach(function(x) { if (x.active !== false && x.period !== 'daily') add('aho', x.next_on, x.title, P_AHO + '?open=routine:' + x.id, { sub: 'по регламенту' }); });
  (subs || []).forEach(function(x) { if (x.active !== false) add('aho', x.next_pay_on, 'Оплатить: ' + x.title, P_AHO + '?open=sub:' + x.id); });
  (exps || []).forEach(function(x) { add('aho', x.due_on, 'Счёт: ' + x.title, P_AHO + '?open=exp:' + x.id, { sub: 'оплатить до' }); });
  (poa || []).forEach(function(x) { if (x.status !== 'revoked') add('aho', x.valid_until, 'Кончается доверенность: ' + x.to_whom, P_AHO + '?open=poa:' + x.id, { sub: x.purpose }); });
  (fire || []).forEach(function(x) { if (!x.fixed_on) add('aho', x.deadline_on, 'Пожарка: ' + (x.tenant || ''), P_AHO + '?open=fire:' + x.id, { sub: x.object_name }); });
  (mail || []).forEach(function(x) { if (x.status !== 'done') add('aho', x.due_on, 'Ответ на письмо: ' + (x.subject || ''), P_AHO + '?open=mail:' + x.id); });
  (fines || []).forEach(function(x) { if (!x.paid_on) add('aho', x.discount_until, 'Штраф: скидка 50% до этого дня', P_AHO + '?open=fine:' + x.id, { canLate: false }); });
  if (vacs || safety || events) avail.hr = 1;
  (emps || []).forEach(function(e) {
    if (e.status === 'fired') return;
    if (e.birthday) {   // ближайший день рождения
      const y = Number(t.slice(0, 4)), md = cD(e.birthday).slice(5);
      let b = y + '-' + md; if (b < t) b = (y + 1) + '-' + md;
      add('hr', b, 'День рождения: ' + e.full_name, P_HR + '?open=emp:' + e.id, { canLate: false, soft: true });
    }
    if (e.contract_until && e.employment_type !== 'staff') add('hr', e.contract_until, 'Кончается договор: ' + e.full_name, P_HR + '?open=emp:' + e.id);
  });
  (vacs || []).forEach(function(v) { if (cD(v.start_date) >= t) add('hr', v.start_date, 'В отпуск: ' + (empName[v.employee_id] || 'сотрудник'), P_HRD + '?sec=vac', { sub: 'до ' + cDM(cD(v.end_date)), canLate: false }); });
  (events || []).forEach(function(x) { add('hr', x.event_date, 'Мероприятие: ' + x.title, P_HRD + '?sec=docs', { canLate: false }); });
  (safety || []).forEach(function(x) { add('hr', x.next_on, (x.kind || 'Обучение') + (empName[x.employee_id] ? ': ' + empName[x.employee_id] : ''), P_HRD + '?sec=safety', { sub: x.area }); });
  (sout || []).forEach(function(x) { add('hr', x.next_on, 'СОУТ: ' + x.workplace, P_HRD + '?sec=safety'); });
  (lna || []).forEach(function(x) { add('hr', x.review_on, 'Пересмотреть ЛНА: ' + x.title, P_HRD + '?sec=docs'); });
  (cands || []).forEach(function(x) {
    if (x.stage === 'interview') add('hr', x.interview_on, 'Собеседование: ' + x.full_name + (x.interview_time ? ' в ' + x.interview_time : ''), P_HRD + '?sec=hire', { canLate: false });
    if (x.stage === 'offer' || x.stage === 'hired') add('hr', x.start_on, 'Выход на работу: ' + x.full_name, P_HRD + '?sec=hire', { canLate: false });
  });
  (vacancies || []).forEach(function(x) { if (x.status === 'open') add('hr', x.due_on, 'Закрыть вакансию: ' + x.title, P_HRD + '?sec=hire'); });

  items.forEach(function(x) { x.late = x.canLate && x.date < t; });
  cal.items = items.filter(function(x) { return x.late || x.date >= t; });
  cal.avail = avail;
  cal.loadedAt = Date.now();
}

// ---------- отрисовка ----------
function cVisible() {
  return cal.items.filter(function(x) { return cal.groups.indexOf(x.group) !== -1 && cal.avail[x.group] && (!cal.mine || x.mine !== false); });
}
function cItem(x, withDate) {
  const g = CAL_GROUPS[x.group];
  return '<div class="cal-it' + (x.late ? ' late' : '') + '" data-url="' + cEsc(x.url) + '" style="--c:' + g.c + ';">'
    + (withDate ? '<span class="cal-d">' + cDM(x.date) + '</span>' : '') + '<span class="cal-t">' + cEsc(x.title) + '</span>'
    + (x.sub ? '<span class="cal-s">' + cEsc(x.sub) + '</span>' : '') + '</div>';
}
function cDayTitle(iso) {
  const n = cDays(cToday(), iso);
  const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][new Date(iso + 'T00:00:00').getDay()];
  return n === 0 ? 'Сегодня' : n === 1 ? 'Завтра' : wd + ', ' + cDM(iso);
}
function cByDate(list) {
  const by = {};
  list.forEach(function(x) { (by[x.date] = by[x.date] || []).push(x); });
  return by;
}
function cAgenda(list) {
  const t = cToday(), until = cAdd(t, CAL_AHEAD);
  const late = list.filter(function(x) { return x.late; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  const by = cByDate(list.filter(function(x) { return !x.late && x.date <= until; }));
  const days = Object.keys(by).sort();
  return (late.length ? '<div class="cal-late"><button class="cal-late-h" data-act="late">⚠ Просрочено: ' + late.length + ' <span>' + (cal.lateOpen ? 'скрыть' : 'показать') + '</span></button>'
      + (cal.lateOpen ? late.map(function(x) { return cItem(x, true); }).join('') : '') + '</div>' : '')
    + (days.length ? '<div class="cal-days">' + days.map(function(d) {
        const its = by[d], all = cal.openDays[d] || its.length <= CAL_DAY_MAX + 1;
        return '<div class="cal-day"><div class="cal-day-h">' + cDayTitle(d) + '</div>' + (all ? its : its.slice(0, CAL_DAY_MAX)).map(function(x) { return cItem(x, false); }).join('')
          + (all ? '' : '<button class="cal-more-b" data-act="dayall" data-d="' + d + '">ещё ' + (its.length - CAL_DAY_MAX) + '</button>') + '</div>';
      }).join('') + '</div>'
      : '<div class="cal-empty">В ближайшие ' + CAL_AHEAD + ' дней сроков нет</div>');
}
function cMonth(list) {
  const t = cToday(), m = cal.month || t.slice(0, 7);
  const first = new Date(m + '-01T00:00:00'), shift = (first.getDay() + 6) % 7;
  const start = cAdd(m + '-01', -shift);
  const by = cByDate(list.filter(function(x) { return !x.late; }));
  const name = first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = cAdd(start, i), its = by[d] || [];
    if (i === 35 && d.slice(0, 7) !== m) break;   // шестая неделя целиком из следующего месяца — не рисуем
    cells += '<div class="cal-cell' + (d.slice(0, 7) !== m ? ' out' : '') + (d === t ? ' today' : '') + (d === cal.day ? ' sel' : '') + '" data-day="' + d + '"><div class="cal-n">' + Number(d.slice(8)) + '</div>'
      + its.slice(0, 3).map(function(x) { return '<div class="cal-dot" style="--c:' + CAL_GROUPS[x.group].c + ';">' + cEsc(x.title) + '</div>'; }).join('')
      + (its.length > 3 ? '<div class="cal-more">ещё ' + (its.length - 3) + '</div>' : '') + '</div>';
  }
  const sel = cal.day && by[cal.day] ? '<div class="cal-day" style="margin-top:10px;"><div class="cal-day-h">' + cDayTitle(cal.day) + '</div>' + by[cal.day].map(function(x) { return cItem(x, false); }).join('') + '</div>' : '';
  return '<div class="cal-mh"><button data-act="mprev">‹</button><b>' + name.charAt(0).toUpperCase() + name.slice(1) + '</b><button data-act="mnext">›</button>' + (m !== t.slice(0, 7) ? '<button data-act="mnow" class="cal-link">сегодня</button>' : '') + '</div>'
    + '<div class="cal-grid">' + ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(function(w) { return '<div class="cal-wd">' + w + '</div>'; }).join('') + cells + '</div>' + sel;
}
function cRender(slot) {
  if (!cal.items) { slot.innerHTML = '<div class="cal"><div class="cal-empty">Загрузка календаря…</div></div>'; return; }
  const list = cVisible(), avail = Object.keys(CAL_GROUPS).filter(function(g) { return cal.avail[g]; });
  slot.innerHTML = '<div class="cal"><div class="cal-head"><div class="cal-title">Календарь сроков</div>'
    + '<div class="cal-chips">' + avail.map(function(g) {
        const on = cal.groups.indexOf(g) !== -1;
        return '<button class="cal-chip' + (on ? ' on' : '') + '" data-group="' + g + '" style="--c:' + CAL_GROUPS[g].c + ';">' + CAL_GROUPS[g].l + '</button>';
      }).join('') + '</div>'
    + ((cal.avail.tasks || cal.avail.requests) ? '<label class="cal-mine"><input type="checkbox" data-act="mine"' + (cal.mine ? ' checked' : '') + '> только мои задачи и заявки</label>' : '')
    + '<div class="cal-seg">' + [['agenda', 'Ближайшие'], ['month', 'Месяц']].map(function(v) { return '<button data-v="' + v[0] + '"' + (cal.view === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>'; }).join('') + '</div></div>'
    + (cal.view === 'month' ? cMonth(list) : cAgenda(list)) + '</div>';
}
function cWire(slot) {
  slot.addEventListener('click', function(e) {
    const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
    const it = c('[data-url]');
    if (it) { location.href = it.getAttribute('data-url'); return; }
    const g = c('[data-group]');
    if (g) {
      const k = g.getAttribute('data-group'), i = cal.groups.indexOf(k);
      if (i === -1) cal.groups.push(k); else cal.groups.splice(i, 1);
      cSet('crm-cal-groups:' + location.pathname, cal.groups.join(','));
      return cRenderAll();
    }
    const v = c('[data-v]');
    if (v) { cal.view = v.getAttribute('data-v'); cSet('crm-cal-view', cal.view); return cRenderAll(); }
    const day = c('[data-day]');
    if (day) { cal.day = cal.day === day.getAttribute('data-day') ? null : day.getAttribute('data-day'); return cRenderAll(); }
    const a = c('[data-act]'), act = a && a.getAttribute('data-act');
    if (act === 'dayall') { cal.openDays[a.getAttribute('data-d')] = true; return cRenderAll(); }
    if (act === 'late') { cal.lateOpen = !cal.lateOpen; return cRenderAll(); }
    if (act === 'mprev' || act === 'mnext') {
      const d = new Date((cal.month || cToday().slice(0, 7)) + '-01T00:00:00'); d.setMonth(d.getMonth() + (act === 'mnext' ? 1 : -1));
      cal.month = cIso(d).slice(0, 7); cal.day = null; return cRenderAll();
    }
    if (act === 'mnow') { cal.month = null; cal.day = null; return cRenderAll(); }
  });
  slot.addEventListener('change', function(e) {
    if (e.target.getAttribute('data-act') === 'mine') { cal.mine = e.target.checked; cSet('crm-cal-mine', cal.mine ? '1' : '0'); cRenderAll(); }
  });
}
function cRenderAll() {
  document.querySelectorAll('[data-crm-calendar]').forEach(function(slot) {
    if (!slot.__calWired) { slot.__calWired = true; cWire(slot); }
    cRender(slot);
  });
}

// ---------- запуск ----------
if (!document.getElementById('crm-cal-style')) {
  const st = document.createElement('style');
  st.id = 'crm-cal-style';
  st.textContent = `
    .cal { border:1px solid #f0f0f0; border-radius:10px; background:#fff; padding:14px 16px; margin-top:16px; color:#1f1f1f; font-size:13.5px; }
    .cal-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    .cal-title { font-size:16px; font-weight:700; margin-right:4px; }
    .cal-chips { display:flex; gap:6px; flex-wrap:wrap; }
    .cal-chip { border:1px solid #d9d9d9; background:#fff; border-radius:14px; padding:3px 11px; font:inherit; font-size:12.5px; cursor:pointer; color:#8c8c8c; }
    .cal-chip.on { border-color:var(--c); color:var(--c); background:#fff; font-weight:600; box-shadow:inset 0 0 0 1px var(--c); }
    .cal-mine { font-size:12.5px; color:#595959; display:flex; align-items:center; gap:5px; cursor:pointer; }
    .cal-seg { margin-left:auto; display:flex; gap:2px; background:#f5f5f5; border-radius:6px; padding:2px; }
    .cal-seg button { border:none; background:transparent; padding:4px 12px; border-radius:5px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    .cal-seg button.on { background:#fff; color:#1f1f1f; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
    .cal-days { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:4px 20px; align-items:start; }
    .cal-day { margin-bottom:10px; min-width:0; }
    .cal-more-b { border:none; background:none; color:#1c2d58; font:inherit; font-size:12.5px; cursor:pointer; padding:2px 10px; text-decoration:underline; }
    .cal-day-h { font-size:12px; font-weight:600; color:#8c8c8c; text-transform:uppercase; letter-spacing:.03em; margin-bottom:4px; }
    .cal-it { display:flex; align-items:baseline; gap:8px; padding:5px 8px 5px 10px; border-left:3px solid var(--c); border-radius:4px; cursor:pointer; margin-bottom:3px; background:#fafafa; }
    .cal-it:hover { background:#eef1f8; }
    .cal-it.late .cal-t { color:#cf1322; }
    .cal-d { font-variant-numeric:tabular-nums; color:#cf1322; font-size:12px; min-width:38px; }
    .cal-t { font-weight:500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .cal-s { color:#8c8c8c; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cal-late { margin-bottom:12px; }
    .cal-late-h { border:1px solid #ffccc7; background:#fff1f0; color:#cf1322; border-radius:6px; padding:5px 12px; font:inherit; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:6px; }
    .cal-late-h span { font-weight:400; text-decoration:underline; margin-left:6px; }
    .cal-empty { color:#bfbfbf; padding:16px 0; text-align:center; }
    .cal-mh { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .cal-mh button { border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:2px 10px; font:inherit; cursor:pointer; }
    .cal-mh .cal-link { border:none; color:#1c2d58; text-decoration:underline; }
    .cal-grid { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); border-top:1px solid #f0f0f0; border-left:1px solid #f0f0f0; }
    .cal-wd { font-size:11.5px; color:#8c8c8c; padding:4px 6px; border-right:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; background:#fafafa; }
    .cal-cell { min-height:78px; padding:3px 4px; border-right:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; cursor:pointer; min-width:0; }
    .cal-cell:hover { background:#f5faff; }
    .cal-cell.out { background:#fcfcfc; color:#bfbfbf; }
    .cal-cell.sel { background:#eef1f8; }
    .cal-cell.today .cal-n { background:#1c2d58; color:#fff; border-radius:10px; padding:0 6px; display:inline-block; }
    .cal-n { font-size:12px; font-weight:600; margin-bottom:2px; }
    .cal-dot { font-size:11px; line-height:15px; border-left:3px solid var(--c); padding-left:4px; margin-bottom:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#434343; }
    .cal-more { font-size:11px; color:#8c8c8c; }
    @media (max-width: 700px) {
      .cal-seg { margin-left:0; }
      .cal-cell { min-height:44px; }
      .cal-dot { display:none; }
      .cal-cell .cal-n::after { content:''; }
    }
  `;
  document.head.appendChild(st);
}
// сам блок пустой — прячем его карточку, календарь живёт в слотах модулей
ctx.render('');
try { const card = ctx.element && ctx.element.closest && ctx.element.closest('.ant-card'); if (card) card.style.display = 'none'; } catch (e) { /* не страшно */ }

// модуль перерисовал главный экран — он зовёт этот хук, и календарь снова рисуется в новом слоте (данные уже в памяти;
// старше CAL_REFRESH_MS — подгружаются заново). MutationObserver в песочнице блоков недоступен, поэтому хук явный.
window.__crmCalendarRender = function() {
  if (cal.items && Date.now() - cal.loadedAt > CAL_REFRESH_MS) cLoad().then(cRenderAll).catch(function() { /* покажем старое */ });
  cRenderAll();
};
cRenderAll();
cLoad().then(cRenderAll).catch(function() {
  document.querySelectorAll('[data-crm-calendar]').forEach(function(s) { s.innerHTML = '<div class="cal"><div class="cal-empty" style="color:#cf1322;">Не удалось загрузить календарь</div></div>'; });
});
