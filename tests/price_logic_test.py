# -*- coding: utf-8 -*-
"""Сверка логики «Дополнительных расчётов аренды»: карточка (JS, contract-modals.js) против ночного скрипта (Python, apply_price_schedule.py)
и против ожидаемых значений, посчитанных вручную. Запуск: python3 tests/price_logic_test.py (нужен node). Выполняется в CI."""
import ast, json, subprocess, sys, os, random
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.environ.get('PY', os.path.join(HERE, '..', 'scripts', 'apply_price_schedule.py'))
src = open(SCRIPT, encoding='utf-8').read()
tree = ast.parse(src)
keep = {'r2', 'mul_money', 'fmt', 'dmy', 'prange', 'comp_label', 'base_text', 'target'}
nodes = [n for n in tree.body if (isinstance(n, ast.FunctionDef) and n.name in keep) or
         (isinstance(n, ast.Assign) and any(getattr(t, 'id', None) == 'COMPONENTS' for t in n.targets))]
ns = {'periods': {}}
exec(compile(ast.Module(body=nodes, type_ignores=[]), 'py', 'exec'), ns)

def py_values(contract, plist, iso):
    ns['periods'].clear()
    ns['periods'][contract['id']] = sorted(plist, key=lambda p: (p['date_from'], p['id']))
    t = ns['target'](contract, iso)
    return t[1] if t else {}

def js_values(cases):
    here = HERE
    code = """
const L = require('%s/price_logic_extract.js');
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const out = cases.map(c => {
  const t = L.scheduleTarget(c.periods, c.rec, c.iso);
  const next = {};
  ['rent_per_sqm','rent_amount','utility_per_sqm','utility_amount','deposit_amount'].forEach(f => { const ch = L.nextFieldChange(c.periods, c.rec, c.iso, f); next[f] = ch ? [ch.date, ch.value] : null; });
  return { values: t.values, active: Object.fromEntries(Object.entries(t.active).map(([k, p]) => [k, p ? p.id : null])), next };
});
process.stdout.write(JSON.stringify(out));
""" % here
    r = subprocess.run(['node', '-e', code], input=json.dumps(cases).encode(), capture_output=True)
    if r.returncode: sys.exit(r.stderr.decode())
    return json.loads(r.stdout)

FIELDS = ['rent_per_sqm', 'rent_amount', 'utility_per_sqm', 'utility_amount', 'deposit_amount']
def P(pid, a, b, rent=None, rent_basis='per_sqm', util=None, util_basis='per_sqm', dep=None, legacy=False):
    """период: rent/util/dep = None — эта цена не меняется"""
    p = {'id': pid, 'date_from': a, 'date_to': b or '2099-12-31', 'unit': 'month',
         'rent_on': None if legacy else (rent is not None), 'basis': rent_basis if rent is not None else ('per_sqm' if not legacy else rent_basis),
         'amount': rent, 'utility_on': util is not None, 'utility_basis': util_basis if util is not None else None, 'utility_value': util,
         'deposit_on': dep is not None, 'deposit_value': dep}
    return p
BASE = {'id': 1, 'area_sqm': 10, 'base_rent_per_sqm': 100, 'base_rent_amount': 1000, 'base_utility_per_sqm': 20, 'base_utility_amount': 200,
        'base_deposit_amount': 1000, 'rent_per_sqm': 100, 'rent_amount': 1000, 'utility_per_sqm': 20, 'utility_amount': 200, 'deposit_amount': 1000, 'total_amount': 1200}

# (название, договор, периоды, дата, ожидаемые значения; None — «ключ отсутствует / не трогать»)
S = []
def case(name, rec, periods, iso, exp): S.append((name, rec, periods, iso, exp))
B = dict(BASE)
case('без периодов — основные значения', B, [], '2026-10-01', {'rent_per_sqm': 100, 'rent_amount': 1000, 'utility_per_sqm': 20, 'utility_amount': 200, 'deposit_amount': 1000})
case('аренда за метр 90', B, [P(1, '2026-10-01', None, rent=90)], '2026-10-01', {'rent_per_sqm': 90, 'rent_amount': 900, 'utility_amount': 200, 'deposit_amount': 1000})
case('аренда суммой 950 — ставка пустая', B, [P(1, '2026-10-01', None, rent=950, rent_basis='fixed')], '2026-10-05', {'rent_per_sqm': None, 'rent_amount': 950, 'utility_amount': 200})
case('день до начала периода — основные', B, [P(1, '2026-10-01', None, rent=90)], '2026-09-30', {'rent_per_sqm': 100, 'rent_amount': 1000})
case('последний день периода включительно', B, [P(1, '2026-10-01', '2026-10-31', rent=90)], '2026-10-31', {'rent_amount': 900})
case('день после окончания — возврат к основной', B, [P(1, '2026-10-01', '2026-10-31', rent=90)], '2026-11-01', {'rent_per_sqm': 100, 'rent_amount': 1000})
case('сбор суммой 300 + платёж 1500, аренда не трогается', B, [P(1, '2026-10-01', None, util=300, util_basis='fixed', dep=1500)], '2026-10-02',
     {'rent_per_sqm': 100, 'rent_amount': 1000, 'utility_per_sqm': None, 'utility_amount': 300, 'deposit_amount': 1500})
case('сбор за метр 25', B, [P(1, '2026-10-01', None, util=25)], '2026-10-02', {'utility_per_sqm': 25, 'utility_amount': 250})
case('все три сразу', B, [P(1, '2026-10-01', None, rent=110, util=30, dep=2000)], '2026-10-02',
     {'rent_per_sqm': 110, 'rent_amount': 1100, 'utility_per_sqm': 30, 'utility_amount': 300, 'deposit_amount': 2000})
ov = [P(1, '2026-10-01', None, rent=90), P(2, '2026-10-10', '2026-10-20', rent=80)]
case('пересечение аренды: до вложенного — первый', B, ov, '2026-10-05', {'rent_amount': 900})
case('пересечение аренды: вложенный начался позже — он', B, ov, '2026-10-15', {'rent_amount': 800})
case('пересечение аренды: вложенный кончился — снова первый', B, ov, '2026-10-21', {'rent_amount': 900})
dif = [P(1, '2026-10-01', '2026-12-31', rent=90), P(2, '2026-11-01', None, util=300, util_basis='fixed')]
case('разные цены одновременно: только аренда', B, dif, '2026-10-15', {'rent_amount': 900, 'utility_amount': 200})
case('разные цены одновременно: обе', B, dif, '2026-11-15', {'rent_amount': 900, 'utility_amount': 300})
case('разные цены: аренда кончилась, сбор идёт', B, dif, '2027-01-01', {'rent_amount': 1000, 'utility_amount': 300})
case('старый период без галочки (rent_on пусто) = аренда', B, [P(1, '2026-10-01', None, rent=95, legacy=True)], '2026-10-02', {'rent_amount': 950})
case('период только сбора не трогает аренду из старого периода', B, [P(1, '2026-10-01', None, rent=95, legacy=True), P(2, '2026-10-05', None, util=40)], '2026-10-06',
     {'rent_amount': 950, 'utility_amount': 400})
NA = dict(BASE, area_sqm=None)
case('нет площади + аренда за метр: ставка меняется, сумма не трогается', NA, [P(1, '2026-10-01', None, rent=90)], '2026-10-02', {'rent_per_sqm': 90, 'rent_amount': 'ABSENT'})
NB = dict(BASE, base_utility_per_sqm=None, base_utility_amount=None, utility_per_sqm=None, utility_amount=None)
case('основной сбор не задан, периода нет — сбор не трогаем', NB, [], '2026-10-02', {'utility_amount': 'ABSENT', 'utility_per_sqm': 'ABSENT'})
case('копейки: 1073,19 м² × 32,18', dict(BASE, area_sqm=1073.19), [P(1, '2026-10-01', None, rent=32.18)], '2026-10-02', {'rent_amount': 34535.25})
case('копейки: 317,9 × 408,94', dict(BASE, area_sqm=317.9), [P(1, '2026-10-01', None, rent=408.94)], '2026-10-02', {'rent_amount': 130002.03})
case('копейки: 0,5 × 100,01 (половина копейки)', dict(BASE, area_sqm=0.5), [P(1, '2026-10-01', None, rent=100.01)], '2026-10-02', {'rent_amount': 50.01})
case('копейки: 26,75 × 0,1 = 2,675 → 2,68', dict(BASE, area_sqm=0.1), [P(1, '2026-10-01', None, rent=26.75)], '2026-10-02', {'rent_amount': 2.68})
case('копейки: 0,15 × 0,1 = 0,015 → 0,02', dict(BASE, area_sqm=0.1), [P(1, '2026-10-01', None, rent=0.15)], '2026-10-02', {'rent_amount': 0.02})
case('копейки: 408,94 × 317,9 = 130002,026 → 130002,03', dict(BASE, area_sqm=317.9), [P(1, '2026-10-01', None, util=408.94)], '2026-10-02', {'utility_amount': 130002.03})
case('копейки: 99,99 × 1234,56 = 123443,6544 → 123443,65', dict(BASE, area_sqm=1234.56), [P(1, '2026-10-01', None, rent=99.99)], '2026-10-02', {'rent_amount': 123443.65})

cases = [{'rec': rec, 'periods': periods, 'iso': iso} for (_, rec, periods, iso, _) in S]
js = js_values(cases)
fails = 0
for (name, rec, periods, iso, exp), j in zip(S, js):
    py = py_values(rec, periods, iso)
    problems = []
    for f, want in exp.items():
        jv = j['values'].get(f, 'ОТСУТСТВУЕТ')
        pv = py.get(f, 'ОТСУТСТВУЕТ')
        ok = lambda v: (want == 'ABSENT' and v == 'ОТСУТСТВУЕТ') or (want is None and v is None) or (want not in (None, 'ABSENT') and v not in (None, 'ОТСУТСТВУЕТ') and abs(v - want) < 0.005)
        if not ok(jv): problems.append('%s: карточка %s, нужно %s' % (f, jv, want))
        if not ok(pv): problems.append('%s: скрипт %s, нужно %s' % (f, pv, want))
    for f in FIELDS:   # карточка и скрипт должны совпадать и там, где ожидание не задано
        jv, pv = j['values'].get(f, 'ОТСУТСТВУЕТ'), py.get(f, 'ОТСУТСТВУЕТ')
        same = (jv == pv) or (isinstance(jv, (int, float)) and isinstance(pv, (int, float)) and abs(jv - pv) < 0.005)
        if not same: problems.append('%s: карточка %s ≠ скрипт %s' % (f, jv, pv))
    fails += bool(problems)
    print(('OK   ' if not problems else 'FAIL ') + name + ('' if not problems else '\n       ' + '\n       '.join(problems)))

# приписка «с ДД.ММ: X ₽» — ближайшее изменение
print('\n-- ближайшее изменение (приписка в карточке)')
nx = js_values([{'rec': B, 'periods': ov, 'iso': '2026-10-05'}, {'rec': B, 'periods': ov, 'iso': '2026-10-15'}, {'rec': B, 'periods': dif, 'iso': '2026-09-20'},
                {'rec': B, 'periods': [P(1, '2026-10-01', None, rent=100)], 'iso': '2026-09-20'}])
checks = [('в первом периоде — ждём вложенный 10.10 → 800', nx[0]['next']['rent_amount'], ['2026-10-10', 800]),
          ('во вложенном — ждём 21.10 → снова 900', nx[1]['next']['rent_amount'], ['2026-10-21', 900]),
          ('до всех периодов: аренда 01.10 → 900', nx[2]['next']['rent_amount'], ['2026-10-01', 900]),
          ('до всех периодов: сбор 01.11 → 300', nx[2]['next']['utility_amount'], ['2026-11-01', 300]),
          ('период с той же ценой — изменения нет', nx[3]['next']['rent_amount'], None)]
for name, got, want in checks:
    ok = got == want or (got and want and got[0] == want[0] and abs(got[1] - want[1]) < 0.005)
    fails += not ok
    print(('OK   ' if ok else 'FAIL ') + name + ('' if ok else '  получили %s' % got))

# случайные сценарии: карточка и скрипт должны совпадать всегда
print('\n-- случайные сценарии (карточка против скрипта)')
random.seed(7)
rc, bad = [], 0
for n in range(400):
    area = random.choice([None, 0, 1, 10, 57.3, 317.9, 1073.19, 0.5])
    rec = dict(BASE, area_sqm=area, base_rent_per_sqm=random.choice([None, 100, 32.18, 408.94]), base_rent_amount=random.choice([None, 1000, 34535.25]),
               base_utility_per_sqm=random.choice([None, 20]), base_utility_amount=random.choice([None, 200, 34535]), base_deposit_amount=random.choice([None, 1000]))
    ps = []
    for k in range(random.randint(0, 4)):
        a = date(2026, 10, 1) + timedelta(days=random.randint(0, 60))
        b = None if random.random() < 0.4 else (a + timedelta(days=random.randint(0, 40))).isoformat()
        ps.append(P(k + 1, a.isoformat(), b, rent=random.choice([None, 90, 950.5, 1.005]), rent_basis=random.choice(['per_sqm', 'fixed']),
                    util=random.choice([None, 25, 300]), util_basis=random.choice(['per_sqm', 'fixed']), dep=random.choice([None, 1500])))
    iso = (date(2026, 9, 25) + timedelta(days=random.randint(0, 110))).isoformat()
    rc.append((rec, ps, iso))
jsr = js_values([{'rec': r, 'periods': p, 'iso': i} for r, p, i in rc])
for (rec, ps, iso), j in zip(rc, jsr):
    py = py_values(rec, ps, iso)
    for f in FIELDS:
        jv, pv = j['values'].get(f, 'ОТСУТСТВУЕТ'), py.get(f, 'ОТСУТСТВУЕТ')
        if jv == pv or (isinstance(jv, (int, float)) and isinstance(pv, (int, float)) and abs(jv - pv) < 0.005): continue
        bad += 1
        if bad <= 8: print('  расхождение', f, 'карточка', jv, 'скрипт', pv, '| площадь', rec['area_sqm'], 'дата', iso, 'периоды', [(p['id'], p['date_from'], p['date_to'], p['amount'], p['basis'], p['utility_value'], p['utility_basis'], p['deposit_value']) for p in ps])
print('расхождений: %d из %d проверок' % (bad, len(rc) * len(FIELDS)))
fails += bool(bad)
print('\nИТОГ: %s' % ('всё сходится' if not fails else 'есть ошибки: %d' % fails))
sys.exit(1 if fails else 0)
