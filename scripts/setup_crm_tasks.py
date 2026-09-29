#!/usr/bin/env python3
"""Тестовый контур CRM, шаг 2: «Задачи» и «Сотрудники» (перенос из Pyrus: форма задач + оргструктура и участники).

Создаёт:
  - crm_tasks (задача), crm_task_events (переписка и история задачи);
  - crm_departments (отделы, руководитель), crm_employees (сотрудники: отдел, должность, контакты, учётка NocoBase);
  - очередь task_notifications + workflow → колокольчик (канал «Задачи»);
  - отдельную страницу меню «Задачи и сотрудники (тест)» (/admin/tskpage01, JS-блок crmblock002), видна только администраторам.
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

# --- отдельная страница меню «Задачи и сотрудники (тест)» (/admin/tskpage01), видна только администраторам:
# маршрут через API (кэш ролей), сетка и JS-блок crmblock002 — строками flowModels. Заявки остаются на «Тестовой странице».
r = call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Задачи и сотрудники (тест)', 'icon': 'TeamOutlined', 'schemaUid': 'tskpage01', 'menuSchemaUid': 'tskmenu01',
                                  'children': [{'type': 'tabs', 'schemaUid': 'tsktabs01', 'hidden': True}]})
print('route', ok(r))
routes = [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + urllib.request.quote(json.dumps({'schemaUid': {'$in': ['tskpage01', 'tsktabs01']}})))['data']]
for role in ('member', 'rental_dept', 'legal_dept', 'accounting_dept'):
    print('hide from', role, ok(call('roles/%s/desktopRoutes:remove' % role, routes)))
LAYOUT = {'rows': [{'id': 'tskrow1', 'cells': [{'id': 'tskrow1:cell:0', 'items': ['crmblock002']}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': 'tsktabs01', 'parentId': 'tsktabs01', 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {'tskrow1': [['crmblock002']]}, 'sizes': {'tskrow1': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': ['tskrow1'], 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': 'tskgrid001', 'sortIndex': 0,
         'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
psql("""begin;
insert into "flowModels"(uid,name,options) values ('tskgrid001','tskgrid001','%s') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('crmblock002','crmblock002','%s') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('tskgrid001','tskgrid001',0,false,'grid',null),('tsktabs01','tskgrid001',1,false,null,null),
 ('crmblock002','crmblock002',0,false,'items',null),('tskgrid001','crmblock002',1,false,null,1),('tsktabs01','crmblock002',2,false,null,1)
 on conflict do nothing;
commit;""" % (json.dumps(grid, ensure_ascii=False), json.dumps(block, ensure_ascii=False)))
print('page models ok')
