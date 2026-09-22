#!/usr/bin/env python3
"""Создаёт коллекцию draft_contracts (личные черновики) — схема как у forming_contracts
плюс created_by_id, минус contract_members (черновики строго личные, без сотрудников/чата).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 setup_draft_contracts.py
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

r = call('collections:create', {
    'name': 'draft_contracts',
    'title': 'Черновики договоров',
    'options': {'createdAt': True, 'createdBy': False, 'updatedAt': True, 'updatedBy': False}
})
print('collection draft_contracts', 'ok' if 'data' in r else r.get('body', r))

STRING_FIELDS = ['phone', 'tenant_fio', 'tenant_name', 'avito_url', 'cian_url', 'other_url', 'purpose',
                  'signing_method', 'inn', 'bank_account', 'bik', 'contract_number', 'object_name',
                  'actual_start_date', 'contract_scan_url', 'act_scan_url', 'bank_name', 'corr_account', 'email']
TEXT_FIELDS = ['comment_stage0', 'comment_stage2', 'notes', 'comment_stage4']
BOOL_FIELDS = ['deposit_invoiced', 'deposit_paid', 'rent_invoiced', 'rent_paid', 'utility_invoiced', 'utility_paid', 'is_quick']
DATE_FIELDS = ['end_date', 'date_signed', 'date_act']
DOUBLE_FIELDS = ['rent_amount', 'area_sqm', 'rent_per_sqm', 'utility_per_sqm', 'deposit_amount', 'utility_amount', 'total_amount']

for f in STRING_FIELDS:
    r = call('collections/draft_contracts/fields:create', {'name': f, 'type': 'string', 'interface': 'input',
             'uiSchema': {'type': 'string', 'title': f, 'x-component': 'Input'}})
    print('field', f, 'ok' if 'data' in r else r.get('body', r))

for f in TEXT_FIELDS:
    r = call('collections/draft_contracts/fields:create', {'name': f, 'type': 'text', 'interface': 'textarea',
             'uiSchema': {'type': 'string', 'title': f, 'x-component': 'Input.TextArea'}})
    print('field', f, 'ok' if 'data' in r else r.get('body', r))

for f in BOOL_FIELDS:
    r = call('collections/draft_contracts/fields:create', {'name': f, 'type': 'boolean', 'interface': 'checkbox',
             'uiSchema': {'type': 'boolean', 'title': f, 'x-component': 'Checkbox'}})
    print('field', f, 'ok' if 'data' in r else r.get('body', r))

for f in DATE_FIELDS:
    r = call('collections/draft_contracts/fields:create', {'name': f, 'type': 'dateOnly', 'interface': 'date',
             'uiSchema': {'type': 'string', 'title': f, 'x-component': 'DatePicker', 'x-component-props': {'dateFormat': 'DD.MM.YYYY', 'showTime': False}}})
    print('field', f, 'ok' if 'data' in r else r.get('body', r))

for f in DOUBLE_FIELDS:
    r = call('collections/draft_contracts/fields:create', {'name': f, 'type': 'double', 'interface': 'number',
             'uiSchema': {'type': 'number', 'title': f, 'x-component': 'InputNumber', 'x-component-props': {'stringMode': True, 'step': '1'}}})
    print('field', f, 'ok' if 'data' in r else r.get('body', r))

r = call('collections/draft_contracts/fields:create', {'name': 'current_stage', 'type': 'bigInt', 'interface': 'integer',
         'uiSchema': {'type': 'number', 'title': 'current_stage', 'x-component': 'InputNumber'}})
print('field current_stage', 'ok' if 'data' in r else r.get('body', r))

r = call('collections/draft_contracts/fields:create', {'name': 'created_by_id', 'type': 'bigInt', 'interface': 'integer',
         'uiSchema': {'type': 'number', 'title': 'Автор', 'x-component': 'InputNumber'}})
print('field created_by_id', 'ok' if 'data' in r else r.get('body', r))

r = call('collections/draft_contracts/fields:create', {'name': 'contract_files', 'type': 'belongsToMany', 'interface': 'attachment',
         'target': 'attachments', 'through': 'draftContractsAttachments',
         'uiSchema': {'type': 'array', 'title': 'Файлы', 'x-component': 'Upload.Attachment'}})
print('field contract_files', 'ok' if 'data' in r else r.get('body', r))
