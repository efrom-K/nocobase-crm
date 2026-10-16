#!/usr/bin/env python3
"""Единая страница «Главная» (/admin/dashpage01): один дашборд для всех, вкладки по ролям.

  - «Дашборд» → «Главная», вкладки включены: «Компания» (dashtabs01, блок dashblock001 ← src/dashboard.js) — admin,
    «Кадры» (hometabhr01, блок crmblock007 ← src/crm-hr.js) — admin, hr; «АХО» (hometabaho1, блок crmblock008 ← src/crm-aho.js) — admin, aho.
    NocoBase сам показывает роли только её вкладки.
  - Старые «Дашборд HR (тест)» / «Дашборд АХО (тест)» убраны из меню, но открываются: ссылки в уже отправленных уведомлениях работают.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_home_page.py
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

def route(uid):
    d = call('desktopRoutes:list?paginate=false&filter=' + urllib.parse.quote(json.dumps({'schemaUid': uid})))['data']
    return d[0] if d else None

def upd(uid, values):
    print('update', uid, ok(call('desktopRoutes:update?filterByTk=%s' % route(uid)['id'], values)))

page = route('dashpage01')
upd('dashpage01', {'title': 'Главная', 'icon': 'HomeOutlined', 'enableTabs': True})
upd('dashtabs01', {'title': 'Компания', 'hidden': False})
TABS = [('hometabhr01', 'Кадры', 'homegridhr1', 'crmblock007', ('hr',)), ('hometabaho1', 'АХО', 'homegridaho', 'crmblock008', ('aho',))]
for i, (tab, title, grid_uid, block_uid, roles) in enumerate(TABS):
    if not route(tab):
        print('tab', tab, ok(call('desktopRoutes:create', {'type': 'tabs', 'parentId': page['id'], 'schemaUid': tab, 'title': title, 'hidden': False, 'sort': i + 2})))
    rid = [route(tab)['id']]
    for role in ('admin',) + roles:
        print('menu', role, tab, ok(call('roles/%s/desktopRoutes:add' % role, [page['id']] + rid)))
    layout = {'rows': [{'id': grid_uid + 'r', 'cells': [{'id': grid_uid + 'r:cell:0', 'items': [block_uid]}], 'sizes': [24]}], 'version': 2}
    grid = {'use': 'BlockGridModel', 'parent': tab, 'parentId': tab, 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
            'props': {'rows': {grid_uid + 'r': [[block_uid]]}, 'sizes': {grid_uid + 'r': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': [grid_uid + 'r'], 'layout': layout},
            'stepParams': {'gridSettings': {'grid': {'layout': layout}}}}
    block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': grid_uid, 'sortIndex': 0,
             'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
    psql("""begin;
insert into "flowModels"(uid,name,options) values ('%(t)s','%(t)s','{"schema":{"use":"RouteModel"}}') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('%(g)s','%(g)s','%(grid)s') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('%(b)s','%(b)s','%(block)s') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('%(t)s','%(t)s',0,false,null,null),
 ('%(g)s','%(g)s',0,false,'grid',null),('%(t)s','%(g)s',1,false,null,null),
 ('%(b)s','%(b)s',0,false,'items',null),('%(g)s','%(b)s',1,false,null,1),('%(t)s','%(b)s',2,false,null,1)
 on conflict do nothing;
commit;""" % {'t': tab, 'g': grid_uid, 'b': block_uid, 'grid': json.dumps(grid, ensure_ascii=False), 'block': json.dumps(block, ensure_ascii=False)})
    print('models', tab, 'ok')
# роли с «новые пункты меню доступны сразу» получают и новые вкладки — убрать (у них нет «Главной», вкладки не для них)
tab_ids = [route(t[0])['id'] for t in TABS]
for role in ('accounting_dept', 'legal_dept', 'member', 'rental_dept', 'crm_test', 'mail_service'):
    print('hide tabs from', role, ok(call('roles/%s/desktopRoutes:remove' % role, tab_ids)))
# hr и aho видят «Главную» вместо своих старых пунктов меню; старые страницы остаются (скрыты из меню) для ссылок из уведомлений
for uid in ('hrdash01', 'ahodash01'):
    upd(uid, {'hideInMenu': True})
