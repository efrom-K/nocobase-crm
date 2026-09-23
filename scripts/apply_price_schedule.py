#!/usr/bin/env python3
"""Подстановка цены по графику и площадей по доп. соглашениям: когда у активного договора начинается новый период цены, ставка и АП меняются сами.

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
psql("create table if not exists contract_area_applied(contract_id bigint primary key, sig text not null, applied_at timestamptz default now())")

# ---- площади по доп. соглашениям (contract_areas): площадь, АП и средняя ставка = сумма строк, действующих на дату ----
# Пока действует период «Графика цены аренды» (скидка), АП/ставку задаёт он — площади меняют только area_sqm.
# sig = набор действующих строк + флаг скидки: пересчёт только когда он поменялся, ручные правки АП между сменами не затираются.
T = TODAY.isoformat()
area_rows = jrows("select a.contract_ref_id as cid, a.id, a.area_sqm, a.rent_per_sqm, c.contract_number, c.object_name, c.area_sqm as c_area, c.rent_per_sqm as c_rate, c.rent_amount as c_rent "
                  "from contract_areas a join rental_contracts c on c.id=a.contract_ref_id "
                  "where a.contract_type='active' and c.termination_date is null and coalesce(a.area_sqm,0)>0 "
                  "and (a.date_from is null or a.date_from<=%s) and (a.date_to is null or a.date_to>=%s) order by a.id" % (q(T), q(T)))
area_cids = {r['cid'] for r in jrows("select distinct contract_ref_id as cid from contract_areas where contract_type='active'")}
disc_cids = {r['cid'] for r in jrows("select distinct contract_ref_id as cid from contract_price_periods where contract_type='active' and date_from<=%s and date_to>=%s" % (q(T), q(T)))}
area_applied = {r['contract_id']: r['sig'] for r in jrows("select contract_id, sig from contract_area_applied")}
by_c = {}
for r in area_rows: by_c.setdefault(r['cid'], []).append(r)
area_stmts, area_report, area_now = [], [], {}
for cid in sorted(area_cids):
    rows = by_c.get(cid, [])
    disc = cid in disc_cids
    sig = ','.join('%s:%s:%s' % (r['id'], r['area_sqm'], r['rent_per_sqm']) for r in rows) + ('|disc' if disc else '')
    area = r2(sum(r['area_sqm'] for r in rows)); rent = r2(sum(r['area_sqm'] * (r['rent_per_sqm'] or 0) for r in rows))
    area_now[cid] = area
    if area_applied.get(cid) == sig: continue
    area_stmts.append("insert into contract_area_applied(contract_id, sig) values (%s, %s) on conflict (contract_id) do update set sig=excluded.sig, applied_at=now();" % (cid, q(sig)))
    if not rows: continue
    c = rows[0]
    new = {'area_sqm': area}
    if not disc:
        new['rent_amount'] = rent
        new['rent_per_sqm'] = r2(rent / area) if area > 0 else None
    cur = {'area_sqm': c['c_area'], 'rent_per_sqm': c['c_rate'], 'rent_amount': c['c_rent']}
    changed = {k: (cur[k], v) for k, v in new.items() if v is not None and (cur[k] is None or abs(cur[k] - v) >= 0.005)}
    if not changed: continue
    area_report.append((cid, changed))
    area_stmts.append("update rental_contracts set %s where id=%s;" % (', '.join('%s=%s' % (k, v[1]) for k, v in changed.items()), cid))
    for k, (old, nv) in changed.items():
        area_stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,field,old_value,new_value,created_at) values ('active',%s,NULL,'field',%s,%s,%s,now());"
                          % (cid, q(k), q(num(old) if old is not None else ''), q(num(nv))))
    text = 'Площади по доп. соглашениям на %s: %s м², АП %s ₽/мес (автоматически)' % (dmy(T), fmt(area), fmt(rent))
    area_stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,text,created_at) values ('active',%s,NULL,'area',%s,now());" % (cid, q(text)))
print('%s (дата %s): договоров с изменением площадей — %d' % ('DRY-RUN' if DRY else 'ПЛОЩАДИ', T, len(area_report)))
for cid, ch in area_report:
    print('  договор #%s: %s' % (cid, ', '.join('%s %s → %s' % (k, num(v[0]) if v[0] is not None else '—', num(v[1])) for k, v in ch.items())))
if area_stmts and not DRY:
    psql('begin;\n' + '\n'.join(area_stmts) + '\ncommit;\n')
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
    area = area_now.get(c['id'], c['area_sqm']) or 0
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
