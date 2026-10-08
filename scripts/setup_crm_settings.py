#!/usr/bin/env python3
"""«Настройки CRM» — всё, что администратор меняет сам, без программиста и без изменения интерфейса модулей.

Создаёт:
  - коллекцию crm_config (key → value JSON): изменённые справочники и параметры модулей; значения по умолчанию — в src/_crm-config.js;
  - права: читать crm_config могут все роли (модулям нужны настройки), менять — только admin и root;
  - страницу меню «Настройки CRM» (/admin/crmcfg01, JS-блок crmblock006 ← src/crm-settings.js), видна только admin; стоит перед «Почтой».
Повторный запуск безопасен.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_settings.py
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

# 1. коллекция настроек
if not call('collections:get?filterByTk=crm_config').get('data'):
    print('collection crm_config', ok(call('collections:create', {'name': 'crm_config', 'title': 'Настройки CRM', 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': [
        {'name': 'key', 'type': 'string', 'interface': 'input', 'unique': True, 'uiSchema': {'type': 'string', 'title': 'Ключ', 'x-component': 'Input'}},
        {'name': 'value', 'type': 'json', 'interface': 'json', 'uiSchema': {'type': 'object', 'title': 'Значение', 'x-component': 'Input.JSON'}},
        {'name': 'updated_by', 'type': 'string', 'interface': 'input', 'uiSchema': {'type': 'string', 'title': 'Кто изменил', 'x-component': 'Input'}},
    ]})))

# 2. права: все читают, меняют только администраторы
for role in [r['name'] for r in call('roles:list?paginate=false').get('data', []) if r['name'] not in ('admin', 'root')]:
    have = {r['name']: r for r in call('roles/%s/resources:list?paginate=false' % role).get('data', [])}
    body = {'name': 'crm_config', 'usingActionsConfig': True, 'actions': [{'name': 'view', 'fields': ['id', 'key', 'value']}]}
    r = call('roles/%s/resources:update?filterByTk=%s' % (role, have['crm_config']['id']), body) if 'crm_config' in have else call('roles/%s/resources:create' % role, body)
    print('acl', role, ok(r))

# 3. страница «Настройки CRM» — только admin
if not call('desktopRoutes:list?paginate=false&filter=' + q({'schemaUid': 'crmcfg01'})).get('data'):
    print('route', ok(call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Настройки CRM', 'icon': 'SettingOutlined', 'schemaUid': 'crmcfg01', 'menuSchemaUid': 'crmcfgmenu01',
                                                   'children': [{'type': 'tabs', 'schemaUid': 'crmcfgtabs01', 'hidden': True}]})))
ids = [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + q({'schemaUid': {'$in': ['crmcfg01', 'crmcfgtabs01']}}))['data']]
for role in [r['name'] for r in call('roles:list?paginate=false').get('data', []) if r['name'] not in ('admin', 'root')]:
    call('roles/%s/desktopRoutes:remove' % role, ids)
print('menu admin', ok(call('roles/admin/desktopRoutes:add', ids)))
# порядок: перед «Почтой» и «Мессенджером» — они всегда последние (move insertBefore не сработал — ставим sort явно)
top = call('desktopRoutes:list?paginate=false&sort=sort&filter=' + q({'parentId': None})).get('data', [])
tail = [r for r in top if r['title'] in ('Почта', 'Мессенджер')]
rest = [r for r in top if r not in tail and r.get('schemaUid') != 'crmcfg01']
page = next(r for r in top if r.get('schemaUid') == 'crmcfg01')
for i, r in enumerate(rest + [page] + sorted(tail, key=lambda r: r['title'] != 'Почта'), 1):
    if r.get('sort') != i: call('desktopRoutes:update?filterByTk=%s' % r['id'], {'sort': i})
print('menu order ok')

LAYOUT = {'rows': [{'id': 'cfgrow1', 'cells': [{'id': 'cfgrow1:cell:0', 'items': ['crmblock006']}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': 'crmcfgtabs01', 'parentId': 'crmcfgtabs01', 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {'cfgrow1': [['crmblock006']]}, 'sizes': {'cfgrow1': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': ['cfgrow1'], 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': 'cfggrid001', 'sortIndex': 0,
         'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
psql("""begin;
insert into "flowModels"(uid,name,options) values ('cfggrid001','cfggrid001','%s') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('crmblock006','crmblock006','%s') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('cfggrid001','cfggrid001',0,false,'grid',null),('crmcfgtabs01','cfggrid001',1,false,null,null),
 ('crmblock006','crmblock006',0,false,'items',null),('cfggrid001','crmblock006',1,false,null,1),('crmcfgtabs01','crmblock006',2,false,null,1)
 on conflict do nothing;
commit;""" % (json.dumps(grid, ensure_ascii=False), json.dumps(block, ensure_ascii=False)))
print('page models ok')
