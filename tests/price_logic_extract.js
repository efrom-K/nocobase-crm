// Вытаскивает из contract-modals.js функции/константы расчёта цен и отдаёт их для тестов (без DOM и NocoBase)
const fs = require('fs');
const src = fs.readFileSync(process.env.CM || require('path').join(__dirname, '..', 'src', 'contract-modals.js'), 'utf8');
function grab(startRe) {
  const m = src.match(startRe);
  if (!m) throw new Error('not found: ' + startRe);
  let i = m.index, depth = 0, started = false;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (ch === '{' || ch === '[') { depth++; started = true; }
    else if (ch === '}' || ch === ']') { depth--; if (started && depth === 0) { let k = j + 1; while (src[k] === ';' || src[k] === ')') k++; return src.slice(i, k); } }
    else if (ch === ';' && !started) return src.slice(i, j + 1);
  }
  throw new Error('unterminated ' + startRe);
}
const names = [
  /function formatNum\(v\) \{/, /function esc\(v\) \{/, /function escRaw\(v\) \{/, /function numOf\(v\) \{/, /function round2\(n\) \{/, /function mulMoney\(rate, area\) \{/, /function hasKey\(o, k\) \{/,
  /function fromISODateDisplay\(v\) \{/, /function isoToDate\(s\) \{/, /function dateToIso\(d\) \{/, /function addDays\(d, n\) \{/,
  /function fmtDate\(iso\) \{/, /const OPEN_END = /, /function isOpenEnd\(iso\) \{/, /function periodRange\(p\) \{/,
  /const PRICE_COMPONENTS = \[/, /const COMPONENT_BY_FIELD = \{\};/, /PRICE_COMPONENTS\.forEach\(function\(c\) \{ \[c\.perField/,
  /function periodFor\(periods, iso, comp\) \{/, /function compValues\(comp, p, rec\) \{/, /function scheduleTarget\(periods, rec, iso\) \{/,
  /function compLabel\(comp, p\) \{/, /function priceLabel\(p\) \{/, /function baseLabel\(comp, rec\) \{/, /function nextFieldChange\(periods, rec, iso, field\) \{/,
  /function totalRentKey\(collection\) \{/, /function calcTotal\(rent, utility\) \{/, /function totalUpdate\(collection, oldRec, values\) \{/
];
let code = names.map(grab).join('\n');
code = code.replace('const COMPONENT_BY_FIELD = {};', 'const COMPONENT_BY_FIELD = {};\n');
module.exports = new Function(code + '\nreturn { formatNum, numOf, round2, isoToDate, dateToIso, addDays, OPEN_END, isOpenEnd, PRICE_COMPONENTS, COMPONENT_BY_FIELD, periodFor, compValues, scheduleTarget, compLabel, priceLabel, baseLabel, nextFieldChange, calcTotal, totalUpdate };')();
