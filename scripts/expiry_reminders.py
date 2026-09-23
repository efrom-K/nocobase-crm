#!/usr/bin/env python3
"""Напоминания об окончании срока активных договоров (сообщения кладутся прямо в штатный центр уведомлений NocoBase, канал «Сроки договоров»).

Порог напоминания: за 90 / 60 / 30 / 14 / 7 дней и в день окончания (0); по истёкшим — один раз (-1).
Каждый порог по конкретной дате окончания отправляется один раз (таблица contract_reminders_log);
если дату окончания изменили — напоминания стартуют заново.
Получатели: только прикреплённые к договору сотрудники (открепили — перестают получать); без сотрудников — никому.
Договоры с заполненной датой расторжения пропускаются.

    expiry_reminders.py            # отправить
    expiry_reminders.py --dry-run  # только показать, ничего не писать
    expiry_reminders.py --seed     # записать в журнал как «уже отправлено» без уведомлений (для истёкших при первом запуске)
Запуск: cron ежедневно, например 0 9 * * *
"""
import json, os, re, subprocess, sys
from datetime import date

REGISTRY_PAGE = os.environ.get('NB_REGISTRY_PAGE', 'b5znz7yxpy3')   # uid страницы реестра (ссылка «Открыть» в сообщении)
DRY = '--dry-run' in sys.argv
SEED = '--seed' in sys.argv
THRESHOLDS = [0, 7, 14, 30, 60, 90]
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:400])
    return r.stdout.decode()

def q(v): return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"
def jrows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')

def parse(s):
    s = (s or '').strip()
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m: return date(int(m[1]), int(m[2]), int(m[3]))
    m = re.match(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$', s)
    if m: return date(int(m[3]), int(m[2]), int(m[1]))
    return None

def plural_days(n): return '%d дн.' % n

psql("create table if not exists contract_reminders_log(contract_id bigint not null, threshold int not null, end_date text not null, sent_at timestamptz default now(), primary key(contract_id, threshold, end_date));")
today = date.today()
contracts = jrows("select id, contract_number, object_name, tenant_name, end_date::text as end_date, termination_date::text as termination_date from rental_contracts where end_date is not null")
sent = {(r['contract_id'], r['threshold'], r['end_date']) for r in jrows("select contract_id, threshold, end_date from contract_reminders_log")}
members = {}
for r in jrows('select f_f6uc3x0qna1 as cid, f_z8ov78krtg5 as uid from "rentalContractsMembers"'):
    members.setdefault(r['cid'], set()).add(r['uid'])

stmts = []; report = []
for c in contracts:
    if (c['termination_date'] or '').strip(): continue
    end = parse(c['end_date'])
    if not end: continue
    days = (end - today).days
    if days < 0: th = -1
    else:
        cands = [t for t in THRESHOLDS if days <= t]
        if not cands: continue
        th = min(cands)
    key = (c['id'], th, c['end_date'])
    if key in sent: continue
    end_txt = end.strftime('%d.%m.%Y')
    if th == -1: msg = 'Срок договора истёк %s назад (%s)' % (plural_days(-days), end_txt)
    elif days == 0: msg = 'Срок договора истекает сегодня (%s)' % end_txt
    else: msg = 'Срок договора истекает через %s (%s)' % (plural_days(days), end_txt)
    tail = ' · '.join(x for x in (c['object_name'], c['tenant_name']) if x)
    if tail: msg += ' · ' + tail
    title = 'Договор ' + (c['contract_number'] or c['object_name'] or '#%s' % c['id'])
    rcpt = sorted(members.get(c['id'], set()))          # только прикреплённые к договору сотрудники
    report.append((c['id'], th, days, len(rcpt), msg))
    stmts.append("insert into contract_reminders_log(contract_id,threshold,end_date) values(%s,%s,%s);" % (c['id'], th, q(c['end_date'])))
    if not SEED:
        for uid in rcpt:
            # напрямую в штатный центр уведомлений: запись в contract_notifications обычным SQL НЕ запускает workflow доставки
            stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                         "values (gen_random_uuid(),now(),now(),%s,'deadlines',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);"
                         % (uid, q(title), q(msg), q(json.dumps({'url': '/admin/%s?open=active:%s' % (REGISTRY_PAGE, c['id'])}))))

print('%s: %d напоминаний к отправке' % ('SEED' if SEED else ('DRY-RUN' if DRY else 'SEND'), len(report)))
for r in report: print('  договор #%s порог %s (дней до конца: %s), получателей %s: %s' % r)
if stmts and not DRY:
    psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
    print('записано')
