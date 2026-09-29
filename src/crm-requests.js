// «Тестовая страница» (/admin/j3a32zo1jzo, блок crmblock001): заявки по объектам — ремонт, эксплуатация, вопросы
// арендаторов, расторжения, платежи, проверки. Тестовый контур CRM; коллекции — scripts/setup_crm_requests.py.
// Процесс (решения владельца 28.09): Новая → В работе → Ждёт → Выполнена (на проверке) → Закрыта автором (или сама через 3 дня),
// + Отменена. Срок по срочности: обычная 5 рабочих дней, срочно 1, авария — сегодня. Ответственный по умолчанию —
// управляющий объекта. Напоминания, эскалация старшему управляющему (3 дня просрочки), автозакрытие и сводка по
// понедельникам — scripts/request_reminders.py на сервере. Уведомления из интерфейса — очередь request_notifications.
if (!document.getElementById('crm-req-style')) {
  const st = document.createElement('style');
  st.id = 'crm-req-style';
  st.textContent = `
    #crm-req { color:#1f1f1f; font-size:14px; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    #crm-req .rq-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    #crm-req .rq-title { font-size:18px; font-weight:700; margin-right:6px; }
    #crm-req .rq-tabs { display:flex; gap:4px; background:#f5f5f5; border-radius:8px; padding:3px; }
    #crm-req .rq-tab { border:none; background:transparent; padding:5px 12px; border-radius:6px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    #crm-req .rq-tab.on { background:#fff; color:#1f1f1f; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
    #crm-req .rq-new { margin-left:auto; border:none; background:#1677ff; color:#fff; border-radius:6px; padding:8px 16px; font:inherit; font-size:13.5px; font-weight:600; cursor:pointer; }
    #crm-req .rq-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
    #crm-req .rq-chip { border:1px solid #d9d9d9; background:#fff; border-radius:14px; padding:3px 12px; font:inherit; font-size:13px; cursor:pointer; color:#434343; }
    #crm-req .rq-chip b { font-variant-numeric:tabular-nums; margin-left:4px; }
    #crm-req .rq-chip.on { border-color:#1677ff; background:#e6f4ff; color:#0958d9; font-weight:600; }
    #crm-req .rq-chip.bad b { color:#cf1322; }
    #crm-req .rq-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
    #crm-req select, #crm-req input[type=text], #crm-req input[type=date], #crm-req textarea, .rq-modal select, .rq-modal input[type=text], .rq-modal input[type=date], .rq-modal textarea {
      border:1px solid #d9d9d9; border-radius:6px; padding:6px 10px; font:inherit; font-size:13.5px; background:#fff; color:#262626; box-sizing:border-box; }
    #crm-req .rq-filters select, #crm-req .rq-filters input { min-width:150px; }
    #crm-req .rq-list { display:flex; flex-direction:column; gap:8px; }
    #crm-req .rq-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; border:1px solid #f0f0f0; border-left:4px solid var(--c); border-radius:8px; padding:10px 14px; background:#fff; cursor:pointer; }
    #crm-req .rq-row:hover { border-color:#91caff; border-left-color:var(--c); }
    #crm-req .rq-row-title { font-weight:600; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #crm-req .rq-row-sub { font-size:12.5px; color:#8c8c8c; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #crm-req .rq-row-side { text-align:right; font-size:12.5px; white-space:nowrap; }
    .rq-pill { display:inline-block; padding:1px 8px; border-radius:10px; font-size:12px; font-weight:600; border:1px solid; white-space:nowrap; }
    .rq-late { color:#cf1322; font-weight:600; }
    #crm-req .rq-empty { color:#bfbfbf; padding:24px 0; text-align:center; }
    /* статистика */
    #crm-req .rq-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
    #crm-req .rq-tile { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; }
    #crm-req .rq-tile-l { font-size:12px; color:#8c8c8c; }
    #crm-req .rq-tile-v { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px; }
    #crm-req .rq-tile-n { font-size:12px; color:#8c8c8c; margin-top:2px; }
    #crm-req .rq-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(540px, 1fr)); gap:12px; }
    #crm-req .rq-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; overflow-x:auto; }
    #crm-req .rq-card-t { font-weight:600; margin-bottom:8px; }
    #crm-req table { width:100%; border-collapse:collapse; font-size:13px; }
    #crm-req th { text-align:left; font-weight:600; color:#595959; padding:6px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    #crm-req td { padding:6px 8px; border-bottom:1px solid #f5f5f5; font-variant-numeric:tabular-nums; }
    #crm-req th.n, #crm-req td.n { text-align:right; }
    #crm-req tr[data-go] { cursor:pointer; }
    #crm-req tr[data-go]:hover td { background:#f5faff; }
    /* модальные окна */
    .rq-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
    .rq-box { background:#fff; border-radius:10px; width:100%; max-width:760px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f1f1f; }
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
    .rq-ev a { color:#1677ff; cursor:pointer; }
    .rq-comment { display:flex; gap:8px; margin-top:10px; align-items:flex-start; }
    .rq-comment textarea { flex:1; min-height:38px; resize:vertical; }
    @media (max-width: 700px) {
      #crm-req .rq-new { margin-left:0; width:100%; padding:11px; font-size:15px; }
      #crm-req .rq-filters select, #crm-req .rq-filters input { flex:1 1 45%; min-width:0; }
      #crm-req .rq-row { grid-template-columns:1fr; }
      #crm-req .rq-row-side { text-align:left; }
      #crm-req .rq-grid2 { grid-template-columns:1fr; }
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

const RQ_PAGE = '/admin/j3a32zo1jzo';   // «Тестовая страница» — тестовый контур CRM
const RQ_ST = {
  new: { l: 'Новая', c: '#1677ff' }, in_work: { l: 'В работе', c: '#d48806' }, waiting: { l: 'Ждёт', c: '#722ed1' },
  done: { l: 'Выполнена — на проверке', c: '#13a8a8' }, closed: { l: 'Закрыта', c: '#389e0d' }, cancelled: { l: 'Отменена', c: '#8c8c8c' }
};
const RQ_OPEN = ['new', 'in_work', 'waiting'];
const RQ_URG = { normal: { l: 'Обычная', d: 5, c: '#595959', hint: '5 рабочих дней' }, urgent: { l: 'Срочно', d: 1, c: '#d46b08', hint: '1 рабочий день' }, emergency: { l: 'Авария', d: 0, c: '#cf1322', hint: 'сегодня, сразу уведомление старшему управляющему' } };
const RQ_KINDS = ['Ремонт и эксплуатация', 'Вопрос арендатора', 'Расторжение и выезд', 'Платёж, долг, штраф', 'Проверка, пожарная безопасность', 'Коммуналка, счётчики', 'Прочее'];
const RQ_WAIT = ['ответа арендатора', 'подрядчика', 'оплаты', 'согласования руководства', 'другое'];
const rq = { data: null, me: null, tab: 'list', quick: 'open', obj: '', kind: '', resp: '', q: '' };

function rqEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function rqToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function rqRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function rqIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function rqToday() { return rqIso(new Date()); }
function rqDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function rqDateTime(v) { if (!v) return ''; const d = new Date(v); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function rqDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
// ponytail: только выходные, праздники не учитываются — добавить производственный календарь, если сроки начнут спорить
function rqAddWorkDays(n) {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) i++; }
  return rqIso(d);
}
function rqUser(id) { const u = rq.data && rq.data.users[id]; return u ? (u.nickname || u.username) : (id ? '#' + id : 'Система'); }
function rqIsAdmin() { return !!(rq.me && rq.me.__isAdmin); }
function rqLate(r) { return RQ_OPEN.indexOf(r.status) !== -1 && r.due_date && String(r.due_date).slice(0, 10) < rqToday(); }
function rqPill(s) { const x = RQ_ST[s] || { l: s, c: '#8c8c8c' }; return '<span class="rq-pill" style="color:' + x.c + ';border-color:' + x.c + '55;background:' + x.c + '10;">' + rqEsc(x.l) + '</span>'; }
function rqNoun(n, a, b, c) { const x = Math.abs(n) % 100, y = x % 10; return (x > 10 && x < 20) ? c : y === 1 ? a : (y >= 2 && y <= 4) ? b : c; }
function rqMedian(a) { if (!a.length) return null; const s = a.slice().sort(function(x, y) { return x - y; }); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

async function rqMe() {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + rqToken() } });
  const u = ((await res.json()) || {}).data || null;
  if (u) { const n = (u.roles || []).map(function(r) { return r.name; }); u.__isAdmin = n.indexOf('admin') !== -1 || n.indexOf('root') !== -1; }
  return u;
}
async function rqLoad() {
  const all = await Promise.all([
    ctx.api.resource('object_requests').list({ paginate: false, sort: ['-id'] }),
    ctx.api.resource('users').list({ paginate: false, fields: ['id', 'nickname', 'username'] }),
    ctx.api.resource('contract_objects').list({ paginate: false, sort: ['name'] }),
    ctx.api.resource('rental_contracts').list({ paginate: false, fields: ['id', 'contract_number', 'tenant_name', 'object_name'] }).catch(function() { return null; })
  ]);
  const users = {};
  rqRows(all[1]).forEach(function(u) { if (u.username !== 'mail-service') users[u.id] = u; });
  rq.data = { reqs: rqRows(all[0]), users: users, objects: rqRows(all[2]), contracts: rqRows(all[3]) };
}
function rqObj(name) { return (rq.data.objects || []).find(function(o) { return o.name === name; }) || null; }
function rqNotify(userId, title, text, reqId) {
  if (!userId || (rq.me && Number(userId) === Number(rq.me.id))) return;
  ctx.api.resource('request_notifications').create({ values: { user_id: Number(userId), title: title, text: text, url: RQ_PAGE + '?open=req:' + reqId } }).catch(function() { /* уведомление не должно ломать действие */ });
}
function rqEvent(reqId, kind, text, fileId) {
  return ctx.api.resource('request_events').create({ values: { request_id: reqId, author_id: rq.me.id, kind: kind, text: text || '', file_id: fileId || null } });
}
async function rqUpload(file) {
  const boundary = '----rqBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + rqToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const id = (((await res.json()) || {}).data || {}).id;
  if (!id) throw new Error('upload');
  return id;
}
function rqToast(t) {
  const el = document.createElement('div');
  el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1100;max-width:90vw;';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2800);
}

// ---------- страница ----------
ctx.render('<div id="crm-req"><div class="rq-empty">Загрузка…</div></div>');
function rqRoot() { return (ctx.element && ctx.element.querySelector('#crm-req')) || document.getElementById('crm-req'); }
async function rqStart() {
  try {
    rq.me = await rqMe();
    await rqLoad();
    rqRender();
    const m = location.search.match(/[?&]open=req:(\d+)/);
    if (m) { rqOpenCard(Number(m[1])); try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ } }
  } catch (e) {
    rqRoot().innerHTML = '<div class="rq-empty" style="color:#cf1322;">Не удалось загрузить заявки</div>';
  }
}
async function rqReload() { await rqLoad(); rqRender(); }
rqRoot().addEventListener('click', rqOnClick);
rqRoot().addEventListener('change', rqOnChange);
rqRoot().addEventListener('input', function(e) { if (e.target.getAttribute('data-f') === 'q') { rq.q = e.target.value; rqRenderList(); } });
rqStart();

function rqRender() {
  const tabs = [['list', 'Заявки'], ['stats', 'Статистика']].concat(rqIsAdmin() ? [['objects', 'Управляющие объектов']] : []);
  rqRoot().innerHTML = '<div class="rq-head"><div class="rq-title">Заявки по объектам</div><div class="rq-tabs">'
    + tabs.map(function(t) { return '<button class="rq-tab' + (rq.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('')
    + '</div><button class="rq-new" data-act="new">+ Новая заявка</button></div><div id="rq-body"></div>';
  if (rq.tab === 'list') rqRenderListShell();
  else if (rq.tab === 'stats') rqRenderStats();
  else rqRenderObjects();
}

// ---------- список ----------
const RQ_QUICK = [
  ['mine', 'Мои', function(r) { return RQ_OPEN.concat(['done']).indexOf(r.status) !== -1 && (Number(r.responsible_id) === rq.me.id || Number(r.author_id) === rq.me.id); }],
  ['open', 'Открытые', function(r) { return RQ_OPEN.indexOf(r.status) !== -1; }],
  ['late', 'Просроченные', rqLate],
  ['check', 'На проверке', function(r) { return r.status === 'done'; }],
  ['closed', 'Закрытые', function(r) { return r.status === 'closed' || r.status === 'cancelled'; }],
  ['all', 'Все', function() { return true; }]
];
function rqRenderListShell() {
  const d = rq.data;
  const objs = d.objects.map(function(o) { return o.name; });
  const people = Object.keys(d.users).map(Number).filter(function(id) { return d.reqs.some(function(r) { return Number(r.responsible_id) === id; }); });
  document.getElementById('rq-body').innerHTML = '<div class="rq-chips" id="rq-chips"></div><div class="rq-filters">'
    + '<select data-f="obj"><option value="">Все объекты</option>' + objs.map(function(o) { return '<option' + (rq.obj === o ? ' selected' : '') + '>' + rqEsc(o) + '</option>'; }).join('') + '</select>'
    + '<select data-f="kind"><option value="">Все типы</option>' + RQ_KINDS.map(function(k) { return '<option' + (rq.kind === k ? ' selected' : '') + '>' + rqEsc(k) + '</option>'; }).join('') + '</select>'
    + '<select data-f="resp"><option value="">Все ответственные</option>' + people.map(function(id) { return '<option value="' + id + '"' + (String(rq.resp) === String(id) ? ' selected' : '') + '>' + rqEsc(rqUser(id)) + '</option>'; }).join('') + '</select>'
    + '<input type="text" data-f="q" placeholder="Поиск: суть, арендатор, номер" value="' + rqEsc(rq.q) + '">'
    + '</div><div class="rq-list" id="rq-list"></div>';
  rqRenderList();
}
function rqFiltered(skipQuick) {
  const q = rq.q.trim().toLowerCase();
  return rq.data.reqs.filter(function(r) {
    if (rq.obj && r.object_name !== rq.obj) return false;
    if (rq.kind && r.kind !== rq.kind) return false;
    if (rq.resp && String(r.responsible_id) !== String(rq.resp)) return false;
    if (q && [r.title, r.tenant_label, r.object_name, '№' + r.id, String(r.id)].join(' ').toLowerCase().indexOf(q) === -1) return false;
    if (!skipQuick) { const qf = RQ_QUICK.find(function(x) { return x[0] === rq.quick; }); if (qf && !qf[2](r)) return false; }
    return true;
  });
}
function rqRenderList() {
  const base = rqFiltered(true);
  document.getElementById('rq-chips').innerHTML = RQ_QUICK.map(function(x) {
    const n = base.filter(x[2]).length;
    return '<button class="rq-chip' + (rq.quick === x[0] ? ' on' : '') + (x[0] === 'late' && n ? ' bad' : '') + '" data-quick="' + x[0] + '">' + x[1] + '<b>' + n + '</b></button>';
  }).join('');
  const rows = rqFiltered(false).sort(function(a, b) {   // сначала аварии и просрочка, потом по сроку
    const w = function(r) { return (r.urgency === 'emergency' && RQ_OPEN.indexOf(r.status) !== -1 ? 0 : rqLate(r) ? 1 : 2); };
    return w(a) - w(b) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')) || b.id - a.id;
  });
  document.getElementById('rq-list').innerHTML = rows.length ? rows.map(rqRowHtml).join('')
    : '<div class="rq-empty">' + (rq.data.reqs.length ? 'Под фильтр ничего не попало' : 'Заявок пока нет — нажмите «+ Новая заявка»') + '</div>';
}
function rqRowHtml(r) {
  const late = rqLate(r), open = RQ_OPEN.indexOf(r.status) !== -1, u = RQ_URG[r.urgency] || RQ_URG.normal;
  const due = r.due_date ? (late ? '<span class="rq-late">просрочено на ' + rqDays(String(r.due_date).slice(0, 10), rqToday()) + ' дн. (срок ' + rqDate(r.due_date) + ')</span>' : 'срок ' + rqDate(r.due_date)) : '';
  return '<div class="rq-row" data-open="' + r.id + '" style="--c:' + (r.urgency === 'emergency' && open ? '#cf1322' : (RQ_ST[r.status] || {}).c || '#d9d9d9') + ';">'
    + '<div style="min-width:0;"><div class="rq-row-title">' + ((r.urgency === 'urgent' || r.urgency === 'emergency') && open ? '<span style="color:' + u.c + ';">' + (r.urgency === 'emergency' ? '⚠ ' : '') + rqEsc(u.l) + ' · </span>' : '') + rqEsc(r.title || 'Без названия') + '</div>'
    + '<div class="rq-row-sub">' + (r.demo ? '<span class="rq-pill" style="color:#8c8c8c;border-color:#d9d9d9;margin-right:6px;">демо</span>' : '') + '№' + r.id + ' · ' + rqEsc([r.object_name, r.tenant_label, r.kind].filter(Boolean).join(' · ')) + '</div></div>'
    + '<div class="rq-row-side">' + rqPill(r.status) + (r.status === 'waiting' && r.wait_reason ? ' <span style="color:#722ed1;">ждём ' + rqEsc(r.wait_reason) + '</span>' : '')
    + '<div style="margin-top:3px;color:#595959;">' + rqEsc(rqUser(r.responsible_id)) + (open && due ? ' · ' + due : '') + '</div></div></div>';
}

function rqOnChange(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'obj' || f === 'kind' || f === 'resp') { rq[f] = e.target.value; rqRenderList(); }
  const om = e.target.getAttribute('data-objset');
  if (om) rqSaveObjectPerson(e.target, om);
}
function rqOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const tab = c('[data-tab]');
  if (tab) { rq.tab = tab.getAttribute('data-tab'); rqRender(); return; }
  if (c('[data-act="new"]')) { rqOpenNew(); return; }
  const qk = c('[data-quick]');
  if (qk) { rq.quick = qk.getAttribute('data-quick'); rqRenderList(); return; }
  const go = c('[data-go]');
  if (go) {   // из статистики — в список с фильтром
    const p = JSON.parse(go.getAttribute('data-go'));
    rq.obj = p.obj || ''; rq.kind = p.kind || ''; rq.resp = p.resp || ''; rq.quick = p.quick || 'open'; rq.q = ''; rq.tab = 'list';
    rqRender(); return;
  }
  const op = c('[data-open]');
  if (op) rqOpenCard(Number(op.getAttribute('data-open')));
}

// ---------- новая заявка ----------
function rqModal(html) {
  const m = document.createElement('div');
  m.className = 'rq-modal';
  m.innerHTML = '<div class="rq-box">' + html + '</div>';
  m.addEventListener('click', function(e) { if (e.target === m || (e.target.closest && e.target.closest('.rq-x'))) m.remove(); });
  document.body.appendChild(m);
  return m;
}
function rqPeopleOptions(sel) {
  return Object.keys(rq.data.users).map(Number).sort(function(a, b) { return rqUser(a).localeCompare(rqUser(b), 'ru'); })
    .map(function(id) { return '<option value="' + id + '"' + (Number(sel) === id ? ' selected' : '') + '>' + rqEsc(rqUser(id)) + '</option>'; }).join('');
}
function rqOpenNew() {
  const d = rq.data;
  const m = rqModal('<div class="rq-box-h"><div class="rq-box-t">Новая заявка</div><button class="rq-x">✕</button></div><div class="rq-box-b"><div class="rq-form">'
    + '<div class="rq-f"><label>Объект *</label><select data-n="object_name"><option value="">Выберите объект</option>' + d.objects.map(function(o) { return '<option' + (rq.obj === o.name ? ' selected' : '') + '>' + rqEsc(o.name) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Договор / арендатор</label><select data-n="contract_id"><option value="">— не по договору —</option></select></div>'
    + '<div class="rq-f"><label>Тип *</label><select data-n="kind"><option value="">Выберите тип</option>' + RQ_KINDS.map(function(k) { return '<option>' + rqEsc(k) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Срочность</label><div class="rq-seg" data-n="urgency">' + Object.keys(RQ_URG).map(function(k) { return '<button type="button" data-urg="' + k + '" style="--c:' + (k === 'normal' ? '#1677ff' : RQ_URG[k].c) + ';"' + (k === 'normal' ? ' class="on"' : '') + '>' + RQ_URG[k].l + '</button>'; }).join('') + '</div><div class="rq-hint" data-urg-hint>Срок: ' + RQ_URG.normal.hint + '</div></div>'
    + '<div class="rq-f full"><label>Суть *</label><input type="text" data-n="title" placeholder="Коротко: что случилось или что нужно сделать"></div>'
    + '<div class="rq-f full"><label>Подробности</label><textarea data-n="description" placeholder="Где, что, контакты арендатора, что уже сделано"></textarea></div>'
    + '<div class="rq-f"><label>Ответственный</label><select data-n="responsible_id"><option value="">—</option>' + rqPeopleOptions(rq.me.id) + '</select><div class="rq-hint" data-resp-hint></div></div>'
    + '<div class="rq-f"><label>Срок</label><input type="date" data-n="due_date" min="2000-01-01" max="2099-12-31" value="' + rqAddWorkDays(5) + '"></div>'
    + '<div class="rq-f full"><label>Фото или файл</label><input type="file" data-n="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"></div>'
    + '</div><div class="rq-actions"><button class="rq-btn pri" data-save>Создать заявку</button><button class="rq-btn rq-x">Отмена</button></div></div>');
  const q = function(n) { return m.querySelector('[data-n="' + n + '"]'); };
  let urg = 'normal', dueTouched = false, respTouched = false;
  q('due_date').addEventListener('change', function() { dueTouched = true; });
  q('responsible_id').addEventListener('change', function() { respTouched = true; });
  function onObject() {   // договоры объекта и управляющий по умолчанию
    const name = q('object_name').value;
    q('contract_id').innerHTML = '<option value="">— не по договору —</option>' + d.contracts.filter(function(c) { return c.object_name === name; })
      .map(function(c) { return '<option value="' + c.id + '">' + rqEsc([c.contract_number, c.tenant_name].filter(Boolean).join(' · ') || ('#' + c.id)) + '</option>'; }).join('');
    const o = rqObj(name);
    const hint = m.querySelector('[data-resp-hint]');
    if (o && o.manager_user_id && !respTouched) q('responsible_id').value = String(o.manager_user_id);
    hint.textContent = o && (o.manager_name || o.manager_user_id) ? 'Управляющий объекта: ' + (o.manager_user_id ? rqUser(o.manager_user_id) : o.manager_name + ' (нет учётки в CRM)') : '';
  }
  q('object_name').addEventListener('change', onObject);
  onObject();
  m.querySelectorAll('[data-urg]').forEach(function(b) {
    b.addEventListener('click', function() {
      urg = b.getAttribute('data-urg');
      m.querySelectorAll('[data-urg]').forEach(function(x) { x.classList.toggle('on', x === b); });
      m.querySelector('[data-urg-hint]').textContent = 'Срок: ' + RQ_URG[urg].hint;
      if (!dueTouched) q('due_date').value = rqAddWorkDays(RQ_URG[urg].d);
    });
  });
  m.querySelector('[data-save]').addEventListener('click', async function(e) {
    const v = { object_name: q('object_name').value, kind: q('kind').value, title: q('title').value.trim() };
    if (!v.object_name) { rqToast('Выберите объект'); q('object_name').focus(); return; }
    if (!v.kind) { rqToast('Выберите тип'); q('kind').focus(); return; }
    if (!v.title) { rqToast('Опишите суть заявки'); q('title').focus(); return; }
    const due = q('due_date').value;
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(due)) { rqToast('Укажите срок'); q('due_date').focus(); return; }
    const cid = q('contract_id').value, c = d.contracts.find(function(x) { return String(x.id) === cid; });
    e.target.disabled = true;
    try {
      const fileId = q('file').files[0] ? await rqUpload(q('file').files[0]) : null;
      const vals = Object.assign(v, { description: q('description').value.trim(), urgency: urg, due_date: due, status: 'new', due_moved: 0,
        contract_id: c ? c.id : null, tenant_label: c ? [c.contract_number, c.tenant_name].filter(Boolean).join(' · ') : null,
        responsible_id: Number(q('responsible_id').value) || rq.me.id, author_id: rq.me.id });
      const rec = rqRows(await ctx.api.resource('object_requests').create({ values: vals }))[0];
      await rqEvent(rec.id, 'create', 'Заявка создана' + (fileId ? ', приложен файл' : ''), fileId);
      const title = 'Заявка №' + rec.id + ' · ' + vals.object_name;
      rqNotify(vals.responsible_id, title, (urg === 'emergency' ? 'АВАРИЯ: ' : urg === 'urgent' ? 'Срочно: ' : 'Новая заявка: ') + vals.title + ' (срок ' + rqDate(due) + ')', rec.id);
      const o = rqObj(vals.object_name);
      if (urg === 'emergency' && o && o.senior_user_id) rqNotify(o.senior_user_id, title, 'АВАРИЯ: ' + vals.title, rec.id);
      m.remove();
      rqToast('Заявка №' + rec.id + ' создана');
      await rqReload();
    } catch (err) { rqToast('Не удалось создать заявку'); e.target.disabled = false; }
  });
}

// ---------- карточка заявки ----------
async function rqOpenCard(id) {
  let r = rq.data.reqs.find(function(x) { return x.id === id; });
  if (!r) { try { r = rqRows(await ctx.api.resource('object_requests').get({ filterByTk: id }))[0]; } catch (e) { r = null; } }
  if (!r) { rqToast('Заявка №' + id + ' не найдена'); return; }
  const m = rqModal('<div id="rq-card"></div>');
  m.__rqId = id;
  await rqRenderCard(m, r);
}
function rqCan(r) {
  const me = rq.me.id, adm = rqIsAdmin(), resp = Number(r.responsible_id) === me || adm, auth = Number(r.author_id) === me || adm;
  const a = [];
  if (r.status === 'new' && resp) a.push(['take', 'Взять в работу', 'pri']);
  if ((r.status === 'new' || r.status === 'in_work') && resp) a.push(['wait', 'Ждём…', '']);
  if (r.status === 'waiting' && resp) a.push(['resume', 'Вернуть в работу', '']);
  if ((r.status === 'in_work' || r.status === 'waiting') && resp) a.push(['done', 'Выполнена', 'ok']);
  if (r.status === 'done' && auth) { a.push(['close', 'Принять и закрыть', 'ok']); a.push(['reopen', 'Не выполнено — вернуть', 'warn']); }
  if (RQ_OPEN.indexOf(r.status) !== -1 && (resp || auth)) { a.push(['due', 'Перенести срок', '']); a.push(['assign', 'Передать другому', '']); }
  if (RQ_OPEN.indexOf(r.status) !== -1 && auth) a.push(['cancel', 'Отменить', 'warn']);
  return a;
}
async function rqRenderCard(m, r) {
  const box = m.querySelector('#rq-card');
  const late = rqLate(r), u = RQ_URG[r.urgency] || RQ_URG.normal;
  let evs = [];
  // файл — связь file (belongsTo attachments): отдельный attachments:list в этой версии NocoBase недоступен (404)
  try { evs = rqRows(await ctx.api.resource('request_events').list({ filter: { request_id: r.id }, sort: ['createdAt'], appends: ['file'], paginate: false })); } catch (e) { evs = []; }
  box.innerHTML = '<div class="rq-box-h"><div class="rq-box-t">№' + r.id + ' · ' + rqEsc(r.title) + '<div style="margin-top:6px;font-size:13px;font-weight:400;">' + rqPill(r.status)
    + (r.status === 'waiting' && r.wait_reason ? ' <span style="color:#722ed1;">ждём ' + rqEsc(r.wait_reason) + '</span>' : '')
    + (RQ_URG[r.urgency] && r.urgency !== 'normal' ? ' <span class="rq-pill" style="color:' + u.c + ';border-color:' + u.c + '55;">' + rqEsc(u.l) + '</span>' : '') + '</div></div><button class="rq-x">✕</button></div>'
    + '<div class="rq-box-b"><div class="rq-meta">'
    + '<div><div class="l">Объект</div>' + rqEsc(r.object_name) + '</div>'
    + '<div><div class="l">Договор / арендатор</div>' + (r.contract_id ? '<a href="/admin/b5znz7yxpy3?open=active:' + r.contract_id + '" style="color:#1677ff;">' + rqEsc(r.tenant_label || '#' + r.contract_id) + '</a>' : '—') + '</div>'
    + '<div><div class="l">Тип</div>' + rqEsc(r.kind || '—') + '</div>'
    + '<div><div class="l">Срок</div>' + (RQ_OPEN.indexOf(r.status) !== -1 && late ? '<span class="rq-late">' + rqDate(r.due_date) + ', просрочено на ' + rqDays(String(r.due_date).slice(0, 10), rqToday()) + ' дн.</span>' : rqDate(r.due_date)) + (r.due_moved ? ' <span style="color:#8c8c8c;font-size:12px;">(переносили ' + r.due_moved + ' раз)</span>' : '') + '</div>'
    + '<div><div class="l">Ответственный</div>' + rqEsc(rqUser(r.responsible_id)) + '</div>'
    + '<div><div class="l">Автор</div>' + rqEsc(rqUser(r.author_id)) + ' · ' + rqDateTime(r.createdAt) + '</div>'
    + '</div>'
    + (r.description ? '<div class="rq-desc">' + rqEsc(r.description) + '</div>' : '')
    + (r.result ? '<div class="rq-desc" style="background:#f6ffed;"><b>Результат:</b> ' + rqEsc(r.result) + '</div>' : '')
    + '<div class="rq-actions">' + rqCan(r).map(function(a) { return '<button class="rq-btn ' + a[2] + '" data-a="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>'
    + '<div id="rq-actbox"></div>'
    + '<div class="rq-tl"><div style="font-weight:600;margin-bottom:4px;">Переписка и история</div>'
    + evs.map(function(x) {
        const f = x.file;
        return '<div class="rq-ev' + (x.kind === 'comment' ? '' : ' sys') + '"><div class="rq-ev-d">' + rqDateTime(x.createdAt) + '</div><div style="min-width:0;"><b style="color:#434343;">' + rqEsc(rqUser(x.author_id)) + ':</b> ' + rqEsc(x.text)
          + (f ? ' <a data-file="' + rqEsc(f.url) + '" data-fname="' + rqEsc((f.title || 'файл') + (f.extname || '')) + '">📎 ' + rqEsc((f.title || 'файл') + (f.extname || '')) + '</a>' : '') + '</div></div>';
      }).join('')
    + '<div class="rq-comment"><textarea placeholder="Комментарий…" id="rq-cmt"></textarea><input type="file" id="rq-cmt-file" style="display:none;"><button class="rq-btn" id="rq-cmt-attach" title="Приложить фото или файл">📎</button><button class="rq-btn pri" id="rq-cmt-send">Отправить</button></div>'
    + '<div id="rq-cmt-fname" class="rq-hint"></div></div></div>';
  box.querySelectorAll('[data-a]').forEach(function(b) { b.addEventListener('click', function() { rqAction(m, r, b.getAttribute('data-a')); }); });
  box.querySelectorAll('[data-file]').forEach(function(a) {
    a.addEventListener('click', async function() {
      try { const res = await fetch(a.getAttribute('data-file'), { headers: { Authorization: 'Bearer ' + rqToken() } }); window.open(URL.createObjectURL(await res.blob()), '_blank'); }
      catch (e) { rqToast('Не удалось открыть файл'); }
    });
  });
  const fin = box.querySelector('#rq-cmt-file');
  box.querySelector('#rq-cmt-attach').addEventListener('click', function() { fin.click(); });
  fin.addEventListener('change', function() { box.querySelector('#rq-cmt-fname').textContent = fin.files[0] ? 'Файл: ' + fin.files[0].name : ''; });
  box.querySelector('#rq-cmt-send').addEventListener('click', async function(e) {
    const t = box.querySelector('#rq-cmt').value.trim();
    if (!t && !fin.files[0]) return;
    e.target.disabled = true;
    try {
      const fid = fin.files[0] ? await rqUpload(fin.files[0]) : null;
      await rqEvent(r.id, 'comment', t || 'Файл', fid);
      [r.responsible_id, r.author_id].filter(function(v, i, a) { return v && a.indexOf(v) === i; })
        .forEach(function(uid) { rqNotify(uid, 'Заявка №' + r.id + ' · ' + r.object_name, rqUser(rq.me.id) + ': ' + (t || 'приложил файл'), r.id); });
      await rqRenderCard(m, r);
    } catch (err) { rqToast('Не удалось отправить'); e.target.disabled = false; }
  });
}
// действие по заявке: где нужен ввод (причина, результат, срок, кому) — встроенная форма, без окон браузера
function rqAction(m, r, a) {
  const box = m.querySelector('#rq-actbox');
  const need = {
    wait: '<label style="font-size:12.5px;color:#595959;">Чего ждём</label><select id="rq-in" style="width:100%;margin-top:4px;">' + RQ_WAIT.map(function(w) { return '<option>' + w + '</option>'; }).join('') + '</select>',
    done: '<label style="font-size:12.5px;color:#595959;">Что сделано (обязательно — увидит автор при проверке)</label><textarea id="rq-in" style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    reopen: '<label style="font-size:12.5px;color:#595959;">Что не так (обязательно)</label><textarea id="rq-in" style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    cancel: '<label style="font-size:12.5px;color:#595959;">Причина отмены (обязательно)</label><textarea id="rq-in" style="width:100%;margin-top:4px;min-height:50px;"></textarea>',
    due: '<label style="font-size:12.5px;color:#595959;">Новый срок</label><input type="date" id="rq-in" min="2000-01-01" max="2099-12-31" value="' + rqEsc(String(r.due_date || '').slice(0, 10)) + '" style="width:100%;margin-top:4px;">'
      + '<label style="font-size:12.5px;color:#595959;display:block;margin-top:8px;">Причина переноса (обязательно — видна в статистике)</label><input type="text" id="rq-in2" style="width:100%;margin-top:4px;">',
    assign: '<label style="font-size:12.5px;color:#595959;">Кому передать</label><select id="rq-in" style="width:100%;margin-top:4px;">' + rqPeopleOptions(r.responsible_id) + '</select>'
  }[a];
  if (need) {
    box.innerHTML = '<div class="rq-actbox">' + need + '<div class="rq-actions" style="margin-top:10px;"><button class="rq-btn pri" id="rq-go">Подтвердить</button><button class="rq-btn" id="rq-no">Отмена</button></div></div>';
    box.querySelector('#rq-no').addEventListener('click', function() { box.innerHTML = ''; });
    box.querySelector('#rq-go').addEventListener('click', function(e) { rqApply(m, r, a, e.target); });
    const f = box.querySelector('#rq-in'); if (f) f.focus();
  } else rqApply(m, r, a, null);
}
async function rqApply(m, r, a, btn) {
  const box = m.querySelector('#rq-actbox');
  const inp = box.querySelector('#rq-in'), inp2 = box.querySelector('#rq-in2');
  const v = inp ? inp.value.trim() : '';
  const now = new Date().toISOString();
  const title = 'Заявка №' + r.id + ' · ' + r.object_name;
  let upd = null, ev = '', notify = [];
  if (a === 'take') { upd = { status: 'in_work' }; ev = 'Взята в работу'; notify = [[r.author_id, 'Взята в работу: ' + r.title]]; }
  if (a === 'wait') { upd = { status: 'waiting', wait_reason: v }; ev = 'Ждём ' + v; notify = [[r.author_id, 'Ждём ' + v + ': ' + r.title]]; }
  if (a === 'resume') { upd = { status: 'in_work', wait_reason: null }; ev = 'Снова в работе'; }
  if (a === 'done') { if (!v) { rqToast('Напишите, что сделано'); inp.focus(); return; } upd = { status: 'done', result: v, done_at: now, wait_reason: null }; ev = 'Выполнена: ' + v; notify = [[r.author_id, 'Выполнена, проверьте и закройте: ' + r.title]]; }
  if (a === 'close') { upd = { status: 'closed', closed_at: now }; ev = 'Принята и закрыта'; notify = [[r.responsible_id, 'Закрыта автором: ' + r.title]]; }
  if (a === 'reopen') { if (!v) { rqToast('Напишите, что не так'); inp.focus(); return; } upd = { status: 'in_work', done_at: null }; ev = 'Возвращена в работу: ' + v; notify = [[r.responsible_id, 'Вернули в работу: ' + v]]; }
  if (a === 'cancel') { if (!v) { rqToast('Укажите причину'); inp.focus(); return; } upd = { status: 'cancelled', closed_at: now, result: v }; ev = 'Отменена: ' + v; notify = [[r.responsible_id, 'Отменена: ' + r.title]]; }
  if (a === 'due') {
    const reason = inp2 ? inp2.value.trim() : '';
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(v)) { rqToast('Укажите новый срок'); inp.focus(); return; }
    if (!reason) { rqToast('Укажите причину переноса'); inp2.focus(); return; }
    upd = { due_date: v, due_moved: (Number(r.due_moved) || 0) + 1, reminded_on: null, escalated_at: null };
    ev = 'Срок перенесён с ' + rqDate(r.due_date) + ' на ' + rqDate(v) + ': ' + reason;
    notify = [[r.responsible_id, 'Срок перенесён на ' + rqDate(v) + ': ' + reason], [r.author_id, 'Срок перенесён на ' + rqDate(v) + ': ' + reason]];
  }
  if (a === 'assign') {
    const to = Number(v);
    if (!to || to === Number(r.responsible_id)) { box.innerHTML = ''; return; }
    upd = { responsible_id: to, reminded_on: null, escalated_at: null };
    ev = 'Передана: ' + rqUser(r.responsible_id) + ' → ' + rqUser(to);
    notify = [[to, 'Вам передана заявка: ' + r.title + ' (срок ' + rqDate(r.due_date) + ')']];
  }
  if (!upd) return;
  if (btn) btn.disabled = true;
  try {
    await ctx.api.resource('object_requests').update({ filterByTk: r.id, values: upd });
    await rqEvent(r.id, a === 'due' ? 'due' : a === 'assign' ? 'assign' : 'status', ev);
    notify.forEach(function(n) { rqNotify(n[0], title, n[1], r.id); });
    Object.assign(r, upd);
    await rqReload();
    const fresh = rq.data.reqs.find(function(x) { return x.id === r.id; }) || r;
    await rqRenderCard(m, fresh);
  } catch (e) { rqToast('Не удалось сохранить'); if (btn) btn.disabled = false; }
}

// ---------- статистика ----------
function rqRenderStats() {
  const reqs = rq.data.reqs, today = rqToday();
  const open = reqs.filter(function(r) { return RQ_OPEN.indexOf(r.status) !== -1; });
  const since = function(n) { const d = new Date(); d.setDate(d.getDate() - n); return rqIso(d); };
  const d7 = since(7), d30 = since(30);
  const doneDays = function(list) { return list.filter(function(r) { return r.done_at && String(r.done_at).slice(0, 10) >= d30; }).map(function(r) { return rqDays(String(r.createdAt).slice(0, 10), String(r.done_at).slice(0, 10)); }); };
  const med = rqMedian(doneDays(reqs));
  const tiles = [
    ['Открыто', open.length, open.filter(rqLate).length ? '<span class="rq-late">просрочено ' + open.filter(rqLate).length + '</span>' : 'просрочек нет', { quick: 'open' }],
    ['Аварии в работе', open.filter(function(r) { return r.urgency === 'emergency'; }).length, 'срочных: ' + open.filter(function(r) { return r.urgency === 'urgent'; }).length, { quick: 'open' }],
    ['Новых за 7 дней', reqs.filter(function(r) { return String(r.createdAt).slice(0, 10) >= d7; }).length, 'за 30 дней: ' + reqs.filter(function(r) { return String(r.createdAt).slice(0, 10) >= d30; }).length, { quick: 'all' }],
    ['Выполнено за 7 дней', reqs.filter(function(r) { return r.done_at && String(r.done_at).slice(0, 10) >= d7; }).length, 'ждут проверки автором: ' + reqs.filter(function(r) { return r.status === 'done'; }).length, { quick: 'check' }],
    ['Срок выполнения', med === null ? '—' : med + ' ' + rqNoun(Math.round(med), 'день', 'дня', 'дней'), 'медиана за 30 дней', { quick: 'closed' }],
    ['Переносы срока', open.filter(function(r) { return r.due_moved > 0; }).length, 'открытых заявок, срок которых переносили', { quick: 'open' }]
  ];
  function table(title, keyFn, labelFn, goKey) {
    const g = {};
    reqs.forEach(function(r) { const k = keyFn(r); if (k === null || k === undefined || k === '') return; (g[k] = g[k] || []).push(r); });
    const rows = Object.keys(g).map(function(k) {
      const l = g[k], o = l.filter(function(r) { return RQ_OPEN.indexOf(r.status) !== -1; });
      return { k: k, open: o.length, late: o.filter(rqLate).length, em: o.filter(function(r) { return r.urgency === 'emergency'; }).length,
        done30: l.filter(function(r) { return r.done_at && String(r.done_at).slice(0, 10) >= d30; }).length, med: rqMedian(doneDays(l)) };
    }).sort(function(a, b) { return b.late - a.late || b.open - a.open || b.done30 - a.done30; });
    return '<div class="rq-card"><div class="rq-card-t">' + title + '</div>' + (rows.length ? '<table><thead><tr><th></th><th class="n">Открыто</th><th class="n">Просрочено</th><th class="n">Аварии</th><th class="n" title="Выполнено за последние 30 дней">Выполнено, 30 дн.</th><th class="n" title="Медиана дней от создания до выполнения, за 30 дней">Медиана, дн.</th></tr></thead><tbody>'
      + rows.map(function(x) { const go = {}; go[goKey] = x.k; return '<tr data-go="' + rqEsc(JSON.stringify(go)) + '"><td>' + rqEsc(labelFn(x.k)) + '</td><td class="n">' + x.open + '</td><td class="n' + (x.late ? ' rq-late' : '') + '">' + x.late + '</td><td class="n">' + (x.em || '') + '</td><td class="n">' + x.done30 + '</td><td class="n">' + (x.med === null ? '—' : x.med) + '</td></tr>'; }).join('')
      + '</tbody></table>' : '<div class="rq-empty" style="padding:8px 0;">Данных пока нет</div>') + '</div>';
  }
  // по неделям: создано / выполнено, 8 недель (понедельник — начало недели)
  const weeks = [];
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  for (let i = 7; i >= 0; i--) { const s = new Date(mon); s.setDate(s.getDate() - 7 * i); const e = new Date(s); e.setDate(e.getDate() + 7); weeks.push([rqIso(s), rqIso(e)]); }
  const inW = function(v, w) { const x = String(v || '').slice(0, 10); return x >= w[0] && x < w[1]; };
  const weeksHtml = '<div class="rq-card"><div class="rq-card-t">По неделям</div><table><thead><tr><th>Неделя с</th><th class="n">Создано</th><th class="n">Выполнено</th><th class="n">Из них в срок</th></tr></thead><tbody>'
    + weeks.map(function(w) {
        const done = reqs.filter(function(r) { return inW(r.done_at, w); });
        return '<tr><td>' + rqDate(w[0]) + '</td><td class="n">' + reqs.filter(function(r) { return inW(r.createdAt, w); }).length + '</td><td class="n">' + done.length + '</td><td class="n">' + done.filter(function(r) { return !r.due_date || String(r.done_at).slice(0, 10) <= String(r.due_date).slice(0, 10); }).length + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  document.getElementById('rq-body').innerHTML = '<div class="rq-tiles">' + tiles.map(function(t) {
      return '<div class="rq-tile" data-go="' + rqEsc(JSON.stringify(t[3])) + '" style="cursor:pointer;"><div class="rq-tile-l">' + t[0] + '</div><div class="rq-tile-v">' + t[1] + '</div><div class="rq-tile-n">' + t[2] + '</div></div>';
    }).join('') + '</div>'
    + '<div class="rq-grid2">' + table('По объектам', function(r) { return r.object_name; }, function(k) { return k; }, 'obj')
    + table('По ответственным', function(r) { return r.responsible_id; }, function(k) { return rqUser(Number(k)); }, 'resp')
    + table('По типам', function(r) { return r.kind; }, function(k) { return k; }, 'kind') + weeksHtml + '</div>'
    + '<div class="rq-hint" style="margin-top:10px;">Клик по строке или плитке — список этих заявок. Сегодня ' + rqDate(today) + '.</div>';
}

// ---------- управляющие объектов (кому по умолчанию уходят заявки и кому эскалация) ----------
function rqRenderObjects() {
  const sel = function(o, f) { return '<select data-objset="' + f + '" data-id="' + o.id + '"><option value="">— нет учётки —</option>' + rqPeopleOptions(o[f]) + '</select>'; };
  document.getElementById('rq-body').innerHTML = '<div class="rq-card"><div class="rq-card-t">Управляющие объектов</div>'
    + '<div class="rq-hint" style="margin-bottom:8px;">Управляющий получает новые заявки объекта по умолчанию и напоминания о сроках; старший управляющий — аварии, эскалации после 3 дней просрочки и сводку по понедельникам. Пока у человека нет учётки в CRM, уведомления ему не приходят.</div>'
    + '<table><thead><tr><th>Объект</th><th>Управляющий</th><th>Учётка в CRM</th><th>Старший управляющий</th><th>Учётка в CRM</th></tr></thead><tbody>'
    + rq.data.objects.map(function(o) {
        return '<tr><td>' + rqEsc(o.name) + '</td><td>' + rqEsc(o.manager_name || '—') + '</td><td>' + sel(o, 'manager_user_id') + '</td><td>' + rqEsc(o.senior_name || '—') + '</td><td>' + sel(o, 'senior_user_id') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
}
async function rqSaveObjectPerson(el, field) {
  const id = Number(el.getAttribute('data-id')), val = Number(el.value) || null;
  try {
    const values = {}; values[field] = val;
    await ctx.api.resource('contract_objects').update({ filterByTk: id, values: values });
    const o = rq.data.objects.find(function(x) { return x.id === id; }); if (o) o[field] = val;
    rqToast('Сохранено');
  } catch (e) { rqToast('Не удалось сохранить'); }
}
