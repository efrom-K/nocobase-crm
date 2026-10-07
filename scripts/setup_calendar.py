#!/usr/bin/env python3
"""Календарь сроков (src/calendar.js): JS-блок на каждой странице-дашборде.

Блок сам ничего не показывает — рисует календарь в слот <div data-crm-calendar>, который модуль оставляет на главном экране.
Скрипт добавляет в сетку каждой страницы второй ряд с блоком calblockNN (заглушка); код блока выкладывает nb_deploy
по deploy/blocks.json. Повторный запуск ничего не дублирует.

    NB_SSH=user@server python3 setup_calendar.py
"""
import json, os, subprocess, sys

PAGES = [   # (вкладка страницы, сетка, блок)
    ('dashtabs01', 'dashgrid0001', 'calblock01'),   # «Дашборд»
    ('hrdtabs01', 'hrdgrid001', 'calblock02'),      # «Дашборд HR (тест)»
    ('ahotabs01', 'ahogrid001', 'calblock03'),      # «Дашборд АХО (тест)»
]

def psql(sql):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()

def lit(v): return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'"

for tabs, grid, blk in PAGES:
    g = json.loads(psql("select options from \"flowModels\" where uid = '%s';" % grid))
    row = blk.replace('block', 'row')
    if row not in g['props']['rows']:
        g['props']['rows'][row] = [[blk]]
        g['props']['sizes'][row] = [24]
        g['props']['rowOrder'].append(row)
        cell = {'id': row, 'cells': [{'id': row + ':cell:0', 'items': [blk]}], 'sizes': [24]}
        g['props']['layout']['rows'].append(cell)
        g['stepParams']['gridSettings']['grid']['layout'] = g['props']['layout']
    block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': grid, 'sortIndex': 1,
             'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("");'}}}}
    psql("""begin;
update "flowModels" set options = %s::json where uid = '%s';
insert into "flowModels"(uid,name,options) values ('%s','%s',%s) on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('%s','%s',0,false,'items',null),('%s','%s',1,false,null,2),('%s','%s',2,false,null,2)
 on conflict do nothing;
commit;""" % (lit(g), grid, blk, blk, lit(block), blk, blk, grid, blk, tabs, blk))
    print(blk, 'ok')
