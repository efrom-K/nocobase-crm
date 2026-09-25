// Страница «Дашборд» (/admin/dashpage01, блок dashblock001): сводка по объектам аренды.
// Всё считается в браузере из тех же коллекций, что и реестр (права те же). Суммы — в целых копейках, без округлений и средних:
// правило владельца «ни одного примерного числа». Объект выбирается списком в шапке или кликом по строке таблицы объектов.
// Доступ к странице — через права ролей на пункт меню (сейчас только admin).
if (!document.getElementById('cm-dash-style')) {
  const st = document.createElement('style');
  st.id = 'cm-dash-style';
  st.textContent = `
    #cm-dash-panel { padding: 4px 0 12px; color: #1f1f1f; }
    #cm-dash-panel .dash-list-row[style*="default"]:hover { color: inherit; }
    #cm-dash-panel .dash-head { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
    #cm-dash-panel .dash-title { font-size:18px; font-weight:700; }
    #cm-dash-panel .dash-sub { font-size:12px; color:#8c8c8c; }
    #cm-dash-panel .dash-link { border:1px solid #d9d9d9; background:#fff; color:#262626; border-radius:6px; padding:3px 10px; font-size:12.5px; cursor:pointer; }
    #cm-dash-panel .dash-link:hover { border-color:#1677ff; color:#1677ff; }
    #cm-dash-panel .dash-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:10px; margin-bottom:12px; }
    #cm-dash-panel .dash-tile { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; }
    #cm-dash-panel .dash-tile-label { font-size:12px; color:#8c8c8c; margin-bottom:4px; }
    #cm-dash-panel .dash-tile-value { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; line-height:1.25; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    #cm-dash-panel .dash-tile-note { font-size:11.5px; color:#8c8c8c; margin-top:3px; }
    #cm-dash-panel .dash-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:12px; margin-bottom:12px; }
    #cm-dash-panel .dash-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; }
    #cm-dash-panel .dash-card-title { font-size:14px; font-weight:600; margin-bottom:10px; display:flex; justify-content:space-between; gap:8px; }
    #cm-dash-panel .dash-card-title span { font-weight:400; font-size:12px; color:#8c8c8c; }
    #cm-dash-panel .dash-hbar { display:grid; grid-template-columns:170px 1fr 44px; align-items:center; gap:8px; font-size:13px; margin:5px 0; }
    #cm-dash-panel .dash-hbar-track { height:10px; background:#f5f5f5; border-radius:4px; overflow:hidden; }
    #cm-dash-panel .dash-hbar-fill { height:100%; border-radius:0 4px 4px 0; min-width:2px; }
    #cm-dash-panel .dash-hbar-num { text-align:right; font-variant-numeric:tabular-nums; color:#595959; }
    #cm-dash-panel .dash-cols { display:flex; align-items:flex-end; gap:4px; height:120px; padding-top:14px; }
    #cm-dash-panel .dash-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; cursor:default; position:relative; }
    #cm-dash-panel .dash-col-bar { width:70%; max-width:26px; background:#1677ff; border-radius:4px 4px 0 0; min-height:2px; }
    #cm-dash-panel .dash-col:hover .dash-col-bar { background:#0958d9; }
    #cm-dash-panel .dash-col-num { font-size:11px; color:#595959; margin-bottom:2px; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-col-lbl { display:flex; gap:4px; }
    #cm-dash-panel .dash-col-lbl div { flex:1; text-align:center; font-size:10.5px; color:#8c8c8c; margin-top:4px; }
    #cm-dash-panel .dash-list-row { display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-top:1px solid #f5f5f5; font-size:13px; cursor:pointer; }
    #cm-dash-panel .dash-list-row:first-child { border-top:none; }
    #cm-dash-panel .dash-list-row:hover { color:#1677ff; }
    #cm-dash-panel .dash-list-main { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #cm-dash-panel .dash-list-side { flex-shrink:0; font-variant-numeric:tabular-nums; }
    #cm-dash-panel .dash-empty { font-size:12.5px; color:#bfbfbf; padding:6px 0; }
    #cm-dash-panel .dash-pill { display:inline-block; padding:0 8px; border-radius:10px; font-size:11.5px; border:1px solid; }
    #cm-dash-panel .dash-table-wrap { overflow-x:auto; }
    #cm-dash-panel table.dash-table { width:100%; border-collapse:collapse; font-size:13px; }
    #cm-dash-panel .dash-table th { text-align:right; font-weight:600; color:#595959; padding:7px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; cursor:pointer; user-select:none; }
    #cm-dash-panel .dash-table th:first-child, #cm-dash-panel .dash-table td:first-child { text-align:left; }
    #cm-dash-panel .dash-table td { text-align:right; padding:7px 8px; border-bottom:1px solid #f5f5f5; font-variant-numeric:tabular-nums; white-space:nowrap; }
    #cm-dash-panel .dash-table tbody tr { cursor:pointer; }
    #cm-dash-panel .dash-table tbody tr:hover td { background:#f5faff; }
    #cm-dash-panel .dash-table tfoot td { font-weight:700; border-top:1px solid #f0f0f0; border-bottom:none; }
    #cm-dash-panel .dash-warn { color:#d46b08; }
    #cm-dash-panel .dash-bad { color:#cf1322; }
    @media (max-width: 700px) { #cm-dash-panel .dash-grid { grid-template-columns:1fr; } #cm-dash-panel .dash-hbar { grid-template-columns:120px 1fr 36px; } }
  `;
  document.head.appendChild(st);
}

const DASH_STATUS = [
  { v: '1_problem', label: 'Проблема', color: '#cf1322' },
  { v: '2_terminating', label: 'На расторжении', color: '#722ed1' },
  { v: '2_docs', label: 'Не хватает документов', color: '#1677ff' },
  { v: '2_attention', label: 'Требует внимания', color: '#d48806' },
  { v: '3_ok', label: 'В порядке', color: '#389e0d' },
  { v: '', label: 'Статус не задан', color: '#bfbfbf' }
];
const DASH_STAGES = ['Заявка на аренду', 'Размещение объявления', 'Согласование условий', 'Подписание договора', 'Оплата счетов', 'Финал (Акт и Скан)'];
const dashState = { data: null, loadedAt: null, loading: null, sortKey: 'monthly', sortDir: -1, obj: '' };
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
function dFilled(v) { return !(v === null || v === undefined || String(v).trim() === ''); }

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
function objectStats(active, forming, completed, objects) {
  const map = {};
  function get(name) {
    return map[name] || (map[name] = { name: name, id: null, totalKop: null, freeKop: null, active: 0, forming: 0, completed: 0, areaKop: 0, monthly: 0, deposit: 0, problem: 0, terminating: 0, incomplete: 0 });
  }
  (objects || []).forEach(function(o) { const x = get((o.name || '').trim() || 'Без объекта'); x.id = o.id; x.totalKop = dKop(o.total_area); });
  active.forEach(function(r) {
    const o = get(objOf(r));
    o.active++;
    const area = dKop(r.area_sqm), m = monthlyKop(r), dep = dKop(r.deposit_amount);
    if (area !== null) o.areaKop += area;
    if (m !== null) o.monthly += m;
    if (dep !== null) o.deposit += dep;
    if (area === null || m === null) o.incomplete++;
    if (r.contract_status === '1_problem') o.problem++;
    if (r.contract_status === '2_terminating') o.terminating++;
  });
  forming.forEach(function(r) { get(objOf(r)).forming++; });
  completed.forEach(function(r) { get(objOf(r)).completed++; });
  return Object.keys(map).map(function(k) { const o = map[k]; if (o.totalKop !== null) o.freeKop = o.totalKop - o.areaKop; return o; });
}

function tile(label, value, note, cls) {
  return '<div class="dash-tile"><div class="dash-tile-label">' + dEsc(label) + '</div><div class="dash-tile-value' + (cls ? ' ' + cls : '') + '" title="' + dEsc(value) + '">' + dEsc(value) + '</div>'
    + (note ? '<div class="dash-tile-note">' + dEsc(note) + '</div>' : '') + '</div>';
}
function card(title, side, body) {
  return '<div class="dash-card"><div class="dash-card-title">' + dEsc(title) + (side ? '<span>' + dEsc(side) + '</span>' : '') + '</div>' + body + '</div>';
}
function hbar(label, n, max, color, title) {
  const w = max ? Math.max(n ? 2 : 0, Math.round(n / max * 100)) : 0;
  return '<div class="dash-hbar" title="' + dEsc(title || (label + ': ' + n)) + '"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + dEsc(label) + '</div>'
    + '<div class="dash-hbar-track"><div class="dash-hbar-fill" style="width:' + w + '%;background:' + color + ';"></div></div><div class="dash-hbar-num">' + n + '</div></div>';
}

function renderDashboard() {
  const panel = ensureDashPanel();
  const d = dashState.data;
  if (!d) return;
  const obj = dashState.obj;
  const pick = function(list) { return obj ? list.filter(function(r) { return objOf(r) === obj; }) : list; };
  const active = pick(d.active), forming = pick(d.forming), completed = pick(d.completed);
  const activeIds = {};
  active.forEach(function(r) { activeIds[r.id] = r; });
  const today = dToday();

  // --- плитки
  let areaKop = 0, areaN = 0, rentKop = 0, rentN = 0, utilKop = 0, utilN = 0, depKop = 0, depN = 0;
  active.forEach(function(r) {
    const a = dKop(r.area_sqm), re = dKop(r.rent_amount), u = dKop(r.utility_amount), dp = dKop(r.deposit_amount);
    if (a !== null) { areaKop += a; areaN++; }
    if (re !== null) { rentKop += re; rentN++; }
    if (u !== null) { utilKop += u; utilN++; }
    if (dp !== null) { depKop += dp; depN++; }
  });
  const of = function(n) { return 'указано у ' + n + ' из ' + active.length; };
  let totalKop = 0, totalN = 0;
  const objNames = obj ? [obj] : null;
  (d.objects || []).forEach(function(o) {
    const k = dKop(o.total_area);
    if (k === null || (objNames && objNames.indexOf((o.name || '').trim()) === -1)) return;
    totalKop += k; totalN++;
  });
  const occTile = totalN
    ? '<div class="dash-tile" style="grid-column:span 2;"><div class="dash-tile-label">Сдано из общей площади</div><div class="dash-tile-value">' + dFmt2(areaKop) + ' / ' + dFmt2(totalKop) + ' м²</div>'
      + '<div class="dash-hbar-track" style="margin-top:6px;"><div class="dash-hbar-fill" style="width:' + Math.min(100, Math.round(areaKop / totalKop * 100)) + '%;background:#1677ff;"></div></div>'
      + '<div class="dash-tile-note' + (totalKop - areaKop < 0 ? ' dash-bad' : '') + '">свободно ' + dFmt2(totalKop - areaKop) + ' м²' + (obj ? '' : ' · общая площадь указана у ' + totalN + ' ' + dNoun(totalN, 'объекта', 'объектов', 'объектов')) + '</div></div>'
    : tile('Сдано из общей площади', '—', 'укажите общую площадь объекта в таблице «По объектам»');
  const tiles = occTile + tile('Активные договоры', String(active.length))
    + tile('Формирующиеся', String(forming.length))
    + tile('Архив', String(completed.length))
    + tile('Площадь в аренде', dFmt2(areaKop) + ' м²', of(areaN))
    + tile('Арендная плата в месяц', dMoney(rentKop), of(rentN))
    + tile('Эксплуатационный сбор в месяц', dMoney(utilKop), of(utilN))
    + tile('Всего в месяц', dMoney(rentKop + utilKop), 'арендная плата + эксплуатационный сбор')
    + tile('Обеспечительные платежи', dMoney(depKop), of(depN));

  // --- статусы
  const stCount = {};
  active.forEach(function(r) { const k = r.contract_status || ''; stCount[k] = (stCount[k] || 0) + 1; });
  const stMax = Math.max.apply(null, DASH_STATUS.map(function(s) { return stCount[s.v] || 0; }).concat([1]));
  const statusBody = DASH_STATUS.map(function(s) { return hbar(s.label, stCount[s.v] || 0, stMax, s.color); }).join('');

  // --- подписано по месяцам (12 последних месяцев, по дате заключения)
  const months = [];
  for (let i = 11; i >= 0; i--) { const m = new Date(today.getFullYear(), today.getMonth() - i, 1); months.push({ y: m.getFullYear(), m: m.getMonth(), n: 0 }); }
  active.concat(completed).forEach(function(r) {
    const ds = dDate(r.date_signed);
    if (!ds) return;
    months.forEach(function(mm) { if (mm.y === ds.getFullYear() && mm.m === ds.getMonth()) mm.n++; });
  });
  const MN = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MNF = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const mMax = Math.max.apply(null, months.map(function(m) { return m.n; }).concat([1]));
  const monthsSum = months.reduce(function(s, m) { return s + m.n; }, 0);
  const signedBody = '<div class="dash-cols">' + months.map(function(m) {
    return '<div class="dash-col" title="' + MNF[m.m] + ' ' + m.y + ': ' + m.n + ' ' + dNoun(m.n, 'договор', 'договора', 'договоров') + '">'
      + '<div class="dash-col-num">' + (m.n || '') + '</div><div class="dash-col-bar" style="height:' + Math.round(m.n / mMax * 88) + '%;"></div></div>';
  }).join('') + '</div><div class="dash-col-lbl">' + months.map(function(m) { return '<div>' + MN[m.m] + (m.m === 0 ? ' ' + String(m.y).slice(2) : '') + '</div>'; }).join('') + '</div>';

  // --- расторжения: 90 дней вперёд и уже прошедшие, но договор ещё в «Активных»
  const term = active.map(function(r) { const t = dDate(r.termination_date); return t ? { r: r, t: t, days: dDays(t) } : null; })
    .filter(function(x) { return x && x.days <= 90; }).sort(function(a, b) { return a.days - b.days; });
  const termBody = term.length ? term.map(function(x) {
    const side = x.days < 0 ? '<span class="dash-bad">прошла ' + (-x.days) + ' ' + dNoun(-x.days, 'день', 'дня', 'дней') + ' назад</span>'
      : x.days === 0 ? '<span class="dash-bad">сегодня</span>'
      : '<span class="' + (x.days <= 30 ? 'dash-warn' : '') + '">' + dDateTxt(x.t) + ' · через ' + x.days + ' ' + dNoun(x.days, 'день', 'дня', 'дней') + '</span>';
    return '<div class="dash-list-row" data-open="active:' + x.r.id + '"><div class="dash-list-main">' + dEsc([x.r.contract_number, x.r.tenant_name, obj ? '' : x.r.object_name].filter(Boolean).join(' · ')) + '</div><div class="dash-list-side">' + side + '</div></div>';
  }).join('') : '<div class="dash-empty">В ближайшие 90 дней расторжений нет</div>';

  // --- смены цены в ближайшие 30 дней (начало или конец периода «Дополнительных расчётов аренды»)
  const changes = [];
  d.periods.forEach(function(p) {
    const r = activeIds[p.contract_ref_id];
    if (!r) return;
    [['date_from', 'начинается период'], ['date_to', 'заканчивается период']].forEach(function(k) {
      const dt = dDate(p[k[0]]);
      if (!dt) return;
      if (k[0] === 'date_to') dt.setDate(dt.getDate() + 1);   // последний день периода включительно — цена меняется на следующий день
      const days = dDays(dt);
      if (days >= 0 && days <= 30) changes.push({ r: r, dt: dt, days: days, what: k[1] });
    });
  });
  changes.sort(function(a, b) { return a.days - b.days; });
  const priceBody = changes.length ? changes.map(function(x) {
    return '<div class="dash-list-row" data-open="active:' + x.r.id + '"><div class="dash-list-main">' + dEsc([x.r.contract_number, x.r.tenant_name].filter(Boolean).join(' · ')) + ' — ' + dEsc(x.what) + '</div><div class="dash-list-side">' + dDateTxt(x.dt) + '</div></div>';
  }).join('') : '<div class="dash-empty">В ближайшие 30 дней цены не меняются</div>';

  // --- формирующиеся по этапам
  const stageN = DASH_STAGES.map(function() { return 0; });
  let quickN = 0;
  forming.forEach(function(r) { if (r.is_quick) quickN++; else stageN[Math.min(r.current_stage || 0, 5)]++; });
  const sMax = Math.max.apply(null, stageN.concat([quickN, 1]));
  const stagesBody = DASH_STAGES.map(function(t, i) { return hbar((i + 1) + '. ' + t, stageN[i], sMax, '#1677ff'); }).join('')
    + (quickN ? hbar('Срочные (одной формой)', quickN, sMax, '#fa8c16') : '');

  // --- полнота данных активных договоров
  const checks = [
    ['Дата заключения', function(r) { return dFilled(r.date_signed); }],
    ['Дата акта приёма-передачи', function(r) { return dFilled(r.date_act); }],
    ['Площадь', function(r) { return dFilled(r.area_sqm); }],
    ['Арендная плата', function(r) { return dFilled(r.rent_amount); }],
    ['Эксплуатационный сбор', function(r) { return dFilled(r.utility_amount); }],
    ['Обеспечительный платёж', function(r) { return dFilled(r.deposit_amount); }],
    ['ИНН', function(r) { return dFilled(r.inn); }],
    ['Банковские реквизиты', function(r) { return dFilled(r.bank_account) && dFilled(r.bik); }],
    ['Прикреплённые сотрудники', function(r) { return (r.contract_members || []).length > 0; }]
  ];
  const fillBody = checks.map(function(c) {
    const n = active.filter(c[1]).length;
    const color = !active.length || n === active.length ? '#389e0d' : n * 2 >= active.length ? '#d48806' : '#cf1322';
    return hbar(c[0], n, active.length || 1, color, c[0] + ': заполнено у ' + n + ' из ' + active.length);
  }).join('');

  // --- арендаторы с несколькими активными договорами
  const tenants = {};
  active.forEach(function(r) { const t = (r.tenant_name || '').trim(); if (t) (tenants[t] = tenants[t] || []).push(r); });
  const multi = Object.keys(tenants).filter(function(t) { return tenants[t].length > 1; })
    .sort(function(a, b) { return tenants[b].length - tenants[a].length || a.localeCompare(b, 'ru'); }).slice(0, 10);
  const tenantsBody = multi.length ? multi.map(function(t) {
    const m = tenants[t].reduce(function(s, r) { const k = monthlyKop(r); return s + (k || 0); }, 0);
    return '<div class="dash-list-row" style="cursor:default;"><div class="dash-list-main">' + dEsc(t) + '</div><div class="dash-list-side">' + tenants[t].length + ' ' + dNoun(tenants[t].length, 'договор', 'договора', 'договоров') + (m ? ' · ' + dMoney(m) + ' в месяц' : '') + '</div></div>';
  }).join('') : '<div class="dash-empty">Нет арендаторов с несколькими договорами</div>';

  // --- таблица объектов (только когда выбраны «Все объекты»)
  let objTable = '';
  if (!obj) {
    const stats = objectStats(d.active, d.forming, d.completed, d.objects);
    const k = dashState.sortKey, dir = dashState.sortDir;
    stats.sort(function(a, b) { return k === 'name' ? dir * a.name.localeCompare(b.name, 'ru') : dir * (a[k] - b[k]) || a.name.localeCompare(b.name, 'ru'); });
    const cols = [['name', 'Объект'], ['active', 'Активные'], ['forming', 'Формирующиеся'], ['completed', 'Архив'], ['totalKop', 'Общая площадь, м²'], ['areaKop', 'Сдано, м²'], ['freeKop', 'Свободно, м²'], ['monthly', 'В месяц, ₽'], ['deposit', 'Обеспечительные, ₽'], ['problem', 'Проблема'], ['terminating', 'На расторжении'], ['incomplete', 'Без площади или цены']];
    const tot = stats.reduce(function(s, o) { cols.slice(1).forEach(function(c) { s[c[0]] = (s[c[0]] || 0) + (o[c[0]] || 0); }); return s; }, {});
    dashState.lastStats = { cols: cols, stats: stats, tot: tot };
    const cell = function(key, v) {
      if (key === 'totalKop') return v === null || v === undefined ? '<span class="dash-edit-area" style="color:#1677ff;">указать</span>' : '<span class="dash-edit-area" title="Изменить общую площадь">' + dFmt2(v) + ' ✎</span>';
      if (key === 'freeKop') return v === null || v === undefined ? '—' : (v < 0 ? '<span class="dash-bad" title="Сдано больше общей площади — проверьте площади">' + dFmt2(v) + '</span>' : dFmt2(v));
      if (key === 'areaKop' || key === 'monthly' || key === 'deposit') return v ? dFmt2(v) : '—';
      if (key === 'problem' && v) return '<span class="dash-bad">' + v + '</span>';
      if ((key === 'terminating' || key === 'incomplete') && v) return '<span class="dash-warn">' + v + '</span>';
      return v ? String(v) : '—';
    };
    objTable = '<div class="dash-card" style="margin-bottom:12px;"><div class="dash-card-title">По объектам<span>строка — открыть объект; суммы по договорам, где значение указано · <a data-act="csv" style="cursor:pointer;">выгрузить в Excel</a></span></div><div class="dash-table-wrap"><table class="dash-table"><thead><tr>'
      + cols.map(function(c) { return '<th data-sort="' + c[0] + '">' + dEsc(c[1]) + (k === c[0] ? (dir > 0 ? ' ↑' : ' ↓') : '') + '</th>'; }).join('')
      + '</tr></thead><tbody>'
      + stats.map(function(o) { return '<tr data-obj="' + dEsc(o.name) + '" data-obj-id="' + (o.id || '') + '">' + cols.map(function(c) { return '<td>' + (c[0] === 'name' ? dEsc(o.name) : cell(c[0], o[c[0]])) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody><tfoot><tr><td>Итого</td>' + cols.slice(1).map(function(c) { return '<td>' + cell(c[0], tot[c[0]]) + '</td>'; }).join('') + '</tr></tfoot></table></div></div>';
  }

  const upd = dashState.loadedAt ? new Date(dashState.loadedAt) : null;
  const names = (d.objects || []).map(function(o) { return (o.name || '').trim(); }).filter(Boolean).sort(function(a, b) { return a.localeCompare(b, 'ru'); });
  panel.innerHTML = '<div class="dash-head"><div class="dash-title">Дашборд по объектам</div>'
    + '<select data-act="obj" class="dash-link" style="padding:3px 6px;"><option value="">Все объекты</option>' + names.map(function(n) { return '<option' + (n === obj ? ' selected' : '') + '>' + dEsc(n) + '</option>'; }).join('') + '</select>'
    + (obj ? '<button class="dash-link" data-act="all">← Все объекты</button><button class="dash-link" data-act="contracts">Договоры объекта →</button>' : '')
    + '<div class="dash-sub">обновлено ' + (upd ? ('0' + upd.getHours()).slice(-2) + ':' + ('0' + upd.getMinutes()).slice(-2) : '') + '</div>'
    + '<button class="dash-link" data-act="refresh">↻ Обновить</button></div>'
    + '<div class="dash-tiles">' + tiles + '</div>'
    + objTable
    + '<div class="dash-grid">'
    + card('Статусы активных договоров', active.length + ' ' + dNoun(active.length, 'договор', 'договора', 'договоров'), statusBody)
    + card('Заключено договоров по месяцам', 'за 12 месяцев: ' + monthsSum + ', включая архив', signedBody)
    + card('Расторжения', 'в ближайшие 90 дней и просроченные', termBody)
    + card('Смена цены', 'ближайшие 30 дней', priceBody)
    + card('Формирующиеся по этапам', forming.length + ' в работе', stagesBody)
    + card('Полнота данных', 'активные договоры: заполнено из ' + active.length, fillBody)
    + card('Арендаторы с несколькими договорами', 'активные', tenantsBody)
    + '</div>';
}

function onDashClick(e) {
  const t = e.target;
  const act = t.closest && t.closest('[data-act]');
  if (act) {
    const a = act.getAttribute('data-act');
    if (a === 'refresh') refreshDashboard();
    if (a === 'all') dashSetObject('');
    if (a === 'contracts') window.location.href = REGISTRY_URL + '?obj=' + encodeURIComponent(dashState.obj);
    if (a === 'csv') dashExportCsv();
    return;
  }
  const ed = t.closest && t.closest('.dash-edit-area');
  if (ed) { dashEditArea(ed.closest('tr')); return; }
  if (t.closest && t.closest('.dash-area-input')) return;
  const th = t.closest && t.closest('th[data-sort]');
  if (th) {
    const k = th.getAttribute('data-sort');
    if (dashState.sortKey === k) dashState.sortDir = -dashState.sortDir;
    else { dashState.sortKey = k; dashState.sortDir = k === 'name' ? 1 : -1; }
    renderDashboard();
    return;
  }
  const tr = t.closest && t.closest('tr[data-obj]');
  if (tr) { dashSetObject(tr.getAttribute('data-obj')); return; }
  const op = t.closest && t.closest('[data-open]');
  if (op) {
    const m = op.getAttribute('data-open').split(':');
    window.location.href = REGISTRY_URL + '?open=' + m[0] + ':' + m[1];   // карточка открывается на странице реестра
  }
}
function dashSetObject(name) { dashState.obj = name || ''; renderDashboard(); }

// общая площадь объекта — правка прямо в ячейке (Enter/уход с поля — сохранить, Esc — отмена)
function dashEditArea(tr) {
  const id = tr && tr.getAttribute('data-obj-id');
  const td = tr && tr.querySelector('.dash-edit-area') ? tr.querySelector('.dash-edit-area').parentNode : null;
  if (!td) return;
  if (!id) { td.innerHTML = '<span class="dash-bad">объекта нет в справочнике</span>'; return; }
  const o = (dashState.data.objects || []).find(function(x) { return String(x.id) === id; });
  const cur = o && o.total_area !== null && o.total_area !== undefined ? String(o.total_area).replace('.', ',') : '';
  td.innerHTML = '<input class="dash-area-input" inputmode="decimal" style="width:110px;text-align:right;border:1px solid #1677ff;border-radius:4px;padding:2px 6px;font:inherit;" value="' + dEsc(cur) + '">';
  const inp = td.querySelector('input');
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
      if (o) o.total_area = val;
    } catch (e) { /* нет прав — значение не меняется */ }
    renderDashboard();
  }
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') save(true); if (e.key === 'Escape') save(false); });
  inp.addEventListener('blur', function() { save(true); });
}
// выгрузка таблицы «По объектам» в CSV (открывается в Excel: разделитель «;», BOM для кириллицы)
function dashExportCsv() {
  const ls = dashState.lastStats;
  if (!ls) return;
  const num = function(key, v) {
    if (v === null || v === undefined) return '';
    return (key === 'totalKop' || key === 'areaKop' || key === 'freeKop' || key === 'monthly' || key === 'deposit') ? (v / 100).toFixed(2).replace('.', ',') : String(v);
  };
  const q = function(x) { return '"' + String(x).replace(/"/g, '""') + '"'; };
  const lines = [ls.cols.map(function(c) { return q(c[1]); }).join(';')];
  ls.stats.forEach(function(o) { lines.push(ls.cols.map(function(c) { return c[0] === 'name' ? q(o.name) : num(c[0], o[c[0]]); }).join(';')); });
  lines.push([q('Итого')].concat(ls.cols.slice(1).map(function(c) { return num(c[0], ls.tot[c[0]]); })).join(';'));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  const t = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = 'Объекты ' + ('0' + t.getDate()).slice(-2) + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + t.getFullYear() + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
}
