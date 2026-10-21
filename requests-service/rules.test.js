// Проверка правил заявок: node rules.test.js (запускается и в CI). Падает — значит, правило KPI сломано.
'use strict';
const assert = require('assert');
const R = require('./rules');

const MGR = 35, KOLEDA = 12, OPDIR = 16, ACC = 14;   // управляющий, контролёры, бухгалтер
const now = new Date('2026-10-21T10:00:00Z');        // среда
const req = (x) => Object.assign({ id: 1, title: 'Течёт крыша', status: 'in_work', responsible_id: MGR, author_id: ACC, accept_mode: 'user', accept_user_id: ACC, due_date: '2026-10-28' }, x);
const as = (me, r, extra) => Object.assign({ me: me, isAdmin: false, isCtl: me === KOLEDA || me === OPDIR, depts: [], r: r, pending: [] }, extra);
const has = (ctx, a) => R.actions(ctx).indexOf(a) !== -1;

// управляющий не может сам отменить, перенести срок, передать — только запросить
{
  const c = as(MGR, req());
  ['cancel', 'due', 'assign', 'accept'].forEach(a => assert(!has(c, a), 'управляющему недоступно: ' + a));
  ['ask_cancel', 'ask_due', 'ask_assign', 'done', 'wait', 'to_dept'].forEach(a => assert(has(c, a), 'управляющему доступно: ' + a));
  assert.strictEqual(R.apply(c, 'cancel', { v2: 'дубль' }, {}, now).code, 403);
  const ask = R.apply(c, 'ask_due', { date: '2026-11-15', v2: 'ждём материалы' }, {}, now);
  assert(!ask.upd, 'запрос не меняет заявку');
  assert.deepStrictEqual([ask.approval.kind, ask.approval.payload.date, ask.approval.status], ['due', '2026-11-15', 'pending']);
  // второй такой же запрос, пока первый не решён, — нельзя
  assert(!has(as(MGR, req(), { pending: [{ kind: 'due', status: 'pending', author_id: MGR }] }), 'ask_due'));
}
// контролёр решает запрос; свой — нет; одобрение применяет перенос
{
  const ap = { id: 7, request_id: 1, kind: 'due', payload: { date: '2026-11-15' }, reason: 'ждём материалы', status: 'pending', author_id: MGR };
  const k = as(KOLEDA, req(), { pending: [ap] });
  assert(has(k, 'decide'));
  const yes = R.apply(k, 'decide', { approve: true }, {}, now, ap);
  assert.strictEqual(yes.upd.due_date, '2026-11-15');
  assert.strictEqual(yes.upd.due_moved, 1);
  assert.strictEqual(yes.decided.status, 'approved');
  const no = R.apply(k, 'decide', { approve: false }, {}, now, ap);
  assert(no.err, 'отказ без причины нельзя');
  assert(!R.apply(k, 'decide', { approve: false, v: 'нет' }, {}, now, ap).upd, 'отказ ничего не меняет');
  assert(!has(as(MGR, req(), { pending: [ap] }), 'decide'), 'управляющий не решает');
}
// контролёр, который сам ответственный, в своей заявке — обычный управляющий
{
  const c = as(KOLEDA, req({ responsible_id: KOLEDA }));
  assert(!has(c, 'cancel') && has(c, 'ask_cancel'));
  assert(!has(c, 'decide'));
}
// свою работу не принимают; принимает тот, кто попросил, или контролёр
{
  const done = req({ status: 'done' });
  assert(!has(as(MGR, done), 'accept'), 'ответственный не принимает сам');
  assert(has(as(ACC, done), 'accept'), 'автор-бухгалтер принимает');
  assert(has(as(KOLEDA, done), 'accept'), 'контролёр принимает');
  const own = req({ status: 'done', author_id: MGR, accept_mode: 'controller', accept_user_id: null });
  assert(!has(as(MGR, own), 'accept') && has(as(OPDIR, own), 'accept'));
  const back = R.apply(as(ACC, done), 'reopen', { v: 'всё ещё течёт' }, {}, now);
  assert.strictEqual(back.upd.reopen_count, 1);
}
// создание: срок по срочности, ответственный — управляющий объекта, свой выбор ответственного только у контролёра
{
  const obj = { manager_user_id: MGR, senior_user_id: KOLEDA };
  const c = R.create(as(ACC, null), { object_name: 'Бажова', kind: 'Ремонт', title: 'Свет', urgency: 'urgent', responsible_id: ACC, source: 'other' }, obj, {}, now);
  assert.strictEqual(c.values.responsible_id, MGR, 'бухгалтер не выбирает ответственного');
  assert.strictEqual(c.values.due_date, '2026-10-22', 'срочно — 1 рабочий день');
  assert.deepStrictEqual([c.values.accept_mode, c.values.accept_user_id], ['user', ACC]);
  const own = R.create(as(MGR, null), { object_name: 'Бажова', kind: 'Ремонт', title: 'Обход: трещина', source: 'inspection' }, obj, {}, now);
  assert.strictEqual(own.values.accept_mode, 'controller', 'сам себе — принимает контролёр');
  assert.strictEqual(own.values.due_date, '2026-10-28', 'обычная — 5 рабочих дней');
  assert(R.create(as(MGR, null), { object_name: 'Бажова', kind: 'Ремонт', title: 'x', source: 'order' }, obj, {}, now).err, 'поручение — только руководитель');
  const k = R.create(as(KOLEDA, null), { object_name: 'Бажова', kind: 'Ремонт', title: 'x', source: 'order', responsible_id: 46 }, obj, {}, now);
  assert.strictEqual(k.values.responsible_id, 46);
  assert.strictEqual(R.create(as(MGR, null), { object_name: 'Бажова', kind: 'Ремонт', title: 'x', source: 'phone' }, obj, {}, now).values.accept_mode, 'tenant');
}
// отдел: вернуть может отдел или контролёр; управляющий — нет
{
  const d = req({ status: 'dept', dept: 'Юридический отдел' });
  assert(has(as(10, d, { depts: ['Юридический отдел'] }), 'dept_back'));
  assert(!has(as(MGR, d), 'dept_back'));
  assert(R.apply(as(MGR, req()), 'to_dept', { v: 'Юридический отдел' }, {}, now).err, 'без описания нельзя');
  assert.strictEqual(R.apply(as(MGR, req()), 'to_dept', { v: 'Юридический отдел', v2: 'проверить претензию' }, {}, now).upd.dept_due, '2026-10-26');
}
// пауза только при ожидании арендатора
{
  const w = req({ status: 'waiting', wait_reason: R.TENANT_WAIT, waiting_since: '2026-10-18T10:00:00Z' });
  assert.strictEqual(R.apply(as(MGR, w), 'resume', {}, {}, now).upd.due_date, '2026-10-31');
  const w2 = req({ status: 'waiting', wait_reason: 'подрядчика', waiting_since: '2026-10-18T10:00:00Z' });
  assert(!R.apply(as(MGR, w2), 'resume', {}, {}, now).upd.due_date, 'ждали подрядчика — срок не сдвигается');
}
console.log('rules ok');
