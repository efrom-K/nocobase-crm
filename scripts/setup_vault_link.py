#!/usr/bin/env python3
"""Пункт меню «Пароли (Vaultwarden)» — ссылка на https://bw.invest.local в новой вкладке, видна только admin; стоит перед «Почтой».
Встроить Vaultwarden в страницу CRM нельзя: он отдаёт X-Frame-Options: SAMEORIGIN. Открывается только из офиса / VPN.
Повторный запуск безопасен.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 setup_vault_link.py
"""
import json, os, sys, urllib.parse, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')
TITLE, HREF = 'Пароли (Vaultwarden)', 'https://bw.invest.local'

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)
def q(x): return urllib.parse.quote(json.dumps(x))

found = call('desktopRoutes:list?paginate=false&filter=' + q({'title': TITLE, 'type': 'link'})).get('data')
if not found:
    print('route', ok(call('desktopRoutes:create', {'type': 'link', 'title': TITLE, 'icon': 'LockOutlined',
                                                   'options': {'href': HREF, 'openInNewWindow': True}})))
rid = call('desktopRoutes:list?paginate=false&filter=' + q({'title': TITLE, 'type': 'link'}))['data'][0]['id']
for role in [r['name'] for r in call('roles:list?paginate=false').get('data', []) if r['name'] not in ('admin', 'root')]:
    call('roles/%s/desktopRoutes:remove' % role, [rid])
print('menu admin', ok(call('roles/admin/desktopRoutes:add', [rid])))
# порядок: перед «Почтой» и «Мессенджером» — они всегда последние
top = call('desktopRoutes:list?paginate=false&sort=sort&filter=' + q({'parentId': None})).get('data', [])
tail = [r for r in top if r['title'] in ('Почта', 'Мессенджер')]
rest = [r for r in top if r not in tail and r['id'] != rid]
link = next(r for r in top if r['id'] == rid)
for i, r in enumerate(rest + [link] + sorted(tail, key=lambda r: r['title'] != 'Почта'), 1):
    if r.get('sort') != i: call('desktopRoutes:update?filterByTk=%s' % r['id'], {'sort': i})
print('menu order ok')
