#!/usr/bin/env python3
"""Тестовый контур CRM, шаг 2: «Задачи» и «Сотрудники» (перенос из Pyrus: форма задач + оргструктура и участники).

Создаёт:
  - crm_tasks (задача), crm_task_events (переписка и история задачи);
  - crm_departments (отделы, руководитель), crm_employees (сотрудники: отдел, должность, контакты, учётка NocoBase);
  - очередь task_notifications + workflow → колокольчик (канал «Задачи»);
  - JS-блок crmblock002 «Задачи и сотрудники» на «Тестовой странице» под заявками.
Код блока выкладывается агентом из src/crm-tasks.js (deploy/blocks.json).
Данные из Pyrus — scripts/import_pyrus.py.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_tasks.py
"""
import json, os, subprocess, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)

def psql(sql):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()

def F(name, typ, iface, title, comp='Input'):
    return {'name': name, 'type': typ, 'interface': iface, 'uiSchema': {'type': 'number' if typ in ('bigInt', 'integer', 'double') else 'string', 'title': title, 'x-component': comp}}
def S(name, title): return F(name, 'string', 'input', title)
def T(name, title): return F(name, 'text', 'textarea', title, 'Input.TextArea')
def I(name, title): return F(name, 'bigInt', 'integer', title, 'InputNumber')
def D(name, title): return F(name, 'dateOnly', 'date', title, 'DatePicker')
def DT(name, title): return F(name, 'date', 'datetime', title, 'DatePicker')

def collection(name, title, fields, updated=True):
    print('collection', name, ok(call('collections:create', {'name': name, 'title': title, 'autoGenId': True, 'createdAt': True, 'updatedAt': updated, 'fields': fields})))

# --- задачи: процесс как у заявок (Новая → В работе → Ждёт → Выполнена → Закрыта автором, + Отменена)
collection('crm_tasks', 'Задачи', [
    S('title', 'Задача'), T('description', 'Описание'),
    S('kind', 'Тип'),                        # Объект и арендаторы | Кадры | Финансы и платежи | Документы | Общая
    S('urgency', 'Срочность'),               # normal | urgent | asap
    D('due_date', 'Срок'), S('status', 'Статус'),   # new | in_work | waiting | done | closed | cancelled
    S('wait_reason', 'Чего ждём'),
    I('executor_id', 'Исполнитель'), S('executor_name', 'Исполнитель (имя)'),
    I('controller_id', 'Ответственный'), S('controller_name', 'Ответственный (имя)'),
    I('author_id', 'Автор'), S('author_name', 'Автор (имя)'),
    S('object_name', 'Объект'), I('contract_id', 'Договор (id активного)'), I('employee_id', 'Сотрудник (кадровая задача)'),
    T('result', 'Результат'), F('due_moved', 'integer', 'integer', 'Переносов срока', 'InputNumber'),
    DT('done_at', 'Выполнена'), DT('closed_at', 'Закрыта'),
    I('pyrus_id', 'Задача в Pyrus'), S('source', 'Источник'),   # crm | pyrus
])
collection('crm_task_events', 'Задачи: переписка и история', [
    I('task_id', 'Задача'), I('author_id', 'Автор'), S('author_name', 'Автор (имя)'),
    S('kind', 'Вид'),                        # comment | status | due | assign | create | edit
    T('text', 'Текст'), I('file_id', 'Файл'), I('pyrus_comment_id', 'Комментарий в Pyrus'),
], updated=False)
print('crm_task_events.file', ok(call('collections/crm_task_events/fields:create', {'name': 'file', 'type': 'belongsTo', 'target': 'attachments', 'foreignKey': 'file_id',
      'interface': 'm2o', 'uiSchema': {'title': 'Файл', 'x-component': 'AssociationField'}})))

# --- кадры
collection('crm_departments', 'Отделы', [
    S('name', 'Отдел'), S('parent_name', 'Входит в'), I('head_employee_id', 'Руководитель'), I('pyrus_id', 'Отдел в Pyrus'),
    F('sort', 'integer', 'integer', 'Порядок', 'InputNumber'),
])
collection('crm_employees', 'Сотрудники', [
    S('full_name', 'ФИО'), S('last_name', 'Фамилия'), S('first_name', 'Имя'), S('middle_name', 'Отчество'),
    S('position', 'Должность'), S('department', 'Отдел'), S('email', 'Почта'), S('phone', 'Телефон'),
    D('birthday', 'День рождения'), D('hired_on', 'Принят'), D('fired_on', 'Уволен'),
    S('status', 'Статус'),                   # active | vacation | fired
    I('user_id', 'Учётка NocoBase'), I('pyrus_id', 'Сотрудник в Pyrus'), T('note', 'Заметки'),
])

# --- уведомления: очередь → workflow → колокольчик (импорт из Pyrus в очередь не пишет)
print('channel tasks', ok(call('notificationChannels:create', {'name': 'tasks', 'title': 'Задачи', 'description': 'Задачи: назначения, сроки, комментарии',
                                                               'notificationType': 'in-app-message', 'options': {}})))
collection('task_notifications', 'Очередь уведомлений по задачам', [I('user_id', 'Пользователь'), S('title', 'Заголовок'), T('text', 'Текст'), S('url', 'Ссылка')], updated=False)
w = call('workflows:create', {'title': 'Задачи → колокольчик', 'type': 'collection', 'enabled': False, 'sync': False,
                               'config': {'collection': 'main:task_notifications', 'mode': 1, 'appends': []}})
wid = w['data']['id']
n = call('workflows/%s/nodes:create' % wid, {'type': 'notification', 'title': 'Отправить в колокольчик', 'upstreamId': None, 'config': {
    'channelName': 'tasks', 'title': '{{$context.data.title}}', 'content': '{{$context.data.text}}',
    'receivers': ['{{$context.data.user_id}}'], 'options': {'url': '{{$context.data.url}}'}, 'ignoreFail': True}})
assert 'data' in n, n
call('workflows:update?filterByTk=%s' % wid, {'enabled': True})
print('workflow', wid, 'enabled')

# --- блок на «Тестовой странице» (вкладка yvsy7xrnfii, сетка e8f4d7faa72) под заявками (crmblock001)
TEST_TABS, TEST_GRID = 'yvsy7xrnfii', 'e8f4d7faa72'
BLOCKS = ['crmblock001', 'crmblock002']
rows = {'crmrow%d' % (i + 1): [[b]] for i, b in enumerate(BLOCKS)}
LAYOUT = {'rows': [{'id': r, 'cells': [{'id': r + ':cell:0', 'items': rows[r][0]}], 'sizes': [24]} for r in rows], 'version': 2}
opts = {'props': {'rows': rows, 'sizes': {r: [24] for r in rows}, 'colGap': 16, 'rowGap': 16, 'rowOrder': list(rows), 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
sql = ["begin;", "update \"flowModels\" set options = (options::jsonb || '%s'::jsonb)::json where uid='%s';" % (json.dumps(opts), TEST_GRID)]
for i, uid in enumerate(BLOCKS[1:], 1):
    model = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': TEST_GRID, 'sortIndex': i,
             'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
    sql.append("insert into \"flowModels\"(uid,name,options) values ('%s','%s','%s') on conflict do nothing;" % (uid, uid, json.dumps(model, ensure_ascii=False)))
    sql.append("insert into \"flowModelTreePath\"(ancestor,descendant,depth,async,type,sort) values ('%s','%s',0,false,'items',null),('%s','%s',1,false,null,%d),('%s','%s',2,false,null,%d) on conflict do nothing;"
               % (uid, uid, TEST_GRID, uid, i + 1, TEST_TABS, uid, i + 1))
sql.append("commit;")
psql('\n'.join(sql))
print('blocks on test page ok')
