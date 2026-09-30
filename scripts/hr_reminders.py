#!/usr/bin/env python3
"""Кадры: напоминания HR-службе в колокольчик (канал «Кадры»), те же сроки, что в ленте «Требует внимания» дашборда HR.

Получатели — все пользователи с ролью hr. Каждое напоминание уходит один раз (журнал hr_notify_log, ключ = что + запись + порог).
  - обучение и инструктажи по ОТ и ПБ: за 30 дней и в день просрочки;
  - отпуск по графику без приказа: за 3 и за 2 недели до начала (уведомить сотрудника — ст. 123 ТК), накануне — «завтра в отпуск»;
  - договор ГПХ / самозанятого: за 30 дней и по окончании;
  - СОУТ: за 180 дней и по сроку; ЛНА «пересмотреть до»: за 30 дней и по сроку;
  - воинский учёт: приём / увольнение военнообязанного без отметки «сведения в военкомат» (сразу и на 10-й день),
    ежегодная сверка организации старше года, с 1 октября — нет плана ВУ на следующий год;
  - самозанятые: с 3-го числа — нет акта за прошлый месяц (раз в месяц);
  - дни рождения — за день; мероприятия — за неделю и накануне;
  - 1 ноября и 10 декабря — у кого не запланирован отпуск на следующий год (график утверждается до 17 декабря).

cron на svc:  0 9 * * * /usr/bin/python3 /home/ubuntu/nb_bik/hr_reminders.py >> /home/ubuntu/nb_bik/hr.log 2>&1
    --dry  — только показать, что было бы отправлено
"""
import datetime, json, os, subprocess, sys

DRY = '--dry' in sys.argv
PAGE = '/admin/hrdash01'   # «Дашборд HR (тест)»
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql))
def q(s): return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"

psql("create table if not exists hr_notify_log (key text primary key, sent_on date not null default current_date);")
today = datetime.date.today()
d = lambda v: datetime.date.fromisoformat(str(v)[:10]) if v else None
fmt = lambda v: v.strftime('%d.%m.%Y')
days = lambda v: (d(v) - today).days

hr_users = [r['userId'] for r in rows("select distinct \"userId\" from \"rolesUsers\" where \"roleName\" = 'hr'")]
emps = {e['id']: e for e in rows("select * from crm_employees")}
active = [e for e in emps.values() if e['status'] != 'fired']
staff = [e for e in active if (e['employment_type'] or 'staff') == 'staff']
priv = {p['employee_id']: p for p in rows("select * from crm_hr_private")}
les = {l['id']: l for l in rows("select * from crm_legal_entities")}
sent = {r['key'] for r in rows("select key from hr_notify_log")}
out = []   # (ключ, заголовок, текст, ссылка)

def add(key, title, text, url=PAGE):
    if key not in sent: out.append((key, title, text, url))
def emp_url(e): return PAGE + '?open=emp:%s' % e['id']
def name(e): return e['full_name'] or e['last_name']
def les_of(e): return {x for x in [e['legal_entity_id']] + list(e['extra_le_ids'] or []) if x}

# охрана труда: последняя запись по сотруднику, виду и компании (обучение ответственного идёт отдельно по каждому юрлицу)
last = {}
for s in rows("select * from crm_safety order by done_on nulls first"):
    last[(s['employee_id'], s['kind'], (s['doc'] or '').split(' · ')[0])] = s
for (eid, kind, comp), s in last.items():
    e = emps.get(eid) if eid else None
    if not s['next_on'] or (eid and (not e or e['status'] == 'fired')): continue
    n, who = days(s['next_on']), (name(e) if e else 'общее мероприятие') + (' (%s)' % comp if comp else '')
    if n < 0: add('safety:%s:late' % s['id'], 'Охрана труда: просрочено', '%s — %s (нужно было до %s)' % (kind, who, fmt(d(s['next_on']))), emp_url(e) if e else PAGE + '?sec=safety')
    elif n <= 30: add('safety:%s:30' % s['id'], 'Охрана труда: скоро срок', '%s — %s, до %s' % (kind, who, fmt(d(s['next_on']))), emp_url(e) if e else PAGE + '?sec=safety')

for v in rows("select * from crm_vacations"):
    e = emps.get(v['employee_id'])
    if not e or e['status'] == 'fired': continue
    n = days(v['start_date'])
    period = '%s – %s' % (fmt(d(v['start_date'])), fmt(d(v['end_date'])))
    if v['status'] == 'plan' and 0 <= n <= 21:
        th = '14' if n <= 14 else '21'
        add('vac:%s:%s' % (v['id'], th), 'Отпуск: уведомить и оформить приказ', '%s, %s. Уведомить сотрудника не позднее чем за 2 недели.' % (name(e), period), emp_url(e))
    if n == 1: add('vac:%s:tomorrow' % v['id'], 'Завтра в отпуск', '%s, %s' % (name(e), period), emp_url(e))

for e in active:
    if (e['employment_type'] or 'staff') != 'staff' and e['contract_until']:
        n = days(e['contract_until'])
        kind = 'самозанятого' if e['employment_type'] == 'self' else 'ГПХ'
        if n < 0: add('contract:%s:%s:end' % (e['id'], e['contract_until']), 'Договор %s закончился' % kind, '%s — %s' % (name(e), fmt(d(e['contract_until']))), emp_url(e))
        elif n <= 30: add('contract:%s:%s:30' % (e['id'], e['contract_until']), 'Договор %s заканчивается' % kind, '%s — %s' % (name(e), fmt(d(e['contract_until']))), emp_url(e))

for s in rows("select * from crm_sout where next_on is not null"):
    n = days(s['next_on'])
    le = (les.get(s['legal_entity_id']) or {}).get('name', '')
    if n < 0: add('sout:%s:%s:late' % (s['id'], s['next_on']), 'СОУТ: срок оценки прошёл', '%s (%s) — %s' % (s['workplace'], le, fmt(d(s['next_on']))), PAGE + '?sec=safety')
    elif n <= 180: add('sout:%s:%s:180' % (s['id'], s['next_on']), 'СОУТ: повторная оценка', '%s (%s) — до %s' % (s['workplace'], le, fmt(d(s['next_on']))), PAGE + '?sec=safety')

for l in rows("select * from crm_lna where review_on is not null"):
    n = days(l['review_on'])
    if n < 0: add('lna:%s:%s:late' % (l['id'], l['review_on']), 'ЛНА: пора пересмотреть', '«%s» — до %s' % (l['title'], fmt(d(l['review_on']))), PAGE + '?sec=docs')
    elif n <= 30: add('lna:%s:%s:30' % (l['id'], l['review_on']), 'ЛНА: скоро пересмотр', '«%s» — до %s' % (l['title'], fmt(d(l['review_on']))), PAGE + '?sec=docs')

# воинский учёт
liable = [e for e in emps.values() if (priv.get(e['id']) or {}).get('mil_status') == 'liable']
for e in liable:
    p = priv[e['id']]
    ev = e['fired_on'] if e['status'] == 'fired' else e['hired_on']
    if not ev or (p['mil_sent_on'] and d(p['mil_sent_on']) >= d(ev)): continue
    passed = (today - d(ev)).days
    what = 'увольнении' if e['status'] == 'fired' else 'приёме'
    if 0 <= passed <= 14: add('mil:%s:%s:0' % (e['id'], ev), 'Военкомат: сообщить о %s' % what, '%s — с %s, в течение 2 недель' % (name(e), fmt(d(ev))), emp_url(e))
    if 10 <= passed <= 14: add('mil:%s:%s:10' % (e['id'], ev), 'Военкомат: срок почти прошёл', 'Сведения о %s: %s (с %s) ещё не отмечены отправленными' % (what, name(e), fmt(d(ev))), emp_url(e))
for l in les.values():
    if not any(l['id'] in les_of(e) for e in liable if e['status'] != 'fired'): continue
    if l['mil_check_on'] and (today - d(l['mil_check_on'])).days > 365:
        add('milcheck:%s:%s' % (l['id'], today.year), 'Воинский учёт: сверка просрочена', '«%s» — последняя сверка %s' % (l['name'], fmt(d(l['mil_check_on']))), PAGE + '?sec=mil')
    if today >= datetime.date(today.year, 10, 1) and (l['mil_plan_year'] or 0) < today.year + 1:
        add('milplan:%s:%s' % (l['id'], today.year + 1), 'Воинский учёт: план на %s' % (today.year + 1), '«%s» — подготовить приказ, план ВУ и карточку организации (форма 18)' % l['name'], PAGE + '?sec=mil')

# самозанятые: акт за прошлый месяц
pm = (today.replace(day=1) - datetime.timedelta(days=1)).strftime('%Y-%m')
MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
if today.day >= 3:
    miss = [name(e) for e in active if e['employment_type'] == 'self' and not (e['acts'] or {}).get(pm)]
    if miss: add('acts:%s' % pm, 'Акты самозанятых за %s %s' % (MONTHS[int(pm[5:]) - 1], pm[:4]), 'Нет акта: ' + ', '.join(miss), PAGE)

# дни рождения (за день) и мероприятия (за неделю и накануне)
for e in active:
    if not e['birthday']: continue
    b = d(e['birthday'])
    try: nb = b.replace(year=today.year)
    except ValueError: nb = b.replace(year=today.year, day=28)
    if (nb - today).days == 1: add('bd:%s:%s' % (e['id'], today.year), 'Завтра день рождения', name(e), emp_url(e))
for x in rows("select * from crm_hr_events where event_date is not null"):
    n = days(x['event_date'])
    if n == 7: add('ev:%s:7' % x['id'], 'Через неделю: %s' % x['title'], fmt(d(x['event_date'])) + (' · ' + x['place'] if x['place'] else ''), PAGE + '?sec=docs')
    if n == 1: add('ev:%s:1' % x['id'], 'Завтра: %s' % x['title'], fmt(d(x['event_date'])) + (' · ' + x['place'] if x['place'] else ''), PAGE + '?sec=docs')

# график отпусков на следующий год
if (today.month, today.day) in ((11, 1), (12, 10)):
    ny = str(today.year + 1)
    planned = {v['employee_id'] for v in rows("select employee_id from crm_vacations where to_char(start_date, 'YYYY') = %s" % q(ny))}
    miss = [e for e in staff if e['id'] not in planned]
    if miss: add('vacplan:%s:%s' % (ny, today.isoformat()), 'График отпусков на %s' % ny, 'Не запланирован отпуск у %s сотрудников; график утверждается до 17 декабря' % len(miss), PAGE + '?sec=vac')

stmts = []
for key, title, text, url in out:
    print(today, key, '|', title, '|', text)
    for uid in hr_users:
        stmts.append("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                     "values (gen_random_uuid(),now(),now(),%s,'hr',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,%s::json);"
                     % (int(uid), q(title), q(text), q(json.dumps({'url': url}))))
    stmts.append("insert into hr_notify_log(key) values (%s) on conflict do nothing;" % q(key))
if not hr_users: print(today, 'нет пользователей с ролью hr — не отправлено')
elif stmts and not DRY: psql('begin;\n' + '\n'.join(stmts) + '\ncommit;')
print(today, 'отправлено: %s напоминаний × %s получателей' % (len(out), len(hr_users)) + (' (dry)' if DRY else ''))
