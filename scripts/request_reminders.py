#!/usr/bin/env python3
"""Заявки по объектам: напоминания, эскалация, автозакрытие, сводка (решения владельца 28.09.2026).

  - за рабочий день до срока — ответственному «завтра срок»; в первый день просрочки — «просрочена»;
  - просрочка 3 дня и больше — старшему управляющему объекта (один раз, до переноса срока или смены ответственного);
  - «Выполнена» и автор не проверил за 3 дня — закрывается сама;
  - по понедельникам — сводка старшим управляющим по их объектам.
Уведомления — напрямую в колокольчик (канал «Заявки»): вставка в очередь обычным SQL не запускает workflow доставки.

cron на svc:  0 9 * * 1-5 /usr/bin/python3 /home/ubuntu/nb_bik/request_reminders.py >> /home/ubuntu/nb_bik/requests.log 2>&1
    --dry  — только показать, что было бы сделано
"""
import datetime, json, os, subprocess, sys

DRY = '--dry' in sys.argv
PAGE = '/admin/crmpage01'
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql))
def q(s): return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"

today = datetime.date.today()
nxt = today + datetime.timedelta(days=1)
while nxt.weekday() >= 5: nxt += datetime.timedelta(days=1)          # ближайший рабочий день
d = lambda v: datetime.date.fromisoformat(str(v)[:10]) if v else None
fmt = lambda v: v.strftime('%d.%m.%Y')

reqs = rows("select r.*, o.senior_user_id from object_requests r left join contract_objects o on o.name = r.object_name "
            "where r.status in ('new','in_work','waiting','done')")
stmts, report = [], []

def notify(uid, r, text):
    if not uid: return
    report.append('  → #%s пользователю %s: %s' % (r['id'], uid, text))
    stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                 "values (gen_random_uuid(),now(),now(),%s,'requests',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);"
                 % (int(uid), q('Заявка №%s · %s' % (r['id'], r['object_name'])), q(text), q(json.dumps({'url': PAGE + '?open=req:%s' % r['id']}))))
def event(r, text):
    stmts.append("insert into request_events(\"createdAt\",request_id,author_id,kind,text) values (now(),%s,NULL,'system',%s);" % (r['id'], q(text)))

for r in reqs:
    due, rem = d(r['due_date']), d(r['reminded_on'])
    if r['status'] == 'done':
        done = datetime.datetime.fromisoformat(str(r['done_at'])[:19]).date() if r['done_at'] else None
        if done and (today - done).days >= 3:
            stmts.append("update object_requests set status='closed', closed_at=now(), \"updatedAt\"=now() where id=%s;" % r['id'])
            event(r, 'Закрыта автоматически: автор не проверил за 3 дня')
            notify(r['responsible_id'], r, 'Закрыта автоматически (автор не проверил за 3 дня): ' + r['title'])
        continue
    if not due: continue
    if due == nxt and rem != today and (rem is None or rem < today):
        notify(r['responsible_id'], r, 'Завтра срок (%s): %s' % (fmt(due), r['title']))
        stmts.append("update object_requests set reminded_on=%s where id=%s;" % (q(today.isoformat()), r['id']))
    elif due < today and (rem is None or rem <= due):
        notify(r['responsible_id'], r, 'Просрочена (срок был %s): %s' % (fmt(due), r['title']))
        stmts.append("update object_requests set reminded_on=%s where id=%s;" % (q(today.isoformat()), r['id']))
    if due < today and (today - due).days >= 3 and not r['escalated_at']:
        who = r['senior_user_id']
        notify(who, r, 'Эскалация: просрочена на %d дн. (ответственный #%s): %s' % ((today - due).days, r['responsible_id'], r['title']))
        stmts.append("update object_requests set escalated_at=now() where id=%s;" % r['id'])
        event(r, 'Эскалация старшему управляющему: просрочка %d дн.' % (today - due).days + ('' if who else ' (у объекта не указан старший управляющий с учёткой)'))

# сводка по понедельникам
if today.weekday() == 0 or '--digest' in sys.argv:
    by = {}
    for r in reqs:
        if r['senior_user_id'] and r['status'] in ('new', 'in_work', 'waiting'):
            s = by.setdefault(r['senior_user_id'], {}).setdefault(r['object_name'], [0, 0, 0])
            s[0] += 1; s[1] += 1 if d(r['due_date']) and d(r['due_date']) < today else 0; s[2] += 1 if r['urgency'] == 'emergency' else 0
    for uid, objs in by.items():
        text = '; '.join('%s: открыто %d, просрочено %d%s' % (o, v[0], v[1], ', аварий %d' % v[2] if v[2] else '') for o, v in sorted(objs.items()))
        report.append('  → сводка пользователю %s: %s' % (uid, text))
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'requests','Заявки: сводка за неделю',%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);"
                     % (int(uid), q(text), q(json.dumps({'url': PAGE}))))

print('%s %s: заявок в работе %d, действий %d' % (datetime.datetime.now().strftime('%F %T'), 'DRY' if DRY else 'SEND', len(reqs), len(report)))
for line in report: print(line)
if stmts and not DRY: psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
