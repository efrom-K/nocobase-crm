// Вкладка «Почта»: почтовый клиент в духе привычной веб-почты (папки слева, список писем, чтение, новое письмо).
// Письма получает почтовый сервис (mail-service/, порт 8096 на том же сервере), вход — по сессии NocoBase:
// пароль от ящика вводится один раз, дальше почта открывается сама.
ctx.render('<div id="ml-root"></div>');
(async function () {
// фоновые опросы не ходят в API, когда пользователь не вошёл (страница входа, сессия истекла):
// иначе NocoBase на каждый такой запрос показывает «Пожалуйста, войдите, чтобы продолжить»
function nbSessionAlive() {
  if (/\/signin|\/signup/.test(location.pathname)) return false;
  try { return !!localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return false; }
}

const API = location.protocol + '//' + location.hostname + ':8096/api';
function authToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function esc(v) { return String(v === null || v === undefined ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function qs(o) { return Object.keys(o).filter(function(k) { return o[k] !== undefined && o[k] !== null && o[k] !== ''; }).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&'); }

async function api(path, opts) {
  opts = opts || {};
  const headers = Object.assign({ Authorization: 'Bearer ' + authToken() }, opts.headers || {});
  let body = opts.body;
  if (opts.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json); }
  let res;
  try { res = await fetch(API + path, { method: opts.method || (body ? 'POST' : 'GET'), headers: headers, body: body }); }
  catch (e) { const err = new Error('Почтовый сервис недоступен'); err.code = 'OFFLINE'; throw err; }
  if (opts.raw && res.ok) return res;
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) { const err = new Error((data && data.message) || 'Ошибка почты'); err.code = data && data.error; err.status = res.status; throw err; }
  return data;
}

// ---------- стили (при каждой выкладке заменяются целиком, чтобы не залипала старая версия) ----------
(function() {
  const old = document.getElementById('ml-style');
  if (old) old.remove();
  const st = document.createElement('style');
  st.id = 'ml-style';
  st.textContent = `
    /* окно письма, меню и окна живут в body — переменные нужны и им */
    #ml-root, .ml-compose, .ml-menu, .ml-toast, .ml-modal-wrap { --ml-blue: #005ff9; --ml-blue-h: #0050d4; --ml-bg: #f4f5f7; --ml-line: #eceef2; --ml-text: #2c2d2e; --ml-gray: #87898f; font-family: inherit; }
    .ml-app { display: flex; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid var(--ml-line); min-height: 520px; color: var(--ml-text); }
    .ml-side { width: 232px; flex: 0 0 232px; background: var(--ml-bg); padding: 14px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
    .ml-compose-btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; margin: 0 2px 12px; border: none; border-radius: 12px; background: var(--ml-blue); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; box-shadow: 0 2px 6px rgba(0, 95, 249, .25); flex-shrink: 0; }
    .ml-compose-btn:hover { background: var(--ml-blue-h); }
    .ml-folder { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px; border-radius: 10px; cursor: pointer; font-size: 14px; user-select: none; flex-shrink: 0; }
    .ml-folder:hover { background: #e9ebef; }
    .ml-folder.active { background: #fff; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
    .ml-folder.drop { background: #dbe8ff; box-shadow: inset 0 0 0 2px var(--ml-blue); }
    .ml-folder svg { flex: 0 0 18px; color: #6f7278; }
    .ml-folder.active svg { color: var(--ml-blue); }
    .ml-folder-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-folder-count { font-size: 13px; font-weight: 600; color: var(--ml-text); }
    .ml-folder-add { color: var(--ml-gray); font-size: 13.5px; }
    .ml-folder-add:hover { color: var(--ml-blue); background: transparent; }
    .ml-side-sep { height: 1px; background: #e2e4e9; margin: 8px 10px; flex-shrink: 0; }
    .ml-side-foot { margin-top: auto; padding: 10px 6px 2px 12px; font-size: 12px; color: var(--ml-gray); display: flex; align-items: center; gap: 6px; }
    .ml-side-foot span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .ml-gear { border: none; background: transparent; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; color: #6f7278; display: inline-flex; align-items: center; justify-content: center; }
    .ml-gear:hover { background: #e6e8ec; color: var(--ml-blue); }
    .ml-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .ml-toolbar { display: flex; align-items: center; gap: 4px; height: 56px; padding: 0 16px; border-bottom: 1px solid var(--ml-line); flex-shrink: 0; }
    .ml-tbtn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 11px; border: none; border-radius: 8px; background: transparent; color: var(--ml-text); font-size: 13.5px; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .ml-tbtn:hover { background: #f0f1f4; }
    .ml-tbtn:disabled { color: #c0c2c7; cursor: default; background: transparent; }
    .ml-tbtn svg { color: #6f7278; }
    .ml-tbtn.icon { width: 34px; padding: 0; justify-content: center; }
    .ml-title { font-size: 17px; font-weight: 600; margin-left: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; border-radius: 8px; padding: 4px 8px; }
    .ml-title:hover { background: #f0f1f4; }
    .ml-title small { font-size: 13px; font-weight: 400; color: var(--ml-blue); }
    .ml-search { margin-left: auto; position: relative; width: min(340px, 36%); }
    .ml-search input { width: 100%; height: 36px; box-sizing: border-box; border: 1px solid transparent; border-radius: 10px; background: var(--ml-bg); padding: 0 30px 0 34px; font-size: 14px; outline: none; font-family: inherit; }
    .ml-search input:focus { background: #fff; border-color: var(--ml-blue); }
    .ml-search > svg { position: absolute; left: 10px; top: 10px; color: var(--ml-gray); }
    .ml-search b { position: absolute; right: 10px; top: 8px; cursor: pointer; color: var(--ml-gray); font-weight: 400; }
    .ml-check { width: 20px; height: 20px; border: 1.5px solid #b9bcc3; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; background: #fff; box-sizing: border-box; }
    .ml-check.on { background: var(--ml-blue); border-color: var(--ml-blue); }
    .ml-check.on::after { content: ''; width: 9px; height: 5px; border: 2px solid #fff; border-top: none; border-right: none; transform: rotate(-45deg) translate(1px, -1px); }
    .ml-list { flex: 1; overflow-y: auto; }
    .ml-row { display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; position: relative; }
    .ml-row:hover { background: #f5f7fa; }
    .ml-row.sel { background: #eaf1ff; }
    .ml-row.dragging { opacity: .5; }
    /* точка — только признак «не прочитано», без действия по клику */
    .ml-row .ml-unread-dot { width: 8px; height: 8px; border-radius: 50%; background: transparent; flex: 0 0 8px; pointer-events: none; }
    .ml-row.unread .ml-unread-dot { background: var(--ml-blue); }
    /* поле выбора письма: вся левая часть строки на полную высоту; галочка видна при наведении, а когда что-то выбрано — у всех строк */
    .ml-sel-cell { flex: 0 0 44px; align-self: stretch; margin: 0 -8px 0 -16px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 0; }
    .ml-sel-cell:hover .ml-check { border-color: var(--ml-blue); }
    .ml-sel-cell .ml-check { opacity: 0; transition: opacity .1s; }
    .ml-row:hover .ml-sel-cell .ml-check, .ml-row.sel .ml-sel-cell .ml-check, .ml-list.selecting .ml-sel-cell .ml-check { opacity: 1; }
    .ml-avatar-wrap { position: relative; width: 32px; height: 32px; flex: 0 0 32px; }
    .ml-avatar { width: 32px; height: 32px; border-radius: 50%; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }


    .ml-from { width: 200px; flex: 0 0 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
    .ml-row.unread .ml-from, .ml-row.unread .ml-subj { font-weight: 700; }
    .ml-line { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
    .ml-subj { color: var(--ml-text); }
    .ml-snip { color: var(--ml-gray); margin-left: 8px; }
    .ml-imp { color: #e0342c; font-weight: 700; margin-right: 4px; }
    .ml-icons { display: flex; align-items: center; gap: 8px; color: var(--ml-gray); flex-shrink: 0; }
    .ml-flag { cursor: pointer; color: #d0d2d6; display: inline-flex; }
    .ml-flag.on { color: #ff9e00; }
    .ml-row:not(:hover) .ml-flag:not(.on) { visibility: hidden; }
    .ml-date { width: 64px; text-align: right; font-size: 13px; color: var(--ml-gray); flex-shrink: 0; }
    .ml-row.unread .ml-date { color: var(--ml-text); font-weight: 600; }
    .ml-more { display: block; margin: 14px auto; }
    .ml-empty { padding: 60px 20px; text-align: center; color: var(--ml-gray); font-size: 15px; }
    .ml-empty b { display: block; color: var(--ml-text); font-size: 17px; margin-bottom: 6px; }
    .ml-read { flex: 1; overflow-y: auto; padding: 20px 28px 32px; }
    .ml-read h1 { font-size: 22px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; word-break: break-word; }
    .ml-read-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
    .ml-read-head .ml-avatar { width: 40px; height: 40px; font-size: 15px; flex: 0 0 40px; }
    .ml-read-who { flex: 1; min-width: 0; font-size: 14px; }
    .ml-read-who b { font-weight: 600; }
    .ml-read-addr { color: var(--ml-gray); }
    .ml-read-to { color: var(--ml-gray); font-size: 13px; margin-top: 3px; }
    .ml-read-date { color: var(--ml-gray); font-size: 13px; white-space: nowrap; }
    .ml-imgbar { background: #fff8e6; border: 1px solid #ffe2a8; border-radius: 10px; padding: 8px 14px; font-size: 13px; margin-bottom: 14px; display: flex; align-items: center; gap: 12px; }
    .ml-imgbar a { color: var(--ml-blue); cursor: pointer; font-weight: 600; }
    .ml-body-frame { width: 100%; border: none; min-height: 40px; display: block; }
    .ml-atts-head { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--ml-line); font-size: 13.5px; color: var(--ml-gray); }
    .ml-atts-head a { color: var(--ml-blue); cursor: pointer; font-weight: 600; }
    .ml-atts { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .ml-att { display: flex; align-items: center; gap: 10px; width: 230px; padding: 10px 12px; border: 1px solid var(--ml-line); border-radius: 10px; cursor: pointer; background: #fff; position: relative; }
    .ml-att:hover { border-color: var(--ml-blue); }
    .ml-att-ico { width: 36px; height: 36px; border-radius: 8px; background: #eaf1ff; color: var(--ml-blue); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; overflow: hidden; }
    .ml-att-ico img { width: 100%; height: 100%; object-fit: cover; }
    .ml-att-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-att-size { font-size: 12px; color: var(--ml-gray); }
    .ml-att-dl { position: absolute; right: 8px; top: 8px; width: 24px; height: 24px; border-radius: 6px; display: none; align-items: center; justify-content: center; color: #6f7278; background: #fff; }
    .ml-att:hover .ml-att-dl { display: flex; }
    .ml-att-dl:hover { color: var(--ml-blue); background: #f0f5ff; }
    .ml-quick-reply { margin-top: 22px; border: 1px solid var(--ml-line); border-radius: 12px; padding: 14px 16px; color: var(--ml-gray); cursor: text; font-size: 14px; }
    .ml-quick-reply:hover { border-color: #c9ccd2; }
    .ml-quick { display: flex; gap: 8px; margin-top: 12px; }
    .ml-btn { height: 36px; padding: 0 16px; border-radius: 10px; border: 1px solid #d5d8de; background: #fff; color: var(--ml-text); font-size: 14px; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; }
    .ml-btn:hover { border-color: var(--ml-blue); color: var(--ml-blue); }
    .ml-btn-primary { background: var(--ml-blue); border-color: var(--ml-blue); color: #fff; font-weight: 600; }
    .ml-btn-primary:hover { background: var(--ml-blue-h); border-color: var(--ml-blue-h); color: #fff; }
    .ml-btn:disabled { opacity: .55; cursor: default; }
    .ml-card { max-width: 420px; margin: 70px auto; padding: 28px; border: 1px solid var(--ml-line); border-radius: 16px; text-align: center; background: #fff; }
    .ml-card h2 { font-size: 20px; margin: 0 0 8px; }
    .ml-card p { color: var(--ml-gray); font-size: 14px; margin: 0 0 18px; line-height: 1.5; }
    .ml-card input { width: 100%; height: 42px; box-sizing: border-box; border: 1px solid #d5d8de; border-radius: 10px; padding: 0 14px; font-size: 15px; margin-bottom: 12px; outline: none; font-family: inherit; }
    .ml-card input:focus { border-color: var(--ml-blue); }
    .ml-card .ml-err { color: #e0342c; font-size: 13px; min-height: 18px; margin-bottom: 8px; }
    .ml-compose { position: fixed; right: 24px; bottom: 0; width: min(760px, calc(100vw - 48px)); height: min(660px, calc(100vh - 80px)); background: #fff; border-radius: 14px 14px 0 0; box-shadow: 0 8px 40px rgba(0,0,0,.22); z-index: 1000; display: flex; flex-direction: column; color: var(--ml-text); }
    .ml-compose.min { height: 48px; overflow: hidden; }
    .ml-compose.full { right: 5vw; width: 90vw; height: calc(100vh - 60px); }
    .ml-compose.hidden { display: none; }
    .ml-compose-head { display: flex; align-items: center; height: 48px; padding: 0 10px 0 18px; background: #f4f5f7; border-radius: 14px 14px 0 0; font-weight: 600; font-size: 15px; cursor: pointer; flex-shrink: 0; }
    .ml-compose-head span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-compose-head button { border: none; background: transparent; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #6f7278; font-size: 15px; }
    .ml-compose-head button:hover { background: #e6e8ec; }
    .ml-cf { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 4px 18px; border-bottom: 1px solid var(--ml-line); position: relative; flex-shrink: 0; }
    .ml-cf label { width: 64px; flex: 0 0 64px; color: var(--ml-gray); font-size: 14px; }
    .ml-cf input { flex: 1; min-width: 120px; border: none; outline: none; font-size: 14px; height: 34px; font-family: inherit; }
    .ml-cf .ml-cf-toggle { color: var(--ml-gray); font-size: 13px; cursor: pointer; white-space: nowrap; }
    .ml-cf .ml-cf-toggle:hover { color: var(--ml-blue); }
    .ml-chips { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .ml-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 10px; border-radius: 14px; background: #eaf1ff; font-size: 13px; max-width: 280px; }
    .ml-chip.bad { background: #ffe9e8; color: #c4221b; }
    .ml-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-chip b { font-weight: 400; cursor: pointer; color: #6f7278; padding: 0 3px; }
    .ml-suggest { position: absolute; left: 90px; right: 18px; top: 100%; background: #fff; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.16); z-index: 5; max-height: 260px; overflow-y: auto; }
    .ml-suggest div { padding: 8px 14px; font-size: 13.5px; cursor: pointer; }
    .ml-suggest div.on, .ml-suggest div:hover { background: #f0f5ff; }
    .ml-suggest small { color: var(--ml-gray); margin-left: 6px; }
    .ml-fmt { display: flex; flex-wrap: wrap; gap: 2px; padding: 6px 12px; border-bottom: 1px solid var(--ml-line); flex-shrink: 0; align-items: center; }
    .ml-fmt button, .ml-fmt select { height: 30px; min-width: 32px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 14px; color: #4a4c50; font-family: inherit; }
    .ml-fmt select { font-size: 13px; padding: 0 4px; }
    .ml-fmt button:hover, .ml-fmt select:hover { background: #f0f1f4; }
    .ml-fmt i.sep { width: 1px; height: 18px; background: #e2e4e9; margin: 0 4px; }
    .ml-fmt input[type=color] { width: 28px; height: 26px; border: none; padding: 0; background: transparent; cursor: pointer; }
    .ml-editor-wrap { flex: 1; position: relative; min-height: 0; display: flex; }
    .ml-editor { flex: 1; overflow-y: auto; padding: 14px 18px; font-size: 14.5px; line-height: 1.5; outline: none; }
    .ml-editor img { max-width: 100%; }
    .ml-editor blockquote { margin: 8px 0 0; padding-left: 12px; border-left: 3px solid #d5d8de; color: #555; }
    .ml-drop { position: absolute; inset: 6px; border: 2px dashed var(--ml-blue); border-radius: 12px; background: rgba(234, 241, 255, .92); color: var(--ml-blue); font-size: 16px; font-weight: 600; display: none; align-items: center; justify-content: center; z-index: 3; pointer-events: none; }
    .ml-compose.dragover .ml-drop { display: flex; }
    .ml-compose-atts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 8px; flex-shrink: 0; }
    .ml-compose-atts .ml-chip { background: #f4f5f7; }
    .ml-compose-foot { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--ml-line); flex-shrink: 0; flex-wrap: wrap; }
    .ml-compose-foot .ml-status { font-size: 12.5px; color: var(--ml-gray); margin-left: 6px; }
    .ml-opt { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #4a4c50; cursor: pointer; user-select: none; padding: 0 6px; height: 32px; border-radius: 8px; }
    .ml-opt:hover { background: #f0f1f4; }
    .ml-opt.on { color: var(--ml-blue); font-weight: 600; }
    .ml-toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); background: #2c2d2e; color: #fff; padding: 10px 18px; border-radius: 10px; font-size: 14px; z-index: 1100; box-shadow: 0 4px 16px rgba(0,0,0,.2); display: flex; gap: 16px; align-items: center; }
    .ml-toast a { color: #7fb2ff; cursor: pointer; font-weight: 600; }
    .ml-menu { position: fixed; background: #fff; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.16); z-index: 1200; padding: 6px; min-width: 210px; max-height: 360px; overflow-y: auto; color: var(--ml-text); }
    .ml-menu div { padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .ml-menu div:hover { background: #f0f5ff; }
    .ml-menu div.on { color: var(--ml-blue); font-weight: 600; }
    .ml-menu div.danger { color: #e0342c; }
    .ml-menu hr { border: none; border-top: 1px solid var(--ml-line); margin: 4px 0; }
    .ml-modal-wrap { position: fixed; inset: 0; background: rgba(20, 22, 26, .55); z-index: 1150; display: flex; align-items: center; justify-content: center; }
    .ml-modal { background: #fff; border-radius: 14px; box-shadow: 0 12px 48px rgba(0,0,0,.3); width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 60px); display: flex; flex-direction: column; color: var(--ml-text); }
    .ml-modal.wide { width: min(1100px, calc(100vw - 32px)); height: calc(100vh - 60px); }
    .ml-modal-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--ml-line); font-weight: 600; font-size: 16px; }
    .ml-modal-head span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-modal-head button.x { border: none; background: transparent; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #6f7278; font-size: 16px; }
    .ml-modal-head button.x:hover { background: #f0f1f4; }
    .ml-modal-body { padding: 16px 18px; overflow: auto; flex: 1; min-height: 0; }
    .ml-modal-body label { display: block; font-size: 13px; color: var(--ml-gray); margin: 0 0 6px; }
    .ml-modal-body input[type=text] { width: 100%; height: 38px; box-sizing: border-box; border: 1px solid #d5d8de; border-radius: 10px; padding: 0 12px; font-size: 14px; outline: none; font-family: inherit; margin-bottom: 14px; }
    .ml-modal-body input[type=text]:focus { border-color: var(--ml-blue); }
    .ml-sig-edit { min-height: 110px; border: 1px solid #d5d8de; border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; margin-bottom: 12px; line-height: 1.5; }
    .ml-sig-edit:focus { border-color: var(--ml-blue); }
    .ml-modal-foot { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 18px; border-top: 1px solid var(--ml-line); }
    .ml-viewer { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; background: #f4f5f7; }
    .ml-viewer img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .ml-viewer iframe { width: 100%; height: 100%; border: none; background: #fff; }
    .ml-source { white-space: pre-wrap; word-break: break-all; font: 12px/1.45 ui-monospace, Menlo, Consolas, monospace; margin: 0; }
    .ml-loading { padding: 40px; text-align: center; color: var(--ml-gray); }
    .ml-count { display: inline-block; margin-left: 6px; padding: 0 6px; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px; background: #eceef2; color: #5b5e64; font-size: 11.5px; font-weight: 600; text-align: center; box-sizing: border-box; }
    .ml-thread-count { font-size: 14px; font-weight: 400; color: var(--ml-gray); margin-left: 6px; }
    .ml-member { border: 1px solid var(--ml-line); border-radius: 12px; margin-bottom: 10px; background: #fff; }
    .ml-member.open { padding: 14px 16px; }
    .ml-member-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; font-size: 14px; }
    .ml-member-head:hover { background: #f7f8fa; border-radius: 12px; }
    .ml-member-head .ml-avatar { width: 28px; height: 28px; font-size: 11px; flex: 0 0 28px; }
    .ml-member-head b { font-weight: 600; white-space: nowrap; }
    .ml-member-snip { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ml-gray); }
    .ml-member-tag { font-size: 11.5px; color: #389e0d; background: #f0fae8; border-radius: 6px; padding: 1px 6px; }
    .ml-member .ml-read-head { margin-bottom: 12px; }
    .ml-member-actions { display: flex; gap: 8px; margin-top: 12px; }
    .ml-sched-row { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .ml-sched-when { width: 190px; flex-shrink: 0; color: var(--ml-blue); font-weight: 600; }
    .ml-sched-main { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-sched-main span { color: var(--ml-gray); }
    .ml-sched-err { color: #e0342c; font-size: 12.5px; }
    .ml-send-group { display: inline-flex; }
    .ml-send-group .ml-btn-primary:first-child { border-radius: 10px 0 0 10px; }
    .ml-send-group .ml-btn-primary + .ml-btn-primary { border-radius: 0 10px 10px 0; border-left: 1px solid rgba(255,255,255,.35); padding: 0 10px; }
    .ml-when input { width: 100%; height: 38px; box-sizing: border-box; border: 1px solid #d5d8de; border-radius: 10px; padding: 0 12px; font-size: 14px; font-family: inherit; }
    @media (max-width: 900px) { .ml-side { width: 64px; flex-basis: 64px; } .ml-folder-name, .ml-folder-count, .ml-compose-btn span, .ml-side-foot span, .ml-folder-add span { display: none; } .ml-from { width: 120px; flex-basis: 120px; } .ml-snip { display: none; } }
  `;
  document.head.appendChild(st);
})();
// плавающая кнопка ИИ-чата NocoBase не используется (как и на других страницах) — прячем, чтобы не закрывала окно письма
if (!document.getElementById('cm-hide-ai-chat')) {
  const aiSt = document.createElement('style');
  aiSt.id = 'cm-hide-ai-chat';
  aiSt.textContent = '[role="button"][aria-label="Открыть ИИ-чат"], [role="button"][aria-label="Open AI chat"] { display: none !important; }';
  document.head.appendChild(aiSt);
}

// счётчик непрочитанных писем на пункте «Почта» верхнего меню (видно с любой страницы, где есть наши блоки)
if (!window.__mlBadgeTimer) {
  window.__mlBadgeTimer = true;
  (function() {
    const MAIL_API = location.protocol + '//' + location.hostname + ':8096/api';
    let off = false;
    function menuItem() {
      const els = document.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title');
      for (let i = 0; i < els.length; i++) { const t = (els[i].innerText || '').replace(/\d+\s*$/, '').trim(); if (t === 'Почта') return els[i]; }
      return null;
    }
    function paint(n) {
      window.__mlUnread = n;
      const it = menuItem();
      if (!it) return;
      let b = it.querySelector('.ml-menu-badge');
      if (!n) { if (b) b.remove(); return; }
      if (!b) {
        b = document.createElement('span');
        b.className = 'ml-menu-badge';
        // кружок в углу пункта меню (как у колокольчика): не меняет ширину пункта и не ломает строку меню
        b.style.cssText = 'position:absolute;top:5px;right:2px;min-width:16px;height:16px;line-height:16px;padding:0 4px;border-radius:8px;background:#ff4d4f;color:#fff;font-size:10.5px;font-weight:600;text-align:center;box-sizing:border-box;pointer-events:none;z-index:1;';
        it.style.position = 'relative';   // getComputedStyle в песочнице блоков недоступен
        it.appendChild(b);
      }
      const txt = n > 99 ? '99+' : String(n);
      if (b.textContent !== txt) b.textContent = txt;
    }
    async function poll() {
      if (off || /\/signin|\/signup/.test(location.pathname)) return;
      let token = null;
      try { token = localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { token = null; }
      if (!token) return;
      try {
        const r = await fetch(MAIL_API + '/unread', { headers: { Authorization: 'Bearer ' + token } });
        if (r.status === 403) { off = true; return; }   // почта для этой учётной записи не подключена
        if (!r.ok) return;
        const j = await r.json();
        paint(j.unseen || 0);
      } catch (e) { /* сервис недоступен — попробуем позже */ }
    }
    window.__mlBadgePoll = poll;
    window.__mlBadgePaint = paint;
    poll();
    setInterval(poll, 60000);
    // меню перерисовывается при переходах — возвращаем значок на место без запросов
    setInterval(function() { if (window.__mlUnread) paint(window.__mlUnread); }, 1500);
  })();
}

// ---------- иконки ----------
const IC = {
  pen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  inbox: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z"/></svg>',
  sent: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  draft: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>',
  spam: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>',
  trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  archive: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',
  folder: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  clip: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg>',
  flag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
  reply: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
  replyAll: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 17-5-5 5-5"/><path d="m12 17-5-5 5-5"/><path d="M22 18v-2a4 4 0 0 0-4-4H7"/></svg>',
  fwd: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>',
  read: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 7 12 13 2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
  move: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="m12 10 3 3-3 3"/><path d="M9 13h6"/></svg>',
  refresh: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>'
};
const FOLDER_ICON = { '\\Inbox': IC.inbox, '\\Sent': IC.sent, '\\Drafts': IC.draft, '\\Junk': IC.spam, '\\Trash': IC.trash, '\\Archive': IC.archive };
const AV_COLORS = ['#f06a4f', '#ff9e00', '#39b54a', '#1fa9e1', '#6c5ce7', '#e84393', '#00a78e', '#8e7cc3', '#4a90e2', '#d35400'];
function avColor(s) { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return AV_COLORS[h % AV_COLORS.length]; }
function initials(a) {
  const n = String((a && (a.name || a.address)) || '?').replace(/["']/g, '').trim();
  const parts = n.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function avatar(a) { return '<div class="ml-avatar" style="background:' + avColor(a && a.address) + '">' + esc(initials(a)) + '</div>'; }
function who(a) { return a ? (a.name || a.address || '') : ''; }
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function shortDate(iso) {
  const d = new Date(iso), now = new Date();
  if (isNaN(d)) return '';
  if (d.toDateString() === now.toDateString()) return pad(d.getHours()) + ':' + pad(d.getMinutes());
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'вчера';
  if (d.getFullYear() === now.getFullYear()) return d.getDate() + ' ' + MONTHS[d.getMonth()];
  return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
}
function longDate(iso) { const d = new Date(iso); if (isNaN(d)) return ''; return d.getDate() + ' ' + MONTHS_FULL[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function fmtSize(n) { if (!n) return ''; if (n < 1024) return n + ' Б'; if (n < 1048576) return Math.round(n / 1024) + ' КБ'; return (n / 1048576).toFixed(1).replace('.', ',') + ' МБ'; }
function extOf(name) { const m = String(name || '').match(/\.([a-z0-9]{1,5})$/i); return m ? m[1] : 'файл'; }
let toastTimer = null;
function toast(msg) {
  let t = document.getElementById('ml-toast');
  if (!t) { t = document.createElement('div'); t.id = 'ml-toast'; t.className = 'ml-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display = '';
  clearTimeout(toastTimer); toastTimer = setTimeout(function() { t.style.display = 'none'; }, 3500);
}

Object.assign(IC, {
  gear: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  dots: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  up: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>',
  down: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
  dl: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  answered: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
  clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  expand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
});
const FILTER_TITLES = { '': 'Все письма', unread: 'Непрочитанные', flagged: 'С флажком', attachments: 'С вложениями' };
function toastAction(msg, actionText, onAction, ms) {
  let t = document.getElementById('ml-toast');
  if (!t) { t = document.createElement('div'); t.id = 'ml-toast'; t.className = 'ml-toast'; document.body.appendChild(t); }
  t.innerHTML = '<span>' + esc(msg) + '</span><a>' + esc(actionText) + '</a>'; t.style.display = '';
  t.querySelector('a').addEventListener('click', function() { t.style.display = 'none'; onAction(); });
  clearTimeout(toastTimer); toastTimer = setTimeout(function() { t.style.display = 'none'; }, ms || 5000);
}
function modal(title, bodyHtml, opts) {
  opts = opts || {};
  const w = document.createElement('div');
  w.className = 'ml-modal-wrap';
  w.innerHTML = '<div class="ml-modal' + (opts.wide ? ' wide' : '') + '"><div class="ml-modal-head"><span>' + esc(title) + '</span>' + (opts.headExtra || '') + '<button class="x" title="Закрыть">✕</button></div>'
    + '<div class="ml-modal-body"' + (opts.flushBody ? ' style="padding:0;display:flex;"' : '') + '>' + bodyHtml + '</div>' + (opts.foot ? '<div class="ml-modal-foot">' + opts.foot + '</div>' : '') + '</div>';
  document.body.appendChild(w);
  const close = function() { w.remove(); document.removeEventListener('keydown', onKey, true); if (opts.onClose) opts.onClose(); };
  const onKey = function(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  w.querySelector('.x').addEventListener('click', close);
  w.addEventListener('mousedown', function(e) { if (e.target === w) close(); });
  w.__close = close;
  return w;
}
function askText(title, label, value, okText) {
  return new Promise(function(resolve) {
    const w = modal(title, '<label>' + esc(label) + '</label><input type="text" id="ml-ask" value="' + esc(value || '') + '">',
      { foot: '<button class="ml-btn" data-no>Отмена</button><button class="ml-btn ml-btn-primary" data-ok>' + esc(okText || 'Сохранить') + '</button>', onClose: function() { resolve(null); } });
    const inp = w.querySelector('#ml-ask');
    const ok = function() { const v = inp.value.trim(); resolve(v); w.remove(); };
    w.querySelector('[data-ok]').addEventListener('click', ok);
    w.querySelector('[data-no]').addEventListener('click', function() { w.__close(); });
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') ok(); });
    setTimeout(function() { inp.focus(); inp.select(); }, 30);
  });
}
function askConfirm(title, text, okText, danger) {
  return new Promise(function(resolve) {
    const w = modal(title, '<div style="font-size:14px;line-height:1.5;">' + text + '</div>',
      { foot: '<button class="ml-btn" data-no>Отмена</button><button class="ml-btn ml-btn-primary" data-ok' + (danger ? ' style="background:#e0342c;border-color:#e0342c;"' : '') + '>' + esc(okText || 'Да') + '</button>', onClose: function() { resolve(false); } });
    w.querySelector('[data-ok]').addEventListener('click', function() { resolve(true); w.remove(); });
    w.querySelector('[data-no]').addEventListener('click', function() { w.__close(); });
  });
}
function popupMenu(x, y, items) {
  closeMenus();
  const m = document.createElement('div');
  m.className = 'ml-menu'; m.id = 'ml-menu';
  m.innerHTML = items.map(function(it, i) { return it === '-' ? '<hr>' : '<div data-i="' + i + '" class="' + (it.on ? 'on ' : '') + (it.danger ? 'danger' : '') + '">' + (it.icon || '') + esc(it.text) + '</div>'; }).join('');
  document.body.appendChild(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, window.innerWidth - r.width - 8) + 'px';
  m.style.top = Math.min(y, window.innerHeight - r.height - 8) + 'px';
  m.querySelectorAll('[data-i]').forEach(function(d) { d.addEventListener('click', function() { closeMenus(); items[Number(d.getAttribute('data-i'))].run(); }); });
  setTimeout(function() { document.addEventListener('mousedown', function h(e) { if (!m.contains(e.target)) { closeMenus(); document.removeEventListener('mousedown', h); } }); }, 0);
}
function menuUnder(el, items) { const r = el.getBoundingClientRect(); popupMenu(r.left, r.bottom + 4, items); }
function closeMenus() { const m = document.getElementById('ml-menu'); if (m) m.remove(); }

// ---------- состояние ----------
const root = document.getElementById('ml-root');
const SCHED = '__scheduled__';   // псевдопапка «Запланированные» (отложенные письма хранит почтовый сервис)
const S = { me: null, settings: { name: '', signature: '', sigOnReply: true, threads: true }, sched: [], folders: [], folder: 'INBOX', filter: '', items: [], total: 0, page: 0, q: '', sel: new Set(), open: null, loading: false, contacts: null };

function fitHeight() {
  const app = root.querySelector('.ml-app');
  if (!app) return;
  const top = app.getBoundingClientRect().top;
  app.style.height = Math.max(520, window.innerHeight - top - 16) + 'px';
}
if (!window.__mlResize) { window.__mlResize = true; window.addEventListener('resize', function() { const r = document.getElementById('ml-root'); if (r && r.__fit) r.__fit(); }); }
root.__fit = fitHeight;

// ---------- экраны входа ----------
function showCard(html) { root.innerHTML = '<div class="ml-card">' + html + '</div>'; }
function showSetup(email, badPassword) {
  showCard('<h2>Подключение почты</h2><p>' + (badPassword ? 'Пароль от ящика <b>' + esc(email) + '</b> больше не подходит — видимо, его сменили. Введите новый.' : 'Введите пароль от почтового ящика <b>' + esc(email) + '</b>. Это нужно сделать один раз — дальше почта будет открываться сама, вместе с NocoBase.') + '</p>'
    + '<input type="password" id="ml-pass" placeholder="Пароль от почты" autocomplete="off"><div class="ml-err" id="ml-err"></div>'
    + '<button class="ml-btn ml-btn-primary" id="ml-pass-ok" style="width:100%;height:42px;justify-content:center;">Подключить</button>');
  const inp = root.querySelector('#ml-pass'), btn = root.querySelector('#ml-pass-ok'), err = root.querySelector('#ml-err');
  async function go() {
    if (!inp.value) { err.textContent = 'Введите пароль'; return; }
    btn.disabled = true; btn.textContent = 'Проверяем…'; err.textContent = '';
    try { await api('/setup', { json: { password: inp.value } }); inp.value = ''; start(); }
    catch (e) { err.textContent = e.message; btn.disabled = false; btn.textContent = 'Подключить'; }
  }
  btn.addEventListener('click', go);
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') go(); });
  inp.focus();
}
function handleFatal(e) {
  if (e.code === 'NO_PASSWORD' || e.code === 'BAD_PASSWORD') { showSetup(S.me ? S.me.email : '', e.code === 'BAD_PASSWORD'); return true; }
  if (e.code === 'NOT_ENABLED') { showCard('<h2>Почта скоро появится</h2><p>Почту подключаем постепенно. Для вашей учётной записи она пока не включена.</p>'); return true; }
  if (e.code === 'NO_SESSION') { showCard('<h2>Сессия закончилась</h2><p>Обновите страницу и войдите в NocoBase заново.</p>'); return true; }
  if (e.code === 'OFFLINE') { showCard('<h2>Почта недоступна</h2><p>Почтовый сервис не отвечает. Попробуйте обновить страницу через минуту.</p>'); return true; }
  return false;
}

// ---------- каркас и папки ----------
function renderShell() {
  root.innerHTML = '<div class="ml-app">'
    + '<div class="ml-side"><button class="ml-compose-btn" id="ml-compose">' + IC.pen + '<span>Написать письмо</span></button><div id="ml-folders"></div>'
    + '<div class="ml-folder ml-folder-add" id="ml-folder-add">' + IC.plus + '<span>Новая папка</span></div>'
    + '<div class="ml-side-foot"><span title="' + esc(S.me.email) + '">' + esc(S.me.email) + '</span><button class="ml-gear" id="ml-settings" title="Настройки почты: имя и подпись">' + IC.gear + '</button></div></div>'
    + '<div class="ml-main" id="ml-main"></div></div>';
  root.querySelector('#ml-compose').addEventListener('click', function() { openCompose({}); });
  root.querySelector('#ml-folder-add').addEventListener('click', createFolder);
  root.querySelector('#ml-settings').addEventListener('click', openSettings);
  fitHeight();
  setTimeout(fitHeight, 300);
}
function currentFolder() {
  if (S.folder === SCHED) return { path: SCHED, name: 'Запланированные', special: 'scheduled', unseen: 0, total: S.sched.length };
  return S.folders.find(function(f) { return f.path === S.folder; }) || { path: S.folder, name: S.folder, special: null, unseen: 0, total: 0 };
}
// строка списка может быть цепочкой: её письма в текущей папке — uids
function itemOf(uid) { return S.items.find(function(x) { return x.uid === uid; }); }
function uidsOf(list) {
  const out = [];
  list.forEach(function(u) { const it = itemOf(u); (it && it.uids ? it.uids : [u]).forEach(function(x) { if (out.indexOf(x) === -1) out.push(x); }); });
  return out;
}
function rowsWith(uids) { return S.items.filter(function(it) { return (it.uids || [it.uid]).some(function(u) { return uids.indexOf(u) !== -1; }); }); }
function useThreads() { const sp = currentFolder().special; return S.settings.threads !== false && sp !== '\\Drafts' && sp !== 'scheduled'; }
async function loadScheduled() { try { S.sched = (await api('/scheduled')).items || []; } catch (e) { /* ignore */ } }
function folderBySpecial(sp) { return S.folders.find(function(f) { return f.special === sp; }); }
function openFolder(path) { S.folder = path; S.q = ''; S.filter = ''; S.open = null; renderFolders(); loadList(true); }
function renderFolders() {
  const el = root.querySelector('#ml-folders');
  if (!el) return;
  let html = '', sepDone = false;
  S.folders.forEach(function(f) {
    if (!f.special && !f.depth && !sepDone) { html += '<div class="ml-side-sep"></div>'; sepDone = true; }
    const cnt = f.special === '\\Drafts' ? f.total : f.unseen;
    const showCnt = cnt && f.special !== '\\Sent' && f.special !== '\\Trash' && f.special !== '\\Archive';
    html += '<div class="ml-folder' + (f.path === S.folder ? ' active' : '') + '" data-folder="' + esc(f.path) + '"' + (f.depth ? ' style="padding-left:' + (12 + f.depth * 20) + 'px;"' : '') + ' title="' + esc(f.path) + '">' + (FOLDER_ICON[f.special] || IC.folder)
      + '<span class="ml-folder-name">' + esc(f.name) + (f.own ? ' <small style="color:#87898f;font-weight:400;">· своя папка</small>' : '') + '</span>' + (showCnt ? '<span class="ml-folder-count">' + cnt + '</span>' : '') + '</div>';
    if (f.special === '\\Drafts' && (S.sched.length || S.folder === SCHED))
      html += '<div class="ml-folder' + (S.folder === SCHED ? ' active' : '') + '" data-sched="1">' + IC.clock + '<span class="ml-folder-name">Запланированные</span>' + (S.sched.length ? '<span class="ml-folder-count">' + S.sched.length + '</span>' : '') + '</div>';
  });
  el.innerHTML = html;
  const sd = el.querySelector('[data-sched]');
  if (sd) sd.addEventListener('click', function() { S.folder = SCHED; S.q = ''; S.filter = ''; S.open = null; renderFolders(); loadList(true); });
  el.querySelectorAll('[data-folder]').forEach(function(d) {
    const path = d.getAttribute('data-folder');
    d.addEventListener('click', function() { openFolder(path); });
    d.addEventListener('contextmenu', function(e) { e.preventDefault(); folderMenu(path, e.clientX, e.clientY); });
    // перетаскивание писем в папку
    d.addEventListener('dragover', function(e) { if (path !== S.folder && window.__mlDragUids) { e.preventDefault(); d.classList.add('drop'); } });
    d.addEventListener('dragleave', function() { d.classList.remove('drop'); });
    d.addEventListener('drop', function(e) {
      e.preventDefault(); d.classList.remove('drop');
      const uids = window.__mlDragUids; window.__mlDragUids = null;
      if (!uids || path === S.folder) return;
      const f = S.folders.find(function(x) { return x.path === path; });
      if (f && f.special === '\\Trash') removeUids(uids, 'delete');
      else if (f && f.special === '\\Junk') removeUids(uids, 'spam');
      else removeUids(uids, 'move', path);
    });
  });
  const inbox = folderBySpecial('\\Inbox');
  if (inbox && window.__mlBadgePaint) window.__mlBadgePaint(inbox.unseen);
  try { document.title = (inbox && inbox.unseen ? '(' + inbox.unseen + ') ' : '') + 'Почта'; } catch (e) { /* ignore */ }
}
function folderMenu(path, x, y) {
  const f = S.folders.find(function(z) { return z.path === path; });
  if (!f) return;
  const items = [{ text: 'Открыть', run: function() { openFolder(path); } }];
  if (f.unseen) items.push({ text: 'Отметить все прочитанными', icon: IC.read, run: function() { markAllRead(path); } });
  if (f.special === '\\Trash' || f.special === '\\Junk') items.push('-', { text: 'Очистить папку', icon: IC.trash, danger: true, run: function() { emptyFolder(path); } });
  if (!f.special) items.push('-', { text: 'Переименовать', icon: IC.pen, run: function() { renameFolder(f); } }, { text: 'Удалить папку', icon: IC.trash, danger: true, run: function() { deleteFolder(f); } });
  popupMenu(x, y, items);
}
async function loadFolders() {
  const d = await api('/folders');
  S.folders = d.folders || [];
  if (!S.folders.some(function(f) { return f.path === S.folder; })) { const ib = folderBySpecial('\\Inbox'); S.folder = ib ? ib.path : (S.folders[0] ? S.folders[0].path : 'INBOX'); }
  renderFolders();
}
async function createFolder() {
  const name = await askText('Новая папка', 'Название папки', '', 'Создать');
  if (!name) return;
  try { await api('/folder/create', { json: { name: name } }); await loadFolders(); toast('Папка «' + name + '» создана'); }
  catch (e) { toast(e.message); }
}
async function renameFolder(f) {
  const name = await askText('Переименовать папку', 'Новое название', f.name, 'Переименовать');
  if (!name || name === f.name) return;
  try { await api('/folder/rename', { json: { path: f.path, name: name } }); if (S.folder === f.path) S.folder = name; await loadFolders(); toast('Папка переименована'); }
  catch (e) { toast(e.message); }
}
async function deleteFolder(f) {
  if (!(await askConfirm('Удалить папку', 'Удалить папку «' + esc(f.name) + '»?' + (f.total ? ' Письма из неё (' + f.total + ') переместятся в корзину.' : ''), 'Удалить', true))) return;
  try { await api('/folder/delete', { json: { path: f.path } }); if (S.folder === f.path) S.folder = 'INBOX'; await loadFolders(); loadList(true); toast('Папка удалена'); }
  catch (e) { toast(e.message); }
}
async function markAllRead(path) {
  try {
    await api('/markall', { json: { folder: path } });
    if (path === S.folder) S.items.forEach(function(m) { m.seen = true; });
    if (!S.open) renderList();
    refreshCounts(); toast('Все письма отмечены прочитанными');
  } catch (e) { toast(e.message); }
}
async function emptyFolder(path) {
  const f = S.folders.find(function(z) { return z.path === path; });
  if (!(await askConfirm('Очистить папку', 'Удалить навсегда все письма в папке «' + esc(f ? f.name : path) + '»? Восстановить их будет нельзя.', 'Очистить', true))) return;
  try { await api('/empty', { json: { folder: path } }); if (path === S.folder) { S.items = []; S.total = 0; S.open = null; renderList(); } refreshCounts(); toast('Папка очищена'); }
  catch (e) { toast(e.message); }
}

// ---------- список писем ----------
function listToolbar() {
  const n = S.sel.size;
  const all = S.items.length && n === S.items.length;
  const f = currentFolder();
  let h = '<div class="ml-toolbar"><span class="ml-check' + (all ? ' on' : '') + '" id="ml-selall" title="Выделить все" style="margin-right:6px;"></span>';
  if (n) {
    h += '<button class="ml-tbtn" data-act="delete">' + IC.trash + 'Удалить</button>'
      + (f.special !== '\\Junk' ? '<button class="ml-tbtn" data-act="spam">' + IC.spam + 'Спам</button>' : '<button class="ml-tbtn" data-act="notspam">' + IC.inbox + 'Не спам</button>')
      + '<button class="ml-tbtn" data-act="read">' + IC.read + 'Прочитано</button><button class="ml-tbtn" data-act="unread">Не прочитано</button>'
      + '<button class="ml-tbtn" data-act="flag">' + IC.flag + 'Флажок</button>'
      + '<button class="ml-tbtn" data-act="move">' + IC.move + 'В папку</button><span style="color:#87898f;font-size:13px;margin-left:4px;">выбрано ' + n + '</span>';
  } else {
    h += '<button class="ml-tbtn icon" data-act="refresh" title="Проверить почту">' + IC.refresh + '</button>'
      + '<span class="ml-title" id="ml-filter" title="Показать только…">' + esc(S.q ? 'Поиск: ' + S.q : f.name) + (S.filter ? ' <small>· ' + esc(FILTER_TITLES[S.filter]) + '</small>' : '') + IC.down + '</span>';
    if (f.unseen && !S.q) h += '<button class="ml-tbtn" data-act="markall">' + IC.read + 'Прочитать все</button>';
    if ((f.special === '\\Trash' || f.special === '\\Junk') && S.total) h += '<button class="ml-tbtn" data-act="empty">' + IC.trash + 'Очистить папку</button>';
  }
  h += '<div class="ml-search">' + IC.search + '<input id="ml-q" placeholder="Поиск по почте" value="' + esc(S.q) + '">' + (S.q ? '<b id="ml-q-clear" title="Сбросить поиск">✕</b>' : '') + '</div></div>';
  return h;
}
function rowHtml(m) {
  const sp = currentFolder().special;
  const sent = sp === '\\Sent' || sp === '\\Drafts';
  const peer = sent ? (m.to && m.to[0]) : (m.from && m.from[0]);
  const peerName = sent ? (m.draft ? 'Черновик' : 'Кому: ') + (m.to || []).map(who).join(', ') : (m.participants && m.participants.length > 1 ? m.participants.join(', ') : who(peer));
  return '<div class="ml-row' + (m.seen ? '' : ' unread') + (S.sel.has(m.uid) ? ' sel' : '') + '" data-uid="' + m.uid + '" draggable="true">'
    + '<div class="ml-sel-cell" data-check="' + m.uid + '" title="Выбрать письмо"><span class="ml-check' + (S.sel.has(m.uid) ? ' on' : '') + '"></span></div>'
    + '<span class="ml-unread-dot"' + (m.seen ? '' : ' title="Не прочитано"') + '></span>'
    + '<div class="ml-avatar-wrap">' + avatar(peer) + '</div>'
    + '<div class="ml-from" title="' + esc(peer ? peer.address : '') + '">' + esc(peerName || '(без отправителя)') + (m.count > 1 ? '<span class="ml-count" title="Писем в цепочке">' + m.count + '</span>' : '') + '</div>'
    + '<div class="ml-line">' + (m.important ? '<span class="ml-imp" title="Важное">!</span>' : '') + '<span class="ml-subj">' + esc(m.subject || '(без темы)') + '</span><span class="ml-snip">' + esc(m.snippet || '') + '</span></div>'
    + '<div class="ml-icons">' + (m.answered ? '<span title="Вы ответили на это письмо" style="display:inline-flex;">' + IC.answered + '</span>' : '') + (m.attachments ? IC.clip : '')
    + '<span class="ml-flag' + (m.flagged ? ' on' : '') + '" data-flag="' + m.uid + '" title="Отметить флажком">' + IC.flag + '</span></div>'
    + '<div class="ml-date" title="' + esc(longDate(m.date)) + '">' + esc(shortDate(m.date)) + '</div></div>';
}
function renderList() {
  const main = root.querySelector('#ml-main');
  if (!main) return;
  let body;
  if (S.loading && !S.items.length) body = '<div class="ml-loading">Загружаем письма…</div>';
  else if (!S.items.length) body = '<div class="ml-empty"><b>' + (S.q ? 'Ничего не нашлось' : S.filter ? 'Таких писем нет' : 'Писем нет') + '</b>' + (S.q ? 'Попробуйте другой запрос' : S.filter ? 'Попробуйте показать все письма' : 'В этой папке пока пусто') + '</div>';
  else body = S.items.map(rowHtml).join('') + (S.items.length < S.total ? '<button class="ml-btn ml-more" id="ml-more">Показать ещё</button>' : '');
  const scroll = main.querySelector('#ml-list') ? main.querySelector('#ml-list').scrollTop : 0;
  main.innerHTML = listToolbar() + '<div class="ml-list' + (S.sel.size ? ' selecting' : '') + '" id="ml-list">' + body + '</div>';
  main.querySelector('#ml-list').scrollTop = scroll;
  wireList();
}
function rowMenu(uid, x, y) {
  const m = S.items.find(function(z) { return z.uid === uid; });
  if (!m) return;
  const uids = uidsOf(S.sel.has(uid) ? Array.from(S.sel) : [uid]);
  const sp = currentFolder().special;
  popupMenu(x, y, [
    { text: 'Открыть', run: function() { openItem(m); } },
    { text: 'Ответить', icon: IC.reply, run: async function() { const full = await fetchMessage(uid); if (full) openCompose(replyDraft(full, 'reply')); } },
    { text: 'Переслать', icon: IC.fwd, run: async function() { const full = await fetchMessage(uid); if (full) openCompose(replyDraft(full, 'forward')); } },
    '-',
    { text: m.seen ? 'Отметить непрочитанным' : 'Отметить прочитанным', icon: IC.read, run: function() { setSeen(uids, !m.seen); } },
    { text: m.flagged ? 'Снять флажок' : 'Отметить флажком', icon: IC.flag, run: function() { setFlag(uids, !m.flagged); } },
    { text: 'Переместить в папку…', icon: IC.move, run: function() { const r = document.querySelector('.ml-row[data-uid="' + uid + '"]').getBoundingClientRect(); moveMenu(r.left + 200, r.bottom, uids); } },
    sp !== '\\Junk' ? { text: 'Это спам', icon: IC.spam, run: function() { removeUids(uids, 'spam'); } } : { text: 'Не спам', icon: IC.inbox, run: function() { const ib = folderBySpecial('\\Inbox'); removeUids(uids, 'move', ib ? ib.path : 'INBOX'); } },
    { text: 'Удалить', icon: IC.trash, danger: true, run: function() { removeUids(uids, 'delete'); } }
  ]);
}
function wireList() {
  const main = root.querySelector('#ml-main');
  const q = main.querySelector('#ml-q');
  q.addEventListener('keydown', function(e) { if (e.key === 'Enter') { S.q = q.value.trim(); S.open = null; loadList(true); } if (e.key === 'Escape') { q.value = ''; if (S.q) { S.q = ''; loadList(true); } } });
  const qc = main.querySelector('#ml-q-clear');
  if (qc) qc.addEventListener('click', function() { S.q = ''; loadList(true); });
  const selAll = main.querySelector('#ml-selall');
  if (selAll) selAll.addEventListener('click', function() { if (S.sel.size === S.items.length) S.sel.clear(); else S.items.forEach(function(m) { S.sel.add(m.uid); }); renderList(); });
  const fl = main.querySelector('#ml-filter');
  if (fl) fl.addEventListener('click', function() {
    menuUnder(fl, Object.keys(FILTER_TITLES).map(function(k) { return { text: FILTER_TITLES[k], on: S.filter === k, run: function() { S.filter = k; loadList(true); } }; }));
  });
  main.querySelectorAll('[data-act]').forEach(function(b) { b.addEventListener('click', function() { bulk(b.getAttribute('data-act'), b); }); });
  const more = main.querySelector('#ml-more');
  if (more) more.addEventListener('click', function() { more.disabled = true; more.textContent = 'Загружаем…'; S.page++; loadList(false); });
  main.querySelectorAll('.ml-row').forEach(function(row) {
    const uid = Number(row.getAttribute('data-uid'));
    row.addEventListener('click', function(e) {
      const t = e.target;
      if (t.closest('[data-check]') || e.shiftKey || e.ctrlKey || e.metaKey) { if (S.sel.has(uid)) S.sel.delete(uid); else S.sel.add(uid); renderList(); return; }
      if (t.closest('[data-flag]')) { const m = itemOf(uid); setFlag(uidsOf([uid]), !m.flagged); return; }
      const m = S.items.find(function(x) { return x.uid === uid; });
      if (m && m.draft && currentFolder().special === '\\Drafts') { openDraft(uid); return; }
      openItem(m);
    });
    row.addEventListener('contextmenu', function(e) { e.preventDefault(); rowMenu(uid, e.clientX, e.clientY); });
    row.addEventListener('dragstart', function(e) {
      const uids = uidsOf(S.sel.has(uid) ? Array.from(S.sel) : [uid]);
      window.__mlDragUids = uids;
      try { e.dataTransfer.setData('text/plain', uids.length + ' писем'); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* ignore */ }
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', function() { row.classList.remove('dragging'); setTimeout(function() { window.__mlDragUids = null; }, 100); });
  });
}
async function loadList(reset) {
  if (S.folder === SCHED) { S.open = null; S.sel.clear(); await loadScheduled(); renderFolders(); renderScheduled(); return; }
  if (reset) { S.page = 0; S.items = []; S.sel.clear(); S.loading = true; S.open = null; renderList(); }
  const folder = S.folder, q = S.q, page = S.page, filter = S.filter;
  try {
    const d = await api((useThreads() ? '/threads?' : '/messages?') + qs({ folder: folder, page: page, q: q, filter: filter }));
    if (folder !== S.folder || q !== S.q || filter !== S.filter) return;
    S.total = d.total;
    S.items = page === 0 ? d.items : S.items.concat(d.items.filter(function(m) { return !S.items.some(function(x) { return x.uid === m.uid; }); }));
  } catch (e) { if (handleFatal(e)) return; toast(e.message); }
  S.loading = false;
  if (!S.open) renderList();
}
async function setSeen(uids, seen) {
  rowsWith(uids).forEach(function(m) { m.seen = seen; });
  if (!S.open) renderList();
  try { await api('/flags', { json: { folder: S.folder, uids: uids, add: seen ? ['\\Seen'] : [], remove: seen ? [] : ['\\Seen'] } }); refreshCounts(); }
  catch (e) { toast(e.message); }
}
async function setFlag(uids, on) {
  rowsWith(uids).forEach(function(m) { m.flagged = on; });
  if (!S.open) renderList();
  try { await api('/flags', { json: { folder: S.folder, uids: uids, add: on ? ['\\Flagged'] : [], remove: on ? [] : ['\\Flagged'] } }); }
  catch (e) { toast(e.message); }
}
async function removeUids(uids, action, to) {
  const path = action === 'delete' ? '/delete' : (action === 'spam' ? '/spam' : '/move');
  const keep = S.items, keepTotal = S.total;
  const gone = rowsWith(uids);
  S.items = S.items.filter(function(m) { return gone.indexOf(m) === -1; });
  S.total -= gone.length; S.sel.clear(); S.open = null; renderList();
  try {
    await api(path, { json: { folder: S.folder, uids: uids, to: to } });
    const target = to && S.folders.find(function(f) { return f.path === to; });
    toast(action === 'delete' ? (currentFolder().special === '\\Trash' ? 'Удалено навсегда' : 'Перемещено в корзину') : action === 'spam' ? 'Перемещено в спам' : 'Перемещено в «' + (target ? target.name : to) + '»');
    refreshCounts();
  } catch (e) { S.items = keep; S.total = keepTotal; renderList(); toast(e.message); }
}
function moveMenu(x, y, uids) {
  popupMenu(x, y, S.folders.filter(function(f) { return f.path !== S.folder; }).map(function(f) {
    return { text: f.name, icon: FOLDER_ICON[f.special] || IC.folder, run: function() { removeUids(uids, 'move', f.path); } };
  }).concat(['-', { text: 'Новая папка…', icon: IC.plus, run: async function() {
    const name = await askText('Новая папка', 'Название папки', '', 'Создать и переместить');
    if (!name) return;
    try { await api('/folder/create', { json: { name: name } }); await loadFolders(); const f = S.folders.find(function(z) { return z.name === name; }); if (f) removeUids(uids, 'move', f.path); }
    catch (e) { toast(e.message); }
  } }]));
}
function bulk(act, btn) {
  const uids = uidsOf(Array.from(S.sel));
  if (act === 'refresh') { refreshCounts(); loadList(true); return; }
  if (act === 'markall') { markAllRead(S.folder); return; }
  if (act === 'empty') { emptyFolder(S.folder); return; }
  if (!uids.length) return;
  if (act === 'delete') removeUids(uids, 'delete');
  else if (act === 'spam') removeUids(uids, 'spam');
  else if (act === 'notspam') { const ib = folderBySpecial('\\Inbox'); removeUids(uids, 'move', ib ? ib.path : 'INBOX'); }
  else if (act === 'read') { setSeen(uids, true); S.sel.clear(); renderList(); }
  else if (act === 'unread') { setSeen(uids, false); S.sel.clear(); renderList(); }
  else if (act === 'flag') { const allOn = rowsWith(uids).every(function(m) { return m.flagged; }); setFlag(uids, !allOn); S.sel.clear(); renderList(); }
  else if (act === 'move') { const r = btn.getBoundingClientRect(); moveMenu(r.left, r.bottom + 4, uids); }
}
async function refreshCounts() {
  try {
    const before = folderBySpecial('\\Inbox');
    const prevUnseen = before ? before.unseen : 0, prevTotal = before ? before.total : 0;
    await loadFolders();
    const after = folderBySpecial('\\Inbox');
    const schedBefore = S.sched.length;
    await loadScheduled();
    if (S.sched.length !== schedBefore) { renderFolders(); if (S.folder === SCHED && !S.open) renderScheduled(); }
    if (S.folder === SCHED) return;
    if (after && (after.total !== prevTotal || after.unseen > prevUnseen) && S.folder === after.path && !S.q && !S.open && S.page === 0 && !S.sel.size) loadList(false);
    else if (!S.open && !S.sel.size && root.querySelector('#ml-selall')) renderList();
  } catch (e) { /* тихо: попробуем в следующий раз */ }
}
// ---------- запланированные письма ----------
function whenText(iso) {
  const d = new Date(iso), now = new Date();
  if (isNaN(d)) return '';
  const t = pad(d.getHours()) + ':' + pad(d.getMinutes());
  if (d.toDateString() === now.toDateString()) return 'сегодня в ' + t;
  const tm = new Date(now); tm.setDate(now.getDate() + 1);
  if (d.toDateString() === tm.toDateString()) return 'завтра в ' + t;
  return d.getDate() + ' ' + MONTHS_FULL[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '') + ' в ' + t;
}
function renderScheduled() {
  const main = root.querySelector('#ml-main');
  if (!main) return;
  const rows = S.sched.map(function(j) {
    return '<div class="ml-sched-row"><div class="ml-sched-when">' + IC.clock + ' ' + esc(whenText(j.sendAt)) + '</div>'
      + '<div class="ml-sched-main"><b>' + esc(j.subject || '(без темы)') + '</b> <span>· кому: ' + esc((j.to || []).join(', ')) + '</span>'
      + (j.lastError ? '<div class="ml-sched-err">Не отправилось с ' + j.attempts + '-й попытки: ' + esc(j.lastError) + ' — попробуем ещё раз</div>' : '') + '</div>'
      + '<button class="ml-btn" data-now="' + esc(j.id) + '">Отправить сейчас</button><button class="ml-btn" data-cancel="' + esc(j.id) + '" title="Письмо вернётся в черновики">Отменить</button></div>';
  }).join('');
  main.innerHTML = '<div class="ml-toolbar"><span style="font-size:17px;font-weight:600;margin-left:4px;">Запланированные</span><span style="margin-left:10px;color:#87898f;font-size:13px;">письма уйдут сами в назначенное время, даже если NocoBase закрыт</span></div>'
    + '<div class="ml-list">' + (rows || '<div class="ml-empty"><b>Запланированных писем нет</b>Чтобы отправить письмо позже, нажмите ⏰ рядом с кнопкой «Отправить»</div>') + '</div>';
  main.querySelectorAll('[data-now]').forEach(function(b) { b.addEventListener('click', async function() {
    try { await api('/scheduled/now', { json: { id: b.getAttribute('data-now') } }); toast('Письмо отправляется'); setTimeout(function() { loadList(true); refreshCounts(); }, 3000); } catch (e) { toast(e.message); }
  }); });
  main.querySelectorAll('[data-cancel]').forEach(function(b) { b.addEventListener('click', async function() {
    try { await api('/scheduled/cancel', { json: { id: b.getAttribute('data-cancel') } }); toast('Отправка отменена — письмо в черновиках'); loadList(true); refreshCounts(); } catch (e) { toast(e.message); }
  }); });
}

// ---------- чтение письма ----------
const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function blockRemote(html) {
  // картинки из интернета не загружаем, пока не нажали «Показать картинки»: вместо «битой» иконки — пустое место нужного размера
  return String(html || '').replace(/(<img\b[^>]*?)\ssrc\s*=\s*(["']?)(https?:[^"'\s>]*)\2/gi, '$1 src="' + BLANK_IMG + '" data-remote="1"')
    .replace(/(<(?:td|table|div|body)\b[^>]*?)\sbackground\s*=\s*(["']?)https?:[^"'\s>]*\2/gi, '$1');
}
function frameDoc(html, allowImages) {
  const csp = allowImages ? "img-src * data:; style-src 'unsafe-inline' *; font-src * data:" : "img-src data:; style-src 'unsafe-inline'; font-src data:";
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; ' + csp + '"><base target="_blank">'
    + '<style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#2c2d2e;word-wrap:break-word;overflow-wrap:anywhere;}img{max-width:100%;height:auto;}img[data-remote]{background:#f4f5f7;}blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #d5d8de;color:#555;}pre{white-space:pre-wrap;}table{max-width:100%;}a{color:#005ff9;}</style></head><body>'
    + (allowImages ? html : blockRemote(html)) + '</body></html>';
}
function hasRemoteImages(html) { return /<img[^>]+src=["']?https?:/i.test(html) || /url\(\s*['"]?https?:/i.test(html) || /\sbackground=["']?https?:/i.test(html); }
function memberBox(k) { const els = root.querySelectorAll('[data-member]'); for (let i = 0; i < els.length; i++) if (els[i].getAttribute('data-member') === k) return els[i]; return null; }
async function fetchMessage(uid, folder) {
  try { const m = await api('/message?' + qs({ folder: folder || S.folder, uid: uid })); m.folder = folder || S.folder; return m; }
  catch (e) { if (!handleFatal(e)) toast(e.message); return null; }
}
function markItemSeen(uid) {
  const it = S.items.find(function(x) { return x.uid === uid || (x.uids && x.uids.indexOf(uid) !== -1); });
  if (it && !it.seen) { it.seen = true; refreshCounts(); }
}
async function openMessage(uid) {
  S.open = { uid: uid, loading: true };
  const main = root.querySelector('#ml-main');
  main.innerHTML = readToolbar() + '<div class="ml-read"><div class="ml-loading">Открываем письмо…</div></div>';
  wireReadToolbar();
  const m = await fetchMessage(uid);
  if (!m) { S.open = null; renderList(); return; }
  if (!S.open || S.open.uid !== uid) return;
  S.open = m;
  markItemSeen(uid);
  renderMessage(false);
}
// цепочка: все письма переписки (включая ваши ответы из «Отправленных»); последнее и непрочитанные раскрыты
async function openThread(item) {
  S.open = { uid: item.uid, loading: true, thread: true, item: item };
  const main = root.querySelector('#ml-main');
  main.innerHTML = readToolbar() + '<div class="ml-read"><div class="ml-loading">Открываем переписку…</div></div>';
  wireReadToolbar();
  let members;
  try { members = (await api('/thread?' + qs({ folder: S.folder, uid: item.uid }))).members || []; }
  catch (e) { if (!handleFatal(e)) toast(e.message); S.open = null; renderList(); return; }
  if (!S.open || S.open.uid !== item.uid) return;
  const T = { uid: item.uid, thread: true, item: item, members: members, full: {}, expanded: {}, images: {} };
  members.forEach(function(x, i) { if (i === members.length - 1 || !x.seen) T.expanded[x.folder + '#' + x.uid] = true; });
  S.open = T;
  renderThread();
  // письма, которые раскрыты сразу, подгружаем (заодно они отмечаются прочитанными)
  for (const x of members) { const k = x.folder + '#' + x.uid; if (T.expanded[k]) await loadMember(x, k); }
  markItemSeen(item.uid);
}
async function loadMember(x, k) {
  const T = S.open;
  if (!T || !T.thread || T.full[k]) return;
  const m = await fetchMessage(x.uid, x.folder);
  if (!m || S.open !== T) return;
  T.full[k] = m;
  const box = memberBox(k);
  if (box) paintMember(box, x, k);
}
function lastLoaded() {
  const T = S.open;
  if (!T || !T.thread) return T;
  for (let i = T.members.length - 1; i >= 0; i--) { const k = T.members[i].folder + '#' + T.members[i].uid; if (T.full[k] && !T.members[i].sent) return T.full[k]; }
  for (let i = T.members.length - 1; i >= 0; i--) { const k = T.members[i].folder + '#' + T.members[i].uid; if (T.full[k]) return T.full[k]; }
  return null;
}
function renderThread() {
  const T = S.open, main = root.querySelector('#ml-main');
  const subj = (T.members[T.members.length - 1] || {}).subject || T.item.subject || '(без темы)';
  main.innerHTML = readToolbar() + '<div class="ml-read"><h1>' + (T.item.important ? '<span class="ml-imp" title="Важное">!</span>' : '') + esc(subj)
    + ' <span class="ml-thread-count">' + T.members.length + ' ' + plural(T.members.length, 'письмо', 'письма', 'писем') + '</span></h1>'
    + T.members.map(function(x) { const k = x.folder + '#' + x.uid; return '<div class="ml-member' + (T.expanded[k] ? ' open' : '') + '" data-member="' + esc(k) + '"></div>'; }).join('')
    + '<div class="ml-quick-reply" id="ml-quick-reply">Нажмите здесь, чтобы ответить…</div></div>';
  wireReadToolbar();
  T.members.forEach(function(x) { const k = x.folder + '#' + x.uid; paintMember(memberBox(k), x, k); });
  main.querySelector('#ml-quick-reply').addEventListener('click', function() { const m = lastLoaded(); if (m) openCompose(replyDraft(m, 'reply')); });
}
function paintMember(box, x, k) {
  const T = S.open;
  const from = (x.from && x.from[0]) || {};
  const who2 = from.address === S.me.email ? 'Я' : (from.name || from.address || '');
  if (!T.expanded[k]) {
    box.className = 'ml-member';
    box.innerHTML = '<div class="ml-member-head">' + avatar(from) + '<b>' + esc(who2) + '</b>' + (x.sent ? '<span class="ml-member-tag">отправлено</span>' : '')
      + '<span class="ml-member-snip">' + esc(x.snippet || '') + '</span>' + (x.attachments ? IC.clip : '') + '<span class="ml-read-date">' + esc(shortDate(x.date)) + '</span></div>';
    box.querySelector('.ml-member-head').addEventListener('click', function() { T.expanded[k] = true; paintMember(box, x, k); loadMember(x, k); });
    return;
  }
  box.className = 'ml-member open';
  const m = T.full[k];
  if (!m) { box.innerHTML = '<div class="ml-loading" style="padding:16px;">Загружаем письмо…</div>'; return; }
  box.innerHTML = msgBlockHtml(m, k, !!T.images[k], true)
    + '<div class="ml-member-actions"><button class="ml-btn" data-mact="reply">' + IC.reply + 'Ответить</button><button class="ml-btn" data-mact="replyAll">Ответить всем</button><button class="ml-btn" data-mact="forward">' + IC.fwd + 'Переслать</button></div>';
  wireMsgBlock(box, m, k, !!T.images[k], function() { T.images[k] = true; paintMember(box, x, k); });
  box.querySelector('.ml-read-head').addEventListener('click', function(e) { if (e.target.closest('a,button')) return; T.expanded[k] = false; paintMember(box, x, k); });
  box.querySelectorAll('[data-mact]').forEach(function(b) { b.addEventListener('click', function() { openCompose(replyDraft(m, b.getAttribute('data-mact'))); }); });
}
function neighbour(dir) {
  if (!S.open) return null;
  const i = S.items.findIndex(function(x) { return x.uid === S.open.uid; });
  if (i === -1) return null;
  const n = S.items[i + dir];
  return n || null;
}
function openItem(it) { if (!it) return; if (it.count > 1) openThread(it); else openMessage(it.uid); }
function readToolbar() {
  const f = currentFolder();
  const prev = neighbour(-1), next = neighbour(1);
  return '<div class="ml-toolbar"><button class="ml-tbtn" data-ract="back" title="Назад к списку (Esc)">' + IC.back + 'Назад</button>'
    + '<button class="ml-tbtn" data-ract="reply">' + IC.reply + 'Ответить</button><button class="ml-tbtn" data-ract="replyAll">' + IC.replyAll + 'Ответить всем</button>'
    + '<button class="ml-tbtn" data-ract="forward">' + IC.fwd + 'Переслать</button>'
    + '<button class="ml-tbtn" data-ract="delete" title="Удалить (Delete)">' + IC.trash + 'Удалить</button>'
    + (f.special !== '\\Junk' ? '<button class="ml-tbtn" data-ract="spam">' + IC.spam + 'Спам</button>' : '')
    + '<button class="ml-tbtn" data-ract="move">' + IC.move + 'В папку</button>'
    + '<button class="ml-tbtn icon" data-ract="more" title="Ещё">' + IC.dots + '</button>'
    + '<span style="margin-left:auto;display:inline-flex;gap:2px;"><button class="ml-tbtn icon" data-ract="prev" title="Предыдущее письмо"' + (prev ? '' : ' disabled') + '>' + IC.up + '</button>'
    + '<button class="ml-tbtn icon" data-ract="next" title="Следующее письмо"' + (next ? '' : ' disabled') + '>' + IC.down + '</button></span></div>';
}
function openUids() { const o = S.open; return o.thread ? o.item.uids.slice() : [o.uid]; }
function deleteOpen() { const nx = neighbour(1); removeUids(openUids(), 'delete'); if (nx) openItem(nx); }
function wireReadToolbar() {
  root.querySelectorAll('[data-ract]').forEach(function(b) {
    b.addEventListener('click', function() {
      const a = b.getAttribute('data-ract'), o = S.open;
      if (a === 'back') { S.open = null; renderList(); return; }
      if (!o || o.loading) return;
      const m = o.thread ? lastLoaded() : o;
      if (a === 'reply' || a === 'replyAll' || a === 'forward') { if (m) openCompose(replyDraft(m, a)); return; }
      if (a === 'prev' || a === 'next') { openItem(neighbour(a === 'prev' ? -1 : 1)); return; }
      if (a === 'delete') deleteOpen();
      else if (a === 'spam') removeUids(openUids(), 'spam');
      else if (a === 'move') { const r = b.getBoundingClientRect(); moveMenu(r.left, r.bottom + 4, openUids()); }
      else if (a === 'more') {
        const it = S.items.find(function(x) { return x.uid === o.uid; }) || {};
        const items = [
          { text: 'Отметить непрочитанным', icon: IC.read, run: function() { const u = openUids(); S.open = null; setSeen(u, false); } },
          { text: it.flagged ? 'Снять флажок' : 'Отметить флажком', icon: IC.flag, run: function() { setFlag(openUids(), !it.flagged); } }
        ];
        if (m) {
          items.push('-', { text: 'Распечатать', run: function() { printMessage(m); } }, { text: 'Показать оригинал письма', run: function() { showSource(m); } });
          if (m.attachments && m.attachments.length) items.push({ text: 'Скачать все вложения (ZIP)', icon: IC.dl, run: function() { downloadZip(m); } });
        }
        menuUnder(b, items);
      }
    });
  });
}
function addrLine(list) { return (list || []).map(function(a) { return a.name ? esc(a.name) + ' <span class="ml-read-addr">&lt;' + esc(a.address) + '&gt;</span>' : esc(a.address); }).join(', '); }
const PREVIEW_IMG = /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/i;
function canPreview(a) { return PREVIEW_IMG.test(a.contentType || '') || /pdf$/i.test(a.contentType || '') || /\.(png|jpe?g|gif|webp|bmp|pdf)$/i.test(a.filename || ''); }
// одно письмо: шапка, текст в изолированном iframe, вложения — общее для отдельного письма и цепочки
function msgBlockHtml(m, key, allowImages, compact) {
  const from = (m.from && m.from[0]) || {};
  const remote = !allowImages && hasRemoteImages(m.html);
  const atts = m.attachments || [];
  const totalSize = atts.reduce(function(s, a) { return s + (a.size || 0); }, 0);
  return '<div class="ml-read-head"' + (compact ? ' style="cursor:pointer;" title="Свернуть"' : '') + '>' + avatar(from) + '<div class="ml-read-who"><b>' + esc(from.name || from.address || '') + '</b>' + (from.name ? ' <span class="ml-read-addr">' + esc(from.address) + '</span>' : '')
    + '<div class="ml-read-to">Кому: ' + addrLine(m.to) + (m.cc && m.cc.length ? '<br>Копия: ' + addrLine(m.cc) : '') + '</div></div><div class="ml-read-date">' + esc(longDate(m.date)) + '</div></div>'
    + (remote ? '<div class="ml-imgbar">Картинки из интернета в этом письме скрыты для безопасности. <a data-show-img>Показать картинки</a></div>' : '')
    + '<iframe class="ml-body-frame" data-frame="' + esc(key) + '" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>'
    + (atts.length ? '<div class="ml-atts-head">' + atts.length + ' ' + plural(atts.length, 'вложение', 'вложения', 'вложений') + ' · ' + fmtSize(totalSize) + (atts.length > 1 ? ' <a data-zip>' + IC.dl + ' Скачать все архивом</a>' : '') + '</div><div class="ml-atts">' + atts.map(function(a) {
      return '<div class="ml-att" data-att="' + a.idx + '" title="' + esc((canPreview(a) ? 'Посмотреть ' : 'Скачать ') + a.filename) + '"><div class="ml-att-ico" data-thumb="' + a.idx + '">' + esc(extOf(a.filename)) + '</div><div style="min-width:0;"><div class="ml-att-name">' + esc(a.filename) + '</div><div class="ml-att-size">' + fmtSize(a.size) + '</div></div>'
        + '<span class="ml-att-dl" data-att-dl="' + a.idx + '" title="Скачать">' + IC.dl + '</span></div>';
    }).join('') + '</div>' : '');
}
function wireMsgBlock(el, m, key, allowImages, onShowImages) {
  const fr = el.querySelector('[data-frame]');
  fr.addEventListener('load', function() {
    try {
      const d = fr.contentDocument;
      const h = function() { fr.style.height = Math.max(60, d.documentElement.scrollHeight + 8) + 'px'; };
      h(); setTimeout(h, 300); setTimeout(h, 1500);
      d.querySelectorAll('img').forEach(function(img) { img.addEventListener('load', h); });
      d.addEventListener('keydown', onKeys);
    } catch (e) { fr.style.height = '600px'; }
  });
  fr.srcdoc = frameDoc(m.html || '<pre>' + esc(m.text) + '</pre>', allowImages);
  const si = el.querySelector('[data-show-img]');
  if (si) si.addEventListener('click', onShowImages);
  const zip = el.querySelector('[data-zip]');
  if (zip) zip.addEventListener('click', function() { downloadZip(m); });
  const atts = m.attachments || [];
  el.querySelectorAll('[data-att]').forEach(function(a2) {
    a2.addEventListener('click', function(e) {
      const idx = Number(a2.getAttribute('data-att'));
      const a = atts.find(function(x) { return x.idx === idx; });
      if (e.target.closest('[data-att-dl]') || !canPreview(a)) downloadAtt(m, idx); else previewAtt(m, a);
    });
  });
  atts.forEach(function(a) {
    if (!PREVIEW_IMG.test(a.contentType || '') || a.size > 3 * 1024 * 1024) return;
    attBlob(m, a.idx).then(function(blob) {
      const box = el.querySelector('[data-thumb="' + a.idx + '"]');
      if (box && blob) box.innerHTML = '<img src="' + URL.createObjectURL(blob) + '">';
    });
  });
}
function renderMessage(allowImages) {
  const m = S.open, main = root.querySelector('#ml-main');
  main.innerHTML = readToolbar() + '<div class="ml-read"><h1>' + (m.important ? '<span class="ml-imp" title="Важное">!</span>' : '') + esc(m.subject || '(без темы)') + '</h1>'
    + '<div id="ml-single">' + msgBlockHtml(m, 'single', allowImages, false) + '</div>'
    + '<div class="ml-quick-reply" id="ml-quick-reply">Нажмите здесь, чтобы ответить…</div>'
    + '<div class="ml-quick"><button class="ml-btn ml-btn-primary" data-ract="reply">' + IC.reply + 'Ответить</button><button class="ml-btn" data-ract="replyAll">Ответить всем</button><button class="ml-btn" data-ract="forward">' + IC.fwd + 'Переслать</button></div>'
    + '</div>';
  wireReadToolbar();
  wireMsgBlock(main.querySelector('#ml-single'), m, 'single', allowImages, function() { renderMessage(true); });
  main.querySelector('#ml-quick-reply').addEventListener('click', function() { openCompose(replyDraft(m, 'reply')); });
}
function plural(n, one, few, many) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many); }
const blobCache = new Map();
async function attBlob(m, idx) {
  const key = m.folder + '|' + m.uid + '|' + idx;
  if (blobCache.has(key)) return blobCache.get(key);
  try {
    const res = await api('/attachment?' + qs({ folder: m.folder, uid: m.uid, idx: idx }), { raw: true });
    const b = await res.blob();
    if (blobCache.size > 40) blobCache.clear();
    blobCache.set(key, b);
    return b;
  } catch (e) { return null; }
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name || 'file';
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
}
async function downloadAtt(m, idx) {
  const a = m.attachments.find(function(x) { return x.idx === idx; });
  toast('Скачиваем ' + (a ? a.filename : 'вложение') + '…');
  const b = await attBlob(m, idx);
  if (b) saveBlob(b, a ? a.filename : 'file'); else toast('Не удалось скачать вложение');
}
async function downloadZip(m) {
  toast('Собираем архив…');
  try { const res = await api('/attachments.zip?' + qs({ folder: m.folder, uid: m.uid }), { raw: true }); saveBlob(await res.blob(), (m.subject || 'Вложения').replace(/[\\/:*?"<>|]/g, ' ').slice(0, 60) + '.zip'); }
  catch (e) { toast(e.message); }
}
async function previewAtt(m, a) {
  const w = modal(a.filename, '<div class="ml-viewer"><div class="ml-loading">Загружаем…</div></div>', { wide: true, flushBody: true,
    headExtra: '<button class="ml-btn" data-dl style="height:32px;">' + IC.dl + ' Скачать</button>' });
  w.querySelector('[data-dl]').addEventListener('click', function() { downloadAtt(m, a.idx); });
  const blob = await attBlob(m, a.idx);
  const box = w.querySelector('.ml-viewer');
  if (!blob) { box.innerHTML = '<div class="ml-loading">Не удалось загрузить вложение</div>'; return; }
  const isPdf = /pdf$/i.test(a.contentType || '') || /\.pdf$/i.test(a.filename || '');
  const url = URL.createObjectURL(isPdf ? new Blob([blob], { type: 'application/pdf' }) : blob);
  box.innerHTML = isPdf ? '<iframe src="' + url + '"></iframe>' : '<img src="' + url + '">';
}
async function showSource(m) {
  const w = modal('Оригинал письма', '<pre class="ml-source">Загружаем…</pre>', { wide: true });
  try { const res = await api('/source?' + qs({ folder: m.folder, uid: m.uid }), { raw: true }); w.querySelector('.ml-source').textContent = await res.text(); }
  catch (e) { w.querySelector('.ml-source').textContent = e.message; }
}
function printMessage(m) {
  const from = (m.from && m.from[0]) || {};
  const head = '<h2 style="font:600 20px Arial;margin:0 0 10px;">' + esc(m.subject || '(без темы)') + '</h2><div style="font:13px Arial;color:#555;margin-bottom:16px;">От: ' + esc(from.name ? from.name + ' <' + from.address + '>' : from.address)
    + '<br>Кому: ' + esc((m.to || []).map(function(a) { return a.name ? a.name + ' <' + a.address + '>' : a.address; }).join(', ')) + '<br>Дата: ' + esc(longDate(m.date)) + '</div><hr>';
  const fr = document.createElement('iframe');
  fr.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0;';
  fr.setAttribute('sandbox', 'allow-same-origin allow-modals');
  document.body.appendChild(fr);
  fr.srcdoc = frameDoc(head + (m.html || '<pre>' + esc(m.text) + '</pre>'), true);
  fr.addEventListener('load', function() { setTimeout(function() { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Не удалось открыть печать'); } setTimeout(function() { fr.remove(); }, 2000); }, 400); });
}

// ---------- настройки: имя и подпись ----------
async function openSettings() {
  const w = modal('Настройки почты', '<label>Имя отправителя (его видят получатели)</label><input type="text" id="ml-set-name" value="' + esc(S.settings.name) + '">'
    + '<label>Подпись (добавляется в конец новых писем)</label><div class="ml-sig-edit" id="ml-set-sig" contenteditable="true">' + (S.settings.signature || '') + '</div>'
    + '<label style="display:flex;align-items:center;gap:8px;color:#2c2d2e;cursor:pointer;"><input type="checkbox" id="ml-set-reply"' + (S.settings.sigOnReply ? ' checked' : '') + '> Добавлять подпись в ответы и пересылаемые письма</label>'
    + '<label style="display:flex;align-items:center;gap:8px;color:#2c2d2e;cursor:pointer;margin-top:10px;"><input type="checkbox" id="ml-set-threads"' + (S.settings.threads !== false ? ' checked' : '') + '> Группировать письма в цепочки (переписка по одной теме — одной строкой)</label>',
    { foot: '<button class="ml-btn" data-no>Отмена</button><button class="ml-btn ml-btn-primary" data-ok>Сохранить</button>' });
  w.querySelector('[data-no]').addEventListener('click', function() { w.__close(); });
  w.querySelector('[data-ok]').addEventListener('click', async function() {
    const v = { name: w.querySelector('#ml-set-name').value.trim(), signature: w.querySelector('#ml-set-sig').innerHTML.replace(/^(<br>|\s)+$/, ''), sigOnReply: w.querySelector('#ml-set-reply').checked, threads: w.querySelector('#ml-set-threads').checked };
    const threadsChanged = (S.settings.threads !== false) !== v.threads;
    try { const r = await api('/settings', { json: v }); S.settings = r.settings; w.remove(); toast('Настройки сохранены'); if (threadsChanged) loadList(true); }
    catch (e) { toast(e.message); }
  });
}
function sigHtml() { return S.settings.signature ? '<div class="ml-sig"><br>-- <br>' + S.settings.signature + '</div>' : ''; }

// ---------- новое письмо ----------
function quoteHeader(m) { const f = (m.from && m.from[0]) || {}; return esc(longDate(m.date)) + ', ' + esc(f.name ? f.name + ' <' + f.address + '>' : f.address) + ':'; }
function replyDraft(m, mode) {
  const myself = S.me.email;
  const d = { replyTo: { folder: m.folder, uid: m.uid } };
  const re = /^(re|ответ|отв)\s*:/i, fw = /^(fwd?|пересл)\s*:/i;
  const sig = S.settings.sigOnReply ? sigHtml() : '';
  if (mode === 'forward') {
    d.subject = fw.test(m.subject) ? m.subject : 'Fwd: ' + (m.subject || '');
    d.forward = { folder: m.folder, uid: m.uid };
    d.fwdAtts = (m.attachments || []).slice();
    d.html = '<br>' + sig + '<br><div>-------- Пересылаемое сообщение --------<br>' + quoteHeader(m) + '<br>Тема: ' + esc(m.subject || '') + '</div><blockquote>' + (m.html || esc(m.text)) + '</blockquote>';
  } else {
    const from = (m.replyTo && m.replyTo.length ? m.replyTo : m.from) || [];
    d.to = from.map(function(a) { return a.address; });
    if (mode === 'replyAll') d.cc = (m.to || []).concat(m.cc || []).map(function(a) { return a.address; }).filter(function(x) { return x && x !== myself && d.to.indexOf(x) === -1; });
    d.subject = re.test(m.subject) ? m.subject : 'Re: ' + (m.subject || '');
    d.inReplyTo = m.messageId; d.references = m.references;
    d.html = '<br>' + sig + '<br><div>' + quoteHeader(m) + '</div><blockquote>' + (m.html || esc(m.text)) + '</blockquote>';
  }
  return d;
}
async function openDraft(uid) {
  const m = await fetchMessage(uid);
  if (m) openCompose({ to: (m.to || []).map(function(a) { return a.address; }), cc: (m.cc || []).map(function(a) { return a.address; }), subject: m.subject, html: m.html || esc(m.text), draftUid: uid });
}
async function loadContacts() {
  if (S.contacts) return S.contacts;
  const map = new Map();
  const add = function(address, name, hint) { address = String(address || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address) || map.has(address)) return; map.set(address, { address: address, name: name || '', hint: hint || '' }); };
  try {
    const r = await ctx.api.resource('users').list({ pageSize: 500, fields: ['email', 'nickname'] });
    ((r && r.data && r.data.data) || []).forEach(function(u) { if (!/test\.local$|nocobase\.com$/.test(u.email || '')) add(u.email, u.nickname, 'сотрудник'); });
  } catch (e) { /* ignore */ }
  try {
    const r = await ctx.api.resource('contract_contacts').list({ pageSize: 2000, fields: ['email', 'name', 'position'], filter: { email: { $notEmpty: true } } });
    ((r && r.data && r.data.data) || []).forEach(function(c) { add(c.email, c.name, c.position || 'контакт по договору'); });
  } catch (e) { /* ignore */ }
  S.items.forEach(function(m) { (m.from || []).concat(m.to || []).forEach(function(a) { add(a.address, a.name, ''); }); });
  S.contacts = Array.from(map.values());
  return S.contacts;
}
const MAX_TOTAL = 25 * 1024 * 1024;
function openCompose(d) {
  const old = document.getElementById('ml-compose-win');
  if (old) { if (!confirmClose(old)) return; if (old.__stopAutosave) old.__stopAutosave(); old.remove(); }
  const isNew = !d.html && !d.draftUid;
  const w = document.createElement('div');
  w.className = 'ml-compose'; w.id = 'ml-compose-win';
  w.innerHTML = '<div class="ml-compose-head"><span id="ml-c-title">' + esc(d.subject || 'Новое письмо') + '</span><button data-c="min" title="Свернуть">—</button><button data-c="full" title="Развернуть на весь экран">' + IC.expand + '</button><button data-c="close" title="Закрыть">✕</button></div>'
    + '<div class="ml-cf" data-rcpt="to"><label>Кому</label><div class="ml-chips"><input type="text" autocomplete="off"></div><span class="ml-cf-toggle" data-show="cc">Копия</span><span class="ml-cf-toggle" data-show="bcc">Скрытая</span></div>'
    + '<div class="ml-cf" data-rcpt="cc" style="display:none;"><label>Копия</label><div class="ml-chips"><input type="text" autocomplete="off"></div></div>'
    + '<div class="ml-cf" data-rcpt="bcc" style="display:none;"><label>Скрытая</label><div class="ml-chips"><input type="text" autocomplete="off"></div></div>'
    + '<div class="ml-cf"><label>Тема</label><input type="text" id="ml-c-subj" value="' + esc(d.subject || '') + '"></div>'
    + '<div class="ml-fmt"><select data-fmtsel="fontSize" title="Размер текста"><option value="">Размер</option><option value="2">Мелкий</option><option value="3">Обычный</option><option value="5">Крупный</option><option value="6">Огромный</option></select><i class="sep"></i>'
    + '<button data-fmt="bold" title="Жирный (Ctrl+B)"><b>Ж</b></button><button data-fmt="italic" title="Курсив (Ctrl+I)"><i>К</i></button><button data-fmt="underline" title="Подчёркнутый (Ctrl+U)"><u>Ч</u></button><button data-fmt="strikeThrough" title="Зачёркнутый"><s>З</s></button>'
    + '<input type="color" data-color="foreColor" value="#e0342c" title="Цвет текста"><i class="sep"></i>'
    + '<button data-fmt="justifyLeft" title="По левому краю">⇤</button><button data-fmt="justifyCenter" title="По центру">↔</button><button data-fmt="justifyRight" title="По правому краю">⇥</button><i class="sep"></i>'
    + '<button data-fmt="insertUnorderedList" title="Список">•≡</button><button data-fmt="insertOrderedList" title="Нумерованный список">1≡</button><button data-fmt="indent" title="Цитата / отступ">❝</button>'
    + '<button data-fmt="createLink" title="Ссылка">🔗</button><button data-fmt="insertImage" title="Вставить картинку в текст">🖼</button><button data-fmt="removeFormat" title="Очистить оформление">T̸</button>'
    + '<input type="file" id="ml-c-img" accept="image/*" style="display:none;"></div>'
    + '<div class="ml-editor-wrap"><div class="ml-editor" id="ml-c-body" contenteditable="true"></div><div class="ml-drop">Отпустите, чтобы прикрепить файлы</div></div>'
    + '<div class="ml-compose-atts" id="ml-c-atts"></div>'
    + '<div class="ml-compose-foot"><span class="ml-send-group"><button class="ml-btn ml-btn-primary" id="ml-c-send" title="Ctrl+Enter">Отправить</button><button class="ml-btn ml-btn-primary" id="ml-c-later" title="Отправить позже">' + IC.clock + '</button></span><button class="ml-btn" id="ml-c-draft">Сохранить</button>'
    + '<button class="ml-btn" id="ml-c-attach">' + IC.clip + ' Прикрепить</button><input type="file" id="ml-c-file" multiple style="display:none;">'
    + '<span class="ml-opt" id="ml-c-imp" title="Письмо будет отмечено как важное">! Важное</span><span class="ml-opt" id="ml-c-rr" title="Уведомить о прочтении: попросить получателя подтвердить, что письмо прочитано">✓ Прочтение</span>'
    + '<span class="ml-status" id="ml-c-status"></span>'
    + '<button class="ml-btn" id="ml-c-cancel" style="margin-left:auto;" title="Закрыть письмо">Отменить</button></div>';
  document.body.appendChild(w);
  const st = { atts: [], fwdAtts: (d.fwdAtts || []).slice(), draftUid: d.draftUid || null, dirty: false, busy: false, important: false, readReceipt: false };
  w.__st = st;
  const body = w.querySelector('#ml-c-body');
  body.innerHTML = d.html || ('<br>' + (isNew ? sigHtml() : ''));
  const rc = { to: rcptField(w.querySelector('[data-rcpt="to"]'), d.to || [], st), cc: rcptField(w.querySelector('[data-rcpt="cc"]'), d.cc || [], st), bcc: rcptField(w.querySelector('[data-rcpt="bcc"]'), d.bcc || [], st) };
  if (d.cc && d.cc.length) w.querySelector('[data-rcpt="cc"]').style.display = '';
  w.querySelectorAll('[data-show]').forEach(function(t) {
    t.addEventListener('click', function() { const f = w.querySelector('[data-rcpt="' + t.getAttribute('data-show') + '"]'); f.style.display = ''; f.querySelector('input').focus(); t.style.display = 'none'; });
  });
  const subj = w.querySelector('#ml-c-subj');
  subj.addEventListener('input', function() { st.dirty = true; w.querySelector('#ml-c-title').textContent = subj.value || 'Новое письмо'; });
  body.addEventListener('input', function() { st.dirty = true; });
  // оформление текста
  w.querySelectorAll('[data-fmt]').forEach(function(b) {
    b.addEventListener('mousedown', function(e) { e.preventDefault(); });
    b.addEventListener('click', async function() {
      const c = b.getAttribute('data-fmt');
      if (c === 'createLink') {
        const sel = window.getSelection(); const range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        const u = await askText('Ссылка', 'Адрес ссылки', 'https://', 'Вставить');
        if (!u) return;
        body.focus(); if (range) { sel.removeAllRanges(); sel.addRange(range); }
        if (range && !range.collapsed) document.execCommand('createLink', false, u); else document.execCommand('insertHTML', false, '<a href="' + esc(u) + '">' + esc(u) + '</a>');
      } else if (c === 'insertImage') { w.querySelector('#ml-c-img').click(); return; }
      else document.execCommand(c, false, null);
      st.dirty = true; body.focus();
    });
  });
  w.querySelectorAll('[data-fmtsel]').forEach(function(sel) { sel.addEventListener('change', function() { if (sel.value) { body.focus(); document.execCommand(sel.getAttribute('data-fmtsel'), false, sel.value); st.dirty = true; } sel.value = ''; }); });
  w.querySelectorAll('[data-color]').forEach(function(inp) { inp.addEventListener('input', function() { body.focus(); document.execCommand(inp.getAttribute('data-color'), false, inp.value); st.dirty = true; }); });
  // картинки прямо в тексте (вставка из буфера, кнопка) — уходят вложениями с cid
  function insertImageFile(file) {
    if (!file || !/^image\//.test(file.type)) return false;
    if (file.size > 5 * 1024 * 1024) { toast('Картинка больше 5 МБ — прикрепите её файлом'); return true; }
    const r = new FileReader();
    r.onload = function() { body.focus(); document.execCommand('insertHTML', false, '<img src="' + r.result + '" style="max-width:100%;">'); st.dirty = true; };
    r.readAsDataURL(file);
    return true;
  }
  w.querySelector('#ml-c-img').addEventListener('change', function(e) { insertImageFile(e.target.files[0]); e.target.value = ''; });
  body.addEventListener('paste', function(e) {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (let i = 0; i < items.length; i++) { if (items[i].kind === 'file' && /^image\//.test(items[i].type)) { e.preventDefault(); insertImageFile(items[i].getAsFile()); return; } }
  });
  w.querySelector('#ml-c-imp').addEventListener('click', function(e) { st.important = !st.important; e.currentTarget.classList.toggle('on', st.important); });
  w.querySelector('#ml-c-rr').addEventListener('click', function(e) { st.readReceipt = !st.readReceipt; e.currentTarget.classList.toggle('on', st.readReceipt); });
  // вложения: кнопка и перетаскивание
  function totalSize() { return st.atts.reduce(function(s, a) { return s + (a.size || 0); }, 0) + st.fwdAtts.reduce(function(s, a) { return s + (a.size || 0); }, 0); }
  function renderAtts() {
    const el = w.querySelector('#ml-c-atts');
    el.innerHTML = st.fwdAtts.map(function(a, i) { return '<span class="ml-chip">' + IC.clip + '<span>' + esc(a.filename) + ' · ' + fmtSize(a.size) + '</span><b data-fdel="' + i + '">✕</b></span>'; }).join('')
      + st.atts.map(function(a, i) { return '<span class="ml-chip">' + IC.clip + '<span>' + esc(a.filename) + (a.id ? ' · ' + fmtSize(a.size) : ' · загрузка…') + '</span><b data-adel="' + i + '">✕</b></span>'; }).join('');
    el.querySelectorAll('[data-fdel]').forEach(function(b) { b.addEventListener('click', function() { st.fwdAtts.splice(Number(b.getAttribute('data-fdel')), 1); st.dirty = true; renderAtts(); }); });
    el.querySelectorAll('[data-adel]').forEach(function(b) { b.addEventListener('click', function() { st.atts.splice(Number(b.getAttribute('data-adel')), 1); st.dirty = true; renderAtts(); }); });
  }
  renderAtts();
  async function addFiles(files) {
    for (const f of files) {
      if (totalSize() + f.size > MAX_TOTAL) { toast('Вложения больше 25 МБ не пройдут — «' + f.name + '» не добавлен'); continue; }
      const a = { filename: f.name, size: f.size, id: null };
      st.atts.push(a); st.dirty = true; renderAtts();
      try {
        const r = await api('/upload', { method: 'POST', body: f, headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(f.name) } });
        a.id = r.id;
      } catch (e) { toast('Не удалось прикрепить «' + f.name + '»: ' + e.message); st.atts.splice(st.atts.indexOf(a), 1); }
      renderAtts();
    }
  }
  const fileEl = w.querySelector('#ml-c-file');
  w.querySelector('#ml-c-attach').addEventListener('click', function() { fileEl.click(); });
  fileEl.addEventListener('change', function() { const files = Array.from(fileEl.files || []); fileEl.value = ''; addFiles(files); });
  let dragDepth = 0;
  w.addEventListener('dragenter', function(e) { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') !== -1) { dragDepth++; w.classList.add('dragover'); e.preventDefault(); } });
  w.addEventListener('dragover', function(e) { if (w.classList.contains('dragover')) e.preventDefault(); });
  w.addEventListener('dragleave', function() { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) w.classList.remove('dragover'); });
  w.addEventListener('drop', function(e) {
    if (!w.classList.contains('dragover')) return;
    e.preventDefault(); dragDepth = 0; w.classList.remove('dragover');
    addFiles(Array.from((e.dataTransfer && e.dataTransfer.files) || []));
  });
  function payload() {
    const skip = [];
    (d.fwdAtts || []).forEach(function(a) { if (st.fwdAtts.indexOf(a) === -1) skip.push(a.idx); });
    return {
      to: rc.to.list(), cc: rc.cc.list(), bcc: rc.bcc.list(), subject: subj.value, html: body.innerHTML,
      attachments: st.atts.filter(function(a) { return a.id; }).map(function(a) { return a.id; }),
      inReplyTo: d.inReplyTo, references: d.references, replyTo: d.replyTo, important: st.important, readReceipt: st.readReceipt,
      forward: d.forward ? { folder: d.forward.folder, uid: d.forward.uid, skip: skip } : undefined, draftUid: st.draftUid
    };
  }
  const status = w.querySelector('#ml-c-status');
  async function saveDraft(silent) {
    if (st.busy) return;
    rc.to.flush(); rc.cc.flush(); rc.bcc.flush();
    st.busy = true; if (!silent) status.textContent = 'Сохраняем…';
    try {
      const r = await api('/draft', { json: payload() });
      st.draftUid = r.draftUid || null; st.dirty = false;
      const t = new Date(); status.textContent = 'Черновик сохранён в ' + pad(t.getHours()) + ':' + pad(t.getMinutes());
      if (currentFolder().special === '\\Drafts' && !S.open) loadList(false);
      refreshCounts();
    } catch (e) { status.textContent = ''; if (!silent) toast(e.message); }
    st.busy = false;
  }
  // автосохранение черновика, как в веб-почте: раз в 30 секунд, если были изменения
  const autosave = setInterval(function() { if (!document.body.contains(w)) { clearInterval(autosave); return; } if (st.dirty && !w.classList.contains('hidden') && nbSessionAlive()) saveDraft(true); }, 30000);
  w.__stopAutosave = function() { clearInterval(autosave); };
  async function send(sendAt) {
    if (st.busy) return;
    rc.to.flush(); rc.cc.flush(); rc.bcc.flush();
    const p = payload();
    if (!p.to.length && !p.cc.length && !p.bcc.length) { toast('Укажите, кому отправить письмо'); w.querySelector('[data-rcpt="to"] input').focus(); return; }
    if (rc.to.bad() || rc.cc.bad() || rc.bcc.bad()) { toast('Проверьте адреса получателей — есть ошибка'); return; }
    if (st.atts.some(function(a) { return !a.id; })) { toast('Дождитесь загрузки вложений'); return; }
    if (!p.subject.trim() && !(await askConfirm('Письмо без темы', 'Отправить письмо без темы?', 'Отправить'))) return;
    const own = body.cloneNode(true);
    own.querySelectorAll('blockquote, .ml-sig').forEach(function(x) { x.remove(); });
    if (/вложени|прикрепл|attach/i.test(own.innerText || '') && !st.atts.length && !st.fwdAtts.length
      && !(await askConfirm('Забыли вложение?', 'В тексте письма упоминается вложение, но файлов не прикреплено. Отправить так?', 'Отправить'))) return;
    if (sendAt) {
      st.busy = true; status.textContent = 'Планируем…';
      try {
        const r = await api('/send', { json: Object.assign(p, { sendAt: sendAt }) });
        st.dirty = false; clearInterval(autosave); w.remove();
        toast('Письмо будет отправлено ' + whenText(r.sendAt || sendAt));
        await loadScheduled(); renderFolders(); if (S.folder === SCHED) renderScheduled();
        if (currentFolder().special === '\\Drafts' && !S.open) loadList(true);
      } catch (e) { st.busy = false; status.textContent = ''; toast(e.message); }
      return;
    }
    // «Отменить отправку»: 5 секунд письмо ещё можно вернуть, как в веб-почте
    w.classList.add('hidden');
    let cancelled = false;
    toastAction('Письмо отправляется…', 'Отменить', function() { cancelled = true; w.classList.remove('hidden'); toast('Отправка отменена'); }, 5000);
    await new Promise(function(r) { setTimeout(r, 5000); });
    if (cancelled) return;
    st.busy = true;
    try {
      await api('/send', { json: p });
      st.dirty = false; clearInterval(autosave); w.remove(); toast('Письмо отправлено');
      const it = d.replyTo && S.items.find(function(x) { return x.uid === d.replyTo.uid; });
      if (it && !d.forward) it.answered = true;
      refreshCounts();
      const sp = currentFolder().special;
      if ((sp === '\\Sent' || sp === '\\Drafts') && !S.open) loadList(true);
    } catch (e) { st.busy = false; w.classList.remove('hidden'); status.textContent = ''; toast(e.message); }
  }
  w.querySelector('#ml-c-send').addEventListener('click', function() { send(); });
  w.querySelector('#ml-c-later').addEventListener('click', function(e) {
    const at = function(days, h, m) { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m || 0, 0, 0); return d; };
    const now = new Date();
    const opts = [];
    const inHour = new Date(now.getTime() + 3600000); inHour.setSeconds(0, 0);
    opts.push({ text: 'Через час (' + whenText(inHour.toISOString()) + ')', d: inHour });
    if (now.getHours() < 17) opts.push({ text: 'Сегодня в 18:00', d: at(0, 18) });
    opts.push({ text: 'Завтра в 9:00', d: at(1, 9) });
    const mon = at((8 - now.getDay()) % 7 || 7, 9); if (now.getDay() !== 0) opts.push({ text: 'В понедельник в 9:00 (' + mon.getDate() + ' ' + MONTHS_FULL[mon.getMonth()] + ')', d: mon });
    const items = opts.map(function(o) { return { text: o.text, icon: IC.clock, run: function() { send(o.d.toISOString()); } }; });
    items.push('-', { text: 'Выбрать дату и время…', run: function() {
      const def = new Date(now.getTime() + 2 * 3600000); def.setMinutes(0, 0, 0);
      const local = def.getFullYear() + '-' + pad(def.getMonth() + 1) + '-' + pad(def.getDate()) + 'T' + pad(def.getHours()) + ':00';
      const mw = modal('Отправить позже', '<div class="ml-when"><label>Когда отправить письмо</label><input type="datetime-local" id="ml-when" value="' + local + '"></div>',
        { foot: '<button class="ml-btn" data-no>Отмена</button><button class="ml-btn ml-btn-primary" data-ok>Запланировать</button>' });
      mw.querySelector('[data-no]').addEventListener('click', function() { mw.__close(); });
      mw.querySelector('[data-ok]').addEventListener('click', function() {
        const v = mw.querySelector('#ml-when').value;
        const d = v ? new Date(v) : null;
        if (!d || isNaN(d) || d.getTime() < Date.now() + 60000) { toast('Выберите время хотя бы на минуту позже текущего'); return; }
        mw.remove(); send(d.toISOString());
      });
    } });
    const r = e.currentTarget.getBoundingClientRect();
    popupMenu(r.left, r.top - 8 - 44 * (items.length), items);
  });
  w.querySelector('#ml-c-draft').addEventListener('click', function() { saveDraft(false); });
  w.addEventListener('keydown', function(e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(); } });
  async function close() {
    if (st.dirty) {
      const r = await askConfirm('Закрыть письмо', 'Сохранить письмо в черновиках?', 'Сохранить');
      if (r) await saveDraft(false);
    }
    clearInterval(autosave); w.remove();
  }
  w.querySelector('#ml-c-cancel').addEventListener('click', close);
  w.querySelector('[data-c="close"]').addEventListener('click', function(e) { e.stopPropagation(); close(); });
  w.querySelector('[data-c="full"]').addEventListener('click', function(e) { e.stopPropagation(); w.classList.remove('min'); w.classList.toggle('full'); });
  w.querySelector('.ml-compose-head').addEventListener('click', function(e) { if (!e.target.closest('button') || e.target.closest('[data-c="min"]')) { w.classList.remove('full'); w.classList.toggle('min'); } });
  setTimeout(function() { if (!(d.to && d.to.length)) w.querySelector('[data-rcpt="to"] input').focus(); else { body.focus(); try { const r = document.createRange(); r.setStart(body, 0); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* ignore */ } } }, 50);
}
function confirmClose(w) { return !(w.__st && w.__st.dirty) || confirm('Закрыть письмо? Несохранённый текст пропадёт.'); }

// ---------- горячие клавиши ----------
function onKeys(e) {
  if (!document.getElementById('ml-root') || document.querySelector('.ml-modal-wrap') || document.getElementById('ml-menu')) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (e.key === 'Escape' && S.open && !document.getElementById('ml-compose-win')) { S.open = null; renderList(); }
  else if (e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) {
    if (S.open && !S.open.loading) deleteOpen();
    else if (S.sel.size) removeUids(uidsOf(Array.from(S.sel)), 'delete');
  }
}
if (window.__mlKeys) document.removeEventListener('keydown', window.__mlKeys);
window.__mlKeys = onKeys;
document.addEventListener('keydown', onKeys);

const EMAIL_RE = /^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/;
function rcptField(el, initial, st) {
  const chips = el.querySelector('.ml-chips'), input = chips.querySelector('input');
  const list = [];
  let sug = null, sugIdx = 0, sugItems = [];
  function render() {
    chips.querySelectorAll('.ml-chip').forEach(function(c) { c.remove(); });
    list.forEach(function(a, i) {
      const c = document.createElement('span');
      c.className = 'ml-chip' + (EMAIL_RE.test(a.address) ? '' : ' bad');
      c.title = a.address;
      c.innerHTML = '<span>' + esc(a.name || a.address) + '</span><b>✕</b>';
      c.querySelector('b').addEventListener('click', function() { list.splice(i, 1); st.dirty = true; render(); });
      chips.insertBefore(c, input);
    });
  }
  function addRaw(txt) {
    String(txt || '').split(/[,;\s]+/).forEach(function(t) {
      t = t.replace(/^.*</, '').replace(/>.*$/, '').trim().toLowerCase();
      if (!t || list.some(function(a) { return a.address === t; })) return;
      const c = (S.contacts || []).find(function(x) { return x.address === t; });
      list.push({ address: t, name: c ? c.name : '' });
    });
    render();
  }
  function hideSug() { if (sug) { sug.remove(); sug = null; } }
  async function showSug() {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { hideSug(); return; }
    const all = await loadContacts();
    sugItems = all.filter(function(c) { return (c.address.indexOf(q) !== -1 || (c.name || '').toLowerCase().indexOf(q) !== -1) && !list.some(function(a) { return a.address === c.address; }); }).slice(0, 8);
    if (!sugItems.length) { hideSug(); return; }
    if (!sug) { sug = document.createElement('div'); sug.className = 'ml-suggest'; el.appendChild(sug); }
    sugIdx = 0;
    paint();
  }
  function paint() {
    sug.innerHTML = sugItems.map(function(c, i) { return '<div data-i="' + i + '" class="' + (i === sugIdx ? 'on' : '') + '">' + esc(c.name || c.address) + '<small>' + esc(c.name ? c.address : '') + (c.hint ? ' · ' + esc(c.hint) : '') + '</small></div>'; }).join('');
    sug.querySelectorAll('[data-i]').forEach(function(d) { d.addEventListener('mousedown', function(e) { e.preventDefault(); pick(Number(d.getAttribute('data-i'))); }); });
  }
  function pick(i) { const c = sugItems[i]; if (!c) return; list.push({ address: c.address, name: c.name }); input.value = ''; st.dirty = true; hideSug(); render(); input.focus(); }
  input.addEventListener('input', function() { if (/[,;]\s*$/.test(input.value)) { addRaw(input.value); input.value = ''; st.dirty = true; hideSug(); return; } showSug(); });
  input.addEventListener('keydown', function(e) {
    if (sug && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : sugItems.length - 1)) % sugItems.length; paint(); return; }
    if (e.key === 'Enter' || e.key === 'Tab') { if (sug && sugItems.length) { e.preventDefault(); pick(sugIdx); return; } if (input.value.trim()) { e.preventDefault(); addRaw(input.value); input.value = ''; st.dirty = true; } }
    if (e.key === 'Backspace' && !input.value && list.length) { list.pop(); render(); }
    if (e.key === 'Escape') hideSug();
  });
  input.addEventListener('blur', function() { setTimeout(function() { hideSug(); if (input.value.trim()) { addRaw(input.value); input.value = ''; } }, 150); });
  input.addEventListener('paste', function() { setTimeout(function() { if (/[,;\s]/.test(input.value.trim())) { addRaw(input.value); input.value = ''; } }, 0); });
  chips.addEventListener('click', function(e) { if (e.target === chips) input.focus(); });
  addRaw((initial || []).join(','));
  return { list: function() { return list.map(function(a) { return a.address; }); }, flush: function() { if (input.value.trim()) { addRaw(input.value); input.value = ''; } }, bad: function() { return list.some(function(a) { return !EMAIL_RE.test(a.address); }); } };
}

// ---------- ссылка из уведомления: ?open=<папка>:<uid> ----------
async function openFromUrl() {
  const mm = location.search.match(/[?&]open=([^&]+)/);
  if (!mm) { window.__mlOpenedKey = null; return false; }
  if (!S.me || !S.me.configured || !root.querySelector('.ml-app')) return false;
  // одна и та же ссылка открывается один раз (адрес страницы роутер NocoBase может не дать переписать)
  if (window.__mlOpenedKey === mm[1]) return false;
  window.__mlOpenedKey = mm[1];
  try { history.replaceState(history.state, '', location.pathname); } catch (e) { /* ignore */ }
  let v = mm[1];
  try { v = decodeURIComponent(v); } catch (e) { /* ignore */ }
  const i = v.lastIndexOf(':');
  const folder = v.slice(0, i), uid = Number(v.slice(i + 1));
  if (!folder || !uid) return false;
  S.folder = folder; S.q = ''; S.filter = ''; S.open = null;
  renderFolders();
  await loadList(true);
  const row = S.items.find(function(x) { return x.uid === uid || (x.uids && x.uids.indexOf(uid) !== -1); });
  if (row && row.count > 1) openThread(row); else openMessage(uid);
  return true;
}
if (window.__mlOpenTimer) clearInterval(window.__mlOpenTimer);
window.__mlOpenTimer = setInterval(function() { if (!root.isConnected) { clearInterval(window.__mlOpenTimer); return; } if (nbSessionAlive()) openFromUrl(); }, 700);

// ---------- запуск ----------
async function start() {
  root.innerHTML = '<div class="ml-loading">Открываем почту…</div>';
  try {
    S.me = await api('/me');
    if (!S.me.configured) { showSetup(S.me.email, false); return; }
    try { const r = await api('/settings'); S.settings = r.settings || S.settings; } catch (e) { /* без подписи */ }
    renderShell();
    await loadScheduled();
    await loadFolders();
    if (!(await openFromUrl())) await loadList(true);
    loadContacts();
  } catch (e) { if (!handleFatal(e)) showCard('<h2>Не получилось открыть почту</h2><p>' + esc(e.message) + '</p>'); }
}
if (window.__mlPoll) clearInterval(window.__mlPoll);
window.__mlPoll = setInterval(function() {
  if (!document.getElementById('ml-root') || !root.isConnected) { clearInterval(window.__mlPoll); window.__mlPoll = null; return; }
  if (nbSessionAlive() && S.me && S.me.configured && root.querySelector('.ml-app')) refreshCounts();
}, 60000);
start();

})();
