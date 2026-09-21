window.__cmEngine = ctx.model.flowEngine;

ctx.render('<div class="ant-tabs ant-tabs-top" style="margin-bottom:8px;"><div class="ant-tabs-nav"><div class="ant-tabs-nav-wrap"><div id="registry-local-tabs" class="ant-tabs-nav-list" style="display:flex;border-bottom:1px solid #f0f0f0;"><div class="registry-local-tab ant-tabs-tab ant-tabs-tab-active" data-table="ozazmpm4o4v" style="cursor:pointer;padding:8px 4px;margin-right:24px;border-bottom:2px solid transparent;"><div class="ant-tabs-tab-btn">Активные</div></div><div class="registry-local-tab ant-tabs-tab" data-table="formtbl000001" style="cursor:pointer;padding:8px 4px;margin-right:24px;border-bottom:2px solid transparent;"><div class="ant-tabs-tab-btn">Формирующиеся</div></div><div class="registry-local-tab ant-tabs-tab" data-table="ipb7gfluldk" style="cursor:pointer;padding:8px 4px;margin-right:24px;border-bottom:2px solid transparent;"><div class="ant-tabs-tab-btn">Архив</div></div><div style="margin-left:auto;align-self:center;padding-bottom:4px;"><button id="cm-cols-btn" type="button">⚙ Столбцы</button></div></div></div></div></div>');

const TABLES = ["ozazmpm4o4v", "formtbl000001", "ipb7gfluldk"];

function paintActive(uid) {
  document.querySelectorAll('.registry-local-tab').forEach(function(t) {
    const isActive = t.getAttribute('data-table') === uid;
    t.classList.toggle('ant-tabs-tab-active', isActive);
    t.style.borderBottomColor = isActive ? '#1677ff' : 'transparent';
    t.style.color = isActive ? '#1677ff' : 'rgba(0,0,0,0.88)';
    t.style.fontWeight = isActive ? '600' : '400';
  });
}

function applyVisibility(uid) {
  let allFound = true;
  TABLES.forEach(function(t) {
    const el = document.querySelector('[data-uid="' + t + '"]');
    const card = el ? el.closest('.ant-card') : null;
    if (card) {
      card.style.display = (t === uid) ? '' : 'none';
    } else {
      allFound = false;
    }
  });
  return allFound;
}

function switchRegistryTable(uid) {
  window.__activeRegistryTable = uid;
  applyVisibility(uid);
  paintActive(uid);
  const search = document.getElementById('global-search-input');
  if (search) search.value = '';
  const colsPanel = document.getElementById('cm-cols-panel');
  if (colsPanel && colsPanel.style.display === 'block' && typeof renderColsPanel === 'function') renderColsPanel();
}
window.switchRegistryTable = switchRegistryTable;

document.querySelectorAll('.registry-local-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    switchRegistryTable(tab.getAttribute('data-table'));
  });
});

if (!window.__activeRegistryTable) {
  window.__activeRegistryTable = "ozazmpm4o4v";
}
if (!window.__registryVisibilityRetry) {
  window.__registryVisibilityRetry = setInterval(function() {
    const done = applyVisibility(window.__activeRegistryTable);
    if (done) {
      clearInterval(window.__registryVisibilityRetry);
      window.__registryVisibilityRetry = null;
    }
  }, 200);
}

// ---------- личная настройка столбцов таблиц ----------
// У каждого пользователя свой набор и порядок столбцов; хранится в user_table_settings (и дублируется в localStorage).
const COL_DEFAULT_HIDDEN = ['end_date', 'rent_amount', 'deposit_amount', 'inn'];
const colDefaults = {};   // uid -> { order: [...], hidden: [...] } (как настроено администратором)
const colCfg = {};        // uid -> текущая конфигурация пользователя { order, hidden }
const colRowIds = {};     // uid -> id строки в user_table_settings
let colUserId = null;
let colSync = true;
let colSaveTimers = {};

function colAuthHeaders() {
  let t = null;
  try { t = localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { /* ignore */ }
  return { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
}
function colTable(uid) {
  const e = window.__cmEngine;
  return e && e.getModel ? e.getModel(uid) : null;
}
function colModels(uid) {
  const t = colTable(uid);
  const cols = t && t.subModels && t.subModels.columns ? t.subModels.columns : [];
  return cols.filter(function(c) { return c && c.props && c.props.dataIndex; });
}
function colName(c) { return c.props.dataIndex; }

function captureColDefaults(uid) {
  if (colDefaults[uid]) return;
  const cols = colModels(uid).slice().sort(function(a, b) { return (a.sortIndex || 0) - (b.sortIndex || 0); });
  colDefaults[uid] = {
    order: cols.map(colName),
    hidden: cols.map(colName).filter(function(n) { return COL_DEFAULT_HIDDEN.indexOf(n) !== -1; })
  };
}
function effectiveCfg(uid) {
  return colCfg[uid] || colDefaults[uid] || { order: [], hidden: [] };
}
// применяет конфигурацию к столбцам таблицы (только в браузере, в настройки страницы ничего не пишется)
function applyColCfg(uid, cfg) {
  const cols = colModels(uid);
  if (!cols.length) return false;
  const def = colDefaults[uid] || { order: [] };
  const order = (cfg.order || []).filter(function(n) { return cols.some(function(c) { return colName(c) === n; }); });
  const known = {};
  order.forEach(function(n, i) { known[n] = i; });
  const hidden = {};
  (cfg.hidden || []).forEach(function(n) { hidden[n] = true; });
  cols.forEach(function(c) {
    const n = colName(c);
    const idx = known.hasOwnProperty(n) ? known[n] : (order.length + Math.max(def.order.indexOf(n), 0));
    c.sortIndex = idx;
  });
  cols.forEach(function(c) { c.setHidden(!!hidden[colName(c)]); });
  cols.forEach(function(c) { if (c.rerender) c.rerender(); });
  const t = colTable(uid);
  if (t && t.rerender) t.rerender();
  return true;
}
function colLsKey(uid) { return 'cm-cols-' + colUserId + '-' + uid; }
function rememberCfg(uid, cfg) {
  colCfg[uid] = { order: (cfg.order || []).slice(), hidden: (cfg.hidden || []).slice() };
  try { localStorage.setItem(colLsKey(uid), JSON.stringify(colCfg[uid])); } catch (e) { /* ignore */ }
}
function saveColCfgRemote(uid) {
  clearTimeout(colSaveTimers[uid]);
  colSaveTimers[uid] = setTimeout(async function() {
    if (colUserId === null) return;
    try {
      const values = { user_id: colUserId, table_uid: uid, config: colCfg[uid] };
      if (colRowIds[uid]) {
        await ctx.api.resource('user_table_settings').update({ filterByTk: colRowIds[uid], values: values });
      } else {
        const res = await ctx.api.resource('user_table_settings').create({ values: values });
        const rec = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : null;
        if (rec && rec.id) colRowIds[uid] = rec.id;
      }
    } catch (e) { /* нет прав или сеть: настройка остаётся в этом браузере (localStorage) */ }
  }, 500);
}
function setColCfg(uid, cfg, persist) {
  rememberCfg(uid, cfg);
  applyColCfg(uid, colCfg[uid]);
  if (persist) saveColCfgRemote(uid);
}

async function initColumnSettings() {
  // ждём, пока модели таблиц и столбцы появятся
  let tries = 0;
  await new Promise(function(resolve) {
    const timer = setInterval(function() {
      tries++;
      const ready = TABLES.every(function(u) { return colModels(u).length > 0; });
      if (ready || tries > 300) { clearInterval(timer); resolve(); }
    }, 50);
  });
  TABLES.forEach(function(u) { captureColDefaults(u); });
  // настройка администратора: запасные столбцы скрыты сразу, до загрузки личных настроек
  TABLES.forEach(function(u) { applyColCfg(u, colDefaults[u]); });
  try {
    const r = await fetch('/api/auth:check', { headers: colAuthHeaders() });
    const j = await r.json();
    colUserId = j && j.data ? j.data.id : null;
  } catch (e) { colUserId = null; }
  if (colUserId === null) return;
  try { colSync = localStorage.getItem('cm-cols-sync-' + colUserId) !== '0'; } catch (e) { /* ignore */ }
  // быстрый путь: копия из localStorage
  TABLES.forEach(function(u) {
    try {
      const raw = localStorage.getItem(colLsKey(u));
      if (raw) { colCfg[u] = JSON.parse(raw); applyColCfg(u, colCfg[u]); }
    } catch (e) { /* ignore */ }
  });
  // основной источник: личные настройки из БД
  try {
    const res = await ctx.api.resource('user_table_settings').list({ filter: { user_id: colUserId }, pageSize: 20 });
    const rows = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
    (Array.isArray(rows) ? rows : []).forEach(function(row) {
      if (TABLES.indexOf(row.table_uid) === -1 || !row.config) return;
      colRowIds[row.table_uid] = row.id;
      rememberCfg(row.table_uid, row.config);
      applyColCfg(row.table_uid, colCfg[row.table_uid]);
    });
  } catch (e) { /* остаёмся на localStorage/умолчаниях */ }
}

// ----- панель «Столбцы» -----
if (!document.getElementById('cm-cols-style')) {
  const st = document.createElement('style');
  st.id = 'cm-cols-style';
  st.textContent = `
    #cm-cols-btn { border: 1px solid #d9d9d9; background: #fff; color: #262626; border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
    #cm-cols-btn:hover { border-color: #1677ff; color: #1677ff; }
    #cm-cols-panel { position: fixed; z-index: 1100; width: 340px; max-height: 70vh; overflow: auto; background: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.18); padding: 14px 16px; display: none; }
    #cm-cols-panel .cm-cols-title { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
    #cm-cols-panel .cm-cols-hint { color: #8c8c8c; font-size: 12px; margin-bottom: 10px; }
    #cm-cols-panel .cm-cols-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    #cm-cols-panel .cm-cols-row label { flex: 1; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    #cm-cols-panel .cm-cols-move { border: 1px solid #e0e0e0; background: #fff; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; color: #595959; line-height: 1; }
    #cm-cols-panel .cm-cols-move:hover:not(:disabled) { border-color: #1677ff; color: #1677ff; }
    #cm-cols-panel .cm-cols-move:disabled { opacity: 0.3; cursor: default; }
    #cm-cols-panel .cm-cols-foot { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    #cm-cols-panel .cm-cols-btns { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    #cm-cols-panel .cm-cols-sync { font-size: 12px; color: #595959; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    #cm-cols-panel button.cm-cols-act { border: 1px solid #d9d9d9; background: #fff; border-radius: 6px; padding: 5px 16px; font-size: 13px; cursor: pointer; white-space: nowrap; }
    #cm-cols-panel button.cm-cols-act.primary { background: #1677ff; border-color: #1677ff; color: #fff; }
  `;
  document.head.appendChild(st);
}
function colTitleOf(c) { return c.props.title || colName(c); }
function currentOrderNames(uid) {
  const cols = colModels(uid).slice().sort(function(a, b) { return (a.sortIndex || 0) - (b.sortIndex || 0); });
  return cols.map(colName);
}
function tableTitle(uid) {
  const tab = document.querySelector('.registry-local-tab[data-table="' + uid + '"]');
  return tab ? tab.innerText.trim() : '';
}
function renderColsPanel() {
  const panel = document.getElementById('cm-cols-panel');
  if (!panel) return;
  const uid = window.__activeRegistryTable || TABLES[0];
  const names = currentOrderNames(uid);
  const cfg = effectiveCfg(uid);
  const hidden = {};
  (cfg.hidden || []).forEach(function(n) { hidden[n] = true; });
  const models = {};
  colModels(uid).forEach(function(c) { models[colName(c)] = c; });
  const visibleCount = names.filter(function(n) { return !hidden[n]; }).length;
  panel.innerHTML = '<div class="cm-cols-title">Столбцы таблицы «' + tableTitle(uid) + '»</div>'
    + '<div class="cm-cols-hint">Отметьте нужные и расставьте порядок стрелками. Настройка личная, у других пользователей своя.</div>'
    + names.map(function(n, i) {
        const onlyOne = !hidden[n] && visibleCount <= 1;
        return '<div class="cm-cols-row"><label><input type="checkbox" data-col="' + n + '"' + (hidden[n] ? '' : ' checked') + (onlyOne ? ' disabled' : '') + '> ' + colTitleOf(models[n]) + '</label>'
          + '<button class="cm-cols-move" data-move="up" data-col="' + n + '"' + (i === 0 ? ' disabled' : '') + ' title="Выше">↑</button>'
          + '<button class="cm-cols-move" data-move="down" data-col="' + n + '"' + (i === names.length - 1 ? ' disabled' : '') + ' title="Ниже">↓</button></div>';
      }).join('')
    + '<div class="cm-cols-foot"><label class="cm-cols-sync"><input type="checkbox" id="cm-cols-sync"' + (colSync ? ' checked' : '') + '> Одинаково для всех вкладок</label>'
    + '<div class="cm-cols-btns"><button class="cm-cols-act" id="cm-cols-reset">Сбросить</button><button class="cm-cols-act primary" id="cm-cols-done">Готово</button></div></div>';

  function commit(newCfg) {
    const targets = colSync ? TABLES : [uid];
    targets.forEach(function(u) {
      // порядок и скрытые столбцы переносятся на другие вкладки по именам полей
      setColCfg(u, { order: newCfg.order.slice(), hidden: newCfg.hidden.slice() }, true);
    });
    renderColsPanel();
  }
  panel.querySelectorAll('input[data-col]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      const n = cb.getAttribute('data-col');
      const h = (effectiveCfg(uid).hidden || []).filter(function(x) { return x !== n; });
      if (!cb.checked) h.push(n);
      commit({ order: currentOrderNames(uid), hidden: h });
    });
  });
  panel.querySelectorAll('button[data-move]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const n = btn.getAttribute('data-col');
      const order = currentOrderNames(uid);
      const i = order.indexOf(n);
      const j = btn.getAttribute('data-move') === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= order.length) return;
      const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      commit({ order: order, hidden: (effectiveCfg(uid).hidden || []).slice() });
    });
  });
  panel.querySelector('#cm-cols-sync').addEventListener('change', function(e) {
    colSync = e.target.checked;
    try { localStorage.setItem('cm-cols-sync-' + colUserId, colSync ? '1' : '0'); } catch (err) { /* ignore */ }
    if (colSync) commit({ order: currentOrderNames(uid), hidden: (effectiveCfg(uid).hidden || []).slice() });
  });
  panel.querySelector('#cm-cols-reset').addEventListener('click', function() {
    (colSync ? TABLES : [uid]).forEach(function(u) {
      const d = colDefaults[u];
      setColCfg(u, { order: d.order.slice(), hidden: d.hidden.slice() }, true);
    });
    renderColsPanel();
  });
  panel.querySelector('#cm-cols-done').addEventListener('click', closeColsPanel);
}
function openColsPanel() {
  let panel = document.getElementById('cm-cols-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'cm-cols-panel';
    document.body.appendChild(panel);
  }
  const btn = document.getElementById('cm-cols-btn');
  const r = btn.getBoundingClientRect();
  panel.style.top = (r.bottom + 6) + 'px';
  panel.style.left = Math.max(8, Math.min(r.right - 340, window.innerWidth - 348)) + 'px';
  panel.style.display = 'block';
  renderColsPanel();
}
function closeColsPanel() {
  const panel = document.getElementById('cm-cols-panel');
  if (panel) panel.style.display = 'none';
}
(function bindColsButton() {
  const btn = document.getElementById('cm-cols-btn');
  if (!btn || btn.__cmBound) return;
  btn.__cmBound = true;
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const panel = document.getElementById('cm-cols-panel');
    if (panel && panel.style.display === 'block') closeColsPanel(); else openColsPanel();
  });
})();
if (!window.__cmColsDocBound) {
  window.__cmColsDocBound = true;
  document.addEventListener('click', function(e) {
    const panel = document.getElementById('cm-cols-panel');
    if (!panel || panel.style.display !== 'block') return;
    // путь события считается в момент клика: кнопка внутри панели могла быть уже перерисована и оторвана от DOM
    const path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(panel) !== -1 || panel.contains(e.target) || (e.target.closest && e.target.closest('#cm-cols-btn'))) return;
    closeColsPanel();
  });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeColsPanel(); });
}
initColumnSettings();

// ---------- подсветка договоров, по которым есть непрочитанные уведомления ----------
// Ссылка в сообщении вида ...?open=<active|forming|completed>:<id> показывает, к какому договору оно относится;
// строка договора в таблице подсвечивается, на вкладке видно число таких договоров. Пока сообщение не прочитано в колокольчике.
const NOTIF_TABLE_BY_SOURCE = { active: 'ozazmpm4o4v', forming: 'formtbl000001', completed: 'ipb7gfluldk' };
window.__cmNotifRows = window.__cmNotifRows || {};
if (!document.getElementById('cm-notif-style')) {
  const nst = document.createElement('style');
  nst.id = 'cm-notif-style';
  nst.textContent = `
    @keyframes cm-notif-pulse { 0%, 100% { box-shadow: inset 4px 0 0 #fa8c16; } 50% { box-shadow: inset 4px 0 0 #ffd591; } }
    .ant-table-tbody > tr.cm-notif-row > td { background: #fff7e6 !important; }
    .main-registry-clickable-rows .ant-table-tbody > tr.cm-notif-row:hover > td { background: #ffe7ba !important; }
    .ant-table-tbody > tr.cm-notif-row > td:first-child { animation: cm-notif-pulse 2s ease-in-out infinite; }
    .cm-tab-badge { display: inline-block; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px; padding: 0 5px; margin-left: 6px; background: #fa8c16; color: #fff; font-size: 11px; font-weight: 600; text-align: center; vertical-align: 1px; }
  `;
  document.head.appendChild(nst);
}
function paintNotifRows() {
  const map = window.__cmNotifRows || {};
  TABLES.forEach(function(uid) {
    const ids = map[uid] || {};
    document.querySelectorAll('[data-uid="' + uid + '"] .ant-table-tbody > tr[data-row-key]').forEach(function(tr) {
      const msgs = ids[tr.getAttribute('data-row-key')];
      if (msgs) {
        if (!tr.classList.contains('cm-notif-row')) tr.classList.add('cm-notif-row');
        const tip = 'Непрочитанные уведомления по этому договору:\n' + msgs.slice(0, 4).join('\n') + (msgs.length > 4 ? '\n…' : '');
        if (tr.title !== tip) tr.title = tip;
      } else if (tr.classList.contains('cm-notif-row')) {
        tr.classList.remove('cm-notif-row');
        tr.removeAttribute('title');
      }
    });
    const tab = document.querySelector('.registry-local-tab[data-table="' + uid + '"] .ant-tabs-tab-btn');
    if (tab) {
      let badge = tab.querySelector('.cm-tab-badge');
      const n = Object.keys(ids).length;
      if (n) {
        if (!badge) { badge = document.createElement('span'); badge.className = 'cm-tab-badge'; tab.appendChild(badge); }
        if (badge.textContent !== String(n)) badge.textContent = String(n);
        badge.title = 'Договоров с непрочитанными уведомлениями: ' + n;
      } else if (badge) badge.remove();
    }
  });
}
async function refreshNotifRows() {
  try {
    const r = await fetch('/api/myInAppMessages:list?filter[status]=unread&pageSize=200', { headers: colAuthHeaders() });
    const j = await r.json();
    const list = (j && j.data && j.data.messages) ? j.data.messages : [];
    const map = {};
    list.forEach(function(m) {
      const url = m.options && m.options.url ? String(m.options.url) : '';
      const mm = url.match(/[?&]open=(forming|active|completed):(\d+)/);
      if (!mm) return;
      const uid = NOTIF_TABLE_BY_SOURCE[mm[1]];
      map[uid] = map[uid] || {};
      map[uid][mm[2]] = (map[uid][mm[2]] || []).concat([(m.title ? m.title + ': ' : '') + (m.content || '')]);
    });
    window.__cmNotifRows = map;
  } catch (e) { /* остаёмся на прошлом состоянии */ }
  paintNotifRows();
}
if (!window.__cmNotifTimers) {
  window.__cmNotifTimers = true;
  refreshNotifRows();
  setInterval(refreshNotifRows, 8000);      // подтягиваем новые/прочитанные сообщения
  setInterval(paintNotifRows, 600);         // строки таблицы пересоздаются при сортировке и листании — перекрашиваем
  window.addEventListener('focus', refreshNotifRows);
}
