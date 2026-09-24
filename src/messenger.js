// плавающая кнопка «Открыть ИИ-чат» плагина AI не используется — прячем (выключать сам плагин нельзя: на нём держится клиент NocoBase)
if (!document.getElementById('cm-hide-ai-chat')) {
  const aiSt = document.createElement('style');
  aiSt.id = 'cm-hide-ai-chat';
  aiSt.textContent = '[role="button"][aria-label="Открыть ИИ-чат"], [role="button"][aria-label="Open AI chat"] { display: none !important; }';
  document.head.appendChild(aiSt);
}
// колокольчик: без вкладок «Все / Непрочитанные / Прочитано», всегда фильтр «Непрочитанные»
// (при этом фильтре штатный список сразу убирает сообщение после прочтения, без перезагрузки страницы)
if (!document.getElementById('nb-bell-tabs-style')) {
  const bellTabsStyle = document.createElement('style');
  bellTabsStyle.id = 'nb-bell-tabs-style';
  bellTabsStyle.textContent = '.ant-tabs:has(> .ant-tabs-nav [data-node-key="unread"]):has(> .ant-tabs-nav [data-node-key="read"]) > .ant-tabs-nav { display: none !important; }';
  document.head.appendChild(bellTabsStyle);
}
if (!window.__nbBellUnreadTimer) {
  // MutationObserver в песочнице блоков недоступен, поэтому обычный опрос
  window.__nbBellUnreadTimer = setInterval(function() {
    const allTab = document.querySelector('.ant-tabs-tab-active[data-node-key="all"]');
    if (!allTab) return;
    const tabs = allTab.closest('.ant-tabs');
    const unreadBtn = tabs && tabs.querySelector('.ant-tabs-tab[data-node-key="unread"] .ant-tabs-tab-btn');
    if (unreadBtn && tabs.querySelector('.ant-tabs-tab[data-node-key="read"]')) unreadBtn.click();
  }, 250);
}
(async function () {
// фоновые опросы не ходят в API, когда пользователь не вошёл (страница входа, сессия истекла):
// иначе NocoBase на каждый такой запрос показывает «Пожалуйста, войдите, чтобы продолжить»
function nbSessionAlive() {
  if (/\/signin|\/signup/.test(location.pathname)) return false;
  try { return !!localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return false; }
}

function authToken() { return localStorage.getItem('NOCOBASE_TOKEN'); }

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  ['#7c5cff', '#5b8cff'], ['#3ba55c', '#2fd18f'], ['#ff6a5c', '#ff9a5c'],
  ['#3b9ce0', '#5cd0ff'], ['#f0a93b', '#ffd15c'], ['#e0539c', '#ff7ac7'],
  ['#2fb8b8', '#5ce0d8'], ['#8a6de0', '#b18aff']
];
function gradientFor(id) {
  const n = Math.abs(Number(id) || 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'вчера';
  const y = d.getFullYear() === now.getFullYear() ? '' : '.' + String(d.getFullYear()).slice(2);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + y;
}

function userLabel(u) {
  if (!u) return 'Пользователь';
  return u.nickname || u.username || ('#' + u.id);
}

function listPayload(res) {
  const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  return Array.isArray(d) ? d : [];
}

function formatBytes(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' Б';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ';
  return (n / 1024 / 1024).toFixed(1) + ' МБ';
}

function isImageMime(mt) { return !!mt && mt.indexOf('image/') === 0; }

async function fetchBlobUrl(url) {
  const res = await fetch(url, { credentials: 'include' });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function uploadFile(file) {
  const boundary = '----msgrBoundary' + Date.now() + Math.random().toString(16).slice(2);
  const header = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const footer = '\r\n--' + boundary + '--\r\n';
  const blob = new Blob([header, file, footer]);
  const res = await fetch('/api/attachments:upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: blob
  });
  const data = await res.json();
  return data && data.data;
}

function presenceLabel(iso) {
  if (!iso) return 'нет данных';
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 40) return 'в сети';
  return 'был(а) в сети ' + fmtTime(iso);
}

async function upsertPresence() {
  if (!state.currentUser) return;
  try {
    const res = await ctx.api.resource('chat_presence').list({ filter: { user_id: state.currentUser.id }, pageSize: 1 });
    const rows = listPayload(res);
    if (rows.length) {
      await ctx.api.resource('chat_presence').update({ filterByTk: rows[0].id, values: { last_seen_at: new Date().toISOString() } });
    } else {
      await ctx.api.resource('chat_presence').create({ values: { user_id: state.currentUser.id, last_seen_at: new Date().toISOString() } });
    }
  } catch (e) {}
}

async function loadPresenceMap(userIds) {
  if (!userIds.length) return {};
  const res = await ctx.api.resource('chat_presence').list({ filter: { user_id: { '$in': userIds } }, pageSize: 500 });
  const rows = listPayload(res);
  const map = {};
  rows.forEach(function (r) { map[r.user_id] = r.last_seen_at; });
  return map;
}

const state = {
  currentUser: null,
  users: [],
  conversations: [],
  folders: [],
  activeFolderId: null, // null = "Все"
  activeConvId: null,
  listTimer: null,
  msgTimer: null,
  lastRenderedMsgCount: -1,
};

function injectStyle() {
  if (document.getElementById('msgr-style')) return;
  const style = document.createElement('style');
  style.id = 'msgr-style';
  style.textContent = `
    .msgr-root { --msgr-accent:#2f88ff; --msgr-accent2:#5cb8ff; --msgr-bg:#ffffff; --msgr-panel:#f7f8fb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      border:1px solid #ebedf0; border-radius:14px; overflow:hidden; background:#ffffff;
      box-shadow: 0 2px 18px rgba(20,30,60,.06); }
    .msgr-head { padding:16px 18px 10px; display:flex; align-items:center; justify-content:space-between; }
    .msgr-head h3 { margin:0; font-size:19px; font-weight:700; letter-spacing:-.2px; background:linear-gradient(90deg,#2f88ff,#5cb8ff); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .msgr-new-btn { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; border:none; cursor:pointer; font-size:19px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(47,136,255,.35); transition:transform .15s; }
    .msgr-new-btn:hover { transform:scale(1.07); }
    .msgr-search-wrap { margin:2px 18px 10px; position:relative; }
    .msgr-search-wrap svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#b7bcc7; pointer-events:none; }
    .msgr-search-wrap input { width:100%; box-sizing:border-box; padding:9px 12px 9px 32px; border-radius:20px; border:1px solid #e9ebf0; background:#f7f8fb; font-size:13.5px; outline:none; transition:border-color .15s, background .15s; }
    .msgr-search-wrap input:focus { border-color:#2f88ff; background:#fff; }
    .msgr-folders { display:flex; gap:6px; padding:0 18px 10px; overflow-x:auto; scrollbar-width:none; }
    .msgr-folders::-webkit-scrollbar { display:none; }
    .msgr-folder-pill { flex-shrink:0; padding:6px 14px; border-radius:16px; font-size:12.5px; font-weight:600; cursor:pointer; background:#f7f8fb; color:#6b7280; white-space:nowrap; transition:all .15s; border:1px solid transparent; display:flex; align-items:center; gap:5px; }
    .msgr-folder-pill:hover { background:#eef2f8; }
    .msgr-folder-pill.active { background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; box-shadow:0 3px 8px rgba(47,136,255,.3); }
    .msgr-folder-pill.add { background:transparent; border:1px dashed #d7dce3; color:#9aa1ac; }
    .msgr-conv-list { max-height:560px; overflow-y:auto; padding:2px 8px 10px; }
    .msgr-conv-item { display:flex; align-items:center; gap:11px; padding:10px 10px; cursor:pointer; border-radius:12px; position:relative; transition:background .12s; }
    .msgr-conv-item:hover { background:#f7f8fb; }
    .msgr-conv-item:hover .msgr-kebab { opacity:1; }
    .msgr-avatar { width:46px; height:46px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:16px; box-shadow: inset 0 -6px 10px rgba(0,0,0,.08); }
    .msgr-conv-meta { flex:1; min-width:0; }
    .msgr-conv-top { display:flex; justify-content:space-between; align-items:baseline; gap:6px; }
    .msgr-conv-name { font-weight:600; font-size:14px; color:#1a1d24; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .msgr-conv-time { font-size:11px; color:#a6acb8; flex-shrink:0; }
    .msgr-conv-bottom { display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:2px; }
    .msgr-conv-preview { font-size:12.5px; color:#8a90a0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .msgr-badge { background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; font-size:11px; font-weight:700; min-width:19px; height:19px; border-radius:10px; display:flex; align-items:center; justify-content:center; padding:0 5px; flex-shrink:0; }
    .msgr-kebab { opacity:0; transition:opacity .12s; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#a6acb8; font-size:15px; cursor:pointer; flex-shrink:0; }
    .msgr-kebab:hover { background:#e7ebf1; color:#4a5568; }
    .msgr-empty { padding:36px 18px; color:#b3b8c2; font-size:13px; text-align:center; }

    .msgr-folder-menu { position:absolute; background:#fff; border-radius:10px; box-shadow:0 8px 28px rgba(20,30,60,.18); border:1px solid #eceff3; z-index:2500; min-width:200px; padding:6px; }
    .msgr-folder-menu-item { padding:8px 10px; border-radius:7px; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; }
    .msgr-folder-menu-item:hover { background:#f2f5fa; }
    .msgr-folder-menu-sep { height:1px; background:#f0f1f4; margin:4px 2px; }

    .msgr-modal-mask { position:fixed; inset:0; background:rgba(15,20,35,.5); backdrop-filter:blur(1px); z-index:3000; opacity:0; transition:opacity .22s; }
    .msgr-modal-mask.open { opacity:1; }
    .msgr-chat-window { position:fixed; top:50%; left:50%; transform:translate(-50%,-48%) scale(.97); background:#fff; border-radius:16px; width:560px; max-width:94vw; height:640px; max-height:88vh; z-index:3001; opacity:0; transition:opacity .22s, transform .22s cubic-bezier(.2,.9,.3,1), width .18s; display:flex; flex-direction:row; overflow:hidden; box-shadow:0 24px 60px rgba(10,15,30,.28); }
    .msgr-chat-window.open { transform:translate(-50%,-50%) scale(1); opacity:1; }
    .msgr-chat-window.with-info { width:880px; }
    .msgr-chat-main { flex:1; min-width:0; display:flex; flex-direction:column; }
    .msgr-chat-head { padding:13px 16px; border-bottom:1px solid #eef0f3; display:flex; align-items:center; gap:11px; background:linear-gradient(180deg,#fff,#fbfcfe); cursor:pointer; }
    .msgr-chat-head-info { flex:1; min-width:0; }
    .msgr-chat-title { font-weight:700; font-size:15px; color:#1a1d24; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .msgr-chat-sub { font-size:11.5px; color:#9aa1ac; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .msgr-chat-close { margin-left:auto; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#9aa1ac; font-size:18px; transition:background .12s; flex-shrink:0; }
    .msgr-chat-close:hover { background:#f2f4f7; color:#4a5568; }
    .msgr-info-panel { width:320px; flex-shrink:0; border-left:1px solid #eef0f3; display:none; flex-direction:column; background:#fbfcfe; }
    .msgr-chat-window.with-info .msgr-info-panel { display:flex; }
    .msgr-info-head { padding:13px 16px; border-bottom:1px solid #eef0f3; display:flex; align-items:center; justify-content:space-between; }
    .msgr-info-head b { font-size:14px; }
    .msgr-info-close { cursor:pointer; color:#9aa1ac; font-size:18px; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .msgr-info-close:hover { background:#eef0f3; }
    .msgr-info-tabs { display:flex; padding:8px 12px 0; gap:4px; }
    .msgr-info-tab { flex:1; text-align:center; padding:8px 6px; font-size:12.5px; font-weight:600; color:#9aa1ac; cursor:pointer; border-bottom:2px solid transparent; }
    .msgr-info-tab.active { color:#2f88ff; border-bottom-color:#2f88ff; }
    .msgr-info-body { flex:1; min-height:0; overflow-y:auto; padding:8px 10px 14px; }
    .msgr-add-member-btn { display:block; width:100%; text-align:left; background:#eef5ff; color:#2f88ff; border:none; border-radius:9px; padding:9px 10px; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:8px; }
    .msgr-add-member-btn:hover { background:#e2edff; }
    .msgr-member-row { display:flex; align-items:center; gap:10px; padding:8px 6px; border-radius:10px; }
    .msgr-member-row:hover { background:#f2f5fa; }
    .msgr-member-meta { flex:1; min-width:0; }
    .msgr-member-name { font-size:13px; font-weight:600; color:#1a1d24; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .msgr-member-status { font-size:11.5px; display:flex; align-items:center; gap:5px; margin-top:1px; }
    .msgr-status-dot { width:7px; height:7px; border-radius:50%; background:#c5cad3; flex-shrink:0; }
    .msgr-status-dot.online { background:#3ba55c; box-shadow:0 0 0 2px rgba(59,165,92,.18); }
    .msgr-member-status.online-text { color:#3ba55c; }
    .msgr-member-status.offline-text { color:#9aa1ac; }
    .msgr-media-search { margin:2px 4px 10px; position:relative; }
    .msgr-media-search svg { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:#b7bcc7; }
    .msgr-media-search input { width:100%; box-sizing:border-box; padding:7px 10px 7px 28px; border-radius:16px; border:1px solid #e9ebf0; background:#fff; font-size:12.5px; outline:none; }
    .msgr-media-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; padding:0 4px; }
    .msgr-media-thumb { width:100%; aspect-ratio:1; border-radius:8px; background:#eef0f3 center/cover no-repeat; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#c5cad3; }
    .msgr-file-row { display:flex; align-items:center; gap:10px; padding:8px 6px; border-radius:10px; }
    .msgr-file-row:hover { background:#f2f5fa; }
    .msgr-file-icon { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .msgr-file-meta { flex:1; min-width:0; }
    .msgr-file-name { font-size:12.5px; font-weight:600; color:#1a1d24; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .msgr-file-size { font-size:11px; color:#9aa1ac; }
    .msgr-file-dl { color:#2f88ff; flex-shrink:0; }

    .msgr-attach-btn { width:38px; height:38px; border-radius:50%; background:#f7f8fb; border:1px solid #e6e9ee; color:#8a90a0; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:background .12s; }
    .msgr-attach-btn:hover { background:#eef2f8; color:#2f88ff; }
    .msgr-att-image { max-width:220px; max-height:220px; border-radius:12px; display:block; cursor:pointer; background:#eef0f3; }
    .msgr-att-file { display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:12px; background:rgba(255,255,255,.15); min-width:180px; }
    .msgr-msg-row:not(.own) .msgr-att-file { background:#f7f8fb; }
    .msgr-att-file-icon { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,.25); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .msgr-msg-row:not(.own) .msgr-att-file-icon { background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; }
    .msgr-att-file-meta { min-width:0; }
    .msgr-att-file-name { font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
    .msgr-att-file-size { font-size:10.5px; opacity:.75; }
    .msgr-thread { flex:1; min-height:0; overflow-y:auto; padding:18px 18px 8px; display:flex; flex-direction:column; gap:3px;
      background: repeating-linear-gradient(135deg, #f8f9fc 0 40px, #f6f7fb 40px 80px); }
    .msgr-msg-row { display:flex; margin-bottom:4px; animation: msgrFadeIn .15s ease; }
    .msgr-msg-row.own { justify-content:flex-end; }
    @keyframes msgrFadeIn { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
    .msgr-bubble { max-width:72%; padding:9px 13px; border-radius:16px; font-size:13.5px; line-height:1.42; word-wrap:break-word; white-space:pre-wrap; position:relative; box-shadow:0 1px 2px rgba(20,30,60,.06); }
    .msgr-msg-row.own .msgr-bubble { background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; border-bottom-right-radius:5px; }
    .msgr-msg-row:not(.own) .msgr-bubble { background:#fff; color:#1a1d24; border-bottom-left-radius:5px; }
    .msgr-bubble .msgr-author { font-size:11px; font-weight:700; color:#2f88ff; display:block; margin-bottom:2px; }
    .msgr-bubble .msgr-time { font-size:10px; opacity:.65; margin-left:10px; float:right; margin-top:5px; }
    .msgr-composer { border-top:1px solid #eef0f3; padding:10px 14px; display:flex; gap:9px; align-items:flex-end; background:#fff; }
    .msgr-composer textarea { flex:1; resize:none; border:1px solid #e6e9ee; border-radius:14px; padding:9px 14px; font-size:13.5px; font-family:inherit; outline:none; height:38px; max-height:110px; background:#f7f8fb; transition:border-color .15s; }
    .msgr-composer textarea:focus { border-color:#2f88ff; background:#fff; }
    .msgr-send-btn { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#2f88ff,#5cb8ff); border:none; color:#fff; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(47,136,255,.35); transition:transform .12s; }
    .msgr-send-btn:hover { transform:scale(1.06); }
    .msgr-send-btn:disabled { opacity:.5; cursor:default; transform:none; }

    .msgr-modal-box { position:fixed; top:50%; left:50%; transform:translate(-50%,-46%) scale(.96); background:#fff; border-radius:14px; width:380px; max-width:92vw; max-height:80vh; z-index:3001; opacity:0; transition:all .2s; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 24px 60px rgba(10,15,30,.28); }
    .msgr-modal-box.open { transform:translate(-50%,-50%) scale(1); opacity:1; }
    .msgr-modal-head { padding:14px 16px; border-bottom:1px solid #eef0f3; font-weight:700; font-size:15px; display:flex; justify-content:space-between; align-items:center; }
    .msgr-modal-close { cursor:pointer; color:#9aa1ac; font-size:18px; }
    .msgr-modal-body { padding:12px 16px; overflow-y:auto; flex:1; min-height:0; }
    .msgr-user-row { display:flex; align-items:center; gap:10px; padding:8px 4px; cursor:pointer; border-radius:9px; }
    .msgr-user-row:hover { background:#f2f5fa; }
    .msgr-user-row input { margin-left:auto; }
    .msgr-group-name-input, .msgr-folder-name-input { width:100%; box-sizing:border-box; padding:9px 11px; border-radius:9px; border:1px solid #e6e9ee; font-size:13px; margin-bottom:10px; display:none; }
    .msgr-modal-foot { padding:12px 16px; border-top:1px solid #eef0f3; display:flex; justify-content:flex-end; gap:8px; }
    .msgr-modal-foot button { background:linear-gradient(135deg,#2f88ff,#5cb8ff); color:#fff; border:none; border-radius:9px; padding:8px 16px; font-size:13px; cursor:pointer; font-weight:600; }
    .msgr-modal-foot button:disabled { opacity:.5; cursor:default; }
  `;
  document.head.appendChild(style);
}

function avatarHtml(label, id, size) {
  const g = gradientFor(id);
  const s = size ? ('width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.36) + 'px;') : '';
  return '<div class="msgr-avatar" style="background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ');' + s + '">' + esc(initials(label)) + '</div>';
}

async function loadUsers() {
  const res = await ctx.api.resource('users').list({ fields: ['id', 'nickname', 'username'], pageSize: 200 });
  return listPayload(res);
}

async function loadFolders() {
  const res = await ctx.api.resource('chat_folders').list({ filter: { user_id: state.currentUser.id }, sort: ['sort_order'], pageSize: 100 });
  state.folders = listPayload(res);
  if (state.folders.length) {
    const itemsRes = await ctx.api.resource('chat_folder_items').list({
      filter: { folder_id: { '$in': state.folders.map(function (f) { return f.id; }) } }, pageSize: 1000
    });
    const items = listPayload(itemsRes);
    state.folders.forEach(function (f) {
      f.convIds = items.filter(function (i) { return i.folder_id === f.id; }).map(function (i) { return i.conversation_id; });
    });
  }
}

async function loadMyConversations() {
  const meId = state.currentUser.id;
  const membRes = await ctx.api.resource('chat_conversation_members').list({
    filter: { user_id: meId }, appends: ['conversation'], pageSize: 200
  });
  const myMemberships = listPayload(membRes);
  if (!myMemberships.length) { state.conversations = []; return; }
  const convIds = myMemberships.map(function (m) { return m.conversation_id; });

  const allMembersRes = await ctx.api.resource('chat_conversation_members').list({
    filter: { conversation_id: { '$in': convIds } }, appends: ['user'], pageSize: 1000
  });
  const allMembers = listPayload(allMembersRes);

  const msgRes = await ctx.api.resource('chat_messages').list({
    filter: { conversation_id: { '$in': convIds } }, appends: ['author'],
    sort: ['-created_at'], pageSize: 500
  });
  const msgs = listPayload(msgRes);

  const lastMsgByConv = {};
  msgs.forEach(function (m) {
    if (!lastMsgByConv[m.conversation_id]) lastMsgByConv[m.conversation_id] = m;
  });

  state.conversations = myMemberships.map(function (mem) {
    const conv = mem.conversation || {};
    const members = allMembers.filter(function (x) { return x.conversation_id === mem.conversation_id; });
    const others = members.filter(function (x) { return x.user_id !== meId; });
    let title;
    if (conv.is_group) {
      title = conv.name || 'Группа';
    } else {
      title = others.length ? userLabel(others[0].user) : 'Личный чат';
    }
    const last = lastMsgByConv[mem.conversation_id];
    const lastReadAt = mem.last_read_at ? new Date(mem.last_read_at) : new Date(0);
    const unread = msgs.filter(function (m) {
      return m.conversation_id === mem.conversation_id && m.author_id !== meId && new Date(m.created_at) > lastReadAt;
    }).length;
    return {
      id: mem.conversation_id,
      memberRowId: mem.id,
      title: title,
      is_group: conv.is_group,
      members: members,
      others: others,
      lastMessage: last,
      lastReadAt: mem.last_read_at,
      unread: unread
    };
  }).sort(function (a, b) {
    const ta = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
    const tb = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
    return tb - ta;
  });
}

function closeFolderMenu() {
  const m = document.getElementById('msgr-folder-menu');
  if (m) m.remove();
  document.removeEventListener('click', closeFolderMenuOutside, true);
}
function closeFolderMenuOutside(e) {
  const m = document.getElementById('msgr-folder-menu');
  if (m && !m.contains(e.target)) closeFolderMenu();
}

function openFolderMenu(root, anchorEl, convId) {
  closeFolderMenu();
  const menu = document.createElement('div');
  menu.className = 'msgr-folder-menu';
  menu.id = 'msgr-folder-menu';
  const inFolders = state.folders.filter(function (f) { return (f.convIds || []).indexOf(convId) !== -1; }).map(function (f) { return f.id; });
  menu.innerHTML = (state.folders.length ? state.folders.map(function (f) {
    const checked = inFolders.indexOf(f.id) !== -1;
    return '<div class="msgr-folder-menu-item" data-folder="' + f.id + '"><span>' + esc(f.name) + '</span><span>' + (checked ? '✓' : '') + '</span></div>';
  }).join('') + '<div class="msgr-folder-menu-sep"></div>' : '') +
    '<div class="msgr-folder-menu-item" id="msgr-new-folder-item"><span>+ Новая папка…</span></div>';
  document.body.appendChild(menu);
  const rect = anchorEl.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';

  menu.querySelectorAll('[data-folder]').forEach(function (el) {
    el.addEventListener('click', async function (e) {
      e.stopPropagation();
      const folderId = Number(el.getAttribute('data-folder'));
      const folder = state.folders.find(function (f) { return f.id === folderId; });
      const already = (folder.convIds || []).indexOf(convId) !== -1;
      if (already) {
        const itemsRes = await ctx.api.resource('chat_folder_items').list({ filter: { folder_id: folderId, conversation_id: convId } });
        const items = listPayload(itemsRes);
        for (const it of items) await ctx.api.resource('chat_folder_items').destroy({ filterByTk: it.id });
        folder.convIds = (folder.convIds || []).filter(function (id) { return id !== convId; });
      } else {
        await ctx.api.resource('chat_folder_items').create({ values: { folder_id: folderId, conversation_id: convId } });
        folder.convIds = (folder.convIds || []).concat([convId]);
      }
      closeFolderMenu();
      renderFolders(root);
      renderConvList(root, currentSearchValue(root));
    });
  });
  menu.querySelector('#msgr-new-folder-item').addEventListener('click', function (e) {
    e.stopPropagation();
    closeFolderMenu();
    promptNewFolder(root, convId);
  });
  setTimeout(function () { document.addEventListener('click', closeFolderMenuOutside, true); }, 10);
}

function promptNewFolder(root, convIdToAdd) {
  const mask = document.createElement('div');
  mask.className = 'msgr-modal-mask';
  const box = document.createElement('div');
  box.className = 'msgr-modal-box';
  box.style.width = '320px';
  box.innerHTML =
    '<div class="msgr-modal-head"><span>Новая папка</span><span class="msgr-modal-close" id="msgr-nf-x">&times;</span></div>' +
    '<div class="msgr-modal-body"><input class="msgr-folder-name-input" id="msgr-nf-input" style="display:block" placeholder="Название папки" autofocus></div>' +
    '<div class="msgr-modal-foot"><button id="msgr-nf-create">Создать</button></div>';
  document.body.appendChild(mask);
  document.body.appendChild(box);
  setTimeout(function () { mask.classList.add('open'); box.classList.add('open'); }, 20);
  function close() {
    mask.classList.remove('open'); box.classList.remove('open');
    setTimeout(function () { mask.remove(); box.remove(); }, 200);
  }
  mask.addEventListener('click', close);
  box.querySelector('#msgr-nf-x').addEventListener('click', close);
  box.querySelector('#msgr-nf-create').addEventListener('click', async function () {
    const name = box.querySelector('#msgr-nf-input').value.trim();
    if (!name) return;
    const res = await ctx.api.resource('chat_folders').create({
      values: { name: name, user_id: state.currentUser.id, sort_order: state.folders.length, created_at: new Date().toISOString() }
    });
    const folder = (res.data && res.data.data) || res.data;
    folder.convIds = [];
    if (convIdToAdd) {
      await ctx.api.resource('chat_folder_items').create({ values: { folder_id: folder.id, conversation_id: convIdToAdd } });
      folder.convIds = [convIdToAdd];
    }
    state.folders.push(folder);
    close();
    renderFolders(root);
    renderConvList(root, currentSearchValue(root));
  });
}

function currentSearchValue(root) {
  const el = root.querySelector('#msgr-search-input');
  return el ? el.value : '';
}

function renderFolders(root) {
  const wrap = root.querySelector('#msgr-folders');
  const allActive = state.activeFolderId === null;
  let html = '<div class="msgr-folder-pill' + (allActive ? ' active' : '') + '" data-folder="all">Все</div>';
  html += state.folders.map(function (f) {
    const active = state.activeFolderId === f.id;
    return '<div class="msgr-folder-pill' + (active ? ' active' : '') + '" data-folder="' + f.id + '">' + esc(f.name) + '</div>';
  }).join('');
  wrap.innerHTML = html;
  wrap.querySelectorAll('.msgr-folder-pill').forEach(function (el) {
    el.addEventListener('click', function () {
      const v = el.getAttribute('data-folder');
      state.activeFolderId = v === 'all' ? null : Number(v);
      renderFolders(root);
      renderConvList(root, currentSearchValue(root));
    });
  });
}

function renderConvList(root, filterText) {
  const listEl = root.querySelector('#msgr-conv-list');
  let items = state.conversations;
  if (state.activeFolderId !== null) {
    const folder = state.folders.find(function (f) { return f.id === state.activeFolderId; });
    const ids = folder ? (folder.convIds || []) : [];
    items = items.filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }
  if (filterText) {
    items = items.filter(function (c) { return c.title.toLowerCase().indexOf(filterText.toLowerCase()) !== -1; });
  }
  if (!items.length) {
    listEl.innerHTML = '<div class="msgr-empty">' + (state.conversations.length ? 'Нет чатов в этой папке' : 'Нет бесед. Нажмите «+», чтобы начать переписку.') + '</div>';
    return;
  }
  listEl.innerHTML = items.map(function (c) {
    const preview = c.lastMessage
      ? ((c.lastMessage.author_id === state.currentUser.id ? 'Вы: ' : '') + esc((c.lastMessage.message || '').slice(0, 42)))
      : 'Нет сообщений';
    const time = c.lastMessage ? fmtTime(c.lastMessage.created_at) : '';
    return '<div class="msgr-conv-item" data-id="' + c.id + '">' +
      avatarHtml(c.title, c.id) +
      '<div class="msgr-conv-meta">' +
        '<div class="msgr-conv-top"><span class="msgr-conv-name">' + esc(c.title) + '</span><span class="msgr-conv-time">' + time + '</span></div>' +
        '<div class="msgr-conv-bottom"><span class="msgr-conv-preview">' + preview + '</span>' +
          (c.unread ? '<span class="msgr-badge">' + c.unread + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<span class="msgr-kebab" data-kebab="' + c.id + '">&#8942;</span>' +
    '</div>';
  }).join('');
  listEl.querySelectorAll('.msgr-conv-item').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.target.closest('.msgr-kebab')) return;
      openChatWindow(root, Number(el.getAttribute('data-id')));
    });
  });
  listEl.querySelectorAll('.msgr-kebab').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      openFolderMenu(root, el, Number(el.getAttribute('data-kebab')));
    });
  });
}

async function markRead(conv) {
  try {
    await ctx.api.resource('chat_conversation_members').update({
      filterByTk: conv.memberRowId, values: { last_read_at: new Date().toISOString() }
    });
    conv.unread = 0;
    conv.lastReadAt = new Date().toISOString();
  } catch (e) {}
}

function closeChatWindow() {
  if (state.msgTimer) { clearInterval(state.msgTimer); state.msgTimer = null; }
  state.activeConvId = null;
  state.lastRenderedMsgCount = -1;
  const mask = document.getElementById('msgr-chat-mask');
  const win = document.getElementById('msgr-chat-window');
  if (!mask) return;
  mask.classList.remove('open');
  win.classList.remove('open');
  setTimeout(function () { if (mask.parentNode) mask.remove(); if (win.parentNode) win.remove(); }, 220);
}

async function openChatWindow(rootPage, convId) {
  const conv = state.conversations.find(function (c) { return c.id === convId; });
  if (!conv) return;
  state.activeConvId = convId;
  state.lastRenderedMsgCount = -1;

  const mask = document.createElement('div');
  mask.className = 'msgr-modal-mask';
  mask.id = 'msgr-chat-mask';
  const win = document.createElement('div');
  win.className = 'msgr-chat-window';
  win.id = 'msgr-chat-window';
  win.innerHTML =
    '<div class="msgr-chat-main">' +
      '<div class="msgr-chat-head" id="msgr-chat-head">' +
        avatarHtml(conv.title, conv.id, 40) +
        '<div class="msgr-chat-head-info"><div class="msgr-chat-title">' + esc(conv.title) + '</div>' +
        '<div class="msgr-chat-sub" id="msgr-chat-sub">' + (conv.is_group ? (conv.members.length + ' участников') : '') + '</div></div>' +
        '<span class="msgr-chat-close" id="msgr-chat-close">&times;</span>' +
      '</div>' +
      '<div class="msgr-thread" id="msgr-thread"><div class="msgr-empty">Загрузка…</div></div>' +
      '<div class="msgr-composer">' +
        '<input type="file" id="msgr-file-input" style="display:none">' +
        '<button class="msgr-attach-btn" id="msgr-attach-btn" title="Прикрепить файл"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.19 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg></button>' +
        '<textarea id="msgr-input" placeholder="Написать сообщение…" rows="1"></textarea>' +
        '<button class="msgr-send-btn" id="msgr-send-btn" title="Отправить"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 21.5L23 12 2.5 2.5 2.5 10 17 12 2.5 14z"/></svg></button>' +
      '</div>' +
    '</div>' +
    '<div class="msgr-info-panel" id="msgr-info-panel"></div>';

  document.body.appendChild(mask);
  document.body.appendChild(win);
  setTimeout(function () { mask.classList.add('open'); win.classList.add('open'); }, 20);

  mask.addEventListener('click', closeChatWindow);
  win.querySelector('#msgr-chat-close').addEventListener('click', function (e) { e.stopPropagation(); closeChatWindow(); });
  win.querySelector('#msgr-chat-head').addEventListener('click', function () { toggleInfoPanel(win, convId); });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape' && document.getElementById('msgr-chat-window')) {
      closeChatWindow();
      document.removeEventListener('keydown', escHandler);
    }
  });

  const textarea = win.querySelector('#msgr-input');
  const sendBtn = win.querySelector('#msgr-send-btn');
  sendBtn.addEventListener('click', function () { sendMessage(rootPage, win, convId); });
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(rootPage, win, convId); }
  });
  textarea.addEventListener('input', function () {
    textarea.style.height = '38px';
    textarea.style.height = Math.min(textarea.scrollHeight, 110) + 'px';
  });
  textarea.focus();

  const fileInput = win.querySelector('#msgr-file-input');
  win.querySelector('#msgr-attach-btn').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) {
      sendFile(rootPage, win, convId, fileInput.files[0]);
      fileInput.value = '';
    }
  });

  await loadAndRenderMessages(win, convId);
  await markRead(conv);
  renderConvList(rootPage, currentSearchValue(rootPage));

  state.msgTimer = setInterval(function () {
    if (state.activeConvId === convId && document.getElementById('msgr-chat-window')) {
      if (nbSessionAlive()) loadAndRenderMessages(win, convId, true);
    } else if (state.msgTimer) {
      clearInterval(state.msgTimer); state.msgTimer = null;
    }
  }, 3000);
}

async function loadAndRenderMessages(win, convId, isPoll) {
  const res = await ctx.api.resource('chat_messages').list({
    filter: { conversation_id: convId }, appends: ['author', 'attachment'], sort: ['created_at'], pageSize: 500
  });
  const msgs = listPayload(res);
  if (isPoll && msgs.length === state.lastRenderedMsgCount) return;
  state.lastRenderedMsgCount = msgs.length;

  const thread = win.querySelector('#msgr-thread');
  if (!thread) return;
  const wasAtBottom = thread.scrollTop + thread.clientHeight >= thread.scrollHeight - 40;
  const conv = state.conversations.find(function (c) { return c.id === convId; });
  const showAuthor = conv && conv.is_group;

  thread.innerHTML = msgs.map(function (m) {
    const own = m.author_id === state.currentUser.id;
    const att = m.attachment;
    let attHtml = '';
    if (att) {
      if (isImageMime(att.mimetype)) {
        attHtml = '<img class="msgr-att-image" data-att-url="' + esc(att.url) + '" alt="' + esc(att.title || '') + '" style="min-height:80px;min-width:120px">';
      } else {
        attHtml = '<div class="msgr-att-file" data-att-url="' + esc(att.url) + '" data-att-name="' + esc((att.title || 'file') + (att.extname || '')) + '" style="cursor:pointer">' +
          '<div class="msgr-att-file-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>' +
          '<div class="msgr-att-file-meta"><div class="msgr-att-file-name">' + esc((att.title || 'file') + (att.extname || '')) + '</div>' +
          '<div class="msgr-att-file-size">' + formatBytes(att.size) + '</div></div>' +
        '</div>';
      }
    }
    return '<div class="msgr-msg-row' + (own ? ' own' : '') + '">' +
      '<div class="msgr-bubble">' +
        (showAuthor && !own ? '<span class="msgr-author">' + esc(userLabel(m.author)) + '</span>' : '') +
        attHtml +
        (m.message ? '<div' + (att ? ' style="margin-top:5px"' : '') + '>' + esc(m.message) + '</div>' : '') +
        '<span class="msgr-time">' + fmtTime(m.created_at) + '</span>' +
      '</div>' +
    '</div>';
  }).join('') || '<div class="msgr-empty">Сообщений пока нет — напишите первым</div>';

  if (!isPoll || wasAtBottom) thread.scrollTop = thread.scrollHeight;

  hydrateAttachments(thread);
  wireFileOpen(thread);

  if (state.activeConvId === convId && conv && conv.unread) await markRead(conv);
}

function hydrateAttachments(scope) {
  scope.querySelectorAll('img.msgr-att-image[data-att-url]').forEach(async function (img) {
    const url = img.getAttribute('data-att-url');
    img.removeAttribute('data-att-url');
    try {
      img.src = await fetchBlobUrl(url);
    } catch (e) {}
  });
}

function wireFileOpen(scope) {
  scope.querySelectorAll('.msgr-att-file[data-att-url]').forEach(function (el) {
    if (el.__wired) return;
    el.__wired = true;
    el.addEventListener('click', async function () {
      const url = el.getAttribute('data-att-url');
      const name = el.getAttribute('data-att-name');
      try {
        const blobUrl = await fetchBlobUrl(url);
        const a = document.createElement('a');
        a.href = blobUrl; a.download = name; a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) {}
    });
  });
}

async function notifyOthers(convId, textPreview) {
  try {
    const conv = state.conversations.find(function (c) { return c.id === convId; });
    if (!conv) return;
    const senderLabel = userLabel(state.currentUser);
    const title = conv.is_group ? (conv.title + ' · ' + senderLabel) : senderLabel;
    const preview = (textPreview || '').slice(0, 90);
    const others = conv.members.filter(function (m) { return m.user_id !== state.currentUser.id; });
    for (const m of others) {
      await ctx.api.resource('chat_notifications').create({
        values: { user_id: m.user_id, conversation_id: convId, title: title, text: preview, is_read: false, created_at: new Date().toISOString() }
      });
    }
  } catch (e) {}
}

async function sendFile(rootPage, win, convId, file) {
  const sendBtn = win.querySelector('#msgr-send-btn');
  const attachBtn = win.querySelector('#msgr-attach-btn');
  attachBtn.disabled = true; sendBtn.disabled = true;
  try {
    const att = await uploadFile(file);
    if (!att || !att.id) return;
    const textarea = win.querySelector('#msgr-input');
    const caption = textarea.value.trim();
    await ctx.api.resource('chat_messages').create({
      values: { conversation_id: convId, author_id: state.currentUser.id, message: caption, attachment_id: att.id, created_at: new Date().toISOString() }
    });
    textarea.value = ''; textarea.style.height = '38px';
    await loadAndRenderMessages(win, convId);
    await loadMyConversations();
    renderConvList(rootPage, currentSearchValue(rootPage));
    await notifyOthers(convId, caption || ('📎 ' + file.name));
  } catch (e) {
  } finally {
    attachBtn.disabled = false; sendBtn.disabled = false;
  }
}

async function sendMessage(rootPage, win, convId) {
  const textarea = win.querySelector('#msgr-input');
  const text = textarea.value.trim();
  if (!text) return;
  const sendBtn = win.querySelector('#msgr-send-btn');
  sendBtn.disabled = true;
  try {
    await ctx.api.resource('chat_messages').create({
      values: { conversation_id: convId, author_id: state.currentUser.id, message: text, created_at: new Date().toISOString() }
    });
    textarea.value = '';
    textarea.style.height = '38px';
    await loadAndRenderMessages(win, convId);
    await loadMyConversations();
    renderConvList(rootPage, currentSearchValue(rootPage));
    await notifyOthers(convId, text);
  } catch (e) {
  } finally {
    sendBtn.disabled = false;
    textarea.focus();
  }
}

function closeNewChatModal() {
  const mask = document.getElementById('msgr-modal-mask');
  const box = document.getElementById('msgr-modal-box');
  if (!mask) return;
  mask.classList.remove('open'); box.classList.remove('open');
  setTimeout(function () { if (mask.parentNode) mask.remove(); if (box.parentNode) box.remove(); }, 200);
}

function openNewChatModal(root) {
  const mask = document.createElement('div');
  mask.className = 'msgr-modal-mask';
  mask.id = 'msgr-modal-mask';
  const box = document.createElement('div');
  box.className = 'msgr-modal-box';
  box.id = 'msgr-modal-box';

  const others = state.users.filter(function (u) { return u.id !== state.currentUser.id; });
  box.innerHTML =
    '<div class="msgr-modal-head"><span>Новая переписка</span><span class="msgr-modal-close" id="msgr-modal-x">&times;</span></div>' +
    '<div class="msgr-modal-body">' +
      '<input class="msgr-group-name-input" id="msgr-group-name" placeholder="Название группы">' +
      others.map(function (u) {
        return '<label class="msgr-user-row">' + avatarHtml(userLabel(u), u.id, 34) +
          '<span>' + esc(userLabel(u)) + '</span>' +
          '<input type="checkbox" data-uid="' + u.id + '"></label>';
      }).join('') +
    '</div>' +
    '<div class="msgr-modal-foot"><button id="msgr-modal-create" disabled>Создать</button></div>';

  document.body.appendChild(mask);
  document.body.appendChild(box);
  setTimeout(function () { mask.classList.add('open'); box.classList.add('open'); }, 20);

  mask.addEventListener('click', closeNewChatModal);
  box.querySelector('#msgr-modal-x').addEventListener('click', closeNewChatModal);

  const groupNameInput = box.querySelector('#msgr-group-name');
  const createBtn = box.querySelector('#msgr-modal-create');
  const checkboxes = box.querySelectorAll('input[type=checkbox]');

  function refreshFoot() {
    const checked = Array.from(checkboxes).filter(function (c) { return c.checked; });
    createBtn.disabled = checked.length === 0;
    groupNameInput.style.display = checked.length > 1 ? 'block' : 'none';
  }
  checkboxes.forEach(function (cb) { cb.addEventListener('change', refreshFoot); });

  createBtn.addEventListener('click', async function () {
    const checked = Array.from(checkboxes).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.getAttribute('data-uid')); });
    if (!checked.length) return;
    createBtn.disabled = true;
    try {
      const convId = await getOrCreateConversation(checked, groupNameInput.value.trim());
      closeNewChatModal();
      await loadMyConversations();
      renderConvList(root, '');
      await openChatWindow(root, convId);
    } catch (e) {
      createBtn.disabled = false;
    }
  });
}

function closeAddMemberModal() {
  const mask = document.getElementById('msgr-addmember-mask');
  const box = document.getElementById('msgr-addmember-box');
  if (!mask) return;
  mask.classList.remove('open'); box.classList.remove('open');
  setTimeout(function () { if (mask.parentNode) mask.remove(); if (box.parentNode) box.remove(); }, 200);
}

function openAddMemberModal(convId) {
  const conv = state.conversations.find(function (c) { return c.id === convId; });
  if (!conv) return;
  const memberIds = conv.members.map(function (m) { return m.user_id; });
  const candidates = state.users.filter(function (u) { return memberIds.indexOf(u.id) === -1; });

  const mask = document.createElement('div');
  mask.className = 'msgr-modal-mask';
  mask.id = 'msgr-addmember-mask';
  const box = document.createElement('div');
  box.className = 'msgr-modal-box';
  box.id = 'msgr-addmember-box';

  box.innerHTML =
    '<div class="msgr-modal-head"><span>Добавить участника</span><span class="msgr-modal-close" id="msgr-addmember-x">&times;</span></div>' +
    '<div class="msgr-modal-body">' +
      (candidates.length ? candidates.map(function (u) {
        return '<label class="msgr-user-row">' + avatarHtml(userLabel(u), u.id, 34) +
          '<span>' + esc(userLabel(u)) + '</span>' +
          '<input type="checkbox" data-uid="' + u.id + '"></label>';
      }).join('') : '<div class="msgr-empty">Все сотрудники уже в этом чате</div>') +
    '</div>' +
    '<div class="msgr-modal-foot"><button id="msgr-addmember-confirm" disabled>Добавить</button></div>';

  document.body.appendChild(mask);
  document.body.appendChild(box);
  setTimeout(function () { mask.classList.add('open'); box.classList.add('open'); }, 20);

  mask.addEventListener('click', closeAddMemberModal);
  box.querySelector('#msgr-addmember-x').addEventListener('click', closeAddMemberModal);

  const confirmBtn = box.querySelector('#msgr-addmember-confirm');
  const checkboxes = box.querySelectorAll('input[type=checkbox]');
  checkboxes.forEach(function (cb) {
    cb.addEventListener('change', function () {
      confirmBtn.disabled = Array.from(checkboxes).filter(function (c) { return c.checked; }).length === 0;
    });
  });

  confirmBtn.addEventListener('click', async function () {
    const checked = Array.from(checkboxes).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.getAttribute('data-uid')); });
    if (!checked.length) return;
    confirmBtn.disabled = true;
    try {
      for (const uid of checked) {
        await ctx.api.resource('chat_conversation_members').create({
          values: { conversation_id: convId, user_id: uid, joined_at: new Date().toISOString() }
        });
      }
      if (!conv.is_group) {
        await ctx.api.resource('chat_conversations').update({ filterByTk: convId, values: { is_group: true } });
      }
      closeAddMemberModal();
      await loadMyConversations();
      renderConvList(root, currentSearchValue(root));
      const win = document.getElementById('msgr-chat-window');
      if (win) {
        const updated = state.conversations.find(function (c) { return c.id === convId; });
        if (updated) {
          const titleEl = win.querySelector('.msgr-chat-title');
          const subEl = win.querySelector('#msgr-chat-sub');
          if (titleEl) titleEl.textContent = updated.title;
          if (subEl) subEl.textContent = updated.is_group ? (updated.members.length + ' участников') : '';
        }
        renderInfoPanel(win, convId, 'members');
      }
    } catch (e) {
      confirmBtn.disabled = false;
    }
  });
}

async function getOrCreateConversation(otherUserIds, groupName) {
  const meId = state.currentUser.id;
  const isGroup = otherUserIds.length > 1;

  if (!isGroup) {
    const existing = state.conversations.find(function (c) {
      return !c.is_group && c.others.length === 1 && c.others[0].user_id === otherUserIds[0];
    });
    if (existing) return existing.id;
  }

  const convRes = await ctx.api.resource('chat_conversations').create({
    values: {
      name: isGroup ? (groupName || 'Группа') : null,
      is_group: isGroup,
      created_by_id: meId,
      created_at: new Date().toISOString()
    }
  });
  const convId = (convRes.data && convRes.data.data && convRes.data.data.id) || (convRes.data && convRes.data.id);
  const memberIds = [meId].concat(otherUserIds);
  for (const uid of memberIds) {
    await ctx.api.resource('chat_conversation_members').create({
      values: { conversation_id: convId, user_id: uid, joined_at: new Date().toISOString() }
    });
  }
  return convId;
}

async function refreshLoop(root) {
  await loadMyConversations();
  renderConvList(root, currentSearchValue(root));
}

function fileSvg() {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>';
}
function downloadSvg() {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>';
}

function toggleInfoPanel(win, convId) {
  const isOpen = win.classList.contains('with-info');
  if (isOpen) {
    win.classList.remove('with-info');
    return;
  }
  win.classList.add('with-info');
  renderInfoPanel(win, convId, 'members');
}

async function renderInfoPanel(win, convId, tab) {
  const conv = state.conversations.find(function (c) { return c.id === convId; });
  if (!conv) return;
  const panel = win.querySelector('#msgr-info-panel');
  panel.innerHTML =
    '<div class="msgr-info-head"><b>Информация</b><span class="msgr-info-close" id="msgr-info-close">&times;</span></div>' +
    '<div class="msgr-info-tabs">' +
      '<div class="msgr-info-tab" data-tab="members">Участники</div>' +
      '<div class="msgr-info-tab" data-tab="media">Медиа</div>' +
    '</div>' +
    '<div class="msgr-info-body" id="msgr-info-body"></div>';
  panel.querySelector('#msgr-info-close').addEventListener('click', function (e) {
    e.stopPropagation();
    win.classList.remove('with-info');
  });
  panel.querySelectorAll('.msgr-info-tab').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      renderInfoPanel(win, convId, el.getAttribute('data-tab'));
    });
  });
  panel.querySelector('.msgr-info-tab[data-tab="' + tab + '"]').classList.add('active');

  const body = panel.querySelector('#msgr-info-body');
  if (tab === 'members') {
    body.innerHTML = '<div class="msgr-empty">Загрузка…</div>';
    const memberIds = conv.members.map(function (m) { return m.user_id; });
    const presence = await loadPresenceMap(memberIds);
    body.innerHTML = '<button class="msgr-add-member-btn" id="msgr-add-member-btn">+ Добавить участника</button>' +
      conv.members.map(function (m) {
      const iso = presence[m.user_id];
      const online = iso && (Date.now() - new Date(iso).getTime()) / 1000 < 40;
      const label = m.user_id === state.currentUser.id ? 'это вы' : presenceLabel(iso);
      return '<div class="msgr-member-row">' + avatarHtml(userLabel(m.user), m.user_id, 38) +
        '<div class="msgr-member-meta"><div class="msgr-member-name">' + esc(userLabel(m.user)) + '</div>' +
        '<div class="msgr-member-status"><span class="msgr-status-dot' + (online ? ' online' : '') + '"></span>' +
        '<span class="' + (online ? 'online-text' : 'offline-text') + '">' + esc(label) + '</span></div></div>' +
      '</div>';
    }).join('');
    body.querySelector('#msgr-add-member-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      openAddMemberModal(convId);
    });
  } else {
    body.innerHTML =
      '<div class="msgr-media-search"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '<input id="msgr-media-search-input" placeholder="Поиск по файлам"></div>' +
      '<div id="msgr-media-list"><div class="msgr-empty">Загрузка…</div></div>';
    const res = await ctx.api.resource('chat_messages').list({
      filter: { conversation_id: convId, attachment_id: { '$ne': null } }, appends: ['attachment'],
      sort: ['-created_at'], pageSize: 300
    });
    const withMedia = listPayload(res).filter(function (m) { return m.attachment; });
    function draw(filterText) {
      const listEl = body.querySelector('#msgr-media-list');
      let items = withMedia;
      if (filterText) {
        items = items.filter(function (m) {
          return ((m.attachment.title || '') + (m.attachment.extname || '')).toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
        });
      }
      if (!items.length) { listEl.innerHTML = '<div class="msgr-empty">Файлов не найдено</div>'; return; }
      const images = items.filter(function (m) { return isImageMime(m.attachment.mimetype); });
      const files = items.filter(function (m) { return !isImageMime(m.attachment.mimetype); });
      let html = '';
      if (images.length) {
        html += '<div class="msgr-media-grid">' + images.map(function (m) {
          return '<div class="msgr-media-thumb" data-att-url="' + esc(m.attachment.url) + '"></div>';
        }).join('') + '</div>';
      }
      if (files.length) {
        html += (images.length ? '<div style="height:10px"></div>' : '') + files.map(function (m) {
          return '<div class="msgr-file-row" data-att-url="' + esc(m.attachment.url) + '" data-att-name="' + esc((m.attachment.title || 'file') + (m.attachment.extname || '')) + '">' +
            '<div class="msgr-file-icon">' + fileSvg() + '</div>' +
            '<div class="msgr-file-meta"><div class="msgr-file-name">' + esc((m.attachment.title || 'file') + (m.attachment.extname || '')) + '</div>' +
            '<div class="msgr-file-size">' + formatBytes(m.attachment.size) + '</div></div>' +
            '<span class="msgr-file-dl">' + downloadSvg() + '</span>' +
          '</div>';
        }).join('');
      }
      listEl.innerHTML = html;
      listEl.querySelectorAll('.msgr-media-thumb[data-att-url]').forEach(async function (el) {
        const url = el.getAttribute('data-att-url');
        try {
          const blobUrl = await fetchBlobUrl(url);
          el.style.backgroundImage = 'url(' + blobUrl + ')';
        } catch (e) {}
      });
      listEl.querySelectorAll('.msgr-file-row, .msgr-media-thumb').forEach(function (el) {
        el.addEventListener('click', async function () {
          const url = el.getAttribute('data-att-url');
          const name = el.getAttribute('data-att-name') || 'file';
          try {
            const blobUrl = await fetchBlobUrl(url);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = name; a.target = '_blank';
            document.body.appendChild(a); a.click(); a.remove();
          } catch (e) {}
        });
      });
    }
    draw('');
    body.querySelector('#msgr-media-search-input').addEventListener('input', function (e) { draw(e.target.value); });
  }
}

// ---- init ----
injectStyle();

const shellHtml =
  '<div class="msgr-root">' +
    '<div class="msgr-head"><h3>Сообщения</h3><button class="msgr-new-btn" id="msgr-new-btn">+</button></div>' +
    '<div class="msgr-search-wrap"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input id="msgr-search-input" placeholder="Поиск"></div>' +
    '<div class="msgr-folders" id="msgr-folders"></div>' +
    '<div class="msgr-conv-list" id="msgr-conv-list"><div class="msgr-empty">Загрузка…</div></div>' +
  '</div>';

ctx.render(shellHtml);
const root = ctx.element;

root.querySelector('#msgr-new-btn').addEventListener('click', function () { openNewChatModal(root); });
root.querySelector('#msgr-search-input').addEventListener('input', function (e) {
  renderConvList(root, e.target.value);
});

try {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + authToken() } });
  const data = await res.json();
  state.currentUser = data && data.data;
} catch (e) {}
if (!state.currentUser) {
  root.querySelector('#msgr-conv-list').innerHTML = '<div class="msgr-empty">Не удалось определить пользователя</div>';
  return;
}

state.users = await loadUsers();
await loadFolders();
renderFolders(root);
await loadMyConversations();
renderConvList(root, '');

if (window.__msgrListTimer) clearInterval(window.__msgrListTimer);
window.__msgrListTimer = setInterval(function () { if (nbSessionAlive()) refreshLoop(root); }, 4000);

upsertPresence();
if (window.__msgrPresenceTimer) clearInterval(window.__msgrPresenceTimer);
window.__msgrPresenceTimer = setInterval(function () { if (nbSessionAlive()) upsertPresence(); }, 20000);

window.__msgrOpenConversation = function (convId) {
  const doOpen = function () {
    if (location.pathname.indexOf('msgspage01') === -1) {
      location.href = '/admin/msgspage01?openConv=' + convId;
      return;
    }
    openChatWindow(root, Number(convId));
  };
  doOpen();
};

const urlMatch = location.search.match(/[?&]openConv=([^&]+)/);
if (urlMatch) {
  const wantConvId = Number(urlMatch[1]);
  if (state.conversations.some(function (c) { return c.id === wantConvId; })) {
    openChatWindow(root, wantConvId);
  }
}

})();
