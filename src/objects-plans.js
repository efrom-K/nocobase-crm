// «Объекты» → вкладка «Планы и помещения» (/admin/j3a32zo1jzo/tab/objplantab1, блок objplanblk01): планы объектов и помещения с ID.
// Слева объекты, в центре план (SVG, метры), справа карточка помещения; под планом — таблица помещений (сдано / свободно по ссылке на договор).
// Редактор (только admin): перетаскивание и размер мышью, стрелки, ID и перенумерация (прежние ID — old_codes), планы-этажи, подложка-чертёж, отмена.
// Таблицы crm_floor_plans / crm_rooms — scripts/setup_object_plans.py (там же начальная схема из договоров). Договоры только читаются.
// единый вид выпадающих списков и кнопок «Выберите файл» во всех блоках CRM — тот же фрагмент в каждом блоке, где они есть
// (не в branding/global.css: его браузеры кэшируют на год, правка дошла бы только после Ctrl+F5)
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
if (!document.getElementById('crm-objplan-style')) {
  const st = document.createElement('style');
  st.id = 'crm-objplan-style';
  st.textContent = `
    #crm-objplan { color:#1f1f1f; font-size:13.5px; }
    #crm-objplan .op-wrap { display:grid; grid-template-columns:220px minmax(0,1fr) 330px; gap:14px; align-items:start; }
    #crm-objplan .op-objs { border:1px solid #e3e7ef; border-radius:8px; background:#fff; padding:6px; max-height:calc(100vh - 170px); overflow:auto; }
    #crm-objplan .op-obj { display:flex; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:6px; cursor:pointer; font-weight:500; }
    #crm-objplan .op-obj:hover { background:#f3f5fa; }
    #crm-objplan .op-obj.on { background:#1c2d58; color:#fff; font-weight:700; }
    #crm-objplan .op-obj small { color:#8c8c8c; font-weight:600; white-space:nowrap; }
    #crm-objplan .op-obj.on small { color:#d6dcf0; }
    #crm-objplan .op-main { min-width:0; }
    #crm-objplan .op-bar { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:8px; }
    #crm-objplan .op-title { font-size:18px; font-weight:700; margin-right:8px; }
    #crm-objplan .op-btn { border:1px solid #c9d1df; background:#fff; color:#1f1f1f; border-radius:6px; padding:4px 11px; font-size:13px; cursor:pointer; font-family:inherit; }
    #crm-objplan .op-btn:hover { border-color:#1c2d58; color:#1c2d58; }
    #crm-objplan .op-btn.on, #crm-objplan .op-btn.pri { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    #crm-objplan .op-btn.red { color:#cf1322; border-color:#ffa39e; }
    #crm-objplan .op-btn:disabled { opacity:.45; cursor:default; }
    #crm-objplan .op-sep { width:1px; height:22px; background:#e3e7ef; margin:0 4px; }
    #crm-objplan .op-plan-tab { border:1px solid #c9d1df; border-bottom-width:2px; background:#f8f9fb; border-radius:6px 6px 0 0; padding:4px 12px; cursor:pointer; font-weight:600; font-family:inherit; font-size:13px; }
    #crm-objplan .op-plan-tab.on { background:#fff; border-bottom-color:#1c2d58; color:#1c2d58; }
    #crm-objplan .op-canvas { position:relative; border:1px solid #c9d1df; border-radius:8px; background:#fbfcfe; height:calc(100vh - 330px); min-height:380px; overflow:hidden; touch-action:none; user-select:none; }
    #crm-objplan .op-canvas svg { width:100%; height:100%; display:block; }
    #crm-objplan .op-canvas.edit { border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
    #crm-objplan .op-hint { font-size:12px; color:#595959; margin:6px 0 0; }
    #crm-objplan .op-warn { background:#fff7e6; border:1px solid #ffd591; color:#873800; border-radius:6px; padding:6px 10px; font-size:12.5px; margin-bottom:8px; }
    #crm-objplan .op-legend { display:flex; flex-wrap:wrap; gap:12px; font-size:12px; color:#595959; margin-left:auto; }
    #crm-objplan .op-legend i { display:inline-block; width:12px; height:12px; border-radius:2px; border:1px solid; vertical-align:-2px; margin-right:4px; }
    #crm-objplan .op-side { border:1px solid #e3e7ef; border-radius:8px; background:#fff; padding:12px 14px; position:sticky; top:8px; max-height:calc(100vh - 170px); overflow:auto; }
    #crm-objplan .op-side h4 { margin:0 0 10px; font-size:15px; }
    #crm-objplan .op-f { margin-bottom:9px; }
    #crm-objplan .op-f label { display:block; font-size:12px; color:#595959; margin-bottom:3px; font-weight:500; }
    #crm-objplan .op-f input[type=text], #crm-objplan .op-f input[type=number], #crm-objplan .op-f select, #crm-objplan .op-f textarea { width:100%; box-sizing:border-box; border:1px solid #c9d1df; border-radius:6px; padding:5px 8px; font:inherit; font-size:13.5px; color:#1f1f1f; background:#fff; }
    #crm-objplan .op-f input:focus, #crm-objplan .op-f textarea:focus { outline:none; border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
    #crm-objplan .op-f input[readonly] { background:#f5f6f8; color:#595959; }
    #crm-objplan .op-f .op-sub { font-size:11.5px; color:#8c8c8c; margin-top:3px; }
    #crm-objplan .op-f .op-err { font-size:12px; color:#cf1322; margin-top:3px; }
    #crm-objplan .op-g4 { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; }
    #crm-objplan .op-g2 { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    #crm-objplan .op-acts { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    #crm-objplan .op-kv { display:grid; grid-template-columns:auto 1fr; gap:4px 10px; font-size:13px; }
    #crm-objplan .op-kv b { color:#595959; font-weight:500; }
    #crm-objplan .op-tot { display:flex; flex-wrap:wrap; gap:16px; margin:12px 0 6px; font-size:13px; }
    #crm-objplan .op-tot b { font-size:15px; font-variant-numeric:tabular-nums; }
    #crm-objplan table.op-t { width:100%; border-collapse:collapse; font-size:13px; }
    #crm-objplan .op-t th { background:#eef1f6; border-bottom:2px solid #c9d1df; text-align:left; padding:6px 8px; font-weight:600; white-space:nowrap; }
    #crm-objplan .op-t td { padding:5px 8px; border-bottom:1px solid #edf0f5; }
    #crm-objplan .op-t tr:nth-child(even) td { background:#f8f9fb; }
    #crm-objplan .op-t tbody tr { cursor:pointer; }
    #crm-objplan .op-t tbody tr:hover td { background:#eaf0ff; }
    #crm-objplan .op-t tr.on td { background:#dbe4ff !important; font-weight:600; }
    #crm-objplan .op-t .num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
    #crm-objplan .op-chip { display:inline-block; padding:0 7px; border-radius:9px; font-size:11.5px; border:1px solid; white-space:nowrap; }
    #crm-objplan .op-toast { position:fixed; right:24px; bottom:24px; background:#1f1f1f; color:#fff; padding:8px 14px; border-radius:6px; font-size:13px; z-index:2000; }
    #crm-objplan svg text { pointer-events:none; font-family:inherit; }
    #crm-objplan svg .op-room { cursor:pointer; }
    #crm-objplan .edit svg .op-room { cursor:move; }
    #crm-objplan svg .op-h { cursor:nwse-resize; }
    @media (max-width: 1100px) { #crm-objplan .op-wrap { grid-template-columns:1fr; } #crm-objplan .op-side { position:static; } #crm-objplan .op-objs { max-height:none; display:flex; flex-wrap:wrap; gap:4px; } }
  `;
  document.head.appendChild(st);
}

// ---------- состояние ----------
const OP_KINDS = { rent: 'Под аренду', tech: 'Техническое', common: 'Общего пользования' };
const OP_COLORS = { rented: ['#dbe4ff', '#1c2d58'], free: ['#d9f7be', '#389e0d'], tech: ['#ececec', '#8c8c8c'], common: ['#fff1d6', '#d48806'] };
const OP_SNAP = 0.5;   // шаг сетки при перетаскивании, м (точнее — числами в панели или стрелками с Alt)
const op = { me: null, edit: false, objs: [], plans: [], rooms: [], cons: [], objId: null, planId: null, sel: null, view: null, undo: [], panel: 'room', drag: null };
try { op.objId = Number(localStorage.getItem('crm-objplan-obj')) || null; } catch (e) { /* нет хранилища */ }

ctx.render('<div id="crm-objplan"><div style="color:#8c8c8c;padding:12px;">Загрузка…</div></div>');
function opRoot() { return (ctx.element && ctx.element.querySelector('#crm-objplan')) || document.getElementById('crm-objplan'); }
function opRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function opEsc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function opNum(v) { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(',', '.').replace(/\s/g, '')); return isNaN(n) ? null : n; }
function opArea(n) { return n === null || n === undefined ? '—' : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' м²'; }
function opM(n) { return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 }); }
function opR(n) { return Math.round(n * 100) / 100; }
function opDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function opToast(t) {
  const old = document.querySelector('.op-toast'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'op-toast'; d.textContent = t; opRoot().appendChild(d);
  setTimeout(function() { d.remove(); }, 2600);
}
function opCanEdit() { return !!(op.me && (op.me.roles || []).some(function(r) { return r.name === 'admin' || r.name === 'root'; })); }
function opPlan() { return op.plans.find(function(p) { return p.id === op.planId; }) || null; }
function opRoom(id) { return op.rooms.find(function(r) { return r.id === id; }) || null; }
function opPlanRooms() { return op.rooms.filter(function(r) { return r.plan_id === op.planId; }); }
function opCon(id) { return op.cons.find(function(c) { return c.id === id; }) || null; }
function opState(r) { return r.kind === 'tech' ? 'tech' : r.kind === 'common' ? 'common' : r.contract_id && opCon(r.contract_id) ? 'rented' : 'free'; }
function opStateTitle(s) { return { rented: 'Сдано', free: 'Свободно', tech: 'Техническое', common: 'Общего пользования' }[s]; }

// ---------- данные ----------
async function opLoad() {
  const L = function(c, p) { return ctx.api.resource(c).list(Object.assign({ paginate: false }, p || {})).then(opRows).catch(function() { return []; }); };
  const r = await Promise.all([
    L('contract_objects', { sort: ['name'] }), L('crm_floor_plans', { sort: ['object_id', 'sort', 'id'] }), L('crm_rooms', { sort: ['code'] }),
    L('rental_contracts', { fields: ['id', 'object_name', 'contract_number', 'tenant_name', 'area_sqm', 'end_date', 'contract_status'] })
  ]);
  op.objs = r[0]; op.plans = r[1]; op.rooms = r[2]; op.cons = r[3];
  if (!op.objs.some(function(o) { return o.id === op.objId; })) op.objId = op.objs.length ? op.objs[0].id : null;
  opPickPlan();
}
function opPickPlan(keep) {
  const ps = op.plans.filter(function(p) { return p.object_id === op.objId; });
  if (!keep || !ps.some(function(p) { return p.id === op.planId; })) op.planId = ps.length ? ps[0].id : null;
  op.view = null;
}
async function opApi(kind, coll, a, b) {
  const res = ctx.api.resource(coll);
  if (kind === 'create') return opRows(await res.create({ values: a }))[0];
  if (kind === 'update') return res.update({ filterByTk: a, values: b });
  if (kind === 'destroy') return res.destroy({ filterByTk: a });
}
// правка помещения: локально сразу, на сервер — следом; в стек отмены — прежние значения
async function opSaveRoom(id, vals, noUndo) {
  const r = opRoom(id); if (!r) return false;
  const before = {}; Object.keys(vals).forEach(function(k) { before[k] = r[k]; });
  Object.assign(r, vals);
  try {
    await opApi('update', 'crm_rooms', id, vals);
    if (!noUndo) op.undo.push({ t: 'upd', id: id, vals: before });
    return true;
  } catch (e) {
    Object.assign(r, before); opToast(opErrText(e, 'Не удалось сохранить')); return false;
  }
}
function opErrText(e, def) {
  const m = e && e.response && e.response.data && e.response.data.errors && e.response.data.errors[0] && e.response.data.errors[0].message;
  return m && /unique|уник/i.test(m) ? 'Такой ID уже есть в этом объекте' : def;
}
function opCodeTaken(code, exceptId) { return op.rooms.some(function(r) { return r.object_id === op.objId && r.id !== exceptId && String(r.code || '').trim().toLowerCase() === String(code).trim().toLowerCase(); }); }
function opNextCode() {
  let n = 1; const used = {}; op.rooms.forEach(function(r) { if (r.object_id === op.objId) used[String(r.code).toLowerCase()] = 1; });
  while (used[('П-' + (n < 10 ? '0' + n : n)).toLowerCase()]) n++;
  return 'П-' + (n < 10 ? '0' + n : n);
}

// ---------- отрисовка ----------
function opRender() {
  const root = opRoot(); if (!root) return;
  const plan = opPlan(), o = op.objs.find(function(x) { return x.id === op.objId; });
  const can = opCanEdit(), ps = op.plans.filter(function(p) { return p.object_id === op.objId; });
  const objList = op.objs.map(function(x) {
    const rs = op.rooms.filter(function(r) { return r.object_id === x.id; });
    return '<div class="op-obj' + (x.id === op.objId ? ' on' : '') + '" data-obj="' + x.id + '"><span>' + opEsc(x.name) + '</span><small>' + (rs.length ? rs.length + ' пом.' : '—') + '</small></div>';
  }).join('');
  const tabs = ps.map(function(p) { return '<button class="op-plan-tab' + (p.id === op.planId ? ' on' : '') + '" data-plan="' + p.id + '">' + opEsc(p.title || 'План') + '</button>'; }).join('')
    + (can && op.edit ? '<button class="op-btn" data-act="plan-add" title="Новый план: этаж, корпус, площадка">+ План</button>' : '');
  const legend = ['rented', 'free', 'tech', 'common'].map(function(s) { return '<span><i style="background:' + OP_COLORS[s][0] + ';border-color:' + OP_COLORS[s][1] + '"></i>' + opStateTitle(s) + '</span>'; }).join('');
  root.innerHTML = '<div class="op-wrap">'
    + '<div class="op-objs">' + objList + '</div>'
    + '<div class="op-main">'
    + '<div class="op-bar"><span class="op-title">' + opEsc(o ? o.name : 'Объекты') + '</span>' + tabs + '</div>'
    + (plan && plan.schematic ? '<div class="op-warn"><b>Схема, не по чертежу.</b> Площади помещений — из договоров, расположение и форма — условные. Загрузите чертёж подложкой («Настройки плана») и расставьте помещения по нему.</div>' : '')
    + '<div class="op-bar">'
    + (can ? '<button class="op-btn' + (op.edit ? ' on' : '') + '" data-act="edit">' + (op.edit ? '✓ Редактирование' : '✎ Редактировать') + '</button>' : '')
    + (can && op.edit && plan ? '<button class="op-btn" data-act="room-add">+ Помещение</button><button class="op-btn" data-act="renum">Перенумеровать</button><button class="op-btn" data-act="plan-set">Настройки плана</button>'
      + '<button class="op-btn" data-act="undo"' + (op.undo.length ? '' : ' disabled') + ' title="Ctrl+Z">↶ Отменить</button>' : '')
    + '<span class="op-sep"></span><button class="op-btn" data-act="zin" title="Крупнее">+</button><button class="op-btn" data-act="zout" title="Мельче">−</button><button class="op-btn" data-act="zfit">По размеру</button>'
    + '<span class="op-legend">' + legend + '</span></div>'
    + (plan ? '<div class="op-canvas' + (op.edit ? ' edit' : '') + '" tabindex="0"><svg xmlns="http://www.w3.org/2000/svg"></svg></div>'
      + '<div class="op-hint">' + (op.edit ? 'Перетаскивайте помещения мышью, размер — за уголок. Стрелки двигают выбранное на 0,5 м, с Alt — на 0,1 м. Пустое место — двигать план, колесо — масштаб. Всё сохраняется сразу.'
        : 'Клик по помещению — подробности. Пустое место — двигать план, колесо — масштаб.') + '</div>'
      + '<div class="op-tbl">' + opTableHtml() + '</div>'
      : '<div class="op-warn">У объекта пока нет плана.' + (can ? ' Включите «Редактировать» и нажмите «+ План».' : '') + '</div>')
    + '</div>'
    + '<div class="op-side">' + opSideHtml() + '</div>'
    + '</div>';
  if (plan) { opDraw(); opBindCanvas(); }
}
function opFit() {
  const p = opPlan(); if (!p) return;
  const W = Number(p.width_m) || 60, H = Number(p.height_m) || 40, pad = Math.max(W, H) * 0.04;
  op.view = { x: -pad, y: -pad, w: W + 2 * pad, h: H + 2 * pad };
}
function opSvg() { const c = opRoot().querySelector('.op-canvas svg'); return c; }
function opDraw() {
  const svg = opSvg(), p = opPlan(); if (!svg || !p) return;
  if (!op.view) opFit();
  const box = svg.getBoundingClientRect(), v = op.view;
  // соотношение сторон окна: дополняем viewBox, чтобы метр был квадратным
  const k = box.width && box.height ? box.width / box.height : 1.6;
  let vw = v.w, vh = v.h; if (vw / vh < k) vw = vh * k; else vh = vw / k;
  const vx = v.x - (vw - v.w) / 2, vy = v.y - (vh - v.h) / 2;
  op.vb = { x: vx, y: vy, w: vw, h: vh, px: box.width ? vw / box.width : 0.05 };
  svg.setAttribute('viewBox', vx + ' ' + vy + ' ' + vw + ' ' + vh);
  const W = Number(p.width_m) || 60, H = Number(p.height_m) || 40, px = op.vb.px, fs = 12.5 * px;
  let g = '';
  // сетка: 1 м (если не мельче 6 пикселей) и 10 м
  const grid = function(step, color, sw) {
    let s = '';
    for (let x = 0; x <= W + 1e-6; x += step) s += 'M' + x + ' 0V' + H;
    for (let y = 0; y <= H + 1e-6; y += step) s += 'M0 ' + y + 'H' + W;
    return '<path d="' + s + '" stroke="' + color + '" stroke-width="' + sw * px + '" fill="none"/>';
  };
  g += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>';
  if (p.bg_url) g += '<image href="' + opEsc(p.bg_url) + '" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="none" opacity="' + (p.bg_opacity === null || p.bg_opacity === undefined ? 0.6 : p.bg_opacity) + '"/>';
  if (1 / px >= 6) g += grid(1, '#eef1f6', 1);
  g += grid(10, '#d6dce8', 1);
  g += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="none" stroke="#1f1f1f" stroke-width="' + 2.5 * px + '"/>';
  // линейка: подписи каждые 10 м
  for (let x = 0; x <= W + 1e-6; x += 10) g += '<text x="' + x + '" y="' + (-4 * px) + '" font-size="' + 10 * px + '" fill="#8c8c8c" text-anchor="middle">' + x + '</text>';
  for (let y = 10; y <= H + 1e-6; y += 10) g += '<text x="' + (-4 * px) + '" y="' + (y + 3 * px) + '" font-size="' + 10 * px + '" fill="#8c8c8c" text-anchor="end">' + y + '</text>';
  opPlanRooms().forEach(function(r) {
    const s = opState(r), c = OP_COLORS[s], sel = r.id === op.sel;
    const x = Number(r.x) || 0, y = Number(r.y) || 0, w = Math.max(0.1, Number(r.w) || 1), h = Math.max(0.1, Number(r.h) || 1);
    g += '<g class="op-room" data-room="' + r.id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c[0] + '" fill-opacity="' + (p.bg_url ? 0.75 : 1) + '" stroke="' + (sel ? '#cf1322' : c[1]) + '" stroke-width="' + (sel ? 3 : 1.3) * px + '"/>';
    // подписи — только если влезают
    const code = String(r.code || ''), cx = x + w / 2;
    const fit = function(txt, f) { return txt.length * f * 0.68 < w - 4 * px; };
    let lines = [];
    if (fit(code, fs * 1.15) && h > fs * 1.6) lines.push(['<tspan font-weight="700">' + opEsc(code) + '</tspan>', fs * 1.15]);
    if (lines.length && h > fs * 3.1 && r.area_sqm && fit(opArea(r.area_sqm), fs)) lines.push([opEsc(opArea(r.area_sqm)), fs]);
    if (lines.length === 2 && h > fs * 4.6 && r.title) {
      let t = String(r.title); const max = Math.floor((w - 6 * px) / (fs * 0.92 * 0.68));
      if (max >= 4) { if (t.length > max) t = t.slice(0, max - 1) + '…'; lines.push([opEsc(t), fs * 0.92]); }
    }
    const tot = lines.reduce(function(a, l) { return a + l[1] * 1.25; }, 0);
    let ty = y + h / 2 - tot / 2;
    lines.forEach(function(l) { ty += l[1] * 1.25; g += '<text x="' + cx + '" y="' + (ty - l[1] * 0.3) + '" font-size="' + l[1] + '" fill="#1f1f1f" text-anchor="middle">' + l[0] + '</text>'; });
    if (sel && op.edit) {
      const hs = 9 * px;
      [[x, y, 'nw'], [x + w, y, 'ne'], [x, y + h, 'sw'], [x + w, y + h, 'se']].forEach(function(q) {
        g += '<rect class="op-h" data-h="' + q[2] + '" x="' + (q[0] - hs / 2) + '" y="' + (q[1] - hs / 2) + '" width="' + hs + '" height="' + hs + '" fill="#fff" stroke="#cf1322" stroke-width="' + 1.5 * px + '"' + (q[2] === 'ne' || q[2] === 'sw' ? ' style="cursor:nesw-resize"' : '') + '/>';
      });
    }
    g += '</g>';
  });
  svg.innerHTML = g;
}
function opTableHtml() {
  const rs = opPlanRooms().slice().sort(function(a, b) { return String(a.code).localeCompare(String(b.code), 'ru', { numeric: true }); });
  if (!rs.length) return '<div class="op-hint" style="margin-top:12px;">На плане нет помещений.</div>';
  let tot = 0, rented = 0, free = 0;
  rs.forEach(function(r) { const a = Number(r.area_sqm) || 0, s = opState(r); if (s === 'rented' || s === 'free') tot += a; if (s === 'rented') rented += a; if (s === 'free') free += a; });
  return '<div class="op-tot"><span>Помещений: <b>' + rs.length + '</b></span><span>Под аренду: <b>' + opArea(opR(tot)) + '</b></span><span>Сдано: <b>' + opArea(opR(rented)) + '</b></span><span>Свободно: <b>' + opArea(opR(free)) + '</b></span>'
    + '<span style="color:#8c8c8c;">площади — по документам (поле «Площадь»), не по рисунку</span></div>'
    + '<table class="op-t"><thead><tr><th>ID</th><th>Название</th><th class="num">Площадь</th><th>Состояние</th><th>Договор</th><th>Арендатор</th><th>Договор до</th></tr></thead><tbody>'
    + rs.map(function(r) {
      const s = opState(r), c = opCon(r.contract_id);
      return '<tr data-room="' + r.id + '"' + (r.id === op.sel ? ' class="on"' : '') + '><td><b>' + opEsc(r.code) + '</b></td><td>' + opEsc(r.title) + '</td><td class="num">' + opArea(r.area_sqm) + '</td>'
        + '<td><span class="op-chip" style="background:' + OP_COLORS[s][0] + ';border-color:' + OP_COLORS[s][1] + '">' + opStateTitle(s) + '</span></td>'
        + '<td>' + (c ? opEsc(c.contract_number) : r.contract_id ? '<span style="color:#cf1322;">нет в действующих</span>' : '') + '</td><td>' + (c ? opEsc(c.tenant_name) : '') + '</td><td>' + (c ? opDate(c.end_date) : '') + '</td></tr>';
    }).join('') + '</tbody></table>';
}

// ---------- боковая панель ----------
function opF(label, inner, sub) { return '<div class="op-f"><label>' + label + '</label>' + inner + (sub ? '<div class="op-sub">' + sub + '</div>' : '') + '</div>'; }
function opIn(name, val, attrs) { return '<input type="text" data-f="' + name + '" value="' + opEsc(val === null || val === undefined ? '' : val) + '"' + (attrs || '') + '>'; }
function opSideHtml() {
  const p = opPlan(), can = opCanEdit() && op.edit;
  if (op.panel === 'plan' && can) return opPlanFormHtml(p);
  if (op.panel === 'renum' && can) return '<h4>Перенумеровать помещения плана</h4>'
    + '<div class="op-hint" style="margin:0 0 10px;">Новые ID по порядку: сверху вниз, слева направо. Прежние ID сохранятся в истории помещения.</div>'
    + opF('Начало ID', '<input type="text" data-r="prefix" value="П-">', 'например «П-», «1.», «А»') + opF('С номера', '<input type="number" data-r="start" value="1" min="0">')
    + opF('Цифр в номере', '<select data-r="pad"><option value="2">2 (П-01)</option><option value="1">без нулей (П-1)</option><option value="3">3 (П-001)</option></select>')
    + '<div class="op-acts"><button class="op-btn pri" data-act="renum-go">Перенумеровать</button><button class="op-btn" data-act="side-close">Отмена</button></div>';
  const r = opRoom(op.sel);
  if (!r || r.plan_id !== op.planId) {
    if (!p) return '<h4>Помещения</h4><div class="op-hint">Выберите объект слева.</div>';
    return '<h4>' + opEsc(p.title || 'План') + '</h4><div class="op-kv"><b>Размер</b><span>' + opM(p.width_m) + ' × ' + opM(p.height_m) + ' м</span><b>Подложка</b><span>' + (p.bg_url ? 'чертёж загружен' : 'нет') + '</span></div>'
      + (p.note ? '<div class="op-hint" style="margin-top:10px;white-space:pre-wrap;">' + opEsc(p.note) + '</div>' : '')
      + '<div class="op-hint" style="margin-top:12px;">Выберите помещение на плане или в таблице.</div>';
  }
  const c = opCon(r.contract_id), s = opState(r), drawn = opR((Number(r.w) || 0) * (Number(r.h) || 0));
  if (!can) {
    return '<h4>' + opEsc(r.code) + (r.title ? ' · ' + opEsc(r.title) : '') + '</h4><div class="op-kv">'
      + '<b>Состояние</b><span>' + opStateTitle(s) + '</span><b>Площадь</b><span>' + opArea(r.area_sqm) + '</span><b>Тип</b><span>' + opEsc(OP_KINDS[r.kind] || '—') + '</span>'
      + (r.purpose ? '<b>Назначение</b><span>' + opEsc(r.purpose) + '</span>' : '') + (r.heating ? '<b>Отопление</b><span>' + opEsc(r.heating) + '</span>' : '')
      + (c ? '<b>Договор</b><span>' + opEsc(c.contract_number) + '</span><b>Арендатор</b><span>' + opEsc(c.tenant_name) + '</span>' + (c.end_date ? '<b>До</b><span>' + opDate(c.end_date) + '</span>' : '') : '')
      + ((r.old_codes || []).length ? '<b>Прежние ID</b><span>' + opEsc(r.old_codes.join(', ')) + '</span>' : '')
      + '</div>' + (r.note ? '<div class="op-hint" style="margin-top:10px;white-space:pre-wrap;">' + opEsc(r.note) + '</div>' : '');
  }
  const objName = (op.objs.find(function(o) { return o.id === op.objId; }) || {}).name || '';
  const cons = op.cons.filter(function(x) { return (x.object_name || '').trim() === objName.trim(); });
  const conOpts = '<option value="">— не сдано —</option>' + cons.map(function(x) {
    const busy = op.rooms.filter(function(q) { return q.contract_id === x.id && q.id !== r.id; }).map(function(q) { return q.code; });
    return '<option value="' + x.id + '"' + (x.id === r.contract_id ? ' selected' : '') + '>' + opEsc(x.contract_number + ' — ' + (x.tenant_name || '') + ', ' + opArea(x.area_sqm) + (busy.length ? ' (уже: ' + busy.join(', ') + ')' : '')) + '</option>';
  }).join('') + (r.contract_id && !c ? '<option value="' + r.contract_id + '" selected>договор #' + r.contract_id + ' (нет среди действующих)</option>' : '');
  return '<h4>Помещение</h4>'
    + opF('ID помещения', opIn('code', r.code), (r.old_codes || []).length ? 'прежние: ' + opEsc(r.old_codes.join(', ')) : '') + '<div class="op-err" data-err="code"></div>'
    + opF('Название', opIn('title', r.title, ' placeholder="Например: Склад 1, Офис 204"'))
    + '<div class="op-g2">' + opF('Площадь по документам, м²', opIn('area_sqm', r.area_sqm, ' inputmode="decimal"'), 'на рисунке: ' + opM(drawn) + ' м²')
    + opF('Тип', '<select data-f="kind">' + Object.keys(OP_KINDS).map(function(k) { return '<option value="' + k + '"' + ((r.kind || 'rent') === k ? ' selected' : '') + '>' + OP_KINDS[k] + '</option>'; }).join('') + '</select>') + '</div>'
    + opF('Договор', '<select data-f="contract_id">' + conOpts + '</select>', 'только ссылка — договор не меняется')
    + opF('Назначение', opIn('purpose', r.purpose)) + opF('Отопление', opIn('heating', r.heating, ' placeholder="есть / нет / частично"'))
    + opF('Положение и размер на плане, м', '<div class="op-g4">' + ['x', 'y', 'w', 'h'].map(function(k) { return '<input type="text" data-f="' + k + '" value="' + opM(r[k]) + '" title="' + { x: 'X — от левого края', y: 'Y — от верхнего края', w: 'Ширина', h: 'Глубина' }[k] + '" inputmode="decimal">'; }).join('') + '</div>', 'X, Y от левого верхнего угла · ширина · глубина')
    + opF('Заметки', '<textarea data-f="note" rows="2">' + opEsc(r.note) + '</textarea>')
    + '<div class="op-acts">'
    + (opNum(r.area_sqm) && Math.abs(drawn - opNum(r.area_sqm)) > 0.05 ? '<button class="op-btn" data-act="room-fit" title="Глубину подогнать так, чтобы ширина × глубина = площадь">Размер по площади</button>' : '')
    + '<button class="op-btn" data-act="room-dup">Копия рядом</button><button class="op-btn red" data-act="room-del">Удалить</button></div>';
}
function opPlanFormHtml(p) {
  const nw = !p || op.newPlan;
  const v = nw ? { title: '', width_m: 60, height_m: 40, bg_opacity: 0.6 } : p;
  return '<h4>' + (nw ? 'Новый план' : 'Настройки плана') + '</h4>'
    + opF('Название', '<input type="text" data-p="title" value="' + opEsc(v.title) + '" placeholder="Этаж 1, Корпус А, Площадка">')
    + '<div class="op-g2">' + opF('Ширина, м', '<input type="text" data-p="width_m" value="' + opM(v.width_m) + '" inputmode="decimal">') + opF('Глубина, м', '<input type="text" data-p="height_m" value="' + opM(v.height_m) + '" inputmode="decimal">') + '</div>'
    + (nw ? '' : opF('Подложка — скан или фото чертежа (PNG, JPG)', '<input type="file" data-p="bg" accept="image/png,image/jpeg,image/webp,image/svg+xml">'
        + (v.bg_url ? '<div class="op-acts"><button class="op-btn red" data-act="bg-del">Убрать подложку</button></div>' : ''),
        'картинка растягивается на ширину и глубину плана — задайте их по чертежу (масштаб)')
      + opF('Прозрачность подложки', '<input type="range" data-p="bg_opacity" min="0.1" max="1" step="0.05" value="' + (v.bg_opacity === null || v.bg_opacity === undefined ? 0.6 : v.bg_opacity) + '" style="width:100%;">')
      + opF('', '<label style="display:flex;gap:6px;align-items:center;font-size:13px;color:#1f1f1f;"><input type="checkbox" data-p="schematic"' + (v.schematic ? ' checked' : '') + '> Схема, не по чертежу (показывать предупреждение)</label>')
      + opF('Заметки', '<textarea data-p="note" rows="3">' + opEsc(v.note) + '</textarea>'))
    + '<div class="op-acts"><button class="op-btn pri" data-act="plan-save">' + (nw ? 'Создать' : 'Сохранить') + '</button><button class="op-btn" data-act="side-close">Отмена</button>'
    + (nw ? '' : '<button class="op-btn red" data-act="plan-del" title="Только пустой план">Удалить план</button>') + '</div>';
}
function opRenderSide() { const s = opRoot().querySelector('.op-side'); if (s) s.innerHTML = opSideHtml(); }
function opRenderTable() { const t = opRoot().querySelector('.op-tbl'); if (t) t.innerHTML = opTableHtml(); }
function opRefresh() { opDraw(); opRenderTable(); opRenderSide(); const u = opRoot().querySelector('[data-act="undo"]'); if (u) u.disabled = !op.undo.length; }

// ---------- холст: выбор, перетаскивание, масштаб ----------
function opPt(e) {
  const svg = opSvg(), b = svg.getBoundingClientRect(), v = op.vb;
  return { x: v.x + (e.clientX - b.left) * v.w / b.width, y: v.y + (e.clientY - b.top) * v.h / b.height };
}
function opSnap(n, step) { return Math.round(n / step) * step; }
function opBindCanvas() {
  const cv = opRoot().querySelector('.op-canvas'); if (!cv) return;
  cv.addEventListener('pointerdown', function(e) {
    if (e.button !== 0) return;
    const pt = opPt(e), hEl = e.target.closest('.op-h'), gEl = e.target.closest('.op-room');
    cv.focus({ preventScroll: true });
    if (gEl) {
      const id = Number(gEl.getAttribute('data-room')), r = opRoom(id);
      if (op.sel !== id) { op.sel = id; op.panel = 'room'; opDraw(); opRenderSide(); opRenderTable(); }
      if (!op.edit || !r) return;
      op.drag = { kind: hEl ? 'resize' : 'move', h: hEl ? hEl.getAttribute('data-h') : null, id: id, p0: pt, r0: { x: Number(r.x) || 0, y: Number(r.y) || 0, w: Number(r.w) || 1, h: Number(r.h) || 1 }, moved: false };
    } else {
      op.drag = { kind: 'pan', p0: { x: e.clientX, y: e.clientY }, v0: Object.assign({}, op.view), moved: false };
    }
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* не критично */ }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function(e) {
    const d = op.drag; if (!d) return;
    if (d.kind === 'pan') {
      const b = cv.getBoundingClientRect(), s = op.vb.w / b.width;
      op.view.x = d.v0.x - (e.clientX - d.p0.x) * s; op.view.y = d.v0.y - (e.clientY - d.p0.y) * s; d.moved = true; opDraw(); return;
    }
    const pt = opPt(e), r = opRoom(d.id), dx = pt.x - d.p0.x, dy = pt.y - d.p0.y, o = d.r0;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3 * op.vb.px) return;   // дрожь руки при клике — не перемещение
    d.moved = true;
    if (d.kind === 'move') { r.x = opR(opSnap(o.x + dx, OP_SNAP)); r.y = opR(opSnap(o.y + dy, OP_SNAP)); }
    else {
      let x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
      if (d.h.indexOf('w') !== -1) x1 = opSnap(o.x + dx, OP_SNAP); else x2 = opSnap(x2 + dx, OP_SNAP);
      if (d.h.indexOf('n') !== -1) y1 = opSnap(o.y + dy, OP_SNAP); else y2 = opSnap(y2 + dy, OP_SNAP);
      if (x2 - x1 < OP_SNAP) { if (d.h.indexOf('w') !== -1) x1 = x2 - OP_SNAP; else x2 = x1 + OP_SNAP; }
      if (y2 - y1 < OP_SNAP) { if (d.h.indexOf('n') !== -1) y1 = y2 - OP_SNAP; else y2 = y1 + OP_SNAP; }
      r.x = opR(x1); r.y = opR(y1); r.w = opR(x2 - x1); r.h = opR(y2 - y1);
    }
    opDraw();
  });
  const end = async function() {
    const d = op.drag; op.drag = null; if (!d || d.kind === 'pan' || !d.moved) return;
    const r = opRoom(d.id), vals = { x: r.x, y: r.y, w: r.w, h: r.h };
    Object.assign(r, d.r0);   // прежнее — в стек отмены через opSaveRoom
    await opSaveRoom(d.id, vals); opRefresh();
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', function(e) {
    e.preventDefault();
    const pt = opPt(e); opZoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, pt);
  }, { passive: false });
  cv.addEventListener('keydown', async function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'я')) { e.preventDefault(); opUndo(); return; }
    const r = opRoom(op.sel); if (!op.edit || !r || r.plan_id !== op.planId) return;
    const st = e.altKey ? 0.1 : OP_SNAP, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv) { e.preventDefault(); await opSaveRoom(r.id, { x: opR((Number(r.x) || 0) + mv[0]), y: opR((Number(r.y) || 0) + mv[1]) }); opRefresh(); }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); opDelRoom(r.id); }
  });
}
function opZoom(f, pt) {
  if (!op.view) opFit();
  const v = op.view, c = pt || { x: v.x + v.w / 2, y: v.y + v.h / 2 };
  const nw = Math.min(2000, Math.max(3, v.w * f)), k = nw / v.w;
  op.view = { x: c.x - (c.x - v.x) * k, y: c.y - (c.y - v.y) * k, w: nw, h: v.h * k };
  opDraw();
}

// ---------- действия ----------
async function opUndo() {
  const u = op.undo.pop(); if (!u) return;
  try {
    if (u.t === 'upd') { await opSaveRoom(u.id, u.vals, true); }
    else if (u.t === 'add') { await opApi('destroy', 'crm_rooms', u.id); op.rooms = op.rooms.filter(function(r) { return r.id !== u.id; }); if (op.sel === u.id) op.sel = null; }
    else if (u.t === 'del') { const nr = await opApi('create', 'crm_rooms', u.vals); op.rooms.push(nr); op.sel = nr.id; }
    else if (u.t === 'batch') { for (const x of u.list.slice().reverse()) await opSaveRoom(x.id, x.vals, true); }
    opToast('Отменено');
  } catch (e) { opToast('Не удалось отменить'); }
  opRefresh();
}
async function opAddRoom(src) {
  const p = opPlan(); if (!p) return;
  const v = op.view || { x: 0, y: 0, w: p.width_m, h: p.height_m };
  const w = src ? Number(src.w) || 6 : 6, h = src ? Number(src.h) || 6 : 6;
  const x = src ? Math.min(Number(p.width_m) - w, (Number(src.x) || 0) + w) : opSnap(Math.max(0, Math.min(Number(p.width_m) - w, v.x + v.w / 2 - w / 2)), OP_SNAP);
  const y = src ? Number(src.y) || 0 : opSnap(Math.max(0, Math.min(Number(p.height_m) - h, v.y + v.h / 2 - h / 2)), OP_SNAP);
  const vals = { object_id: op.objId, plan_id: p.id, code: opNextCode(), title: src ? src.title || '' : '', area_sqm: src ? src.area_sqm : null, kind: src ? src.kind || 'rent' : 'rent',
    purpose: src ? src.purpose || '' : '', heating: src ? src.heating || '' : '', contract_id: null, x: opR(Math.max(0, x)), y: opR(y), w: w, h: h, old_codes: [], note: '' };
  try { const r = await opApi('create', 'crm_rooms', vals); op.rooms.push(r); op.sel = r.id; op.panel = 'room'; op.undo.push({ t: 'add', id: r.id }); opRefresh(); opToast('Помещение ' + r.code + ' добавлено'); }
  catch (e) { opToast(opErrText(e, 'Не удалось добавить помещение')); }
}
async function opDelRoom(id) {
  const r = opRoom(id); if (!r) return;
  const btn = opRoot().querySelector('[data-act="room-del"]');
  if (btn && !btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = 'Точно удалить ' + r.code + '?'; return; }   // без всплывающих окон: второй клик подтверждает
  const keep = {}; ['object_id', 'plan_id', 'code', 'title', 'area_sqm', 'kind', 'purpose', 'heating', 'contract_id', 'x', 'y', 'w', 'h', 'old_codes', 'note'].forEach(function(k) { keep[k] = r[k]; });
  try { await opApi('destroy', 'crm_rooms', id); op.rooms = op.rooms.filter(function(x) { return x.id !== id; }); op.sel = null; op.undo.push({ t: 'del', vals: keep }); opRefresh(); opToast('Удалено — можно отменить'); }
  catch (e) { opToast('Не удалось удалить'); }
}
async function opRenum() {
  const q = function(s) { return opRoot().querySelector('[data-r="' + s + '"]'); };
  const prefix = q('prefix').value, start = Number(q('start').value) || 0, pad = Number(q('pad').value) || 1;
  const rs = opPlanRooms().slice().sort(function(a, b) { const ay = Math.round((Number(a.y) || 0) * 2), by = Math.round((Number(b.y) || 0) * 2); return ay - by || (Number(a.x) || 0) - (Number(b.x) || 0); });
  const codes = rs.map(function(r, i) { let n = String(start + i); while (n.length < pad) n = '0' + n; return prefix + n; });
  // ID с других планов этого объекта не должны совпасть
  const other = op.rooms.filter(function(r) { return r.object_id === op.objId && r.plan_id !== op.planId; }).map(function(r) { return String(r.code).toLowerCase(); });
  const clash = codes.filter(function(c) { return other.indexOf(c.toLowerCase()) !== -1; });
  if (clash.length) { opToast('Уже заняты на других планах: ' + clash.slice(0, 3).join(', ')); return; }
  const list = [];
  try {
    // два прохода, чтобы не упереться в уникальность (П-01 ↔ П-02)
    for (const r of rs) await opApi('update', 'crm_rooms', r.id, { code: '~' + r.id });
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i], prev = r.code;
      const old = (r.old_codes || []).slice(); if (prev !== codes[i] && old.indexOf(prev) === -1) old.push(prev);
      list.push({ id: r.id, vals: { code: prev, old_codes: r.old_codes || [] } });
      await opApi('update', 'crm_rooms', r.id, { code: codes[i], old_codes: old });
      r.code = codes[i]; r.old_codes = old;
    }
    op.undo.push({ t: 'batch', list: list }); op.panel = 'room'; opRefresh(); opToast('Перенумеровано: ' + rs.length);
  } catch (e) { opToast('Сбой при перенумерации — обновите страницу'); }
}
async function opUpload(file) {
  const boundary = '----opBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  let tok = null; try { tok = localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { /* нет */ }
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const data = ((await res.json()) || {}).data || {};
  if (!data.id) throw new Error('upload');
  return data;
}
async function opSavePlan() {
  const q = function(s) { return opRoot().querySelector('[data-p="' + s + '"]'); };
  const p = opPlan(), nw = !p || op.newPlan;
  const vals = { title: q('title').value.trim() || 'План', width_m: opNum(q('width_m').value), height_m: opNum(q('height_m').value) };
  if (!vals.width_m || !vals.height_m || vals.width_m <= 0 || vals.height_m <= 0) { opToast('Ширина и глубина — числа больше нуля'); return; }
  if (!nw) { vals.bg_opacity = opNum(q('bg_opacity').value); vals.schematic = q('schematic').checked; vals.note = q('note').value; }
  try {
    if (nw) {
      const np = await opApi('create', 'crm_floor_plans', Object.assign(vals, { object_id: op.objId, sort: op.plans.filter(function(x) { return x.object_id === op.objId; }).length + 1, bg_opacity: 0.6, schematic: false }));
      op.plans.push(np); op.planId = np.id; op.view = null;
    } else {
      const f = q('bg').files && q('bg').files[0];
      if (f) { const up = await opUpload(f); vals.bg_url = up.url; vals.bg_file_id = up.id; }
      await opApi('update', 'crm_floor_plans', p.id, vals); Object.assign(p, vals); op.view = null;
    }
    op.newPlan = false; op.panel = 'room'; opRender(); opToast('План сохранён');
  } catch (e) { opToast('Не удалось сохранить план'); }
}
async function opRoomField(el) {
  const r = opRoom(op.sel); if (!r) return;
  const f = el.getAttribute('data-f'); let v = el.value;
  if (f === 'code') {
    v = v.trim(); const err = opRoot().querySelector('[data-err="code"]');
    if (!v) { if (err) err.textContent = 'ID не может быть пустым'; el.value = r.code; return; }
    if (opCodeTaken(v, r.id)) { if (err) err.textContent = 'Такой ID уже есть в этом объекте'; return; }
    if (err) err.textContent = '';
    if (v === r.code) return;
    const old = (r.old_codes || []).slice(); if (old.indexOf(r.code) === -1) old.push(r.code);
    if (await opSaveRoom(r.id, { code: v, old_codes: old })) opToast('ID: ' + v);
    opRefresh(); return;
  }
  if (['x', 'y', 'w', 'h', 'area_sqm'].indexOf(f) !== -1) {
    v = opNum(v);
    if (v === null && f !== 'area_sqm') { el.value = opM(r[f]); return; }
    if ((f === 'w' || f === 'h') && v < 0.1) v = 0.1;
    if (v !== null) v = opR(v);
  }
  if (f === 'contract_id') v = v ? Number(v) : null;
  if (r[f] === v) return;
  await opSaveRoom(r.id, { [f]: v }); opRefresh();
}

// ---------- события ----------
opRoot().addEventListener('click', async function(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const ob = c('[data-obj]'), pl = c('[data-plan]'), tr = c('tr[data-room]'), a = c('[data-act]');
  if (ob) { op.objId = Number(ob.getAttribute('data-obj')); try { localStorage.setItem('crm-objplan-obj', op.objId); } catch (x) { /* нет */ } op.sel = null; op.panel = 'room'; op.undo = []; opPickPlan(); opRender(); return; }
  if (pl) { op.planId = Number(pl.getAttribute('data-plan')); op.sel = null; op.view = null; op.panel = 'room'; opRender(); return; }
  if (tr) { op.sel = Number(tr.getAttribute('data-room')); op.panel = 'room'; opRefresh(); return; }
  if (!a) return;
  const act = a.getAttribute('data-act');
  if (act === 'edit') { op.edit = !op.edit; op.panel = 'room'; opRender(); return; }
  if (act === 'zin') return opZoom(1 / 1.3);
  if (act === 'zout') return opZoom(1.3);
  if (act === 'zfit') { opFit(); opDraw(); return; }
  if (act === 'undo') return opUndo();
  if (act === 'room-add') return opAddRoom(null);
  if (act === 'room-dup') return opAddRoom(opRoom(op.sel));
  if (act === 'room-del') return opDelRoom(op.sel);
  if (act === 'room-fit') { const r = opRoom(op.sel), ar = opNum(r && r.area_sqm); if (r && ar && Number(r.w) > 0) { await opSaveRoom(r.id, { h: opR(ar / Number(r.w)) }); opRefresh(); } return; }
  if (act === 'renum') { op.panel = 'renum'; opRenderSide(); return; }
  if (act === 'renum-go') return opRenum();
  if (act === 'plan-add') { op.newPlan = true; op.panel = 'plan'; opRenderSide(); return; }
  if (act === 'plan-set') { op.newPlan = false; op.panel = 'plan'; opRenderSide(); return; }
  if (act === 'plan-save') return opSavePlan();
  if (act === 'side-close') { op.newPlan = false; op.panel = 'room'; opRenderSide(); return; }
  if (act === 'bg-del') { const p = opPlan(); try { await opApi('update', 'crm_floor_plans', p.id, { bg_url: null, bg_file_id: null }); p.bg_url = null; p.bg_file_id = null; opRender(); } catch (x) { opToast('Не удалось'); } return; }
  if (act === 'plan-del') {
    const p = opPlan(); if (!p) return;
    if (opPlanRooms().length) { opToast('Сначала удалите или перенесите помещения плана'); return; }
    if (!a.dataset.sure) { a.dataset.sure = '1'; a.textContent = 'Точно удалить план?'; return; }
    try { await opApi('destroy', 'crm_floor_plans', p.id); op.plans = op.plans.filter(function(x) { return x.id !== p.id; }); op.panel = 'room'; opPickPlan(); opRender(); } catch (x) { opToast('Не удалось удалить план'); }
  }
});
opRoot().addEventListener('change', function(e) {
  const el = e.target;
  if (el.matches && el.matches('[data-f]')) opRoomField(el);
  if (el.matches && el.matches('[data-p="bg_opacity"]')) { const p = opPlan(); if (p) { p.bg_opacity = Number(el.value); opDraw(); } }
});
opRoot().addEventListener('input', function(e) {
  const el = e.target;
  if (el.matches && el.matches('[data-p="bg_opacity"]')) { const p = opPlan(); if (p) { p.bg_opacity = Number(el.value); opDraw(); } }
});
opRoot().addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[data-f]')) { e.preventDefault(); e.target.blur(); }
});
window.addEventListener('resize', function() { if (opSvg()) opDraw(); });

(async function opStart() {
  try {
    const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + (function() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return ''; } })() } });
    op.me = ((await res.json()) || {}).data || null;
    await opLoad();
    opRender();
  } catch (e) {
    opRoot().innerHTML = '<div style="color:#cf1322;padding:12px;">Не удалось загрузить планы. Обновите страницу.</div>';
  }
})();
