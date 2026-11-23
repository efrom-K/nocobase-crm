#!/usr/bin/env python3
"""Install NocoBase metadata and permissions for task participants.

Requires a verified backup and explicit authorization for production.
Run from the reviewed release with NB_URL and NB_TOKEN.
"""
import argparse
import json
import os
import urllib.parse
import urllib.request

BASE = os.environ['NB_URL'].rstrip('/')
TOKEN = os.environ['NB_TOKEN']
ME = '{{ ctx.state.currentUser.id }}'
TASK = 'crm_tasks'
EVENT = 'crm_task_events'
ASSIGNMENT = {'author_id', 'author_name', 'executor_id', 'executor_name',
              'controller_id', 'controller_name', 'observers'}
OPERATORS = {'admin', 'hr', 'aho'}
SCOPED = {'crm_test', 'member', 'legal_dept', 'rental_dept', 'accounting_dept'}


def api(path, values=None):
    request = urllib.request.Request(
        BASE + '/api/' + path,
        data=None if values is None else json.dumps(values).encode(),
        headers={'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic',
                 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response).get('data')


def query(collection, filt=None):
    params = {'paginate': 'false'}
    if filt:
        params['filter'] = json.dumps(filt)
    return api(collection + ':list?' + urllib.parse.urlencode(params))


def field(collection, name, **values):
    fields = 'collections/' + collection + '/fields'
    if not query(fields, {'name': name}):
        api(fields + ':create', {'name': name, **values})


def scope(collection, name, conditions):
    resource = 'dataSourcesRolesResourcesScopes'
    rows = query(resource, {'resourceName': collection, 'name': name})
    values = {'resourceName': collection, 'name': name, 'scope': conditions, 'dataSourceKey': 'main'}
    if rows:
        api(resource + ':update?filterByTk=' + str(rows[0]['id']), values)
        return rows[0]['id']
    return api(resource + ':create', values)['id']


def acl(role, collection, actions):
    resource = 'roles/' + role + '/resources'
    rows = query(resource, {'name': collection})
    payload = {'name': collection, 'usingActionsConfig': True, 'actions': actions}
    if rows:
        previous = api(resource + ':get?filterByTk=' + str(rows[0]['id']) + '&appends=actions')
        actions_by_name = {item['name']: item['id'] for item in previous['actions']}
        for item in actions:
            if item['name'] in actions_by_name:
                item['id'] = actions_by_name[item['name']]
        api(resource + ':update?filterByTk=' + str(rows[0]['id']), payload)
    else:
        api(resource + ':create', payload)


def action(name, fields, scope_id=None):
    values = {'name': name, 'fields': sorted(fields)}
    if scope_id is not None:
        values['scopeId'] = scope_id
    return values


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare', action='store_true', help='install fields and service permissions only')
    args = parser.parse_args()
    # NocoBase appends new fields to each explicit action list. Its field hook
    # rejects legacy null lists, which otherwise mean all existing fields.
    for collection in (TASK, EVENT):
        resources = query('roles/crm_readonly/resources', {'name': collection})
        if resources:
            resource = api('roles/crm_readonly/resources:get?filterByTk=' + str(resources[0]['id']) + '&appends=actions')
            actions = resource['actions']
            if any(item['fields'] is None for item in actions):
                fields = [f['name'] for f in query('collections/' + collection + '/fields')]
                acl('crm_readonly', collection, [
                    {**{k: item[k] for k in ('name', 'scopeId') if k in item}, 'fields': item['fields'] if item['fields'] is not None else fields}
                    for item in actions
                ])

    field(TASK, 'observers', type='belongsToMany', interface='m2m', target='users',
          through='crmTaskObservers', foreignKey='task_id', otherKey='user_id', sourceKey='id', targetKey='id',
          uiSchema={'title': 'Наблюдатели', 'x-component': 'AssociationField'})
    field(EVENT, 'task', type='belongsTo', interface='m2o', target=TASK, foreignKey='task_id',
          uiSchema={'title': 'Задача', 'x-component': 'AssociationField'})

    participants = [{key: {'$eq': ME}} for key in ('author_id', 'executor_id', 'controller_id')]
    readers = participants + [{'observers': {'id': {'$eq': ME}}}]
    task_view = scope(TASK, 'Участники задачи и наблюдатели', {'$or': readers})
    task_edit = scope(TASK, 'Участники задачи без наблюдателей', {'$or': participants})
    event_view = scope(EVENT, 'История доступных задач', {'$or': [{'task': condition} for condition in readers]})

    task_fields = {f['name'] for f in query('collections/' + TASK + '/fields')}
    event_fields = {f['name'] for f in query('collections/' + EVENT + '/fields')} - {'task'}
    task_updates = task_fields - ASSIGNMENT
    roles = {role['name']: (role.get('strategy') or {}).get('actions', []) for role in query('roles')}

    # Сначала дать права служебной учётке. Её маршрут проверяет реального участника задачи.
    acl('requests_service', TASK, [
        action('view', {'id', 'title', 'status', 'author_id', 'executor_id', 'executor_name', 'controller_id', 'observers'}),
        action('update', {'executor_id', 'executor_name', 'observers'}),
    ])
    acl('requests_service', EVENT, [action('create', {'task_id', 'author_id', 'author_name', 'kind', 'text', 'file_id'})])
    acl('requests_service', 'task_notifications', [action('create', {'user_id', 'title', 'text', 'url'})])

    if args.prepare:
        print('Task fields and service access installed.')
        return

    route_ids = [route['id'] for route in query('desktopRoutes', {'schemaUid': {'$in': ['tskpage01', 'tsktabs01']}})]
    if len(route_ids) != 2:
        raise RuntimeError('Task menu routes are missing')

    for role in sorted((OPERATORS | SCOPED) & roles.keys()):
        own = role in SCOPED
        actions = []
        for name in {value.split(':')[0] for value in roles[role]}:
            if name == 'view':
                actions.append(action(name, task_fields, task_view if own else None))
            elif name == 'create':
                actions.append(action(name, task_fields))
            elif name == 'update':
                actions.append(action(name, task_updates, task_edit if own else None))
            elif name in {'destroy', 'export'}:
                actions.append(action(name, task_fields,
                                      (task_view if name == 'export' else task_edit) if own else None))
        acl(role, TASK, actions)
        acl(role, EVENT, [action('view', event_fields, event_view if own else None)])
        if own:
            api('roles/' + role + '/desktopRoutes:add', route_ids)

    print('Task fields and task-specific access rules installed.')


if __name__ == '__main__':
    main()
