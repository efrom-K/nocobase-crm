#!/usr/bin/env python3
"""25.09.2026: «Статус оплаты» убран совсем; у «Статуса договора» новые значения «Не хватает документов» (вручную)
и «На расторжении» (сам за 90 дней до даты расторжения, scripts/expiry_reminders.py); в активных и архиве — поля этапов
оформления, которые раньше терялись при переводе в «Активные» (комментарии этапов, ссылки, способ подписания, дата начала).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 status_and_forming_fields.py
Столбец «Статус оплаты» в таблице реестра удаляется отдельно (flowModels, см. историю коммита).
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

def ok(r): return 'ok' if 'error' not in r else r['body']

FIELDS = [('comment_stage0', 'text', 'textarea', 'Комментарий по заявке', 'Input.TextArea'),
          ('comment_stage2', 'text', 'textarea', 'Комментарий по условиям', 'Input.TextArea'),
          ('avito_url', 'string', 'input', 'Ссылка Авито', 'Input'),
          ('cian_url', 'string', 'input', 'Ссылка Циан', 'Input'),
          ('other_url', 'string', 'input', 'Ссылка ещё где-то', 'Input'),
          ('signing_method', 'string', 'input', 'Способ подписания', 'Input'),
          ('actual_start_date', 'string', 'input', 'Дата фактического начала аренды', 'Input')]   # в «Формирующихся» тоже строка
for coll in ('rental_contracts', 'completed_contracts'):
    for name, typ, iface, title, comp in FIELDS:
        print(coll, name, ok(call('collections/%s/fields:create' % coll, {'name': name, 'type': typ, 'interface': iface,
              'uiSchema': {'type': 'string', 'title': title, 'x-component': comp}})))

ENUM = [{'value': '1_problem', 'label': 'Проблема', 'color': 'red'},
        {'value': '2_attention', 'label': 'Требует внимания', 'color': 'gold'},
        {'value': '2_docs', 'label': 'Не хватает документов', 'color': 'blue'},
        {'value': '2_terminating', 'label': 'На расторжении', 'color': 'purple'},
        {'value': '3_ok', 'label': 'В порядке', 'color': 'green'}]
print('contract_status', ok(call('collections/rental_contracts/fields:update?filterByTk=contract_status',
      {'uiSchema': {'type': 'string', 'title': 'Статус договора', 'x-component': 'Select', 'enum': ENUM}})))
print('payment_status destroy', ok(call('collections/rental_contracts/fields:destroy?filterByTk=payment_status', {})))   # было только у активных
