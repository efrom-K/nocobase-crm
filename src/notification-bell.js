ctx.render('');

function nbEsc(v) {
  if (v === null || v === undefined || v === '') return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function nbAuthToken() {
  try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; }
}
function nbFmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return 'сегодня в ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  return pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

const BELL_SVG = '<svg viewBox="64 64 896 896" width="19" height="19" fill="currentColor"><path d="M816 768h-24V428c0-141.1-104.3-257.7-240-277.1V112c0-22.1-17.9-40-40-40s-40 17.9-40 40v38.9c-135.7 19.4-240 136-240 277.1v340h-24c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h216c0 61.8 50.2 112 112 112s112-50.2 112-112h216c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM512 888c-26.5 0-48-21.5-48-48h96c0 26.5-21.5 48-48 48zM304 768V428c0-55.6 21.6-107.8 60.9-147.1S456.4 220 512 220c55.6 0 107.8 21.6 147.1 60.9S720 372.4 720 428v340H304z"/></svg>';

if (!document.getElementById('nb-bell-style')) {
  const style = document.createElement('style');
  style.id = 'nb-bell-style';
  style.textContent = `
    button:has(.anticon-bell) { opacity: 0 !important; pointer-events: none !important; }
    #nb-bell-root { position: fixed; top: 74px; right: 28px; z-index: 500; }
    #nb-bell-btn { position: relative; width: 40px; height: 40px; border-radius: 50%; background: #fff; border: 1px solid #eee; box-shadow: 0 3px 10px rgba(0,0,0,0.10); cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.65); transition: box-shadow .15s, transform .15s, color .15s; }
    #nb-bell-btn:hover { box-shadow: 0 5px 16px rgba(0,0,0,0.16); transform: translateY(-1px); color: #1677ff; }
    #nb-bell-badge { position: absolute; top: -3px; right: -3px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: #f5222d; color: #fff; font-size: 10px; font-weight: 700; display: none; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff; }
    #nb-bell-badge.show { display: flex; }
    #nb-panel { position: absolute; top: 48px; right: 0; width: 340px; max-height: 420px; background: #fff; border-radius: 12px; box-shadow: 0 10px 32px rgba(0,0,0,0.18); border: 1px solid #f0f0f0; overflow: hidden; display: flex; flex-direction: column; opacity: 0; transform: translateY(-8px) scale(0.98); pointer-events: none; transition: opacity .15s ease, transform .15s ease; }
    #nb-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    #nb-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
    #nb-panel-title { font-weight: 700; font-size: 14px; color: #1a1a1a; }
    #nb-mark-all { font-size: 12px; color: #1677ff; cursor: pointer; background: none; border: none; padding: 0; }
    #nb-mark-all:hover { text-decoration: underline; }
    #nb-mark-all[disabled] { color: #ccc; cursor: default; text-decoration: none; }
    #nb-panel-list { overflow-y: auto; flex: 1; }
    .nb-item { display: flex; gap: 10px; padding: 11px 14px; cursor: pointer; border-bottom: 1px solid #f7f7f7; transition: background .12s; }
    .nb-item:hover { background: #f5f8ff; }
    .nb-item:last-child { border-bottom: none; }
    .nb-item.unread { background: #f0f6ff; }
    .nb-item.unread:hover { background: #e6f1ff; }
    .nb-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; background: #1677ff; }
    .nb-item.read .nb-dot { background: #d9d9d9; }
    .nb-item-body { flex: 1; min-width: 0; }
    .nb-item-title { font-size: 12.5px; font-weight: 600; color: #1a1a1a; margin-bottom: 1px; }
    .nb-item-text { font-size: 13px; color: #595959; line-height: 1.4; }
    .nb-item.read .nb-item-text, .nb-item.read .nb-item-title { color: #b0b0b0; font-weight: 400; }
    .nb-item-time { font-size: 11px; color: #b0b0b0; margin-top: 3px; }
    .nb-empty { padding: 40px 20px; text-align: center; color: #b0b0b0; font-size: 13px; }
    .nb-section-head { padding: 8px 14px 4px; font-size: 11px; font-weight: 700; color: #9aa1ac; text-transform: uppercase; letter-spacing: .03em; display: flex; align-items: center; gap: 6px; }
    .nb-section-head .nb-tag { width: 7px; height: 7px; border-radius: 50%; }
    .nb-tag.archive { background: #f0a93b; }
    .nb-tag.chat { background: #2f88ff; }
  `;
  document.head.appendChild(style);
}

let __nbCurrentUser = null;
async function nbGetCurrentUser() {
  if (__nbCurrentUser) return __nbCurrentUser;
  try {
    const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + nbAuthToken() } });
    const data = await res.json();
    __nbCurrentUser = (data && data.data) ? data.data : null;
  } catch (e) { __nbCurrentUser = null; }
  return __nbCurrentUser;
}

function nbPayload(res) {
  const payload = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  return Array.isArray(payload) ? payload : [];
}

async function nbLoadNotifications(userId) {
  const [archiveRes, chatRes] = await Promise.all([
    ctx.api.resource('contract_notifications').list({ filter: { user_id: userId, is_read: false }, sort: ['-created_at'], pageSize: 50 }),
    ctx.api.resource('chat_notifications').list({ filter: { user_id: userId, is_read: false }, sort: ['-created_at'], pageSize: 50 })
  ]);
  const archive = nbPayload(archiveRes).map(function (n) { return Object.assign({}, n, { kind: 'archive' }); });
  const chat = nbPayload(chatRes).map(function (n) { return Object.assign({}, n, { kind: 'chat' }); });
  return { archive: archive, chat: chat };
}

async function nbMarkRead(kind, id) {
  const coll = kind === 'chat' ? 'chat_notifications' : 'contract_notifications';
  try {
    await ctx.api.resource(coll).update({ filterByTk: id, values: { is_read: true } });
  } catch (e) { /* best-effort */ }
}

function nbSetup() {
  if (document.getElementById('nb-bell-root')) return;

  const root = document.createElement('div');
  root.id = 'nb-bell-root';
  root.innerHTML = `
    <div id="nb-bell-btn">
      ${BELL_SVG}
      <span id="nb-bell-badge"></span>
    </div>
    <div id="nb-panel">
      <div id="nb-panel-head">
        <div id="nb-panel-title">Уведомления</div>
        <button id="nb-mark-all">Прочитать всё</button>
      </div>
      <div id="nb-panel-list"><div class="nb-empty">Загрузка…</div></div>
    </div>
  `;
  document.body.appendChild(root);

  const btn = root.querySelector('#nb-bell-btn');
  const badge = root.querySelector('#nb-bell-badge');
  const panel = root.querySelector('#nb-panel');
  const list = root.querySelector('#nb-panel-list');
  const markAllBtn = root.querySelector('#nb-mark-all');

  let cached = { archive: [], chat: [] };

  function itemHtml(n) {
    return '<div class="nb-item unread" data-kind="' + n.kind + '" data-id="' + n.id + '" data-contract="' + (n.contract_id || '') + '" data-conv="' + (n.conversation_id || '') + '" data-source="' + nbEsc(n.source || 'active') + '">'
      + '<span class="nb-dot"></span>'
      + '<div class="nb-item-body"><div class="nb-item-title">' + nbEsc(n.title) + '</div>'
      + '<div class="nb-item-text">' + nbEsc(n.text) + '</div>'
      + '<div class="nb-item-time">' + nbEsc(nbFmtDateTime(n.created_at)) + '</div></div>'
      + '</div>';
  }

  function renderList() {
    const total = cached.archive.length + cached.chat.length;
    if (!total) {
      list.innerHTML = '<div class="nb-empty">Уведомлений пока нет</div>';
      return;
    }
    let html = '';
    if (cached.archive.length) {
      html += '<div class="nb-section-head"><span class="nb-tag archive"></span>Договоры</div>' + cached.archive.map(itemHtml).join('');
    }
    if (cached.chat.length) {
      html += '<div class="nb-section-head"><span class="nb-tag chat"></span>Сообщения</div>' + cached.chat.map(itemHtml).join('');
    }
    list.innerHTML = html;
    list.querySelectorAll('.nb-item').forEach(function(item) {
      item.addEventListener('click', async function() {
        const kind = item.getAttribute('data-kind');
        const id = Number(item.getAttribute('data-id'));
        const contractId = item.getAttribute('data-contract');
        const convId = item.getAttribute('data-conv');
        const source = item.getAttribute('data-source');
        await nbMarkRead(kind, id);
        cached[kind] = cached[kind].filter(function(x) { return x.id !== id; });
        updateBadge();
        renderList();
        panel.classList.remove('open');
        if (kind === 'chat') {
          if (convId && window.__msgrOpenConversation) window.__msgrOpenConversation(convId);
          return;
        }
        if (!contractId) return;
        if (source === 'forming' && window.openFormingContractModal) {
          window.openFormingContractModal(contractId);
        } else if (window.openContractModal) {
          window.openContractModal(contractId);
        }
      });
    });
  }

  function updateBadge() {
    const unreadCount = cached.archive.length + cached.chat.length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      badge.classList.add('show');
      markAllBtn.removeAttribute('disabled');
    } else {
      badge.classList.remove('show');
      markAllBtn.setAttribute('disabled', 'true');
    }
  }

  async function refresh() {
    const user = await nbGetCurrentUser();
    if (!user) return;
    try {
      cached = await nbLoadNotifications(user.id);
      updateBadge();
      if (panel.classList.contains('open')) renderList();
    } catch (e) { /* silent */ }
  }

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open');
    if (willOpen) renderList();
  });
  document.addEventListener('click', function(e) {
    if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
  markAllBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    if (markAllBtn.hasAttribute('disabled')) return;
    const toMark = cached.archive.map(function(n) { return { kind: 'archive', id: n.id }; })
      .concat(cached.chat.map(function(n) { return { kind: 'chat', id: n.id }; }));
    markAllBtn.setAttribute('disabled', 'true');
    await Promise.all(toMark.map(function(n) { return nbMarkRead(n.kind, n.id); }));
    cached = { archive: [], chat: [] };
    updateBadge();
    renderList();
  });

  refresh();
  if (!window.__nbPollInterval) {
    window.__nbPollInterval = setInterval(refresh, 20000);
  }
}

nbSetup();
