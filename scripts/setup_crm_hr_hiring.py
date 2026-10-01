#!/usr/bin/env python3
"""Кадры, шаг 2: подбор и штатное расписание (раздел «Подбор и штат» дашборда HR).

Создаёт коллекции:
  - crm_staff_positions — штатное расписание: должность в юрлице, число ставок, оклад;
  - crm_vacancies — вакансии (условия из них подставляются в оффер);
  - crm_candidates — кандидаты: этап, собеседование, оффер, выход на работу, ссылка на сотрудника после оформления.
Кандидаты и оклады — персональные данные: доступ только admin и hr (остальным ролям — явный запрет, как crm_hr_private).
Резюме и прочие файлы — в crm_hr_files (entity cand / vacancy).

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 setup_crm_hr_hiring.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body):
    req = urllib.request.Request(BASE + '/api/' + path, data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'})
    try:
        json.load(urllib.request.urlopen(req)); return 'ok'
    except urllib.error.HTTPError as e:
        return e.read().decode()[:300]

def F(name, typ, iface, title, comp='Input'):
    return {'name': name, 'type': typ, 'interface': iface, 'uiSchema': {'type': 'number' if typ in ('bigInt', 'integer', 'double') else 'string', 'title': title, 'x-component': comp}}
def S(name, title): return F(name, 'string', 'input', title)
def T(name, title): return F(name, 'text', 'textarea', title, 'Input.TextArea')
def I(name, title): return F(name, 'bigInt', 'integer', title, 'InputNumber')
def N(name, title): return F(name, 'double', 'number', title, 'InputNumber')
def D(name, title): return F(name, 'dateOnly', 'date', title, 'DatePicker')

def collection(name, title, fields):
    print('collection', name, call('collections:create', {'name': name, 'title': title, 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': fields}))

if os.environ.get('STEP') != 'profile':   # STEP=profile — только поля рабочего профиля (01.10.2026)
    collection('crm_staff_positions', 'Штатное расписание', [I('legal_entity_id', 'Юрлицо'), S('department', 'Подразделение'), S('position', 'Должность'),
                                                             N('units', 'Ставок'), N('salary', 'Оклад'), T('note', 'Заметки')])
    collection('crm_vacancies', 'Вакансии', [S('title', 'Должность'), I('legal_entity_id', 'Юрлицо'), S('department', 'Подразделение'), S('object_name', 'Объект'),
                                             I('position_id', 'Позиция штатного расписания'), S('status', 'Статус'),   # open | paused | closed | cancelled
                                             D('opened_on', 'Открыта'), D('due_on', 'Закрыть до'), D('closed_on', 'Закрыта'),
                                             S('salary', 'Зарплата'), S('place', 'Место работы'), S('schedule', 'График'), S('manager', 'Руководитель'),
                                             T('duties', 'Обязанности'), T('requirements', 'Требования'), S('sources', 'Где размещена'), T('note', 'Заметки')])
    collection('crm_candidates', 'Кандидаты', [I('vacancy_id', 'Вакансия'), S('full_name', 'ФИО'), S('phone', 'Телефон'), S('email', 'Почта'), S('source', 'Откуда'),
                                               S('stage', 'Этап'),   # new | interview | offer | hired | rejected | declined
                                               D('interview_on', 'Собеседование'), S('interview_time', 'Время'), F('rating', 'integer', 'integer', 'Оценка', 'InputNumber'),
                                               D('offer_on', 'Оффер отправлен'), S('offer_salary', 'Оклад на испытательный срок'), S('offer_salary_after', 'Оклад после'),
                                               F('probation', 'integer', 'integer', 'Испытательный срок, мес.', 'InputNumber'), D('start_on', 'Выход на работу'),
                                               S('reject_reason', 'Причина отказа'), I('employee_id', 'Сотрудник'), T('note', 'Заметки')])

    for coll in ('crm_staff_positions', 'crm_vacancies', 'crm_candidates'):
        for role in ('crm_test', 'member', 'rental_dept', 'legal_dept', 'accounting_dept'):
            print('deny', coll, 'for', role, call('roles/%s/resources:create' % role, {'name': coll, 'usingActionsConfig': True, 'actions': []}))

# --- 01.10.2026: рабочий профиль сотрудника (только факты о работе; результат формальной оценки — только с письменным согласием)
# и оценка кандидата по компетенциям на собеседовании
J = lambda name, title: {'name': name, 'type': 'json', 'interface': 'json', 'uiSchema': {'type': 'object', 'title': title, 'x-component': 'Input.JSON'}}
for f in [T('wp_strengths', 'Сильные стороны в работе'), T('wp_growth', 'Зоны развития'), T('wp_tasks', 'Как ставить задачи и давать обратную связь'),
          S('wp_comm', 'Удобный канал связи'), S('wp_assessment', 'Формальная оценка: методика'), D('wp_assessed_on', 'Дата оценки'),
          T('wp_assessment_result', 'Результат оценки'), D('wp_consent_on', 'Письменное согласие на оценку'), D('wp_reviewed_on', 'Профиль обновлён')]:
    print('crm_hr_private.' + f['name'], call('collections/crm_hr_private/fields:create', f))
print('crm_candidates.comp_scores', call('collections/crm_candidates/fields:create', J('comp_scores', 'Оценка по компетенциям: {компетенция: 1–5}')))
