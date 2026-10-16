// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
// @include src/_crm-calls.js
// @include src/_crm-mobile.js
// фоновые опросы не ходят в API, когда пользователь не вошёл (страница входа, сессия истекла):
// иначе NocoBase на каждый такой запрос показывает «Пожалуйста, войдите, чтобы продолжить»
function nbSessionAlive() {
  if (/\/signin|\/signup/.test(location.pathname)) return false;
  try { return !!localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return false; }
}
window.__cmEngine = ctx.model.flowEngine;

// ---------- договоры с нестандартной ценой («Дополнительные расчёты аренды») ----------
// Признак — есть хотя бы один период в contract_price_periods. Только чтение: договоры и их таблицы не меняются.
// Рядом с ценой (столбцы «Сумма договора» / «Арендная плата в месяц») — та же плашка, что в карточке: «с 01.02.2027: 420 554,00 ₽»
// (ближайшее изменение считает карточка — window.__cmNextFieldChange из contract-modals.js). Нет будущих изменений — «по периоду».
// Кнопка «Доп. расчёты сверху» поднимает такие договоры наверх (выбор запоминается в браузере).
const EXTRA_TABLE_BY_TYPE = { active: 'ozazmpm4o4v', forming: 'formtbl000001', completed: 'ipb7gfluldk' };
const EXTRA_PRICE_COLS = /^(Сумма договора|Арендная плата в месяц)/;
try { window.__cmExtraFirst = localStorage.getItem('cm-extra-first') === '1'; } catch (e) { window.__cmExtraFirst = false; }
if (!document.getElementById('cm-extracalc-style')) {
  const est = document.createElement('style');
  est.id = 'cm-extracalc-style';
  est.textContent = `
    .cm-xc-badge { display:inline-block; font-size:11px; line-height:18px; color:#ad6800; background:#fff7e6; border:1px solid #ffd591; border-radius:4px; padding:0 6px; margin-left:6px; font-weight:500; white-space:nowrap; vertical-align:1px; }
    td.cm-xc-cell { white-space:nowrap; }
    #cm-extra-btn { border:1px solid #d9d9d9; background:#fff; color:#262626; border-radius:6px; padding:4px 12px; font-size:13px; cursor:pointer; }
    #cm-extra-btn:hover { border-color:#1c2d58; color:#1c2d58; }
    #cm-extra-btn.on { background:#1c2d58; border-color:#1c2d58; color:#fff; }
  `;
  document.head.appendChild(est);
}
function xcMoney(v) { return Number(v).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'; }
function xcDate(iso) { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : String(iso || ''); }
function xcToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function paintExtraBtn() {
  const b = document.getElementById('cm-extra-btn');
  if (!b) return;
  b.classList.toggle('on', !!window.__cmExtraFirst);
  b.textContent = (window.__cmExtraFirst ? '✓ ' : '') + 'Доп. расчёты сверху';
}
// плашка для договора: ближайшее изменение арендной платы (иначе сбора) — как в карточке; без будущих изменений — «по периоду»
function xcBadgeFor(uid, id) {
  const info = ((window.__cmExtraRows || {})[uid] || {})[id];
  if (!info) return null;
  const fn = window.__cmNextFieldChange;
  if (uid === EXTRA_TABLE_BY_TYPE.active && info.rec && typeof fn === 'function') {
    const today = xcToday();
    for (const f of ['rent_amount', 'utility_amount']) {
      let ch = null;
      try { ch = fn(info.periods, info.rec, today, f); } catch (e) { ch = null; }
      if (ch && ch.value !== null && ch.value !== undefined) {
        const what = f === 'rent_amount' ? 'Арендная плата' : 'Эксплуатационный сбор';
        return { text: (f === 'rent_amount' ? '' : 'сбор ') + 'с ' + xcDate(ch.date) + ': ' + xcMoney(ch.value),
                 title: what + ' с ' + xcDate(ch.date) + ' — ' + xcMoney(ch.value) + ' в месяц (дополнительные расчёты аренды)' };
      }
    }
  }
  return { text: 'по периоду', title: 'Нестандартная цена: в договоре есть дополнительные расчёты аренды' };
}
function extraCols(uid) {
  const ths = Array.from(document.querySelectorAll('[data-uid="' + uid + '"] .ant-table-thead > tr:first-child > th'));
  const idx = [];
  ths.forEach(function(th, i) { if (EXTRA_PRICE_COLS.test((th.textContent || '').trim())) idx.push(i); });
  if (idx.length) return idx;
  const n = ths.findIndex(function(th) { return /^Номер договора/.test((th.textContent || '').trim()); });   // столбцы цены скрыты — у номера
  return n !== -1 ? [n] : [];
}
function paintExtraRows() {
  TABLES.forEach(function(uid) {
    const cols = extraCols(uid);
    document.querySelectorAll('[data-uid="' + uid + '"] .ant-table-tbody > tr[data-row-key]').forEach(function(tr) {
      const b = xcBadgeFor(uid, tr.getAttribute('data-row-key'));
      Array.from(tr.children).forEach(function(td, i) {
        const tag = td.querySelector(':scope > .cm-xc-badge');
        const want = b && cols.indexOf(i) !== -1;
        if (!want) { if (tag) tag.remove(); td.classList.remove('cm-xc-cell'); return; }
        if (tag && tag.textContent === b.text) return;
        if (tag) tag.remove();
        const t = document.createElement('span');
        t.className = 'cm-xc-badge';
        t.textContent = b.text;
        t.title = b.title;
        td.appendChild(t);
        td.classList.add('cm-xc-cell');
      });
    });
  });
}
async function xcGet(url) {
  const r = await fetch(url, { headers: colAuthHeaders() });
  const j = await r.json();
  return j && Array.isArray(j.data) ? j.data : null;
}
async function refreshExtraRows() {
  try {
    const periods = await xcGet('/api/contract_price_periods:list?paginate=false&sort=date_from&sort=id');
    if (!periods) return;
    const map = {};
    periods.forEach(function(p) {
      const uid = EXTRA_TABLE_BY_TYPE[p.contract_type];
      if (!uid || !p.contract_ref_id) return;
      map[uid] = map[uid] || {};
      (map[uid][p.contract_ref_id] = map[uid][p.contract_ref_id] || { periods: [] }).periods.push(p);
    });
    // для активных — сам договор (основные цены, площадь) нужен для расчёта ближайшего изменения
    const act = Object.keys(map[EXTRA_TABLE_BY_TYPE.active] || {});
    if (act.length) {
      const recs = await xcGet('/api/rental_contracts:list?paginate=false&filter=' + encodeURIComponent(JSON.stringify({ id: { $in: act.map(Number) } })));
      (recs || []).forEach(function(r) { const x = map[EXTRA_TABLE_BY_TYPE.active][r.id]; if (x) x.rec = r; });
    }
    window.__cmExtraRows = map;
    refreshPinnedTables();
  } catch (e) { /* остаёмся на прошлом состоянии */ }
  paintExtraRows();
}
(function initExtraBtn() {
  const b = document.getElementById('cm-extra-btn');
  if (!b || b.__cmBound) return;
  b.__cmBound = true;
  b.addEventListener('click', function() {
    window.__cmExtraFirst = !window.__cmExtraFirst;
    try { localStorage.setItem('cm-extra-first', window.__cmExtraFirst ? '1' : '0'); } catch (e) { /* ignore */ }
    paintExtraBtn();
    refreshPinnedTables();
  });
  paintExtraBtn();
})();
if (!window.__cmExtraTimers) {
  window.__cmExtraTimers = true;
  refreshExtraRows();
  setInterval(function() { if (nbSessionAlive()) refreshExtraRows(); }, 60000);   // периоды меняются редко
  setInterval(paintExtraRows, 600);          // строки пересоздаются при сортировке и листании
  window.addEventListener('focus', function() { if (nbSessionAlive()) refreshExtraRows(); });
}
