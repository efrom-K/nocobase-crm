#!/usr/bin/env python3
"""Уведомления о новых письмах в колокольчик NocoBase (канал «Почта»).

Схема та же, что у договоров: почтовый сервис (mail-service/) кладёт строку в очередь mail_notifications,
а workflow отправляет её штатным менеджером уведомлений (в реальном времени, со ссылкой на письмо).
Сервис пишет в очередь по API-ключу отдельной роли mail_service — у неё есть только право создавать строки очереди.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 setup_mail_notifications.py
Печатает API-ключ сервиса — положить в .env сервиса как NB_API_KEY (ключ показывается один раз).
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
MAIL_PAGE = os.environ.get('NB_MAIL_PAGE', 'mailpage01')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)

print('channel mail', ok(call('notificationChannels:create', {'name': 'mail', 'title': 'Почта', 'description': 'Новые письма в почтовом ящике',
                                                              'notificationType': 'in-app-message', 'options': {}})))
print('collection mail_notifications', ok(call('collections:create', {
    'name': 'mail_notifications', 'title': 'Очередь уведомлений о письмах', 'autoGenId': True, 'createdAt': True, 'updatedAt': False,
    'fields': [
        {'name': 'user_id', 'type': 'bigInt', 'interface': 'integer', 'uiSchema': {'type': 'number', 'title': 'Пользователь', 'x-component': 'InputNumber'}},
        {'name': 'title', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Заголовок', 'x-component': 'Input'}},
        {'name': 'text', 'type': 'text', 'interface': 'textarea', 'uiSchema': {'type': 'string', 'title': 'Текст', 'x-component': 'Input.TextArea'}},
        {'name': 'url', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Ссылка', 'x-component': 'Input'}},
    ]})))

w = call('workflows:create', {'title': 'Новые письма → колокольчик', 'type': 'collection', 'enabled': False, 'sync': False,
                               'config': {'collection': 'main:mail_notifications', 'mode': 1, 'appends': []}})
wid = w['data']['id']
n = call('workflows/%s/nodes:create' % wid, {'type': 'notification', 'title': 'Отправить в колокольчик', 'upstreamId': None, 'config': {
    'channelName': 'mail', 'title': '{{$context.data.title}}', 'content': '{{$context.data.text}}',
    'receivers': ['{{$context.data.user_id}}'], 'options': {'url': '{{$context.data.url}}'}, 'ignoreFail': True}})
assert 'data' in n, n
call('workflows:update?filterByTk=%s' % wid, {'enabled': True})
print('workflow', wid, 'enabled')

# роль сервиса: только создавать строки очереди
print('role mail_service', ok(call('roles:create', {'name': 'mail_service', 'title': 'Почтовый сервис', 'hidden': True, 'allowConfigure': False,
                                                     'strategy': {'actions': []}, 'snippets': []})))
print('role resource', ok(call('roles/mail_service/resources:create', {'name': 'mail_notifications', 'usingActionsConfig': True,
                                                                      'actions': [{'name': 'create'}]})))
me = call('auth:check')['data']
print('role to current user', call('users/%s/roles:add' % me['id'], ['mail_service']))
k = call('apiKeys:create', {'name': 'mail-service', 'role': {'name': 'mail_service'}, 'expiresIn': 'never'})
if 'data' not in k: sys.exit('apiKeys:create failed: %s' % k)
print('NB_API_KEY=' + k['data']['token'])
