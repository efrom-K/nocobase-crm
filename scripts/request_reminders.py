#!/usr/bin/env python3
"""Заявки по объектам: напоминания, эскалация, автозакрытие, сводка (решения владельца 28.09.2026).

  - за рабочий день до срока — ответственному «завтра срок»; в первый день просрочки — «просрочена»;
  - просрочка 3 дня и больше — старшему управляющему объекта и руководителям с ролью «Контроль заявок» (один раз, до переноса срока или смены ответственного);
  - не взята в работу вовремя (react_due_at) — ответственному и старшему, один раз;
  - в отделе: срок отдела прошёл — сотрудникам отдела, а через 3 дня — руководителям;
  - «Решена»: по заявке арендатора — закрывается сама через 3 дня; иначе через 3 дня — напоминание тому, кто принимает работу;
  - запрос управляющего (перенос / передача / отмена) ждёт решения дольше суток — напоминание руководителям;
  - по понедельникам — сводка старшим управляющим по их объектам.
Заявки v2 (21.10): часы не обнуляются переносом срока без согласия — переносы делает только сервис заявок.
Уведомления — напрямую в колокольчик (канал «Заявки»): вставка в очередь обычным SQL не запускает workflow доставки.

cron на svc:  0 9 * * 1-5 /usr/bin/python3 /home/ubuntu/nb_bik/request_reminders.py >> /home/ubuntu/nb_bik/requests.log 2>&1
    --dry  — только показать, что было бы сделано
"""
import datetime, json, os, subprocess, sys

DRY = '--dry' in sys.argv
PAGE = '/admin/j3a32zo1jzo'   # «Тестовая страница»
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql))
def q(s): return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"

def setting(key, default):   # значение со страницы «Настройки CRM» (коллекция crm_config); нет записи или мусор — по умолчанию
    try: v = json.loads(psql("select coalesce((select value::text from crm_config where key = '%s'), 'null')" % key.replace("'", "''")).strip() or 'null')
    except Exception: v = None
    if isinstance(default, int): return int(v) if isinstance(v, (int, float)) and v >= 0 else default
    if isinstance(default, list): return [int(x) for x in v if isinstance(x, (int, float)) and x > 0] or default if isinstance(v, list) else default
    return default if v is None else v
AUTO_CLOSE = max(1, setting('requests.autoCloseDays', 3))  # «Выполнена» и автор не проверил — закрыть через N дней
ESCALATE = max(1, setting('requests.escalateDays', 3))    # просрочка N дней — старшему управляющему

today = datetime.date.today()
nxt = today + datetime.timedelta(days=1)
while nxt.weekday() >= 5: nxt += datetime.timedelta(days=1)          # ближайший рабочий день
d = lambda v: datetime.date.fromisoformat(str(v)[:10]) if v else None
fmt = lambda v: v.strftime('%d.%m.%Y')

reqs = rows("select r.*, o.senior_user_id from object_requests r left join contract_objects o on o.name = r.object_name "
            "where r.status in ('new','in_work','waiting','dept','done') and not coalesce(r.demo, false)")   # демо-заявки не трогаем
CTL = [x['id'] for x in rows("select ru.\"userId\" id from \"rolesUsers\" ru where ru.\"roleName\" = 'requests_control'")]
DEPT = {}   # отдел → учётки сотрудников (структура компании)
for e in rows("select department, user_id from crm_employees where user_id is not null and fired_on is null and department is not null"):
    DEPT.setdefault(e['department'], []).append(e['user_id'])
dt = lambda v: datetime.datetime.fromisoformat(str(v)[:19]) if v else None
stmts, report = [], []

def notify(uid, r, text):
    if not uid: return
    report.append('  → #%s пользователю %s: %s' % (r['id'], uid, text))
    stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                 "values (gen_random_uuid(),now(),now(),%s,'requests',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);"
                 % (int(uid), q('Заявка №%s · %s' % (r['id'], r['object_name'])), q(text), q(json.dumps({'url': PAGE + '?open=req:%s' % r['id']}))))
def event(r, text):
    stmts.append("insert into request_events(\"createdAt\",request_id,author_id,kind,text) values (now(),%s,NULL,'system',%s);" % (r['id'], q(text)))   # видно только сотрудникам (visibility null = internal)

def mark(r, col):   # флаг «уже напомнили» — одна строка в истории, чтобы не слать каждый день
    return any(e['text'].startswith(col) for e in EVENTS.get(r['id'], []))
EVENTS = {}
for e in rows("select request_id, text from request_events where kind = 'system'"):
    EVENTS.setdefault(e['request_id'], []).append(e)
for p in rows("select a.*, r.title, r.object_name from request_approvals a join object_requests r on r.id = a.request_id "
              "where a.status = 'pending' and a.\"createdAt\" < now() - interval '1 day' and not coalesce(r.demo, false)"):
    for uid in CTL:
        if uid != p['author_id']: notify(uid, {'id': p['request_id'], 'object_name': p['object_name']}, 'Ждёт вашего решения больше суток: ' + p['title'])

now = datetime.datetime.utcnow()
for r in reqs:
    due, rem = d(r['due_date']), d(r['reminded_on'])
    if r['status'] == 'done':
        done = datetime.datetime.fromisoformat(str(r['done_at'])[:19]).date() if r['done_at'] else None
        if not done or (today - done).days < AUTO_CLOSE: continue
        if (r.get('accept_mode') or 'tenant') == 'tenant':   # арендатор не ответил — значит, всё в порядке (старые заявки без поля — так же)
            stmts.append("update object_requests set status='closed', closed_at=now(), \"updatedAt\"=now() where id=%s;" % r['id'])
            event(r, 'Закрыта автоматически: работу не проверили за %d дн.' % AUTO_CLOSE)
            notify(r['responsible_id'], r, 'Закрыта автоматически (не проверили за %d дн.): ' % AUTO_CLOSE + r['title'])
        elif not mark(r, 'Напоминание о приёмке'):
            who = [r['accept_user_id']] if r.get('accept_mode') == 'user' else CTL
            for uid in who: notify(uid, r, 'Решена %d дн. назад и ждёт вашей приёмки: ' % (today - done).days + r['title'])
            event(r, 'Напоминание о приёмке: %d дн. без проверки' % (today - done).days)
        continue
    if r['status'] == 'new' and r.get('react_due_at') and dt(r['react_due_at']) < now and not mark(r, 'Не взята в работу'):
        notify(r['responsible_id'], r, 'Не взята в работу вовремя: ' + r['title'])
        if r['senior_user_id'] != r['responsible_id']:   # старший сам ответственный — одного уведомления хватит
            notify(r['senior_user_id'], r, 'Не взята в работу вовремя (ответственный #%s): ' % r['responsible_id'] + r['title'])
        event(r, 'Не взята в работу вовремя — сообщено старшему управляющему')
    if r['status'] == 'dept' and r.get('dept_due') and d(r['dept_due']) < today:
        late = (today - d(r['dept_due'])).days
        if not mark(r, 'Отдел просрочил'):
            for uid in DEPT.get(r['dept'], []) + ([r['dept_user_id']] if r.get('dept_user_id') else []): notify(uid, r, 'Отдел «%s»: срок прошёл (%s): ' % (r['dept'], fmt(d(r['dept_due']))) + r['title'])
            event(r, 'Отдел просрочил: «%s», срок отдела %s' % (r['dept'], fmt(d(r['dept_due']))))
        elif late >= ESCALATE and not mark(r, 'Эскалация: отдел'):
            for uid in CTL: notify(uid, r, 'Эскалация: отдел «%s» держит заявку %d дн. сверх срока: ' % (r['dept'], late) + r['title'])
            event(r, 'Эскалация: отдел «%s» просрочил на %d дн.' % (r['dept'], late))
    if not due: continue
    if due == nxt and rem != today and (rem is None or rem < today):
        notify(r['responsible_id'], r, 'Завтра срок (%s): %s' % (fmt(due), r['title']))
        stmts.append("update object_requests set reminded_on=%s where id=%s;" % (q(today.isoformat()), r['id']))
    elif due < today and (rem is None or rem <= due):
        notify(r['responsible_id'], r, 'Просрочена (срок был %s): %s' % (fmt(due), r['title']))
        stmts.append("update object_requests set reminded_on=%s where id=%s;" % (q(today.isoformat()), r['id']))
    if due < today and (today - due).days >= ESCALATE and not r['escalated_at']:
        who = r['senior_user_id']
        for uid in set([who] + CTL) - {r['responsible_id'], None}:
            notify(uid, r, 'Эскалация: просрочена на %d дн. (ответственный #%s): %s' % ((today - due).days, r['responsible_id'], r['title']))
        stmts.append("update object_requests set escalated_at=now() where id=%s;" % r['id'])
        event(r, 'Эскалация старшему управляющему: просрочка %d дн.' % (today - due).days + ('' if who else ' (у объекта не указан старший управляющий с учёткой)'))

# сводка по понедельникам
if today.weekday() == 0 or '--digest' in sys.argv:
    by = {}
    for r in reqs:
        if r['senior_user_id'] and r['status'] in ('new', 'in_work', 'waiting', 'dept'):
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
