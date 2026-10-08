#!/usr/bin/env python3
"""Структура компании для всех сотрудников: раздел «Сотрудники» (/admin/hrpage01) открыт каждой роли, права разделены.

Делает:
  - пункт меню «Сотрудники (тест)» → «Сотрудники», виден всем ролям сотрудников;
  - права: HR (hr) и администраторы видят и правят всё. Остальные роли — только просмотр справочника:
      crm_employees — рабочие поля (ФИО, должность, отдел, объект, юрлицо, рабочий телефон и почта, график, учётка);
                      без даты рождения, дат приёма/увольнения, ставки, типа занятости, сроков договора, заметок HR;
      crm_departments — все поля, только просмотр; crm_legal_entities — название и руководитель;
      crm_vacations — только даты (без вида отпуска: «за свой счёт», декрет и т. п. — личное);
      охрана труда, СОУТ, ЛНА, программы мотивации, мероприятия с бюджетами — закрыты (как уже закрыты паспорт, воинский учёт, подбор).
  Повторный запуск безопасен (создаёт или обновляет).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 setup_staff_structure.py
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

FULL = {'admin', 'root', 'hr'}          # видят и правят всё
SKIP = {'mail_service'}                 # служебные учётки

PUBLIC_EMP = ['id', 'full_name', 'last_name', 'first_name', 'middle_name', 'position', 'department', 'email', 'phone', 'status',
              'user_id', 'legal_entity_id', 'extra_le_ids', 'object_name', 'work_schedule']
VIEW_ONLY = {
    'crm_employees': PUBLIC_EMP,
    'crm_departments': ['id', 'name', 'parent_name', 'head_employee_id', 'sort'],   # пустой список в NocoBase = ни одного поля, поэтому явно
    'crm_legal_entities': ['id', 'name', 'director', 'sort'],
    'crm_vacations': ['id', 'employee_id', 'start_date', 'end_date', 'days', 'status'],
}
DENY = ['crm_safety', 'crm_sout', 'crm_lna', 'crm_hr_programs', 'crm_hr_events',
        'crm_hr_private', 'crm_hr_files', 'crm_candidates', 'crm_vacancies', 'crm_staff_positions']

# 2. права по ролям
roles = [r['name'] for r in call('roles:list?paginate=false').get('data', []) if r['name'] not in FULL | SKIP]
for role in roles:
    have = {r['name']: r for r in call('roles/%s/resources:list?paginate=false' % role).get('data', [])}
    def put(name, actions):
        body = {'name': name, 'usingActionsConfig': True, 'actions': actions}
        r = call('roles/%s/resources:update?filterByTk=%s' % (role, have[name]['id']), body) if name in have else call('roles/%s/resources:create' % role, body)
        return ok(r)
    for coll, flds in VIEW_ONLY.items():
        act = {'name': 'view', 'fields': flds}
        print(role, coll, 'view', put(coll, [act]))
    for coll in DENY:
        print(role, coll, 'deny', put(coll, []))

# 3. меню: «Сотрудники» — всем ролям, без пометки «тест»
routes = call('desktopRoutes:list?paginate=false&filter=' + q({'schemaUid': {'$in': ['hrpage01', 'hrtabs01']}})).get('data', [])
ids = [r['id'] for r in routes]
page = next((r for r in routes if r.get('schemaUid') == 'hrpage01'), None)
if page and page.get('title') != 'Сотрудники':
    print('rename menu', ok(call('desktopRoutes:update?filterByTk=%s' % page['id'], {'title': 'Сотрудники'})))
for role in roles:
    print('menu', role, ok(call('roles/%s/desktopRoutes:add' % role, ids)))
