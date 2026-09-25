// Страница «Дашборд» (/admin/dashpage01, блок dashblock001): сводка по объектам аренды.
// Главный экран — общие цифры и карточки объектов; клик по карточке — экран объекта (статусы, оформление, договоры, сроки, пробелы в данных).
// Всё считается в браузере из тех же коллекций, что и реестр (права те же). Суммы — в целых копейках, без округлений и средних:
// правило владельца «ни одного примерного числа». Шкала — только там, где есть доля от целого (сдано из общей площади).
// Доступ к странице — через права ролей на пункт меню (сейчас только admin).
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
    #cm-dash-panel .dash-link:hover { border-color:#1677ff; color:#1677ff; }
    #cm-dash-panel .dash-section { font-size:15px; font-weight:700; margin:18px 0 10px; }
    #cm-dash-panel .dash-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; }
    #cm-dash-panel .dash-tile { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; }
    #cm-dash-panel .dash-tile-label { font-size:12px; color:#8c8c8c; margin-bottom:4px; }
    #cm-dash-panel .dash-tile-value { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; line-height:1.25; }
    #cm-dash-panel .dash-tile-value small { font-size:13px; font-weight:400; color:#8c8c8c; }
    #cm-dash-panel .dash-tile-note { font-size:12px; color:#8c8c8c; margin-top:4px; line-height:1.45; }
    #cm-dash-panel .dash-track { height:8px; background:#f0f0f0; border-radius:4px; overflow:hidden; margin-top:8px; }
    #cm-dash-panel .dash-fill { height:100%; background:#1677ff; border-radius:0 4px 4px 0; }
    #cm-dash-panel .dash-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
    #cm-dash-panel .dash-chip { display:inline-flex; align-items:center; gap:5px; padding:1px 8px; border-radius:10px; font-size:12px; border:1px solid; white-space:nowrap; }
    #cm-dash-panel .dash-chip b { font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-ok { color:#389e0d; }
    #cm-dash-panel .dash-warn { color:#d46b08; }
    #cm-dash-panel .dash-bad { color:#cf1322; }
    #cm-dash-panel .dash-empty { font-size:12.5px; color:#bfbfbf; padding:4px 0; }
    /* карточки объектов */
    #cm-dash-panel .dash-objs { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:10px; }
    #cm-dash-panel .dash-obj { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; cursor:pointer; transition:border-color .12s, box-shadow .12s; display:flex; flex-direction:column; }
    #cm-dash-panel .dash-obj:hover { border-color:#91caff; box-shadow:0 2px 8px rgba(22,119,255,.08); }
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
    #cm-dash-panel .dash-step-dot.on { background:#1677ff; border-color:#1677ff; color:#fff; }
    #cm-dash-panel .dash-step-lbl { font-size:11.5px; color:#595959; text-align:center; margin-top:6px; line-height:1.3; padding:0 2px; }
    #cm-dash-panel .dash-row { display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-top:1px solid #f5f5f5; font-size:13px; }
    #cm-dash-panel .dash-row:first-child { border-top:none; }
    #cm-dash-panel [data-open] { cursor:pointer; }
    #cm-dash-panel [data-open]:hover { color:#1677ff; }
    #cm-dash-panel .dash-row-main { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #cm-dash-panel .dash-row-side { flex-shrink:0; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-gap { font-size:13px; padding:6px 0; border-top:1px solid #f5f5f5; }
    #cm-dash-panel .dash-gap:first-child { border-top:none; }
    #cm-dash-panel .dash-gap a { color:#1677ff; cursor:pointer; margin-right:6px; }
    #cm-dash-panel .dash-table-wrap { overflow-x:auto; }
    #cm-dash-panel table.dash-table { width:100%; border-collapse:collapse; font-size:13px; }
    #cm-dash-panel .dash-table th { text-align:left; font-weight:600; color:#595959; padding:7px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    #cm-dash-panel .dash-table td { padding:7px 8px; border-bottom:1px solid #f5f5f5; white-space:nowrap; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-table .num { text-align:right; }
    #cm-dash-panel .dash-table tbody tr:hover td { background:#f5faff; }
    #cm-dash-panel .dash-edit { color:#1677ff; cursor:pointer; }
    @media (max-width: 700px) {
      #cm-dash-panel .dash-grid { grid-template-columns:1fr; }
      #cm-dash-panel .dash-steps { flex-direction:column; align-items:stretch; gap:6px; }
      #cm-dash-panel .dash-step { flex-direction:row; gap:10px; }
      #cm-dash-panel .dash-step::after { display:none; }
      #cm-dash-panel .dash-step-lbl { margin-top:0; text-align:left; }
    }
  `;
  document.head.appendChild(st);
}

// статусы — от худшего к лучшему (порядок и цвета как в карточке договора)
const DASH_STATUS = [
  { v: '1_problem', label: 'Проблема', color: '#cf1322' },
  { v: '2_terminating', label: 'На расторжении', color: '#722ed1' },
  { v: '2_docs', label: 'Не хватает документов', color: '#1677ff' },
  { v: '2_attention', label: 'Требует внимания', color: '#d48806' },
  { v: '3_ok', label: 'В порядке', color: '#389e0d' },
  { v: '', label: 'Статус не задан', color: '#8c8c8c' }
];
const DASH_STAGES = ['Заявка', 'Объявление', 'Условия', 'Подписание', 'Оплата счетов', 'Акт и скан'];
const dashState = { data: null, loadedAt: null, loading: null, obj: '' };
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
function dDaysTxt(n) { return n + ' ' + dNoun(n, 'день', 'дня', 'дней'); }
function dFilled(v) { return !(v === null || v === undefined || String(v).trim() === ''); }
function dStatus(v) { return DASH_STATUS.find(function(s) { return s.v === (v || ''); }) || DASH_STATUS[DASH_STATUS.length - 1]; }
function dChip(text, color, num) {
  return '<span class="dash-chip" style="color:' + color + ';border-color:' + color + '40;background:' + color + '0d;">' + (num !== undefined ? '<b>' + num + '</b>' : '') + dEsc(text) + '</span>';
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
  const s = { n: active.length, areaKop: 0, areaN: 0, rentKop: 0, rentN: 0, utilKop: 0, utilN: 0, depKop: 0, depN: 0, noPrice: 0, totalKop: 0, totalN: 0, status: {} };
  active.forEach(function(r) {
    const a = dKop(r.area_sqm), re = dKop(r.rent_amount), u = dKop(r.utility_amount), dp = dKop(r.deposit_amount);
    if (a !== null) { s.areaKop += a; s.areaN++; }
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
  const edit = editId ? ' <span class="dash-edit" data-edit-area="' + editId + '" title="Изменить общую площадь объекта">✎</span>' : '';
  if (!s.totalN) {
    return '<div class="dash-tile"><div class="dash-tile-label">Площадь</div><div class="dash-tile-value">' + dFmt2(s.areaKop) + ' <small>м² сдано</small></div>'
      + '<div class="dash-tile-note">общая площадь не указана' + (editId ? ' — <span class="dash-edit" data-edit-area="' + editId + '">указать</span>' : '') + '</div></div>';
  }
  const free = s.totalKop - s.areaKop;
  return '<div class="dash-tile"><div class="dash-tile-label">Площадь</div>'
    + '<div class="dash-tile-value">' + dFmt2(s.areaKop) + ' <small>из ' + dFmt2(s.totalKop) + ' м² сдано</small>' + edit + '</div>'
    + '<div class="dash-track"><div class="dash-fill" style="width:' + Math.min(100, Math.round(s.areaKop / s.totalKop * 100)) + '%;"></div></div>'
    + '<div class="dash-tile-note"><span class="' + (free < 0 ? 'dash-bad' : '') + '">свободно ' + dFmt2(free) + ' м²</span>'
    + (objCount && s.totalN < objCount ? ' · общая площадь указана у ' + s.totalN + ' из ' + objCount + ' объектов' : '')
    + (s.areaN < s.n ? ' · площадь не указана у ' + dContracts(s.n - s.areaN) : '') + '</div></div>';
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
    + '<div class="dash-tile-note">указаны у ' + s.depN + ' из ' + dContracts(s.n) + '</div></div>';
}
function attentionTile(s) {
  const bad = DASH_STATUS.filter(function(x) { return x.v && x.v !== '3_ok' && s.status[x.v]; });
  const total = bad.reduce(function(a, x) { return a + s.status[x.v]; }, 0);
  return '<div class="dash-tile"><div class="dash-tile-label">Требуют внимания</div>'
    + (total ? '<div class="dash-tile-value dash-bad">' + dContracts(total) + '</div><div class="dash-chips">' + bad.map(function(x) { return dChip(' ' + x.label, x.color, s.status[x.v]); }).join('') + '</div>'
      : '<div class="dash-tile-value dash-ok">нет</div><div class="dash-tile-note">все договоры в порядке или без статуса</div>')
    + '</div>';
}

function renderDashboard() {
  const d = dashState.data;
  if (!d) return;
  if (dashState.obj) renderObject(dashState.obj); else renderMain();
}

function headHtml(title, extra) {
  const upd = dashState.loadedAt ? new Date(dashState.loadedAt) : null;
  return '<div class="dash-head">' + extra.before + '<div class="dash-title">' + dEsc(title) + '</div>' + extra.after
    + '<div class="dash-sub">обновлено ' + (upd ? ('0' + upd.getHours()).slice(-2) + ':' + ('0' + upd.getMinutes()).slice(-2) : '') + '</div>'
    + '<button class="dash-link" data-act="refresh">↻ Обновить</button></div>';
}

// ---------- главный экран: общие цифры + карточки объектов ----------
function renderMain() {
  const d = dashState.data;
  const s = summary(d.active, d.objects);
  const stats = objectStats(d);
  const used = stats.filter(function(o) { return o.active.length || o.forming || o.completed || o.totalKop !== null; })
    .sort(function(a, b) { return b.monthly - a.monthly || b.active.length - a.active.length || a.name.localeCompare(b.name, 'ru'); });
  const empty = stats.filter(function(o) { return used.indexOf(o) === -1; }).map(function(o) { return o.name; }).sort(function(a, b) { return a.localeCompare(b, 'ru'); });
  ensureDashPanel().innerHTML = headHtml('Объекты аренды', { before: '', after: '<button class="dash-link" data-act="csv">Выгрузить в Excel</button>' })
    + '<div class="dash-tiles">' + areaTile(s, used.filter(function(o) { return o.active.length; }).length) + moneyTile(s)
    + contractsTile(d.active.length, d.forming.length, d.completed.length) + depositTile(s) + attentionTile(s) + '</div>'
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
    if (a !== null) o.areaKop += a;
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
  if (st['1_problem']) chips.push(dChip(' проблема', '#cf1322', st['1_problem']));
  if (term) chips.push(dChip((term.days < 0 ? 'расторжение прошло ' + dDateTxt(term.t) : 'расторжение ' + dDateTxt(term.t)), '#722ed1'));
  else if (st['2_terminating']) chips.push(dChip(' на расторжении', '#722ed1', st['2_terminating']));
  if (st['2_docs']) chips.push(dChip(' нет документов', '#1677ff', st['2_docs']));
  if (st['2_attention']) chips.push(dChip(' требуют внимания', '#d48806', st['2_attention']));
  if (noPrice) chips.push(dChip(' без цены', '#d46b08', noPrice));
  if (o.forming) chips.push(dChip(' оформляется', '#595959', o.forming));
  let area;
  if (o.totalKop !== null && o.totalKop > 0) {
    area = '<div class="dash-obj-area">сдано ' + dFmt2(o.areaKop) + ' из ' + dFmt2(o.totalKop) + ' м² · свободно <span class="' + (o.totalKop - o.areaKop < 0 ? 'dash-bad' : '') + '">' + dFmt2(o.totalKop - o.areaKop) + '</span></div>'
      + '<div class="dash-track"><div class="dash-fill" style="width:' + Math.min(100, Math.round(o.areaKop / o.totalKop * 100)) + '%;"></div></div>';
  } else {
    area = '<div class="dash-obj-area">сдано ' + dFmt2(o.areaKop) + ' м² · общая площадь не указана</div>';
  }
  return '<div class="dash-obj" data-obj-card="' + dEsc(o.name) + '">'
    + '<div class="dash-obj-name">' + dEsc(o.name) + '<span>' + dContracts(o.active.length) + '</span></div>'
    + '<div class="dash-obj-money">' + (o.monthly ? dMoney(o.monthly) : '—') + ' <small>в месяц</small></div>'
    + area
    + (chips.length ? '<div class="dash-chips">' + chips.join('') + '</div>' : (o.active.length ? '<div class="dash-chips">' + dChip('без замечаний', '#389e0d') + '</div>' : ''))
    + '</div>';
}

// ---------- экран объекта ----------
function renderObject(name) {
  const d = dashState.data;
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
    return '<div class="' + (n ? '' : 'zero') + '" style="border-color:' + x.color + '40;background:' + x.color + '0d;color:' + x.color + ';"><b>' + n + '</b><span>' + dEsc(x.label) + '</span></div>';
  }).join('') + '</div>';

  // оформление: цепочка этапов, в кружке — сколько договоров сейчас на этапе
  const stageN = DASH_STAGES.map(function() { return 0; });
  let quick = 0;
  forming.forEach(function(r) { if (r.is_quick) quick++; else stageN[Math.min(r.current_stage || 0, 5)]++; });
  const stepsBody = forming.length
    ? '<div class="dash-steps">' + DASH_STAGES.map(function(t, i) {
        return '<div class="dash-step"><div class="dash-step-dot' + (stageN[i] ? ' on' : '') + '">' + stageN[i] + '</div><div class="dash-step-lbl">' + (i + 1) + '. ' + dEsc(t) + '</div></div>';
      }).join('') + '</div>' + (quick ? '<div class="dash-tile-note" style="margin-top:10px;">и срочных (одной формой): ' + quick + '</div>' : '')
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
    ['площадь', function(r) { return dFilled(r.area_sqm); }],
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
  const listBody = rows.length ? '<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Договор</th><th>Арендатор</th><th>Статус</th><th class="num">Площадь, м²</th><th class="num">В месяц, ₽</th><th>Заключён</th><th>Расторжение</th></tr></thead><tbody>'
    + rows.map(function(r) {
        const stt = dStatus(r.contract_status), m = monthlyKop(r), ds = dDate(r.date_signed), dt = dDate(r.termination_date);
        return '<tr data-open="active:' + r.id + '"><td>' + dEsc(r.contract_number || '—') + '</td><td>' + dEsc(r.tenant_name || '—') + '</td><td>' + dChip(stt.label, stt.color) + '</td>'
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
  const act = c('[data-act]');
  if (act && act.tagName !== 'SELECT') {
    const a = act.getAttribute('data-act');
    if (a === 'refresh') refreshDashboard();
    if (a === 'all') dashSetObject('');
    if (a === 'contracts') window.location.href = REGISTRY_URL + '?obj=' + encodeURIComponent(dashState.obj);
    if (a === 'csv') dashExportCsv();
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
function dashSetObject(name) { dashState.obj = name || ''; renderDashboard(); try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } }

// общая площадь объекта — правка прямо в плитке (Enter/уход с поля — сохранить, Esc — отмена)
function dashEditArea(el) {
  const id = el.getAttribute('data-edit-area');
  const o = (dashState.data.objects || []).find(function(x) { return String(x.id) === id; });
  if (!o) return;
  const cur = o.total_area !== null && o.total_area !== undefined ? String(o.total_area).replace('.', ',') : '';
  const box = el.closest('.dash-tile');
  const note = box.querySelector('.dash-tile-note');
  note.innerHTML = 'Общая площадь объекта, м²: <input class="dash-area-input" inputmode="decimal" style="width:110px;text-align:right;border:1px solid #1677ff;border-radius:4px;padding:2px 6px;font:inherit;" value="' + dEsc(cur) + '">';
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

// выгрузка сводки по объектам в CSV (открывается в Excel: разделитель «;», BOM для кириллицы)
function dashExportCsv() {
  const d = dashState.data;
  if (!d) return;
  const stats = objectStats(d).sort(function(a, b) { return a.name.localeCompare(b.name, 'ru'); });
  const f2 = function(k) { return k === null || k === undefined ? '' : (k / 100).toFixed(2).replace('.', ','); };
  const q = function(x) { return '"' + String(x).replace(/"/g, '""') + '"'; };
  const cnt = function(o, v) { return o.active.filter(function(r) { return (r.contract_status || '') === v; }).length; };
  const head = ['Объект', 'Действующие договоры', 'Оформляются', 'В архиве', 'Общая площадь, м²', 'Сдано, м²', 'Свободно, м²', 'В месяц, ₽', 'Обеспечительные, ₽']
    .concat(DASH_STATUS.map(function(x) { return x.label; }));
  const lines = [head.map(q).join(';')];
  stats.forEach(function(o) {
    lines.push([q(o.name), o.active.length, o.forming, o.completed, f2(o.totalKop), f2(o.areaKop), o.totalKop === null ? '' : f2(o.totalKop - o.areaKop), f2(o.monthly), f2(o.deposit)]
      .concat(DASH_STATUS.map(function(x) { return cnt(o, x.v); })).join(';'));
  });
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  const t = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = 'Объекты ' + ('0' + t.getDate()).slice(-2) + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + t.getFullYear() + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
}
