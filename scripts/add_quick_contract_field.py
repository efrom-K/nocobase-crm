#!/usr/bin/env python3
"""Добавляет поле is_quick (boolean) в forming_contracts — маркер «Срочного договора»
(создан одной формой, без прохождения 6 этапов). Идемпотентно: повторный запуск не ломает.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 scripts/add_quick_contract_field.py
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

r = call('collections/forming_contracts/fields:create', {
    'name': 'is_quick', 'type': 'boolean', 'interface': 'checkbox', 'defaultValue': False,
    'uiSchema': {'type': 'boolean', 'title': 'Срочный договор (одной формой)', 'x-component': 'Checkbox'}
})
print('field forming_contracts.is_quick', 'ok' if 'data' in r else r.get('body', r))
