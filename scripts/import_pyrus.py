#!/usr/bin/env python3
"""Перенос из Pyrus в тестовый контур CRM: задачи (с перепиской и историей), отделы и сотрудники.

Можно запускать повторно (синхронизация на время пилота):
  - сотрудники и отделы — по pyrus_id: обновляются ФИО/отдел/почта/статус; телефон, должность, даты, заметки,
    заполненные в NocoBase, не затираются;
  - задачи — новые добавляются; уже перенесённые обновляются из Pyrus, ТОЛЬКО пока с ними не работали в NocoBase
    (нет событий от пользователей NocoBase); новые комментарии Pyrus дописываются (по pyrus_comment_id).
Уведомления при импорте не отправляются.

    PYRUS_LOGIN=... PYRUS_KEY=... PYRUS_TASK_FORM=<id формы задач> PYRUS_STRUCT_CATALOG=<id справочника структуры> \
    NB_SSH=user@server python3 import_pyrus.py [--dry]

Ключ Pyrus в файлы не пишется: только переменные окружения на время запуска.
"""
import datetime, json, os, re, subprocess, sys, urllib.request, urllib.error

DRY = '--dry' in sys.argv
API = 'https://api.pyrus.com/v4/'
FORM = int(os.environ.get('PYRUS_TASK_FORM') or sys.exit('PYRUS_TASK_FORM is required'))
STRUCT = int(os.environ.get('PYRUS_STRUCT_CATALOG') or 0)

def pyrus(path, data=None, token=None):
    req = urllib.request.Request(API + path, data=None if data is None else json.dumps(data).encode(), method='POST' if data is not None else 'GET',
                                 headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    with urllib.request.urlopen(req, timeout=90) as r: return json.load(r)

def psql(sql):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:800])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')
def J(v):
    s = json.dumps(v, ensure_ascii=False)
    assert '$PYJ$' not in s
    return '$PYJ$' + s + '$PYJ$'

tok = pyrus('auth', {'login': os.environ['PYRUS_LOGIN'], 'security_key': os.environ['PYRUS_KEY']})['access_token']

# ---------- справочники NocoBase ----------
nb_users = {(u['email'] or '').lower(): u['id'] for u in rows('select id, email from users where email is not null')}
objects = [o['name'] for o in rows('select name from contract_objects order by name')]
def uid(p): return nb_users.get(((p or {}).get('email') or '').lower())
def pname(p): return ' '.join(x for x in ((p or {}).get('last_name'), (p or {}).get('first_name')) if x) or None

# ---------- отделы и сотрудники ----------
def bday(b):   # в Pyrus день рождения без года: {'day': 22, 'month': 6} → 1900-06-22 (1900 = год неизвестен)
    if isinstance(b, dict) and b.get('day') and b.get('month'): return '%04d-%02d-%02d' % (b.get('year') or 1900, b['month'], b['day'])
    return str(b)[:10] if b else None
members = pyrus('members', token=tok)['members']
emp_rows = []
for m in members:
    if m.get('type') != 'user': continue
    emp_rows.append({'full_name': pname(m), 'last_name': m.get('last_name'), 'first_name': m.get('first_name'), 'position': m.get('position'),
                     'department': m.get('department_name'), 'email': (m.get('email') or '').lower() or None, 'phone': m.get('phone'),
                     'birthday': bday(m.get('birth_date')), 'status': 'fired' if m.get('banned') else 'active',
                     'user_id': uid(m), 'pyrus_id': m['id']})
dept_rows = []
if STRUCT:
    cat = pyrus('catalogs/%d' % STRUCT, token=tok)
    for i, it in enumerate(cat['items']):
        v = it['values'] + ['', '', '']
        sub, top, head = v[0].strip(), v[1].strip(), v[2].strip()
        name, parent = (sub, top) if sub else (top, None)
        if not name: continue          # корень компании без названия
        dept_rows.append({'name': name, 'parent_name': parent, 'head_pyrus': int(head) if head.isdigit() else None, 'sort': i})
print('сотрудников', len(emp_rows), 'отделов', len(dept_rows))

if not DRY:
    psql("""begin;
create temp table src as select * from json_populate_recordset(null::crm_employees, %s);
update crm_employees e set full_name = s.full_name, last_name = s.last_name, first_name = s.first_name, department = s.department, email = s.email,
  status = case when s.status = 'fired' then 'fired' when e.status = 'fired' then 'active' else coalesce(e.status, s.status) end,
  position = coalesce(e.position, s.position), phone = coalesce(e.phone, s.phone), birthday = coalesce(e.birthday, s.birthday),
  user_id = coalesce(e.user_id, s.user_id), "updatedAt" = now()
  from src s where e.pyrus_id = s.pyrus_id;
insert into crm_employees(full_name, last_name, first_name, position, department, email, phone, birthday, status, user_id, pyrus_id, "createdAt", "updatedAt")
  select full_name, last_name, first_name, position, department, email, phone, birthday, status, user_id, pyrus_id, now(), now() from src s
  where not exists (select 1 from crm_employees e where e.pyrus_id = s.pyrus_id);
commit;""" % J(emp_rows))
    if dept_rows:
        psql("""begin;
create temp table d as select * from json_to_recordset(%s) as x(name text, parent_name text, head_pyrus bigint, sort int);
update crm_departments c set parent_name = d.parent_name, sort = d.sort, head_employee_id = coalesce((select id from crm_employees e where e.pyrus_id = d.head_pyrus), c.head_employee_id), "updatedAt" = now()
  from d where c.name = d.name;
insert into crm_departments(name, parent_name, head_employee_id, sort, "createdAt", "updatedAt")
  select d.name, d.parent_name, (select id from crm_employees e where e.pyrus_id = d.head_pyrus), d.sort, now(), now() from d
  where not exists (select 1 from crm_departments c where c.name = d.name);
commit;""" % J(dept_rows))
employees = rows('select id, last_name from crm_employees')

# ---------- задачи ----------
form = pyrus('forms/%d' % FORM, token=tok)
FORM_NAME = form.get('name', '')
reg = pyrus('forms/%d/register' % FORM, {'include_archived': 'y', 'item_count': 20000}, token=tok)['tasks']
print('задач в Pyrus', len(reg))

def fval(fields, name):
    for f in fields or []:
        if f.get('name') == name: return f.get('value')
    return None
def choice(v): return (v or {}).get('choice_names', [None])[0] if isinstance(v, dict) else None
URG = {'Срочно': 'urgent', 'Ещё вчера!': 'asap'}
HR = re.compile(r'отпуск|больничн|увольн|уволь|нов(ый|ая|ого) сотрудни|при[её]м на работу|трудов|кадр|отгул|декрет', re.I)
FIN = re.compile(r'сч[её]т|оплат|плат[её]ж|долг|смет|бюджет|возврат|штраф|задолж', re.I)
DOC = re.compile(r'договор|доп\.? ?соглаш|акт |реестр|документ', re.I)

def find_object(title):
    t = (title or '').lower().replace('ё', 'е')
    best = None
    for o in objects:
        base = re.split(r'[,/(]', o)[0].strip().lower().replace('ё', 'е')
        if len(base) >= 4 and re.search(r'(^|[^а-яa-z])' + re.escape(base[:-1] if len(base) > 6 else base), t) and (not best or len(base) > len(best[1])):
            best = (o, base)
    return best[0] if best else None
def find_employee(title):
    t = (title or '').lower().replace('ё', 'е')
    for e in employees:
        ln = (e['last_name'] or '').lower().replace('ё', 'е')
        if len(ln) >= 4 and re.search(re.escape(ln[:-1] if len(ln) > 5 else ln), t): return e['id']
    return None

def fmt_val(f):
    v, t = f.get('value'), f.get('type')
    if v in (None, '', {}): return '—'
    if t in ('person', 'person_responsible') or (isinstance(v, dict) and 'first_name' in v): return pname(v) or '—'
    if t == 'multiple_choice': return choice(v) or '—'
    if t == 'due_date': return datetime.date.fromisoformat(v[:10]).strftime('%d.%m.%Y')
    return str(v)[:300]

existing = {r['pyrus_id']: r for r in rows("""select t.id, t.pyrus_id, (select count(*) from crm_task_events e where e.task_id = t.id and e.pyrus_comment_id is null) as local_events
                                           from crm_tasks t where t.pyrus_id is not null""")}
known_comments = {r['pyrus_comment_id'] for r in rows('select pyrus_comment_id from crm_task_events where pyrus_comment_id is not null')}
task_rows, event_rows = [], []
for i, head in enumerate(reg):
    t = pyrus('tasks/%d' % head['id'], token=tok)['task']
    title = (fval(t['fields'], 'Заголовок Задачи') or t.get('text') or '').strip() or '(без заголовка)'
    st = choice(fval(t['fields'], 'Статус'))
    if t.get('close_date') or st == 'в Архиве': status = 'closed'
    elif st and st.startswith('В работе'): status = 'in_work'
    else: status = 'new'
    ex, ctl = fval(t['fields'], 'Исполнитель'), fval(t['fields'], 'Ответственный') or t.get('responsible')
    ex = ex or ctl   # исполнитель не указан — задачу ведёт ответственный
    comments = t.get('comments') or []
    first = comments[0] if comments else {}
    desc = (first.get('text') or '').strip()
    if desc == FORM_NAME or (len(desc) < 60 and FORM_NAME.split('(')[0].strip().lower() in desc.lower() and '(' in desc): desc = ''   # служебное «Новая Задача (Форма)»
    kind = 'Кадры' if HR.search(title) else 'Финансы и платежи' if FIN.search(title) else 'Объект и арендаторы' if find_object(title) else 'Документы' if DOC.search(title) else 'Общая'
    due_moved = sum(1 for c in comments[1:] for f in c.get('field_updates') or [] if f.get('type') == 'due_date')
    task_rows.append({'pyrus_id': t['id'], 'title': title[:250], 'description': desc or None, 'kind': kind,
                      'urgency': URG.get(choice(fval(t['fields'], 'Срочность')), 'normal'), 'due_date': (fval(t['fields'], 'Срок') or '')[:10] or None,
                      'status': status, 'executor_id': uid(ex), 'executor_name': pname(ex), 'controller_id': uid(ctl), 'controller_name': pname(ctl),
                      'author_id': uid(t.get('author')), 'author_name': pname(t.get('author')), 'object_name': find_object(title),
                      'employee_id': find_employee(title) if kind == 'Кадры' else None, 'due_moved': due_moved,
                      'closed_at': (t.get('close_date') or (t.get('last_modified_date') if status == 'closed' else None)), 'created': t['create_date']})
    for n, c in enumerate(comments):
        if c['id'] in known_comments: continue
        a = c.get('author') or {}
        base = {'pyrus_id': t['id'], 'pyrus_comment_id': c['id'], 'author_id': uid(a), 'author_name': pname(a), 'at': c['create_date']}
        if n == 0:
            event_rows.append(dict(base, kind='create', text='Задача создана в Pyrus'))
            continue
        text = (c.get('text') or '').strip()
        if text and text != FORM_NAME: event_rows.append(dict(base, kind='comment', text=text))
        sys_lines = ['%s → %s' % (f.get('name'), fmt_val(f)) for f in c.get('field_updates') or []]
        if c.get('reassigned_to'): sys_lines.append('Передана: %s' % pname(c['reassigned_to']))
        if c.get('action') == 'finished': sys_lines.append('Задача закрыта')
        if c.get('action') == 'reopened': sys_lines.append('Задача возобновлена')
        if c.get('attachments'): sys_lines.append('Файлы (в Pyrus): ' + ', '.join(x.get('name', '') for x in c['attachments']))
        if sys_lines: event_rows.append(dict(base, kind='edit', text='\n'.join(sys_lines)))
    if (i + 1) % 50 == 0: print('  прочитано', i + 1)

new = [r for r in task_rows if r['pyrus_id'] not in existing]
upd = [r for r in task_rows if r['pyrus_id'] in existing and not existing[r['pyrus_id']]['local_events']]
print('задач: новых %d, обновить %d, не трогаем (ведутся в NocoBase) %d; событий новых %d' % (len(new), len(upd), len(task_rows) - len(new) - len(upd), len(event_rows)))
if DRY: sys.exit(0)

COLS = 'title, description, kind, urgency, due_date, status, executor_id, executor_name, controller_id, controller_name, author_id, author_name, object_name, employee_id, due_moved, closed_at'
psql("""begin;
create temp table s as select * from json_to_recordset(%s) as x(pyrus_id bigint, title text, description text, kind text, urgency text, due_date date, status text,
  executor_id bigint, executor_name text, controller_id bigint, controller_name text, author_id bigint, author_name text, object_name text, employee_id bigint,
  due_moved int, closed_at timestamptz, created timestamptz);
insert into crm_tasks(%s, pyrus_id, source, "createdAt", "updatedAt")
  select %s, pyrus_id, 'pyrus', created, now() from s where not exists (select 1 from crm_tasks t where t.pyrus_id = s.pyrus_id);
update crm_tasks t set (%s) = (select %s from s where s.pyrus_id = t.pyrus_id), "updatedAt" = now()
  where t.pyrus_id = any(%s::bigint[]);
create temp table ev as select * from json_to_recordset(%s) as x(pyrus_id bigint, pyrus_comment_id bigint, author_id bigint, author_name text, kind text, text text, at timestamptz);
insert into crm_task_events(task_id, pyrus_comment_id, author_id, author_name, kind, text, "createdAt")
  select t.id, ev.pyrus_comment_id, ev.author_id, ev.author_name, ev.kind, ev.text, ev.at from ev join crm_tasks t on t.pyrus_id = ev.pyrus_id;
commit;""" % (J(task_rows), COLS, COLS, COLS, COLS, "'{%s}'" % ','.join(str(r['pyrus_id']) for r in upd), J(event_rows)))
print('готово')
