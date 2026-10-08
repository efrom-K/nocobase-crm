// «Настройки CRM» (/admin/crmcfg01, блок crmblock006) — только администратор. Всё, что раньше правилось в коде или базе:
// учётки сотрудников (создать, сделать рабочей тестовую, роли, пароль, отключить), справочники и сроки модулей (каталог — src/_crm-config.js),
// служебные параметры (app_settings), ссылки на структуру компании и стандартные права NocoBase. Коллекции и права — scripts/setup_crm_settings.py.
if (!document.getElementById('crm-controls-style')) {
  const st = document.createElement('style');
  st.id = 'crm-controls-style';
  st.textContent = `
    select:not([multiple]):not([size]) { -webkit-appearance:none; -moz-appearance:none; appearance:none; cursor:pointer;
      background-color:#fff; border:1px solid #d9d9d9; border-radius:6px; color:#262626; font-family:inherit; line-height:1.4;
      padding-right:30px !important; text-overflow:ellipsis; transition:border-color .2s, box-shadow .2s;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%238c8c8c' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
      background-repeat:no-repeat !important; background-position:right 10px center !important; background-size:12px 12px !important; }
    select:not([multiple]):not([size]):hover { border-color:#4b5f8f; }
    select:not([multiple]):not([size]):focus { outline:none; border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
    select:not([multiple]):not([size]):disabled { background-color:#f5f5f5 !important; color:#bfbfbf; cursor:not-allowed; border-color:#d9d9d9; }
    select option { color:#262626; background:#fff; }
    select option:disabled { color:#bfbfbf; }
    input[type=file] { font-family:inherit; font-size:13px; color:#595959; max-width:100%; }
    input[type=file]::file-selector-button { font:inherit; font-size:13px; color:#1c2d58; background:#fff; border:1px solid #d9d9d9; border-radius:6px;
      padding:5px 12px; margin-right:10px; cursor:pointer; transition:border-color .2s, color .2s, background .2s; }
    input[type=file]::file-selector-button:hover { border-color:#1c2d58; background:#f3f5fa; }
  `;
  document.head.appendChild(st);
}
// @include src/_crm-config.js
if (!document.getElementById('crm-cfg-style')) {
  const st = document.createElement('style');
  st.id = 'crm-cfg-style';
  st.textContent = `
    .cs { color:#1f1f1f; font-size:14px; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    .cs-head { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .cs-title { font-size:20px; font-weight:700; }
    .cs-tabs { display:flex; gap:2px; border-bottom:1px solid #e8ebf0; margin-bottom:14px; flex-wrap:wrap; }
    .cs-tab { border:none; background:none; padding:9px 14px; font:inherit; font-size:14px; color:#595959; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
    .cs-tab.on { color:#1c2d58; border-bottom-color:#1c2d58; font-weight:600; }
    .cs-tab b { font-weight:600; color:#cf1322; margin-left:4px; font-size:12.5px; }
    .cs-card { border:1px solid #dfe3ea; border-radius:10px; padding:14px 16px; background:#fff; margin-bottom:12px; overflow-x:auto; }
    .cs-card-t { font-size:15px; font-weight:700; color:#141414; margin-bottom:10px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .cs-card-t small { font-weight:400; color:#8c8c8c; font-size:12.5px; }
    .cs-hint { font-size:12.5px; color:#595959; margin:4px 0 8px; }
    .cs-bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px; }
    .cs-bar input[type=text] { flex:1; min-width:240px; }
    .cs input[type=text], .cs input[type=number], .cs input[type=password], .cs-modal input[type=text], .cs-modal input[type=number], .cs-modal input[type=time], .cs input[type=time] {
      border:1px solid #d9d9d9; border-radius:6px; padding:6px 10px; font:inherit; font-size:13.5px; color:#262626; background:#fff; }
    .cs select, .cs-modal select { padding:6px 10px; font-size:13.5px; }
    .cs table { width:100%; border-collapse:collapse; font-size:13.5px; color:#1f1f1f; }
    .cs th { text-align:left; color:#262626; font-size:12.5px; font-weight:600; background:#eef1f6; border-bottom:2px solid #c9d1df; padding:8px 10px; white-space:nowrap; }
    .cs td { padding:8px 10px; border-bottom:1px solid #e8ebf0; vertical-align:middle; }
    .cs tbody tr:nth-child(even) td { background:#f8f9fb; }
    .cs tbody tr:hover td { background:#eaf0ff; }
    .cs-chip { display:inline-block; font-size:11.5px; padding:1px 7px; border-radius:10px; background:#f0f2f5; color:#434343; white-space:nowrap; margin:1px 4px 1px 0; }
    .cs-chip.blue { background:#eef1f8; color:#142142; } .cs-chip.red { background:#fff1f0; color:#cf1322; } .cs-chip.green { background:#f6ffed; color:#389e0d; } .cs-chip.orange { background:#fff7e6; color:#d46b08; }
    .cs-btn { border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:5px 12px; font:inherit; font-size:13px; color:#1c2d58; cursor:pointer; white-space:nowrap; }
    .cs-btn:hover { border-color:#1c2d58; background:#f3f5fa; }
    .cs-btn.pri { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    .cs-btn.warn { color:#cf1322; } .cs-btn.warn:hover { border-color:#cf1322; background:#fff1f0; }
    .cs-btn:disabled { opacity:.5; cursor:not-allowed; }
    .cs-mods { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
    .cs-mods button { border:1px solid #d9d9d9; background:#fff; border-radius:16px; padding:4px 12px; font:inherit; font-size:13px; cursor:pointer; color:#262626; }
    .cs-mods button.on { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    .cs-set { border:1px solid #dfe3ea; border-radius:10px; padding:12px 14px; margin-bottom:10px; background:#fff; }
    .cs-set-h { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-weight:600; font-size:14px; margin-bottom:8px; }
    .cs-set-h .cs-acts { margin-left:auto; display:flex; gap:6px; }
    .cs-li { display:flex; gap:6px; align-items:center; margin-bottom:5px; }
    .cs-li input[type=text] { flex:1; min-width:0; }
    .cs-li .lock { font-size:12px; color:#8c8c8c; width:110px; }
    .cs-ico { border:1px solid #e0e0e0; background:#fff; border-radius:6px; width:30px; height:30px; cursor:pointer; color:#595959; font-size:13px; flex:none; }
    .cs-ico:hover { border-color:#1c2d58; color:#1c2d58; }
    .cs-lab td input[type=text] { width:100%; }
    .cs-lab td input[type=number] { width:90px; }
    .cs-lab td input[type=color] { width:44px; height:30px; border:1px solid #d9d9d9; border-radius:6px; padding:2px; background:#fff; }
    .cs-links a { display:block; padding:10px 12px; border:1px solid #dfe3ea; border-radius:10px; margin-bottom:8px; color:#1c2d58; text-decoration:none; background:#fff; }
    .cs-links a:hover { border-color:#1c2d58; background:#f3f5fa; }
    .cs-links a span { display:block; color:#595959; font-size:12.5px; margin-top:2px; }
    .cs-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
    .cs-box { background:#fff; border-radius:12px; width:100%; max-width:640px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f1f1f; }
    .cs-box-h { display:flex; align-items:flex-start; gap:12px; padding:16px 20px 12px; border-bottom:1px solid #f0f0f0; font-size:17px; font-weight:700; }
    .cs-box-h small { display:block; font-size:13px; font-weight:400; color:#595959; margin-top:3px; }
    .cs-box-b { padding:14px 20px 18px; }
    .cs-x { margin-left:auto; border:none; background:transparent; font-size:18px; color:#8c8c8c; cursor:pointer; }
    .cs-f { margin-bottom:10px; } .cs-f label { display:block; font-size:12.5px; color:#595959; margin-bottom:3px; } .cs-f input[type=text] { width:100%; }
    .cs-roles label { display:inline-flex; align-items:center; gap:6px; margin:0 14px 6px 0; font-size:13.5px; cursor:pointer; }
    .cs-pass { font-family:ui-monospace,Menlo,monospace; background:#f6ffed; border:1px solid #b7eb8f; border-radius:8px; padding:10px 12px; margin:8px 0; font-size:15px; user-select:all; }
    .cs-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
    .cs-empty { padding:24px; text-align:center; color:#595959; }
  `;
  document.head.appendChild(st);
}

const CS_SKIP_ROLES = ['root', 'mail_service'];          // не выдаются людям
const CS_SERVICE_USERS = ['mail-service'];               // служебные учётки — не сотрудники
const CS_LINKS = [
  ['/admin/hrdash01?sec=staff', 'Структура компании и сотрудники', 'Отделы, подчинённость, руководители, карточки сотрудников, юрлица — в дашборде HR (раздел «Сотрудники» → «Структура»).'],
  ['/admin/settings/users-permissions/roles', 'Роли, права и меню', 'Стандартные настройки NocoBase: какие разделы меню видит роль, что она может смотреть и менять.'],
  ['/admin/settings/users-permissions/users', 'Все пользователи (стандартный список NocoBase)', 'Полный список учётных записей со служебными.'],
  ['/admin/settings/data-source-manager/main/collections', 'Таблицы и поля', 'Добавить поле в договор, заявку, сотрудника и т. п. (новое поле появится в данных; вывести его в интерфейс модуля — задача для доработки).']
];
const cs = { tab: 'users', d: null, me: null, mod: '', q: '', showFired: false };

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

async function csLoad() {
  const L = function(c, p) { return ctx.api.resource(c).list(Object.assign({ paginate: false }, p || {})).then(csRows); };
  const r = await Promise.all([
    L('crm_employees', { sort: ['last_name', 'first_name'], fields: ['id', 'full_name', 'last_name', 'first_name', 'position', 'department', 'email', 'status', 'user_id'] }),
    L('users', { appends: ['roles'], fields: ['id', 'username', 'nickname', 'email'] }),
    L('roles', { fields: ['name', 'title'] }),
    L('crm_config'), L('crm_departments', { fields: ['id', 'name'], sort: ['sort', 'name'] }).catch(function() { return []; }),
    L('app_settings').catch(function() { return []; })
  ]);
  cs.d = { emps: r[0], users: r[1], roles: r[2].filter(function(x) { return CS_SKIP_ROLES.indexOf(x.name) === -1; }), cfg: r[3], depts: r[4], app: r[5] };
  window.__crmCfg = null;   // модули на этой вкладке браузера перечитают настройки
}
function csUser(id) { return cs.d.users.find(function(u) { return u.id === Number(id); }) || null; }
function csRoleTitle(n) { const r = cs.d.roles.find(function(x) { return x.name === n; }); return r ? (r.title || n).replace(/^\{\{t\("(.+)"\)\}\}$/, '$1') : n; }
function csIsTest(u) { return !!(u && /^test\./.test(u.username || '')); }
function csCfgRow(key) { return cs.d.cfg.find(function(x) { return x.key === key; }) || null; }
function csApp(name) { const x = cs.d.app.find(function(a) { return a.name === name; }); return x ? x.value : null; }

function csRoot() { return (ctx.element && ctx.element.querySelector('#crm-cfg')) || document.getElementById('crm-cfg'); }
function csRender() {
  const fired = cs.d.emps.filter(function(e) { const u = csUser(e.user_id); return e.status === 'fired' && u && (u.roles || []).length; }).length;
  const t = [['users', 'Сотрудники и учётки', fired ? '<b>' + fired + '</b>' : ''], ['dict', 'Справочники и сроки', ''], ['svc', 'Служебное', ''], ['links', 'Структура, права, поля', '']];
  csRoot().innerHTML = '<div class="cs-head"><div class="cs-title">Настройки CRM</div></div>'
    + '<div class="cs-tabs">' + t.map(function(x) { return '<button class="cs-tab' + (cs.tab === x[0] ? ' on' : '') + '" data-tab="' + x[0] + '">' + x[1] + x[2] + '</button>'; }).join('') + '</div><div data-cs-body></div>';
  ({ users: csRenderUsers, dict: csRenderDict, svc: csRenderSvc, links: csRenderLinks })[cs.tab]();
}
function csBody() { return csRoot().querySelector('[data-cs-body]'); }

// ---------- сотрудники и учётки ----------
function csRenderUsers() {
  const q = cs.q.trim().toLowerCase();
  const list = cs.d.emps.filter(function(e) {
    if (e.status === 'fired' && !cs.showFired && !(csUser(e.user_id) && (csUser(e.user_id).roles || []).length)) return false;
    return !q || [e.full_name, e.position, e.department, e.email, (csUser(e.user_id) || {}).username].join(' ').toLowerCase().indexOf(q) !== -1;
  });
  const linked = {}; cs.d.emps.forEach(function(e) { if (e.user_id) linked[e.user_id] = e; });
  const orphans = cs.d.users.filter(function(u) { return !linked[u.id] && CS_SERVICE_USERS.indexOf(u.username) === -1; });
  const row = function(e) {
    const u = csUser(e.user_id), roles = u ? (u.roles || []) : [];
    let acc, act;
    if (!u) { acc = '<span class="cs-chip">нет учётки</span>'; act = e.status === 'fired' ? '' : '<button class="cs-btn pri" data-new="' + e.id + '">Создать учётку</button> <button class="cs-btn" data-link="' + e.id + '">Привязать</button>'; }
    else {
      acc = '<b>' + csEsc(u.username) + '</b>' + (csIsTest(u) ? ' <span class="cs-chip orange">тестовая</span>' : '') + (!roles.length ? ' <span class="cs-chip">доступ отключён</span>' : '');
      act = (csIsTest(u) && e.status !== 'fired' ? '<button class="cs-btn pri" data-real="' + e.id + '">Сделать рабочей</button> ' : '') + '<button class="cs-btn" data-edit="' + e.id + '">Изменить</button>';
    }
    const warn = e.status === 'fired' && u && roles.length ? ' <span class="cs-chip red">уволен, а доступ есть</span>' : e.status === 'fired' ? ' <span class="cs-chip">уволен</span>' : '';
    return '<tr><td><b style="font-weight:600;">' + csEsc(e.full_name) + '</b>' + warn + '<div class="cs-hint" style="margin:0;">' + csEsc([e.position, e.department].filter(Boolean).join(' · ')) + '</div></td>'
      + '<td>' + acc + '</td><td>' + (roles.map(function(r) { return '<span class="cs-chip blue">' + csEsc(csRoleTitle(r.name)) + '</span>'; }).join('') || '<span class="cs-hint">—</span>') + '</td>'
      + '<td>' + (e.email ? csEsc(e.email) : '<span class="cs-hint">—</span>') + '</td><td style="white-space:nowrap;">' + act + '</td></tr>';
  };
  csBody().innerHTML = '<div class="cs-card"><div class="cs-card-t">Сотрудники и их учётные записи CRM <small>' + list.length + '</small></div>'
    + '<div class="cs-hint">Учётка привязана к карточке сотрудника: по ней CRM знает, чьи задачи и заявки, кому слать уведомления и кому писать в мессенджере. '
    + 'Сотрудников добавляет и увольняет HR в дашборде HR; здесь — доступ в CRM. «Сделать рабочей» превращает тестовую учётку в настоящую, сохраняя все её задачи и переписку.</div>'
    + '<div class="cs-bar"><input type="text" data-q placeholder="Найти: фамилия, логин, должность, отдел" value="' + csEsc(cs.q) + '">'
    + '<label class="cs-hint" style="margin:0;cursor:pointer;"><input type="checkbox" data-fired' + (cs.showFired ? ' checked' : '') + '> показать уволенных</label></div>'
    + '<table><thead><tr><th>Сотрудник</th><th>Учётка</th><th>Роли</th><th>Почта</th><th></th></tr></thead><tbody>' + list.map(row).join('') + '</tbody></table></div>'
    + (orphans.length ? '<div class="cs-card"><div class="cs-card-t">Учётки без сотрудника <small>' + orphans.length + '</small></div>'
      + '<div class="cs-hint">Не привязаны к карточке сотрудника (администраторы, общие и старые учётки). Привязать — кнопкой «Привязать» у сотрудника выше.</div>'
      + '<table><thead><tr><th>Логин</th><th>Имя</th><th>Роли</th><th></th></tr></thead><tbody>' + orphans.map(function(u) {
        return '<tr><td><b>' + csEsc(u.username) + '</b></td><td>' + csEsc(u.nickname || '') + '</td><td>' + (u.roles || []).map(function(r) { return '<span class="cs-chip blue">' + csEsc(csRoleTitle(r.name)) + '</span>'; }).join('') + '</td>'
          + '<td><button class="cs-btn" data-uedit="' + u.id + '">Изменить</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '');
}
function csRolesBox(cur) {
  return '<div class="cs-f"><label>Роли — что человек видит и может делать в CRM</label><div class="cs-roles">' + cs.d.roles.map(function(r) {
    return '<label><input type="checkbox" value="' + csEsc(r.name) + '"' + (cur.indexOf(r.name) !== -1 ? ' checked' : '') + '> ' + csEsc(csRoleTitle(r.name)) + '</label>';
  }).join('') + '</div></div>';
}
function csPickedRoles(m) { return Array.prototype.map.call(m.querySelectorAll('.cs-roles input:checked'), function(x) { return x.value; }); }
function csShowPassword(m, title, login, pass) {
  m.querySelector('.cs-box').innerHTML = '<div class="cs-box-h">' + csEsc(title) + '<button class="cs-x">✕</button></div><div class="cs-box-b">'
    + '<div>Передайте сотруднику (пароль больше нигде не показывается — сохраните в Vaultwarden, если нужно):</div>'
    + '<div class="cs-pass">Логин: ' + csEsc(login) + '<br>Пароль: ' + csEsc(pass) + '</div>'
    + '<div class="cs-hint">Адрес входа — тот же, что у вас в браузере. Сменить пароль сотрудник может сам в профиле (значок человека справа вверху).</div>'
    + '<div class="cs-actions"><button class="cs-btn pri cs-x">Готово</button></div></div>';
}
// создать учётку сотруднику (или сделать рабочей тестовую: тот же пользователь — задачи и переписка остаются)
function csOpenAccount(e, mode) {
  const u = csUser(e.user_id), real = mode === 'real';
  const m = csModal('<div class="cs-box-h"><div>' + (real ? 'Сделать учётку рабочей' : 'Учётка CRM') + '<small>' + csEsc(e.full_name) + '</small></div><button class="cs-x">✕</button></div><div class="cs-box-b">'
    + '<div class="cs-f"><label>Логин</label><input type="text" data-login value="' + csEsc(real || !u ? csLogin(e) : u.username) + '"></div>'
    + '<div class="cs-f"><label>Имя в CRM</label><input type="text" data-nick value="' + csEsc(((e.first_name || '') + ' ' + (e.last_name || '')).trim() || e.full_name) + '"></div>'
    + '<div class="cs-f"><label>Почта</label><input type="text" data-mail value="' + csEsc(e.email || '') + '"></div>'
    + csRolesBox(u ? (u.roles || []).map(function(r) { return r.name; }).filter(function(n) { return !real || n !== 'crm_test'; }) : [])
    + (real ? '<div class="cs-hint">Логин, имя, почта и роли станут рабочими, будет выдан новый пароль. Все задачи, заявки и переписка этой учётки сохранятся.</div>' : '')
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
      await csLoad(); csRender(); csShowPassword(m, 'Учётка готова', login, pass);
    } catch (err) { csToast(csErr(err)); b.disabled = false; }
  });
}
// изменить учётку: роли, имя, почта, новый пароль, отвязать, отключить доступ
function csOpenEdit(u, e) {
  const roles = (u.roles || []).map(function(r) { return r.name; });
  const m = csModal('<div class="cs-box-h"><div>' + csEsc(u.username) + '<small>' + csEsc(e ? e.full_name : (u.nickname || '')) + '</small></div><button class="cs-x">✕</button></div><div class="cs-box-b">'
    + '<div class="cs-f"><label>Имя в CRM</label><input type="text" data-nick value="' + csEsc(u.nickname || '') + '"></div>'
    + '<div class="cs-f"><label>Почта</label><input type="text" data-mail value="' + csEsc(u.email || '') + '"></div>'
    + csRolesBox(roles)
    + '<div class="cs-actions"><button class="cs-btn pri" data-save>Сохранить</button><button class="cs-btn" data-pass>Выдать новый пароль</button>'
    + (e ? '<button class="cs-btn" data-unlink>Отвязать от сотрудника</button>' : '')
    + (roles.length ? '<button class="cs-btn warn" data-off>Отключить доступ</button>' : '') + '</div>'
    + '<div class="cs-hint" style="margin-top:10px;">«Отключить доступ» снимает все роли и меняет пароль — войти будет нельзя, история и задачи сохранятся. Включить обратно — отметить роли и выдать пароль.</div></div>');
  const upd = async function(vals, msg) {
    try { await ctx.api.resource('users').update({ filterByTk: u.id, values: vals }); await csLoad(); csRender(); return true; }
    catch (err) { csToast(csErr(err)); return false; }
  };
  m.querySelector('[data-save]').addEventListener('click', async function() {
    if (u.id === (cs.me && cs.me.id) && csPickedRoles(m).indexOf('admin') === -1 && roles.indexOf('admin') !== -1) { csToast('Нельзя снять роль администратора с самого себя'); return; }
    if (await upd({ nickname: m.querySelector('[data-nick]').value.trim(), email: m.querySelector('[data-mail]').value.trim() || null, roles: csPickedRoles(m) })) { m.remove(); csToast('Сохранено'); }
  });
  m.querySelector('[data-pass]').addEventListener('click', async function() { const p = csPassword(); if (await upd({ password: p })) csShowPassword(m, 'Новый пароль', u.username, p); });
  const ul = m.querySelector('[data-unlink]');
  if (ul) ul.addEventListener('click', async function() {
    if (!ul.dataset.sure) { ul.dataset.sure = 1; ul.textContent = 'Точно отвязать?'; return; }
    try { await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: { user_id: null } }); await csLoad(); csRender(); m.remove(); csToast('Отвязано'); } catch (err) { csToast(csErr(err)); }
  });
  const off = m.querySelector('[data-off]');
  if (off) off.addEventListener('click', async function() {
    if (u.id === (cs.me && cs.me.id)) { csToast('Нельзя отключить самого себя'); return; }
    if (!off.dataset.sure) { off.dataset.sure = 1; off.textContent = 'Точно отключить?'; return; }
    if (await upd({ roles: [], password: csPassword() + csPassword() })) { m.remove(); csToast('Доступ отключён'); }
  });
}
function csOpenLink(e) {
  const linked = {}; cs.d.emps.forEach(function(x) { if (x.user_id) linked[x.user_id] = 1; });
  const free = cs.d.users.filter(function(u) { return !linked[u.id] && CS_SERVICE_USERS.indexOf(u.username) === -1; });
  const m = csModal('<div class="cs-box-h"><div>Привязать учётку<small>' + csEsc(e.full_name) + '</small></div><button class="cs-x">✕</button></div><div class="cs-box-b">'
    + (free.length ? '<div class="cs-f"><label>Учётка без сотрудника</label><select data-u style="width:100%;">' + free.map(function(u) { return '<option value="' + u.id + '">' + csEsc(u.username + (u.nickname ? ' — ' + u.nickname : '')) + '</option>'; }).join('') + '</select></div>'
      + '<div class="cs-actions"><button class="cs-btn pri" data-save>Привязать</button><button class="cs-btn cs-x">Отмена</button></div>'
      : '<div class="cs-empty">Свободных учёток нет — создайте новую.</div>') + '</div>');
  const sv = m.querySelector('[data-save]');
  if (sv) sv.addEventListener('click', async function() {
    try { await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: { user_id: Number(m.querySelector('[data-u]').value) } }); await csLoad(); csRender(); m.remove(); csToast('Привязано'); } catch (err) { csToast(csErr(err)); }
  });
}

// ---------- справочники и сроки (каталог — общий фрагмент src/_crm-config.js) ----------
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
      + '<div class="cs-hint">Уже созданные записи сохранят свой вариант как есть; список влияет на выбор в новых и изменяемых записях и на фильтры.</div>';
  }
  if (s.type === 'labels') {
    return '<table class="cs-lab"><thead><tr>' + s.fields.map(function(f) { return '<th>' + csEsc(f[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' + Object.keys(v).map(function(k) {
      return '<tr data-lk="' + csEsc(k) + '">' + s.fields.map(function(f) {
        const x = v[k][f[0]];
        return '<td>' + (f[2] === 'color' ? '<input type="color" data-lf="' + f[0] + '" value="' + csEsc(/^#[0-9a-f]{6}$/i.test(x) ? x : '#595959') + '">'
          : '<input type="' + (f[2] === 'num' ? 'number' : 'text') + '" data-lf="' + f[0] + '" value="' + csEsc(x) + '"' + (f[2] === 'num' ? ' min="0"' : '') + '>') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table><div class="cs-hint">Набор строк постоянный — на нём держится логика модуля; меняются названия, сроки и цвета.</div>';
  }
  if (s.type === 'number') return '<input type="number" data-val min="0" value="' + csEsc(v) + '">';
  if (s.type === 'dept') return '<select data-val>' + (cs.d.depts.some(function(d) { return d.name === v; }) ? '' : '<option selected>' + csEsc(v) + '</option>') + cs.d.depts.map(function(d) { return '<option' + (d.name === v ? ' selected' : '') + '>' + csEsc(d.name) + '</option>'; }).join('') + '</select>';
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
    });
    return o;
  }
  const x = box.querySelector('[data-val]').value.trim();
  if (s.type === 'number') return x === '' || isNaN(Number(x)) ? 'Нужно число' : Number(x);
  return x;
}
function csRenderDict() {
  const mods = csMods(); if (!cs.mod || mods.indexOf(cs.mod) === -1) cs.mod = mods[0];
  const keys = Object.keys(CRM_SETTINGS).filter(function(k) { return CRM_SETTINGS[k].m === cs.mod; });
  csBody().innerHTML = '<div class="cs-mods">' + mods.map(function(m) { return '<button data-mod="' + csEsc(m) + '"' + (m === cs.mod ? ' class="on"' : '') + '>' + csEsc(m) + '</button>'; }).join('') + '</div>'
    + keys.map(function(k) {
      const r = csCfgRow(k);
      return '<div class="cs-set" data-key="' + csEsc(k) + '"><div class="cs-set-h">' + csEsc(CRM_SETTINGS[k].t) + (r ? ' <span class="cs-chip orange">изменено' + (r.updated_by ? ' · ' + csEsc(r.updated_by) : '') + '</span>' : '')
        + '<span class="cs-acts">' + (r ? '<button class="cs-btn" data-reset>По умолчанию</button>' : '') + '<button class="cs-btn pri" data-savekey>Сохранить</button></span></div>' + csEditor(k) + '</div>';
    }).join('');
}
async function csSaveKey(key, value) {
  const r = csCfgRow(key), by = cs.me ? (cs.me.nickname || cs.me.username) : '';
  if (r) await ctx.api.resource('crm_config').update({ filterByTk: r.id, values: { value: value, updated_by: by } });
  else await ctx.api.resource('crm_config').create({ values: { key: key, value: value, updated_by: by } });
}

// ---------- служебное: значения в app_settings (их читают серверные скрипты) ----------
const CS_APP = [
  ['aho_approver_user_id', 'Кто согласует счета АХО', 'user'],
  ['skud_work_start', 'СКУД: начало рабочего дня (опоздание считается после него)', 'time'],
  ['skud_grace_min', 'СКУД: допустимое опоздание, минут', 'num'],
  ['dadata_token', 'Ключ DaData (поиск компаний по ИНН в договорах)', 'secret']
];
function csRenderSvc() {
  const people = cs.d.users.filter(function(u) { return (u.roles || []).length && CS_SERVICE_USERS.indexOf(u.username) === -1; });
  csBody().innerHTML = '<div class="cs-card"><div class="cs-card-t">Служебные параметры</div><div class="cs-hint">Их используют уведомления, СКУД и проверка контрагентов.</div>'
    + '<table><tbody>' + CS_APP.map(function(f) {
      const v = csApp(f[0]); let inp;
      if (f[2] === 'user') inp = '<select data-app="' + f[0] + '"><option value="">— не назначен —</option>' + people.map(function(u) { return '<option value="' + u.id + '"' + (String(u.id) === String(v) ? ' selected' : '') + '>' + csEsc((u.nickname || u.username)) + '</option>'; }).join('') + '</select>';
      else if (f[2] === 'time') inp = '<input type="time" data-app="' + f[0] + '" value="' + csEsc(v || '') + '">';
      else if (f[2] === 'num') inp = '<input type="number" min="0" data-app="' + f[0] + '" value="' + csEsc(v || '') + '">';
      else inp = '<input type="password" data-app="' + f[0] + '" value="' + csEsc(v || '') + '" style="width:340px;" autocomplete="off">';
      return '<tr><td style="width:45%;">' + csEsc(f[1]) + '</td><td>' + inp + '</td><td><button class="cs-btn" data-appsave="' + f[0] + '">Сохранить</button></td></tr>';
    }).join('') + '</tbody></table></div>';
}
async function csSaveApp(name, value) {
  const x = cs.d.app.find(function(a) { return a.name === name; });
  if (x) await ctx.api.resource('app_settings').update({ filterByTk: x.id, values: { value: value } });
  else await ctx.api.resource('app_settings').create({ values: { name: name, value: value } });
}
function csRenderLinks() {
  csBody().innerHTML = '<div class="cs-links">' + CS_LINKS.map(function(l) { return '<a href="' + l[0] + '">' + csEsc(l[1]) + '<span>' + csEsc(l[2]) + '</span></a>'; }).join('') + '</div>';
}

// ---------- события ----------
function csOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const tab = c('[data-tab]'); if (tab) { cs.tab = tab.getAttribute('data-tab'); csRender(); return; }
  const g = function(s, a) { const x = c('[' + s + ']'); return x ? x.getAttribute(s) : null; };
  const emp = function(id) { return cs.d.emps.find(function(x) { return x.id === Number(id); }); };
  let id;
  if ((id = g('data-new'))) return csOpenAccount(emp(id), 'new');
  if ((id = g('data-real'))) return csOpenAccount(emp(id), 'real');
  if ((id = g('data-link'))) return csOpenLink(emp(id));
  if ((id = g('data-edit'))) { const x = emp(id); return csOpenEdit(csUser(x.user_id), x); }
  if ((id = g('data-uedit'))) return csOpenEdit(csUser(id), null);
  const mod = c('[data-mod]'); if (mod) { cs.mod = mod.getAttribute('data-mod'); csRenderDict(); return; }
  const set = c('[data-key]'), key = set && set.getAttribute('data-key');
  if (set && c('[data-add]')) { const l = set.querySelector('[data-list]'); const d = document.createElement('div'); d.className = 'cs-li'; d.setAttribute('data-item', ''); d.innerHTML = '<input type="text" placeholder="Новый вариант"><button class="cs-ico" data-up>↑</button><button class="cs-ico" data-down>↓</button><button class="cs-ico" data-rm>✕</button>'; l.appendChild(d); d.querySelector('input').focus(); return; }
  const it = c('[data-item]');
  if (it && c('[data-rm]')) { it.remove(); return; }
  if (it && c('[data-up]')) { const p = it.previousElementSibling; if (p && p.hasAttribute('data-item')) it.parentNode.insertBefore(it, p); return; }
  if (it && c('[data-down]')) { const n = it.nextElementSibling; if (n) it.parentNode.insertBefore(n, it); return; }
  if (set && c('[data-savekey]')) {
    const v = csRead(set, key); if (typeof v === 'string' && CRM_SETTINGS[key].type !== 'text' && CRM_SETTINGS[key].type !== 'dept') { csToast(v); return; }
    csSaveKey(key, v).then(csLoad).then(function() { csRenderDict(); csToast('Сохранено. Модули подхватят при открытии страницы'); }).catch(function(err) { csToast(csErr(err)); });
    return;
  }
  if (set && c('[data-reset]')) {
    const b = c('[data-reset]'); if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Точно вернуть?'; return; }
    ctx.api.resource('crm_config').destroy({ filterByTk: csCfgRow(key).id }).then(csLoad).then(function() { csRenderDict(); csToast('Вернули значение по умолчанию'); }).catch(function(err) { csToast(csErr(err)); });
    return;
  }
  if ((id = g('data-appsave'))) {
    const inp = csRoot().querySelector('[data-app="' + id + '"]');
    csSaveApp(id, inp.value.trim()).then(csLoad).then(function() { csToast('Сохранено'); }).catch(function(err) { csToast(csErr(err)); });
  }
}

ctx.render('<div id="crm-cfg" class="cs"><div class="cs-empty">Загрузка…</div></div>');
(async function() {
  try {
    const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + localStorage.getItem('NOCOBASE_TOKEN') } });
    cs.me = ((await res.json()) || {}).data || null;
    const isAdmin = cs.me && (cs.me.roles || []).some(function(r) { return r.name === 'admin' || r.name === 'root'; });
    if (!isAdmin) { csRoot().innerHTML = '<div class="cs-empty"><b>Настройки CRM доступны администратору</b></div>'; return; }
    await csLoad();
    csRender();
    csRoot().addEventListener('click', csOnClick);
    csRoot().addEventListener('input', function(e) { if (e.target.hasAttribute('data-q')) { cs.q = e.target.value; const pos = e.target.selectionStart; csRenderUsers(); const i = csRoot().querySelector('[data-q]'); i.focus(); i.setSelectionRange(pos, pos); } });
    csRoot().addEventListener('change', function(e) { if (e.target.hasAttribute('data-fired')) { cs.showFired = e.target.checked; csRenderUsers(); } });
  } catch (e) { csRoot().innerHTML = '<div class="cs-empty" style="color:#cf1322;">Не удалось загрузить настройки. Обновите страницу.</div>'; }
})();
