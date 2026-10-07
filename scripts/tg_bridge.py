#!/usr/bin/env python3
"""Telegram-мост CRM: всё, что приходит сотруднику в колокольчик NocoBase, дублируется ему в Telegram.

Отдельных настроек по модулям нет: заявки, задачи, АХО, кадры, сроки договоров, личные сообщения и почта уже кладут
уведомления в колокольчик (notificationInAppMessages) — мост пересылает новые строки привязанным сотрудникам.

Привязка (без правок прав и интерфейса): сотрудник пишет боту рабочую почту → бот кладёт код в колокольчик владельцу этой
почты → сотрудник вводит код в боте. Чужую почту так не привязать: код видит только её владелец. /stop — отвязать.
Привязки — таблица tg_links (создаётся сама). Бот заблокирован пользователем → привязка удаляется.

Запуск: systemd-сервис crm-telegram на svc (deploy/crm-telegram.service), переменные в ~/nb_bik/tg.env (chmod 600):
    TG_TOKEN=<токен от @BotFather>
    CRM_URL=https://crm.ykinvest.ru
"""
import html, json, os, random, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

TOKEN = os.environ.get('TG_TOKEN') or sys.exit('TG_TOKEN is required')
CRM_URL = os.environ.get('CRM_URL', 'https://crm.ykinvest.ru').rstrip('/')
API = 'https://api.telegram.org/bot%s/' % TOKEN
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
CODE_TTL = 600        # код из колокольчика действует 10 минут
CODE_TRIES = 5

def log(*a): print(time.strftime('%Y-%m-%d %H:%M:%S'), *a, flush=True)

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: raise RuntimeError(r.stderr.decode()[:400])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql) or '[]')
def q(s): return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"

def tg(method, **params):
    data = urllib.parse.urlencode({k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in params.items()}).encode()
    try:
        return json.load(urllib.request.urlopen(API + method, data, timeout=40))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode() or '{}')

def say(chat, text): tg('sendMessage', chat_id=chat, text=text, parse_mode='HTML', disable_web_page_preview='true')

psql("""create table if not exists tg_links (user_id bigint primary key, chat_id bigint not null unique, linked_at timestamptz not null default now());
create table if not exists tg_state (k text primary key, v text);""")

def state(k, default=None):
    r = rows("select v from tg_state where k = %s" % q(k))
    return r[0]['v'] if r else default
def set_state(k, v): psql("insert into tg_state(k, v) values (%s, %s) on conflict (k) do update set v = excluded.v;" % (q(k), q(v)))

pending = {}   # chat_id -> {user_id, code, until, tries}; перезапуск сбрасывает — человек просто запросит код заново

def handle(msg):
    chat = msg['chat']['id']
    if msg['chat'].get('type') != 'private': return
    text = (msg.get('text') or '').strip()
    linked = rows("select user_id from tg_links where chat_id = %d" % chat)
    if text.startswith('/stop'):
        psql("delete from tg_links where chat_id = %d;" % chat)
        say(chat, 'Готово, уведомления из CRM сюда больше не приходят. Подключить снова — /start.')
        return
    if text.startswith('/start') or text.startswith('/help'):
        if linked: say(chat, 'Telegram уже подключён: сюда приходят ваши уведомления из CRM.\n/stop — отключить.')
        else: say(chat, 'Здравствуйте! Это уведомления CRM «Консалт Недвижимость».\nНапишите вашу рабочую почту — ту, что указана в CRM (например, <i>ivanov@ykinvest.ru</i>).')
        return
    p = pending.get(chat)
    if p and text.isdigit():
        if time.time() > p['until']:
            pending.pop(chat, None); say(chat, 'Код устарел. Напишите почту ещё раз — пришлю новый.'); return
        if text != p['code']:
            p['tries'] += 1
            if p['tries'] >= CODE_TRIES: pending.pop(chat, None); say(chat, 'Слишком много попыток. Напишите почту ещё раз.')
            else: say(chat, 'Код не подходит. Посмотрите колокольчик в CRM и введите код ещё раз.')
            return
        pending.pop(chat, None)
        psql("delete from tg_links where user_id = %d or chat_id = %d; insert into tg_links(user_id, chat_id) values (%d, %d);" % (p['user_id'], chat, p['user_id'], chat))
        say(chat, '✅ Подключено. Теперь сюда приходят ваши уведомления из CRM: заявки, задачи, сроки, сообщения.\n/stop — отключить.')
        log('linked user', p['user_id'])
        return
    if '@' in text and ' ' not in text:
        u = rows("select id from users where lower(email) = lower(%s) and username <> 'mail-service' limit 1" % q(text))
        if not u:
            say(chat, 'Такой почты в CRM не нашлось. Проверьте адрес или спросите администратора.'); return
        if p and time.time() < p['until'] - CODE_TTL + 60:
            say(chat, 'Код уже отправлен в колокольчик CRM — введите его. Новый можно запросить через минуту.'); return
        code = '%06d' % random.SystemRandom().randint(0, 999999)
        pending[chat] = {'user_id': u[0]['id'], 'code': code, 'until': time.time() + CODE_TTL, 'tries': 0}
        psql("""insert into "notificationInAppMessages"(id,"createdAt","updatedAt","userId","channelName",title,content,status,"receiveTimestamp",options)
values (gen_random_uuid(),now(),now(),%d,'telegram',%s,%s,'unread',(extract(epoch from now())*1000)::bigint,'{}'::json);"""
             % (u[0]['id'], q('Код для Telegram: ' + code), q('Введите его в боте, чтобы получать уведомления CRM в Telegram. Если это были не вы — просто не вводите код.')))
        say(chat, 'Отправил код в колокольчик CRM (🔔 вверху справа). Введите его сюда — он действует 10 минут.')
        return
    say(chat, 'Напишите рабочую почту из CRM, чтобы подключить уведомления.' if not linked else 'Уведомления подключены. /stop — отключить.')

def forward():
    since = state('since')
    if not since:   # первый запуск: старое не пересылаем
        set_state('since', psql("select now();").strip()); return
    msgs = rows("""select m."createdAt" as ts, m.title, m.content, m.options, l.chat_id, l.user_id, c.title as channel
from "notificationInAppMessages" m join tg_links l on l.user_id = m."userId" left join "notificationChannels" c on c.name = m."channelName"
where m."createdAt" > %s and m."channelName" <> 'telegram' order by m."createdAt" limit 200""" % q(since))
    for m in msgs:
        url = ((m.get('options') or {}).get('url') or '')
        text = ('<i>' + html.escape(m['channel']) + '</i>\n' if m.get('channel') else '') + '<b>' + html.escape(m['title'] or '') + '</b>' + ('\n' + html.escape(m['content']) if m.get('content') else '')
        kw = {'reply_markup': {'inline_keyboard': [[{'text': 'Открыть в CRM', 'url': CRM_URL + url}]]}} if url.startswith('/') else {}
        r = tg('sendMessage', chat_id=m['chat_id'], text=text[:4000], parse_mode='HTML', disable_web_page_preview='true', **kw)
        if not r.get('ok'):
            if r.get('error_code') == 403:   # бот заблокирован — отвязываем
                psql("delete from tg_links where chat_id = %d;" % m['chat_id']); log('unlinked (blocked) user', m['user_id'])
            elif r.get('error_code') == 429:
                time.sleep((r.get('parameters') or {}).get('retry_after', 5)); return   # повторим с этого же сообщения
            else: log('send failed', m['user_id'], r.get('description'))
        set_state('since', m['ts'])
    if not msgs:   # окно не отстаёт (запас 2 с на транзакции, закоммиченные чуть позже) и никогда не откатывается назад — иначе повторы
        set_state('since', psql("select greatest(%s::timestamptz, now() - interval '2 seconds');" % q(since)).strip())

offset = int(state('offset', '0'))
log('started')
while True:
    try:
        r = tg('getUpdates', offset=offset, timeout=10, allowed_updates=['message'])
        for u in r.get('result', []):
            offset = u['update_id'] + 1
            if 'message' in u: handle(u['message'])
        if r.get('result'): set_state('offset', str(offset))
        forward()
    except Exception as e:   # сеть, БД — подождать и продолжить
        log('error', repr(e)[:300]); time.sleep(10)
