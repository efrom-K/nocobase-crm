#!/usr/bin/env python3
"""Удаляет личные черновики договоров (draft_contracts) без активности дольше 3 суток,
чтобы они не копились мусором у сотрудников.

Активность = самое позднее из (draft_contracts.last_activity_at, последняя запись в
contract_history с contract_type='draft' и этим contract_ref_id — так учитываются не только
правки полей формы, но и загрузка файлов/контактов/график цены/переход этапа, которые пишут
только в историю, но не трогают сам draft_contracts). У черновика без единой правки после
ленивого создания last_activity_at всегда есть (ставится в момент создания).

    purge_stale_drafts.py             # удалить
    purge_stale_drafts.py --dry-run   # только показать, ничего не удалять
    purge_stale_drafts.py --days N    # свой порог вместо 3 суток (для теста)
Запуск: cron ежедневно, например 3 3 * * *
"""
import json, subprocess, sys

DRY = '--dry-run' in sys.argv
DAYS = 3
if '--days' in sys.argv:
    DAYS = int(sys.argv[sys.argv.index('--days') + 1])

PSQL = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:400])
    return r.stdout.decode()

def jrows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')

stale = jrows("""
    select d.id, d.contract_number, d.object_name, d.tenant_name, d.created_by_id
    from draft_contracts d
    where greatest(
        coalesce(d.last_activity_at, 'epoch'::timestamptz),
        coalesce((select max(h.created_at) from contract_history h where h.contract_type='draft' and h.contract_ref_id=d.id), 'epoch'::timestamptz)
    ) < now() - interval '%d days'
""" % DAYS)

if not stale:
    print('нет черновиков без активности дольше %d сут.' % DAYS)
    sys.exit(0)

for d in stale:
    label = d['contract_number'] or d['object_name'] or d['tenant_name'] or ('#%s' % d['id'])
    print(('[dry-run] ' if DRY else '') + 'удаляю черновик %s (id=%s, автор userId=%s)' % (label, d['id'], d['created_by_id']))
    if DRY:
        continue
    psql("""
        delete from contract_contacts where contract_type='draft' and contract_ref_id=%(id)s;
        delete from contract_addendums where contract_type='draft' and contract_ref_id=%(id)s;
        delete from contract_history where contract_type='draft' and contract_ref_id=%(id)s;
        delete from contract_price_periods where contract_type='draft' and contract_ref_id=%(id)s;
        delete from "draftContractsAttachments" where f_fdhqbbbf30h=%(id)s;
        delete from draft_contracts where id=%(id)s;
    """.replace('%(id)s', str(d['id'])))

print('%sудалено черновиков: %d' % ('[dry-run] ' if DRY else '', len(stale)))
