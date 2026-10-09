// Страница «Дашборд» (/admin/dashpage01, блок dashblock001): сводка по объектам аренды.
// Главный экран — общие цифры и карточки объектов; клик по карточке — экран объекта (статусы, оформление, договоры, сроки, пробелы в данных).
// Всё считается в браузере из тех же коллекций, что и реестр (права те же). Суммы — в целых копейках, без округлений и средних:
// правило владельца «ни одного примерного числа». Шкала — только там, где есть доля от целого (сдано из общей площади).
// Доступ к странице — через права ролей на пункт меню (сейчас только admin).
// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
// @include src/_crm-calls.js
// @include src/_crm-mobile.js
// @include src/_crm-xlsx.js
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
if (!document.getElementById('cm-dash-style')) {
  const st = document.createElement('style');
  st.id = 'cm-dash-style';
  st.textContent = `
    #cm-dash-panel { padding: 4px 0 12px; color: #1f1f1f; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    #cm-dash-panel .dash-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
    #cm-dash-panel .dash-title { font-size:18px; font-weight:700; margin-right:4px; }
    #cm-dash-panel .dash-sub { font-size:12px; color:#8c8c8c; }
    #cm-dash-panel .dash-link { border:1px solid #d9d9d9; background:#fff; color:#262626; border-radius:6px; padding:3px 10px; font-size:12.5px; cursor:pointer; font-family:inherit; }
    #cm-dash-panel .dash-link:hover { border-color:#1c2d58; color:#1c2d58; }
    #cm-dash-panel .dash-section { font-size:15px; font-weight:700; margin:18px 0 10px; }
    #cm-dash-panel .dash-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; }
    #cm-dash-panel .dash-tile { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; }
    #cm-dash-panel .dash-tile-label { font-size:12px; color:#8c8c8c; margin-bottom:4px; }
    #cm-dash-panel .dash-tile-value { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; line-height:1.25; }
    #cm-dash-panel .dash-tile-value small { font-size:13px; font-weight:400; color:#8c8c8c; }
    #cm-dash-panel .dash-tile-note { font-size:12px; color:#8c8c8c; margin-top:4px; line-height:1.45; }
    #cm-dash-panel .dash-track { height:8px; background:#f0f0f0; border-radius:4px; overflow:hidden; margin-top:8px; }
    #cm-dash-panel .dash-fill { height:100%; background:#1c2d58; border-radius:0 4px 4px 0; }
    #cm-dash-panel .dash-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
    #cm-dash-panel .dash-chip { display:inline-flex; align-items:center; gap:5px; padding:1px 8px; border-radius:10px; font-size:12px; border:1px solid; white-space:nowrap; }
    #cm-dash-panel .dash-chip b { font-variant-numeric:tabular-nums; }
    #cm-dash-panel [data-go] { cursor:pointer; }
    #cm-dash-panel .dash-chip[data-go]:hover { filter:brightness(.92); text-decoration:underline; }
    #cm-dash-panel .dash-status div[data-go]:hover { box-shadow:0 0 0 2px currentColor inset; }
    #cm-dash-panel .dash-ok { color:#389e0d; }
    #cm-dash-panel .dash-warn { color:#d46b08; }
    #cm-dash-panel .dash-bad { color:#cf1322; }
    #cm-dash-panel .dash-empty { font-size:12.5px; color:#bfbfbf; padding:4px 0; }
    /* карточки объектов */
    #cm-dash-panel .dash-objs { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:10px; }
    #cm-dash-panel .dash-obj { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; cursor:pointer; transition:border-color .12s, box-shadow .12s; display:flex; flex-direction:column; }
    #cm-dash-panel .dash-obj:hover { border-color:#b4bfd9; box-shadow:0 2px 8px rgba(28,45,88,.08); }
    #cm-dash-panel .dash-obj-name { font-size:15px; font-weight:700; display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
    #cm-dash-panel .dash-obj-name span { font-size:12px; font-weight:400; color:#8c8c8c; white-space:nowrap; }
    #cm-dash-panel .dash-obj-money { font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:10px; }
    #cm-dash-panel .dash-obj-money small { font-size:12px; font-weight:400; color:#8c8c8c; }
    #cm-dash-panel .dash-obj-area { font-size:12.5px; color:#595959; margin-top:8px; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-obj .dash-chips { margin-top:10px; }
    #cm-dash-panel .dash-rest { font-size:12px; color:#8c8c8c; margin-top:10px; }
    /* экран объекта */
    #cm-dash-panel .dash-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:12px; margin-top:12px; }
    #cm-dash-panel .dash-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; }
    #cm-dash-panel .dash-card-title { font-size:14px; font-weight:600; margin-bottom:10px; display:flex; justify-content:space-between; gap:8px; }
    #cm-dash-panel .dash-card-title span { font-weight:400; font-size:12px; color:#8c8c8c; }
    #cm-dash-panel .dash-status { display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:8px; }
    #cm-dash-panel .dash-status div { border-radius:6px; padding:8px 10px; border:1px solid; }
    #cm-dash-panel .dash-status b { display:block; font-size:22px; line-height:1.1; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-status span { font-size:12px; }
    #cm-dash-panel .dash-status .zero { opacity:.45; }
    #cm-dash-panel .dash-steps { display:flex; align-items:flex-start; }
    #cm-dash-panel .dash-step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; min-width:0; }
    #cm-dash-panel .dash-step:not(:last-child)::after { content:''; position:absolute; top:17px; left:calc(50% + 19px); right:calc(-50% + 19px); height:2px; background:#e8e8e8; }
    #cm-dash-panel .dash-step-dot { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; border:2px solid #e8e8e8; color:#bfbfbf; background:#fff; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-step-dot.on { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    #cm-dash-panel .dash-step[data-go]:hover .dash-step-dot { box-shadow:0 0 0 4px #cdd5e8; }
    #cm-dash-panel .dash-step[data-go]:hover .dash-step-lbl { color:#1c2d58; }
    #cm-dash-panel .dash-step-lbl { font-size:11.5px; color:#595959; text-align:center; margin-top:6px; line-height:1.3; padding:0 2px; }
    #cm-dash-panel .dash-row { display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-top:1px solid #f5f5f5; font-size:13px; }
    #cm-dash-panel .dash-row:first-child { border-top:none; }
    #cm-dash-panel [data-open] { cursor:pointer; }
    #cm-dash-panel [data-open]:hover { color:#1c2d58; }
    #cm-dash-panel .dash-row-main { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #cm-dash-panel .dash-row-side { flex-shrink:0; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-gap { font-size:13px; padding:6px 0; border-top:1px solid #f5f5f5; }
    #cm-dash-panel .dash-gap:first-child { border-top:none; }
    #cm-dash-panel .dash-gap a { color:#1c2d58; cursor:pointer; margin-right:6px; }
    #cm-dash-panel .dash-table-wrap { overflow-x:auto; }
    #cm-dash-panel table.dash-table { width:100%; border-collapse:collapse; font-size:13px; }
    #cm-dash-panel .dash-table th { text-align:left; font-weight:600; color:#595959; padding:7px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    #cm-dash-panel .dash-table td { padding:7px 8px; border-bottom:1px solid #f5f5f5; white-space:nowrap; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-table .num { text-align:right; }
    #cm-dash-panel .dash-table tbody tr:hover td { background:#f5faff; }
    #cm-dash-panel .dash-edit { color:#1c2d58; cursor:pointer; }
    #cm-dash-panel .dash-tile.dash-wide { grid-column:span 2; }
    #cm-dash-panel .dash-kinds { display:grid; grid-template-columns:minmax(0,1fr) auto auto auto; column-gap:16px; font-size:13px; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-kinds > div { padding:7px 0; border-top:1px solid #f5f5f5; }
    #cm-dash-panel .dash-kinds > .kh { padding:0 0 4px; border-top:none; font-size:12px; color:#8c8c8c; }
    #cm-dash-panel .dash-kinds .num { text-align:right; white-space:nowrap; }
    #cm-dash-panel .dash-kinds .on { background:#f3f5fa; }
    #cm-dash-panel .dash-kinds [data-act] { cursor:pointer; }
    @media (max-width: 700px) {
      #cm-dash-panel .dash-grid { grid-template-columns:1fr; }
      #cm-dash-panel .dash-tile.dash-wide { grid-column:auto; }
      #cm-dash-panel .dash-kinds { grid-template-columns:minmax(0,1fr) auto; }
      #cm-dash-panel .dash-kinds .kx { display:none; }
      #cm-dash-panel .dash-steps { flex-direction:column; align-items:stretch; gap:6px; }
      #cm-dash-panel .dash-step { flex-direction:row; gap:10px; }
      #cm-dash-panel .dash-step::after { display:none; }
      #cm-dash-panel .dash-step-lbl { margin-top:0; text-align:left; }
    }
    /* читаемость (как в статистике заявок): контрастные плитки, карточки и таблицы */
    #cm-dash-panel .dash-tile, #cm-dash-panel .dash-card, #cm-dash-panel .dash-obj { border-color:#dfe3ea; }
    #cm-dash-panel .dash-obj:hover { border-color:#1c2d58; box-shadow:0 2px 8px rgba(16,24,40,.08); }
    #cm-dash-panel .dash-tile-label { font-size:12.5px; color:#434343; font-weight:600; }
    #cm-dash-panel .dash-tile-value:not(.dash-bad):not(.dash-ok) { color:#141414; }
    #cm-dash-panel .dash-tile-value small, #cm-dash-panel .dash-tile-note, #cm-dash-panel .dash-sub, #cm-dash-panel .dash-rest,
    #cm-dash-panel .dash-obj-name span, #cm-dash-panel .dash-obj-money small, #cm-dash-panel .dash-card-title span { color:#595959; }
    #cm-dash-panel .dash-obj-area { color:#434343; }
    #cm-dash-panel .dash-card-title { font-size:15px; font-weight:700; color:#141414; }
    #cm-dash-panel table.dash-table { font-size:13.5px; color:#1f1f1f; }
    #cm-dash-panel .dash-table th { color:#262626; font-size:12.5px; background:#eef1f6; border-bottom:2px solid #c9d1df; padding:8px 10px; }
    #cm-dash-panel .dash-table td { padding:8px 10px; border-bottom-color:#e8ebf0; font-weight:500; }
    #cm-dash-panel .dash-table tbody tr:nth-child(even) td { background:#f8f9fb; }
    #cm-dash-panel .dash-table tbody tr:hover td { background:#eaf0ff; }
    #cm-dash-panel .dash-kinds { font-size:13.5px; color:#1f1f1f; column-gap:0; }
    #cm-dash-panel .dash-kinds > div { padding:8px 10px; border-top-color:#e8ebf0; font-weight:500; }
    #cm-dash-panel .dash-kinds > .kh { padding:7px 10px; background:#eef1f6; border-bottom:2px solid #c9d1df; color:#262626; font-weight:600; font-size:12.5px; }
  `;
  document.head.appendChild(st);
}

// статусы — от худшего к лучшему (порядок и цвета как в карточке договора)
const DASH_STATUS = [
  { v: '1_problem', label: 'Проблема', color: '#cf1322' },
  { v: '2_terminating', label: 'На расторжении', color: '#722ed1' },
  { v: '2_docs', label: 'Не хватает документов', color: '#1c2d58' },
  { v: '2_attention', label: 'Требует внимания', color: '#d48806' },
  { v: '3_ok', label: 'В порядке', color: '#389e0d' },
  { v: '', label: 'Статус не задан', color: '#8c8c8c' }
];
const DASH_STAGES = ['Заявка', 'Объявление', 'Условия', 'Подписание', 'Оплата счетов', 'Акт и скан'];
const dashState = { data: null, loadedAt: null, loading: null, obj: '', kind: '' };
// вид объекта договора (поле object_kind); '' — вид не указан. Площадь в м² складываем только у помещений (и у договоров без вида —
// до внедрения поля все договоры были помещениями); участки — отдельной площадью, машино-места — штуками.
const DASH_KINDS = [
  { v: 'Помещение', many: 'Помещения', n: ['помещение', 'помещения', 'помещений'], color: '#1c2d58' },
  { v: 'Земельный участок', many: 'Земельные участки', n: ['земельный участок', 'земельных участка', 'земельных участков'], color: '#389e0d' },
  { v: 'Машино-место', many: 'Машино-места', n: ['машино-место', 'машино-места', 'машино-мест'], color: '#d46b08' },
  { v: '', many: 'Вид не указан', n: ['без вида', 'без вида', 'без вида'], color: '#8c8c8c' }
];
function kindOf(r) { return r.object_kind || ''; }
function kindTxt(k, n) { return n + ' ' + dNoun(n, k.n[0], k.n[1], k.n[2]); }
function kindKey(v) { return v === '' ? 'none' : v; }   // для ?kind= и выбора в шапке
// что складывается в «площадь» при текущем фильтре: по умолчанию помещения (+ без вида), при фильтре «участки» — участки
function areaCounts(r) { const k = kindOf(r); return dashState.kind === 'Земельный участок' ? k === 'Земельный участок' : (k === 'Помещение' || k === ''); }
// данные с учётом фильтра по виду объекта
function dv() {
  const d = dashState.data;
  if (!dashState.kind) return d;
  const want = dashState.kind === 'none' ? '' : dashState.kind;
  const f = function(r) { return kindOf(r) === want; };
  return Object.assign({}, d, { active: d.active.filter(f), forming: d.forming.filter(f), completed: d.completed.filter(f) });
}
const REGISTRY_URL = '/admin/b5znz7yxpy3';

function dEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function dKop(v) { const n = Number(v); return v === null || v === undefined || v === '' || !isFinite(n) ? null : Math.round(n * 100); }
function dFmt2(kop) { return (kop / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function dMoney(kop) { return dFmt2(kop) + ' ₽'; }
function dDate(v) {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
function dDateTxt(d) { return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear(); }
function dToday() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
function dDays(d) { return Math.round((d.getTime() - dToday().getTime()) / 86400000); }
function dNoun(n, one, few, many) { const a = Math.abs(n) % 100, b = a % 10; return (a > 10 && a < 20) ? many : b === 1 ? one : (b >= 2 && b <= 4) ? few : many; }
function dContracts(n) { return n + ' ' + dNoun(n, 'договор', 'договора', 'договоров'); }
function dOfContracts(n) { return n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'договора' : 'договоров'); }   // «из N …»
function dDaysTxt(n) { return n + ' ' + dNoun(n, 'день', 'дня', 'дней'); }
function dFilled(v) { return !(v === null || v === undefined || String(v).trim() === ''); }
function dStatus(v) { return DASH_STATUS.find(function(s) { return s.v === (v || ''); }) || DASH_STATUS[DASH_STATUS.length - 1]; }
function dChip(text, color, num, go) {
  return '<span class="dash-chip"' + (go ? ' data-go="' + dEsc(go) + '" title="Открыть эти договоры в реестре"' : '') + ' style="color:' + color + ';border-color:' + color + '40;background:' + color + '0d;">' + (num !== undefined ? '<b>' + num + '</b>' : '') + dEsc(text) + '</span>';
}

async function dashList(coll, extra) {
  const res = await ctx.api.resource(coll).list(Object.assign({ paginate: false }, extra || {}));
  const rows = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : [];
  return Array.isArray(rows) ? rows : [];
}
async function loadDashData() {
  const all = await Promise.all([
    dashList('rental_contracts', { appends: ['contract_members'] }),
    dashList('forming_contracts'),
    dashList('completed_contracts'),
    dashList('contract_price_periods', { filter: { contract_type: 'active' } }).catch(function() { return []; }),
    dashList('contract_objects').catch(function() { return []; })
  ]);
  return { active: all[0], forming: all[1], completed: all[2], periods: all[3], objects: all[4] };
}

ctx.render('<div id="cm-dash-panel"><div class="dash-empty">Загрузка…</div></div>');
function ensureDashPanel() {
  return (ctx.element && ctx.element.querySelector('#cm-dash-panel')) || document.getElementById('cm-dash-panel');
}
async function refreshDashboard() {
  const panel = ensureDashPanel();
  if (dashState.loading) return dashState.loading;
  dashState.loading = loadDashData().then(function(d) {
    dashState.data = d; dashState.loadedAt = Date.now();
    renderDashboard();
  }).catch(function() {
    panel.innerHTML = '<div class="dash-bad" style="padding:8px 0;">Не удалось загрузить данные дашборда</div>';
  }).then(function() { dashState.loading = null; });
  return dashState.loading;
}
ensureDashPanel().addEventListener('click', onDashClick);
ensureDashPanel().addEventListener('change', function(e) {
  if (e.target && e.target.getAttribute('data-act') === 'obj') dashSetObject(e.target.value);
  if (e.target && e.target.getAttribute('data-act') === 'kindsel') { dashState.kind = e.target.value; renderDashboard(); }
});
refreshDashboard();

function objOf(r) { return (r.object_name || '').trim() || 'Без объекта'; }
function monthlyKop(r) {
  const a = dKop(r.rent_amount), b = dKop(r.utility_amount);
  return a === null && b === null ? null : (a || 0) + (b || 0);
}
// ближайшее расторжение (90 дней вперёд или уже прошедшее, пока договор в «Активных»)
function termInfo(r) {
  const t = dDate(r.termination_date);
  if (!t) return null;
  const days = dDays(t);
  return days <= 90 ? { t: t, days: days } : null;
}
function termTxt(x) { return x.days < 0 ? 'прошло ' + dDaysTxt(-x.days) + ' назад' : x.days === 0 ? 'сегодня' : dDateTxt(x.t) + ', через ' + dDaysTxt(x.days); }

// сводка по набору договоров (все объекты или один)
function summary(active, objects) {
  const s = { n: active.length, areaKop: 0, areaN: 0, areaOf: 0, parking: 0, rentKop: 0, rentN: 0, utilKop: 0, utilN: 0, depKop: 0, depN: 0, noPrice: 0, totalKop: 0, totalN: 0, status: {} };
  active.forEach(function(r) {
    const a = dKop(r.area_sqm), re = dKop(r.rent_amount), u = dKop(r.utility_amount), dp = dKop(r.deposit_amount);
    if (kindOf(r) === 'Машино-место') s.parking++;
    if (areaCounts(r)) { s.areaOf++; if (a !== null) { s.areaKop += a; s.areaN++; } }
    if (re !== null) { s.rentKop += re; s.rentN++; }
    if (u !== null) { s.utilKop += u; s.utilN++; }
    if (dp !== null) { s.depKop += dp; s.depN++; }
    if (re === null && u === null) s.noPrice++;
    const k = r.contract_status || '';
    s.status[k] = (s.status[k] || 0) + 1;
  });
  objects.forEach(function(o) { const k = dKop(o.total_area); if (k !== null) { s.totalKop += k; s.totalN++; } });
  return s;
}

// ---------- плитки общих цифр ----------
function areaTile(s, objCount, editId) {
  if (dashState.kind === 'Машино-место') {
    return '<div class="dash-tile"><div class="dash-tile-label">Машино-места</div><div class="dash-tile-value">' + s.parking + ' <small>сдано</small></div>'
      + '<div class="dash-tile-note">по одному машино-месту на договор</div></div>';
  }
  if (dashState.kind === 'Земельный участок') {
    return '<div class="dash-tile"><div class="dash-tile-label">Земельные участки</div><div class="dash-tile-value">' + dFmt2(s.areaKop) + ' <small>м² сдано</small></div>'
      + '<div class="dash-tile-note">' + (s.areaN < s.n ? 'площадь не указана у ' + dContracts(s.n - s.areaN) : 'общая площадь объекта считается для помещений') + '</div></div>';
  }
  const edit = editId ? ' <span class="dash-edit" data-edit-area="' + editId + '" title="Изменить общую площадь объекта" style="font-size:12px;font-weight:400;margin-left:6px;">изменить</span>' : '';
  if (!s.totalN) {
    return '<div class="dash-tile"><div class="dash-tile-label">Общая площадь</div><div class="dash-tile-value">' + dFmt2(s.areaKop) + ' <small>м² сдано</small></div>'
      + '<div class="dash-tile-note">общая площадь не указана' + (editId ? ' — <span class="dash-edit" data-edit-area="' + editId + '">указать</span>' : '') + '</div></div>';
  }
  const free = s.totalKop - s.areaKop;
  return '<div class="dash-tile"><div class="dash-tile-label">Общая площадь</div>'
    + '<div class="dash-tile-value">' + dFmt2(s.areaKop) + ' <small>из ' + dFmt2(s.totalKop) + ' м² сдано</small>' + edit + '</div>'
    + '<div class="dash-track"><div class="dash-fill" style="width:' + Math.min(100, Math.round(s.areaKop / s.totalKop * 100)) + '%;"></div></div>'
    + '<div class="dash-tile-note"><span class="' + (free < 0 ? 'dash-bad' : '') + '">свободно ' + dFmt2(free) + ' м²</span>'
    + (objCount && s.totalN < objCount ? ' · общая площадь указана у ' + s.totalN + ' из ' + objCount + ' объектов' : '')
    + (s.areaN < s.areaOf ? ' · площадь не указана у ' + dContracts(s.areaOf - s.areaN) : '') + '</div></div>';
}
function moneyTile(s) {
  return '<div class="dash-tile"><div class="dash-tile-label">Доход в месяц</div><div class="dash-tile-value">' + dMoney(s.rentKop + s.utilKop) + '</div>'
    + '<div class="dash-tile-note">аренда ' + dMoney(s.rentKop) + '<br>эксплуатационный сбор ' + dMoney(s.utilKop)
    + (s.noPrice ? '<br><span class="dash-warn">без цены: ' + dContracts(s.noPrice) + '</span>' : '') + '</div></div>';
}
function contractsTile(active, forming, completed) {
  return '<div class="dash-tile"><div class="dash-tile-label">Договоры</div><div class="dash-tile-value">' + active + ' <small>' + dNoun(active, 'действует', 'действуют', 'действуют') + '</small></div>'
    + '<div class="dash-tile-note">оформляются: ' + forming + '<br>в архиве: ' + completed + '</div></div>';
}
function depositTile(s) {
  return '<div class="dash-tile"><div class="dash-tile-label">Обеспечительные платежи</div><div class="dash-tile-value">' + dMoney(s.depKop) + '</div>'
    + '<div class="dash-tile-note">указаны у ' + s.depN + ' из ' + dOfContracts(s.n) + '</div></div>';
}
function kindsTile(active) {
  const by = {};
  active.forEach(function(r) {
    const k = kindOf(r), x = by[k] || (by[k] = { n: 0, areaKop: 0, areaN: 0, monthly: 0 });
    x.n++;
    const a = dKop(r.area_sqm), m = monthlyKop(r);
    if (a !== null) { x.areaKop += a; x.areaN++; }
    if (m !== null) x.monthly += m;
  });
  // таблица: вид (и пометка о неполной площади) | площадь | в месяц | ссылка в реестр; на телефоне — вид и площадь
  const cells = DASH_KINDS.filter(function(k) { return by[k.v]; }).map(function(k) {
    const x = by[k.v];
    const on = dashState.kind === kindKey(k.v);
    const a = ' data-act="kind" data-kind="' + dEsc(on ? '' : kindKey(k.v)) + '" title="' + (on ? 'Показать все виды' : 'Показать только ' + dEsc(k.many.toLowerCase())) + '"';
    const cls = on ? ' class="on"' : '';
    return '<div' + a + cls + '><span style="color:' + k.color + ';font-weight:600;">' + dEsc(k.v ? kindTxt(k, x.n) : k.many + ': ' + dContracts(x.n)) + '</span>'
        + (x.areaN && x.areaN < x.n ? '<div class="dash-sub">площадь указана у ' + x.areaN + ' из ' + dOfContracts(x.n) + '</div>' : '') + '</div>'
      + '<div' + a + ' class="num' + (on ? ' on' : '') + '">' + (x.areaN ? dFmt2(x.areaKop) + ' м²' : '<span class="dash-warn">не указана</span>') + '</div>'
      + '<div' + a + ' class="num kx' + (on ? ' on' : '') + '">' + dMoney(x.monthly) + '</div>'
      + '<div class="num kx' + (on ? ' on' : '') + '"><a data-go="kind=' + encodeURIComponent(kindKey(k.v)) + '" title="Открыть эти договоры в реестре" style="color:#1c2d58;">договоры →</a></div>';
  }).join('');
  return '<div class="dash-tile dash-wide"><div class="dash-tile-label">По видам объектов</div>'
    + (cells ? '<div class="dash-kinds"><div class="kh">Вид</div><div class="kh num">Площадь</div><div class="kh num kx">В месяц</div><div class="kh kx"></div>' + cells + '</div>' : '<div class="dash-empty">Договоров нет</div>') + '</div>';
}
function attentionTile(s) {
  const bad = DASH_STATUS.filter(function(x) { return x.v && x.v !== '3_ok' && s.status[x.v]; });
  const total = bad.reduce(function(a, x) { return a + s.status[x.v]; }, 0);
  return '<div class="dash-tile"><div class="dash-tile-label">Требуют внимания</div>'
    + (total ? '<div class="dash-tile-value dash-bad" data-go="status=attention" title="Открыть все эти договоры в реестре">' + dContracts(total) + '</div><div class="dash-chips">' + bad.map(function(x) { return dChip(' ' + x.label, x.color, s.status[x.v], 'status=' + x.v); }).join('') + '</div>'
      : '<div class="dash-tile-value dash-ok">нет</div><div class="dash-tile-note">все договоры в порядке или без статуса</div>')
    + '</div>';
}

function renderDashboard() {
  const d = dashState.data;
  if (!d) return;
  if (dashState.obj) renderObject(dashState.obj); else renderMain();
}

function kindSelect() {
  return '<select data-act="kindsel" class="dash-link" style="padding:3px 6px;' + (dashState.kind ? 'border-color:#1c2d58;color:#1c2d58;' : '') + '" title="Вид объекта">'
    + '<option value="">Все виды объектов</option>'
    + DASH_KINDS.map(function(k) { const key = kindKey(k.v); return '<option value="' + dEsc(key) + '"' + (dashState.kind === key ? ' selected' : '') + '>' + dEsc(k.many) + '</option>'; }).join('')
    + '</select>';
}
function headHtml(title, extra) {
  const upd = dashState.loadedAt ? new Date(dashState.loadedAt) : null;
  return '<div class="dash-head">' + extra.before + '<div class="dash-title">' + dEsc(title) + '</div>' + crmSettingsGear('Договоры') + kindSelect() + extra.after
    + '<div class="dash-sub">обновлено ' + (upd ? ('0' + upd.getHours()).slice(-2) + ':' + ('0' + upd.getMinutes()).slice(-2) : '') + '</div>'
    + '<button class="dash-link" data-act="refresh">↻ Обновить</button></div>';
}

// ---------- главный экран: общие цифры + карточки объектов ----------
function renderMain() {
  const d = dv();
  const s = summary(d.active, d.objects);
  const stats = objectStats(d);
  const used = stats.filter(function(o) { return o.active.length || o.forming || o.completed || (!dashState.kind && o.totalKop !== null); })
    .sort(function(a, b) { return b.monthly - a.monthly || b.active.length - a.active.length || a.name.localeCompare(b.name, 'ru'); });
  const empty = stats.filter(function(o) { return used.indexOf(o) === -1; }).map(function(o) { return o.name; }).sort(function(a, b) { return a.localeCompare(b, 'ru'); });
  ensureDashPanel().innerHTML = headHtml('Объекты аренды', { before: '', after: '<button class="dash-link" data-act="csv">Выгрузить в Excel</button>' })
    + '<div class="dash-tiles">' + areaTile(s, used.filter(function(o) { return o.active.length; }).length) + moneyTile(s)
    + contractsTile(d.active.length, d.forming.length, d.completed.length) + depositTile(s) + attentionTile(s) + kindsTile(dashState.data.active) + '</div>'
    + '<div class="dash-section">По объектам</div>'
    + (used.length ? '<div class="dash-objs">' + used.map(objectCard).join('') + '</div>' : '<div class="dash-empty">Договоров пока нет</div>')
    + (empty.length ? '<div class="dash-rest">Без договоров: ' + dEsc(empty.join(', ')) + '</div>' : '');
}

function objectStats(d) {
  const map = {};
  function get(name) {
    return map[name] || (map[name] = { name: name, id: null, totalKop: null, active: [], forming: 0, completed: 0, areaKop: 0, monthly: 0, deposit: 0 });
  }
  (d.objects || []).forEach(function(o) { const x = get((o.name || '').trim() || 'Без объекта'); x.id = o.id; x.totalKop = dKop(o.total_area); });
  d.active.forEach(function(r) {
    const o = get(objOf(r));
    o.active.push(r);
    const a = dKop(r.area_sqm), m = monthlyKop(r), dp = dKop(r.deposit_amount);
    if (a !== null && areaCounts(r)) o.areaKop += a;
    if (m !== null) o.monthly += m;
    if (dp !== null) o.deposit += dp;
  });
  d.forming.forEach(function(r) { get(objOf(r)).forming++; });
  d.completed.forEach(function(r) { get(objOf(r)).completed++; });
  return Object.keys(map).map(function(k) { return map[k]; });
}

// карточка объекта: только главное — сколько сдано, доход в месяц и что требует внимания
function objectCard(o) {
  const st = {};
  let noPrice = 0, term = null;
  o.active.forEach(function(r) {
    st[r.contract_status || ''] = (st[r.contract_status || ''] || 0) + 1;
    if (monthlyKop(r) === null) noPrice++;
    const t = termInfo(r);
    if (t && (!term || t.days < term.days)) term = t;
  });
  const chips = [];
  const go = function(v) { return 'status=' + v + '&obj=' + encodeURIComponent(o.name); };
  if (st['1_problem']) chips.push(dChip(' проблема', '#cf1322', st['1_problem'], go('1_problem')));
  if (term) chips.push(dChip((term.days < 0 ? 'расторжение прошло ' + dDateTxt(term.t) : 'расторжение ' + dDateTxt(term.t)), '#722ed1', undefined, go('2_terminating')));
  else if (st['2_terminating']) chips.push(dChip(' на расторжении', '#722ed1', st['2_terminating'], go('2_terminating')));
  if (st['2_docs']) chips.push(dChip(' нет документов', '#1c2d58', st['2_docs'], go('2_docs')));
  if (st['2_attention']) chips.push(dChip(' требуют внимания', '#d48806', st['2_attention'], go('2_attention')));
  if (noPrice) chips.push(dChip(' без цены', '#d46b08', noPrice));
  if (o.forming) chips.push(dChip(' оформляется', '#595959', o.forming));
  let area;
  const kc = {};
  o.active.forEach(function(r) { kc[kindOf(r)] = (kc[kindOf(r)] || 0) + 1; });
  const kinds = DASH_KINDS.filter(function(k) { return kc[k.v]; }).map(function(k) {
    return '<a data-go="kind=' + encodeURIComponent(kindKey(k.v)) + '&obj=' + encodeURIComponent(o.name) + '" title="Открыть эти договоры в реестре" style="color:' + k.color + ';">' + dEsc(k.v ? kindTxt(k, kc[k.v]) : 'без вида: ' + kc[k.v]) + '</a>';
  });
  if (dashState.kind === 'Машино-место') {
    area = '<div class="dash-obj-area">сдано машино-мест: ' + o.active.length + '</div>';
  } else if (dashState.kind === 'Земельный участок') {
    area = '<div class="dash-obj-area">сдано ' + dFmt2(o.areaKop) + ' м² земли</div>';
  } else if (o.totalKop !== null && o.totalKop > 0) {
    area = '<div class="dash-obj-area">сдано ' + dFmt2(o.areaKop) + ' из ' + dFmt2(o.totalKop) + ' м² · свободно <span class="' + (o.totalKop - o.areaKop < 0 ? 'dash-bad' : '') + '">' + dFmt2(o.totalKop - o.areaKop) + '</span></div>'
      + '<div class="dash-track"><div class="dash-fill" style="width:' + Math.min(100, Math.round(o.areaKop / o.totalKop * 100)) + '%;"></div></div>';
  } else {
    area = '<div class="dash-obj-area">сдано ' + dFmt2(o.areaKop) + ' м² · общая площадь не указана</div>';
  }
  return '<div class="dash-obj" data-obj-card="' + dEsc(o.name) + '">'
    + '<div class="dash-obj-name">' + dEsc(o.name) + '<span>' + dContracts(o.active.length) + '</span></div>'
    + '<div class="dash-obj-money">' + (o.monthly ? dMoney(o.monthly) : '—') + ' <small>в месяц</small></div>'
    + area
    + (!dashState.kind && kinds.length ? '<div class="dash-obj-area" style="color:#8c8c8c;">' + kinds.join(' · ') + '</div>' : '')
    + (chips.length ? '<div class="dash-chips">' + chips.join('') + '</div>' : (o.active.length ? '<div class="dash-chips">' + dChip('без замечаний', '#389e0d') + '</div>' : ''))
    + '</div>';
}

// ---------- экран объекта ----------
function renderObject(name) {
  const d = dv();
  const active = d.active.filter(function(r) { return objOf(r) === name; });
  const forming = d.forming.filter(function(r) { return objOf(r) === name; });
  const completedN = d.completed.filter(function(r) { return objOf(r) === name; }).length;
  const objRec = (d.objects || []).find(function(o) { return (o.name || '').trim() === name; });
  const s = summary(active, objRec ? [objRec] : []);
  const names = (d.objects || []).map(function(o) { return (o.name || '').trim(); }).filter(Boolean).sort(function(a, b) { return a.localeCompare(b, 'ru'); });
  const sel = '<select data-act="obj" class="dash-link" style="padding:3px 6px;">' + names.map(function(n) { return '<option' + (n === name ? ' selected' : '') + '>' + dEsc(n) + '</option>'; }).join('') + '</select>';

  // статусы — счётчики, нулевые приглушены
  const statusBody = '<div class="dash-status">' + DASH_STATUS.map(function(x) {
    const n = s.status[x.v] || 0;
    return '<div class="' + (n ? '' : 'zero') + '"' + (n ? ' data-go="status=' + (x.v || 'none') + '&obj=' + encodeURIComponent(name) + '" title="Открыть эти договоры в реестре"' : '') + ' style="border-color:' + x.color + '40;background:' + x.color + '0d;color:' + x.color + ';"><b>' + n + '</b><span>' + dEsc(x.label) + '</span></div>';
  }).join('') + '</div>';

  // оформление: цепочка этапов, в кружке — сколько договоров сейчас на этапе
  const stageN = DASH_STAGES.map(function() { return 0; });
  let quick = 0;
  forming.forEach(function(r) { if (r.is_quick) quick++; else stageN[Math.min(r.current_stage || 0, 5)]++; });
  const stepsBody = forming.length
    ? '<div class="dash-steps">' + DASH_STAGES.map(function(t, i) {
        const go = stageN[i] ? ' data-go="stage=' + i + '&obj=' + encodeURIComponent(name) + '" title="Открыть договоры на этом этапе"' : '';
        return '<div class="dash-step"' + go + '><div class="dash-step-dot' + (stageN[i] ? ' on' : '') + '">' + stageN[i] + '</div><div class="dash-step-lbl">' + (i + 1) + '. ' + dEsc(t) + '</div></div>';
      }).join('') + '</div>' + (quick ? '<div class="dash-tile-note" style="margin-top:10px;" data-go="stage=quick&obj=' + encodeURIComponent(name) + '">и срочных (одной формой): <a style="color:#1c2d58;">' + quick + '</a></div>' : '')
    : '<div class="dash-empty">Новых договоров в оформлении нет</div>';

  // сроки: расторжения и смены цены
  const terms = active.map(function(r) { const t = termInfo(r); return t ? { r: r, t: t } : null; }).filter(Boolean).sort(function(a, b) { return a.t.days - b.t.days; });
  const ids = {};
  active.forEach(function(r) { ids[r.id] = r; });
  const changes = [];
  d.periods.forEach(function(p) {
    const r = ids[p.contract_ref_id];
    if (!r) return;
    [['date_from', 'начинается период цены'], ['date_to', 'заканчивается период цены']].forEach(function(k) {
      const dt = dDate(p[k[0]]);
      if (!dt) return;
      if (k[0] === 'date_to') dt.setDate(dt.getDate() + 1);   // последний день периода включительно — цена меняется на следующий день
      const days = dDays(dt);
      if (days >= 0 && days <= 30) changes.push({ r: r, dt: dt, days: days, what: k[1] });
    });
  });
  changes.sort(function(a, b) { return a.days - b.days; });
  const who = function(r) { return dEsc([r.contract_number, r.tenant_name].filter(Boolean).join(' · ') || ('#' + r.id)); };
  const eventsBody = (terms.length || changes.length)
    ? terms.map(function(x) {
        return '<div class="dash-row" data-open="active:' + x.r.id + '"><div class="dash-row-main">Расторжение: ' + who(x.r) + '</div><div class="dash-row-side ' + (x.t.days <= 0 ? 'dash-bad' : x.t.days <= 30 ? 'dash-warn' : '') + '">' + termTxt(x.t) + '</div></div>';
      }).join('') + changes.map(function(x) {
        return '<div class="dash-row" data-open="active:' + x.r.id + '"><div class="dash-row-main">Цена: ' + who(x.r) + ' — ' + x.what + '</div><div class="dash-row-side">' + dDateTxt(x.dt) + (x.days ? ', через ' + dDaysTxt(x.days) : ', сегодня') + '</div></div>';
      }).join('')
    : '<div class="dash-empty">Расторжений в ближайшие 90 дней и смен цены в ближайшие 30 дней нет</div>';

  // что не заполнено — по каждому пункту номера договоров, клик открывает карточку
  const checks = [
    ['вид объекта', function(r) { return dFilled(r.object_kind); }],
    ['площадь', function(r) { return kindOf(r) === 'Машино-место' || dFilled(r.area_sqm); }],
    ['цена (аренда и сбор)', function(r) { return monthlyKop(r) !== null; }],
    ['дата заключения', function(r) { return dFilled(r.date_signed); }],
    ['акт приёма-передачи', function(r) { return dFilled(r.date_act); }],
    ['ИНН', function(r) { return dFilled(r.inn); }],
    ['банковские реквизиты', function(r) { return dFilled(r.bank_account) && dFilled(r.bik); }],
    ['статус', function(r) { return dFilled(r.contract_status); }],
    ['ответственные сотрудники', function(r) { return (r.contract_members || []).length > 0; }]
  ];
  const gaps = checks.map(function(c) { return { what: c[0], list: active.filter(function(r) { return !c[1](r); }) }; }).filter(function(g) { return g.list.length; });
  const gapsBody = !active.length ? '<div class="dash-empty">Договоров нет</div>'
    : gaps.length ? gaps.map(function(g) {
        const shown = g.list.slice(0, 8);
        return '<div class="dash-gap">Нет: <b>' + dEsc(g.what) + '</b> — ' + dContracts(g.list.length) + '<br>'
          + shown.map(function(r) { return '<a data-open="active:' + r.id + '">' + dEsc(r.contract_number || r.tenant_name || ('#' + r.id)) + '</a>'; }).join('')
          + (g.list.length > shown.length ? '<span class="dash-sub">и ещё ' + (g.list.length - shown.length) + '</span>' : '') + '</div>';
      }).join('')
    : '<div class="dash-ok" style="font-size:13px;">Все основные данные заполнены</div>';

  // договоры объекта: сначала проблемные
  const order = {};
  DASH_STATUS.forEach(function(x, i) { order[x.v] = i; });
  const rows = active.slice().sort(function(a, b) { return order[a.contract_status || ''] - order[b.contract_status || ''] || String(a.contract_number || '').localeCompare(String(b.contract_number || ''), 'ru'); });
  const listBody = rows.length ? '<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Договор</th><th>Вид</th><th>Арендатор</th><th>Статус</th><th class="num">Площадь, м²</th><th class="num">В месяц, ₽</th><th>Заключён</th><th>Расторжение</th></tr></thead><tbody>'
    + rows.map(function(r) {
        const stt = dStatus(r.contract_status), m = monthlyKop(r), ds = dDate(r.date_signed), dt = dDate(r.termination_date);
        return '<tr data-open="active:' + r.id + '"><td>' + dEsc(r.contract_number || '—') + '</td><td>' + dEsc(r.object_kind || '—') + '</td><td>' + dEsc(r.tenant_name || '—') + '</td><td>' + dChip(stt.label, stt.color) + '</td>'
          + '<td class="num">' + (dKop(r.area_sqm) === null ? '—' : dFmt2(dKop(r.area_sqm))) + '</td><td class="num">' + (m === null ? '—' : dFmt2(m)) + '</td>'
          + '<td>' + (ds ? dDateTxt(ds) : '—') + '</td><td>' + (dt ? dDateTxt(dt) : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="dash-empty">Действующих договоров нет</div>';

  ensureDashPanel().innerHTML = headHtml(name, { before: '<button class="dash-link" data-act="all">← Все объекты</button>', after: sel + '<button class="dash-link" data-act="contracts">Договоры в реестре →</button>' })
    + '<div class="dash-tiles">' + areaTile(s, 0, objRec ? objRec.id : null) + moneyTile(s) + contractsTile(active.length, forming.length, completedN) + depositTile(s) + '</div>'
    + '<div class="dash-grid">'
    + '<div class="dash-card"><div class="dash-card-title">Статусы договоров<span>' + dContracts(active.length) + '</span></div>' + statusBody + '</div>'
    + '<div class="dash-card"><div class="dash-card-title">Оформление новых договоров<span>' + forming.length + ' в работе</span></div>' + stepsBody + '</div>'
    + '<div class="dash-card"><div class="dash-card-title">Ближайшие сроки<span>расторжения — 90 дней, цены — 30 дней</span></div>' + eventsBody + '</div>'
    + '<div class="dash-card"><div class="dash-card-title">Что не заполнено<span>клик — открыть договор</span></div>' + gapsBody + '</div>'
    + '</div>'
    + '<div class="dash-card" style="margin-top:12px;"><div class="dash-card-title">Договоры объекта<span>клик — открыть карточку</span></div>' + listBody + '</div>';
}

function onDashClick(e) {
  const t = e.target;
  const c = function(sel) { return t.closest ? t.closest(sel) : null; };
  const go = c('[data-go]');
  if (go) {
    const q = go.getAttribute('data-go');
    window.location.href = REGISTRY_URL + '?' + q + (/(^|&)kind=/.test(q) ? '' : kindParam());
    return;
  }
  const act = c('[data-act]');
  if (act && act.tagName !== 'SELECT') {
    const a = act.getAttribute('data-act');
    if (a === 'refresh') refreshDashboard();
    if (a === 'all') dashSetObject('');
    if (a === 'contracts') window.location.href = REGISTRY_URL + '?obj=' + encodeURIComponent(dashState.obj) + kindParam();
    if (a === 'kind') { dashState.kind = act.getAttribute('data-kind') || ''; renderDashboard(); }
    if (a === 'csv') { try { dashExportXlsx(); } catch (err) { console.error(err); } }
    return;
  }
  const ed = c('[data-edit-area]');
  if (ed) { dashEditArea(ed); return; }
  if (c('.dash-area-input')) return;
  const oc = c('[data-obj-card]');
  if (oc) { dashSetObject(oc.getAttribute('data-obj-card')); return; }
  const op = c('[data-open]');
  if (op) window.location.href = REGISTRY_URL + '?open=' + op.getAttribute('data-open');   // карточка открывается на странице реестра
}
function kindParam() { return dashState.kind ? '&kind=' + encodeURIComponent(dashState.kind) : ''; }
function dashSetObject(name) { dashState.obj = name || ''; renderDashboard(); try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } }

// общая площадь объекта — правка прямо в плитке (Enter/уход с поля — сохранить, Esc — отмена)
function dashEditArea(el) {
  const id = el.getAttribute('data-edit-area');
  const o = (dashState.data.objects || []).find(function(x) { return String(x.id) === id; });
  if (!o) return;
  const cur = o.total_area !== null && o.total_area !== undefined ? String(o.total_area).replace('.', ',') : '';
  const box = el.closest('.dash-tile');
  const note = box.querySelector('.dash-tile-note');
  note.innerHTML = 'Общая площадь объекта, м²: <input class="dash-area-input" inputmode="decimal" style="width:110px;text-align:right;border:1px solid #1c2d58;border-radius:4px;padding:2px 6px;font:inherit;" value="' + dEsc(cur) + '">';
  const inp = note.querySelector('input');
  inp.focus(); inp.select();
  let done = false;
  async function save(commit) {
    if (done) return; done = true;
    const raw = inp.value.replace(/\s/g, '').replace(',', '.');
    if (!commit || raw === cur.replace(',', '.')) { renderDashboard(); return; }
    if (raw !== '' && !/^\d+(\.\d{1,2})?$/.test(raw)) { done = false; inp.style.borderColor = '#ff4d4f'; inp.title = 'Только число, до 2 знаков после запятой'; return; }
    const val = raw === '' ? null : Number(raw);
    try {
      await ctx.api.resource('contract_objects').update({ filterByTk: Number(id), values: { total_area: val } });
      o.total_area = val;
    } catch (e) { /* нет прав — значение не меняется */ }
    renderDashboard();
  }
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') save(true); if (e.key === 'Escape') save(false); });
  inp.addEventListener('blur', function() { save(true); });
}

// выгрузка дашборда в Excel — общий вид выгрузок CRM (src/_crm-xlsx.js); цифры те же, что на экране (копейки → рубли без округлений)
function dashExportXlsx() {
  const d = dv();
  if (!d) return;
  const rub = function(k) { return k === null || k === undefined ? null : k / 100; };
  const kindLbl = dashState.kind ? (DASH_KINDS.find(function(k) { return kindKey(k.v) === dashState.kind; }) || { many: dashState.kind }).many : 'Все виды объектов';
  const stats = objectStats(d).sort(function(a, b) { return a.name.localeCompare(b.name, 'ru'); });
  const sm = summary(d.active, d.objects);
  const totalKop = stats.reduce(function(n, o) { return n + (o.totalKop || 0); }, 0), areaKop = stats.reduce(function(n, o) { return n + o.areaKop; }, 0);
  const cnt = function(list, v) { return list.filter(function(r) { return (r.contract_status || '') === v; }).length; };
  const attention = d.active.filter(function(r) { return (r.contract_status || '') !== '3_ok'; });
  const contractRow = function(r) {
    const m = monthlyKop(r);
    return [objOf(r), r.contract_number || '', r.tenant_name || '', kindOf(r) || '—', dStatus(r.contract_status).label, r.status_reason || '',
      rub(dKop(r.area_sqm)), rub(dKop(r.rent_amount)), rub(dKop(r.utility_amount)), rub(m), rub(dKop(r.deposit_amount)), r.date_signed || null, r.termination_date || null];
  };
  const contractCols = [{ h: 'Объект' }, { h: 'Номер договора' }, { h: 'Арендатор', w: 34 }, { h: 'Вид' }, { h: 'Статус' }, { h: 'Причина статуса', t: 'long', w: 34, total: false },
    { h: 'Площадь', t: 'area' }, { h: 'Аренда в месяц', t: 'money' }, { h: 'Эксплуатационный сбор в месяц', t: 'money' }, { h: 'Итого в месяц', t: 'money' }, { h: 'Обеспечительный платёж', t: 'money' },
    { h: 'Дата заключения', t: 'date' }, { h: 'Дата расторжения', t: 'date' }];
  const terms = d.active.map(function(r) { return { r: r, t: termInfo(r) }; }).filter(function(x) { return x.t; }).sort(function(a, b) { return a.t.days - b.t.days; });
  crmXlsx('Дашборд — объекты аренды', {
    title: 'Объекты аренды — сводка', filters: [['Вид объектов', kindLbl]],
    notes: [['Площадь', 'В м²; складываются помещения (и договоры без вида), при фильтре «Земельные участки» — участки'], ['Итого в месяц', 'Аренда + эксплуатационный сбор по договору'],
      ['Занятость, %', 'Сдано / общая площадь объекта'], ['Статус', 'Статус договора в реестре; «Требуют внимания» — все, кроме «В порядке»']],
    sheets: [
      { name: 'Сводка', title: 'Объекты аренды — главные цифры', cols: [{ h: 'Показатель', w: 34 }, { h: 'Значение', w: 22 }, { h: 'Комментарий', t: 'long', w: 60 }],
        rows: [
          ['Общая площадь объектов, м²', totalKop ? dFmt2(totalKop) : '—', ''],
          ['Сдано, м²', dFmt2(areaKop), 'по действующим договорам'],
          ['Свободно, м²', totalKop ? dFmt2(totalKop - areaKop) : '—', ''],
          ['Занятость', totalKop ? String(Math.round(1000 * areaKop / totalKop) / 10).replace('.', ',') + '%' : '—', ''],
          ['Доход в месяц, ₽', dFmt2(sm.rentKop + sm.utilKop), 'аренда ' + dFmt2(sm.rentKop) + ' ₽ + эксплуатационный сбор ' + dFmt2(sm.utilKop) + ' ₽' + (sm.noPrice ? '; без цены: ' + dContracts(sm.noPrice) : '')],
          ['Обеспечительные платежи, ₽', dFmt2(sm.depKop), 'указаны у ' + sm.depN + ' из ' + dOfContracts(sm.n)],
          ['Действующие договоры', String(d.active.length), ''], ['Оформляются', String(d.forming.length), ''], ['В архиве', String(d.completed.length), ''],
          ['Требуют внимания', String(attention.length), DASH_STATUS.filter(function(x) { return x.v !== '3_ok' && cnt(d.active, x.v); }).map(function(x) { return x.label + ': ' + cnt(d.active, x.v); }).join('; ')]
        ] },
      { name: 'По объектам', title: 'Объекты аренды — по объектам', total: true, freezeCols: 1,
        cols: [{ h: 'Объект' }, { h: 'Действующие договоры', t: 'int' }, { h: 'Оформляются', t: 'int' }, { h: 'В архиве', t: 'int' }, { h: 'Общая площадь', t: 'area' }, { h: 'Сдано', t: 'area' }, { h: 'Свободно', t: 'area' },
          { h: 'Занятость, %', t: 'pct', total: totalKop ? Math.round(1000 * areaKop / totalKop) / 10 : false }, { h: 'В месяц', t: 'money' }, { h: 'Обеспечительные', t: 'money' }]
          .concat(DASH_STATUS.map(function(x) { return { h: x.label, t: 'int' }; })).concat(DASH_KINDS.map(function(k) { return { h: k.many, t: 'int' }; })),
        rows: stats.map(function(o) {
          return [o.name, o.active.length, o.forming, o.completed, rub(o.totalKop), rub(o.areaKop), o.totalKop === null ? null : rub(o.totalKop - o.areaKop),
            o.totalKop ? Math.round(1000 * o.areaKop / o.totalKop) / 10 : null, rub(o.monthly), rub(o.deposit)]
            .concat(DASH_STATUS.map(function(x) { return cnt(o.active, x.v); })).concat(DASH_KINDS.map(function(k) { return o.active.filter(function(r) { return kindOf(r) === k.v; }).length; }));
        }) },
      { name: 'Действующие договоры', title: 'Действующие договоры', total: true, freezeCols: 1, cols: contractCols,
        rows: d.active.slice().sort(function(a, b) { return objOf(a).localeCompare(objOf(b), 'ru') || String(a.contract_number || '').localeCompare(String(b.contract_number || ''), 'ru'); }).map(contractRow) },
      { name: 'Требуют внимания', title: 'Договоры, требующие внимания', total: true, freezeCols: 1, cols: contractCols,
        rows: attention.slice().sort(function(a, b) { return String(a.contract_status || '').localeCompare(String(b.contract_status || '')); }).map(contractRow) },
      { name: 'Ближайшие расторжения', title: 'Расторжения в ближайшие 90 дней (и уже прошедшие у действующих)',
        cols: [{ h: 'Дата расторжения', t: 'date' }, { h: 'Через, дней', t: 'int' }, { h: 'Объект' }, { h: 'Номер договора' }, { h: 'Арендатор', w: 34 }, { h: 'Площадь', t: 'area' }, { h: 'Итого в месяц', t: 'money' }],
        rows: terms.map(function(x) { return [x.r.termination_date, x.t.days, objOf(x.r), x.r.contract_number || '', x.r.tenant_name || '', rub(dKop(x.r.area_sqm)), rub(monthlyKop(x.r))]; }) }
    ]
  });
}
