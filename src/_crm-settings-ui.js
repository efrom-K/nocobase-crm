// ===== Настройки CRM (интерфейс) — общий фрагмент, подключается после src/_crm-config.js =====
// Отдельного пункта меню нет: администратор открывает настройки
//   • пунктом «Настройки CRM» в меню родной шестерёнки NocoBase (верхняя панель) — шторка поверх любой страницы;
//   • значком ⚙ в шапке модуля (Заявки, Задачи, HR, АХО, Календарь, Дашборд) — сразу справочники этого модуля;
//   • в карточке сотрудника (дашборд HR) — учётка CRM этого человека.
// Видно только администратору: класс crm-admin на <html> ставится после проверки ролей, без него значки скрыты стилями.
// Коллекции и права — scripts/setup_crm_settings.py. Каталог настроек — CRM_SETTINGS в src/_crm-config.js.
if (!document.getElementById('crm-cfg-style')) {
  const st = document.createElement('style');
  st.id = 'crm-cfg-style';
  st.textContent = `
    .crm-gear { display:none; align-items:center; justify-content:center; width:30px; height:30px; flex:none; border:1px solid #dfe3ea; border-radius:8px;
      background:#fff; color:#595959; cursor:pointer; padding:0; transition:border-color .2s, color .2s, background .2s; }
    .crm-gear:hover { border-color:#1c2d58; color:#1c2d58; background:#f3f5fa; }
    html.crm-admin .crm-gear { display:inline-flex; }
    .cs-drawer { position:fixed; inset:0; z-index:1000; display:flex; justify-content:flex-end; background:rgba(0,0,0,.35); }
    .cs-panel { width:min(1080px, 100vw); height:100%; background:#f5f7fa; display:flex; flex-direction:column; box-shadow:-6px 0 24px rgba(0,0,0,.12);
      color:#1f1f1f; font-size:14px; animation:csIn .18s ease-out; }
    @keyframes csIn { from { transform:translateX(40px); opacity:.6; } to { transform:none; opacity:1; } }
    .cs-top { background:#fff; border-bottom:1px solid #e8ebf0; padding:14px 22px 0; flex:none; }
    .cs-top-h { display:flex; align-items:center; gap:12px; }
    .cs-title { font-size:19px; font-weight:700; color:#141414; }
    .cs-sub { color:#8c8c8c; font-size:12.5px; }
    .cs-close { margin-left:auto; border:none; background:transparent; width:34px; height:34px; border-radius:8px; font-size:18px; color:#8c8c8c; cursor:pointer; }
    .cs-close:hover { background:#f0f2f5; color:#262626; }
    .cs-tabs { display:flex; gap:4px; margin-top:10px; flex-wrap:wrap; }
    .cs-tab { border:none; background:none; padding:9px 14px; font:inherit; font-size:14px; color:#595959; cursor:pointer; border-bottom:2px solid transparent; }
    .cs-tab:hover { color:#1c2d58; }
    .cs-tab.on { color:#1c2d58; border-bottom-color:#1c2d58; font-weight:600; }
    .cs-tab b { display:inline-block; min-width:18px; padding:0 5px; margin-left:6px; border-radius:9px; background:#fff1f0; color:#cf1322; font-size:11.5px; font-weight:600; }
    .cs-scroll { flex:1; overflow:auto; padding:18px 22px 40px; }
    .cs-card { border:1px solid #e3e7ee; border-radius:12px; padding:16px 18px; background:#fff; margin-bottom:14px; overflow-x:auto; }
    .cs-card-t { font-size:15px; font-weight:700; color:#141414; margin-bottom:4px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .cs-card-t small { font-weight:400; color:#8c8c8c; font-size:12.5px; }
    .cs-hint { font-size:12.5px; color:#8c8c8c; margin:2px 0 10px; line-height:1.45; }
    .cs-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
    .cs-bar input[type=text] { flex:1; min-width:240px; }
    .cs-panel input[type=text], .cs-panel input[type=number], .cs-panel input[type=password], .cs-panel input[type=time], .cs-modal input[type=text], .cs-modal input[type=number] {
      border:1px solid #d9d9d9; border-radius:8px; padding:7px 11px; font:inherit; font-size:13.5px; color:#262626; background:#fff; outline:none; }
    .cs-panel input:focus, .cs-modal input:focus { border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.1); }
    .cs-panel select, .cs-modal select { padding:7px 11px; font-size:13.5px; border-radius:8px; }
    .cs-seg { display:inline-flex; border:1px solid #d9d9d9; border-radius:8px; overflow:hidden; }
    .cs-seg button { border:none; background:#fff; padding:6px 12px; font:inherit; font-size:13px; color:#595959; cursor:pointer; }
    .cs-seg button + button { border-left:1px solid #d9d9d9; }
    .cs-seg button.on { background:#1c2d58; color:#fff; }
    .cs-people { display:flex; flex-direction:column; }
    .cs-p { display:grid; grid-template-columns:minmax(220px,1.4fr) minmax(170px,1fr) minmax(150px,1fr) auto; gap:12px; align-items:center; padding:10px 6px; border-bottom:1px solid #eef0f4; }
    .cs-p:last-child { border-bottom:none; }
    .cs-p:hover { background:#f8faff; }
    .cs-p-n { display:flex; align-items:center; gap:10px; min-width:0; }
    .cs-ava { width:34px; height:34px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:600; color:#fff; }
    .cs-p-n b { font-weight:600; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cs-p-n > div > span { display:block; font-size:12.5px; color:#8c8c8c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cs-p-a { font-size:13px; min-width:0; }
    .cs-p-a code { font-family:inherit; font-weight:600; color:#262626; }
    .cs-p-act { display:flex; gap:6px; justify-content:flex-end; flex-wrap:wrap; }
    .cs-dept { font-size:12px; font-weight:600; color:#8c8c8c; text-transform:uppercase; letter-spacing:.04em; padding:14px 6px 6px; }
    .cs-chip { display:inline-block; font-size:11.5px; padding:1px 8px; border-radius:10px; background:#f0f2f5; color:#434343; white-space:nowrap; margin:2px 4px 2px 0; }
    .cs-chip.blue { background:#eef1f8; color:#142142; } .cs-chip.red { background:#fff1f0; color:#cf1322; } .cs-chip.green { background:#f6ffed; color:#389e0d; } .cs-chip.orange { background:#fff7e6; color:#d46b08; }
    .cs-btn { border:1px solid #d9d9d9; background:#fff; border-radius:8px; padding:5px 12px; font:inherit; font-size:13px; color:#1c2d58; cursor:pointer; white-space:nowrap; }
    .cs-btn:hover { border-color:#1c2d58; background:#f3f5fa; }
    .cs-btn.pri { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    .cs-btn.pri:hover { background:#2a3f73; }
    .cs-btn.warn { color:#cf1322; } .cs-btn.warn:hover { border-color:#cf1322; background:#fff1f0; }
    .cs-btn.danger { background:#cf1322; border-color:#cf1322; color:#fff; }
    .cs-btn:disabled { opacity:.5; cursor:not-allowed; }
    .cs-mods { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
    .cs-mods button { border:1px solid #d9d9d9; background:#fff; border-radius:16px; padding:5px 14px; font:inherit; font-size:13px; cursor:pointer; color:#262626; }
    .cs-mods button.on { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    .cs-set { border:1px solid #e3e7ee; border-radius:12px; padding:14px 16px; margin-bottom:12px; background:#fff; }
    .cs-set-h { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-weight:600; font-size:14px; margin-bottom:10px; }
    .cs-set-h .cs-acts { margin-left:auto; display:flex; gap:6px; }
    .cs-li { display:flex; gap:6px; align-items:center; margin-bottom:6px; }
    .cs-li input[type=text] { flex:1; min-width:0; }
    .cs-li .lock { font-size:12px; color:#8c8c8c; width:110px; }
    .cs-ico { border:1px solid #e0e0e0; background:#fff; border-radius:8px; width:32px; height:32px; cursor:pointer; color:#595959; font-size:13px; flex:none; }
    .cs-ico:hover { border-color:#1c2d58; color:#1c2d58; }
    .cs-lab { width:100%; border-collapse:collapse; font-size:13.5px; }
    .cs-lab th { text-align:left; font-size:12.5px; font-weight:600; color:#595959; padding:6px 8px; border-bottom:1px solid #e8ebf0; }
    .cs-lab td { padding:6px 8px; }
    .cs-lab td input[type=text] { width:100%; }
    .cs-lab td input[type=number] { width:90px; }
    .cs-lab td input[type=color] { width:44px; height:32px; border:1px solid #d9d9d9; border-radius:8px; padding:2px; background:#fff; }
    .cs-kv { display:grid; grid-template-columns:minmax(220px,1fr) minmax(200px,1fr) auto; gap:10px 14px; align-items:center; }
    .cs-kv > div:first-child, .cs-kv .k { font-size:13.5px; }
    .cs-links { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:10px; }
    .cs-links a { display:block; padding:12px 14px; border:1px solid #e3e7ee; border-radius:12px; color:#1c2d58; text-decoration:none; background:#fff; font-weight:600; }
    .cs-links a:hover { border-color:#1c2d58; background:#f3f5fa; }
    .cs-links a span { display:block; color:#8c8c8c; font-size:12.5px; margin-top:3px; font-weight:400; }
    .cs-modal { position:fixed; inset:0; z-index:1010; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:48px 12px; overflow:auto; }
    .cs-box { background:#fff; border-radius:14px; width:100%; max-width:620px; box-shadow:0 10px 30px rgba(0,0,0,.18); font-size:14px; color:#1f1f1f; }
    .cs-box-h { display:flex; align-items:flex-start; gap:12px; padding:18px 22px 12px; border-bottom:1px solid #f0f0f0; font-size:17px; font-weight:700; }
    .cs-box-h small { display:block; font-size:13px; font-weight:400; color:#8c8c8c; margin-top:3px; }
    .cs-box-b { padding:16px 22px 20px; }
    .cs-x { margin-left:auto; border:none; background:transparent; font-size:18px; color:#8c8c8c; cursor:pointer; }
    .cs-f { margin-bottom:12px; } .cs-f label { display:block; font-size:12.5px; color:#595959; margin-bottom:4px; } .cs-f input[type=text] { width:100%; }
    .cs-roles label { display:inline-flex; align-items:center; gap:6px; margin:0 14px 8px 0; font-size:13.5px; cursor:pointer; }
    .cs-pass { font-family:ui-monospace,Menlo,monospace; background:#f6ffed; border:1px solid #b7eb8f; border-radius:10px; padding:12px 14px; margin:10px 0; font-size:15px; user-select:all; }
    .cs-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; align-items:center; }
    .cs-danger { margin-top:18px; padding-top:14px; border-top:1px solid #f0f0f0; }
    .cs-danger-t { font-size:12.5px; font-weight:600; color:#8c8c8c; text-transform:uppercase; letter-spacing:.04em; margin-bottom:8px; }
    .cs-empty { padding:28px; text-align:center; color:#8c8c8c; }
    .cs-acc { border:1px solid #e3e7ee; border-radius:10px; padding:10px 12px; margin:10px 0; background:#fafbfc; }
    .cs-acc-h { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:13.5px; }
    .cs-acc-h .cs-btn { margin-left:auto; }
    .cs-acc code { font-family:inherit; }
  `;
  document.head.appendChild(st);
}

const CS_SKIP_ROLES = ['root', 'mail_service'];          // не выдаются людям
const CS_SERVICE_USERS = ['mail-service'];               // служебные учётки — не сотрудники
const CS_LINKS = [
  ['/admin/hrdash01?sec=staff', 'Структура компании', 'Отделы, подчинённость, руководители, карточки сотрудников, юрлица — дашборд HR → «Сотрудники».'],
  ['/admin/settings/users-permissions/roles', 'Роли, права и меню', 'Стандартные настройки NocoBase: какие разделы видит роль и что она может менять.'],
  ['/admin/settings/users-permissions/users', 'Все пользователи NocoBase', 'Полный список учётных записей, включая служебные.'],
  ['/admin/settings/data-source-manager/main/collections', 'Таблицы и поля', 'Новое поле в договоре, заявке, сотруднике (вывести его в модуль — доработка).']
];
const CS_GEAR_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 4h7M12 4h2M2 8h2M7 8h7M2 12h9M14 12h0"/><circle cx="10.5" cy="4" r="1.5"/><circle cx="5.5" cy="8" r="1.5"/><circle cx="12.5" cy="12" r="1.5"/></svg>';
// кнопка ⚙ для шапки модуля: видна только администратору (класс crm-admin), клик ловит общий обработчик ниже
function crmSettingsGear(mod) { return '<button type="button" class="crm-gear" data-crm-settings="' + String(mod).replace(/"/g, '&quot;') + '" title="Настройки модуля «' + String(mod).replace(/"/g, '&quot;') + '»">' + CS_GEAR_SVG + '</button>'; }

const crmS = { tab: 'users', d: null, me: null, mod: '', q: '', showFired: false, group: 'dept', el: null };
function csEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function csRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function csToast(t) {
  const el = document.createElement('div'); el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1100;max-width:90vw;';
  document.body.appendChild(el); setTimeout(function() { el.remove(); }, 3200);
}
function csModal(html) {
  const m = document.createElement('div'); m.className = 'cs-modal';
  m.innerHTML = '<div class="cs-box">' + html + '</div>';
  m.addEventListener('click', function(e) { if (e.target === m || (e.target.closest && e.target.closest('.cs-x'))) m.remove(); });
  document.body.appendChild(m); return m;
}
function csErr(e) {   // текст ошибки NocoBase для человека
  const d = e && e.response && e.response.data, m = d && d.errors && d.errors[0] && d.errors[0].message;
  return m ? (/unique|exist/i.test(m) ? 'Такой логин или почта уже заняты' : m) : 'Не получилось сохранить';
}
function csPassword() {   // 12 символов без похожих (0/O, 1/l)
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint32Array(12);
  try { crypto.getRandomValues(r); } catch (e) { for (let i = 0; i < r.length; i++) r[i] = Math.floor(Math.random() * 4294967296); }
  return Array.prototype.map.call(r, function(x) { return a[x % a.length]; }).join('');
}
function csTranslit(s) {
  const t = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  return String(s || '').toLowerCase().split('').map(function(c) { return t[c] != null ? t[c] : /[a-z0-9]/.test(c) ? c : ''; }).join('');
}
function csLogin(e) { if (e.email && /@/.test(e.email)) return e.email.split('@')[0].toLowerCase(); return csTranslit((e.first_name || '')[0]) + '.' + csTranslit(e.last_name); }
function csAva(name) {
  const p = String(name || '').trim().split(/\s+/), ini = ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const c = ['#1c2d58', '#3b5998', '#13a8a8', '#d48806', '#722ed1', '#389e0d', '#c41d7f', '#08979c'][h % 8];
  return '<span class="cs-ava" style="background:' + c + ';">' + csEsc(ini.toUpperCase()) + '</span>';
}
async function csMe() {
  if (!window.__crmMe) window.__crmMe = fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + localStorage.getItem('NOCOBASE_TOKEN') } })
    .then(function(r) { return r.json(); }).then(function(j) { return (j && j.data) || null; }).catch(function() { window.__crmMe = null; return null; });
  return window.__crmMe;
}
function csIsAdmin(me) { return !!(me && (me.roles || []).some(function(r) { return r.name === 'admin' || r.name === 'root'; })); }

async function csLoad() {
  const L = function(c, p) { return ctx.api.resource(c).list(Object.assign({ paginate: false }, p || {})).then(csRows); };
  const r = await Promise.all([
    L('crm_employees', { sort: ['last_name', 'first_name'], fields: ['id', 'full_name', 'last_name', 'first_name', 'position', 'department', 'email', 'status', 'user_id'] }),
    L('users', { appends: ['roles'], fields: ['id', 'username', 'nickname', 'email'] }),
    L('roles', { fields: ['name', 'title'] }),
    L('crm_config'), L('crm_departments', { fields: ['id', 'name'], sort: ['sort', 'name'] }).catch(function() { return []; }),
    L('app_settings').catch(function() { return []; })
  ]);
  crmS.d = { emps: r[0], users: r[1], roles: r[2].filter(function(x) { return CS_SKIP_ROLES.indexOf(x.name) === -1; }), cfg: r[3], depts: r[4], app: r[5] };
  window.__crmCfg = null;   // модули перечитают настройки
}
function csUser(id) { return crmS.d.users.find(function(u) { return u.id === Number(id); }) || null; }
function csRoleTitle(n) { const r = crmS.d.roles.find(function(x) { return x.name === n; }); return r ? (r.title || n).replace(/^\{\{t\("(.+)"\)\}\}$/, '$1') : n; }
function csIsTest(u) { return !!(u && /^test\./.test(u.username || '')); }
function csCfgRow(key) { return crmS.d.cfg.find(function(x) { return x.key === key; }) || null; }
function csApp(name) { const x = crmS.d.app.find(function(a) { return a.name === name; }); return x ? x.value : null; }
function csDeptName(e) { const d = crmS.d.depts.find(function(x) { return String(x.id) === String(e.department); }); return d ? d.name : (e.department && isNaN(Number(e.department)) ? e.department : ''); }
function csRefresh() { if (crmS.el && document.body.contains(crmS.el)) csRender(); if (typeof window.__crmAfterSettings === 'function') try { window.__crmAfterSettings(); } catch (e) {} }

// ---------- шторка ----------
async function crmSettingsOpen(opts) {
  opts = opts || {};
  const me = await csMe();
  if (!csIsAdmin(me)) { csToast('Настройки CRM доступны администратору'); return; }
  crmS.me = me;
  if (opts.tab) crmS.tab = opts.tab;
  if (opts.mod) { crmS.tab = 'dict'; crmS.mod = opts.mod; }
  const old = document.querySelector('.cs-drawer'); if (old) old.remove();
  const dr = document.createElement('div'); dr.className = 'cs-drawer';
  dr.innerHTML = '<div class="cs-panel"><div class="cs-empty">Загрузка…</div></div>';
  document.body.appendChild(dr);
  crmS.el = dr.querySelector('.cs-panel');
  const close = function() { dr.remove(); document.removeEventListener('keydown', esc); };
  const esc = function(e) { if (e.key === 'Escape' && !document.querySelector('.cs-modal')) close(); };
  document.addEventListener('keydown', esc);
  dr.addEventListener('click', function(e) { if (e.target === dr || (e.target.closest && e.target.closest('.cs-close'))) close(); });
  crmS.el.addEventListener('click', csOnClick);
  crmS.el.addEventListener('input', function(e) { if (e.target.hasAttribute('data-q')) { crmS.q = e.target.value; const pos = e.target.selectionStart; csRenderUsers(); const i = crmS.el.querySelector('[data-q]'); i.focus(); i.setSelectionRange(pos, pos); } });
  crmS.el.addEventListener('change', function(e) {
    if (e.target.hasAttribute('data-fired')) { crmS.showFired = e.target.checked; csRenderUsers(); }
    const ml = e.target.getAttribute('data-mailon');
    if (ml) csSetMail(ml, e.target.checked).then(function() { csToast(e.target.checked ? 'Почта в CRM включена (в течение минуты)' : 'Почта в CRM выключена'); }).catch(function(err) { e.target.checked = !e.target.checked; csToast(csErr(err)); });
  });
  try { await csLoad(); csRender(); }
  catch (e) { crmS.el.innerHTML = '<div class="cs-empty" style="color:#cf1322;">Не удалось загрузить настройки. Обновите страницу.</div>'; }
}
function csRender() {
  const fired = crmS.d.emps.filter(function(e) { const u = csUser(e.user_id); return e.status === 'fired' && u && (u.roles || []).length; }).length;
  const t = [['users', 'Сотрудники и доступ', fired ? '<b title="Уволены, а доступ в CRM есть">' + fired + '</b>' : ''], ['dict', 'Справочники и сроки', ''], ['svc', 'Уведомления и интеграции', ''], ['links', 'Структура и права', '']];
  crmS.el.innerHTML = '<div class="cs-top"><div class="cs-top-h"><div><div class="cs-title">Настройки CRM</div><div class="cs-sub">видны только администратору · Esc — закрыть</div></div><button class="cs-close" title="Закрыть">✕</button></div>'
    + '<div class="cs-tabs">' + t.map(function(x) { return '<button class="cs-tab' + (crmS.tab === x[0] ? ' on' : '') + '" data-tab="' + x[0] + '">' + x[1] + x[2] + '</button>'; }).join('') + '</div></div>'
    + '<div class="cs-scroll" data-cs-body></div>';
  ({ users: csRenderUsers, dict: csRenderDict, svc: csRenderSvc, links: csRenderLinks })[crmS.tab]();
}
function csBody() { return crmS.el.querySelector('[data-cs-body]'); }

// ---------- сотрудники и доступ ----------
function csAccCell(e) {
  const u = csUser(e.user_id), roles = u ? (u.roles || []) : [];
  if (!u) return '<span class="cs-chip">нет учётки</span>';
  return '<code>' + csEsc(u.username) + '</code>' + (csIsTest(u) ? ' <span class="cs-chip orange">тестовая</span>' : '') + (!roles.length ? ' <span class="cs-chip">доступ отключён</span>' : '')
    + '<div>' + roles.map(function(r) { return '<span class="cs-chip blue">' + csEsc(csRoleTitle(r.name)) + '</span>'; }).join('') + '</div>';
}
function csAccActs(e) {
  const u = csUser(e.user_id);
  if (!u) return e.status === 'fired' ? '' : '<button class="cs-btn pri" data-new="' + e.id + '">Создать учётку</button><button class="cs-btn" data-link="' + e.id + '">Привязать</button>';
  return (csIsTest(u) && e.status !== 'fired' ? '<button class="cs-btn pri" data-real="' + e.id + '">Сделать рабочей</button>' : '') + '<button class="cs-btn" data-edit="' + e.id + '">Учётка…</button>';
}
function csRenderUsers() {
  const q = crmS.q.trim().toLowerCase();
  const list = crmS.d.emps.filter(function(e) {
    if (e.status === 'fired' && !crmS.showFired && !(csUser(e.user_id) && (csUser(e.user_id).roles || []).length)) return false;
    return !q || [e.full_name, e.position, csDeptName(e), e.email, (csUser(e.user_id) || {}).username].join(' ').toLowerCase().indexOf(q) !== -1;
  });
  const linked = {}; crmS.d.emps.forEach(function(e) { if (e.user_id) linked[e.user_id] = e; });
  const orphans = crmS.d.users.filter(function(u) { return !linked[u.id] && CS_SERVICE_USERS.indexOf(u.username) === -1; });
  const mailOn = csMailUsers();
  const row = function(e) {
    const u = csUser(e.user_id), roles = u ? (u.roles || []) : [];
    const warn = e.status === 'fired' && u && roles.length ? ' <span class="cs-chip red">уволен, а доступ есть</span>' : e.status === 'fired' ? ' <span class="cs-chip">уволен</span>' : '';
    const mail = e.email ? '<div style="font-size:13px;">' + csEsc(e.email) + '</div>' + (e.status !== 'fired' ? '<label class="cs-sub" style="cursor:pointer;"><input type="checkbox" data-mailon="' + csEsc(e.email) + '"' + (mailOn.indexOf(String(e.email).toLowerCase()) !== -1 ? ' checked' : '') + '> почта в CRM</label>' : '') : '<span class="cs-sub">почты нет</span>';
    return '<div class="cs-p"' + (e.status === 'fired' ? ' style="opacity:.6;"' : '') + '><div class="cs-p-n">' + csAva(e.full_name || '') + '<div style="min-width:0;"><b>' + csEsc(e.full_name) + warn + '</b><span>' + csEsc(e.position || '—') + '</span></div></div>'
      + '<div class="cs-p-a">' + csAccCell(e) + '</div><div class="cs-p-a">' + mail + '</div><div class="cs-p-act">' + csAccActs(e) + '</div></div>';
  };
  let body;
  if (!list.length) body = '<div class="cs-empty">Никого не нашли</div>';
  else if (crmS.group === 'dept' && !q) {
    const g = {}; list.forEach(function(e) { const k = csDeptName(e) || 'Без отдела'; (g[k] = g[k] || []).push(e); });
    body = Object.keys(g).sort(function(a, b) { return a === 'Без отдела' ? 1 : b === 'Без отдела' ? -1 : a.localeCompare(b, 'ru'); })
      .map(function(k) { return '<div class="cs-dept">' + csEsc(k) + ' · ' + g[k].length + '</div>' + g[k].map(row).join(''); }).join('');
  } else body = list.map(row).join('');
  const noAcc = list.filter(function(e) { return e.status !== 'fired' && !e.user_id; }).length;
  csBody().innerHTML = '<div class="cs-card"><div class="cs-card-t">Сотрудники и доступ в CRM <small>' + list.length + (noAcc ? ' · без учётки ' + noAcc : '') + '</small></div>'
    + '<div class="cs-hint">Учётка привязана к карточке сотрудника: по ней CRM знает, чьи задачи и заявки, кому слать уведомления и писать в мессенджере. Людей добавляет и увольняет HR; здесь — доступ.</div>'
    + '<div class="cs-bar"><input type="text" data-q placeholder="Найти: фамилия, логин, должность, отдел" value="' + csEsc(crmS.q) + '">'
    + '<span class="cs-seg"><button data-group="dept"' + (crmS.group === 'dept' ? ' class="on"' : '') + '>по отделам</button><button data-group="abc"' + (crmS.group === 'abc' ? ' class="on"' : '') + '>по алфавиту</button></span>'
    + '<label class="cs-sub" style="cursor:pointer;"><input type="checkbox" data-fired' + (crmS.showFired ? ' checked' : '') + '> уволенные</label></div>'
    + '<div class="cs-people">' + body + '</div></div>'
    + (orphans.length ? '<div class="cs-card"><div class="cs-card-t">Учётки без сотрудника <small>' + orphans.length + '</small></div>'
      + '<div class="cs-hint">Не привязаны к карточке (администраторы, общие и старые учётки). Привязать — кнопкой «Привязать» у сотрудника.</div><div class="cs-people">'
      + orphans.map(function(u) {
        return '<div class="cs-p"><div class="cs-p-n">' + csAva(u.nickname || u.username) + '<div style="min-width:0;"><b>' + csEsc(u.nickname || u.username) + '</b><span>' + csEsc(u.email || '') + '</span></div></div>'
          + '<div class="cs-p-a"><code>' + csEsc(u.username) + '</code><div>' + (u.roles || []).map(function(r) { return '<span class="cs-chip blue">' + csEsc(csRoleTitle(r.name)) + '</span>'; }).join('') + '</div></div><div></div>'
          + '<div class="cs-p-act"><button class="cs-btn" data-uedit="' + u.id + '">Учётка…</button></div></div>';
      }).join('') + '</div></div>' : '');
}
// кому открыта «Почта» (почтовый сервис читает список из crm_config, ключ mail.users)
function csMailUsers() { const r = csCfgRow('mail.users'); return r && Array.isArray(r.value) ? r.value.map(function(x) { return String(x).toLowerCase(); }) : []; }
async function csSetMail(email, on) {
  const cur = csMailUsers().filter(function(x) { return x !== String(email).toLowerCase(); });
  if (on) cur.push(String(email).toLowerCase());
  await csSaveKey('mail.users', cur);
  await csLoad();
}
function csRolesBox(cur) {
  return '<div class="cs-f"><label>Роли — что человек видит и может делать в CRM</label><div class="cs-roles">' + crmS.d.roles.map(function(r) {
    return '<label><input type="checkbox" value="' + csEsc(r.name) + '"' + (cur.indexOf(r.name) !== -1 ? ' checked' : '') + '> ' + csEsc(csRoleTitle(r.name)) + '</label>';
  }).join('') + '</div></div>';
}
function csPickedRoles(m) { return Array.prototype.map.call(m.querySelectorAll('.cs-roles input:checked'), function(x) { return x.value; }); }
function csShowPassword(m, title, login, pass) {
  m.querySelector('.cs-box').innerHTML = '<div class="cs-box-h">' + csEsc(title) + '<button class="cs-x">✕</button></div><div class="cs-box-b">'
    + '<div>Передайте сотруднику — пароль больше нигде не показывается (при необходимости сохраните в Vaultwarden):</div>'
    + '<div class="cs-pass">Логин: ' + csEsc(login) + '<br>Пароль: ' + csEsc(pass) + '</div>'
    + '<div class="cs-hint">Адрес входа — тот же, что у вас в браузере. Сменить пароль сотрудник может сам в профиле (значок человека справа вверху).</div>'
    + '<div class="cs-actions"><button class="cs-btn pri cs-x">Готово</button></div></div>';
}
// создать учётку (или сделать рабочей тестовую: тот же пользователь — задачи и переписка остаются)
function csOpenAccount(e, mode) {
  const u = csUser(e.user_id), real = mode === 'real';
  const m = csModal('<div class="cs-box-h"><div>' + (real ? 'Сделать учётку рабочей' : 'Новая учётка CRM') + '<small>' + csEsc(e.full_name) + '</small></div><button class="cs-x">✕</button></div><div class="cs-box-b">'
    + '<div class="cs-f"><label>Логин</label><input type="text" data-login value="' + csEsc(real || !u ? csLogin(e) : u.username) + '"></div>'
    + '<div class="cs-f"><label>Имя в CRM</label><input type="text" data-nick value="' + csEsc(((e.first_name || '') + ' ' + (e.last_name || '')).trim() || e.full_name) + '"></div>'
    + '<div class="cs-f"><label>Почта</label><input type="text" data-mail value="' + csEsc(e.email || '') + '"></div>'
    + csRolesBox(u ? (u.roles || []).map(function(r) { return r.name; }).filter(function(n) { return !real || n !== 'crm_test'; }) : [])
    + (real ? '<div class="cs-hint">Логин, имя, почта и роли станут рабочими, будет выдан новый пароль. Задачи, заявки и переписка этой учётки сохранятся.</div>' : '')
    + '<div class="cs-actions"><button class="cs-btn pri" data-save>' + (u ? 'Сохранить и выдать пароль' : 'Создать и выдать пароль') + '</button><button class="cs-btn cs-x">Отмена</button></div></div>');
  m.querySelector('[data-save]').addEventListener('click', async function(ev) {
    const b = ev.currentTarget, login = m.querySelector('[data-login]').value.trim().toLowerCase(), roles = csPickedRoles(m), pass = csPassword();
    const vals = { username: login, nickname: m.querySelector('[data-nick]').value.trim(), email: m.querySelector('[data-mail]').value.trim() || null, password: pass, roles: roles };
    if (!/^[a-z0-9._-]{3,}$/.test(login)) { csToast('Логин: латиница, цифры, точка, дефис — от 3 символов'); return; }
    if (!roles.length) { csToast('Отметьте хотя бы одну роль'); return; }
    b.disabled = true;
    try {
      let uid = u && u.id;
      if (uid) await ctx.api.resource('users').update({ filterByTk: uid, values: vals });
      else { uid = csRows(await ctx.api.resource('users').create({ values: vals }))[0].id; await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: { user_id: uid } }); }
      await csLoad(); csRefresh(); csShowPassword(m, 'Учётка готова', login, pass);
    } catch (err) { csToast(csErr(err)); b.disabled = false; }
  });
}
// учётка: роли, имя, почта, новый пароль, отвязать, отключить, удалить
function csOpenEdit(u, e) {
  const roles = (u.roles || []).map(function(r) { return r.name; }), self = u.id === (crmS.me && crmS.me.id), protectedU = u.id === 1 || roles.indexOf('root') !== -1;
  const m = csModal('<div class="cs-box-h"><div>Учётка ' + csEsc(u.username) + '<small>' + csEsc(e ? e.full_name : (u.nickname || '')) + (self ? ' · это вы' : '') + '</small></div><button class="cs-x">✕</button></div><div class="cs-box-b">'
    + '<div class="cs-f"><label>Имя в CRM</label><input type="text" data-nick value="' + csEsc(u.nickname || '') + '"></div>'
    + '<div class="cs-f"><label>Почта</label><input type="text" data-mail value="' + csEsc(u.email || '') + '"></div>'
    + csRolesBox(roles)
    + '<div class="cs-actions"><button class="cs-btn pri" data-save>Сохранить</button><button class="cs-btn" data-pass>Выдать новый пароль</button></div>'
    + (self || protectedU ? '' : '<div class="cs-danger"><div class="cs-danger-t">Закрыть доступ</div><div class="cs-actions" style="margin-top:0;">'
      + (e ? '<button class="cs-btn" data-unlink>Отвязать от сотрудника</button>' : '')
      + (roles.length ? '<button class="cs-btn warn" data-off>Отключить доступ</button>' : '')
      + '<button class="cs-btn warn" data-del>Удалить учётку</button></div>'
      + '<div class="cs-hint" style="margin-top:8px;"><b>Отключить</b> — войти будет нельзя, учётку можно включить обратно (отметить роли и выдать пароль). '
      + '<b>Удалить</b> — учётка исчезнет совсем: задачи, заявки и сообщения останутся, но без автора и исполнителя-человека. Если человек может вернуться — лучше отключить.</div></div>')
    + '</div>');
  const upd = async function(vals) {
    try { await ctx.api.resource('users').update({ filterByTk: u.id, values: vals }); await csLoad(); csRefresh(); return true; }
    catch (err) { csToast(csErr(err)); return false; }
  };
  const sure = function(b, text) { if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = text; b.classList.add('danger'); return false; };
  m.querySelector('[data-save]').addEventListener('click', async function() {
    if (self && csPickedRoles(m).indexOf('admin') === -1 && roles.indexOf('admin') !== -1) { csToast('Нельзя снять роль администратора с самого себя'); return; }
    if (await upd({ nickname: m.querySelector('[data-nick]').value.trim(), email: m.querySelector('[data-mail]').value.trim() || null, roles: csPickedRoles(m) })) { m.remove(); csToast('Сохранено'); }
  });
  m.querySelector('[data-pass]').addEventListener('click', async function() { const p = csPassword(); if (await upd({ password: p })) csShowPassword(m, 'Новый пароль', u.username, p); });
  const ul = m.querySelector('[data-unlink]');
  if (ul) ul.addEventListener('click', async function() {
    if (!sure(ul, 'Точно отвязать?')) return;
    try { await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: { user_id: null } }); await csLoad(); csRefresh(); m.remove(); csToast('Отвязано'); } catch (err) { csToast(csErr(err)); }
  });
  const off = m.querySelector('[data-off]');
  if (off) off.addEventListener('click', async function() {
    if (!sure(off, 'Точно отключить?')) return;
    if (await upd({ roles: [], password: csPassword() + csPassword() })) { m.remove(); csToast('Доступ отключён'); }
  });
  const del = m.querySelector('[data-del]');
  if (del) del.addEventListener('click', async function() {
    if (!sure(del, 'Удалить ' + u.username + ' навсегда?')) return;
    del.disabled = true;
    try {
      // сначала отвязать от всех карточек, потом удалить пользователя
      const linked = crmS.d.emps.filter(function(x) { return Number(x.user_id) === u.id; });
      for (const x of linked) await ctx.api.resource('crm_employees').update({ filterByTk: x.id, values: { user_id: null } });
      await ctx.api.resource('users').destroy({ filterByTk: u.id });
      await csLoad(); csRefresh(); m.remove(); csToast('Учётка ' + u.username + ' удалена');
    } catch (err) { csToast(csErr(err)); del.disabled = false; }
  });
}
function csOpenLink(e) {
  const linked = {}; crmS.d.emps.forEach(function(x) { if (x.user_id) linked[x.user_id] = 1; });
  const free = crmS.d.users.filter(function(u) { return !linked[u.id] && CS_SERVICE_USERS.indexOf(u.username) === -1; });
  const m = csModal('<div class="cs-box-h"><div>Привязать учётку<small>' + csEsc(e.full_name) + '</small></div><button class="cs-x">✕</button></div><div class="cs-box-b">'
    + (free.length ? '<div class="cs-f"><label>Учётка без сотрудника</label><select data-u style="width:100%;">' + free.map(function(u) { return '<option value="' + u.id + '">' + csEsc(u.username + (u.nickname ? ' — ' + u.nickname : '')) + '</option>'; }).join('') + '</select></div>'
      + '<div class="cs-actions"><button class="cs-btn pri" data-save>Привязать</button><button class="cs-btn cs-x">Отмена</button></div>'
      : '<div class="cs-empty">Свободных учёток нет — создайте новую.</div>') + '</div>');
  const sv = m.querySelector('[data-save]');
  if (sv) sv.addEventListener('click', async function() {
    try { await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: { user_id: Number(m.querySelector('[data-u]').value) } }); await csLoad(); csRefresh(); m.remove(); csToast('Привязано'); } catch (err) { csToast(csErr(err)); }
  });
}
// учётка из карточки сотрудника (дашборд HR): сразу нужное окно, без шторки
async function crmAccountOpen(empId) {
  const me = await csMe(); if (!csIsAdmin(me)) return;
  crmS.me = me;
  try { await csLoad(); } catch (e) { csToast('Не удалось загрузить учётки'); return; }
  const e = crmS.d.emps.find(function(x) { return x.id === Number(empId); }); if (!e) return;
  const u = csUser(e.user_id);
  if (!u) return csOpenAccount(e, 'new');
  return csIsTest(u) && e.status !== 'fired' ? csOpenAccount(e, 'real') : csOpenEdit(u, e);
}
// блок «Учётка CRM» для карточки сотрудника: пустая строка не админу; данные — из уже загруженных пользователей карточки
function crmAccountBox(emp, user) {
  if (!document.documentElement.classList.contains('crm-admin')) return '';
  const roles = user ? (user.roles || []) : [];
  return '<div class="cs-acc"><div class="cs-acc-h"><b>Учётка CRM</b>'
    + (user ? '<code style="font-weight:600;">' + csEsc(user.username) + '</code>' + (!user.roles ? '' : !roles.length ? '<span class="cs-chip">доступ отключён</span>' : roles.map(function(r) { return '<span class="cs-chip blue">' + csEsc(r.title ? String(r.title).replace(/^\{\{t\("(.+)"\)\}\}$/, '$1') : r.name) + '</span>'; }).join('')) : '<span class="cs-chip">нет учётки</span>')
    + '<button type="button" class="cs-btn" data-crm-account="' + emp.id + '">' + (user ? 'Управлять…' : 'Создать учётку') + '</button></div></div>';
}

// ---------- справочники и сроки ----------
function csMods() { const o = []; Object.keys(CRM_SETTINGS).forEach(function(k) { if (o.indexOf(CRM_SETTINGS[k].m) === -1) o.push(CRM_SETTINGS[k].m); }); return o; }
function csCur(key) { const r = csCfgRow(key); return crmCfgValue(CRM_SETTINGS[key], r ? r.value : null); }
function csEditor(key) {
  const s = CRM_SETTINGS[key], v = csCur(key);
  if (s.type === 'list') {
    const fixed = s.fixed || 0;
    return '<div data-list>' + v.map(function(x, i) {
      return i < fixed ? '<div class="cs-li"><input type="text" value="' + csEsc(x) + '" disabled><span class="lock">в логике модуля</span></div>'
        : '<div class="cs-li" data-item><input type="text" value="' + csEsc(x) + '"><button class="cs-ico" data-up title="Выше">↑</button><button class="cs-ico" data-down title="Ниже">↓</button><button class="cs-ico" data-rm title="Убрать">✕</button></div>';
    }).join('') + '</div><button class="cs-btn" data-add>+ Вариант</button>'
      + '<div class="cs-hint" style="margin-top:8px;">Созданные записи сохранят свой вариант; список влияет на новые и изменяемые записи и на фильтры.</div>';
  }
  if (s.type === 'labels') {
    return '<table class="cs-lab"><thead><tr>' + s.fields.map(function(f) { return '<th>' + csEsc(f[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' + Object.keys(v).map(function(k) {
      return '<tr data-lk="' + csEsc(k) + '">' + s.fields.map(function(f) {
        const x = typeof v[k] === 'object' ? v[k][f[0]] : v[k];
        return '<td>' + (f[2] === 'color' ? '<input type="color" data-lf="' + f[0] + '" value="' + csEsc(/^#[0-9a-f]{6}$/i.test(x) ? x : '#595959') + '">'
          : '<input type="' + (f[2] === 'num' ? 'number' : 'text') + '" data-lf="' + f[0] + '" value="' + csEsc(x) + '"' + (f[2] === 'num' ? ' min="0"' : '') + '>') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table><div class="cs-hint" style="margin-top:8px;">Набор строк постоянный — на нём держится логика модуля; меняются названия, сроки и цвета.</div>';
  }
  if (s.type === 'number') return '<input type="number" data-val min="' + (s.min || 0) + '" value="' + csEsc(v) + '" style="width:120px;">';
  if (s.type === 'numlist') return '<input type="text" data-val value="' + csEsc(v.join(', ')) + '" style="width:220px;">';
  if (s.type === 'dept') return '<select data-val>' + (crmS.d.depts.some(function(d) { return d.name === v; }) ? '' : '<option selected>' + csEsc(v) + '</option>') + crmS.d.depts.map(function(d) { return '<option' + (d.name === v ? ' selected' : '') + '>' + csEsc(d.name) + '</option>'; }).join('') + '</select>';
  return '<input type="text" data-val value="' + csEsc(v) + '" style="width:100%;">';
}
function csRead(box, key) {
  const s = CRM_SETTINGS[key];
  if (s.type === 'list') {
    const out = Array.prototype.map.call(box.querySelectorAll('[data-item] input'), function(i) { return i.value.trim(); }).filter(Boolean);
    if (!out.length && !s.fixed) return 'Нужен хотя бы один вариант';
    if (out.some(function(x, i) { return out.indexOf(x) !== i; })) return 'Варианты повторяются';
    return out;
  }
  if (s.type === 'labels') {
    const o = {};
    box.querySelectorAll('[data-lk]').forEach(function(tr) {
      const k = tr.getAttribute('data-lk'); o[k] = {};
      tr.querySelectorAll('[data-lf]').forEach(function(i) { const f = i.getAttribute('data-lf'), d = s.fields.find(function(x) { return x[0] === f; }); o[k][f] = d[2] === 'num' ? Number(i.value || 0) : i.value.trim(); });
      if (typeof s.v[k] === 'string') o[k] = o[k]._;
    });
    return o;
  }
  const x = box.querySelector('[data-val]').value.trim();
  if (s.type === 'number') return x === '' || isNaN(Number(x)) || Number(x) < (s.min || 0) ? 'Нужно число' + (s.min ? ' от ' + s.min : '') : Number(x);
  if (s.type === 'numlist') { const n = x.split(/[\s,;]+/).filter(Boolean).map(Number); return !n.length || n.some(function(y) { return !(y > 0); }) ? 'Нужны числа больше нуля через запятую' : n; }
  return x;
}
function csRenderDict() {
  const mods = csMods(); if (!crmS.mod || mods.indexOf(crmS.mod) === -1) crmS.mod = mods[0];
  const keys = Object.keys(CRM_SETTINGS).filter(function(k) { return CRM_SETTINGS[k].m === crmS.mod; });
  csBody().innerHTML = '<div class="cs-mods">' + mods.map(function(m) { const n = Object.keys(CRM_SETTINGS).filter(function(k) { return CRM_SETTINGS[k].m === m && csCfgRow(k); }).length; return '<button data-mod="' + csEsc(m) + '"' + (m === crmS.mod ? ' class="on"' : '') + '>' + csEsc(m) + (n ? ' · ' + n : '') + '</button>'; }).join('') + '</div>'
    + keys.map(function(k) {
      const r = csCfgRow(k);
      return '<div class="cs-set" data-key="' + csEsc(k) + '"><div class="cs-set-h">' + csEsc(CRM_SETTINGS[k].t) + (r ? ' <span class="cs-chip orange">изменено' + (r.updated_by ? ' · ' + csEsc(r.updated_by) : '') + '</span>' : '')
        + '<span class="cs-acts">' + (r ? '<button class="cs-btn" data-reset>По умолчанию</button>' : '') + '<button class="cs-btn pri" data-savekey>Сохранить</button></span></div>' + csEditor(k) + '</div>';
    }).join('');
}
async function csSaveKey(key, value) {
  const r = csCfgRow(key), by = crmS.me ? (crmS.me.nickname || crmS.me.username) : '';
  if (r) await ctx.api.resource('crm_config').update({ filterByTk: r.id, values: { value: value, updated_by: by } });
  else await ctx.api.resource('crm_config').create({ values: { key: key, value: value, updated_by: by } });
}

// ---------- уведомления и интеграции: app_settings (их читают серверные скрипты) ----------
const CS_APP = [
  ['aho_approver_user_id', 'Кто согласует счета АХО', 'user'],
  ['skud_work_start', 'СКУД: начало рабочего дня (опоздание — после него)', 'time'],
  ['skud_grace_min', 'СКУД: допустимое опоздание, минут', 'num'],
  ['dadata_token', 'Ключ DaData (поиск компаний по ИНН в договорах)', 'secret']
];
function csNotifyIds() { const r = csCfgRow('notify.admins'); return r && Array.isArray(r.value) ? r.value.map(Number) : [2]; }
function csRenderSvc() {
  const people = crmS.d.users.filter(function(u) { return (u.roles || []).length && CS_SERVICE_USERS.indexOf(u.username) === -1; });
  csBody().innerHTML = '<div class="cs-card"><div class="cs-card-t">Параметры модулей и интеграций</div><div class="cs-hint">Их используют согласование счетов АХО, СКУД и проверка контрагентов по ИНН.</div><div class="cs-kv">'
    + CS_APP.map(function(f) {
      const v = csApp(f[0]); let inp;
      if (f[2] === 'user') inp = '<select data-app="' + f[0] + '"><option value="">— не назначен —</option>' + people.map(function(u) { return '<option value="' + u.id + '"' + (String(u.id) === String(v) ? ' selected' : '') + '>' + csEsc((u.nickname || u.username)) + '</option>'; }).join('') + '</select>';
      else if (f[2] === 'time') inp = '<input type="time" data-app="' + f[0] + '" value="' + csEsc(v || '') + '">';
      else if (f[2] === 'num') inp = '<input type="number" min="0" data-app="' + f[0] + '" value="' + csEsc(v || '') + '" style="width:120px;">';
      else inp = '<input type="password" data-app="' + f[0] + '" value="' + csEsc(v || '') + '" style="width:100%;" autocomplete="off">';
      return '<div class="k">' + csEsc(f[1]) + '</div><div>' + inp + '</div><div><button class="cs-btn" data-appsave="' + f[0] + '">Сохранить</button></div>';
    }).join('') + '</div></div>'
    + '<div class="cs-card"><div class="cs-card-t">Кому сообщать о сбоях</div><div class="cs-hint">Бэкап CRM не сделался, выкладка обновления не прошла — уведомление в колокольчик этим людям.</div>'
    + '<div class="cs-roles" data-notify>' + people.filter(function(u) { return (u.roles || []).some(function(r) { return r.name === 'admin' || r.name === 'root'; }) || csNotifyIds().indexOf(u.id) !== -1; }).map(function(u) {
        return '<label><input type="checkbox" value="' + u.id + '"' + (csNotifyIds().indexOf(u.id) !== -1 ? ' checked' : '') + '> ' + csEsc(u.nickname || u.username) + '</label>';
      }).join('') + '</div><div class="cs-actions"><button class="cs-btn pri" data-notifysave>Сохранить</button></div></div>';
}
async function csSaveApp(name, value) {
  const x = crmS.d.app.find(function(a) { return a.name === name; });
  if (x) await ctx.api.resource('app_settings').update({ filterByTk: x.id, values: { value: value } });
  else await ctx.api.resource('app_settings').create({ values: { name: name, value: value } });
}
function csRenderLinks() {
  csBody().innerHTML = '<div class="cs-links">' + CS_LINKS.map(function(l) { return '<a href="' + l[0] + '">' + csEsc(l[1]) + '<span>' + csEsc(l[2]) + '</span></a>'; }).join('') + '</div>';
}

// ---------- события шторки ----------
function csOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const tab = c('[data-tab]'); if (tab) { crmS.tab = tab.getAttribute('data-tab'); csRender(); return; }
  if (c('.cs-links a')) { const dr = document.querySelector('.cs-drawer'); if (dr) dr.remove(); return; }   // переход по ссылке — шторку закрыть
  const g = function(s) { const x = c('[' + s + ']'); return x ? x.getAttribute(s) : null; };
  const emp = function(id) { return crmS.d.emps.find(function(x) { return x.id === Number(id); }); };
  let id;
  if ((id = g('data-group'))) { crmS.group = id; csRenderUsers(); return; }
  if ((id = g('data-new'))) return csOpenAccount(emp(id), 'new');
  if ((id = g('data-real'))) return csOpenAccount(emp(id), 'real');
  if ((id = g('data-link'))) return csOpenLink(emp(id));
  if ((id = g('data-edit'))) { const x = emp(id); return csOpenEdit(csUser(x.user_id), x); }
  if ((id = g('data-uedit'))) return csOpenEdit(csUser(id), null);
  const mod = c('[data-mod]'); if (mod) { crmS.mod = mod.getAttribute('data-mod'); csRenderDict(); return; }
  const set = c('[data-key]'), key = set && set.getAttribute('data-key');
  if (set && c('[data-add]')) { const l = set.querySelector('[data-list]'); const d = document.createElement('div'); d.className = 'cs-li'; d.setAttribute('data-item', ''); d.innerHTML = '<input type="text" placeholder="Новый вариант"><button class="cs-ico" data-up>↑</button><button class="cs-ico" data-down>↓</button><button class="cs-ico" data-rm>✕</button>'; l.appendChild(d); d.querySelector('input').focus(); return; }
  const it = c('[data-item]');
  if (it && c('[data-rm]')) { it.remove(); return; }
  if (it && c('[data-up]')) { const p = it.previousElementSibling; if (p && p.hasAttribute('data-item')) it.parentNode.insertBefore(it, p); return; }
  if (it && c('[data-down]')) { const n = it.nextElementSibling; if (n) it.parentNode.insertBefore(n, it); return; }
  if (set && c('[data-savekey]')) {
    const v = csRead(set, key); if (typeof v === 'string' && CRM_SETTINGS[key].type !== 'text' && CRM_SETTINGS[key].type !== 'dept') { csToast(v); return; }
    csSaveKey(key, v).then(csLoad).then(function() { csRenderDict(); csToast('Сохранено. Модуль подхватит при следующем открытии страницы'); }).catch(function(err) { csToast(csErr(err)); });
    return;
  }
  if (set && c('[data-reset]')) {
    const b = c('[data-reset]'); if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Точно вернуть?'; return; }
    ctx.api.resource('crm_config').destroy({ filterByTk: csCfgRow(key).id }).then(csLoad).then(function() { csRenderDict(); csToast('Вернули значение по умолчанию'); }).catch(function(err) { csToast(csErr(err)); });
    return;
  }
  if (c('[data-notifysave]')) {
    const ids = Array.prototype.map.call(crmS.el.querySelectorAll('[data-notify] input:checked'), function(x) { return Number(x.value); });
    if (!ids.length) { csToast('Отметьте хотя бы одного человека'); return; }
    csSaveKey('notify.admins', ids).then(csLoad).then(function() { csToast('Сохранено'); }).catch(function(err) { csToast(csErr(err)); });
    return;
  }
  if ((id = g('data-appsave'))) {
    const inp = crmS.el.querySelector('[data-app="' + id + '"]');
    csSaveApp(id, inp.value.trim()).then(csLoad).then(function() { csToast('Сохранено'); }).catch(function(err) { csToast(csErr(err)); });
  }
}

// ---------- точки входа: функции на window (последний подключивший блок — свежий ctx), разовые обработчики ----------
window.crmSettingsOpen = crmSettingsOpen;
window.crmAccountOpen = crmAccountOpen;
// пункт «Настройки CRM» первым в меню родной шестерёнки NocoBase (меню системных настроек, есть только у администратора).
// Меню NocoBase собирает пункты один раз при загрузке, поэтому пункт добавляется в раскрытое меню: копия родного пункта с нашим текстом.
function csGearMenu() {
  if (!document.documentElement.classList.contains('crm-admin')) return;
  document.querySelectorAll('.ant-dropdown:not(.ant-dropdown-hidden) ul[role="menu"]').forEach(function(ul) {
    if (ul.querySelector('[data-crm-menu]') || !ul.querySelector('a[href="/admin/settings/plugin-manager"]')) return;
    const src = ul.querySelector('li[role="menuitem"]'), sep = ul.querySelector('li[role="separator"]');
    if (!src) return;
    const li = src.cloneNode(true);
    li.setAttribute('data-crm-menu', ''); li.removeAttribute('data-menu-id'); li.removeAttribute('aria-describedby');
    const ic = li.querySelector('[role="img"]'); if (ic) ic.innerHTML = CS_GEAR_SVG.replace('width="15" height="15"', 'width="14" height="14"');
    const a = li.querySelector('a'); if (a) { a.textContent = 'Настройки CRM'; a.setAttribute('href', '#crm-settings'); }
    li.addEventListener('click', function(ev) {
      ev.preventDefault(); ev.stopPropagation();
      const dd = li.closest('.ant-dropdown'); if (dd) dd.classList.add('ant-dropdown-hidden');
      window.crmSettingsOpen({});
    });
    ul.insertBefore(li, ul.firstChild);
    if (sep) ul.insertBefore(sep.cloneNode(true), li.nextSibling);
  });
}
if (!window.__crmSettingsInit) {
  window.__crmSettingsInit = true;
  csMe().then(function(me) { document.documentElement.classList.toggle('crm-admin', csIsAdmin(me)); });
  // меню раскрывается при наведении на шестерёнку — дорисовать пункт, когда оно появится (MutationObserver в песочнице нет)
  const wake = function(e) { if (e.target.closest && e.target.closest('[data-testid="plugin-settings-button"]')) [60, 200, 500, 1000].forEach(function(t) { setTimeout(csGearMenu, t); }); };
  document.addEventListener('mouseover', wake, true);
  document.addEventListener('click', function(e) {
    wake(e);
    const g = e.target.closest && e.target.closest('[data-crm-settings]');
    if (g) { e.preventDefault(); e.stopPropagation(); window.crmSettingsOpen({ mod: g.getAttribute('data-crm-settings') }); return; }
    const a = e.target.closest && e.target.closest('[data-crm-account]');
    if (a) { e.preventDefault(); e.stopPropagation(); window.crmAccountOpen(a.getAttribute('data-crm-account')); }
  }, true);
}
// ===== конец фрагмента интерфейса настроек =====
