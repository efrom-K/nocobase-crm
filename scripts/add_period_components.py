#!/usr/bin/env python3
"""«Дополнительные расчёты аренды»: период меняет любую из трёх цен (арендная плата, эксплуатационный сбор, обеспечительный платёж).

Поля периода: rent_on (галочка «арендная плата», старые периоды без неё = арендная плата), utility_on / utility_basis / utility_value,
deposit_on / deposit_value. У активных договоров — основные значения эксплуатационного сбора и платежа (как base_rent_*):
base_utility_per_sqm, base_utility_amount, base_deposit_amount; заполняются текущими значениями.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 add_period_components.py
"""
import json, os, sys, urllib.request, urllib.error

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

def field(coll, name, ftype, title):
    ui = {'boolean': ('checkbox', {'type': 'boolean', 'x-component': 'Checkbox'}),
          'double': ('number', {'type': 'number', 'x-component': 'InputNumber'}),
          'string': ('input', {'type': 'string', 'x-component': 'Input'})}[ftype]
    r = call('collections/%s/fields:create' % coll, {'name': name, 'type': ftype, 'interface': ui[0], 'uiSchema': dict(ui[1], title=title)})
    print(coll, name, 'ok' if 'data' in r else r.get('body', r))

for name, t, title in [('rent_on', 'boolean', 'Меняет арендную плату'), ('utility_on', 'boolean', 'Меняет эксплуатационный сбор'),
                       ('utility_basis', 'string', 'Эксплуатационный сбор: как задан'), ('utility_value', 'double', 'Эксплуатационный сбор: цена'),
                       ('deposit_on', 'boolean', 'Меняет обеспечительный платёж'), ('deposit_value', 'double', 'Обеспечительный платёж: сумма')]:
    field('contract_price_periods', name, t, title)
for name, title in [('base_utility_per_sqm', 'Основной эксплуатационный сбор за 1 квадратный метр в месяц'),
                    ('base_utility_amount', 'Основной эксплуатационный сбор в месяц'), ('base_deposit_amount', 'Основной обеспечительный платёж')]:
    field('rental_contracts', name, 'double', title)
