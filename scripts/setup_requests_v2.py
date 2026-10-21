#!/usr/bin/env python3
"""Заявки v2 (решения владельца 21.10): учёт KPI управляющих, все изменения заявок — через сервис requests-service.

Шаги (каждый можно повторять — уже созданное NocoBase не создаст второй раз):
  fields    — новые поля заявки и переписки, коллекция request_approvals (запросы на перенос/передачу/отмену);
  roles     — роль «Контроль заявок» (Коледа, операционный директор), роль и учётка сервиса (пароль печатается один раз);
  managers  — проставить объектам управляющего и старшего с учёткой по имени из Pyrus (только пустые, печатает что сделал);
  lock      — ролям сотрудников на заявки только чтение (включать ПОСЛЕ выкладки блока, который пишет через сервис).

    NB_URL=http://<сервер>:13000 NB_TOKEN=<токен root> python3 setup_requests_v2.py fields roles managers [lock]
"""
import json, os, secrets, sys, urllib.parse, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
STEPS = set(sys.argv[1:]) or sys.exit(__doc__)

def call(path, body=None, method=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method=method or ('POST' if body is not None else 'GET'))
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}
def ok(r): return 'ok' if 'data' in r else r.get('body', r)
def rows(path): return call(path).get('data') or []
def J(o): return urllib.parse.quote(json.dumps(o))
_fields = {}
TS = {'object_requests': ['createdAt', 'updatedAt'], 'request_events': ['createdAt'], 'request_approvals': ['createdAt', 'updatedAt'], 'request_notifications': ['createdAt']}   # столбцы есть, а полей NocoBase у них нет
def fields_of(c):   # все поля коллекции: в этой версии NocoBase пустой список полей у действия роли = никаких полей
    if c not in _fields: _fields[c] = [f['name'] for f in rows('collections/%s/fields:list?paginate=false' % c)] + ['id'] + TS.get(c, [])
    return sorted(set(_fields[c]))
def grant(role, c, acts):   # права роли на коллекцию: старые записи этой роли на эту коллекцию заменяются
    for x in rows('roles/%s/resources:list?paginate=false&filter=%s' % (role, J({'name': c}))): call('roles/%s/resources:destroy?filterByTk=%s' % (role, x['id']), {})
    fl = fields_of(c)
    return ok(call('roles/%s/resources:create' % role, {'name': c, 'usingActionsConfig': True, 'actions': [{'name': a, 'fields': fl if a in ('view', 'create', 'update') else []} for a in acts]}))

def F(name, typ, iface, title, comp='Input'):
    return {'name': name, 'type': typ, 'interface': iface, 'uiSchema': {'type': 'number' if typ in ('bigInt', 'integer', 'double') else 'string', 'title': title, 'x-component': comp}}
DT = lambda n, t: F(n, 'date', 'datetime', t, 'DatePicker')
NUM = lambda n, t: F(n, 'bigInt', 'integer', t, 'InputNumber')

REQ_FIELDS = [
    F('source', 'string', 'input', 'Источник'),                     # portal | phone | inspection | order | dept | other
    F('accept_mode', 'string', 'input', 'Кто принимает работу'),     # tenant | user | controller
    NUM('accept_user_id', 'Принимает (учётка)'),
    DT('react_due_at', 'Взять в работу до'), DT('taken_at', 'Взята в работу'), DT('waiting_since', 'Ждёт с'),
    F('dept', 'string', 'input', 'В отделе'), NUM('dept_user_id', 'Исполнитель в отделе'), DT('dept_since', 'В отделе с'),
    F('dept_due', 'dateOnly', 'date', 'Срок отдела', 'DatePicker'),
    F('reopen_count', 'integer', 'integer', 'Возвратов', 'InputNumber'),
    F('rating', 'integer', 'integer', 'Оценка', 'InputNumber'), F('rating_note', 'text', 'textarea', 'Отзыв', 'Input.TextArea'),
    F('contact_name', 'string', 'input', 'Контакт арендатора'), F('contact_email', 'string', 'input', 'Почта контакта'), F('contact_phone', 'string', 'input', 'Телефон контакта'),
]
REQ_COLLS = ['object_requests', 'request_events', 'request_approvals']

if 'fields' in STEPS:
    for f in REQ_FIELDS: print('object_requests.' + f['name'], ok(call('collections/object_requests/fields:create', f)))
    print('request_events.visibility', ok(call('collections/request_events/fields:create', F('visibility', 'string', 'input', 'Кому видно'))))   # internal | public
    print('collection request_approvals', ok(call('collections:create', {
        'name': 'request_approvals', 'title': 'Заявки: запросы на решение', 'autoGenId': True, 'createdAt': True, 'updatedAt': True,
        'fields': [NUM('request_id', 'Заявка'), F('kind', 'string', 'input', 'Что просят'),   # due | assign | cancel
                   F('payload', 'json', 'json', 'Параметры', 'Input.JSON'), F('reason', 'text', 'textarea', 'Причина', 'Input.TextArea'),
                   F('status', 'string', 'input', 'Статус'), NUM('author_id', 'Кто просит'), NUM('decided_by', 'Кто решил'),   # pending | approved | rejected
                   DT('decided_at', 'Когда решено'), F('decision_note', 'text', 'textarea', 'Комментарий решения', 'Input.TextArea')]})))

if 'roles' in STEPS:
    print('role requests_control', ok(call('roles:create', {'name': 'requests_control', 'title': 'Контроль заявок', 'strategy': {'actions': []}, 'snippets': []})))
    for uid in (12, 16):   # Коледа (главный управляющий), Панкратьев (операционный директор)
        print('requests_control →', uid, ok(call('users/%s/roles:add' % uid, ['requests_control'])))
    print('role requests_service', ok(call('roles:create', {'name': 'requests_service', 'title': 'Сервис заявок', 'hidden': True, 'allowConfigure': False,
                                                            'strategy': {'actions': []}, 'snippets': []})))
    for c, acts in (('object_requests', ['view', 'create', 'update']), ('request_events', ['view', 'create']), ('request_approvals', ['view', 'create', 'update']),
                    ('request_notifications', ['create']), ('users', ['view']), ('crm_employees', ['view']), ('crm_config', ['view']), ('contract_objects', ['view'])):
        print('requests_service', c, acts, grant('requests_service', c, acts))
    if rows('users:list?filter=' + J({'username': 'requests-service'})):
        print('user requests-service уже есть — пароль не меняю')
    else:
        pw = secrets.token_urlsafe(24)
        r = call('users:create', {'username': 'requests-service', 'nickname': 'Сервис заявок', 'password': pw, 'roles': ['requests_service']})
        print('user requests-service', ok(r))
        if 'data' in r: print('NB_SERVICE_PASSWORD=' + pw)

if 'managers' in STEPS:
    users = rows('users:list?paginate=false&fields=id,nickname')
    by = {}
    for u in users:   # «Имя Фамилия» в учётке, «Фамилия Имя» в Pyrus — сравниваем набором слов
        if u.get('nickname'): by[frozenset(u['nickname'].lower().replace('ё', 'е').split())] = u['id']
    for o in rows('contract_objects:list?paginate=false'):
        upd = {}
        for idf, namef in (('manager_user_id', 'manager_name'), ('senior_user_id', 'senior_name')):
            uid = by.get(frozenset(str(o.get(namef) or '').lower().replace('ё', 'е').split()))
            if not o.get(idf) and uid: upd[idf] = uid
        if upd: print('объект', o['name'], upd, ok(call('contract_objects:update?filterByTk=%s' % o['id'], upd)))
        elif not o.get('manager_user_id'): print('объект', o['name'], '— управляющий без учётки:', o.get('manager_name') or '(не указан)')

if 'lock' in STEPS:
    for role in ('admin', 'accounting_dept', 'aho', 'crm_test', 'hr', 'legal_dept', 'rental_dept', 'requests_control'):
        for c in REQ_COLLS:
            print('view-only', role, c, grant(role, c, ['view']))
        print('no access', role, 'request_notifications', grant(role, 'request_notifications', []))
