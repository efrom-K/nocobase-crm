#!/usr/bin/env python3
"""АХО: напоминания в колокольчик (канал «АХО»), те же сроки, что в ленте «Требует внимания» дашборда АХО.

Получатели — пользователи с ролью aho; согласующему (app_settings aho_approver_user_id) — счета, которые ждут его решения дольше суток.
Каждое напоминание уходит один раз (журнал aho_notify_log, ключ = что + запись + дата/порог).
  - регулярные дела: в день срока и на следующий день просрочки;
  - счета: оплатить — за 3 дня и в день срока; оплачен 7 дней назад, а закрывающих нет; на согласовании больше суток — согласующему;
  - регулярные платежи: за 3 дня и в день оплаты;
  - доверенности: за 30 дней, за 7 дней и в день окончания;
  - требования по пожарной безопасности: в день срока устранения;
  - корреспонденция: в день срока ответа;
  - штрафы: за 3 дня до конца скидки 50%.
О согласовании/отклонении счёта уведомление приходит сразу из дашборда (очередь task_notifications), здесь не дублируется.

cron на svc:  0 9 * * 1-5 /usr/bin/python3 /home/ubuntu/nb_bik/aho_reminders.py >> /home/ubuntu/nb_bik/aho.log 2>&1
    --dry  — только показать, что было бы отправлено
"""
import datetime, json, os, subprocess, sys

DRY = '--dry' in sys.argv
PAGE = '/admin/ahodash01'   # «Дашборд АХО (тест)»
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql))
def q(s): return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"

psql("create table if not exists aho_notify_log (key text primary key, sent_on date not null default current_date);")
today = datetime.date.today()
d = lambda v: datetime.date.fromisoformat(str(v)[:10]) if v else None
fmt = lambda v: d(v).strftime('%d.%m.%Y')
days = lambda v: (d(v) - today).days
money = lambda v: '{:,.0f} ₽'.format(float(v or 0)).replace(',', ' ')

aho_users = [r['userId'] for r in rows("select distinct \"userId\" from \"rolesUsers\" where \"roleName\" = 'aho'")]
appr = rows("select value from app_settings where name = 'aho_approver_user_id' and coalesce(value, '') <> ''")
approver = int(appr[0]['value']) if appr else None
sent = {r['key'] for r in rows("select key from aho_notify_log")}
out = []   # (ключ, заголовок, текст, ссылка, получатели)

def add(key, title, text, url=PAGE, to=None):
    if key not in sent: out.append((key, title, text, url, to if to is not None else aho_users))

for r in rows("select * from crm_aho_routines where coalesce(active, true) and next_on is not null"):
    n = days(r['next_on'])
    if n in (0, -1): add('routine:%s:%s:%s' % (r['id'], r['next_on'], n), 'Сегодня по регламенту' if n == 0 else 'Просрочено со вчера', r['title'], PAGE + '?open=routine:%s' % r['id'])

for x in rows("select * from crm_aho_expenses"):
    url, what = PAGE + '?open=exp:%s' % x['id'], '%s — %s' % (x['title'], money(x['amount']))
    if x['status'] in ('new', 'approved') and x['due_on'] and days(x['due_on']) in (3, 0):
        add('exp:%s:due:%s:%s' % (x['id'], x['due_on'], days(x['due_on'])), 'Оплатить до %s' % fmt(x['due_on']) if x['status'] == 'approved' else 'Счёт не отправлен на согласование', what, url)
    if x['status'] == 'paid' and x['paid_on'] and (today - d(x['paid_on'])).days == 7:
        add('exp:%s:nodocs' % x['id'], 'Нет закрывающих документов', what + ', оплачен ' + fmt(x['paid_on']), url)
    if x['status'] == 'approval' and approver and x['sent_on'] and (today - d(x['sent_on'])).days >= 1:
        add('exp:%s:wait:%s' % (x['id'], today), 'Счёт ждёт вашего согласования', what + ', отправлен ' + fmt(x['sent_on']), url, [approver])

for s in rows("select * from crm_aho_subs where coalesce(active, true) and next_pay_on is not null"):
    if days(s['next_pay_on']) in (3, 0):
        add('sub:%s:%s:%s' % (s['id'], s['next_pay_on'], days(s['next_pay_on'])), 'Регулярный платёж до %s' % fmt(s['next_pay_on']), '%s — %s' % (s['title'], money(s['amount'])), PAGE + '?sec=money')

les = {l['id']: l['name'] for l in rows("select id, name from crm_legal_entities")}
for p in rows("select * from crm_aho_poa where coalesce(status, 'active') <> 'revoked' and valid_until is not null"):
    n = days(p['valid_until'])
    if n in (30, 7, 0):
        add('poa:%s:%s:%s' % (p['id'], p['valid_until'], n), 'Доверенность истекает %s' % fmt(p['valid_until']),
            '%s — %s (%s)' % (p['to_whom'], p['purpose'] or '', les.get(p['legal_entity_id'], '')), PAGE + '?open=poa:%s' % p['id'])

for f in rows("select * from crm_aho_fire where coalesce(status, '') <> 'fixed' and deadline_on is not null"):
    if days(f['deadline_on']) == 0:
        add('fire:%s:%s' % (f['id'], f['deadline_on']), 'Срок устранения недочётов по ПБ', '%s (%s) — проверить' % (f['tenant'], f['object_name']), PAGE + '?open=fire:%s' % f['id'])

for x in rows("select * from crm_aho_mail where coalesce(status, '') not in ('done', 'answered') and due_on is not null"):
    if days(x['due_on']) == 0:
        add('mail:%s:%s' % (x['id'], x['due_on']), 'Срок по письму сегодня', x['subject'], PAGE + '?open=mail:%s' % x['id'])

for f in rows("select f.*, c.name car from crm_aho_fines f left join crm_aho_cars c on c.id = f.car_id where f.paid_on is null and f.discount_until is not null"):
    if days(f['discount_until']) == 3:
        add('fine:%s:disc' % f['id'], 'Штраф: скидка 50% заканчивается %s' % fmt(f['discount_until']), '%s — %s' % (f['car'] or '', money(f['amount'])), PAGE + '?open=fine:%s' % f['id'])

stmts = []
for key, title, text, url, to in out:
    print(today, key, '|', title, '|', text, '| →', to)
    for uid in to:
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'aho',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);"
                     % (int(uid), q(title), q(text), q(json.dumps({'url': url}))))
    if to: stmts.append("insert into aho_notify_log(key) values (%s) on conflict do nothing;" % q(key))
if stmts and not DRY: psql('begin;\n' + '\n'.join(stmts) + '\ncommit;')
print(today, 'напоминаний: %s, получателей с ролью aho: %s' % (len(out), len(aho_users)) + (' (dry)' if DRY else ''))
