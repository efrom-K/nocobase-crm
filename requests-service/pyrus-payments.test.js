'use strict';

const assert = require('node:assert/strict');
const { createPaymentReader } = require('./pyrus-payments');

async function main() {
  const task = { id: 7, fields: [
    { id: 1, value: { choice_names: ['На согласовании'] } },
    { id: 2, value: { values: ['Объект'] } },
    { id: 3, value: 'Ремонт' },
    { id: 9, value: 12.34 },
    { id: 12, value: '2026-11-30' }
  ] };
  let calls = 0;
  const read = createPaymentReader('login', 'key', async (url, options) => {
    calls++;
    if (url.endsWith('/auth')) return { api_url: 'https://api.pyrus.com/v4/', access_token: 'token' };
    assert.match(url, /\/forms\/2483476\/register\?include_archived=y&field_ids=1,2,3,9,12$/);
    assert.equal(options.headers.Authorization, 'Bearer token');
    return { tasks: [task, task, { id: 1, fields: [] }] };
  });
  const [result, concurrent] = await Promise.all([read(), read()]);
  assert.deepEqual(result, [
    { id: 7, purpose: 'Ремонт', object: 'Объект', amount: 12.34, due: '2026-11-30', status: 'На согласовании' },
    { id: 1, purpose: '', object: '', amount: null, due: '', status: '' }
  ]);
  assert.deepEqual(concurrent, result);
  assert.deepEqual(await read(), result);
  assert.equal(calls, 2);
  const invalid = createPaymentReader('login', 'key', async () => ({ api_url: 'https://example.org/', access_token: 'token' }));
  await assert.rejects(invalid, /Unexpected Pyrus authorization/);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
