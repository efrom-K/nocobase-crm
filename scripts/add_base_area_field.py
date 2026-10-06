#!/usr/bin/env python3
"""06.10.2026: основная площадь активного договора (rental_contracts.base_area_sqm). Текущая площадь (area_sqm) может
меняться периодом «Дополнительных расчётов аренды» со своими площадями; после периода договор возвращается к основной.
Заполняется текущей площадью у существующих договоров.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> NB_SSH=user@server python3 add_base_area_field.py
"""
import json, os, subprocess, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
req = urllib.request.Request(BASE + '/api/collections/rental_contracts/fields:create', method='POST',
      headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN},
      data=json.dumps({'name': 'base_area_sqm', 'type': 'double', 'interface': 'number',
                       'uiSchema': {'type': 'number', 'title': 'Основная площадь, кв.м.', 'x-component': 'InputNumber'}}).encode())
try:
    print('rental_contracts base_area_sqm', 'ok' if 'data' in json.load(urllib.request.urlopen(req)) else '?')
except urllib.error.HTTPError as e:
    print('error', e.code, e.read().decode()[:300])
sql = 'update rental_contracts set base_area_sqm = area_sqm where base_area_sqm is null and area_sqm is not null;'
cmd = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-c', sql]
if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH']] + [' '.join("'%s'" % c if ' ' in c else c for c in cmd)]
print(subprocess.run(cmd, capture_output=True, text=True).stdout.strip())
