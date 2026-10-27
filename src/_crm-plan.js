// ===== «Планирование»: начисление по договорам посуточно — общий фрагмент для «Компании» (src/dashboard.js) и «Сводки» (src/ceo-dashboard.js) =====
// Цена на день — с «Дополнительными расчётами аренды» (contract_price_periods); месяц = сумма цен по дням действия договора / дней в месяце.
function plKop(v) { const n = Number(v); return v === null || v === undefined || v === '' || !isFinite(n) ? null : Math.round(n * 100); }
function plDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null; }
function plDateTxt(d) { return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear(); }
function plToday() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
// ---------- «Планирование»: сколько компания получила / получит по объектам за прошлый, текущий и следующий месяц ----------
// Начисление посуточно: каждый день, когда договор действует (с даты акта приёма-передачи, без неё — с даты заключения,
// по дату расторжения включительно), даёт 1/(дней в месяце) месячной цены, действующей в этот день. Заехал 15-го в 31-дневном месяце — 17/31.
// Цена на день — как в карточке и apply_price_schedule.py: период «Дополнительных расчётов аренды» (для аренды и эксплуатационного сбора
// отдельно; пересекаются — берётся начавшийся позже), иначе основная цена (base_*); у архивных договоров основной цены нет — их последняя цена.
// Обеспечительный платёж не доход — не входит. Договоры в оформлении не входят (нет даты начала).
function planMonths() {
  const t = plToday(), out = [];
  for (let k = -1; k <= 1; k++) {
    const a = new Date(t.getFullYear(), t.getMonth() + k, 1), dim = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
    out.push({ y: a.getFullYear(), m: a.getMonth(), dim: dim, iso: function(d) { return a.getFullYear() + '-' + ('0' + (a.getMonth() + 1)).slice(-2) + '-' + ('0' + d).slice(-2); },
      name: a.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', ''), rel: ['прошлый', 'текущий', 'следующий'][k + 1] });
  }
  return out;
}
function planLinesArea(v) {
  let l = v; if (typeof l === 'string') { try { l = JSON.parse(l); } catch (e) { l = null; } }
  if (!Array.isArray(l)) return null;
  const a = l.reduce(function(n, x) { const k = plKop(x && x.area); return n + (k && k > 0 ? k : 0); }, 0);
  return a ? a / 100 : null;
}
function planMul(rate, area) { const a = Math.round(Number(rate) * 100), b = Math.round(Number(area) * 100); return Math.floor((a * b + 50) / 100); }   // ставка × площадь в копейках, как mulMoney
// месячная цена договора r (тип typ) на день iso: { rent, util } в копейках и признак «по периоду»
function planPrice(r, typ, per, iso) {
  const ps = per.filter(function(p) { return plIso(p.date_from) <= iso && iso <= plIso(p.date_to) && (p.unit || 'month') === 'month'; });
  const last = function(f) { const l = ps.filter(f); return l.length ? l[l.length - 1] : null; };
  const rp = last(function(p) { return p.rent_on === true || (p.rent_on !== false && p.amount !== null && p.amount !== undefined); });
  const up = last(function(p) { return !!p.utility_on; });
  const area = (rp && planLinesArea(rp.rent_lines)) || planLinesArea(r.area_lines) || Number(r.base_area_sqm != null ? r.base_area_sqm : r.area_sqm) || 0;
  const val = function(p, basis, v) { return basis === 'per_sqm' ? (area > 0 ? planMul(v, area) : 0) : plKop(v) || 0; };
  // без периодов — текущая цена договора (как в реестре); с периодами вне периода — основная (base_*)
  const base = function(b, cur) { const k = typ === 'active' && per.length ? plKop(r[b]) : null; return k !== null ? k : plKop(r[cur]) || 0; };
  return {
    rent: rp ? val(rp, rp.basis || 'per_sqm', rp.amount) : base('base_rent_amount', 'rent_amount'),
    util: up ? val(up, up.utility_basis || 'per_sqm', up.utility_value) : base('base_utility_amount', 'utility_amount'),
    byPeriod: !!(rp || up)
  };
}
function plIso(v) { return String(v || '').slice(0, 10); }
// начисление по договору за месяц M: копейки аренды и сбора, дней, пометка
function planContractMonth(r, typ, per, M) {
  const from = plIso(r.date_act || r.date_signed), to = plIso(r.termination_date) || '9999-12-31';
  if (!from) return null;
  let rent = 0, util = 0, days = 0, byPeriod = false, first = '', lastD = '';
  for (let d = 1; d <= M.dim; d++) {
    const iso = M.iso(d);
    if (iso < from || iso > to) continue;
    const p = planPrice(r, typ, per, iso);
    rent += p.rent; util += p.util; days++; byPeriod = byPeriod || p.byPeriod;
    if (!first) first = iso; lastD = iso;
  }
  if (!days) return null;
  rent = Math.round(rent / M.dim); util = Math.round(util / M.dim);
  const note = [];
  if (days < M.dim) note.push(plIso(first) === M.iso(1) ? 'по ' + plDateTxt(plDate(lastD)) : lastD === M.iso(M.dim) ? 'с ' + plDateTxt(plDate(first)) : plDateTxt(plDate(first)) + '–' + plDateTxt(plDate(lastD)));
  if (byPeriod) note.push('доп. расчёт');
  return { rent: rent, util: util, total: rent + util, days: days, note: note.join(', ') };
}
// итог за месяц M по действующим и архивным договорам: { rent, util } в копейках; periods — contract_price_periods (active + completed)
function planMonthTotal(active, completed, periods, M) {
  const per = { active: {}, completed: {} }, out = { rent: 0, util: 0 };
  (periods || []).forEach(function(p) { const g = per[p.contract_type]; if (g) (g[p.contract_ref_id] = g[p.contract_ref_id] || []).push(p); });
  [['active', active], ['completed', completed]].forEach(function(x) {
    (x[1] || []).forEach(function(r) { const m = planContractMonth(r, x[0], per[x[0]][r.id] || [], M); if (m) { out.rent += m.rent; out.util += m.util; } });
  });
  return out;
}
