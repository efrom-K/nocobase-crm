// «Объекты» → вкладка «Планы и помещения» (/admin/j3a32zo1jzo/tab/objplantab1, блок objplanblk01): планы объектов и помещения с ID.
// Слева объекты, в центре план (SVG, метры), справа карточка помещения; под планом — таблица помещений (сдано / свободно по ссылке на договор).
// Редактор (только admin): перетаскивание и размер мышью, стрелки, ID и перенумерация (прежние ID — old_codes), планы-этажи, подложка-чертёж, отмена.
// Чертёж: помещения любой формы (crm_rooms.poly — углы в метрах; без poly — прямоугольник x/y/w/h, bbox держим и для контура),
// стены, двери, окна, ворота, размеры, подписи — crm_floor_plans.drawing = { items: [...] } (проём хранит стену wid и расстояние u от её начала).
// Привязка к углам и стенам, углы 0/45/90°, длина с клавиатуры. Отмена чертежа — снимок drawing целиком.
// Обозначения как в поэтажных планах БТИ: стены по типу (wt: наружная / несущая / перегородка — разная толщина и заливка), дуговые стены (b — стрелка прогиба, м),
// колонны (col), двери однопольные / двупольные / проём (dt), окна тремя линиями. Подложка — drawing.bg = { x, y, w, h } в метрах, масштаб по двум точкам.
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
    #crm-objplan { --ink:#1f2433; --muted:#5b6478; --line:#dfe3ec; --soft:#f3f5f9; --brand:#1c2d58; --brand2:#2f4a8a; --red:#cf1322; color:var(--ink); font-size:13.5px; }
    #crm-objplan .op-wrap { display:grid; grid-template-columns:232px minmax(0,1fr) 340px; gap:16px; align-items:start; }
    #crm-objplan .op-card { background:#fff; border:1px solid var(--line); border-radius:10px; }
    #crm-objplan .op-cap { font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:#7c869b; }
    /* объекты */
    #crm-objplan .op-objs { padding:12px 8px 8px; position:sticky; top:8px; max-height:calc(100vh - 150px); overflow:auto; }
    #crm-objplan .op-objs .op-cap { padding:0 8px 8px; }
    #crm-objplan .op-search { width:100%; box-sizing:border-box; border:1px solid var(--line); background:var(--soft); border-radius:7px; padding:6px 10px; font:inherit; font-size:13px; color:var(--ink); margin-bottom:6px; }
    #crm-objplan .op-search:focus { outline:none; border-color:var(--brand); background:#fff; }
    #crm-objplan .op-obj { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:7px 10px; border-radius:7px; cursor:pointer; font-weight:500; }
    #crm-objplan .op-obj:hover { background:var(--soft); }
    #crm-objplan .op-obj.on { background:var(--brand); color:#fff; font-weight:700; }
    #crm-objplan .op-obj small { color:#8a93a6; font-weight:600; font-size:11.5px; white-space:nowrap; }
    #crm-objplan .op-obj.on small { color:#d6dcf0; }
    #crm-objplan .op-main { min-width:0; }
    /* шапка */
    #crm-objplan .op-head { display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; margin-bottom:10px; }
    #crm-objplan .op-title { font-size:20px; font-weight:700; line-height:1.15; margin-right:4px; }
    #crm-objplan .op-title small { display:block; font-size:12px; font-weight:500; color:var(--muted); margin-top:2px; }
    #crm-objplan .op-grow { flex:1; }
    #crm-objplan .op-seg { display:inline-flex; flex-wrap:wrap; background:var(--soft); border:1px solid var(--line); border-radius:9px; padding:3px; gap:2px; }
    #crm-objplan .op-seg button { display:inline-flex; align-items:center; gap:6px; border:0; background:transparent; height:28px; padding:0 12px; border-radius:6px; font:inherit; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; }
    #crm-objplan .op-seg button svg { width:16px; height:16px; }
    #crm-objplan .op-seg button:hover:not(.on) { color:var(--ink); background:#e8ecf3; }
    #crm-objplan .op-seg button.on { background:#fff; color:var(--brand); box-shadow:0 1px 3px rgba(16,24,40,.14); }
    /* кнопки */
    #crm-objplan .op-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:32px; padding:0 12px; border:1px solid #cdd3df; background:#fff; color:var(--ink); border-radius:7px; font:inherit; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; transition:border-color .15s, background .15s, color .15s; }
    #crm-objplan .op-btn svg { width:16px; height:16px; flex:none; }
    #crm-objplan .op-btn:hover { border-color:var(--brand); color:var(--brand); background:#f7f9fd; }
    #crm-objplan .op-btn.on, #crm-objplan .op-btn.pri { background:var(--brand); border-color:var(--brand); color:#fff; }
    #crm-objplan .op-btn.pri:hover { background:var(--brand2); border-color:var(--brand2); }
    #crm-objplan .op-btn.red { color:var(--red); border-color:#ffa39e; }
    #crm-objplan .op-btn.red:hover { background:#fff1f0; }
    #crm-objplan .op-btn:disabled { opacity:.42; cursor:default; pointer-events:none; }
    /* лента действий */
    #crm-objplan .op-ribbon { display:flex; flex-wrap:wrap; align-items:stretch; row-gap:8px; padding:7px 4px 6px; margin-bottom:10px; }
    #crm-objplan .op-grp { display:flex; flex-direction:column; gap:5px; padding:0 12px; border-right:1px solid var(--line); }
    #crm-objplan .op-grp:last-child { border-right:0; }
    #crm-objplan .op-grp .op-cap { text-align:center; font-size:10.5px; }
    #crm-objplan .op-grp-b { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }
    /* холст */
    #crm-objplan .op-stage { position:relative; border:1px solid #c9d1df; border-radius:10px; background:#f7f8fb; height:calc(100vh - 300px); min-height:440px; overflow:hidden; }
    #crm-objplan .op-stage.edit { border-color:var(--brand); box-shadow:0 0 0 3px rgba(28,45,88,.10); }
    #crm-objplan .op-canvas { position:absolute; inset:0; touch-action:none; user-select:none; outline:none; }
    #crm-objplan .op-canvas svg { width:100%; height:100%; display:block; }
    #crm-objplan .op-float { position:absolute; z-index:2; background:#fff; border:1px solid var(--line); border-radius:10px; box-shadow:0 4px 16px rgba(16,24,40,.10); }
    #crm-objplan .op-palette { left:10px; top:10px; display:flex; flex-direction:column; gap:2px; padding:5px; }
    #crm-objplan .op-palette i { display:block; height:1px; background:var(--line); margin:3px 4px; }
    #crm-objplan .op-tb { width:38px; height:38px; border:0; background:transparent; border-radius:7px; color:var(--ink); cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative; padding:0; }
    #crm-objplan .op-tb svg { width:20px; height:20px; }
    #crm-objplan .op-tb:hover { background:var(--soft); }
    #crm-objplan .op-tb.on { background:var(--brand); color:#fff; }
    #crm-objplan .op-tb[data-tip]:hover::after { content:attr(data-tip); position:absolute; left:46px; top:50%; transform:translateY(-50%); background:#1f2433; color:#fff; font-size:12px; font-weight:500; padding:4px 9px; border-radius:6px; white-space:nowrap; pointer-events:none; z-index:5; }
    #crm-objplan .op-zoom { right:10px; top:10px; display:flex; align-items:center; gap:1px; padding:3px; }
    #crm-objplan .op-zoom .op-tb { width:32px; height:30px; }
    #crm-objplan .op-zoom .op-tb svg { width:18px; height:18px; }
    #crm-objplan .op-zoom .op-tb[data-tip]:hover::after { left:auto; right:0; top:38px; transform:none; }
    #crm-objplan .op-zoom span { min-width:50px; text-align:center; font-weight:700; font-size:12.5px; font-variant-numeric:tabular-nums; color:var(--muted); }
    #crm-objplan .op-legend { left:10px; bottom:10px; display:flex; flex-wrap:wrap; gap:6px 14px; padding:6px 12px; font-size:12px; color:var(--muted); font-weight:500; }
    #crm-objplan .op-stage.edit .op-legend { left:62px; }
    #crm-objplan .op-legend i { display:inline-block; width:12px; height:12px; border-radius:3px; border:1.5px solid; vertical-align:-2px; margin-right:5px; }
    #crm-objplan .op-3d { position:absolute; inset:0; touch-action:none; background:linear-gradient(#f4f6fa, #e3e8f0); }
    #crm-objplan .op-3d canvas { display:block; width:100%; height:100%; cursor:grab; }
    #crm-objplan .op-3d canvas:active { cursor:grabbing; }
    #crm-objplan .op-3d-msg { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--muted); font-weight:600; }
    #crm-objplan .op-3dbar { left:10px; top:10px; display:flex; flex-wrap:wrap; align-items:center; gap:6px; padding:6px; max-width:calc(100% - 20px); }
    #crm-objplan .op-3dbar label { display:inline-flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); font-weight:600; padding:0 4px; }
    #crm-objplan .op-3dbar input { width:56px; height:30px; border:1px solid #cdd3df; border-radius:7px; padding:0 8px; font:inherit; font-size:13px; }
    /* строка состояния */
    #crm-objplan .op-status { display:flex; flex-wrap:wrap; align-items:center; gap:6px 14px; padding:8px 2px 0; font-size:12.5px; color:var(--muted); line-height:1.45; }
    #crm-objplan .op-status b { color:var(--ink); font-weight:600; font-variant-numeric:tabular-nums; }
    #crm-objplan .op-status [data-st="hint"] { flex:1; min-width:280px; }
    #crm-objplan .op-pill { display:inline-flex; align-items:center; gap:6px; background:var(--soft); border:1px solid var(--line); border-radius:12px; padding:1px 10px; color:var(--ink); font-weight:600; white-space:nowrap; }
    #crm-objplan .op-pill svg { width:14px; height:14px; }
    #crm-objplan .op-xy { white-space:nowrap; }
    #crm-objplan .op-warn { background:#fff7e6; border:1px solid #ffd591; color:#873800; border-radius:8px; padding:7px 12px; font-size:12.5px; margin-bottom:10px; }
    /* экспорт */
    #crm-objplan .op-menu-w { position:relative; }
    #crm-objplan .op-menu { display:none; position:absolute; right:0; top:38px; z-index:20; padding:6px; min-width:300px; }
    #crm-objplan .op-menu.open { display:block; }
    #crm-objplan .op-menu button { display:flex; width:100%; gap:12px; align-items:center; border:0; background:transparent; padding:8px 10px; border-radius:7px; font:inherit; text-align:left; cursor:pointer; color:var(--ink); }
    #crm-objplan .op-menu button:hover { background:var(--soft); }
    #crm-objplan .op-menu b { display:block; font-size:13.5px; font-weight:600; }
    #crm-objplan .op-menu small { display:block; color:var(--muted); font-size:12px; }
    #crm-objplan .op-fmt { width:44px; flex:none; font-size:10.5px; font-weight:800; letter-spacing:.04em; text-align:center; border-radius:5px; padding:4px 0; color:#fff; }
    /* инспектор */
    #crm-objplan .op-side { position:sticky; top:8px; max-height:calc(100vh - 150px); overflow:auto; }
    #crm-objplan .op-side h4 { margin:0; padding:13px 16px; font-size:15px; font-weight:700; border-bottom:1px solid var(--line); background:#fafbfd; border-radius:10px 10px 0 0; }
    #crm-objplan .op-sb { padding:12px 16px 16px; }
    #crm-objplan .op-f { margin-bottom:11px; }
    #crm-objplan .op-f label { display:block; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#7c869b; margin-bottom:4px; }
    #crm-objplan .op-f input[type=text], #crm-objplan .op-f input[type=number], #crm-objplan .op-f select, #crm-objplan .op-f textarea { width:100%; box-sizing:border-box; border:1px solid #cdd3df; border-radius:7px; padding:6px 9px; font:inherit; font-size:13.5px; color:var(--ink); background:#fff; }
    #crm-objplan .op-f input[type=text], #crm-objplan .op-f input[type=number], #crm-objplan .op-f select { height:33px; }
    #crm-objplan .op-f input:focus, #crm-objplan .op-f textarea:focus { outline:none; border-color:var(--brand); box-shadow:0 0 0 3px rgba(28,45,88,.12); }
    #crm-objplan .op-f input[readonly] { background:var(--soft); color:var(--muted); }
    #crm-objplan .op-f .op-sub { font-size:12px; color:var(--muted); margin-top:4px; line-height:1.4; }
    #crm-objplan .op-f .op-err, #crm-objplan .op-err { font-size:12px; color:var(--red); margin-top:-6px; margin-bottom:6px; }
    #crm-objplan .op-g4 { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; }
    #crm-objplan .op-g2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    #crm-objplan .op-acts { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; padding-top:12px; border-top:1px solid #eef1f6; }
    #crm-objplan .op-kv { display:grid; grid-template-columns:auto 1fr; gap:6px 12px; font-size:13px; }
    #crm-objplan .op-kv b { color:var(--muted); font-weight:500; }
    #crm-objplan .op-hint { font-size:12.5px; color:var(--muted); line-height:1.45; margin:6px 0 0; }
    #crm-objplan .op-keys { font-size:12px; color:var(--muted); line-height:1.7; margin-top:12px; padding-top:10px; border-top:1px solid #eef1f6; }
    #crm-objplan .op-keys kbd { display:inline-block; min-width:16px; text-align:center; font:inherit; font-size:11px; font-weight:700; color:var(--ink); background:var(--soft); border:1px solid var(--line); border-bottom-width:2px; border-radius:4px; padding:0 4px; }
    /* экспликация */
    #crm-objplan .op-tbl { margin-top:14px; padding:12px 14px 6px; }
    #crm-objplan .op-tbl-h { display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px; margin-bottom:10px; }
    #crm-objplan .op-tbl-h .op-t-title { font-size:15px; font-weight:700; margin-right:6px; }
    #crm-objplan .op-tbl-h .op-pill b { font-size:13.5px; }
    #crm-objplan .op-tbl-h small { color:#8a93a6; font-size:12px; }
    #crm-objplan table.op-t { width:100%; border-collapse:collapse; font-size:13px; }
    #crm-objplan .op-t th { background:#eef1f6; border-bottom:2px solid #c9d1df; text-align:left; padding:7px 8px; font-weight:600; white-space:nowrap; color:#262626; }
    #crm-objplan .op-t td { padding:6px 8px; border-bottom:1px solid #edf0f5; color:#1f1f1f; }
    #crm-objplan .op-t tr:nth-child(even) td { background:#f8f9fb; }
    #crm-objplan .op-t tbody tr { cursor:pointer; }
    #crm-objplan .op-t tbody tr:hover td { background:#eaf0ff; }
    #crm-objplan .op-t tr.on td { background:#dbe4ff !important; font-weight:600; }
    #crm-objplan .op-t .num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
    #crm-objplan .op-chip { display:inline-block; padding:0 8px; border-radius:9px; font-size:11.5px; font-weight:600; border:1px solid; white-space:nowrap; }
    #crm-objplan .op-toast { position:fixed; right:24px; bottom:24px; background:#1f2433; color:#fff; padding:9px 15px; border-radius:8px; font-size:13px; z-index:2000; box-shadow:0 6px 20px rgba(0,0,0,.2); }
    /* чертёж */
    #crm-objplan svg text { pointer-events:none; font-family:inherit; }
    #crm-objplan svg .op-room { cursor:pointer; }
    #crm-objplan .edit svg .op-room { cursor:move; }
    #crm-objplan svg .op-h { cursor:nwse-resize; }
    #crm-objplan svg .op-h.v { cursor:move; }
    #crm-objplan svg .op-h.m { cursor:copy; }
    #crm-objplan .edit svg .op-it { cursor:move; }
    #crm-objplan .op-canvas.edit:not(.tool) svg path.op-it[data-it]:hover { stroke:rgba(207,19,34,.16); }
    #crm-objplan .op-canvas.edit:not(.tool) svg .op-it:hover > rect:last-child { fill:rgba(207,19,34,.10); }
    #crm-objplan .op-canvas:not(.edit) svg .op-it { pointer-events:none; }
    #crm-objplan .op-canvas:not(.edit) svg .op-stair[data-go] { pointer-events:auto; cursor:pointer; }
    #crm-objplan .op-canvas.tool, #crm-objplan .op-canvas.tool svg .op-room, #crm-objplan .op-canvas.tool svg .op-it { cursor:crosshair; }
    @media (max-width: 1250px) { #crm-objplan .op-wrap { grid-template-columns:200px minmax(0,1fr); } #crm-objplan .op-side { grid-column:1 / -1; position:static; max-height:none; } }
    @media (max-width: 800px) { #crm-objplan .op-wrap { grid-template-columns:1fr; } #crm-objplan .op-objs { position:static; max-height:240px; } }
  `;
  document.head.appendChild(st);
}
// @include src/_crm-xlsx.js

// ---------- состояние ----------
const OP_KINDS = { rent: 'Под аренду', tech: 'Техническое', common: 'Общего пользования' };
const OP_COLORS = { rented: ['#dbe4ff', '#1c2d58'], free: ['#d9f7be', '#389e0d'], tech: ['#ececec', '#8c8c8c'], common: ['#fff1d6', '#d48806'] };
const OP_SNAP = 0.5;   // шаг стрелок, м (с Alt — 0,1); мышь — шаг по масштабу (opStep)
const OP_TOOLS = [['sel', 'Выбор', 'V'], ['wall', 'Стена', 'W'], ['room', 'Помещение по углам', 'P'], ['rect', 'Прямоугольник', 'R'],
  ['door', 'Дверь', 'D'], ['window', 'Окно', 'O'], ['gate', 'Ворота', 'G'], ['stair', 'Лестница', 'S'], ['col', 'Колонна', 'C'], ['dim', 'Размер', 'M'], ['text', 'Подпись', 'T']];
// инструменты без кнопки в палитре — с ленты «Подложка»
const OP_XTOOLS = { calib: 'Масштаб подложки', bgmove: 'Сдвиг подложки' };
function opToolName(t) { return OP_XTOOLS[t] || (OP_TOOLS.find(function(x) { return x[0] === t; }) || [])[1] || ''; }
// типы стен: название, толщина по умолчанию, заливка (контур всегда чёрный)
const OP_WT = { ext: ['Наружная', 0.5, '#7a7a7a'], bear: ['Несущая внутренняя', 0.38, '#cfcfcf'], part: ['Перегородка', 0.12, '#ffffff'] };
function opWtByT(t) { return t >= 0.35 ? 'ext' : t >= 0.25 ? 'bear' : 'part'; }
function opWT(w) { return OP_WT[w.wt] ? w.wt : opWtByT(Number(w.t) || 0.2); }
const OP_DT = { one: 'Однопольная', two: 'Двупольная', open: 'Проём без двери' };
const OP_KEYS = {}; OP_TOOLS.forEach(function(t) { OP_KEYS['Key' + t[2]] = t[0]; });
const OP_IT = { wall: 'Стена', door: 'Дверь', window: 'Окно', gate: 'Ворота', dim: 'Размер', text: 'Подпись', stair: 'Лестница', col: 'Колонна' };
const OP_OPEN = { door: 1, window: 1, gate: 1 };
const op = { me: null, edit: false, objs: [], plans: [], rooms: [], cons: [], objId: null, planId: null, sel: null, selItem: null, view: null, undo: [], panel: 'room', drag: null,
  tool: 'sel', chain: [], cal: [], hover: null, typed: '', ghost: false, def: { wall: 0.5, wt: '', door: 0.9, window: 1.2, gate: 3, col: 0.4, colsh: 'sq' }, saveQ: Promise.resolve() };
try { op.objId = Number(localStorage.getItem('crm-objplan-obj')) || null; } catch (e) { /* нет хранилища */ }
try { Object.assign(op.def, JSON.parse(localStorage.getItem('crm-objplan-def') || '{}')); op.ghost = localStorage.getItem('crm-objplan-ghost') === '1'; } catch (e) { /* нет хранилища */ }
if (!OP_WT[op.def.wt]) op.def.wt = opWtByT(op.def.wall);

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

// ---------- геометрия ----------
function opDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function opIsPoly(r) { return Array.isArray(r.poly) && r.poly.length >= 3; }
function opRoomPts(r) {
  if (opIsPoly(r)) return r.poly.map(function(q) { return [Number(q[0]) || 0, Number(q[1]) || 0]; });
  const x = Number(r.x) || 0, y = Number(r.y) || 0, w = Math.max(0.1, Number(r.w) || 1), h = Math.max(0.1, Number(r.h) || 1);
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
function opBBox(pts) {
  const xs = pts.map(function(q) { return q[0]; }), ys = pts.map(function(q) { return q[1]; });
  const x = Math.min.apply(null, xs), y = Math.min.apply(null, ys);
  return { x: opR(x), y: opR(y), w: opR(Math.max.apply(null, xs) - x), h: opR(Math.max.apply(null, ys) - y) };
}
function opPolyArea(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
// ponytail: центр масс контура — у «буквы П» может попасть мимо помещения; нужен polylabel, если начнёт мешать
function opCentroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], c = p[0] * q[1] - q[0] * p[1]; a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; }
  if (Math.abs(a) < 1e-9) return [pts.reduce(function(s, q) { return s + q[0]; }, 0) / pts.length, pts.reduce(function(s, q) { return s + q[1]; }, 0) / pts.length];
  return [cx / (3 * a), cy / (3 * a)];
}
function opPolyVals(pts) { const p = pts.map(function(q) { return [opR(q[0]), opR(q[1])]; }); return Object.assign({ poly: p }, opBBox(p)); }
function opPathD(pts) { return 'M' + pts.map(function(q) { return q[0] + ' ' + q[1]; }).join('L') + 'Z'; }
// шаг привязки мыши — по масштабу: примерно 6 пикселей экрана
function opStep() { const want = (op.vb ? op.vb.px : 0.05) * 6; return [0.05, 0.1, 0.25, 0.5, 1, 2, 5].find(function(s) { return s >= want; }) || 5; }

// ---------- чертёж плана: стены, проёмы, размеры, подписи ----------
function opDw(p) { if (!p.drawing || !Array.isArray(p.drawing.items)) p.drawing = { items: [] }; return p.drawing; }
// место подложки на плане, м; старые планы — растянута на весь план
function opBgRect(p) { const b = opDw(p).bg, W = Number(p.width_m) || 60, H = Number(p.height_m) || 40; return b && b.w > 0 && b.h > 0 ? b : { x: 0, y: 0, w: W, h: H }; }
function opItems() { const p = opPlan(); return p ? opDw(p).items : []; }
function opItem(id) { return id ? opItems().find(function(x) { return x.id === id; }) || null : null; }
function opNewId() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function opDrawSnap() { return JSON.parse(JSON.stringify(opDw(opPlan()))); }
// весь чертёж одним полем; очередь — чтобы быстрые правки не обогнали друг друга (уходит то, что есть на момент отправки)
function opPushDrawing(p) {
  op.saveQ = op.saveQ.then(function() { return opApi('update', 'crm_floor_plans', p.id, { drawing: p.drawing }); })
    .catch(function() { opToast('Чертёж не сохранился — обновите страницу'); });
}
function opDrawCommit(before) { const p = opPlan(); op.undo.push({ t: 'draw', id: p.id, d: before }); opPushDrawing(p); }
function opWallLen(w) { return Math.hypot(w.x2 - w.x1, w.y2 - w.y1); }
// дуговая стена: b — стрелка прогиба от середины хорды (плюс — по нормали (-dy, dx), на экране вправо по ходу стены); null — прямая
function opArc(w) {
  const b = Number(w.b) || 0, L = opWallLen(w); if (Math.abs(b) < 1e-3 || L < 1e-6) return null;
  const nx = -(w.y2 - w.y1) / L, ny = (w.x2 - w.x1) / L, mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2, R = (L * L / 4 + b * b) / (2 * Math.abs(b));
  const cx = mx + nx * (b - Math.sign(b) * R), cy = my + ny * (b - Math.sign(b) * R), a1 = Math.atan2(w.y1 - cy, w.x1 - cx);
  let da = Math.atan2(my + ny * b - cy, mx + nx * b - cx) - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da <= -Math.PI) da += 2 * Math.PI;
  return { cx: cx, cy: cy, R: R, a1: a1, d: 2 * da, ax: mx + nx * b, ay: my + ny * b };
}
function opWallArcLen(w) { const A = opArc(w); return A ? A.R * Math.abs(A.d) : opWallLen(w); }
// точка на стене в u метрах от начала и направление стены там, °
function opWallAt(w, u) {
  const A = opArc(w);
  if (!A) { const L = opWallLen(w) || 1e-9; return { x: w.x1 + (w.x2 - w.x1) * u / L, y: w.y1 + (w.y2 - w.y1) * u / L, a: Math.atan2(w.y2 - w.y1, w.x2 - w.x1) * 180 / Math.PI }; }
  const g = A.a1 + A.d * u / (A.R * Math.abs(A.d));
  return { x: A.cx + A.R * Math.cos(g), y: A.cy + A.R * Math.sin(g), a: (g + Math.sign(A.d) * Math.PI / 2) * 180 / Math.PI };
}
function opWallD(w) {
  const A = opArc(w);
  return 'M' + w.x1 + ' ' + w.y1 + (A ? 'A' + A.R + ' ' + A.R + ' 0 ' + (Math.abs(A.d) > Math.PI ? 1 : 0) + ' ' + (A.d > 0 ? 1 : 0) + ' ' : 'L') + w.x2 + ' ' + w.y2;
}
// положение проёма: в стене (wid + u от начала стены) или свободно (x, y, a — угол в градусах)
function opOpG(it) {
  const w = it.wid ? opItem(it.wid) : null;
  if (w && w.k === 'wall') {
    const L = opWallArcLen(w) || 1e-9, ww = Number(it.w) || 0.9, u = L < ww ? L / 2 : Math.min(L - ww / 2, Math.max(ww / 2, Number(it.u) || 0)), q = opWallAt(w, u);
    return { x: q.x, y: q.y, a: q.a, t: Number(w.t) || 0.2, L: L, u: u };
  }
  return { x: Number(it.x) || 0, y: Number(it.y) || 0, a: Number(it.a) || 0, t: Number(it.t) || 0.2 };
}
function opNearWall(pt, maxD, excl) {
  let best = null;
  opItems().forEach(function(w) {
    if (w.k !== 'wall' || (excl && excl.indexOf(w.id) !== -1)) return;
    const A = opArc(w);
    if (A) {   // дуга: расстояние до окружности, если точка напротив дуги; иначе — до ближнего конца
      let t = (Math.atan2(pt.y - A.cy, pt.x - A.cx) - A.a1) * Math.sign(A.d); t = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const La = A.R * Math.abs(A.d); let u, d;
      if (t <= Math.abs(A.d)) { u = A.R * t; d = Math.abs(Math.hypot(pt.x - A.cx, pt.y - A.cy) - A.R); }
      else { const d1 = Math.hypot(pt.x - w.x1, pt.y - w.y1), d2 = Math.hypot(pt.x - w.x2, pt.y - w.y2); u = d1 < d2 ? 0 : La; d = Math.min(d1, d2); }
      if (d <= maxD && (!best || d < best.d)) best = { wall: w, u: u, L: La, d: d };
      return;
    }
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy; if (L2 < 1e-9) return;
    const k = Math.max(0, Math.min(1, ((pt.x - w.x1) * dx + (pt.y - w.y1) * dy) / L2)), d = Math.hypot(pt.x - w.x1 - k * dx, pt.y - w.y1 - k * dy);
    if (d <= maxD && (!best || d < best.d)) best = { wall: w, u: k * Math.sqrt(L2), L: Math.sqrt(L2), d: d };
  });
  return best;
}
// куда встанет проём с центром в pt: на ближайшую стену (в пределах ~1 м) или свободно
function opOpPlace(kind, pt, base) {
  const w = base ? Number(base.w) || op.def[kind] : op.def[kind], flip = base ? base.flip || 0 : 0;
  const near = opNearWall(pt, Math.max(0.8, 20 * op.vb.px));
  if (near) return { k: kind, wid: near.wall.id, u: opR(near.L < w ? near.L / 2 : Math.min(near.L - w / 2, Math.max(w / 2, opSnap(near.u, opStep() / 2)))), w: w, flip: flip };
  return { k: kind, x: opR(opSnap(pt.x, opStep())), y: opR(opSnap(pt.y, opStep())), a: base && !base.wid ? base.a || 0 : 0, t: op.def.wall, w: w, flip: flip };
}
function opSnapCands(skip) {
  const s = skip || [], out = [];
  opItems().forEach(function(it) {
    if (it.k === 'col') { out.push([it.x, it.y]); return; }
    if (it.k !== 'wall' && it.k !== 'dim') return;
    if (s.indexOf(it.id + ':p1') === -1) out.push([it.x1, it.y1]);
    if (s.indexOf(it.id + ':p2') === -1) out.push([it.x2, it.y2]);
  });
  opPlanRooms().forEach(function(r) { opRoomPts(r).forEach(function(q, i) { if (s.indexOf('r' + r.id + ':' + i) === -1) out.push(q); }); });
  op.chain.forEach(function(q) { out.push([q.x, q.y]); });
  return out;
}
// привязка точки: к углам стен и помещений (10 px), иначе шаг сетки; от предыдущей точки — углы 0/45/90° (магнит 6°, Shift — всегда), Alt — без привязки
function opSnapPt(raw, e, from, skip) {
  const px = op.vb.px, free = e && e.altKey, s0 = skip || [];
  if (!free) {
    let best = null, bd = 10 * px;
    opSnapCands(skip).forEach(function(c) { const d = Math.hypot(c[0] - raw.x, c[1] - raw.y); if (d < bd) { bd = d; best = c; } });
    if (best) return { x: best[0], y: best[1], snap: true };
    // точка на оси прямой стены (Т-примыкание): от предыдущей точки — пересечение луча 0/45/90° со стеной, иначе — проекция
    const ws = opNearWall(raw, 8 * px, s0.map(function(k) { return k.split(':')[0]; }));
    if (ws && !opArc(ws.wall)) {
      const w = ws.wall, ux = (w.x2 - w.x1) / ws.L, uy = (w.y2 - w.y1) / ws.L;
      let q = { x: w.x1 + ux * ws.u, y: w.y1 + uy * ws.u };
      if (from) {
        let a = Math.atan2(raw.y - from.y, raw.x - from.x); const n = Math.round(a / (Math.PI / 4)) * Math.PI / 4;
        if ((e && e.shiftKey) || Math.abs(a - n) < 6 * Math.PI / 180) {
          a = n; const dx = Math.cos(a), dy = Math.sin(a), cr = dx * uy - dy * ux;
          if (Math.abs(cr) > 1e-6) {
            const k = ((w.x1 - from.x) * uy - (w.y1 - from.y) * ux) / cr, X = { x: from.x + dx * k, y: from.y + dy * k };
            if (k > 0 && Math.hypot(X.x - raw.x, X.y - raw.y) < 14 * px) q = X; else q = null;
          } else q = null;
        }
      }
      if (q) return { x: opR(q.x), y: opR(q.y), snap: true };
    }
  }
  const step = free ? 0.01 : opStep();
  if (from) {
    let L = opDist(raw, from), a = Math.atan2(raw.y - from.y, raw.x - from.x);
    if (L < 1e-9) return { x: from.x, y: from.y };
    if (!free) { const q = Math.PI / 4, n = Math.round(a / q) * q; if ((e && e.shiftKey) || Math.abs(a - n) < 6 * Math.PI / 180) a = n; }
    L = Math.max(step, Math.round(L / step) * step);
    return { x: opR(from.x + Math.cos(a) * L), y: opR(from.y + Math.sin(a) * L) };
  }
  return { x: opR(opSnap(raw.x, step)), y: opR(opSnap(raw.y, step)) };
}

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
  op.view = null; op.selItem = null; op.chain = []; op.typed = '';
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
  const before = {}; Object.keys(vals).forEach(function(k) { before[k] = r[k] === undefined ? null : r[k]; });
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
const OP_HINTS = {
  sel: 'Тащите помещения, стены, двери мышью; углы контура — за квадратики, «+» на середине стороны — новый угол, двойной клик по углу — убрать его. Стрелки — на 0,5 м (Alt — 0,1 м), Delete — удалить, Ctrl+Z — отменить.',
  wall: 'Тип стены (наружная, несущая, перегородка) — в панели справа. Клик — начало стены, следующие клики — продолжение. Длину можно набрать цифрами и нажать Enter. Углы прилипают к 0/45/90° (Shift — строго, Alt — без привязки). Enter, двойной клик или правая кнопка — закончить, Esc — отменить.',
  room: 'Кликайте по углам помещения по порядку; клик по первому углу, Enter или двойной клик — замкнуть контур. Длину стороны можно набрать цифрами + Enter. Esc — отменить.',
  rect: 'Протяните мышью прямоугольник помещения от угла до угла.',
  door: 'Наведите на стену — дверь встанет в неё. Клик — поставить. Ширина, сторона открывания, однопольная / двупольная / проём — в панели справа.',
  window: 'Наведите на стену — окно встанет в неё. Клик — поставить. Ширина — в панели справа.',
  gate: 'Наведите на стену — ворота встанут в неё. Клик — поставить. Ширина — в панели справа.',
  dim: 'Два клика — размерная линия с длиной между точками. Привязывается к углам.',
  text: 'Клик — подпись на плане, текст — в панели справа.',
  col: 'Клик — колонна в этой точке (центр прилипает к углам и другим колоннам). Сетку колонн — «Размножить» в панели выбранной колонны.',
  calib: 'Масштаб подложки: кликните две точки на чертеже, расстояние между которыми знаете (например, концы размерной линии или наружной стены), и введите это расстояние справа. Колесо — крупнее, чтобы попасть точнее.',
  bgmove: 'Тащите подложку мышью, чтобы совместить её с нарисованным (или с этажом ниже). Ctrl+Z — отменить.',
  stair: 'Протяните прямоугольник лестницы от нижней ступени к верхней — стрелка покажет подъём. Ширина, ступени и этаж, куда ведёт, — в панели справа.'
};
// иконки — контур 24×24, цвет от кнопки
const OP_ICO = {
  sel: '<path d="M6 3l12 8.5-5.5 1.2L9.5 18z"/>',
  wall: '<path d="M3 18h8V7h10" stroke-width="3.4" stroke-linecap="butt" stroke-linejoin="miter"/>',
  room: '<path d="M4 5h10l6 6v8H4z"/><circle cx="4" cy="5" r="1.6" fill="currentColor"/><circle cx="14" cy="5" r="1.6" fill="currentColor"/><circle cx="20" cy="11" r="1.6" fill="currentColor"/><circle cx="20" cy="19" r="1.6" fill="currentColor"/><circle cx="4" cy="19" r="1.6" fill="currentColor"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  door: '<path d="M2 20h4M18 20h4" stroke-width="2.6"/><path d="M6 20V8" stroke-width="2.2"/><path d="M6 8a12 12 0 0 1 12 12" stroke-dasharray="2.2 2.2"/>',
  window: '<path d="M2 12h3M19 12h3" stroke-width="2.6"/><rect x="5" y="9" width="14" height="6"/><path d="M5 12h14"/>',
  gate: '<path d="M2 12h3M19 12h3" stroke-width="2.6"/><path d="M5 8v8M19 8v8"/><path d="M7 12h10" stroke-dasharray="2.5 2" stroke-width="2.2"/>',
  dim: '<path d="M4 7v10M20 7v10M4 12h16"/><path d="M7.5 9.5L5 12l2.5 2.5M16.5 9.5L19 12l-2.5 2.5"/>',
  text: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  stair: '<path d="M3 20h5v-4h4v-4h4V8h5"/><path d="M3 20V4" stroke-opacity=".35"/>',
  col: '<rect x="8" y="8" width="8" height="8" fill="currentColor"/><path d="M3 3v4M3 17v4M21 3v4M21 17v4" stroke-opacity=".45"/>',
  calib: '<path d="M3 16l13-13 5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
  bgmove: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  roomadd: '<rect x="3" y="6" width="13" height="13" rx="1"/><path d="M19.5 2.5v6M16.5 5.5h6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
function opIco(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (OP_ICO[n] || '') + '</svg>'; }
const OP_FMT = [['png', 'PNG', '#0e7c86', 'Картинка PNG', 'для сообщений и презентаций, высокое разрешение'], ['pdf', 'PDF', '#cf1322', 'PDF для печати', 'лист А3, заголовок, легенда и итоги'],
  ['svg', 'SVG', '#d46b08', 'SVG — векторный', 'масштабируется без потери качества'], ['dxf', 'DXF', '#1c2d58', 'DXF для AutoCAD', 'стены, помещения, проёмы по слоям, 1 ед. = 1 м'],
  ['xlsx', 'XLSX', '#237804', 'Экспликация в Excel', 'все помещения объекта: площади, договоры, арендаторы']];
function opRender() {
  const root = opRoot(); if (!root) return;
  op3dDispose();
  const plan = opPlan(), o = op.objs.find(function(x) { return x.id === op.objId; });
  const can = opCanEdit(), ed = can && op.edit, ps = op.plans.filter(function(p) { return p.object_id === op.objId; });
  if (!op.edit) op.tool = 'sel';
  const q = (op.q || '').trim().toLowerCase();
  const objList = op.objs.filter(function(x) { return !q || String(x.name).toLowerCase().indexOf(q) !== -1; }).map(function(x) {
    const rs = op.rooms.filter(function(r) { return r.object_id === x.id; });
    return '<div class="op-obj' + (x.id === op.objId ? ' on' : '') + '" data-obj="' + x.id + '"><span>' + opEsc(x.name) + '</span><small>' + (rs.length ? rs.length + ' пом.' : '—') + '</small></div>';
  }).join('');
  const tabs = ps.length ? '<div class="op-seg">' + ps.map(function(p) { return '<button class="' + (p.id === op.planId ? 'on' : '') + '" data-plan="' + p.id + '">' + opEsc(p.title || 'План') + '</button>'; }).join('') + '</div>' : '';
  const legend = ['rented', 'free', 'tech', 'common'].map(function(s) { return '<span><i style="background:' + OP_COLORS[s][0] + ';border-color:' + OP_COLORS[s][1] + '"></i>' + opStateTitle(s) + '</span>'; }).join('');
  const B = function(act, ico, label, extra) { return '<button class="op-btn" data-act="' + act + '"' + (extra || '') + '>' + opIco(ico) + label + '</button>'; };
  const ribbon = ed && plan ? '<div class="op-ribbon op-card">'
    + '<div class="op-grp"><div class="op-cap">Правка</div><div class="op-grp-b">' + B('undo', 'undo', 'Отменить', ' title="Ctrl+Z"' + (op.undo.length ? '' : ' disabled')) + B('sel-del', 'trash', 'Удалить', ' title="Delete — удалить выбранное"' + (op.sel || op.selItem ? '' : ' disabled')) + '</div></div>'
    + '<div class="op-grp"><div class="op-cap">Помещения</div><div class="op-grp-b">' + B('room-add', 'roomadd', 'Добавить', ' title="Прямоугольник 6 × 6 м в центре экрана"') + B('renum', 'hash', 'Перенумеровать') + '</div></div>'
    + '<div class="op-grp"><div class="op-cap">Этажи</div><div class="op-grp-b">' + B('plan-add', 'layers', 'Новый этаж', ' title="Этаж, подвал, корпус, площадка"') + B('plan-set', 'gear', 'Настройки и подложка')
      + '<button class="op-btn' + (op.ghost ? ' on' : '') + '" data-act="ghost" title="Стены и лестницы этажа ниже — серым под чертежом">' + opIco('stair') + 'Этаж ниже под планом</button></div></div>'
    + '<div class="op-grp"><div class="op-cap">Подложка</div><div class="op-grp-b">' + B('plan-set', 'image', plan.bg_url ? 'Заменить' : 'Загрузить чертёж', ' title="Скан или фото поэтажного плана"')
      + (plan.bg_url ? '<button class="op-btn' + (op.tool === 'calib' ? ' on' : '') + '" data-tool="calib" title="Две точки на чертеже и расстояние между ними">' + opIco('calib') + 'Масштаб по размеру</button>'
        + '<button class="op-btn' + (op.tool === 'bgmove' ? ' on' : '') + '" data-tool="bgmove" title="Совместить подложку с чертежом">' + opIco('bgmove') + 'Сдвинуть</button>' : '') + '</div></div>'
    + '</div>' : '';
  const palette = ed && plan ? '<div class="op-float op-palette">' + OP_TOOLS.map(function(t, i) {
    return (i === 1 || i === 4 || i === 9 ? '<i></i>' : '') + '<button class="op-tb' + (op.tool === t[0] ? ' on' : '') + '" data-tool="' + t[0] + '" data-tip="' + t[1] + ' · ' + t[2] + '">' + opIco(t[0]) + '</button>';
  }).join('') + '</div>' : '';
  const tname = ed ? opToolName(op.tool) : 'Просмотр';
  const menu = '<div class="op-float op-menu">' + OP_FMT.map(function(f) { return '<button data-act="exp" data-fmt="' + f[0] + '"><span class="op-fmt" style="background:' + f[2] + '">' + f[1] + '</span><span><b>' + f[3] + '</b><small>' + f[4] + '</small></span></button>'; }).join('') + '</div>';
  root.innerHTML = '<div class="op-wrap">'
    + '<div class="op-objs op-card"><div class="op-cap">Объекты</div><input class="op-search" data-q placeholder="Найти объект" value="' + opEsc(op.q || '') + '">' + objList + '</div>'
    + '<div class="op-main">'
    + '<div class="op-head"><div class="op-title">' + opEsc(o ? o.name : 'Объекты') + '<small>Планы и помещения</small></div>' + tabs + '<span class="op-grow"></span>'
    + (plan ? '<div class="op-seg"><button data-act="mode-view" class="' + (op.edit || op.v3 ? '' : 'on') + '">' + opIco('eye') + 'Просмотр</button><button data-act="mode-3d" class="' + (op.v3 ? 'on' : '') + '">' + opIco('cube') + '3D</button>'
      + (can ? '<button data-act="mode-edit" class="' + (op.edit ? 'on' : '') + '">' + opIco('edit') + 'Редактирование</button>' : '') + '</div>' : '')
    + (plan ? '<div class="op-menu-w"><button class="op-btn" data-act="exp-toggle">' + opIco('download') + 'Экспорт</button>' + menu + '</div>' : '')
    + '</div>'
    + (plan && plan.schematic ? '<div class="op-warn"><b>Схема, не по чертежу.</b> Площади помещений — из договоров, расположение и форма — условные. Загрузите чертёж подложкой («Настройки и подложка») и обведите помещения по нему.</div>' : '')
    + ribbon
    + (plan && op.v3 ? '<div class="op-stage"><div class="op-3d"><div class="op-3d-msg">Загружаю 3D…</div></div>' + op3dBar(can) + '<div class="op-float op-legend">' + legend + '</div></div>'
      + '<div class="op-status"><span class="op-pill">' + opIco('cube') + '3D</span><span data-st="hint">Левая кнопка — вращать, правая (или Shift) — двигать, колесо — ближе / дальше. Клик по полу помещения — подробности. Правка — в «Редактировании», 3D строится по чертежу.</span></div>'
      + '<div class="op-tbl op-card">' + opTableHtml() + '</div>'
      : plan ? '<div class="op-stage' + (op.edit ? ' edit' : '') + '"><div class="op-canvas' + (op.edit ? ' edit' : '') + (op.edit && op.tool !== 'sel' ? ' tool' : '') + '" tabindex="0"><svg xmlns="http://www.w3.org/2000/svg"></svg></div>'
      + palette
      + '<div class="op-float op-zoom"><button class="op-tb" data-act="zout" data-tip="Мельче">' + opIco('minus') + '</button><span data-st="zoom">100%</span><button class="op-tb" data-act="zin" data-tip="Крупнее">' + opIco('plus') + '</button><button class="op-tb" data-act="zfit" data-tip="Весь план">' + opIco('fit') + '</button></div>'
      + '<div class="op-float op-legend">' + legend + '</div></div>'
      + '<div class="op-status"><span class="op-pill">' + (ed ? opIco(op.tool) : opIco('eye')) + opEsc(tname) + '</span><span data-st="hint">'
      + (ed ? OP_HINTS[op.tool] + ' Правая кнопка — двигать план, колесо — масштаб. Всё сохраняется сразу.' : 'Клик по помещению — подробности. Тащите пустое место — двигать план, колесо — масштаб.')
      + '</span><span class="op-xy" data-st="xy"></span></div>'
      + '<div class="op-tbl op-card">' + opTableHtml() + '</div>'
      : '<div class="op-warn">У объекта пока нет плана.' + (can ? ' Включите «Редактирование» и нажмите «Новый план».' + (op.edit ? ' <button class="op-btn" data-act="plan-add">' + opIco('layers') + 'Новый план</button>' : '') : '') + '</div>')
    + '</div>'
    + '<div class="op-side op-card">' + opSideOut() + '</div>'
    + '</div>';
  if (plan && op.v3) op3dMount(); else if (plan) { opDraw(); opBindCanvas(); }
}
// инспектор: заголовок отдельной полосой, содержимое — с отступами
function opSideOut() { const h = opSideHtml(), i = h.indexOf('</h4>'); return i < 0 ? '<div class="op-sb">' + h + '</div>' : h.slice(0, i + 5) + '<div class="op-sb">' + h.slice(i + 5) + '</div>'; }
function opStatus() {
  const z = opRoot().querySelector('[data-st="zoom"]'), p = opPlan(); if (!z || !p || !op.view) return;
  z.textContent = Math.round((op.fitW || op.view.w) / op.view.w * 100) + '%';
}
function opFit() {
  const p = opPlan(); if (!p) return;
  const W = Number(p.width_m) || 60, H = Number(p.height_m) || 40, svg = opSvg(), b = svg ? svg.getBoundingClientRect() : null;
  if (!b || !b.width || !b.height) { const pad = Math.max(W, H) * 0.04; op.view = { x: -pad, y: -pad, w: W + 2 * pad, h: H + 2 * pad }; op.fitW = op.view.w; return; }
  // поля под палитру инструментов (слева), масштаб (сверху) и легенду (снизу), план — по центру остального
  const L = op.edit ? 70 : 34, R = 30, T = 56, B = 52, aw = Math.max(50, b.width - L - R), ah = Math.max(50, b.height - T - B), k = Math.max(W / aw, H / ah);
  op.view = { x: -L * k - (aw * k - W) / 2, y: -T * k - (ah * k - H) / 2, w: b.width * k, h: b.height * k }; op.fitW = op.view.w;
}
function opSvg() { const c = opRoot().querySelector('.op-canvas svg'); return c; }
function opLenLbl(a, b, px, txt) {
  const L = opDist(a, b); if (L < 1e-3 && !txt) return '';
  return '<text x="' + (a.x + b.x) / 2 + '" y="' + ((a.y + b.y) / 2 - 8 * px) + '" font-size="' + 12 * px + '" font-weight="700" fill="#1c2d58" text-anchor="middle" stroke="#fff" stroke-width="' + 3 * px + '" paint-order="stroke">'
    + opEsc(txt || opM(opR(L)) + ' м') + '</text>';
}
// стены — многоугольники со стыками «на ус»: в узле, где сходятся концы стен, грани продлеваются до пересечения с гранями соседей
// (по кругу: левая грань стены встречает правую грань следующей по углу); в узле из 3+ стен — серединка-заплатка; свободный конец — торец.
// Конец стены, упёртый в середину другой (Т-примыкание), — торец по оси: его закрывает заливка толстой стены.
function opWallPolys(walls) {
  const key = function(x, y) { return Math.round(x * 1000) + ',' + Math.round(y * 1000); }, nodes = {}, ends = {};
  walls.forEach(function(w) {
    const L = opWallLen(w); if (L < 1e-6) return;
    const h = Math.max(0.03, Number(w.t) || 0.2) / 2, t0 = opWallAt(w, 0).a * Math.PI / 180, t1 = opWallAt(w, opWallArcLen(w)).a * Math.PI / 180;
    [[1, w.x1, w.y1, Math.cos(t0), Math.sin(t0)], [2, w.x2, w.y2, -Math.cos(t1), -Math.sin(t1)]].forEach(function(q) {
      const e = { w: w, s: q[0], x: q[1], y: q[2], dx: q[3], dy: q[4], h: h, ang: Math.atan2(q[4], q[3]) }, k = key(q[1], q[2]);
      (nodes[k] = nodes[k] || []).push(e); ends[w.id + ':' + q[0]] = e;
    });
  });
  // грань: точка P + n·side·h, n — нормаль (-dy, dx) к направлению «от узла»
  const corner = function(a, sa, b, sb) {
    const ax = a.x - a.dy * sa * a.h, ay = a.y + a.dx * sa * a.h, bx = b.x - b.dy * sb * b.h, by = b.y + b.dx * sb * b.h;
    const cr = a.dx * b.dy - a.dy * b.dx; if (Math.abs(cr) < 1e-6) return [ax, ay];
    const k = ((bx - ax) * b.dy - (by - ay) * b.dx) / cr;
    return Math.abs(k) > 6 * Math.max(a.h, b.h) ? [ax, ay] : [ax + a.dx * k, ay + a.dy * k];   // слишком острый угол — без уса
  };
  const hubs = [];
  Object.keys(nodes).forEach(function(k) {
    const es = nodes[k];
    es.forEach(function(e) {
      if (es.length < 2) { e.p = [e.x - e.dy * e.h, e.y + e.dx * e.h]; e.m = [e.x + e.dy * e.h, e.y - e.dx * e.h]; return; }
      let nx = null, pv = null, dn = 9, dp = 9;
      es.forEach(function(f) {
        if (f === e) return;
        const a = ((f.ang - e.ang) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI); if (a < 1e-6) return;
        if (a < dn) { dn = a; nx = f; } if (2 * Math.PI - a < dp) { dp = 2 * Math.PI - a; pv = f; }
      });
      e.p = nx ? corner(e, 1, nx, -1) : [e.x - e.dy * e.h, e.y + e.dx * e.h];
      e.m = pv ? corner(e, -1, pv, 1) : [e.x + e.dy * e.h, e.y - e.dx * e.h];
    });
    if (es.length >= 3) {
      const pts = []; es.forEach(function(e) { pts.push(e.p, e.m); });
      const c = es[0]; pts.sort(function(a, b) { return Math.atan2(a[1] - c.y, a[0] - c.x) - Math.atan2(b[1] - c.y, b[0] - c.x); });
      hubs.push({ pts: pts, w: es.reduce(function(m, e) { return Number(e.w.t) > Number(m.t) ? e.w : m; }, es[0].w) });
    }
  });
  const polys = [];
  walls.forEach(function(w) {
    const a = ends[w.id + ':1'], b = ends[w.id + ':2']; if (!a || !b) return;
    const L = [a.p], R = [a.m];
    if (opArc(w)) {   // дуга — промежуточные точки граней по 24 отрезкам
      const La = opWallArcLen(w);
      for (let i = 1; i < 24; i++) { const q = opWallAt(w, La * i / 24), g = q.a * Math.PI / 180; L.push([q.x - Math.sin(g) * a.h, q.y + Math.cos(g) * a.h]); R.push([q.x + Math.sin(g) * a.h, q.y - Math.cos(g) * a.h]); }
    }
    L.push(b.m); R.push(b.p);
    polys.push({ w: w, pts: L.concat(R.reverse()) });
  });
  return { polys: polys, hubs: hubs };
}
// два прохода: контуры всех стен (чёрная линия по граням), затем заливки от тонких к толстым — общие грани и стыки закрываются, шва нет.
// Одна заливка — один path на тип: соседние многоугольники в одном path сглаживаются без светлой «волосинки» на стыке.
function opWallsSvg(walls, px, sid) {
  const G = opWallPolys(walls), D = function(pts) { return 'M' + pts.map(function(q) { return opR3(q[0]) + ' ' + opR3(q[1]); }).join('L') + 'Z'; }, lw = 1.3 * px;
  const fill = { part: '', bear: '', ext: '' };
  let o = '', h = '', sel = '';
  G.polys.forEach(function(q) {
    o += D(q.pts); fill[opWT(q.w)] += D(q.pts);
    if (q.w.id === sid) sel = '<path d="' + D(q.pts) + '" fill="#ffccc7" stroke="#cf1322" stroke-width="' + 2 * px + '" stroke-linejoin="miter"/>';
    h += '<path class="op-it" data-it="' + q.w.id + '" d="' + opWallD(q.w) + '" fill="none" stroke="transparent" stroke-width="' + Math.max(Number(q.w.t) || 0.2, 12 * px) + '"/>';
  });
  G.hubs.forEach(function(q) { fill[opWT(q.w)] += D(q.pts); });
  if (!o) return '';
  let s = '<path d="' + o + '" fill="#141414" stroke="#141414" stroke-width="' + 2 * lw + '" stroke-linejoin="round"/>';   // round: у острых вершин «уса» миттер дал бы шип наружу
  ['part', 'bear', 'ext'].forEach(function(k) { if (fill[k]) s += '<path d="' + fill[k] + '" fill="' + OP_WT[k][2] + '" stroke="' + OP_WT[k][2] + '" stroke-width="' + 0.4 * px + '"/>'; });
  return s + sel + h;
}
function opR3(n) { return Math.round(n * 1000) / 1000; }
function opColSvg(it, px, sel, ghost) {
  const s = Math.max(0.1, Number(it.s) || 0.4), col = sel ? '#cf1322' : '#141414', a = ghost ? ' opacity="0.55"' : ' class="op-it" data-it="' + it.id + '"';
  const fill = sel ? '#ff7875' : '#595959', sw = 1.3 * px;
  return it.sh === 'round' ? '<circle' + a + ' cx="' + it.x + '" cy="' + it.y + '" r="' + s / 2 + '" fill="' + fill + '" stroke="' + col + '" stroke-width="' + sw + '"/>'
    : '<rect' + a + ' x="' + (it.x - s / 2) + '" y="' + (it.y - s / 2) + '" width="' + s + '" height="' + s + '" fill="' + fill + '" stroke="' + col + '" stroke-width="' + sw + '"/>';
}
function opOpenSvg(it, px, ghost, sel) {
  const G = opOpG(it), w = Number(it.w) || 0.9, hw = w / 2, t = Math.max(0.05, G.t), col = sel ? '#cf1322' : '#262626', sw = 1.4 * px;
  let s = '<g transform="translate(' + G.x + ' ' + G.y + ') rotate(' + G.a + ')"' + (ghost ? ' opacity="0.55"' : ' class="op-it" data-it="' + it.id + '"') + '>';
  s += '<rect x="' + -hw + '" y="' + (-t / 2 - 2 * px) + '" width="' + w + '" height="' + (t + 4 * px) + '" fill="#fff"/>';   // проём «вырезает» стену
  const jambs = '<path d="M' + -hw + ' ' + -t / 2 + 'V' + t / 2 + 'M' + hw + ' ' + -t / 2 + 'V' + t / 2 + '" stroke="' + col + '" stroke-width="' + 2 * sw + '"/>';
  if (it.k === 'door') {
    // полотно (линия) и траектория (дуга) по ГОСТ 21.201; двупольная — два полотна по половине; проём — только откосы
    const f = it.flip || 0, sd = (f & 2) ? -1 : 1, y0 = sd * t / 2, dt = OP_DT[it.dt] ? it.dt : 'one';
    const leaf = function(hx, lw) {
      const ex = hx + (hx < 0 ? lw : -lw), sweep = sd * (ex - hx) > 0 ? 0 : 1;
      return '<path d="M' + hx + ' ' + y0 + 'V' + (y0 + sd * lw) + '" stroke="' + col + '" stroke-width="' + 2 * sw + '"/>'
        + '<path d="M' + hx + ' ' + (y0 + sd * lw) + 'A' + lw + ' ' + lw + ' 0 0 ' + sweep + ' ' + ex + ' ' + y0 + '" fill="none" stroke="' + col + '" stroke-width="' + sw * 0.8 + '"/>';
    };
    s += jambs + (dt === 'two' ? leaf(-hw, hw) + leaf(hw, hw) : dt === 'one' ? leaf((f & 1) ? hw : -hw, w) : '');
  } else if (it.k === 'window') {
    // окно в разрезе стены — три линии: две грани проёма и стекло посередине
    s += '<rect x="' + -hw + '" y="' + -t / 2 + '" width="' + w + '" height="' + t + '" fill="#fff" stroke="' + col + '" stroke-width="' + sw + '"/>'
      + '<path d="M' + -hw + ' 0H' + hw + '" stroke="' + col + '" stroke-width="' + sw + '"/>';
  } else {
    s += jambs + '<path d="M' + -hw + ' 0H' + hw + '" stroke="' + col + '" stroke-width="' + 2.5 * sw + '" stroke-dasharray="' + 7 * px + ' ' + 4 * px + '"/>';
  }
  if (!ghost) s += '<rect x="' + -hw + '" y="' + -Math.max(t / 2, 7 * px) + '" width="' + w + '" height="' + Math.max(t, 14 * px) + '" fill="transparent"/>';
  return s + '</g>';
}
function opDimSvg(it, px, col, hit) {
  const dx = it.x2 - it.x1, dy = it.y2 - it.y1, L = Math.hypot(dx, dy); if (L < 1e-6) return '';
  const off = it.off === undefined || it.off === null ? -0.8 : Number(it.off), nx = -dy / L, ny = dx / L;
  const a1 = [it.x1 + nx * off, it.y1 + ny * off], a2 = [it.x2 + nx * off, it.y2 + ny * off], tk = 5 * px, ux = dx / L, uy = dy / L, ex = Math.sign(off || 1) * 0.15;
  let ang = Math.atan2(dy, dx) * 180 / Math.PI; if (ang > 90 || ang <= -90) ang += 180;
  const mx = (a1[0] + a2[0]) / 2, my = (a1[1] + a2[1]) / 2;
  let d = 'M' + it.x1 + ' ' + it.y1 + 'L' + (a1[0] + nx * ex) + ' ' + (a1[1] + ny * ex) + 'M' + it.x2 + ' ' + it.y2 + 'L' + (a2[0] + nx * ex) + ' ' + (a2[1] + ny * ex)
    + 'M' + a1[0] + ' ' + a1[1] + 'L' + a2[0] + ' ' + a2[1];
  [a1, a2].forEach(function(q) { d += 'M' + (q[0] - (ux + nx) * tk) + ' ' + (q[1] - (uy + ny) * tk) + 'L' + (q[0] + (ux + nx) * tk) + ' ' + (q[1] + (uy + ny) * tk); });
  return '<g' + (hit ? ' class="op-it" data-it="' + it.id + '"' : '') + '><path d="' + d + '" stroke="' + col + '" stroke-width="' + 1.2 * px + '" fill="none"/>'
    + (hit ? '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + a2[0] + '" y2="' + a2[1] + '" stroke="transparent" stroke-width="' + 12 * px + '"/>' : '')
    + '<text transform="translate(' + mx + ' ' + my + ') rotate(' + ang + ')" y="' + -4 * px + '" font-size="' + 12 * px + '" fill="' + col + '" text-anchor="middle" stroke="#fff" stroke-width="' + 3 * px + '" paint-order="stroke">' + opM(opR(L)) + ' м</text></g>';
}
function opTextSvg(it, px, sel) {
  const s = Math.max(0.1, Number(it.s) || 1), txt = String(it.text || ''), w = Math.max(1, txt.length) * s * 0.6;
  return '<g class="op-it" data-it="' + it.id + '"><rect x="' + (it.x - w / 2) + '" y="' + (it.y - s) + '" width="' + w + '" height="' + s * 1.3 + '" fill="transparent"' + (sel ? ' stroke="#cf1322" stroke-width="' + px + '" stroke-dasharray="' + 3 * px + '"' : '') + '/>'
    + '<text x="' + it.x + '" y="' + it.y + '" font-size="' + s + '" font-weight="600" fill="' + (sel ? '#cf1322' : '#262626') + '" text-anchor="middle" stroke="#fff" stroke-width="' + 3 * px + '" paint-order="stroke">' + opEsc(txt) + '</text></g>';
}
// лестница: центр x, y; a — направление подъёма, °; l — длина марша, w — ширина, n — ступеней; to — этаж (план), куда ведёт
function opStairSvg(it, px, sel, ghost) {
  const l = Math.max(0.3, Number(it.l) || 3), w = Math.max(0.3, Number(it.w) || 1.2), n = Math.max(2, Math.round(Number(it.n) || 10)), col = ghost ? '#8c8c8c' : sel ? '#cf1322' : '#262626', sw = 1.3 * px;
  const to = it.to ? op.plans.find(function(p) { return p.id === it.to; }) : null, x0 = -l / 2, st = l / n, ah = Math.min(w * 0.32, 0.4, l * 0.3);
  let d = ''; for (let i = 1; i < n; i++) d += 'M' + (x0 + st * i) + ' ' + -w / 2 + 'V' + w / 2;
  let s = '<g transform="translate(' + it.x + ' ' + it.y + ') rotate(' + (Number(it.a) || 0) + ')"' + (ghost ? ' opacity="0.6"' : ' class="op-it op-stair" data-it="' + it.id + '"' + (to ? ' data-go="' + to.id + '"' : '')) + '>'
    + '<rect x="' + x0 + '" y="' + -w / 2 + '" width="' + l + '" height="' + w + '" fill="#fff" stroke="' + col + '" stroke-width="' + 2 * sw + '"/>'
    + '<path d="' + d + '" stroke="' + col + '" stroke-width="' + sw * 0.9 + '"/>'
    + '<path d="M' + (x0 + st / 2) + ' 0H' + (l / 2 - ah * 0.5) + '" stroke="' + col + '" stroke-width="' + 1.6 * px + '"/>'
    + '<path d="M' + (l / 2 - ah) + ' ' + -ah * 0.6 + 'L' + l / 2 + ' 0L' + (l / 2 - ah) + ' ' + ah * 0.6 + 'Z" fill="' + col + '"/>'
    + '<circle cx="' + (x0 + st / 2) + '" cy="0" r="' + Math.min(st / 3, 3 * px) + '" fill="' + col + '"/>'
    + (ghost ? '' : '<rect x="' + x0 + '" y="' + -w / 2 + '" width="' + l + '" height="' + w + '" fill="transparent"/>') + '</g>';
  if (to && !ghost) {
    const a = (Number(it.a) || 0) * Math.PI / 180, hh = Math.abs(Math.sin(a)) * l / 2 + Math.abs(Math.cos(a)) * w / 2;
    s += '<text x="' + it.x + '" y="' + (it.y + hh + 13 * px) + '" font-size="' + 11.5 * px + '" font-weight="700" fill="#1c2d58" text-anchor="middle" stroke="#fff" stroke-width="' + 3 * px + '" paint-order="stroke">⇅ ' + opEsc(to.title || 'этаж') + '</text>';
  }
  return s;
}
function opStairFromDrag(p0, p1) {
  const dx = p1.x - p0.x, dy = p1.y - p0.y, hor = Math.abs(dx) >= Math.abs(dy), l = hor ? Math.abs(dx) : Math.abs(dy), w = hor ? Math.abs(dy) : Math.abs(dx);
  if (l < 0.6 || w < 0.5) return null;
  return { k: 'stair', x: opR((p0.x + p1.x) / 2), y: opR((p0.y + p1.y) / 2), a: hor ? (dx >= 0 ? 0 : 180) : (dy >= 0 ? 90 : 270), l: opR(l), w: opR(w), n: Math.max(3, Math.round(l / 0.3)) };
}
function opObjPlans() { return op.plans.filter(function(x) { return x.object_id === op.objId; }); }
function opSortPlans() { op.plans.sort(function(a, b) { return (a.object_id - b.object_id) || ((Number(a.sort) || 0) - (Number(b.sort) || 0)) || (a.id - b.id); }); }
function opLowerPlan(p) { const ps = op.plans.filter(function(x) { return x.object_id === p.object_id; }), i = ps.indexOf(p); return i > 0 ? ps[i - 1] : null; }
// этаж ниже — серым под чертежом: по нему выравнивают стены и лестницы
function opGhostSvg(lp, px) {
  let g = '<g pointer-events="none" opacity="0.45">';
  op.rooms.filter(function(r) { return r.plan_id === lp.id; }).forEach(function(r) { g += '<path d="' + opPathD(opRoomPts(r)) + '" fill="none" stroke="#8c8c8c" stroke-width="' + 1.2 * px + '" stroke-dasharray="' + 5 * px + ' ' + 4 * px + '"/>'; });
  opDw(lp).items.forEach(function(it) {
    if (it.k === 'wall') g += '<path d="' + opWallD(it) + '" fill="none" stroke="#8c8c8c" stroke-width="' + Math.max(0.03, Number(it.t) || 0.2) + '" stroke-linecap="square"/>';
    if (it.k === 'col') g += opColSvg(it, px, false, true);
    if (it.k === 'stair') g += opStairSvg(it, px, false, true);
  });
  return g + '</g>';
}
function opHandle(x, y, h, px, cls) {
  const hs = 9 * px;
  if (cls === 'm') return '<circle class="op-h m" data-h="' + h + '" cx="' + x + '" cy="' + y + '" r="' + 5 * px + '" fill="#fff" stroke="#1c2d58" stroke-width="' + 1.5 * px + '"/>';
  return '<rect class="op-h' + (cls ? ' ' + cls : '') + '" data-h="' + h + '" x="' + (x - hs / 2) + '" y="' + (y - hs / 2) + '" width="' + hs + '" height="' + hs + '" fill="#fff" stroke="#cf1322" stroke-width="' + 1.5 * px + '"'
    + (h === 'ne' || h === 'sw' ? ' style="cursor:nesw-resize"' : '') + '/>';
}
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
  svg.innerHTML = opBuild(p, op.vb.px, null);
  opStatus();
}
// содержимое чертежа в метрах; px — метров на пиксель (толщины линий, подписи); exp — выгрузка: без выделения, ручек и мелкой сетки, exp.bg — подложка data:URL
function opBuild(p, px, exp) {
  const W = Number(p.width_m) || 60, H = Number(p.height_m) || 40, fs = 12.5 * px, ed = op.edit && !exp, sel0 = op.tool === 'sel', sid = exp ? null : op.selItem;
  let g = '';
  // сетка: 1 м (если не мельче 6 пикселей) и 10 м
  const grid = function(step, color, sw) {
    let s = '';
    for (let x = 0; x <= W + 1e-6; x += step) s += 'M' + x + ' 0V' + H;
    for (let y = 0; y <= H + 1e-6; y += step) s += 'M0 ' + y + 'H' + W;
    return '<path d="' + s + '" stroke="' + color + '" stroke-width="' + sw * px + '" fill="none"/>';
  };
  g += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>';
  const bgr = opBgRect(p);
  if (p.bg_url && (!exp || exp.bg)) g += '<image href="' + opEsc(exp ? exp.bg : p.bg_url) + '" x="' + bgr.x + '" y="' + bgr.y + '" width="' + bgr.w + '" height="' + bgr.h + '" preserveAspectRatio="none" opacity="' + (p.bg_opacity === null || p.bg_opacity === undefined ? 0.6 : p.bg_opacity) + '"/>';
  if (!exp && 1 / px >= 6) g += grid(1, '#eef1f6', 1);
  g += grid(10, '#d6dce8', 1);
  g += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="none" stroke="#9aa3b5" stroke-width="' + 1.5 * px + '"/>';
  // линейка: подписи каждые 10 м
  for (let x = 0; x <= W + 1e-6; x += 10) g += '<text x="' + x + '" y="' + (-4 * px) + '" font-size="' + 10 * px + '" fill="#8c8c8c" text-anchor="middle">' + x + '</text>';
  for (let y = 10; y <= H + 1e-6; y += 10) g += '<text x="' + (-4 * px) + '" y="' + (y + 3 * px) + '" font-size="' + 10 * px + '" fill="#8c8c8c" text-anchor="end">' + y + '</text>';
  const rooms = opPlanRooms(), items = opItems();
  // 1) заливка помещений
  rooms.forEach(function(r) {
    const c = OP_COLORS[opState(r)], sel = !exp && r.id === op.sel;
    g += '<path class="op-room" data-room="' + r.id + '" d="' + opPathD(opRoomPts(r)) + '" fill="' + c[0] + '" fill-opacity="' + (p.bg_url ? 0.75 : 1) + '" stroke="' + (sel ? '#cf1322' : c[1]) + '" stroke-width="' + (sel ? 3 : 1.3) * px + '" stroke-linejoin="round"/>';
  });
  // 2) стены, проёмы, размеры, подписи
  if (!exp && op.ghost) { const lp = opLowerPlan(p); if (lp) g += opGhostSvg(lp, px); }
  g += opWallsSvg(items.filter(function(it) { return it.k === 'wall'; }), px, sid);
  items.forEach(function(it) { if (it.k === 'col') g += opColSvg(it, px, it.id === sid, false); });
  items.forEach(function(it) { if (OP_OPEN[it.k]) g += opOpenSvg(it, px, false, it.id === sid); });
  items.forEach(function(it) { if (it.k === 'stair') g += opStairSvg(it, px, it.id === sid, false); });
  items.forEach(function(it) { if (it.k === 'dim') g += opDimSvg(it, px, it.id === sid ? '#cf1322' : '#1c2d58', true); });
  // 3) подписи помещений — только если влезают
  rooms.forEach(function(r) {
    const pts = opRoomPts(r), bb = opBBox(pts), w = bb.w, h = bb.h, c = opIsPoly(r) ? opCentroid(pts) : [bb.x + w / 2, bb.y + h / 2];
    const code = String(r.code || ''), cx = c[0];
    const fit = function(txt, f) { return txt.length * f * 0.68 < w - 4 * px; };
    let lines = [];
    if (fit(code, fs * 1.15) && h > fs * 1.6) lines.push(['<tspan font-weight="700">' + opEsc(code) + '</tspan>', fs * 1.15]);
    if (lines.length && h > fs * 3.1 && r.area_sqm && fit(opArea(r.area_sqm), fs)) lines.push([opEsc(opArea(r.area_sqm)), fs]);
    if (lines.length === 2 && h > fs * 4.6 && r.title) {
      let t = String(r.title); const max = Math.floor((w - 6 * px) / (fs * 0.92 * 0.68));
      if (max >= 4) { if (t.length > max) t = t.slice(0, max - 1) + '…'; lines.push([opEsc(t), fs * 0.92]); }
    }
    const tot = lines.reduce(function(a, l) { return a + l[1] * 1.25; }, 0);
    let ty = c[1] - tot / 2;
    lines.forEach(function(l, i) {
      // номер / площадь — дробью, как в экспликации БТИ
      if (i === 1) { const hw = Math.max(code.length * fs * 1.15, opArea(r.area_sqm).length * fs) * 0.34; g += '<path d="M' + (cx - hw) + ' ' + (ty + l[1] * 0.02) + 'H' + (cx + hw) + '" stroke="#1f1f1f" stroke-width="' + px + '"/>'; }
      ty += l[1] * 1.25; g += '<text x="' + cx + '" y="' + (ty - l[1] * 0.3) + '" font-size="' + l[1] + '" fill="#1f1f1f" text-anchor="middle">' + l[0] + '</text>';
    });
  });
  items.forEach(function(it) { if (it.k === 'text') g += opTextSvg(it, px, it.id === sid); });
  // 4) выбранное: длины сторон и ручки
  const sr = opRoom(op.sel);
  if (ed && sr && sr.plan_id === op.planId) {
    const pts = opRoomPts(sr), n = pts.length, poly = opIsPoly(sr);
    for (let i = 0; i < n; i++) {
      const a = { x: pts[i][0], y: pts[i][1] }, b = { x: pts[(i + 1) % n][0], y: pts[(i + 1) % n][1] };
      if (opDist(a, b) / px > 46) g += opLenLbl(a, b, px).replace('#1c2d58', '#cf1322');
    }
    if (sel0) {
      if (poly) {
        pts.forEach(function(q, i) { const b = pts[(i + 1) % n]; if (Math.hypot(b[0] - q[0], b[1] - q[1]) / px > 30) g += opHandle((q[0] + b[0]) / 2, (q[1] + b[1]) / 2, 'm' + i, px, 'm'); });
        pts.forEach(function(q, i) { g += opHandle(q[0], q[1], 'v' + i, px, 'v'); });
      } else {
        const x = Number(sr.x) || 0, y = Number(sr.y) || 0, w = Number(sr.w) || 1, h = Number(sr.h) || 1;
        [[x, y, 'nw'], [x + w, y, 'ne'], [x, y + h, 'sw'], [x + w, y + h, 'se']].forEach(function(q) { g += opHandle(q[0], q[1], q[2], px); });
      }
    }
  }
  const si = opItem(op.selItem);
  if (ed && sel0 && si && (si.k === 'wall' || si.k === 'dim')) {
    g += opLenLbl({ x: si.x1, y: si.y1 }, { x: si.x2, y: si.y2 }, px).replace('#1c2d58', '#cf1322');
    g += opHandle(si.x1, si.y1, 'p1', px, 'v') + opHandle(si.x2, si.y2, 'p2', px, 'v');
    if (si.k === 'wall' && opWallLen(si) / px > 40) { const A = opArc(si); g += opHandle(A ? A.ax : (si.x1 + si.x2) / 2, A ? A.ay : (si.y1 + si.y2) / 2, 'bm', px, 'm').replace('class="op-h m"', 'class="op-h m" style="cursor:move"'); }
  }
  const hv = op.hover;
  // масштаб подложки: отмеченные точки
  if (ed && op.tool === 'calib' && op.cal.length) {
    const a = op.cal[0], b = op.cal[1] || hv;
    if (b) g += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#cf1322" stroke-width="' + 2 * px + '"/>' + opLenLbl(a, b, px, 'на подложке ' + opM(opR(opDist(a, b))) + ' м').replace('#1c2d58', '#cf1322');
    op.cal.forEach(function(q) { g += '<path d="M' + (q.x - 8 * px) + ' ' + q.y + 'H' + (q.x + 8 * px) + 'M' + q.x + ' ' + (q.y - 8 * px) + 'V' + (q.y + 8 * px) + '" stroke="#cf1322" stroke-width="' + 1.6 * px + '"/>'; });
  }
  // 5) рисуемое сейчас
  if (ed && !sel0 && hv && op.tool === 'col') g += opColSvg({ x: hv.x, y: hv.y, s: op.def.col, sh: op.def.colsh }, px, false, true);
  if (ed && !sel0 && hv && op.tool !== 'calib' && op.tool !== 'bgmove') {
    const t = op.tool, from = opToolFrom(), typed = op.typed ? op.typed.replace('.', ',') + ' м ⏎' : '';
    if (t === 'wall' && from) g += '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + hv.x + '" y2="' + hv.y + '" stroke="#1c2d58" stroke-opacity="0.55" stroke-width="' + op.def.wall + '" stroke-linecap="square"/>' + opLenLbl(from, hv, px, typed);
    if (t === 'room' && op.chain.length) {
      const pts = op.chain.map(function(q) { return q.x + ' ' + q.y; }).concat([hv.x + ' ' + hv.y]);
      g += '<path d="M' + pts.join('L') + '" fill="#dbe4ff" fill-opacity="0.5" stroke="#1c2d58" stroke-width="' + 2 * px + '" stroke-dasharray="' + 6 * px + ' ' + 4 * px + '"/>'
        + '<circle cx="' + op.chain[0].x + '" cy="' + op.chain[0].y + '" r="' + 6 * px + '" fill="#fff" stroke="#1c2d58" stroke-width="' + 2 * px + '"/>' + opLenLbl(from, hv, px, typed);
    }
    if (t === 'stair' && op.drag && op.drag.kind === 'rect') {
      const st = opStairFromDrag(op.drag.p0, hv);
      if (st) g += opStairSvg(st, px, false, true) + opLenLbl({ x: st.x - 1, y: st.y }, { x: st.x + 1, y: st.y }, px, 'марш ' + opM(st.l) + ' м × ' + opM(st.w) + ' м · ' + st.n + ' ступ.');
    }
    if (t === 'rect' && op.drag && op.drag.kind === 'rect') {
      const a = op.drag.p0, x = Math.min(a.x, hv.x), y = Math.min(a.y, hv.y), w = Math.abs(hv.x - a.x), h = Math.abs(hv.y - a.y);
      g += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#dbe4ff" fill-opacity="0.5" stroke="#1c2d58" stroke-width="' + 2 * px + '" stroke-dasharray="' + 6 * px + ' ' + 4 * px + '"/>'
        + opLenLbl({ x: x, y: y + h / 2 }, { x: x + w, y: y + h / 2 }, px, opM(opR(w)) + ' × ' + opM(opR(h)) + ' м = ' + opArea(opR(w * h)));
    }
    if (t === 'dim' && from) g += opDimSvg({ x1: from.x, y1: from.y, x2: hv.x, y2: hv.y }, px, '#1c2d58', false);
    if (OP_OPEN[t]) g += opOpenSvg(opOpPlace(t, hv), px, true, false);
    g += '<circle cx="' + hv.x + '" cy="' + hv.y + '" r="' + 4 * px + '" fill="none" stroke="' + (hv.snap ? '#389e0d' : '#1c2d58') + '" stroke-width="' + 1.8 * px + '"/>';
  }
  return g;
}
function opTableHtml() {
  const rs = opPlanRooms().slice().sort(function(a, b) { return String(a.code).localeCompare(String(b.code), 'ru', { numeric: true }); });
  if (!rs.length) return '<div class="op-tbl-h"><span class="op-t-title">Экспликация помещений</span><small>на плане нет помещений</small></div>';
  let tot = 0, rented = 0, free = 0;
  rs.forEach(function(r) { const a = Number(r.area_sqm) || 0, s = opState(r); if (s === 'rented' || s === 'free') tot += a; if (s === 'rented') rented += a; if (s === 'free') free += a; });
  return '<div class="op-tbl-h"><span class="op-t-title">Экспликация помещений</span><span class="op-pill">Помещений: <b>' + rs.length + '</b></span><span class="op-pill">Под аренду: <b>' + opArea(opR(tot)) + '</b></span><span class="op-pill">Сдано: <b>' + opArea(opR(rented)) + '</b></span><span class="op-pill">Свободно: <b>' + opArea(opR(free)) + '</b></span>'
    + '<small>площади — по документам (поле «Площадь»), не по рисунку</small></div>'
    + '<table class="op-t"><thead><tr><th>ID</th><th>Название</th><th class="num">Площадь</th><th class="num">По рисунку</th><th>Состояние</th><th>Договор</th><th>Арендатор</th><th>Договор до</th></tr></thead><tbody>'
    + rs.map(function(r) {
      const s = opState(r), c = opCon(r.contract_id);
      return '<tr data-room="' + r.id + '"' + (r.id === op.sel ? ' class="on"' : '') + '><td><b>' + opEsc(r.code) + '</b></td><td>' + opEsc(r.title) + '</td><td class="num">' + opArea(r.area_sqm) + '</td>'
        + '<td class="num" style="color:#8c8c8c;">' + opArea(opR(opPolyArea(opRoomPts(r)))) + '</td>'
        + '<td><span class="op-chip" style="background:' + OP_COLORS[s][0] + ';border-color:' + OP_COLORS[s][1] + '">' + opStateTitle(s) + '</span></td>'
        + '<td>' + (c ? opEsc(c.contract_number) : r.contract_id ? '<span style="color:#cf1322;">нет в действующих</span>' : '') + '</td><td>' + (c ? opEsc(c.tenant_name) : '') + '</td><td>' + (c ? opDate(c.end_date) : '') + '</td></tr>';
    }).join('') + '</tbody></table>';
}

// ---------- боковая панель ----------
function opF(label, inner, sub) { return '<div class="op-f"><label>' + label + '</label>' + inner + (sub ? '<div class="op-sub">' + sub + '</div>' : '') + '</div>'; }
function opIn(name, val, attrs) { return '<input type="text" data-f="' + name + '" value="' + opEsc(val === null || val === undefined ? '' : val) + '"' + (attrs || '') + '>'; }
function opII(name, val, title) { return '<input type="text" data-i="' + name + '" value="' + opEsc(val) + '" inputmode="decimal"' + (title ? ' title="' + title + '"' : '') + '>'; }
function opToolHtml() {
  const t = op.tool, name = opToolName(t);
  let h = '<h4>' + opEsc(name) + '</h4><div class="op-hint" style="margin:0 0 10px;">' + OP_HINTS[t] + '</div>';
  if (t === 'wall') h += opF('Тип стены', opWtSel('data-d="wt"', op.def.wt), 'на плане: наружная — тёмная заливка, несущая — светлая, перегородка — белая')
    + opF('Толщина новых стен, м', '<input type="text" data-d="wall" value="' + opM(op.def.wall) + '" inputmode="decimal">', 'наружные обычно 0,4–0,6, несущие 0,25–0,4, перегородки 0,08–0,15');
  if (t === 'col') h += '<div class="op-g2">' + opF('Размер, м', '<input type="text" data-d="col" value="' + opM(op.def.col) + '" inputmode="decimal">')
    + opF('Сечение', '<select data-d="colsh"><option value="sq"' + (op.def.colsh !== 'round' ? ' selected' : '') + '>квадрат</option><option value="round"' + (op.def.colsh === 'round' ? ' selected' : '') + '>круг</option></select>') + '</div>';
  if (t === 'calib') {
    if (op.cal.length < 2) h += '<div class="op-hint"><b>' + (op.cal.length ? 'Теперь вторая точка.' : 'Кликните первую точку.') + '</b></div>';
    else h += opF('Между точками на самом деле, м', '<input type="text" data-cal value="" inputmode="decimal" placeholder="например 45,31">', 'сейчас на подложке ' + opM(opR(opDist(op.cal[0], op.cal[1]))) + ' м; подложка растянется вокруг первой точки, план — увеличится, если не влезет')
      + '<div class="op-acts"><button class="op-btn pri" data-act="cal-go">Применить</button><button class="op-btn" data-act="cal-reset">Заново</button></div>';
  }
  if (OP_OPEN[t]) h += opF('Ширина, м', '<input type="text" data-d="' + t + '" value="' + opM(op.def[t]) + '" inputmode="decimal">');
  return h + '<div class="op-keys">' + OP_TOOLS.map(function(x) { return '<kbd>' + x[2] + '</kbd> ' + x[1].toLowerCase(); }).join(' · ') + ' · <kbd>Esc</kbd> отмена · <kbd>Ctrl+Z</kbd> отменить</div>';
}
function opWtSel(attr, v) { return '<select ' + attr + '>' + Object.keys(OP_WT).map(function(k) { return '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + OP_WT[k][0] + ' (' + opM(OP_WT[k][1]) + ' м)</option>'; }).join('') + '</select>'; }
function opItemHtml(it) {
  let h = '<h4>' + OP_IT[it.k] + '</h4>';
  if (it.k === 'wall' || it.k === 'dim') {
    h += opF(opArc(it) ? 'Расстояние между концами, м' : 'Длина, м', opII('len', opM(opR(opWallLen(it)))), opArc(it) ? 'по дуге ' + opM(opR(opWallArcLen(it))) + ' м' : 'меняется второй конец, направление то же');
    if (it.k === 'wall') h += '<div class="op-g2">' + opF('Тип', opWtSel('data-i="wt"', opWT(it))) + opF('Толщина, м', opII('t', opM(it.t))) + '</div>'
      + opF('Изгиб, м', opII('b', opM(it.b || 0)), 'насколько середина стены отходит от прямой; тащите кружок на середине стены; 0 — прямая, минус — в другую сторону');
    h += opF('Концы, м', '<div class="op-g4">' + opII('x1', opM(it.x1), 'X начала') + opII('y1', opM(it.y1), 'Y начала') + opII('x2', opM(it.x2), 'X конца') + opII('y2', opM(it.y2), 'Y конца') + '</div>', 'X, Y начала → X, Y конца, от левого верхнего угла плана');
    if (it.k === 'dim') h += opF('Отступ линии, м', opII('off', opM(it.off === undefined ? -0.8 : it.off)), 'со знаком минус — по другую сторону');
    if (it.k === 'wall') { const n = opItems().filter(function(x) { return x.wid === it.id; }).length; if (n) h += '<div class="op-hint">В стене проёмов: ' + n + ' — удалятся вместе со стеной.</div>'; }
  } else if (OP_OPEN[it.k]) {
    h += opF('Ширина, м', opII('w', opM(it.w)));
    const G = opOpG(it);
    if (G.L) h += opF('От начала стены до проёма, м', opII('pos', opM(opR(G.u - (Number(it.w) || 0) / 2))), 'длина стены ' + opM(opR(G.L)) + ' м');
    else h += opF('Поворот, °', opII('a', it.a || 0), 'проём не в стене — перетащите его на стену');
    if (it.k === 'door') h += opF('Тип', '<select data-i="dt">' + Object.keys(OP_DT).map(function(k) { return '<option value="' + k + '"' + ((it.dt || 'one') === k ? ' selected' : '') + '>' + OP_DT[k] + '</option>'; }).join('') + '</select>')
      + (it.dt === 'open' ? '' : '<div class="op-acts">' + (it.dt === 'two' ? '' : '<button class="op-btn" data-act="it-flip1">Петли с другой стороны</button>') + '<button class="op-btn" data-act="it-flip2">Открывание внутрь / наружу</button></div>');
  } else if (it.k === 'stair') {
    const others = opObjPlans().filter(function(x) { return x.id !== op.planId; }), n = Math.max(2, Math.round(Number(it.n) || 10));
    h += '<div class="op-g2">' + opF('Длина марша, м', opII('l', opM(it.l))) + opF('Ширина, м', opII('w', opM(it.w))) + '</div>'
      + opF('Ступеней', opII('n', n), 'ступень ' + Math.round((Number(it.l) || 0) / n * 100) + ' см; стрелка — подъём')
      + opF('Ведёт на этаж', '<select data-i="to"><option value="">— не указан —</option>' + others.map(function(x) { return '<option value="' + x.id + '"' + (x.id === it.to ? ' selected' : '') + '>' + opEsc(x.title || 'План') + '</option>'; }).join('') + '</select>',
        others.length ? 'в просмотре клик по лестнице открывает этот этаж' : 'других этажей пока нет — «Новый этаж» на ленте')
      + '<div class="op-acts"><button class="op-btn" data-act="st-rot">Повернуть на 90°</button><button class="op-btn" data-act="st-flip">Подъём в другую сторону</button>'
      + (it.to ? '<button class="op-btn" data-act="st-go">Перейти на этаж</button>' : '') + '</div>';
  } else if (it.k === 'col') {
    h += '<div class="op-g2">' + opF('Размер, м', opII('s', opM(it.s || 0.4))) + opF('Сечение', '<select data-i="sh"><option value="sq"' + (it.sh !== 'round' ? ' selected' : '') + '>квадрат</option><option value="round"' + (it.sh === 'round' ? ' selected' : '') + '>круг</option></select>') + '</div>'
      + opF('Центр, м', '<div class="op-g2">' + opII('x', opM(it.x), 'X') + opII('y', opM(it.y), 'Y') + '</div>')
      + '<div class="op-f"><label>Размножить сеткой от этой колонны</label><div class="op-g4"><input type="text" data-g="nx" value="4" title="колонн по X" inputmode="numeric"><input type="text" data-g="ny" value="3" title="колонн по Y" inputmode="numeric">'
      + '<input type="text" data-g="sx" value="6" title="шаг по X, м" inputmode="decimal"><input type="text" data-g="sy" value="6" title="шаг по Y, м" inputmode="decimal"></div>'
      + '<div class="op-sub">колонн по X · по Y · шаг X, м · шаг Y, м (минус — влево / вверх)</div><div class="op-acts" style="border:0;padding-top:0;margin-top:6px;"><button class="op-btn" data-act="col-grid">Размножить</button></div></div>';
  } else if (it.k === 'text') {
    h += opF('Текст', '<textarea data-i="text" rows="2">' + opEsc(it.text) + '</textarea>') + opF('Высота букв, м', opII('s', opM(it.s || 1)));
  }
  return h + '<div class="op-acts"><button class="op-btn red" data-act="it-del">Удалить</button></div><div class="op-hint">Delete — удалить, Ctrl+Z — отменить.</div>';
}
function opSideHtml() {
  const p = opPlan(), can = opCanEdit() && op.edit;
  if (op.panel === 'plan' && can) return opPlanFormHtml(p);
  if (op.panel === 'renum' && can) return '<h4>Перенумеровать помещения плана</h4>'
    + '<div class="op-hint" style="margin:0 0 10px;">Новые ID по порядку: сверху вниз, слева направо. Прежние ID сохранятся в истории помещения.</div>'
    + opF('Начало ID', '<input type="text" data-r="prefix" value="П-">', 'например «П-», «1.», «А»') + opF('С номера', '<input type="number" data-r="start" value="1" min="0">')
    + opF('Цифр в номере', '<select data-r="pad"><option value="2">2 (П-01)</option><option value="1">без нулей (П-1)</option><option value="3">3 (П-001)</option></select>')
    + '<div class="op-acts"><button class="op-btn pri" data-act="renum-go">Перенумеровать</button><button class="op-btn" data-act="side-close">Отмена</button></div>';
  const it = can ? opItem(op.selItem) : null;
  if (it) return opItemHtml(it);
  const r = opRoom(op.sel);
  if (!r || r.plan_id !== op.planId) {
    if (can && op.tool !== 'sel') return opToolHtml();
    if (!p) return '<h4>Помещения</h4><div class="op-hint">Выберите объект слева.</div>';
    return '<h4>' + opEsc(p.title || 'План') + '</h4><div class="op-kv"><b>Размер</b><span>' + opM(p.width_m) + ' × ' + opM(p.height_m) + ' м</span><b>Подложка</b><span>' + (p.bg_url ? 'чертёж загружен' : 'нет') + '</span></div>'
      + (p.note ? '<div class="op-hint" style="margin-top:10px;white-space:pre-wrap;">' + opEsc(p.note) + '</div>' : '')
      + '<div class="op-hint" style="margin-top:12px;">Выберите помещение на плане или в таблице.</div>';
  }
  const c = opCon(r.contract_id), s = opState(r), poly = opIsPoly(r), drawn = opR(opPolyArea(opRoomPts(r)));
  if (!can) {
    return '<h4>' + opEsc(r.code) + (r.title ? ' · ' + opEsc(r.title) : '') + '</h4><div class="op-kv">'
      + '<b>Состояние</b><span>' + opStateTitle(s) + '</span><b>Площадь</b><span>' + opArea(r.area_sqm) + '</span><b>Тип</b><span>' + opEsc(OP_KINDS[r.kind] || '—') + '</span>'
      + (r.purpose ? '<b>Назначение</b><span>' + opEsc(r.purpose) + '</span>' : '') + (r.heating ? '<b>Отопление</b><span>' + opEsc(r.heating) + '</span>' : '')
      + (c ? '<b>Договор</b><span>' + opEsc(c.contract_number) + (opConRooms(r) ? '<br><small style="color:#595959;">' + opConRooms(r) + '</small>' : '') + '</span><b>Арендатор</b><span>' + opEsc(c.tenant_name) + '</span>' + (c.end_date ? '<b>До</b><span>' + opDate(c.end_date) + '</span>' : '') : '')
      + ((r.old_codes || []).length ? '<b>Прежние ID</b><span>' + opEsc(r.old_codes.join(', ')) + '</span>' : '')
      + '</div>' + (r.note ? '<div class="op-hint" style="margin-top:10px;white-space:pre-wrap;">' + opEsc(r.note) + '</div>' : '');
  }
  const objName = (op.objs.find(function(o) { return o.id === op.objId; }) || {}).name || '';
  const cons = op.cons.filter(function(x) { return (x.object_name || '').trim() === objName.trim(); });
  const conOpts = '<option value="">— не сдано —</option>' + cons.map(function(x) {
    const busy = op.rooms.filter(function(q) { return q.contract_id === x.id && q.id !== r.id; }).map(function(q) { return q.code; });
    return '<option value="' + x.id + '"' + (x.id === r.contract_id ? ' selected' : '') + '>' + opEsc(x.contract_number + ' — ' + (x.tenant_name || '') + ', ' + opArea(x.area_sqm) + (busy.length ? ' · ещё помещения: ' + busy.join(', ') : '')) + '</option>';
  }).join('') + (r.contract_id && !c ? '<option value="' + r.contract_id + '" selected>договор #' + r.contract_id + ' (нет среди действующих)</option>' : '');
  return '<h4>Помещение</h4>'
    + opF('ID помещения', opIn('code', r.code), (r.old_codes || []).length ? 'прежние: ' + opEsc(r.old_codes.join(', ')) : '') + '<div class="op-err" data-err="code"></div>'
    + opF('Название', opIn('title', r.title, ' placeholder="Например: Склад 1, Офис 204"'))
    + '<div class="op-g2">' + opF('Площадь по документам, м²', opIn('area_sqm', r.area_sqm, ' inputmode="decimal"'), 'на рисунке: ' + opM(drawn) + ' м²')
    + opF('Тип', '<select data-f="kind">' + Object.keys(OP_KINDS).map(function(k) { return '<option value="' + k + '"' + ((r.kind || 'rent') === k ? ' selected' : '') + '>' + OP_KINDS[k] + '</option>'; }).join('') + '</select>') + '</div>'
    + opF('Договор', '<select data-f="contract_id">' + conOpts + '</select>', opConRooms(r) || 'к одному договору можно привязать несколько помещений; договор не меняется')
    + opF('Назначение', opIn('purpose', r.purpose)) + opF('Отопление', opIn('heating', r.heating, ' placeholder="есть / нет / частично"'))
    + (poly ? opF('Положение на плане, м', '<div class="op-g2">' + ['x', 'y'].map(function(k) { return '<input type="text" data-f="' + k + '" value="' + opM(r[k]) + '" inputmode="decimal" title="' + (k === 'x' ? 'X — левый край' : 'Y — верхний край') + '">'; }).join('') + '</div>',
        'контур из ' + opRoomPts(r).length + ' углов: тащите углы на плане, «+» — новый угол, двойной клик по углу — убрать')
      : opF('Положение и размер на плане, м', '<div class="op-g4">' + ['x', 'y', 'w', 'h'].map(function(k) { return '<input type="text" data-f="' + k + '" value="' + opM(r[k]) + '" title="' + { x: 'X — от левого края', y: 'Y — от верхнего края', w: 'Ширина', h: 'Глубина' }[k] + '" inputmode="decimal">'; }).join('') + '</div>', 'X, Y от левого верхнего угла · ширина · глубина'))
    + opF('Заметки', '<textarea data-f="note" rows="2">' + opEsc(r.note) + '</textarea>')
    + '<div class="op-acts">'
    + (poly ? '<button class="op-btn" data-act="room-rect" title="Контур заменить описанным прямоугольником">Сделать прямоугольником</button>'
      : '<button class="op-btn" data-act="room-poly" title="Помещение станет контуром: углы можно двигать и добавлять">Изменить форму (углы)</button>')
    + '<button class="op-btn" data-act="room-walls" title="Поставить стены по сторонам помещения">Стены по контуру</button>'
    + (!poly && opNum(r.area_sqm) && Math.abs(drawn - opNum(r.area_sqm)) > 0.05 ? '<button class="op-btn" data-act="room-fit" title="Глубину подогнать так, чтобы ширина × глубина = площадь">Размер по площади</button>' : '')
    + (opNum(r.area_sqm) === null && drawn > 0 ? '<button class="op-btn" data-act="room-area" title="Записать площадь по рисунку в поле «Площадь»">Площадь = по рисунку</button>' : '')
    + '<button class="op-btn" data-act="room-dup">Копия рядом</button><button class="op-btn red" data-act="room-del">Удалить</button></div>';
}
// все помещения договора (на любых планах объекта) и их площадь против площади в договоре
function opConRooms(r) {
  if (!r.contract_id) return '';
  const rs = op.rooms.filter(function(q) { return q.contract_id === r.contract_id; }).sort(function(a, b) { return String(a.code).localeCompare(String(b.code), 'ru', { numeric: true }); });
  const c = opCon(r.contract_id), sum = opR(rs.reduce(function(a, q) { return a + (Number(q.area_sqm) || 0); }, 0)), ca = c ? opNum(c.area_sqm) : null;
  return 'Помещения по договору: ' + rs.map(function(q) { return opEsc(q.code) + (q.area_sqm ? ' (' + opArea(q.area_sqm) + ')' : ''); }).join(', ')
    + (rs.length > 1 ? ' — итого ' + opArea(sum) : '') + (ca ? (Math.abs(sum - ca) > 0.05 ? ' · в договоре ' + opArea(ca) : ' · совпадает с договором') : '');
}
function opPlanFormHtml(p) {
  const nw = !p || op.newPlan, cnt = opObjPlans().length;
  const v = nw ? { title: 'Этаж ' + (cnt + 1), width_m: p ? p.width_m : 60, height_m: p ? p.height_m : 40, bg_opacity: 0.6 } : p;
  const copyN = p ? opDw(p).items.filter(function(it) { return it.k === 'wall' || it.k === 'window' || it.k === 'stair' || it.k === 'col'; }).length : 0;
  return '<h4>' + (nw ? 'Новый этаж' : 'Настройки этажа') + '</h4>'
    + opF('Название', '<input type="text" data-p="title" value="' + opEsc(v.title) + '" placeholder="Этаж 2, Подвал, Корпус Б — 1 этаж, Площадка">')
    + (nw ? (copyN ? opF('', '<label style="display:flex;gap:6px;align-items:flex-start;font-size:13px;color:#1f2433;text-transform:none;letter-spacing:0;font-weight:500;"><input type="checkbox" data-p="copy" checked style="margin-top:3px;"> Скопировать стены, окна, колонны и лестницы с «' + opEsc(p.title) + '» (' + copyN + ')</label>', 'лестницы свяжутся: с нового этажа — вниз, с текущего — вверх') : '')
      + '<div class="op-hint" style="margin:0 0 10px;">Новый этаж встанет выше остальных. Порядок меняется в «Настройках этажа».</div>'
      : opF('Порядок снизу вверх', '<input type="text" data-p="sort" value="' + opEsc(v.sort === null || v.sort === undefined ? '' : v.sort) + '" inputmode="numeric">', 'подвал — 0, первый этаж — 1, второй — 2 …; вкладки этажей идут в этом порядке'))
    + '<div class="op-g2">' + opF('Ширина, м', '<input type="text" data-p="width_m" value="' + opM(v.width_m) + '" inputmode="decimal">') + opF('Глубина, м', '<input type="text" data-p="height_m" value="' + opM(v.height_m) + '" inputmode="decimal">') + '</div>'
    + (nw ? '' : opF('Подложка — скан или фото чертежа (PNG, JPG)', '<input type="file" data-p="bg" accept="image/png,image/jpeg,image/webp,image/svg+xml">'
        + (v.bg_url ? '<div class="op-acts"><button class="op-btn red" data-act="bg-del">Убрать подложку</button></div>' : ''),
        'картинка встаёт по ширине плана с сохранением пропорций; затем на ленте «Масштаб по размеру» — две точки и известное расстояние (например, длина наружной стены по чертежу)')
      + opF('Прозрачность подложки', '<input type="range" data-p="bg_opacity" min="0.1" max="1" step="0.05" value="' + (v.bg_opacity === null || v.bg_opacity === undefined ? 0.6 : v.bg_opacity) + '" style="width:100%;">')
      + opF('', '<label style="display:flex;gap:6px;align-items:center;font-size:13px;color:#1f1f1f;"><input type="checkbox" data-p="schematic"' + (v.schematic ? ' checked' : '') + '> Схема, не по чертежу (показывать предупреждение)</label>')
      + opF('Заметки', '<textarea data-p="note" rows="3">' + opEsc(v.note) + '</textarea>'))
    + '<div class="op-acts"><button class="op-btn pri" data-act="plan-save">' + (nw ? 'Создать' : 'Сохранить') + '</button><button class="op-btn" data-act="side-close">Отмена</button>'
    + (nw ? '' : '<button class="op-btn red" data-act="plan-del" title="Только пустой план">Удалить план</button>') + '</div>';
}
function opRenderSide() { const s = opRoot().querySelector('.op-side'); if (s) s.innerHTML = opSideOut(); }
function opRenderTable() { const t = opRoot().querySelector('.op-tbl'); if (t) t.innerHTML = opTableHtml(); }
function opRefresh() { if (op.r3) op3dMark(); opDraw(); opRenderTable(); opRenderSide(); const u = opRoot().querySelector('[data-act="undo"]'); if (u) u.disabled = !op.undo.length; const d = opRoot().querySelector('[data-act="sel-del"]'); if (d) d.disabled = !(op.sel || op.selItem); }

// ---------- инструменты ----------
function opSetTool(t) {
  op.tool = t; op.chain = []; op.cal = []; op.typed = ''; op.hover = null; op.sel = null; op.selItem = null; op.panel = 'room';
  opRender(); const cv = opRoot().querySelector('.op-canvas'); if (cv) cv.focus({ preventScroll: true });
}
function opToolFrom() { return (op.tool === 'wall' || op.tool === 'room' || op.tool === 'dim') && op.chain.length ? op.chain[op.chain.length - 1] : null; }
function opAddItem(it) { const before = opDrawSnap(); it.id = opNewId(); opItems().push(it); opDrawCommit(before); return it; }
async function opToolClick(pt) {
  const t = op.tool, ch = op.chain;
  if (t === 'wall') {
    if (ch.length) {
      const a = ch[ch.length - 1]; if (opDist(a, pt) < 0.01) return;
      opAddItem({ k: 'wall', x1: a.x, y1: a.y, x2: pt.x, y2: pt.y, t: op.def.wall, wt: op.def.wt });
      if (ch.length > 1 && opDist(ch[0], pt) < 0.01) { op.chain = []; opRefresh(); return; }   // замкнули контур
    }
    ch.push(pt); op.typed = ''; opRefresh(); return;
  }
  if (t === 'room') {
    if (ch.length >= 3 && opDist(ch[0], pt) < 0.01) return opRoomFinish();
    if (ch.length && opDist(ch[ch.length - 1], pt) < 0.01) return;
    ch.push(pt); op.typed = ''; opDraw(); return;
  }
  if (t === 'dim') {
    if (!ch.length) { ch.push(pt); opDraw(); return; }
    if (opDist(ch[0], pt) < 0.01) return;
    opAddItem({ k: 'dim', x1: ch[0].x, y1: ch[0].y, x2: pt.x, y2: pt.y, off: -0.8 }); op.chain = []; op.typed = ''; opRefresh(); return;
  }
  if (OP_OPEN[t]) { const it = opAddItem(opOpPlace(t, pt)); op.selItem = it.id; opRefresh(); return; }
  if (t === 'col') { opAddItem({ k: 'col', x: pt.x, y: pt.y, s: op.def.col, sh: op.def.colsh }); opRefresh(); return; }
  if (t === 'calib') { if (op.cal.length >= 2) op.cal = []; op.cal.push(pt); opDraw(); opRenderSide(); const f = opRoot().querySelector('[data-cal]'); if (f) f.focus(); return; }
  if (t === 'text') {
    const it = opAddItem({ k: 'text', x: pt.x, y: pt.y, text: 'Подпись', s: 1 });
    op.tool = 'sel'; op.selItem = it.id; opRender();
    const ta = opRoot().querySelector('[data-i="text"]'); if (ta) { ta.focus(); ta.select(); }
  }
}
async function opRoomFinish() {
  const pts = op.chain.map(function(q) { return [q.x, q.y]; }); op.chain = []; op.typed = '';
  if (pts.length < 3 || opPolyArea(pts) < 0.05) { opDraw(); return; }
  await opCreateRoom(opPolyVals(pts));
}
async function opCreateRoom(geom, src) {
  const p = opPlan();
  const vals = Object.assign({ object_id: op.objId, plan_id: p.id, code: opNextCode(), title: src ? src.title || '' : '', area_sqm: src ? src.area_sqm : null, kind: src ? src.kind || 'rent' : 'rent',
    purpose: src ? src.purpose || '' : '', heating: src ? src.heating || '' : '', contract_id: null, poly: null, old_codes: [], note: '' }, geom);
  try { const r = await opApi('create', 'crm_rooms', vals); op.rooms.push(r); op.sel = r.id; op.selItem = null; op.panel = 'room'; op.undo.push({ t: 'add', id: r.id }); opRefresh(); opToast('Помещение ' + r.code + ' добавлено'); }
  catch (e) { opToast(opErrText(e, 'Не удалось добавить помещение')); }
}
function opFinishChain() { if (op.tool === 'room' && op.chain.length >= 3) return opRoomFinish(); op.chain = []; op.typed = ''; opDraw(); }
// длина набрана цифрами: точка на этом расстоянии в сторону мыши (с привязкой угла)
function opTypedGo() {
  const L = opNum(op.typed), a = opToolFrom(); op.typed = '';
  if (!a || !L || L <= 0) { opDraw(); return; }
  const h = op.hover && opDist(op.hover, a) > 1e-6 ? op.hover : { x: a.x + 1, y: a.y }, d = opDist(h, a);
  opToolClick({ x: opR(a.x + (h.x - a.x) / d * L), y: opR(a.y + (h.y - a.y) / d * L) });
}
function opDelItem(id) {
  const before = opDrawSnap(), dw = opDw(opPlan());
  dw.items = dw.items.filter(function(x) { return x.id !== id && x.wid !== id; });
  op.selItem = null; opDrawCommit(before); opRefresh();
}
function opMoveItem(it, o, dx, dy) {
  if (it.k === 'wall' || it.k === 'dim') { it.x1 = opR(o.x1 + dx); it.y1 = opR(o.y1 + dy); it.x2 = opR(o.x2 + dx); it.y2 = opR(o.y2 + dy); }
  else if (it.k === 'text' || it.k === 'stair' || it.k === 'col') { it.x = opR(o.x + dx); it.y = opR(o.y + dy); }
  else if (OP_OPEN[it.k]) {
    const c = opOpG(o), np = opOpPlace(it.k, { x: c.x + dx, y: c.y + dy }, o);
    ['wid', 'u', 'x', 'y', 'a', 't'].forEach(function(k) { delete it[k]; }); Object.assign(it, np);
  }
}
function opMoveRoomVals(r, dx, dy) {
  if (opIsPoly(r)) return opPolyVals(opRoomPts(r).map(function(q) { return [q[0] + dx, q[1] + dy]; }));
  return { x: opR((Number(r.x) || 0) + dx), y: opR((Number(r.y) || 0) + dy) };
}

function opGoPlan(id) {
  const p = op.plans.find(function(x) { return x.id === id; }); if (!p) return;
  op.planId = id; op.sel = null; op.selItem = null; op.chain = []; op.typed = ''; op.view = null; op.panel = 'room'; op.undo = []; opRender();
}

// ---------- холст: выбор, перетаскивание, рисование, масштаб ----------
function opPt(e) {
  const svg = opSvg(), b = svg.getBoundingClientRect(), v = op.vb;
  return { x: v.x + (e.clientX - b.left) * v.w / b.width, y: v.y + (e.clientY - b.top) * v.h / b.height };
}
function opSnap(n, step) { return Math.round(n / step) * step; }
function opBindCanvas() {
  const cv = opRoot().querySelector('.op-canvas'); if (!cv) return;
  cv.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  cv.addEventListener('pointerdown', function(e) {
    cv.focus({ preventScroll: true });
    const raw = opPt(e), pan = function() { op.drag = { kind: 'pan', p0: { x: e.clientX, y: e.clientY }, v0: Object.assign({}, op.view), moved: false, btn: e.button }; };
    if (e.button === 1 || e.button === 2) pan();
    else if (e.button !== 0) return;
    else if (op.edit && op.tool !== 'sel') {
      const pt = OP_OPEN[op.tool] || op.tool === 'calib' ? raw : opSnapPt(raw, e, opToolFrom());
      if (op.tool === 'bgmove') { const p = opPlan(); op.drag = { kind: 'bgmove', p0: raw, b0: Object.assign({}, opBgRect(p)), before: opDrawSnap(), moved: false }; }
      else if (op.tool === 'rect' || op.tool === 'stair') { op.drag = { kind: 'rect', p0: pt }; op.hover = pt; }
      else opToolClick(pt);
    } else {
      const go = op.edit ? null : e.target.closest('[data-go]');
      if (go) { opGoPlan(Number(go.getAttribute('data-go'))); return; }
      const hEl = e.target.closest('.op-h'), iEl = op.edit ? e.target.closest('[data-it]') : null, gEl = e.target.closest('.op-room');
      const it = op.edit && op.selItem ? opItem(op.selItem) : null, r = opRoom(op.sel);
      if (hEl && it && hEl.getAttribute('data-h') === 'bm') op.drag = { kind: 'bulge', it: it, before: opDrawSnap(), moved: false };
      else if (hEl && it) {
        // конец стены: тянем вместе с ним все концы стен в этой же точке (угол не разваливается)
        const end = hEl.getAttribute('data-h'), px0 = it[end === 'p1' ? 'x1' : 'x2'], py0 = it[end === 'p1' ? 'y1' : 'y2'], ends = [];
        opItems().forEach(function(x) {
          if (x.k !== it.k) return;
          ['p1', 'p2'].forEach(function(n) { const s = n === 'p1' ? 1 : 2; if (Math.abs(x['x' + s] - px0) < 1e-3 && Math.abs(x['y' + s] - py0) < 1e-3) ends.push([x, s]); });
        });
        const other = end === 'p1' ? { x: it.x2, y: it.y2 } : { x: it.x1, y: it.y1 };
        op.drag = { kind: 'iend', ends: ends, from: ends.length === 1 ? other : null, skip: ends.map(function(q) { return q[0].id + ':p' + q[1]; }), before: opDrawSnap(), moved: false };
      } else if (hEl && r && op.edit) {
        const h = hEl.getAttribute('data-h'), r0 = { x: Number(r.x) || 0, y: Number(r.y) || 0, w: Number(r.w) || 1, h: Number(r.h) || 1, poly: opIsPoly(r) ? JSON.parse(JSON.stringify(r.poly)) : null };
        if (h[0] === 'v' || h[0] === 'm') {
          let i = Number(h.slice(1));
          if (h[0] === 'm') { const pts = opRoomPts(r), a = pts[i], b = pts[(i + 1) % pts.length]; pts.splice(i + 1, 0, [opR((a[0] + b[0]) / 2), opR((a[1] + b[1]) / 2)]); r.poly = pts; i++; }
          op.drag = { kind: 'vert', id: r.id, i: i, r0: r0, moved: h[0] === 'm' };
        } else op.drag = { kind: 'resize', h: h, id: r.id, p0: raw, r0: r0, moved: false };
      } else if (iEl) {
        const x = opItem(iEl.getAttribute('data-it'));
        if (op.selItem !== x.id || op.sel) { op.selItem = x.id; op.sel = null; op.panel = 'room'; opRefresh(); }
        op.drag = { kind: 'imove', it: x, o: JSON.parse(JSON.stringify(x)), p0: raw, before: opDrawSnap(), moved: false };
      } else if (gEl) {
        const id = Number(gEl.getAttribute('data-room')), rr = opRoom(id);
        if (op.sel !== id || op.selItem) { op.sel = id; op.selItem = null; op.panel = 'room'; opRefresh(); }
        if (!op.edit || !rr) return;
        op.drag = { kind: 'move', id: id, p0: raw, r0: { x: Number(rr.x) || 0, y: Number(rr.y) || 0, w: Number(rr.w) || 1, h: Number(rr.h) || 1, poly: opIsPoly(rr) ? JSON.parse(JSON.stringify(rr.poly)) : null }, moved: false };
      } else pan();
    }
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* не критично */ }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function(e) {
    const d = op.drag, raw = opPt(e), xy = opRoot().querySelector('[data-st="xy"]');
    if (xy) xy.innerHTML = 'X <b>' + opM(opR(raw.x)) + '</b> · Y <b>' + opM(opR(raw.y)) + '</b> м' + (op.edit ? ' · шаг <b>' + opM(opStep()) + '</b> м' : '');
    if (op.edit && op.tool !== 'sel' && op.tool !== 'bgmove' && (!d || d.kind === 'rect')) {
      op.hover = OP_OPEN[op.tool] || op.tool === 'calib' ? raw : opSnapPt(raw, e, d ? null : opToolFrom()); opDraw(); return;
    }
    if (!d) return;
    if (d.kind === 'pan') {
      const b = cv.getBoundingClientRect(), s = op.vb.w / b.width;
      if (Math.abs(e.clientX - d.p0.x) + Math.abs(e.clientY - d.p0.y) > 3) d.moved = true;
      op.view.x = d.v0.x - (e.clientX - d.p0.x) * s; op.view.y = d.v0.y - (e.clientY - d.p0.y) * s; opDraw(); return;
    }
    const st = opStep();
    if (d.kind === 'bgmove') { const b = opDw(opPlan()).bg = Object.assign({}, d.b0); b.x = opR(d.b0.x + raw.x - d.p0.x); b.y = opR(d.b0.y + raw.y - d.p0.y); d.moved = true; opDraw(); return; }
    if (d.kind === 'bulge') {
      // стрелка прогиба = расстояние мыши от хорды по нормали; у самой хорды — прямая
      const w = d.it, L = opWallLen(w); if (L < 1e-6) return;
      const b = ((raw.x - (w.x1 + w.x2) / 2) * -(w.y2 - w.y1) + (raw.y - (w.y1 + w.y2) / 2) * (w.x2 - w.x1)) / L;
      w.b = Math.abs(b) < 6 * op.vb.px ? 0 : opR(opSnap(Math.max(-L, Math.min(L, b)), e.altKey ? 0.01 : st)); d.moved = true; opDraw(); return;
    }
    if (d.kind === 'iend') { const pt = opSnapPt(raw, e, d.from, d.skip); d.ends.forEach(function(q) { q[0]['x' + q[1]] = pt.x; q[0]['y' + q[1]] = pt.y; }); d.moved = true; opDraw(); return; }
    if (d.kind === 'vert') { const r = opRoom(d.id), pt = opSnapPt(raw, e, null, ['r' + d.id + ':' + d.i]); r.poly[d.i] = [pt.x, pt.y]; d.moved = true; opDraw(); return; }
    const dx = raw.x - d.p0.x, dy = raw.y - d.p0.y;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3 * op.vb.px) return;   // дрожь руки при клике — не перемещение
    d.moved = true;
    if (d.kind === 'imove') { opMoveItem(d.it, d.o, opSnap(dx, st), opSnap(dy, st)); opDraw(); return; }
    const r = opRoom(d.id), o = d.r0;
    if (d.kind === 'move') {
      if (o.poly) { const sx = opSnap(dx, st), sy = opSnap(dy, st); r.poly = o.poly.map(function(q) { return [opR(q[0] + sx), opR(q[1] + sy)]; }); Object.assign(r, opBBox(r.poly)); }
      else { r.x = opR(opSnap(o.x + dx, st)); r.y = opR(opSnap(o.y + dy, st)); }
    } else {
      let x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
      if (d.h.indexOf('w') !== -1) x1 = opSnap(o.x + dx, st); else x2 = opSnap(x2 + dx, st);
      if (d.h.indexOf('n') !== -1) y1 = opSnap(o.y + dy, st); else y2 = opSnap(y2 + dy, st);
      if (x2 - x1 < st) { if (d.h.indexOf('w') !== -1) x1 = x2 - st; else x2 = x1 + st; }
      if (y2 - y1 < st) { if (d.h.indexOf('n') !== -1) y1 = y2 - st; else y2 = y1 + st; }
      r.x = opR(x1); r.y = opR(y1); r.w = opR(x2 - x1); r.h = opR(y2 - y1);
    }
    opDraw();
  });
  const end = async function() {
    const d = op.drag; op.drag = null; if (!d) return;
    if (d.kind === 'pan') {
      if (d.moved) return;
      if (d.btn === 2 && op.chain.length) return opFinishChain();   // правая кнопка без движения — закончить стену / контур
      if (d.btn === 0 && (op.sel || op.selItem)) { op.sel = null; op.selItem = null; opRefresh(); }   // клик по пустому — снять выбор
      return;
    }
    if (d.kind === 'rect' && op.tool === 'stair') {
      const st = opStairFromDrag(d.p0, op.hover || d.p0);
      if (st) { const it = opAddItem(st); op.selItem = it.id; opRefresh(); } else { opToast('Протяните лестницу: длина от 0,6 м, ширина от 0,5 м'); opDraw(); }
      return;
    }
    if (d.kind === 'rect') {
      const a = d.p0, b = op.hover || a, x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = opR(Math.abs(b.x - a.x)), h = opR(Math.abs(b.y - a.y));
      if (w >= 0.3 && h >= 0.3) await opCreateRoom({ x: opR(x), y: opR(y), w: w, h: h }); else opDraw();
      return;
    }
    if (!d.moved) return;
    if (d.kind === 'iend' || d.kind === 'imove' || d.kind === 'bulge' || d.kind === 'bgmove') { if (d.it && !d.it.b) delete d.it.b; opDrawCommit(d.before); opRefresh(); return; }
    const r = opRoom(d.id), vals = r.poly && (d.r0.poly || d.kind === 'vert') ? opPolyVals(r.poly) : { x: r.x, y: r.y, w: r.w, h: r.h };
    Object.assign(r, d.r0); if (!d.r0.poly) r.poly = null;   // прежнее — в стек отмены через opSaveRoom
    await opSaveRoom(d.id, vals); opRefresh();
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', function() { if (op.hover && !op.drag) { op.hover = null; opDraw(); } });
  cv.addEventListener('dblclick', async function(e) {
    if (!op.edit) return;
    if (op.tool === 'wall' || op.tool === 'room') { e.preventDefault(); opFinishChain(); return; }
    const hEl = e.target.closest('.op-h'), r = opRoom(op.sel), h = hEl && hEl.getAttribute('data-h');
    if (r && h && h[0] === 'v' && opIsPoly(r)) {
      const pts = opRoomPts(r); if (pts.length <= 3) { opToast('У помещения минимум 3 угла'); return; }
      pts.splice(Number(h.slice(1)), 1); await opSaveRoom(r.id, opPolyVals(pts)); opRefresh();
    }
  });
  cv.addEventListener('wheel', function(e) {
    e.preventDefault();
    const pt = opPt(e); opZoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, pt);
  }, { passive: false });
  cv.addEventListener('keydown', async function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'я' || e.code === 'KeyZ')) { e.preventDefault(); opUndo(); return; }
    if (!op.edit || e.ctrlKey || e.metaKey) return;
    if (op.tool !== 'sel' && op.chain.length) {
      if (/^[0-9]$/.test(e.key) || e.key === ',' || e.key === '.') { e.preventDefault(); op.typed += e.key === ',' ? '.' : e.key; opDraw(); return; }
      if (e.key === 'Backspace' && op.typed) { e.preventDefault(); op.typed = op.typed.slice(0, -1); opDraw(); return; }
      if (e.key === 'Backspace' && op.tool === 'room') { e.preventDefault(); op.chain.pop(); opDraw(); return; }
    }
    if (e.key === 'Enter') { e.preventDefault(); if (op.typed) opTypedGo(); else opFinishChain(); return; }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (op.chain.length) { op.chain = []; op.typed = ''; opDraw(); } else if (op.tool !== 'sel') opSetTool('sel'); else { op.sel = null; op.selItem = null; opRefresh(); }
      return;
    }
    if (OP_KEYS[e.code] && !e.altKey && !e.shiftKey) { e.preventDefault(); opSetTool(OP_KEYS[e.code]); return; }
    const st = e.altKey ? 0.1 : OP_SNAP, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    const it = opItem(op.selItem);
    if (it) {
      if (mv) {
        e.preventDefault(); const before = opDrawSnap();
        if (OP_OPEN[it.k] && it.wid) { const G = opOpG(it); it.u = opR(G.u + (mv[0] || mv[1])); it.u = opOpG(it).u; } else opMoveItem(it, JSON.parse(JSON.stringify(it)), mv[0], mv[1]);
        opDrawCommit(before); opRefresh();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); opDelItem(it.id); }
      return;
    }
    const r = opRoom(op.sel); if (!r || r.plan_id !== op.planId) return;
    if (mv) { e.preventDefault(); await opSaveRoom(r.id, opMoveRoomVals(r, mv[0], mv[1])); opRefresh(); }
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
    else if (u.t === 'draw') { const p = op.plans.find(function(x) { return x.id === u.id; }); if (p) { p.drawing = u.d; op.selItem = null; opPushDrawing(p); } }
    opToast('Отменено');
  } catch (e) { opToast('Не удалось отменить'); }
  opRefresh();
}
async function opAddRoom(src) {
  const p = opPlan(); if (!p) return;
  if (src) {
    const pts = opRoomPts(src), bb = opBBox(pts), dx = Math.min(bb.w, Math.max(0, Number(p.width_m) - bb.x - bb.w));
    return opCreateRoom(opIsPoly(src) ? opPolyVals(pts.map(function(q) { return [q[0] + dx, q[1]]; })) : { x: opR(bb.x + dx), y: bb.y, w: bb.w, h: bb.h }, src);
  }
  const v = op.view || { x: 0, y: 0, w: p.width_m, h: p.height_m };
  const x = opSnap(Math.max(0, Math.min(Number(p.width_m) - 6, v.x + v.w / 2 - 3)), OP_SNAP), y = opSnap(Math.max(0, Math.min(Number(p.height_m) - 6, v.y + v.h / 2 - 3)), OP_SNAP);
  return opCreateRoom({ x: opR(x), y: opR(y), w: 6, h: 6 });
}
async function opDelRoom(id) {
  const r = opRoom(id); if (!r) return;
  const btn = opRoot().querySelector('[data-act="room-del"]');
  if (btn && !btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = 'Точно удалить ' + r.code + '?'; return; }   // без всплывающих окон: второй клик подтверждает
  const keep = {}; ['object_id', 'plan_id', 'code', 'title', 'area_sqm', 'kind', 'purpose', 'heating', 'contract_id', 'x', 'y', 'w', 'h', 'poly', 'old_codes', 'note'].forEach(function(k) { keep[k] = r[k] === undefined ? null : r[k]; });
  try { await opApi('destroy', 'crm_rooms', id); op.rooms = op.rooms.filter(function(x) { return x.id !== id; }); op.sel = null; op.undo.push({ t: 'del', vals: keep }); opRefresh(); opToast('Удалено — можно отменить'); }
  catch (e) { opToast('Не удалось удалить'); }
}
function opRoomWalls(r) {
  const pts = opRoomPts(r), before = opDrawSnap(), items = opItems();
  const has = function(a, b) { return items.some(function(w) { return w.k === 'wall' && ((Math.abs(w.x1 - a[0]) + Math.abs(w.y1 - a[1]) + Math.abs(w.x2 - b[0]) + Math.abs(w.y2 - b[1]) < 1e-3) || (Math.abs(w.x1 - b[0]) + Math.abs(w.y1 - b[1]) + Math.abs(w.x2 - a[0]) + Math.abs(w.y2 - a[1]) < 1e-3)); }); };
  let n = 0;
  pts.forEach(function(a, i) { const b = pts[(i + 1) % pts.length]; if (!has(a, b)) { items.push({ id: opNewId(), k: 'wall', x1: opR(a[0]), y1: opR(a[1]), x2: opR(b[0]), y2: opR(b[1]), t: op.def.wall, wt: op.def.wt }); n++; } });
  if (!n) { opToast('Стены по контуру уже есть'); return; }
  opDrawCommit(before); opRefresh(); opToast('Стен добавлено: ' + n + ' (толщина ' + opM(op.def.wall) + ' м)');
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
function opImgSize(f) {
  return new Promise(function(ok) {
    const img = document.createElement('img'), u = URL.createObjectURL(f);
    img.onload = function() { URL.revokeObjectURL(u); ok(img.naturalWidth && img.naturalHeight ? [img.naturalWidth, img.naturalHeight] : null); };
    img.onerror = function() { URL.revokeObjectURL(u); ok(null); };
    img.src = u;
  });
}
// масштаб подложки по двум точкам: растягиваем вокруг первой, план увеличиваем, если не влезает
async function opCalApply() {
  const p = opPlan(), el = opRoot().querySelector('[data-cal]'), real = el ? opNum(el.value) : null, a = op.cal[0], b = op.cal[1];
  const cur = a && b ? opDist(a, b) : 0; if (!real || real <= 0 || cur < 1e-6) { opToast('Введите расстояние в метрах'); return; }
  const before = opDrawSnap(), k = real / cur, r = opBgRect(p), dw = opDw(p);
  dw.bg = { x: opR(a.x + (r.x - a.x) * k), y: opR(a.y + (r.y - a.y) * k), w: opR(r.w * k), h: opR(r.h * k) };
  if (dw.bg.x < 0 || dw.bg.y < 0) { dw.bg.x = opR(Math.max(0, dw.bg.x)); dw.bg.y = opR(Math.max(0, dw.bg.y)); }
  const W = Math.max(Number(p.width_m) || 0, Math.ceil(dw.bg.x + dw.bg.w)), H = Math.max(Number(p.height_m) || 0, Math.ceil(dw.bg.y + dw.bg.h));
  opDrawCommit(before);
  if (W !== Number(p.width_m) || H !== Number(p.height_m)) { try { await opApi('update', 'crm_floor_plans', p.id, { width_m: W, height_m: H }); p.width_m = W; p.height_m = H; } catch (e) { opToast('Размер плана не сохранился'); } }
  op.cal = []; op.view = null; opSetTool('sel'); opToast('Масштаб подложки: ×' + opM(opR(k)) + ' · план ' + opM(W) + ' × ' + opM(H) + ' м');
}
async function opSavePlan() {
  const q = function(s) { return opRoot().querySelector('[data-p="' + s + '"]'); };
  const p = opPlan(), nw = !p || op.newPlan;
  const vals = { title: q('title').value.trim() || 'План', width_m: opNum(q('width_m').value), height_m: opNum(q('height_m').value) };
  if (!vals.width_m || !vals.height_m || vals.width_m <= 0 || vals.height_m <= 0) { opToast('Ширина и глубина — числа больше нуля'); return; }
  if (!nw) { vals.bg_opacity = opNum(q('bg_opacity').value); vals.schematic = q('schematic').checked; vals.note = q('note').value; const so = opNum(q('sort').value); if (so !== null) vals.sort = Math.round(so); }
  try {
    if (nw) {
      // новый этаж — выше всех; по желанию копия стен, окон и лестниц текущего этажа (лестницы связываются друг с другом)
      const top = opObjPlans().reduce(function(m, x) { return Math.max(m, Number(x.sort) || 0); }, 0), cp = q('copy') && q('copy').checked && p;
      const ids = {}, items = [];
      if (cp) opDw(p).items.forEach(function(it) { if (it.k === 'wall') { ids[it.id] = opNewId(); items.push(Object.assign({}, it, { id: ids[it.id] })); } });
      if (cp) opDw(p).items.forEach(function(it) {
        if (it.k === 'window' && (!it.wid || ids[it.wid])) items.push(Object.assign({}, it, { id: opNewId(), wid: it.wid ? ids[it.wid] : undefined }));
        if (it.k === 'stair') items.push(Object.assign({}, it, { id: opNewId(), to: p.id }));
        if (it.k === 'col') items.push(Object.assign({}, it, { id: opNewId() }));
      });
      const np = await opApi('create', 'crm_floor_plans', Object.assign(vals, { object_id: op.objId, sort: top + 1, bg_opacity: 0.6, schematic: false, drawing: { items: items } }));
      if (cp && opDw(p).items.some(function(it) { return it.k === 'stair' && !it.to; })) { opDw(p).items.forEach(function(it) { if (it.k === 'stair' && !it.to) it.to = np.id; }); opPushDrawing(p); }
      op.plans.push(np); op.planId = np.id; op.view = null; op.undo = [];
    } else {
      const f = q('bg').files && q('bg').files[0];
      if (f) {
        // подложка по ширине плана, пропорции картинки сохраняются; не влезла по глубине — план глубже
        const nat = await opImgSize(f), up = await opUpload(f), dw = opDw(p), bw = vals.width_m, bh = nat ? opR(bw * nat[1] / nat[0]) : vals.height_m;
        vals.bg_url = up.url; vals.bg_file_id = up.id; dw.bg = { x: 0, y: 0, w: bw, h: bh }; vals.drawing = dw;
        if (bh > vals.height_m) vals.height_m = Math.ceil(bh);
      }
      await opApi('update', 'crm_floor_plans', p.id, vals); Object.assign(p, vals); op.view = null;
    }
    opSortPlans(); op.newPlan = false; op.panel = 'room'; opRender(); opToast('Этаж сохранён');
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
  if (opIsPoly(r) && (f === 'x' || f === 'y')) {   // контур — сдвигаем целиком
    const d = v - (Number(r[f]) || 0); if (Math.abs(d) < 1e-9) return;
    await opSaveRoom(r.id, opMoveRoomVals(r, f === 'x' ? d : 0, f === 'y' ? d : 0)); opRefresh(); return;
  }
  if (f === 'contract_id') v = v ? Number(v) : null;
  if (r[f] === v) return;
  await opSaveRoom(r.id, { [f]: v }); opRefresh();
}
function opItemField(el) {
  const it = opItem(op.selItem); if (!it) return;
  const f = el.getAttribute('data-i'), before = opDrawSnap();
  if (f === 'text') it.text = el.value;
  else if (f === 'to') it.to = el.value ? Number(el.value) : null;
  else if (f === 'wt') { it.wt = el.value; it.t = OP_WT[el.value][1]; }
  else if (f === 'dt' || f === 'sh') it[f] = el.value;
  else {
    const v = opNum(el.value); if (v === null) { opRenderSide(); return; }
    if (f === 'len') {
      const L = opWallLen(it); if (v <= 0.01 || L < 1e-9) { opRenderSide(); return; }
      it.x2 = opR(it.x1 + (it.x2 - it.x1) / L * v); it.y2 = opR(it.y1 + (it.y2 - it.y1) / L * v);
    } else if (f === 't') it.t = opR(Math.max(0.03, v));
    else if (f === 'w') it.w = opR(Math.max(0.3, v));
    else if (f === 's') it.s = opR(Math.max(0.1, v));
    else if (f === 'n') it.n = Math.max(2, Math.min(60, Math.round(v)));
    else if (f === 'l') it.l = opR(Math.max(0.6, v));
    else if (f === 'pos') it.u = opR(v + (Number(it.w) || 0) / 2);
    else if (f === 'b') { if (Math.abs(v) < 0.01) delete it.b; else it.b = opR(v); }
    else it[f] = opR(v);   // x1 y1 x2 y2 off a
  }
  opDrawCommit(before); opRefresh();
}

// ---------- выгрузка плана: PNG, PDF, SVG, DXF, Excel ----------
function opFileName(ext) {
  const o = op.objs.find(function(x) { return x.id === op.objId; }) || {}, p = opPlan() || {}, t = new Date();
  const d = ('0' + t.getDate()).slice(-2) + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + t.getFullYear();
  return ('План ' + (o.name || '') + ' — ' + (p.title || 'план') + ' ' + d).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.' + ext;
}
function opSaveBlob(blob, ext) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opFileName(ext);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 3000);
}
// подложка внутрь файла (data:URL): картинка по ссылке в выгруженном SVG/PNG не откроется
async function opBgData(p) {
  if (!p.bg_url) return null;
  try {
    // base64 руками: FileReader и btoa в песочнице блока есть не всегда (без них подложка молча пропадала из выгрузки)
    const res = await fetch(p.bg_url), u = new Uint8Array(await res.arrayBuffer()), A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', out = [];
    if (!res.ok || !u.length) return null;
    for (let i = 0; i < u.length; i += 3) {
      const n = (u[i] << 16) | ((u[i + 1] || 0) << 8) | (u[i + 2] || 0);
      out.push(A[n >> 18 & 63] + A[n >> 12 & 63] + (i + 1 < u.length ? A[n >> 6 & 63] : '=') + (i + 2 < u.length ? A[n & 63] : '='));
    }
    return 'data:' + (res.headers.get('content-type') || 'image/png').split(';')[0] + ';base64,' + out.join('');
  } catch (e) { console.log('[objplan] bg', e && e.message); return null; }
}
function opTotals(rs) {
  let tot = 0, rented = 0, free = 0;
  rs.forEach(function(r) { const a = Number(r.area_sqm) || 0, s = opState(r); if (s === 'rented' || s === 'free') tot += a; if (s === 'rented') rented += a; if (s === 'free') free += a; });
  return { tot: opR(tot), rented: opR(rented), free: opR(free) };
}
// весь план целиком: заголовок, чертёж, легенда, итоги, масштабная линейка; pw — ширина «как на экране» (от неё размер подписей), zoom — во сколько раз крупнее картинка
async function opExportSvg(pw, zoom) {
  const p = opPlan(), o = op.objs.find(function(x) { return x.id === op.objId; }) || {};
  const W = Number(p.width_m) || 60, H = Number(p.height_m) || 40, pad = Math.max(W, H) * 0.04, tw = W + 2 * pad, px = tw / pw;
  const head = 70 * px, foot = 64 * px, th = H + 2 * pad + head + foot, ph = Math.round(pw * th / tw), x0 = -pad, y0 = -pad - head;
  const bg = await opBgData(p), rs = opPlanRooms(), T = opTotals(rs), t = new Date();
  const date = ('0' + t.getDate()).slice(-2) + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + t.getFullYear();
  const tx = function(x, y, size, txt, attrs) { return '<text x="' + x + '" y="' + y + '" font-size="' + size * px + '"' + (attrs || '') + '>' + opEsc(txt) + '</text>'; };
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(pw * zoom) + '" height="' + Math.round(ph * zoom) + '" viewBox="' + x0 + ' ' + y0 + ' ' + tw + ' ' + th + '" font-family="Arial, Helvetica, sans-serif">'
    + '<rect x="' + x0 + '" y="' + y0 + '" width="' + tw + '" height="' + th + '" fill="#fff"/>'
    + tx(0, y0 + 30 * px, 22, (o.name || '') + ' — ' + (p.title || 'План'), ' font-weight="700" fill="#1f2433"')
    + tx(0, y0 + 52 * px, 13, 'Размер плана ' + opM(W) + ' × ' + opM(H) + ' м · сетка 10 м · выгружено ' + date + (p.schematic ? ' · СХЕМА: расположение и форма помещений условные' : ''), ' fill="#5b6478"')
    + opBuild(p, px, { bg: bg });
  // легенда и итоги
  let lx = 0; const ly = H + pad + 26 * px;
  ['rented', 'free', 'tech', 'common'].forEach(function(st) {
    s += '<rect x="' + lx + '" y="' + (ly - 11 * px) + '" width="' + 13 * px + '" height="' + 13 * px + '" rx="' + 2 * px + '" fill="' + OP_COLORS[st][0] + '" stroke="' + OP_COLORS[st][1] + '" stroke-width="' + 1.5 * px + '"/>'
      + tx(lx + 19 * px, ly, 13, opStateTitle(st), ' fill="#1f2433"');
    lx += (opStateTitle(st).length * 7.4 + 44) * px;
  });
  s += tx(0, ly + 24 * px, 13, 'Помещений: ' + rs.length + ' · под аренду ' + opArea(T.tot) + ' · сдано ' + opArea(T.rented) + ' · свободно ' + opArea(T.free) + ' (площади — по документам)', ' fill="#1f2433" font-weight="600"');
  // масштабная линейка 10 м (или меньше, если план узкий)
  const sb = W >= 20 ? 10 : W >= 5 ? 5 : 1, sx = W - sb, sy = ly - 4 * px, tk = 5 * px;
  s += '<path d="M' + sx + ' ' + (sy - tk) + 'V' + (sy + tk) + 'M' + sx + ' ' + sy + 'H' + W + 'M' + W + ' ' + (sy - tk) + 'V' + (sy + tk) + 'M' + (sx + sb / 2) + ' ' + (sy - tk * 0.6) + 'V' + (sy + tk * 0.6) + '" stroke="#1f2433" stroke-width="' + 1.6 * px + '" fill="none"/>'
    + tx(sx + sb / 2, sy + 20 * px, 12, sb + ' м', ' fill="#1f2433" text-anchor="middle"');
  return { svg: s + '</svg>', w: Math.round(pw * zoom), h: Math.round(ph * zoom) };
}
function opCanvas(x) {
  return new Promise(function(ok, no) {
    const img = document.createElement('img');   // new Image() в песочнице блоков нет
    img.onload = function() {
      const c = document.createElement('canvas'); c.width = x.w; c.height = x.h;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, x.w, x.h); g.drawImage(img, 0, 0, x.w, x.h);
      URL.revokeObjectURL(img.src); ok(c);
    };
    img.onerror = function() { no(new Error('svg')); };
    img.src = URL.createObjectURL(new Blob([x.svg], { type: 'image/svg+xml;charset=utf-8' }));
  });
}
// PDF руками: одна страница А3, картинка JPEG (DCTDecode) по центру с полями
async function opPdfBlob(c) {
  const jb = await new Promise(function(ok) { c.toBlob(ok, 'image/jpeg', 0.9); });   // без atob: его в песочнице может не быть
  if (!jb) throw new Error('jpeg');
  const img = new Uint8Array(await jb.arrayBuffer());
  const land = c.width >= c.height, PW = land ? 1190.55 : 841.89, PH = land ? 841.89 : 1190.55, m = 28;
  const k = Math.min((PW - 2 * m) / c.width, (PH - 2 * m) / c.height), dw = c.width * k, dh = c.height * k;
  const parts = [], offs = []; let len = 0;
  const add = function(x) { parts.push(x); len += x.length; };   // все строки здесь — ASCII: длина = байты
  const obj = function(n, body) { offs[n] = len; add(n + ' 0 obj\n'); body.forEach(add); add('\nendobj\n'); };
  add('%PDF-1.4\n');
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  obj(3, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>']);
  obj(4, ['<< /Type /XObject /Subtype /Image /Width ' + c.width + ' /Height ' + c.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n', img, '\nendstream']);
  const cs = 'q ' + dw.toFixed(2) + ' 0 0 ' + dh.toFixed(2) + ' ' + ((PW - dw) / 2).toFixed(2) + ' ' + ((PH - dh) / 2).toFixed(2) + ' cm /Im0 Do Q';
  obj(5, ['<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream']);
  const xref = len; let t = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) t += ('000000000' + offs[i]).slice(-10) + ' 00000 n \n';
  add(t + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  return new Blob(parts, { type: 'application/pdf' });
}
// DXF R12 (ASCII): слои, ось Y вверх, 1 единица = 1 м; кириллица — \U+XXXX (понимают AutoCAD, LibreCAD, nanoCAD)
function opDxf() {
  const p = opPlan(), W = Number(p.width_m) || 60, H = Number(p.height_m) || 40, out = [];
  const E = function() { for (let i = 0; i < arguments.length; i += 2) out.push(arguments[i], arguments[i + 1]); };
  const n = function(v) { return String(Math.round(v * 1000) / 1000); };
  const Y = function(y) { return H - y; };
  const esc = function(s) { return String(s).replace(/[^\x20-\x7e]/g, function(c) { return '\\U+' + ('000' + c.charCodeAt(0).toString(16).toUpperCase()).slice(-4); }); };
  const line = function(L, a, b) { E(0, 'LINE', 8, L, 10, n(a[0]), 20, n(Y(a[1])), 30, 0, 11, n(b[0]), 21, n(Y(b[1])), 31, 0); };
  const poly = function(L, pts, closed) { E(0, 'POLYLINE', 8, L, 66, 1, 70, closed ? 1 : 0, 10, 0, 20, 0, 30, 0); pts.forEach(function(q) { E(0, 'VERTEX', 8, L, 10, n(q[0]), 20, n(Y(q[1])), 30, 0); }); E(0, 'SEQEND', 8, L); };
  const text = function(L, x, y, h, s, rot) { E(0, 'TEXT', 8, L, 10, n(x), 20, n(Y(y)), 30, 0, 40, n(h), 1, esc(s), 50, n(rot || 0), 72, 1, 11, n(x), 21, n(Y(y)), 31, 0, 73, 2); };
  const LAYERS = [['PLAN', 8], ['ROOMS', 5], ['ROOM_ID', 7], ['WALLS', 7], ['WALL_AXIS', 9], ['DOORS', 1], ['WINDOWS', 4], ['GATES', 30], ['DIMS', 3], ['TEXT', 7], ['STAIRS', 6], ['COLUMNS', 8]];
  E(0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1009', 0, 'ENDSEC');
  E(0, 'SECTION', 2, 'TABLES', 0, 'TABLE', 2, 'LTYPE', 70, 1, 0, 'LTYPE', 2, 'CONTINUOUS', 70, 0, 3, 'Solid line', 72, 65, 73, 0, 40, '0.0', 0, 'ENDTAB');
  E(0, 'TABLE', 2, 'LAYER', 70, LAYERS.length); LAYERS.forEach(function(l) { E(0, 'LAYER', 2, l[0], 70, 0, 62, l[1], 6, 'CONTINUOUS'); }); E(0, 'ENDTAB', 0, 'ENDSEC');
  E(0, 'SECTION', 2, 'ENTITIES');
  poly('PLAN', [[0, 0], [W, 0], [W, H], [0, H]], true);
  opPlanRooms().forEach(function(r) {
    const pts = opRoomPts(r), bb = opBBox(pts), c = opIsPoly(r) ? opCentroid(pts) : [bb.x + bb.w / 2, bb.y + bb.h / 2], h = Math.max(0.25, Math.min(1, Math.min(bb.w, bb.h) / 6));
    poly('ROOMS', pts, true);
    text('ROOM_ID', c[0], c[1] - h * 0.7, h, r.code || '');
    if (r.area_sqm) text('ROOM_ID', c[0], c[1] + h * 0.7, h * 0.75, opM(r.area_sqm) + ' m2');
  });
  opWallPolys(opItems().filter(function(it) { return it.k === 'wall'; })).polys.forEach(function(q) { poly('WALLS', q.pts, true); });
  const loc = function(G) { const a = G.a * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a); return function(lx, ly) { return [G.x + lx * cs - ly * sn, G.y + lx * sn + ly * cs]; }; };
  opItems().forEach(function(it) {
    if (it.k === 'wall') {   // грани — общими многоугольниками со стыками (ниже), здесь — ось
      const La = opWallArcLen(it), C = []; if (La < 1e-6) return;
      for (let i = 0, n = opArc(it) ? 24 : 1; i <= n; i++) { const q = opWallAt(it, La * i / n); C.push([q.x, q.y]); }
      poly('WALL_AXIS', C, false);
    } else if (OP_OPEN[it.k]) {
      const G = opOpG(it), f = loc(G), w = Number(it.w) || 0.9, hw = w / 2, t = Math.max(0.05, G.t), L = { door: 'DOORS', window: 'WINDOWS', gate: 'GATES' }[it.k];
      poly(L, [f(-hw, -t / 2), f(hw, -t / 2), f(hw, t / 2), f(-hw, t / 2)], true);
      if (it.k === 'door') {
        const fl = it.flip || 0, sd = (fl & 2) ? -1 : 1, y0 = sd * t / 2, dt = OP_DT[it.dt] ? it.dt : 'one';
        const leaf = function(hx, lw) {
          line(L, f(hx, y0), f(hx, y0 + sd * lw));
          const a0 = Math.atan2(sd, 0), a1 = hx < 0 ? 0 : Math.PI; let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
          const arc = []; for (let i = 0; i <= 12; i++) { const a = a0 + da * i / 12; arc.push(f(hx + lw * Math.cos(a), y0 + lw * Math.sin(a))); }
          poly(L, arc, false);
        };
        if (dt === 'two') { leaf(-hw, hw); leaf(hw, hw); } else if (dt === 'one') leaf((fl & 1) ? hw : -hw, w);
      } else if (it.k === 'window') line(L, f(-hw, 0), f(hw, 0));
      else line(L, f(-hw, 0), f(hw, 0));
    } else if (it.k === 'dim') {
      const L = opWallLen(it); if (L < 1e-6) return;
      const off = it.off === undefined || it.off === null ? -0.8 : Number(it.off), nx = -(it.y2 - it.y1) / L * off, ny = (it.x2 - it.x1) / L * off;
      const a1 = [it.x1 + nx, it.y1 + ny], a2 = [it.x2 + nx, it.y2 + ny];
      line('DIMS', [it.x1, it.y1], a1); line('DIMS', [it.x2, it.y2], a2); line('DIMS', a1, a2);
      let ang = Math.atan2(it.y2 - it.y1, it.x2 - it.x1) * 180 / Math.PI; if (ang > 90 || ang <= -90) ang += 180;
      const k = Math.abs(off) > 1e-9 ? 0.3 / Math.abs(off) : 0, mx = (a1[0] + a2[0]) / 2 + nx * k, my = (a1[1] + a2[1]) / 2 + ny * k;
      text('DIMS', mx, my, 0.3, opM(opR(L)) + ' m', -ang);
    } else if (it.k === 'stair') {
      const f = loc({ x: Number(it.x) || 0, y: Number(it.y) || 0, a: Number(it.a) || 0 }), l = Number(it.l) || 3, w = Number(it.w) || 1.2, n = Math.max(2, Math.round(Number(it.n) || 10));
      poly('STAIRS', [f(-l / 2, -w / 2), f(l / 2, -w / 2), f(l / 2, w / 2), f(-l / 2, w / 2)], true);
      for (let i = 1; i < n; i++) line('STAIRS', f(-l / 2 + l * i / n, -w / 2), f(-l / 2 + l * i / n, w / 2));
      const ah = Math.min(w * 0.32, 0.4, l * 0.3);
      line('STAIRS', f(-l / 2 + l / n / 2, 0), f(l / 2, 0)); poly('STAIRS', [f(l / 2 - ah, -ah * 0.6), f(l / 2, 0), f(l / 2 - ah, ah * 0.6)], false);
    } else if (it.k === 'col') {
      const sz = Number(it.s) || 0.4;
      if (it.sh === 'round') E(0, 'CIRCLE', 8, 'COLUMNS', 10, n(it.x), 20, n(Y(it.y)), 30, 0, 40, n(sz / 2));
      else poly('COLUMNS', [[it.x - sz / 2, it.y - sz / 2], [it.x + sz / 2, it.y - sz / 2], [it.x + sz / 2, it.y + sz / 2], [it.x - sz / 2, it.y + sz / 2]], true);
    } else if (it.k === 'text') text('TEXT', it.x, it.y - (Number(it.s) || 1) * 0.35, (Number(it.s) || 1) * 0.75, it.text || '');
  });
  E(0, 'ENDSEC', 0, 'EOF');
  return new Blob([out.join('\r\n') + '\r\n'], { type: 'application/dxf' });
}
function opXlsx() {
  const o = op.objs.find(function(x) { return x.id === op.objId; }) || {}, plans = op.plans.filter(function(p) { return p.object_id === op.objId; });
  const pi = function(id) { const i = plans.findIndex(function(p) { return p.id === id; }); return i < 0 ? 999 : i; };
  const rs = op.rooms.filter(function(r) { return r.object_id === op.objId; })
    .sort(function(a, b) { return pi(a.plan_id) - pi(b.plan_id) || String(a.code).localeCompare(String(b.code), 'ru', { numeric: true }); });
  crmXlsx('Экспликация ' + (o.name || ''), {
    title: 'Экспликация помещений — ' + (o.name || ''),
    filters: [['Объект', o.name || ''], ['Этажи', plans.map(function(p) { return p.title || 'План'; }).join(', ')]],
    notes: [['Площадь', 'по документам: договор, техпаспорт'], ['По рисунку', 'площадь фигуры на плане — справочно'], ['Состояние', 'Сдано — к помещению привязан действующий договор'], ['Прежние ID', 'номера помещения до перенумерации']],
    sheets: [{ name: 'Помещения', total: true, cols: [{ h: 'Этаж', t: 'text', w: 14 }, { h: 'ID', t: 'text', w: 9 }, { h: 'Название', t: 'text', w: 30 }, { h: 'Тип', t: 'text', w: 19 }, { h: 'Состояние', t: 'text', w: 13 },
      { h: 'Площадь', t: 'area' }, { h: 'По рисунку', t: 'area' }, { h: 'Договор', t: 'text', w: 20 }, { h: 'Арендатор', t: 'text', w: 34 }, { h: 'Договор до', t: 'date' },
      { h: 'Назначение', t: 'long', w: 34 }, { h: 'Отопление', t: 'text', w: 12 }, { h: 'Прежние ID', t: 'text', w: 13 }],
      rows: rs.map(function(r) {
        const c = opCon(r.contract_id), pl = plans.find(function(p) { return p.id === r.plan_id; }) || {};
        return [pl.title || '', r.code || '', r.title || '', OP_KINDS[r.kind] || '', opStateTitle(opState(r)), opNum(r.area_sqm), opR(opPolyArea(opRoomPts(r))),
          c ? c.contract_number : '', c ? c.tenant_name : '', c ? c.end_date : '', r.purpose || '', r.heating || '', (r.old_codes || []).join(', ')];
      }) }]
  });
}
async function opExport(fmt) {
  const m = opRoot().querySelector('.op-menu'); if (m) m.classList.remove('open');
  if (!opPlan()) return;
  opToast('Готовлю ' + fmt.toUpperCase() + '…');
  try {
    if (fmt === 'xlsx') return opXlsx();
    if (fmt === 'dxf') return opSaveBlob(opDxf(), 'dxf');
    const x = await opExportSvg(1400, fmt === 'pdf' ? 2.4 : fmt === 'png' ? 2 : 1);   // PDF А3 ≈ 200 dpi, подписи ~10 pt
    if (fmt === 'svg') return opSaveBlob(new Blob([x.svg], { type: 'image/svg+xml;charset=utf-8' }), 'svg');
    const c = await opCanvas(x);
    if (fmt === 'pdf') return opSaveBlob(await opPdfBlob(c), 'pdf');
    c.toBlob(function(b) { if (b) opSaveBlob(b, 'png'); else opToast('Не удалось собрать картинку'); }, 'image/png');
  } catch (e) { console.log('[objplan] export', fmt, e && e.message); opToast('Не удалось выгрузить ' + fmt.toUpperCase()); }
}

// ---------- 3D: только просмотр, строится из того же чертежа ----------
// three.js 0.149 (UMD) лежит у нас: storage/uploads/vendor (копия — deploy/vendor), без внешних CDN.
// Ось X — X плана, Z — Y плана, Y — высота. Стены — те же многоугольники со стыками (opWallPolys), проёмы — разрезом стены по длине
// с перемычкой и подоконником. Высота стен — drawing.h3 (по умолчанию 3 м). Все этажи — стопкой по порядку этажей.
// ponytail: проёмы в дуговых стенах в 3D не вырезаются; помещения с дугой — прямыми сторонами. Нужно — CSG.
const OP_THREE_URL = '/storage/uploads/vendor/three-0.149.0.min.js';
function op3dH(p) { const h = p && p.drawing && Number(p.drawing.h3); return h >= 2 ? h : 3; }
function op3dBar(can) {
  const p = opPlan(), many = opObjPlans().length > 1;
  return '<div class="op-float op-3dbar"><button class="op-btn" data-act="3d-reset">' + opIco('cube') + 'Вид 3D</button><button class="op-btn" data-act="3d-top">' + opIco('fit') + 'Сверху</button>'
    + (many ? '<button class="op-btn' + (op.v3all ? ' on' : '') + '" data-act="3d-all">' + opIco('layers') + 'Все этажи</button>' : '')
    + (can ? '<label>Высота стен, м <input data-h3 value="' + opM(op3dH(p)) + '" inputmode="decimal"></label>' : '')
    + '<button class="op-btn" data-act="3d-shot">' + opIco('download') + 'Снимок PNG</button></div>';
}
function op3dDispose() {
  const r = op.r3; op.r3 = null; if (!r) return;
  r.scene.traverse(function(o) { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(function(m) { if (m.map) m.map.dispose(); m.dispose(); }); });
  r.renderer.dispose(); try { r.renderer.forceContextLoss(); } catch (e) { /* нет */ }
}
async function op3dLib() {
  if (op.THREE) return op.THREE;
  let T = null;
  // полный адрес: относительный путь requireAsync считает пакетом с esm.sh
  try { T = await ctx.requireAsync(document.location.origin + OP_THREE_URL); } catch (e) { console.log('[objplan] three', e && e.message); }
  if (!T || !T.Scene) T = (typeof window !== 'undefined' && window.THREE) || null;
  op.THREE = T && T.Scene ? T : null; return op.THREE;
}
async function op3dMount() {
  const box = opRoot().querySelector('.op-3d'), T = await op3dLib();
  if (!box || !box.isConnected || !op.v3) return;
  if (!T) { box.innerHTML = '<div class="op-3d-msg">Не удалось загрузить 3D. Обновите страницу.</div>'; return; }
  op3dDispose();
  const plan = opPlan(), plans = op.v3all ? opObjPlans() : [plan];
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  box.innerHTML = ''; box.appendChild(renderer.domElement);
  const scene = new T.Scene(), rooms = [];
  let oy = 0, W = 0, D = 0;
  plans.forEach(function(p) {
    const h = op3dH(p), g = op3dPlan(T, p, h, p.id === plan.id || !op.v3all, rooms);
    g.position.y = oy; scene.add(g); W = Math.max(W, Number(p.width_m) || 60); D = Math.max(D, Number(p.height_m) || 40);
    oy += h + (op.v3all ? 2.5 : 0);   // этажи стопкой с зазором — видно, что над чем
  });
  const S = Math.max(W, D);
  scene.background = new T.Color(0xeef1f6); scene.fog = new T.Fog(0xeef1f6, S * 2.5, S * 7);   // без чёрного неба и обрыва земли на горизонте
  scene.add(new T.HemisphereLight(0xffffff, 0xc9d1de, 0.62));
  const sun = new T.DirectionalLight(0xffffff, 0.5); sun.position.set(W * 0.5 - S * 0.6, S * 1.2 + oy, D * 0.5 - S * 0.9); sun.target.position.set(W / 2, 0, D / 2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 0.5, far: S * 4 + oy * 2 }); sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  const ground = new T.Mesh(new T.PlaneGeometry(S * 20, S * 20), new T.MeshStandardMaterial({ color: 0xe1e6ee, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, -0.02, D / 2); ground.receiveShadow = true; scene.add(ground);
  const cam = new T.PerspectiveCamera(42, 1, 0.1, S * 20);
  const r = op.r3 = { T: T, renderer: renderer, scene: scene, cam: cam, rooms: rooms, c: { tx: W / 2, ty: op.v3all ? oy / 3 : 0, tz: D / 2, th: -0.6, ph: 0.95, dist: S * 1.25 }, S: S, oy: oy };
  r.draw = function() {
    const c = r.c; cam.position.set(c.tx + c.dist * Math.sin(c.ph) * Math.sin(c.th), c.ty + c.dist * Math.cos(c.ph), c.tz + c.dist * Math.sin(c.ph) * Math.cos(c.th));
    cam.lookAt(c.tx, c.ty, c.tz); renderer.render(scene, cam);
  };
  r.resize = function() { const b = box.getBoundingClientRect(); if (!b.width) return; renderer.setSize(b.width, b.height, false); cam.aspect = b.width / b.height; cam.updateProjectionMatrix(); r.draw(); };
  r.home = Object.assign({}, r.c);
  op3dBind(r, renderer.domElement); op3dMark(); r.resize();
}
function op3dView(top) { const r = op.r3; if (!r) return; r.c = Object.assign({}, r.home, top ? { th: 0, ph: 0.001, dist: r.S * 1.15 } : {}); r.draw(); }
// подсветка выбранного помещения
function op3dMark() { const r = op.r3; if (!r) return; r.rooms.forEach(function(m) { m.material.emissive.setHex(m.userData.room === op.sel ? 0x3a1010 : 0x000000); }); r.draw(); }
function op3dBind(r, el) {
  let d = null;
  el.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  el.addEventListener('pointerdown', function(e) { d = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey, moved: false }; try { el.setPointerCapture(e.pointerId); } catch (x) { /* нет */ } });
  el.addEventListener('pointermove', function(e) {
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y, c = r.c; if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    d.x = e.clientX; d.y = e.clientY;
    if (d.pan) {   // двигаем точку взгляда в плоскости экрана (по горизонтали — по земле)
      const k = c.dist / el.clientHeight * 0.8, cs = Math.cos(c.th), sn = Math.sin(c.th);
      c.tx -= (dx * cs - dy * sn * Math.cos(c.ph)) * k; c.tz -= (-dx * sn - dy * cs * Math.cos(c.ph)) * k; c.ty += dy * Math.sin(c.ph) * k * 0.5;
    } else { c.th -= dx * 0.008; c.ph = Math.max(0.001, Math.min(1.52, c.ph - dy * 0.008)); }
    r.draw();
  });
  el.addEventListener('pointerup', function(e) {
    const was = d; d = null; if (!was || was.moved) return;
    const b = el.getBoundingClientRect(), ray = new r.T.Raycaster(), m = new r.T.Vector2((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
    ray.setFromCamera(m, r.cam);
    const hit = ray.intersectObjects(r.rooms, false)[0];
    op.sel = hit ? hit.object.userData.room : null; op.selItem = null; op.panel = 'room'; opRenderSide(); opRenderTable(); op3dMark();
  });
  el.addEventListener('wheel', function(e) { e.preventDefault(); r.c.dist = Math.max(2, Math.min(r.S * 6, r.c.dist * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); r.draw(); }, { passive: false });
}
// один этаж: пол помещений, стены с проёмами, колонны, лестницы, подписи
function op3dPlan(T, p, h, full, rooms) {
  const grp = new T.Group(), W = Number(p.width_m) || 60, D = Number(p.height_m) || 40, items = opDw(p).items;
  const mat = function(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0 }, o || {})); };
  const add = function(geo, m, sh) { const x = new T.Mesh(geo, m); x.castShadow = sh !== false; x.receiveShadow = true; grp.add(x); return x; };
  // многоугольник плана → призма от y0 до y1
  const prism = function(pts, y0, y1, m) {
    const s = new T.Shape(pts.map(function(q) { return new T.Vector2(q[0], -q[1]); }));
    const g = new T.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return add(g, m);
  };
  // плита этажа
  const slab = new T.Mesh(new T.BoxGeometry(W, 0.12, D), mat(0xf7f8fa)); slab.position.set(W / 2, -0.06, D / 2); slab.receiveShadow = true; grp.add(slab);
  // помещения: пол цветом состояния и подпись «номер / площадь»
  op.rooms.filter(function(r) { return r.plan_id === p.id; }).forEach(function(r) {
    const pts = opRoomPts(r), s = new T.Shape(pts.map(function(q) { return new T.Vector2(q[0], -q[1]); }));
    const g = new T.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, 0.01, 0);
    const m = new T.Mesh(g, mat(OP_COLORS[opState(r)][0], { roughness: 0.95 })); m.receiveShadow = true; m.userData.room = r.id; grp.add(m); rooms.push(m);
    if (!full) return;
    const bb = opBBox(pts), c = opIsPoly(r) ? opCentroid(pts) : [bb.x + bb.w / 2, bb.y + bb.h / 2], k = Math.max(0.5, Math.min(2.4, Math.min(bb.w, bb.h) * 0.3));
    const sp = op3dLabel(T, r.code || '', r.area_sqm ? opArea(r.area_sqm) : ''); sp.scale.set(k * 2, k, 1); sp.position.set(c[0], 0.15 + k / 2, c[1]); grp.add(sp);
  });
  // стены: цельные многоугольники, где есть проёмы — режем стену по длине
  const top = { ext: 0x4d4d4d, bear: 0x8c8c8c, part: 0xb8b8b8 }, side = mat(0xf3f0ea), wm = {};
  Object.keys(top).forEach(function(k) { wm[k] = [mat(top[k]), side]; });   // ExtrudeGeometry: группа 0 — торцы (верх/низ), 1 — бока
  const walls = items.filter(function(it) { return it.k === 'wall'; }), WP = opWallPolys(walls), glass = mat(0x9fc3e6, { transparent: true, opacity: 0.45, roughness: 0.1 });
  const lintelH = function(k) { return k === 'gate' ? Math.min(h - 0.3, Math.max(2.4, h * 0.8)) : Math.min(h - 0.2, 2.1); };
  WP.polys.forEach(function(q) {
    const w = q.w, m = wm[opWT(w)], ops = opArc(w) ? [] : items.filter(function(o) { return OP_OPEN[o.k] && o.wid === w.id; });
    if (!ops.length) { prism(q.pts, 0, h, m); return; }
    const L = opWallLen(w), ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L, hh = Math.max(0.03, Number(w.t) || 0.2) / 2, nx = -uy * hh, ny = ux * hh;
    const ax = function(u, sd) { return [w.x1 + ux * u + sd * nx, w.y1 + uy * u + sd * ny]; };
    // q.pts прямой стены: [начало слева, конец слева, конец справа, начало справа] — у концов «усы» стыков
    const piece = function(u0, u1) { return [u0 <= 1e-6 ? q.pts[0] : ax(u0, 1), u1 >= L - 1e-6 ? q.pts[1] : ax(u1, 1), u1 >= L - 1e-6 ? q.pts[2] : ax(u1, -1), u0 <= 1e-6 ? q.pts[3] : ax(u0, -1)]; };
    const iv = ops.map(function(o) { const G = opOpG(o), ww = Number(o.w) || 0.9; return { o: o, G: G, a: Math.max(0, G.u - ww / 2), b: Math.min(L, G.u + ww / 2) }; }).sort(function(a, b) { return a.a - b.a; });
    let u = 0;
    iv.forEach(function(x) {
      if (x.a - u > 1e-3) prism(piece(u, x.a), 0, h, m);
      const rect = piece(x.a, x.b), lt = lintelH(x.o.k);
      prism(rect, lt, h, m);   // перемычка
      if (x.o.k === 'window') {
        prism(rect, 0, 0.9, m);   // подоконная часть
        const gp = new T.Mesh(new T.BoxGeometry(x.b - x.a, lt - 0.9, 0.03), glass); gp.position.set(x.G.x, (lt + 0.9) / 2, x.G.y); gp.rotation.y = -x.G.a * Math.PI / 180; grp.add(gp);
      } else if (x.o.k === 'door') op3dDoor(T, grp, x.o, x.G, lt, mat(0xa47551));
      u = Math.max(u, x.b);
    });
    if (L - u > 1e-3) prism(piece(u, L), 0, h, m);
  });
  WP.hubs.forEach(function(q) { prism(q.pts, 0, h, wm[opWT(q.w)]); });
  // колонны и лестницы
  const colm = mat(0x9a9a9a);
  items.forEach(function(it) {
    if (it.k === 'col') {
      const sz = Math.max(0.1, Number(it.s) || 0.4), g = it.sh === 'round' ? new T.CylinderGeometry(sz / 2, sz / 2, h, 20) : new T.BoxGeometry(sz, h, sz);
      const m = add(g, colm); m.position.set(it.x, h / 2, it.y);
    }
    if (it.k === 'stair') {
      const l = Math.max(0.3, Number(it.l) || 3), w = Math.max(0.3, Number(it.w) || 1.2), n = Math.max(2, Math.round(Number(it.n) || 10)), a = (Number(it.a) || 0) * Math.PI / 180, st = l / n, rise = h / n, sm = mat(0xd9d4cc);
      for (let i = 0; i < n; i++) {
        const lx = -l / 2 + st * (i + 0.5), m = add(new T.BoxGeometry(st, rise * (i + 1), w), sm);
        m.position.set(it.x + lx * Math.cos(a), rise * (i + 1) / 2, it.y + lx * Math.sin(a)); m.rotation.y = -a;
      }
    }
  });
  return grp;
}
// дверное полотно приоткрыто на 60° от петли в сторону открывания; двупольная — два полотна
function op3dDoor(T, grp, o, G, lt, m) {
  const dt = OP_DT[o.dt] ? o.dt : 'one'; if (dt === 'open') return;
  const w = Number(o.w) || 0.9, hw = w / 2, f = o.flip || 0, sd = (f & 2) ? -1 : 1, a = G.a * Math.PI / 180, ph = 60 * Math.PI / 180;
  const leaf = function(hx, lw) {
    const dir = -Math.sign(hx), lx = dir * Math.cos(ph), ly = sd * Math.sin(ph);   // направление полотна в осях проёма
    const px = G.x + hx * Math.cos(a), py = G.y + hx * Math.sin(a), vx = lx * Math.cos(a) - ly * Math.sin(a), vy = lx * Math.sin(a) + ly * Math.cos(a);
    const b = new T.Mesh(new T.BoxGeometry(lw, lt - 0.02, 0.04), m); b.castShadow = true;
    b.position.set(px + vx * lw / 2, (lt - 0.02) / 2, py + vy * lw / 2); b.rotation.y = -Math.atan2(vy, vx); grp.add(b);
  };
  if (dt === 'two') { leaf(-hw, hw); leaf(hw, hw); } else leaf((f & 1) ? hw : -hw, w);
}
function op3dLabel(T, code, area) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.88)'; g.strokeStyle = '#1c2d58'; g.lineWidth = 4;
  const rr = function(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  rr(8, 8, 496, 240, 28); g.fill(); g.stroke();
  g.fillStyle = '#1f2433'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 92px Arial'; g.fillText(code, 256, area ? 84 : 128, 470);
  if (area) { g.fillRect(96, 130, 320, 5); g.font = '64px Arial'; g.fillText(area, 256, 190, 470); }
  const t = new T.CanvasTexture(c); t.anisotropy = 4;
  return new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: true }));
}

// ---------- события ----------
opRoot().addEventListener('click', async function(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const ob = c('[data-obj]'), pl = c('[data-plan]'), tr = c('tr[data-room]'), a = c('[data-act]'), tl = c('[data-tool]');
  if (ob) { op.objId = Number(ob.getAttribute('data-obj')); try { localStorage.setItem('crm-objplan-obj', op.objId); } catch (x) { /* нет */ } op.sel = null; op.panel = 'room'; op.undo = []; opPickPlan(); opRender(); return; }
  if (pl) { opGoPlan(Number(pl.getAttribute('data-plan'))); return; }
  if (tl) { opSetTool(tl.getAttribute('data-tool')); return; }
  if (tr) { op.sel = Number(tr.getAttribute('data-room')); op.selItem = null; op.panel = 'room'; opRefresh(); return; }
  if (!a) return;
  const act = a.getAttribute('data-act');
  if (act === 'edit' || act === 'mode-view' || act === 'mode-edit' || act === 'mode-3d') {
    const v = act === 'edit' ? !op.edit : act === 'mode-edit', v3 = act === 'mode-3d'; if (v === op.edit && v3 === !!op.v3) return;
    op.edit = v; op.v3 = v3; op.panel = 'room'; op.selItem = null; op.chain = []; opRender(); return;
  }
  if (act === '3d-all') { op.v3all = !op.v3all; opRender(); return; }
  if (act === '3d-top' || act === '3d-reset') { op3dView(act === '3d-top'); return; }
  if (act === '3d-shot') { const c = op.r3 && op.r3.renderer.domElement; if (c) { op.r3.draw(); c.toBlob(function(b) { if (b) opSaveBlob(b, 'png'); }, 'image/png'); } return; }
  if (act === 'exp-toggle') { const m = opRoot().querySelector('.op-menu'); if (m) m.classList.toggle('open'); return; }
  if (act === 'exp') return opExport(a.getAttribute('data-fmt'));
  if (act === 'sel-del') { if (op.selItem) return opDelItem(op.selItem); if (op.sel) return opDelRoom(op.sel); return; }
  if (act === 'zin') return opZoom(1 / 1.3);
  if (act === 'zout') return opZoom(1.3);
  if (act === 'zfit') { opFit(); opDraw(); return; }
  if (act === 'undo') return opUndo();
  if (act === 'room-add') return opAddRoom(null);
  if (act === 'room-dup') return opAddRoom(opRoom(op.sel));
  if (act === 'room-del') return opDelRoom(op.sel);
  if (act === 'room-fit') { const r = opRoom(op.sel), ar = opNum(r && r.area_sqm); if (r && ar && Number(r.w) > 0) { await opSaveRoom(r.id, { h: opR(ar / Number(r.w)) }); opRefresh(); } return; }
  if (act === 'room-poly') { const r = opRoom(op.sel); if (r) { await opSaveRoom(r.id, opPolyVals(opRoomPts(r))); opRefresh(); opToast('Тащите углы, «+» на стороне — новый угол'); } return; }
  if (act === 'room-rect') { const r = opRoom(op.sel); if (r) { await opSaveRoom(r.id, Object.assign({ poly: null }, opBBox(opRoomPts(r)))); opRefresh(); } return; }
  if (act === 'room-walls') { const r = opRoom(op.sel); if (r) opRoomWalls(r); return; }
  if (act === 'room-area') { const r = opRoom(op.sel); if (r) { await opSaveRoom(r.id, { area_sqm: opR(opPolyArea(opRoomPts(r))) }); opRefresh(); } return; }
  if (act === 'it-del') return opDelItem(op.selItem);
  if (act === 'cal-go') return opCalApply();
  if (act === 'cal-reset') { op.cal = []; opDraw(); opRenderSide(); return; }
  if (act === 'col-grid') {
    const it = opItem(op.selItem), g = function(k) { const el = opRoot().querySelector('[data-g="' + k + '"]'); return el ? opNum(el.value) : null; };
    const nx = Math.round(g('nx') || 0), ny = Math.round(g('ny') || 0), sx = g('sx') || 0, sy = g('sy') || 0;
    if (!it || nx < 1 || ny < 1 || nx * ny > 400 || (nx > 1 && !sx) || (ny > 1 && !sy)) { opToast('Колонн по X и Y — от 1, всего до 400; шаг — не ноль'); return; }
    const before = opDrawSnap(), items = opItems(); let k = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (!i && !j) continue;
      const x = opR(it.x + sx * i), y = opR(it.y + sy * j);
      if (items.some(function(c) { return c.k === 'col' && Math.abs(c.x - x) < 1e-3 && Math.abs(c.y - y) < 1e-3; })) continue;
      items.push({ id: opNewId(), k: 'col', x: x, y: y, s: it.s, sh: it.sh }); k++;
    }
    opDrawCommit(before); opRefresh(); opToast('Колонн добавлено: ' + k); return;
  }
  if (act === 'st-rot' || act === 'st-flip') { const it = opItem(op.selItem); if (it) { const before = opDrawSnap(); it.a = ((Number(it.a) || 0) + (act === 'st-rot' ? 90 : 180)) % 360; opDrawCommit(before); opRefresh(); } return; }
  if (act === 'st-go') { const it = opItem(op.selItem); if (it && it.to) opGoPlan(it.to); return; }
  if (act === 'ghost') { op.ghost = !op.ghost; try { localStorage.setItem('crm-objplan-ghost', op.ghost ? '1' : '0'); } catch (x) { /* нет */ } a.classList.toggle('on', op.ghost); opDraw(); return; }
  if (act === 'it-flip1' || act === 'it-flip2') { const it = opItem(op.selItem); if (it) { const before = opDrawSnap(); it.flip = (it.flip || 0) ^ (act === 'it-flip1' ? 1 : 2); opDrawCommit(before); opRefresh(); } return; }
  if (act === 'renum') { op.panel = 'renum'; opRenderSide(); return; }
  if (act === 'renum-go') return opRenum();
  if (act === 'plan-add') { op.newPlan = true; op.panel = 'plan'; opRenderSide(); return; }
  if (act === 'plan-set') { op.newPlan = false; op.panel = 'plan'; opRenderSide(); return; }
  if (act === 'plan-save') return opSavePlan();
  if (act === 'side-close') { op.newPlan = false; op.panel = 'room'; opRenderSide(); return; }
  if (act === 'bg-del') { const p = opPlan(); try { await opApi('update', 'crm_floor_plans', p.id, { bg_url: null, bg_file_id: null }); p.bg_url = null; p.bg_file_id = null; if (opDw(p).bg) { delete opDw(p).bg; opPushDrawing(p); } opRender(); } catch (x) { opToast('Не удалось'); } return; }
  if (act === 'plan-del') {
    const p = opPlan(); if (!p) return;
    if (opPlanRooms().length) { opToast('Сначала удалите или перенесите помещения плана'); return; }
    if (!a.dataset.sure) { a.dataset.sure = '1'; a.textContent = opItems().length ? 'Удалить план вместе с чертежом?' : 'Точно удалить план?'; return; }
    try { await opApi('destroy', 'crm_floor_plans', p.id); op.plans = op.plans.filter(function(x) { return x.id !== p.id; }); op.panel = 'room'; opPickPlan(); opRender(); } catch (x) { opToast('Не удалось удалить план'); }
  }
});
opRoot().addEventListener('change', function(e) {
  const el = e.target;
  if (el.matches && el.matches('[data-f]')) opRoomField(el);
  if (el.matches && el.matches('[data-i]')) opItemField(el);
  if (el.matches && el.matches('[data-d]')) {
    const v = opNum(el.value), k = el.getAttribute('data-d');
    if (k === 'wt' || k === 'colsh') {
      op.def[k] = el.value; if (k === 'wt') op.def.wall = OP_WT[el.value][1];
      try { localStorage.setItem('crm-objplan-def', JSON.stringify(op.def)); } catch (x) { /* нет */ } opRenderSide(); opDraw(); return;
    }
    if (v && v > 0) { op.def[k] = opR(v); try { localStorage.setItem('crm-objplan-def', JSON.stringify(op.def)); } catch (x) { /* нет */ } opDraw(); } else el.value = opM(op.def[k]);
  }
  if (el.matches && el.matches('[data-p="bg_opacity"]')) { const p = opPlan(); if (p) { p.bg_opacity = Number(el.value); opDraw(); } }
  if (el.matches && el.matches('[data-h3]')) {
    const p = opPlan(), v = opNum(el.value); if (!p || !v || v < 2 || v > 20) { el.value = opM(op3dH(p)); return; }
    opDw(p).h3 = opR(v); opPushDrawing(p); opRender();
  }
});
opRoot().addEventListener('input', function(e) {
  const el = e.target;
  if (el.matches && el.matches('[data-q]')) {   // поиск объекта — фильтр списка без перерисовки страницы
    op.q = el.value; const q = el.value.trim().toLowerCase();
    opRoot().querySelectorAll('.op-obj').forEach(function(x) { x.style.display = !q || x.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none'; });
  }
  if (el.matches && el.matches('[data-p="bg_opacity"]')) { const p = opPlan(); if (p) { p.bg_opacity = Number(el.value); opDraw(); } }
});
opRoot().addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[data-f], input[data-i], input[data-d]')) { e.preventDefault(); e.target.blur(); }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[data-cal]')) { e.preventDefault(); opCalApply(); }
});
window.addEventListener('resize', function() { if (op.r3) op.r3.resize(); else if (opSvg()) opDraw(); });
document.addEventListener('click', function(e) { const m = opRoot() && opRoot().querySelector('.op-menu.open'); if (m && !e.target.closest('.op-menu-w')) m.classList.remove('open'); });

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
