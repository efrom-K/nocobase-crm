#!/usr/bin/env python3
"""Основная цена договора (на весь срок) отдельно от текущей: base_rent_per_sqm / base_rent_amount в rental_contracts.

Текущие rent_per_sqm / rent_amount = цена периода «Графика цены», действующего сегодня, иначе основная цена.
Так после окончания периода (например, скидки) цена сама возвращается к основной.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_base_price_fields.py
    затем один раз: update rental_contracts set base_rent_per_sqm=rent_per_sqm, base_rent_amount=rent_amount
                    where base_rent_per_sqm is null and base_rent_amount is null;
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

for name, title in (('base_rent_per_sqm', 'Основная ставка / 1 кв.м.'), ('base_rent_amount', 'Основная АП')):
    r = call('collections/rental_contracts/fields:create', {'name': name, 'type': 'double', 'interface': 'number',
             'uiSchema': {'type': 'number', 'title': title, 'x-component': 'InputNumber', 'x-component-props': {'stringMode': True, 'step': '1'}}})
    print('field', name, 'ok' if 'data' in r else r.get('body', r))
