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

function createPaymentReader(login, key, fetchJson = async (url, options) => {
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Pyrus HTTP ' + response.status);
  return response.json();
}) {
  let cache, expires = 0, pending;
  return async function readPayments() {
    if (Date.now() < expires) return cache;
    if (!pending) {
      pending = (async () => {
        const auth = await fetchJson('https://accounts.pyrus.com/api/v4/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, security_key: key })
        });
        if (auth.api_url !== 'https://api.pyrus.com/v4/' || typeof auth.access_token !== 'string' || !auth.access_token) {
          throw new Error('Unexpected Pyrus authorization response');
        }
        const register = await fetchJson(auth.api_url + 'forms/2483476/register?include_archived=y&field_ids=1,2,3,9,12', {
          headers: { Authorization: 'Bearer ' + auth.access_token }
        });
        cache = paymentRows(register.tasks);
        expires = Date.now() + 60000;
        return cache;
      })().finally(() => { pending = null; });
    }
    return pending;
  };
}

module.exports = { createPaymentReader };
