#!/usr/bin/env python3
"""Блок «Цена и платежи» активного договора: отметки первых счетов (переносятся из этапа «Оплата счетов»)
и признак «сумма договора введена вручную» (иначе она считается сама).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_payment_fields.py
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

FLAGS = ['deposit_invoiced', 'deposit_paid', 'rent_invoiced', 'rent_paid', 'utility_invoiced', 'utility_paid', 'total_amount_manual']
for coll in ('rental_contracts', 'completed_contracts'):
    for f in FLAGS:
        r = call('collections/%s/fields:create' % coll, {'name': f, 'type': 'boolean', 'interface': 'checkbox',
                 'uiSchema': {'type': 'boolean', 'title': f, 'x-component': 'Checkbox'}})
        print(coll, f, 'ok' if 'data' in r else r.get('body', r))
