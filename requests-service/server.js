// Сервис заявок по объектам: все изменения заявок идут только через него (у ролей сотрудников на заявки — только чтение).
// Кто пришёл — по сессии NocoBase (как почтовый сервис), что можно — rules.js, записывает служебная учётка requests-service.
//   GET  /acts            — что текущему пользователю можно по каждой открытой заявке + запросы на решение
//   POST /create {...}    — новая заявка (срок и ответственный — по правилам)
//   POST /act {id, a,...} — действие по заявке
//   POST /object-person {id, field, user_id} — управляющий / старший управляющий объекта (на нём строится KPI, поэтому только контролёр и админ)
'use strict';
const http = require('http');
const R = require('./rules');

const env = process.env;
const PORT = Number(env.PORT) || 8097;
const NB_URL = (env.NB_URL || '').replace(/\/$/, '');
const ORIGINS = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const PAGE = '/admin/j3a32zo1jzo';
const CTL_ROLE = 'requests_control';   // роль «Контроль заявок»: главный управляющий, операционный директор
if (!NB_URL || !env.NB_SERVICE_USER || !env.NB_SERVICE_PASSWORD) { console.error('Нужны NB_URL, NB_SERVICE_USER, NB_SERVICE_PASSWORD'); process.exit(1); }

class ApiError extends Error { constructor(status, message, field) { super(message); this.status = status; this.field = field; } }

// ---------- NocoBase ----------
let svcToken = null;
async function nb(method, pathName, body) {   // запрос служебной учёткой
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!svcToken) {
      const r = await fetch(NB_URL + '/api/auth:signIn', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Authenticator': 'basic' },
        body: JSON.stringify({ account: env.NB_SERVICE_USER, password: env.NB_SERVICE_PASSWORD }) });
      const j = await r.json().catch(() => null);
      svcToken = j && j.data && j.data.token;
      if (!svcToken) throw new ApiError(502, 'Сервис заявок не смог войти в CRM');
    }
    const r = await fetch(NB_URL + '/api/' + pathName, { method: method, headers: { 'Content-Type': 'application/json', 'X-Authenticator': 'basic', Authorization: 'Bearer ' + svcToken },
      body: body === undefined ? undefined : JSON.stringify(body) });
    if (r.status === 401) { svcToken = null; continue; }
    const nt = r.headers.get('x-new-token'); if (nt) svcToken = nt;
    const j = await r.json().catch(() => null);
    if (!r.ok) { console.error('nb', method, pathName, r.status, JSON.stringify(j).slice(0, 300)); throw new ApiError(502, 'CRM не приняла изменение'); }
    return j && j.data;
  }
  throw new ApiError(502, 'Сервис заявок не смог войти в CRM');
}
const q = (o) => encodeURIComponent(JSON.stringify(o));
const list = (coll, params) => nb('GET', coll + ':list?paginate=false' + (params || ''));

// кто пришёл: сессия NocoBase пользователя
const tokenCache = new Map();
async function whoami(token) {
  if (!token) return null;
  const c = tokenCache.get(token);
  if (c && c.exp > Date.now()) return c;
  let u = null;
  try {
    const r = await fetch(NB_URL + '/api/auth:check', { headers: { Authorization: 'Bearer ' + token, 'X-Authenticator': 'basic' } });
    if (r.ok) { const j = await r.json(); u = j && j.data; }
  } catch (e) { u = null; }
  if (!u || !u.id) { tokenCache.delete(token); return null; }
  const roles = (u.roles || []).map(x => x.name);
  const v = { id: u.id, isAdmin: roles.includes('admin') || roles.includes('root'), isCtl: roles.includes(CTL_ROLE), exp: Date.now() + 60000 };
  tokenCache.set(token, v);
  if (tokenCache.size > 500) for (const [k, x] of tokenCache) if (x.exp < Date.now()) tokenCache.delete(k);
  return v;
}

// справочники: люди, контролёры, отделы сотрудников, настройки — раз в минуту
const ref = { at: 0 };
async function refs() {
  if (Date.now() - ref.at < 60000) return ref;
  const [users, emps, cfgRows] = await Promise.all([
    list('users', '&fields=' + ['id', 'nickname', 'username'].join(',') + '&appends=' + ['roles'].join(',')),
    list('crm_employees', '&fields=' + ['user_id', 'department', 'fired_on'].join(',')),
    list('crm_config', '&filter=' + q({ key: { $in: ['requests.urgency', 'requests.deptDays'] } }))
  ]);
  ref.names = {}; ref.ctl = [];
  (users || []).forEach(u => { ref.names[u.id] = u.nickname || u.username; if ((u.roles || []).some(x => x.name === CTL_ROLE)) ref.ctl.push(u.id); });
  ref.depts = {};   // user_id → [отделы]
  ref.deptUsers = {};   // отдел → [user_id]
  (emps || []).forEach(e => {
    if (!e.user_id || !e.department || e.fired_on) return;
    (ref.depts[e.user_id] = ref.depts[e.user_id] || []).push(e.department);
    (ref.deptUsers[e.department] = ref.deptUsers[e.department] || []).push(e.user_id);
  });
  const c = {}; (cfgRows || []).forEach(x => { c[x.key] = x.value; });
  ref.cfg = { urgency: c['requests.urgency'] || null, deptDays: c['requests.deptDays'] };
  ref.at = Date.now();
  return ref;
}
function ctxFor(user, rf, r, pending) {
  return { me: user.id, isAdmin: user.isAdmin, isCtl: user.isCtl, depts: rf.depts[user.id] || [], r: r, pending: pending || [], userName: id => rf.names[id] || '#' + id };
}

async function notify(ids, r, text, me) {
  if (r.demo) return;   // демо-заявки (проверки) никого не будят
  const seen = new Set();
  for (const id of ids) {
    const n = Number(id);
    if (!n || n === Number(me) || seen.has(n)) continue;
    seen.add(n);
    await nb('POST', 'request_notifications:create', { user_id: n, title: ('Заявка №' + r.id + ' · ' + r.object_name).slice(0, 250), text: String(text).slice(0, 1000), url: PAGE + '?open=req:' + r.id })
      .catch(e => console.error('notify', e.message));   // уведомление не должно ломать действие
  }
}
async function event(r, me, kind, text, fileId) {
  return nb('POST', 'request_events:create', { request_id: r.id, author_id: me, kind: kind, text: text || '', file_id: fileId || null, visibility: 'internal' });
}

// ---------- обработчики ----------
async function acts(user) {
  const rf = await refs();
  const [reqs, aps] = await Promise.all([
    list('object_requests', '&fields=' + ['id', 'status', 'responsible_id', 'author_id', 'accept_mode', 'accept_user_id', 'dept', 'dept_user_id'].join(',') + '&filter=' + q({ status: { $in: R.OPEN.concat(['done']) } })),
    list('request_approvals', '&filter=' + q({ status: 'pending' }))
  ]);
  const out = {};
  (reqs || []).forEach(r => { out[r.id] = R.actions(ctxFor(user, rf, r, (aps || []).filter(p => Number(p.request_id) === r.id))); });
  return { me: { isCtl: user.isCtl, isAdmin: user.isAdmin, depts: rf.depts[user.id] || [] }, acts: out, pending: aps || [] };
}
async function create(user, body) {
  const rf = await refs();
  const objs = await list('contract_objects', '&filter=' + q({ name: body.object_name || '' }));
  const res = R.create(ctxFor(user, rf, null), body, (objs || [])[0] || null, rf.cfg, new Date());
  if (res.err) throw new ApiError(400, res.err, res.field);
  if (body.demo && user.isAdmin) res.values.demo = true;
  const rec = await nb('POST', 'object_requests:create', res.values);
  await event(rec, user.id, 'create', res.event + (body.file_id ? ', приложен файл' : ''), Number(body.file_id) || null);
  for (const n of res.notify) await notify([n[0]], rec, n[1], user.id);
  return { id: rec.id };
}
async function act(user, body) {
  const rf = await refs();
  const r = await nb('GET', 'object_requests:get?filterByTk=' + Number(body.id));
  if (!r) throw new ApiError(404, 'Заявка не найдена');
  const pending = await list('request_approvals', '&filter=' + q({ request_id: r.id, status: 'pending' }));
  const ap = body.a === 'decide' ? (pending || []).find(p => p.id === Number(body.approval_id)) : null;
  const ctx = ctxFor(user, rf, r, pending);
  const res = R.apply(ctx, body.a, body, rf.cfg, new Date(), ap);
  if (res.err) throw new ApiError(res.code || 400, res.err, res.field);
  if (res.upd) await nb('POST', 'object_requests:update?filterByTk=' + r.id, res.upd);
  if (res.approval) await nb('POST', 'request_approvals:create', res.approval);
  if (res.decided) await nb('POST', 'request_approvals:update?filterByTk=' + res.decided.id, res.decided);
  for (const e of res.events) await event(r, user.id, e[0], e[1], e[2]);
  const after = Object.assign({}, r, res.upd || {});
  for (const n of res.notify) await notify([n[0]], after, n[1], user.id);
  if (res.notifyCtl) await notify(rf.ctl.filter(id => id !== Number(after.responsible_id)), after, res.notifyCtl, user.id);
  if (res.notifyDept) await notify(rf.deptUsers[res.notifyDept] || [], after, 'Заявка для отдела «' + res.notifyDept + '»: ' + r.title, user.id);
  return { ok: true };
}

async function objectPerson(user, body) {
  if (!user.isAdmin && !user.isCtl) throw new ApiError(403, 'Назначать управляющих может только руководитель');
  if (['manager_user_id', 'senior_user_id'].indexOf(body.field) === -1) throw new ApiError(400, 'Неверный запрос');
  const v = {}; v[body.field] = Number(body.user_id) || null;
  await nb('POST', 'contract_objects:update?filterByTk=' + Number(body.id), v);
  console.log('object-person', body.id, body.field, v[body.field], 'by', user.id);
  return { ok: true };
}

// ---------- HTTP ----------
function cors(origin) {
  if (!origin || !ORIGINS.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '600' };
}
function send(res, status, obj, origin) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors(origin)));
  res.end(JSON.stringify(obj));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > 256 * 1024) { reject(new ApiError(413, 'Слишком большой запрос')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(new ApiError(400, 'Неверный запрос')); } });
    req.on('error', reject);
  });
}
http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') { res.writeHead(204, cors(origin)); return res.end(); }
  const p = new URL(req.url, 'http://x').pathname;
  try {
    if (p === '/health') return send(res, 200, { ok: true }, origin);
    const user = await whoami(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    if (!user) throw new ApiError(401, 'Войдите в CRM заново');
    if (p === '/acts' && req.method === 'GET') return send(res, 200, await acts(user), origin);
    if (p === '/create' && req.method === 'POST') return send(res, 200, await create(user, await readJson(req)), origin);
    if (p === '/act' && req.method === 'POST') return send(res, 200, await act(user, await readJson(req)), origin);
    if (p === '/object-person' && req.method === 'POST') return send(res, 200, await objectPerson(user, await readJson(req)), origin);
    throw new ApiError(404, 'Нет такого адреса');
  } catch (e) {
    if (!(e instanceof ApiError)) console.error(e);
    send(res, e.status || 500, { error: e instanceof ApiError ? e.message : 'Ошибка сервиса заявок', field: e.field || null }, origin);
  }
}).listen(PORT, () => console.log('requests-service on', PORT));
