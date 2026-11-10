'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const src = fs.readFileSync('src/crm-hr.js', 'utf8');
const cfg = k => ({ 'hr.empType': { staff: 'Штат', self: 'Самозанятый' }, 'hr.vacKinds': ['Ежегодный', 'За свой счёт'], 'hr.fileDocs': ['Document A','Document B'], 'hr.fileDocsSelf': ['Self document'] }[k] || {});
const c = vm.createContext({ cfg, console, hDate: v => String(v).split('-').reverse().join('.'), hToday: () => '2026-11-06', hD: v => String(v || '').slice(0, 10),
  hDays: (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000),
  hVacLeft: () => 28, hSafetyLast: () => null, hDue: () => 'ok', hPosFree: p => p.units,
  hVacCls: () => 'sched', hOwnSheets: () => [], hOwnersOf: () => [], hOwnSum: () => 0,
  hOwnSharesTxt: () => '', hPct: v => String(v) });
function load(a, b) { vm.runInContext(src.slice(src.indexOf(a), src.indexOf(b, src.indexOf(a))), c); }
load('const HR_EMP_TYPE', 'const hr =');
vm.runInContext('var hr = { d: {} };', c);
load('function hHasHr()', 'function hMonthName(');
load('function hLe(', 'function hDeptNames(');
load('function hFilesOf(', 'function hFileA(');
load('function hAddM(', 'function hR2(');
load('function hIso(', 'function hDate(');
load('function hEsc(', 'function hToken(');
load('function hOpts(', 'function hField(');
load('const hLeOpts', '// ---------- «требует внимания»');
load('const HR_OWN_KIND', 'function hOwnNow(');
load('const HR_RU_HOLIDAYS', 'function hEditVacDays(');
load('function hXlsYears(', 'function hOpenExport(');
load('function hSafetyRecs(', '// для статуса');
load('function hXlsSpec(', 'function hOnClick(');
const run = js => vm.runInContext(js, c);
assert.equal(run(`HR_RU_HOLIDAYS.length`), 14);
assert.equal(run(`hVacDays({start_date:'2026-01-01',end_date:'2026-01-10'})`), 2);
assert.equal(run(`hVacDays({start_date:'2026-02-21',end_date:'2026-02-24'})`), 3);
assert.equal(run(`hVacDays({start_date:'2026-01-01',end_date:'2026-01-04',kind:'За свой счёт'})`), 4);
assert.equal(run(`hVacDays({start_date:'2025-12-30',end_date:'2026-01-09'})`), 3);
assert.equal(run(`hVacDays({start_date:'2026-01-01',end_date:'2026-01-08'})`), 0);
assert.equal(run(`hVacDays({days:7})`), 7);
run(`hr.d = { emps: [
  { id: 1, full_name: 'Test A', legal_entity_id: 1, extra_le_ids: [2], department: 'A', object_name: 'X', hired_on: '2024-11-07', started_on: '2025-11-06', birthday: '1990-11-07', contract_until: '2026-11-20' },
  { id: 2, full_name: 'Test B', legal_entity_id: 1, department: 'B', hired_on: '2020-01-01', status: 'fired', fired_on: '2023-02-01' },
  { id: 3, full_name: 'Test C', legal_entity_id: 1, department: 'A', status: 'fired', hired_on: '2020-01-01', fired_on: '2026-01-01' },
  { id: 4, full_name: 'Test D', employment_type: 'self', started_on: '2027-01-01', birthday: '1900-02-15', acts:{'2026-01':'2026-02-01'} }
], les: [{ id: 1, name: 'Test LE1' }, { id: 2, name: 'Test LE2' }],
priv: [{ employee_id: 1, passport: 'test-only', mil_note: 'mil', wp_strengths: 'strength', file_docs:['Document A'] }],
  vacs: [{id:12,employee_id:1,start_date:'2025-12-31',end_date:'2026-01-02',days:3}], safety: [], pos: [], vacancies: [{id:8,legal_entity_id:1,opened_on:'2026-01-01',due_on:'2026-12-31',status:'open'}], cands: [{id:9,vacancy_id:8,employee_id:1,createdAt:'2026-01-10',probation:3,comp_scores:{Communication:4}}], owners: [], sout: [], lna: [{id:10,title:'Test LNA',need_ack:true,legal_entity_id:1,acks:{1:'2026-01-01'}}], progs: [], events: [{id:11,event_date:'2026-01-01',participants:[1]}], files:[{entity:'emp',record_id:1,doc:'Document B'}] };
var o = { year: 2026, asOf: '2026-11-06', parts: ['sum','emp','vac','ot','mil','pos','hire','own','le','sout','lna','prog','event','docs','acks','acts'], types: ['staff','self'], status: 'current', schema: true };
var spec = hXlsSpec(o, [1,2,0]);`);
assert.equal(run(`hXlsYears('2024-11-07','2026-11-06')`), 1);
assert.equal(run(`hXlsYears('2024-11-06','2026-11-06')`), 2);
assert.equal(run(`hXlsYears('', '2026-11-06')`), null);
assert.equal(run(`hXlsYears('2027-01-01', '2026-11-06')`), null);
for (const sh of run('spec.sheets')) {
  assert.equal(new Set(sh.cols.map(c => c.h)).size, sh.cols.length, sh.name + ': unique labels');
  for (const row of sh.rows) assert.equal(row.length, sh.cols.length, sh.name + ': row width');
}
const cell = (name, label, row = 0) => run(`spec.sheets.find(s=>s.name===${JSON.stringify(name)}).rows[${row}][spec.sheets.find(s=>s.name===${JSON.stringify(name)}).cols.findIndex(c=>c.h===${JSON.stringify(label)})]`);
assert.equal(cell('Сотрудники', 'Полных лет работает (от приёма)'), 1);
assert.equal(cell('Сотрудники', 'Полных лет от фактического выхода'), 1);
assert.equal(cell('Сотрудники', 'Возраст, полных лет'), 35);
assert.equal(cell('Сотрудники', 'До конца договора, дней'), 14);
assert.equal(cell('Сотрудники', 'Дата рождения'), '1990-11-07');
assert.equal(cell('Сотрудники', 'До дня рождения, дней'), 1);
assert.equal(cell('Сотрудники', 'Стаж от приёма, полных месяцев'), 23);
assert.equal(cell('Сотрудники', 'Личное дело: документов не хватает'), 0);
assert.equal(cell('Сотрудники', 'Плановое окончание испытания'), '2026-02-06');
assert.equal(cell('Кандидаты', 'Оценки по компетенциям'), 'Communication: 4');
assert.equal(cell('Мероприятия', 'Участники'), 'Test A');
assert.equal(cell('Акты самозанятых', 'Акт подписан'), 'да');
assert.equal(run(`spec.sheets.find(s=>s.name==='Акты самозанятых').rows.length`), 12);
assert.equal(run(`hXlsBirthday({birthday:'1900-02-15'})`), null);
assert.equal(run(`hXlsYears(hXlsBirthday({birthday:'1900-02-15'}),'2026-11-06')`), null);
assert.equal(run(`hXlsAuto({birthday:'2000-02-29'},'2027-02-28',2027)[3]`), 1);
assert.equal(cell('Сотрудники', 'Личное: Паспорт (серия, номер, кем и когда выдан)'), 'test-only');
assert.equal(run(`spec.sheets.find(s=>s.name==='Сотрудники').rows.length`), 4);
run(`spec = hXlsSpec(Object.assign({},o,{status:'all'}), [1]);`);
assert.equal(run(`spec.sheets.find(s=>s.name==='Сотрудники').rows.length`), 2);
assert.equal(cell('Сотрудники', 'Полных лет работает (от приёма)', 1), 6); // stops at dismissal
run(`spec = hXlsSpec(Object.assign({},o,{status:'active',department:'A',object:'X'}), [1]);`);
assert.equal(run(`spec.sheets.find(s=>s.name==='Сотрудники').rows.length`), 1);
assert.equal(cell('Сводка', 'Договор истекает за 30 дней'), 1);
run(`var selected = hXlsSelect(spec,{columns:{'Сотрудники':['Полных лет работает (от приёма)','ФИО']},notes:false,totals:false});`);
assert.equal(run('selected.sheets.length'), 1);
assert.equal(run('selected.sheets[0].cols[0].h'), 'Полных лет работает (от приёма)');
assert.equal(run('selected.sheets[0].rows[0][0]'), 1);
assert.equal(run('selected.notes.length'), 0);
assert.equal(run('selected.sheets[0].total'), false);
run(`hr.d.priv = null; spec = hXlsSpec(o,[1]);`);
assert.equal(run(`spec.sheets.some(s=>['Воинский учёт','Доли подробно','Личное дело','Ознакомления с ЛНА','Акты самозанятых'].includes(s.name))`), false);
assert.equal(run(`spec.sheets.find(s=>s.name==='Сотрудники').cols.some(c=>c.h.startsWith('Личное:')||c.h.startsWith('Рабочий профиль:'))`), false);
assert.equal(run(`spec.sheets.find(s=>s.name==='Сводка').cols.some(c=>c.h==='Военнообязанных')`), false);
run(`spec = hXlsSpec(Object.assign({},o,{from:'2025-12-30',to:'2026-01-02',year:2026,parts:['emp','vac','event'],status:'current',department:'',object:''}), [1]);`);
assert.equal(run(`spec.sheets.find(s=>s.name==='Сотрудники').rows.length`), 2); // fired 2026-01-01 included, 2023 dismissal excluded
assert.equal(run(`spec.sheets.find(s=>s.name==='Отпуска').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Отпуска подробно').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Мероприятия').rows.length`), 1);
run(`spec = hXlsSpec(Object.assign({},o,{from:'2022-01-01',to:'2026-12-31',year:2026,parts:['sum','emp','vac'],status:'current',department:'',object:''}), [1]);`);
const balance = run(`spec.sheets.find(s=>s.name==='Остатки отпусков')`);
assert.deepEqual(Array.from(balance.rows.map(r => r[balance.cols.findIndex(c => c.h === 'Год')])), [2024, 2025, 2026, 2022, 2023, 2022, 2023, 2024, 2025, 2026]);
const leftCol = balance.cols.findIndex(c => c.h === 'Осталось, дн.'), totalCol = balance.cols.findIndex(c => c.h === 'Остаток за весь период, дн.');
assert.equal(balance.rows[0][totalCol], balance.rows.slice(0, 3).reduce((n, r) => n + r[leftCol], 0));
assert.equal(balance.rows[0][totalCol], balance.rows[2][totalCol]);
assert.ok(run(`spec.sheets.find(s=>s.name==='Сводка').cols.some(c=>c.h==='Остаток 2022, дн.')`));
assert.ok(run(`spec.sheets.find(s=>s.name==='Сводка').cols.some(c=>c.h==='Остаток 2026, дн.')`));
assert.ok(run(`spec.sheets.find(s=>s.name==='Сотрудники').cols.some(c=>c.h==='Осталось запланировать отпусков 2022, дней')`));
assert.ok(run(`spec.sheets.find(s=>s.name==='Сотрудники').cols.some(c=>c.h==='Осталось запланировать отпусков 2026, дней')`));
assert.equal(cell('Сводка', 'Отпуск 2022: норма, дн.'), 56);
assert.equal(cell('Сотрудники', 'Осталось запланировать отпусков 2022, дней'), null);
run(`hr.d.safety = [
  {employee_id:1,kind:'Вводный инструктаж (журнал)',doc:'Организация',done_on:'2025-12-31',next_on:'2026-01-01'},
  {employee_id:1,kind:'Вводный инструктаж (журнал)',doc:'Организация',done_on:'2027-01-01',next_on:'2027-12-31'}
];
hr.d.sout = [{id:20,legal_entity_id:1,assessed_on:'2024-01-01',next_on:'2026-12-31'},{id:21,legal_entity_id:1,assessed_on:'2018-01-01',next_on:'2020-12-31'}];
hr.d.lna.push({id:22,title:'In range',legal_entity_id:1,approved_on:'2024-01-01',review_on:'2026-12-31'},{id:23,title:'Out',legal_entity_id:1,approved_on:'2018-01-01',review_on:'2020-12-31'});
hr.d.progs = [{id:24,title:'In range',start_on:'2024-01-01',end_on:'2026-12-31'},{id:25,title:'Out',start_on:'2018-01-01',end_on:'2020-12-31'}];
hr.d.vacancies = [{id:8,legal_entity_id:1,opened_on:'2024-01-01',due_on:'2025-01-01',closed_on:'2025-02-01'},{id:12,legal_entity_id:1,opened_on:'2018-01-01',due_on:'2019-01-01',closed_on:'2020-01-01'}];
hr.d.cands = [{id:9,vacancy_id:8,createdAt:'2025-12-31',employee_id:1},{id:13,vacancy_id:12,createdAt:'2019-01-01'}];
hr.d.events.push({id:14,event_date:'2020-01-01'});
spec = hXlsSpec(Object.assign({},o,{from:'2022-01-01',to:'2026-12-31',year:2026,parts:['ot','hire','sout','lna','prog','event'],status:'current',department:'',object:''}), [1]);`);
assert.equal(run(`spec.sheets.find(s=>s.name==='СОУТ').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Локальные акты').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Мотивационные программы').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Мероприятия').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Вакансии подробно').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Кандидаты').rows.length`), 1);
assert.equal(run(`spec.sheets.find(s=>s.name==='Обучение подробно').rows.length`), 1);
assert.equal(run(`hSafetyRecs(1,'Вводный инструктаж (журнал)','2022-01-01','2026-12-31').length`), 1);
run(`var preview = hXlsPreview({name:'<unsafe>',cols:[{h:'A & B'},{h:'Date',t:'date'},{h:'Number',t:'int'}],rows:Array.from({length:7},()=>['<img onerror=bad>', '2026-11-06', 0])});`);
assert.match(run('preview'), /&lt;img onerror=bad&gt;/);
assert.doesNotMatch(run('preview'), /<img/);
assert.match(run('preview'), /A &amp; B/);
assert.match(run('preview'), /06\.11\.2026/);
assert.match(run('preview'), />0<\/td>/);
assert.equal((run('preview').match(/<tr>/g)||[]).length, 6);
assert.match(run('preview'), /5 из 7/);
assert.match(run(`hXlsPreview({cols:[],rows:[]})`), /Выберите столбцы/);
console.log('HR export: anniversaries, dismissal, filters, multiple employers, column order, row alignment, private field access passed');
