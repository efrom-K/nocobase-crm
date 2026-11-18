'use strict';

const assert = require('node:assert/strict');
const { createPyrusPayments } = require('./pyrus-payments');

async function main() {
  const task = { id: 7, fields: [
    { id: 1, value: { choice_names: ['На согласовании'] } },
    { id: 2, value: { values: ['Объект'] } },
    { id: 3, value: 'Ремонт' },
    { id: 9, value: 12.34 },
    { id: 12, value: '2026-11-30' }
  ] };
  let calls = 0;
  const read = createPyrusPayments('login', 'key', async (url, options) => {
    calls++;
    if (url.endsWith('/auth')) return { api_url: 'https://api.pyrus.com/v4/', access_token: 'token' };
    assert.match(url, /\/forms\/2483476\/register\?include_archived=y&field_ids=1,2,3,9,12$/);
    assert.equal(options.headers.Authorization, 'Bearer token');
    return { tasks: [task, task, { id: 1, fields: [] }] };
  }).readPayments;
  const [result, concurrent] = await Promise.all([read(), read()]);
  assert.deepEqual(result, [
    { id: 7, purpose: 'Ремонт', object: 'Объект', amount: 12.34, due: '2026-11-30', status: 'На согласовании' },
    { id: 1, purpose: '', object: '', amount: null, due: '', status: '' }
  ]);
  assert.deepEqual(concurrent, result);
  assert.deepEqual(await read(), result);
  assert.equal(calls, 2);
  const invalid = createPyrusPayments('login', 'key', async () => ({ api_url: 'https://example.org/', access_token: 'token' })).readPayments;
  await assert.rejects(invalid, /Unexpected Pyrus authorization/);

  let posted;
  const service = createPyrusPayments('login', 'key', async (url, options) => {
    if (url.endsWith('/auth')) return { api_url: 'https://api.pyrus.com/v4/', access_token: 'token' };
    if (url.endsWith('/catalogs/287919')) return { items: [{ item_id: 5, values: ['Объект'] }] };
    if (url.endsWith('/files/upload')) {
      assert.equal(options.body.get('file').name, 'bill.pdf');
      return { guid: '08923d83-255b-4f18-b0eb-5c4d3b9bf1d2' };
    }
    assert.match(url, /\/tasks$/);
    posted = JSON.parse(options.body);
    return { task: { id: 42 } };
  });
  const input = { purpose: ' Ремонт ', amount: '12,34', object: 5, due: '2026-12-01',
    file: { name: 'bill.pdf', data: Buffer.from('%PDF-1.4').toString('base64') } };
  await assert.rejects(service.submit({ ...input, object: 7 }, 'Сотрудник'), { status: 400 });
  await assert.rejects(service.submit({ ...input, due: '2026-02-30' }, 'Сотрудник'), { status: 400 });
  await assert.rejects(service.submit({ ...input, file: { ...input.file, data: 'YWJj' } }, 'Сотрудник'), { status: 400 });
  assert.equal(posted, undefined);
  assert.deepEqual(await service.submit(input, 'Сотрудник'), { id: 42 });
  assert.deepEqual(posted, { form_id: 2483476, fill_defaults: true, fields: [
    { id: 2, value: { item_id: 5 } }, { id: 3, value: 'Ремонт' }, { id: 9, value: 12.34 },
    { id: 12, value: '2026-12-01' }, { id: 10, value: 'Сотрудник CRM: Сотрудник' },
    { id: 11, value: [{ guid: '08923d83-255b-4f18-b0eb-5c4d3b9bf1d2' }] }
  ] });

}
main().catch(error => { console.error(error); process.exitCode = 1; });
