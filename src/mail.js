// Вкладка «Почта»: почтовый клиент в духе привычной веб-почты (папки слева, список писем, чтение, новое письмо).
// Письма получает почтовый сервис (mail-service/, порт 8096 на том же сервере), вход — по сессии NocoBase:
// пароль от ящика вводится один раз, дальше почта открывается сама.
ctx.render('<div id="ml-root"></div>');
(async function () {

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

// ---------- стили ----------
if (!document.getElementById('ml-style')) {
  const st = document.createElement('style');
  st.id = 'ml-style';
  st.textContent = `
    /* окно письма, меню и подсказки живут в body — переменные нужны и им */
    #ml-root, .ml-compose, .ml-menu, .ml-toast { --ml-blue: #005ff9; --ml-blue-h: #0050d4; --ml-bg: #f4f5f7; --ml-line: #eceef2; --ml-text: #2c2d2e; --ml-gray: #87898f; font-family: inherit; }
    .ml-app { display: flex; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid var(--ml-line); min-height: 520px; color: var(--ml-text); }
    .ml-side { width: 232px; flex: 0 0 232px; background: var(--ml-bg); padding: 14px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
    .ml-compose-btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; margin: 0 2px 12px; border: none; border-radius: 12px; background: var(--ml-blue); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; box-shadow: 0 2px 6px rgba(0, 95, 249, .25); }
    .ml-compose-btn:hover { background: var(--ml-blue-h); }
    .ml-folder { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px; border-radius: 10px; cursor: pointer; font-size: 14px; user-select: none; }
    .ml-folder:hover { background: #e9ebef; }
    .ml-folder.active { background: #fff; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
    .ml-folder svg { flex: 0 0 18px; color: #6f7278; }
    .ml-folder.active svg { color: var(--ml-blue); }
    .ml-folder-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-folder-count { font-size: 13px; font-weight: 600; color: var(--ml-text); }
    .ml-side-sep { height: 1px; background: #e2e4e9; margin: 8px 10px; }
    .ml-side-foot { margin-top: auto; padding: 10px 12px 2px; font-size: 12px; color: var(--ml-gray); word-break: break-all; }
    .ml-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .ml-toolbar { display: flex; align-items: center; gap: 6px; height: 56px; padding: 0 16px; border-bottom: 1px solid var(--ml-line); flex-shrink: 0; }
    .ml-tbtn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border: none; border-radius: 8px; background: transparent; color: var(--ml-text); font-size: 13.5px; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .ml-tbtn:hover { background: #f0f1f4; }
    .ml-tbtn:disabled { color: #c0c2c7; cursor: default; background: transparent; }
    .ml-tbtn svg { color: #6f7278; }
    .ml-search { margin-left: auto; position: relative; width: min(340px, 40%); }
    .ml-search input { width: 100%; height: 36px; box-sizing: border-box; border: 1px solid transparent; border-radius: 10px; background: var(--ml-bg); padding: 0 12px 0 34px; font-size: 14px; outline: none; font-family: inherit; }
    .ml-search input:focus { background: #fff; border-color: var(--ml-blue); }
    .ml-search svg { position: absolute; left: 10px; top: 9px; color: var(--ml-gray); }
    .ml-check { width: 18px; height: 18px; border: 1.5px solid #b9bcc3; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; background: #fff; }
    .ml-check.on { background: var(--ml-blue); border-color: var(--ml-blue); }
    .ml-check.on::after { content: ''; width: 9px; height: 5px; border: 2px solid #fff; border-top: none; border-right: none; transform: rotate(-45deg) translate(1px, -1px); }
    .ml-list { flex: 1; overflow-y: auto; }
    .ml-row { display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; position: relative; }
    .ml-row:hover { background: #f5f7fa; }
    .ml-row.sel { background: #eaf1ff; }
    .ml-row .ml-unread-dot { width: 8px; height: 8px; border-radius: 50%; background: transparent; flex: 0 0 8px; cursor: pointer; }
    .ml-row.unread .ml-unread-dot { background: var(--ml-blue); }
    .ml-avatar-wrap { position: relative; width: 32px; height: 32px; flex: 0 0 32px; }
    .ml-avatar { width: 32px; height: 32px; border-radius: 50%; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
    .ml-avatar-wrap .ml-check { position: absolute; left: 7px; top: 7px; display: none; }
    .ml-row:hover .ml-avatar, .ml-row.sel .ml-avatar { display: none; }
    .ml-row:hover .ml-avatar-wrap .ml-check, .ml-row.sel .ml-avatar-wrap .ml-check { display: inline-flex; }
    .ml-from { width: 200px; flex: 0 0 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
    .ml-row.unread .ml-from, .ml-row.unread .ml-subj { font-weight: 700; }
    .ml-line { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
    .ml-subj { color: var(--ml-text); }
    .ml-snip { color: var(--ml-gray); margin-left: 8px; }
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
    .ml-body-frame { width: 100%; border: none; min-height: 120px; display: block; }
    .ml-atts { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--ml-line); }
    .ml-att { display: flex; align-items: center; gap: 10px; width: 220px; padding: 10px 12px; border: 1px solid var(--ml-line); border-radius: 10px; cursor: pointer; background: #fff; }
    .ml-att:hover { border-color: var(--ml-blue); }
    .ml-att-ico { width: 36px; height: 36px; border-radius: 8px; background: #eaf1ff; color: var(--ml-blue); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; }
    .ml-att-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-att-size { font-size: 12px; color: var(--ml-gray); }
    .ml-quick { display: flex; gap: 8px; margin-top: 22px; }
    .ml-btn { height: 36px; padding: 0 16px; border-radius: 10px; border: 1px solid #d5d8de; background: #fff; color: var(--ml-text); font-size: 14px; cursor: pointer; font-family: inherit; }
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
    .ml-compose { position: fixed; right: 24px; bottom: 0; width: min(720px, calc(100vw - 48px)); height: min(640px, calc(100vh - 80px)); background: #fff; border-radius: 14px 14px 0 0; box-shadow: 0 8px 40px rgba(0,0,0,.22); z-index: 1000; display: flex; flex-direction: column; }
    .ml-compose.min { height: 48px; overflow: hidden; }
    .ml-compose-head { display: flex; align-items: center; height: 48px; padding: 0 10px 0 18px; background: #f4f5f7; border-radius: 14px 14px 0 0; font-weight: 600; font-size: 15px; cursor: pointer; flex-shrink: 0; }
    .ml-compose-head span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-compose-head button { border: none; background: transparent; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #6f7278; font-size: 16px; }
    .ml-compose-head button:hover { background: #e6e8ec; }
    .ml-cf { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 4px 18px; border-bottom: 1px solid var(--ml-line); position: relative; flex-shrink: 0; }
    .ml-cf label { width: 56px; flex: 0 0 56px; color: var(--ml-gray); font-size: 14px; }
    .ml-cf input { flex: 1; min-width: 120px; border: none; outline: none; font-size: 14px; height: 34px; font-family: inherit; }
    .ml-cf .ml-cf-toggle { color: var(--ml-gray); font-size: 13px; cursor: pointer; white-space: nowrap; }
    .ml-cf .ml-cf-toggle:hover { color: var(--ml-blue); }
    .ml-chips { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .ml-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 10px; border-radius: 14px; background: #eaf1ff; font-size: 13px; max-width: 280px; }
    .ml-chip.bad { background: #ffe9e8; color: #c4221b; }
    .ml-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ml-chip b { font-weight: 400; cursor: pointer; color: #6f7278; padding: 0 3px; }
    .ml-suggest { position: absolute; left: 80px; right: 18px; top: 100%; background: #fff; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.16); z-index: 5; max-height: 260px; overflow-y: auto; }
    .ml-suggest div { padding: 8px 14px; font-size: 13.5px; cursor: pointer; }
    .ml-suggest div.on, .ml-suggest div:hover { background: #f0f5ff; }
    .ml-suggest small { color: var(--ml-gray); margin-left: 6px; }
    .ml-fmt { display: flex; gap: 2px; padding: 6px 12px; border-bottom: 1px solid var(--ml-line); flex-shrink: 0; }
    .ml-fmt button { width: 32px; height: 30px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 14px; color: #4a4c50; font-family: inherit; }
    .ml-fmt button:hover { background: #f0f1f4; }
    .ml-editor { flex: 1; overflow-y: auto; padding: 14px 18px; font-size: 14.5px; line-height: 1.5; outline: none; }
    .ml-editor blockquote { margin: 8px 0 0; padding-left: 12px; border-left: 3px solid #d5d8de; color: #555; }
    .ml-compose-atts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 8px; flex-shrink: 0; }
    .ml-compose-atts .ml-chip { background: #f4f5f7; }
    .ml-compose-foot { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--ml-line); flex-shrink: 0; }
    .ml-compose-foot .ml-status { font-size: 12.5px; color: var(--ml-gray); margin-left: 6px; }
    .ml-toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); background: #2c2d2e; color: #fff; padding: 10px 18px; border-radius: 10px; font-size: 14px; z-index: 1100; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
    .ml-menu { position: absolute; background: #fff; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.16); z-index: 20; padding: 6px; min-width: 200px; max-height: 320px; overflow-y: auto; }
    .ml-menu div { padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .ml-menu div:hover { background: #f0f5ff; }
    .ml-loading { padding: 40px; text-align: center; color: var(--ml-gray); }
    @media (max-width: 900px) { .ml-side { width: 64px; flex-basis: 64px; } .ml-folder-name, .ml-folder-count, .ml-compose-btn span, .ml-side-foot { display: none; } .ml-from { width: 120px; flex-basis: 120px; } .ml-snip { display: none; } }
  `;
  document.head.appendChild(st);
}
// плавающая кнопка ИИ-чата NocoBase не используется (как и на других страницах) — прячем, чтобы не закрывала окно письма
if (!document.getElementById('cm-hide-ai-chat')) {
  const aiSt = document.createElement('style');
  aiSt.id = 'cm-hide-ai-chat';
  aiSt.textContent = '[role="button"][aria-label="Открыть ИИ-чат"], [role="button"][aria-label="Open AI chat"] { display: none !important; }';
  document.head.appendChild(aiSt);
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

// ---------- состояние ----------
const root = document.getElementById('ml-root');
const S = { me: null, folders: [], folder: 'INBOX', items: [], total: 0, page: 0, q: '', sel: new Set(), open: null, loading: false, contacts: null };

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
    + '<button class="ml-btn ml-btn-primary" id="ml-pass-ok" style="width:100%;height:42px;">Подключить</button>');
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

// ---------- каркас ----------
function renderShell() {
  root.innerHTML = '<div class="ml-app">'
    + '<div class="ml-side"><button class="ml-compose-btn" id="ml-compose">' + IC.pen + '<span>Написать письмо</span></button><div id="ml-folders"></div>'
    + '<div class="ml-side-foot">' + esc(S.me.email) + '</div></div>'
    + '<div class="ml-main" id="ml-main"></div></div>';
  root.querySelector('#ml-compose').addEventListener('click', function() { openCompose({}); });
  fitHeight();
  setTimeout(fitHeight, 300);
}
function currentFolder() { return S.folders.find(function(f) { return f.path === S.folder; }) || { path: S.folder, name: S.folder, special: null }; }
function folderBySpecial(sp) { return S.folders.find(function(f) { return f.special === sp; }); }
function renderFolders() {
  const el = root.querySelector('#ml-folders');
  if (!el) return;
  let html = '', sepDone = false;
  S.folders.forEach(function(f) {
    if (!f.special && !sepDone) { html += '<div class="ml-side-sep"></div>'; sepDone = true; }
    const cnt = f.special === '\\Drafts' ? f.total : f.unseen;
    const showCnt = cnt && f.special !== '\\Sent' && f.special !== '\\Trash' && f.special !== '\\Archive';
    html += '<div class="ml-folder' + (f.path === S.folder ? ' active' : '') + '" data-folder="' + esc(f.path) + '">' + (FOLDER_ICON[f.special] || IC.folder)
      + '<span class="ml-folder-name">' + esc(f.name) + '</span>' + (showCnt ? '<span class="ml-folder-count">' + cnt + '</span>' : '') + '</div>';
  });
  el.innerHTML = html;
  el.querySelectorAll('[data-folder]').forEach(function(d) {
    d.addEventListener('click', function() { S.folder = d.getAttribute('data-folder'); S.q = ''; S.open = null; renderFolders(); loadList(true); });
  });
  const inbox = folderBySpecial('\\Inbox');
  try { document.title = (inbox && inbox.unseen ? '(' + inbox.unseen + ') ' : '') + 'Почта'; } catch (e) { /* ignore */ }
}
async function loadFolders() {
  const d = await api('/folders');
  S.folders = d.folders || [];
  if (!S.folders.some(function(f) { return f.path === S.folder; })) { const ib = folderBySpecial('\\Inbox'); S.folder = ib ? ib.path : (S.folders[0] ? S.folders[0].path : 'INBOX'); }
  renderFolders();
}

// ---------- список писем ----------
function listToolbar() {
  const n = S.sel.size;
  const all = S.items.length && n === S.items.length;
  const f = currentFolder();
  return '<div class="ml-toolbar">'
    + '<span class="ml-check' + (all ? ' on' : '') + '" id="ml-selall" title="Выделить все" style="margin-right:6px;"></span>'
    + (n ? '<button class="ml-tbtn" data-act="delete">' + IC.trash + 'Удалить</button>'
      + (f.special !== '\\Junk' ? '<button class="ml-tbtn" data-act="spam">' + IC.spam + 'Спам</button>' : '<button class="ml-tbtn" data-act="notspam">' + IC.inbox + 'Не спам</button>')
      + '<button class="ml-tbtn" data-act="read">' + IC.read + 'Прочитано</button><button class="ml-tbtn" data-act="unread">Не прочитано</button>'
      + '<button class="ml-tbtn" data-act="move">' + IC.move + 'В папку</button><span style="color:#87898f;font-size:13px;margin-left:4px;">выбрано ' + n + '</span>'
      : '<button class="ml-tbtn" data-act="refresh" title="Проверить почту">' + IC.refresh + '</button><span style="font-size:17px;font-weight:600;margin-left:4px;">' + esc(S.q ? 'Поиск: ' + S.q : f.name) + '</span>')
    + '<div class="ml-search">' + IC.search + '<input id="ml-q" placeholder="Поиск по почте" value="' + esc(S.q) + '"></div>'
    + '</div>';
}
function rowHtml(m) {
  const sent = currentFolder().special === '\\Sent' || currentFolder().special === '\\Drafts';
  const peer = sent ? (m.to && m.to[0]) : (m.from && m.from[0]);
  const peerName = sent ? 'Кому: ' + (m.to || []).map(who).join(', ') : who(peer);
  return '<div class="ml-row' + (m.seen ? '' : ' unread') + (S.sel.has(m.uid) ? ' sel' : '') + '" data-uid="' + m.uid + '">'
    + '<span class="ml-unread-dot" data-toggle-seen="' + m.uid + '" title="' + (m.seen ? 'Отметить непрочитанным' : 'Отметить прочитанным') + '"></span>'
    + '<div class="ml-avatar-wrap">' + avatar(peer) + '<span class="ml-check' + (S.sel.has(m.uid) ? ' on' : '') + '" data-check="' + m.uid + '"></span></div>'
    + '<div class="ml-from" title="' + esc(peer ? peer.address : '') + '">' + esc(peerName || '(без отправителя)') + '</div>'
    + '<div class="ml-line"><span class="ml-subj">' + esc(m.subject || '(без темы)') + '</span><span class="ml-snip">' + esc(m.snippet || '') + '</span></div>'
    + '<div class="ml-icons">' + (m.attachments ? IC.clip : '') + '<span class="ml-flag' + (m.flagged ? ' on' : '') + '" data-flag="' + m.uid + '" title="Отметить флажком">' + IC.flag + '</span></div>'
    + '<div class="ml-date">' + esc(shortDate(m.date)) + '</div></div>';
}
function renderList() {
  const main = root.querySelector('#ml-main');
  if (!main) return;
  let body;
  if (S.loading && !S.items.length) body = '<div class="ml-loading">Загружаем письма…</div>';
  else if (!S.items.length) body = '<div class="ml-empty"><b>' + (S.q ? 'Ничего не нашлось' : 'Писем нет') + '</b>' + (S.q ? 'Попробуйте другой запрос' : 'В этой папке пока пусто') + '</div>';
  else body = S.items.map(rowHtml).join('') + (S.items.length < S.total ? '<button class="ml-btn ml-more" id="ml-more">Показать ещё</button>' : '');
  main.innerHTML = listToolbar() + '<div class="ml-list" id="ml-list">' + body + '</div>';
  wireList();
}
function wireList() {
  const main = root.querySelector('#ml-main');
  const q = main.querySelector('#ml-q');
  q.addEventListener('keydown', function(e) { if (e.key === 'Enter') { S.q = q.value.trim(); S.open = null; loadList(true); } if (e.key === 'Escape') { q.value = ''; if (S.q) { S.q = ''; loadList(true); } } });
  const selAll = main.querySelector('#ml-selall');
  if (selAll) selAll.addEventListener('click', function() { if (S.sel.size === S.items.length) S.sel.clear(); else S.items.forEach(function(m) { S.sel.add(m.uid); }); renderList(); });
  main.querySelectorAll('[data-act]').forEach(function(b) { b.addEventListener('click', function(e) { bulk(b.getAttribute('data-act'), b, e); }); });
  const more = main.querySelector('#ml-more');
  if (more) more.addEventListener('click', function() { more.disabled = true; more.textContent = 'Загружаем…'; S.page++; loadList(false); });
  main.querySelectorAll('.ml-row').forEach(function(row) {
    row.addEventListener('click', function(e) {
      const uid = Number(row.getAttribute('data-uid'));
      const t = e.target.closest ? e.target : null;
      if (t && t.closest('[data-check]')) { if (S.sel.has(uid)) S.sel.delete(uid); else S.sel.add(uid); renderList(); return; }
      if (t && t.closest('[data-flag]')) { toggleFlag(uid); return; }
      if (t && t.closest('[data-toggle-seen]')) { const m = S.items.find(function(x) { return x.uid === uid; }); setSeen([uid], !m.seen); return; }
      const m = S.items.find(function(x) { return x.uid === uid; });
      if (m && m.draft && currentFolder().special === '\\Drafts') { openDraft(uid); return; }
      openMessage(uid);
    });
  });
}
async function loadList(reset) {
  if (reset) { S.page = 0; S.items = []; S.sel.clear(); S.loading = true; renderList(); }
  const folder = S.folder, q = S.q, page = S.page;
  try {
    const d = await api('/messages?' + qs({ folder: folder, page: page, q: q }));
    if (folder !== S.folder || q !== S.q) return;
    S.total = d.total;
    S.items = page === 0 ? d.items : S.items.concat(d.items.filter(function(m) { return !S.items.some(function(x) { return x.uid === m.uid; }); }));
  } catch (e) { if (handleFatal(e)) return; toast(e.message); }
  S.loading = false;
  if (!S.open) renderList();
}
async function setSeen(uids, seen) {
  S.items.forEach(function(m) { if (uids.indexOf(m.uid) !== -1) m.seen = seen; });
  if (!S.open) renderList();
  try { await api('/flags', { json: { folder: S.folder, uids: uids, add: seen ? ['\\Seen'] : [], remove: seen ? [] : ['\\Seen'] } }); refreshCounts(); }
  catch (e) { toast(e.message); }
}
async function toggleFlag(uid) {
  const m = S.items.find(function(x) { return x.uid === uid; });
  if (!m) return;
  m.flagged = !m.flagged; renderList();
  try { await api('/flags', { json: { folder: S.folder, uids: [uid], add: m.flagged ? ['\\Flagged'] : [], remove: m.flagged ? [] : ['\\Flagged'] } }); }
  catch (e) { toast(e.message); }
}
async function removeUids(uids, action, to) {
  const path = action === 'delete' ? '/delete' : (action === 'spam' ? '/spam' : '/move');
  const keep = S.items;
  S.items = S.items.filter(function(m) { return uids.indexOf(m.uid) === -1; });
  S.total -= uids.length; S.sel.clear(); S.open = null; renderList();
  try {
    await api(path, { json: { folder: S.folder, uids: uids, to: to } });
    toast(action === 'delete' ? (currentFolder().special === '\\Trash' ? 'Удалено навсегда' : 'Перемещено в корзину') : action === 'spam' ? 'Перемещено в спам' : 'Перемещено');
    refreshCounts();
  } catch (e) { S.items = keep; S.total += uids.length; renderList(); toast(e.message); }
}
function folderMenu(anchor, onPick) {
  closeMenus();
  const r = anchor.getBoundingClientRect();
  const m = document.createElement('div');
  m.className = 'ml-menu'; m.id = 'ml-menu';
  m.style.position = 'fixed'; m.style.left = r.left + 'px'; m.style.top = (r.bottom + 4) + 'px';
  m.innerHTML = S.folders.filter(function(f) { return f.path !== S.folder; }).map(function(f) { return '<div data-to="' + esc(f.path) + '">' + esc(f.name) + '</div>'; }).join('');
  document.body.appendChild(m);
  m.querySelectorAll('[data-to]').forEach(function(d) { d.addEventListener('click', function() { closeMenus(); onPick(d.getAttribute('data-to')); }); });
  setTimeout(function() { document.addEventListener('click', closeMenus, { once: true }); }, 0);
}
function closeMenus() { const m = document.getElementById('ml-menu'); if (m) m.remove(); }
function bulk(act, btn) {
  const uids = Array.from(S.sel);
  if (act === 'refresh') { refreshCounts(); loadList(true); return; }
  if (!uids.length) return;
  if (act === 'delete') removeUids(uids, 'delete');
  else if (act === 'spam') removeUids(uids, 'spam');
  else if (act === 'notspam') { const ib = folderBySpecial('\\Inbox'); removeUids(uids, 'move', ib ? ib.path : 'INBOX'); }
  else if (act === 'read') { setSeen(uids, true); S.sel.clear(); renderList(); }
  else if (act === 'unread') { setSeen(uids, false); S.sel.clear(); renderList(); }
  else if (act === 'move') folderMenu(btn, function(to) { removeUids(uids, 'move', to); });
}
async function refreshCounts() {
  try {
    const before = folderBySpecial('\\Inbox');
    const prevUnseen = before ? before.unseen : 0, prevTotal = before ? before.total : 0;
    await loadFolders();
    const after = folderBySpecial('\\Inbox');
    if (after && (after.total !== prevTotal || after.unseen > prevUnseen) && S.folder === after.path && !S.q && !S.open && S.page === 0 && !S.sel.size) loadList(false);
  } catch (e) { /* тихо: попробуем в следующий раз */ }
}

// ---------- чтение письма ----------
function frameDoc(html, allowImages) {
  const csp = allowImages ? "img-src * data:; style-src 'unsafe-inline' *; font-src * data:" : "img-src data:; style-src 'unsafe-inline'; font-src data:";
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; ' + csp + '"><base target="_blank">'
    + '<style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#2c2d2e;word-wrap:break-word;overflow-wrap:anywhere;}img{max-width:100%;height:auto;}blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #d5d8de;color:#555;}pre{white-space:pre-wrap;}table{max-width:100%;}a{color:#005ff9;}</style></head><body>' + html + '</body></html>';
}
function hasRemoteImages(html) { return /<img[^>]+src=["']?https?:/i.test(html) || /url\(\s*['"]?https?:/i.test(html); }
async function openMessage(uid) {
  S.open = { uid: uid, loading: true };
  const main = root.querySelector('#ml-main');
  main.innerHTML = readToolbar() + '<div class="ml-read"><div class="ml-loading">Открываем письмо…</div></div>';
  wireReadToolbar();
  try {
    const m = await api('/message?' + qs({ folder: S.folder, uid: uid }));
    if (!S.open || S.open.uid !== uid) return;
    S.open = m; S.open.folder = S.folder;
    const it = S.items.find(function(x) { return x.uid === uid; });
    if (it && !it.seen) { it.seen = true; refreshCounts(); }
    renderMessage(false);
  } catch (e) { if (handleFatal(e)) return; toast(e.message); S.open = null; renderList(); }
}
function readToolbar() {
  const f = currentFolder();
  return '<div class="ml-toolbar"><button class="ml-tbtn" data-ract="back">' + IC.back + 'Назад</button>'
    + '<button class="ml-tbtn" data-ract="reply">' + IC.reply + 'Ответить</button><button class="ml-tbtn" data-ract="replyAll">' + IC.replyAll + 'Ответить всем</button>'
    + '<button class="ml-tbtn" data-ract="forward">' + IC.fwd + 'Переслать</button>'
    + '<button class="ml-tbtn" data-ract="delete">' + IC.trash + 'Удалить</button>'
    + (f.special !== '\\Junk' ? '<button class="ml-tbtn" data-ract="spam">' + IC.spam + 'Спам</button>' : '')
    + '<button class="ml-tbtn" data-ract="unread">Не прочитано</button><button class="ml-tbtn" data-ract="move">' + IC.move + 'В папку</button></div>';
}
function wireReadToolbar() {
  root.querySelectorAll('[data-ract]').forEach(function(b) {
    b.addEventListener('click', function() {
      const a = b.getAttribute('data-ract'), m = S.open;
      if (a === 'back') { S.open = null; renderList(); return; }
      if (!m || m.loading) return;
      if (a === 'reply' || a === 'replyAll' || a === 'forward') { openCompose(replyDraft(m, a)); return; }
      if (a === 'delete') removeUids([m.uid], 'delete');
      else if (a === 'spam') removeUids([m.uid], 'spam');
      else if (a === 'unread') { S.open = null; setSeen([m.uid], false); }
      else if (a === 'move') folderMenu(b, function(to) { removeUids([m.uid], 'move', to); });
    });
  });
}
function addrLine(list) { return (list || []).map(function(a) { return a.name ? esc(a.name) + ' <span class="ml-read-addr">&lt;' + esc(a.address) + '&gt;</span>' : esc(a.address); }).join(', '); }
function renderMessage(allowImages) {
  const m = S.open, main = root.querySelector('#ml-main');
  const from = (m.from && m.from[0]) || {};
  const remote = !allowImages && hasRemoteImages(m.html);
  main.innerHTML = readToolbar() + '<div class="ml-read"><h1>' + esc(m.subject || '(без темы)') + '</h1>'
    + '<div class="ml-read-head">' + avatar(from) + '<div class="ml-read-who"><b>' + esc(from.name || from.address || '') + '</b>' + (from.name ? ' <span class="ml-read-addr">' + esc(from.address) + '</span>' : '')
    + '<div class="ml-read-to">Кому: ' + addrLine(m.to) + (m.cc && m.cc.length ? '<br>Копия: ' + addrLine(m.cc) : '') + '</div></div><div class="ml-read-date">' + esc(longDate(m.date)) + '</div></div>'
    + (remote ? '<div class="ml-imgbar">Картинки из интернета в этом письме скрыты для безопасности. <a id="ml-show-img">Показать картинки</a></div>' : '')
    + '<iframe class="ml-body-frame" id="ml-frame" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>'
    + (m.attachments.length ? '<div class="ml-atts">' + m.attachments.map(function(a) {
      return '<div class="ml-att" data-att="' + a.idx + '" title="Скачать ' + esc(a.filename) + '"><div class="ml-att-ico">' + esc(extOf(a.filename)) + '</div><div style="min-width:0;"><div class="ml-att-name">' + esc(a.filename) + '</div><div class="ml-att-size">' + fmtSize(a.size) + '</div></div></div>';
    }).join('') + '</div>' : '')
    + '<div class="ml-quick"><button class="ml-btn ml-btn-primary" data-ract="reply">Ответить</button><button class="ml-btn" data-ract="replyAll">Ответить всем</button><button class="ml-btn" data-ract="forward">Переслать</button></div>'
    + '</div>';
  wireReadToolbar();
  const fr = main.querySelector('#ml-frame');
  fr.addEventListener('load', function() {
    try {
      const d = fr.contentDocument;
      const h = function() { fr.style.height = Math.max(120, d.documentElement.scrollHeight + 8) + 'px'; };
      h(); setTimeout(h, 300); setTimeout(h, 1500);
      d.querySelectorAll('img').forEach(function(img) { img.addEventListener('load', h); });
    } catch (e) { fr.style.height = '600px'; }
  });
  fr.srcdoc = frameDoc(m.html || '<pre>' + esc(m.text) + '</pre>', allowImages);
  const si = main.querySelector('#ml-show-img');
  if (si) si.addEventListener('click', function() { renderMessage(true); });
  main.querySelectorAll('[data-att]').forEach(function(el) { el.addEventListener('click', function() { downloadAtt(m, Number(el.getAttribute('data-att'))); }); });
}
async function downloadAtt(m, idx) {
  const a = m.attachments.find(function(x) { return x.idx === idx; });
  toast('Скачиваем ' + (a ? a.filename : 'вложение') + '…');
  try {
    const res = await api('/attachment?' + qs({ folder: m.folder, uid: m.uid, idx: idx }), { raw: true });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = a ? a.filename : 'file';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
  } catch (e) { toast(e.message); }
}

// ---------- новое письмо ----------
function quoteHeader(m) { const f = (m.from && m.from[0]) || {}; return longDate(m.date) + ', ' + esc(f.name ? f.name + ' <' + f.address + '>' : f.address) + ':'; }
function replyDraft(m, mode) {
  const myself = S.me.email;
  const d = { replyTo: { folder: m.folder, uid: m.uid } };
  const re = /^(re|ответ|отв)\s*:/i, fw = /^(fwd?|пересл)\s*:/i;
  if (mode === 'forward') {
    d.subject = fw.test(m.subject) ? m.subject : 'Fwd: ' + (m.subject || '');
    d.forward = { folder: m.folder, uid: m.uid };
    d.fwdAtts = m.attachments.slice();
    d.html = '<br><br><div>-------- Пересылаемое сообщение --------<br>' + quoteHeader(m) + '<br>Тема: ' + esc(m.subject || '') + '</div><blockquote>' + (m.html || esc(m.text)) + '</blockquote>';
  } else {
    const from = (m.replyTo && m.replyTo.length ? m.replyTo : m.from) || [];
    d.to = from.map(function(a) { return a.address; });
    if (mode === 'replyAll') d.cc = (m.to || []).concat(m.cc || []).map(function(a) { return a.address; }).filter(function(x) { return x && x !== myself && d.to.indexOf(x) === -1; });
    d.subject = re.test(m.subject) ? m.subject : 'Re: ' + (m.subject || '');
    d.inReplyTo = m.messageId; d.references = m.references;
    d.html = '<br><br><div>' + quoteHeader(m) + '</div><blockquote>' + (m.html || esc(m.text)) + '</blockquote>';
  }
  return d;
}
async function openDraft(uid) {
  try {
    const m = await api('/message?' + qs({ folder: S.folder, uid: uid }));
    openCompose({ to: (m.to || []).map(function(a) { return a.address; }), cc: (m.cc || []).map(function(a) { return a.address; }), subject: m.subject, html: m.html || esc(m.text), draftUid: uid });
  } catch (e) { toast(e.message); }
}
async function loadContacts() {
  if (S.contacts) return S.contacts;
  const map = new Map();
  const add = function(address, name, hint) { address = String(address || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address) || map.has(address)) return; map.set(address, { address: address, name: name || '', hint: hint || '' }); };
  try {
    const r = await ctx.api.resource('users').list({ pageSize: 500, fields: ['email', 'nickname'] });
    const rows = (r && r.data && r.data.data) || [];
    rows.forEach(function(u) { if (!/test\.local$|nocobase\.com$/.test(u.email || '')) add(u.email, u.nickname, 'сотрудник'); });
  } catch (e) { /* ignore */ }
  try {
    const r = await ctx.api.resource('contract_contacts').list({ pageSize: 2000, fields: ['email', 'name', 'position'], filter: { email: { $notEmpty: true } } });
    const rows = (r && r.data && r.data.data) || [];
    rows.forEach(function(c) { add(c.email, c.name, c.position || 'контакт по договору'); });
  } catch (e) { /* ignore */ }
  S.items.forEach(function(m) { (m.from || []).concat(m.to || []).forEach(function(a) { add(a.address, a.name, ''); }); });
  S.contacts = Array.from(map.values());
  return S.contacts;
}
function openCompose(d) {
  const old = document.getElementById('ml-compose-win');
  if (old) { if (!confirmClose(old)) return; old.remove(); }
  const w = document.createElement('div');
  w.className = 'ml-compose'; w.id = 'ml-compose-win';
  w.innerHTML = '<div class="ml-compose-head"><span id="ml-c-title">' + esc(d.subject || 'Новое письмо') + '</span><button data-c="min" title="Свернуть">—</button><button data-c="close" title="Закрыть">✕</button></div>'
    + '<div class="ml-cf" data-rcpt="to"><label>Кому</label><div class="ml-chips"><input type="text" autocomplete="off"></div><span class="ml-cf-toggle" id="ml-c-cc-t">Копия</span></div>'
    + '<div class="ml-cf" data-rcpt="cc" style="display:none;"><label>Копия</label><div class="ml-chips"><input type="text" autocomplete="off"></div></div>'
    + '<div class="ml-cf"><label>Тема</label><input type="text" id="ml-c-subj" value="' + esc(d.subject || '') + '"></div>'
    + '<div class="ml-fmt"><button data-fmt="bold" title="Жирный"><b>Ж</b></button><button data-fmt="italic" title="Курсив"><i>К</i></button><button data-fmt="underline" title="Подчёркнутый"><u>Ч</u></button>'
    + '<button data-fmt="insertUnorderedList" title="Список">•≡</button><button data-fmt="insertOrderedList" title="Нумерованный список">1≡</button><button data-fmt="createLink" title="Ссылка">🔗</button><button data-fmt="removeFormat" title="Очистить оформление">T̸</button></div>'
    + '<div class="ml-editor" id="ml-c-body" contenteditable="true"></div>'
    + '<div class="ml-compose-atts" id="ml-c-atts"></div>'
    + '<div class="ml-compose-foot"><button class="ml-btn ml-btn-primary" id="ml-c-send">Отправить</button><button class="ml-btn" id="ml-c-draft">Сохранить</button>'
    + '<button class="ml-btn" id="ml-c-attach">' + IC.clip + ' Прикрепить файл</button><input type="file" id="ml-c-file" multiple style="display:none;"><span class="ml-status" id="ml-c-status"></span>'
    + '<button class="ml-btn" id="ml-c-cancel" style="margin-left:auto;">Отменить</button></div>';
  document.body.appendChild(w);
  const st = { atts: [], fwdAtts: (d.fwdAtts || []).slice(), draftUid: d.draftUid || null, dirty: false, busy: false };
  w.__st = st;
  const body = w.querySelector('#ml-c-body');
  body.innerHTML = d.html || '<br>';
  const rc = { to: rcptField(w.querySelector('[data-rcpt="to"]'), d.to || [], st), cc: rcptField(w.querySelector('[data-rcpt="cc"]'), d.cc || [], st) };
  if (d.cc && d.cc.length) w.querySelector('[data-rcpt="cc"]').style.display = '';
  w.querySelector('#ml-c-cc-t').addEventListener('click', function() { const f = w.querySelector('[data-rcpt="cc"]'); f.style.display = ''; f.querySelector('input').focus(); });
  const subj = w.querySelector('#ml-c-subj');
  subj.addEventListener('input', function() { st.dirty = true; w.querySelector('#ml-c-title').textContent = subj.value || 'Новое письмо'; });
  body.addEventListener('input', function() { st.dirty = true; });
  w.querySelectorAll('[data-fmt]').forEach(function(b) {
    b.addEventListener('mousedown', function(e) { e.preventDefault(); });
    b.addEventListener('click', function() {
      const c = b.getAttribute('data-fmt');
      if (c === 'createLink') { const u = prompt('Адрес ссылки', 'https://'); if (u) document.execCommand('createLink', false, u); }
      else document.execCommand(c, false, null);
      body.focus();
    });
  });
  function renderAtts() {
    const el = w.querySelector('#ml-c-atts');
    el.innerHTML = st.fwdAtts.map(function(a, i) { return '<span class="ml-chip">' + IC.clip + '<span>' + esc(a.filename) + '</span><b data-fdel="' + i + '">✕</b></span>'; }).join('')
      + st.atts.map(function(a, i) { return '<span class="ml-chip">' + IC.clip + '<span>' + esc(a.filename) + (a.id ? ' · ' + fmtSize(a.size) : ' · загрузка…') + '</span><b data-adel="' + i + '">✕</b></span>'; }).join('');
    el.querySelectorAll('[data-fdel]').forEach(function(b) { b.addEventListener('click', function() { st.fwdAtts.splice(Number(b.getAttribute('data-fdel')), 1); renderAtts(); }); });
    el.querySelectorAll('[data-adel]').forEach(function(b) { b.addEventListener('click', function() { st.atts.splice(Number(b.getAttribute('data-adel')), 1); renderAtts(); }); });
  }
  renderAtts();
  const fileEl = w.querySelector('#ml-c-file');
  w.querySelector('#ml-c-attach').addEventListener('click', function() { fileEl.click(); });
  fileEl.addEventListener('change', async function() {
    const files = Array.from(fileEl.files || []);
    fileEl.value = '';
    for (const f of files) {
      if (f.size > 25 * 1024 * 1024) { toast('Файл «' + f.name + '» больше 25 МБ'); continue; }
      const a = { filename: f.name, size: f.size, id: null };
      st.atts.push(a); st.dirty = true; renderAtts();
      try {
        const r = await api('/upload', { method: 'POST', body: f, headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(f.name) } });
        a.id = r.id;
      } catch (e) { toast('Не удалось прикрепить «' + f.name + '»: ' + e.message); st.atts.splice(st.atts.indexOf(a), 1); }
      renderAtts();
    }
  });
  function payload() {
    const skip = [];
    (d.fwdAtts || []).forEach(function(a) { if (st.fwdAtts.indexOf(a) === -1) skip.push(a.idx); });
    return {
      to: rc.to.list(), cc: rc.cc.list(), subject: subj.value, html: body.innerHTML,
      attachments: st.atts.filter(function(a) { return a.id; }).map(function(a) { return a.id; }),
      inReplyTo: d.inReplyTo, references: d.references, replyTo: d.replyTo,
      forward: d.forward ? { folder: d.forward.folder, uid: d.forward.uid, skip: skip } : undefined, draftUid: st.draftUid
    };
  }
  const status = w.querySelector('#ml-c-status');
  w.querySelector('#ml-c-send').addEventListener('click', async function() {
    if (st.busy) return;
    rc.to.flush(); rc.cc.flush();
    const p = payload();
    if (!p.to.length && !p.cc.length) { toast('Укажите, кому отправить письмо'); w.querySelector('[data-rcpt="to"] input').focus(); return; }
    if (rc.to.bad() || rc.cc.bad()) { toast('Проверьте адреса получателей — есть ошибка'); return; }
    if (st.atts.some(function(a) { return !a.id; })) { toast('Дождитесь загрузки вложений'); return; }
    if (!p.subject.trim() && !confirm('Отправить письмо без темы?')) return;
    st.busy = true; status.textContent = 'Отправляем…';
    try { await api('/send', { json: p }); st.dirty = false; w.remove(); toast('Письмо отправлено'); refreshCounts(); if (currentFolder().special === '\\Sent' || currentFolder().special === '\\Drafts') loadList(true); }
    catch (e) { status.textContent = ''; toast(e.message); }
    st.busy = false;
  });
  w.querySelector('#ml-c-draft').addEventListener('click', async function() {
    if (st.busy) return;
    rc.to.flush(); rc.cc.flush();
    st.busy = true; status.textContent = 'Сохраняем…';
    try { const r = await api('/draft', { json: payload() }); st.draftUid = r.draftUid || null; st.dirty = false; status.textContent = 'Черновик сохранён'; refreshCounts(); if (currentFolder().special === '\\Drafts') loadList(true); }
    catch (e) { status.textContent = ''; toast(e.message); }
    st.busy = false;
  });
  function close() { if (!confirmClose(w)) return; w.remove(); }
  w.querySelector('#ml-c-cancel').addEventListener('click', close);
  w.querySelector('[data-c="close"]').addEventListener('click', function(e) { e.stopPropagation(); close(); });
  w.querySelector('.ml-compose-head').addEventListener('click', function() { w.classList.toggle('min'); });
  setTimeout(function() { if (!(d.to && d.to.length)) w.querySelector('[data-rcpt="to"] input').focus(); else { body.focus(); try { const r = document.createRange(); r.setStart(body, 0); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* ignore */ } } }, 50);
}
function confirmClose(w) { return !(w.__st && w.__st.dirty) || confirm('Закрыть письмо? Несохранённый текст пропадёт.'); }
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

// ---------- запуск ----------
async function start() {
  root.innerHTML = '<div class="ml-loading">Открываем почту…</div>';
  try {
    S.me = await api('/me');
    if (!S.me.configured) { showSetup(S.me.email, false); return; }
    renderShell();
    await loadFolders();
    await loadList(true);
    loadContacts();
  } catch (e) { if (!handleFatal(e)) showCard('<h2>Не получилось открыть почту</h2><p>' + esc(e.message) + '</p>'); }
}
if (window.__mlPoll) clearInterval(window.__mlPoll);
window.__mlPoll = setInterval(function() {
  if (!document.getElementById('ml-root') || !root.isConnected) { clearInterval(window.__mlPoll); window.__mlPoll = null; return; }
  if (S.me && S.me.configured && root.querySelector('.ml-app')) refreshCounts();
}, 60000);
start();

})();
