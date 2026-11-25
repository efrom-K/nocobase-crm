#!/usr/bin/env python3
"""Install the sick-leave collection and restrict it to HR and administrators."""
import json
import os
import subprocess
import urllib.parse
import urllib.request

BASE = os.environ['NB_URL'].rstrip('/')
TOKEN = os.environ['NB_TOKEN']
COLLECTION = 'crm_sick_leaves'
FIELDS = [
    ('employee_id', 'bigInt', 'integer', 'Сотрудник', 'InputNumber'),
    ('start_date', 'dateOnly', 'date', 'С', 'DatePicker'),
    ('end_date', 'dateOnly', 'date', 'По', 'DatePicker'),
    ('document_no', 'string', 'input', 'Номер больничного', 'Input'),
    ('note', 'text', 'textarea', 'Заметки', 'Input.TextArea'),
]


def api(path, values=None):
    request = urllib.request.Request(
        BASE + '/api/' + path,
        data=None if values is None else json.dumps(values).encode(),
        headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)['data']


def rows(path, name=None):
    params = {'paginate': 'false'}
    if name:
        params['filter'] = json.dumps({'name': name})
    return api(path + ':list?' + urllib.parse.urlencode(params))


def permissions(role):
    path = f'roles/{role}/resources'
    existing = rows(path, COLLECTION)
    actions = []
    if role in {'hr', 'admin'}:
        fields = [field[0] for field in FIELDS]
        actions = [{'name': name, 'fields': (['id'] + fields) if name in {'view', 'destroy'} else fields}
                   for name in ('view', 'create', 'update', 'destroy')]
    values = {'name': COLLECTION, 'usingActionsConfig': True, 'actions': actions}
    if existing:
        target = '?filterByTk=' + str(existing[0]['id'])
        previous = api(path + ':get' + target + '&appends=actions')
        ids = {action['name']: action['id'] for action in previous['actions']}
        for action in actions:
            if action['name'] in ids:
                action['id'] = ids[action['name']]
        api(path + ':update' + target, values)
    else:
        api(path + ':create', values)


def main():
    if not rows('collections', COLLECTION):
        fields = [{'name': name, 'type': kind, 'interface': interface,
                   'uiSchema': {'title': title, 'x-component': component}}
                  for name, kind, interface, title, component in FIELDS]
        api('collections:create', {'name': COLLECTION, 'title': 'Больничные',
                                   'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': fields})
    roles = [role['name'] for role in rows('roles') if role['name'] != 'root']
    for role in sorted(roles, key=lambda name: name in {'hr', 'admin'}):
        permissions(role)
    sql = """
BEGIN;
ALTER TABLE crm_sick_leaves
  ALTER COLUMN employee_id SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_sick_leaves_period' AND conrelid = 'crm_sick_leaves'::regclass) THEN
    ALTER TABLE crm_sick_leaves ADD CONSTRAINT crm_sick_leaves_period CHECK (start_date <= end_date);
    ALTER TABLE crm_sick_leaves ADD CONSTRAINT crm_sick_leaves_no_overlap EXCLUDE USING gist
      (int8range(employee_id, employee_id, '[]') WITH &&, daterange(start_date, end_date, '[]') WITH &&);
  END IF;
END $$;
COMMIT;
"""
    subprocess.run(['ssh', os.environ['NB_SSH'],
                    'sudo -n docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase -v ON_ERROR_STOP=1'],
                   input=sql, text=True, check=True)


if __name__ == '__main__':
    main()
