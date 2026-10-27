'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeToken, readToken, apiSettings } = require('./server');
const D = require('./demo');

test('сессия: своя подпись принимается, подделка и мусор — нет', () => {
  const t = makeToken('a@b.ru');
  assert.equal(readToken(t).e, 'a@b.ru');
  const [d, s] = t.split('.');
  const other = Buffer.from(JSON.stringify({ e: 'x@y.ru', exp: Date.now() + 1e9 })).toString('base64url');
  assert.equal(readToken(other + '.' + s), null);
  assert.equal(readToken(d + '.' + 'A'.repeat(43)), null);
  assert.equal(readToken('мусор'), null);
});

test('настройки: неверная почта и пустой список отклоняются', () => {
  assert.throws(() => apiSettings({ settings: { emails: ['не почта'] } }), /Проверьте адрес/);
  assert.throws(() => apiSettings({ settings: { emails: [] } }), /хотя бы один/);
});

test('демо: арендаторы занимают ровно занятую площадь', () => {
  for (const o of D.OBJECTS) {
    const occupied = o.tenants.reduce((s, t) => s + t[1], 0);
    assert.ok(Math.abs(occupied - o.area * o.occ.at(-1) / 100) < 10, o.id);
  }
});
