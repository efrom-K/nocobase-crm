#!/usr/bin/env python3
"""Тестовый контур CRM: «Заявки по объектам» (ремонт, эксплуатация, вопросы арендаторов, расторжения, платежи, проверки…).

Создаёт:
  - коллекции object_requests (заявка), request_events (переписка и история заявки);
  - очередь request_notifications + workflow → колокольчик (канал «Заявки»), как у договоров/почты;
  - у объектов (contract_objects): управляющий и старший управляющий — учётка NocoBase (id) и имя из Pyrus (текстом);
  - страницу меню «Заявки (тест)» (/admin/crmpage01, JS-блок crmblock001), видна только роли admin.
Код блока выкладывается агентом из src/crm-requests.js (deploy/blocks.json). Сроки, напоминания, эскалация и
автозакрытие — scripts/request_reminders.py (cron на сервере).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_requests.py
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

# --- заявки
print('collection object_requests', ok(call('collections:create', {
    'name': 'object_requests', 'title': 'Заявки по объектам', 'autoGenId': True, 'createdAt': True, 'updatedAt': True,
    'fields': [
        F('object_name', 'string', 'input', 'Объект'),
        F('contract_id', 'bigInt', 'integer', 'Договор (id активного)', 'InputNumber'),
        F('tenant_label', 'string', 'input', 'Договор / арендатор'),
        F('kind', 'string', 'input', 'Тип'),
        F('title', 'string', 'input', 'Суть'),
        F('description', 'text', 'textarea', 'Описание', 'Input.TextArea'),
        F('urgency', 'string', 'input', 'Срочность'),            # normal | urgent | emergency
        F('due_date', 'dateOnly', 'date', 'Срок', 'DatePicker'),
        F('status', 'string', 'input', 'Статус'),                 # new | in_work | waiting | done | closed | cancelled
        F('wait_reason', 'string', 'input', 'Чего ждём'),
        F('responsible_id', 'bigInt', 'integer', 'Ответственный', 'InputNumber'),
        F('author_id', 'bigInt', 'integer', 'Автор', 'InputNumber'),
        F('result', 'text', 'textarea', 'Результат', 'Input.TextArea'),
        F('due_moved', 'integer', 'integer', 'Переносов срока', 'InputNumber'),
        F('done_at', 'date', 'datetime', 'Выполнена', 'DatePicker'),
        F('closed_at', 'date', 'datetime', 'Закрыта', 'DatePicker'),
        F('reminded_on', 'dateOnly', 'date', 'Напоминание отправлено', 'DatePicker'),
        F('escalated_at', 'date', 'datetime', 'Эскалация', 'DatePicker'),
    ]})))
print('collection request_events', ok(call('collections:create', {
    'name': 'request_events', 'title': 'Заявки: переписка и история', 'autoGenId': True, 'createdAt': True, 'updatedAt': False,
    'fields': [
        F('request_id', 'bigInt', 'integer', 'Заявка', 'InputNumber'),
        F('author_id', 'bigInt', 'integer', 'Автор', 'InputNumber'),
        F('kind', 'string', 'input', 'Вид'),                      # comment | status | due | assign | create | edit
        F('text', 'text', 'textarea', 'Текст', 'Input.TextArea'),
        F('file_id', 'bigInt', 'integer', 'Файл', 'InputNumber'),
    ]})))

# --- ответственные по объектам
for name, typ, iface, title in (('manager_user_id', 'bigInt', 'integer', 'Управляющий (учётка)'), ('senior_user_id', 'bigInt', 'integer', 'Старший управляющий (учётка)'),
                                ('manager_name', 'string', 'input', 'Управляющий (Pyrus)'), ('senior_name', 'string', 'input', 'Старший управляющий (Pyrus)')):
    print('contract_objects', name, ok(call('collections/contract_objects/fields:create', F(name, typ, iface, title, 'InputNumber' if typ == 'bigInt' else 'Input'))))

# --- уведомления: очередь → workflow → колокольчик
print('channel requests', ok(call('notificationChannels:create', {'name': 'requests', 'title': 'Заявки', 'description': 'Заявки по объектам: назначения, сроки, эскалации',
                                                                  'notificationType': 'in-app-message', 'options': {}})))
print('collection request_notifications', ok(call('collections:create', {
    'name': 'request_notifications', 'title': 'Очередь уведомлений по заявкам', 'autoGenId': True, 'createdAt': True, 'updatedAt': False,
    'fields': [F('user_id', 'bigInt', 'integer', 'Пользователь', 'InputNumber'), F('title', 'string', 'input', 'Заголовок'),
               F('text', 'text', 'textarea', 'Текст', 'Input.TextArea'), F('url', 'string', 'input', 'Ссылка')]})))
w = call('workflows:create', {'title': 'Заявки → колокольчик', 'type': 'collection', 'enabled': False, 'sync': False,
                               'config': {'collection': 'main:request_notifications', 'mode': 1, 'appends': []}})
wid = w['data']['id']
n = call('workflows/%s/nodes:create' % wid, {'type': 'notification', 'title': 'Отправить в колокольчик', 'upstreamId': None, 'config': {
    'channelName': 'requests', 'title': '{{$context.data.title}}', 'content': '{{$context.data.text}}',
    'receivers': ['{{$context.data.user_id}}'], 'options': {'url': '{{$context.data.url}}'}, 'ignoreFail': True}})
assert 'data' in n, n
call('workflows:update?filterByTk=%s' % wid, {'enabled': True})
print('workflow', wid, 'enabled')

# --- страница меню «Заявки (тест)»: маршрут через API (кэш ролей), сетка и JS-блок — строками flowModels
r = call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Заявки (тест)', 'icon': 'ToolOutlined', 'schemaUid': 'crmpage01', 'menuSchemaUid': 'crmmenu01',
                                  'children': [{'type': 'tabs', 'schemaUid': 'crmtabs01', 'hidden': True}]})
print('route', ok(r))
# тест — только администраторам: у ролей отделов включено «новые меню видны», убираем
routes = [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + urllib.request.quote(json.dumps({'schemaUid': {'$in': ['crmpage01', 'crmtabs01']}})))['data']]
for role in ('member', 'rental_dept', 'legal_dept', 'accounting_dept'):
    print('hide from', role, ok(call('roles/%s/desktopRoutes:remove' % role, routes)))
psql("""begin;
insert into "flowModels"(uid,name,options) values ('crmgrid0001','crmgrid0001','{"use":"BlockGridModel","parent":"crmtabs01","parentId":"crmtabs01","subKey":"grid","subType":"object","sortIndex":0,"flowRegistry":{},
 "props":{"rows":{"crmrow1":[["crmblock001"]]},"sizes":{"crmrow1":[24]},"colGap":16,"rowGap":16,"rowOrder":["crmrow1"],"layout":{"rows":[{"id":"crmrow1","cells":[{"id":"crmrow1:cell:0","items":["crmblock001"]}],"sizes":[24]}],"version":2}},
 "stepParams":{"gridSettings":{"grid":{"layout":{"rows":[{"id":"crmrow1","cells":[{"id":"crmrow1:cell:0","items":["crmblock001"]}],"sizes":[24]}],"version":2}}}}}') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('crmblock001','crmblock001','{"use":"JSBlockModel","props":{},"subKey":"items","subType":"array","parentId":"crmgrid0001","sortIndex":0,"stepParams":{"jsSettings":{"runJs":{"code":"ctx.render(\\"Загрузка…\\");"}}}}') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('crmgrid0001','crmgrid0001',0,false,'grid',null),('crmtabs01','crmgrid0001',1,false,null,null),
 ('crmblock001','crmblock001',0,false,'items',null),('crmgrid0001','crmblock001',1,false,null,1),('crmtabs01','crmblock001',2,false,null,1)
 on conflict do nothing;
commit;""")
print('page models ok')
