// «Главная» (/admin/dashpage01), вкладка «Сводка» (блок ceoblock01): один экран руководителя — всё по всем модулям.
// Ничего своего не хранит: читает те же коллекции, что модули (права те же; нет прав на коллекцию — раздел пустой, остальное работает).
// Сверху — «Требует внимания» (всё просроченное и горящее из всех модулей), ниже — разделы с цифрами, загрузка людей и ближайшие 14 дней.
// Числа точные (правило владельца): счёт штук и суммы в копейках, без средних и процентов-оценок. Клик — переход в модуль.
// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
// @include src/_crm-calls.js
// @include src/_crm-profile.js
// @include src/_crm-mobile.js
if (!document.getElementById('ceo-style')) {
  const st = document.createElement('style');
  st.id = 'ceo-style';
  st.textContent = `
    #ceo { padding:4px 0 16px; color:#1f2433; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    #ceo .c-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
    #ceo .c-title { font-size:19px; font-weight:700; color:#1f2433; }
    #ceo .c-sub { font-size:12.5px; color:#3a4256; }
    #ceo .c-btn { border:1px solid #c3cad8; background:#fff; color:#1f2433; border-radius:6px; padding:3px 10px; font-size:12.5px; cursor:pointer; font-family:inherit; }
    #ceo .c-btn:hover { border-color:#1c2d58; color:#1c2d58; }
    #ceo .c-alerts { border:1px solid #e7b9b9; background:#f9e6e6; border-radius:8px; padding:10px 14px; margin-bottom:14px; }
    #ceo .c-alerts.ok { border-color:#b9d9c5; background:#e5f1ea; color:#2f7d4f; font-weight:600; }
    #ceo .c-alerts-t { font-size:14px; font-weight:700; color:#c23b3b; margin-bottom:8px; }
    #ceo .c-al { display:flex; flex-wrap:wrap; gap:6px; }
    #ceo .c-chip { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:12px; font-size:13px; border:1px solid; background:#fff; white-space:nowrap; }
    #ceo .c-chip b { font-variant-numeric:tabular-nums; }
    #ceo [data-go] { cursor:pointer; }
    #ceo .c-chip[data-go]:hover { filter:brightness(.9); text-decoration:underline; }
    #ceo .c-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(380px, 1fr)); gap:12px; }
    #ceo .c-card { border:1px solid #dfe3ec; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; }
    #ceo .c-card-t { font-size:15px; font-weight:700; color:#1f2433; margin-bottom:10px; display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
    #ceo .c-card-t a { font-size:12.5px; font-weight:500; color:#1c2d58; cursor:pointer; }
    #ceo .c-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px; }
    #ceo .c-tile { border:1px solid #dfe3ec; border-radius:6px; padding:8px 10px; background:#f3f5f9; min-width:0; }
    #ceo .c-tile[data-go]:hover { border-color:#1c2d58; }
    #ceo .c-tile b { display:block; font-size:21px; line-height:1.2; font-variant-numeric:tabular-nums; color:#1f2433; }
    #ceo .c-tile b.m { font-size:15px; white-space:nowrap; }
    #ceo .c-tile span { font-size:12px; color:#3a4256; font-weight:600; }
    #ceo .c-tile i { display:block; font-style:normal; font-size:11.5px; color:#3a4256; margin-top:2px; }
    #ceo .c-bad b, #ceo b.c-bad { color:#c23b3b; } #ceo .c-warn b { color:#8a5a00; } #ceo .c-ok b { color:#2f7d4f; }
    #ceo .c-tile.zero { opacity:.5; }
    #ceo .c-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:10px; }
    #ceo .c-list { margin-top:10px; }
    #ceo .c-row { display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-top:1px solid #dfe3ec; font-size:13px; }
    #ceo .c-row > :first-child { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #ceo .c-row > :last-child { flex-shrink:0; font-variant-numeric:tabular-nums; color:#3a4256; }
    #ceo .c-row[data-go]:hover { color:#1c2d58; background:#e9edf5; }
    #ceo .c-empty { font-size:12.5px; color:#5b6478; padding:4px 0; }
    #ceo .c-wide { grid-column:1 / -1; }
    #ceo table.c-t { width:100%; border-collapse:collapse; font-size:13.5px; color:#1f2433; }
    #ceo .c-t th { text-align:left; font-weight:600; font-size:12.5px; color:#1f2433; background:#e9edf5; border-bottom:2px solid #c3cad8; padding:7px 10px; white-space:nowrap; }
    #ceo .c-t td { padding:7px 10px; border-bottom:1px solid #dfe3ec; font-weight:500; font-variant-numeric:tabular-nums; }
    #ceo .c-t .n { text-align:right; }
    #ceo .c-t tbody tr:nth-child(even) td { background:#f3f5f9; }
    #ceo .c-t tbody tr:hover td { background:#eef2f9; }
    #ceo .c-tag { display:inline-block; padding:0 7px; border-radius:9px; font-size:11.5px; border:1px solid; margin-right:6px; }
    @media (max-width: 700px) { #ceo .c-grid { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(st);
}

const CEO_URL = {
  registry: '/admin/b5znz7yxpy3', requests: '/admin/j3a32zo1jzo', tasks: '/admin/tskpage01', staff: '/admin/hrpage01',
  hr: '/admin/dashpage01/tab/hometabhr01', aho: '/admin/dashpage01/tab/hometabaho1', company: '/admin/dashpage01/tab/dashtabs01', calendar: '/admin/calpage01'
};
const CEO_OPEN = ['new', 'in_work', 'waiting'];   // заявки/задачи «в работе»; done = выполнено, ждёт проверки автора
const RQ_ST = cfg('requests.status'), TK_ST = cfg('tasks.status'), AHO_EXP = cfg('aho.expStatus');
const ceo = { data: null, loading: null };

function cEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function cKop(v) { const n = Number(v); return v === null || v === undefined || v === '' || !isFinite(n) ? null : Math.round(n * 100); }
function cMoney(kop) { return (kop / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'; }
function cDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null; }
function cToday() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
function cDays(v) { const d = v instanceof Date ? v : cDate(v); return d ? Math.round((d.getTime() - cToday().getTime()) / 86400000) : null; }
function cDd(d) { return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2); }
function cIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function cNoun(n, one, few, many) { const a = Math.abs(n) % 100, b = a % 10; return (a > 10 && a < 20) ? many : b === 1 ? one : (b >= 2 && b <= 4) ? few : many; }
function cWhen(n) { return n === 0 ? 'сегодня' : n === 1 ? 'завтра' : n < 0 ? 'просрочено ' + (-n) + ' ' + cNoun(-n, 'день', 'дня', 'дней') : 'через ' + n + ' ' + cNoun(n, 'день', 'дня', 'дней'); }

async function cList(coll, extra) {
  try {
    const res = await ctx.api.resource(coll).list(Object.assign({ paginate: false }, extra || {}));
    const rows = (res && res.data && res.data.data) || (res && res.data) || [];
    return Array.isArray(rows) ? rows : [];
  } catch (e) { return []; }   // нет прав или коллекции — раздел просто пустой
}
async function ceoLoad() {
  const today = cIso(cToday());
  const k = ['active', 'forming', 'drafts', 'completed', 'requests', 'tasks', 'users', 'emps', 'vacations', 'safety', 'vacancies', 'candidates', 'events',
    'exp', 'subs', 'routines', 'poa', 'fire', 'mail', 'fines', 'cards', 'skud'];
  const v = await Promise.all([
    cList('rental_contracts'), cList('forming_contracts'), cList('draft_contracts', { fields: ['id'] }), cList('completed_contracts', { fields: ['id'] }),
    cList('object_requests'), cList('crm_tasks'), cList('users', { fields: ['id', 'nickname', 'username'] }),
    cList('crm_employees'), cList('crm_vacations'), cList('crm_safety'), cList('crm_vacancies'), cList('crm_candidates', { fields: ['id', 'stage', 'interview_on', 'full_name'] }),
    cList('crm_hr_events'), cList('crm_aho_expenses'), cList('crm_aho_subs'), cList('crm_aho_routines'), cList('crm_aho_poa'), cList('crm_aho_fire'),
    cList('crm_aho_mail'), cList('crm_aho_fines'), cList('crm_skud_cards'), cList('crm_skud_events', { filter: { day: today }, fields: ['card'] })
  ]);
  const d = {};
  k.forEach(function(x, i) { d[x] = v[i]; });
  return d;
}

// ---------- расчёт ----------
function ceoWork(rows, nameOf) {   // заявки или задачи: открытые, просроченные, проверка, итоги 30 дней, по людям
  const from30 = new Date(cToday().getTime() - 30 * 86400000);
  const s = { open: [], overdue: [], review: 0, hot: [], closed30: 0, onTime30: 0, by: {} };
  rows.forEach(function(r) {
    const open = CEO_OPEN.indexOf(r.status) !== -1, dd = cDays(r.due_date);
    if (r.status === 'done') s.review++;
    if (open) {
      s.open.push(r);
      if (dd !== null && dd < 0) s.overdue.push(r);
      if (r.urgency === 'emergency' || r.urgency === 'asap') s.hot.push(r);
      const who = nameOf(r) || 'Не назначен', b = s.by[who] || (s.by[who] = { open: 0, overdue: 0 });
      b.open++; if (dd !== null && dd < 0) b.overdue++;
    }
    const fin = r.done_at ? new Date(r.done_at) : r.closed_at ? new Date(r.closed_at) : null;
    if (fin && fin >= from30 && (r.status === 'done' || r.status === 'closed')) {
      s.closed30++;
      const due = cDate(r.due_date);
      if (!due || fin.getTime() < due.getTime() + 86400000) s.onTime30++;
    }
  });
  s.overdue.sort(function(a, b) { return String(a.due_date).localeCompare(String(b.due_date)); });
  return s;
}
function ceoCalc(d) {
  const today = cToday(), t0 = today.getTime();
  const userName = {};
  d.users.forEach(function(u) { userName[u.id] = u.nickname || u.username; });
  const c = { d: d };
  // договоры
  c.rentKop = 0; c.utilKop = 0; c.status = {}; c.ending = []; c.noPrice = 0;
  d.active.forEach(function(r) {
    const a = cKop(r.rent_amount), u = cKop(r.utility_amount);
    if (a !== null) c.rentKop += a; if (u !== null) c.utilKop += u;
    if (a === null && u === null) c.noPrice++;
    c.status[r.contract_status || ''] = (c.status[r.contract_status || ''] || 0) + 1;
    const n = cDays(r.termination_date);
    if (n !== null && n <= 90) c.ending.push({ r: r, n: n });
  });
  c.ending.sort(function(a, b) { return a.n - b.n; });
  // заявки и задачи
  c.rq = ceoWork(d.requests.filter(function(r) { return !r.demo; }), function(r) { return userName[r.responsible_id]; });
  c.tk = ceoWork(d.tasks, function(r) { return r.executor_name || userName[r.executor_id]; });
  // люди
  const emps = d.emps.filter(function(e) { return e.status !== 'fired'; });
  const empName = {};
  d.emps.forEach(function(e) { empName[e.id] = e.full_name; });
  c.emps = emps;
  c.byType = {};
  emps.forEach(function(e) { const k = e.employment_type || 'staff'; c.byType[k] = (c.byType[k] || 0) + 1; });
  const in30 = function(v) { const n = cDays(v); return n !== null && n >= -30 && n <= 0; };
  c.hired30 = d.emps.filter(function(e) { return in30(e.hired_on); }).length;
  c.fired30 = d.emps.filter(function(e) { return in30(e.fired_on); }).length;
  const activeIds = {};
  emps.forEach(function(e) { activeIds[e.id] = true; });
  c.onVac = d.vacations.filter(function(v) { const a = cDays(v.start_date), b = cDays(v.end_date); return activeIds[v.employee_id] && a !== null && b !== null && a <= 0 && b >= 0; })
    .map(function(v) { return { name: empName[v.employee_id], kind: v.kind, end: cDate(v.end_date) }; });
  c.safetyOver = d.safety.filter(function(x) { const n = cDays(x.next_on); return activeIds[x.employee_id] && n !== null && n < 0; });
  c.contractEnd = emps.filter(function(e) { const n = cDays(e.contract_until); return n !== null && n <= 30; });
  c.vacOpen = d.vacancies.filter(function(v) { return v.status === 'open'; });
  c.vacOver = c.vacOpen.filter(function(v) { const n = cDays(v.due_on); return n !== null && n < 0; });
  c.cands = d.candidates.filter(function(x) { return ['new', 'interview', 'offer'].indexOf(x.stage) !== -1; });
  // СКУД: пришли сегодня = есть проход по карте сотрудника
  const cardEmp = {};
  d.cards.forEach(function(x) { if (!x.ignore && x.employee_id && activeIds[x.employee_id]) cardEmp[x.card] = x.employee_id; });
  const came = {};
  d.skud.forEach(function(x) { if (cardEmp[x.card]) came[cardEmp[x.card]] = true; });
  c.cameN = Object.keys(came).length;
  c.withCard = Object.keys(Object.values(cardEmp).reduce(function(o, id) { o[id] = 1; return o; }, {})).length;
  // АХО
  const expSum = function(list) { return list.reduce(function(a, x) { return a + (cKop(x.amount) || 0); }, 0); };
  c.expApproval = d.exp.filter(function(x) { return x.status === 'approval'; });
  c.expToPay = d.exp.filter(function(x) { return x.status === 'approved'; });
  c.expOver = d.exp.filter(function(x) { const n = cDays(x.due_on); return ['new', 'approval', 'approved'].indexOf(x.status) !== -1 && n !== null && n < 0; });
  c.expSum = expSum;
  c.subs30 = d.subs.filter(function(x) { const n = cDays(x.next_pay_on); return x.active !== false && n !== null && n <= 30; });
  c.routOver = d.routines.filter(function(x) { const n = cDays(x.next_on); return x.active !== false && n !== null && n < 0; });
  c.poaEnd = d.poa.filter(function(x) { const n = cDays(x.valid_until); return x.status !== 'revoked' && n !== null && n <= 30; });
  c.fireOpen = d.fire.filter(function(x) { return x.status !== 'fixed'; });
  c.fireOver = c.fireOpen.filter(function(x) { const n = cDays(x.deadline_on); return n !== null && n < 0; });
  c.mailOver = d.mail.filter(function(x) { const n = cDays(x.due_on); return x.status !== 'done' && x.status !== 'answered' && n !== null && n < 0; });
  c.finesOpen = d.fines.filter(function(x) { return !x.paid_on; });
  // ближайшие 14 дней — из всех модулей, по дате
  const ev = [];
  const add = function(date, text, color, go) { const n = cDays(date); if (n !== null && n >= 0 && n <= 14) ev.push({ n: n, d: date instanceof Date ? date : cDate(date), text: text, color: color, go: go }); };
  emps.forEach(function(e) {
    const b = cDate(e.birthday);
    if (!b) return;
    let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
    if (next.getTime() < t0) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
    add(next, '🎂 День рождения: ' + e.full_name, '#c41d7f', CEO_URL.staff + '?open=emp:' + e.id);
  });
  d.vacations.forEach(function(v) { if (activeIds[v.employee_id]) add(v.start_date, 'Отпуск: ' + (empName[v.employee_id] || '') + ' до ' + (cDate(v.end_date) ? cDd(cDate(v.end_date)) : '?'), '#13a8a8', CEO_URL.hr + '?sec=vac'); });
  d.events.forEach(function(x) { add(x.event_date, 'Мероприятие: ' + x.title, '#722ed1', CEO_URL.hr + '?sec=docs'); });
  d.candidates.forEach(function(x) { if (x.stage === 'interview') add(x.interview_on, 'Собеседование: ' + x.full_name, '#2f4a8a', CEO_URL.hr + '?sec=hire'); });
  d.active.forEach(function(r) { add(r.termination_date, 'Расторжение: ' + (r.contract_number || '') + ' ' + (r.tenant_name || r.object_name || ''), '#722ed1', CEO_URL.registry + '?open=active:' + r.id); });
  d.subs.forEach(function(x) { if (x.active !== false) add(x.next_pay_on, 'Платёж: ' + x.title + (cKop(x.amount) !== null ? ' — ' + cMoney(cKop(x.amount)) : ''), '#8a5a00', CEO_URL.aho + '?sec=money'); });
  d.exp.forEach(function(x) { if (['new', 'approval', 'approved'].indexOf(x.status) !== -1) add(x.due_on, 'Оплатить счёт: ' + x.title + (cKop(x.amount) !== null ? ' — ' + cMoney(cKop(x.amount)) : ''), '#8a5a00', CEO_URL.aho + '?open=exp:' + x.id); });
  d.poa.forEach(function(x) { if (x.status !== 'revoked') add(x.valid_until, 'Истекает доверенность №' + (x.number || '') + ' ' + (x.to_whom || ''), '#1c2d58', CEO_URL.aho + '?sec=poa'); });
  c.fireOpen.forEach(function(x) { add(x.deadline_on, 'Срок пожарного требования: ' + (x.object_name || '') + ' ' + (x.tenant || ''), '#c23b3b', CEO_URL.aho + '?sec=fire'); });
  d.routines.forEach(function(x) { if (x.active !== false) add(x.next_on, 'Регулярное дело: ' + x.title, '#3a4256', CEO_URL.aho + '?sec=routines'); });
  d.safety.forEach(function(x) { if (activeIds[x.employee_id]) add(x.next_on, 'Охрана труда: ' + (empName[x.employee_id] || '') + ' — ' + (x.kind || x.area || ''), '#8a5a00', CEO_URL.hr + '?sec=safety'); });
  c.events = ev.sort(function(a, b) { return a.n - b.n; });
  return c;
}

// ---------- вывод ----------
function cTile(label, value, note, cls, go) {
  return '<div class="c-tile' + (cls ? ' ' + cls : '') + '"' + (go ? ' data-go="' + cEsc(go) + '"' : '') + '><span>' + cEsc(label) + '</span><b' + (String(value).length > 8 ? ' class="m"' : '') + '>' + value + '</b>' + (note ? '<i>' + note + '</i>' : '') + '</div>';
}
function cChip(text, color, num, go) {
  return '<span class="c-chip"' + (go ? ' data-go="' + cEsc(go) + '"' : '') + ' style="color:' + color + ';border-color:' + color + '55;">' + (num !== undefined ? '<b>' + num + '</b>' : '') + cEsc(text) + '</span>';
}
function cCard(title, link, body, wide) {
  return '<div class="c-card' + (wide ? ' c-wide' : '') + '"><div class="c-card-t">' + title + (link ? '<a data-go="' + cEsc(link) + '">открыть →</a>' : '') + '</div>' + body + '</div>';
}
function cRows(items, max) {
  if (!items.length) return '';
  return '<div class="c-list">' + items.slice(0, max).map(function(x) { return '<div class="c-row"' + (x.go ? ' data-go="' + cEsc(x.go) + '"' : '') + '><span>' + x.l + '</span><span>' + x.r + '</span></div>'; }).join('')
    + (items.length > max ? '<div class="c-empty">и ещё ' + (items.length - max) + '</div>' : '') + '</div>';
}
function ceoAlerts(c) {
  const a = [];
  const p = function(n, text, go) { if (n) a.push(cChip(' ' + text, '#c23b3b', n, go)); };
  p(c.rq.hot.length, 'аварийных заявок открыто', CEO_URL.requests);
  p(c.rq.overdue.length, 'заявок просрочено', CEO_URL.requests);
  p(c.tk.overdue.length, 'задач просрочено', CEO_URL.tasks);
  p(c.status['1_problem'] || 0, 'договоров с проблемой', CEO_URL.registry + '?status=1_problem');
  p(c.ending.filter(function(x) { return x.n < 0; }).length, 'договоров: дата расторжения прошла, а договор в активных', CEO_URL.registry + '?status=2_terminating');
  p(c.expOver.length, 'счетов АХО просрочено к оплате', CEO_URL.aho + '?sec=money');
  p(c.fireOver.length, 'пожарных требований просрочено', CEO_URL.aho + '?sec=fire');
  p(c.safetyOver.length, 'просрочено по охране труда', CEO_URL.hr + '?sec=safety');
  p(c.routOver.length, 'регулярных дел АХО просрочено', CEO_URL.aho + '?sec=routines');
  p(c.mailOver.length, 'писем без ответа в срок', CEO_URL.aho + '?sec=mail');
  p(c.vacOver.length, 'вакансий не закрыто в срок', CEO_URL.hr + '?sec=hire');
  p(c.poaEnd.filter(function(x) { return cDays(x.valid_until) < 0; }).length, 'доверенностей истекло, не отозваны', CEO_URL.aho + '?sec=poa');
  p(c.contractEnd.filter(function(e) { return cDays(e.contract_until) < 0; }).length, 'трудовых договоров истекло', CEO_URL.hr + '?sec=staff');
  p(c.finesOpen.length, 'штрафов не оплачено', CEO_URL.aho + '?sec=cars');
  if (c.expApproval.length) a.push(cChip(' счетов ждут согласования — ' + cMoney(c.expSum(c.expApproval)), '#8a5a00', c.expApproval.length, CEO_URL.aho + '?sec=money'));
  return a.length ? '<div class="c-alerts"><div class="c-alerts-t">Требует внимания</div><div class="c-al">' + a.join('') + '</div></div>'
    : '<div class="c-alerts ok">Всё в порядке: просроченного и горящего нет</div>';
}
function ceoWorkCard(title, s, st, url, openKey) {
  const ot = s.closed30 ? s.onTime30 + ' из ' + s.closed30 : '—';
  const chips = Object.keys(st).filter(function(k) { return CEO_OPEN.indexOf(k) !== -1 || k === 'done'; }).map(function(k) {
    const n = k === 'done' ? s.review : s.open.filter(function(r) { return r.status === k; }).length;
    return n ? cChip(' ' + st[k].l, st[k].c, n, url) : '';
  }).join('');
  return cCard(title, url,
    '<div class="c-tiles">' + cTile('Открыто', s.open.length, 'аварийных / горящих: ' + s.hot.length, s.hot.length ? 'c-warn' : '', url)
    + cTile('Просрочено', s.overdue.length, '', s.overdue.length ? 'c-bad' : 'c-ok zero', url)
    + cTile('На проверке', s.review, 'выполнено, ждёт автора', s.review ? 'c-warn' : 'zero', url)
    + cTile('В срок за 30 дней', ot, 'выполнено вовремя', '', url) + '</div>'
    + (chips ? '<div class="c-chips">' + chips + '</div>' : '')
    + cRows(s.overdue.map(function(r) { return { l: cEsc(r.title || r.object_name || '#' + r.id) + (r.object_name && r.title ? ' <span class="c-sub">· ' + cEsc(r.object_name) + '</span>' : ''), r: '<span class="c-bad">' + cWhen(cDays(r.due_date)) + '</span>', go: url + '?open=' + openKey + ':' + r.id }; }), 6));
}
function ceoRender() {
  const root = ceoRoot(), c = ceo.data;
  if (!root || !c) return;
  const d = c.d, now = new Date();
  const head = '<div class="c-head"><div class="c-title">Сводка руководителя</div><div class="c-sub">' + now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    + ', данные на ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2) + '</div><button class="c-btn" data-act="refresh">↻ Обновить</button></div>';
  // договоры и деньги
  const stChips = [['1_problem', 'Проблема', '#c23b3b'], ['2_terminating', 'На расторжении', '#722ed1'], ['2_docs', 'Не хватает документов', '#1c2d58'], ['2_attention', 'Требует внимания', '#8a5a00'], ['3_ok', 'В порядке', '#2f7d4f']]
    .map(function(x) { return c.status[x[0]] ? cChip(' ' + x[1], x[2], c.status[x[0]], CEO_URL.registry + '?status=' + x[0]) : ''; }).join('');
  const contracts = cCard('Аренда и договоры', CEO_URL.company,
    '<div class="c-tiles">' + cTile('Доход в месяц', cMoney(c.rentKop + c.utilKop), 'аренда ' + cMoney(c.rentKop) + '<br>сбор ' + cMoney(c.utilKop), '', CEO_URL.company)
    + cTile('Действуют', d.active.length, c.noPrice ? '<span class="c-bad">без цены: ' + c.noPrice + '</span>' : 'все с ценой', '', CEO_URL.registry)
    + cTile('Оформляются', d.forming.length, 'черновиков: ' + d.drafts.length, '', CEO_URL.registry)
    + cTile('Расторжение ≤ 90 дн.', c.ending.length, 'в архиве всего: ' + d.completed.length, c.ending.length ? 'c-warn' : 'zero', CEO_URL.registry + '?status=2_terminating') + '</div>'
    + (stChips ? '<div class="c-chips">' + stChips + '</div>' : '')
    + cRows(c.ending.map(function(x) { return { l: cEsc((x.r.contract_number || '') + ' · ' + (x.r.tenant_name || '') + ' · ' + (x.r.object_name || '')), r: (x.n < 0 ? '<span class="c-bad">' : '<span>') + cDd(cDate(x.r.termination_date)) + ', ' + cWhen(x.n).replace('просрочено', 'прошло') + '</span>', go: CEO_URL.registry + '?open=active:' + x.r.id }; }), 5));
  // люди
  const types = cfg('hr.empType');
  const people = cCard('Люди', CEO_URL.hr,
    '<div class="c-tiles">' + cTile('Работают', c.emps.length, Object.keys(c.byType).map(function(k) { return (types[k] || k).toLowerCase() + ': ' + c.byType[k]; }).join('<br>'), '', CEO_URL.staff)
    + cTile('Пришли сегодня', c.withCard ? c.cameN + ' из ' + c.withCard : '—', 'по пропускам СКУД', '', CEO_URL.aho + '?sec=att')
    + cTile('В отпуске', c.onVac.length, 'сейчас', c.onVac.length ? '' : 'zero', CEO_URL.hr + '?sec=vac')
    + cTile('За 30 дней', '+' + c.hired30 + ' / −' + c.fired30, 'принято / уволено', '', CEO_URL.staff)
    + cTile('Вакансии', c.vacOpen.length, 'кандидатов в работе: ' + c.cands.length, c.vacOpen.length ? '' : 'zero', CEO_URL.hr + '?sec=hire')
    + cTile('Охрана труда', c.safetyOver.length, 'просрочено', c.safetyOver.length ? 'c-bad' : 'c-ok zero', CEO_URL.hr + '?sec=safety') + '</div>'
    + cRows(c.onVac.map(function(v) { return { l: cEsc(v.name) + ' <span class="c-sub">· ' + cEsc(v.kind || 'отпуск') + '</span>', r: v.end ? 'до ' + cDd(v.end) : '', go: CEO_URL.hr + '?sec=vac' }; })
      .concat(c.contractEnd.map(function(e) { return { l: 'Срочный трудовой договор: ' + cEsc(e.full_name), r: '<span class="c-warn">' + cWhen(cDays(e.contract_until)) + '</span>', go: CEO_URL.staff + '?open=emp:' + e.id }; })), 6));
  // АХО
  const aho = cCard('Хозяйство и расходы (АХО)', CEO_URL.aho,
    '<div class="c-tiles">' + cTile('На согласовании', c.expApproval.length, cMoney(c.expSum(c.expApproval)), c.expApproval.length ? 'c-warn' : 'zero', CEO_URL.aho + '?sec=money')
    + cTile('Согласовано, не оплачено', c.expToPay.length, cMoney(c.expSum(c.expToPay)), c.expToPay.length ? '' : 'zero', CEO_URL.aho + '?sec=money')
    + cTile('Регулярные платежи ≤ 30 дн.', c.subs30.length, cMoney(c.expSum(c.subs30)), c.subs30.length ? '' : 'zero', CEO_URL.aho + '?sec=money')
    + cTile('Пожарные требования', c.fireOpen.length, 'не устранено' + (c.fireOver.length ? ', <span class="c-bad">просрочено ' + c.fireOver.length + '</span>' : ''), c.fireOpen.length ? '' : 'zero', CEO_URL.aho + '?sec=fire')
    + cTile('Доверенности ≤ 30 дн.', c.poaEnd.length, 'истекают', c.poaEnd.length ? 'c-warn' : 'zero', CEO_URL.aho + '?sec=poa')
    + cTile('Штрафы', c.finesOpen.length, 'не оплачено ' + cMoney(c.expSum(c.finesOpen)), c.finesOpen.length ? 'c-bad' : 'zero', CEO_URL.aho + '?sec=cars') + '</div>'
    + cRows(c.expApproval.map(function(x) { return { l: cEsc(x.title || x.supplier || 'Счёт') + (x.supplier && x.title ? ' <span class="c-sub">· ' + cEsc(x.supplier) + '</span>' : ''), r: cKop(x.amount) !== null ? cMoney(cKop(x.amount)) : '', go: CEO_URL.aho + '?open=exp:' + x.id }; }), 5));
  // загрузка людей: задачи + заявки
  const names = {};
  [c.tk.by, c.rq.by].forEach(function(o) { Object.keys(o).forEach(function(k) { names[k] = 1; }); });
  const load = Object.keys(names).map(function(n) { const t = c.tk.by[n] || {}, r = c.rq.by[n] || {}; return { n: n, to: t.open || 0, tv: t.overdue || 0, ro: r.open || 0, rv: r.overdue || 0 }; })
    .sort(function(a, b) { return (b.tv + b.rv) - (a.tv + a.rv) || (b.to + b.ro) - (a.to + a.ro); });
  const bad = function(n) { return n ? '<b class="c-bad">' + n + '</b>' : '0'; };
  const loadCard = cCard('Загрузка людей <span class="c-sub" style="font-weight:400;">открытые задачи и заявки</span>', '',
    load.length ? '<div style="overflow-x:auto;"><table class="c-t"><thead><tr><th>Сотрудник</th><th class="n">Задач</th><th class="n">из них просрочено</th><th class="n">Заявок</th><th class="n">из них просрочено</th></tr></thead><tbody>'
      + load.map(function(x) { return '<tr><td>' + cEsc(x.n) + '</td><td class="n">' + x.to + '</td><td class="n">' + bad(x.tv) + '</td><td class="n">' + x.ro + '</td><td class="n">' + bad(x.rv) + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<div class="c-empty">Открытых задач и заявок нет</div>', true);
  const evCard = cCard('Ближайшие 14 дней', CEO_URL.calendar,
    c.events.length ? cRows(c.events.map(function(x) { return { l: '<span class="c-tag" style="color:' + x.color + ';border-color:' + x.color + '55;">' + cDd(x.d) + '</span>' + cEsc(x.text), r: cWhen(x.n), go: x.go }; }), 25)
      : '<div class="c-empty">Ничего не запланировано</div>');
  // разделы по отделам — сетка сама раскладывает карточки, поэтому новый отдел = своя cCard(...) строкой в этом списке
  // (+ его «красные» счётчики в ceoAlerts, сроки — в «Ближайшие 14 дней» через add() в ceoCalc). Общие «Ближайшие» и «Загрузка» — всегда последними.
  const depts = [
    contracts,
    ceoWorkCard('Заявки по объектам', c.rq, RQ_ST, CEO_URL.requests, 'req'),
    ceoWorkCard('Задачи', c.tk, TK_ST, CEO_URL.tasks, 'task'),
    people,
    aho
  ];
  root.innerHTML = head + ceoAlerts(c) + '<div class="c-grid">' + depts.join('') + evCard + loadCard + '</div>';
}

ctx.render('<div id="ceo"><div class="c-empty">Загрузка…</div></div>');
function ceoRoot() { return (ctx.element && ctx.element.querySelector('#ceo')) || document.getElementById('ceo'); }
async function ceoRefresh() {
  if (ceo.loading) return ceo.loading;
  ceo.loading = ceoLoad().then(function(d) { ceo.data = ceoCalc(d); ceoRender(); })
    .catch(function(e) { console.error(e); ceoRoot().innerHTML = '<div class="c-bad" style="padding:8px 0;color:#c23b3b;">Не удалось загрузить сводку. Обновите страницу.</div>'; })
    .then(function() { ceo.loading = null; });
  return ceo.loading;
}
ceoRoot().addEventListener('click', function(e) {
  const t = e.target.closest ? e.target : null;
  if (!t) return;
  if (t.closest('[data-act="refresh"]')) { ceoRefresh(); return; }
  const go = t.closest('[data-go]');
  if (go) window.location.href = go.getAttribute('data-go');
});
ceoRefresh();
