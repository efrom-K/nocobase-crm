// Сроки регулярных дел АХО: следующий срок после отметки «Сделано» (функция aNext из src/crm-aho.js, берётся из файла как есть).
const src = require('fs').readFileSync(__dirname + '/../src/crm-aho.js', 'utf8');
const pick = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
eval(pick('function hIso', 'function hNoun') + pick('function aDay', '// состояние срока'));
const cases = [
  [{ period: 'monthly', day: 25 }, '2026-10-05', '2026-10-25'], [{ period: 'monthly', day: 25 }, '2026-10-25', '2026-11-25'],
  [{ period: 'monthly', day: 31 }, '2026-02-10', '2026-02-28'], [{ period: 'monthly', day: 31 }, '2026-02-28', '2026-03-31'],
  [{ period: 'monthly', day: 1 }, '2026-12-15', '2027-01-01'], [{ period: 'quarterly', day: 10 }, '2026-10-10', '2027-01-10'],
  [{ period: 'yearly', day: 5 }, '2026-10-05', '2027-10-05'], [{ period: 'weekly', day: 1 }, '2026-10-05', '2026-10-12'],
  [{ period: 'weekly', day: 3 }, '2026-10-05', '2026-10-07'], [{ period: 'daily' }, '2026-10-09', '2026-10-12'],
];
let bad = 0;
for (const [r, from, want] of cases) { const got = aNext(r, from); if (got !== want) { bad++; console.log('FAIL', JSON.stringify(r), from, got, '!=', want); } }
console.log(bad ? 'ОШИБОК: ' + bad : 'aNext: всё сходится');
process.exit(bad ? 1 : 0);
