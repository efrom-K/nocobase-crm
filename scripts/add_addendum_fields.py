#!/usr/bin/env python3
"""Поля доп. соглашений для объединённого блока «Доп. соглашения»: дата вступления в силу, отметка «подписано»,
автосводка изменений площадей (что поменялось в contract_areas по этому соглашению).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_addendum_fields.py
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

FIELDS = [
    {'name': 'effective_date', 'type': 'dateOnly', 'interface': 'date', 'uiSchema': {'type': 'string', 'title': 'Вступает в силу', 'x-component': 'DatePicker'}},
    {'name': 'signed', 'type': 'boolean', 'interface': 'checkbox', 'uiSchema': {'type': 'boolean', 'title': 'Подписано', 'x-component': 'Checkbox'}},
    {'name': 'area_summary', 'type': 'text', 'interface': 'textarea', 'uiSchema': {'type': 'string', 'title': 'Изменения площадей', 'x-component': 'Input.TextArea'}},
]
for f in FIELDS:
    r = call('collections/contract_addendums/fields:create', f)
    print('field', f['name'], 'ok' if 'data' in r else r.get('body', r))
