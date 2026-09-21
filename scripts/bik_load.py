#!/usr/bin/env python3
"""Загрузка справочника БИК ЦБ РФ (ED807) в NocoBase-таблицу bik_directory. Запуск: раз в неделю по cron."""
import io, sys, subprocess, urllib.request, zipfile, csv
import xml.etree.ElementTree as ET

URL = 'https://www.cbr.ru/s/newbik'
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-v', 'ON_ERROR_STOP=1']

raw = urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
z = zipfile.ZipFile(io.BytesIO(raw))
xml = z.read([n for n in z.namelist() if n.lower().endswith('.xml')][0])
root = ET.fromstring(xml)

rows = {}
for e in root:
    if not e.tag.endswith('BICDirectoryEntry'):
        continue
    bic = e.get('BIC')
    pi = next((c for c in e if c.tag.endswith('ParticipantInfo')), None)
    if not bic or pi is None:
        continue
    if pi.get('ParticipantStatus') == 'XCLD':
        continue
    accs = [c for c in e if c.tag.endswith('Accounts')]
    acc = ''
    for a in accs:
        if a.get('RegulationAccountType') == 'CRSA':
            acc = a.get('Account'); break
    if not acc and accs:
        acc = accs[0].get('Account') or ''
    city = ((pi.get('Tnp') or '') + ' ' + (pi.get('Nnp') or '')).strip()
    rows[bic] = (bic, pi.get('NameP') or '', acc, city)

if len(rows) < 1000:
    sys.exit('too few rows parsed: %d — abort, table untouched' % len(rows))

buf = io.StringIO()
w = csv.writer(buf)
for r in rows.values():
    w.writerow(r)
sql = ("begin; create temp table bik_stage(bik text, bank_name text, corr_account text, city text) on commit drop;\n"
       "copy bik_stage from stdin csv;\n")
p = subprocess.run(PSQL + ['-c', 'select 1'], capture_output=True)
inp = sql + buf.getvalue() + "\\.\n" + (
       "insert into bik_directory(bik,bank_name,corr_account,city) select bik,bank_name,corr_account,city from bik_stage "
       "on conflict (bik) do update set bank_name=excluded.bank_name, corr_account=excluded.corr_account, city=excluded.city;\n"
       "delete from bik_directory where bik not in (select bik from bik_stage);\ncommit;\n")
r = subprocess.run(PSQL, input=inp.encode(), capture_output=True)
print(r.stdout.decode()[-300:], r.stderr.decode()[-300:])
print('loaded', len(rows))
