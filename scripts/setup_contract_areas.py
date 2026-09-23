#!/usr/bin/env python3
"""Создаёт коллекцию contract_areas — строки площади договора (несколько площадей по разным ставкам).

Строка = «N кв.м. по ставке X ₽/кв.м. в месяц» с датами действия. Исходный договор даёт первую строку,
каждое доп. соглашение закрывает старые строки (date_to) и/или открывает новые (date_from, addendum_id).
Площадь, АП и средняя ставка договора = сумма строк, действующих на сегодня (карточка + ночной apply_price_schedule.py).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 setup_contract_areas.py
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
        return {'error': e.code, 'body': e.read().decode()[:500]}

r = call('collections:create', {
    'name': 'contract_areas',
    'title': 'Площади договоров',
    'options': {'createdAt': True, 'createdBy': False, 'updatedAt': True, 'updatedBy': False}
})
print('collection contract_areas', 'ok' if 'data' in r else r.get('body', r))

FIELDS = [
    ('contract_type', 'string', 'input', 'Input'),
    ('note', 'string', 'input', 'Input'),
    ('contract_ref_id', 'bigInt', 'integer', 'InputNumber'),
    ('addendum_id', 'bigInt', 'integer', 'InputNumber'),
    ('author_id', 'bigInt', 'integer', 'InputNumber'),
    ('area_sqm', 'double', 'number', 'InputNumber'),
    ('rent_per_sqm', 'double', 'number', 'InputNumber'),
    ('date_from', 'dateOnly', 'date', 'DatePicker'),
    ('date_to', 'dateOnly', 'date', 'DatePicker'),
]
for name, typ, iface, comp in FIELDS:
    ui = {'type': 'number' if typ in ('bigInt', 'double') else 'string', 'title': name, 'x-component': comp}
    r = call('collections/contract_areas/fields:create', {'name': name, 'type': typ, 'interface': iface, 'uiSchema': ui})
    print('field', name, 'ok' if 'data' in r else r.get('body', r))
