#!/usr/bin/env python3
"""Русификация интерфейса NocoBase, часть 1: данные (названия полей, роли, служебные коллекции, страница).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен> python3 scripts/localize_ru.py

Часть 2 — подписи плагинов (описания в package.json и недостающие ключи ru-RU.json) — scripts/ru/patch_plugins_ru.js,
запускается внутри контейнера:  docker cp scripts/ru/. nocobase-app-1:/tmp/ru/ && docker exec nocobase-app-1 node /tmp/ru/patch_plugins_ru.js /tmp/ru/ru_dict.json
и затем docker restart. После обновления образа NocoBase часть 2 нужно прогнать заново.
Язык системы: systemSettings.enabledLanguages = ["ru-RU"] (ТОЛЬКО русский: иначе сохранённый в браузере en-US перебивает системный язык), appLang = "ru-RU".
"""
import json, os, re, sys, urllib.request, urllib.error
BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN},
                                 method='POST' if body is not None else 'GET')
    try: return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e: return {'error': e.code, 'body': e.read().decode()[:300]}

FIELD_TITLES = {
 'contract_number': 'Номер договора', 'date_signed': 'Дата заключения', 'date_act': 'Дата акта', 'object_name': 'Объект', 'tenant_name': 'Арендатор',
 'area_sqm': 'Площадь, кв.м.', 'email': 'Эл. почта', 'phone': 'Телефон', 'tenant_fio': 'Контактное лицо', 'contact_person': 'Контактное лицо',
 'end_date': 'Окончание (дата)', 'termination_date': 'Расторжение (дата)', 'purpose': 'Назначение по договору', 'rooms_list': 'Список комнат',
 'room_ids': 'ID комнат', 'rent_per_sqm': 'Аренда за 1 кв.м.', 'utility_per_sqm': 'Эксплуатационный сбор за 1 кв.м.',
 'deposit_amount': 'Обеспечительный платёж', 'rent_amount': 'Арендная плата', 'utility_amount': 'Эксплуатационный сбор',
 'inn': 'ИНН', 'bank_account': 'Расчётный счёт', 'bik': 'БИК', 'bank_name': 'Банк', 'corr_account': 'Корр. счёт',
 'contract_scan_url': 'Скан договора', 'act_scan_url': 'Скан акта', 'notes': 'Примечания',
 'contract_ref_id': 'ID договора', 'contract_type': 'Тип договора', 'author_id': 'ID автора', 'file_id': 'ID файла',
 'user_id': 'Получатель', 'contract_id': 'ID договора', 'title': 'Заголовок', 'text': 'Текст', 'is_read': 'Прочитано', 'created_at': 'Создано', 'source': 'Источник',
}
COLLECTIONS = ['rental_contracts', 'forming_contracts', 'completed_contracts', 'contract_addendums', 'contract_contacts', 'contract_history', 'contract_notifications']
for c in COLLECTIONS:
    for f in call('collections/%s/fields:list?paginate=false' % c).get('data', []):
        ui = f.get('uiSchema') or {}
        title = ui.get('title')
        new = FIELD_TITLES.get(f['name'])
        if title and re.match(r'^[A-Za-z]', title) and new and title != new:
            call('collections/%s/fields:update?filterByTk=%s' % (c, f['name']), {'uiSchema': dict(ui, title=new)})
for name, title in (('root', 'Суперадмин'), ('admin', 'Администратор'), ('member', 'Участник')):
    call('roles:update?filterByTk=%s' % name, {'title': title})
call('app:clearCache', {})
print('done')
