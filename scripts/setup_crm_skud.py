#!/usr/bin/env python3
"""Тестовый контур CRM: приходы сотрудников по СКУД (раздел «Приходы» дашборда АХО).

Создаёт:
  - crm_skud_cards  — карты и люди из базы СКУД (номер карты, человек в СКУД, должность) + сопоставленный сотрудник CRM;
  - crm_skud_events — проходы: день, время, карта, вид (card — вход по карте, button — выход кнопкой); повтор не пишется (уникальный индекс);
  - app_settings skud_work_start (начало дня по умолчанию, если у сотрудника не заполнен «График работы»), skud_grace_min (допустимое опоздание),
    skud_synced_at / skud_last_event (заполняет scripts/skud_sync.py).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_skud.py
"""
import json, os, subprocess, sys, urllib.parse, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)

def psql(sql):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()

def F(name, typ, iface, title, comp='Input'):
    return {'name': name, 'type': typ, 'interface': iface, 'uiSchema': {'type': 'number' if typ in ('bigInt', 'integer', 'double') else 'string', 'title': title, 'x-component': comp}}
def S(name, title): return F(name, 'string', 'input', title)
def T(name, title): return F(name, 'text', 'textarea', title, 'Input.TextArea')
def I(name, title): return F(name, 'bigInt', 'integer', title, 'InputNumber')
def D(name, title): return F(name, 'dateOnly', 'date', title, 'DatePicker')
def B(name, title): return F(name, 'boolean', 'checkbox', title, 'Checkbox')

def collection(name, title, fields):
    print('collection', name, ok(call('collections:create', {'name': name, 'title': title, 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': fields})))

collection('crm_skud_cards', 'СКУД: карты', [S('card', 'Карта (как в журнале)'), I('skud_uid', 'Человек в СКУД (номер)'), S('skud_name', 'ФИО в СКУД'), S('skud_position', 'Должность в СКУД'),
                                             I('employee_id', 'Сотрудник CRM'), B('manual', 'Сопоставлен вручную'), B('ignore', 'Не учитывать (гостевая, служебная)'), T('note', 'Заметки')])
collection('crm_skud_events', 'СКУД: проходы', [D('day', 'День'), S('time', 'Время'), S('card', 'Карта'), S('kind', 'Вид')])   # card | button
psql("""create unique index if not exists crm_skud_events_uniq on crm_skud_events(day, time, kind, coalesce(card, ''));
create unique index if not exists crm_skud_cards_uniq on crm_skud_cards(card);
insert into app_settings(name, value) select x, y from (values ('skud_work_start', '09:00'), ('skud_grace_min', '10'), ('skud_synced_at', null), ('skud_last_event', null)) v(x, y)
  where not exists (select 1 from app_settings a where a.name = v.x);""")
print('indexes and settings ok')
