#!/usr/bin/env python3
"""Тестовый контур CRM, шаг 3: кадры (HR) — отдельная страница «Персонал (тест)».

Создаёт:
  - crm_legal_entities (юрлица), новые поля crm_employees (юрлицо, тип занятости, срок договора, дни отпуска, рабочее место СОУТ);
  - crm_hr_private — закрытые данные сотрудника (паспорт, СНИЛС, воинский учёт, мотивация): видят только роли admin и hr;
  - crm_vacations (отпуска), crm_safety (охрана труда и пожарная безопасность), crm_sout (СОУТ по рабочим местам),
    crm_lna (локальные нормативные акты + отметки об ознакомлении), crm_hr_programs (мотивационные программы), crm_hr_events (мероприятия);
  - роль hr «Кадры (тест)»: просмотр, создание, правка, удаление; единственная, кроме admin, с доступом к закрытым данным;
  - страницу меню «Персонал (тест)» (/admin/hrpage01, JS-блок crmblock003 ← src/crm-hr.js), «Задачи и сотрудники (тест)» → «Задачи (тест)».

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> NB_SSH=user@server python3 setup_crm_hr.py
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

def collection(name, title, fields):
    print('collection', name, ok(call('collections:create', {'name': name, 'title': title, 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': fields})))


collection('crm_legal_entities', 'Юрлица', [S('name', 'Название'), S('inn', 'ИНН'),
                                           S('mil_office', 'Военкомат'), D('mil_check_on', 'Последняя сверка с военкоматом'), F('mil_plan_year', 'integer', 'integer', 'План ВУ получен на год', 'InputNumber'), S('kpp', 'КПП'), S('ogrn', 'ОГРН'), T('address', 'Адрес'),
                                           S('director', 'Руководитель'), T('note', 'Заметки'), F('sort', 'integer', 'integer', 'Порядок', 'InputNumber')])
for f in [I('legal_entity_id', 'Юрлицо'), S('employment_type', 'Тип занятости'),   # staff | external | self
          D('contract_until', 'Договор до'), J('extra_le_ids', 'Также в юрлицах'), S('rate', 'Ставка'), S('object_name', 'Объект'),
          J('acts', 'Акты самозанятого: {ГГГГ-ММ: дата}'), F('vacation_days', 'integer', 'integer', 'Дней отпуска в год', 'InputNumber'), I('sout_id', 'Рабочее место (СОУТ)')]:
    print('crm_employees.' + f['name'], ok(call('collections/crm_employees/fields:create', f)))

collection('crm_hr_private', 'Сотрудники: закрытые данные', [
    I('employee_id', 'Сотрудник'), S('passport', 'Паспорт'), S('snils', 'СНИЛС'), S('inn', 'ИНН'), T('reg_address', 'Адрес регистрации'),
    S('emergency', 'Экстренный контакт'),
    S('mil_status', 'Воинский учёт'),        # liable | not | ''
    S('mil_category', 'Категория запаса'), S('mil_composition', 'Состав'), S('mil_rank', 'Воинское звание'), S('mil_vus', 'ВУС'),
    S('mil_fitness', 'Категория годности'), S('mil_office', 'Военкомат'), S('mil_ticket', 'Военный билет'), S('mil_special', 'Учёт (общий / специальный)'),
    T('mil_note', 'Воинский учёт: заметки'), D('mil_sent_on', 'Сведения в военкомат отправлены'), J('file_docs', 'Личное дело: есть документы'),
    T('motivation', 'Мотивация'), I('program_id', 'Мотивационная программа'),
])
collection('crm_vacations', 'Отпуска', [I('employee_id', 'Сотрудник'), S('kind', 'Вид'), D('start_date', 'С'), D('end_date', 'По'),
                                        F('days', 'integer', 'integer', 'Дней', 'InputNumber'), S('status', 'Статус'), T('note', 'Заметки')])   # plan | ordered
collection('crm_safety', 'Охрана труда и пожарная безопасность', [I('employee_id', 'Сотрудник (пусто — общее)'), S('area', 'Раздел'),   # ot | pb
                                        S('kind', 'Вид'), D('done_on', 'Проведено'), D('next_on', 'Следующее'), S('doc', 'Документ / протокол'), T('note', 'Заметки')])
collection('crm_sout', 'СОУТ: рабочие места', [S('workplace', 'Рабочее место'), I('legal_entity_id', 'Юрлицо'), S('work_class', 'Класс условий труда'),
                                        S('card_no', 'Номер карты'), D('assessed_on', 'Дата оценки'), D('next_on', 'Следующая оценка'), T('guarantees', 'Гарантии и компенсации'), T('note', 'Заметки')])
collection('crm_lna', 'Локальные нормативные акты', [S('title', 'Название'), S('kind', 'Вид'), I('legal_entity_id', 'Юрлицо (пусто — все)'), S('number', 'Номер'),
                                        D('approved_on', 'Утверждён'), D('review_on', 'Пересмотреть'), F('need_ack', 'boolean', 'checkbox', 'Нужно ознакомление', 'Checkbox'),
                                        J('acks', 'Ознакомлены: {id сотрудника: дата}'), I('file_id', 'Файл'), T('note', 'Заметки')])
print('crm_lna.file', ok(call('collections/crm_lna/fields:create', {'name': 'file', 'type': 'belongsTo', 'target': 'attachments', 'foreignKey': 'file_id',
      'interface': 'm2o', 'uiSchema': {'title': 'Файл', 'x-component': 'AssociationField'}})))
collection('crm_hr_programs', 'Мотивационные программы', [S('title', 'Название'), S('kind', 'Вид'), T('description', 'Условия'),
                                        D('start_on', 'С'), D('end_on', 'По'), T('note', 'Заметки')])
collection('crm_hr_events', 'Корпоративные мероприятия', [S('title', 'Название'), S('kind', 'Вид'), D('event_date', 'Дата'), S('place', 'Место'),
                                        N('budget', 'Бюджет'), J('participants', 'Участники: [id сотрудника]'), T('note', 'Заметки')])

# --- права: закрытые данные — только admin и hr (у остальных ролей глобальная стратегия, поэтому явный запрет)
for role in ('crm_test', 'member', 'rental_dept', 'legal_dept', 'accounting_dept'):
    print('deny private for', role, ok(call('roles/%s/resources:create' % role, {'name': 'crm_hr_private', 'usingActionsConfig': True, 'actions': []})))
# hr — глобальная стратегия с удалением (как у отделов): оверрайд на коллекцию без списка fields отдаёт в :list только id (баг NocoBase)
print('role hr', ok(call('roles:create', {'name': 'hr', 'title': 'Кадры (тест)', 'strategy': {'actions': ['view', 'create', 'update', 'destroy']}, 'allowNewMenu': False})))

# --- страница «Персонал (тест)»: маршрут через API, сетка и JS-блок — строками flowModels
r = call('desktopRoutes:create', {'type': 'flowPage', 'title': 'Персонал (тест)', 'icon': 'IdcardOutlined', 'schemaUid': 'hrpage01', 'menuSchemaUid': 'hrmenu01',
                                  'children': [{'type': 'tabs', 'schemaUid': 'hrtabs01', 'hidden': True}]})
print('route', ok(r))
def route_ids(uids):
    return [x['id'] for x in call('desktopRoutes:list?paginate=false&filter=' + urllib.parse.quote(json.dumps({'schemaUid': {'$in': uids}})))['data']]
hr_routes, tsk_routes = route_ids(['hrpage01', 'hrtabs01']), route_ids(['tskpage01', 'tsktabs01'])
for role in ('member', 'rental_dept', 'legal_dept', 'accounting_dept'):
    print('hide from', role, ok(call('roles/%s/desktopRoutes:remove' % role, hr_routes)))
print('menu crm_test', ok(call('roles/crm_test/desktopRoutes:add', hr_routes)))   # справочник сотрудников для всех тестовых
print('menu hr', ok(call('roles/hr/desktopRoutes:add', hr_routes + tsk_routes)))
tsk_page = route_ids(['tskpage01'])[0]
print('rename tasks page', ok(call('desktopRoutes:update?filterByTk=%s' % tsk_page, {'title': 'Задачи (тест)'})))

LAYOUT = {'rows': [{'id': 'hrrow1', 'cells': [{'id': 'hrrow1:cell:0', 'items': ['crmblock003']}], 'sizes': [24]}], 'version': 2}
grid = {'use': 'BlockGridModel', 'parent': 'hrtabs01', 'parentId': 'hrtabs01', 'subKey': 'grid', 'subType': 'object', 'sortIndex': 0, 'flowRegistry': {},
        'props': {'rows': {'hrrow1': [['crmblock003']]}, 'sizes': {'hrrow1': [24]}, 'colGap': 16, 'rowGap': 16, 'rowOrder': ['hrrow1'], 'layout': LAYOUT},
        'stepParams': {'gridSettings': {'grid': {'layout': LAYOUT}}}}
block = {'use': 'JSBlockModel', 'props': {}, 'subKey': 'items', 'subType': 'array', 'parentId': 'hrgrid001', 'sortIndex': 0,
         'stepParams': {'jsSettings': {'runJs': {'code': 'ctx.render("Загрузка…");'}}}}
psql("""begin;
insert into "flowModels"(uid,name,options) values ('hrgrid001','hrgrid001','%s') on conflict do nothing;
insert into "flowModels"(uid,name,options) values ('crmblock003','crmblock003','%s') on conflict do nothing;
insert into "flowModelTreePath"(ancestor,descendant,depth,async,type,sort) values
 ('hrgrid001','hrgrid001',0,false,'grid',null),('hrtabs01','hrgrid001',1,false,null,null),
 ('crmblock003','crmblock003',0,false,'items',null),('hrgrid001','crmblock003',1,false,null,1),('hrtabs01','crmblock003',2,false,null,1)
 on conflict do nothing;
update crm_employees set employment_type = 'staff' where employment_type is null;
update crm_employees set vacation_days = 28 where vacation_days is null;
update crm_employees set status = 'active' where status = 'vacation';   -- «в отпуске» теперь считается по графику отпусков
commit;""" % (json.dumps(grid, ensure_ascii=False), json.dumps(block, ensure_ascii=False)))
print('page models ok')

# Юрлица и привязка сотрудников к ним заводятся в интерфейсе (разовое начальное заполнение 30.09.2026 по папкам HR — вне репозитория: данные компаний и людей).
