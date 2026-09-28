#!/usr/bin/env python3
"""28.09.2026: «Вид объекта» договора — Помещение / Земельный участок / Машино-место (поле object_kind во всех коллекциях договоров).
Значения в базе = подписи. В формах — после «Номера договора» (карточка, срочный договор) и после «Объекта» (этап «Заявка на аренду»);
столбец в реестре — scripts/setup_registry_columns.py.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_object_kind_field.py
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

ENUM = [{'value': v, 'label': v} for v in ('Помещение', 'Земельный участок', 'Машино-место')]
for coll in ('draft_contracts', 'forming_contracts', 'rental_contracts', 'completed_contracts'):
    r = call('collections/%s/fields:create' % coll, {'name': 'object_kind', 'type': 'string', 'interface': 'select',
             'uiSchema': {'type': 'string', 'title': 'Вид объекта', 'x-component': 'Select', 'enum': ENUM}})
    print(coll, 'ok' if 'data' in r else r.get('body', r))

# «Площади» на дашборде по видам: у объекта, кроме общей площади помещений (total_area), — площадь участков и число машино-мест
for name, typ, iface, title in (('land_total_area', 'double', 'number', 'Общая площадь земельных участков, м²'),
                                ('parking_total', 'integer', 'integer', 'Всего машино-мест')):
    r = call('collections/contract_objects/fields:create', {'name': name, 'type': typ, 'interface': iface,
             'uiSchema': {'type': 'number', 'title': title, 'x-component': 'InputNumber'}})
    print('contract_objects', name, 'ok' if 'data' in r else r.get('body', r))
