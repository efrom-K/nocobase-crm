#!/usr/bin/env python3
"""Удаляет личные черновики договоров (draft_contracts) без активности дольше 5 суток,
чтобы они не копились мусором у сотрудников.

Активность = самое позднее из (draft_contracts.last_activity_at, последняя запись в
contract_history с contract_type='draft' и этим contract_ref_id — так учитываются не только
правки полей формы, но и загрузка файлов/контактов/график цены/переход этапа, которые пишут
только в историю, но не трогают сам draft_contracts). У черновика без единой правки после
ленивого создания last_activity_at всегда есть (ставится в момент создания).
Продление хранится отдельно от активности в записи draft_expiry_extended.

    purge_stale_drafts.py             # удалить
    purge_stale_drafts.py --dry-run   # только показать, ничего не удалять
    purge_stale_drafts.py --days N    # свой порог вместо 5 суток (для теста)
Запуск: cron ежедневно, 15 3 * * * (МСК)
"""
import json, subprocess, sys

DRY = '--dry-run' in sys.argv
DAYS = 5
if '--days' in sys.argv:
    DAYS = int(sys.argv[sys.argv.index('--days') + 1])

PSQL = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:400])
    return r.stdout.decode()

def jrows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')

def setting(key, default):   # значение со страницы «Настройки CRM» (коллекция crm_config); нет записи или мусор — по умолчанию
    try: v = json.loads(psql("select coalesce((select value::text from crm_config where key = '%s'), 'null')" % key.replace("'", "''")).strip() or 'null')
    except Exception: v = None
    if isinstance(default, int): return int(v) if type(v) in (int, float) and v >= 0 else default
    if isinstance(default, list): return [int(x) for x in v if isinstance(x, (int, float)) and x > 0] or default if isinstance(v, list) else default
    return default if v is None else v
if '--days' not in sys.argv: DAYS = max(1, setting('contracts.draftPurgeDays', DAYS))   # 0 стёр бы все черновики

STALE = """
    greatest(
        coalesce(d.last_activity_at, 'epoch'::timestamptz),
        coalesce((select max(h.created_at) from contract_history h
                  where h.contract_type='draft' and h.contract_ref_id=d.id
                    and h.action is distinct from 'draft_expiry_extended'), 'epoch'::timestamptz)
    ) < now() - interval '%d days'
    and not exists (
        select 1 from contract_history h
        where h.contract_type='draft' and h.contract_ref_id=d.id and h.author_id=d.created_by_id
          and h.action='draft_expiry_extended'
          and case when h.old_value ~ '^[0-9]{13}$' and h.new_value ~ '^[0-9]{13}$' then
            h.new_value::bigint - h.old_value::bigint between 86400000 and 864000000
            and (h.new_value::bigint - h.old_value::bigint) %% 86400000 = 0
            and h.new_value::bigint > extract(epoch from now()) * 1000
          else false end
    )
""" % DAYS

stale = jrows("""
    select d.id, d.contract_number, d.object_name, d.tenant_name, d.created_by_id
    from draft_contracts d where
""" + STALE)

if not stale:
    print('нет черновиков без активности дольше %d сут.' % DAYS)
    sys.exit(0)

deleted = 0
for d in stale:
    label = d['contract_number'] or d['object_name'] or d['tenant_name'] or ('#%s' % d['id'])
    if not DRY:
        # Перепроверяем срок и удаляем связанные записи только для реально удалённого черновика.
        count = psql(f"""
            with purged as (
                delete from draft_contracts d where d.id={int(d['id'])} and {STALE}
                returning id
            ), contacts as (
                delete from contract_contacts where contract_type='draft' and contract_ref_id in (select id from purged)
            ), addendums as (
                delete from contract_addendums where contract_type='draft' and contract_ref_id in (select id from purged)
            ), history as (
                delete from contract_history where contract_type='draft' and contract_ref_id in (select id from purged)
            ), prices as (
                delete from contract_price_periods where contract_type='draft' and contract_ref_id in (select id from purged)
            ), attachments as (
                delete from "draftContractsAttachments" where f_fdhqbbbf30h in (select id from purged)
            )
            select count(*) from purged
        """)
        if count.strip() != '1':
            continue
    print(('[dry-run] ' if DRY else '') + 'удаляю черновик %s (id=%s, автор userId=%s)' % (label, d['id'], d['created_by_id']))
    deleted += 1

print('%sудалено черновиков: %d' % ('[dry-run] ' if DRY else '', deleted))
