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
// «График работы» сотрудника → начало дня, удалённые и рабочие дни (aSched из раздела «Приходы»)
const ah = { d: { skud: { skud_work_start: '09:00' } } };
eval(pick('const A_WD', 'function aEmp'));
const sc = [
  ['9:30-18:30', { start: '09:30', remoteAll: false, remoteDays: [], workDays: [1, 2, 3, 4, 5] }],
  ['9:00-18:00 · Удаленно: вт-пт', { start: '09:00', remoteAll: false, remoteDays: [2, 3, 4, 5], workDays: [1, 2, 3, 4, 5] }],
  ['12:30-20:30 · Удаленно: пн,вт,чт', { start: '12:30', remoteAll: false, remoteDays: [1, 2, 4], workDays: [1, 2, 3, 4, 5] }],
  ['12:00-20:00 · Удаленно', { start: '12:00', remoteAll: true, remoteDays: [], workDays: [1, 2, 3, 4, 5] }],
  ['пн-чт', { start: '09:00', remoteAll: false, remoteDays: [], workDays: [1, 2, 3, 4] }],
  ['', { start: '09:00', remoteAll: false, remoteDays: [], workDays: [1, 2, 3, 4, 5] }],
];
for (const [s, want] of sc) { const got = aSched({ work_schedule: s }); if (JSON.stringify(got) !== JSON.stringify(want)) { bad++; console.log('FAIL', s, JSON.stringify(got)); } }
console.log(bad ? 'ОШИБОК: ' + bad : 'aNext и aSched: всё сходится');
process.exit(bad ? 1 : 0);
