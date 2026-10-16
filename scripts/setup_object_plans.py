#!/usr/bin/env python3
"""«Объекты» → вкладка «Планы и помещения»: планы (этажи, корпуса) и помещения с ID, редактор — src/objects-plans.js.

Создаёт:
  - crm_floor_plans — план объекта: название (этаж / корпус), размер в метрах, подложка (скан чертежа: файл + прозрачность), «схема, не по чертежу»;
  - crm_rooms — помещение: ID (code, уникален в объекте; прежние ID — old_codes), название, площадь по документам, тип (rent | tech | common),
    назначение, отопление, договор (contract_id → rental_contracts, только ссылка: договоры не меняются), прямоугольник на плане x/y/w/h в метрах;
  - страницу «Заявки по объектам (тест)» → «Объекты» с вкладками «Заявки» и «Планы и помещения» (блок objplanblk01), вкладка — только admin;
  - права: править планы и помещения — только admin, остальные роли — просмотр.
С --seed: объектам без планов рисует начальную схему из действующих договоров (по помещению на договор или на строку площадей),
площадь — из договора, форма и расположение условные (план помечен «схема, не по чертежу»). Объекты без договоров — пустой план.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_object_plans.py [--seed]
"""
import json, math, os, subprocess, sys, urllib.parse, urllib.request, urllib.error

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
def rows(path): return call(path).get('data') or []

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
def N(name, title): return F(name, 'double', 'number', title, 'InputNumber')
def J(name, title): return {'name': name, 'type': 'json', 'interface': 'json', 'uiSchema': {'type': 'object', 'title': title, 'x-component': 'Input.JSON'}}
def B(name, title): return F(name, 'boolean', 'checkbox', title, 'Checkbox')

def collection(name, title, fields):
    print('collection', name, ok(call('collections:create', {'name': name, 'title': title, 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': fields})))

collection('crm_floor_plans', 'Объекты: планы', [I('object_id', 'Объект'), S('title', 'План (этаж, корпус)'), F('sort', 'integer', 'integer', 'Порядок', 'InputNumber'),
                                               N('width_m', 'Ширина, м'), N('height_m', 'Высота, м'), S('bg_url', 'Подложка (файл)'), I('bg_file_id', 'Подложка: id файла'),
                                               N('bg_opacity', 'Подложка: прозрачность'), B('schematic', 'Схема, не по чертежу'), T('note', 'Заметки')])
collection('crm_rooms', 'Объекты: помещения', [I('object_id', 'Объект'), I('plan_id', 'План'), S('code', 'ID помещения'), S('title', 'Название'),
                                             N('area_sqm', 'Площадь по документам, м²'), S('kind', 'Тип'),   # rent | tech | common
                                             S('purpose', 'Назначение'), S('heating', 'Отопление'), I('contract_id', 'Договор (rental_contracts)'),
                                             N('x', 'X, м'), N('y', 'Y, м'), N('w', 'Ширина, м'), N('h', 'Глубина, м'), J('old_codes', 'Прежние ID'), T('note', 'Заметки')])
psql('create unique index if not exists crm_rooms_object_code on crm_rooms (object_id, code);')

# права: роли с глобальной стратегией «создавать/менять» — здесь только просмотр
for role in ('rental_dept', 'legal_dept', 'accounting_dept', 'member', 'crm_test', 'hr', 'aho'):
    for c in ('crm_floor_plans', 'crm_rooms'):
        print('view-only', role, c, ok(call('roles/%s/resources:create' % role, {'name': c, 'usingActionsConfig': True, 'actions': [{'name': 'view'}]})))

# --- страница «Объекты»: бывшая «Заявки по объектам (тест)», вкладки «Заявки» и «Планы и помещения»
def route(uid):
    d = rows('desktopRoutes:list?paginate=false&filter=' + urllib.parse.quote(json.dumps({'schemaUid': uid})))
    return d[0] if d else None
def upd(uid, values): print('update', uid, ok(call('desktopRoutes:update?filterByTk=%s' % route(uid)['id'], values)))
PAGE, REQ_TAB, TAB, GRID, BLOCK = 'j3a32zo1jzo', 'yvsy7xrnfii', 'objplantab1', 'objplangrid1', 'objplanblk01'
upd(PAGE, {'title': 'Объекты', 'icon': 'BankOutlined', 'enableTabs': True})
upd(REQ_TAB, {'title': 'Заявки', 'hidden': False})
if not route(TAB):
    print('tab', ok(call('desktopRoutes:create', {'type': 'tabs', 'parentId': route(PAGE)['id'], 'schemaUid': TAB, 'title': 'Планы и помещения', 'hidden': False, 'sort': 2})))
tab_id = route(TAB)['id']
print('menu admin', ok(call('roles/admin/desktopRoutes:add', [tab_id])))
for role in ('accounting_dept', 'legal_dept', 'member', 'rental_dept', 'crm_test', 'mail_service', 'hr', 'aho'):   # «новые пункты меню сразу» — убрать
    print('hide tab from', role, ok(call('roles/%s/desktopRoutes:remove' % role, [tab_id])))
layout = {'rows': [{'id': GRID + 'r', 'cells': [{'id': GRID + 'r:cell:0', 'items': [BLOCK]}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': TAB, 'parentId': TAB, 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {GRID + 'r': [[BLOCK]]}, 'sizes': {GRID + 'r': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': [GRID + 'r'], 'layout': layout},
        'stepParams': {'gridSettings': {'grid': {'layout': layout}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': GRID, 'sortIndex': 0,
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
commit;""" % {'t': TAB, 'g': GRID, 'b': BLOCK, 'grid': json.dumps(grid, ensure_ascii=False), 'block': json.dumps(block, ensure_ascii=False)})
print('page models ok')

# --- начальная схема из договоров
def pack(items):
    """Полки: ряд начинается с самого большого помещения (квадрат), остальные в ряду — той же глубины. Площадь в м² = площадь на плане,
    кроме совсем маленьких (ширина не меньше 2 м). ponytail: простая укладка полками; правится руками в редакторе."""
    total = sum(a for a, _ in items)
    W = max(30.0, round(math.sqrt(total * 1.6)))
    x = y = rowh = 0.0
    out = []
    for a, it in sorted(items, key=lambda t: -t[0]):
        if rowh == 0: rowh = max(4.0, round(math.sqrt(a), 1))
        w = max(2.0, round(a / rowh, 1))
        if x > 0 and x + w > W:
            y, x = y + rowh, 0.0
            rowh = max(4.0, round(math.sqrt(a), 1)); w = max(2.0, round(a / rowh, 1))
        if w > W: W = w
        out.append((x, y, w, rowh, a, it)); x += w
    H = y + rowh
    out.sort(key=lambda r: (r[1], r[0]))
    return out, W, max(H, 10.0)

if '--seed' in sys.argv:
    objs = rows('contract_objects:list?paginate=false&sort=id')
    have = {p['object_id'] for p in rows('crm_floor_plans:list?paginate=false')}
    cons = rows('rental_contracts:list?paginate=false&fields=id,object_name,contract_number,tenant_name,area_sqm,area_lines,purpose')
    for o in objs:
        if o['id'] in have: continue
        items = []
        for c in [c for c in cons if (c.get('object_name') or '').strip() == o['name'].strip()]:
            lines = [l for l in (c.get('area_lines') or []) if l and l.get('area')]
            for k, a in enumerate([l['area'] for l in lines] if len(lines) > 1 else [c.get('area_sqm')]):
                if a: items.append((float(a), (c, k if len(lines) > 1 else None)))
        packed, W, H = pack(items) if items else ([], 60.0, 40.0)
        p = call('crm_floor_plans:create', {'object_id': o['id'], 'title': 'Схема', 'sort': 1, 'width_m': W, 'height_m': H, 'bg_opacity': 0.6, 'schematic': True,
                                            'note': 'Начальная схема из договоров: площади настоящие, расположение и форма — условные. Загрузите чертёж подложкой и расставьте помещения.' if items else ''})
        pid = p['data']['id']
        for n, (x, y, w, h, a, (c, k)) in enumerate(packed, 1):
            r = call('crm_rooms:create', {'object_id': o['id'], 'plan_id': pid, 'code': 'П-%02d' % n, 'title': c.get('tenant_name') or '',
                                          'area_sqm': a, 'kind': 'rent', 'purpose': c.get('purpose') or '', 'contract_id': c['id'],
                                          'x': round(x, 1), 'y': round(y, 1), 'w': w, 'h': h, 'old_codes': [],
                                          'note': ('Часть %d договора (строка площадей)' % (k + 1)) if k is not None else ''})
            if 'data' not in r: print('room', o['name'], n, ok(r))
        print('seed', o['name'], len(packed), 'помещений, план %.0f×%.0f м' % (W, H))
