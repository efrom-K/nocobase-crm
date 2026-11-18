'use strict';

function paymentRows(tasks) {
  if (!Array.isArray(tasks) || tasks.length >= 20000) throw new Error('Incomplete Pyrus register');
  const rows = new Map();
  for (const task of tasks) {
    if (!Number.isSafeInteger(task.id) || task.id < 1 || !Array.isArray(task.fields)) throw new Error('Invalid Pyrus task');
    const fields = new Map(task.fields.map(field => [field.id, field.value]));
    const objects = fields.get(2);
    const status = fields.get(1);
    rows.set(task.id, {
      id: task.id,
      purpose: typeof fields.get(3) === 'string' ? fields.get(3) : '',
      object: Array.isArray(objects?.values) && typeof objects.values[0] === 'string' ? objects.values[0] : '',
      amount: Number.isFinite(fields.get(9)) ? fields.get(9) : null,
      due: typeof fields.get(12) === 'string' ? fields.get(12) : '',
      status: Array.isArray(status?.choice_names) ? status.choice_names.filter(name => typeof name === 'string').join(', ') : ''
    });
  }
  return [...rows.values()].sort((a, b) => b.id - a.id);
}

const API = 'https://api.pyrus.com/v4/';
const FORM = 2483476;
const MAX_FILE = 5 * 1024 * 1024;
class PaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function fetchPyrus(url, options) {
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Pyrus HTTP ' + response.status);
  return response.json();
}
function createPyrusPayments(login, key, fetchJson = fetchPyrus) {
  async function authorize() {
    const auth = await fetchJson('https://accounts.pyrus.com/api/v4/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, security_key: key })
    });
    if (auth.api_url !== API || typeof auth.access_token !== 'string' || !auth.access_token) {
      throw new Error('Unexpected Pyrus authorization response');
    }
    return { Authorization: 'Bearer ' + auth.access_token };
  }
  let cache, expires = 0, pending;
  let catalog, catalogExpires = 0;
  async function readPayments() {
    if (Date.now() < expires) return cache;
    if (!pending) {
      pending = (async () => {
        const headers = await authorize();
        const register = await fetchJson(API + 'forms/' + FORM + '/register?include_archived=y&field_ids=1,2,3,9,12', { headers });
        cache = paymentRows(register.tasks);
        expires = Date.now() + 60000;
        return cache;
      })().finally(() => { pending = null; });
    }
    return pending;
  }
  async function objects(headers) {
    if (Date.now() < catalogExpires) return catalog;
    const data = await fetchJson(API + 'catalogs/287919', { headers: headers || await authorize() });
    if (data.deleted || !Array.isArray(data.items)) throw new Error('Invalid Pyrus catalog');
    catalog = data.items.filter(item => !item.deleted && Number.isSafeInteger(item.item_id) && typeof item.values?.[0] === 'string')
      .map(item => ({ id: item.item_id, name: item.values[0] }));
    catalogExpires = Date.now() + 60000;
    return catalog;
  }
  async function submit(input, employee) {
    const { purpose, amount, due, object, comment = '', file } = input || {};
    const date = typeof due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(due) : null;
    if (typeof purpose !== 'string' || !purpose.trim() || purpose.length > 1000 ||
        typeof amount !== 'string' || !/^\d{1,10}(?:[.,]\d{1,2})?$/.test(amount) || Number(amount.replace(',', '.')) <= 0 ||
        !date || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== due ||
        !Number.isSafeInteger(object) || typeof comment !== 'string' || comment.length > 2000) {
      throw new PaymentError(400, 'Проверьте объект, цель расхода, сумму и срок оплаты');
    }
    if (!file || typeof file.name !== 'string' || !/^[^/\\\x00-\x1f]{1,160}\.(pdf|jpe?g|png)$/i.test(file.name) ||
        typeof file.data !== 'string' || file.data.length > Math.ceil(MAX_FILE / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)) {
      throw new PaymentError(400, 'Приложите счёт в PDF, JPEG или PNG до 5 МБ');
    }
    const bytes = Buffer.from(file.data, 'base64');
    const ext = file.name.split('.').pop().toLowerCase();
    const mime = ext === 'pdf' && bytes.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf'
      : /^jpe?g$/.test(ext) && bytes.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg'
      : ext === 'png' && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' ? 'image/png' : '';
    if (!mime || bytes.length > MAX_FILE) throw new PaymentError(400, 'Формат файла не совпадает с расширением или файл больше 5 МБ');
    const headers = await authorize();
    if (!(await objects(headers)).some(item => item.id === object)) throw new PaymentError(400, 'Выберите объект из списка');
    const upload = new FormData();
    upload.append('file', new Blob([bytes], { type: mime }), file.name);
    const attachment = await fetchJson(API + 'files/upload', { method: 'POST', headers, body: upload });
    if (typeof attachment.guid !== 'string' || !/^[\da-f-]{36}$/i.test(attachment.guid)) throw new Error('Invalid Pyrus upload response');
    const fields = [
      { id: 2, value: { item_id: object } }, { id: 3, value: purpose.trim() },
      { id: 9, value: Number(amount.replace(',', '.')) }, { id: 12, value: due },
      { id: 10, value: 'Сотрудник CRM: ' + employee + (comment.trim() ? '\n' + comment.trim() : '') },
      { id: 11, value: [{ guid: attachment.guid }] }
    ];
    try {
      const result = await fetchJson(API + 'tasks', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: FORM, fill_defaults: true, fields })
      });
      const id = result.task?.id;
      if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid Pyrus task response');
      expires = 0;
      return { id };
    } catch {
      throw new PaymentError(502, 'Pyrus не подтвердил создание. Уточните в АХО, появилась ли заявка, прежде чем отправлять её повторно');
    }
  }
  return { readPayments, objects, submit };
}

module.exports = { createPyrusPayments, PaymentError, MAX_FILE };
