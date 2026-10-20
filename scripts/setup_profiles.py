#!/usr/bin/env python3
"""Профили: фото и статус (эмодзи, текст, до какого времени), «О себе» — поля коллекции users в стандартной форме
«Редактировать профиль» (меню пользователя справа сверху). Сохраняет родной users:updateProfile — он принимает только поля,
размещённые в этой форме (uiSchema nocobase-user-profile-edit-form). Отрисовка аватаров и быстрый статус — src/_crm-profile.js.
Повторный запуск безопасен.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 setup_profiles.py
"""
import json, os, sys, urllib.parse, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
FORM = 'nocobase-user-profile-edit-form'

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)

FIELDS = [
    {'name': 'avatar', 'type': 'belongsToMany', 'interface': 'attachment', 'target': 'attachments',
     'through': 'users_avatar', 'foreignKey': 'user_id', 'otherKey': 'attachment_id', 'sourceKey': 'id', 'targetKey': 'id',
     'uiSchema': {'type': 'array', 'title': 'Фото', 'x-component': 'Upload.Attachment',
                  'x-component-props': {'multiple': False, 'accept': 'image/*'}}},
    {'name': 'status_emoji', 'type': 'string', 'interface': 'input',
     'uiSchema': {'type': 'string', 'title': 'Эмодзи статуса', 'x-component': 'Input'}},
    {'name': 'status_text', 'type': 'string', 'interface': 'input',
     'uiSchema': {'type': 'string', 'title': 'Статус', 'x-component': 'Input'}},
    {'name': 'status_until', 'type': 'date', 'interface': 'datetime',
     'uiSchema': {'type': 'string', 'title': 'Статус до', 'x-component': 'DatePicker',
                  'x-component-props': {'showTime': True, 'dateFormat': 'DD.MM.YYYY', 'timeFormat': 'HH:mm'}}},
    {'name': 'about', 'type': 'text', 'interface': 'textarea',
     'uiSchema': {'type': 'string', 'title': 'О себе', 'x-component': 'Input.TextArea'}},
    # шапка профиля: своё фото или готовый градиент (ключ из src/_crm-profile.js COVERS)
    {'name': 'cover', 'type': 'belongsToMany', 'interface': 'attachment', 'target': 'attachments',
     'through': 'users_cover', 'foreignKey': 'user_id', 'otherKey': 'attachment_id', 'sourceKey': 'id', 'targetKey': 'id',
     'uiSchema': {'type': 'array', 'title': 'Шапка профиля', 'x-component': 'Upload.Attachment',
                  'x-component-props': {'multiple': False, 'accept': 'image/*'}}},
    {'name': 'cover_style', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Цвет шапки', 'x-component': 'Input'}},
    # как в профиле GitHub
    {'name': 'position', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Должность', 'x-component': 'Input'}},
    {'name': 'location', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Город', 'x-component': 'Input'}},
    {'name': 'telegram', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Telegram', 'x-component': 'Input'}},
    {'name': 'github', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'GitHub', 'x-component': 'Input'}},
    {'name': 'website', 'type': 'string', 'interface': 'url', 'uiSchema': {'type': 'string', 'title': 'Сайт', 'x-component': 'Input.URL'}},
]
have = {f['name'] for f in call('collections/users/fields:list?paginate=false').get('data', [])}
for f in FIELDS:
    if f['name'] not in have:
        print('field', f['name'], ok(call('collections/users/fields:create', f)))

# фото группового чата мессенджера (как вложение у chat_messages)
have = {f['name'] for f in call('collections/chat_conversations/fields:list?paginate=false').get('data', [])}
if 'avatar' not in have:
    print('chat avatar', ok(call('collections/chat_conversations/fields:create', {
        'name': 'avatar', 'type': 'belongsTo', 'interface': 'm2o', 'target': 'attachments', 'foreignKey': 'avatar_id', 'targetKey': 'id',
        'uiSchema': {'type': 'object', 'title': 'Фото', 'x-component': 'AssociationField'}})))

def item(name, typ):
    return {'type': typ, 'x-toolbar': 'FormItemSchemaToolbar', 'x-settings': 'fieldSettings:FormItem', 'x-component': 'CollectionField',
            'x-decorator': 'FormItem', 'x-component-props': {}, 'x-collection-field': 'users.' + name}

def row(*items):
    return {'type': 'void', 'x-component': 'Grid.Row',
            'properties': {'c%d' % i: {'type': 'void', 'x-component': 'Grid.Col', 'properties': {n: item(n, t)}} for i, (n, t) in enumerate(items)}}

form = call('uiSchemas:getJsonSchema/' + FORM).get('data', {})
placed = json.dumps(form)
grid = None
def find_grid(s):
    global grid
    for k, v in (s.get('properties') or {}).items():
        if v.get('x-component') == 'Grid' and v.get('x-initializer') == 'form:configureFields': grid = v['x-uid']
        find_grid(v)
find_grid(form)
grid or sys.exit('profile form grid not found')
if '"users.avatar"' not in placed:
    print('form avatar', ok(call('uiSchemas:insertAdjacent/%s?position=afterBegin' % grid, {'schema': row(('avatar', 'array'))})))
if '"users.status_text"' not in placed:
    print('form status', ok(call('uiSchemas:insertAdjacent/%s?position=beforeEnd' % grid,
                                 {'schema': row(('status_emoji', 'string'), ('status_text', 'string'), ('status_until', 'string'))})))
if '"users.about"' not in placed:
    print('form about', ok(call('uiSchemas:insertAdjacent/%s?position=beforeEnd' % grid, {'schema': row(('about', 'string'))})))
if '"users.position"' not in placed:
    print('form github-like', ok(call('uiSchemas:insertAdjacent/%s?position=beforeEnd' % grid, {'schema': row(('position', 'string'), ('location', 'string'))})))
    print('form links', ok(call('uiSchemas:insertAdjacent/%s?position=beforeEnd' % grid, {'schema': row(('telegram', 'string'), ('github', 'string'), ('website', 'string'))})))
if '"users.cover"' not in placed:
    print('form cover', ok(call('uiSchemas:insertAdjacent/%s?position=beforeEnd' % grid, {'schema': row(('cover', 'array'), ('cover_style', 'string'))})))
