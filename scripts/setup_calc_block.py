#!/usr/bin/env python3
"""Блок «Характеристики и расчёты» (09-24): поле «Комментарий» (calc_comment) у активных и архивных договоров
и названия полей без сокращений и скобок (они же — заголовки столбцов реестра).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 setup_calc_block.py
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

for coll in ('rental_contracts', 'completed_contracts'):
    r = {} if '--titles-only' in sys.argv else call('collections/%s/fields:create' % coll, {'name': 'calc_comment', 'type': 'text', 'interface': 'textarea',
             'uiSchema': {'type': 'string', 'title': 'Комментарий к расчётам', 'x-component': 'Input.TextArea'}})
    print(coll, 'calc_comment', 'ok' if 'data' in r else r.get('body', r))

TITLES = {
    'area_sqm': 'Площадь, квадратных метров',
    'rent_per_sqm': 'Арендная плата за 1 квадратный метр в месяц',
    'base_rent_per_sqm': 'Основная арендная плата за 1 квадратный метр в месяц',
    'rent_amount': 'Арендная плата в месяц',
    'base_rent_amount': 'Основная арендная плата в месяц',
    'utility_per_sqm': 'Эксплуатационный сбор за 1 квадратный метр в месяц',
    'utility_amount': 'Эксплуатационный сбор в месяц',
    'deposit_amount': 'Обеспечительный платёж',
    'corr_account': 'Корреспондентский счёт',
    'email': 'Электронная почта',
    'date_signed': 'Дата заключения договора',
    'date_act': 'Дата подписания акта приёма-передачи',
    'end_date': 'Дата окончания договора',
    'termination_date': 'Дата расторжения договора',
    'tenant_fio': 'Фамилия, имя, отчество по договору',
    'inn': 'Идентификационный номер налогоплательщика',
    'kpp': 'Код причины постановки на учёт',
    'ogrn': 'Основной государственный регистрационный номер',
    'bik': 'Банковский идентификационный код',
    'director': 'Фамилия, имя, отчество руководителя',
    'director_post': 'Должность руководителя',
    'tenant_type': 'Тип арендатора',
    'legal_address': 'Юридический адрес',
    'purpose': 'Назначение по договору',
    'contract_scan_url': 'Скан подписанного договора',
    'act_scan_url': 'Скан подписанного акта',
}
for coll in ('rental_contracts', 'forming_contracts', 'completed_contracts', 'draft_contracts'):
    for name, title in TITLES.items():
        g = call('collections/%s/fields:get?filterByTk=%s' % (coll, name))
        d = g.get('data')
        if not d: continue
        ui = dict(d.get('uiSchema') or {})
        if ui.get('title') == title: continue
        ui['title'] = title
        r = call('collections/%s/fields:update?filterByTk=%s' % (coll, name), {'uiSchema': ui})
        print(coll, name, '->', title, 'ok' if 'data' in r else r.get('body', r))
