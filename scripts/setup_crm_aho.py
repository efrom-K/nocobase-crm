#!/usr/bin/env python3
"""Тестовый контур CRM, шаг 4: административно-хозяйственный отдел (АХО) — страница «Дашборд АХО (тест)».

Создаёт:
  - crm_aho_routines (регулярные дела офис-менеджера по регламенту: период, день, когда сделано, следующий срок);
  - crm_aho_articles (статьи расходов + план по месяцам), crm_aho_subs (регулярные платежи: подписки, хостинги, связь),
    crm_aho_expenses (счета: новый → на согласовании → согласован / отклонён → оплачен → закрывающие получены → передан в бухгалтерию);
  - crm_aho_poa (доверенности: юрлицо, на кого, для чего, срок действия), crm_aho_fire (требования арендаторам по пожарной безопасности),
    crm_aho_mail (входящие, исходящие, служебные записки), crm_aho_cars + crm_aho_fines (машины и штрафы), crm_aho_files (документы к записям);
  - роль aho «АХО (тест)» (просмотр, создание, правка, удаление — как hr), канал уведомлений «АХО»;
  - страницу меню «Дашборд АХО (тест)» (/admin/ahodash01, JS-блок crmblock005 ← src/crm-aho.js), видна admin и aho;
  - app_settings aho_approver_user_id — кто согласует счета (id пользователя NocoBase, задаётся вручную).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_aho.py
"""
import json, os, subprocess, sys, urllib.parse, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)

def psql(sql):
    cmd = ['docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    if os.environ.get('NB_SSH'): cmd = ['ssh', os.environ['NB_SSH'], 'sudo -n ' + ' '.join(cmd)]
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()

def F(name, typ, iface, title, comp='Input'):
    return {'name': name, 'type': typ, 'interface': iface, 'uiSchema': {'type': 'number' if typ in ('bigInt', 'integer', 'double') else 'string', 'title': title, 'x-component': comp}}
def S(name, title): return F(name, 'string', 'input', title)
def T(name, title): return F(name, 'text', 'textarea', title, 'Input.TextArea')
def I(name, title): return F(name, 'bigInt', 'integer', title, 'InputNumber')
def N(name, title): return F(name, 'double', 'number', title, 'InputNumber')
def D(name, title): return F(name, 'dateOnly', 'date', title, 'DatePicker')
def J(name, title): return {'name': name, 'type': 'json', 'interface': 'json', 'uiSchema': {'type': 'object', 'title': title, 'x-component': 'Input.JSON'}}
def B(name, title): return F(name, 'boolean', 'checkbox', title, 'Checkbox')

def collection(name, title, fields):
    print('collection', name, ok(call('collections:create', {'name': name, 'title': title, 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': fields})))


collection('crm_aho_routines', 'АХО: регулярные дела', [S('title', 'Что сделать'), S('period', 'Как часто'),   # daily | weekly | monthly | quarterly | yearly
                                                      F('day', 'integer', 'integer', 'День (числа месяца или недели)', 'InputNumber'),
                                                      D('last_done_on', 'Последний раз сделано'), D('next_on', 'Следующий срок'), S('link', 'Инструкция (ссылка)'),
                                                      B('active', 'Действует'), T('note', 'Заметки')])
collection('crm_aho_articles', 'АХО: статьи расходов', [S('name', 'Статья'), F('sort', 'integer', 'integer', 'Порядок', 'InputNumber'), J('plan', 'План: {ГГГГ-ММ: сумма}')])
collection('crm_aho_subs', 'АХО: регулярные платежи', [S('title', 'Что оплачиваем'), I('article_id', 'Статья'), I('legal_entity_id', 'Юрлицо'), N('amount', 'Сумма, ₽'),
                                                     S('period', 'Период'), D('next_pay_on', 'Следующая оплата'), S('pay_note', 'Когда платить (как в договоре)'),   # month | quarter | year
                                                     B('active', 'Действует'), T('note', 'Заметки')])
collection('crm_aho_expenses', 'АХО: счета и расходы', [S('title', 'Что'), I('article_id', 'Статья'), I('legal_entity_id', 'Юрлицо'), S('object_name', 'Объект'),
                                                      S('supplier', 'Поставщик'), S('invoice_no', 'Номер счёта'), N('amount', 'Сумма, ₽'), D('due_on', 'Оплатить до'),
                                                      S('status', 'Статус'),   # new | approval | approved | rejected | paid | docs | handed
                                                      I('sub_id', 'Регулярный платёж'), I('author_id', 'Кто завёл (пользователь)'),
                                                      D('sent_on', 'Отправлен на согласование'), D('approved_on', 'Решение'), S('approved_by', 'Кто согласовал'), T('decision_note', 'Комментарий согласующего'),
                                                      D('paid_on', 'Оплачен'), D('docs_on', 'Закрывающие получены'), D('handed_on', 'Передан в бухгалтерию'), T('note', 'Заметки')])
collection('crm_aho_poa', 'АХО: доверенности', [I('legal_entity_id', 'Юрлицо'), S('number', 'Номер'), S('to_whom', 'На кого'), S('purpose', 'Для чего / куда'),
                                               D('issued_on', 'Выдана'), D('valid_until', 'Действует до'), S('status', 'Статус'), T('note', 'Заметки')])   # active | revoked
collection('crm_aho_fire', 'АХО: пожарная безопасность у арендаторов', [S('object_name', 'Объект'), S('tenant', 'Арендатор'), I('legal_entity_id', 'Юрлицо-арендодатель'),
                                                                      D('issued_on', 'Требование вручено'), D('deadline_on', 'Устранить до'), T('issues', 'Недочёты'),
                                                                      S('status', 'Статус'), D('fixed_on', 'Устранено'), T('note', 'Заметки')])   # sent | fixed | repeat
collection('crm_aho_mail', 'АХО: корреспонденция и служебные записки', [S('kind', 'Вид'), D('reg_on', 'Дата'), S('number', 'Номер'), S('object_name', 'Объект'),   # in | out | memo
                                                                      I('legal_entity_id', 'Юрлицо'), S('counterparty', 'От кого / кому'), S('subject', 'О чём'),
                                                                      S('method', 'Как'), S('track', 'Трек-номер'), S('status', 'Статус'), D('due_on', 'Ответить / сделать до'), T('note', 'Заметки')])
collection('crm_aho_cars', 'АХО: машины', [S('name', 'Машина'), S('plate', 'Госномер'), S('owner', 'Собственник'), S('driver', 'Кто ездит'), B('active', 'Используется'), T('note', 'Заметки')])
collection('crm_aho_fines', 'АХО: штрафы', [I('car_id', 'Машина'), D('issued_on', 'Дата постановления'), S('uin', 'УИН / номер постановления'), N('amount', 'Сумма, ₽'),
                                           D('discount_until', 'Скидка 50% до'), D('paid_on', 'Оплачен'), T('note', 'Заметки')])
collection('crm_aho_files', 'АХО: документы', [S('entity', 'К чему'), I('record_id', 'Запись'), S('doc', 'Какой документ'), I('file_id', 'Файл'), T('note', 'Заметки')])
print('crm_aho_files.file', ok(call('collections/crm_aho_files/fields:create', {'name': 'file', 'type': 'belongsTo', 'target': 'attachments', 'foreignKey': 'file_id',
      'interface': 'm2o', 'uiSchema': {'title': 'Файл', 'x-component': 'AssociationField'}})))

print('role aho', ok(call('roles:create', {'name': 'aho', 'title': 'АХО (тест)', 'strategy': {'actions': ['view', 'create', 'update', 'destroy']}, 'allowNewMenu': False})))
print('channel aho', ok(call('notificationChannels:create', {'name': 'aho', 'title': 'АХО', 'description': 'АХО: регулярные дела, счета, доверенности, сроки',
                                                             'notificationType': 'in-app-message', 'options': {}})))

# --- страница «Дашборд АХО (тест)»: маршрут через API (кэш ролей), сетка и JS-блок — строками flowModels
print('route', ok(call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Дашборд АХО (тест)', 'icon': 'ShopOutlined', 'schemaUid': 'ahodash01', 'menuSchemaUid': 'ahomenu01',
                                               'children': [{'type': 'tabs', 'schemaUid': 'ahotabs01', 'hidden': True}]})))
def route_ids(uids):
    return [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + urllib.parse.quote(json.dumps({'schemaUid': {'$in': uids}})))['data']]
dash, tsk = route_ids(['ahodash01', 'ahotabs01']), route_ids(['tskpage01', 'tsktabs01', 'hrpage01', 'hrtabs01'])
for role in ('member', 'rental_dept', 'legal_dept', 'accounting_dept', 'crm_test', 'hr'):
    print('hide from', role, ok(call('roles/%s/desktopRoutes:remove' % role, dash)))
mail = [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + urllib.parse.quote(json.dumps({'$or': [{'title': {'$in': ['Почта', 'Сообщения', 'Мессенджер']}}, {'parent.title': {'$in': ['Почта', 'Сообщения', 'Мессенджер']}}]})))['data']]
print('menu aho', ok(call('roles/aho/desktopRoutes:add', dash + tsk + mail)))   # + задачи, справочник сотрудников, почта и сообщения, как у hr
# закрытые кадровые данные и подбор — только admin и hr (у aho глобальная стратегия «видеть всё», поэтому явный запрет)
for c in ('crm_hr_private', 'crm_hr_files', 'crm_candidates', 'crm_vacancies', 'crm_staff_positions'):
    print('deny', c, ok(call('roles/aho/resources:create', {'name': c, 'usingActionsConfig': True, 'actions': []})))

LAYOUT = {'rows': [{'id': 'ahorow1', 'cells': [{'id': 'ahorow1:cell:0', 'items': ['crmblock005']}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': 'ahotabs01', 'parentId': 'ahotabs01', 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {'ahorow1': [['crmblock005']]}, 'sizes': {'ahorow1': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': ['ahorow1'], 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': 'ahogrid001', 'sortIndex': 0,
         'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
psql("""begin;
insert into "flowModels"(uid,name,options) values ('ahogrid001','ahogrid001','%s') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('crmblock005','crmblock005','%s') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('ahogrid001','ahogrid001',0,false,'grid',null),('ahotabs01','ahogrid001',1,false,null,null),
 ('crmblock005','crmblock005',0,false,'items',null),('ahogrid001','crmblock005',1,false,null,1),('ahotabs01','crmblock005',2,false,null,1)
 on conflict do nothing;
commit;""" % (json.dumps(grid, ensure_ascii=False), json.dumps(block, ensure_ascii=False)))
print('page models ok')
print('approver setting', ok(call('app_settings:create', {'name': 'aho_approver_user_id'})) if not call(
    'app_settings:list?filter=' + urllib.parse.quote(json.dumps({'name': 'aho_approver_user_id'})))['data'] else 'exists')

# Регламент, статьи, платежи, доверенности и прочее начальное заполнение — вне репозитория (данные компаний и людей).
