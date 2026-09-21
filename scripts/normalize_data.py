#!/usr/bin/env python3
"""Нормализация существующих записей договоров. По умолчанию — только отчёт (dry-run); --apply применяет.
Все старые значения пишутся в normalization_log. Значения, которые не удаётся разобрать однозначно, НЕ трогаются."""
import json, re, subprocess, sys

APPLY = '--apply' in sys.argv
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
TABLES = [('rental_contracts', 'active'), ('forming_contracts', 'forming'), ('completed_contracts', 'completed')]
MONEY = ['area_sqm', 'rent_per_sqm', 'utility_per_sqm', 'deposit_amount', 'rent_amount', 'utility_amount']
EMAIL_RX = re.compile(r'^[^\s@;,]+@[^\s@;,]+\.[^\s@.;,]{2,}$')

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:500])
    return r.stdout.decode()

def q(v):
    return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"

def phone_parts(s):
    parts = [p.strip() for p in re.split(r'[;,/\n]+', s) if p.strip()]
    out = []
    for p in parts:
        d = re.sub(r'\D', '', p)
        if len(d) == 11 and d[0] in '78': n = '+7' + d[1:]
        elif len(d) == 10: n = '+7' + d
        else: return None
        if n not in out: out.append(n)
    return out or None

def email_parts(s):
    parts = [p for p in re.split(r'[;,\s]+', s.strip()) if p]
    if not parts or not all(EMAIL_RX.match(p) for p in parts): return None
    out = []
    for p in (x.lower() for x in parts):
        if p not in out: out.append(p)
    return out

cols = ['id', 'phone', 'email', 'inn', 'bank_account', 'bik', 'corr_account', 'tenant_fio', 'bank_name'] + MONEY
report = {}; skipped = []; stmts = []; n_contacts = 0; samples = []

bik = {}
for line in psql("select bik||'|'||bank_name||'|'||coalesce(corr_account,'') from bik_directory").splitlines():
    b, n, c = line.split('|', 2); bik[b] = (n, c)

for table, ctype in TABLES:
    rows = json.loads(psql('select coalesce(json_agg(t), \'[]\'::json) from (select %s from %s) t' % (','.join(cols), table)) or '[]')
    for r in rows:
        ch = {}; extra = []
        def setf(f, new, why=None):
            if new is not None and new != (r.get(f) or ''):
                ch[f] = new; report[f] = report.get(f, 0) + 1
                if len(samples) < 40: samples.append((table, r['id'], f, r.get(f), new))
        v = (r.get('phone') or '').strip()
        if v:
            pp = phone_parts(v)
            if pp is None: skipped.append((table, r['id'], 'phone', v))
            else:
                setf('phone', pp[0]); extra += [{'phone': p} for p in pp[1:]]
        v = (r.get('email') or '').strip()
        if v:
            ep = email_parts(v)
            if ep is None: skipped.append((table, r['id'], 'email', v))
            else:
                setf('email', ep[0]); extra += [{'email': e} for e in ep[1:]]
        for f, rx in (('inn', r'\d{10}|\d{12}'), ('bank_account', r'\d{20}'), ('corr_account', r'\d{20}'), ('bik', r'\d{9}')):
            v = r.get(f) or ''
            s = re.sub(r'\s', '', v)
            if v and s != v and re.fullmatch(rx, s): setf(f, s)
        for f in MONEY:
            v = r.get(f) or ''
            s = re.sub(r'[\s ]', '', v).replace('.', ',')
            if v and s != v and re.fullmatch(r'\d+(,\d+)?', s): setf(f, s)
        v = r.get('tenant_fio') or ''
        s = re.sub(r'\s+', ' ', v.strip())
        if v and s != v: setf('tenant_fio', s)
        b = (ch.get('bik') or r.get('bik') or '')
        if b in bik and not (r.get('bank_name') or ''):
            setf('bank_name', bik[b][0])
            if bik[b][1]: setf('corr_account', bik[b][1]) if not (r.get('corr_account') or '') else None
        for f, new in ch.items():
            stmts.append("insert into normalization_log(tbl,row_id,field,old_value,new_value) values(%s,%s,%s,%s,%s);" % (q(table), r['id'], q(f), q(r.get(f)), q(new)))
        if ch:
            stmts.append("update %s set %s where id=%s;" % (table, ','.join('%s=%s' % (f, q(v)) for f, v in ch.items()), r['id']))
        for e in extra:
            n_contacts += 1
            stmts.append("insert into contract_contacts(contract_type,contract_ref_id,name,position,phone,email) values(%s,%s,'','',%s,%s);" % (q(ctype), r['id'], q(e.get('phone', '')), q(e.get('email', ''))))
            stmts.append("insert into normalization_log(tbl,row_id,field,old_value,new_value) values(%s,%s,'contact+',NULL,%s);" % (q(table), r['id'], q(json.dumps(e, ensure_ascii=False))))

print('MODE:', 'APPLY' if APPLY else 'DRY-RUN')
print('changes by field:', json.dumps(report, ensure_ascii=False))
print('extra contacts to create:', n_contacts)
print('untouched (cannot be parsed unambiguously):', len(skipped))
for s in skipped[:25]: print('   SKIP', s)
print('samples:')
for s in samples[:14]: print('  ', s)
if APPLY:
    psql("create table if not exists normalization_log(id serial primary key, ts timestamptz default now(), tbl text, row_id bigint, field text, old_value text, new_value text);")
    psql('begin;\n' + '\n'.join(stmts) + '\ncommit;\n')
    print('applied statements:', len(stmts))
