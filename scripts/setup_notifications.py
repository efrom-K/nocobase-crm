#!/usr/bin/env python3
"""Настройка штатных уведомлений NocoBase (колокольчик): каналы, поле channel и два workflow.

Схема: интерфейс/скрипты пишут строку в «очередь» (contract_notifications / chat_notifications), а workflow
отправляет её через штатный менеджер уведомлений в нужный канал (in-app message). Так сотрудникам не нужны права
на messages:send (у ролей отделов их нет), а доставка идёт штатным путём, в том числе в реальном времени.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root/admin> python3 scripts/setup_notifications.py

Требуются включённые плагины notification-manager, notification-in-app-message и workflow (+ workflow-notification).
Скрипт идемпотентен для каналов и поля; workflow создаются заново (удалите старые вручную, если запускаете повторно).
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

CHANNELS = [
    ('deadlines', 'Сроки договоров', 'Окончание срока договоров аренды'),
    ('status', 'Статус договоров', 'Этапы оформления, завершение и перевод договоров'),
    ('assigned', 'Назначения', 'Вас добавили к договору'),
    ('contract_chat', 'Чат по договору', 'Новые сообщения в чате договора'),
    ('messenger', 'Личные сообщения', 'Личные и групповые чаты'),
]
for name, title, desc in CHANNELS:
    r = call('notificationChannels:create', {'name': name, 'title': title, 'description': desc, 'notificationType': 'in-app-message', 'options': {}})
    print('channel', name, 'ok' if 'data' in r else r.get('body', r))

r = call('collections/contract_notifications/fields:create', {'name': 'channel', 'type': 'string', 'interface': 'input',
         'uiSchema': {'type': 'string', 'title': 'Канал', 'x-component': 'Input'}})
print('field contract_notifications.channel', 'ok' if 'data' in r else r.get('body', r))

def workflow(title, collection, node_config):
    w = call('workflows:create', {'title': title, 'type': 'collection', 'enabled': False, 'sync': False,
                                   'config': {'collection': 'main:' + collection, 'mode': 1, 'appends': []}})
    wid = w['data']['id']
    n = call('workflows/%s/nodes:create' % wid, {'type': 'notification', 'title': 'Отправить в колокольчик', 'config': node_config, 'upstreamId': None})
    assert 'data' in n, n
    call('workflows:update?filterByTk=%s' % wid, {'enabled': True})
    print('workflow', wid, title, 'enabled')

# контракты: канал берётся из строки очереди, ссылка открывает карточку (?open=<forming|active|completed>:<id>)
workflow('Уведомления по договорам → колокольчик', 'contract_notifications', {
    'channelName': '{{$context.data.channel}}', 'title': '{{$context.data.title}}', 'content': '{{$context.data.text}}',
    'receivers': ['{{$context.data.user_id}}'],
    'options': {'url': '/admin/<registry-page-uid>?open={{$context.data.source}}:{{$context.data.contract_id}}'}, 'ignoreFail': True})
workflow('Личные сообщения → колокольчик', 'chat_notifications', {
    'channelName': 'messenger', 'title': '{{$context.data.title}}', 'content': '{{$context.data.text}}',
    'receivers': ['{{$context.data.user_id}}'],
    'options': {'url': '/admin/<messenger-page-uid>?openConv={{$context.data.conversation_id}}'}, 'ignoreFail': True})
