#!/usr/bin/env python3
"""Кадры: учредители юрлиц — кто владеет компанией и какой долей (раздел «Юрлица и учредители» дашборда HR).

Создаёт:
  - crm_le_owners — доля в юрлице: владелец (сотрудник из CRM / наше юрлицо / другое лицо или организация), доля %, номинал,
    с какой даты / по какую (вышедшие остаются в истории), основание, заметки; документы — через crm_hr_files (entity 'own');
  - crm_legal_entities.egrul_checked_on — когда последний раз сверяли учредителей с ЕГРЮЛ;
  - запрет на crm_le_owners для всех ролей, кроме root, admin и hr;
  - ключ настроек hr.docKinds.own (виды документов; роль hr правит свои ключи hr.*).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_le_owners.py
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
def N(name, title): return F(name, 'double', 'number', title, 'InputNumber')
def D(name, title): return F(name, 'dateOnly', 'date', title, 'DatePicker')

print('collection crm_le_owners', ok(call('collections:create', {'name': 'crm_le_owners', 'title': 'Учредители юрлиц', 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': [
    I('legal_entity_id', 'Юрлицо'),
    S('owner_kind', 'Кто владеет'),            # emp — сотрудник | le — наше юрлицо | ext — другое лицо / организация
    I('employee_id', 'Сотрудник'), I('owner_le_id', 'Юрлицо-владелец'), S('owner_name', 'Владелец (не из CRM)'), S('owner_inn', 'ИНН владельца'),
    N('share_pct', 'Доля, %'), N('share_nominal', 'Номинал доли, ₽'),
    D('since_on', 'Учредитель с'), D('until_on', 'Вышел из состава'),
    T('basis', 'Основание'), T('note', 'Заметки')]})))
print('crm_legal_entities.egrul_checked_on', ok(call('collections/crm_legal_entities/fields:create', D('egrul_checked_on', 'Сверено с ЕГРЮЛ'))))

roles = [r for r in psql("select name from roles order by name").split() if r not in ('root', 'admin', 'hr')]
for role in roles:
    print('deny crm_le_owners for', role, ok(call('roles/%s/resources:create' % role, {'name': 'crm_le_owners', 'usingActionsConfig': True, 'actions': []})))

psql("insert into crm_config(key, value, \"createdAt\", \"updatedAt\") values ('hr.docKinds.own', null, now(), now()) on conflict (key) do nothing;")
print('config hr.docKinds.own ok')
