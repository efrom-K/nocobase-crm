#!/usr/bin/env python3
from datetime import date
from aho_fines_import import parse_notice, plate

uin = '1' * 20
subject = f'У вас новый штраф! ({uin})'
body = f"""Найден новый штраф для госномера: Х123 ХМ 799
Постановление от 28 декабря 2025 г.
УИН: {uin}
750 ₽ 1 000 ₽
-25% до 27 января
"""
assert plate('X123 ХМ 799') == 'X123XM799'
assert parse_notice(subject, body)[:5] == (uin, 'X123XM799', date(2025, 12, 28), 1000, date(2026, 1, 27))
assert parse_notice(subject, body.replace('750 ₽ ', '').split('-25%')[0])[4:] == (None, None)
try:
    parse_notice(subject, body.replace('УИН: 1', 'УИН: 2'))
except ValueError:
    pass
else:
    raise AssertionError('mismatched UIN accepted')

from base64 import urlsafe_b64encode
from aho_fines_import import payment_link

def cta(url):
    encoded = urlsafe_b64encode(url.encode()).decode().replace('=', '~')
    return f'Перейти к оплате (https://smtp.gibdd-pay.ru/ru/go1_link_tracker?url={encoded})'

target = 'https://bip.ru/shtrafy/?vehicleCertificateNumber=1234567890&vehiclePlateNumber='
assert payment_link(cta(target), 'X123XM799').startswith(target + '%')
assert payment_link(cta(target.replace('bip.ru', 'example.org')), 'X123XM799') is None
assert payment_link('Перейти к оплате (javascript:alert(1))', 'X123XM799') is None
