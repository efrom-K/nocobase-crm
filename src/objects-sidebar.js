
if (!document.getElementById('obj-list-style')) {
  const style = document.createElement('style');
  style.id = 'obj-list-style';
  style.textContent = `
    .obj-item { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:9px 10px; border-radius:6px; cursor:pointer; font-size:15px; font-weight:500; color:#1f1f1f; margin:1px 0; transition:background .12s; }
    .obj-item:hover { background:#f5f5f5; }
    .obj-item.active { background:#e6f4ff; color:#1677ff; font-weight:700; }
    .obj-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .obj-count { color:#8c8c8c; font-size:13px; font-weight:600; flex-shrink:0; }
    .obj-item.active .obj-count { color:#1677ff; }
    @media (max-width: 700px) {
      #obj-list-root { display:flex; flex-direction:row; overflow-x:auto; gap:6px; padding:2px 2px 8px; -webkit-overflow-scrolling:touch; }
      #obj-list-root .obj-item { flex:0 0 auto; flex-direction:row; background:#f5f5f5; border-radius:16px; padding:6px 12px; margin:0; white-space:nowrap; }
      #obj-list-root .obj-item.active { background:#1677ff; color:#fff; }
      #obj-list-root .obj-item.active .obj-count { color:#fff; }
      #obj-list-root .obj-name { max-width:120px; }
      #obj-list-root .obj-count { margin-left:6px; }
    }
  `;
  document.head.appendChild(style);
}

const card = ctx.element && ctx.element.closest ? ctx.element.closest('.ant-card') : null;
if (card) {
  card.style.border = 'none';
  card.style.boxShadow = 'none';
  card.style.background = 'transparent';
}

ctx.render('<div><div id="obj-status-filter"></div><div style="font-size:11px;font-weight:600;letter-spacing:.5px;color:#8c8c8c;text-transform:uppercase;padding:4px 10px 8px;">Объекты</div><div id="obj-list-root">Загрузка…</div></div>');

const root = ctx.element ? ctx.element.querySelector('#obj-list-root') : document.getElementById('obj-list-root');

function esc(v) {
  return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// на вкладке «Черновики» своей таблицы нет — фильтр ставится на «Активные»
function getActiveTable() { const t = window.__activeRegistryTable; return ['ozazmpm4o4v', 'formtbl000001', 'ipb7gfluldk'].indexOf(t) !== -1 ? t : 'ozazmpm4o4v'; }

async function applyFilter(name) {
  const uid = getActiveTable();
  const target = ctx.model.flowEngine.getModel(uid);
  if (!target || !target.resource) return;
  target.resource.removeFilterGroup('search');
  if (name) {
    target.resource.addFilterGroup('objFilter', {object_name: name});
  } else {
    target.resource.removeFilterGroup('objFilter');
  }
  target.resource.setPage(1);
  await target.resource.refresh();
  const search = document.getElementById('global-search-input');
  if (search) search.value = '';
  window.__activeObjectFilter = name || '';
  paintActive();
}

function paintActive() {
  if (!root) return;
  root.querySelectorAll('.obj-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-obj') === (window.__activeObjectFilter || ''));
  });
}

async function load() {
  try {
    // число активных договоров считается вживую по rental_contracts (поле count в contract_objects больше не используется)
    const both = await Promise.all([
      ctx.api.resource('contract_objects').list({ pageSize: 200, sort: 'name' }),
      ctx.api.resource('rental_contracts').list({ paginate: false, fields: ['id', 'object_name'] })
    ]);
    const rows = function(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : []; };
    const counts = {};
    rows(both[1]).forEach(function(r) { const n = (r.object_name || '').trim(); if (n) counts[n] = (counts[n] || 0) + 1; });
    const list = rows(both[0]).map(function(o) { return { name: o.name, count: counts[o.name] || 0 }; })
      .sort(function(a, b) { return b.count - a.count || String(a.name).localeCompare(String(b.name), 'ru'); });
    const total = list.reduce(function(sum, o) { return sum + (Number(o.count) || 0); }, 0);
    let html = '<div class="obj-item" data-obj="">'
      + '<span class="obj-name">Все объекты</span><span class="obj-count">' + total + '</span></div>';
    html += list.map(function(o) {
      return '<div class="obj-item" data-obj="' + esc(o.name) + '">'
        + '<span class="obj-name">' + esc(o.name) + '</span><span class="obj-count">' + esc(o.count) + '</span></div>';
    }).join('');
    if (root) root.innerHTML = html;
    if (root) root.querySelectorAll('.obj-item').forEach(function(el) {
      el.addEventListener('click', function() { applyFilter(el.getAttribute('data-obj')); });
    });
    paintActive();
    // переход с дашборда: ?obj=<название> и/или ?status=<значение> — сразу фильтр на «Активных» (таблица может ещё не прогрузиться)
    const m = location.search.match(/[?&]obj=([^&]*)/);
    const ms = location.search.match(/[?&]status=([^&]*)/);
    if (m || ms) {
      let tries = 0;
      const t = setInterval(function() {
        const target = ctx.model.flowEngine.getModel('ozazmpm4o4v');
        if (!(target && target.resource) && ++tries <= 50) return;
        clearInterval(t);
        if (window.switchRegistryTable) window.switchRegistryTable('ozazmpm4o4v');
        if (ms) applyStatusFilter(decodeURIComponent(ms[1]), !m);
        if (m) applyFilter(decodeURIComponent(m[1].replace(/\+/g, ' ')));
        try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ }
      }, 200);
    }
  } catch (e) {
    if (root) root.innerHTML = '<span style="color:#c0392b;">Ошибка загрузки объектов</span>';
  }
}
load();

function doReset() {
  applyFilter('');
}
if (!window.__registryMenuResetBound) {
  window.__registryMenuResetBound = true;
  document.addEventListener('click', (e) => {
    const el = e.target.closest ? e.target.closest('.ant-menu-item, [role="menuitem"], a, button') : null;
    if (el && el.textContent && el.textContent.trim() === 'Реестр договоров') {
      doReset();
    }
  }, true);
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      if (lastPath === '/admin/b5znz7yxpy3' || lastPath === '/admin') {
        doReset();
      }
    }
  }, 300);
}

// фильтр по статусу (переход с дашборда «Требуют внимания»): метка над списком объектов, ✕ снимает
const STATUS_LABELS = { '1_problem': 'Проблема', '2_terminating': 'На расторжении', '2_docs': 'Не хватает документов', '2_attention': 'Требует внимания', '3_ok': 'В порядке', 'none': 'Статус не задан', 'attention': 'Все, кроме «В порядке»' };
async function applyStatusFilter(v, refresh) {
  const target = ctx.model.flowEngine.getModel('ozazmpm4o4v');
  const box = document.getElementById('obj-status-filter');
  if (!target || !target.resource) return;
  if (!v) target.resource.removeFilterGroup('statusFilter');
  else if (v === 'none') target.resource.addFilterGroup('statusFilter', { contract_status: { $empty: true } });
  else if (v === 'attention') target.resource.addFilterGroup('statusFilter', { contract_status: { $in: ['1_problem', '2_terminating', '2_docs', '2_attention'] } });
  else target.resource.addFilterGroup('statusFilter', { contract_status: v });
  if (box) {
    box.innerHTML = v ? '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 10px;padding:6px 10px;border:1px solid #91caff;background:#e6f4ff;border-radius:6px;font-size:13px;color:#0958d9;">'
      + '<span>Статус: <b>' + esc(STATUS_LABELS[v] || v) + '</b></span><a href="#" id="obj-status-clear" title="Снять фильтр по статусу" style="color:#0958d9;text-decoration:none;font-size:15px;">✕</a></div>' : '';
    const x = document.getElementById('obj-status-clear');
    if (x) x.addEventListener('click', function(e) { e.preventDefault(); applyStatusFilter('', true); });
  }
  if (refresh) { target.resource.setPage(1); await target.resource.refresh(); }
}
