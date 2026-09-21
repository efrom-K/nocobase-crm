#!/usr/bin/env python3
"""Подстановка цены по графику: когда у активного договора начинается новый период цены, ставка и АП меняются сами.

  apply_price_schedule.py              # выполнить (cron раз в сутки, например 00:10)
  apply_price_schedule.py --dry-run    # только показать, что изменилось бы
  apply_price_schedule.py --date 2026-05-01   # прогнать «как будто сегодня» эту дату (проверка перехода периодов)

Правила (те же, что у кнопки в карточке):
  «за 1 кв.м.»  → ставка = цена в пересчёте на месяц, АП = ставка × площадь
  «фикс. сумма» → АП = цена в пересчёте на месяц, ставка = АП / площадь (если площадь известна)
Пересчёт в месяц: неделя ×52/12, день ×365/12, год ÷12. Период, действующий на дату, определяется по date_from ≤ дата ≤ date_to
(если действуют несколько — берётся начавшийся позже). Уже применённый период (таблица contract_price_applied) повторно не применяется,
поэтому ручные правки ставки между сменами периодов не затираются. Договоры с датой расторжения пропускаются.
Изменения пишутся в историю договора (автор «Система»), сотрудникам договора и ролям rental_dept/legal_dept приходит сообщение в колокольчик.
"""
import json, os, subprocess, sys
from datetime import date

DRY = '--dry-run' in sys.argv
TODAY = date.fromisoformat(sys.argv[sys.argv.index('--date') + 1]) if '--date' in sys.argv else date.today()
REGISTRY_PAGE = os.environ.get('NB_REGISTRY_PAGE', 'b5znz7yxpy3')
ROLES = ('rental_dept', 'legal_dept')
FACTOR = {'month': 1, 'week': 52 / 12, 'day': 365 / 12, 'year': 1 / 12}
UNIT_TITLE = {'month': 'в месяц', 'week': 'в неделю', 'day': 'в день', 'year': 'в год'}
PSQL_CMD = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(PSQL_CMD)] if os.environ.get('NB_SSH') else ['sudo', '-n'] + PSQL_CMD
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:400])
    return r.stdout.decode()
def q(v): return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"
def jrows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')
def r2(x): return round(x + 1e-9, 2)
def num(v): return ('%.2f' % v).rstrip('0').rstrip('.')                     # 1200.0 → «1200», 1200.5 → «1200.5» (как в истории карточек)
def fmt(v): return ('{:,.2f}'.format(v).replace(',', ' ').replace('.', ',')).rstrip('0').rstrip(',')
def dmy(iso): y, m, d = iso.split('-'); return '%s.%s.%s' % (d, m, y)

psql("create table if not exists contract_price_applied(contract_id bigint primary key, sig text not null, applied_at timestamptz default now())")
contracts = jrows("select id, contract_number, object_name, tenant_name, area_sqm, rent_per_sqm, rent_amount from rental_contracts "
                  "where termination_date is null and id in (select contract_ref_id from contract_price_periods where contract_type='active')")
periods = {}
for p in jrows("select id, contract_ref_id, date_from::text, date_to::text, basis, unit, amount from contract_price_periods where contract_type='active' order by date_from, id"):
    periods.setdefault(p['contract_ref_id'], []).append(p)
applied = {r['contract_id']: r['sig'] for r in jrows("select contract_id, sig from contract_price_applied")}
members = {}
for r in jrows('select f_f6uc3x0qna1 as cid, f_z8ov78krtg5 as uid from "rentalContractsMembers"'): members.setdefault(r['cid'], set()).add(r['uid'])
role_users = {r['uid'] for r in jrows('select "userId" as uid from "rolesUsers" where "roleName" in (%s)' % ','.join(q(x) for x in ROLES))}

stmts, report = [], []
for c in contracts:
    eff = [p for p in periods.get(c['id'], []) if p['date_from'] <= TODAY.isoformat() <= p['date_to']]
    if not eff: continue
    p = eff[-1]
    sig = '%s|%s|%s|%s' % (p['id'], p['amount'], p['basis'], p['unit'])
    if applied.get(c['id']) == sig: continue
    monthly = float(p['amount']) * FACTOR.get(p['unit'] or 'month', 1)
    area = c['area_sqm'] or 0
    new = {}
    if p['basis'] == 'per_sqm':
        new['rent_per_sqm'] = r2(monthly)
        if area > 0: new['rent_amount'] = r2(new['rent_per_sqm'] * area)
    else:
        new['rent_amount'] = r2(monthly)
        if area > 0: new['rent_per_sqm'] = r2(monthly / area)
    changed = {k: (c[k], v) for k, v in new.items() if c[k] is None or abs(c[k] - v) >= 0.005}
    label = '%s ₽ %s%s' % (fmt(float(p['amount'])), 'за 1 кв.м. ' if p['basis'] == 'per_sqm' else '', UNIT_TITLE.get(p['unit'] or 'month', ''))
    title = 'Договор ' + (c['contract_number'] or c['object_name'] or '#%s' % c['id'])
    report.append((c['id'], dmy(p['date_from']), dmy(p['date_to']), label, {k: (v[0], v[1]) for k, v in changed.items()}))
    stmts.append("insert into contract_price_applied(contract_id, sig) values (%s, %s) on conflict (contract_id) do update set sig=excluded.sig, applied_at=now();" % (c['id'], q(sig)))
    if not changed: continue
    stmts.append("update rental_contracts set %s where id=%s;" % (', '.join('%s=%s' % (k, v[1]) for k, v in changed.items()), c['id']))
    for k, (old, nv) in changed.items():
        stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,field,old_value,new_value,created_at) values ('active',%s,NULL,'field',%s,%s,%s,now());"
                     % (c['id'], q(k), q(num(old) if old is not None else ''), q(num(nv))))
    text = 'Цена по графику: период %s — %s, %s (автоматически)' % (dmy(p['date_from']), dmy(p['date_to']), label)
    stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,text,created_at) values ('active',%s,NULL,'price',%s,now());" % (c['id'], q(text)))
    msg = 'Цена аренды изменена по графику: %s (период %s — %s)' % (label, dmy(p['date_from']), dmy(p['date_to']))
    opts = json.dumps({'url': '/admin/%s?open=active:%s' % (REGISTRY_PAGE, c['id'])})
    for uid in sorted(members.get(c['id'], set()) | role_users):
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'status',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);" % (uid, q(title), q(msg), q(opts)))

print('%s (дата %s): периодов к применению — %d' % ('DRY-RUN' if DRY else 'ПРИМЕНЕНИЕ', TODAY.isoformat(), len(report)))
for cid, a, b, label, ch in report:
    print('  договор #%s: период %s — %s, %s → %s' % (cid, a, b, label, ', '.join('%s %s → %s' % (k, num(v[0]) if v[0] is not None else '—', num(v[1])) for k, v in ch.items()) or 'значения уже совпадают'))
if stmts and not DRY:
    psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
