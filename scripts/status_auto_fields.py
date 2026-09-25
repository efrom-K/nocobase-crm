#!/usr/bin/env python3
"""Поля автоматического статуса активного договора (правило — db/migrations/002_contract_status_auto.sql):
status_reason — причина статуса (для «Проблемы» обязательна, вводится вручную; для остальных пишет база),
status_manual — статус поставлен вручную, status_auto_key — автоматическая оценка на момент ручной установки.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 status_auto_fields.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body):
    req = urllib.request.Request(BASE + '/api/' + path, data=json.dumps(body).encode(),
                                  headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN}, method='POST')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

for name, typ, iface, title, comp in [('status_reason', 'text', 'textarea', 'Причина статуса', 'Input.TextArea'),
                                      ('status_manual', 'boolean', 'checkbox', 'Статус поставлен вручную', 'Checkbox'),
                                      ('status_auto_key', 'string', 'input', 'Автоматическая оценка статуса', 'Input')]:
    r = call('collections/rental_contracts/fields:create', {'name': name, 'type': typ, 'interface': iface,
             'uiSchema': {'type': 'boolean' if typ == 'boolean' else 'string', 'title': title, 'x-component': comp}})
    print(name, 'ok' if 'error' not in r else r['body'])
