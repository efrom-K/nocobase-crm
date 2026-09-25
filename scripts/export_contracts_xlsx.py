#!/usr/bin/env python3
"""Аварийная копия всех договоров в плоской таблице Excel: одна строка — один договор
(действующие, в оформлении, архив, черновики), всё текстом, читается любым компьютером без NocoBase.
В строке — все поля договора плюс контакты, сотрудники, доп. соглашения, периоды цены и имена файлов.

    export_contracts_xlsx.py [каталог]     # по умолчанию ~/nb_backup/excel
Пишет «Договоры_ГГГГ-ММ-ДД.xlsx» и копию «Договоры_последние.xlsx»; файлы старше 60 дней удаляет.
Запуск: cron на svc ежедневно 03:30; DC забирает «последние» к себе в 03:45 (E:\\IT$\\NocoBase-Договоры, дальше — Veeam).
"""
import datetime, json, os, shutil, subprocess, sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

OUT = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/nb_backup/excel')
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def rows(sql):
    r = subprocess.run(PSQL, input=("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql).encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:400])
    return json.loads(r.stdout.decode() or '[]')

KINDS = [  # коллекция, тип в побочных таблицах, раздел, таблица сотрудников (через, договор, пользователь), таблица файлов
    ('rental_contracts', 'active', 'Действующий', ('rentalContractsMembers', 'f_f6uc3x0qna1', 'f_z8ov78krtg5'), ('rentalContractsAttachments', 'f_ebf2s9emr0p', 'f_l4x7r74bvip')),
    ('forming_contracts', 'forming', 'В оформлении', ('formingContractsMembers', 'f_4grdlk3o0b6', 'f_393ugnn49bq'), ('formingContractsAttachments', 'f_w223fz7ghtl', 'f_let98g0d7mw')),
    ('completed_contracts', 'completed', 'Архив', ('completedContractsMembers', 'f_c6vtots4gup', 'f_k874g93n9fl'), ('completedContractsAttachments', 'f_nnc044w68g6', 'f_fzx4qzefyo7')),
    ('draft_contracts', 'draft', 'Черновик', None, ('draftContractsAttachments', 'f_fdhqbbbf30h', 'f_bpo2jbv24p2')),
]
STAGES = ['1. Заявка на аренду', '2. Размещение объявления', '3. Согласование условий', '4. Подписание договора', '5. Оплата счетов', '6. Финал (акт и скан)']
STATUS = {'1_problem': 'Проблема', '2_terminating': 'На расторжении', '2_docs': 'Не хватает документов', '2_attention': 'Требует внимания', '3_ok': 'В порядке'}
LABELS = {'tenant_type': {'Юрлицо': 'Юридическое лицо', 'ИП': 'Индивидуальный предприниматель', 'Физлицо': 'Физическое лицо'},
          'signing_method': {'ЭДО': 'Электронный документооборот'}}

# (заголовок, ключ или функция) — порядок столбцов в таблице
def g(k): return lambda r: r.get(k)
COLS = [
    ('Раздел', lambda r: r['_kind']),
    ('Этап оформления', lambda r: ('Срочный (одной формой)' if r.get('is_quick') else STAGES[min(r.get('current_stage') or 0, 5)]) if r['_type'] in ('forming', 'draft') else None),
    ('Номер в системе', lambda r: '%s-%s' % (r['_type'], r['id'])),
    ('Объект', g('object_name')), ('Номер договора', g('contract_number')), ('Арендатор', g('tenant_name')),
    ('Тип арендатора', lambda r: LABELS['tenant_type'].get(r.get('tenant_type'), r.get('tenant_type'))),
    ('Статус', lambda r: STATUS.get(r.get('contract_status'), r.get('contract_status'))), ('Причина статуса', g('status_reason')),
    ('Дата заключения', g('date_signed')), ('Дата акта приёма-передачи', g('date_act')), ('Дата расторжения', g('termination_date')),
    ('Дата фактического начала аренды', g('actual_start_date')), ('Назначение', g('purpose')),
    ('Площадь, м²', g('area_sqm')),
    ('Арендная плата за 1 м² в месяц', g('rent_per_sqm')), ('Арендная плата в месяц', g('rent_amount')),
    ('Эксплуатационный сбор за 1 м² в месяц', g('utility_per_sqm')), ('Эксплуатационный сбор в месяц', g('utility_amount')),
    ('Сумма в месяц', lambda r: r.get('total_amount') if r.get('total_amount') is not None else (None if r.get('rent_amount') is None and r.get('utility_amount') is None else (r.get('rent_amount') or 0) + (r.get('utility_amount') or 0))), ('Обеспечительный платёж', g('deposit_amount')),
    ('Основная арендная плата в месяц', g('base_rent_amount')), ('Основной эксплуатационный сбор в месяц', g('base_utility_amount')),
    ('Основной обеспечительный платёж', g('base_deposit_amount')),
    ('Периоды цены', lambda r: r['_periods']),
    ('ИНН', g('inn')), ('КПП', g('kpp')), ('ОГРН / ОГРНИП', g('ogrn')), ('Юридический адрес / адрес регистрации', g('legal_address')),
    ('Должность руководителя', g('director_post')), ('ФИО руководителя', g('director')),
    ('Паспорт', g('passport')), ('Паспорт выдан', g('passport_issued')),
    ('Расчётный счёт', g('bank_account')), ('БИК', g('bik')), ('Банк', g('bank_name')), ('Корреспондентский счёт', g('corr_account')),
    ('Способ подписания', lambda r: LABELS['signing_method'].get(r.get('signing_method'), r.get('signing_method'))),
    ('Контакты', lambda r: r['_contacts']), ('Ответственные сотрудники', lambda r: r['_members']),
    ('Доп. соглашения', lambda r: r['_addendums']), ('Файлы', lambda r: r['_files']),
    ('Скан договора', g('contract_scan_url')), ('Скан акта', g('act_scan_url')),
    ('Ссылка Авито', g('avito_url')), ('Ссылка Циан', g('cian_url')), ('Другая ссылка', g('other_url')),
    ('Комментарий по заявке', g('comment_stage0')), ('Комментарий по условиям', g('comment_stage2')),
    ('Комментарий к расчётам', lambda r: r.get('calc_comment') or r.get('comment_stage4')),
    ('Примечания', g('notes')),
    ('Создан', lambda r: (r.get('createdAt') or '')[:10] or None), ('Изменён', lambda r: (r.get('updatedAt') or '')[:10] or None),
]
MONEY = {c[0] for c in COLS if any(w in c[0] for w in ('плата', 'сбор', 'Сумма', 'платёж'))}
DATES = {c[0] for c in COLS if c[0].startswith('Дата') or c[0] in ('Создан', 'Изменён')}

def ddmmyyyy(v):
    try: return datetime.date.fromisoformat(str(v)[:10]).strftime('%d.%m.%Y')
    except ValueError: return v
def num(v):
    return ('%.2f' % v).replace('.', ',') if isinstance(v, (int, float)) else str(v)

users = {u['id']: u['nickname'] or u['username'] for u in rows('select id, nickname, username from users')}
side = lambda table, extra='': rows("select * from %s %s" % (table, extra))
contacts, addendums, periods = side('contract_contacts', 'order by id'), side('contract_addendums', 'order by id'), side('contract_price_periods', 'order by date_from')
files = {a['id']: (a['title'] or '') + (a['extname'] or '') for a in rows('select id, title, extname from attachments')}

def by_ref(items, t, i): return [x for x in items if x['contract_type'] == t and x['contract_ref_id'] == i]
def fmt_period(p):
    parts = []
    if p.get('rent_on') is not False and p.get('amount') is not None:
        parts.append('аренда %s %s' % (num(p['amount']), 'за 1 м²' if (p.get('basis') or 'per_sqm') == 'per_sqm' else 'в месяц'))
    if p.get('utility_on') and p.get('utility_value') is not None:
        parts.append('сбор %s %s' % (num(p['utility_value']), 'за 1 м²' if (p.get('utility_basis') or 'per_sqm') == 'per_sqm' else 'в месяц'))
    if p.get('deposit_on') and p.get('deposit_value') is not None:
        parts.append('обеспечительный %s' % num(p['deposit_value']))
    span = 'с %s' % ddmmyyyy(p['date_from']) + (' по %s' % ddmmyyyy(p['date_to']) if p.get('date_to') else '')
    return span + ': ' + (', '.join(parts) or '—') + (' (%s)' % p['note'] if p.get('note') else '')

data = []
for coll, t, kind, mem, att in KINDS:
    members = {}
    if mem:
        for m in rows('select "%s" as c, "%s" as u from "%s"' % (mem[1], mem[2], mem[0])): members.setdefault(m['c'], []).append(users.get(m['u'], '#%s' % m['u']))
    fl = {}
    for a in rows('select "%s" as c, "%s" as f from "%s"' % (att[1], att[2], att[0])): fl.setdefault(a['c'], []).append(files.get(a['f'], '#%s' % a['f']))
    for r in rows('select * from %s order by id' % coll):
        i = r['id']
        r['_kind'], r['_type'] = kind, t
        r['_contacts'] = '; '.join(', '.join(x for x in (c.get('name'), c.get('position'), c.get('phone'), c.get('email')) if x) for c in by_ref(contacts, t, i)) or None
        r['_members'] = ', '.join(sorted(members.get(i, []))) or None
        r['_addendums'] = '; '.join((a.get('title') or 'Доп. соглашение') + (' — ' + a['description'] if a.get('description') else '')
                                    + (' [скан: %s]' % files.get(a['file_id'], '#%s' % a['file_id']) if a.get('file_id') else ' [без скана]') for a in by_ref(addendums, t, i)) or None
        r['_periods'] = '; '.join(fmt_period(p) for p in by_ref(periods, t, i)) or None
        r['_files'] = ', '.join(fl.get(i, [])) or None
        data.append(r)

wb = Workbook()
ws = wb.active
ws.title = 'Все договоры'
ws.append([c[0] for c in COLS])
for r in data:
    line = []
    for title, fn in COLS:
        v = fn(r)
        if v is None or v == '': line.append(None)
        elif title in DATES: line.append(ddmmyyyy(v))
        elif title in MONEY or title == 'Площадь, м²': line.append(float(v) if isinstance(v, (int, float)) else v)
        else: line.append(str(v))
    ws.append(line)
for cell in ws[1]:
    cell.font = Font(bold=True)
    cell.fill = PatternFill('solid', fgColor='E6F4FF')
    cell.alignment = Alignment(wrap_text=True, vertical='top')
for idx, (title, _) in enumerate(COLS, 1):
    letter = get_column_letter(idx)
    width = max([len(title)] + [len(str(c.value)) for c in ws[letter][1:200] if c.value is not None])
    ws.column_dimensions[letter].width = min(max(10, width + 2), 60)
    if title in MONEY or title == 'Площадь, м²':
        for c in ws[letter][1:]: c.number_format = '#,##0.00'
ws.freeze_panes = 'D2'
ws.auto_filter.ref = ws.dimensions

info = wb.create_sheet('О файле')
now = datetime.datetime.now()
for line in [['Аварийная копия договоров из NocoBase (реестр договоров)'],
             ['Сформировано', now.strftime('%d.%m.%Y %H:%M')],
             ['Всего договоров', len(data)]] + [[k, sum(1 for r in data if r['_kind'] == k)] for _, _, k, _, _ in KINDS] + [
             [], ['Одна строка — один договор. Списки (контакты, доп. соглашения, периоды цены, файлы) — через «;».'],
             ['Сами файлы (сканы) здесь не лежат — только их имена; файлы — в ночном бэкапе сервера NocoBase (uploads).']]:
    info.append(line)
info.column_dimensions['A'].width = 30
info['A1'].font = Font(bold=True)

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, 'Договоры_%s.xlsx' % now.strftime('%Y-%m-%d'))
wb.save(path + '.tmp')
os.replace(path + '.tmp', path)
shutil.copyfile(path, os.path.join(OUT, 'Договоры_последние.xlsx'))
for f in os.listdir(OUT):
    p = os.path.join(OUT, f)
    if f.startswith('Договоры_20') and now.timestamp() - os.path.getmtime(p) > 60 * 86400: os.remove(p)
print('%s ok: %d договоров -> %s' % (now.strftime('%F %T'), len(data), path))
