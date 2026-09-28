#!/usr/bin/env python3
"""28.09.2026: «Дата заключения» дополнительного соглашения (contract_addendums.date_signed, только дата).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_addendum_date_field.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
req = urllib.request.Request(BASE + '/api/collections/contract_addendums/fields:create', method='POST',
      headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN},
      data=json.dumps({'name': 'date_signed', 'type': 'dateOnly', 'interface': 'date',
                       'uiSchema': {'type': 'string', 'title': 'Дата заключения', 'x-component': 'DatePicker'}}).encode())
try:
    print('contract_addendums date_signed', 'ok' if 'data' in json.load(urllib.request.urlopen(req)) else '?')
except urllib.error.HTTPError as e:
    print('error', e.code, e.read().decode()[:300])
