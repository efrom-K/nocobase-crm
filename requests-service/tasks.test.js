'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createTaskActions } = require('./tasks');

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function setup(status = 'done') {
  const writes = [];
  const task = {id: 8, status, title: 'Test', author_id: 2, executor_id: 3, controller_id: 4, observers: [{id: 5}]};
  const api = createTaskActions({
    ApiError, q: JSON.stringify,
    list: async collection => ({crm_tasks: [task], users: [{id: 6, nickname: 'Test user'}], attachments: []})[collection],
    nb: async (_method, path, data) => { writes.push({path, data}); }
  });
  return {run: (id, action, input) => api({id, name: 'Test'}, {id: 8, action, ...input}), writes};
}

test('only the task author can add observers or reassign after submission', async () => {
  const {run, writes} = setup();
  for (const actor of [3, 4, 5, 7]) {
    await assert.rejects(run(actor, 'assign', {person: 'u6'}), {status: 403});
    await assert.rejects(run(actor, 'observe', {users: [6]}), {status: 403});
  }
  assert.equal(writes.length, 0);
  await run(2, 'observe', {users: [5, 6, 6]});
  assert.deepEqual(writes[0], {path: 'crm_tasks/8/observers:add', data: [6]});
  await run(2, 'assign', {person: 'u6'});
  assert.deepEqual(writes[3].data, {executor_id: 6, executor_name: 'Test user'});
});

test('an observer can comment but cannot write status history or link another attachment', async () => {
  const {run, writes} = setup();
  await assert.rejects(run(7, 'comment', {text: 'Hello'}), {status: 403});
  await assert.rejects(run(5, 'event', {kind: 'status', text: 'Changed'}), {status: 403});
  await assert.rejects(run(5, 'comment', {fileId: 19}), {status: 403});
  await run(5, 'comment', {text: ' Hello '});
  assert.deepEqual(writes[0].data, {task_id: 8, author_id: 5, author_name: 'Test', kind: 'comment', text: 'Hello', file_id: null});
  assert.deepEqual(writes.slice(1).map(x => x.data.user_id), [2, 3, 4]);
});

test('closed tasks reject changes to participants', async () => {
  const {run, writes} = setup('closed');
  await assert.rejects(run(2, 'observe', {users: [6]}), {status: 409});
  assert.equal(writes.length, 0);
});
