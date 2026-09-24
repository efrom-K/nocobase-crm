#!/usr/bin/env python3
"""Цена договора по времени: основная цена на весь срок + периоды «Дополнительных расчётов аренды» на отдельные даты.

  apply_price_schedule.py              # выполнить (cron раз в сутки, 00:10)
  apply_price_schedule.py --dry-run    # только показать, что изменилось бы
  apply_price_schedule.py --date 2026-05-01   # прогнать «как будто сегодня» эту дату (проверка перехода периодов)
  apply_price_schedule.py --contract 123      # только один договор (проверка на тестовом договоре)
  apply_price_schedule.py --warn       # предупреждение «скоро сменится цена» (cron в будни 10:00): смены до следующего
                                       # рабочего дня включительно — в пятницу видно субботу, воскресенье и понедельник

Период может менять три цены — арендную плату, эксплуатационный сбор, обеспечительный платёж (галочки rent_on / utility_on / deposit_on).
Текущие цены договора (rent_*, utility_*, deposit_amount) = цена периода, действующего сегодня для этой цены, иначе основное значение
(base_rent_*, base_utility_*, base_deposit_amount). Та же логика, что в карточке (scheduleTarget в contract-modals.js):
  «за 1 квадратный метр» → ставка = цена, сумма = цена × площадь
  «сумма в месяц»        → сумма = цена, ставка пусто (ставку делением суммы на площадь НЕ выводим — только точные числа)
Для каждой цены отдельно: если периоды пересекаются — берётся начавшийся позже. Цены «в неделю/день/год» (старые записи) не применяются.
Сумма договора = текущая арендная плата + текущий эксплуатационный сбор.
Смена (начало периода, переход между периодами, возврат к основной цене после конца периода) применяется один раз:
состояние запоминается в contract_price_applied, поэтому ручные правки между сменами не затираются.
Договоры, у которых дата расторжения уже прошла, пропускаются. Изменения пишутся в историю (автор «Система»), прикреплённым к договору бухгалтерам
(если их нет — всем прикреплённым) — сообщение в колокольчик. Если карточку уже пересчитали днём (она делает то же самое), значения совпадут — повторного уведомления не будет.
"""
import json, os, subprocess, sys
from datetime import date, timedelta

DRY = '--dry-run' in sys.argv
WARN = '--warn' in sys.argv
TODAY = date.fromisoformat(sys.argv[sys.argv.index('--date') + 1]) if '--date' in sys.argv else date.today()
ONLY = int(sys.argv[sys.argv.index('--contract') + 1]) if '--contract' in sys.argv else None
REGISTRY_PAGE = os.environ.get('NB_REGISTRY_PAGE', 'b5znz7yxpy3')
PSQL_CMD = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(PSQL_CMD)] if os.environ.get('NB_SSH') else ['sudo', '-n'] + PSQL_CMD
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:400])
    return r.stdout.decode()
def q(v): return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"
def jrows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')
def r2(x): return round(x + 1e-9, 2)                                        # до копеек, половина — вверх (как round2 в карточке)
def mul_money(rate, area):
    # ставка × площадь точно, в целых единицах (обе до сотых): 1,005 × 1 = 1,01. Та же формула — mulMoney в contract-modals.js
    a, b = round(float(rate) * 100), round(float(area) * 100)
    return ((a * b + 50) // 100) / 100
def num(v): return ('%.2f' % v).rstrip('0').rstrip('.')                     # 1200.0 → «1200», 1200.5 → «1200.5» (как в истории карточек)
def fmt(v): return '{:,.2f}'.format(v).replace(',', ' ').replace('.', ',')   # всегда до сотых: 65,00
def dmy(iso): y, m, d = iso.split('-'); return '%s.%s.%s' % (d, m, y)

psql("create table if not exists contract_price_applied(contract_id bigint primary key, sig text not null, applied_at timestamptz default now())")
T = TODAY.isoformat()
contracts = jrows("select id, contract_number, object_name, area_sqm, rent_per_sqm, rent_amount, base_rent_per_sqm, base_rent_amount, "
                  "utility_per_sqm, utility_amount, base_utility_per_sqm, base_utility_amount, deposit_amount, base_deposit_amount, total_amount from rental_contracts "
                  "where (termination_date is null or termination_date >= current_date) and (id in (select contract_ref_id from contract_price_periods where contract_type='active') "
                  "or id in (select contract_id from contract_price_applied))")
if ONLY is not None: contracts = [c for c in contracts if c['id'] == ONLY]
periods = {}
for p in jrows("select id, contract_ref_id, date_from::text, date_to::text, basis, unit, amount, rent_on, utility_on, utility_basis, utility_value, deposit_on, deposit_value "
                "from contract_price_periods where contract_type='active' order by date_from, id"):
    periods.setdefault(p['contract_ref_id'], []).append(p)
applied = {r['contract_id']: r['sig'] for r in jrows("select contract_id, sig from contract_price_applied")}
members = {}
for r in jrows('select f_f6uc3x0qna1 as cid, f_z8ov78krtg5 as uid from "rentalContractsMembers"'): members.setdefault(r['cid'], set()).add(r['uid'])
accountants = {r['uid'] for r in jrows('select "userId" as uid from "rolesUsers" where "roleName" = \'accounting_dept\'')}
def recipients(cid):
    # цена — забота бухгалтерии: прикреплённые бухгалтеры; если их нет среди прикреплённых — все прикреплённые
    ms = members.get(cid, set())
    return (ms & accountants) or ms

def prange(p):
    # период без даты окончания хранится с date_to = 2099-12-31
    return 'с %s' % dmy(p['date_from']) + (', без даты окончания' if p['date_to'] >= '2099-12-31' else ' по %s' % dmy(p['date_to']))
# три цены периода: (ключ, название, поле ставки, поле суммы, основная ставка, основная сумма, включена?, способ, значение)
COMPONENTS = [
    ('rent', 'арендная плата', 'rent_per_sqm', 'rent_amount', 'base_rent_per_sqm', 'base_rent_amount',
     lambda p: p['rent_on'] is True or (p['rent_on'] is not False and p['amount'] is not None), lambda p: p['basis'] or 'per_sqm', lambda p: p['amount']),
    ('utility', 'эксплуатационный сбор', 'utility_per_sqm', 'utility_amount', 'base_utility_per_sqm', 'base_utility_amount',
     lambda p: bool(p['utility_on']), lambda p: p['utility_basis'] or 'per_sqm', lambda p: p['utility_value']),
    ('deposit', 'обеспечительный платёж', None, 'deposit_amount', None, 'base_deposit_amount',
     lambda p: bool(p['deposit_on']), lambda p: 'fixed', lambda p: p['deposit_value']),
]
def comp_label(comp, p):
    key, _, per_f, *_rest = comp
    v = '%s ₽' % fmt(float(comp[8](p)))
    return v + ' за 1 квадратный метр в месяц' if per_f and comp[7](p) == 'per_sqm' else (v if key == 'deposit' else v + ' в месяц')
def base_text(comp, c):
    per = c[comp[4]] if comp[4] else None
    amt = c[comp[5]]
    if per is not None: return '%s ₽ за 1 квадратный метр в месяц' % fmt(per)
    if amt is not None: return '%s ₽%s' % (fmt(amt), '' if comp[0] == 'deposit' else ' в месяц')
    return 'не задан'

def target(c, iso):
    """Цены договора на дату iso: (sig, новые значения, текст «что действует», текст для предупреждения) или None, если цен нет вовсе."""
    area = c['area_sqm'] or 0
    new, sig, texts, warn = {}, [], [], []
    for comp in COMPONENTS:
        key, title, per_f, amt_f, base_per, base_amt, on, basis, value = comp
        eff = [p for p in periods.get(c['id'], []) if p['date_from'] <= iso <= p['date_to'] and (p['unit'] or 'month') == 'month' and on(p)]
        p = eff[-1] if eff else None
        if p:
            v = float(value(p))
            if per_f and basis(p) == 'per_sqm':
                new[per_f] = v
                if area > 0: new[amt_f] = mul_money(v, area)
            else:
                if per_f: new[per_f] = None
                new[amt_f] = v
            sig.append('%s:p%s|%s|%s|%s' % (key, p['id'], value(p), basis(p), area))
            texts.append('%s по периоду %s: %s' % (title.capitalize(), prange(p), comp_label(comp, p)))
            warn.append('%s %s' % (title, comp_label(comp, p)))
        else:
            if (base_per and c[base_per] is not None) or c[base_amt] is not None:
                if per_f: new[per_f] = c[base_per]
                new[amt_f] = c[base_amt]
            sig.append('%s:base|%s|%s' % (key, c[base_per] if base_per else '', c[base_amt]))
            texts.append('%s: основное значение %s' % (title.capitalize(), base_text(comp, c)))
            warn.append('%s вернётся к основному значению %s' % (title, base_text(comp, c)))
    if not new: return None
    return ('|'.join(sig), new, texts, warn)
def notify(stmts, c, text):
    title = 'Договор ' + (c['contract_number'] or c['object_name'] or '#%s' % c['id'])
    opts = json.dumps({'url': '/admin/%s?open=active:%s' % (REGISTRY_PAGE, c['id'])})
    for uid in sorted(recipients(c['id'])):
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'status',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);" % (uid, q(title), q(text), q(opts)))
def money_vals(v):
    parts = []
    for k in ('rent_amount', 'rent_per_sqm', 'utility_amount', 'utility_per_sqm', 'deposit_amount'):
        if v.get(k) is not None: parts.append('%s=%s' % (k, fmt(v[k])))
    return ', '.join(parts) or 'цена не задана'
def changed_parts(prev, cur):
    # какие из трёх цен меняются между двумя датами (для предупреждения — только их)
    out = []
    for i, comp in enumerate(COMPONENTS):
        a = {k: prev[1].get(k) for k in (comp[2], comp[3]) if k} if prev else {}
        b = {k: cur[1].get(k) for k in (comp[2], comp[3]) if k}
        if money_vals(a) != money_vals(b): out.append(cur[3][i])
    return out

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
            parts = changed_parts(prev, cur) if cur and (not prev or prev[0] != cur[0]) else []
            if parts:
                key = (c['id'], d.isoformat(), cur[0])
                if key not in warned:
                    when = 'завтра' if d == TODAY + timedelta(days=1) else ['в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье'][d.weekday()]
                    text = 'Скоро изменятся цены: %s, %s — %s' % (when, dmy(d.isoformat()), '; '.join(parts))
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
    sig, new, texts, _ = t
    if applied.get(c['id']) == sig: continue
    changed = {k: (c[k], v) for k, v in new.items()
               if (v is None and c[k] is not None) or (v is not None and (c[k] is None or abs(c[k] - v) >= 0.005))}
    # в тексте — только те цены, что реально поменялись
    text = '; '.join(texts[i] for i, comp in enumerate(COMPONENTS) if any(k in changed for k in (comp[2], comp[3]) if k)) or '; '.join(texts)
    if 'rent_amount' in changed or 'utility_amount' in changed:
        ra = changed['rent_amount'][1] if 'rent_amount' in changed else c['rent_amount']
        ua = changed['utility_amount'][1] if 'utility_amount' in changed else c['utility_amount']
        tot = None if ra is None and ua is None else r2((ra or 0) + (ua or 0))
        if tot != c['total_amount']: changed['total_amount'] = (c['total_amount'], tot)
    report.append((c['id'], text, changed))
    stmts.append("insert into contract_price_applied(contract_id, sig) values (%s, %s) on conflict (contract_id) do update set sig=excluded.sig, applied_at=now();" % (c['id'], q(sig)))
    if not changed: continue
    stmts.append("update rental_contracts set %s where id=%s;" % (', '.join('%s=%s' % (k, 'NULL' if v[1] is None else v[1]) for k, v in changed.items()), c['id']))
    for k, (old, nv) in changed.items():
        stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,field,old_value,new_value,created_at) values ('active',%s,NULL,'field',%s,%s,%s,now());"
                     % (c['id'], q(k), q(num(old) if old is not None else ''), q(num(nv) if nv is not None else '')))
    stmts.append("insert into contract_history(contract_type,contract_ref_id,author_id,action,text,created_at) values ('active',%s,NULL,'price',%s,now());" % (c['id'], q(text + ' (автоматически)')))
    notify(stmts, c, 'Изменились цены. ' + text)

print('%s (дата %s): смен цены — %d' % ('DRY-RUN' if DRY else 'ПРИМЕНЕНИЕ', T, len(report)))
for cid, text, ch in report:
    print('  договор #%s: %s → %s' % (cid, text, ', '.join('%s %s → %s' % (k, num(v[0]) if v[0] is not None else '—', num(v[1]) if v[1] is not None else '—') for k, v in ch.items()) or 'значения уже совпадают'))
if stmts and not DRY:
    psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
