#!/usr/bin/env python3
# Тестовые заявки по объектам (решение владельца 23.10: реальных заявок нет, система тестируется).
# Печатает SQL: очищает ТОЛЬКО таблицы заявок (object_requests, request_events, request_approvals,
# request_notifications, portal_links) и заливает разнообразную историю — все статусы, источники, срочности,
# переносы и запросы, отделы, возвраты, эскалации, оценки. Тексты событий — как у requests-service/rules.js
# и scripts/request_reminders.py, поля заявки согласованы с историей. Не демо: система работает с ними как с живыми.
# Запуск на svc:  python3 seed_requests_test.py > /tmp/seed.sql && docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase -v ON_ERROR_STOP=1 < /tmp/seed.sql
# Почта арендатора у заявок пустая — письма реальным арендаторам не уходят.
import datetime as dt, json, sys

NOW = dt.datetime(2026, 10, 23, 7, 30, tzinfo=dt.timezone.utc)   # 10:30 МСК — момент заливки
if len(sys.argv) > 1: NOW = dt.datetime.fromisoformat(sys.argv[1])
MSK = dt.timedelta(hours=3)
URG = {'normal': (5, 24, 'Обычная'), 'urgent': (1, 4, 'Срочно'), 'emergency': (0, 1, 'Авария')}   # дней на решение, часов на реакцию
SRC = {'portal': 'Портал арендатора', 'phone': 'Звонок или письмо арендатора', 'inspection': 'Обход, своя находка', 'order': 'Поручение руководства', 'dept': 'От отдела', 'other': 'Другое'}
TENANT_WAIT = 'ответа арендатора'
ESCALATE, AUTO_CLOSE, DEPT_DAYS = 3, 3, 3
KOLEDA, OPDIR = 12, 16
# объект → (управляющий, старший)
OBJ = {'Байкальская': (34, 12), 'Щелково': (39, 31), 'Матросская Тишина': (45, 31), 'Софрино': (46, 12), 'Сергиев Посад': (12, 12),
       'Ибрагимова': (45, 31), 'Митрополье': (46, 12), 'Волковское, 36': (35, 12), 'Есипово': (31, 31), 'Правдинский': (46, 12),
       'Бажова': (35, 12), 'Мытищинская': (None, None), 'Мячково': (31, 31), 'Нахабино': (35, 12), 'Подрезово': (35, 12), 'Хлебозаводская': (12, 12)}
# договоры арендаторов (rental_contracts): id → (объект, арендатор)
RC = {24: ('Софрино', 'ООО "СК БЕГЕМОТ"'), 20: ('Софрино', 'ООО "ААВ МОНОЛИТ"'), 9: ('Софрино', 'ООО "НОВАЯ ФОРМУЛА"'), 8: ('Софрино', 'ООО "АЛЬФАТЕКС НПЦ"'),
      7: ('Софрино', 'ООО ПСО "СПЕКТР"'), 25: ('Софрино', 'ООО "МАККА"'), 6: ('Софрино', 'ООО "ГОРИН"'), 15: ('Софрино', 'ИП Чагин Кирилл Александрович'),
      38: ('Митрополье', 'ИП Коваль Денис Русланович'), 37: ('Митрополье', 'ООО "КРОМА-ПРОФИЛЬ"'), 34: ('Митрополье', 'ООО "ТСЦ ЗАПЛАТКА"'),
      2: ('Правдинский', 'ИП Рагозин Михаил Вячеславович'), 1: ('Правдинский', 'ООО "ПРИРОДНЫЙ ЦЕОЛИТ ЗЕОДЕТОКС"'), 5: ('Правдинский', 'ИП Плотников Евгений Леонидович'),
      41: ('Бажова', 'ИП Шавлюгин Василий Михайлович'), 44: ('Бажова', 'ООО "СМ ИНЖЕНИРИНГ"'), 43: ('Бажова', 'ИП Богомаз Елена Валентиновна'),
      49: ('Щелково', 'ООО "ГЕОМЕТРИЯ МЕБЕЛЬ ЭКСПО"'), 47: ('Щелково', 'ООО "ПРОИЗВОДСТВО ДЕКОРАЦИЙ"'), 46: ('Щелково', 'ООО "РУС-ТЕЛЕТОТ"'),
      28: ('Есипово', 'ООО "СИМПЛЭКСПО"'), 32: ('Есипово', 'ООО "ТД ЭРАПЛИТ"'), 29: ('Есипово', 'ООО "УПАКОВОЧНЫЕ ПОЛИМЕРЫ"')}
DEPT_USER = {'Юридический отдел': 28, 'Отдел Бухгалтерского/Управленческого учета': 14, 'Административно хозяйственный отдел': 33, 'Отдел аренды': 15}

def ru(d): return d.strftime('%d.%m.%Y')
def add_work_days(t, n):   # как rules.addWorkDays (по дате UTC, только выходные)
    d = t.date()
    while d.weekday() >= 5: d += dt.timedelta(days=1)
    i = 0
    while i < n:
        d += dt.timedelta(days=1)
        if d.weekday() < 5: i += 1
    return d
def runs(a, b):   # запуски напоминаний (09:00 МСК, будни) в интервале (a, b]
    d = a.date()
    while True:
        t = dt.datetime(d.year, d.month, d.day, 6, 0, tzinfo=dt.timezone.utc)
        if t > b: return
        if t > a and t.weekday() < 5: yield t
        d += dt.timedelta(days=1)

class Req:
    def __init__(s, rid, days, hour, obj, src, author, kind, urg, title, desc, contract=None, contact=None, resp=None):
        s.id = rid
        s.t0 = (NOW - dt.timedelta(days=days)).replace(hour=hour - 3, minute=(rid * 7) % 60, second=0, microsecond=0)
        if s.t0 > NOW: s.t0 = NOW - dt.timedelta(minutes=40)
        assert not contract or RC[contract][0] == obj, (rid, contract, obj)
        mgr, senior = OBJ[obj]
        s.senior = senior
        s.f = dict(object_name=obj, contract_id=contract, tenant_label=RC[contract][1] if contract else None, kind=kind, urgency=urg,
                   title=title, description=desc, status='new', source=src, demo=False, due_moved=0, reopen_count=0,
                   responsible_id=resp or mgr or senior or author, author_id=author if src != 'portal' else None,
                   contact_name=contact[0] if contact else None, contact_phone=contact[1] if contact else None, contact_email=None)
        d, r, l = URG[urg]
        s.f['due_date'] = add_work_days(s.t0, d)
        s.f['react_due_at'] = s.t0 + dt.timedelta(hours=r)
        me = author
        if src in ('portal', 'phone'): s.f['accept_mode'], s.f['accept_user_id'] = 'tenant', None
        elif me != s.f['responsible_id']: s.f['accept_mode'], s.f['accept_user_id'] = 'user', me
        else: s.f['accept_mode'], s.f['accept_user_id'] = 'controller', None
        s.ev, s.ap, s.t = [], [], s.t0
        if src == 'portal':
            s.e('create', None, 'Заявка подана арендатором на портале · срок %s по срочности «%s»' % (ru(s.f['due_date']), l), 'public')
        else:
            note = '' if mgr else ' (у объекта не указан управляющий с учёткой)'
            s.e('create', author, 'Заявка создана · %s · срок %s по срочности «%s»%s' % (SRC[src], ru(s.f['due_date']), l, note))
        s.done_by = None
    def at(s, h): s.t = s.t0 + dt.timedelta(hours=h); return s
    def e(s, kind, who, text, vis='internal'):
        s.ev.append((s.t, who, kind, text, vis))
        return s
    def tenant_mode(s): return s.f['accept_mode'] == 'tenant'
    # ---- действия (тексты — как rules.js) ----
    def take(s, h, who=None):
        s.at(h); s.f.update(status='in_work', taken_at=s.t)
        return s.e('status', who or s.f['responsible_id'], 'Взята в работу')
    def wait(s, h, why, who=None):
        s.at(h); s.f.update(status='waiting', wait_reason=why, waiting_since=s.t)
        return s.e('status', who or s.f['responsible_id'], 'Ждём ' + why + (' — срок на паузе' if why == TENANT_WAIT else ''))
    def resume(s, h, who=None):
        s.at(h); text = 'Снова в работе'
        if s.f.get('wait_reason') == TENANT_WAIT:
            days = int((s.t - s.f['waiting_since']).total_seconds() // 86400)
            if days > 0:
                s.f['due_date'] += dt.timedelta(days=days)
                text += ' · срок сдвинут на %d дн. (ждали арендатора): %s' % (days, ru(s.f['due_date']))
        s.f.update(status='in_work', wait_reason=None, waiting_since=None)
        return s.e('status', who or s.f['responsible_id'], text)
    def to_dept(s, h, dept, what, who=None):
        s.at(h); dd = add_work_days(s.t, DEPT_DAYS)
        if s.f['due_date'] >= s.t.date() and s.f['due_date'] < dd: dd = s.f['due_date']
        s.f.update(status='dept', dept=dept, dept_user_id=None, dept_since=s.t, dept_due=dd)
        return s.e('dept', who or s.f['responsible_id'], 'Передана в отдел «%s» (срок отдела %s): %s' % (dept, ru(dd), what))
    def dept_back(s, h, what):
        s.at(h); d = s.f['dept']
        s.f.update(status='in_work', dept=None, dept_user_id=None, dept_since=None, dept_due=None)
        return s.e('dept', DEPT_USER[d], 'Отдел «%s» вернул управляющему: %s' % (d, what))
    def done(s, h, what, who=None):
        s.at(h); s.done_by = who or s.f['responsible_id']
        s.f.update(status='done', result=what, done_at=s.t, wait_reason=None, waiting_since=None)
        return s.e('status', s.done_by, 'Решена: ' + what)   # действия сотрудников — внутренние события (арендатор видит статус заявки)
    def accept(s, h, who=None, rating=None, note=None):
        s.at(h); s.f.update(status='closed', closed_at=s.t)
        if who is None and s.tenant_mode():   # принял арендатор на портале
            if rating: s.f.update(rating=rating, rating_note=note)
            return s.e('status', None, 'Работа принята, заявка закрыта' + (' · оценка %d из 5' % rating if rating else '') + (': ' + note if note else ''), 'public')
        return s.e('status', who or s.f['accept_user_id'] or KOLEDA, 'Работа принята, заявка закрыта')
    def reopen(s, h, why, who=None):
        s.at(h); s.f.update(status='in_work', done_at=None, reopen_count=s.f['reopen_count'] + 1)
        if who is None and s.tenant_mode(): return s.e('status', None, 'Работа не принята, возвращена в работу: ' + why, 'public')
        return s.e('status', who or s.f['accept_user_id'] or KOLEDA, 'Не принята, возвращена в работу: ' + why)
    def comment(s, h, who, text, public=False):
        s.at(h); return s.e('comment', who, text, 'public' if public else 'internal')
    def ask(s, h, kind, reason, decide_h=None, by=KOLEDA, yes=True, note=None, date=None, user=None):
        s.at(h); me = s.f['responsible_id']
        payload = {'date': date.isoformat()} if kind == 'due' else {'user_id': user} if kind == 'assign' else {}
        what = 'перенести срок на ' + ru(date) if kind == 'due' else 'передать другому (%s)' % NAMES.get(user, '#%s' % user) if kind == 'assign' else 'отменить заявку'
        s.e('ask', me, 'Запрос: %s — %s' % (what, reason))
        ap = dict(request_id=s.id, kind=kind, payload=payload, reason=reason, status='pending', author_id=me, createdAt=s.t, decided_by=None, decided_at=None, decision_note=None)
        s.ap.append(ap)
        if decide_h is not None:
            s.at(decide_h); ap.update(status='approved' if yes else 'rejected', decided_by=by, decided_at=s.t, decision_note=note)
            if yes: s.change(kind, payload, reason, note or 'одобрено', by)
            else: s.e('ask', by, 'Отказано: %s — %s' % (what, note))
        return s
    def change(s, kind, p, reason, note, by):
        extra = ' (решение: %s)' % note if note else ''
        if kind == 'due':
            old = s.f['due_date']; s.f['due_date'] = dt.date.fromisoformat(p['date']); s.f['due_moved'] += 1; s.f['escalated_at'] = None
            return s.e('due', by, 'Срок перенесён с %s на %s: %s%s' % (ru(old), ru(s.f['due_date']), reason, extra))
        if kind == 'assign':
            s.f['responsible_id'] = p['user_id']; s.f['escalated_at'] = None
            return s.e('assign', by, 'Передана другому ответственному: %s%s' % (reason, extra))
        s.f.update(status='cancelled', closed_at=s.t, result=reason)
        return s.e('status', by, 'Отменена: %s%s' % (reason, extra))
    def boss(s, h, kind, reason, by=KOLEDA, date=None, user=None):   # контролёр сам — сразу
        s.at(h); return s.change(kind, {'date': date.isoformat()} if date else {'user_id': user} if user else {}, reason, None, by)
    # ---- что за это время сделал бы скрипт напоминаний (request_reminders.py) ----
    def reminders(s):
        evs = sorted(s.ev, key=lambda e: e[0])
        def state_at(t):   # статус и срок на момент t — по событиям
            st, due, dept_due, dept = 'new', None, None, None
            for e in evs:
                if e[0] > t: break
                x = e[3]
                if x.startswith('Взята в работу') or x.startswith('Снова в работе') or 'возвращена в работу' in x or x.startswith('Отдел «'): st = 'in_work'
                elif x.startswith('Ждём'): st = 'waiting'
                elif x.startswith('Передана в отдел'): st = 'dept'
                elif x.startswith('Решена'): st = 'done'
                elif x.startswith('Работа принята') or x.startswith('Отменена'): st = 'closed'
            return st
        end = s.f.get('closed_at') or NOW
        react, taken = s.f['react_due_at'], s.f.get('taken_at')
        for t in runs(react, min(taken or NOW, NOW)):
            if state_at(t) == 'new':
                s.ev.append((t, None, 'system', 'Не взята в работу вовремя — сообщено старшему управляющему', 'internal')); break
        due = s.f['due_date']
        if s.f['status'] in ('new', 'in_work', 'waiting', 'dept') or (s.f.get('done_at') and s.f['done_at'].date() > due):
            stop = s.f.get('done_at') or end
            for t in runs(NOW - dt.timedelta(days=120), min(stop, NOW)):
                if (t.date() - due).days >= ESCALATE and state_at(t) in ('new', 'in_work', 'waiting', 'dept'):
                    s.ev.append((t, None, 'system', 'Эскалация старшему управляющему: просрочка %d дн.' % (t.date() - due).days + ('' if s.senior else ' (у объекта не указан старший управляющий с учёткой)'), 'internal'))
                    s.f['escalated_at'] = t
                    break
        if s.f['status'] == 'dept' and s.f['dept_due'] < NOW.date():
            for t in runs(dt.datetime.combine(s.f['dept_due'], dt.time(7), dt.timezone.utc), NOW):
                late = (t.date() - s.f['dept_due']).days
                if late >= 1 and not any(e[3].startswith('Отдел просрочил') for e in s.ev):
                    s.ev.append((t, None, 'system', 'Отдел просрочил: «%s», срок отдела %s' % (s.f['dept'], ru(s.f['dept_due'])), 'internal'))
                elif late >= ESCALATE and not any(e[3].startswith('Эскалация: отдел') for e in s.ev):
                    s.ev.append((t, None, 'system', 'Эскалация: отдел «%s» просрочил на %d дн.' % (s.f['dept'], late), 'internal'))
        if s.f['status'] == 'done':
            first = next((t for t in runs(s.f['done_at'], NOW) if (t.date() - s.f['done_at'].date()).days >= AUTO_CLOSE), None)
            if first and s.tenant_mode():   # арендатор не ответил — автозакрытие
                s.f.update(status='closed', closed_at=first)
                s.ev.append((first, None, 'system', 'Закрыта автоматически: работу не проверили за %d дн.' % AUTO_CLOSE, 'internal'))
            elif first:
                s.ev.append((first, None, 'system', 'Напоминание о приёмке: %d дн. без проверки' % (first.date() - s.f['done_at'].date()).days, 'internal'))
        # о просрочке уже напоминали (как сделал бы скрипт в первый день просрочки) — иначе первый прогон пришлёт всё разом
        s.f['reminded_on'] = min(due + dt.timedelta(days=1), NOW.date()) if s.f['status'] in ('new', 'in_work', 'waiting', 'dept') and due < NOW.date() else None

NAMES = {12: 'Алексей Коледа', 16: 'Игорь Панкратьев', 31: 'Виталий Ермолин', 34: 'Сергей Котов', 35: 'Александр Кривицкий', 39: 'Александр Одинцов', 45: 'Игорь Фалеев', 46: 'Даниял Хомяков', 27: 'Сергей Бузин', 38: 'Сергей Новиков'}
R = []
def add(*a, **k): r = Req(len(R) + 1, *a, **k); R.append(r); return r
REM, ORD, ACC, LAW, AHO = 'Ремонт и эксплуатация', 'Поручение', 'Платёж, долг, штраф', 'Расторжение и выезд', 'Проверка, пожарная безопасность'
Q, UT, PR = 'Вопрос арендатора', 'Коммуналка, счётчики', 'Прочее'

# ===== Котов (Байкальская) — образцовый: быстро берёт, всё в срок =====
add(62, 10, 'Байкальская', 'inspection', 34, REM, 'normal', 'Заменить светильники на лестнице 2 этажа', 'Три светильника не горят, на обходе.').take(0.3).done(26, 'Заменены 3 светильника LED').accept(30, KOLEDA)
add(48, 11, 'Байкальская', 'order', KOLEDA, AHO, 'urgent', 'Проверить огнетушители перед проверкой МЧС', 'Проверка на следующей неделе, нужен акт.').take(0.5).done(3, 'Проверены 14 шт., 2 перезаряжены, акт в папке').accept(5)
add(33, 9, 'Байкальская', 'inspection', 34, REM, 'normal', 'Протечка кровли над складом №3', 'Пятно на потолке после дождя.').take(0.2).wait(4, 'подрядчика').resume(50).done(70, 'Кровельщик заделал швы, 4 м²').accept(75, KOLEDA)
add(20, 14, 'Байкальская', 'dept', 21, ACC, 'normal', 'Сверить показания электросчётчиков за сентябрь', 'Расхождение с поставщиком 1200 кВт·ч.').take(1).done(28, 'Показания сняты, расхождение — ошибка поставщика, письмо отправлено').accept(29)
add(9, 10, 'Байкальская', 'inspection', 34, REM, 'urgent', 'Не закрывается ворота рампы №2', 'Сломан доводчик.').take(0.4).done(5, 'Заменён доводчик').accept(8, KOLEDA)
add(2, 12, 'Байкальская', 'order', OPDIR, PR, 'normal', 'Подготовить фото фасада для рекламы', 'Нужно 10 фото, солнечная погода.').take(0.5).comment(3, 34, 'Сниму в пятницу, обещают солнце')

# ===== Одинцов (Щелково) — хорошо, но бывает просрочка =====
add(55, 10, 'Щелково', 'phone', 39, REM, 'normal', 'Не работает отопление в офисе 12', 'Батареи холодные с утра.', contract=49, contact=('Сергей, офис-менеджер', '+7 916 204-33-10')).take(1).done(30, 'Стравлен воздух из стояка, батареи горячие').accept(100, None, 5, 'Спасибо, быстро')
add(41, 15, 'Щелково', 'portal', None, Q, 'normal', 'Нужна копия акта приёма-передачи', 'Для бухгалтерии.', contract=47, contact=('Исаев', '+7 925 118-40-02')).take(3, 39).to_dept(4, 'Отдел аренды', 'Подготовить заверенную копию акта').dept_back(52, 'Копия готова, передана на ресепшен').done(53, 'Копия акта у администратора').accept(70, None, 4, None)
add(27, 9, 'Щелково', 'inspection', 39, REM, 'normal', 'Трещина в асфальте у въезда', 'Растёт, опасно для фур.').take(2).wait(5, 'оплаты').resume(140).done(200, 'Заливка выполнена')   # решена с опозданием
add(13, 11, 'Щелково', 'portal', None, UT, 'urgent', 'Счёт за воду выставлен дважды', 'В октябре два счёта за один период.', contract=46, contact=('Юденкова', '+7 903 771-12-98')).take(1, 39).to_dept(2, 'Отдел Бухгалтерского/Управленческого учета', 'Проверить задвоение счёта').dept_back(20, 'Дубль сторнирован').done(21, 'Лишний счёт аннулирован').accept(30, None, 5, None)
add(6, 13, 'Щелково', 'dept', 28, LAW, 'normal', 'Уведомление о расторжении — осмотр помещения 8', 'Арендатор съезжает 31.10, нужен осмотр.').take(2).wait(4, TENANT_WAIT).comment(5, 39, 'Жду от арендатора удобное время осмотра')
add(1, 9, 'Щелково', 'portal', None, REM, 'emergency', 'Течёт труба в санузле', 'Вода на полу, перекрыли кран.', contract=49, contact=('Сергей', '+7 916 204-33-10')).take(0.4, 39).comment(0.5, 39, 'Сантехник выехал, будет через час', True).comment(0.7, None, 'Ждём', True)

# ===== Фалеев (Матросская, Ибрагимова) — медленная реакция, просрочки, возвраты =====
add(58, 10, 'Матросская Тишина', 'order', KOLEDA, REM, 'normal', 'Покрасить ограждение парковки', 'К осенней проверке.').take(30).done(190, 'Покрашено 60 м').reopen(195, 'Покрашено не всё, задняя часть осталась', KOLEDA).done(260, 'Докрашена задняя часть').accept(262, KOLEDA)
add(44, 12, 'Ибрагимова', 'inspection', 45, REM, 'urgent', 'Не работает домофон на входе', 'Арендаторы жалуются.').take(9).wait(10, 'подрядчика').resume(100).done(130, 'Заменена панель домофона').accept(140, KOLEDA)
add(30, 10, 'Матросская Тишина', 'dept', 33, AHO, 'normal', 'Заменить аптечки на этажах', 'Срок годности истёк.').take(50).done(260, 'Аптечки заменены').reopen(262, 'Заменили только на 1 этаже', 33).comment(263, 45, 'Остальные привезут на неделе')
add(19, 9, 'Ибрагимова', 'order', OPDIR, PR, 'normal', 'Собрать предложения по охране объекта', 'Три коммерческих предложения.').take(40).ask(60, 'due', 'Подрядчики не прислали КП', 61, OPDIR, True, 'Последний перенос', date=(NOW - dt.timedelta(days=8)).date())
add(10, 15, 'Матросская Тишина', 'inspection', 45, REM, 'normal', 'Отслоилась плитка на крыльце', 'Опасно в гололёд.')   # не взята в работу
add(4, 11, 'Ибрагимова', 'order', KOLEDA, AHO, 'urgent', 'Освободить эвакуационный выход 2 этажа', 'Заставлен коробками.').take(7).comment(8, KOLEDA, 'Фото после — в чат, сегодня')

# ===== Хомяков (Софрино, Митрополье, Правдинский) — много арендаторов, запросы на перенос =====
add(60, 11, 'Софрино', 'portal', None, REM, 'normal', 'Не работает освещение в боксе 4', 'Половина ламп.', contract=24, contact=('Бегемот, Андрей', '+7 926 555-01-11')).take(2, 46).done(28, 'Заменён автомат и лампы').accept(40, None, 5, 'Отлично')
add(52, 10, 'Софрино', 'portal', None, UT, 'normal', 'Пересчитать электроэнергию за август', 'Начислено по старому тарифу.', contract=20, contact=('Монолит, бухгалтер', '+7 499 300-22-11')).take(3, 46).to_dept(4, 'Отдел Бухгалтерского/Управленческого учета', 'Пересчитать по новому тарифу').dept_back(120, 'Пересчитано, корректировочный счёт выставлен').done(121, 'Корректировочный счёт в личном кабинете').accept(130, None, 3, 'Долго')
add(45, 14, 'Софрино', 'phone', 46, REM, 'urgent', 'Прорвало трубу в боксе 7', 'Вода на полу.', contract=9, contact=('Новая формула', '+7 915 100-20-30')).take(0.5).done(6, 'Заменён участок трубы').accept(30, None, 4, None)
add(38, 9, 'Митрополье', 'portal', None, Q, 'normal', 'Можно ли поставить вывеску на фасад', 'Размер 3×1 м.', contract=38, contact=('Коваль Денис', '+7 977 410-50-50')).take(5, 46).to_dept(6, 'Юридический отдел', 'Согласовать размещение вывески по договору').dept_back(75, 'По договору можно, нужен эскиз').wait(76, TENANT_WAIT).comment(76.2, 46, 'Пришлите, пожалуйста, эскиз вывески', True).comment(170, None, 'Эскиз во вложении к письму', True).resume(171).done(172, 'Согласовано, можно монтировать').accept(200, None, 5, None)
add(34, 12, 'Правдинский', 'portal', None, REM, 'normal', 'Протекает кондиционер в переговорной', 'Капает на пол.', contract=1, contact=('Зеодетокс, офис', '+7 903 120-77-66')).take(1, 46).ask(20, 'due', 'Ждём запчасть дренажной помпы', 22, KOLEDA, True, None, date=(NOW - dt.timedelta(days=25)).date()).done(200, 'Заменена дренажная помпа').accept(205, None, 4, None)
add(26, 10, 'Софрино', 'portal', None, PR, 'normal', 'Шлагбаум не открывается по пульту', 'Пульты не работают у всех сотрудников.', contract=8, contact=('Альфатекс', '+7 916 777-80-81')).take(4, 46).done(6, 'Перепрошит приёмник шлагбаума').reopen(30, 'Опять не открывается')
add(24, 16, 'Софрино', 'inspection', 46, REM, 'normal', 'Засор ливнёвки у бокса 2', 'Вода стоит после дождя.').take(0.5).wait(2, 'подрядчика').ask(60, 'due', 'Подрядчик на объекте только через неделю', 62, KOLEDA, False, 'Найдите другого подрядчика', date=(NOW + dt.timedelta(days=2)).date())
add(17, 11, 'Митрополье', 'portal', None, UT, 'urgent', 'Нет горячей воды', 'С утра.', contract=37, contact=('Крома-профиль', '+7 925 909-01-02')).take(2, 46).done(9, 'Перезапущен бойлер').accept(20, None, 5, None)
add(12, 10, 'Правдинский', 'phone', 46, ACC, 'normal', 'Арендатор просит рассрочку долга', 'Долг за 2 месяца.', contract=5, contact=('Плотников', '+7 926 323-40-50')).take(3).to_dept(4, 'Отдел Бухгалтерского/Управленческого учета', 'Подготовить график рассрочки')   # отдел держит
add(8, 12, 'Софрино', 'portal', None, Q, 'normal', 'Пропуск для нового сотрудника', 'Фамилия: Петров.', contract=25, contact=('Макка', '+7 999 202-30-40')).take(1, 46).done(3, 'Пропуск выдан').accept(4, None, 5, 'Спасибо!')
add(5, 9, 'Митрополье', 'portal', None, REM, 'normal', 'Скрипит рольставня бокса 11', 'Тяжело поднимается.', contract=34, contact=('Заплатка', '+7 916 111-22-33')).take(26, 46).wait(28, TENANT_WAIT).comment(28.2, 46, 'Когда можно попасть в бокс? Нужен доступ мастеру', True)
add(3, 15, 'Софрино', 'portal', None, PR, 'normal', 'Уборка снега с крыши — заранее', 'Просим включить в график.', contract=6, contact=('Горин', '+7 903 444-55-66')).take(2, 46).ask(3, 'cancel', 'Сезонная уборка уже в договоре, отдельная заявка не нужна', date=None)
add(1, 16, 'Правдинский', 'portal', None, REM, 'urgent', 'Не работает лифт', 'Грузовой лифт стоит на 2 этаже.', contract=2, contact=('Рагозин', '+7 905 600-70-80'))   # новая, реакция ещё идёт
add(0.2, 9, 'Софрино', 'portal', None, REM, 'emergency', 'Искрит розетка в боксе 9', 'Отключили автомат.', contract=15, contact=('Чагин', '+7 916 300-10-20'))   # авария, не взята

# ===== Кривицкий (Волковское, Бажова, Нахабино, Подрезово) — эскалации, висят просрочки =====
add(57, 10, 'Волковское, 36', 'inspection', 35, REM, 'normal', 'Отремонтировать забор по периметру', 'Секция повалена.').take(20).done(300, 'Секция восстановлена').accept(310, KOLEDA)
add(40, 11, 'Бажова', 'portal', None, REM, 'normal', 'Протекает крыша над офисом', 'После каждого дождя.', contract=41, contact=('Шавлюгин', '+7 926 909-80-70')).take(30, 35).wait(31, 'подрядчика').resume(250).done(400, 'Кровля отремонтирована').reopen(420, 'Снова течёт после ливня').comment(421, 35, 'Кровельщик приедет повторно')
add(29, 9, 'Нахабино', 'order', KOLEDA, AHO, 'urgent', 'Устранить замечания пожарной инспекции', '5 пунктов по предписанию.').take(10).ask(30, 'due', 'Нужна закупка материалов', 32, KOLEDA, True, 'Перенос на неделю', date=(NOW - dt.timedelta(days=15)).date())
add(23, 13, 'Подрезово', 'inspection', 35, REM, 'normal', 'Сломан замок ворот склада', 'Ворота на цепи.').take(5).ask(10, 'assign', 'Это зона охраны, не моя', 12, KOLEDA, False, 'Ваш объект — ваша заявка', user=27)
add(15, 10, 'Бажова', 'phone', 35, ACC, 'normal', 'Арендатор оспаривает штраф за парковку', 'Говорит, что машина не его.', contract=44, contact=('СМ Инжиниринг', '+7 495 200-30-40')).take(6).to_dept(7, 'Юридический отдел', 'Оценить основания штрафа').dept_back(50, 'Штраф обоснован, есть фото').wait(51, TENANT_WAIT)
add(11, 11, 'Волковское, 36', 'order', OPDIR, PR, 'normal', 'Подготовить план работ на зиму', 'Список и бюджет.').take(48)
add(7, 14, 'Нахабино', 'inspection', 35, REM, 'urgent', 'Не работает наружное освещение парковки', 'Темно с 17:00.').take(30)
add(2, 10, 'Подрезово', 'dept', 14, ACC, 'normal', 'Акт сверки с арендатором склада 3', 'Нужна подпись арендатора.').take(1).wait(2, 'другое')

# ===== Ермолин (Есипово, Мячково; старший) — отделы, средне =====
add(50, 10, 'Есипово', 'portal', None, UT, 'normal', 'Неверные показания газового счётчика', 'Начислено в 2 раза больше.', contract=28, contact=('Симплэкспо', '+7 495 500-60-70')).take(4, 31).to_dept(5, 'Отдел Бухгалтерского/Управленческого учета', 'Проверить показания и тариф').dept_back(60, 'Ошибка в показаниях, перерасчёт').done(61, 'Перерасчёт выставлен').accept(80, None, 4, None)
add(36, 12, 'Мячково', 'inspection', 31, REM, 'normal', 'Покосился навес над входом', 'Сорван крепёж.').take(3).done(100, 'Навес закреплён').accept(110, KOLEDA)
add(22, 9, 'Есипово', 'portal', None, LAW, 'normal', 'Хотим расторгнуть договор досрочно', 'С 01.12.', contract=32, contact=('Эраплит', '+7 916 800-90-00')).take(2, 31).to_dept(3, 'Юридический отдел', 'Условия досрочного расторжения по договору').dept_back(70, 'Уведомление за 2 мес., штраф 1 мес. аренды').done(71, 'Условия направлены арендатору').accept(160, None, 3, 'Условия не устраивают, но спасибо за ответ')
add(14, 15, 'Мячково', 'dept', 33, AHO, 'normal', 'Обновить схемы эвакуации', 'Перепланировка 1 этажа.').take(20).to_dept(21, 'Административно хозяйственный отдел', 'Заказать печать новых схем').comment(22, 33, 'Заказ в типографии, готовность 5 дней')
add(6, 10, 'Есипово', 'portal', None, REM, 'normal', 'Не работает вентиляция в цехе', 'Душно, работать невозможно.', contract=29, contact=('Упаковочные полимеры', '+7 926 101-01-01')).take(5, 31).wait(6, 'подрядчика')
add(0.4, 9, 'Мячково', 'inspection', 31, REM, 'normal', 'Разбито окно в подсобке', 'Найдено на обходе.')

# ===== Коледа (Сергиев Посад, Хлебозаводская) как управляющий + объект без управляющего =====
add(46, 10, 'Сергиев Посад', 'inspection', 12, REM, 'normal', 'Осмотр кровли после зимы', 'Плановый.').take(1).done(30, 'Осмотрено, замечаний нет').accept(31, OPDIR)
add(21, 12, 'Хлебозаводская', 'order', OPDIR, PR, 'urgent', 'Встреча с потенциальным арендатором', 'Показать 2 этаж.').take(0.5).done(5, 'Показали, ждём решения').accept(6)
add(9, 9, 'Хлебозаводская', 'inspection', 12, REM, 'normal', 'Замена ламп в коридоре', 'Мигают.').take(1).boss(2, 'cancel', 'Дубль: лампы уже меняют по плановой заявке', OPDIR)
add(16, 10, 'Мытищинская', 'other', 3, PR, 'normal', 'Уточнить, кто управляет объектом', 'Нет управляющего в CRM.').boss(1, 'assign', 'Назначаю старшему', KOLEDA, user=12).take(2, 12).done(30, 'Временно ведёт Коледа').accept(31, OPDIR)

# ===== на приёмке, в отделе, ждут решения — чтобы были видны все шаги =====
add(4, 10, 'Софрино', 'portal', None, REM, 'normal', 'Подтекает кран в санузле бокса 5', 'Капает постоянно.', contract=7, contact=('Спектр', '+7 926 404-50-60')).take(1, 46).done(30, 'Заменён картридж смесителя')   # ждёт приёмки арендатором
add(3, 11, 'Бажова', 'portal', None, Q, 'normal', 'Нужна справка об аренде для банка', 'Для открытия счёта.', contract=43, contact=('Богомаз Елена', '+7 915 707-08-09')).take(2, 35).to_dept(3, 'Отдел аренды', 'Подготовить справку на бланке').dept_back(26, 'Справка подписана').done(27, 'Справка у администратора, оригинал')
add(5, 12, 'Нахабино', 'order', KOLEDA, AHO, 'normal', 'Проверить работу пожарной сигнализации', 'Ежеквартально.').take(3).done(22, 'Проверено, 2 датчика заменены')   # ждёт приёмки Коледой
add(2, 9, 'Щелково', 'portal', None, ACC, 'normal', 'Прошу акт сверки за 3 квартал', 'Для аудита.', contract=47, contact=('Исаев', '+7 925 118-40-02')).take(1, 39).to_dept(2, 'Отдел Бухгалтерского/Управленческого учета', 'Сформировать акт сверки за 3 кв.')   # в отделе, срок не прошёл
add(4, 15, 'Есипово', 'inspection', 31, REM, 'urgent', 'Отошла облицовка фасада', 'Может упасть.').take(1).ask(20, 'due', 'Нужна вышка, аренда только с понедельника', date=(NOW + dt.timedelta(days=4)).date())   # запрос ждёт решения
add(1, 14, 'Митрополье', 'phone', 46, Q, 'normal', 'Арендатор просит доп. место на парковке', 'На 2 машины.', contract=38, contact=('Коваль Денис', '+7 977 410-50-50')).take(1).ask(2, 'assign', 'Парковки ведёт отдел аренды', user=38)

for r in R: r.reminders()

# ---------- SQL ----------
def q(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, dt.datetime): return "'%s'" % v.isoformat()
    if isinstance(v, dt.date): return "'%s'" % v.isoformat()
    if isinstance(v, (dict, list)): return "'%s'::json" % json.dumps(v, ensure_ascii=False).replace("'", "''")
    return "'%s'" % str(v).replace("'", "''")
out = ['BEGIN;', 'TRUNCATE object_requests, request_events, request_approvals, request_notifications RESTART IDENTITY;',
       'DELETE FROM portal_links WHERE demo IS NOT TRUE;']   # демо-ссылки (постоянная тестовая ссылка портала) переживают перезаливку
cols = ['id', 'createdAt', 'updatedAt', 'object_name', 'contract_id', 'tenant_label', 'kind', 'title', 'description', 'urgency', 'due_date', 'status', 'wait_reason', 'responsible_id', 'author_id',
        'result', 'due_moved', 'done_at', 'closed_at', 'reminded_on', 'escalated_at', 'demo', 'source', 'accept_mode', 'accept_user_id', 'react_due_at', 'taken_at', 'waiting_since',
        'dept', 'dept_user_id', 'dept_since', 'dept_due', 'reopen_count', 'rating', 'rating_note', 'contact_name', 'contact_email', 'contact_phone']
for r in R:
    f = dict(r.f, id=r.id, createdAt=r.t0, updatedAt=max(e[0] for e in r.ev))
    assert all(r.t0 <= e[0] <= NOW for e in r.ev), (r.id, [(e[0], e[3]) for e in r.ev if not r.t0 <= e[0] <= NOW])
    out.append('INSERT INTO object_requests (%s) VALUES (%s);' % (','.join('"%s"' % c for c in cols), ','.join(q(f.get(c)) for c in cols)))
    for e in sorted(r.ev, key=lambda e: e[0]):
        out.append('INSERT INTO request_events ("createdAt",request_id,author_id,kind,text,visibility) VALUES (%s,%d,%s,%s,%s,%s);' % (q(e[0]), r.id, q(e[1]), q(e[2]), q(e[3]), q(None if e[2] == 'system' else e[4])))
    for a in r.ap:
        out.append('INSERT INTO request_approvals ("createdAt","updatedAt",request_id,kind,payload,reason,status,author_id,decided_by,decided_at,decision_note) VALUES (%s,%s,%d,%s,%s,%s,%s,%d,%s,%s,%s);'
                   % (q(a['createdAt']), q(a['decided_at'] or a['createdAt']), r.id, q(a['kind']), q(a['payload']), q(a['reason']), q(a['status']), a['author_id'], q(a['decided_by']), q(a['decided_at']), q(a['decision_note'])))
out += ["SELECT setval('object_requests_id_seq', (SELECT max(id) FROM object_requests));", 'COMMIT;']
print('\n'.join(out))
sys.stderr.write('заявок %d, событий %d, запросов %d\n' % (len(R), sum(len(r.ev) for r in R), sum(len(r.ap) for r in R)))
