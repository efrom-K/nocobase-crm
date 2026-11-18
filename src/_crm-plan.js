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
// отдельно; пересекаются — берётся начавшийся позже), иначе основная цена (base_*); начисления считаются только по действующим договорам.
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
function planLines(v) {
  let lines = v;
  if (typeof lines === 'string') { try { lines = JSON.parse(lines); } catch (e) { return []; } }
  return Array.isArray(lines) ? lines.filter(function(l) { return l && plKop(l.area) > 0; }) : [];
}
function planLinesArea(lines) {
  return lines.reduce(function(sum, l) { return sum + plKop(l.area); }, 0) / 100;
}
// Дробные копейки сохраняются до начисления за фактические дни месяца.
function planMul(rate, area) { return (plKop(rate) || 0) * (plKop(area) || 0) / 100; }
function planLineAmount(lines, field) {
  const selected = lines.filter(function(l) { return plKop(l[field]) !== null; });
  return selected.length ? selected.reduce(function(sum, l) { return sum + planMul(l[field], l.area); }, 0) : null;
}
// Сумма за конечный период превращается в дневную долю, затем в месячный эквивалент ставки.
function planPeriodMonthlyValue(p, value, iso) {
  const from = plDate(p.date_from), to = plDate(p.date_to), day = plDate(iso);
  if (!from || !to || !day || plIso(p.date_to) >= '2099-12-31' || to < from) throw new Error('У суммы за период должны быть конечные даты');
  const utc = function(d) { return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
  const days = (utc(to) - utc(from)) / 86400000 + 1;
  return Number(value) * new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate() / days;
}
// Месячная цена договора на день, в том числе дробные копейки и признак «по периоду»
function planPrice(r, per, iso) {
  const ps = per.filter(function(p) { return plIso(p.date_from) <= iso && iso <= plIso(p.date_to) && (p.unit || 'month') === 'month'; }).sort(function(a, b) { return plIso(a.date_from).localeCompare(plIso(b.date_from)) || (a.id - b.id); });
  const last = function(f) { const l = ps.filter(f); return l.length ? l[l.length - 1] : null; };
  const rp = last(function(p) { return p.rent_on === true || (p.rent_on !== false && p.amount !== null && p.amount !== undefined); });
  const up = last(function(p) { return !!p.utility_on; });
  const rentLines = planLines(rp && rp.rent_lines), baseLines = planLines(r.area_lines);
  const baseArea = planLinesArea(baseLines) || Number(r.base_area_sqm != null ? r.base_area_sqm : r.area_sqm) || 0;
  const periodArea = planLinesArea(rentLines);
  const area = periodArea || baseArea;
  const val = function(p, basis, v) {
    if (basis === 'period') return (plKop(v) || 0) * planPeriodMonthlyValue(p, 1, iso);
    return basis === 'per_sqm' ? planMul(v, area) : plKop(v) || 0;
  };
  // Сумма, заданная вручную, имеет приоритет над восстановленной ставкой за метр.
  const baseField = function(key) {
    return per.length && plKop(r['base_' + key + '_amount']) !== null ? 'base_' + key : key;
  };
  const base = function(key) {
    const field = baseField(key);
    const amount = plKop(r[field + '_amount']);
    const rate = r[field + '_per_sqm'];
    const perSqm = planMul(rate, baseArea);
    if (plKop(rate) !== null && area > 0 && (periodArea || amount === Math.round(perSqm))) return planMul(rate, area);
    return amount !== null ? amount : plKop(r[key + '_amount']) || 0;
  };
  const pricedLines = rp ? rentLines : baseLines;
  const rentByLines = planLineAmount(pricedLines, 'rate');
  const roundedLines = pricedLines.reduce(function(sum, l) { return sum + Math.round(planMul(l.rate, l.area)); }, 0);
  const storedRent = plKop(rp ? rp.amount : r[baseField('rent') + '_amount']);
  const utilityByLines = planLineAmount(up ? planLines(up.rent_lines) : baseLines, 'utility_rate');
  return {
    rent: rentByLines !== null && storedRent === roundedLines ? rentByLines : rp ? val(rp, rp.basis || 'per_sqm', rp.amount) : base('rent'),
    util: utilityByLines !== null ? utilityByLines : up ? val(up, up.utility_basis || 'per_sqm', up.utility_value) : base('utility'),
    byPeriod: !!(rp || up)
  };
}
function plIso(v) { return String(v || '').slice(0, 10); }
// начисление по договору за месяц M: копейки аренды и сбора, дней, пометка
function planContractMonth(r, typ, per, M) {
  if (typ !== 'active') return null;
  const from = plIso(r.date_act || r.date_signed), to = plIso(r.termination_date) || '9999-12-31';
  if (!from) return null;
  let rent = 0, util = 0, days = 0, byPeriod = false, first = '', lastD = '';
  for (let d = 1; d <= M.dim; d++) {
    const iso = M.iso(d);
    if (iso < from || iso > to) continue;
    const p = planPrice(r, per, iso);
    rent += p.rent; util += p.util; days++; byPeriod = byPeriod || p.byPeriod;
    if (!first) first = iso; lastD = iso;
  }
  if (!days) return null;
  const rounded = function(sum) { const cents = sum / M.dim; return Math.round(cents + Math.abs(cents) * Number.EPSILON * M.dim); };
  rent = rounded(rent); util = rounded(util);
  const note = [];
  if (days < M.dim) note.push(plIso(first) === M.iso(1) ? 'по ' + plDateTxt(plDate(lastD)) : lastD === M.iso(M.dim) ? 'с ' + plDateTxt(plDate(first)) : plDateTxt(plDate(first)) + '–' + plDateTxt(plDate(lastD)));
  if (byPeriod) note.push('доп. расчёт');
  return { rent: rent, util: util, total: rent + util, days: days, note: note.join(', ') };
}
// Итог за месяц по действующим договорам, в копейках.
function planMonthTotal(active, periods, M) {
  const per = {}, out = { rent: 0, util: 0 };
  (periods || []).forEach(function(p) {
    if (p.contract_type === 'active') (per[p.contract_ref_id] = per[p.contract_ref_id] || []).push(p);
  });
  (active || []).forEach(function(r) {
    const m = planContractMonth(r, 'active', per[r.id] || [], M);
    if (m) { out.rent += m.rent; out.util += m.util; }
  });
  return out;
}
