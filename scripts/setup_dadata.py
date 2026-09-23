#!/usr/bin/env python3
"""Реквизиты арендатора (юрлицо / ИП / физлицо) и подстановка из DaData (findById/party по ИНН).

Создаёт поля kpp / ogrn / legal_address / director во всех коллекциях договоров и коллекцию app_settings
(name → value) для настроек CRM. API-ключ DaData кладётся в app_settings отдельно (в репозиторий НЕ коммитится):

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 setup_dadata.py
    NB_URL=... NB_TOKEN=... DADATA_TOKEN=<ключ> python3 setup_dadata.py    # + записать/обновить ключ
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                  headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN},
                                  method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

FIELDS = [('kpp', 'КПП'), ('ogrn', 'ОГРН / ОГРНИП'), ('legal_address', 'Юридический адрес'), ('director', 'Руководитель: ФИО'), ('director_post', 'Руководитель: должность'),
          ('tenant_type', 'Тип арендатора'),              # Юрлицо / ИП / Физлицо — от него зависит набор реквизитов
          ('passport', 'Паспорт: серия и номер'), ('passport_issued', 'Паспорт: кем и когда выдан')]
for coll in ('draft_contracts', 'forming_contracts', 'rental_contracts', 'completed_contracts'):
    for name, title in FIELDS:
        r = call('collections/%s/fields:create' % coll, {'name': name, 'type': 'string', 'interface': 'input',
                 'uiSchema': {'type': 'string', 'title': title, 'x-component': 'Input'}})
        print(coll, name, 'ok' if 'data' in r else r.get('body', r))

r = call('collections:create', {'name': 'app_settings', 'title': 'Настройки CRM',
                                'options': {'createdAt': True, 'updatedAt': True, 'createdBy': False, 'updatedBy': False}})
print('collection app_settings', 'ok' if 'data' in r else r.get('body', r))
for name, typ in (('name', 'string'), ('value', 'text')):
    r = call('collections/app_settings/fields:create', {'name': name, 'type': typ, 'interface': 'input' if typ == 'string' else 'textarea',
             'uiSchema': {'type': 'string', 'title': name, 'x-component': 'Input' if typ == 'string' else 'Input.TextArea'}})
    print('app_settings', name, 'ok' if 'data' in r else r.get('body', r))

if os.environ.get('DADATA_TOKEN'):
    ex = call('app_settings:list?filter=' + urllib.request.quote(json.dumps({'name': 'dadata_token'})))
    rows = ex.get('data') or []
    if rows: r = call('app_settings:update?filterByTk=%s' % rows[0]['id'], {'value': os.environ['DADATA_TOKEN']})
    else: r = call('app_settings:create', {'name': 'dadata_token', 'value': os.environ['DADATA_TOKEN']})
    print('dadata_token', 'ok' if 'data' in r else r)
