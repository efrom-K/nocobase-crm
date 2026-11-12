#!/usr/bin/env python3
"""Install closing metadata and narrow department ACL after migration 008 and a verified backup.
NB_SSH, NB_URL, NB_TOKEN as in setup_object_directory.py. No data moves.
"""
import argparse
from pathlib import Path
from setup_object_directory import api, sql


def apply():
    if sql("SELECT count(*) FROM information_schema.columns WHERE table_name='completed_contracts' AND column_name='closure_state'") == '0':
        sql((Path(__file__).resolve().parents[1] / 'db/migrations/008_contract_closing.sql').read_text())
    fields = {f['name'] for f in api('collections/completed_contracts/fields:list?paginate=false')}
    # NocoBase's field-create hook spreads action.fields; legacy NULL (all fields) crashes it.
    for role in api('roles:list?paginate=false'):
        resources = api('roles/%s/resources:list?paginate=false&appends=actions&filter[name]=completed_contracts' % role['name'])
        for resource in resources:
            if any(a.get('fields') is None for a in resource['actions']):
                actions = [{k: v for k, v in a.items() if k in ('id', 'name', 'fields', 'scopeId')} for a in resource['actions']]
                for action in actions:
                    if action.get('fields') is None:
                        action['fields'] = sorted(fields)
                api('roles/%s/resources:update?filterByTk=%s' % (role['name'], resource['id']),
                    {'usingActionsConfig': resource['usingActionsConfig'], 'actions': actions})
    definitions = [
        {'name': 'closure_state', 'type': 'string', 'defaultValue': 'pending', 'interface': 'select',
         'uiSchema': {'title': 'Закрытие документов', 'type': 'string', 'x-component': 'Select', 'enum': [
             {'value': 'pending', 'label': 'Закрытие документов'}, {'value': 'archived', 'label': 'Архив'}]}},
        *[{'name': n, 'type': 'date', 'interface': 'datetime', 'uiSchema': {'title': title, 'type': 'string', 'x-component': 'DatePicker'}}
          for n, title in [('closed_at', 'Завершён'), ('archived_at', 'Передан в архив')]],
        {'name': 'closing_files', 'type': 'belongsToMany', 'interface': 'attachment', 'target': 'attachments',
         'through': 'completed_contract_closing_files', 'foreignKey': 'contract_id', 'otherKey': 'attachment_id',
         'sourceKey': 'id', 'targetKey': 'id',
         'uiSchema': {'title': 'Закрывающие документы', 'type': 'array', 'x-component': 'Upload.Attachment'}}]
    for field in definitions:
        if field['name'] not in fields:
            api('collections/completed_contracts/fields:create', field)
    scopes = api('dataSourcesRolesResourcesScopes:list?paginate=false')
    scope = next((s for s in scopes if s.get('key') == 'contract_closing_pending'), None)
    if not scope:
        scope = api('dataSourcesRolesResourcesScopes:create', {'key': 'contract_closing_pending', 'name': 'Document closing', 'dataSourceKey': 'main', 'resourceName': 'completed_contracts',
                    'scope': {'closure_state': 'pending'}})
    all_fields = [f['name'] for f in api('collections/completed_contracts/fields:list?paginate=false')]
    # Explicit resource ACL overrides the departments' broad default CRUD strategy.
    for role in ('accounting_dept', 'legal_dept', 'rental_dept', 'hr', 'aho', 'crm_test'):
        actions = [{'name': 'view', 'fields': all_fields}, {'name': 'export', 'fields': all_fields}]
        if role in ('legal_dept', 'rental_dept'):
            actions.append({'name': 'create', 'fields': [f['name'] for f in api('collections/completed_contracts/fields:list?paginate=false')
                                                      if f['name'] not in ('closure_state', 'closed_at', 'archived_at', 'closing_files')]})
            actions.append({'name': 'update', 'fields': ['contract_files', 'contract_members'], 'scopeId': scope['id']})
        elif role == 'accounting_dept':
            actions.append({'name': 'update', 'fields': ['closure_state', 'closing_files'], 'scopeId': scope['id']})
        existing = api('roles/%s/resources:list?paginate=false&filter[name]=completed_contracts' % role)
        body = {'name': 'completed_contracts', 'usingActionsConfig': True, 'actions': actions}
        api('roles/%s/resources:%s' % (role, 'update?filterByTk=' + str(existing[0]['id']) if existing else 'create'), body)
        # The implicit through collection must not inherit broad default CRUD.
        through = api('roles/%s/resources:list?paginate=false&filter[name]=completed_contract_closing_files' % role)
        api('roles/%s/resources:%s' % (role, 'update?filterByTk=' + str(through[0]['id']) if through else 'create'),
            {'name': 'completed_contract_closing_files', 'usingActionsConfig': True, 'actions': [{'name': 'view', 'fields': ['contract_id', 'attachment_id', 'createdAt', 'updatedAt']}]})
        print(role + ': closing permissions configured')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--apply', action='store_true')
    if p.parse_args().apply:
        apply()
    print(sql("SELECT count(*) FROM completed_contracts"))
