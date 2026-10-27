// Кабинет собственника (owner.ykinvest.ru): цифры по объектам и отчёты в PDF.
// Пока на демо-данных (demo.js); позже данные — из CRM служебной учёткой, как в requests-service.
//   /                      — кабинет (portal.html), /brand/* — фирменный кит
//   POST /api/code {email}  — код входа на почту (в демо код показывается на экране)
//   POST /api/login {email, code} → {token}
//   GET  /api/me            — всё для кабинета
//   POST /api/settings {settings} — какие отчёты и кому присылать
//   POST /api/question {text} — вопрос управляющему
//   GET  /api/report/<id>.pdf — отчёт (PDF собирает build-reports.js)
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const D = require('./demo');

const env = process.env;
const PORT = Number(env.PORT) || 8098;
const DEMO_CODE = '1234';
// ponytail: без OWNER_SECRET ключ случайный — после перезапуска все входят заново; в проде задать в .env
const SECRET = env.OWNER_SECRET || crypto.randomBytes(32).toString('hex');
const BRAND = [path.join(__dirname, 'brand'), path.join(__dirname, '..', 'brand')].find((p) => fs.existsSync(path.join(p, 'brand.css')));
const REPORTS_DIR = path.join(__dirname, 'reports');
const STATE_FILE = path.join(__dirname, 'data', 'state.json');
const PORTAL_HTML = fs.readFileSync(path.join(__dirname, 'portal.html'));

class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }

// ---------- сессия: «<данные>.<подпись>», как вход по коду в портале арендатора ----------
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function makeToken(email, days = 30) { const d = b64(JSON.stringify({ e: email, exp: Date.now() + days * 864e5 })); return d + '.' + sign(d); }
function readToken(t) {
  const [d, s] = String(t || '').split('.');
  if (!d || !s || s.length !== 43 || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(sign(d)))) return null;
  try { const v = JSON.parse(Buffer.from(d, 'base64url').toString()); return v.exp > Date.now() ? v : null; } catch (e) { return null; }
}

// ---------- состояние демо: настройки и вопросы ----------
const DEFAULT_STATE = {
  settings: { weekly: true, monthly: true, quarterly: true, emails: [D.OWNER.email] },
  questions: [],
};
function loadState() { try { return { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; } catch (e) { return structuredClone(DEFAULT_STATE); } }
function saveState(st) { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(st, null, 2)); }

// ---------- ограничение частоты ----------
const hits = new Map();
function limit(key, max, ms) {
  const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms);
  if (h.length >= max) throw new ApiError(429, 'Слишком много попыток, попробуйте позже');
  h.push(now); hits.set(key, h);
}

// ---------- API ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function apiCode(ip, b) {
  limit('code:' + ip, 10, 3600e3);
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) throw new ApiError(400, 'Проверьте адрес почты');
  // в рабочей версии: код уходит на почту собственника из CRM; в демо — показываем на экране
  return { ok: true, demo_code: DEMO_CODE };
}
function apiLogin(ip, b) {
  limit('login:' + ip, 20, 3600e3);
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || String(b.code || '').trim() !== DEMO_CODE) throw new ApiError(400, 'Неверный код');
  return { token: makeToken(email) };
}
function apiMe(user) {
  const st = loadState();
  const sent = D.sentReports().sort((a, b) => b.sent.localeCompare(a.sent));
  const upcoming = D.REPORTS.filter((r) => r.sent > D.TODAY);
  return {
    demo: true, email: user.e, today: D.TODAY,
    owner: D.OWNER, manager: D.MANAGER,
    portfolio: D.portfolio(),
    news: D.NEWS.slice(0, 5),
    reports: sent.map(({ id, kind, title, sent }) => ({ id, kind, title, sent, ready: fs.existsSync(path.join(REPORTS_DIR, id + '.pdf')) })),
    upcoming: upcoming.map(({ id, kind, title, sent }) => ({ id, kind, title, sent })),
    settings: st.settings,
    questions: st.questions.slice(-5),
  };
}
function apiSettings(b) {
  const st = loadState();
  if (b.settings) {
    const emails = [...new Set((b.settings.emails || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
    const bad = emails.find((e) => !EMAIL.test(e));
    if (bad) throw new ApiError(400, 'Проверьте адрес: ' + bad);
    if (!emails.length) throw new ApiError(400, 'Нужен хотя бы один адрес для отчётов');
    st.settings = { weekly: !!b.settings.weekly, monthly: !!b.settings.monthly, quarterly: !!b.settings.quarterly, emails: emails.slice(0, 10) };
  }
  saveState(st);
  return { ok: true, settings: st.settings };
}
function apiQuestion(b) {
  const text = String(b.text || '').trim().slice(0, 2000);
  if (!text) throw new ApiError(400, 'Напишите вопрос');
  const st = loadState();
  st.questions.push({ text, at: new Date().toISOString() });
  saveState(st);
  return { ok: true };
}

// ---------- HTTP ----------
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 64e3) { reject(new ApiError(413, 'Слишком большой запрос')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { reject(new ApiError(400, 'Неверный JSON')); } });
    req.on('error', reject);
  });
}
const TYPES = { css: 'text/css; charset=utf-8', svg: 'image/svg+xml', woff2: 'font/woff2' };

async function handle(req, res) {
  const p = new URL(req.url, 'http://x').pathname;
  const ip = req.socket.remoteAddress;
  if (p === '/' || p === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' });
    return res.end(PORTAL_HTML);
  }
  const bf = p.match(/^\/brand\/([a-z0-9-]+\.(css|svg|woff2))$/);
  if (bf) return fs.readFile(path.join(BRAND, bf[1]), (err, buf) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[bf[2]], 'Cache-Control': 'public, max-age=86400' }); res.end(buf);
  });
  if (!p.startsWith('/api/')) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Не найдено'); }

  if (p === '/api/code' && req.method === 'POST') return send(res, 200, apiCode(ip, await readJson(req)));
  if (p === '/api/login' && req.method === 'POST') return send(res, 200, apiLogin(ip, await readJson(req)));
  const user = readToken((req.headers.authorization || '').replace(/^Bearer /, ''));
  if (!user) throw new ApiError(401, 'Войдите заново');
  if (p === '/api/me') return send(res, 200, apiMe(user));
  if (p === '/api/settings' && req.method === 'POST') return send(res, 200, apiSettings(await readJson(req)));
  if (p === '/api/question' && req.method === 'POST') { limit('q:' + user.e, 20, 3600e3); return send(res, 200, apiQuestion(await readJson(req))); }
  const rp = p.match(/^\/api\/report\/([a-z0-9-]+)\.pdf$/);
  if (rp) {
    const r = D.sentReports().find((x) => x.id === rp[1]);
    const file = r && path.join(REPORTS_DIR, r.id + '.pdf');
    if (!file || !fs.existsSync(file)) throw new ApiError(404, 'Отчёт ещё не готов');
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${r.id}.pdf"`, 'Cache-Control': 'private, no-store' });
    return fs.createReadStream(file).pipe(res);
  }
  throw new ApiError(404, 'Не найдено');
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    if (!(e instanceof ApiError)) console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e instanceof ApiError ? e.message : 'Ошибка сервера' });
  });
});

if (require.main === module) {
  if (!env.OWNER_SECRET) console.warn('OWNER_SECRET не задан — сессии сбросятся при перезапуске');
  server.listen(PORT, env.HOST || '127.0.0.1', () => console.log(`кабинет собственника: http://localhost:${PORT}  (демо-код ${DEMO_CODE})`));
}

module.exports = { makeToken, readToken, apiSettings };
