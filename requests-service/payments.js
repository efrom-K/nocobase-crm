'use strict';

const { DatabaseSync } = require('node:sqlite');
const MAX_FILE = 5 * 1024 * 1024;
const STATUS = {
  0: 'Не выбрано',
  2: 'Согласование Гл. управляющим',
  3: 'Согласование начальством',
  4: 'Оплата бухгалтером',
  5: 'Закрывающие документы',
  6: 'Оплачено / Закрыто'
};
const FILE_LABELS = { 11: 'Счёт', 19: 'Платёжное поручение', 21: 'Акт / накладная / счёт-фактура', 22: 'Дополнения', 23: 'Вложение к сообщению' };
class PaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new PaymentError(400, 'Проверьте поля заявки');
  return value.trim();
}
function attachment(file, kind) {
  if (!file || typeof file.name !== 'string' || !/^[^/\\\x00-\x1f]{1,160}\.(pdf|jpe?g|png)$/i.test(file.name)
      || typeof file.data !== 'string' || file.data.length > Math.ceil(MAX_FILE / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)) {
    throw new PaymentError(400, 'Приложите документ в PDF, JPEG или PNG до 5 МБ');
  }
  const bytes = Buffer.from(file.data, 'base64');
  const ext = file.name.split('.').pop().toLowerCase();
  const valid = ext === 'pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
    : ext === 'png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
      : bytes.subarray(0, 3).toString('hex') === 'ffd8ff';
  if (!valid || bytes.length > MAX_FILE) throw new PaymentError(400, 'Формат документа не совпадает с расширением или размер больше 5 МБ');
  return { name: file.name, kind, bytes };
}
function createPayments(filename, { clock = () => new Date().toISOString() } = {}) {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS payment_routes (id INTEGER PRIMARY KEY, route TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, legacy_id INTEGER UNIQUE, record TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payment_files (id INTEGER PRIMARY KEY, payment_id INTEGER NOT NULL REFERENCES payments(id), kind INTEGER NOT NULL, name TEXT NOT NULL, bytes BLOB NOT NULL);`);
  const read = db.prepare('SELECT id,record FROM payments WHERE id=?');
  const unpack = row => row && { ...JSON.parse(row.record), id: row.id };
  const isParticipant = (r, user) => r.authorId === user.id || r.subscribers?.includes(user.id) || Object.values(r.route).some(id => id === user.id);
  const canRead = (r, user) => !user.readOnly && (user.isAdmin || user.isAho || isParticipant(r, user));
  const get = (id, user) => {
    const r = unpack(read.get(id));
    if (!r || !canRead(r, user)) throw new PaymentError(404, 'Заявка не найдена');
    return r;
  };
  const insert = db.prepare('INSERT INTO payments(legacy_id,record) VALUES(?,?)');
  const insertFile = db.prepare('INSERT INTO payment_files(payment_id,kind,name,bytes) VALUES(?,?,?,?)');
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function pending(r) {
    if (r.status === 2) return [['senior', r.route.senior]];
    if (r.status === 3) return [['approver', r.route.approver], ['chief', r.route.chief]].filter(([role]) => !r.approved.includes(role));
    if (r.status === 4 || r.status === 5) return [['accountant', r.route.accountant]];
    return [];
  }
  function allowed(r, user) { return pending(r).filter(([, id]) => id === user.id); }
  function summary(r, user) {
    return { id:r.id, legacyId:r.legacyId, purpose:r.purpose, object:r.object, counterparty:r.counterparty, amount:r.amount,
      due:r.due, status:r.status, created:r.created, author:r.author, needsAction:allowed(r,user).length > 0 };
  }
  const objects = () => db.prepare('SELECT id,route FROM payment_routes ORDER BY id').all()
    .map(row => ({id:row.id, name:JSON.parse(row.route).name})).sort((a,b) => a.name.localeCompare(b.name, 'ru'));
  function submit(user, input) {
    const {object, amount, due, file} = input || {};
    const routeRow = Number.isSafeInteger(object) && db.prepare('SELECT route FROM payment_routes WHERE id=?').get(object);
    const date = typeof due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(due) : null;
    if (!routeRow || typeof amount !== 'string' || !/^\d{1,10}(?:[.,]\d{1,2})?$/.test(amount) || Number(amount.replace(',', '.')) <= 0
        || !date || !Number.isFinite(+date) || date.toISOString().slice(0,10) !== due) throw new PaymentError(400,'Проверьте объект, сумму и срок оплаты');
    const {name, ...route} = JSON.parse(routeRow.route);
    const bill = attachment(file, 11);
    const now = clock();
    const r = { object:name, route, due, amount:Number(amount.replace(',', '.')), status:2, approved:[],
      purpose:text(input.purpose,1000,true), counterparty:text(input.counterparty,300,true),
      contact:text(input.contact ?? '',300), phone:text(input.phone ?? '',100), email:text(input.email ?? '',300),
      comment:text(input.comment ?? '',2000), authorId:user.id, author:user.name, created:now,
      history:[{date:now, author:user.name, text:'Подана заявка'}] };
    return transaction(() => {
      const id = Number(insert.run(null, JSON.stringify(r)).lastInsertRowid);
      insertFile.run(id,bill.kind,bill.name,bill.bytes);
      return { id, pending:[route.senior] };
    });
  }
  function act(user, id, input) {
    if (!input || !Number.isSafeInteger(input.status)) throw new PaymentError(400, 'Обновите карточку заявки');
    return transaction(() => {
      const r = get(id,user);
      if (input.status !== r.status) throw new PaymentError(409,'Заявка уже изменилась. Обновите карточку');
      const roles = allowed(r,user);
      if (!roles.length) throw new PaymentError(403,'Действие доступно текущему согласующему');
      const note = text(input.comment ?? '',2000);
      const kind = r.status === 4 ? 19 : r.status === 5 ? 21 : 0;
      if (input.file) {
        if (!kind) throw new PaymentError(400,'Платёжные документы добавляет бухгалтер');
        const file = attachment(input.file,kind);
        insertFile.run(id,file.kind,file.name,file.bytes);
      }
      if (input.extra) {
        if (r.status !== 5) throw new PaymentError(400,'Дополнения доступны на этапе закрывающих документов');
        const file = attachment(input.extra,22);
        insertFile.run(id,file.kind,file.name,file.bytes);
      }
      const action = {2:'Согласовано старшим управляющим',3:'Согласовано',4:'Оплата подтверждена',5:'Закрывающие документы проверены'};
      const oldStatus = r.status;
      if (oldStatus === 3) {
        r.approved.push(...roles.map(([role]) => role));
        if (r.approved.includes('approver') && r.approved.includes('chief')) r.status = 4;
      } else r.status++;
      r.localUpdated = true;
      r.history.push({date:clock(), author:user.name, text:action[oldStatus] + (note ? ': ' + note : '')});
      db.prepare('UPDATE payments SET record=? WHERE id=?').run(JSON.stringify(r),id);
      const next = r.status === oldStatus ? [] : pending(r).map(([,person]) => person);
      return {id, status:r.status, pending:next, authorId:r.authorId};
    });
  }
  const canManage = (r,user) => user.isAdmin && !user.readOnly && r.status >= 2 && r.status <= 5;
  function manage(user,id,input,employees) {
    return transaction(() => {
      const r = get(id,user);
      if (!canManage(r,user)) throw new PaymentError(403,'Управлять открытой заявкой может администратор');
      if (!input || input.status !== r.status || input.revision !== r.history.length) {
        throw new PaymentError(409,'Заявка уже изменилась. Обновите карточку');
      }
      const reason = text(input.comment ?? '',2000,true);
      let event, recipients = [];
      if (input.action === 'assign') {
        const current = pending(r).find(([role]) => role === input.role);
        const employee = employees.find(x => x.id === input.userId);
        if (!current || !employee || employee.id === current[1]) throw new PaymentError(400,'Выберите действующего сотрудника и ожидающий этап');
        r.route[input.role] = employee.id;
        event = 'Передано: ' + employee.name;
        recipients = [employee.id];
      } else if (input.action === 'due') {
        const due = input.due;
        const date = typeof due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(due) : null;
        if (!date || !Number.isFinite(+date) || date.toISOString().slice(0,10) !== due || due === r.due) {
          throw new PaymentError(400,'Укажите новый срок оплаты');
        }
        event = 'Срок перенесён: ' + (r.due || '—') + ' → ' + due;
        r.due = due;
        recipients = [...pending(r).map(([,person]) => person), r.authorId];
      } else if (input.action === 'return') {
        if (!Number.isSafeInteger(input.stage) || input.stage < 2 || input.stage >= r.status || r.status >= 5) {
          throw new PaymentError(400,'Возврат доступен на предыдущий этап согласования до подтверждения оплаты');
        }
        r.status = input.stage;
        r.approved = [];
        event = 'Возврат на этап: ' + STATUS[r.status];
        recipients = pending(r).map(([,person]) => person);
      } else throw new PaymentError(400,'Выберите действие');
      r.localUpdated = true;
      r.history.push({date:clock(), author:user.name, text:event + '. ' + reason});
      db.prepare('UPDATE payments SET record=? WHERE id=?').run(JSON.stringify(r),id);
      return {id,status:r.status,pending:recipients,message:event};
    });
  }
  function discuss(user,id,input,employees) {
    return transaction(() => {
      const r = get(id,user);
      const subscribers = new Set(r.subscribers || []);
      let event, recipients;
      if (input.action === 'message') {
        const message = text(input.comment ?? '',2000,!input.file);
        const file = input.file && attachment(input.file,23);
        const fileId = file && Number(insertFile.run(id,file.kind,file.name,file.bytes).lastInsertRowid);
        event = {text:message, fileId};
        recipients = [r.authorId, ...subscribers, ...pending(r).map(([,person]) => person)];
      } else if (['watch-add','watch-remove'].includes(input.action)) {
        if (!user.isAdmin) throw new PaymentError(403,'Наблюдающих меняет администратор');
        const adding = input.action === 'watch-add';
        const employee = employees.find(x => x.id === input.userId);
        if (!Number.isSafeInteger(input.userId) || input.userId <= 0 || adding === subscribers.has(input.userId)
            || (adding && (!employee || isParticipant(r,{id:input.userId})))) {
          throw new PaymentError(400,'Выберите сотрудника для изменения списка наблюдающих');
        }
        if (adding) subscribers.add(input.userId);
        else subscribers.delete(input.userId);
        r.subscribers = [...subscribers];
        event = {text:(adding ? 'Добавлен наблюдающий: ' : 'Удалён наблюдающий: ') + (employee?.name || '№ ' + input.userId)};
        recipients = adding ? [input.userId] : [];
      } else throw new PaymentError(400,'Выберите действие');
      r.localUpdated = true;
      r.history.push({date:clock(),author:user.name,...event});
      db.prepare('UPDATE payments SET record=? WHERE id=?').run(JSON.stringify(r),id);
      return {id,status:r.status,pending:recipients,message:input.action === 'message' ? 'Новое сообщение в заявке' : 'Вы добавлены наблюдающим'};
    });
  }
  function detail(id,user) {
    const r = get(id,user);
    return { ...summary(r,user), contact:r.contact, phone:r.phone, email:r.email, comment:r.comment,
      history:r.history, subscribers:[...new Set(r.subscribers || [])], observerExclusions:user.isAdmin ? [r.authorId, ...Object.values(r.route), ...(r.subscribers || [])] : undefined,
      canWatch:!!user.isAdmin, canManage:canManage(r,user), revision:r.history.length, awaiting:pending(r).map(([role, id]) => ({role,id})),
      files:db.prepare('SELECT id,kind,name FROM payment_files WHERE payment_id=? ORDER BY id').all(id) };
  }
  function file(id,fileId,user) {
    get(id,user);
    const f = db.prepare('SELECT name,bytes FROM payment_files WHERE payment_id=? AND id=?').get(id,fileId);
    if (!f) throw new PaymentError(404,'Файл не найден');
    return f;
  }
  function loadSnapshot(routes, records) {
    return transaction(() => {
      const insertRoute = db.prepare('INSERT INTO payment_routes VALUES(?,?)');
      const byLegacy = db.prepare('SELECT id,record FROM payments WHERE legacy_id=?');
      const update = db.prepare('UPDATE payments SET record=? WHERE id=?');
      const deleteFiles = db.prepare('DELETE FROM payment_files WHERE payment_id=?');
      db.exec('DELETE FROM payment_routes');
      for (const {id,...route} of routes) insertRoute.run(id,JSON.stringify(route));
      let added = 0, updated = 0;
      for (const {files,...r} of records) {
        const existing = unpack(byLegacy.get(r.legacyId));
        if (existing && existing.legacyVersion === r.legacyVersion) continue;
        if (existing?.localUpdated) throw new Error('Payment changed in both systems: ' + r.legacyId);
        const packed = JSON.stringify(r);
        const id = existing?.id ?? Number(insert.run(r.legacyId,packed).lastInsertRowid);
        if (existing) {
          update.run(packed,id);
          deleteFiles.run(id);
          updated++;
        } else added++;
        for (const f of files) insertFile.run(id,f.kind,f.name,f.bytes);
      }
      return { added, updated, imported:db.prepare('SELECT count(*) AS n FROM payments WHERE legacy_id IS NOT NULL').get().n,
        files:db.prepare('SELECT count(*) AS n FROM payment_files').get().n, routes:routes.length };
    });
  }
  return { objects, submit, act, manage, discuss, detail, file, loadSnapshot,
    browse(user) { return db.prepare('SELECT id,record FROM payments ORDER BY id DESC').all().map(unpack)
      .filter(r => canRead(r,user)).sort((a,b) => String(b.created || '').localeCompare(String(a.created || '')) || b.id - a.id)
      .map(r => summary(r,user)); } };
}
module.exports = { createPayments, PaymentError, MAX_FILE, STATUS, FILE_LABELS };
