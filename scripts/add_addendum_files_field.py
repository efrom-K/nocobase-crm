#!/usr/bin/env python3
"""06.10.2026: несколько файлов у одного дополнительного соглашения — поле contract_addendums.files (многие-ко-многим
с attachments через contract_addendum_files). Старое одиночное поле file_id больше не пишется; его файлы переносятся
в files отдельным SQL (db/migrations/003_addendum_files.sql).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 add_addendum_files_field.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
req = urllib.request.Request(BASE + '/api/collections/contract_addendums/fields:create', method='POST',
      headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN},
      data=json.dumps({'name': 'files', 'type': 'belongsToMany', 'interface': 'attachment', 'target': 'attachments',
                       'through': 'contract_addendum_files', 'foreignKey': 'addendum_id', 'otherKey': 'attachment_id',
                       'sourceKey': 'id', 'targetKey': 'id',
                       'uiSchema': {'type': 'array', 'title': 'Файлы', 'x-component': 'Upload.Attachment',
                                    'x-component-props': {'multiple': True}}}).encode())
try:
    print('contract_addendums files', 'ok' if 'data' in json.load(urllib.request.urlopen(req)) else '?')
except urllib.error.HTTPError as e:
    print('error', e.code, e.read().decode()[:300])
