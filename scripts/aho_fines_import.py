#!/usr/bin/env python3
"""Import individual fine notices. Dry run by default. IMAP settings are supplied in the environment."""
import argparse
import datetime as dt
import email
from email import policy
import imaplib
import json
import os
import re
import ssl
import subprocess
from pathlib import Path

MONTHS = 'января февраля марта апреля мая июня июля августа сентября октября ноября декабря'.split()
PLATE_LETTERS = str.maketrans('АВЕКМНОРСТУХ', 'ABEKMHOPCTYX')


def plate(value):
    return re.sub(r'\W|_', '', (value or '').upper()).translate(PLATE_LETTERS)


def parse_notice(subject, body):
    match = re.fullmatch(r'У вас новый штраф!\s*\((\d{20,25})\)', subject.strip())
    if not match:
        raise ValueError('неизвестная тема уведомления')
    uin = match[1]
    if not re.search(rf'(?m)^УИН:\s*{uin}[ \t]*$', body):
        raise ValueError('УИН в письме не совпал')
    car = plate(re.search(r'госномера:[ \t]*([^\n]+)', body, re.I)[1])
    if not re.fullmatch(r'[A-Z]\d{3}[A-Z]{2}\d{2,3}', car):
        raise ValueError('не распознан госномер')
    issued = re.search(r'Постановление от (\d{1,2}) (\w+) (\d{4})', body)
    date = dt.date(int(issued[3]), MONTHS.index(issued[2]) + 1, int(issued[1]))
    fields = re.search(r'(?m)^УИН:[^\n]*\n\s*(\d[\d \xa0\u202f]*)₽(?:[ \t\xa0]+(\d[\d \xa0\u202f]*)₽)?', body)
    sums = [int(''.join(value.split())) for value in fields.groups() if value]
    amount = max(sums)
    if amount <= 0:
        raise ValueError('неверная сумма')
    discount = re.search(r'(?m)^\s*[-−](\d{1,2})% до (\d{1,2}) (\w+)(?: (\d{4}))?', body)
    until = note = None
    if discount:
        percent, day, month, year = discount.groups()
        month = MONTHS.index(month) + 1
        until = dt.date(int(year) if year else date.year + (month < date.month), month, int(day))
        if not 0 <= (until - date).days <= 90:
            raise ValueError('неожиданный срок скидки')
        note = f'Скидка по уведомлению: {percent}% до {until:%d.%m.%Y}'
        if len(sums) == 2:
            note += f'. Со скидкой: {min(sums)} ₽.'
    elif fields[2]:
        raise ValueError('две суммы без распознанного срока скидки')
    return uin, car, date, amount, until, note


def psql(sql):
    command = ['sudo', '-n', 'docker', 'exec', '-i', 'nocobase-postgres-1', 'psql',
               '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    return subprocess.run(command, input=sql, text=True, capture_output=True, check=True).stdout


def literal(value):
    return 'NULL' if value is None else "'" + str(value).replace("'", "''") + "'"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    config = json.loads(Path(os.environ['AHO_FINES_CONFIG']).read_text())
    cars = {}
    for car in json.loads(psql('select coalesce(json_agg(t), \'[]\') from (select id, plate from crm_aho_cars) t')):
        cars.setdefault(plate(car['plate']), []).append(car['id'])
    existing = set(psql("select trim(uin) from crm_aho_fines where uin is not null").splitlines())
    counts = dict(new=0, existing=0, skipped=0, review=0)
    statements = []
    review = []
    with imaplib.IMAP4_SSL(config['host'], ssl_context=ssl.create_default_context(), timeout=30) as mailbox:
        mailbox.login(config['user'], config['password'])
        if mailbox.select('INBOX', readonly=True)[0] != 'OK':
            raise RuntimeError('Не удалось открыть входящие')
        status, messages = mailbox.uid('search', None, 'FROM', config['sender'])
        if status != 'OK':
            raise RuntimeError('IMAP-поиск завершился с ошибкой')
        for uid in messages[0].split():
            status, payload = mailbox.uid('fetch', uid, '(BODY.PEEK[])')
            if status != 'OK':
                raise RuntimeError('IMAP-чтение завершилось с ошибкой')
            message = email.message_from_bytes(next(item[1] for item in payload if isinstance(item, tuple)),
                                               policy=policy.default)
            subject = str(message.get('Subject', ''))
            sender = message.get('From')
            if (not sender or [a.addr_spec.lower() for a in sender.addresses] != [config['sender']]
                    or not subject.startswith('У вас новый штраф')):
                counts['skipped'] += 1
                continue
            try:
                body = message.get_body(preferencelist=('plain',)).get_content()
                uin, number, issued, amount, until, note = parse_notice(subject, body.replace('\r\n', '\n'))
            except (ValueError, TypeError, AttributeError):
                review.append((uid.decode(), 'не распознаны поля письма'))
                continue
            if uin in existing:
                counts['existing'] += 1
                continue
            matches = cars.get(number, [])
            if len(matches) != 1:
                review.append((uid.decode(), f'{number}: совпадений в справочнике {len(matches)}'))
                continue
            existing.add(uin)
            counts['new'] += 1
            values = ', '.join(map(literal, (matches[0], issued, uin, amount, until, note)))
            statements.append(f"""
                insert into crm_aho_fines ("createdAt", "updatedAt", car_id, issued_on, uin, amount, discount_until, note)
                select now(), now(), {values}
                where not exists (select 1 from crm_aho_fines where trim(uin) = {literal(uin)});
            """)
    if args.apply and statements:
        psql('begin; lock table crm_aho_fines in share row exclusive mode;\n' + '\n'.join(statements) + '\ncommit;')
    counts['review'] = len(review)
    for uid, reason in review:
        print(f'IMAP UID {uid}: {reason}')
    print(json.dumps(counts))


if __name__ == '__main__':
    main()
