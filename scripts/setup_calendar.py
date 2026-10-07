#!/usr/bin/env python3
"""Страница меню «Календарь (тест)» (/admin/calpage01, JS-блок calpageblk1 ← src/calendar.js).

Ставит страницу перед «Почтой» и «Мессенджером» (последние две всегда они), видна тем же ролям, что «Задачи (тест)».
Заодно убирает блоки calblock01..03 с дашбордов (первая версия календаря жила там). Повторный запуск ничего не дублирует.
Код блока выкладывает nb_deploy по deploy/blocks.json.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_calendar.py
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

def lit(v): return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'"

def route_ids(filt):
    return [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + urllib.parse.quote(json.dumps(filt)))['data']]

# --- 1. первая версия: блоки календаря на дашбордах — убрать
for grid, blk in (('dashgrid0001', 'calblock01'), ('hrdgrid001', 'calblock02'), ('ahogrid001', 'calblock03')):
    g = json.loads(psql("select options from \"flowModels\" where uid = '%s';" % grid))
    row = blk.replace('block', 'row')
    if row in g['props']['rows']:
        del g['props']['rows'][row]; g['props']['sizes'].pop(row, None)
        g['props']['rowOrder'] = [r for r in g['props']['rowOrder'] if r != row]
        g['props']['layout']['rows'] = [r for r in g['props']['layout']['rows'] if r['id'] != row]
        g['stepParams']['gridSettings']['grid']['layout'] = g['props']['layout']
    psql("""begin;
update "flowModels" set options = %s::json where uid = '%s';
delete from "flowModelTreePath" where descendant = '%s' or ancestor = '%s';
delete from "flowModels" where uid = '%s';
commit;""" % (lit(g), grid, blk, blk, blk))
print('dashboard blocks removed')

# --- 2. страница меню: маршрут через API (кэш ролей), сетка и JS-блок — строками flowModels
if not route_ids({'schemaUid': 'calpage01'}):
    print('route', ok(call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Календарь (тест)', 'icon': 'CalendarOutlined', 'schemaUid': 'calpage01', 'menuSchemaUid': 'calmenu01',
                                                   'children': [{'type': 'tabs', 'schemaUid': 'caltabs01', 'hidden': True}]})))
page = route_ids({'schemaUid': {'$in': ['calpage01', 'caltabs01']}})
# видна тем же, кто видит «Задачи (тест)»: create даёт страницу всем ролям — лишним убираем
tasks_id = route_ids({'schemaUid': 'tskpage01'})[0]
for role in [r['name'] for r in call('roles:list?paginate=false')['data']]:
    has_tasks = tasks_id in [x['id'] for x in call('roles/%s/desktopRoutes:list?paginate=false' % role).get('data', [])]
    print('role', role, ok(call('roles/%s/desktopRoutes:%s' % (role, 'add' if has_tasks else 'remove'), page)))
# порядок: … → Календарь → Почта → Мессенджер
for uid, sort in (('calpage01', 9), ('mailpage01', 10), ('msgspage01', 11)):
    print('sort', uid, ok(call('desktopRoutes:update?filter=' + urllib.parse.quote(json.dumps({'schemaUid': uid})), {'sort': sort})))

LAYOUT = {'rows': [{'id': 'calrow1', 'cells': [{'id': 'calrow1:cell:0', 'items': ['calpageblk1']}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': 'caltabs01', 'parentId': 'caltabs01', 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {'calrow1': [['calpageblk1']]}, 'sizes': {'calrow1': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': ['calrow1'], 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': 'calgrid001', 'sortIndex': 0,
         'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
psql("""begin;
insert into "flowModels"(uid,name,options) values ('calgrid001','calgrid001',%s) on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('calpageblk1','calpageblk1',%s) on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('calgrid001','calgrid001',0,false,'grid',null),('caltabs01','calgrid001',1,false,null,null),
 ('calpageblk1','calpageblk1',0,false,'items',null),('calgrid001','calpageblk1',1,false,null,1),('caltabs01','calpageblk1',2,false,null,1)
 on conflict do nothing;
commit;""" % (lit(grid), lit(block)))
print('page models ok')
