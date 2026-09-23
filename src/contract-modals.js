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
ctx.render('');

function esc(v) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatNum(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!isFinite(n)) return esc(v);
  try { return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }); } catch (e) { return String(n).replace('.', ','); }
}
function money(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return isFinite(n) ? formatNum(n) + ' ₽' : esc(v) + ' ₽';
}
function fmtSize(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
  return (n/1024/1024).toFixed(1) + ' MB';
}
function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
const AVATAR_COLORS = ['#1677ff', '#722ed1', '#13a8a8', '#d4380d', '#08979c', '#c41d7f', '#2f54eb', '#389e0d'];
function avatarColor(id) {
  const n = Number(id) || 0;
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

if (!document.getElementById('contract-modal-style')) {
  const style = document.createElement('style');
  style.id = 'contract-modal-style';
  style.textContent = `
    /* каждый блок карточки — отдельная «плашка» на сером фоне колонки данных */
    .cm-data-col { background: #f5f7fa; }
    .cm-section { margin-bottom: 14px !important; background: #fff; border: 1px solid #e8ebf0; border-radius: 10px; padding: 0 16px 14px; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04); }
    .cm-section:last-child { margin-bottom: 0 !important; }
    .cm-section-title { font-weight: 600; font-size: 14.5px; margin-bottom: 10px; color: #1a1a1a; }
    .cm-section > .cm-section-title, .cm-section > .cm-section-title-row { margin: 0 -16px 12px !important; padding: 11px 16px; background: #fafbfc; border-bottom: 1px solid #eef0f3; border-radius: 10px 10px 0 0; min-height: 22px; }
    .cm-section > .cm-section-title::before, .cm-section > .cm-section-title-row > .cm-section-title::before { content: ''; display: inline-block; width: 3px; height: 14px; background: #1677ff; border-radius: 2px; margin-right: 9px; vertical-align: -2px; }
    .cm-stage-form > .cm-section { box-shadow: none; }
    .cm-section > .cm-save-status:empty, .cm-stage-content > .cm-save-status:empty { min-height: 0; margin: 0; }
    /* этапы оформления: у свёрнутых и будущих этапов — только шапка, без пустой полосы под ней */
    .cm-section[data-stage-section] { padding-bottom: 0; }
    .cm-section[data-stage-section] > .cm-section-title-row { margin-bottom: 0 !important; border-bottom: none; border-radius: 9px; }
    .cm-section[data-stage-section] > .cm-stage-content { margin: 0 -16px; padding: 12px 16px 10px; border-top: 1px solid #eef0f3; }
    .cm-section[data-stage-section] > .cm-stage-content:not(:has(> .cm-grid, > .cm-stage-form:not([style*="none"]))) { display: none !important; }
    .cm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 4px 24px; }
    .cm-row { padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
    .cm-row.full { grid-column: 1 / -1; }
    .cm-label { color: #8c8c8c; font-size: 12px; margin-bottom: 2px; }
    .cm-value { color: #262626; font-size: 14px; }
    .cm-file-row { display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px solid #f0f0f0; }
    .cm-file-row:last-child { border-bottom: none; }
    #contract-modal-root .ant-modal-mask { opacity: 0; transition: opacity .22s cubic-bezier(0.36,0.66,0.04,1); }
    #contract-modal-root .ant-modal { transform: scale(0.82) translateY(-8px); opacity: 0; transition: transform .25s cubic-bezier(0.34,1.56,0.64,1), opacity .2s ease; }
    #contract-modal-root.cm-open .ant-modal-mask { opacity: 1; }
    #contract-modal-root.cm-open .ant-modal { transform: scale(1) translateY(0); opacity: 1; }

    .cm-body-flex { display: flex; align-items: stretch; min-height: 0; }
    .cm-chat-col { width: clamp(320px, 34vw, 560px); flex: 0 0 clamp(320px, 34vw, 560px); border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; min-height: 0; background: #fafafa; }
    .cm-chat-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 16px; color: #1a1a1a; border-bottom: 1px solid #f0f0f0; background: #fff; cursor: pointer; transition: background .12s; flex-shrink: 0; }
    .cm-chat-head:hover { background: #f5f8ff; }
    .cm-chat-title { font-weight: 700; font-size: 14px; }
    .cm-chat-head-hint { font-size: 11px; color: #9aa1ac; white-space: nowrap; }
    .cm-info-panel { width: 300px; flex: 0 0 300px; border-right: 1px solid #f0f0f0; display: none; flex-direction: column; background: #fbfcfe; min-height: 0; }
    .cm-info-panel.open { display: flex; }
    .cm-info-head { padding: 13px 16px; border-bottom: 1px solid #eef0f3; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .cm-info-head b { font-size: 14px; }
    .cm-info-close { cursor: pointer; color: #9aa1ac; font-size: 18px; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .cm-info-close:hover { background: #eef0f3; }
    .cm-info-tabs { display: flex; padding: 8px 12px 0; gap: 4px; flex-shrink: 0; }
    .cm-info-tab { flex: 1; text-align: center; padding: 8px 6px; font-size: 12.5px; font-weight: 600; color: #9aa1ac; cursor: pointer; border-bottom: 2px solid transparent; }
    .cm-info-tab.active { color: #2f88ff; border-bottom-color: #2f88ff; }
    .cm-info-body { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 10px 14px; }
    .cm-member-row { display: flex; align-items: center; gap: 10px; padding: 8px 6px; border-radius: 10px; }
    .cm-member-row:hover { background: #f2f5fa; }
    .cm-member-row-meta { flex: 1; min-width: 0; }
    .cm-member-row-name { font-size: 13px; font-weight: 600; color: #1a1d24; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cm-member-row-status { font-size: 11.5px; display: flex; align-items: center; gap: 5px; margin-top: 1px; }
    .cm-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #c5cad3; flex-shrink: 0; }
    .cm-status-dot.online { background: #3ba55c; box-shadow: 0 0 0 2px rgba(59,165,92,.18); }
    .cm-status-online-text { color: #3ba55c; }
    .cm-status-offline-text { color: #9aa1ac; }
    .cm-media-search { margin: 2px 4px 10px; position: relative; }
    .cm-media-search svg { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #b7bcc7; }
    .cm-media-search input { width: 100%; box-sizing: border-box; padding: 7px 10px 7px 28px; border-radius: 16px; border: 1px solid #e9ebf0; background: #fff; font-size: 12.5px; outline: none; }
    .cm-media-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; padding: 0 4px; }
    .cm-media-thumb { width: 100%; aspect-ratio: 1; border-radius: 8px; background: #eef0f3 center/cover no-repeat; cursor: pointer; }
    .cm-info-file-row { display: flex; align-items: center; gap: 10px; padding: 8px 6px; border-radius: 10px; cursor: pointer; }
    .cm-info-file-row:hover { background: #f2f5fa; }
    .cm-info-file-icon { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg,#2f88ff,#5cb8ff); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cm-info-file-meta { flex: 1; min-width: 0; }
    .cm-info-file-name { font-size: 12.5px; font-weight: 600; color: #1a1d24; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cm-info-file-size { font-size: 11px; color: #9aa1ac; }
    .cm-chat-messages { flex: 1; overflow-y: auto; padding: 12px 16px; min-height: 200px; }
    .cm-chat-msg-row { display: flex; margin-bottom: 6px; animation: cmFadeIn .15s ease; }
    .cm-chat-msg-row.own { justify-content: flex-end; }
    @keyframes cmFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .cm-bubble-wrap { display: flex; gap: 6px; max-width: 88%; align-items: flex-end; }
    .cm-chat-msg-row.own .cm-bubble-wrap { flex-direction: row-reverse; }
    .cm-chat-msg-avatar { width: 24px; height: 24px; border-radius: 50%; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cm-bubble { padding: 7px 10px; border-radius: 13px; font-size: 12.5px; line-height: 1.42; word-wrap: break-word; white-space: pre-wrap; position: relative; box-shadow: 0 1px 2px rgba(20,30,60,.06); }
    .cm-chat-msg-row.own .cm-bubble { background: linear-gradient(135deg,#2f88ff,#5cb8ff); color: #fff; border-bottom-right-radius: 4px; }
    .cm-chat-msg-row:not(.own) .cm-bubble { background: #fff; color: #1a1d24; border: 1px solid #eceff1; border-bottom-left-radius: 4px; }
    .cm-bubble-author { font-size: 10px; font-weight: 700; color: #2f88ff; display: block; margin-bottom: 2px; }
    .cm-chat-msg-row.own .cm-bubble-author { color: rgba(255,255,255,.85); }
    .cm-bubble-time { font-size: 9px; opacity: .65; margin-left: 8px; float: right; margin-top: 4px; }
    .cm-att-image { max-width: 170px; max-height: 170px; border-radius: 9px; display: block; cursor: pointer; background: #eef0f3; }
    .cm-att-file { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 9px; background: rgba(255,255,255,.18); min-width: 140px; cursor: pointer; }
    .cm-chat-msg-row:not(.own) .cm-att-file { background: #f7f8fb; }
    .cm-att-file-icon { width: 26px; height: 26px; border-radius: 7px; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cm-chat-msg-row.own .cm-att-file-icon { background: rgba(255,255,255,.3); color: #fff; }
    .cm-chat-msg-row:not(.own) .cm-att-file-icon { background: linear-gradient(135deg,#2f88ff,#5cb8ff); color: #fff; }
    .cm-att-file-name { font-size: 10.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
    .cm-att-file-size { font-size: 9px; opacity: .75; }
    .cm-chat-empty { color: #b0b0b0; font-size: 13px; text-align: center; padding: 24px 8px; }
    .cm-chat-input-wrap { border-top: 1px solid #f0f0f0; padding: 10px 12px; display: flex; gap: 8px; align-items: flex-end; background: #fff; }
    .cm-attach-btn { width: 32px; height: 32px; border-radius: 50%; background: #f7f8fb; border: 1px solid #e6e9ee; color: #8a90a0; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background .12s; }
    .cm-attach-btn:hover { background: #eef2f8; color: #2f88ff; }
    .cm-chat-textarea { flex: 1; resize: none; border: 1px solid #d9d9d9; border-radius: 16px; padding: 7px 12px; font-size: 13px; font-family: inherit; min-height: 34px; max-height: 90px; background: #f7f8fb; }
    .cm-chat-textarea:focus { outline: none; border-color: #4096ff; background: #fff; }
    .cm-chat-send { border: none; background: linear-gradient(135deg,#2f88ff,#5cb8ff); color: #fff; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
    .cm-chat-send:disabled { background: #bfbfbf; cursor: default; }
    .cm-chat-readonly { padding: 14px 16px; font-size: 12.5px; color: #b0851f; background: #fffbe6; border-top: 1px solid #ffe58f; text-align: center; }

    .cm-data-col { flex: 1; padding: 20px 24px; overflow-y: auto; min-width: 0; }

    .cm-members-footer { border-top: 1px solid #f0f0f0; padding: 14px 24px; flex-shrink: 0; }
    .cm-members-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; position: relative; }
    .cm-members-title { font-weight: 700; font-size: 14px; color: #1a1a1a; }
    .cm-members-add-btn { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #1677ff; background: #fff; color: #1677ff; font-size: 16px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }
    .cm-members-add-btn:hover { background: #1677ff; color: #fff; }
    .cm-members-add-btn:disabled { border-color: #e0e0e0; color: #ccc; cursor: default; background: #fff; }
    .cm-members-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .cm-member-chip { display: inline-flex; align-items: center; gap: 6px; background: #f5f5f5; border-radius: 16px; padding: 4px 8px 4px 4px; font-size: 13px; color: #262626; }
    .cm-member-avatar { width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cm-member-remove { border: none; background: transparent; cursor: pointer; color: #999; font-size: 12px; padding: 0 2px; line-height: 1; margin-left: 2px; }
    .cm-member-remove:hover { color: #c0392b; }
    .cm-members-empty { color: #b0b0b0; font-size: 13px; }

    .cm-add-popover { position: absolute; bottom: calc(100% + 8px); top: auto; right: 0; width: 250px; max-height: min(320px, 60vh); display: flex; flex-direction: column; background: #fff; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.14); border: 1px solid #f0f0f0; z-index: 10; overflow: hidden; opacity: 0; transform: translateY(6px); pointer-events: none; transition: opacity .15s ease, transform .15s ease; }
    .cm-add-popover.open { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .cm-add-popover-title { font-size: 12px; color: #8c8c8c; padding: 10px 12px 6px; flex-shrink: 0; }
    .cm-add-popover-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px; }
    .cm-add-popover-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #262626; }
    .cm-add-popover-item:hover { background: #f0f6ff; }
    .cm-add-popover-empty { padding: 16px 12px; text-align: center; color: #b0b0b0; font-size: 13px; }

    .cm-modal-toolbar { position: absolute; top: 12px; right: 14px; display: flex; align-items: center; gap: 8px; z-index: 2; }

    @media (max-width: 900px) {
      .cm-body-flex { flex-direction: column; }
      .cm-chat-col { width: 100%; flex-basis: auto; border-right: none; border-bottom: 1px solid #f0f0f0; max-height: 300px; }
      .cm-info-panel { width: 100%; flex-basis: auto; border-right: none; border-bottom: 1px solid #f0f0f0; max-height: 300px; }
    }

    @media (max-width: 560px) {
      #contract-modal-root .ant-modal-wrap, #forming-modal-root .ant-modal-wrap { padding: 10px 6px !important; }
      #contract-modal-root .cm-modal-toolbar, #forming-modal-root .cm-modal-toolbar { position: static !important; justify-content: flex-end; padding: 8px 12px 0; flex-wrap: wrap; }
      #contract-modal-root .ant-modal-header, #forming-modal-root .ant-modal-header { padding: 10px 16px !important; }
      #contract-modal-root .cm-data-col, #forming-modal-root .cm-data-col { padding: 14px 14px !important; }
      #contract-modal-root .cm-members-footer, #forming-modal-root .cm-members-footer { padding: 12px 14px !important; }
    }

    .cm-stage-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
    .cm-stage-pill { font-size: 11.5px; padding: 4px 10px; border-radius: 12px; background: #f5f5f5; color: #999; white-space: nowrap; }
    .cm-stage-pill.done { background: #e6f7e6; color: #389e0d; }
    .cm-stage-pill.active { background: #1677ff; color: #fff; font-weight: 600; }
    .cm-stage-done-badge { font-size: 11px; font-weight: 400; color: #389e0d; background: #e6f7e6; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
    .cm-field-row { margin-bottom: 12px; }
    .cm-field-row .cm-label { margin-bottom: 4px; }
    .cm-field-input { width: 100%; border: 1px solid #d9d9d9; border-radius: 6px; padding: 6px 8px; font-size: 13.5px; font-family: inherit; box-sizing: border-box; }
    .cm-field-input:focus { outline: none; border-color: #4096ff; }
    .cm-field-checkbox { display: flex; align-items: center; gap: 8px; font-size: 13.5px; margin-bottom: 10px; cursor: pointer; }
    .cm-stage-actions { display: flex; gap: 10px; margin-top: 16px; align-items: center; flex-wrap: wrap; }
    .cm-btn-save { border: 1px solid #d9d9d9; background: #fff; color: #262626; border-radius: 6px; padding: 7px 16px; font-size: 13px; cursor: pointer; }
    .cm-btn-save:disabled { color: #ccc; cursor: default; }
    .cm-btn-advance { border: none; background: #52c41a; color: #fff; border-radius: 6px; padding: 7px 16px; font-size: 13px; cursor: pointer; font-weight: 600; }
    .cm-btn-advance:disabled { background: #d9d9d9; cursor: not-allowed; }
    .cm-btn-finalize { background: #1677ff; }
    .cm-role-hint { font-size: 12px; color: #999; }
    .cm-upload-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .cm-upload-btn { border: 1px dashed #d9d9d9; background: #fafafa; color: #595959; border-radius: 6px; padding: 6px 14px; font-size: 12.5px; cursor: pointer; }
    .cm-upload-btn:disabled { color: #ccc; cursor: default; }
    .cm-combo-list { position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; background: #fff; border: 1px solid #d9d9d9; border-radius: 6px; max-height: 220px; overflow-y: auto; box-shadow: 0 6px 18px rgba(0,0,0,0.14); z-index: 20; }
    .cm-combo-item { padding: 7px 12px; cursor: pointer; font-size: 13.5px; color: #262626; }
    .cm-combo-item:hover { background: #f0f6ff; }
    .cm-section-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .cm-stage-collapse-btn { border: none; background: transparent; cursor: pointer; font-size: 12px; color: #8c8c8c; padding: 2px 4px; flex-shrink: 0; }
    .cm-stage-collapse-btn:hover { color: #1677ff; }
    .cm-stage-edit-toggle { border: 1px solid #d9d9d9; background: #fff; color: #595959; border-radius: 6px; padding: 3px 10px; font-size: 12px; cursor: pointer; flex-shrink: 0; }
    .cm-stage-edit-toggle:hover { border-color: #1677ff; color: #1677ff; }
    .cm-save-status { font-size: 11.5px; color: #b0b0b0; margin-top: 6px; min-height: 15px; }
    .cm-stage-edit-actions { display: flex; gap: 8px; margin-top: 10px; }
    .cm-file-delete { color: #999; text-decoration: none; margin-left: 4px; }
    .cm-file-delete:hover { color: #c0392b; }
  `;
  document.head.appendChild(style);
}

function closeContractModal() {
  const root = document.getElementById('contract-modal-root');
  if (!root) return;
  root.classList.remove('cm-open');
  setTimeout(function() { if (root && root.parentNode) root.remove(); }, 220);
  document.removeEventListener('keydown', onModalEscape);
}
function onModalEscape(e) {
  if (e.key === 'Escape') closeContractModal();
}

function row(label, value, full) {
  return '<div class="cm-row' + (full ? ' full' : '') + '"><div class="cm-label">' + label + '</div><div class="cm-value">' + value + '</div></div>';
}

function renderFilesList(files, currentUser) {
  if (!files.length) return '<span style="color:#999;">Файлы не загружены</span>';
  return files.map(function(f) {
    const name = esc(f.title ? (f.title + (f.extname || '')) : f.filename);
    const canDelete = !!(currentUser && (currentUser.__isAdmin || currentUser.id === f.createdById));
    return '<div class="cm-file-row" data-file-id="' + f.id + '"><span style="flex:1;">' + name + '</span>'
      + '<span style="color:#999;font-size:12px;">' + fmtSize(f.size) + '</span>'
      + '<a href="#" class="cm-file-open" data-url="' + esc(f.url) + '">Открыть</a>'
      + '<a href="' + esc(f.url) + '" download="' + name + '">Скачать</a>'
      + (canDelete ? '<a href="#" class="cm-file-delete" data-file-id="' + f.id + '" title="Удалить файл">✕</a>' : '')
      + '</div>';
  }).join('');
}

function bindFileOpenLinks(root) {
  root.querySelectorAll('.cm-file-open').forEach(function(a) {
    if (a.__cmBound) return;
    a.__cmBound = true;
    a.addEventListener('click', async function(e) {
      e.preventDefault();
      const url = a.getAttribute('data-url');
      const original = a.textContent;
      a.textContent = 'Открытие…';
      try {
        const res2 = await fetch(url, { credentials: 'include' });
        const blob = await res2.blob();
        window.open(URL.createObjectURL(blob), '_blank');
      } catch (err) {
        window.open(url, '_blank');
      } finally {
        a.textContent = original;
      }
    });
  });
}

function bindFileDeleteLinks(root, contractId, collectionName, onDone) {
  root.querySelectorAll('.cm-file-delete').forEach(function(a) {
    if (a.__cmBound) return;
    a.__cmBound = true;
    a.addEventListener('click', async function(e) {
      e.preventDefault();
      if (!(await cmConfirm('Удалить этот файл?'))) return;
      const fileId = Number(a.getAttribute('data-file-id'));
      const fileRow = a.closest('.cm-file-row');
      const fileName = fileRow && fileRow.firstElementChild ? fileRow.firstElementChild.textContent : '';
      try {
        await fetch('/api/' + collectionName + '/' + contractId + '/contract_files:remove', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify([fileId])
        });
        try {
          await fetch('/api/attachments:destroy?filterByTk=' + fileId, { method: 'POST', headers: { Authorization: 'Bearer ' + authToken() } });
        } catch (e2) { /* best-effort, ownership scope may block this — detach still succeeded */ }
        logHistory(HIST_TYPE_BY_COLL[collectionName] || 'active', contractId, [{ action: 'file', text: 'Удалён файл: ' + fileName }]);
        if (onDone) await onDone();
      } catch (e2) {
        cmToast('Не удалось удалить файл');
      }
    });
  });
}

function authToken() {
  try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; }
}

function escAttr(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cmToast(msg) {
  let el = document.getElementById('cm-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cm-toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#262626;color:#fff;padding:10px 20px;border-radius:6px;font-size:13px;z-index:3000;box-shadow:0 4px 16px rgba(0,0,0,0.25);max-width:80vw;text-align:center;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el.__cmToastTimer);
  el.__cmToastTimer = setTimeout(function() { el.style.display = 'none'; }, 3500);
}

function cmConfirm(msg) {
  return new Promise(function(resolve) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3001;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#fff;border-radius:8px;padding:22px;max-width:380px;box-shadow:0 8px 28px rgba(0,0,0,0.22);">'
      + '<div style="font-size:14px;color:#262626;margin-bottom:20px;line-height:1.5;">' + esc(msg) + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
      + '<button id="cm-confirm-no" style="border:1px solid #d9d9d9;background:#fff;color:#262626;border-radius:6px;padding:6px 16px;font-size:13px;cursor:pointer;">Отмена</button>'
      + '<button id="cm-confirm-yes" style="border:none;background:#1677ff;color:#fff;border-radius:6px;padding:6px 16px;font-size:13px;cursor:pointer;">Да</button>'
      + '</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#cm-confirm-yes').addEventListener('click', function() { overlay.remove(); resolve(true); });
    overlay.querySelector('#cm-confirm-no').addEventListener('click', function() { overlay.remove(); resolve(false); });
  });
}

async function createNotification(userId, contractId, title, text, source, channel) {
  try {
    await ctx.api.resource('contract_notifications').create({
      values: {
        user_id: userId,
        contract_id: contractId,
        title: title,
        text: text,
        is_read: false,
        source: source || 'active',
        channel: channel || 'status',
        created_at: new Date().toISOString()
      }
    });
  } catch (e) { /* best-effort, notification failure must not block the main action */ }
}

// Открытие карточки договора = прочитано: гасим подсветку и соответствующие уведомления в колокольчике,
// не дожидаясь, пока пользователь сам откроет и прочитает их там.
async function markContractNotificationsRead(source, id) {
  try {
    const r = await fetch('/api/myInAppMessages:list?filter[status]=unread&pageSize=200', {
      headers: { Authorization: 'Bearer ' + authToken() }
    });
    const j = await r.json();
    const list = (j && j.data && j.data.messages) ? j.data.messages : [];
    const re = new RegExp('[?&]open=' + source + ':' + id + '(?:&|$)');
    const mine = list.filter(function(m) { return re.test((m.options && m.options.url) || ''); });
    for (const m of mine) {
      await fetch('/api/notificationInAppMessages:updateMyOwn?filterByTk=' + encodeURIComponent(m.id), {
        method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });
    }
    if (mine.length && window.__cmRefreshNotifRows) window.__cmRefreshNotifRows();
  } catch (e) { /* best-effort: подсветка сама снимется, когда прочитают в колокольчике */ }
}

let __cmCurrentUser = null;
async function getCurrentUser() {
  if (__cmCurrentUser) return __cmCurrentUser;
  try {
    const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + authToken() } });
    const data = await res.json();
    const u = (data && data.data) ? data.data : null;
    if (u) {
      const roleNames = (u.roles || []).map(function(r) { return r.name; });
      u.__isAdmin = roleNames.indexOf('admin') !== -1 || roleNames.indexOf('root') !== -1;
    }
    __cmCurrentUser = u;
  } catch (e) { __cmCurrentUser = null; }
  return __cmCurrentUser;
}

async function loadChatMessages(contractId, source) {
  const res = await ctx.api.resource('contract_chat_messages').list({
    filter: { owner_contract_id: contractId, source: source || 'active' },
    appends: ['author', 'attachment'],
    sort: ['created_at'],
    pageSize: 200
  });
  const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  return Array.isArray(payload) ? payload : [];
}

function renderChatMessages(container, list, currentUser) {
  if (!list.length) {
    container.innerHTML = '<div class="cm-chat-empty">Пока нет сообщений.<br>Начните переписку по договору.</div>';
    return;
  }
  const meId = currentUser && currentUser.id;
  container.innerHTML = list.map(function(m) {
    const authorName = (m.author && (m.author.nickname || m.author.username)) || 'Пользователь';
    const own = m.author_id === meId;
    const att = m.attachment;
    let attHtml = '';
    if (att) {
      if (isImageMime(att.mimetype)) {
        attHtml = '<img class="cm-att-image" data-att-url="' + esc(att.url) + '" style="min-height:60px;min-width:90px">';
      } else {
        attHtml = '<div class="cm-att-file" data-att-url="' + esc(att.url) + '" data-att-name="' + esc((att.title || 'file') + (att.extname || '')) + '">'
          + '<div class="cm-att-file-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>'
          + '<div><div class="cm-att-file-name">' + esc((att.title || 'file') + (att.extname || '')) + '</div>'
          + '<div class="cm-att-file-size">' + formatBytes(att.size) + '</div></div>'
        + '</div>';
      }
    }
    return '<div class="cm-chat-msg-row' + (own ? ' own' : '') + '">'
      + '<div class="cm-bubble-wrap">'
      + '<div class="cm-chat-msg-avatar" style="background:' + avatarColor(m.author_id) + '">' + esc(initials(authorName)) + '</div>'
      + '<div class="cm-bubble">'
      + (!own ? '<span class="cm-bubble-author">' + esc(authorName) + '</span>' : '')
      + attHtml
      + (m.message ? '<div' + (att ? ' style="margin-top:4px"' : '') + '>' + linkifyText(m.message) + '</div>' : '')
      + '<span class="cm-bubble-time">' + esc(fmtDateTime(m.created_at)) + '</span>'
      + '</div></div></div>';
  }).join('');
  cmHydrateChatImages(container);
  cmWireChatFileOpen(container);
  container.scrollTop = container.scrollHeight;
}

async function loadContractPresenceMap(userIds) {
  if (!userIds || !userIds.length) return {};
  try {
    const res = await ctx.api.resource('chat_presence').list({ filter: { user_id: { '$in': userIds } }, pageSize: 500 });
    const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
    const map = {};
    (Array.isArray(payload) ? payload : []).forEach(function(r) { map[r.user_id] = r.last_seen_at; });
    return map;
  } catch (e) { return {}; }
}
function presenceLabelCM(iso) {
  if (!iso) return 'нет данных';
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 40) return 'в сети';
  return 'был(а) в сети ' + fmtDateTime(iso);
}

function toggleChatInfoPanel(root, contractId, source, members, currentUser) {
  const panel = root.querySelector('#cm-info-panel');
  if (!panel) return;
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    return;
  }
  panel.classList.add('open');
  renderChatInfoPanel(root, contractId, source, members, currentUser, 'members');
}

async function renderChatInfoPanel(root, contractId, source, members, currentUser, tab) {
  const panel = root.querySelector('#cm-info-panel');
  if (!panel) return;
  panel.innerHTML = '<div class="cm-info-head"><b>Информация по договору</b><span class="cm-info-close" id="cm-info-close">&times;</span></div>'
    + '<div class="cm-info-tabs">'
    + '<div class="cm-info-tab" data-cm-info-tab="members">Участники</div>'
    + '<div class="cm-info-tab" data-cm-info-tab="media">Медиа</div>'
    + '</div>'
    + '<div class="cm-info-body" id="cm-info-body"></div>';
  panel.querySelector('#cm-info-close').addEventListener('click', function(e) {
    e.stopPropagation();
    panel.classList.remove('open');
  });
  panel.querySelectorAll('[data-cm-info-tab]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      renderChatInfoPanel(root, contractId, source, members, currentUser, el.getAttribute('data-cm-info-tab'));
    });
  });
  const activeTabEl = panel.querySelector('[data-cm-info-tab="' + tab + '"]');
  if (activeTabEl) activeTabEl.classList.add('active');

  const body = panel.querySelector('#cm-info-body');
  if (tab === 'media') {
    body.innerHTML = '<div class="cm-media-search"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'
      + '<input id="cm-media-search-input" placeholder="Поиск по файлам"></div>'
      + '<div id="cm-media-list"><div class="cm-chat-empty">Загрузка…</div></div>';
    let withMedia = [];
    try {
      const res = await ctx.api.resource('contract_chat_messages').list({
        filter: { owner_contract_id: contractId, source: source || 'active', attachment_id: { '$ne': null } },
        appends: ['attachment'], sort: ['-created_at'], pageSize: 300
      });
      const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
      withMedia = (Array.isArray(payload) ? payload : []).filter(function(m) { return m.attachment; });
    } catch (e) {}

    function draw(filterText) {
      const listEl = body.querySelector('#cm-media-list');
      if (!listEl) return;
      let items = withMedia;
      if (filterText) {
        items = items.filter(function(m) {
          return ((m.attachment.title || '') + (m.attachment.extname || '')).toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
        });
      }
      if (!items.length) { listEl.innerHTML = '<div class="cm-chat-empty">Файлов не найдено</div>'; return; }
      const images = items.filter(function(m) { return isImageMime(m.attachment.mimetype); });
      const files = items.filter(function(m) { return !isImageMime(m.attachment.mimetype); });
      let html = '';
      if (images.length) {
        html += '<div class="cm-media-grid">' + images.map(function(m) {
          return '<div class="cm-media-thumb" data-att-url="' + esc(m.attachment.url) + '"></div>';
        }).join('') + '</div>';
      }
      if (files.length) {
        html += (images.length ? '<div style="height:10px"></div>' : '') + files.map(function(m) {
          return '<div class="cm-info-file-row" data-att-url="' + esc(m.attachment.url) + '" data-att-name="' + esc((m.attachment.title || 'file') + (m.attachment.extname || '')) + '">'
            + '<div class="cm-info-file-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>'
            + '<div class="cm-info-file-meta"><div class="cm-info-file-name">' + esc((m.attachment.title || 'file') + (m.attachment.extname || '')) + '</div>'
            + '<div class="cm-info-file-size">' + formatBytes(m.attachment.size) + '</div></div>'
          + '</div>';
        }).join('');
      }
      listEl.innerHTML = html;
      listEl.querySelectorAll('.cm-media-thumb[data-att-url]').forEach(async function(el) {
        const url = el.getAttribute('data-att-url');
        try { el.style.backgroundImage = 'url(' + (await cmFetchBlobUrl(url)) + ')'; } catch (e) {}
      });
      listEl.querySelectorAll('.cm-info-file-row, .cm-media-thumb').forEach(function(el) {
        el.addEventListener('click', async function() {
          const url = el.getAttribute('data-att-url');
          const name = el.getAttribute('data-att-name') || 'file';
          try {
            const blobUrl = await cmFetchBlobUrl(url);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = name; a.target = '_blank';
            document.body.appendChild(a); a.click(); a.remove();
          } catch (e) {}
        });
      });
    }
    draw('');
    const searchInput = body.querySelector('#cm-media-search-input');
    if (searchInput) searchInput.addEventListener('input', function(e) { draw(e.target.value); });
  } else {
    body.innerHTML = '<div class="cm-chat-empty">Загрузка…</div>';
    const list = members || [];
    const memberIds = list.map(function(m) { return m.id; });
    const presence = await loadContractPresenceMap(memberIds);
    body.innerHTML = list.length ? list.map(function(m) {
      const name = m.nickname || m.username || ('#' + m.id);
      const iso = presence[m.id];
      const online = iso && (Date.now() - new Date(iso).getTime()) / 1000 < 40;
      const label = (currentUser && m.id === currentUser.id) ? 'это вы' : presenceLabelCM(iso);
      return '<div class="cm-member-row"><div class="cm-chat-msg-avatar" style="width:38px;height:38px;font-size:13px;background:' + avatarColor(m.id) + '">' + esc(initials(name)) + '</div>'
        + '<div class="cm-member-row-meta"><div class="cm-member-row-name">' + esc(name) + '</div>'
        + '<div class="cm-member-row-status"><span class="cm-status-dot' + (online ? ' online' : '') + '"></span>'
        + '<span class="' + (online ? 'cm-status-online-text' : 'cm-status-offline-text') + '">' + esc(label) + '</span></div></div>'
      + '</div>';
    }).join('') : '<div class="cm-chat-empty">Сотрудники ещё не назначены</div>';
  }
}

async function initChat(contractId, root, currentUser, isMember, contractNumber, state, source) {
  source = source || 'active';
  const chatCol = root.querySelector('#cm-chat-col');
  const messagesEl = root.querySelector('#cm-chat-messages');
  const canWrite = !!(currentUser && (currentUser.__isAdmin || isMember));

  const chatHead = root.querySelector('#cm-chat-head');
  if (chatHead) {
    chatHead.addEventListener('click', function() {
      toggleChatInfoPanel(root, contractId, source, state.members || [], currentUser);
    });
  }

  const inputWrap = root.querySelector('#cm-chat-input-area');
  if (canWrite) {
    inputWrap.innerHTML = '<div class="cm-chat-input-wrap">'
      + '<input type="file" id="cm-chat-file-input" style="display:none;">'
      + '<button id="cm-chat-attach" class="cm-attach-btn" title="Прикрепить файл"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.19 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg></button>'
      + '<textarea id="cm-chat-textarea" class="cm-chat-textarea" placeholder="Написать сообщение…" rows="1"></textarea>'
      + '<button id="cm-chat-send" class="cm-chat-send" title="Отправить"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 21.5L23 12 2.5 2.5 2.5 10 17 12 2.5 14z"/></svg></button>'
      + '</div>';
  } else {
    inputWrap.innerHTML = '<div class="cm-chat-readonly">Писать могут только сотрудники, добавленные к этому договору</div>';
  }

  async function refresh() {
    try {
      const list = await loadChatMessages(contractId, source);
      if (!chatCol.isConnected) return;
      renderChatMessages(messagesEl, list, currentUser);
    } catch (e) {
      messagesEl.innerHTML = '<div class="cm-chat-empty">Ошибка загрузки чата</div>';
    }
  }

  function notifyOthers(preview) {
    const authorName = currentUser.nickname || currentUser.username || 'Пользователь';
    (state.members || []).forEach(function(m) {
      if (m.id === currentUser.id) return;
      createNotification(m.id, contractId, 'Договор ' + contractNumber, 'Новое сообщение от ' + authorName + ': ' + preview, source, 'contract_chat');
    });
  }

  if (canWrite) {
    const textarea = root.querySelector('#cm-chat-textarea');
    const sendBtn = root.querySelector('#cm-chat-send');
    const attachBtn = root.querySelector('#cm-chat-attach');
    const fileInput = root.querySelector('#cm-chat-file-input');

    async function send() {
      const text = textarea.value.trim();
      if (!text) return;
      sendBtn.disabled = true;
      try {
        await ctx.api.resource('contract_chat_messages').create({
          values: {
            message: text,
            owner_contract_id: contractId,
            author_id: currentUser.id,
            source: source,
            created_at: new Date().toISOString()
          }
        });
        textarea.value = '';
        textarea.style.height = '34px';
        await refresh();
        notifyOthers(text.length > 80 ? text.slice(0, 80) + '…' : text);
      } catch (e) {
        cmToast('Не удалось отправить сообщение');
      } finally {
        sendBtn.disabled = false;
      }
    }

    async function sendFile(file) {
      attachBtn.disabled = true; sendBtn.disabled = true;
      try {
        const attId = await uploadFileGetId(file);
        const caption = textarea.value.trim();
        await ctx.api.resource('contract_chat_messages').create({
          values: {
            message: caption,
            attachment_id: attId,
            owner_contract_id: contractId,
            author_id: currentUser.id,
            source: source,
            created_at: new Date().toISOString()
          }
        });
        textarea.value = ''; textarea.style.height = '34px';
        await refresh();
        notifyOthers(caption || ('📎 ' + file.name));
      } catch (e) {
        cmToast('Не удалось отправить файл');
      } finally {
        attachBtn.disabled = false; sendBtn.disabled = false;
      }
    }

    sendBtn.addEventListener('click', send);
    attachBtn.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function() {
      if (fileInput.files && fileInput.files[0]) {
        sendFile(fileInput.files[0]);
        fileInput.value = '';
      }
    });
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    textarea.addEventListener('input', function() {
      textarea.style.height = '34px';
      textarea.style.height = Math.min(textarea.scrollHeight, 90) + 'px';
    });
  }

  await refresh();
}

async function loadAllUsers() {
  const res = await ctx.api.resource('users').list({ fields: ['id', 'nickname', 'username'], pageSize: 100 });
  const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  return Array.isArray(payload) ? payload : [];
}

function closeAddPopover(root) {
  const pop = root.querySelector('#cm-add-popover');
  if (pop) pop.classList.remove('open');
}

function renderMembers(root, contractId, members, allUsers, isAdmin, contractNumber, state, collectionName, notifSource) {
  collectionName = collectionName || 'rental_contracts';
  notifSource = notifSource || 'active';
  const listEl = root.querySelector('#cm-members-list');
  const addBtn = root.querySelector('#cm-members-add-btn');
  const popoverList = root.querySelector('#cm-add-popover-list');

  if (!members.length) {
    listEl.innerHTML = '<div class="cm-members-empty">Ответственные сотрудники ещё не назначены</div>';
  } else {
    listEl.innerHTML = members.map(function(u) {
      const name = u.nickname || u.username || ('#' + u.id);
      return '<span class="cm-member-chip" data-user-id="' + u.id + '">'
        + '<span class="cm-member-avatar" style="background:' + avatarColor(u.id) + '">' + esc(initials(name)) + '</span>'
        + esc(name)
        + (isAdmin ? '<button class="cm-member-remove" data-remove-id="' + u.id + '" title="Убрать из договора">✕</button>' : '')
        + '</span>';
    }).join('');
  }

  if (!isAdmin) {
    addBtn.style.display = 'none';
    return;
  }
  addBtn.style.display = '';

  const memberIds = members.map(function(m) { return m.id; });
  const available = allUsers.filter(function(u) { return memberIds.indexOf(u.id) === -1; });
  addBtn.disabled = false;

  if (!available.length) {
    popoverList.innerHTML = '<div class="cm-add-popover-empty">Все сотрудники уже добавлены</div>';
  } else {
    popoverList.innerHTML = available.map(function(u) {
      const name = u.nickname || u.username || ('#' + u.id);
      return '<div class="cm-add-popover-item" data-add-id="' + u.id + '">'
        + '<span class="cm-member-avatar" style="background:' + avatarColor(u.id) + '">' + esc(initials(name)) + '</span>'
        + esc(name) + '</div>';
    }).join('');
  }

  listEl.querySelectorAll('.cm-member-remove').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const uid = btn.getAttribute('data-remove-id');
      btn.disabled = true;
      try {
        await fetch('/api/' + collectionName + '/' + contractId + '/contract_members:remove', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify([Number(uid)])
        });
        logHistory(HIST_TYPE_BY_COLL[collectionName] || 'active', contractId, [{ action: 'member', text: 'Сотрудник убран из договора: ' + userNameById(allUsers, uid) }]);
        await refreshMembers(root, contractId, allUsers, isAdmin, contractNumber, state, collectionName, notifSource);
      } catch (e2) {
        cmToast('Не удалось убрать сотрудника');
        btn.disabled = false;
      }
    });
  });

  popoverList.querySelectorAll('.cm-add-popover-item').forEach(function(item) {
    item.addEventListener('click', async function() {
      const uid = item.getAttribute('data-add-id');
      try {
        await fetch('/api/' + collectionName + '/' + contractId + '/contract_members:add', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify([Number(uid)])
        });
        createNotification(Number(uid), contractId, 'Договор ' + contractNumber, 'Вас добавили к договору ' + contractNumber, notifSource, 'assigned');
        logHistory(HIST_TYPE_BY_COLL[collectionName] || 'active', contractId, [{ action: 'member', text: 'Сотрудник добавлен к договору: ' + userNameById(allUsers, uid) }]);
        await refreshMembers(root, contractId, allUsers, isAdmin, contractNumber, state, collectionName, notifSource);
        closeAddPopover(root);      // список не должен оставаться открытым поверх карточки
      } catch (e2) {
        cmToast('Не удалось добавить сотрудника');
      }
    });
  });
}

async function refreshMembers(root, contractId, allUsers, isAdmin, contractNumber, state, collectionName, notifSource) {
  collectionName = collectionName || 'rental_contracts';
  const res = await ctx.api.resource(collectionName).get({ filterByTk: contractId, appends: ['contract_members'] });
  const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  if (state) state.members = r.contract_members || [];
  renderMembers(root, contractId, r.contract_members || [], allUsers, isAdmin, contractNumber, state, collectionName, notifSource);
  return r.contract_members || [];
}

async function initMembers(contractId, root, initialMembers, isAdmin, contractNumber, state, collectionName, notifSource) {
  let allUsers = [];
  try { allUsers = await loadAllUsers(); } catch (e) { allUsers = []; }
  renderMembers(root, contractId, initialMembers, allUsers, isAdmin, contractNumber, state, collectionName, notifSource);

  const addBtn = root.querySelector('#cm-members-add-btn');
  const popover = root.querySelector('#cm-add-popover');
  if (!isAdmin) return;

  addBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    popover.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!popover.contains(e.target) && e.target !== addBtn) {
      popover.classList.remove('open');
    }
  });
}


// ---------- правила ввода, нормализация и валидация ----------
const FIELD_RULES = {
  area_sqm: { kind: 'decimal' },
  rent_per_sqm: { kind: 'money' }, utility_per_sqm: { kind: 'money' },
  deposit_amount: { kind: 'money' }, rent_amount: { kind: 'money' }, utility_amount: { kind: 'money' }, total_amount: { kind: 'money' },
  inn: { kind: 'inn' }, bank_account: { kind: 'account' }, corr_account: { kind: 'account' }, bik: { kind: 'bik' },
  phone: { kind: 'phone' }, email: { kind: 'email' },
  tenant_fio: { kind: 'fio' }, contact_person: { kind: 'fio' },
  avito_url: { kind: 'url' }, cian_url: { kind: 'url' }, other_url: { kind: 'url' }
};

function digitsOnly(s) { return String(s === null || s === undefined ? '' : s).replace(/\D/g, ''); }
function escRaw(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitizeFio(v) { return String(v).replace(/[^A-Za-zА-Яа-яЁё .'’-]/g, ''); }

function normalizeValue(name, raw) {
  const rule = FIELD_RULES[name];
  let v = (raw === null || raw === undefined) ? '' : String(raw);
  if (!rule) return v;
  switch (rule.kind) {
    case 'decimal': case 'money': return v.replace(/[\s ]/g, '').replace(/\./g, ',');
    case 'inn': case 'bik': case 'account': return digitsOnly(v);
    case 'phone': {
      const d = digitsOnly(v);
      if (d.length <= 1) return '';
      if (d.length === 11 && (d[0] === '7' || d[0] === '8')) return '+7' + d.slice(1);
      if (d.length === 10) return '+7' + d;
      return v.trim();
    }
    case 'email': return v.trim().toLowerCase();
    case 'url': { v = v.trim(); return (v && !/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) ? 'https://' + v : v; }
    case 'fio': return v.trim().replace(/\s+/g, ' ');
  }
  return v;
}

// значение для API: числовые поля — Number/null, остальные без изменений
function toApiValue(name, v) {
  const rule = FIELD_RULES[name];
  if (rule && (rule.kind === 'decimal' || rule.kind === 'money')) {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  return v;
}

function innValid(d) {
  const n = function(coef, len) { let s = 0; for (let i = 0; i < len; i++) s += Number(d[i]) * coef[i]; return (s % 11) % 10; };
  if (d.length === 10) return n([2, 4, 10, 3, 5, 9, 4, 6, 8], 9) === Number(d[9]);
  if (d.length === 12) return n([7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 10) === Number(d[10]) && n([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 11) === Number(d[11]);
  return false;
}
function accountChecksumOk(prefix, account) {
  const s = prefix + account;
  const w = [7, 1, 3];
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += (Number(s[i]) * w[i % 3]) % 10;
  return sum % 10 === 0;
}
function formatPhoneDisplay(v) {
  const n = normalizeValue('phone', v);
  if (!/^\+7\d{10}$/.test(n)) return v;
  return '+7 (' + n.slice(2, 5) + ') ' + n.slice(5, 8) + '-' + n.slice(8, 10) + '-' + n.slice(10, 12);
}

// возвращает текст ошибки или '' (значение уже нормализовано)
function validateValue(name, val, el) {
  const rule = FIELD_RULES[name];
  if (!rule || val === '' || val === null || val === undefined) return '';
  switch (rule.kind) {
    case 'decimal': case 'money':
      return /^\d{1,9}(,\d{1,2})?$/.test(val) ? '' : 'только цифры, дробная часть через запятую (не более 2 знаков)';
    case 'inn':
      if (!/^(\d{10}|\d{12})$/.test(val)) return 'ИНН — это 10 или 12 цифр';
      return innValid(val) ? '' : 'некорректный ИНН (не сходится контрольная сумма)';
    case 'bik':
      if (!/^\d{9}$/.test(val)) return 'БИК — ровно 9 цифр';
      if (val.slice(0, 2) !== '04') return 'БИК российского банка начинается с 04';
      if (el && el.__bikState === 'bad') return 'БИК не найден в справочнике ЦБ';
      return '';
    case 'account': {
      if (!/^\d{20}$/.test(val)) return 'счёт — ровно 20 цифр';
      const scope = el ? (el.closest('.cm-stage-form') || el.closest('form')) : null;
      const bikEl = scope ? scope.querySelector('[data-field="bik"]') : null;
      const bik = bikEl ? digitsOnly(bikEl.value) : '';
      if (bik.length === 9 && bik.slice(0, 2) === '04') {
        const isCorr = name === 'corr_account';
        const prefix = isCorr ? ('0' + bik.slice(4, 6)) : bik.slice(6, 9);
        if (!accountChecksumOk(prefix, val)) return 'счёт не соответствует указанному БИК (не сходится контрольный ключ)';
      }
      return '';
    }
    case 'phone': return /^\+7\d{10}$/.test(val) ? '' : 'введите номер полностью: +7 (XXX) XXX-XX-XX';
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(val) ? '' : 'некорректный адрес почты';
    case 'url': {
      let u = null;
      try { u = new URL(val); } catch (e) { u = null; }
      return (u && (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.indexOf('.') > 0) ? '' : 'некорректная ссылка (нужен адрес вида https://…)';
    }
    case 'fio':
      return /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё .'’-]*$/.test(val) ? '' : 'только буквы, без цифр и символов';
  }
  return '';
}

function fieldLabel(name) {
  let label = name;
  const scan = function(defs) { (defs || []).forEach(function(d) { (d.fields || []).forEach(function(f) { if (f.name === name) label = f.label; }); }); };
  try { scan(STAGE_DEFS); scan(ACTIVE_BLOCK_DEFS); } catch (e) { /* ignore */ }
  return label;
}

function sanitizeInput(el, kind) {
  let v = el.value;
  if (kind === 'decimal' || kind === 'money') {
    v = v.replace(/[^\d.,]/g, '').replace(/\./g, ',');
    const i = v.indexOf(',');
    let ip = i >= 0 ? v.slice(0, i) : v;
    let fp = i >= 0 ? v.slice(i + 1).replace(/,/g, '').slice(0, 2) : '';
    ip = ip.slice(0, 9);
    v = i >= 0 ? ip + ',' + fp : ip;
  } else if (kind === 'inn') v = v.replace(/\D/g, '').slice(0, 12);
  else if (kind === 'fio') v = sanitizeFio(v);
  else if (kind === 'email' || kind === 'url') v = v.replace(/\s/g, '');
  if (v !== el.value) el.value = v;
}

function validateElement(el, strict) {
  const name = el.getAttribute('data-field');
  if (!FIELD_RULES[name]) return '';
  const norm = normalizeValue(name, el.value);
  if (!strict && norm === el.__origNorm) return '';
  return validateValue(name, norm, el);
}
function showFieldState(el) {
  const err = validateElement(el, false);
  el.__cmErr = err;
  el.style.borderColor = err ? '#ff4d4f' : (el.__bikState === 'ok' ? '#52c41a' : '');
  if (el.__cmMsg && el.getAttribute('data-field') !== 'bik') el.__cmMsg.textContent = err ? '✗ ' + err : '';
}
function revalidateAccounts(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-field="bank_account"],[data-field="corr_account"]').forEach(function(a) { if (a.__cmRules) showFieldState(a); });
}
function validateForm(formEl, strict) {
  if (!formEl) return null;
  const els = formEl.querySelectorAll('[data-field]');
  for (let i = 0; i < els.length; i++) {
    const err = validateElement(els[i], strict);
    if (err) {
      const name = els[i].getAttribute('data-field');
      showFieldState(els[i]);
      return { el: els[i], name: name, msg: fieldLabel(name) + ': ' + err };
    }
  }
  return null;
}
function invalidFieldNames(formEl) {
  const names = [];
  if (!formEl) return names;
  formEl.querySelectorAll('[data-field]').forEach(function(el) { if (validateElement(el, false)) names.push(el.getAttribute('data-field')); });
  return names;
}

function wireFieldRules(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('[data-field]').forEach(function(el) {
    const name = el.getAttribute('data-field');
    const rule = FIELD_RULES[name];
    if (!rule || el.__cmRules) return;
    el.__cmRules = true;
    if ((rule.kind === 'decimal' || rule.kind === 'money') && el.value.indexOf('.') >= 0) el.value = el.value.replace('.', ',');
    el.__origNorm = normalizeValue(name, el.value);
    const kind = rule.kind;
    el.setAttribute('autocomplete', 'off');
    el.spellcheck = false;
    if (kind === 'decimal' || kind === 'money') el.setAttribute('inputmode', 'decimal');
    else if (kind === 'inn' || kind === 'bik' || kind === 'account') el.setAttribute('inputmode', 'numeric');
    else if (kind === 'phone') el.setAttribute('inputmode', 'tel');
    if (kind === 'phone' && el.value) el.value = formatPhoneDisplay(el.value);
    if (el.getAttribute('data-mask') === 'bankaccount' && el.value) formatBankAccountInput(el);
    const msg = document.createElement('div');
    msg.className = 'cm-field-msg';
    el.parentNode.appendChild(msg);
    el.__cmMsg = msg;
    el.addEventListener('input', function() { sanitizeInput(el, kind); showFieldState(el); });
    el.addEventListener('blur', function() {
      if (kind === 'url' && el.value.trim()) el.value = normalizeValue(name, el.value);
      showFieldState(el);
    });
  });
}

function linkHtml(v) {
  if (v === null || v === undefined || v === '') return '—';
  const s = String(v).trim();
  let u = null;
  try { u = new URL(s); } catch (e) { u = null; }
  if (u && (u.protocol === 'http:' || u.protocol === 'https:')) {
    return '<a href="' + escAttr(s) + '" target="_blank" rel="noopener noreferrer" style="color:#1677ff;word-break:break-all;">' + escRaw(s) + '</a>';
  }
  return esc(v);
}
function linkifyText(v) {
  if (v === null || v === undefined || v === '') return '—';
  const s = String(v);
  const re = /https?:\/\/[^\s<>"']+/g;
  let out = '', last = 0, m;
  while ((m = re.exec(s))) {
    let url = m[0], tail = '';
    const t = url.match(/[.,;:!?)\]]+$/);
    if (t) { tail = t[0]; url = url.slice(0, url.length - tail.length); }
    out += escRaw(s.slice(last, m.index))
      + '<a href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer" style="color:#1677ff;word-break:break-all;">' + escRaw(url) + '</a>'
      + escRaw(tail);
    last = m.index + m[0].length;
  }
  return out + escRaw(s.slice(last));
}


// ---------- история изменений ----------
const HIST_TYPE_BY_COLL = { rental_contracts: 'active', forming_contracts: 'forming', completed_contracts: 'completed', draft_contracts: 'draft' };
const HIST_SKIP = { current_stage: 1, id: 1, last_activity_at: 1, base_rent_per_sqm: 1, base_rent_amount: 1 };
function histPayload(res) {
  const p = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  return p;
}
function histVal(v) {
  if (v === null || v === undefined) return '';
  if (v === true) return 'Да';
  if (v === false) return 'Нет';
  return String(v);
}
function userNameById(users, uid) {
  const u = (users || []).find(function(x) { return String(x.id) === String(uid); });
  return u ? (u.nickname || u.username || ('#' + uid)) : ('#' + uid);
}
function contactSummary(c) {
  return [c.name, c.position, c.phone ? formatPhoneDisplay(c.phone) : '', c.email].filter(function(x) { return x; }).join(', ') || 'без данных';
}

// запись в журнал; сбой журнала не должен ломать сохранение договора
async function logHistory(type, id, entries) {
  try {
    const u = await getCurrentUser();
    for (let i = 0; i < entries.length; i++) await histWriteOne(type, id, u, entries[i]);
  } catch (e) { /* history is best-effort */ }
}
async function histWriteOne(type, id, u, e) {
  const uid = u ? u.id : null;
  const nowIso = new Date().toISOString();
  if (e.action === 'field' && uid) {
    // серия правок одного поля тем же автором за 10 минут схлопывается в одну запись
    try {
      const lr = await ctx.api.resource('contract_history').list({
        filter: { contract_type: type, contract_ref_id: id, field: e.field, author_id: uid, action: 'field' }, sort: ['-id'], pageSize: 1
      });
      const arr = histPayload(lr);
      const last = Array.isArray(arr) ? arr[0] : null;
      if (last && (Date.now() - new Date(last.created_at).getTime()) < 600000 && String(last.new_value || '') === e.old) {
        if (String(last.old_value || '') === e.new) await ctx.api.resource('contract_history').destroy({ filterByTk: last.id });
        else await ctx.api.resource('contract_history').update({ filterByTk: last.id, values: { new_value: e.new, created_at: nowIso } });
        return;
      }
    } catch (err) { /* fall through to a plain insert */ }
  }
  await ctx.api.resource('contract_history').create({ values: {
    contract_type: type, contract_ref_id: id, author_id: uid, action: e.action,
    field: e.field || null, old_value: e.old === undefined ? null : e.old, new_value: e.new === undefined ? null : e.new,
    text: e.text || null, created_at: nowIso
  } });
}
async function logFieldChanges(type, id, oldRec, values) {
  const entries = [];
  Object.keys(values).forEach(function(k) {
    if (HIST_SKIP[k]) return;
    const a = histVal(oldRec[k]), b = histVal(values[k]);
    if (a === b) return;
    entries.push({ action: 'field', field: k, old: a, new: b });
  });
  if (entries.length) await logHistory(type, id, entries);
}
// update + запись «что было → что стало»
async function updateWithHistory(collection, id, values, opts) {
  let old = null;
  try { old = histPayload(await ctx.api.resource(collection).get({ filterByTk: id })); } catch (e) { old = null; }
  let derived = {};
  if (old && DERIVED_COLLECTIONS[collection]) {
    derived = derivedUpdates(old, values);
    if (Object.keys(derived).length) values = Object.assign({}, values, derived);
  }
  // ручная правка ставки/АП активного договора = правка основной цены, если сегодня не действует период «Графика цены»
  if (collection === 'rental_contracts' && !(opts && opts.schedule) && (hasKey(values, 'rent_per_sqm') || hasKey(values, 'rent_amount'))) {
    let periods = [];
    try { periods = await loadPricePeriods('active', id); } catch (e) { periods = []; }
    if (!schedulePeriodOn(periods, todayIsoLocal())) {
      values = Object.assign({}, values);
      if (hasKey(values, 'rent_per_sqm')) values.base_rent_per_sqm = values.rent_per_sqm;
      if (hasKey(values, 'rent_amount')) values.base_rent_amount = values.rent_amount;
    }
  }
  const res = await ctx.api.resource(collection).update({ filterByTk: id, values: values });
  if (old) await logFieldChanges(HIST_TYPE_BY_COLL[collection] || 'active', id, old, values);
  if (Object.keys(derived).length) syncDerivedDom(derived);
  try { res.__cmDerived = derived; } catch (e) { /* ignore */ }
  return res;
}
async function moveHistory(fromType, fromId, toType, toId) {
  try {
    await fetch('/api/contract_history:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: fromType, contract_ref_id: fromId })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: toType, contract_ref_id: toId })
    });
  } catch (e) { /* best-effort */ }
}

function parseAnyDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}
function expiryBadge(endVal, terminationVal) {
  if (terminationVal) return '';
  const d = parseAnyDate(endVal);
  if (!d) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  let text, bg, fg;
  if (days < 0) { text = 'срок истёк ' + (-days) + ' дн. назад'; bg = '#fff1f0'; fg = '#cf1322'; }
  else if (days === 0) { text = 'истекает сегодня'; bg = '#fff1f0'; fg = '#cf1322'; }
  else if (days <= 30) { text = 'осталось ' + days + ' дн.'; bg = '#fff1f0'; fg = '#cf1322'; }
  else if (days <= 90) { text = 'осталось ' + days + ' дн.'; bg = '#fffbe6'; fg = '#d48806'; }
  else return '';
  return ' <span style="display:inline-block;margin-left:6px;padding:1px 8px;border-radius:10px;font-size:12px;background:' + bg + ';color:' + fg + ';">' + text + '</span>';
}

function renderHistorySection(prefix) {
  return '<div class="cm-section" id="' + prefix + '-history-section" style="margin-bottom:0;">'
    + '<div class="cm-section-title-row"><div class="cm-section-title" style="margin-bottom:0;flex:1;">История изменений</div>'
    + '<button class="cm-stage-edit-toggle" id="' + prefix + '-history-toggle">Показать</button></div>'
    + '<div id="' + prefix + '-history-list" style="display:none;margin-top:6px;"></div></div>';
}
function histShort(v, field) {
  if (field && STATUS_OPTIONS[field]) { const o = STATUS_OPTIONS[field].find(function(x) { return x.value === String(v); }); if (o) return o.label; }
  const s = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fromISODateDisplay(v) : String(v);
  return s.length > 140 ? s.slice(0, 140) + '…' : s;
}
function renderHistoryList(items) {
  if (!items.length) return '<div style="color:#bbb;font-size:12px;">Изменений пока нет</div>';
  return items.map(function(h) {
    const who = h.author ? (h.author.nickname || h.author.username) : 'Система';
    let body;
    if (h.action === 'field') {
      body = '<b>' + esc(fieldLabel(h.field)) + '</b>: '
        + '<span style="color:#8c8c8c;">' + (h.old_value ? esc(histShort(h.old_value, h.field)) : 'пусто') + '</span>'
        + ' → <span style="color:#262626;">' + (h.new_value ? esc(histShort(h.new_value, h.field)) : 'пусто') + '</span>';
    } else {
      body = esc(h.text || h.action);
    }
    return '<div class="cm-hist-row"><div class="cm-hist-meta">' + esc(nbFmtDateTimeLocal(h.created_at)) + ' · ' + esc(who) + '</div><div class="cm-hist-body">' + body + '</div></div>';
  }).join('');
}
async function loadHistory(type, id) {
  const res = await ctx.api.resource('contract_history').list({
    filter: { contract_type: type, contract_ref_id: id }, appends: ['author'], sort: ['-created_at', '-id'], pageSize: 200
  });
  const p = histPayload(res);
  return Array.isArray(p) ? p : [];
}
function wireHistory(overlay, prefix, type, id) {
  const btn = overlay.querySelector('#' + prefix + '-history-toggle');
  const listEl = overlay.querySelector('#' + prefix + '-history-list');
  if (!btn || !listEl) return;
  let loaded = false;
  btn.addEventListener('click', async function() {
    const open = listEl.style.display !== 'none';
    if (open) { listEl.style.display = 'none'; btn.textContent = 'Показать'; return; }
    listEl.style.display = 'block'; btn.textContent = 'Скрыть';
    if (loaded) return;
    listEl.innerHTML = '<div style="color:#999;font-size:12px;">Загрузка…</div>';
    try { listEl.innerHTML = renderHistoryList(await loadHistory(type, id)); loaded = true; }
    catch (e) { listEl.innerHTML = '<span style="color:#c0392b;font-size:12px;">Не удалось загрузить историю</span>'; }
  });
}

// ---------- связанные поля и график цены аренды ----------
function numOf(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[\s ]/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
}
function round2(n) { return Math.round(n * 100) / 100; }
const DERIVED_COLLECTIONS = { rental_contracts: true, forming_contracts: true };
const DERIVED_SOURCES = ['area_sqm', 'rent_per_sqm', 'utility_per_sqm', 'rent_amount', 'utility_amount'];
const DERIVED_PAIRS = [{ target: 'rent_amount', per: 'rent_per_sqm' }, { target: 'utility_amount', per: 'utility_per_sqm' }, { target: 'base_rent_amount', per: 'base_rent_per_sqm' }];
function derivedTol(area) { return Math.max(1, (area || 0) * 0.005); }
function hasKey(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

// Мягкий пересчёт: что изменится в БД вместе с сохранением. Сумма пересчитывается только если она пустая
// или совпадала с прежним расчётом (то есть не правилась вручную); ставка — только если пустая.
function derivedUpdates(oldRec, values) {
  if (!DERIVED_SOURCES.some(function(k) { return hasKey(values, k); })) return {};
  const nr = Object.assign({}, oldRec, values);
  const upd = {};
  const areaOld = numOf(oldRec.area_sqm), areaNew = numOf(nr.area_sqm);
  DERIVED_PAIRS.forEach(function(p) {
    const perOld = numOf(oldRec[p.per]), perNew = numOf(nr[p.per]);
    const tgtOld = numOf(oldRec[p.target]);
    const hasTarget = hasKey(values, p.target), hasPer = hasKey(values, p.per);
    if (!hasTarget && areaNew > 0 && perNew > 0) {
      const expNew = round2(perNew * areaNew);
      const expOld = (areaOld > 0 && perOld > 0) ? round2(perOld * areaOld) : null;
      const untouched = tgtOld === null || (expOld !== null && Math.abs(tgtOld - expOld) <= derivedTol(areaOld));
      if (untouched && (tgtOld === null || Math.abs(tgtOld - expNew) > 0.004)) upd[p.target] = expNew;
    }
    // ставку из «АП ÷ площадь» не выводим никогда: деление даёт приблизительное число, а в договоре должны быть только точные
  });
  return upd;
}
function syncDerivedDom(derived) {
  Object.keys(derived || {}).forEach(function(name) {
    document.querySelectorAll('#contract-modal-root [data-field="' + name + '"], #forming-modal-root [data-field="' + name + '"]').forEach(function(el) {
      if (document.activeElement === el) return;
      const txt = String(derived[name]).replace('.', ',');
      el.value = txt;
      if (FIELD_RULES[name]) { el.__origNorm = normalizeValue(name, txt); showFieldState(el); }
    });
  });
}
function renderAllActiveReadonly(root, r) {
  ACTIVE_BLOCK_DEFS.forEach(function(block) {
    const el = root.querySelector('[data-active-readonly="' + block.key + '"]');
    if (!el) return;
    el.innerHTML = block.readonlyRenderer ? block.readonlyRenderer(r)
      : '<div class="cm-grid">' + block.fields.map(function(f) { return row(f.label, readonlyFieldValue(f, r), f.full); }).join('') + '</div>';
  });
  paintInnStatus(root);
}
// подсказки под полями АП/ЭС: «По ставке × площади = … — подставить»
function wireDerivedHints(root) {
  if (!root || root.__cmDerivedHints) return;
  root.__cmDerivedHints = true;
  function valueOf(n) { const el = root.querySelector('[data-field="' + n + '"]'); return el ? numOf(el.value) : null; }
  function refresh() {
    DERIVED_PAIRS.forEach(function(p) {
      const el = root.querySelector('[data-field="' + p.target + '"]');
      if (!el || !el.parentNode) return;
      let h = el.parentNode.querySelector('.cm-derived-hint');
      if (!h) { h = document.createElement('div'); h.className = 'cm-derived-hint'; el.parentNode.appendChild(h); }
      const area = valueOf('area_sqm'), per = valueOf(p.per);
      if (!(area > 0 && per > 0)) { h.textContent = ''; return; }
      const exp = round2(per * area), cur = numOf(el.value);
      if (cur !== null && Math.abs(cur - exp) <= derivedTol(area)) { h.textContent = ''; return; }
      h.innerHTML = 'По ставке ' + escRaw(formatNum(per)) + ' × ' + escRaw(formatNum(area)) + ' м² = <a href="#" class="cm-derived-apply">' + escRaw(formatNum(exp)) + '</a> — подставить';
      h.querySelector('a').addEventListener('click', function(e) {
        e.preventDefault();
        el.value = String(exp).replace('.', ',');
        fireInput(el);
        refresh();
      });
    });
  }
  root.addEventListener('input', refresh);
  refresh();
}

async function moveSide(collection, fromType, fromId, toType, toId) {
  try {
    await fetch('/api/' + collection + ':update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: fromType, contract_ref_id: fromId })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: toType, contract_ref_id: toId })
    });
  } catch (e) { /* best-effort */ }
}

// ----- график цены -----
const PRICE_BASIS = { fixed: 'Фиксированная сумма', per_sqm: 'За 1 кв.м.' };
const PRICE_UNIT_TITLES = { month: 'в месяц', week: 'в неделю', day: 'в день', year: 'в год' };
function isoToDate(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
function dateToIso(d) {
  const p = function(n) { return n < 10 ? '0' + n : '' + n; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function daysInclusive(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000) + 1; }
// сколько «единиц срока» (месяцев/недель/дней/лет) укладывается в период; месяц — по календарю, неполный — пропорционально дням
function unitsInPeriod(from, to, unit) {
  const days = daysInclusive(from, to);
  if (days <= 0) return 0;
  if (unit === 'day') return days;
  if (unit === 'week') return days / 7;
  if (unit === 'year') return days / 365;
  let total = 0, cur = from;
  while (cur.getTime() <= to.getTime()) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const segEnd = monthEnd.getTime() < to.getTime() ? monthEnd : to;
    total += daysInclusive(cur, segEnd) / monthEnd.getDate();
    cur = addDays(segEnd, 1);
  }
  return total;
}
function periodCost(p, area) {
  const from = isoToDate(p.date_from), to = isoToDate(p.date_to), amt = Number(p.amount);
  if (!from || !to || !isFinite(amt)) return null;
  const mult = p.basis === 'per_sqm' ? area : 1;
  if (p.basis === 'per_sqm' && !(area > 0)) return null;
  if ((p.unit || 'month') !== 'month') return null;
  return round2(amt * mult * unitsInPeriod(from, to, 'month'));
}
function periodMonthly(p, area) {
  const amt = Number(p.amount);
  if (!isFinite(amt)) return null;
  if (p.basis === 'per_sqm' && !(area > 0)) return null;
  if ((p.unit || 'month') !== 'month') return null;
  return round2(amt * (p.basis === 'per_sqm' ? area : 1));
}
function fmtDate(iso) { return fromISODateDisplay(iso); }
function todayIsoLocal() { return dateToIso(new Date()); }
// период графика, действующий в дату iso (если пересекаются — начавшийся позже); цены не «в месяц» не применяются
function schedulePeriodOn(periods, iso) {
  const cov = (periods || []).filter(function(p) { return p.date_from && p.date_to && p.date_from <= iso && iso <= p.date_to && (p.unit || 'month') === 'month'; });
  cov.sort(function(a, b) { return String(a.date_from).localeCompare(String(b.date_from)) || (a.id - b.id); });
  return cov.length ? cov[cov.length - 1] : null;
}
// текущая цена договора: период графика на сегодня, иначе основная цена. Только точные числа: ставку делением не выводим.
function scheduleTarget(periods, rec, iso) {
  const p = schedulePeriodOn(periods, iso);
  const area = numOf(rec.area_sqm);
  if (p) {
    const amt = Number(p.amount);
    if (p.basis === 'per_sqm') return { period: p, values: area > 0 ? { rent_per_sqm: amt, rent_amount: round2(amt * area) } : { rent_per_sqm: amt } };
    return { period: p, values: { rent_amount: amt, rent_per_sqm: null } };
  }
  return { period: null, values: { rent_per_sqm: numOf(rec.base_rent_per_sqm), rent_amount: numOf(rec.base_rent_amount) } };
}
function basePriceLabel(rec) {
  const per = numOf(rec.base_rent_per_sqm), amt = numOf(rec.base_rent_amount);
  const parts = [];
  if (per !== null) parts.push(formatNum(per) + ' ₽ за 1 кв.м.');
  if (amt !== null) parts.push('АП ' + formatNum(amt) + ' ₽ в месяц');
  return parts.length ? parts.join(' · ') : 'не задана';
}
function priceLabel(p) {
  return formatNum(p.amount) + ' ₽ ' + (p.basis === 'per_sqm' ? 'за 1 кв.м. ' : '') + (PRICE_UNIT_TITLES[p.unit || 'month'] || '');
}

function renderPricesSection(prefix) {
  return '<div class="cm-section" id="' + prefix + '-prices-section">'
    + '<div class="cm-section-title-row"><div class="cm-section-title" style="margin-bottom:0;flex:1;">График цены аренды</div>'
    + '<button class="cm-stage-edit-toggle" id="' + prefix + '-price-add-btn" style="display:none;">+ Период</button></div>'
    + '<div class="cm-price-hint">Цена может меняться со временем: на весь срок действует основная цена, а на отдельные даты можно задать другую (например, скидку на несколько месяцев). Цена в договоре переключается сама, сотрудникам договора приходит уведомление. Цена периода — фиксированная сумма в месяц или за 1 кв.м. в месяц.</div>'
    + '<div id="' + prefix + '-price-base" style="display:none;"></div>'
    + '<div id="' + prefix + '-price-summary" class="cm-price-summary" style="display:none;"></div>'
    + '<div id="' + prefix + '-price-list"><div style="color:#999;font-size:12px;">Загрузка…</div></div>'
    + '<div class="cm-price-form" id="' + prefix + '-price-form" style="display:none;">'
    + '<div class="cm-price-form-grid">'
    + '<div><label>Действует с</label><input type="date" class="cm-field-input" id="' + prefix + '-price-from"></div>'
    + '<div><label>Действует по</label><input type="date" class="cm-field-input" id="' + prefix + '-price-to"></div>'
    + '<div><label>Как задана цена</label><select class="cm-field-input" id="' + prefix + '-price-basis"><option value="per_sqm">За 1 кв.м.</option><option value="fixed">Фиксированная сумма</option></select></div>'
    + '<div><label>За какой срок</label><select class="cm-field-input" id="' + prefix + '-price-unit"><option value="month">В месяц</option></select></div>'
    + '<div><label>Цена, ₽</label><input type="text" class="cm-field-input" id="' + prefix + '-price-amount" inputmode="decimal" placeholder="0,00"></div>'
    + '<div><label>Примечание</label><input type="text" class="cm-field-input" id="' + prefix + '-price-note" placeholder="например, скидка на ремонт"></div>'
    + '</div>'
    + '<div class="cm-stage-edit-actions"><button class="cm-btn-save" id="' + prefix + '-price-save">Сохранить</button>'
    + '<button class="cm-btn-save" id="' + prefix + '-price-cancel">Отмена</button>'
    + '<span id="' + prefix + '-price-status" style="font-size:12px;color:#999;align-self:center;"></span></div>'
    + '</div>'
    + '<div id="' + prefix + '-price-actions" style="display:none;margin-top:10px;gap:8px;flex-wrap:wrap;">'
    + '<button class="cm-btn-save" id="' + prefix + '-price-calc">Рассчитать «Сумму договора» за срок</button>'
    + '<button class="cm-btn-save" id="' + prefix + '-price-today">Пересчитать цену на сегодня</button></div>'
    + '</div>';
}

async function loadPricePeriods(type, id) {
  const res = await ctx.api.resource('contract_price_periods').list({
    filter: { contract_type: type, contract_ref_id: id }, sort: ['date_from', 'id'], pageSize: 200
  });
  const p = histPayload(res);
  return Array.isArray(p) ? p : [];
}

async function wirePrices(overlay, prefix, type, id, canEdit, r) {
  const q = function(s) { return overlay.querySelector('#' + prefix + s); };
  const listEl = q('-price-list');
  if (!listEl) return;
  const summaryEl = q('-price-summary'), addBtn = q('-price-add-btn'), formEl = q('-price-form'), actionsEl = q('-price-actions');
  const fromEl = q('-price-from'), toEl = q('-price-to'), basisEl = q('-price-basis'), unitEl = q('-price-unit'), amountEl = q('-price-amount'), noteEl = q('-price-note');
  const saveBtn = q('-price-save'), cancelBtn = q('-price-cancel'), statusEl = q('-price-status');
  const coll = type === 'forming' ? 'forming_contracts' : (type === 'completed' ? 'completed_contracts' : 'rental_contracts');
  let items = [];
  let editId = null;

  function recVal(name) {
    const el = overlay.querySelector('[data-field="' + name + '"]');
    if (el) return el.value;
    return r ? r[name] : null;
  }
  function ctxInfo() {
    const startIso = recVal('date_act') || recVal('date_signed') || recVal('actual_start_date');
    return { area: numOf(recVal('area_sqm')), start: isoToDate(startIso), end: isoToDate(recVal('end_date')), per: numOf(recVal('rent_per_sqm')), amt: numOf(recVal('rent_amount')) };
  }
  function today() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }

  function baseMonthly() { return type === 'active' ? numOf(r && r.base_rent_amount) : ctxInfo().amt; }
  // сумма за срок договора: периоды графика + основная цена в остальные даты (неполный месяц — пропорционально дням)
  function termTotal() {
    const c = ctxInfo();
    if (!(c.start && c.end && c.end.getTime() >= c.start.getTime())) return { error: 'укажите даты начала и окончания договора' };
    const base = baseMonthly();
    const sorted = items.slice().sort(function(x, y) { return String(x.date_from).localeCompare(String(y.date_from)); });
    let total = 0, cur = c.start, baseDays = false;
    for (let i = 0; i < sorted.length; i++) {
      const pa = isoToDate(sorted[i].date_from), pb = isoToDate(sorted[i].date_to);
      if (!pa || !pb || pb.getTime() < c.start.getTime() || pa.getTime() > c.end.getTime()) continue;
      const from = pa.getTime() < c.start.getTime() ? c.start : pa, to = pb.getTime() > c.end.getTime() ? c.end : pb;
      if (from.getTime() > cur.getTime()) { baseDays = true; if (base !== null) total += base * unitsInPeriod(cur, addDays(from, -1), 'month'); }
      // без промежуточных округлений — округляем один раз, в конце
      if (sorted[i].basis === 'per_sqm' && !(c.area > 0)) return { error: 'не хватает площади для периодов «за 1 кв.м.»' };
      total += Number(sorted[i].amount) * (sorted[i].basis === 'per_sqm' ? c.area : 1) * unitsInPeriod(from, to, 'month');
      if (addDays(to, 1).getTime() > cur.getTime()) cur = addDays(to, 1);
    }
    if (cur.getTime() <= c.end.getTime()) { baseDays = true; if (base !== null) total += base * unitsInPeriod(cur, c.end, 'month'); }
    if (baseDays && base === null) return { error: 'не задана основная цена (АП)' };
    return { total: round2(total), from: c.start, to: c.end };
  }
  function renderSummary() {
    const lines = [];
    const nowP = schedulePeriodOn(items, todayIsoLocal());
    if (type === 'active') {
      lines.push(nowP ? 'Сейчас действует цена по графику: <b>' + escRaw(priceLabel(nowP)) + '</b> до ' + escRaw(fmtDate(nowP.date_to)) + ', затем — основная цена'
        : 'Сейчас действует <b>основная цена</b>');
    } else if (nowP) lines.push('Сегодня по графику: <b>' + escRaw(priceLabel(nowP)) + '</b>');
    if (items.length) {
      const tt = termTotal();
      lines.push(tt.error ? '<span class="warn">Сумма за срок не считается: ' + escRaw(tt.error) + '</span>'
        : 'Итого за срок договора (' + escRaw(fmtDate(dateToIso(tt.from))) + ' — ' + escRaw(fmtDate(dateToIso(tt.to))) + '): <b>' + escRaw(formatNum(tt.total)) + ' ₽</b> — периоды графика + основная цена в остальные даты');
    }
    const show = type === 'active' || items.length;
    summaryEl.innerHTML = lines.join('<br>');
    summaryEl.style.display = show && lines.length ? 'block' : 'none';
    actionsEl.style.display = canEdit && items.length ? 'flex' : 'none';
    if (type === 'active' && r) {
      r.__schedNow = nowP;
      renderAllActiveReadonly(overlay, r);
      ['rent_per_sqm', 'rent_amount'].forEach(function(n) {
        const el = overlay.querySelector('[data-active-form] [data-field="' + n + '"]');
        if (!el) return;
        el.readOnly = !!nowP;
        el.style.background = nowP ? '#f5f5f5' : '';
        el.title = nowP ? 'Сейчас действует цена по графику — основную цену меняйте в «График цены аренды»' : '';
      });
    }
  }
  // основная цена (на весь срок) — только у активного договора
  function renderBase() {
    const el = q('-price-base');
    if (!el || type !== 'active' || !r) return;
    el.style.display = '';
    el.innerHTML = '<div class="cm-price-base"><span>Основная цена на весь срок: <b>' + escRaw(basePriceLabel(r)) + '</b></span>'
      + (canEdit ? '<button class="cm-stage-edit-toggle" data-base-edit>✎ Изменить</button>' : '') + '</div>'
      + '<div class="cm-price-form" data-base-form style="display:none;"><div class="cm-price-form-grid">'
      + '<div><label>Ставка за 1 кв.м. в месяц, ₽</label><input type="text" class="cm-field-input" data-base="per" inputmode="decimal" value="' + escAttr(r.base_rent_per_sqm === null || r.base_rent_per_sqm === undefined ? '' : String(r.base_rent_per_sqm).replace('.', ',')) + '"></div>'
      + '<div><label>Арендная плата (АП) в месяц, ₽</label><input type="text" class="cm-field-input" data-base="amt" inputmode="decimal" value="' + escAttr(r.base_rent_amount === null || r.base_rent_amount === undefined ? '' : String(r.base_rent_amount).replace('.', ',')) + '"></div>'
      + '</div><div class="cm-derived-hint" data-base-hint></div>'
      + '<div class="cm-stage-edit-actions"><button class="cm-btn-save" data-base-save>Сохранить</button><button class="cm-btn-save" data-base-cancel>Отмена</button></div></div>';
    if (!canEdit) return;
    const form = el.querySelector('[data-base-form]'), perEl = el.querySelector('[data-base="per"]'), amtEl = el.querySelector('[data-base="amt"]'), hint = el.querySelector('[data-base-hint]');
    function refreshHint() {
      const per = numOf(perEl.value), area = numOf(recVal('area_sqm'));
      if (!(per > 0 && area > 0)) { hint.textContent = ''; return; }
      const exp = round2(per * area);
      if (numOf(amtEl.value) === exp) { hint.textContent = ''; return; }
      hint.innerHTML = 'По ставке ' + escRaw(formatNum(per)) + ' × ' + escRaw(formatNum(area)) + ' м² = <a href="#">' + escRaw(formatNum(exp)) + '</a> — подставить';
      hint.querySelector('a').addEventListener('click', function(e) { e.preventDefault(); amtEl.value = String(exp).replace('.', ','); refreshHint(); });
    }
    [perEl, amtEl].forEach(function(x) { x.addEventListener('input', function() { sanitizeInput(x, 'money'); refreshHint(); }); });
    el.querySelector('[data-base-edit]').addEventListener('click', function() { form.style.display = form.style.display === 'none' ? 'block' : 'none'; refreshHint(); });
    el.querySelector('[data-base-cancel]').addEventListener('click', function() { renderBase(); });
    el.querySelector('[data-base-save]').addEventListener('click', async function() {
      const per = numOf(perEl.value), amt = numOf(amtEl.value);
      if (per === null && amt === null) { cmToast('Укажите ставку или АП'); return; }
      const before = basePriceLabel(r);
      const values = { base_rent_per_sqm: per, base_rent_amount: amt };
      try {
        await ctx.api.resource('rental_contracts').update({ filterByTk: id, values: values });
        Object.assign(r, values);
        logHistory(type, id, [{ action: 'price', text: 'Основная цена изменена: ' + before + ' → ' + basePriceLabel(r) }]);
        renderBase();
        await applySchedule(false);
        renderSummary();
      } catch (e) { cmToast('Не удалось сохранить основную цену'); }
    });
  }
  function renderList() {
    const c = ctxInfo();
    if (!items.length) { listEl.innerHTML = '<div style="color:#bbb;font-size:12px;">Периодов пока нет' + (canEdit ? ' — добавьте кнопкой «+ Период»' : '') + '</div>'; return; }
    const t = today();
    listEl.innerHTML = items.map(function(p) {
      const cost = periodCost(p, c.area), mo = periodMonthly(p, c.area);
      const a = isoToDate(p.date_from), b = isoToDate(p.date_to);
      const now = a && b && a.getTime() <= t.getTime() && t.getTime() <= b.getTime();
      return '<div class="cm-price-row' + (now ? ' now' : '') + '"><div class="cm-price-main">'
        + '<div class="cm-price-dates">' + escRaw(fmtDate(p.date_from)) + ' — ' + escRaw(fmtDate(p.date_to)) + (now ? ' <span style="color:#389e0d;font-weight:400;font-size:12px;">· сейчас</span>' : '') + '</div>'
        + '<div class="cm-price-line">' + escRaw(priceLabel(p)) + (mo !== null && p.basis === 'per_sqm' ? ' · ' + escRaw(formatNum(mo)) + ' ₽ в месяц' : '') + '</div>'
        + '<div class="cm-price-line">За период: <span class="cm-price-total">' + (cost !== null ? escRaw(formatNum(cost)) + ' ₽' : '— (укажите площадь)') + '</span>' + (p.note ? ' · ' + escRaw(p.note) : '') + '</div>'
        + '</div>'
        + (canEdit ? '<div class="cm-contact-actions"><a data-price-edit="' + p.id + '" title="Изменить">✎</a><a data-price-del="' + p.id + '" title="Удалить">✕</a></div>' : '')
        + '</div>';
    }).join('');
    if (!canEdit) return;
    listEl.querySelectorAll('[data-price-edit]').forEach(function(a) {
      a.addEventListener('click', function() { const p = items.find(function(x) { return String(x.id) === a.getAttribute('data-price-edit'); }); if (p) openForm(p); });
    });
    listEl.querySelectorAll('[data-price-del]').forEach(function(a) {
      a.addEventListener('click', async function() {
        const p = items.find(function(x) { return String(x.id) === a.getAttribute('data-price-del'); });
        if (!p) return;
        if (!(await cmConfirm('Удалить период ' + fmtDate(p.date_from) + ' — ' + fmtDate(p.date_to) + '?'))) return;
        try {
          await ctx.api.resource('contract_price_periods').destroy({ filterByTk: p.id });
          logHistory(type, id, [{ action: 'price', text: 'Удалён период цены ' + fmtDate(p.date_from) + ' — ' + fmtDate(p.date_to) + ': ' + priceLabel(p) }]);
          await refresh();
          await applySchedule(false);
        } catch (e) { cmToast('Не удалось удалить период'); }
      });
    });
  }
  async function refresh() {
    try { items = await loadPricePeriods(type, id); }
    catch (e) { listEl.innerHTML = '<span style="color:#c0392b;font-size:12px;">Не удалось загрузить график цены</span>'; return; }
    renderList(); renderSummary();
  }
  renderBase();
  await refresh();
  if (type === 'active') await applySchedule(false);   // карточку открыли в день смены периода раньше ночного скрипта
  // сумма/ставка/даты могут меняться в других блоках — пересчитываем итоги
  overlay.addEventListener('input', function(e) { if (items.length && !(e.target && e.target.closest && e.target.closest('[data-base-form]'))) { renderList(); renderSummary(); } });
  if (!canEdit || !addBtn) return;
  addBtn.style.display = '';

  amountEl.addEventListener('input', function() { sanitizeInput(amountEl, 'money'); });
  function openForm(p) {
    editId = p ? p.id : null;
    const c = ctxInfo();
    const last = items.length ? items[items.length - 1] : null;
    if (p) {
      fromEl.value = p.date_from || ''; toEl.value = p.date_to || ''; basisEl.value = p.basis || 'per_sqm'; unitEl.value = p.unit || 'month';
      amountEl.value = p.amount === null || p.amount === undefined ? '' : String(p.amount).replace('.', ','); noteEl.value = p.note || '';
    } else {
      const start = last ? addDays(isoToDate(last.date_to) || new Date(), 1) : c.start;
      fromEl.value = start ? dateToIso(start) : '';
      toEl.value = (c.end && start && c.end.getTime() >= start.getTime()) ? dateToIso(c.end) : '';
      basisEl.value = last ? (last.basis || 'per_sqm') : (c.per > 0 ? 'per_sqm' : 'fixed');
      unitEl.value = last ? (last.unit || 'month') : 'month';
      const suggested = last ? last.amount : (basisEl.value === 'per_sqm' ? c.per : c.amt);
      amountEl.value = suggested > 0 ? String(suggested).replace('.', ',') : '';
      noteEl.value = '';
    }
    formEl.style.display = 'block';
    amountEl.focus();
  }
  function closeForm() { formEl.style.display = 'none'; editId = null; statusEl.textContent = ''; }
  addBtn.addEventListener('click', function() { if (formEl.style.display === 'none') openForm(null); else closeForm(); });
  cancelBtn.addEventListener('click', closeForm);
  saveBtn.addEventListener('click', async function() {
    const amount = numOf(amountEl.value);
    const a = isoToDate(fromEl.value), b = isoToDate(toEl.value);
    if (!a || !b) { cmToast('Укажите даты «с» и «по»'); return; }
    if (b.getTime() < a.getTime()) { cmToast('Дата «по» раньше даты «с»'); return; }
    if (!(amount > 0)) { cmToast('Укажите цену больше нуля'); return; }
    const clash = items.find(function(p) {
      if (editId && String(p.id) === String(editId)) return false;
      const pa = isoToDate(p.date_from), pb = isoToDate(p.date_to);
      return pa && pb && a.getTime() <= pb.getTime() && b.getTime() >= pa.getTime();
    });
    if (clash) { cmToast('Пересекается с периодом ' + fmtDate(clash.date_from) + ' — ' + fmtDate(clash.date_to)); return; }
    const values = { contract_type: type, contract_ref_id: id, date_from: fromEl.value, date_to: toEl.value, basis: basisEl.value, unit: unitEl.value, amount: amount, note: noteEl.value.trim() };
    saveBtn.disabled = true; statusEl.textContent = 'Сохранение…';
    try {
      if (editId) await ctx.api.resource('contract_price_periods').update({ filterByTk: editId, values: values });
      else await ctx.api.resource('contract_price_periods').create({ values: values });
      logHistory(type, id, [{ action: 'price', text: (editId ? 'Изменён период цены ' : 'Добавлен период цены ') + fmtDate(values.date_from) + ' — ' + fmtDate(values.date_to) + ': ' + priceLabel(values) }]);
      closeForm();
      await refresh();
      await applySchedule(false);
    } catch (e) { cmToast('Не удалось сохранить период'); statusEl.textContent = ''; }
    finally { saveBtn.disabled = false; }
  });

  async function applyToContract(updates, opts) {
    const resp = await updateWithHistory(coll, id, updates, opts);
    const all = Object.assign({}, updates, (resp && resp.__cmDerived) || {});
    if (r) Object.assign(r, all);
    syncDerivedDom(all);
    if (type === 'active' && r) renderAllActiveReadonly(overlay, r);
    return all;
  }
  q('-price-calc').addEventListener('click', async function() {
    const tt = termTotal();
    if (tt.error) { cmToast('Сумма за срок не считается: ' + tt.error); return; }
    try {
      await applyToContract({ total_amount: tt.total });
      cmToast('Сумма договора: ' + formatNum(tt.total) + ' ₽');
    } catch (e) { cmToast('Не удалось записать сумму договора'); }
  });
  // Текущая цена договора = период графика на сегодня, иначе основная цена (та же логика, что у ночного scripts/apply_price_schedule.py).
  // При смене — запись в историю и уведомление сотрудникам договора (кроме того, кто сменил).
  async function applySchedule(explicit) {
    if (type !== 'active' || !r) return;
    const tgt = scheduleTarget(items, Object.assign({}, r, { area_sqm: recVal('area_sqm') }), todayIsoLocal());
    if (!tgt.period && numOf(r.base_rent_per_sqm) === null && numOf(r.base_rent_amount) === null) { if (explicit) cmToast('Не задана основная цена'); return; }
    const upd = {};
    Object.keys(tgt.values).forEach(function(k) {
      const nv = tgt.values[k], cv = numOf(r[k]);
      if (nv === null && cv === null) return;
      if (nv !== null && cv !== null && Math.abs(nv - cv) < 0.005) return;
      upd[k] = nv;
    });
    if (!Object.keys(upd).length) { if (explicit) cmToast('Цена на сегодня уже верная'); return; }
    const text = tgt.period
      ? 'Цена по графику: ' + priceLabel(tgt.period) + ' (период ' + fmtDate(tgt.period.date_from) + ' — ' + fmtDate(tgt.period.date_to) + ')'
      : 'Действует основная цена: ' + basePriceLabel(r);
    try {
      await applyToContract(upd, { schedule: true });
      logHistory(type, id, [{ action: 'price', text: text }]);
      const me = await getCurrentUser();
      const title = 'Договор ' + (r.contract_number || r.object_name || ('#' + id));
      (r.contract_members || []).forEach(function(m) {
        if (me && m.id === me.id) return;
        createNotification(m.id, id, title, 'Цена аренды изменилась. ' + text, 'active', 'status');
      });
      cmToast('Цена в договоре обновлена. ' + text);
      renderSummary();
    } catch (e) { cmToast('Не удалось обновить цену договора'); }
  }
  q('-price-today').addEventListener('click', function() { applySchedule(true); });
}

// ---------- статусы-светофоры (только активные договоры) ----------
const STATUS_TONES = {
  green: { bg: '#f6ffed', border: '#b7eb8f', fg: '#389e0d' },
  amber: { bg: '#fffbe6', border: '#ffe58f', fg: '#d48806' },
  red: { bg: '#fff2f0', border: '#ffccc7', fg: '#cf1322' }
};
// значения имеют числовой префикс, чтобы при сортировке по столбцу проблемные («красные») шли первыми
const STATUS_OPTIONS = {
  contract_status: [
    { value: '3_ok', label: 'В порядке', tone: 'green' },
    { value: '2_attention', label: 'Требует внимания', tone: 'amber' },
    { value: '1_problem', label: 'Проблема', tone: 'red' }
  ],
  payment_status: [
    { value: '3_paid', label: 'Оплачено', tone: 'green' },
    { value: '2_waiting', label: 'Ожидает оплаты', tone: 'amber' },
    { value: '1_overdue', label: 'Просрочка', tone: 'red' }
  ]
};
function statusPill(name, value) {
  if (!value) return '<span style="color:#bfbfbf;">Не задан</span>';
  const o = (STATUS_OPTIONS[name] || []).find(function(x) { return x.value === value; });
  if (!o) return escRaw(value);
  const t = STATUS_TONES[o.tone];
  return '<span class="cm-pill" style="background:' + t.bg + ';border-color:' + t.border + ';color:' + t.fg + ';">' + escRaw(o.label) + '</span>';
}

// ---------- допстили: банк по БИК, контакты ----------
if (!document.getElementById('cm-extra-style')) {
  const st = document.createElement('style');
  st.id = 'cm-extra-style';
  st.textContent = `
    .cm-bik-hint { font-size: 12px; margin-top: 3px; min-height: 0; }
    .cm-field-msg { font-size: 12px; color: #cf1322; margin-top: 3px; }
    .cm-pill { display: inline-block; border: 1px solid; border-radius: 6px; padding: 4px 12px; font-size: 12px; line-height: 18px; font-weight: 500; white-space: nowrap; }
    .cm-derived-hint { font-size: 12px; color: #8c8c8c; margin-top: 3px; }
    .cm-derived-hint a { color: #1677ff; text-decoration: none; font-weight: 600; }
    .cm-price-hint { font-size: 12px; color: #8c8c8c; margin: 0 0 8px; }
    .cm-price-summary { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px; padding: 8px 12px; font-size: 13px; margin-bottom: 8px; line-height: 1.6; }
    .cm-price-summary b { color: #262626; }
    .cm-price-base { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; background: #f0f7ff; border: 1px solid #d6e8ff; border-radius: 6px; padding: 8px 12px; font-size: 13px; margin-bottom: 8px; }
    .cm-sched-badge { display: inline-block; font-size: 11px; color: #ad6800; background: #fff7e6; border: 1px solid #ffd591; border-radius: 4px; padding: 0 6px; margin-left: 6px; font-weight: 500; }
    .cm-price-summary .warn { color: #d48806; }
    .cm-price-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    .cm-price-row.now { background: #f6ffed; margin: 0 -8px; padding-left: 8px; padding-right: 8px; border-radius: 4px; }
    .cm-price-main { flex: 1; min-width: 0; }
    .cm-price-dates { font-weight: 600; font-size: 13.5px; color: #262626; }
    .cm-price-line { font-size: 13px; color: #595959; margin-top: 2px; }
    .cm-price-total { color: #262626; font-weight: 600; }
    .cm-price-form { margin-top: 10px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 6px; background: #fafafa; }
    .cm-price-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
    .cm-price-form-grid label { font-size: 12px; color: #8c8c8c; display: block; margin-bottom: 2px; }
    .cm-hist-row { padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .cm-hist-meta { color: #8c8c8c; font-size: 11.5px; margin-bottom: 1px; }
    .cm-hist-body { color: #262626; word-break: break-word; }
    .cm-completed-banner { background: #f6ffed; border: 1px solid #b7eb8f; color: #389e0d; border-radius: 6px; padding: 8px 12px; font-size: 13px; margin-bottom: 16px; }
    .cm-contact-card { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    .cm-contact-main { flex: 1; min-width: 0; }
    .cm-contact-name { font-weight: 600; font-size: 13.5px; color: #262626; }
    .cm-contact-pos { font-weight: 400; color: #8c8c8c; font-size: 12.5px; }
    .cm-contact-lines { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 2px; font-size: 13px; }
    .cm-contact-lines a { color: #1677ff; text-decoration: none; }
    .cm-contact-lines a:hover { text-decoration: underline; }
    .cm-contact-actions { display: flex; gap: 10px; flex-shrink: 0; }
    .cm-contact-actions a { color: #8c8c8c; text-decoration: none; cursor: pointer; }
    .cm-contact-actions a:hover { color: #1677ff; }
    .cm-contact-form { margin-top: 10px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 6px; background: #fafafa; }
    .cm-contact-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
  `;
  document.head.appendChild(st);
}

const bikCache = {};
async function lookupBik(bik) {
  if (Object.prototype.hasOwnProperty.call(bikCache, bik)) return bikCache[bik];
  const res = await ctx.api.resource('bik_directory').list({ filter: { bik: bik }, pageSize: 1 });
  const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  const rec = (Array.isArray(payload) && payload[0]) ? payload[0] : null;
  bikCache[bik] = rec;
  return rec;
}
function fireInput(el) {
  try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* ignore */ }
}
function attachBikLookup(el) {
  if (el.__cmBikLookup) return;
  el.__cmBikLookup = true;
  const scope = el.closest('.cm-stage-form') || el.closest('form') || el.parentNode;
  const hint = document.createElement('div');
  hint.className = 'cm-bik-hint';
  el.parentNode.appendChild(hint);
  let auto = null;
  let seq = 0;
  function setHint(color, text) { hint.style.color = color; hint.textContent = text; }
  function bankFields() {
    return { bn: scope.querySelector('[data-field="bank_name"]'), ca: scope.querySelector('[data-field="corr_account"]') };
  }
  function lock(inp, on) {
    if (!inp) return;
    inp.readOnly = !!on;
    inp.style.background = on ? '#f5f5f5' : '';
  }
  function unlockBank() { const f = bankFields(); lock(f.bn, false); lock(f.ca, false); }
  function clearAuto() {
    unlockBank();
    if (!auto) return;
    const f = bankFields();
    if (f.bn && f.bn.value === auto.bank) { f.bn.value = ''; fireInput(f.bn); }
    if (f.ca && f.ca.value === auto.corr) { f.ca.value = ''; fireInput(f.ca); }
    auto = null;
  }
  function paint() {
    el.style.borderColor = el.__bikState === 'ok' ? '#52c41a' : (el.__bikState === 'bad' ? '#ff4d4f' : '');
    if (typeof revalidateAccounts === 'function') revalidateAccounts(scope);
  }
  async function run() {
    const my = ++seq;
    const v = el.value;
    if (!v) { el.__bikState = ''; setHint('#8c8c8c', ''); clearAuto(); paint(); return; }
    if (v.length !== 9) { el.__bikState = 'partial'; setHint('#8c8c8c', 'Введите 9 цифр БИК (ещё ' + (9 - v.length) + ')'); clearAuto(); paint(); return; }
    if (v.slice(0, 2) !== '04') { el.__bikState = 'bad'; setHint('#cf1322', '✗ Некорректный БИК: у российских банков он начинается с 04'); clearAuto(); paint(); return; }
    el.__bikState = 'pending'; setHint('#8c8c8c', 'Проверяю БИК…'); paint();
    let rec = null;
    try { rec = await lookupBik(v); }
    catch (e) { if (my !== seq) return; el.__bikState = 'unknown'; setHint('#d48806', 'Справочник БИК сейчас недоступен — данные банка введите вручную'); paint(); return; }
    if (my !== seq || el.value !== v) return;
    if (!rec) { el.__bikState = 'bad'; clearAuto(); setHint('#cf1322', '✗ Некорректный БИК — банка с таким БИК нет в справочнике ЦБ'); paint(); return; }
    el.__bikState = 'ok';
    setHint('#389e0d', '✓ БИК корректен · ' + rec.bank_name + (rec.city ? ' · ' + rec.city : ''));
    const f = bankFields();
    auto = { bank: rec.bank_name || '', corr: rec.corr_account || '' };
    if (f.bn) { if (f.bn.value !== auto.bank) { f.bn.value = auto.bank; fireInput(f.bn); } lock(f.bn, !!auto.bank); }
    if (f.ca) { if (f.ca.value !== auto.corr) { f.ca.value = auto.corr; fireInput(f.ca); } lock(f.ca, !!auto.corr); }
    paint();
  }
  el.addEventListener('input', run);
  if (el.value) run();
}

// ---------- реквизиты арендатора по ИНН из DaData (findById/party) ----------
// Ключ хранится в коллекции app_settings (name = dadata_token), не в коде: репозиторий публичный.
const PARTY_STATUS = { LIQUIDATING: 'ликвидируется', LIQUIDATED: 'ликвидирована', BANKRUPT: 'банкротство', REORGANIZING: 'реорганизация' };
const PARTY_FIELDS = ['tenant_name', 'kpp', 'ogrn', 'legal_address', 'director'];
window.__cmPartyCache = window.__cmPartyCache || {};
function dadataToken() {
  if (!window.__cmDadataToken) {
    window.__cmDadataToken = ctx.api.resource('app_settings').list({ filter: { name: 'dadata_token' }, pageSize: 1 }).then(function(res) {
      const rows = histPayload(res);
      return (Array.isArray(rows) && rows[0] && rows[0].value) ? String(rows[0].value).trim() : null;
    }).catch(function() { window.__cmDadataToken = null; return null; });
  }
  return window.__cmDadataToken;
}
// { found:false } | { found:true, values:{…поля договора}, status, statusText, name } ; null — DaData недоступна
async function lookupParty(inn) {
  if (window.__cmPartyCache[inn]) return window.__cmPartyCache[inn];
  const token = await dadataToken();
  if (!token) return null;
  const r = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Token ' + token },
    body: JSON.stringify({ query: inn, count: 1, branch_type: 'MAIN' })
  });
  if (!r.ok) return null;
  const j = await r.json();
  const sug = j && j.suggestions && j.suggestions[0];
  let out;
  if (!sug) out = { found: false };
  else {
    const d = sug.data || {};
    const st = (d.state && d.state.status) || '';
    const liq = d.state && d.state.liquidation_date ? fromISODateDisplay(dateToIso(new Date(d.state.liquidation_date))) : '';
    const mgmt = d.management && d.management.name ? (d.management.post ? d.management.post.charAt(0) + d.management.post.slice(1).toLowerCase() + ' ' : '') + d.management.name : '';
    out = { found: true, name: sug.value, status: st, statusText: PARTY_STATUS[st] ? PARTY_STATUS[st] + (st === 'LIQUIDATED' && liq ? ' ' + liq : '') : '',
      values: {
        tenant_name: (d.name && d.name.short_with_opf) || sug.value || '',
        kpp: d.kpp || '',
        ogrn: d.ogrn || '',
        legal_address: (d.address && (d.address.unrestricted_value || d.address.value)) || '',
        director: d.type === 'INDIVIDUAL' ? '' : mgmt
      } };
  }
  window.__cmPartyCache[inn] = out;
  return out;
}
function partyStatusBadge(p) {
  return p && p.statusText ? '<span class="cm-sched-badge" style="color:#cf1322;background:#fff2f0;border-color:#ffccc7;">⚠ ' + escRaw(p.statusText) + '</span>' : '';
}
function attachInnLookup(el) {
  if (el.__cmInnLookup) return;
  el.__cmInnLookup = true;
  const scope = el.closest('.cm-stage-form') || el.closest('[data-active-form]') || el.parentNode;
  const hint = document.createElement('div');
  hint.className = 'cm-bik-hint';
  el.parentNode.appendChild(hint);
  let seq = 0;
  async function run() {
    const my = ++seq;
    const v = String(el.value || '').replace(/\D/g, '');
    if (!/^(\d{10}|\d{12})$/.test(v) || !innValid(v)) { hint.innerHTML = ''; return; }
    hint.style.color = '#8c8c8c'; hint.textContent = 'Ищу организацию по ИНН…';
    let p = null;
    try { p = await lookupParty(v); } catch (e) { p = null; }
    if (my !== seq) return;
    if (!p) { hint.style.color = '#8c8c8c'; hint.textContent = 'Сервис проверки ИНН сейчас недоступен — реквизиты введите вручную'; return; }
    if (!p.found) { hint.style.color = '#d48806'; hint.textContent = 'Организация с таким ИНН не найдена в ЕГРЮЛ/ЕГРИП'; return; }
    const val = p.values;
    const differs = PARTY_FIELDS.some(function(n) { const f = scope.querySelector('[data-field="' + n + '"]'); return val[n] && (!f || f.value !== val[n]); });
    hint.style.color = '#389e0d';
    hint.innerHTML = '✓ ' + escRaw(p.name) + partyStatusBadge(p)
      + '<div style="color:#8c8c8c;margin-top:2px;">' + escRaw([val.kpp && 'КПП ' + val.kpp, val.ogrn && 'ОГРН ' + val.ogrn, val.legal_address, val.director].filter(Boolean).join(' · ')) + '</div>'
      + (differs ? '<a href="#" class="cm-party-apply" style="color:#1677ff;font-weight:600;text-decoration:none;">Подставить реквизиты</a>' : '');
    const a = hint.querySelector('.cm-party-apply');
    if (a) a.addEventListener('click', async function(e) {
      e.preventDefault();
      const extra = {};
      PARTY_FIELDS.forEach(function(n) {
        if (!val[n]) return;
        const f = scope.querySelector('[data-field="' + n + '"]');
        if (f) { if (f.value !== val[n]) { f.value = val[n]; fireInput(f); } }
        else extra[n] = val[n];
      });
      // в активном договоре «Арендатор» — в другом блоке: сохраняем его сразу
      const root = el.closest('#contract-modal-root');
      if (Object.keys(extra).length && root && root.__cmActiveId && root.__cmActiveRec) {
        const rec = root.__cmActiveRec;
        Object.keys(extra).forEach(function(k) { if (rec[k] === extra[k]) delete extra[k]; });
        if (Object.keys(extra).length) {
          try { await updateWithHistory('rental_contracts', root.__cmActiveId, extra); Object.assign(rec, extra); renderAllActiveReadonly(root, rec); }
          catch (err) { cmToast('Не удалось сохранить название арендатора'); }
        }
      }
      cmToast('Реквизиты подставлены из ЕГРЮЛ — проверьте и сохраните');
      run();
    });
  }
  el.addEventListener('input', run);
  if (el.value) run();
}
// метка «ликвидирована / банкротство» у ИНН в режиме просмотра карточки
async function paintInnStatus(root) {
  const cells = root.querySelectorAll('[data-inn-ro]');
  for (let i = 0; i < cells.length; i++) {
    const inn = cells[i].getAttribute('data-inn-ro');
    if (!/^(\d{10}|\d{12})$/.test(inn) || cells[i].__cmPainted === inn) continue;
    let p = null;
    try { p = await lookupParty(inn); } catch (e) { p = null; }
    if (!p || !p.found) continue;
    cells[i].__cmPainted = inn;
    cells[i].insertAdjacentHTML('beforeend', partyStatusBadge(p));
  }
}

async function purgeContractSideData(type, id) {
  const q = '?filter=' + encodeURIComponent(JSON.stringify({ contract_type: type, contract_ref_id: id }));
  const names = ['contract_contacts', 'contract_addendums', 'contract_history', 'contract_price_periods'];
  for (let i = 0; i < names.length; i++) {
    try { await fetch('/api/' + names[i] + ':destroy' + q, { method: 'POST', headers: { Authorization: 'Bearer ' + authToken() } }); }
    catch (e) { /* best-effort */ }
  }
}

function renderContactsSection(prefix) {
  return '<div class="cm-section" id="' + prefix + '-contacts-section">'
    + '<div class="cm-section-title-row"><div class="cm-section-title" style="margin-bottom:0;flex:1;">Дополнительные контакты</div>'
    + '<button class="cm-stage-edit-toggle" id="' + prefix + '-contact-add-btn" style="display:none;">+ Контакт</button></div>'
    + '<div id="' + prefix + '-contacts-list"><div style="color:#999;font-size:12px;">Загрузка…</div></div>'
    + '<div class="cm-contact-form" id="' + prefix + '-contact-form" style="display:none;">'
    + '<div class="cm-contact-form-grid">'
    + '<input type="text" class="cm-field-input" id="' + prefix + '-contact-name" placeholder="ФИО">'
    + '<input type="text" class="cm-field-input" id="' + prefix + '-contact-position" placeholder="Должность / комментарий">'
    + '<input type="tel" class="cm-field-input" id="' + prefix + '-contact-phone" placeholder="+7 (___) ___-__-__">'
    + '<input type="email" class="cm-field-input" id="' + prefix + '-contact-email" placeholder="name@example.com">'
    + '</div>'
    + '<div class="cm-stage-edit-actions"><button class="cm-btn-save" id="' + prefix + '-contact-save">Сохранить</button>'
    + '<button class="cm-btn-save" id="' + prefix + '-contact-cancel">Отмена</button>'
    + '<span id="' + prefix + '-contact-status" style="font-size:12px;color:#999;align-self:center;"></span></div>'
    + '</div></div>';
}

function renderContactsList(items, canEdit) {
  if (!items.length) return '<div style="color:#bbb;font-size:12px;">Дополнительных контактов нет' + (canEdit ? ' — добавьте кнопкой «+ Контакт»' : '') + '</div>';
  return items.map(function(c) {
    const lines = (c.phone ? '<a href="tel:' + escAttr(String(c.phone).replace(/[^\d+]/g, '')) + '">' + esc(formatPhoneDisplay(c.phone)) + '</a>' : '')
      + (c.email ? '<a href="mailto:' + escAttr(c.email) + '">' + esc(c.email) + '</a>' : '');
    return '<div class="cm-contact-card" data-contact-id="' + c.id + '"><div class="cm-contact-main">'
      + '<div class="cm-contact-name">' + (c.name ? esc(c.name) : '<span style="color:#8c8c8c;">Без имени</span>')
      + (c.position ? '<span class="cm-contact-pos"> · ' + esc(c.position) + '</span>' : '') + '</div>'
      + (lines ? '<div class="cm-contact-lines">' + lines + '</div>' : '')
      + '</div>'
      + (canEdit ? '<div class="cm-contact-actions"><a data-contact-edit="' + c.id + '" title="Изменить">✎</a><a data-contact-del="' + c.id + '" title="Удалить">✕</a></div>' : '')
      + '</div>';
  }).join('');
}

async function loadContacts(contractType, contractId) {
  const res = await ctx.api.resource('contract_contacts').list({
    filter: { contract_type: contractType, contract_ref_id: contractId }, sort: ['id'], pageSize: 200
  });
  const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  return Array.isArray(payload) ? payload : [];
}

async function wireContacts(overlay, prefix, contractType, contractId, canEdit) {
  const listEl = overlay.querySelector('#' + prefix + '-contacts-list');
  if (!listEl) return;
  const addBtn = overlay.querySelector('#' + prefix + '-contact-add-btn');
  const formEl = overlay.querySelector('#' + prefix + '-contact-form');
  const nameEl = overlay.querySelector('#' + prefix + '-contact-name');
  const posEl = overlay.querySelector('#' + prefix + '-contact-position');
  const phoneEl = overlay.querySelector('#' + prefix + '-contact-phone');
  const emailEl = overlay.querySelector('#' + prefix + '-contact-email');
  const saveBtn = overlay.querySelector('#' + prefix + '-contact-save');
  const cancelBtn = overlay.querySelector('#' + prefix + '-contact-cancel');
  const statusEl = overlay.querySelector('#' + prefix + '-contact-status');
  let items = [];
  let editId = null;

  async function refresh() {
    try { items = await loadContacts(contractType, contractId); }
    catch (e) { listEl.innerHTML = '<span style="color:#c0392b;font-size:12px;">Не удалось загрузить контакты</span>'; return; }
    listEl.innerHTML = renderContactsList(items, canEdit);
    if (!canEdit) return;
    listEl.querySelectorAll('[data-contact-edit]').forEach(function(a) {
      a.addEventListener('click', function() {
        const c = items.find(function(x) { return String(x.id) === a.getAttribute('data-contact-edit'); });
        if (c) openForm(c);
      });
    });
    listEl.querySelectorAll('[data-contact-del]').forEach(function(a) {
      a.addEventListener('click', async function() {
        const c = items.find(function(x) { return String(x.id) === a.getAttribute('data-contact-del'); });
        if (!c) return;
        if (!(await cmConfirm('Удалить контакт «' + (c.name || c.phone || c.email || 'без имени') + '»?'))) return;
        try { await ctx.api.resource('contract_contacts').destroy({ filterByTk: c.id }); logHistory(contractType, contractId, [{ action: 'contact', text: 'Удалён контакт: ' + contactSummary(c) }]); await refresh(); }
        catch (e) { cmToast('Не удалось удалить контакт'); }
      });
    });
  }
  await refresh();
  if (!canEdit || !addBtn) return;

  addBtn.style.display = '';
  phoneEl.addEventListener('input', function() { formatPhoneInput(phoneEl); });
  nameEl.addEventListener('input', function() { const v = sanitizeFio(nameEl.value); if (v !== nameEl.value) nameEl.value = v; });
  emailEl.addEventListener('input', function() { const v = emailEl.value.replace(/\s/g, ''); if (v !== emailEl.value) emailEl.value = v; });

  function openForm(c) {
    editId = c ? c.id : null;
    nameEl.value = c ? (c.name || '') : '';
    posEl.value = c ? (c.position || '') : '';
    phoneEl.value = c ? (c.phone ? formatPhoneDisplay(c.phone) : '') : '';
    emailEl.value = c ? (c.email || '') : '';
    formEl.style.display = 'block';
    nameEl.focus();
  }
  function closeForm() { formEl.style.display = 'none'; editId = null; statusEl.textContent = ''; }

  addBtn.addEventListener('click', function() { if (formEl.style.display === 'none') openForm(null); else closeForm(); });
  cancelBtn.addEventListener('click', closeForm);
  saveBtn.addEventListener('click', async function() {
    const values = {
      contract_type: contractType, contract_ref_id: contractId,
      name: normalizeValue('tenant_fio', nameEl.value), position: posEl.value.trim(),
      phone: normalizeValue('phone', phoneEl.value), email: normalizeValue('email', emailEl.value)
    };
    if (!values.name && !values.phone && !values.email) { cmToast('Заполните хотя бы ФИО, телефон или почту'); return; }
    const cErr = validateValue('tenant_fio', values.name, null) || validateValue('phone', values.phone, null) || validateValue('email', values.email, null);
    if (cErr) { cmToast(cErr); return; }
    saveBtn.disabled = true;
    statusEl.textContent = 'Сохранение…';
    try {
      if (editId) await ctx.api.resource('contract_contacts').update({ filterByTk: editId, values: values });
      else await ctx.api.resource('contract_contacts').create({ values: values });
      logHistory(contractType, contractId, [{ action: 'contact', text: (editId ? 'Изменён контакт: ' : 'Добавлен контакт: ') + contactSummary(values) }]);
      closeForm();
      await refresh();
    } catch (e) {
      cmToast('Не удалось сохранить контакт');
      statusEl.textContent = '';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

async function openCompletedContractModal(id) {
  const overlay = document.createElement('div');
  overlay.id = 'contract-modal-root';
  overlay.innerHTML = `
    <div class="ant-modal-mask" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;"></div>
    <div class="ant-modal-wrap" style="position:fixed;inset:0;z-index:1001;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;">
      <div class="ant-modal" style="width:100%;max-width:min(1800px, 96vw);">
        <div class="ant-modal-content" style="position:relative;background:#fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.12);display:flex;flex-direction:column;max-height:92vh;">
          <div class="cm-modal-toolbar">
            <button id="cm-delete-btn" style="display:none;border:1px solid #ffccc7;background:#fff2f0;color:#cf1322;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">Удалить договор</button>
            <button id="cm-close-btn" class="ant-modal-close" style="border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;color:rgba(0,0,0,0.45);padding:4px;">✕</button>
          </div>
          <div class="ant-modal-header" style="padding:16px 24px;border-bottom:1px solid #f0f0f0;border-radius:8px 8px 0 0;flex-shrink:0;">
            <div class="ant-modal-title" style="font-weight:600;font-size:16px;">Договор в архиве</div>
          </div>
          <div class="cm-body-flex" style="flex:1;min-height:0;">
            <div class="cm-chat-col" id="cm-chat-col">
              <div class="cm-chat-head" id="cm-chat-head" title="Участники и медиафайлы по договору">
                <div class="cm-chat-title">Переписка по договору</div>
                <div class="cm-chat-head-hint">Участники · Медиа ›</div>
              </div>
              <div class="cm-chat-messages" id="cm-chat-messages">Загрузка…</div>
              <div id="cm-chat-input-area"></div>
            </div>
            <div class="cm-info-panel" id="cm-info-panel"></div>
            <div class="cm-data-col" id="cm-body" style="color:#8c8c8c;">Загрузка…</div>
          </div>
          <div class="cm-members-footer" id="cm-members-footer">
            <div class="cm-members-head">
              <div class="cm-members-title">Сотрудники по договору</div>
              <button id="cm-members-add-btn" class="cm-members-add-btn" title="Добавить сотрудника" style="display:none;">+</button>
              <div class="cm-add-popover" id="cm-add-popover">
                <div class="cm-add-popover-title">Добавить сотрудника</div>
                <div class="cm-add-popover-list" id="cm-add-popover-list">Загрузка…</div>
              </div>
            </div>
            <div id="cm-members-list"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  markContractNotificationsRead('completed', id);
  overlay.querySelector('.ant-modal-mask').addEventListener('click', closeContractModal);
  overlay.querySelector('#cm-close-btn').addEventListener('click', closeContractModal);
  document.addEventListener('keydown', onModalEscape);
  setTimeout(function() { overlay.classList.add('cm-open'); }, 20);

  const body = overlay.querySelector('#cm-body');
  try {
    const currentUser = await getCurrentUser();
    const res = await ctx.api.resource('completed_contracts').get({ filterByTk: id, appends: ['contract_files', 'contract_members'] });
    const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
    const members = r.contract_members || [];
    const isMember = !!(currentUser && members.some(function(m) { return m.id === currentUser.id; }));
    const contractNumber = r.contract_number || ('#' + id);
    const state = { members: members };

    if (currentUser && currentUser.__isAdmin) {
      const delBtn = overlay.querySelector('#cm-delete-btn');
      delBtn.style.display = '';
      delBtn.addEventListener('click', async function() {
        if (!(await cmConfirm('Удалить договор из архива «' + contractNumber + '» безвозвратно? Это действие нельзя отменить.'))) return;
        delBtn.disabled = true;
        try {
          await ctx.api.resource('completed_contracts').destroy({ filterByTk: id });
          await purgeContractSideData('completed', id);
          try {
            await fetch('/api/contract_chat_messages:destroy?filter=' + encodeURIComponent(JSON.stringify({ owner_contract_id: id, source: 'completed' })), {
              method: 'POST', headers: { Authorization: 'Bearer ' + authToken() }
            });
          } catch (e) { /* best-effort */ }
          closeContractModal();
          cmToast('Договор удалён');
          setTimeout(function() { location.reload(); }, 400);
        } catch (e) {
          cmToast('Не удалось удалить договор');
          delBtn.disabled = false;
        }
      });
    }

    initChat(id, overlay, currentUser, isMember, contractNumber, state, 'completed');

    let html = '<div class="cm-completed-banner">Договор в архиве · только просмотр</div>';
    html += ACTIVE_BLOCK_DEFS.filter(function(b) { return !b.activeOnly; }).map(function(block) { return renderActiveBlockSection(block, r) + (block.key === 'pay' ? renderPricesSection('cm-completed') : '') + (block.key === 'counterparty' ? renderContactsSection('cm-completed') : ''); }).join('');
    const files = r.contract_files || [];
    html += '<div class="cm-section" id="cm-completed-files-section" style="margin-bottom:0;"><div class="cm-section-title">Файлы</div>'
      + '<div id="cm-completed-files-list">' + renderFilesList(files, null) + '</div></div>'
      + renderAddendumsSection('cm-completed')
      + renderHistorySection('cm-completed');

    body.style.color = '';
    body.innerHTML = html;
    paintInnStatus(overlay);
    await wireAddendums(overlay, 'cm-completed', 'completed', id, currentUser);
    const addAddBtn = overlay.querySelector('#cm-completed-addendum-add-btn');
    if (addAddBtn) addAddBtn.style.display = 'none';
    await wireContacts(overlay, 'cm-completed', 'completed', id, false);
    await wirePrices(overlay, 'cm-completed', 'completed', id, false, r);
    wireHistory(overlay, 'cm-completed', 'completed', id);
    bindFileOpenLinks(overlay);

    initMembers(id, overlay, members, !!(currentUser && currentUser.__isAdmin), contractNumber, state, 'completed_contracts', 'completed');
  } catch (e) {
    body.innerHTML = '<span style="color:#c0392b;">Ошибка загрузки договора: ' + esc(e && e.message ? e.message : e) + '</span>';
  }
}

async function openContractModal(id) {
  const overlay = document.createElement('div');
  overlay.id = 'contract-modal-root';
  overlay.innerHTML = `
    <div class="ant-modal-mask" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;"></div>
    <div class="ant-modal-wrap" style="position:fixed;inset:0;z-index:1001;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;">
      <div class="ant-modal" style="width:100%;max-width:min(1800px, 96vw);">
        <div class="ant-modal-content" style="position:relative;background:#fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.12);display:flex;flex-direction:column;max-height:92vh;">
          <div class="cm-modal-toolbar">
            <button id="cm-complete-btn" style="display:none;border:1px solid #b7eb8f;background:#f6ffed;color:#389e0d;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">Завершить договор</button>
            <button id="cm-delete-btn" style="display:none;border:1px solid #ffccc7;background:#fff2f0;color:#cf1322;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">Удалить договор</button>
            <button id="cm-close-btn" class="ant-modal-close" style="border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;color:rgba(0,0,0,0.45);padding:4px;">✕</button>
          </div>
          <div class="ant-modal-header" style="padding:16px 24px;border-bottom:1px solid #f0f0f0;border-radius:8px 8px 0 0;flex-shrink:0;">
            <div class="ant-modal-title" style="font-weight:600;font-size:16px;">Карточка договора</div>
          </div>
          <div class="cm-body-flex" style="flex:1;min-height:0;">
            <div class="cm-chat-col" id="cm-chat-col">
              <div class="cm-chat-head" id="cm-chat-head" title="Участники и медиафайлы по договору">
                <div class="cm-chat-title">Переписка по договору</div>
                <div class="cm-chat-head-hint">Участники · Медиа ›</div>
              </div>
              <div class="cm-chat-messages" id="cm-chat-messages">Загрузка…</div>
              <div id="cm-chat-input-area"></div>
            </div>
            <div class="cm-info-panel" id="cm-info-panel"></div>
            <div class="cm-data-col" id="cm-body" style="color:#8c8c8c;">Загрузка…</div>
          </div>
          <div class="cm-members-footer" id="cm-members-footer">
            <div class="cm-members-head">
              <div class="cm-members-title">Сотрудники по договору</div>
              <button id="cm-members-add-btn" class="cm-members-add-btn" title="Добавить сотрудника" style="display:none;">+</button>
              <div class="cm-add-popover" id="cm-add-popover">
                <div class="cm-add-popover-title">Добавить сотрудника</div>
                <div class="cm-add-popover-list" id="cm-add-popover-list">Загрузка…</div>
              </div>
            </div>
            <div id="cm-members-list"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  markContractNotificationsRead('active', id);
  overlay.querySelector('.ant-modal-mask').addEventListener('click', closeContractModal);
  overlay.querySelector('#cm-close-btn').addEventListener('click', closeContractModal);
  document.addEventListener('keydown', onModalEscape);
  setTimeout(function() { overlay.classList.add('cm-open'); }, 20);

  const body = overlay.querySelector('#cm-body');
  try {
    const currentUser = await getCurrentUser();
    const res = await ctx.api.resource('rental_contracts').get({ filterByTk: id, appends: ['contract_files', 'contract_members'] });
    const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
    r.__kind = 'active';
    const members = r.contract_members || [];
    const isMember = !!(currentUser && members.some(function(m) { return m.id === currentUser.id; }));
    const contractNumber = r.contract_number || ('#' + id);
    const state = { members: members };

    if (currentUser && currentUser.__isAdmin) {
      const delBtn = overlay.querySelector('#cm-delete-btn');
      delBtn.style.display = '';
      delBtn.addEventListener('click', async function() {
        if (!(await cmConfirm('Удалить договор «' + contractNumber + '» безвозвратно? Это действие нельзя отменить.'))) return;
        delBtn.disabled = true;
        try {
          await ctx.api.resource('rental_contracts').destroy({ filterByTk: id });
          await purgeContractSideData('active', id);
          try {
            await fetch('/api/contract_chat_messages:destroy?filter=' + encodeURIComponent(JSON.stringify({ owner_contract_id: id, source: 'active' })), {
              method: 'POST', headers: { Authorization: 'Bearer ' + authToken() }
            });
          } catch (e) { /* best-effort */ }
          closeContractModal();
          cmToast('Договор удалён');
          setTimeout(function() { location.reload(); }, 400);
        } catch (e) {
          cmToast('Не удалось удалить договор');
          delBtn.disabled = false;
        }
      });

      const compBtn = overlay.querySelector('#cm-complete-btn');
      compBtn.style.display = '';
      compBtn.addEventListener('click', async function() {
        await completeContract(id, members, contractNumber);
      });
    }

    initChat(id, overlay, currentUser, isMember, contractNumber, state);

    let html = '';
    html += ACTIVE_BLOCK_DEFS.map(function(block) { return renderActiveBlockSection(block, r) + (block.key === 'pay' ? renderPricesSection('cm-active') : '') + (block.key === 'counterparty' ? renderContactsSection('cm-active') : ''); }).join('');

    const files = r.contract_files || [];
    html += '<div class="cm-section" id="cm-active-files-section" style="margin-bottom:0;"><div class="cm-section-title">Файлы</div>'
      + '<div id="cm-active-files-list">' + renderFilesList(files, currentUser) + '</div>'
      + '<div class="cm-upload-row"><input type="file" id="cm-active-file-input" style="display:none;">'
      + '<button class="cm-upload-btn" id="cm-active-upload-btn">+ Прикрепить файл</button>'
      + '<span id="cm-active-upload-status" style="font-size:12px;color:#999;"></span></div></div>'
      + renderAddendumsSection('cm-active')
      + renderHistorySection('cm-active');

    body.style.color = '';
    body.innerHTML = html;
    paintInnStatus(overlay);
    await wireAddendums(overlay, 'cm-active', 'active', id, currentUser);
    await wireContacts(overlay, 'cm-active', 'active', id, canEditActiveBlocks(currentUser));
    await wirePrices(overlay, 'cm-active', 'active', id, canEditActiveBlocks(currentUser), r);
    wireDerivedHints(overlay);
    wireHistory(overlay, 'cm-active', 'active', id);
    wireActiveBlockEdits(overlay, id, r, currentUser);

    async function refreshActiveFiles() {
      const res2 = await ctx.api.resource('rental_contracts').get({ filterByTk: id, appends: ['contract_files'] });
      const r2 = (res2 && res2.data && res2.data.data) ? res2.data.data : (res2 && res2.data) ? res2.data : res2;
      const listEl = overlay.querySelector('#cm-active-files-list');
      if (listEl) listEl.innerHTML = renderFilesList(r2.contract_files || [], currentUser);
      bindFileOpenLinks(overlay);
      bindFileDeleteLinks(overlay, id, 'rental_contracts', refreshActiveFiles);
    }

    bindFileOpenLinks(overlay);
    bindFileDeleteLinks(overlay, id, 'rental_contracts', refreshActiveFiles);
    bindFileUpload(overlay, id, 'rental_contracts', { input: 'cm-active-file-input', btn: 'cm-active-upload-btn', status: 'cm-active-upload-status' }, refreshActiveFiles);

    initMembers(id, overlay, members, !!(currentUser && currentUser.__isAdmin), contractNumber, state);
  } catch (e) {
    body.innerHTML = '<span style="color:#c0392b;">Ошибка загрузки договора: ' + esc(e && e.message ? e.message : e) + '</span>';
  }
}
window.openContractModal = openContractModal;

const STAGE_DEFS = [
  { title: 'Заявка на аренду', role: 'rental_dept', fields: [
      { name: 'object_name', label: 'Объект', type: 'combo', listId: 'cm-object-datalist' },
      { name: 'area_sqm', label: 'Площадь, кв.м.', type: 'text' },
      { name: 'rent_per_sqm', label: 'Аренда / 1 кв.м.', type: 'text' },
      { name: 'utility_per_sqm', label: 'Э.С. / 1 кв.м.', type: 'text' },
      { name: 'comment_stage0', label: 'Комментарий по заявке', type: 'textarea' }
  ]},
  { title: 'Размещение объявления', role: 'rental_dept', fields: [
      { name: 'avito_url', label: 'Ссылка Авито', type: 'url' },
      { name: 'cian_url', label: 'Ссылка Циан', type: 'url' },
      { name: 'other_url', label: 'Ссылка ещё где-то', type: 'url' }
  ]},
  { title: 'Согласование условий', role: 'legal_dept', fields: [
      { name: 'date_signed', label: 'Дата подписания Договора', type: 'date' },
      { name: 'date_act', label: 'Дата подписания Акта', type: 'date' },
      { name: 'purpose', label: 'Назначение по Договору', type: 'text' },
      { name: 'comment_stage2', label: 'Комментарий по условиям', type: 'textarea' }
  ]},
  { title: 'Подписание договора / Данные контрагента', role: 'accounting_dept', fields: [
      { name: 'contract_number', label: 'Номер Договора', type: 'text' },
      { name: 'end_date', label: 'Дата окончания Договора', type: 'date' },
      { name: 'tenant_name', label: 'Арендатор', type: 'text' },
      { name: 'inn', label: 'ИНН', type: 'text' },
      { name: 'kpp', label: 'КПП', type: 'text' },
      { name: 'ogrn', label: 'ОГРН / ОГРНИП', type: 'text' },
      { name: 'legal_address', label: 'Юридический адрес', type: 'text' },
      { name: 'director', label: 'Руководитель', type: 'text' },
      { name: 'tenant_fio', label: 'Контактное лицо', type: 'text' },
      { name: 'email', label: 'Эл. почта', type: 'email' },
      { name: 'phone', label: 'Телефон', type: 'tel' },
      { name: 'bank_account', label: 'Расчётный счёт', type: 'text', mask: 'bankaccount' },
      { name: 'bik', label: 'БИК', type: 'text', mask: 'bik' },
      { name: 'bank_name', label: 'Банк', type: 'text' },
      { name: 'corr_account', label: 'Корр. счёт', type: 'text', mask: 'bankaccount' },
      { name: 'signing_method', label: 'Способ подписания', type: 'select', options: ['ЭДО', 'Лично'] },
      { name: 'notes', label: 'Примечания', type: 'textarea' }
  ]},
  { title: 'Оплата счетов', role: 'legal_dept', fields: [
      { name: 'total_amount', label: 'Сумма договора', type: 'money' },
      { name: 'deposit_amount', label: 'Обеспечительный платёж (ОП)', type: 'text' },
      { name: 'deposit_invoiced', label: 'Счёт ОП выставлен', type: 'checkbox' },
      { name: 'deposit_paid', label: 'Счёт ОП оплачен', type: 'checkbox' },
      { name: 'rent_amount', label: 'Арендная плата (АП)', type: 'text' },
      { name: 'rent_invoiced', label: 'Счёт АП выставлен', type: 'checkbox' },
      { name: 'rent_paid', label: 'Счёт АП оплачен', type: 'checkbox' },
      { name: 'utility_amount', label: 'Эксплуатационный сбор (ЭС)', type: 'text' },
      { name: 'utility_invoiced', label: 'Счёт ЭС выставлен', type: 'checkbox' },
      { name: 'utility_paid', label: 'Счёт ЭС оплачен', type: 'checkbox' },
      { name: 'comment_stage4', label: 'Комментарий по счетам', type: 'textarea' }
  ]},
  { title: 'Финал (Акт и Скан)', role: 'legal_dept', fields: [
      { name: 'actual_start_date', label: 'Дата фактического начала аренды', type: 'date' },
      { name: 'contract_scan_url', label: 'Скан подписанного Договора (имя файла)', type: 'text' },
      { name: 'act_scan_url', label: 'Скан подписанного Акта (имя файла)', type: 'text' }
  ]}
];
const STAGE_ROLE_TITLES = { rental_dept: 'Отдел Аренды', legal_dept: 'Юр. отдел - Договоры', accounting_dept: 'Бухгалтерия' };

function hasRole(user, roleName) {
  if (!user) return false;
  if (user.__isAdmin) return true;
  const names = (user.roles || []).map(function(r) { return r.name; });
  return names.indexOf(roleName) !== -1;
}

function readonlyFieldValue(f, r) {
  const v = r[f.name];
  if (f.type === 'checkbox') return v ? 'Да' : 'Нет';
  if (f.name === 'end_date' && r.__kind === 'active') return esc(fromISODateDisplay(v)) + expiryBadge(v, r.termination_date);
  if (f.type === 'date') return esc(fromISODateDisplay(v));
  if ((f.name === 'rent_amount' || f.name === 'rent_per_sqm') && r.__schedNow) {
    return (v === null || v === undefined || v === '' ? '—' : money(v)) + '<span class="cm-sched-badge" title="Основная цена: ' + escAttr(basePriceLabel(r)) + '">по графику до ' + esc(fmtDate(r.__schedNow.date_to)) + '</span>';
  }
  if (f.name === 'inn' && v) return '<span data-inn-ro="' + escAttr(String(v).replace(/\D/g, '')) + '">' + esc(v) + '</span>';
  if (f.type === 'money') return money(v);
  if (f.type === 'status') return statusPill(f.name, v);
  if (f.type === 'url') return linkHtml(v);
  if (f.type === 'textarea') return linkifyText(v);
  if (f.name === 'area_sqm') return formatNum(v);
  return esc(v);
}

function renderEditableField(f, value) {
  if (f.type === 'checkbox') {
    return '<label class="cm-field-checkbox"><input type="checkbox" data-field="' + f.name + '" ' + (value ? 'checked' : '') + '> ' + esc(f.label) + '</label>';
  }
  if (f.type === 'textarea') {
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><textarea class="cm-field-input" data-field="' + f.name + '" rows="2">' + escAttr(value) + '</textarea></div>';
  }
  if (f.type === 'combo') {
    return '<div class="cm-field-row" style="position:relative;"><div class="cm-label">' + esc(f.label) + '</div>'
      + '<input type="text" class="cm-field-input" data-field="' + f.name + '" data-combo="1" autocomplete="off" placeholder="Введите или выберите из списка" value="' + escAttr(value) + '">'
      + '<div class="cm-combo-list" id="cm-combo-list-' + f.name + '" style="display:none;"></div></div>';
  }
  if (f.type === 'date') {
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><input type="date" class="cm-field-input" data-field="' + f.name + '" value="' + escAttr(toISODate(value)) + '"></div>';
  }
  if (f.type === 'tel') {
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><input type="tel" class="cm-field-input" data-field="' + f.name + '" data-mask="phone" placeholder="+7 (___) ___-__-__" value="' + escAttr(value) + '"></div>';
  }
  if (f.type === 'email') {
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><input type="email" class="cm-field-input" data-field="' + f.name + '" placeholder="name@example.com" value="' + escAttr(value) + '"></div>';
  }
  if (f.type === 'select') {
    const opts = (f.options || []).map(function(o) {
      return '<option value="' + escAttr(o) + '"' + (value === o ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('');
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><select class="cm-field-input" data-field="' + f.name + '"><option value=""' + (!value ? ' selected' : '') + '>Не выбрано</option>' + opts + '</select></div>';
  }
  if (f.type === 'status') {
    const opts = (STATUS_OPTIONS[f.name] || []).map(function(o) {
      return '<option value="' + escAttr(o.value) + '"' + (value === o.value ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><select class="cm-field-input" data-field="' + f.name + '"><option value=""' + (!value ? ' selected' : '') + '>Не задан</option>' + opts + '</select></div>';
  }
  if (f.type === 'url') {
    return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><input type="url" class="cm-field-input" data-field="' + f.name + '" placeholder="https://…" value="' + escAttr(value) + '"></div>';
  }
  const maskAttr = f.mask ? ' data-mask="' + f.mask + '"' : '';
  const maskPlaceholder = f.mask === 'bankaccount' ? ' placeholder="0000 0000 0000 0000 0000"' : (f.mask === 'bik' ? ' placeholder="000000000"' : '');
  return '<div class="cm-field-row"><div class="cm-label">' + esc(f.label) + '</div><input type="text" class="cm-field-input" data-field="' + f.name + '"' + maskAttr + maskPlaceholder + ' value="' + escAttr(value) + '"></div>';
}

function toISODate(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}
function fromISODateDisplay(v) {
  if (!v) return '';
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return m[3] + '.' + m[2] + '.' + m[1];
  return s;
}
function formatPhoneInput(el) {
  let digits = el.value.replace(/\D/g, '');
  if (!digits) { el.value = ''; return; }
  if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
  if (digits.charAt(0) !== '7') digits = '7' + digits;
  digits = digits.slice(0, 11);
  let out = '+7';
  if (digits.length > 1) out += ' (' + digits.slice(1, 4);
  if (digits.length >= 4) out += ')';
  if (digits.length > 4) out += ' ' + digits.slice(4, 7);
  if (digits.length > 7) out += '-' + digits.slice(7, 9);
  if (digits.length > 9) out += '-' + digits.slice(9, 11);
  el.value = out;
}
function formatBankAccountInput(el) {
  const digits = el.value.replace(/\D/g, '').slice(0, 20);
  el.value = (digits.match(/.{1,4}/g) || []).join(' ');
}
function formatBikInput(el) {
  el.value = el.value.replace(/\D/g, '').slice(0, 9);
}
function wireFieldMasks(root, stageIndex) {
  const formEl = root.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
  if (!formEl) return;
  formEl.querySelectorAll('[data-mask="phone"]').forEach(function(el) {
    if (el.__cmMaskBound) return;
    el.__cmMaskBound = true;
    el.addEventListener('input', function() { formatPhoneInput(el); });
  });
  formEl.querySelectorAll('[data-mask="bankaccount"]').forEach(function(el) {
    if (el.__cmMaskBound) return;
    el.__cmMaskBound = true;
    el.addEventListener('input', function() { formatBankAccountInput(el); });
  });
  formEl.querySelectorAll('[data-mask="bik"]').forEach(function(el) {
    if (el.__cmMaskBound) return;
    el.__cmMaskBound = true;
    el.addEventListener('input', function() { formatBikInput(el); });
    attachBikLookup(el);
  });
  formEl.querySelectorAll('[data-field="inn"]').forEach(attachInnLookup);
  wireFieldRules(formEl);
}

async function loadObjectOptions() {
  try {
    const res = await ctx.api.resource('contract_objects').list({ fields: ['name'], pageSize: 100, sort: ['name'] });
    const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
    return Array.isArray(payload) ? payload.map(function(x) { return x.name; }).filter(Boolean) : [];
  } catch (e) { return []; }
}

function bindComboField(root, fieldName, options) {
  const input = root.querySelector('[data-field="' + fieldName + '"][data-combo="1"]');
  const listEl = root.querySelector('#cm-combo-list-' + fieldName);
  if (!input || !listEl) return;

  function renderOptions(filterText) {
    const f = (filterText || '').toLowerCase();
    const matches = options.filter(function(n) { return n.toLowerCase().indexOf(f) !== -1; });
    if (!matches.length) { listEl.style.display = 'none'; return; }
    listEl.innerHTML = matches.map(function(n) { return '<div class="cm-combo-item">' + esc(n) + '</div>'; }).join('');
    listEl.style.display = 'block';
    listEl.querySelectorAll('.cm-combo-item').forEach(function(item) {
      item.addEventListener('mousedown', function(e) {
        e.preventDefault();
        input.value = item.textContent;
        listEl.style.display = 'none';
      });
    });
  }

  input.addEventListener('focus', function() { renderOptions(input.value); });
  input.addEventListener('input', function() { renderOptions(input.value); });
  input.addEventListener('blur', function() { setTimeout(function() { listEl.style.display = 'none'; }, 150); });
}

const ACTIVE_BLOCK_DEFS = [
  { key: 'status', title: 'Статусы', activeOnly: true, fields: [
      { name: 'contract_status', label: 'Статус договора', type: 'status' },
      { name: 'payment_status', label: 'Статус оплаты', type: 'status' }
  ]},
  { key: 'data', title: 'Блок Данных по договору', fields: [
      { name: 'object_name', label: 'Объект', type: 'text' },
      { name: 'contract_number', label: 'Номер Договора', type: 'text' },
      { name: 'tenant_name', label: 'Арендатор', type: 'text' },
      { name: 'purpose', label: 'Назначение по Договору', type: 'text' },
      { name: 'date_signed', label: 'Заключение (дата)', type: 'date' },
      { name: 'date_act', label: 'Акт ПП (дата)', type: 'date' },
      { name: 'end_date', label: 'Окончание (дата)', type: 'date' },
      { name: 'termination_date', label: 'Расторжение (дата)', type: 'date' }
  ]},
  { key: 'room', title: 'Блок Характеристик помещения', fields: [
      { name: 'rooms_list', label: 'Список комнат', type: 'textarea', full: true },
      { name: 'room_ids', label: 'ID комнат', type: 'text' },
      { name: 'area_sqm', label: 'Площадь, кв.м.', type: 'text' },
      { name: 'rent_per_sqm', label: 'Аренда / 1 кв.м.', type: 'money' },
      { name: 'utility_per_sqm', label: 'Э.С. / 1 кв.м.', type: 'money' }
  ]},
  { key: 'pay', title: 'Блок Расчётов оплат', fields: [
      { name: 'total_amount', label: 'Сумма договора', type: 'money' },
      { name: 'deposit_amount', label: 'Обеспечительный платёж (ОП)', type: 'money' },
      { name: 'rent_amount', label: 'Арендная плата (АП)', type: 'money' },
      { name: 'utility_amount', label: 'Эксплуатационный сбор (ЭС)', type: 'money' }
  ]},
  { key: 'counterparty', title: 'Блок Контрагента', fields: [
      { name: 'inn', label: 'ИНН', type: 'text' },
      { name: 'kpp', label: 'КПП', type: 'text' },
      { name: 'ogrn', label: 'ОГРН / ОГРНИП', type: 'text' },
      { name: 'director', label: 'Руководитель', type: 'text' },
      { name: 'legal_address', label: 'Юридический адрес', type: 'text', full: true },
      { name: 'phone', label: 'Телефон', type: 'tel' },
      { name: 'contact_person', label: 'Контактное лицо', type: 'text' },
      { name: 'email', label: 'Эл. почта', type: 'email' },
      { name: 'bank_account', label: 'Расчётный счёт', type: 'text', mask: 'bankaccount' },
      { name: 'bik', label: 'БИК', type: 'text', mask: 'bik' },
      { name: 'bank_name', label: 'Банк', type: 'text' },
      { name: 'corr_account', label: 'Корр. счёт', type: 'text', mask: 'bankaccount' }
  ]},
  { key: 'notes', title: 'Примечания', fields: [
      { name: 'notes', label: 'Текст примечания', type: 'textarea', full: true }
  ], readonlyRenderer: function(r) {
      return '<div style="white-space:pre-wrap;color:#262626;font-size:14px;">' + linkifyText(r.notes) + '</div>';
  } }
];

function canEditActiveBlocks(user) {
  return !!(user && (user.__isAdmin || hasRole(user, 'rental_dept') || hasRole(user, 'legal_dept') || hasRole(user, 'accounting_dept')));
}

function renderActiveBlockSection(block, r) {
  const readonlyHtml = block.readonlyRenderer
    ? block.readonlyRenderer(r)
    : '<div class="cm-grid">' + block.fields.map(function(f) { return row(f.label, readonlyFieldValue(f, r), f.full); }).join('') + '</div>';
  return '<div class="cm-section" data-active-block="' + block.key + '">'
    + '<div class="cm-section-title-row">'
    + '<div class="cm-section-title" style="margin-bottom:0;flex:1;">' + esc(block.title) + '</div>'
    + '<button class="cm-stage-edit-toggle" data-active-edit-toggle="' + block.key + '" style="display:none;">✎ Редактировать</button>'
    + '</div>'
    + '<div data-active-readonly="' + block.key + '">' + readonlyHtml + '</div>'
    + '<div class="cm-stage-form" data-active-form="' + block.key + '" style="display:none;">'
    + block.fields.map(function(f) { return renderEditableField(f, r[f.name]); }).join('')
    + '<div class="cm-stage-edit-actions"><button class="cm-btn-save" data-active-save="' + block.key + '">Сохранить</button>'
    + '<button class="cm-btn-save" data-active-cancel="' + block.key + '">Отмена</button></div>'
    + '</div>'
    + '<div class="cm-save-status" id="cm-active-save-status-' + block.key + '"></div>'
    + '</div>';
}

function wireGenericFieldMasks(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('[data-mask="phone"]').forEach(function(el) {
    if (el.__cmMaskBound) return;
    el.__cmMaskBound = true;
    el.addEventListener('input', function() { formatPhoneInput(el); });
  });
  formEl.querySelectorAll('[data-mask="bankaccount"]').forEach(function(el) {
    if (el.__cmMaskBound) return;
    el.__cmMaskBound = true;
    el.addEventListener('input', function() { formatBankAccountInput(el); });
  });
  formEl.querySelectorAll('[data-mask="bik"]').forEach(function(el) {
    if (el.__cmMaskBound) return;
    el.__cmMaskBound = true;
    el.addEventListener('input', function() { formatBikInput(el); });
    attachBikLookup(el);
  });
  formEl.querySelectorAll('[data-field="inn"]').forEach(attachInnLookup);
  wireFieldRules(formEl);
}

function collectFormValues(formEl, fieldTypes) {
  const values = {};
  if (!formEl) return values;
  formEl.querySelectorAll('[data-field]').forEach(function(el) {
    const name = el.getAttribute('data-field');
    if (el.type === 'checkbox') {
      values[name] = el.checked;
    } else if (fieldTypes[name] === 'date') {
      values[name] = el.value ? el.value : null;
    } else if (fieldTypes[name] === 'status') {
      values[name] = el.value ? el.value : null;
    } else {
      values[name] = toApiValue(name, normalizeValue(name, el.value));
    }
  });
  return values;
}

function wireActiveBlockEdits(root, id, r, currentUser) {
  root.__cmActiveId = id;      // для подстановки реквизитов по ИНН в блок «Данные по договору»
  root.__cmActiveRec = r;
  if (!canEditActiveBlocks(currentUser)) return;
  root.querySelectorAll('[data-active-edit-toggle]').forEach(function(btn) { btn.style.display = ''; });

  root.querySelectorAll('[data-active-edit-toggle]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', function() {
      const key = btn.getAttribute('data-active-edit-toggle');
      const readonly = root.querySelector('[data-active-readonly="' + key + '"]');
      const form = root.querySelector('[data-active-form="' + key + '"]');
      readonly.style.display = 'none';
      form.style.display = 'block';
      btn.style.display = 'none';
      wireGenericFieldMasks(form);
    });
  });

  root.querySelectorAll('[data-active-cancel]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', function() {
      const key = btn.getAttribute('data-active-cancel');
      const readonly = root.querySelector('[data-active-readonly="' + key + '"]');
      const form = root.querySelector('[data-active-form="' + key + '"]');
      const toggleBtn = root.querySelector('[data-active-edit-toggle="' + key + '"]');
      form.style.display = 'none';
      readonly.style.display = '';
      if (toggleBtn) toggleBtn.style.display = '';
    });
  });

  root.querySelectorAll('[data-active-save]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', async function() {
      const key = btn.getAttribute('data-active-save');
      const block = ACTIVE_BLOCK_DEFS.find(function(b) { return b.key === key; });
      const form = root.querySelector('[data-active-form="' + key + '"]');
      const readonly = root.querySelector('[data-active-readonly="' + key + '"]');
      const toggleBtn = root.querySelector('[data-active-edit-toggle="' + key + '"]');
      const statusEl = root.querySelector('#cm-active-save-status-' + key);
      const fieldTypes = {};
      block.fields.forEach(function(f) { fieldTypes[f.name] = f.type; });
      const values = collectFormValues(form, fieldTypes);
      const badField = validateForm(form, false);
      if (badField) { cmToast(badField.msg); if (badField.el) badField.el.focus(); return; }
      btn.disabled = true;
      if (statusEl) statusEl.textContent = 'Сохранение…';
      try {
        const upResp = await updateWithHistory('rental_contracts', id, values);
        Object.assign(r, values, (upResp && upResp.__cmDerived) || {});
        renderAllActiveReadonly(root, r);
        readonly.innerHTML = block.readonlyRenderer
          ? block.readonlyRenderer(r)
          : '<div class="cm-grid">' + block.fields.map(function(f) { return row(f.label, readonlyFieldValue(f, r), f.full); }).join('') + '</div>';
        form.style.display = 'none';
        readonly.style.display = '';
        if (toggleBtn) toggleBtn.style.display = '';
        if (statusEl) statusEl.textContent = '';
        cmToast('Сохранено');
      } catch (e) {
        if (statusEl) statusEl.textContent = 'Не удалось сохранить';
        cmToast('Не удалось сохранить изменения');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function renderFormingBody(r, currentUser) {
  const cur = r.current_stage || 0;
  let html = '<div class="cm-stage-bar">' + STAGE_DEFS.map(function(s, i) {
    const state = i < cur ? 'done' : (i === cur ? 'active' : '');
    return '<div class="cm-stage-pill ' + state + '">' + (i + 1) + '. ' + esc(s.title) + '</div>';
  }).join('') + '</div>';

  STAGE_DEFS.forEach(function(stage, i) {
    if (i > cur) return;
    const isCurrent = i === cur;
    const isDone = i < cur;
    const canEdit = isDone && !!(currentUser && (currentUser.__isAdmin || hasRole(currentUser, stage.role)));

    html += '<div class="cm-section" data-stage-section="' + i + '">';
    html += '<div class="cm-section-title-row">';
    if (isDone) {
      html += '<button class="cm-stage-collapse-btn" data-stage-collapse="' + i + '" title="Свернуть/развернуть">▸</button>';
    }
    html += '<div class="cm-section-title" style="margin-bottom:0;flex:1;">' + (i + 1) + '. ' + esc(stage.title)
      + (isDone ? '<span class="cm-stage-done-badge">пройден</span>' : '') + '</div>';
    if (canEdit) {
      html += '<button class="cm-stage-edit-toggle" data-stage-edit-toggle="' + i + '">✎ Редактировать</button>';
    }
    html += '</div>';

    html += '<div class="cm-stage-content" data-stage-content="' + i + '" style="display:' + (isDone ? 'none' : 'block') + ';">';
    if (isDone) {
      html += '<div class="cm-grid" data-stage-readonly="' + i + '">' + stage.fields.map(function(f) {
        return row(f.label, readonlyFieldValue(f, r));
      }).join('') + '</div>';
    }
    html += '<div class="cm-stage-form" data-stage="' + i + '" style="display:' + (isCurrent ? 'block' : 'none') + ';">'
      + stage.fields.map(function(f) { return renderEditableField(f, r[f.name]); }).join('');
    if (isDone) {
      html += '<div class="cm-stage-edit-actions"><button class="cm-btn-save" data-edit-save="' + i + '">Сохранить</button>'
        + '<button class="cm-btn-save" data-edit-cancel="' + i + '">Готово</button></div>';
    }
    html += '</div>';
    html += '<div class="cm-save-status" id="cm-save-status-' + i + '"></div>';
    html += '</div>';
    html += '</div>';
  });

  html += renderFormingSideSections(r, currentUser);
  return html;
}

function renderFormingSideSections(r, currentUser) {
  const files = r.contract_files || [];
  return renderPricesSection('cm-forming') + renderContactsSection('cm-forming')
    + '<div class="cm-section" id="cm-forming-files-section"><div class="cm-section-title">Файлы</div>'
    + '<div id="cm-forming-files-list">' + renderFilesList(files, currentUser) + '</div>'
    + '<div class="cm-upload-row"><input type="file" id="cm-forming-file-input" style="display:none;">'
    + '<button class="cm-upload-btn" id="cm-forming-upload-btn">+ Прикрепить файл</button>'
    + '<span id="cm-forming-upload-status" style="font-size:12px;color:#999;"></span></div></div>'
    + renderAddendumsSection('cm-forming')
    + renderHistorySection('cm-forming');
}

// «Срочный договор»: все поля из всех этапов в одной форме, без ролевого гейтинга по этапам.
function renderQuickFormingBody(r, currentUser) {
  let html = '<div style="background:#fff7e6;border:1px solid #ffd591;color:#ad6800;border-radius:6px;'
    + 'padding:8px 12px;margin-bottom:14px;font-size:12.5px;font-weight:600;">⚡ Срочный договор — все поля в одной форме, без этапов оформления</div>';
  html += '<div class="cm-stage-form" data-stage="quick">' + STAGE_DEFS.map(function(stage) {
    return '<div class="cm-section"><div class="cm-section-title">' + esc(stage.title) + '</div>'
      + stage.fields.map(function(f) { return renderEditableField(f, r[f.name]); }).join('') + '</div>';
  }).join('') + '</div>';
  html += '<div class="cm-save-status" id="cm-save-status-quick" style="margin-top:0;min-height:0;"></div>';
  html += '<div class="cm-stage-actions" style="margin-top:2px;padding-top:10px;border-top:1px solid #f0f0f0;">'
    + '<button class="cm-btn-save" id="cm-quick-save">Сохранить</button>'
    + '<button class="cm-btn-advance cm-btn-finalize" id="cm-quick-publish">Опубликовать → Активные</button>'
    + '</div>';
  html += renderFormingSideSections(r, currentUser);
  return html;
}

function wireAutoSave(root, id, stageIndex, statusElId, collectionName) {
  const formEl = root.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
  const statusEl = root.querySelector('#' + statusElId);
  if (!formEl || formEl.__cmFlush) return;
  let timer = null;
  function doSave() {
    const values = collectStageValues(root, stageIndex);
    const badNames = invalidFieldNames(formEl);
    badNames.forEach(function(n) { delete values[n]; });
    if (collectionName === 'draft_contracts') values.last_activity_at = new Date().toISOString();
    if (statusEl) statusEl.textContent = 'Сохранение…';
    return updateWithHistory(collectionName || 'forming_contracts', id, values).then(function() {
      if (statusEl) {
        if (badNames.length) { statusEl.textContent = 'Не сохранено, исправьте: ' + badNames.map(fieldLabel).join(', '); return; }
        statusEl.textContent = 'Сохранено';
        setTimeout(function() { if (statusEl.textContent === 'Сохранено') statusEl.textContent = ''; }, 1500);
      }
    }).catch(function() {
      if (statusEl) statusEl.textContent = 'Не удалось сохранить';
    });
  }
  function scheduleSave() {
    clearTimeout(timer);
    timer = setTimeout(doSave, 700);
  }
  formEl.querySelectorAll('[data-field]').forEach(function(el) {
    const evt = (el.type === 'checkbox') ? 'change' : 'input';
    el.addEventListener(evt, scheduleSave);
  });
  formEl.__cmFlush = function() { clearTimeout(timer); return doSave(); };
}

function wireStageCollapseToggles(root) {
  root.querySelectorAll('[data-stage-collapse]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', function() {
      const i = btn.getAttribute('data-stage-collapse');
      const content = root.querySelector('[data-stage-content="' + i + '"]');
      const collapsed = content.style.display === 'none';
      content.style.display = collapsed ? 'block' : 'none';
      btn.textContent = collapsed ? '▾' : '▸';
    });
  });
}

function wireStageEditToggles(root, id) {
  root.querySelectorAll('[data-stage-edit-toggle]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', function() {
      const i = btn.getAttribute('data-stage-edit-toggle');
      const content = root.querySelector('[data-stage-content="' + i + '"]');
      const readonly = root.querySelector('[data-stage-readonly="' + i + '"]');
      const form = root.querySelector('.cm-stage-form[data-stage="' + i + '"]');
      content.style.display = 'block';
      const collapseBtn = root.querySelector('[data-stage-collapse="' + i + '"]');
      if (collapseBtn) collapseBtn.textContent = '▾';
      if (readonly) readonly.style.display = 'none';
      form.style.display = 'block';
      btn.style.display = 'none';
      wireAutoSave(root, id, Number(i), 'cm-save-status-' + i);
      wireFieldMasks(root, Number(i));
    });
  });

  root.querySelectorAll('[data-edit-cancel]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', async function() {
      const i = btn.getAttribute('data-edit-cancel');
      const form = root.querySelector('.cm-stage-form[data-stage="' + i + '"]');
      if (form.__cmFlush) await form.__cmFlush();
      const res2 = await ctx.api.resource('forming_contracts').get({ filterByTk: id });
      const r2 = (res2 && res2.data && res2.data.data) ? res2.data.data : (res2 && res2.data) ? res2.data : res2;
      const stage = STAGE_DEFS[Number(i)];
      const readonly = root.querySelector('[data-stage-readonly="' + i + '"]');
      readonly.innerHTML = stage.fields.map(function(f) {
        return row(f.label, readonlyFieldValue(f, r2));
      }).join('');
      readonly.style.display = 'block';
      form.style.display = 'none';
      const editBtn = root.querySelector('[data-stage-edit-toggle="' + i + '"]');
      if (editBtn) editBtn.style.display = '';
    });
  });

  root.querySelectorAll('[data-edit-save]').forEach(function(btn) {
    if (btn.__cmBound) return;
    btn.__cmBound = true;
    btn.addEventListener('click', async function() {
      const i = btn.getAttribute('data-edit-save');
      const form = root.querySelector('.cm-stage-form[data-stage="' + i + '"]');
      if (form.__cmFlush) await form.__cmFlush();
      cmToast('Сохранено');
    });
  });
}

function collectStageValues(root, stageIndex) {
  const formEl = root.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
  const values = {};
  if (!formEl) return values;
  const fieldTypes = {};
  if (stageIndex === 'quick') {
    STAGE_DEFS.forEach(function(s) { s.fields.forEach(function(f) { fieldTypes[f.name] = f.type; }); });
  } else {
    const stage = STAGE_DEFS[Number(stageIndex)];
    if (stage) stage.fields.forEach(function(f) { fieldTypes[f.name] = f.type; });
  }
  formEl.querySelectorAll('[data-field]').forEach(function(el) {
    const name = el.getAttribute('data-field');
    if (el.type === 'checkbox') {
      values[name] = el.checked;
    } else if (fieldTypes[name] === 'date') {
      values[name] = el.value ? el.value : null;
    } else {
      values[name] = toApiValue(name, normalizeValue(name, el.value));
    }
  });
  return values;
}

function isImageMime(mt) { return !!mt && mt.indexOf('image/') === 0; }
function formatBytes(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' Б';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ';
  return (n / 1024 / 1024).toFixed(1) + ' МБ';
}
async function cmFetchBlobUrl(url) {
  const res = await fetch(url, { credentials: 'include' });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
function cmHydrateChatImages(scope) {
  scope.querySelectorAll('img.cm-att-image[data-att-url]').forEach(async function(img) {
    const url = img.getAttribute('data-att-url');
    img.removeAttribute('data-att-url');
    try { img.src = await cmFetchBlobUrl(url); } catch (e) {}
  });
}
function cmWireChatFileOpen(scope) {
  scope.querySelectorAll('.cm-att-file[data-att-url]').forEach(function(el) {
    if (el.__wired) return;
    el.__wired = true;
    el.addEventListener('click', async function() {
      try {
        const blobUrl = await cmFetchBlobUrl(el.getAttribute('data-att-url'));
        const a = document.createElement('a');
        a.href = blobUrl; a.download = el.getAttribute('data-att-name'); a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) {}
    });
  });
}

async function uploadFileGetId(file) {
  const boundary = '----addBoundary' + Math.random().toString(16).slice(2);
  const parts = [];
  parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n');
  const tail = '\r\n--' + boundary + '--\r\n';
  const blob = new Blob([parts.join(''), file, tail]);
  const res = await fetch('/api/attachments:upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: blob
  });
  const data = await res.json();
  const attId = data && data.data && data.data.id;
  if (!attId) throw new Error('upload failed');
  return attId;
}

function renderAddendumsSection(prefix) {
  return '<div class="cm-section" id="' + prefix + '-addendums-section" style="margin-bottom:0;">'
    + '<div class="cm-section-title-row"><div class="cm-section-title" style="margin-bottom:0;flex:1;">Доп. соглашения</div>'
    + '<button class="cm-stage-edit-toggle" id="' + prefix + '-addendum-add-btn">+ Доп. соглашение</button></div>'
    + '<div id="' + prefix + '-addendums-list" style="margin-top:6px;"><div style="color:#999;font-size:12px;">Загрузка…</div></div>'
    + '<div id="' + prefix + '-addendum-form" style="display:none;margin-top:10px;padding:10px;border:1px solid #f0f0f0;border-radius:6px;background:#fafafa;">'
    + '<input type="text" id="' + prefix + '-addendum-title" placeholder="Название (например, Доп. соглашение №1)" style="width:100%;box-sizing:border-box;padding:6px 8px;margin-bottom:6px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;">'
    + '<textarea id="' + prefix + '-addendum-desc" placeholder="Описание/условия" rows="2" style="width:100%;box-sizing:border-box;padding:6px 8px;margin-bottom:6px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;resize:vertical;"></textarea>'
    + '<div style="display:flex;align-items:center;gap:8px;">'
    + '<input type="file" id="' + prefix + '-addendum-file" style="display:none;">'
    + '<button class="cm-upload-btn" id="' + prefix + '-addendum-pick-btn" style="font-size:12px;">Выбрать файл</button>'
    + '<span id="' + prefix + '-addendum-filename" style="font-size:12px;color:#999;">Файл не выбран</span>'
    + '</div>'
    + '<div style="margin-top:8px;display:flex;gap:8px;">'
    + '<button id="' + prefix + '-addendum-save-btn" style="background:#1677ff;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;">Сохранить</button>'
    + '<button id="' + prefix + '-addendum-cancel-btn" style="background:#f0f0f0;color:#333;border:none;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;">Отмена</button>'
    + '<span id="' + prefix + '-addendum-status" style="font-size:12px;color:#999;align-self:center;"></span>'
    + '</div></div></div>';
}

function renderAddendumsList(items) {
  if (!items.length) return '<div style="color:#bbb;font-size:12px;">Пока нет доп. соглашений</div>';
  return items.map(function(a) {
    const fileHtml = a.file
      ? '<span class="cm-addendum-file" data-att-url="' + esc(a.file.url) + '" data-att-name="' + esc((a.file.title || 'file') + (a.file.extname || '')) + '" style="color:#1677ff;cursor:pointer;text-decoration:underline;">' + esc((a.file.title || 'file') + (a.file.extname || '')) + '</span>'
      : '';
    return '<div style="padding:8px 0;border-bottom:1px solid #f5f5f5;">'
      + '<div style="font-weight:600;font-size:13px;">' + esc(a.title || 'Доп. соглашение') + '</div>'
      + (a.description ? '<div style="font-size:12.5px;color:#595959;margin-top:2px;">' + esc(a.description) + '</div>' : '')
      + '<div style="font-size:11px;color:#bbb;margin-top:3px;">' + esc(nbFmtDateTimeLocal(a.created_at)) + (a.author ? ' · ' + esc(a.author.nickname || a.author.username) : '') + (fileHtml ? ' · ' + fileHtml : '') + '</div>'
      + '</div>';
  }).join('');
}

function nbFmtDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

async function loadAddendums(contractType, contractId) {
  const res = await ctx.api.resource('contract_addendums').list({
    filter: { contract_type: contractType, contract_ref_id: contractId }, appends: ['file', 'author'], sort: ['created_at']
  });
  const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  return Array.isArray(payload) ? payload : [];
}

function wireAddendumFileOpen(root) {
  root.querySelectorAll('.cm-addendum-file[data-att-url]').forEach(function(el) {
    if (el.__wired) return;
    el.__wired = true;
    el.addEventListener('click', async function() {
      try {
        const res = await fetch(el.getAttribute('data-att-url'), { credentials: 'include' });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = el.getAttribute('data-att-name'); a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { /* best-effort */ }
    });
  });
}

async function wireAddendums(overlay, prefix, contractType, contractId, currentUser) {
  const listEl = overlay.querySelector('#' + prefix + '-addendums-list');
  const addBtn = overlay.querySelector('#' + prefix + '-addendum-add-btn');
  const formEl = overlay.querySelector('#' + prefix + '-addendum-form');
  const titleInput = overlay.querySelector('#' + prefix + '-addendum-title');
  const descInput = overlay.querySelector('#' + prefix + '-addendum-desc');
  const fileInput = overlay.querySelector('#' + prefix + '-addendum-file');
  const pickBtn = overlay.querySelector('#' + prefix + '-addendum-pick-btn');
  const filenameSpan = overlay.querySelector('#' + prefix + '-addendum-filename');
  const saveBtn = overlay.querySelector('#' + prefix + '-addendum-save-btn');
  const cancelBtn = overlay.querySelector('#' + prefix + '-addendum-cancel-btn');
  const statusSpan = overlay.querySelector('#' + prefix + '-addendum-status');
  if (!listEl || !addBtn) return;

  async function refresh() {
    const items = await loadAddendums(contractType, contractId);
    listEl.innerHTML = renderAddendumsList(items);
    wireAddendumFileOpen(overlay);
  }
  await refresh();

  addBtn.addEventListener('click', function() {
    formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
  });
  cancelBtn.addEventListener('click', function() {
    formEl.style.display = 'none';
    titleInput.value = ''; descInput.value = ''; fileInput.value = '';
    filenameSpan.textContent = 'Файл не выбран';
  });
  pickBtn.addEventListener('click', function() { fileInput.click(); });
  fileInput.addEventListener('change', function() {
    filenameSpan.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Файл не выбран';
  });
  saveBtn.addEventListener('click', async function() {
    const title = titleInput.value.trim();
    if (!title) { cmToast('Укажите название'); return; }
    saveBtn.disabled = true;
    statusSpan.textContent = 'Сохранение…';
    try {
      let fileId = null;
      if (fileInput.files[0]) {
        statusSpan.textContent = 'Загрузка файла…';
        fileId = await uploadFileGetId(fileInput.files[0]);
      }
      await ctx.api.resource('contract_addendums').create({
        values: {
          contract_type: contractType, contract_ref_id: contractId,
          title: title, description: descInput.value.trim(),
          file_id: fileId, author_id: currentUser.id, created_at: new Date().toISOString()
        }
      });
      logHistory(contractType, contractId, [{ action: 'addendum', text: 'Добавлено доп. соглашение: ' + title }]);
      titleInput.value = ''; descInput.value = ''; fileInput.value = '';
      filenameSpan.textContent = 'Файл не выбран';
      formEl.style.display = 'none';
      statusSpan.textContent = '';
      await refresh();
    } catch (e) {
      cmToast('Не удалось сохранить доп. соглашение');
      statusSpan.textContent = '';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

async function uploadContractFile(file, contractId, collectionName) {
  const boundary = '----cmBoundary' + Math.random().toString(16).slice(2);
  const parts = [];
  parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n');
  const tail = '\r\n--' + boundary + '--\r\n';
  const blob = new Blob([parts.join(''), file, tail]);
  const res = await fetch('/api/attachments:upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: blob
  });
  const data = await res.json();
  const attId = data && data.data && data.data.id;
  if (!attId) throw new Error('upload failed');
  await fetch('/api/' + collectionName + '/' + contractId + '/contract_files:add', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify([attId])
  });
}

function bindFileUpload(root, contractId, collectionName, ids, onDone) {
  const input = root.querySelector('#' + ids.input);
  const btn = root.querySelector('#' + ids.btn);
  const status = root.querySelector('#' + ids.status);
  if (!input || !btn) return;
  btn.addEventListener('click', function() { input.click(); });
  input.addEventListener('change', async function() {
    const file = input.files[0];
    if (!file) return;
    btn.disabled = true;
    status.textContent = 'Загрузка…';
    try {
      await uploadContractFile(file, contractId, collectionName);
      logHistory(HIST_TYPE_BY_COLL[collectionName] || 'active', contractId, [{ action: 'file', text: 'Загружен файл: ' + file.name }]);
      status.textContent = 'Готово';
      if (onDone) await onDone();
    } catch (e) {
      status.textContent = '';
      cmToast('Не удалось загрузить файл');
    } finally {
      btn.disabled = false;
      input.value = '';
    }
  });
}

async function saveStage(id, stageIndex, root, collectionName) {
  const values = collectStageValues(root, stageIndex);
  await updateWithHistory(collectionName || 'forming_contracts', id, values);
  return values;
}

async function advanceStage(id, root, currentUser) {
  const res = await ctx.api.resource('forming_contracts').get({ filterByTk: id, appends: ['contract_members'] });
  const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  const stageIndex = r.current_stage || 0;
  const stage = STAGE_DEFS[stageIndex];
  if (!hasRole(currentUser, stage.role)) {
    cmToast('Подтвердить этот этап может только роль «' + STAGE_ROLE_TITLES[stage.role] + '»');
    return;
  }
  const currentFormEl = root.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
  const badAdv = currentFormEl ? validateForm(currentFormEl, true) : null;
  if (badAdv) { cmToast(badAdv.msg); if (badAdv.el) badAdv.el.focus(); return; }
  if (currentFormEl && currentFormEl.__cmFlush) {
    await currentFormEl.__cmFlush();
  } else {
    await saveStage(id, stageIndex, root);
  }
  const contractNumber = r.contract_number || r.object_name || ('#' + id);
  const members = r.contract_members || [];

  if (stageIndex === STAGE_DEFS.length - 1) {
    await finalizeContract(id, members, contractNumber);
    return;
  }

  await ctx.api.resource('forming_contracts').update({ filterByTk: id, values: { current_stage: stageIndex + 1 } });
  await logHistory('forming', id, [{ action: 'stage', text: 'Этап «' + stage.title + '» подтверждён, переход на этап «' + STAGE_DEFS[stageIndex + 1].title + '»' }]);
  members.forEach(function(m) {
    createNotification(m.id, id, 'Договор ' + contractNumber, 'Этап «' + stage.title + '» пройден, договор переходит на этап «' + STAGE_DEFS[stageIndex + 1].title + '»', 'forming', 'status');
  });
  closeFormingModal(true);
  await openFormingContractModal(id);
}

async function publishQuickContract(id, root) {
  const formEl = root.querySelector('.cm-stage-form[data-stage="quick"]');
  const bad = formEl ? validateForm(formEl, false) : null;
  if (bad) { cmToast(bad.msg); if (bad.el) bad.el.focus(); return; }
  if (formEl && formEl.__cmFlush) await formEl.__cmFlush();
  else await saveStage(id, 'quick', root);
  const res = await ctx.api.resource('forming_contracts').get({ filterByTk: id, appends: ['contract_members'] });
  const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  const contractNumber = r.contract_number || r.object_name || ('#' + id);
  const members = r.contract_members || [];
  await finalizeContract(id, members, contractNumber);
}

async function completeContract(id, members, contractNumber) {
  if (!(await cmConfirm('Завершить договор «' + contractNumber + '» и перенести в «Архив»?'))) return;
  const res = await ctx.api.resource('rental_contracts').get({ filterByTk: id, appends: ['contract_files', 'contract_members'] });
  const f = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  const payload = {
    contract_number: f.contract_number, date_signed: f.date_signed, date_act: f.date_act,
    object_name: f.object_name, tenant_name: f.tenant_name, area_sqm: f.area_sqm,
    email: f.email, phone: f.phone, tenant_fio: f.tenant_fio,
    end_date: f.end_date, termination_date: f.termination_date, purpose: f.purpose,
    rooms_list: f.rooms_list, room_ids: f.room_ids,
    rent_per_sqm: f.rent_per_sqm, utility_per_sqm: f.utility_per_sqm,
    deposit_amount: f.deposit_amount, rent_amount: f.rent_amount, utility_amount: f.utility_amount, total_amount: f.total_amount,
    inn: f.inn, contact_person: f.contact_person, bank_account: f.bank_account, bik: f.bik, bank_name: f.bank_name, corr_account: f.corr_account,
    kpp: f.kpp, ogrn: f.ogrn, legal_address: f.legal_address, director: f.director,
    contract_scan_url: f.contract_scan_url, act_scan_url: f.act_scan_url, notes: f.notes
  };
  const createRes = await ctx.api.resource('completed_contracts').create({ values: payload });
  const newRec = (createRes && createRes.data && createRes.data.data) ? createRes.data.data : createRes.data;
  const newId = newRec.id;

  const fileIds = (f.contract_files || []).map(function(x) { return x.id; });
  if (fileIds.length) {
    await fetch('/api/completed_contracts/' + newId + '/contract_files:add', {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(fileIds)
    });
  }
  const memberIds = (f.contract_members || []).map(function(x) { return x.id; });
  if (memberIds.length) {
    await fetch('/api/completed_contracts/' + newId + '/contract_members:add', {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(memberIds)
    });
  }
  try {
    await fetch('/api/contract_chat_messages:update?filter=' + encodeURIComponent(JSON.stringify({ owner_contract_id: id, source: 'active' })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_contract_id: newId, source: 'completed' })
    });
  } catch (e) { /* best-effort */ }

  try {
    await fetch('/api/contract_addendums:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: 'active', contract_ref_id: id })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: 'completed', contract_ref_id: newId })
    });
  } catch (e) { /* best-effort */ }
  try {
    await fetch('/api/contract_contacts:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: 'active', contract_ref_id: id })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: 'completed', contract_ref_id: newId })
    });
  } catch (e) { /* best-effort */ }

  await moveSide('contract_price_periods', 'active', id, 'completed', newId);
  await moveHistory('active', id, 'completed', newId);
  await logHistory('completed', newId, [{ action: 'status', text: 'Договор завершён и перенесён в «Архив»' }]);
  memberIds.forEach(function(uid) {
    createNotification(uid, newId, 'Договор ' + (f.contract_number || f.object_name || contractNumber), 'Договор завершён и перенесён в раздел «Архив»', 'completed', 'status');
  });

  try {
    await ctx.api.resource('rental_contracts').destroy({ filterByTk: id });
  } catch (e) {
    cmToast('Договор перенесён, но исходная запись не удалилась — уберите вручную');
  }
  closeContractModal();
  cmToast('Готово: договор перенесён в «Архив»');
  setTimeout(function() { location.reload(); }, 400);
}

async function finalizeContract(id, members, contractNumber) {
  if (!(await cmConfirm('Завершить оформление и перевести договор в «Активные»?'))) return;
  const res = await ctx.api.resource('forming_contracts').get({ filterByTk: id, appends: ['contract_files', 'contract_members'] });
  const f = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  const payload = {
    contract_number: f.contract_number, date_signed: f.date_signed, date_act: f.date_act,
    object_name: f.object_name, tenant_name: f.tenant_name, area_sqm: f.area_sqm,
    email: f.email, phone: f.phone, tenant_fio: f.tenant_fio,
    end_date: f.end_date, purpose: f.purpose, rent_per_sqm: f.rent_per_sqm, utility_per_sqm: f.utility_per_sqm,
    base_rent_per_sqm: f.rent_per_sqm, base_rent_amount: f.rent_amount,
    deposit_amount: f.deposit_amount, rent_amount: f.rent_amount, utility_amount: f.utility_amount, total_amount: f.total_amount,
    inn: f.inn, contact_person: f.tenant_fio, bank_account: f.bank_account, bik: f.bik, bank_name: f.bank_name, corr_account: f.corr_account,
    kpp: f.kpp, ogrn: f.ogrn, legal_address: f.legal_address, director: f.director,
    contract_scan_url: f.contract_scan_url, act_scan_url: f.act_scan_url, notes: f.notes
  };
  const createRes = await ctx.api.resource('rental_contracts').create({ values: payload });
  const newRec = (createRes && createRes.data && createRes.data.data) ? createRes.data.data : createRes.data;
  const newId = newRec.id;

  const fileIds = (f.contract_files || []).map(function(x) { return x.id; });
  if (fileIds.length) {
    await fetch('/api/rental_contracts/' + newId + '/contract_files:add', {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(fileIds)
    });
  }
  const memberIds = (f.contract_members || []).map(function(x) { return x.id; });
  if (memberIds.length) {
    await fetch('/api/rental_contracts/' + newId + '/contract_members:add', {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(memberIds)
    });
  }
  try {
    await fetch('/api/contract_chat_messages:update?filter=' + encodeURIComponent(JSON.stringify({ owner_contract_id: id, source: 'forming' })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_contract_id: newId, source: 'active' })
    });
  } catch (e) { /* best-effort */ }

  try {
    await fetch('/api/contract_addendums:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: 'forming', contract_ref_id: id })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: 'active', contract_ref_id: newId })
    });
  } catch (e) { /* best-effort */ }
  try {
    await fetch('/api/contract_contacts:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: 'forming', contract_ref_id: id })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: 'active', contract_ref_id: newId })
    });
  } catch (e) { /* best-effort */ }

  await moveSide('contract_price_periods', 'forming', id, 'active', newId);
  await moveHistory('forming', id, 'active', newId);
  await logHistory('active', newId, [{ action: 'status', text: 'Оформление завершено, договор переведён в «Активные»' }]);
  memberIds.forEach(function(uid) {
    createNotification(uid, newId, 'Договор ' + (f.contract_number || f.object_name || contractNumber), 'Договор полностью оформлен и переведён в раздел «Активные»', 'active', 'status');
  });

  try {
    await ctx.api.resource('forming_contracts').destroy({ filterByTk: id });
  } catch (e) {
    cmToast('Договор перенесён, но черновик не удалился — уберите вручную');
  }
  closeFormingModal();
  cmToast('Готово: договор переведён в «Активные»');
  setTimeout(function() { location.reload(); }, 400);
}

function closeFormingModal(immediate) {
  const root = document.getElementById('forming-modal-root');
  if (!root) return;
  const flushes = [];
  root.querySelectorAll('.cm-stage-form').forEach(function(f) { if (f.__cmFlush) flushes.push(f.__cmFlush()); });
  document.removeEventListener('keydown', onFormingModalEscape);
  const draftId = root.__cmContractId;
  if (draftId) {
    Promise.all(flushes).then(function() { return purgeIfEmptyDraft(draftId); }).catch(function() {});
  }
  if (immediate) {
    root.remove();
    return;
  }
  root.classList.remove('cm-open');
  setTimeout(function() { if (root && root.parentNode) root.remove(); }, 220);
}
// Закрыли карточку без единого реального значения (не считая служебной записи о создании) — значит,
// кнопку «Создать договор»/«Срочный договор» нажали случайно; чистим фантомный черновик, чтобы он
// не оставался мусором в «Формирующихся».
async function purgeIfEmptyDraft(id) {
  try {
    const res = await ctx.api.resource('forming_contracts').get({ filterByTk: id, appends: ['contract_files', 'contract_members'] });
    const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
    if (!r || !r.id) return;
    const fieldsEmpty = STAGE_DEFS.every(function(s) {
      return s.fields.every(function(f) {
        const v = r[f.name];
        return v === null || v === undefined || v === '';
      });
    });
    if (!fieldsEmpty) return;
    if ((r.contract_members || []).length) return;
    if ((r.contract_files || []).length) return;
    const histRes = await ctx.api.resource('contract_history').list({ filter: { contract_type: 'forming', contract_ref_id: id }, pageSize: 1 });
    const histCount = (histRes && histRes.data && histRes.data.meta && histRes.data.meta.count) || 0;
    if (histCount > 1) return;
    await purgeContractSideData('forming', id);
    await ctx.api.resource('forming_contracts').destroy({ filterByTk: id });
  } catch (e) { /* best-effort: пустой черновик просто останется в базе, ничего не ломаем */ }
}
function onFormingModalEscape(e) {
  if (e.key === 'Escape') closeFormingModal();
}

// ---------- личные черновики (до публикации в «Формирующиеся» никто кроме автора их не видит) ----------

async function purgeIfEmptyDraftRecord(id) {
  try {
    const res = await ctx.api.resource('draft_contracts').get({ filterByTk: id, appends: ['contract_files'] });
    const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
    if (!r || !r.id) return;
    const fieldsEmpty = STAGE_DEFS.every(function(s) {
      return s.fields.every(function(f) {
        const v = r[f.name];
        return v === null || v === undefined || v === '';
      });
    });
    if (!fieldsEmpty) return;
    if ((r.contract_files || []).length) return;
    // у черновика нет служебной записи «создан» (создаётся тихо, без лога) — любая история = реальная активность
    const histRes = await ctx.api.resource('contract_history').list({ filter: { contract_type: 'draft', contract_ref_id: id }, pageSize: 1 });
    const histCount = (histRes && histRes.data && histRes.data.meta && histRes.data.meta.count) || 0;
    if (histCount > 0) return;
    await purgeContractSideData('draft', id);
    await ctx.api.resource('draft_contracts').destroy({ filterByTk: id });
    if (window.refreshDraftsList) window.refreshDraftsList();
  } catch (e) { /* best-effort: пустой черновик просто останется в базе, ничего не ломаем */ }
}

function closeDraftModal(immediate) {
  const root = document.getElementById('draft-modal-root');
  if (!root) return;
  const flushes = [];
  root.querySelectorAll('.cm-stage-form').forEach(function(f) { if (f.__cmFlush) flushes.push(f.__cmFlush()); });
  document.removeEventListener('keydown', onDraftModalEscape);
  const draftId = root.__cmContractId;
  if (draftId) {
    Promise.all(flushes).then(function() { return purgeIfEmptyDraftRecord(draftId); }).catch(function() {});
  }
  if (immediate) { root.remove(); return; }
  root.classList.remove('cm-open');
  setTimeout(function() { if (root && root.parentNode) root.remove(); }, 220);
}
function onDraftModalEscape(e) {
  if (e.key === 'Escape') closeDraftModal();
}

// Автосохранение для НЕсуществующего пока черновика: копится в debounce как обычно, но первое
// реальное (непустое) сохранение СОЗДАЁТ запись в draft_contracts, дальше модалка перерисовывается
// полноценно (появляются доп.секции) и дальше работает как обычный wireAutoSave.
function wireAutoSaveDraftLazy(root, stageOrQuick, statusElId, isQuick, currentUserId, onCreated) {
  const formEl = root.querySelector('.cm-stage-form[data-stage="' + stageOrQuick + '"]');
  const statusEl = root.querySelector('#' + statusElId);
  if (!formEl || formEl.__cmFlush) return;
  let timer = null;
  let creating = false;
  function doSave() {
    if (creating) return Promise.resolve();
    const values = collectStageValues(root, stageOrQuick);
    const badNames = invalidFieldNames(formEl);
    badNames.forEach(function(n) { delete values[n]; });
    const hasAny = Object.keys(values).some(function(k) { return values[k] !== null && values[k] !== '' && values[k] !== false; });
    if (!hasAny) { if (statusEl) statusEl.textContent = ''; return Promise.resolve(); }
    creating = true;
    if (statusEl) statusEl.textContent = 'Сохранение…';
    return ctx.api.resource('draft_contracts').create({ values: Object.assign({}, values, { is_quick: !!isQuick, created_by_id: currentUserId, last_activity_at: new Date().toISOString() }) })
      .then(function(res) {
        const rec = (res && res.data && res.data.data) ? res.data.data : res.data;
        if (statusEl) {
          statusEl.textContent = 'Сохранено';
          setTimeout(function() { if (statusEl.textContent === 'Сохранено') statusEl.textContent = ''; }, 1500);
        }
        return onCreated(rec.id);
      })
      .catch(function() {
        creating = false;
        if (statusEl) statusEl.textContent = 'Не удалось сохранить';
      });
  }
  function scheduleSave() {
    clearTimeout(timer);
    timer = setTimeout(doSave, 700);
  }
  formEl.querySelectorAll('[data-field]').forEach(function(el) {
    const evt = (el.type === 'checkbox') ? 'change' : 'input';
    el.addEventListener(evt, scheduleSave);
  });
  formEl.__cmFlush = function() { clearTimeout(timer); return doSave(); };
}

async function advanceDraftStage(id, root) {
  const res = await ctx.api.resource('draft_contracts').get({ filterByTk: id });
  const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  const stageIndex = r.current_stage || 0;
  const stage = STAGE_DEFS[stageIndex];
  const currentFormEl = root.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
  const badAdv = currentFormEl ? validateForm(currentFormEl, true) : null;
  if (badAdv) { cmToast(badAdv.msg); if (badAdv.el) badAdv.el.focus(); return; }
  if (currentFormEl && currentFormEl.__cmFlush) await currentFormEl.__cmFlush();
  else await saveStage(id, stageIndex, root, 'draft_contracts');

  if (stageIndex === STAGE_DEFS.length - 1) {
    await publishDraftContract(id, root);
    return;
  }
  await ctx.api.resource('draft_contracts').update({ filterByTk: id, values: { current_stage: stageIndex + 1, last_activity_at: new Date().toISOString() } });
  await logHistory('draft', id, [{ action: 'stage', text: 'Этап «' + stage.title + '» пройден, переход на этап «' + STAGE_DEFS[stageIndex + 1].title + '»' }]);
  closeDraftModal(true);
  await openDraftModal(id);
}

async function publishDraftContract(id, root) {
  // только для «срочного» режима — обычный этапный вызывается уже после flush/валидации в advanceDraftStage
  const formEl = root && root.querySelector('.cm-stage-form[data-stage="quick"]');
  if (formEl) {
    const bad = validateForm(formEl, false);
    if (bad) { cmToast(bad.msg); if (bad.el) bad.el.focus(); return; }
    if (formEl.__cmFlush) await formEl.__cmFlush();
  }
  if (!(await cmConfirm('Опубликовать черновик и перевести в «Формирующиеся»?'))) return;
  const res = await ctx.api.resource('draft_contracts').get({ filterByTk: id, appends: ['contract_files'] });
  const f = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
  const contractNumber = f.contract_number || f.object_name || ('#' + id);
  const payload = {
    contract_number: f.contract_number, date_signed: f.date_signed, date_act: f.date_act,
    object_name: f.object_name, tenant_name: f.tenant_name, area_sqm: f.area_sqm,
    email: f.email, phone: f.phone, tenant_fio: f.tenant_fio, current_stage: 0,
    avito_url: f.avito_url, cian_url: f.cian_url, other_url: f.other_url, purpose: f.purpose,
    comment_stage0: f.comment_stage0, comment_stage2: f.comment_stage2, comment_stage4: f.comment_stage4,
    end_date: f.end_date, rent_per_sqm: f.rent_per_sqm, utility_per_sqm: f.utility_per_sqm,
    deposit_amount: f.deposit_amount, deposit_invoiced: f.deposit_invoiced, deposit_paid: f.deposit_paid,
    rent_amount: f.rent_amount, rent_invoiced: f.rent_invoiced, rent_paid: f.rent_paid,
    utility_amount: f.utility_amount, utility_invoiced: f.utility_invoiced, utility_paid: f.utility_paid,
    total_amount: f.total_amount, inn: f.inn, bank_account: f.bank_account, bik: f.bik,
    bank_name: f.bank_name, corr_account: f.corr_account, signing_method: f.signing_method,
    actual_start_date: f.actual_start_date, contract_scan_url: f.contract_scan_url, act_scan_url: f.act_scan_url,
    notes: f.notes, is_quick: f.is_quick, kpp: f.kpp, ogrn: f.ogrn, legal_address: f.legal_address, director: f.director,
  };
  const createRes = await ctx.api.resource('forming_contracts').create({ values: payload });
  const newRec = (createRes && createRes.data && createRes.data.data) ? createRes.data.data : createRes.data;
  const newId = newRec.id;

  const fileIds = (f.contract_files || []).map(function(x) { return x.id; });
  if (fileIds.length) {
    await fetch('/api/forming_contracts/' + newId + '/contract_files:add', {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(fileIds)
    });
  }
  try {
    await fetch('/api/contract_addendums:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: 'draft', contract_ref_id: id })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: 'forming', contract_ref_id: newId })
    });
  } catch (e) { /* best-effort */ }
  try {
    await fetch('/api/contract_contacts:update?filter=' + encodeURIComponent(JSON.stringify({ contract_type: 'draft', contract_ref_id: id })), {
      method: 'POST', headers: { Authorization: 'Bearer ' + authToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_type: 'forming', contract_ref_id: newId })
    });
  } catch (e) { /* best-effort */ }

  await moveSide('contract_price_periods', 'draft', id, 'forming', newId);
  await moveHistory('draft', id, 'forming', newId);
  await logHistory('forming', newId, [{ action: 'status', text: 'Опубликовано из личного черновика' }]);

  try {
    await ctx.api.resource('draft_contracts').destroy({ filterByTk: id });
  } catch (e) {
    cmToast('Договор опубликован, но черновик не удалился — уберите вручную');
  }
  closeDraftModal(true);
  cmToast('Готово: договор «' + contractNumber + '» опубликован в «Формирующиеся»');
  if (window.refreshDraftsList) window.refreshDraftsList();
  setTimeout(function() { location.reload(); }, 400);
}

async function openDraftModal(id, isQuickHint) {
  const overlay = document.createElement('div');
  overlay.id = 'draft-modal-root';
  overlay.innerHTML = `
    <div class="ant-modal-mask" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;"></div>
    <div class="ant-modal-wrap" style="position:fixed;inset:0;z-index:1001;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;">
      <div class="ant-modal" style="width:100%;max-width:min(1200px, 96vw);">
        <div class="ant-modal-content" style="position:relative;background:#fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.12);display:flex;flex-direction:column;max-height:92vh;">
          <div class="cm-modal-toolbar">
            <button id="cm-discard-btn" style="display:none;border:1px solid #ffccc7;background:#fff2f0;color:#cf1322;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">Удалить черновик</button>
            <button id="cm-close-btn" class="ant-modal-close" style="border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;color:rgba(0,0,0,0.45);padding:4px;">✕</button>
          </div>
          <div class="ant-modal-header" style="padding:16px 24px;border-bottom:1px solid #f0f0f0;border-radius:8px 8px 0 0;flex-shrink:0;">
            <div class="ant-modal-title" style="font-weight:600;font-size:16px;">Черновик договора <span style="font-weight:400;font-size:12px;color:#999;">— виден только вам, пока не опубликован</span></div>
          </div>
          <div class="cm-body-flex" style="flex:1;min-height:0;">
            <div class="cm-data-col" id="cm-body" style="color:#8c8c8c;flex:1;">Загрузка…</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.__cmContractId = id || null;
  overlay.querySelector('.ant-modal-mask').addEventListener('click', closeDraftModal);
  overlay.querySelector('#cm-close-btn').addEventListener('click', closeDraftModal);
  document.addEventListener('keydown', onDraftModalEscape);
  setTimeout(function() { overlay.classList.add('cm-open'); }, 20);

  const body = overlay.querySelector('#cm-body');
  const currentUser = await getCurrentUser();

  async function wireLoadedDraft(r, realId) {
    overlay.__cmContractId = realId;
    body.style.color = '';
    body.innerHTML = r.is_quick ? renderQuickFormingBody(r, currentUser) : renderFormingBody(r, currentUser);
    paintInnStatus(overlay);
    await wireAddendums(overlay, 'cm-forming', 'draft', realId, currentUser);
    await wireContacts(overlay, 'cm-forming', 'draft', realId, canEditActiveBlocks(currentUser));
    await wirePrices(overlay, 'cm-forming', 'draft', realId, canEditActiveBlocks(currentUser), r);
    wireDerivedHints(overlay);
    wireHistory(overlay, 'cm-forming', 'draft', realId);
    if (r.is_quick || (r.current_stage || 0) === 0) {
      loadObjectOptions().then(function(names) { bindComboField(body, 'object_name', names); });
    }

    async function refreshDraftFiles() {
      const res2 = await ctx.api.resource('draft_contracts').get({ filterByTk: realId, appends: ['contract_files'] });
      const r2 = (res2 && res2.data && res2.data.data) ? res2.data.data : (res2 && res2.data) ? res2.data : res2;
      const listEl = overlay.querySelector('#cm-forming-files-list');
      if (listEl) listEl.innerHTML = renderFilesList(r2.contract_files || [], currentUser);
      bindFileOpenLinks(overlay);
      bindFileDeleteLinks(overlay, realId, 'draft_contracts', refreshDraftFiles);
    }
    bindFileOpenLinks(overlay);
    bindFileDeleteLinks(overlay, realId, 'draft_contracts', refreshDraftFiles);
    bindFileUpload(overlay, realId, 'draft_contracts', { input: 'cm-forming-file-input', btn: 'cm-forming-upload-btn', status: 'cm-forming-upload-status' }, refreshDraftFiles);

    wireStageCollapseToggles(overlay);
    wireStageEditToggles(overlay, realId);

    const discardBtn = overlay.querySelector('#cm-discard-btn');
    discardBtn.style.display = '';
    discardBtn.onclick = async function() {
      const contractNumber = r.contract_number || r.object_name || ('#' + realId);
      if (!(await cmConfirm('Удалить черновик «' + contractNumber + '» безвозвратно?'))) return;
      discardBtn.disabled = true;
      try {
        await ctx.api.resource('draft_contracts').destroy({ filterByTk: realId });
        await purgeContractSideData('draft', realId);
        closeDraftModal(true);
        cmToast('Черновик удалён');
        if (window.refreshDraftsList) window.refreshDraftsList();
      } catch (e) {
        cmToast('Не удалось удалить черновик');
        discardBtn.disabled = false;
      }
    };

    if (r.is_quick) {
      wireAutoSave(overlay, realId, 'quick', 'cm-save-status-quick', 'draft_contracts');
      wireFieldMasks(overlay, 'quick');
      const pubBtn = overlay.querySelector('#cm-quick-publish');
      if (pubBtn) { pubBtn.textContent = 'Опубликовать → Формирующиеся'; pubBtn.disabled = false; }
      const saveBtn = overlay.querySelector('#cm-quick-save');
      if (saveBtn) saveBtn.addEventListener('click', async function(e) {
        const btn = e.target; btn.disabled = true;
        try {
          const formEl = overlay.querySelector('.cm-stage-form[data-stage="quick"]');
          if (formEl && formEl.__cmFlush) await formEl.__cmFlush();
          cmToast('Сохранено');
        } catch (err) { cmToast('Не удалось сохранить'); } finally { btn.disabled = false; }
      });
      if (pubBtn) pubBtn.addEventListener('click', async function(e) {
        e.target.disabled = true;
        try { await publishDraftContract(realId, overlay); }
        catch (err) { cmToast('Не удалось опубликовать договор'); e.target.disabled = false; }
      });
    } else {
      const stageIndex = r.current_stage || 0;
      const isLast = stageIndex === STAGE_DEFS.length - 1;
      const actionsHtml = '<div class="cm-stage-actions">'
        + '<button class="cm-btn-save" id="cm-stage-save">Сохранить</button>'
        + '<button class="cm-btn-advance' + (isLast ? ' cm-btn-finalize' : '') + '" id="cm-stage-advance">'
        + (isLast ? 'Опубликовать → Формирующиеся' : 'Подтвердить этап и перейти дальше') + '</button>'
        + '</div>';
      const currentContent = overlay.querySelector('[data-stage-content="' + stageIndex + '"]');
      if (currentContent) currentContent.insertAdjacentHTML('beforeend', actionsHtml);

      wireAutoSave(overlay, realId, stageIndex, 'cm-save-status-' + stageIndex, 'draft_contracts');
      wireFieldMasks(overlay, stageIndex);

      const saveBtn = overlay.querySelector('#cm-stage-save');
      if (saveBtn) saveBtn.addEventListener('click', async function(e) {
        const btn = e.target; btn.disabled = true;
        try {
          const formEl = overlay.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
          if (formEl && formEl.__cmFlush) await formEl.__cmFlush();
          else await saveStage(realId, stageIndex, overlay, 'draft_contracts');
        } catch (err) { cmToast('Не удалось сохранить'); } finally { btn.disabled = false; }
      });
      const advBtn = overlay.querySelector('#cm-stage-advance');
      if (advBtn) advBtn.addEventListener('click', async function(e) {
        e.target.disabled = true;
        try { await advanceDraftStage(realId, overlay); }
        catch (err) { cmToast('Не удалось перейти дальше'); }
        finally { if (document.getElementById('draft-modal-root')) e.target.disabled = false; }
      });
    }
  }

  try {
    if (id) {
      const res = await ctx.api.resource('draft_contracts').get({ filterByTk: id, appends: ['contract_files'] });
      const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
      await wireLoadedDraft(r, id);
    } else {
      // ленивое создание: пока пользователь не заполнит хоть одно поле — записи в базе нет вовсе
      const placeholder = { is_quick: !!isQuickHint, current_stage: 0 };
      body.style.color = '';
      body.innerHTML = placeholder.is_quick ? renderQuickFormingBody(placeholder, currentUser) : renderFormingBody(placeholder, currentUser);
      wireDerivedHints(overlay);
      const stageOrQuick = placeholder.is_quick ? 'quick' : 0;
      wireFieldMasks(overlay, stageOrQuick);
      if (placeholder.is_quick || (placeholder.current_stage || 0) === 0) {
        loadObjectOptions().then(function(names) { bindComboField(body, 'object_name', names); });
      }
      const pubBtnId = placeholder.is_quick ? 'cm-quick-publish' : 'cm-stage-advance';
      if (!placeholder.is_quick) {
        const isLast = false;
        const actionsHtml = '<div class="cm-stage-actions">'
          + '<button class="cm-btn-save" id="cm-stage-save" disabled>Сохранить</button>'
          + '<button class="cm-btn-advance" id="cm-stage-advance" disabled>Подтвердить этап и перейти дальше</button>'
          + '</div>';
        const currentContent = overlay.querySelector('[data-stage-content="0"]');
        if (currentContent) currentContent.insertAdjacentHTML('beforeend', actionsHtml);
      } else {
        const pubBtn = overlay.querySelector('#cm-quick-publish');
        const saveBtnQ = overlay.querySelector('#cm-quick-save');
        if (pubBtn) { pubBtn.disabled = true; pubBtn.textContent = 'Опубликовать → Формирующиеся'; }
        if (saveBtnQ) saveBtnQ.disabled = true;
      }
      const hintEl = document.createElement('div');
      hintEl.style.cssText = 'font-size:12px;color:#999;margin-bottom:10px;';
      hintEl.textContent = 'Черновик сохранится сам, как только вы заполните хоть одно поле.';
      body.insertBefore(hintEl, body.firstChild);

      wireAutoSaveDraftLazy(overlay, stageOrQuick, placeholder.is_quick ? 'cm-save-status-quick' : 'cm-save-status-0', placeholder.is_quick, currentUser.id, async function(realId) {
        const res = await ctx.api.resource('draft_contracts').get({ filterByTk: realId, appends: ['contract_files'] });
        const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
        await wireLoadedDraft(r, realId);
        cmToast('Договор сохранён во вкладку «Черновики» — он виден только вам, пока не опубликуете');
        if (window.refreshDraftsList) window.refreshDraftsList();
      });
    }
  } catch (e) {
    body.innerHTML = '<span style="color:#c0392b;">Ошибка загрузки черновика: ' + esc(e && e.message ? e.message : e) + '</span>';
  }
}
window.openDraftModal = openDraftModal;

// ---------- список личных черновиков (вкладка «Черновики», не нативная таблица NocoBase) ----------

function ensureDraftsPanel() {
  let panel = document.getElementById('cm-drafts-panel');
  if (panel) return panel;
  const anchor = document.querySelector('[data-uid="ipb7gfluldk"]');
  const card = anchor ? anchor.closest('.ant-card') : null;
  panel = document.createElement('div');
  panel.id = 'cm-drafts-panel';
  panel.style.display = 'none';
  panel.innerHTML = '<div id="cm-drafts-list" style="padding:4px 0;color:#999;font-size:13px;">Загрузка…</div>';
  if (card && card.parentNode) card.parentNode.insertBefore(panel, card.nextSibling);
  else document.body.appendChild(panel);
  return panel;
}
function draftCardHtml(d) {
  const title = d.contract_number || d.object_name || d.tenant_name || ('Черновик #' + d.id);
  const sub = [d.object_name, d.tenant_name].filter(Boolean).join(' · ') || 'Пока без данных';
  return '<div class="cm-draft-card" data-draft-id="' + d.id + '" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:8px;cursor:pointer;background:#fff;">'
    + '<div><div style="font-weight:600;font-size:14px;">' + esc(title)
    + (d.is_quick ? ' <span style="font-size:11px;color:#ad6800;background:#fff7e6;border:1px solid #ffd591;border-radius:4px;padding:1px 6px;margin-left:6px;">срочный</span>' : '')
    + '</div><div style="font-size:12px;color:#999;margin-top:2px;">' + esc(sub) + '</div></div>'
    + '<button class="cm-draft-discard" data-draft-discard="' + d.id + '" title="Удалить черновик" style="border:none;background:transparent;color:#bbb;font-size:16px;cursor:pointer;padding:4px 8px;">✕</button>'
    + '</div>';
}
// ---------- индикатор у вкладки «Черновики»: счётчик + пульсация, когда туда падает новый договор ----------

if (!document.getElementById('cm-drafts-badge-style')) {
  const st = document.createElement('style');
  st.id = 'cm-drafts-badge-style';
  st.textContent = '#cm-drafts-badge{display:inline-block;min-width:18px;height:18px;line-height:18px;padding:0 6px;margin-left:6px;border-radius:9px;background:#fa8c16;color:#fff;font-size:11px;font-weight:600;text-align:center;vertical-align:middle;}'
    + '@keyframes cmDraftPulse{0%{box-shadow:0 0 0 0 rgba(250,140,22,0.7);transform:scale(1)}50%{transform:scale(1.25)}100%{box-shadow:0 0 0 10px rgba(250,140,22,0);transform:scale(1)}}'
    + '#cm-drafts-badge.cm-pulse{animation:cmDraftPulse 0.9s ease-out 4;}';
  document.head.appendChild(st);
}
function paintDraftsBadge() {
  const btn = document.querySelector('.registry-local-tab[data-table="cm-drafts-tab"] .ant-tabs-tab-btn');
  if (!btn) return false;
  const n = window.__cmDraftsCount || 0;
  let b = document.getElementById('cm-drafts-badge');
  if (!n) { if (b) b.remove(); return true; }
  if (!b || !btn.contains(b)) {
    if (b) b.remove();
    b = document.createElement('span');
    b.id = 'cm-drafts-badge';
    btn.appendChild(b);
  }
  if (b.textContent !== String(n)) b.textContent = String(n);
  b.title = 'Черновиков: ' + n + ' (видны только вам)';
  if (window.__cmDraftsPulse) {
    window.__cmDraftsPulse = false;
    b.classList.remove('cm-pulse');
    void b.offsetWidth;
    b.classList.add('cm-pulse');
  }
  return true;
}
function setDraftsCount(n) {
  const prev = window.__cmDraftsCount;
  window.__cmDraftsCount = n;
  if (prev !== undefined && n > prev) window.__cmDraftsPulse = true;
  paintDraftsBadge();
}
async function loadDraftsCount() {
  try {
    const currentUser = await getCurrentUser();
    const res = await ctx.api.resource('draft_contracts').list({ filter: { created_by_id: currentUser.id }, fields: ['id'], pageSize: 1 });
    const meta = res && res.data && res.data.meta;
    if (meta && typeof meta.count === 'number') setDraftsCount(meta.count);
  } catch (e) { /* индикатор не критичен */ }
}
loadDraftsCount();
// вкладки рисует другой блок и может перерисовать их — держим бейдж на месте (только DOM, без запросов)
if (!window.__cmDraftsBadgeInterval) window.__cmDraftsBadgeInterval = setInterval(paintDraftsBadge, 700);

async function refreshDraftsList() {
  const panel = ensureDraftsPanel();
  const listEl = panel.querySelector('#cm-drafts-list');
  try {
    const currentUser = await getCurrentUser();
    const res = await ctx.api.resource('draft_contracts').list({ filter: { created_by_id: currentUser.id }, sort: ['-id'], pageSize: 100 });
    const items = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
    setDraftsCount(items.length);
    listEl.innerHTML = items.length ? items.map(draftCardHtml).join('')
      : '<div style="color:#bbb;font-size:13px;">Черновиков нет — нажмите «+ Создать договор» или «+ Срочный договор»</div>';
    listEl.querySelectorAll('.cm-draft-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('[data-draft-discard]')) return;
        openDraftModal(Number(card.getAttribute('data-draft-id')));
      });
    });
    listEl.querySelectorAll('[data-draft-discard]').forEach(function(btn) {
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();
        const did = Number(btn.getAttribute('data-draft-discard'));
        if (!(await cmConfirm('Удалить черновик безвозвратно?'))) return;
        try {
          await ctx.api.resource('draft_contracts').destroy({ filterByTk: did });
          await purgeContractSideData('draft', did);
          refreshDraftsList();
        } catch (e2) { cmToast('Не удалось удалить'); }
      });
    });
  } catch (e) {
    listEl.innerHTML = '<span style="color:#c0392b;">Не удалось загрузить черновики</span>';
  }
}
window.refreshDraftsList = refreshDraftsList;
window.__cmShowDraftsPanel = function(show) {
  const panel = ensureDraftsPanel();
  panel.style.display = show ? '' : 'none';
  if (show) refreshDraftsList();
};

async function openFormingContractModal(id) {
  const overlay = document.createElement('div');
  overlay.id = 'forming-modal-root';
  overlay.innerHTML = `
    <div class="ant-modal-mask" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;"></div>
    <div class="ant-modal-wrap" style="position:fixed;inset:0;z-index:1001;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;">
      <div class="ant-modal" style="width:100%;max-width:min(1800px, 96vw);">
        <div class="ant-modal-content" style="position:relative;background:#fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.12);display:flex;flex-direction:column;max-height:92vh;">
          <div class="cm-modal-toolbar">
            <button id="cm-delete-btn" style="display:none;border:1px solid #ffccc7;background:#fff2f0;color:#cf1322;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">Удалить договор</button>
            <button id="cm-close-btn" class="ant-modal-close" style="border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;color:rgba(0,0,0,0.45);padding:4px;">✕</button>
          </div>
          <div class="ant-modal-header" style="padding:16px 24px;border-bottom:1px solid #f0f0f0;border-radius:8px 8px 0 0;flex-shrink:0;">
            <div class="ant-modal-title" style="font-weight:600;font-size:16px;">Оформление договора</div>
          </div>
          <div class="cm-body-flex" style="flex:1;min-height:0;">
            <div class="cm-chat-col" id="cm-chat-col">
              <div class="cm-chat-head" id="cm-chat-head" title="Участники и медиафайлы по договору">
                <div class="cm-chat-title">Переписка по договору</div>
                <div class="cm-chat-head-hint">Участники · Медиа ›</div>
              </div>
              <div class="cm-chat-messages" id="cm-chat-messages">Загрузка…</div>
              <div id="cm-chat-input-area"></div>
            </div>
            <div class="cm-info-panel" id="cm-info-panel"></div>
            <div class="cm-data-col" id="cm-body" style="color:#8c8c8c;">Загрузка…</div>
          </div>
          <div class="cm-members-footer" id="cm-members-footer">
            <div class="cm-members-head">
              <div class="cm-members-title">Сотрудники по договору</div>
              <button id="cm-members-add-btn" class="cm-members-add-btn" title="Добавить сотрудника" style="display:none;">+</button>
              <div class="cm-add-popover" id="cm-add-popover">
                <div class="cm-add-popover-title">Добавить сотрудника</div>
                <div class="cm-add-popover-list" id="cm-add-popover-list">Загрузка…</div>
              </div>
            </div>
            <div id="cm-members-list"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.__cmContractId = id;
  markContractNotificationsRead('forming', id);
  overlay.querySelector('.ant-modal-mask').addEventListener('click', closeFormingModal);
  overlay.querySelector('#cm-close-btn').addEventListener('click', closeFormingModal);
  document.addEventListener('keydown', onFormingModalEscape);
  setTimeout(function() { overlay.classList.add('cm-open'); }, 20);

  const body = overlay.querySelector('#cm-body');
  try {
    const currentUser = await getCurrentUser();
    const res = await ctx.api.resource('forming_contracts').get({ filterByTk: id, appends: ['contract_files', 'contract_members'] });
    const r = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : res;
    const members = r.contract_members || [];
    const isMember = !!(currentUser && members.some(function(m) { return m.id === currentUser.id; }));
    const contractNumber = r.contract_number || r.object_name || ('#' + id);
    const state = { members: members };

    if (currentUser && currentUser.__isAdmin) {
      const delBtn = overlay.querySelector('#cm-delete-btn');
      delBtn.style.display = '';
      delBtn.addEventListener('click', async function() {
        if (!(await cmConfirm('Удалить черновик договора «' + contractNumber + '» безвозвратно? Это действие нельзя отменить.'))) return;
        delBtn.disabled = true;
        try {
          await ctx.api.resource('forming_contracts').destroy({ filterByTk: id });
          await purgeContractSideData('forming', id);
          try {
            await fetch('/api/contract_chat_messages:destroy?filter=' + encodeURIComponent(JSON.stringify({ owner_contract_id: id, source: 'forming' })), {
              method: 'POST', headers: { Authorization: 'Bearer ' + authToken() }
            });
          } catch (e) { /* best-effort */ }
          closeFormingModal();
          cmToast('Черновик удалён');
          setTimeout(function() { location.reload(); }, 400);
        } catch (e) {
          cmToast('Не удалось удалить договор');
          delBtn.disabled = false;
        }
      });
    }

    initChat(id, overlay, currentUser, isMember, contractNumber, state, 'forming');

    body.style.color = '';
    body.innerHTML = r.is_quick ? renderQuickFormingBody(r, currentUser) : renderFormingBody(r, currentUser);
    paintInnStatus(overlay);
    await wireAddendums(overlay, 'cm-forming', 'forming', id, currentUser);
    await wireContacts(overlay, 'cm-forming', 'forming', id, canEditActiveBlocks(currentUser));
    await wirePrices(overlay, 'cm-forming', 'forming', id, canEditActiveBlocks(currentUser), r);
    wireDerivedHints(overlay);
    wireHistory(overlay, 'cm-forming', 'forming', id);

    if (r.is_quick || (r.current_stage || 0) === 0) {
      loadObjectOptions().then(function(names) {
        bindComboField(body, 'object_name', names);
      });
    }

    async function refreshFormingFiles() {
      const res2 = await ctx.api.resource('forming_contracts').get({ filterByTk: id, appends: ['contract_files'] });
      const r2 = (res2 && res2.data && res2.data.data) ? res2.data.data : (res2 && res2.data) ? res2.data : res2;
      const listEl = overlay.querySelector('#cm-forming-files-list');
      if (listEl) listEl.innerHTML = renderFilesList(r2.contract_files || [], currentUser);
      bindFileOpenLinks(overlay);
      bindFileDeleteLinks(overlay, id, 'forming_contracts', refreshFormingFiles);
    }
    bindFileOpenLinks(overlay);
    bindFileDeleteLinks(overlay, id, 'forming_contracts', refreshFormingFiles);
    bindFileUpload(overlay, id, 'forming_contracts', { input: 'cm-forming-file-input', btn: 'cm-forming-upload-btn', status: 'cm-forming-upload-status' }, refreshFormingFiles);

    wireStageCollapseToggles(overlay);
    wireStageEditToggles(overlay, id);

    if (r.is_quick) {
      wireAutoSave(overlay, id, 'quick', 'cm-save-status-quick');
      wireFieldMasks(overlay, 'quick');

      overlay.querySelector('#cm-quick-save').addEventListener('click', async function(e) {
        const btn = e.target;
        btn.disabled = true;
        try {
          const formEl = overlay.querySelector('.cm-stage-form[data-stage="quick"]');
          if (formEl && formEl.__cmFlush) await formEl.__cmFlush();
          else await saveStage(id, 'quick', overlay);
          cmToast('Сохранено');
        } catch (err) {
          cmToast('Не удалось сохранить');
        } finally {
          btn.disabled = false;
        }
      });
      overlay.querySelector('#cm-quick-publish').addEventListener('click', async function(e) {
        e.target.disabled = true;
        try {
          await publishQuickContract(id, overlay);
          e.target.disabled = false;
        } catch (err) {
          cmToast('Не удалось опубликовать договор');
          e.target.disabled = false;
        }
      });
    } else {
      const stageIndex = r.current_stage || 0;
      const stage = STAGE_DEFS[stageIndex];
      const canAdvance = hasRole(currentUser, stage.role);
      const isLast = stageIndex === STAGE_DEFS.length - 1;
      const actionsHtml = '<div class="cm-stage-actions">'
        + '<button class="cm-btn-save" id="cm-stage-save">Сохранить</button>'
        + '<button class="cm-btn-advance' + (isLast ? ' cm-btn-finalize' : '') + '" id="cm-stage-advance"' + (canAdvance ? '' : ' disabled') + '>'
        + (isLast ? 'Завершить оформление → Активные' : 'Подтвердить этап и перейти дальше') + '</button>'
        + (canAdvance ? '' : '<span class="cm-role-hint">Подтверждает роль «' + esc(STAGE_ROLE_TITLES[stage.role]) + '»</span>')
        + '</div>';
      const currentContent = overlay.querySelector('[data-stage-content="' + stageIndex + '"]');
      currentContent.insertAdjacentHTML('beforeend', actionsHtml);

      wireAutoSave(overlay, id, stageIndex, 'cm-save-status-' + stageIndex);
      wireFieldMasks(overlay, stageIndex);

      overlay.querySelector('#cm-stage-save').addEventListener('click', async function(e) {
        const btn = e.target;
        btn.disabled = true;
        try {
          const formEl = overlay.querySelector('.cm-stage-form[data-stage="' + stageIndex + '"]');
          if (formEl && formEl.__cmFlush) await formEl.__cmFlush();
          else await saveStage(id, stageIndex, overlay);
        } catch (err) {
          cmToast('Не удалось сохранить');
        } finally {
          btn.disabled = false;
        }
      });
      overlay.querySelector('#cm-stage-advance').addEventListener('click', async function(e) {
        e.target.disabled = true;
        try {
          await advanceStage(id, overlay, currentUser);
          e.target.disabled = false;
        } catch (err) {
          cmToast('Не удалось перейти на следующий этап');
          e.target.disabled = false;
        }
      });
    }

    initMembers(id, overlay, members, !!(currentUser && currentUser.__isAdmin), contractNumber, state, 'forming_contracts', 'forming');
  } catch (e) {
    body.innerHTML = '<span style="color:#c0392b;">Ошибка загрузки договора: ' + esc(e && e.message ? e.message : e) + '</span>';
  }
}
window.openFormingContractModal = openFormingContractModal;
window.openCompletedContractModal = openCompletedContractModal;

function injectCreateContractButton() {
  if (document.getElementById('cm-create-btn')) return;
  const search = document.getElementById('global-search-input');
  if (!search || !search.parentElement) { setTimeout(injectCreateContractButton, 300); return; }
  const parent = search.parentElement;
  parent.style.display = 'flex';
  parent.style.alignItems = 'center';
  parent.style.gap = '12px';
  search.style.width = '';
  search.style.flex = '1';
  search.style.minWidth = '0';
  search.style.maxWidth = '420px';

  const btn = document.createElement('button');
  btn.id = 'cm-create-btn';
  btn.textContent = '+ Создать договор';
  btn.style.cssText = 'flex-shrink:0;white-space:nowrap;border:none;background:#1677ff;color:#fff;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.10);';
  btn.addEventListener('click', async function() {
    await openDraftModal(null, false);
  });
  parent.appendChild(btn);

  const quickBtn = document.createElement('button');
  quickBtn.id = 'cm-create-quick-btn';
  quickBtn.textContent = '+ Срочный договор';
  quickBtn.title = 'Экстренное оформление: все данные одной формой, без этапов';
  quickBtn.style.cssText = 'flex-shrink:0;white-space:nowrap;border:1px solid #ffd591;background:#fff7e6;color:#ad6800;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.10);';
  quickBtn.addEventListener('click', async function() {
    await openDraftModal(null, true);
  });
  parent.appendChild(quickBtn);
}
injectCreateContractButton();

function markTables() {
  document.querySelectorAll('table').forEach(table => {
    const ths = table.querySelectorAll('thead th');
    const isMain = Array.from(ths).some(th => th.textContent.trim() === 'Номер договора');
    const card = table.closest('.ant-card');
    if (card) {
      card.classList.toggle('main-registry-clickable-rows', isMain);
    }
  });
}
function openFromUrl() {
  const m = location.search.match(/[?&]open=(forming|active|completed):(\d+)/);
  if (!m) { window.__cmOpenedKey = null; return; }
  const key = m[1] + ':' + m[2];
  if (window.__cmOpenedKey === key) return;
  window.__cmOpenedKey = key;
  try { history.replaceState(history.state, '', location.pathname); } catch (e) { /* ignore */ }
  if (m[1] === 'forming') openFormingContractModal(m[2]);
  else if (m[1] === 'completed') openCompletedContractModal(m[2]);
  else openContractModal(m[2]);
}
openFromUrl();
if (!window.__cmOpenFromUrlInterval) window.__cmOpenFromUrlInterval = setInterval(openFromUrl, 700);

markTables();
if (!window.__mainRegistryMarkInterval) {
  window.__mainRegistryMarkInterval = setInterval(markTables, 500);
}
if (!document.getElementById('main-registry-row-style')) {
  const style = document.createElement('style');
  style.id = 'main-registry-row-style';
  style.textContent = '.main-registry-clickable-rows .ant-table-tbody > tr:hover > td { cursor: pointer; background: #f5f5f5 !important; }';
  document.head.appendChild(style);
}
if (!window.__mainRowClickBound) {
  window.__mainRowClickBound = true;
  document.addEventListener('click', (e) => {
    const row = e.target.closest ? e.target.closest('.ant-table-tbody > tr') : null;
    if (!row) return;
    if (e.target.closest('button, a, .ant-btn, .edit-icon, .ant-select, .ant-popover, .ant-select-dropdown')) return;
    const table = row.closest('table');
    if (!table) return;
    const ths = table.querySelectorAll('thead th');
    const isMain = Array.from(ths).some(th => th.textContent.trim() === 'Номер договора');
    if (!isMain) return;
    const key = row.getAttribute('data-row-key');
    if (!key) return;
    const blockEl = table.closest('[data-uid]');
    const uid = blockEl ? blockEl.getAttribute('data-uid') : null;
    if (uid === 'formtbl000001') {
      openFormingContractModal(key);
    } else if (uid === 'ipb7gfluldk') {
      openCompletedContractModal(key);
    } else {
      openContractModal(key);
    }
  });
}
