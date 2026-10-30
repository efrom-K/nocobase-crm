#!/usr/bin/env python3
"""Audit contract objects; --apply installs migration 005 and NocoBase metadata/permissions.

NB_SSH=user@server (omit for local Docker), NB_URL, NB_TOKEN required for --apply.
Take a database backup before applying. Never infers objects for blank contracts.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import urllib.parse
import urllib.request

TABLES = ('forming_contracts', 'rental_contracts', 'completed_contracts', 'draft_contracts')
ROLES = ('rental_dept', 'legal_dept', 'accounting_dept')


def sql(query):
    cmd = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'),
           'psql', '-U', 'nocobase', '-d', 'nocobase', '-XAt', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'):
        import shlex
        cmd = ['ssh', os.environ['NB_SSH'], shlex.join(cmd)]
    return subprocess.run(cmd, input=query, text=True, capture_output=True, check=True).stdout.strip()


def api(path, body=None):
    req = urllib.request.Request(os.environ['NB_URL'].rstrip('/') + '/api/' + path,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={'Authorization': 'Bearer ' + os.environ['NB_TOKEN'],
                                          'Content-Type': 'application/json', 'X-Authenticator': 'basic'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)['data']


def audit():
    union = ' UNION ALL '.join("SELECT '%s' kind, id, object_name FROM %s" % (t, t) for t in TABLES)
    return json.loads(sql("WITH c AS (%s) SELECT coalesce(json_agg(s), '[]'::json) FROM "
                          "(SELECT kind, count(*) total, count(*) FILTER (WHERE nullif(btrim(object_name),'') IS NULL) blank, "
                          "count(*) FILTER (WHERE nullif(btrim(object_name),'') IS NOT NULL AND NOT EXISTS "
                          "(SELECT 1 FROM contract_objects o WHERE o.name=c.object_name)) missing "
                          "FROM c GROUP BY kind ORDER BY kind) s" % union))


def apply():
    if not os.environ.get('NB_URL') or not os.environ.get('NB_TOKEN'):
        raise SystemExit('NB_URL and NB_TOKEN required for --apply')
    # Refuse partial installations; do not silently skip an unrelated object_id field.
    installed = sql("SELECT count(*) FROM pg_trigger WHERE tgname='contract_object_resolve' AND NOT tgisinternal")
    if installed == '0':
        migration = Path(__file__).resolve().parents[1] / 'db/migrations/005_contract_object_directory.sql'
        sql(migration.read_text())
    elif installed != '4':
        raise SystemExit('Partial installation: inspect database before continuing')
    for table in TABLES:
        fields = api('collections/%s/fields:list?paginate=false' % table)
        if not any(f['name'] == 'object_id' for f in fields):
            api('collections/%s/fields:create' % table, {'name': 'object_id', 'type': 'bigInt', 'interface': 'integer',
                'uiSchema': {'type': 'number', 'title': 'Объект (ID)', 'x-component': 'InputNumber'}})
    for role in ROLES:
        query = urllib.parse.urlencode({'paginate': 'false', 'appends': 'actions', 'filter': json.dumps({'name': 'contract_objects'})})
        resources = api('roles/%s/resources:list?%s' % (role, query))
        if len(resources) != 1 or not resources[0].get('usingActionsConfig'):
            raise SystemExit('Unexpected object ACL for role %s; no permissions replaced' % role)
        resource = resources[0]
        create = [a for a in resource['actions'] if a['name'] == 'create']
        if create:
            if create[0].get('fields') != ['name']:
                raise SystemExit('Existing create permission differs for %s; inspect manually' % role)
        else:
            # The roles API reloads ACL; creating an action directly leaves the runtime cache stale.
            actions = [{k: v for k, v in action.items() if k in ('id', 'name', 'fields', 'scopeId')}
                       for action in resource['actions']]
            actions.append({'name': 'create', 'fields': ['name']})
            api('roles/%s/resources:update?filterByTk=%s' % (role, resource['id']),
                {'usingActionsConfig': True, 'actions': actions})
        print('%s: object creation limited to name' % role)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    print(json.dumps({'before': audit()}, ensure_ascii=False))
    if args.apply:
        apply()
        print(json.dumps({'after': audit()}, ensure_ascii=False))
