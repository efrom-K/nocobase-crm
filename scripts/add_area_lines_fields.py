#!/usr/bin/env python3
"""06.10.2026: «Несколько площадей с разными ставками» — JSON-поля со строками [{area, rate}]:
area_lines у договоров (черновики, формирующиеся, активные, архив) и rent_lines у периодов «Дополнительных расчётов аренды».
Пусто — обычный режим (одна площадь и ставка).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_area_lines_fields.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
FIELDS = [(c, 'area_lines', 'Площади и ставки') for c in ('draft_contracts', 'forming_contracts', 'rental_contracts', 'completed_contracts')] \
    + [('contract_price_periods', 'rent_lines', 'Площади и ставки периода')]
for coll, name, title in FIELDS:
    req = urllib.request.Request(BASE + '/api/collections/%s/fields:create' % coll, method='POST',
          headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN},
          data=json.dumps({'name': name, 'type': 'json', 'interface': 'json', 'defaultValue': None,
                           'uiSchema': {'type': 'object', 'title': title, 'x-component': 'Input.JSON'}}).encode())
    try:
        print(coll, name, 'ok' if 'data' in json.load(urllib.request.urlopen(req)) else '?')
    except urllib.error.HTTPError as e:
        print(coll, name, 'error', e.code, e.read().decode()[:200])
