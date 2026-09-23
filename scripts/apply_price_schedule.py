#!/usr/bin/env python3
"""Цена договора по времени: основная цена на весь срок + периоды «Графика цены аренды» на отдельные даты.

  apply_price_schedule.py              # выполнить (cron раз в сутки, 00:10)
  apply_price_schedule.py --dry-run    # только показать, что изменилось бы
  apply_price_schedule.py --date 2026-05-01   # прогнать «как будто сегодня» эту дату (проверка перехода периодов)
  apply_price_schedule.py --warn       # предупреждение «скоро сменится цена» (cron в будни 10:00): смены до следующего
                                       # рабочего дня включительно — в пятницу видно субботу, воскресенье и понедельник

Текущая цена договора (rent_per_sqm / rent_amount) = цена периода, действующего сегодня, иначе основная цена
(base_rent_per_sqm / base_rent_amount). Та же логика, что в карточке (scheduleTarget в contract-modals.js):
  период «за 1 кв.м.»  → ставка = цена, АП = цена × площадь
  период «фикс. сумма» → АП = цена, ставка пусто (ставку делением АП на площадь НЕ выводим — только точные числа)
Цены «в неделю/день/год» (старые записи) не применяются. Если периоды пересекаются — берётся начавшийся позже.
Смена (начало периода, переход между периодами, возврат к основной цене после конца периода) применяется один раз:
состояние запоминается в contract_price_applied, поэтому ручные правки между сменами не затираются.
Договоры с датой расторжения пропускаются. Изменения пишутся в историю (автор «Система»), прикреплённым к договору бухгалтерам
(если их нет — всем прикреплённым) — сообщение в колокольчик. Если карточку уже пересчитали днём (она делает то же самое), значения совпадут — повторного уведомления не будет.
"""
import json, os, subprocess, sys
from datetime import date, timedelta

DRY = '--dry-run' in sys.argv
WARN = '--warn' in sys.argv
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
accountants = {r['uid'] for r in jrows('select "userId" as uid from "rolesUsers" where "roleName" = \'accounting_dept\'')}
def recipients(cid):
    # цена — забота бухгалтерии: прикреплённые бухгалтеры; если их нет среди прикреплённых — все прикреплённые
    ms = members.get(cid, set())
    return (ms & accountants) or ms

def label_of(p): return '%s ₽ %s%s' % (fmt(float(p['amount'])), 'за 1 кв.м. ' if p['basis'] == 'per_sqm' else '', UNIT_TITLE.get(p['unit'] or 'month', ''))
def base_label(c):
    parts = []
    if c['base_rent_per_sqm'] is not None: parts.append('%s ₽ за 1 кв.м.' % fmt(c['base_rent_per_sqm']))
    if c['base_rent_amount'] is not None: parts.append('АП %s ₽ в месяц' % fmt(c['base_rent_amount']))
    return ' · '.join(parts) or 'не задана'

def target(c, iso):
    """Цена договора на дату iso: (sig, новые значения, текст) или None, если цены нет вовсе."""
    eff = [p for p in periods.get(c['id'], []) if p['date_from'] <= iso <= p['date_to'] and (p['unit'] or 'month') == 'month']
    p = eff[-1] if eff else None
    area = c['area_sqm'] or 0
    if p:
        amt = float(p['amount'])
        new = ({'rent_per_sqm': amt, 'rent_amount': r2(amt * area)} if area > 0 else {'rent_per_sqm': amt}) if p['basis'] == 'per_sqm' else {'rent_amount': amt, 'rent_per_sqm': None}
        return ('p:%s|%s|%s|%s' % (p['id'], p['amount'], p['basis'], area), new, 'Цена по графику: %s (период %s — %s)' % (label_of(p), dmy(p['date_from']), dmy(p['date_to'])),
                'по графику %s%s, период %s — %s' % (label_of(p), (' (АП %s ₽)' % fmt(new['rent_amount'])) if p['basis'] == 'per_sqm' and 'rent_amount' in new else '', dmy(p['date_from']), dmy(p['date_to'])))
    if c['base_rent_per_sqm'] is None and c['base_rent_amount'] is None: return None
    return ('base:%s|%s' % (c['base_rent_per_sqm'], c['base_rent_amount']), {'rent_per_sqm': c['base_rent_per_sqm'], 'rent_amount': c['base_rent_amount']},
            'Период графика закончился — действует основная цена: %s' % base_label(c),
            'период графика закончится, вернётся основная цена: %s' % base_label(c))
def notify(stmts, c, text):
    title = 'Договор ' + (c['contract_number'] or c['object_name'] or '#%s' % c['id'])
    opts = json.dumps({'url': '/admin/%s?open=active:%s' % (REGISTRY_PAGE, c['id'])})
    for uid in sorted(recipients(c['id'])):
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'status',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);" % (uid, q(title), q(text), q(opts)))
def money_vals(v):
    parts = []
    if v.get('rent_amount') is not None: parts.append('АП %s ₽ в месяц' % fmt(v['rent_amount']))
    if v.get('rent_per_sqm') is not None: parts.append('%s ₽ за 1 кв.м.' % fmt(v['rent_per_sqm']))
    return ', '.join(parts) or 'цена не задана'

stmts, report = [], []
if WARN:
    # предупреждение за рабочий день: смотрим вперёд до следующего рабочего дня включительно
    psql("create table if not exists contract_price_warned(contract_id bigint not null, change_date date not null, sig text not null, warned_at timestamptz default now(), primary key (contract_id, change_date, sig))")
    warned = {(r['contract_id'], r['change_date'], r['sig']) for r in jrows("select contract_id, change_date::text, sig from contract_price_warned")}
    horizon = TODAY + timedelta(days=1)
    while horizon.weekday() >= 5: horizon += timedelta(days=1)
    for c in contracts:
        d = TODAY + timedelta(days=1)
        while d <= horizon:
            prev, cur = target(c, (d - timedelta(days=1)).isoformat()), target(c, d.isoformat())
            if cur and (not prev or prev[0] != cur[0]) and money_vals(cur[1]) != money_vals(prev[1] if prev else {}):
                key = (c['id'], d.isoformat(), cur[0])
                if key not in warned:
                    when = 'завтра' if d == TODAY + timedelta(days=1) else ['в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье'][d.weekday()]
                    text = 'Скоро сменится цена: %s, %s — %s' % (when, dmy(d.isoformat()), cur[3])
                    report.append((c['id'], text, {}))
                    stmts.append("insert into contract_price_warned(contract_id, change_date, sig) values (%s, %s, %s) on conflict do nothing;" % (c['id'], q(d.isoformat()), q(cur[0])))
                    notify(stmts, c, text)
                break
            d += timedelta(days=1)
    print('%s (дата %s): предупреждений о смене цены — %d' % ('DRY-RUN' if DRY else 'ПРЕДУПРЕЖДЕНИЕ', T, len(report)))
    for cid, text, _ in report: print('  договор #%s: %s' % (cid, text))
    if stmts and not DRY: psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
    sys.exit(0)

for c in contracts:
    t = target(c, T)
    if not t: continue
    sig, new, text, _ = t
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
    notify(stmts, c, 'Цена аренды изменилась. ' + text)

print('%s (дата %s): смен цены — %d' % ('DRY-RUN' if DRY else 'ПРИМЕНЕНИЕ', T, len(report)))
for cid, text, ch in report:
    print('  договор #%s: %s → %s' % (cid, text, ', '.join('%s %s → %s' % (k, num(v[0]) if v[0] is not None else '—', num(v[1]) if v[1] is not None else '—') for k, v in ch.items()) or 'значения уже совпадают'))
if stmts and not DRY:
    psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
