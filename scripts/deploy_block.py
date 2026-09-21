#!/usr/bin/env python3
"""Записывает JS-файл в JSBlockModel NocoBase (flowModels.options → stepParams.jsSettings.runJs.code).

    scripts/deploy_block.py <uid> <file.js> [--ssh user@host]

Без --ssh команда идёт в локальный docker. Контейнер БД: NB_PG_CONTAINER (по умолчанию nocobase-postgres-1).
Страница подхватывает код при перезагрузке, рестарт NocoBase не нужен.
Перед деплоем сделайте бэкап: pg_dump -t '"flowModels"' -t '"flowModelTreePath"'.
"""
import argparse, json, os, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument('uid'); ap.add_argument('file'); ap.add_argument('--ssh')
a = ap.parse_args()

code = open(a.file, encoding='utf-8').read()
lit = json.dumps(code)
tag = '$JSONCODE$'
assert tag not in lit
sql = ("update \"flowModels\" set options = jsonb_set(options::jsonb, '{stepParams,jsSettings,runJs,code}', "
       + tag + lit + tag + "::jsonb)::json where uid = '" + a.uid.replace("'", '') + "';\n")

# SQL идёт через stdin: код блока >128 КБ, в аргументы командной строки он не влезает
cont = os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1')
cmd = ['docker', 'exec', '-i', cont, 'psql', '-U', 'nocobase', '-d', 'nocobase', '-v', 'ON_ERROR_STOP=1']
if a.ssh:
    cmd = ['ssh', a.ssh, 'sudo -n ' + ' '.join(cmd)]
r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
sys.stdout.write(r.stdout.decode()); sys.stderr.write(r.stderr.decode())
sys.exit(r.returncode)
