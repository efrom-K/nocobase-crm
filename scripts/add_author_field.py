#!/usr/bin/env python3
"""Автор договора (кто его завёл): author_id в формирующихся / активных / архивных договорах.
У черновика автор — created_by_id; при публикации и переводах по разделам он переносится и сразу становится
сотрудником договора (в панели «Сотрудники по договору» — первым, с пометкой «автор»).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_author_field.py
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

for coll in ('forming_contracts', 'rental_contracts', 'completed_contracts'):
    r = call('collections/%s/fields:create' % coll, {'name': 'author_id', 'type': 'bigInt', 'interface': 'integer',
             'uiSchema': {'type': 'number', 'title': 'Автор', 'x-component': 'InputNumber'}})
    print(coll, 'author_id', 'ok' if 'data' in r else r.get('body', r))
