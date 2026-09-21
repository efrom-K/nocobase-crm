#!/usr/bin/env python3
"""Столбцы таблиц реестра: добавляет «Сумму договора» и запасные столбцы (по умолчанию скрыты, включаются в «⚙ Столбцы»),
выставляет типы отображения (даты ДД.ММ.ГГГГ, числа 1.561,80) и порядок. Прямые запросы к БД NocoBase.

    python3 scripts/setup_registry_columns.py              # docker exec на этой машине
    NB_SSH=user@server python3 scripts/setup_registry_columns.py   # через ssh (нужен sudo docker без пароля)
Идемпотентен для порядка и форматов; новые столбцы создаются только если их ещё нет в таблице.
"""
import json, os, secrets, string, subprocess, sys

# --- часть 1: добавление столбцов и порядок
def psql(sql, tuples=True):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def uid():
    return ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(11))
TABLES = [('ozazmpm4o4v','rental_contracts'),('formtbl000001','forming_contracts'),('ipb7gfluldk','completed_contracts')]
ORDER = ['contract_number','date_signed','date_act','object_name','tenant_name','area_sqm','total_amount','email','phone','tenant_fio','end_date','rent_amount','deposit_amount','inn']
NEW = ['total_amount','end_date','rent_amount','deposit_amount','inn']
HIDDEN_DEFAULT = {'end_date','rent_amount','deposit_amount','inn'}
DATES = {'date_signed','date_act','end_date'}
NUMS = {'area_sqm','total_amount','rent_amount','deposit_amount'}
def model_for(f): return 'DisplayDateTimeFieldModel' if f in DATES else ('DisplayNumberFieldModel' if f in NUMS else 'DisplayTextFieldModel')
def q(s): return "'" + str(s).replace("'", "''") + "'"
stmts = ['begin;']
for table_uid, coll in TABLES:
    rows = json.loads(psql("select coalesce(json_agg(json_build_object('uid', f.uid, 'fp', f.options::json#>>'{stepParams,fieldSettings,init,fieldPath}')), '[]'::json) from \"flowModels\" f where f.options::json->>'parentId'=%s and f.options::json->>'subKey'='columns'" % q(table_uid)))
    have = {r['fp']: r['uid'] for r in rows}
    grid, tabs = '9r8030mskby', 'n3u0ryxmh0a'
    for i, fp in enumerate(ORDER):
        if fp in have:
            cu = have[fp]
            stmts.append("update \"flowModels\" set options = jsonb_set(options::jsonb, '{sortIndex}', %d::text::jsonb)::json where uid=%s;" % (i, q(cu)))
            # тип отображения у существующих столбцов
            stmts.append("update \"flowModels\" set options = jsonb_set(options::jsonb, '{use}', %s::jsonb)::json where options::json->>'parentId'=%s and options::json->>'subKey'='field';" % (q(json.dumps(model_for(fp))), q(cu)))
        else:
            cu, fu = uid(), uid()
            col = {'use':'TableColumnModel','parentId':table_uid,'subKey':'columns','subType':'array','sortIndex':i,'props':{'sorter':True},
                   'stepParams':{'fieldSettings':{'init':{'dataSourceKey':'main','collectionName':coll,'fieldPath':fp}},'tableColumnSettings':{'sorter':{'sorter':True}}}}
            if fp in HIDDEN_DEFAULT: col['hidden'] = True
            fld = {'use':model_for(fp),'parentId':cu,'subKey':'field','subType':'object','sortIndex':0,'props':{},'stepParams':{}}
            stmts.append("insert into \"flowModels\"(uid,name,options) values (%s,%s,%s::json);" % (q(cu), q(cu), q(json.dumps(col))))
            stmts.append("insert into \"flowModels\"(uid,name,options) values (%s,%s,%s::json);" % (q(fu), q(fu), q(json.dumps(fld))))
            for anc, dep, typ, srt in ((cu,0,'columns',None),(table_uid,1,None,1),(grid,2,None,1),(tabs,3,None,1)):
                stmts.append("insert into \"flowModelTreePath\"(ancestor,descendant,depth,async,type,sort) values (%s,%s,%d,false,%s,%s);" % (q(anc), q(cu), dep, q(typ) if typ else 'NULL', srt if srt else 'NULL'))
            for anc, dep, typ, srt in ((fu,0,'field',None),(cu,1,None,1),(table_uid,2,None,1),(grid,3,None,1),(tabs,4,None,1)):
                stmts.append("insert into \"flowModelTreePath\"(ancestor,descendant,depth,async,type,sort) values (%s,%s,%d,false,%s,%s);" % (q(anc), q(fu), dep, q(typ) if typ else 'NULL', srt if srt else 'NULL'))
stmts.append('commit;')
psql('\n'.join(stmts))
print('columns configured for', [t[1] for t in TABLES])

# --- часть 2: форматы отображения и порядок на сервере
def psql(sql, tuples=True):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def q(s): return "'" + str(s).replace("'", "''") + "'"
TABLES = ['ozazmpm4o4v','formtbl000001','ipb7gfluldk']
ORDER = ['contract_number','date_signed','date_act','object_name','tenant_name','area_sqm','total_amount','email','phone','tenant_fio','end_date','rent_amount','deposit_amount','inn']
MONEY = {'total_amount','rent_amount','deposit_amount'}
AREA = {'area_sqm'}
stmts = ['begin;']
for t in TABLES:
    rows = json.loads(psql("select json_agg(json_build_object('uid', f.uid, 'fp', f.options::json#>>'{stepParams,fieldSettings,init,fieldPath}')) from \"flowModels\" f where f.options::json->>'parentId'=%s and f.options::json->>'subKey'='columns'" % q(t)))
    for r in rows:
        fp, cu = r['fp'], r['uid']
        # порядок на сервере: sort в замыкании = позиция
        stmts.append("update \"flowModelTreePath\" set sort=%d where ancestor=%s and descendant=%s and depth=1;" % (ORDER.index(fp)+1, q(t), q(cu)))
        if fp in MONEY or fp in AREA:
            fmt = {'formatStyle':'normal','separator':'0.0,00','numberStep':'0.01'}
            props = dict(fmt)
            if fp in MONEY: fmt['addonAfter'] = ' ₽'; props['addonAfter'] = ' ₽'
            stmts.append("""update "flowModels" set options = jsonb_set(jsonb_set(options::jsonb, '{stepParams,numberSettings}', %s::jsonb, true), '{props}', %s::jsonb, true)::json where options::json->>'parentId'=%s and options::json->>'subKey'='field';""" % (q(json.dumps({'format': fmt})), q(json.dumps(props)), q(cu)))
stmts.append('commit;')
psql('\n'.join(stmts)); print('formats + order set')
