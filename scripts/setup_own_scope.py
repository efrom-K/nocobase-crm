#!/usr/bin/env python3
"""Сотрудник видит только своё: отпуска и задачи (просьба HR 10-27). Плюс поле HR «Фактический выход на работу».

  - crm_employees.started_on (дата) — «Фактический выход на работу»; видит HR (у остальных ролей список полей задан явно, поля в нём нет);
  - crm_vacations: связь employee (по employee_id) и scope «Свои отпуска» — сотрудник, у которого user_id = текущий пользователь;
  - crm_tasks: scope «Свои задачи» — исполнитель, автор или контролёр = текущий пользователь;
  - ROLES ниже получают эти scope на просмотр / правку / удаление; admin, root, hr и aho (СКУД учитывает отпуска всех) — без ограничений.
Повторный запуск безопасен. Откат: svc ~/nb_backup/acl_before_own_scope_2026-10-27.sql.gz

    NB_URL=https://crm.ykinvest.ru NB_TOKEN=<токен root> python3 setup_own_scope.py
"""
import json, os, sys, urllib.parse, urllib.request, urllib.error

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
def q(x): return urllib.parse.quote(json.dumps(x))
ME = '{{ ctx.state.currentUser.id }}'
ROLES = ['crm_test', 'member', 'legal_dept', 'rental_dept', 'accounting_dept']

def field(coll, name, body):
    have = call('collections/%s/fields:list?paginate=false&filter=%s' % (coll, q({'name': name}))).get('data')
    print('field', coll, name, 'exists' if have else ok(call('collections/%s/fields:create' % coll, dict(body, name=name))))

field('crm_employees', 'started_on', {'type': 'dateOnly', 'interface': 'date', 'uiSchema': {'type': 'string', 'title': 'Фактический выход на работу', 'x-component': 'DatePicker'}})
field('crm_vacations', 'employee', {'type': 'belongsTo', 'interface': 'm2o', 'target': 'crm_employees', 'foreignKey': 'employee_id', 'targetKey': 'id',
                                    'uiSchema': {'title': 'Сотрудник', 'x-component': 'AssociationField'}})

def scope(coll, name, flt):
    have = call('dataSourcesRolesResourcesScopes:list?paginate=false&filter=' + q({'resourceName': coll, 'name': name})).get('data', [])
    vals = {'dataSourceKey': 'main', 'resourceName': coll, 'name': name, 'scope': flt}
    r = call('dataSourcesRolesResourcesScopes:update?filterByTk=%s' % have[0]['id'], vals) if have else call('dataSourcesRolesResourcesScopes:create', vals)
    print('scope', name, ok(r))
    return have[0]['id'] if have else r['data']['id']

vac_scope = scope('crm_vacations', 'Свои отпуска', {'employee': {'user_id': {'$eq': ME}}})
task_scope = scope('crm_tasks', 'Свои задачи', {'$or': [{'executor_id': {'$eq': ME}}, {'author_id': {'$eq': ME}}, {'controller_id': {'$eq': ME}}]})

TASK_FIELDS = ['id', 'createdAt', 'updatedAt'] + [f['name'] for f in call('collections/crm_tasks/fields:list?paginate=false')['data'] if f['name'] not in ('id', 'createdAt', 'updatedAt')]
strategy = {r['name']: (r.get('strategy') or {}).get('actions', []) for r in call('roles:list?paginate=false')['data']}

def acl(role, coll, body):
    have = {r['name']: r for r in call('roles/%s/resources:list?paginate=false' % role).get('data', [])}
    r = call('roles/%s/resources:update?filterByTk=%s' % (role, have[coll]['id']), body) if coll in have else call('roles/%s/resources:create' % role, body)
    print('acl', role, coll, ok(r))

for role in ROLES:
    # отпуска: как было (только просмотр, те же поля), но только свои
    acl(role, 'crm_vacations', {'name': 'crm_vacations', 'usingActionsConfig': True,
                                'actions': [{'name': 'view', 'fields': ['days', 'employee_id', 'end_date', 'id', 'start_date', 'status'], 'scopeId': vac_scope}]})
    # задачи: действия роли как в её общей стратегии; создавать — любые, остальное — только свои
    acts = [a.split(':')[0] for a in strategy.get(role, [])] or ['view']
    acl(role, 'crm_tasks', {'name': 'crm_tasks', 'usingActionsConfig': True,
                            'actions': [dict({'name': a, 'fields': TASK_FIELDS}, **({} if a == 'create' else {'scopeId': task_scope})) for a in acts if a in ('view', 'create', 'update', 'destroy', 'export')]})
