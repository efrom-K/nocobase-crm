'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function helper({ objects = [], allowed = true, create, list } = {}) {
  const calls = { creates: [], lists: [], changed: 0 };
  const context = {
    window: { dispatchEvent: () => { calls.changed++; } },
    document: { createEvent: () => ({ initEvent() {} }) },
    localStorage: { getItem: () => 'session' },
    fetch: async () => ({ ok: true, json: async () => ({ data: { roles: [{ name: allowed ? 'rental_dept' : 'hr' }] } }) }),
    ctx: { api: { resource: name => {
      assert.equal(name, 'contract_objects');
      return {
        list: async args => { calls.lists.push(args); return list ? list() : { data: { data: objects } }; },
        create: async args => {
          calls.creates.push(args);
          if (create) return create(args);
          const object = { id: 10, name: args.values.name };
          objects.push(object);
          return { data: { data: object } };
        }
      };
    } } }
  };
  vm.runInNewContext(fs.readFileSync('src/_crm-objects.js', 'utf8'), context);
  return { api: context.window.__crmObjects, calls };
}

async function main() {
  const h = helper();
  const created = await h.api.create('  Новый   объект  ');
  assert.equal(created.object.name, 'Новый объект');
  assert.equal(h.calls.creates.length, 1);
  assert.deepEqual(Object.keys(h.calls.creates[0].values), ['name']);
  assert.equal(h.calls.changed, 1);
  assert.equal(h.calls.lists[0].paginate, false);
  const reused = await h.api.create('НОВЫЙ\tОБЪЕКТ');
  assert.equal(reused.existing, true);
  assert.equal(reused.object.id, created.object.id);
  assert.equal(h.calls.creates.length, 1);
  await assert.rejects(h.api.create('   '), /название/);
  await assert.rejects(h.api.create('x'.repeat(256)), /255/);
  assert.equal(h.calls.creates.length, 1);

  const denied = helper({ allowed: false });
  await assert.rejects(denied.api.create('Нельзя'), /прав/);
  assert.equal(denied.calls.creates.length, 0);
  assert.equal(denied.calls.lists.length, 0);

  let reads = 0;
  const raced = helper({
    list: () => ({ data: { data: ++reads === 1 ? [] : [{ id: 27, name: 'Тот же объект' }] } }),
    create: () => { throw new Error('unique constraint'); }
  });
  const winner = await raced.api.create('ТОТ  ЖЕ ОБЪЕКТ');
  assert.equal(winner.object.id, 27);
  assert.equal(winner.existing, true);
  assert.equal(raced.calls.creates.length, 1);

  const failed = helper({ create: () => { throw new Error('permission'); } });
  await assert.rejects(failed.api.create('Новый'), /Не удалось добавить/);
  const unreadable = helper({ list: () => ({ data: null }) });
  await assert.rejects(unreadable.api.list(), /загрузить/);

  const source = fs.readFileSync('src/contract-modals.js', 'utf8');
  const start = source.indexOf('function validateElement(el, strict) {');
  const end = source.indexOf('\nfunction showFieldState(el)', start);
  assert(start > 0 && end > start);
  const validation = { FIELD_RULES: {}, dateProblem: () => '', normalizeValue: (_n, v) => v, validateValue: () => '' };
  vm.runInNewContext(source.slice(start, end) + '\nthis.validateElement = validateElement;', validation);
  const el = { value: 'Объект', type: 'text', style: {}, getAttribute: () => 'object_name', closest: () => null };
  assert.match(validation.validateElement(el, false), /загрузки/);
  el.__cmObjectState = 'error';
  assert.match(validation.validateElement(el, false), /повторить/);
  el.__cmObjectState = 'ready'; el.__cmObjectNames = ['Объект'];
  assert.equal(validation.validateElement(el, false), '');
  el.value = 'Опечатка';
  assert.match(validation.validateElement(el, false), /выберите/);
  el.value = '';
  assert.match(validation.validateElement(el, false), /выберите/);
  el.closest = () => ({});
  assert.equal(validation.validateElement(el, false), '');
  assert.match(validation.validateElement(el, true), /выберите/);
  console.log('objects: creation, permissions, duplicates/race, failures and contract validation passed');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
