// «Тестовая страница» (/admin/j3a32zo1jzo, блок crmblock002): задачи и кадры — перенос из Pyrus. Тестовый контур CRM;
// коллекции — scripts/setup_crm_tasks.py, данные из Pyrus — scripts/import_pyrus.py (перенесённые задачи помечены «Pyrus»,
// у них ссылка на задачу в Pyrus и вся переписка). Процесс задачи как у заявок: Новая → В работе → Ждёт → Выполнена
// (на проверке у ответственного/автора) → Закрыта, + Отменена. Уведомления — очередь task_notifications → колокольчик.
// Вкладки: Задачи · Сотрудники (карточка: данные, задачи, кадровые задачи) · Оргструктура · Статистика.
if (!document.getElementById('crm-ui-style')) {
  const st = document.createElement('style');
  st.id = 'crm-ui-style';
  st.textContent = `
    .crm-ui { color:#1f1f1f; font-size:14px; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    .crm-ui .rq-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    .crm-ui .rq-title { font-size:18px; font-weight:700; margin-right:6px; }
    .crm-ui .rq-tabs { display:flex; gap:4px; background:#f5f5f5; border-radius:8px; padding:3px; flex-wrap:wrap; }
    .crm-ui .rq-tab { border:none; background:transparent; padding:5px 12px; border-radius:6px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    .crm-ui .rq-tab.on { background:#fff; color:#1f1f1f; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
    .crm-ui .rq-new { margin-left:auto; border:none; background:#1677ff; color:#fff; border-radius:6px; padding:8px 16px; font:inherit; font-size:13.5px; font-weight:600; cursor:pointer; }
    .crm-ui .rq-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
    .crm-ui .rq-chip { border:1px solid #d9d9d9; background:#fff; border-radius:14px; padding:3px 12px; font:inherit; font-size:13px; cursor:pointer; color:#434343; }
    .crm-ui .rq-chip b { font-variant-numeric:tabular-nums; margin-left:4px; }
    .crm-ui .rq-chip.on { border-color:#1677ff; background:#e6f4ff; color:#0958d9; font-weight:600; }
    .crm-ui .rq-chip.bad b { color:#cf1322; }
    .crm-ui .rq-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
    .crm-ui select, .crm-ui input[type=text], .crm-ui input[type=date], .crm-ui textarea, .rq-modal select, .rq-modal input[type=text], .rq-modal input[type=date], .rq-modal textarea {
      border:1px solid #d9d9d9; border-radius:6px; padding:6px 10px; font:inherit; font-size:13.5px; background:#fff; color:#262626; box-sizing:border-box; }
    .crm-ui .rq-filters select, .crm-ui .rq-filters input[type=text] { min-width:150px; }
    .crm-ui .rq-list { display:flex; flex-direction:column; gap:8px; }
    .crm-ui .rq-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; border:1px solid #f0f0f0; border-left:4px solid var(--c); border-radius:8px; padding:10px 14px; background:#fff; cursor:pointer; }
    .crm-ui .rq-row:hover { border-color:#91caff; border-left-color:var(--c); }
    .crm-ui .rq-row-title { font-weight:600; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .crm-ui .rq-row-sub { font-size:12.5px; color:#8c8c8c; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .crm-ui .rq-row-side { text-align:right; font-size:12.5px; white-space:nowrap; }
    .rq-pill { display:inline-block; padding:1px 8px; border-radius:10px; font-size:12px; font-weight:600; border:1px solid; white-space:nowrap; }
    .rq-late { color:#cf1322; font-weight:600; }
    .crm-ui .rq-empty { color:#bfbfbf; padding:24px 0; text-align:center; }
    .crm-ui .rq-more { display:block; margin:10px auto 0; }
    .crm-ui .rq-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
    .crm-ui .rq-tile { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; }
    .crm-ui .rq-tile-l { font-size:12px; color:#8c8c8c; }
    .crm-ui .rq-tile-v { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px; }
    .crm-ui .rq-tile-n { font-size:12px; color:#8c8c8c; margin-top:2px; }
    .crm-ui .rq-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(480px, 1fr)); gap:12px; }
    .crm-ui .rq-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; overflow-x:auto; }
    .crm-ui .rq-card-t { font-weight:600; margin-bottom:8px; }
    .crm-ui table, .rq-modal table { width:100%; border-collapse:collapse; font-size:13px; }
    .crm-ui th, .rq-modal th { text-align:left; font-weight:600; color:#595959; padding:6px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    .crm-ui td, .rq-modal td { padding:6px 8px; border-bottom:1px solid #f5f5f5; font-variant-numeric:tabular-nums; }
    .crm-ui th.n, .crm-ui td.n { text-align:right; }
    .crm-ui tr[data-go], .crm-ui tr[data-emp], .rq-modal tr[data-task] { cursor:pointer; }
    .crm-ui tr[data-go]:hover td, .crm-ui tr[data-emp]:hover td, .rq-modal tr[data-task]:hover td { background:#f5faff; }
    .crm-ui .tk-dept { margin-top:14px; }
    .crm-ui .tk-dept-h { display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; font-weight:600; padding:6px 0; border-bottom:2px solid #f0f0f0; }
    .crm-ui .tk-dept-h span { font-weight:400; color:#8c8c8c; font-size:12.5px; }
    .crm-ui .tk-org { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:12px; }
    .crm-ui .tk-org .rq-card ul { margin:6px 0 0; padding-left:18px; color:#434343; font-size:13px; }
    .tk-src { color:#8c8c8c; border-color:#d9d9d9; margin-right:6px; }
    .tk-off { color:#bfbfbf; }
    .rq-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
    .rq-box { background:#fff; border-radius:10px; width:100%; max-width:780px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f1f1f; }
    .rq-box-h { display:flex; align-items:flex-start; gap:10px; padding:16px 20px; border-bottom:1px solid #f0f0f0; }
    .rq-box-t { font-size:17px; font-weight:700; flex:1; min-width:0; }
    .rq-x { border:none; background:transparent; font-size:18px; color:#8c8c8c; cursor:pointer; padding:2px 6px; }
    .rq-box-b { padding:16px 20px 20px; }
    .rq-form { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px 16px; }
    .rq-form .full { grid-column:1 / -1; }
    .rq-f label { display:block; font-size:12.5px; color:#595959; margin-bottom:4px; }
    .rq-f select, .rq-f input, .rq-f textarea { width:100%; }
    .rq-f textarea { min-height:70px; resize:vertical; }
    .rq-hint { font-size:12px; color:#8c8c8c; margin-top:3px; }
    .rq-seg { display:flex; gap:6px; flex-wrap:wrap; }
    .rq-seg button { flex:1; border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:7px 8px; font:inherit; font-size:13px; cursor:pointer; }
    .rq-seg button.on { border-color:var(--c); background:var(--c); color:#fff; font-weight:600; }
    .rq-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
    .rq-btn { border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:7px 14px; font:inherit; font-size:13.5px; cursor:pointer; color:#262626; }
    .rq-btn.pri { border-color:#1677ff; background:#1677ff; color:#fff; font-weight:600; }
    .rq-btn.ok { border-color:#389e0d; background:#389e0d; color:#fff; font-weight:600; }
    .rq-btn.warn { color:#cf1322; border-color:#ffccc7; }
    .rq-btn:disabled { opacity:.5; cursor:default; }
    .rq-meta { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px 16px; font-size:13.5px; }
    .rq-meta .l { font-size:12px; color:#8c8c8c; }
    .rq-desc { white-space:pre-wrap; background:#fafafa; border-radius:6px; padding:10px 12px; margin-top:12px; font-size:13.5px; }
    .rq-actbox { margin-top:12px; padding:12px; border:1px solid #e6f4ff; background:#f5faff; border-radius:8px; }
    .rq-tl { margin-top:18px; border-top:1px solid #f0f0f0; padding-top:12px; }
    .rq-ev { display:flex; gap:10px; padding:7px 0; font-size:13px; }
    .rq-ev-d { color:#8c8c8c; font-size:12px; white-space:nowrap; min-width:92px; }
    .rq-ev.sys { color:#8c8c8c; }
    .rq-ev-t { white-space:pre-wrap; }
    .rq-ev a { color:#1677ff; cursor:pointer; }
    .rq-comment { display:flex; gap:8px; margin-top:10px; align-items:flex-start; }
    .rq-comment textarea { flex:1; min-height:38px; resize:vertical; }
    .rq-sec { font-weight:600; margin:18px 0 6px; }
    @media (max-width: 700px) {
      .crm-ui .rq-new { margin-left:0; width:100%; padding:11px; font-size:15px; }
      .crm-ui .rq-filters select, .crm-ui .rq-filters input[type=text] { flex:1 1 45%; min-width:0; }
      .crm-ui .rq-row { grid-template-columns:1fr; }
      .crm-ui .rq-row-side { text-align:left; }
      .crm-ui .rq-grid2 { grid-template-columns:1fr; }
      .crm-ui .tk-hide-m { display:none; }
      .rq-modal { padding:0; }
      .rq-box { border-radius:0; min-height:100%; max-width:none; }
      .rq-form, .rq-meta { grid-template-columns:1fr; }
      .rq-btn { flex:1 1 45%; padding:10px; }
      .rq-comment { flex-wrap:wrap; }
      .rq-comment textarea { flex:1 1 100%; min-height:60px; }
      .rq-comment .rq-btn { flex:1 1 auto; }
    }
  `;
  document.head.appendChild(st);
}

const TK_PAGE = '/admin/j3a32zo1jzo';   // «Тестовая страница» — тестовый контур CRM
const TK_ST = {
  new: { l: 'Новая', c: '#1677ff' }, in_work: { l: 'В работе', c: '#d48806' }, waiting: { l: 'Ждёт', c: '#722ed1' },
  done: { l: 'Выполнена — на проверке', c: '#13a8a8' }, closed: { l: 'Закрыта', c: '#389e0d' }, cancelled: { l: 'Отменена', c: '#8c8c8c' }
};
const TK_OPEN = ['new', 'in_work', 'waiting'];
const TK_URG = { normal: { l: 'Не срочно', d: 3, c: '#595959' }, urgent: { l: 'Срочно', d: 1, c: '#d46b08' }, asap: { l: 'Ещё вчера!', d: 0, c: '#cf1322' } };
const TK_KINDS = ['Объект и арендаторы', 'Кадры', 'Финансы и платежи', 'Документы', 'Общая'];
const TK_WAIT = ['ответа коллеги', 'ответа арендатора', 'подрядчика', 'оплаты', 'согласования руководства', 'документов', 'другое'];
const TK_EMP_ST = { active: 'Работает', vacation: 'В отпуске', fired: 'Уволен' };
const TK_HR_TPL = ['Отпуск', 'Больничный', 'Приём на работу', 'Увольнение', 'Перевод / смена должности', 'Командировка', 'Отгул'];
const tk = { data: null, me: null, tab: 'list', quick: 'mine', exec: '', kind: '', obj: '', src: '', q: '', limit: 60, dept: '', sq: '', fired: false };

function tkEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function tkToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function tkRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function tkIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function tkToday() { return tkIso(new Date()); }
function tkDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function tkDateTime(v) { if (!v) return ''; const d = new Date(v); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + String(d.getFullYear()).slice(2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function tkDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
// ponytail: только выходные, праздники не учитываются — производственный календарь, если сроки начнут спорить
function tkAddWorkDays(n) {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) i++; }
  return tkIso(d);
}
function tkUserName(id) { const u = tk.data && tk.data.users[id]; return u ? (u.nickname || u.username) : null; }
// человек в задаче: учётка NocoBase, иначе имя из Pyrus
// единый вид «Фамилия Имя»: для учётки — ФИО из справочника сотрудников, иначе имя из Pyrus, иначе ник учётки
function tkWho(id, name) {
  if (id) { const e = tkEmpOfUser(id); if (e && e.full_name) return e.full_name; }
  return name || tkUserName(id) || (id ? '#' + id : '—');
}
function tkExecKey(t) { return t.executor_id ? 'u' + t.executor_id : t.executor_name ? 'n' + t.executor_name : ''; }
function tkIsAdmin() { return !!(tk.me && tk.me.__isAdmin); }
function tkIsOpen(t) { return TK_OPEN.indexOf(t.status) !== -1; }
function tkLate(t) { return tkIsOpen(t) && t.due_date && String(t.due_date).slice(0, 10) < tkToday(); }
function tkPill(s) { const x = TK_ST[s] || { l: s, c: '#8c8c8c' }; return '<span class="rq-pill" style="color:' + x.c + ';border-color:' + x.c + '55;background:' + x.c + '10;">' + tkEsc(x.l) + '</span>'; }
function tkMedian(a) { if (!a.length) return null; const s = a.slice().sort(function(x, y) { return x - y; }); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function tkMine(t) { const me = tk.me.id; return Number(t.executor_id) === me || Number(t.controller_id) === me || Number(t.author_id) === me; }
function tkEmp(id) { return (tk.data.emps || []).find(function(e) { return e.id === Number(id); }) || null; }
function tkEmpOfUser(uid) { return (tk.data.emps || []).find(function(e) { return Number(e.user_id) === Number(uid); }) || null; }
// задачи сотрудника: по учётке или по имени из Pyrus («Фамилия Имя»)
function tkEmpTasks(e) {
  return tk.data.tasks.filter(function(t) {
    return (e.user_id && Number(t.executor_id) === Number(e.user_id)) || (t.executor_name && t.executor_name === e.full_name) || Number(t.employee_id) === e.id;
  });
}

async function tkMe() {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + tkToken() } });
  const u = ((await res.json()) || {}).data || null;
  if (u) { const n = (u.roles || []).map(function(r) { return r.name; }); u.__isAdmin = n.indexOf('admin') !== -1 || n.indexOf('root') !== -1; }
  return u;
}
async function tkLoad() {
  const all = await Promise.all([
    ctx.api.resource('crm_tasks').list({ paginate: false, sort: ['-id'] }),
    ctx.api.resource('users').list({ paginate: false, fields: ['id', 'nickname', 'username'] }),
    ctx.api.resource('contract_objects').list({ paginate: false, sort: ['name'], fields: ['id', 'name'] }),
    ctx.api.resource('rental_contracts').list({ paginate: false, fields: ['id', 'contract_number', 'tenant_name', 'object_name'] }).catch(function() { return null; }),
    ctx.api.resource('crm_employees').list({ paginate: false, sort: ['last_name', 'first_name'] }),
    ctx.api.resource('crm_departments').list({ paginate: false, sort: ['sort', 'name'] })
  ]);
  const users = {};
  tkRows(all[1]).forEach(function(u) { if (u.username !== 'mail-service' && u.username !== 'nocobase') users[u.id] = u; });
  tk.data = { tasks: tkRows(all[0]), users: users, objects: tkRows(all[2]), contracts: tkRows(all[3]), emps: tkRows(all[4]), depts: tkRows(all[5]) };
}
function tkNotify(userId, title, text, taskId) {
  if (!userId || (tk.me && Number(userId) === Number(tk.me.id))) return;
  ctx.api.resource('task_notifications').create({ values: { user_id: Number(userId), title: title, text: text, url: TK_PAGE + '?open=task:' + taskId } }).catch(function() { /* уведомление не должно ломать действие */ });
}
function tkEvent(taskId, kind, text, fileId) {
  return ctx.api.resource('crm_task_events').create({ values: { task_id: taskId, author_id: tk.me.id, kind: kind, text: text || '', file_id: fileId || null } });
}
async function tkUpload(file) {
  const boundary = '----tkBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + tkToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const id = (((await res.json()) || {}).data || {}).id;
  if (!id) throw new Error('upload');
  return id;
}
function tkToast(t) {
  const el = document.createElement('div');
  el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1100;max-width:90vw;';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2800);
}
function tkModal(html) {
  const m = document.createElement('div');
  m.className = 'rq-modal';
  m.innerHTML = '<div class="rq-box">' + html + '</div>';
  m.addEventListener('click', function(e) { if (e.target === m || (e.target.closest && e.target.closest('.rq-x'))) m.remove(); });
  document.body.appendChild(m);
  return m;
}
function tkUserOptions(sel) {
  return Object.keys(tk.data.users).map(Number).sort(function(a, b) { return tkWho(a).localeCompare(tkWho(b), 'ru'); })
    .map(function(id) { return '<option value="' + id + '"' + (Number(sel) === id ? ' selected' : '') + '>' + tkEsc(tkWho(id)) + '</option>'; }).join('');
}
// исполнитель — любой работающий сотрудник; у кого есть учётка — value "u<id>", без учётки — "e<id сотрудника>"
function tkPeopleOptions(selKey) {
  const seen = {}, out = [];
  tk.data.emps.filter(function(e) { return e.status !== 'fired'; }).forEach(function(e) {
    const k = e.user_id ? 'u' + e.user_id : 'e' + e.id;
    if (e.user_id) seen[e.user_id] = 1;
    out.push([k, (e.full_name || '') + (e.user_id ? '' : ' (без учётки)')]);
  });
  Object.keys(tk.data.users).forEach(function(id) { if (!seen[id]) out.push(['u' + id, tkWho(Number(id))]); });
  return out.sort(function(a, b) { return a[1].localeCompare(b[1], 'ru'); })
    .map(function(x) { return '<option value="' + x[0] + '"' + (x[0] === selKey ? ' selected' : '') + '>' + tkEsc(x[1]) + '</option>'; }).join('');
}
function tkPersonFromKey(k) {
  if (!k) return { id: null, name: null };
  if (k[0] === 'u') { const id = Number(k.slice(1)); return { id: id, name: tkWho(id) }; }
  const e = tkEmp(Number(k.slice(1)));
  return { id: e && e.user_id ? Number(e.user_id) : null, name: e ? e.full_name : null };
}
function tkKeyOf(id, name) {
  if (id) return 'u' + id;
  const e = (tk.data.emps || []).find(function(x) { return x.full_name === name; });
  return e ? (e.user_id ? 'u' + e.user_id : 'e' + e.id) : '';
}

// ---------- каркас ----------
ctx.render('<div id="crm-tasks" class="crm-ui"><div class="rq-empty">Загрузка…</div></div>');
function tkRoot() { return (ctx.element && ctx.element.querySelector('#crm-tasks')) || document.getElementById('crm-tasks'); }
function tkBody() { return tkRoot().querySelector('[data-tk-body]'); }
async function tkStart() {
  try {
    tk.me = await tkMe();
    await tkLoad();
    if (!tk.data.tasks.some(tkMine)) tk.quick = 'open';
    tkRender();
    const m = location.search.match(/[?&]open=(task|emp):(\d+)/);
    if (m) {
      if (m[1] === 'task') tkOpenCard(Number(m[2])); else tkOpenEmp(Number(m[2]));
      try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ }
    }
  } catch (e) {
    tkRoot().innerHTML = '<div class="rq-empty" style="color:#cf1322;">Не удалось загрузить задачи</div>';
  }
}
async function tkReload() { await tkLoad(); tkRender(); }
tkRoot().addEventListener('click', tkOnClick);
tkRoot().addEventListener('change', tkOnChange);
tkRoot().addEventListener('input', function(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'q') { tk.q = e.target.value; tk.limit = 60; tkRenderList(); }
  if (f === 'sq') { tk.sq = e.target.value; tkRenderStaffList(); }
});
tkStart();

function tkRender() {
  const tabs = [['list', 'Задачи'], ['staff', 'Сотрудники'], ['org', 'Оргструктура'], ['stats', 'Статистика']];
  tkRoot().innerHTML = '<div class="rq-head"><div class="rq-title">Задачи и сотрудники</div><div class="rq-tabs">'
    + tabs.map(function(t) { return '<button class="rq-tab' + (tk.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('')
    + '</div><button class="rq-new" data-act="new">+ Новая задача</button></div><div data-tk-body></div>';
  if (tk.tab === 'list') tkRenderListShell();
  else if (tk.tab === 'staff') tkRenderStaff();
  else if (tk.tab === 'org') tkRenderOrg();
  else tkRenderStats();
}

// ---------- список задач ----------
const TK_QUICK = [
  ['mine', 'Мои', function(t) { return (tkIsOpen(t) || t.status === 'done') && tkMine(t); }],
  ['open', 'Открытые', tkIsOpen],
  ['late', 'Просроченные', tkLate],
  ['check', 'На проверке', function(t) { return t.status === 'done'; }],
  ['closed', 'Закрытые', function(t) { return t.status === 'closed' || t.status === 'cancelled'; }],
  ['all', 'Все', function() { return true; }]
];
function tkRenderListShell() {
  const d = tk.data, execs = {};
  d.tasks.forEach(function(t) { const k = tkExecKey(t); if (k) execs[k] = tkWho(t.executor_id, t.executor_name); });
  const ek = Object.keys(execs).sort(function(a, b) { return execs[a].localeCompare(execs[b], 'ru'); });
  tkBody().innerHTML = '<div class="rq-chips" data-tk-chips></div><div class="rq-filters">'
    + '<select data-f="exec"><option value="">Все исполнители</option>' + ek.map(function(k) { return '<option value="' + tkEsc(k) + '"' + (tk.exec === k ? ' selected' : '') + '>' + tkEsc(execs[k]) + '</option>'; }).join('') + '</select>'
    + '<select data-f="kind"><option value="">Все типы</option>' + TK_KINDS.map(function(k) { return '<option' + (tk.kind === k ? ' selected' : '') + '>' + tkEsc(k) + '</option>'; }).join('') + '</select>'
    + '<select data-f="obj"><option value="">Все объекты</option><option value="-"' + (tk.obj === '-' ? ' selected' : '') + '>— без объекта —</option>' + d.objects.map(function(o) { return '<option' + (tk.obj === o.name ? ' selected' : '') + '>' + tkEsc(o.name) + '</option>'; }).join('') + '</select>'
    + '<select data-f="src"><option value="">Pyrus и CRM</option><option value="pyrus"' + (tk.src === 'pyrus' ? ' selected' : '') + '>Только из Pyrus</option><option value="crm"' + (tk.src === 'crm' ? ' selected' : '') + '>Только новые (CRM)</option></select>'
    + '<input type="text" data-f="q" placeholder="Поиск: задача, номер, человек" value="' + tkEsc(tk.q) + '">'
    + '</div><div class="rq-list" data-tk-list></div>';
  tkRenderList();
}
function tkFiltered(skipQuick) {
  const q = tk.q.trim().toLowerCase();
  return tk.data.tasks.filter(function(t) {
    if (tk.exec && tkExecKey(t) !== tk.exec) return false;
    if (tk.kind && t.kind !== tk.kind) return false;
    if (tk.obj === '-' ? !!t.object_name : (tk.obj && t.object_name !== tk.obj)) return false;
    if (tk.src && (t.source || 'crm') !== tk.src) return false;
    if (q && [t.title, t.object_name, '№' + t.id, String(t.id), tkWho(t.executor_id, t.executor_name), tkWho(t.controller_id, t.controller_name), tkWho(t.author_id, t.author_name)].join(' ').toLowerCase().indexOf(q) === -1) return false;
    if (!skipQuick) { const qf = TK_QUICK.find(function(x) { return x[0] === tk.quick; }); if (qf && !qf[2](t)) return false; }
    return true;
  });
}
function tkRenderList() {
  const base = tkFiltered(true);
  tkRoot().querySelector('[data-tk-chips]').innerHTML = TK_QUICK.map(function(x) {
    const n = base.filter(x[2]).length;
    return '<button class="rq-chip' + (tk.quick === x[0] ? ' on' : '') + (x[0] === 'late' && n ? ' bad' : '') + '" data-quick="' + x[0] + '">' + x[1] + '<b>' + n + '</b></button>';
  }).join('');
  const rows = tkFiltered(false).sort(function(a, b) {   // открытые: «ещё вчера» и просрочка сверху, потом по сроку; закрытые — свежие сверху
    const w = function(t) { return !tkIsOpen(t) ? 3 : t.urgency === 'asap' ? 0 : tkLate(t) ? 1 : 2; };
    return w(a) - w(b) || (w(a) === 3 ? String(b.closed_at || b.createdAt).localeCompare(String(a.closed_at || a.createdAt)) : String(a.due_date || '9').localeCompare(String(b.due_date || '9'))) || b.id - a.id;
  });
  const list = tkRoot().querySelector('[data-tk-list]');
  list.innerHTML = rows.length ? rows.slice(0, tk.limit).map(tkRowHtml).join('')
      + (rows.length > tk.limit ? '<button class="rq-btn rq-more" data-act="more">Показать ещё (' + (rows.length - tk.limit) + ')</button>' : '')
    : '<div class="rq-empty">' + (tk.data.tasks.length ? 'Под фильтр ничего не попало' : 'Задач пока нет — нажмите «+ Новая задача»') + '</div>';
}
function tkRowHtml(t) {
  const late = tkLate(t), open = tkIsOpen(t), u = TK_URG[t.urgency] || TK_URG.normal;
  const due = t.due_date ? (late ? '<span class="rq-late">просрочено на ' + tkDays(String(t.due_date).slice(0, 10), tkToday()) + ' дн. (срок ' + tkDate(t.due_date) + ')</span>' : 'срок ' + tkDate(t.due_date)) : 'без срока';
  return '<div class="rq-row" data-open="' + t.id + '" style="--c:' + (t.urgency === 'asap' && open ? '#cf1322' : (TK_ST[t.status] || {}).c || '#d9d9d9') + ';">'
    + '<div style="min-width:0;"><div class="rq-row-title">' + (t.urgency !== 'normal' && TK_URG[t.urgency] && open ? '<span style="color:' + u.c + ';">' + tkEsc(u.l) + ' · </span>' : '') + tkEsc(t.title || 'Без названия') + '</div>'
    + '<div class="rq-row-sub">' + (t.source === 'pyrus' ? '<span class="rq-pill tk-src">Pyrus</span>' : '') + '№' + t.id + ' · ' + tkEsc([t.kind, t.object_name].filter(Boolean).join(' · ')) + '</div></div>'
    + '<div class="rq-row-side">' + tkPill(t.status) + (t.status === 'waiting' && t.wait_reason ? ' <span style="color:#722ed1;">ждём ' + tkEsc(t.wait_reason) + '</span>' : '')
    + '<div style="margin-top:3px;color:#595959;">' + tkEsc(tkWho(t.executor_id, t.executor_name)) + (open ? ' · ' + due : '') + '</div></div></div>';
}

function tkOnChange(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'exec' || f === 'kind' || f === 'obj' || f === 'src') { tk[f] = e.target.value; tk.limit = 60; tkRenderList(); }
  if (f === 'dept') { tk.dept = e.target.value; tkRenderStaffList(); }
  if (f === 'fired') { tk.fired = e.target.checked; tkRenderStaffList(); }
  const hd = e.target.getAttribute('data-head');
  if (hd) tkSaveHead(Number(hd), e.target.value);
}
function tkOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const tab = c('[data-tab]');
  if (tab) { tk.tab = tab.getAttribute('data-tab'); tkRender(); return; }
  if (c('[data-act="new"]')) { tkOpenNew({}); return; }
  if (c('[data-act="more"]')) { tk.limit += 100; tkRenderList(); return; }
  const qk = c('[data-quick]');
  if (qk) { tk.quick = qk.getAttribute('data-quick'); tk.limit = 60; tkRenderList(); return; }
  const go = c('[data-go]');
  if (go) {   // из статистики — в список с фильтром
    const p = JSON.parse(go.getAttribute('data-go'));
    tk.exec = p.exec || ''; tk.kind = p.kind || ''; tk.obj = p.obj || ''; tk.src = ''; tk.quick = p.quick || 'open'; tk.q = ''; tk.tab = 'list'; tk.limit = 60;
    tkRender(); return;
  }
  const emp = c('[data-emp]');
  if (emp) { tkOpenEmp(Number(emp.getAttribute('data-emp'))); return; }
  const op = c('[data-open]');
  if (op) tkOpenCard(Number(op.getAttribute('data-open')));
}

// ---------- новая задача ----------
// preset: { kind, employee_id, title, object_name } — например, кадровая задача из карточки сотрудника
function tkOpenNew(preset) {
  const d = tk.data;
  const meKey = 'u' + tk.me.id;
  const m = tkModal('<div class="rq-box-h"><div class="rq-box-t">' + (preset.kind === 'Кадры' ? 'Новая кадровая задача' : 'Новая задача') + '</div><button class="rq-x">✕</button></div><div class="rq-box-b"><div class="rq-form">'
    + (preset.kind === 'Кадры' ? '<div class="rq-f full"><label>Что оформляем</label><div class="rq-seg" data-n="hrtpl">' + TK_HR_TPL.map(function(x) { return '<button type="button" style="--c:#1677ff;" data-hr="' + tkEsc(x) + '">' + tkEsc(x) + '</button>'; }).join('') + '</div></div>' : '')
    + '<div class="rq-f full"><label>Задача *</label><input type="text" data-n="title" placeholder="Коротко: что нужно сделать" value="' + tkEsc(preset.title || '') + '"></div>'
    + '<div class="rq-f full"><label>Подробности</label><textarea data-n="description" placeholder="Что именно, к какому сроку, что уже сделано"></textarea></div>'
    + '<div class="rq-f"><label>Тип *</label><select data-n="kind">' + TK_KINDS.map(function(k) { return '<option' + ((preset.kind || 'Общая') === k ? ' selected' : '') + '>' + tkEsc(k) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Срочность</label><div class="rq-seg">' + Object.keys(TK_URG).map(function(k) { return '<button type="button" data-urg="' + k + '" style="--c:' + (k === 'normal' ? '#1677ff' : TK_URG[k].c) + ';"' + (k === 'normal' ? ' class="on"' : '') + '>' + TK_URG[k].l + '</button>'; }).join('') + '</div></div>'
    + '<div class="rq-f"><label>Исполнитель *</label><select data-n="executor"><option value="">Выберите</option>' + tkPeopleOptions(meKey) + '</select><div class="rq-hint" data-exec-hint></div></div>'
    + '<div class="rq-f"><label>Ответственный (проверяет и закрывает)</label><select data-n="controller"><option value="">—</option>' + tkUserOptions(tk.me.id) + '</select></div>'
    + '<div class="rq-f"><label>Срок</label><input type="date" data-n="due_date" min="2000-01-01" max="2099-12-31" value="' + tkAddWorkDays(TK_URG.normal.d) + '"></div>'
    + '<div class="rq-f"><label>Объект</label><select data-n="object_name"><option value="">— без объекта —</option>' + d.objects.map(function(o) { return '<option' + (preset.object_name === o.name ? ' selected' : '') + '>' + tkEsc(o.name) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Договор / арендатор</label><select data-n="contract_id"><option value="">— не по договору —</option></select></div>'
    + '<div class="rq-f" data-emp-f><label>Сотрудник (для кадровой задачи)</label><select data-n="employee_id"><option value="">—</option>' + d.emps.filter(function(e) { return e.status !== 'fired' || e.id === preset.employee_id; }).map(function(e) { return '<option value="' + e.id + '"' + (e.id === preset.employee_id ? ' selected' : '') + '>' + tkEsc(e.full_name) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f full"><label>Файл</label><input type="file" data-n="file"></div>'
    + '</div><div class="rq-actions"><button class="rq-btn pri" data-save>Создать задачу</button><button class="rq-btn rq-x">Отмена</button></div></div>');
  const q = function(n) { return m.querySelector('[data-n="' + n + '"]'); };
  let urg = 'normal', dueTouched = false;
  q('due_date').addEventListener('change', function() { dueTouched = true; });
  function onKind() { m.querySelector('[data-emp-f]').style.display = q('kind').value === 'Кадры' ? '' : 'none'; }
  q('kind').addEventListener('change', onKind); onKind();
  function onExec() {   // исполнитель без учётки не получит уведомлений и не сможет отметить выполнение
    const p = tkPersonFromKey(q('executor').value);
    m.querySelector('[data-exec-hint]').textContent = q('executor').value && !p.id ? 'Нет учётки в CRM: уведомлений не получит, выполнение отмечает ответственный' : '';
  }
  q('executor').addEventListener('change', onExec);
  function onObject() {
    const name = q('object_name').value;
    q('contract_id').innerHTML = '<option value="">— не по договору —</option>' + d.contracts.filter(function(c) { return c.object_name === name; })
      .map(function(c) { return '<option value="' + c.id + '">' + tkEsc([c.contract_number, c.tenant_name].filter(Boolean).join(' · ') || ('#' + c.id)) + '</option>'; }).join('');
  }
  q('object_name').addEventListener('change', onObject); onObject();
  m.querySelectorAll('[data-urg]').forEach(function(b) {
    b.addEventListener('click', function() {
      urg = b.getAttribute('data-urg');
      m.querySelectorAll('[data-urg]').forEach(function(x) { x.classList.toggle('on', x === b); });
      if (!dueTouched) q('due_date').value = tkAddWorkDays(TK_URG[urg].d);
    });
  });
  m.querySelectorAll('[data-hr]').forEach(function(b) {
    b.addEventListener('click', function() {
      m.querySelectorAll('[data-hr]').forEach(function(x) { x.classList.toggle('on', x === b); });
      const e = tkEmp(Number(q('employee_id').value));
      q('title').value = b.getAttribute('data-hr') + (e ? ': ' + e.full_name : '') + (b.getAttribute('data-hr') === 'Отпуск' ? ' с ДД.ММ по ДД.ММ' : '');
      q('title').focus();
    });
  });
  m.querySelector('[data-save]').addEventListener('click', async function(e) {
    const title = q('title').value.trim(), ex = tkPersonFromKey(q('executor').value);
    if (!title) { tkToast('Опишите задачу'); q('title').focus(); return; }
    if (!ex.id && !ex.name) { tkToast('Выберите исполнителя'); q('executor').focus(); return; }
    const due = q('due_date').value;
    if (due && !/^(19|20)\d{2}-\d{2}-\d{2}$/.test(due)) { tkToast('Проверьте срок'); q('due_date').focus(); return; }
    const ctl = Number(q('controller').value) || null;
    e.target.disabled = true;
    try {
      const fileId = q('file').files[0] ? await tkUpload(q('file').files[0]) : null;
      const vals = { title: title, description: q('description').value.trim(), kind: q('kind').value, urgency: urg, due_date: due || null, status: 'new', due_moved: 0,
        executor_id: ex.id, executor_name: ex.name, controller_id: ctl, controller_name: ctl ? tkWho(ctl) : null,
        author_id: tk.me.id, author_name: tkWho(tk.me.id), object_name: q('object_name').value || null,
        contract_id: Number(q('contract_id').value) || null, employee_id: q('kind').value === 'Кадры' ? (Number(q('employee_id').value) || null) : null, source: 'crm' };
      const rec = tkRows(await ctx.api.resource('crm_tasks').create({ values: vals }))[0];
      await tkEvent(rec.id, 'create', 'Задача создана' + (fileId ? ', приложен файл' : ''), fileId);
      tkNotify(vals.executor_id, 'Задача №' + rec.id, (urg === 'asap' ? 'Ещё вчера! ' : urg === 'urgent' ? 'Срочно: ' : 'Новая задача: ') + title + (due ? ' (срок ' + tkDate(due) + ')' : ''), rec.id);
      if (ctl && ctl !== vals.executor_id) tkNotify(ctl, 'Задача №' + rec.id, 'Вы ответственный: ' + title, rec.id);
      m.remove();
      tkToast('Задача №' + rec.id + ' создана');
      await tkReload();
    } catch (err) { tkToast('Не удалось создать задачу'); e.target.disabled = false; }
  });
}

// ---------- карточка задачи ----------
async function tkOpenCard(id) {
  let t = tk.data.tasks.find(function(x) { return x.id === id; });
  if (!t) { try { t = tkRows(await ctx.api.resource('crm_tasks').get({ filterByTk: id }))[0]; } catch (e) { t = null; } }
  if (!t) { tkToast('Задача №' + id + ' не найдена'); return; }
  const m = tkModal('<div data-tk-card></div>');
  await tkRenderCard(m, t);
}
// права: исполнитель ведёт задачу, ответственный/автор принимает; администратор — всё
// (у исполнителя из Pyrus может не быть учётки — тогда задачу ведёт ответственный)
function tkCan(t) {
  const me = tk.me.id, adm = tkIsAdmin();
  const chk = Number(t.controller_id) === me || Number(t.author_id) === me || adm;
  const ex = Number(t.executor_id) === me || adm || (!t.executor_id && chk);
  const a = [];
  if (t.status === 'new' && ex) a.push(['take', 'Взять в работу', 'pri']);
  if ((t.status === 'new' || t.status === 'in_work') && ex) a.push(['wait', 'Ждём…', '']);
  if (t.status === 'waiting' && ex) a.push(['resume', 'Вернуть в работу', '']);
  if ((t.status === 'new' || t.status === 'in_work' || t.status === 'waiting') && ex) a.push(['done', 'Выполнена', 'ok']);
  if (t.status === 'done' && chk) { a.push(['close', 'Принять и закрыть', 'ok']); a.push(['reopen', 'Не выполнено — вернуть', 'warn']); }
  if (tkIsOpen(t) && (ex || chk)) { a.push(['due', 'Перенести срок', '']); a.push(['assign', 'Передать другому', '']); }
  if (tkIsOpen(t) && chk) a.push(['cancel', 'Отменить', 'warn']);
  if ((t.status === 'closed' || t.status === 'cancelled') && chk) a.push(['reopen', 'Возобновить', '']);
  if (chk || adm) a.push(['edit', 'Изменить тип / объект', '']);
  return a;
}
async function tkRenderCard(m, t) {
  const box = m.querySelector('[data-tk-card]');
  const late = tkLate(t), u = TK_URG[t.urgency] || TK_URG.normal, emp = t.employee_id ? tkEmp(t.employee_id) : null;
  const c = t.contract_id ? tk.data.contracts.find(function(x) { return x.id === Number(t.contract_id); }) : null;
  let evs = [];
  try { evs = tkRows(await ctx.api.resource('crm_task_events').list({ filter: { task_id: t.id }, sort: ['createdAt', 'id'], appends: ['file'], paginate: false })); } catch (e) { evs = []; }
  const nComments = evs.filter(function(x) { return x.kind === 'comment'; }).length;
  box.innerHTML = '<div class="rq-box-h"><div class="rq-box-t">№' + t.id + ' · ' + tkEsc(t.title) + '<div style="margin-top:6px;font-size:13px;font-weight:400;">' + tkPill(t.status)
    + (t.status === 'waiting' && t.wait_reason ? ' <span style="color:#722ed1;">ждём ' + tkEsc(t.wait_reason) + '</span>' : '')
    + (t.urgency !== 'normal' && TK_URG[t.urgency] ? ' <span class="rq-pill" style="color:' + u.c + ';border-color:' + u.c + '55;">' + tkEsc(u.l) + '</span>' : '')
    + (t.source === 'pyrus' ? ' <span class="rq-pill tk-src">из Pyrus</span>' : '') + '</div></div><button class="rq-x">✕</button></div>'
    + '<div class="rq-box-b"><div class="rq-meta">'
    + '<div><div class="l">Исполнитель</div>' + tkEsc(tkWho(t.executor_id, t.executor_name)) + (!t.executor_id && t.executor_name ? ' <span class="rq-hint">(нет учётки в CRM)</span>' : '') + '</div>'
    + '<div><div class="l">Ответственный</div>' + tkEsc(tkWho(t.controller_id, t.controller_name)) + '</div>'
    + '<div><div class="l">Срок</div>' + (t.due_date ? (late ? '<span class="rq-late">' + tkDate(t.due_date) + ', просрочено на ' + tkDays(String(t.due_date).slice(0, 10), tkToday()) + ' дн.</span>' : tkDate(t.due_date)) : 'без срока') + (t.due_moved ? ' <span style="color:#8c8c8c;font-size:12px;">(переносили ' + t.due_moved + ' раз)</span>' : '') + '</div>'
    + '<div><div class="l">Тип</div>' + tkEsc(t.kind || '—') + '</div>'
    + '<div><div class="l">Объект</div>' + tkEsc(t.object_name || '—') + '</div>'
    + '<div><div class="l">Договор / арендатор</div>' + (t.contract_id ? '<a href="/admin/b5znz7yxpy3?open=active:' + t.contract_id + '" style="color:#1677ff;">' + tkEsc(c ? [c.contract_number, c.tenant_name].filter(Boolean).join(' · ') : '#' + t.contract_id) + '</a>' : '—') + '</div>'
    + (emp ? '<div><div class="l">Сотрудник</div><a data-emp-open="' + emp.id + '" style="color:#1677ff;cursor:pointer;">' + tkEsc(emp.full_name) + '</a></div>' : '')
    + '<div><div class="l">Автор</div>' + tkEsc(tkWho(t.author_id, t.author_name)) + ' · ' + tkDateTime(t.createdAt) + '</div>'
    + (t.pyrus_id ? '<div><div class="l">Pyrus</div><a href="https://pyrus.com/t#id' + Number(t.pyrus_id) + '" target="_blank" rel="noopener" style="color:#1677ff;">задача ' + Number(t.pyrus_id) + ' ↗</a></div>' : '')
    + '</div>'
    + (t.description ? '<div class="rq-desc">' + tkEsc(t.description) + '</div>' : '')
    + (t.result ? '<div class="rq-desc" style="background:#f6ffed;"><b>Результат:</b> ' + tkEsc(t.result) + '</div>' : '')
    + '<div class="rq-actions">' + tkCan(t).map(function(a) { return '<button class="rq-btn ' + a[2] + '" data-a="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>'
    + '<div data-actbox></div>'
    + '<div class="rq-tl"><div style="font-weight:600;margin-bottom:4px;">Переписка и история <span class="rq-hint">(' + nComments + ' комм.)</span>'
    + (evs.length > 12 ? ' <label class="rq-hint" style="font-weight:400;margin-left:8px;"><input type="checkbox" data-only-cmt> только переписка</label>' : '') + '</div>'
    + '<div data-evs>' + evs.map(function(x) {
        const f = x.file;
        return '<div class="rq-ev' + (x.kind === 'comment' ? '' : ' sys') + '" data-k="' + tkEsc(x.kind) + '"><div class="rq-ev-d">' + tkDateTime(x.createdAt) + '</div><div style="min-width:0;"><b style="color:#434343;">' + tkEsc(tkWho(x.author_id, x.author_name)) + ':</b> <span class="rq-ev-t">' + tkEsc(x.text) + '</span>'
          + (f ? ' <a data-file="' + tkEsc(f.url) + '">📎 ' + tkEsc((f.title || 'файл') + (f.extname || '')) + '</a>' : '') + '</div></div>';
      }).join('') + '</div>'
    + '<div class="rq-comment"><textarea placeholder="Комментарий…" data-cmt></textarea><input type="file" data-cmt-file style="display:none;"><button class="rq-btn" data-cmt-attach title="Приложить файл">📎</button><button class="rq-btn pri" data-cmt-send>Отправить</button></div>'
    + '<div data-cmt-fname class="rq-hint"></div></div></div>';
  box.querySelectorAll('[data-a]').forEach(function(b) { b.addEventListener('click', function() { tkAction(m, t, b.getAttribute('data-a')); }); });
  const eo = box.querySelector('[data-emp-open]');
  if (eo) eo.addEventListener('click', function() { m.remove(); tkOpenEmp(Number(eo.getAttribute('data-emp-open'))); });
  const oc = box.querySelector('[data-only-cmt]');
  if (oc) oc.addEventListener('change', function() { box.querySelectorAll('[data-evs] .rq-ev').forEach(function(x) { x.style.display = oc.checked && x.getAttribute('data-k') !== 'comment' ? 'none' : ''; }); });
  box.querySelectorAll('[data-file]').forEach(function(a) {
    a.addEventListener('click', async function() {
      try { const res = await fetch(a.getAttribute('data-file'), { headers: { Authorization: 'Bearer ' + tkToken() } }); window.open(URL.createObjectURL(await res.blob()), '_blank'); }
      catch (e) { tkToast('Не удалось открыть файл'); }
    });
  });
  const fin = box.querySelector('[data-cmt-file]');
  box.querySelector('[data-cmt-attach]').addEventListener('click', function() { fin.click(); });
  fin.addEventListener('change', function() { box.querySelector('[data-cmt-fname]').textContent = fin.files[0] ? 'Файл: ' + fin.files[0].name : ''; });
  box.querySelector('[data-cmt-send]').addEventListener('click', async function(e) {
    const txt = box.querySelector('[data-cmt]').value.trim();
    if (!txt && !fin.files[0]) return;
    e.target.disabled = true;
    try {
      const fid = fin.files[0] ? await tkUpload(fin.files[0]) : null;
      await tkEvent(t.id, 'comment', txt || 'Файл', fid);
      [t.executor_id, t.controller_id, t.author_id].filter(function(v, i, a) { return v && a.indexOf(v) === i; })
        .forEach(function(uid) { tkNotify(uid, 'Задача №' + t.id, tkWho(tk.me.id) + ': ' + (txt || 'приложил файл'), t.id); });
      await tkRenderCard(m, t);
    } catch (err) { tkToast('Не удалось отправить'); e.target.disabled = false; }
  });
}
// действие по задаче: где нужен ввод — встроенная форма, без окон браузера
function tkAction(m, t, a) {
  const box = m.querySelector('[data-actbox]');
  const lbl = function(s) { return '<label style="font-size:12.5px;color:#595959;display:block;margin-top:6px;">' + s + '</label>'; };
  const need = {
    wait: lbl('Чего ждём') + '<select data-in style="width:100%;margin-top:4px;">' + TK_WAIT.map(function(w) { return '<option>' + w + '</option>'; }).join('') + '</select>',
    done: lbl('Что сделано (обязательно — увидит ответственный при проверке)') + '<textarea data-in style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    reopen: lbl(t.status === 'done' ? 'Что не так (обязательно)' : 'Почему возобновляем (обязательно)') + '<textarea data-in style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    cancel: lbl('Причина отмены (обязательно)') + '<textarea data-in style="width:100%;margin-top:4px;min-height:50px;"></textarea>',
    due: lbl('Новый срок') + '<input type="date" data-in min="2000-01-01" max="2099-12-31" value="' + tkEsc(String(t.due_date || '').slice(0, 10)) + '" style="width:100%;margin-top:4px;">'
      + lbl('Причина переноса (обязательно — видна в статистике)') + '<input type="text" data-in2 style="width:100%;margin-top:4px;">',
    assign: lbl('Кому передать') + '<select data-in style="width:100%;margin-top:4px;">' + tkPeopleOptions(tkKeyOf(t.executor_id, t.executor_name)) + '</select>',
    edit: lbl('Тип') + '<select data-in style="width:100%;margin-top:4px;">' + TK_KINDS.map(function(k) { return '<option' + (t.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>'
      + lbl('Объект') + '<select data-in2 style="width:100%;margin-top:4px;"><option value="">— без объекта —</option>' + tk.data.objects.map(function(o) { return '<option' + (t.object_name === o.name ? ' selected' : '') + '>' + tkEsc(o.name) + '</option>'; }).join('') + '</select>'
      + lbl('Сотрудник (для кадровой задачи)') + '<select data-in3 style="width:100%;margin-top:4px;"><option value="">—</option>' + tk.data.emps.map(function(e) { return '<option value="' + e.id + '"' + (Number(t.employee_id) === e.id ? ' selected' : '') + '>' + tkEsc(e.full_name) + '</option>'; }).join('') + '</select>'
  }[a];
  if (need) {
    box.innerHTML = '<div class="rq-actbox">' + need + '<div class="rq-actions" style="margin-top:10px;"><button class="rq-btn pri" data-go-a>Подтвердить</button><button class="rq-btn" data-no-a>Отмена</button></div></div>';
    box.querySelector('[data-no-a]').addEventListener('click', function() { box.innerHTML = ''; });
    box.querySelector('[data-go-a]').addEventListener('click', function(e) { tkApply(m, t, a, e.target); });
    const f = box.querySelector('[data-in]'); if (f) f.focus();
  } else tkApply(m, t, a, null);
}
async function tkApply(m, t, a, btn) {
  const box = m.querySelector('[data-actbox]');
  const inp = box.querySelector('[data-in]'), inp2 = box.querySelector('[data-in2]'), inp3 = box.querySelector('[data-in3]');
  const v = inp ? inp.value.trim() : '';
  const now = new Date().toISOString(), title = 'Задача №' + t.id;
  const chk = t.controller_id || t.author_id;
  let upd = null, ev = '', kind = 'status', notify = [];
  if (a === 'take') { upd = { status: 'in_work' }; ev = 'Взята в работу'; notify = [[chk, 'Взята в работу: ' + t.title]]; }
  if (a === 'wait') { upd = { status: 'waiting', wait_reason: v }; ev = 'Ждём ' + v; notify = [[chk, 'Ждём ' + v + ': ' + t.title]]; }
  if (a === 'resume') { upd = { status: 'in_work', wait_reason: null }; ev = 'Снова в работе'; }
  if (a === 'done') { if (!v) { tkToast('Напишите, что сделано'); inp.focus(); return; } upd = { status: 'done', result: v, done_at: now, wait_reason: null }; ev = 'Выполнена: ' + v; notify = [[chk, 'Выполнена, проверьте и закройте: ' + t.title]]; }
  if (a === 'close') { upd = { status: 'closed', closed_at: now }; ev = 'Принята и закрыта'; notify = [[t.executor_id, 'Закрыта: ' + t.title]]; }
  if (a === 'reopen') { if (!v) { tkToast('Напишите причину'); inp.focus(); return; } upd = { status: 'in_work', done_at: null, closed_at: null }; ev = 'Возвращена в работу: ' + v; notify = [[t.executor_id, 'Вернули в работу: ' + v]]; }
  if (a === 'cancel') { if (!v) { tkToast('Укажите причину'); inp.focus(); return; } upd = { status: 'cancelled', closed_at: now, result: v }; ev = 'Отменена: ' + v; notify = [[t.executor_id, 'Отменена: ' + t.title]]; }
  if (a === 'due') {
    const reason = inp2 ? inp2.value.trim() : '';
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(v)) { tkToast('Укажите новый срок'); inp.focus(); return; }
    if (!reason) { tkToast('Укажите причину переноса'); inp2.focus(); return; }
    upd = { due_date: v, due_moved: (Number(t.due_moved) || 0) + 1 };
    ev = 'Срок перенесён с ' + (tkDate(t.due_date) || '«без срока»') + ' на ' + tkDate(v) + ': ' + reason; kind = 'due';
    notify = [[t.executor_id, 'Срок перенесён на ' + tkDate(v) + ': ' + reason], [chk, 'Срок перенесён на ' + tkDate(v) + ': ' + reason]];
  }
  if (a === 'assign') {
    const p = tkPersonFromKey(v);
    if ((!p.id && !p.name) || tkKeyOf(p.id, p.name) === tkKeyOf(t.executor_id, t.executor_name)) { box.innerHTML = ''; return; }
    upd = { executor_id: p.id, executor_name: p.name };
    ev = 'Передана: ' + tkWho(t.executor_id, t.executor_name) + ' → ' + p.name; kind = 'assign';
    notify = [[p.id, 'Вам передана задача: ' + t.title + (t.due_date ? ' (срок ' + tkDate(t.due_date) + ')' : '')]];
  }
  if (a === 'edit') {
    upd = { kind: v, object_name: inp2.value || null, employee_id: v === 'Кадры' ? (Number(inp3.value) || null) : null };
    const ch = [];
    if (upd.kind !== t.kind) ch.push('тип: ' + upd.kind);
    if ((upd.object_name || '') !== (t.object_name || '')) ch.push('объект: ' + (upd.object_name || '—'));
    if ((upd.employee_id || null) !== (t.employee_id ? Number(t.employee_id) : null)) ch.push('сотрудник: ' + (upd.employee_id ? tkEmp(upd.employee_id).full_name : '—'));
    if (!ch.length) { box.innerHTML = ''; return; }
    ev = 'Изменено — ' + ch.join(', '); kind = 'edit';
  }
  if (!upd) return;
  if (btn) btn.disabled = true;
  try {
    await ctx.api.resource('crm_tasks').update({ filterByTk: t.id, values: upd });
    await tkEvent(t.id, kind, ev);
    notify.forEach(function(n) { tkNotify(n[0], title, n[1], t.id); });
    await tkReload();
    const fresh = tk.data.tasks.find(function(x) { return x.id === t.id; }) || Object.assign(t, upd);
    await tkRenderCard(m, fresh);
  } catch (e) { tkToast('Не удалось сохранить'); if (btn) btn.disabled = false; }
}

// ---------- сотрудники ----------
function tkDeptNames() {
  const names = tk.data.depts.map(function(d) { return d.name; });
  tk.data.emps.forEach(function(e) { if (e.department && names.indexOf(e.department) === -1) names.push(e.department); });
  return names;
}
function tkRenderStaff() {
  const emps = tk.data.emps.filter(function(e) { return e.status !== 'fired'; });
  const month = new Date().getMonth() + 1;
  const bd = emps.filter(function(e) { return e.birthday && Number(String(e.birthday).slice(5, 7)) === month; });
  const vac = emps.filter(function(e) { return e.status === 'vacation'; });
  const noAcc = emps.filter(function(e) { return !e.user_id; });
  tkBody().innerHTML = '<div class="rq-tiles">'
    + '<div class="rq-tile"><div class="rq-tile-l">Работают</div><div class="rq-tile-v">' + emps.length + '</div><div class="rq-tile-n">отделов: ' + tkDeptNames().length + '</div></div>'
    + '<div class="rq-tile"><div class="rq-tile-l">В отпуске</div><div class="rq-tile-v">' + vac.length + '</div><div class="rq-tile-n">' + tkEsc(vac.map(function(e) { return e.last_name; }).join(', ') || '—') + '</div></div>'
    + '<div class="rq-tile"><div class="rq-tile-l">Дни рождения в этом месяце</div><div class="rq-tile-v">' + bd.length + '</div><div class="rq-tile-n">' + tkEsc(bd.map(function(e) { return e.last_name + ' ' + tkDate(e.birthday).slice(0, 5); }).join(', ') || 'даты не заполнены') + '</div></div>'
    + '<div class="rq-tile"><div class="rq-tile-l">Без учётки в CRM</div><div class="rq-tile-v">' + noAcc.length + '</div><div class="rq-tile-n">задачи им — только через ответственного</div></div>'
    + '</div><div class="rq-filters">'
    + '<select data-f="dept"><option value="">Все отделы</option>' + tkDeptNames().map(function(n) { return '<option' + (tk.dept === n ? ' selected' : '') + '>' + tkEsc(n) + '</option>'; }).join('') + '</select>'
    + '<input type="text" data-f="sq" placeholder="Поиск: ФИО, должность, почта, телефон" value="' + tkEsc(tk.sq) + '">'
    + '<label class="rq-hint" style="margin:0;"><input type="checkbox" data-f="fired"' + (tk.fired ? ' checked' : '') + '> показать уволенных</label>'
    + '</div><div data-staff-list></div>';
  tkRenderStaffList();
}
function tkRenderStaffList() {
  const q = tk.sq.trim().toLowerCase();
  const list = tk.data.emps.filter(function(e) {
    if (!tk.fired && e.status === 'fired') return false;
    if (tk.dept && e.department !== tk.dept) return false;
    if (q && [e.full_name, e.position, e.email, e.phone, e.department].join(' ').toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  const groups = {};
  list.forEach(function(e) { (groups[e.department || 'Без отдела'] = groups[e.department || 'Без отдела'] || []).push(e); });
  const order = tkDeptNames().concat(['Без отдела']).filter(function(n) { return groups[n]; });
  const el = tkRoot().querySelector('[data-staff-list]');
  el.innerHTML = order.length ? order.map(function(n) {
    const dep = tk.data.depts.find(function(d) { return d.name === n; }), head = dep && dep.head_employee_id ? tkEmp(dep.head_employee_id) : null;
    return '<div class="tk-dept"><div class="tk-dept-h">' + tkEsc(n) + '<span>' + groups[n].length + ' чел.' + (head ? ' · руководитель ' + tkEsc(head.full_name) : '') + (dep && dep.parent_name ? ' · входит в ' + tkEsc(dep.parent_name) : '') + '</span></div>'
      + '<table><tbody>' + groups[n].map(function(e) {
          const open = tkEmpTasks(e).filter(tkIsOpen), late = open.filter(tkLate).length;
          return '<tr data-emp="' + e.id + '"' + (e.status === 'fired' ? ' class="tk-off"' : '') + '><td style="width:28%;"><b>' + tkEsc(e.full_name) + '</b>' + (e.status === 'vacation' ? ' <span class="rq-pill" style="color:#722ed1;border-color:#722ed155;">в отпуске</span>' : '') + (e.status === 'fired' ? ' <span class="rq-hint">уволен</span>' : '') + '</td>'
            + '<td>' + tkEsc(e.position || '') + '</td><td class="tk-hide-m">' + tkEsc(e.email || '') + '</td><td class="tk-hide-m">' + tkEsc(e.phone || '') + '</td>'
            + '<td class="n" title="Открытые задачи">' + (open.length ? open.length + ' задач' + (late ? ' · <span class="rq-late">' + late + ' просроч.</span>' : '') : '') + '</td>'
            + '<td class="n tk-hide-m">' + (e.user_id ? '<span title="Есть учётка в CRM" style="color:#389e0d;">CRM ✓</span>' : '<span class="rq-hint">нет учётки</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
  }).join('') : '<div class="rq-empty">Никого не нашли</div>';
}
function tkOpenEmp(id) {
  const e = tkEmp(id);
  if (!e) { tkToast('Сотрудник не найден'); return; }
  const m = tkModal('<div data-tk-emp></div>');
  tkRenderEmp(m, e);
}
function tkRenderEmp(m, e) {
  const box = m.querySelector('[data-tk-emp]'), adm = tkIsAdmin();
  const tasks = tkEmpTasks(e).sort(function(a, b) { return (tkIsOpen(b) ? 1 : 0) - (tkIsOpen(a) ? 1 : 0) || b.id - a.id; });
  const hr = tasks.filter(function(t) { return t.kind === 'Кадры'; }), work = tasks.filter(function(t) { return t.kind !== 'Кадры'; });
  const inp = function(n, type, v) { return '<input type="' + type + '" data-e="' + n + '" value="' + tkEsc(type === 'date' ? String(v || '').slice(0, 10) : v || '') + '"' + (adm ? '' : ' disabled') + (type === 'date' ? ' min="1900-01-01" max="2099-12-31"' : '') + '>'; };
  const taskTable = function(list, empty) {
    return list.length ? '<table><tbody>' + list.slice(0, 30).map(function(t) {
      return '<tr data-task="' + t.id + '"><td>' + tkEsc(t.title) + '</td><td class="n" style="white-space:nowrap;">' + tkPill(t.status) + '</td><td class="n" style="white-space:nowrap;">' + (tkIsOpen(t) && t.due_date ? (tkLate(t) ? '<span class="rq-late">' + tkDate(t.due_date) + '</span>' : tkDate(t.due_date)) : tkDate(t.closed_at)) + '</td></tr>';
    }).join('') + '</tbody></table>' + (list.length > 30 ? '<div class="rq-hint">и ещё ' + (list.length - 30) + '</div>' : '') : '<div class="rq-hint">' + empty + '</div>';
  };
  box.innerHTML = '<div class="rq-box-h"><div class="rq-box-t">' + tkEsc(e.full_name) + '<div style="margin-top:4px;font-size:13px;font-weight:400;color:#595959;">' + tkEsc([e.position, e.department].filter(Boolean).join(' · ') || '—') + '</div></div><button class="rq-x">✕</button></div>'
    + '<div class="rq-box-b"><div class="rq-form">'
    + '<div class="rq-f"><label>Должность</label>' + inp('position', 'text', e.position) + '</div>'
    + '<div class="rq-f"><label>Отдел</label><select data-e="department"' + (adm ? '' : ' disabled') + '><option value="">—</option>' + tkDeptNames().map(function(n) { return '<option' + (e.department === n ? ' selected' : '') + '>' + tkEsc(n) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Телефон</label>' + inp('phone', 'text', e.phone) + '</div>'
    + '<div class="rq-f"><label>Почта</label>' + inp('email', 'text', e.email) + '</div>'
    + '<div class="rq-f"><label>День рождения</label>' + inp('birthday', 'date', e.birthday) + (String(e.birthday || '').slice(0, 4) === '1900' ? '<div class="rq-hint">год неизвестен (в Pyrus без года)</div>' : '') + '</div>'
    + '<div class="rq-f"><label>Статус</label><select data-e="status"' + (adm ? '' : ' disabled') + '>' + Object.keys(TK_EMP_ST).map(function(k) { return '<option value="' + k + '"' + ((e.status || 'active') === k ? ' selected' : '') + '>' + TK_EMP_ST[k] + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Принят</label>' + inp('hired_on', 'date', e.hired_on) + '</div>'
    + '<div class="rq-f"><label>Уволен</label>' + inp('fired_on', 'date', e.fired_on) + '</div>'
    + '<div class="rq-f"><label>Учётка в CRM</label><select data-e="user_id"' + (adm ? '' : ' disabled') + '><option value="">— нет —</option>' + tkUserOptions(e.user_id) + '</select><div class="rq-hint">С учёткой сотрудник получает задачи и уведомления</div></div>'
    + '<div class="rq-f"><label>Pyrus</label><div style="padding-top:6px;">' + (e.pyrus_id ? 'перенесён из Pyrus' : 'заведён в CRM') + '</div></div>'
    + '<div class="rq-f full"><label>Заметки</label><textarea data-e="note"' + (adm ? '' : ' disabled') + '>' + tkEsc(e.note || '') + '</textarea></div>'
    + '</div>'
    + (adm ? '<div class="rq-actions"><button class="rq-btn pri" data-emp-save>Сохранить</button></div>' : '')
    + '<div class="rq-sec">Кадровые задачи <button class="rq-btn" data-hr-new style="margin-left:8px;padding:3px 10px;font-size:12.5px;">+ Кадровая задача</button></div>' + taskTable(hr, 'Кадровых задач нет')
    + '<div class="rq-sec">Задачи сотрудника (исполнитель)</div>' + taskTable(work, 'Задач нет')
    + '</div>';
  box.querySelectorAll('[data-task]').forEach(function(r) { r.addEventListener('click', function() { m.remove(); tkOpenCard(Number(r.getAttribute('data-task'))); }); });
  box.querySelector('[data-hr-new]').addEventListener('click', function() { m.remove(); tkOpenNew({ kind: 'Кадры', employee_id: e.id }); });
  const sv = box.querySelector('[data-emp-save]');
  if (sv) sv.addEventListener('click', async function() {
    const vals = {};
    box.querySelectorAll('[data-e]').forEach(function(x) { vals[x.getAttribute('data-e')] = x.value.trim() || null; });
    vals.user_id = Number(vals.user_id) || null;
    for (const k of ['birthday', 'hired_on', 'fired_on']) { if (vals[k] && !/^(19|20)\d{2}-\d{2}-\d{2}$/.test(vals[k])) { tkToast('Проверьте дату'); return; } }
    if (vals.status === 'fired' && !vals.fired_on) vals.fired_on = tkToday();
    sv.disabled = true;
    try {
      await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: vals });
      await tkLoad();
      tkRender();
      tkRenderEmp(m, tkEmp(e.id));
      tkToast('Сохранено');
    } catch (err) { tkToast('Не удалось сохранить'); sv.disabled = false; }
  });
}

// ---------- оргструктура ----------
function tkRenderOrg() {
  const d = tk.data, adm = tkIsAdmin();
  const tops = d.depts.filter(function(x) { return !x.parent_name; });
  const kids = function(n) { return d.depts.filter(function(x) { return x.parent_name === n; }); };
  const people = function(n) { return d.emps.filter(function(e) { return e.department === n && e.status !== 'fired'; }); };
  const headSel = function(dep) {
    const h = dep.head_employee_id ? tkEmp(dep.head_employee_id) : null;
    if (!adm) return tkEsc(h ? h.full_name : '—');
    return '<select data-head="' + dep.id + '" style="max-width:100%;"><option value="">— не указан —</option>' + d.emps.filter(function(e) { return e.status !== 'fired'; })
      .map(function(e) { return '<option value="' + e.id + '"' + (Number(dep.head_employee_id) === e.id ? ' selected' : '') + '>' + tkEsc(e.full_name) + '</option>'; }).join('') + '</select>';
  };
  const card = function(dep) {
    const p = people(dep.name);
    return '<div class="rq-card"><div class="rq-card-t">' + tkEsc(dep.name) + ' <span class="rq-hint">' + p.length + ' чел.</span></div>'
      + '<div class="rq-hint">Руководитель</div>' + headSel(dep)
      + (p.length ? '<ul>' + p.map(function(e) { return '<li><a data-emp="' + e.id + '" style="cursor:pointer;">' + tkEsc(e.full_name) + '</a>' + (e.position ? ' <span class="rq-hint">' + tkEsc(e.position) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '')
      + '</div>';
  };
  tkBody().innerHTML = d.depts.length ? tops.map(function(t) {
      return '<div class="rq-sec" style="font-size:15.5px;">' + tkEsc(t.name) + '</div><div class="tk-org">' + card(t) + kids(t.name).map(card).join('') + '</div>';
    }).join('') + '<div class="rq-hint" style="margin-top:12px;">Структура перенесена из справочника Pyrus. Руководителя отдела можно сменить здесь (только администратор).</div>'
    : '<div class="rq-empty">Оргструктура не загружена — запустите scripts/import_pyrus.py</div>';
}
async function tkSaveHead(depId, empId) {
  try {
    await ctx.api.resource('crm_departments').update({ filterByTk: depId, values: { head_employee_id: Number(empId) || null } });
    const dep = tk.data.depts.find(function(x) { return x.id === depId; }); if (dep) dep.head_employee_id = Number(empId) || null;
    tkToast('Сохранено');
  } catch (e) { tkToast('Не удалось сохранить'); }
}

// ---------- статистика ----------
function tkRenderStats() {
  const tasks = tk.data.tasks, since = function(n) { const d = new Date(); d.setDate(d.getDate() - n); return tkIso(d); };
  const d7 = since(7), d30 = since(30);
  const open = tasks.filter(tkIsOpen);
  const finished = function(t) { return String(t.done_at || t.closed_at || '').slice(0, 10); };
  const closedIn = function(list, from) { return list.filter(function(t) { return (t.status === 'closed' || t.status === 'done') && finished(t) >= from; }); };
  const days = function(list) { return closedIn(list, d30).map(function(t) { return tkDays(String(t.createdAt).slice(0, 10), finished(t)); }); };
  const med = tkMedian(days(tasks));
  const tiles = [
    ['Открыто', open.length, open.filter(tkLate).length ? '<span class="rq-late">просрочено ' + open.filter(tkLate).length + '</span>' : 'просрочек нет', { quick: 'open' }],
    ['«Ещё вчера!» и срочные', open.filter(function(t) { return t.urgency !== 'normal'; }).length, 'из них «ещё вчера»: ' + open.filter(function(t) { return t.urgency === 'asap'; }).length, { quick: 'open' }],
    ['Новых за 7 дней', tasks.filter(function(t) { return String(t.createdAt).slice(0, 10) >= d7; }).length, 'за 30 дней: ' + tasks.filter(function(t) { return String(t.createdAt).slice(0, 10) >= d30; }).length, { quick: 'all' }],
    ['Закрыто за 7 дней', closedIn(tasks, d7).length, 'ждут проверки: ' + tasks.filter(function(t) { return t.status === 'done'; }).length, { quick: 'closed' }],
    ['Срок выполнения', med === null ? '—' : med + ' дн.', 'медиана за 30 дней', { quick: 'closed' }],
    ['Без срока', open.filter(function(t) { return !t.due_date; }).length, 'открытых задач без срока', { quick: 'open' }]
  ];
  function table(title, keyFn, labelFn, goKey) {
    const g = {};
    tasks.forEach(function(t) { const k = keyFn(t); if (!k) return; (g[k] = g[k] || []).push(t); });
    const rows = Object.keys(g).map(function(k) {
      const l = g[k], o = l.filter(tkIsOpen);
      return { k: k, open: o.length, late: o.filter(tkLate).length, done30: closedIn(l, d30).length, med: tkMedian(days(l)) };
    }).filter(function(x) { return x.open || x.done30; }).sort(function(a, b) { return b.late - a.late || b.open - a.open || b.done30 - a.done30; });
    return '<div class="rq-card"><div class="rq-card-t">' + title + '</div>' + (rows.length ? '<table><thead><tr><th></th><th class="n">Открыто</th><th class="n">Просрочено</th><th class="n" title="Закрыто за последние 30 дней">Закрыто, 30 дн.</th><th class="n" title="Медиана дней от создания до выполнения, за 30 дней">Медиана, дн.</th></tr></thead><tbody>'
      + rows.map(function(x) { const go = {}; go[goKey] = x.k; return '<tr data-go="' + tkEsc(JSON.stringify(go)) + '"><td>' + tkEsc(labelFn(x.k)) + '</td><td class="n">' + x.open + '</td><td class="n' + (x.late ? ' rq-late' : '') + '">' + x.late + '</td><td class="n">' + x.done30 + '</td><td class="n">' + (x.med === null ? '—' : x.med) + '</td></tr>'; }).join('')
      + '</tbody></table>' : '<div class="rq-empty" style="padding:8px 0;">Данных пока нет</div>') + '</div>';
  }
  const names = {};
  tasks.forEach(function(t) { const k = tkExecKey(t); if (k) names[k] = tkWho(t.executor_id, t.executor_name); });
  const weeks = [], mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  for (let i = 7; i >= 0; i--) { const s = new Date(mon); s.setDate(s.getDate() - 7 * i); const e = new Date(s); e.setDate(e.getDate() + 7); weeks.push([tkIso(s), tkIso(e)]); }
  const inW = function(v, w) { const x = String(v || '').slice(0, 10); return x >= w[0] && x < w[1]; };
  const weeksHtml = '<div class="rq-card"><div class="rq-card-t">По неделям</div><table><thead><tr><th>Неделя с</th><th class="n">Создано</th><th class="n">Закрыто</th><th class="n">Из них в срок</th></tr></thead><tbody>'
    + weeks.map(function(w) {
        const done = tasks.filter(function(t) { return (t.status === 'closed' || t.status === 'done') && inW(finished(t), w); });
        return '<tr><td>' + tkDate(w[0]) + '</td><td class="n">' + tasks.filter(function(t) { return inW(t.createdAt, w); }).length + '</td><td class="n">' + done.length + '</td><td class="n">' + done.filter(function(t) { return !t.due_date || finished(t) <= String(t.due_date).slice(0, 10); }).length + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  tkBody().innerHTML = '<div class="rq-tiles">' + tiles.map(function(t) {
      return '<div class="rq-tile" data-go="' + tkEsc(JSON.stringify(t[3])) + '" style="cursor:pointer;"><div class="rq-tile-l">' + t[0] + '</div><div class="rq-tile-v">' + t[1] + '</div><div class="rq-tile-n">' + t[2] + '</div></div>';
    }).join('') + '</div>'
    + '<div class="rq-grid2">' + table('По исполнителям', tkExecKey, function(k) { return names[k] || k; }, 'exec')
    + table('По типам', function(t) { return t.kind; }, function(k) { return k; }, 'kind')
    + table('По объектам', function(t) { return t.object_name; }, function(k) { return k; }, 'obj') + weeksHtml + '</div>'
    + '<div class="rq-hint" style="margin-top:10px;">Клик по строке или плитке — список этих задач. Перенесённые из Pyrus задачи учитываются с датами Pyrus.</div>';
}
