// Сервис заявок по объектам: все изменения заявок идут только через него (у ролей сотрудников на заявки — только чтение).
// Кто пришёл — по сессии NocoBase (как почтовый сервис), что можно — rules.js, записывает служебная учётка requests-service.
//   GET  /acts            — что текущему пользователю можно по каждой открытой заявке + запросы на решение
//   POST /create {...}    — новая заявка (срок и ответственный — по правилам)
//   POST /act {id, a,...} — действие по заявке
//   POST /object-person {id, field, user_id} — управляющий / старший управляющий объекта (на нём строится KPI, поэтому только контролёр и админ)
//   POST /portal-link {contract_id} — личная ссылка арендатора на портал (старая перестаёт работать)
//   /portal/ и /portal/api/* — портал арендатора (help.ykinvest.ru): вход по коду на почту из договора или по личной ссылке
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const R = require('./rules');
const {objectRoute, RouteError} = require('./routes');
const OBJECT_MAP_HTML = fs.readFileSync(path.join(__dirname, 'object-map.html'));

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
    list('crm_config', '&filter=' + q({ key: { $in: ['requests.urgency', 'requests.deptDays', 'requests.kinds'] } }))
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
  ref.kinds = Array.isArray(c['requests.kinds']) && c['requests.kinds'].length ? c['requests.kinds'] : KINDS_DEF;
  ref.at = Date.now();
  return ref;
}
function ctxFor(user, rf, r, pending, doneBy) {
  return { me: user.id, isAdmin: user.isAdmin, isCtl: user.isCtl, depts: rf.depts[user.id] || [], r: r, pending: pending || [], doneBy: doneBy || null, userName: id => rf.names[id] || '#' + id };
}
// кто отметил «Решена» (последнее такое событие) — по заявкам на приёмке; он же их принять не может
async function doneByOf(ids) {
  const out = {};
  if (!ids.length) return out;
  const evs = await list('request_events', '&sort=id&fields=request_id,author_id&filter=' + q({ request_id: { $in: ids }, kind: 'status', text: { $startsWith: 'Решена' } }));
  (evs || []).forEach(e => { out[e.request_id] = e.author_id; });
  return out;
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
async function event(r, me, kind, text, fileId, visibility) {   // public — видно арендатору на портале
  return nb('POST', 'request_events:create', { request_id: r.id, author_id: me || null, kind: kind, text: text || '', file_id: fileId || null, visibility: visibility || 'internal' });
}

// ---------- обработчики ----------
async function acts(user) {
  const rf = await refs();
  const [reqs, aps] = await Promise.all([
    list('object_requests', '&fields=' + ['id', 'status', 'responsible_id', 'author_id', 'accept_mode', 'accept_user_id', 'dept', 'dept_user_id'].join(',') + '&filter=' + q({ status: { $in: R.OPEN.concat(['done']) } })),
    list('request_approvals', '&filter=' + q({ status: 'pending' }))
  ]);
  const out = {}, by = await doneByOf((reqs || []).filter(r => r.status === 'done').map(r => r.id));
  (reqs || []).forEach(r => { out[r.id] = R.actions(ctxFor(user, rf, r, (aps || []).filter(p => Number(p.request_id) === r.id), by[r.id])); });
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
  const ctx = ctxFor(user, rf, r, pending, r.status === 'done' ? (await doneByOf([r.id]))[r.id] : null);
  const res = R.apply(ctx, body.a, body, rf.cfg, new Date(), ap);
  if (res.err) throw new ApiError(res.code || 400, res.err, res.field);
  if (res.upd) await nb('POST', 'object_requests:update?filterByTk=' + r.id, res.upd);
  if (res.approval) await nb('POST', 'request_approvals:create', res.approval);
  if (res.decided) await nb('POST', 'request_approvals:update?filterByTk=' + res.decided.id, res.decided);
  for (const e of res.events) await event(r, user.id, e[0], e[1], e[2], e[3]);
  const after = Object.assign({}, r, res.upd || {});
  await mailTenantAbout(r, after, res.mailTenant);
  for (const n of res.notify) await notify([n[0]], after, n[1], user.id);
  if (res.notifyCtl) await notify(rf.ctl.filter(id => id !== Number(after.responsible_id)), after, res.notifyCtl, user.id);
  if (res.notifyDept) await notify((rf.deptUsers[res.notifyDept] || []).filter(id => id !== Number(body.user_id)), after,   // названному сотруднику уже ушло «Вам заявка из отдела»
    'Заявка для отдела «' + res.notifyDept + '»: ' + r.title, user.id);
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

// ---------- портал арендатора ----------
const KINDS_DEF = ['Ремонт и эксплуатация', 'Вопрос арендатора', 'Расторжение и выезд', 'Платёж, долг, штраф', 'Проверка, пожарная безопасность', 'Коммуналка, счётчики', 'Прочее'];   // как в src/_crm-config.js
const PORTAL_SECRET = env.PORTAL_SECRET || '';
const PORTAL_URL = (env.PORTAL_URL || '').replace(/\/$/, '') + '/';
const PORTAL_HTML = fs.readFileSync(path.join(__dirname, 'portal.html'));
const BRAND_TYPES = { css: 'text/css; charset=utf-8', svg: 'image/svg+xml', woff2: 'font/woff2' };
// письма арендаторам — только когда в .env есть ящик (SMTP_HOST, SMTP_USER, SMTP_PASS); без него — вход по личной ссылке, без писем
const SMTP_PORT = Number(env.SMTP_PORT) || 465;
const mailer = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
  ? require('nodemailer').createTransport({ host: env.SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }) : null;
if (!PORTAL_SECRET) console.error('PORTAL_SECRET не задан — вход на портал по почте выключен');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const hmac = (s) => crypto.createHmac('sha256', PORTAL_SECRET).update(s).digest('base64url');
const normEmail = (e) => String(e || '').trim().toLowerCase();
const emailsIn = (s) => String(s || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);

async function mailTo(to, subject, text) {
  if (!mailer || !to) return;
  await mailer.sendMail({ from: { name: 'Консалт Недвижимость — заявки', address: env.SMTP_USER }, to: to, subject: subject, text: text + '\n\nЗаявки и переписка: ' + PORTAL_URL })
    .catch(e => console.error('mail', to, e.message));   // письмо не должно ломать действие
}
// арендатору — о том, что ему важно: ответ, взяли в работу, нужен его ответ, решена (принять), отменена, закрыта
async function mailTenantAbout(r, after, reply) {
  if (r.accept_mode !== 'tenant' || !after.contact_email || r.demo) return;
  const n = 'Заявка №' + r.id + ' «' + r.title + '»';
  let text = null;
  if (reply) text = 'Ответ по заявке:\n\n' + reply;
  else if (after.status !== r.status) {
    if (after.status === 'in_work' && r.status === 'new') text = 'Заявка взята в работу. Срок — ' + String(after.due_date || '').slice(0, 10).split('-').reverse().join('.') + '.';
    else if (after.status === 'waiting' && after.wait_reason === R.TENANT_WAIT) text = 'Нужен ваш ответ — напишите в заявке на портале.';
    else if (after.status === 'done') text = 'Работа выполнена: ' + (after.result || '') + '\n\nПроверьте и примите работу на портале (или верните, если что-то не так).';
    else if (after.status === 'cancelled') text = 'Заявка отменена: ' + (after.result || '');
    else if (after.status === 'closed') text = 'Заявка закрыта.';
  }
  if (text) await mailTo(after.contact_email, n, text);
}

// кто вошёл: «L.<токен>» — личная ссылка (portal_links), «S.<данные>.<подпись>» — вход по коду на почту
async function contractsByEmail(email) {
  const e = normEmail(email);
  if (!e) return [];
  const [rc, cc] = await Promise.all([
    list('rental_contracts', '&fields=id,email&filter=' + q({ email: { $includes: e } })),
    list('contract_contacts', '&fields=contract_ref_id,email&filter=' + q({ contract_type: 'active', email: { $includes: e } }))
  ]);
  const ids = new Set();
  (rc || []).forEach(x => { if (emailsIn(x.email).includes(e)) ids.add(x.id); });
  (cc || []).forEach(x => { if (emailsIn(x.email).includes(e)) ids.add(Number(x.contract_ref_id)); });
  return [...ids];
}
const tenantCache = new Map();
async function tenant(auth) {
  const tok = String(auth || '').replace(/^Bearer\s+/i, '');
  const c = tenantCache.get(tok);
  if (c && c.exp > Date.now()) return c.t;
  let ids = [], email = null, demo = false;
  if (tok.startsWith('L.') && tok.length > 20) {
    const l = ((await list('portal_links', '&filter=' + q({ token_hash: sha(tok.slice(2)), revoked_at: { $empty: true } }))) || [])[0];
    if (l) { ids = [Number(l.contract_id)]; demo = !!l.demo; nb('POST', 'portal_links:update?filterByTk=' + l.id, { last_used_at: new Date().toISOString() }).catch(() => {}); }
  } else if (tok.startsWith('S.') && PORTAL_SECRET) {
    const [, data, sig] = tok.split('.');
    const want = hmac(data || '');
    if (sig && sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) {
      let d = {}; try { d = JSON.parse(Buffer.from(data, 'base64url').toString()); } catch (e) { d = {}; }
      if (d.x > Date.now()) { email = d.e; ids = await contractsByEmail(email); }
    }
  }
  if (!ids.length) { tenantCache.delete(tok); return null; }
  // только действующие договоры (договор ушёл в завершённые — доступ пропадает)
  const cons = await list('rental_contracts', '&fields=id,contract_number,tenant_name,object_name&filter=' + q({ id: { $in: ids } }));
  if (!(cons || []).length) return null;
  const t = { contracts: cons.map(x => x.id), cons: cons, email: email, name: cons[0].tenant_name || '', demo: demo, key: sha(tok) };
  tenantCache.set(tok, { t: t, exp: Date.now() + 60000 });
  if (tenantCache.size > 500) for (const [k, x] of tenantCache) if (x.exp < Date.now()) tenantCache.delete(k);
  return t;
}

// ---------- фото и файлы арендатора ----------
// Загружает сервис своей учёткой в хранилище NocoBase; id файла запоминается за тем, кто загрузил, — чужой id к заявке не приложить.
// ponytail: «чей файл» в памяти — после перезапуска загруженные, но не отправленные файлы надо загрузить заново
const FILE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif', 'application/pdf': '.pdf' };
const MAX_FILE = 12 * 1024 * 1024, MAX_FILES = 5;
const uploads = new Map();   // file_id → { who, exp }
function readRaw(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > max) { reject(new ApiError(413, 'Файл больше 12 МБ')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function svcFetch(pathName, opts) {   // как nb(), но с произвольным телом/ответом
  for (let i = 0; i < 2; i++) {
    if (!svcToken) await nb('GET', 'auth:check');
    const r = await fetch(NB_URL + pathName, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + svcToken, 'X-Authenticator': 'basic' }, (opts || {}).headers || {}) }));
    if (r.status === 401) { svcToken = null; continue; }
    return r;
  }
  throw new ApiError(502, 'Сервис заявок не смог войти в CRM');
}
async function portalUpload(t, req) {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!FILE_TYPES[type]) throw new ApiError(415, 'Можно приложить фото (JPG, PNG, HEIC) или PDF');
  limit('upload:' + t.key, 60, 3600000);
  const buf = await readRaw(req, MAX_FILE);
  if (!buf.length) throw new ApiError(400, 'Пустой файл');
  const form = new FormData();
  form.append('file', new Blob([buf], { type: type }), 'portal-' + Date.now() + FILE_TYPES[type]);
  const r = await svcFetch('/api/attachments:upload', { method: 'POST', body: form });
  const j = await r.json().catch(() => null);
  const id = j && j.data && j.data.id;
  if (!r.ok || !id) { console.error('upload', r.status, JSON.stringify(j).slice(0, 300)); throw new ApiError(502, 'Не удалось сохранить файл'); }
  uploads.set(id, { who: t.key, exp: Date.now() + 6 * 3600e3 });
  for (const [k, x] of uploads) if (x.exp < Date.now()) uploads.delete(k);
  return { file_id: id };
}
function ownFiles(t, ids) {   // только свои недавно загруженные, не больше MAX_FILES
  const out = [...new Set((Array.isArray(ids) ? ids : []).map(Number))].filter(id => { const u = uploads.get(id); return u && u.who === t.key && u.exp > Date.now(); });
  if ((ids || []).length && out.length !== new Set(ids).size) throw new ApiError(400, 'Файл не найден — приложите его заново');
  if (out.length > MAX_FILES) throw new ApiError(400, 'Не больше ' + MAX_FILES + ' файлов за раз');
  return out;
}
async function attachFiles(r, ids) { for (const id of ids) { await event(r, null, 'comment', 'Фото', id, 'public'); uploads.delete(id); } }
// файл из переписки — только публичное событие заявки, которую арендатор видит
async function portalFile(t, res, evId) {
  const e = await nb('GET', 'request_events:get?filterByTk=' + Number(evId) + '&appends=file');
  if (!e || e.visibility !== 'public' || !e.file) throw new ApiError(404, 'Файл не найден');
  const r = await nb('GET', 'object_requests:get?filterByTk=' + Number(e.request_id));
  if (!R.tenantSees(t, r)) throw new ApiError(404, 'Файл не найден');
  const f = await svcFetch('/storage/uploads/' + encodeURIComponent(e.file.filename));
  if (!f.ok) throw new ApiError(404, 'Файл не найден');
  res.writeHead(200, { 'Content-Type': e.file.mimetype || 'application/octet-stream', 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': (/^image\//.test(e.file.mimetype || '') ? 'inline' : 'attachment') + '; filename="file' + (e.file.extname || '') + '"' });
  res.end(Buffer.from(await f.arrayBuffer()));
}

// ponytail: лимиты и коды в памяти — после перезапуска сервиса сбрасываются; для одного сервера достаточно
const hits = new Map(), codes = new Map();
function limit(key, n, ms) {
  const h = hits.get(key);
  if (!h || h.reset < Date.now()) { hits.set(key, { n: 1, reset: Date.now() + ms }); return; }
  if (++h.n > n) throw new ApiError(429, 'Слишком много попыток — подождите несколько минут');
}
async function portalCode(ip, body) {
  if (!mailer || !PORTAL_SECRET) throw new ApiError(503, 'Вход по почте пока не подключён — попросите у управляющего личную ссылку на портал');
  const e = normEmail(body.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new ApiError(400, 'Проверьте адрес почты', 'email');
  limit('ip:' + ip, 20, 600000); limit('mail:' + e, 3, 600000);
  if ((await contractsByEmail(e)).length) {   // нет такой почты в договорах — ответ тот же, чтобы по порталу нельзя было проверять адреса
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    codes.set(e, { h: sha(code), exp: Date.now() + 15 * 60000, tries: 0 });
    await mailTo(e, 'Код для входа: ' + code, 'Код для входа на портал заявок: ' + code + '\nДействует 15 минут. Если вы не запрашивали код — просто удалите это письмо.');
  }
  return { ok: true };
}
async function portalLogin(ip, body) {
  limit('ip:' + ip, 20, 600000);
  const e = normEmail(body.email), c = codes.get(e);
  if (!c || c.exp < Date.now() || c.tries >= 5) throw new ApiError(400, 'Код устарел — запросите новый', 'code');
  c.tries++;
  if (sha(String(body.code || '').trim()) !== c.h) throw new ApiError(400, 'Неверный код', 'code');
  codes.delete(e);
  const data = Buffer.from(JSON.stringify({ e: e, x: Date.now() + 30 * 864e5 })).toString('base64url');
  return { token: 'S.' + data + '.' + hmac(data) };
}
async function portalMe(t) {
  const rf = await refs();
  const reqs = await list('object_requests', '&sort=-id&fields=' + ['id', 'title', 'description', 'kind', 'urgency', 'status', 'createdAt', 'due_date', 'result', 'done_at', 'closed_at', 'rating', 'contract_id', 'object_name', 'accept_mode', 'wait_reason', 'responsible_id'].join(',')
    + '&filter=' + q({ contract_id: { $in: t.contracts }, accept_mode: 'tenant' }));
  const ids = (reqs || []).map(r => r.id);
  const evs = ids.length ? await list('request_events', '&sort=createdAt&fields=id,request_id,author_id,text,createdAt,file_id&filter=' + q({ request_id: { $in: ids }, visibility: 'public' })) : [];
  const u = R.DEF.urgency, cu = (rf.cfg && rf.cfg.urgency) || {};
  return {
    name: t.name, email: t.email, mail: !!mailer, kinds: rf.kinds,
    urgency: Object.keys(u).map(k => ({ k: k, l: (cu[k] && cu[k].l) || u[k].l })),
    contracts: t.cons.map(c => ({ id: c.id, number: c.contract_number, object: c.object_name, tenant: c.tenant_name })),
    requests: (reqs || []).map(r => ({ id: r.id, title: r.title, description: r.description, kind: r.kind, urgency: r.urgency, status: r.status, createdAt: r.createdAt, due_date: r.due_date,
      result: r.result, done_at: r.done_at, closed_at: r.closed_at, rating: r.rating, object: r.object_name, waitingYou: r.status === 'waiting' && r.wait_reason === R.TENANT_WAIT,
      manager: r.responsible_id ? rf.names[r.responsible_id] || null : null, acts: R.tenantActions(t, r),
      events: (evs || []).filter(e => e.request_id === r.id).map(e => ({ id: e.id, at: e.createdAt, mine: !e.author_id, who: e.author_id ? rf.names[e.author_id] || 'Сотрудник' : null, text: e.text, file: !!e.file_id })) }))
  };
}
async function portalCreate(t, body) {
  const rf = await refs();
  const contract = t.cons.find(c => c.id === Number(body.contract_id)) || (t.cons.length === 1 ? t.cons[0] : null);
  const obj = contract ? ((await list('contract_objects', '&filter=' + q({ name: contract.object_name || '' }))) || [])[0] : null;
  const res = R.tenantCreate(t, body, contract, obj, rf.kinds, rf.cfg, new Date());
  if (res.err) throw new ApiError(400, res.err, res.field);
  const files = ownFiles(t, body.file_ids);
  if (t.demo) res.values.demo = true;   // демо-ссылка админа: заявка демо, никого не уведомляет
  const rec = await nb('POST', 'object_requests:create', res.values);
  await event(rec, null, 'create', res.event + (files.length ? ' · фото: ' + files.length : ''), null, 'public');
  await attachFiles(rec, files);
  if (rec.demo) return { id: rec.id };
  for (const n of res.notify) await notify([n[0]], rec, n[1], null);
  if (res.notifyCtl) await notify(rf.ctl, rec, res.notifyCtl, null);
  await mailTo(rec.contact_email, 'Заявка №' + rec.id + ' принята', 'Заявка «' + rec.title + '» принята. Срок — ' + String(rec.due_date).slice(0, 10).split('-').reverse().join('.') + '.');
  return { id: rec.id };
}
async function portalAct(t, body) {
  const r = await nb('GET', 'object_requests:get?filterByTk=' + Number(body.id));
  if (!r || !R.tenantSees(t, r)) throw new ApiError(404, 'Заявка не найдена');
  const files = body.a === 'comment' ? ownFiles(t, body.file_ids) : [];
  const res = R.tenantApply(t, r, body.a, Object.assign({}, body, { file_ids: files }), new Date());
  if (res.err) throw new ApiError(res.code || 400, res.err, res.field);
  if (res.upd) await nb('POST', 'object_requests:update?filterByTk=' + r.id, res.upd);
  for (const e of res.events) await event(r, null, e[0], e[1], e[2], e[3]);
  await attachFiles(r, files);
  for (const n of res.notify) await notify([n[0]], r, n[1], null);
  return { ok: true };
}
// личная ссылка — даёт контролёр, админ или управляющий объекта договора; новая отменяет прежние ссылки договора
async function portalLink(user, body) {
  if (!env.PORTAL_URL) throw new ApiError(503, 'Адрес портала не настроен (PORTAL_URL)');
  const c = ((await list('rental_contracts', '&fields=id,object_name&filter=' + q({ id: Number(body.contract_id) || 0 }))) || [])[0];
  if (!c) throw new ApiError(404, 'Договор не найден');
  const o = ((await list('contract_objects', '&filter=' + q({ name: c.object_name || '' }))) || [])[0] || {};
  if (!user.isAdmin && !user.isCtl && Number(o.manager_user_id) !== user.id && Number(o.senior_user_id) !== user.id) throw new ApiError(403, 'Ссылку даёт управляющий объекта или руководитель');
  const demo = !!body.demo && user.isAdmin;   // демо-ссылка (проверка портала): заявки по ней демо, настоящую ссылку не отменяет
  for (const l of (await list('portal_links', '&filter=' + q({ contract_id: c.id, revoked_at: { $empty: true }, demo: demo ? true : { $ne: true } }))) || []) await nb('POST', 'portal_links:update?filterByTk=' + l.id, { revoked_at: new Date().toISOString() });
  const tok = crypto.randomBytes(24).toString('base64url');
  await nb('POST', 'portal_links:create', { contract_id: c.id, token_hash: sha(tok), created_by: user.id, demo: demo });
  tenantCache.clear();
  return { url: PORTAL_URL + '#t=L.' + tok };
}
async function portal(req, res, p, origin) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (p === '/portal/api/code' && req.method === 'POST') return send(res, 200, await portalCode(ip, await readJson(req)), origin);
  if (p === '/portal/api/login' && req.method === 'POST') return send(res, 200, await portalLogin(ip, await readJson(req)), origin);
  const t = await tenant(req.headers.authorization);
  if (!t) throw new ApiError(401, 'Войдите заново');
  if (p === '/portal/api/me') return send(res, 200, await portalMe(t), origin);
  if (p === '/portal/api/create' && req.method === 'POST') { limit('create:' + t.contracts.join(','), 30, 3600000); return send(res, 200, await portalCreate(t, await readJson(req)), origin); }
  if (p === '/portal/api/act' && req.method === 'POST') return send(res, 200, await portalAct(t, await readJson(req)), origin);
  if (p === '/portal/api/upload' && req.method === 'POST') return send(res, 200, await portalUpload(t, req), origin);
  if (p === '/portal/api/file') return await portalFile(t, res, new URL(req.url, 'http://x').searchParams.get('ev'));
  throw new ApiError(404, 'Нет такого адреса');
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
    // Generic isolated renderer: object data arrives from its authenticated CRM parent, never from this endpoint.
    if (p === '/object-map' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-cache', 'Referrer-Policy':'origin',
        'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; img-src blob: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self' " + ORIGINS.join(' ')});
      return res.end(OBJECT_MAP_HTML);
    }
    if (p === '/portal' || p === '/portal/' || (p === '/' && /^help\./.test(String(req.headers.host || '')))) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'" });
      return res.end(PORTAL_HTML);
    }
    const bf = p.match(/^\/portal\/brand\/([a-z0-9-]+\.(css|svg|woff2))$/);   // фирменный кит (каталог brand/ монтируется из репозитория)
    if (bf) return fs.readFile(path.join(__dirname, 'brand', bf[1]), (err, buf) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': BRAND_TYPES[bf[2]], 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
      res.end(buf);
    });
    if (p.startsWith('/portal/api/')) return await portal(req, res, p, origin);
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await whoami(token);
    if (!user) throw new ApiError(401, 'Войдите в CRM заново');
    if (p === '/object-route' && req.method === 'POST') {
      const route = await objectRoute(user, await readJson(req), async ids => {
        const r = await fetch(NB_URL + '/api/contract_objects:list?paginate=false&fields=id,map_location&filter=' + q({id:{$in:ids}}), {
          headers: {Authorization:'Bearer ' + token, 'X-Authenticator':'basic'}, signal:AbortSignal.timeout(10000)
        });
        if (!r.ok) throw new ApiError(r.status === 403 ? 403 : 502, 'Не удалось прочитать объекты CRM');
        const j = await r.json();
        if (!Array.isArray(j.data)) throw new ApiError(502, 'Не удалось прочитать объекты CRM');
        return j.data;
      });
      return send(res, 200, route, origin);
    }
    if (p === '/acts' && req.method === 'GET') return send(res, 200, await acts(user), origin);
    if (p === '/create' && req.method === 'POST') return send(res, 200, await create(user, await readJson(req)), origin);
    if (p === '/act' && req.method === 'POST') return send(res, 200, await act(user, await readJson(req)), origin);
    if (p === '/portal-link' && req.method === 'POST') return send(res, 200, await portalLink(user, await readJson(req)), origin);
    if (p === '/object-person' && req.method === 'POST') return send(res, 200, await objectPerson(user, await readJson(req)), origin);
    throw new ApiError(404, 'Нет такого адреса');
  } catch (e) {
    const expected = e instanceof ApiError || e instanceof RouteError;
    if (!expected) console.error(e);
    send(res, e.status || 500, { error: expected ? e.message : 'Ошибка сервиса заявок', field: e.field || null }, origin);
  }
}).listen(PORT, () => console.log('requests-service on', PORT));
