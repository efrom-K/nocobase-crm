#!/usr/bin/env python3
"""СКУД → CRM: забирает журнал проходов и базу карт IronLogic Guard Light с компьютера, к которому подключён контроллер,
и складывает в crm_skud_events / crm_skud_cards (раздел «Приходы» дашборда АХО).

Откуда: скрытая общая папка с C:\\ProgramData\\IronLogic\\Guard Light (только чтение, отдельная доменная учётка);
файл учётных данных smbclient — SKUD_SMB_AUTH (username=, password=, domain=). Guard Light должна быть запущена:
события из памяти контроллера в журнал пишет она.

Форматы (разобраны 05.10.2026, версия 1.0.10):
  LOGS/<контроллер>/ГГГГ_ММ_ДД.log — записи по 16 байт:
    55 00 | карта 6 байт | 04 (ключ найден) или 10 (дверь открыта) | … | месяц день час мин сек (BCD) — вход по карте;
    01 00 00 | месяц день час мин сек (BCD) | 11 00 00 | то же время — выход кнопкой (без карты: кто вышел, неизвестно).
  BASE/glbase.dbj — zlib; строки = 2 байта (длина в байтах | 0x8000) + UTF-16LE, 00 00 — пустая строка.
    Человек: номер (4 байта) + число строк N (4 байта) + N+1 строк: должность, фамилия, имя, отчество…
    Карта: 00 06 00 + карта 6 байт + 1 байт + строка-комментарий + 4 байта + номер человека (4 байта).
    У карт Em-Marine в базе после 3 байт номера идёт ещё байт, которого нет в журнале, — сравниваем по первым трём.

cron на svc:  */10 * * * * /usr/bin/python3 /home/ubuntu/nb_bik/skud_sync.py >> /home/ubuntu/nb_bik/skud.log 2>&1
    --days N — сколько последних дней журнала перечитать (по умолчанию 3; первый запуск — --days 400)
"""
import datetime, json, os, re, struct, subprocess, sys, tempfile, zlib

SHARE = os.environ.get('SKUD_SHARE', '//WS-0005/GuardLight$')
AUTH = os.environ.get('SKUD_SMB_AUTH', os.path.expanduser('~/nb_bik/.skud_smb'))
CTRL = os.environ.get('SKUD_CTRL', '25_12684')
DAYS = int(sys.argv[sys.argv.index('--days') + 1]) if '--days' in sys.argv else 3
PSQL = ['sudo', '-n', 'docker', 'exec', '-i', os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1'), 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']

def psql(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if r.returncode: sys.exit('SQL error: ' + r.stderr.decode()[:600])
    return r.stdout.decode()
def rows(sql): return json.loads(psql("select coalesce(json_agg(t), '[]'::json) from (%s) t" % sql))
def q(s): return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"

# ---------- разбор форматов Guard Light ----------
def strings_at(d, p, n):
    out = []
    for _ in range(n):
        if p + 2 > len(d): return None, p
        v = struct.unpack_from('<H', d, p)[0]
        if v == 0: out.append(''); p += 2; continue
        if not v & 0x8000 or (v & 0x7fff) > 400 or (v & 1): return None, p
        L = v & 0x7fff
        try: s = d[p + 2:p + 2 + L].decode('utf-16le')
        except UnicodeDecodeError: return None, p
        if not all(c.isprintable() for c in s): return None, p
        out.append(s); p += 2 + L
    return out, p

def parse_base(raw):
    d = zlib.decompress(raw)
    people = {}
    for i in range(0, len(d) - 10):
        uid, n = struct.unpack_from('<II', d, i)
        if not (0 < uid < 100000 and 1 <= n <= 6) or uid in people: continue
        s, _ = strings_at(d, i + 8, n + 1)
        if s and len(s[1].strip()) > 1 and s[1].strip()[0].isupper(): people[uid] = [x.strip() for x in s]
    cards = {}
    for m in re.finditer(rb'\x00\x06\x00([\x00-\xff]{6})[\x00-\xff]', d):
        s, p = strings_at(d, m.end(), 1)
        if s is None or p + 8 > len(d): continue
        uid = struct.unpack_from('<I', d, p + 4)[0]
        if uid in people: cards[m.group(1).hex()] = uid
    return people, cards

def parse_log(raw, year):
    bcd = lambda b: (b >> 4) * 10 + (b & 15)
    for i in range(0, len(raw) - 15, 16):
        r = raw[i:i + 16]
        try:
            if r[0] == 0x55 and r[8] == 0x04:
                yield 'card', r[2:8].hex(), datetime.datetime(year, bcd(r[11]), bcd(r[12]), bcd(r[13]), bcd(r[14]), bcd(r[15]))
            elif r[0] == 0x01:
                yield 'button', None, datetime.datetime(year, bcd(r[3]), bcd(r[4]), bcd(r[5]), bcd(r[6]), bcd(r[7]))
        except ValueError:
            continue   # битая запись

def card_key(card, known):
    """карта из журнала → карта из базы (Em-Marine в журнале с нулями в хвосте)"""
    if card in known: return card
    if card.endswith('000000'):
        for k in known:
            if k[:6] == card[:6]: return k
    return card

# ---------- забрать файлы ----------
tmp = tempfile.mkdtemp(prefix='skud')
today = datetime.date.today()
names = [(today - datetime.timedelta(days=k)).strftime('%Y_%m_%d') + '.log' for k in range(DAYS)]
cmds = ['get BASE\\glbase.dbj glbase.dbj'] + ['get LOGS\\%s\\%s %s' % (CTRL, n, n) for n in names]
r = subprocess.run(['smbclient', SHARE, '-A', AUTH, '-D', '', '-c', 'lcd %s; %s' % (tmp, '; '.join(cmds))], capture_output=True, text=True)
if not os.path.exists(os.path.join(tmp, 'glbase.dbj')):
    sys.exit('%s нет связи с %s: %s' % (datetime.datetime.now().isoformat(timespec='minutes'), SHARE, (r.stderr or r.stdout).strip()[:300]))

people, base_cards = parse_base(open(os.path.join(tmp, 'glbase.dbj'), 'rb').read())

# ---------- карты: обновить имена из СКУД; сотрудника CRM подставить по ФИО, если не сопоставлен вручную ----------
emps = rows("select id, last_name, first_name from crm_employees where coalesce(status, '') <> 'fired'")
norm = lambda s: (s or '').strip().lower().replace('ё', 'е')
by_name = {}
for e in emps: by_name.setdefault((norm(e['last_name']), norm(e['first_name'])), []).append(e['id'])
by_last = {}
for e in emps: by_last.setdefault(norm(e['last_name']), []).append(e['id'])
cur = {c['card']: c for c in rows("select card, employee_id, manual from crm_skud_cards")}
stmts = []
for card, uid in base_cards.items():
    p = people[uid]
    last, first = (p[1].split() + [''])[:2] if len(p) == 2 else (p[1], p[2] if len(p) > 2 else '')
    cand = by_name.get((norm(last), norm(first))) or (by_last.get(norm(last)) if not first else None) or []
    emp = cand[0] if len(cand) == 1 else None
    name = ' '.join(x for x in p[1:] if x)
    c = cur.get(card)
    if c is None:
        stmts.append("insert into crm_skud_cards(\"createdAt\",\"updatedAt\",card,skud_uid,skud_name,skud_position,employee_id,manual) values (now(),now(),%s,%s,%s,%s,%s,false);"
                     % (q(card), uid, q(name), q(p[0] if p[0] != 'Должность' else None), emp or 'NULL'))
    else:
        stmts.append("update crm_skud_cards set skud_uid=%s, skud_name=%s, skud_position=%s%s where card=%s;"
                     % (uid, q(name), q(p[0] if p[0] != 'Должность' else None), '' if c['manual'] or c['employee_id'] else ', employee_id=%s' % (emp or 'NULL'), q(card)))

# ---------- проходы ----------
n_ev, last = 0, None
for n in names:
    f = os.path.join(tmp, n)
    if not os.path.exists(f): continue
    for kind, card, at in parse_log(open(f, 'rb').read(), int(n[:4])):
        if card: card = card_key(card, base_cards)
        stmts.append("insert into crm_skud_events(\"createdAt\",\"updatedAt\",day,time,card,kind) values (now(),now(),%s,%s,%s,%s) on conflict do nothing;"
                     % (q(at.date().isoformat()), q(at.strftime('%H:%M:%S')), q(card), q(kind)))
        n_ev += 1
        last = max(last or at, at)
stmts.append("update app_settings set value=%s where name='skud_synced_at';" % q(datetime.datetime.now().isoformat(timespec='seconds')))
if last: stmts.append("update app_settings set value=greatest(coalesce(value, ''), %s) where name='skud_last_event';" % q(last.isoformat(sep=' ')))
psql('begin;\n' + '\n'.join(stmts) + '\ncommit;')
subprocess.run(['rm', '-rf', tmp])
print(datetime.datetime.now().isoformat(timespec='minutes'), 'людей в СКУД %d, карт %d, событий в журналах за %d дн.: %d, последнее %s' % (len(people), len(base_cards), DAYS, n_ev, last))
