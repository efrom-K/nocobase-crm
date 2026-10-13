#!/usr/bin/env python3
"""Страница «Пароли» (/admin/vaultpage01, JS-блок vaultblock01 ← src/vault.js) — Vaultwarden внутри CRM через /vault/ на домене CRM.
Видна только admin; стоит перед «Почтой». Доступ к /vault/ режет Caddy (только роль admin NocoBase), см. src/vault.js.
Убирает старую ссылку «Пароли (Vaultwarden)». Повторный запуск безопасен.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_vault_page.py
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
def q(x): return urllib.parse.quote(json.dumps(x))

def psql(sql):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()

for old in call('desktopRoutes:list?paginate=false&filter=' + q({'title': 'Пароли (Vaultwarden)', 'type': 'link'})).get('data', []):
    print('old link removed', ok(call('desktopRoutes:destroy?filterByTk=%s' % old['id'], {})))
if not call('desktopRoutes:list?paginate=false&filter=' + q({'schemaUid': 'vaultpage01'})).get('data'):
    print('route', ok(call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Пароли', 'icon': 'LockOutlined', 'schemaUid': 'vaultpage01', 'menuSchemaUid': 'vaultmenu01',
                                                   'children': [{'type': 'tabs', 'schemaUid': 'vaulttabs01', 'hidden': True}]})))
ids = [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + q({'schemaUid': {'$in': ['vaultpage01', 'vaulttabs01']}}))['data']]
for role in [r['name'] for r in call('roles:list?paginate=false').get('data', []) if r['name'] not in ('admin', 'root')]:
    call('roles/%s/desktopRoutes:remove' % role, ids)
print('menu admin', ok(call('roles/admin/desktopRoutes:add', ids)))
# порядок: перед «Почтой» и «Мессенджером» — они всегда последние
top = call('desktopRoutes:list?paginate=false&sort=sort&filter=' + q({'parentId': None})).get('data', [])
tail = [r for r in top if r['title'] in ('Почта', 'Мессенджер')]
rest = [r for r in top if r not in tail and r.get('schemaUid') != 'vaultpage01']
page = next(r for r in top if r.get('schemaUid') == 'vaultpage01')
for i, r in enumerate(rest + [page] + sorted(tail, key=lambda r: r['title'] != 'Почта'), 1):
    if r.get('sort') != i: call('desktopRoutes:update?filterByTk=%s' % r['id'], {'sort': i})
print('menu order ok')

LAYOUT = {'rows': [{'id': 'vwrow1', 'cells': [{'id': 'vwrow1:cell:0', 'items': ['vaultblock01']}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': 'vaulttabs01', 'parentId': 'vaulttabs01', 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {'vwrow1': [['vaultblock01']]}, 'sizes': {'vwrow1': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': ['vwrow1'], 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': 'vaultgrid01', 'sortIndex': 0,
         'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
psql("""begin;
insert into "flowModels"(uid,name,options) values ('vaultgrid01','vaultgrid01','%s') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('vaultblock01','vaultblock01','%s') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('vaultgrid01','vaultgrid01',0,false,'grid',null),('vaulttabs01','vaultgrid01',1,false,null,null),
 ('vaultblock01','vaultblock01',0,false,'items',null),('vaultgrid01','vaultblock01',1,false,null,1),('vaulttabs01','vaultblock01',2,false,null,1)
 on conflict do nothing;
commit;""" % (json.dumps(grid, ensure_ascii=False), json.dumps(block, ensure_ascii=False)))
print('page models ok')
