#!/usr/bin/env python3
"""Цена договора по времени: основная цена на весь срок + периоды «Графика цены аренды» на отдельные даты.

  apply_price_schedule.py              # выполнить (cron раз в сутки, 00:10)
  apply_price_schedule.py --dry-run    # только показать, что изменилось бы
  apply_price_schedule.py --date 2026-05-01   # прогнать «как будто сегодня» эту дату (проверка перехода периодов)

Текущая цена договора (rent_per_sqm / rent_amount) = цена периода, действующего сегодня, иначе основная цена
(base_rent_per_sqm / base_rent_amount). Та же логика, что в карточке (scheduleTarget в contract-modals.js):
  период «за 1 кв.м.»  → ставка = цена, АП = цена × площадь
  период «фикс. сумма» → АП = цена, ставка пусто (ставку делением АП на площадь НЕ выводим — только точные числа)
Цены «в неделю/день/год» (старые записи) не применяются. Если периоды пересекаются — берётся начавшийся позже.
Смена (начало периода, переход между периодами, возврат к основной цене после конца периода) применяется один раз:
состояние запоминается в contract_price_applied, поэтому ручные правки между сменами не затираются.
Договоры с датой расторжения пропускаются. Изменения пишутся в историю (автор «Система»), сотрудникам договора —
сообщение в колокольчик. Если карточку уже пересчитали днём (она делает то же самое), значения совпадут — повторного уведомления не будет.
"""
import json, os, subprocess, sys
from datetime import date

DRY = '--dry-run' in sys.argv
TODAY = date.fromisoformat(sys.argv[sys.argv.index('--date') + 1]) if '--date' in sys.argv else date.today()
REGISTRY_PAGE = os.environ.get('NB_REGISTRY_PAGE', 'b5znz7yxpy3')
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
T = TODAY.isoformat()
contracts = jrows("select id, contract_number, object_name, area_sqm, rent_per_sqm, rent_amount, base_rent_per_sqm, base_rent_amount from rental_contracts "
                  "where termination_date is null and (id in (select contract_ref_id from contract_price_periods where contract_type='active') "
                  "or id in (select contract_id from contract_price_applied))")
periods = {}
for p in jrows("select id, contract_ref_id, date_from::text, date_to::text, basis, unit, amount from contract_price_periods where contract_type='active' order by date_from, id"):
    periods.setdefault(p['contract_ref_id'], []).append(p)
applied = {r['contract_id']: r['sig'] for r in jrows("select contract_id, sig from contract_price_applied")}
members = {}
for r in jrows('select f_f6uc3x0qna1 as cid, f_z8ov78krtg5 as uid from "rentalContractsMembers"'): members.setdefault(r['cid'], set()).add(r['uid'])

def label_of(p): return '%s ₽ %s%s' % (fmt(float(p['amount'])), 'за 1 кв.м. ' if p['basis'] == 'per_sqm' else '', UNIT_TITLE.get(p['unit'] or 'month', ''))
def base_label(c):
    parts = []
    if c['base_rent_per_sqm'] is not None: parts.append('%s ₽ за 1 кв.м.' % fmt(c['base_rent_per_sqm']))
    if c['base_rent_amount'] is not None: parts.append('АП %s ₽ в месяц' % fmt(c['base_rent_amount']))
    return ' · '.join(parts) or 'не задана'

stmts, report = [], []
for c in contracts:
    eff = [p for p in periods.get(c['id'], []) if p['date_from'] <= T <= p['date_to'] and (p['unit'] or 'month') == 'month']
    p = eff[-1] if eff else None
    area = c['area_sqm'] or 0
    if p:
        amt = float(p['amount'])
        sig = 'p:%s|%s|%s|%s' % (p['id'], p['amount'], p['basis'], area)
        new = ({'rent_per_sqm': amt, 'rent_amount': r2(amt * area)} if area > 0 else {'rent_per_sqm': amt}) if p['basis'] == 'per_sqm' else {'rent_amount': amt, 'rent_per_sqm': None}
        text = 'Цена по графику: %s (период %s — %s)' % (label_of(p), dmy(p['date_from']), dmy(p['date_to']))
    else:
        if c['base_rent_per_sqm'] is None and c['base_rent_amount'] is None: continue
        sig = 'base:%s|%s' % (c['base_rent_per_sqm'], c['base_rent_amount'])
        new = {'rent_per_sqm': c['base_rent_per_sqm'], 'rent_amount': c['base_rent_amount']}
        text = 'Период графика закончился — действует основная цена: %s' % base_label(c)
    if applied.get(c['id']) == sig: continue
    changed = {k: (c[k], v) for k, v in new.items()
               if (v is None and c[k] is not None) or (v is not None and (c[k] is None or abs(c[k] - v) >= 0.005))}
    report.append((c['id'], text, changed))
    stmts.append("insert into contract_price_applied(contract_id, sig) values (%s, %s) on conflict (contract_id) do update set sig=excluded.sig, applied_at=now();" % (c['id'], q(sig)))
    if not changed: continue
    stmts.append("update rental_contracts set %s where id=%s;" % (', '.join('%s=%s' % (k, 'NULL' if v[1] is None else v[1]) for k, v in changed.items()), c['id']))
    for k, (old, nv) in changed.items():
        stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,field,old_value,new_value,created_at) values ('active',%s,NULL,'field',%s,%s,%s,now());"
                     % (c['id'], q(k), q(num(old) if old is not None else ''), q(num(nv) if nv is not None else '')))
    stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,text,created_at) values ('active',%s,NULL,'price',%s,now());" % (c['id'], q(text + ' (автоматически)')))
    title = 'Договор ' + (c['contract_number'] or c['object_name'] or '#%s' % c['id'])
    opts = json.dumps({'url': '/admin/%s?open=active:%s' % (REGISTRY_PAGE, c['id'])})
    for uid in sorted(members.get(c['id'], set())):
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'status',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);" % (uid, q(title), q('Цена аренды изменилась. ' + text), q(opts)))

print('%s (дата %s): смен цены — %d' % ('DRY-RUN' if DRY else 'ПРИМЕНЕНИЕ', T, len(report)))
for cid, text, ch in report:
    print('  договор #%s: %s → %s' % (cid, text, ', '.join('%s %s → %s' % (k, num(v[0]) if v[0] is not None else '—', num(v[1]) if v[1] is not None else '—') for k, v in ch.items()) or 'значения уже совпадают'))
if stmts and not DRY:
    psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
