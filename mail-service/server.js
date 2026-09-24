'use strict';
// Почтовый сервис вкладки «Почта» в NocoBase.
// Сотрудник входит только в NocoBase: сервис проверяет его сессию (токен NocoBase) и открывает ящик
// по его рабочему адресу. Пароль от ящика вводится один раз и хранится зашифрованным (AES-256-GCM) в DATA_DIR.
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ImapFlow } = require('imapflow');
const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');
const { simpleParser } = require('mailparser');
const iconv = require('iconv-lite');
const libqp = require('libqp');
const { convert: htmlToText } = require('html-to-text');
const archiver = require('archiver');

const env = process.env;
const PORT = Number(env.PORT) || 8096;
const NB_URL = (env.NB_URL || '').replace(/\/$/, '');
const ORIGINS = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const DOMAIN = (env.MAIL_DOMAIN || '').toLowerCase();
const USERS = (env.MAIL_USERS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);   // пилот: пусто — все адреса домена
const IMAP_HOST = env.IMAP_HOST, IMAP_PORT = Number(env.IMAP_PORT) || 993;
const SMTP_HOST = env.SMTP_HOST || env.IMAP_HOST, SMTP_PORT = Number(env.SMTP_PORT) || 465;
const KEY = Buffer.from(env.MAIL_KEY || '', 'hex');
const DATA_DIR = env.DATA_DIR || '/data';
const PAGE_SIZE = 50;
const MAX_UPLOAD = 25 * 1024 * 1024;
if (!NB_URL || !IMAP_HOST || KEY.length !== 32) { console.error('Нужны NB_URL, IMAP_HOST и MAIL_KEY (64 hex-символа)'); process.exit(1); }

// ---------- пароли от ящиков ----------
const CREDS_FILE = path.join(DATA_DIR, 'creds.json');
function loadCreds() { try { return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8')); } catch (e) { return {}; } }
function saveCreds(all) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = CREDS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(all, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, CREDS_FILE);
}
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}
function decrypt(o) {
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(o.iv, 'base64'));
  d.setAuthTag(Buffer.from(o.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(o.data, 'base64')), d.final()]).toString('utf8');
}
function getPassword(email) { const o = loadCreds()[email]; if (!o) return null; try { return decrypt(o); } catch (e) { return null; } }
function setPassword(email, pass) { const all = loadCreds(); all[email] = encrypt(pass); saveCreds(all); }

// ---------- настройки ящика: имя отправителя и подпись ----------
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
function loadSettings() { try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { return {}; } }
function settingsOf(email) { return loadSettings()[email] || {}; }
function saveSettings(email, v) {
  const all = loadSettings();
  all[email] = { name: String(v.name || '').slice(0, 120), signature: String(v.signature || '').slice(0, 20000), sigOnReply: v.sigOnReply !== false };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = SETTINGS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(all, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, SETTINGS_FILE);
  return all[email];
}

// ---------- кто пришёл: проверка сессии NocoBase ----------
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
  const v = { userId: u.id, email: String(u.email || '').trim().toLowerCase(), name: u.nickname || u.username || '', exp: Date.now() + 60000 };
  tokenCache.set(token, v);
  if (tokenCache.size > 500) for (const [k, x] of tokenCache) if (x.exp < Date.now()) tokenCache.delete(k);
  return v;
}
function mailEnabled(email) {
  if (!email || !email.includes('@')) return false;
  if (DOMAIN && !email.endsWith('@' + DOMAIN)) return false;
  return !USERS.length || USERS.includes(email);
}

class ApiError extends Error { constructor(status, code, message) { super(message || code); this.status = status; this.code = code; } }

// ---------- IMAP: одно соединение на ящик, операции по очереди ----------
const pool = new Map();
function isAuthError(e) { return !!(e && (e.authenticationFailed || /AUTHENTICATIONFAILED|authentication failed|Invalid credentials|LOGIN failed/i.test(String(e.responseText || e.message || '')))); }
function newClient(email, pass) {
  const c = new ImapFlow({ host: IMAP_HOST, port: IMAP_PORT, secure: true, auth: { user: email, pass: pass }, logger: false, emitLogs: false });
  c.on('error', () => {});
  return c;
}
async function getClient(email) {
  let e = pool.get(email);
  if (!e) { e = { client: null, q: Promise.resolve(), timer: null }; pool.set(email, e); }
  if (e.client && e.client.usable) return e;
  const pass = getPassword(email);
  if (!pass) throw new ApiError(412, 'NO_PASSWORD', 'Пароль от почты ещё не введён');
  const c = newClient(email, pass);
  try { await c.connect(); }
  catch (err) { if (isAuthError(err)) throw new ApiError(412, 'BAD_PASSWORD', 'Пароль от почты не подошёл'); throw new ApiError(502, 'IMAP_DOWN', 'Почтовый сервер не отвечает'); }
  c.on('close', () => { if (e.client === c) e.client = null; });
  e.client = c;
  return e;
}
function withImap(email, fn) {
  let e = pool.get(email);
  if (!e) { e = { client: null, q: Promise.resolve(), timer: null }; pool.set(email, e); }
  const run = e.q.then(async () => {
    const entry = await getClient(email);
    clearTimeout(entry.timer);
    try { return await fn(entry.client); }
    finally {
      entry.timer = setTimeout(() => { if (entry.client) entry.client.logout().catch(() => {}); entry.client = null; }, 5 * 60 * 1000);
    }
  });
  e.q = run.catch(() => {});
  return run;
}

// ---------- папки ----------
const SPECIAL = [
  ['\\Inbox', 'Входящие', /^inbox$/i],
  ['\\Sent', 'Отправленные', /^(sent|sent items|sent messages|отправленные)$/i],
  ['\\Drafts', 'Черновики', /^(drafts|черновики)$/i],
  ['\\Junk', 'Спам', /^(spam|junk|junk e-?mail|спам)$/i],
  ['\\Trash', 'Корзина', /^(trash|deleted|deleted items|deleted messages|корзина|удаленные|удалённые)$/i],
  ['\\Archive', 'Архив', /^(archive|архив)$/i]
];
function specialOf(f) {
  if (f.specialUse && SPECIAL.some(s => s[0] === f.specialUse)) return f.specialUse;
  const s = SPECIAL.find(x => x[2].test(f.name) || x[2].test(f.path));
  return s ? s[0] : null;
}
async function listFolders(client) {
  const list = await client.list({ statusQuery: { unseen: true, messages: true } });
  const out = list.filter(f => !(f.flags && f.flags.has('\\Noselect'))).map(f => {
    const sp = specialOf(f);
    const sd = SPECIAL.find(s => s[0] === sp);
    return { path: f.path, name: sd ? sd[1] : f.name, special: sp, unseen: (f.status && f.status.unseen) || 0, total: (f.status && f.status.messages) || 0 };
  });
  const order = SPECIAL.map(s => s[0]);
  out.sort((a, b) => {
    const ia = a.special ? order.indexOf(a.special) : 99, ib = b.special ? order.indexOf(b.special) : 99;
    return ia - ib || a.name.localeCompare(b.name, 'ru');
  });
  return out;
}
const folderCache = new Map();   // email -> { at, list }
async function foldersOf(client, email, fresh) {
  const c = folderCache.get(email);
  if (!fresh && c && Date.now() - c.at < 60000) return c.list;
  const list = await listFolders(client);
  folderCache.set(email, { at: Date.now(), list });
  return list;
}
async function specialPath(client, email, sp) {
  const f = (await foldersOf(client, email)).find(x => x.special === sp);
  return f ? f.path : null;
}

// ---------- список писем ----------
function addrList(a) { return (a || []).map(x => ({ name: x.name || '', address: (x.address || '').toLowerCase() })); }
function findTextPart(node, prefer) {
  if (!node) return null;
  const t = String(node.type || '').toLowerCase();
  const isAtt = node.disposition && String(node.disposition).toLowerCase() === 'attachment';
  if (!node.childNodes && t === prefer && !isAtt) return node;
  for (const ch of node.childNodes || []) { const r = findTextPart(ch, prefer); if (r) return r; }
  return null;
}
function hasAttachments(node) {
  if (!node) return false;
  const d = String(node.disposition || '').toLowerCase();
  if (d === 'attachment') return true;
  if (!node.childNodes && d !== 'inline' && !String(node.type || '').startsWith('text/') && !String(node.type || '').startsWith('multipart/') && node.type !== 'message/delivery-status') return !!(node.dispositionParameters && node.dispositionParameters.filename) || !!(node.parameters && node.parameters.name);
  return (node.childNodes || []).some(hasAttachments);
}
const ZW = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\u3164\uFEFF\uFFA0\uFFFD]/g;
function decodePart(buf, part, complete) {
  let b = buf;
  const enc = String(part.encoding || '').toLowerCase();
  if (enc === 'base64') { const t = b.toString('ascii').replace(/[^A-Za-z0-9+/]/g, ''); b = Buffer.from(t.slice(0, t.length - (t.length % 4)), 'base64'); }
  else if (enc === 'quoted-printable') b = libqp.decode(b.toString('ascii').replace(/=[0-9A-Fa-f]?$/, ''));
  const cs = (part.parameters && part.parameters.charset) || 'utf-8';
  let text;
  try { text = iconv.encodingExists(cs) ? iconv.decode(b, cs) : b.toString('utf8'); } catch (e) { text = b.toString('utf8'); }
  if (String(part.type).toLowerCase() === 'text/html') {
    if (!complete) text = text.replace(/<[^>]*$/, '');   // оборванный на границе среза тег
    try {
      text = htmlToText(text, { wordwrap: false, selectors: [
        { selector: 'img', format: 'skip' }, { selector: 'a', options: { ignoreHref: true } },
        { selector: 'h1', options: { uppercase: false } }, { selector: 'h2', options: { uppercase: false } }, { selector: 'h3', options: { uppercase: false } },
        { selector: 'table', format: 'block' }, { selector: 'tr', format: 'block' }, { selector: 'td', format: 'inline' }, { selector: 'th', format: 'inline' }
      ] });
    } catch (e) { text = text.replace(/<[^>]*>/g, ' '); }
  }
  return text.replace(ZW, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}
const snippetCache = new Map();
const SNIPPET_BYTES = 65536;   // обычно текстовая часть целиком — без обрывков тегов и кодировки на границе среза
const FILTERS = { unread: { seen: false }, flagged: { flagged: true }, attachments: { header: { 'content-type': 'multipart/mixed' } } };
async function listMessages(client, folder, page, q, filter) {
  const lock = await client.getMailboxLock(folder, { readOnly: true });
  try {
    const mb = client.mailbox;
    let uids;
    const crit = Object.assign({}, FILTERS[filter] || {});
    if (q) { const s = String(q).slice(0, 100); crit.or = [{ subject: s }, { from: s }, { to: s }, { body: s }]; }
    if (!mb.exists) uids = [];
    else uids = await client.search(Object.keys(crit).length ? crit : { all: true }, { uid: true });
    uids = (uids || []).sort((a, b) => b - a);
    const total = uids.length;
    const pageUids = uids.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const items = [];
    if (pageUids.length) {
      for await (const m of client.fetch(pageUids.join(','), { uid: true, envelope: true, flags: true, bodyStructure: true, internalDate: true, size: true, headers: ['x-priority', 'importance', 'priority'] }, { uid: true })) {
        const env = m.envelope || {};
        const hdr = m.headers ? m.headers.toString() : '';
        const part = findTextPart(m.bodyStructure, 'text/plain') || findTextPart(m.bodyStructure, 'text/html');
        items.push({
          uid: m.uid, subject: env.subject || '', from: addrList(env.from), to: addrList(env.to),
          date: (env.date || m.internalDate || new Date()).toISOString(),
          seen: m.flags.has('\\Seen'), flagged: m.flags.has('\\Flagged'), answered: m.flags.has('\\Answered'), draft: m.flags.has('\\Draft'),
          attachments: hasAttachments(m.bodyStructure), size: m.size, __part: part,
          important: /x-priority:\s*[12]\b|importance:\s*high|priority:\s*urgent/i.test(hdr)
        });
      }
      // превью текста: начало текстовой части, одним запросом на группу писем с одинаковым номером части
      const key = uid => mb.path + '|' + mb.uidValidity + '|' + uid;
      const groups = new Map();
      items.forEach(it => {
        const cached = snippetCache.get(key(it.uid));
        if (cached !== undefined) { it.snippet = cached; return; }
        if (!it.__part) { it.snippet = ''; return; }
        const k = it.__part.part || '1';
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(it);
      });
      for (const [k, list] of groups) {
        const byUid = new Map(list.map(it => [it.uid, it]));
        try {
          for await (const m of client.fetch(list.map(it => it.uid).join(','), { uid: true, bodyParts: [{ key: k, start: 0, maxLength: SNIPPET_BYTES }] }, { uid: true })) {
            const it = byUid.get(m.uid);
            if (!it || !m.bodyParts) continue;
            const buf = m.bodyParts.values().next().value;
            it.snippet = buf ? decodePart(buf, it.__part, buf.length < SNIPPET_BYTES) : '';
            snippetCache.set(key(it.uid), it.snippet);
          }
        } catch (e) { /* без превью */ }
      }
      if (snippetCache.size > 20000) snippetCache.clear();
      items.forEach(it => { delete it.__part; if (it.snippet === undefined) it.snippet = ''; });
      items.sort((a, b) => b.uid - a.uid);
    }
    return { total, page, pageSize: PAGE_SIZE, items };
  } finally { lock.release(); }
}

// ---------- письмо целиком ----------
async function fetchParsed(client, folder, uid) {
  const lock = await client.getMailboxLock(folder);
  try {
    const dl = await client.download(String(uid), undefined, { uid: true });
    if (!dl || !dl.content) throw new ApiError(404, 'NOT_FOUND', 'Письмо не найдено');
    const parsed = await simpleParser(dl.content, { skipTextToHtml: false });
    return parsed;
  } finally { lock.release(); }
}
function parsedAddr(a) { return a && a.value ? a.value.map(x => ({ name: x.name || '', address: (x.address || '').toLowerCase() })) : []; }
async function readMessage(client, folder, uid) {
  const p = await fetchParsed(client, folder, uid);
  let html = p.html || p.textAsHtml || '';
  const atts = [];
  (p.attachments || []).forEach((a, i) => {
    if (a.contentId && a.content && a.content.length < 3 * 1024 * 1024 && html) {
      const cid = a.contentId.replace(/^<|>$/g, '');
      if (html.includes('cid:' + cid)) {
        html = html.split('cid:' + cid).join('data:' + (a.contentType || 'application/octet-stream') + ';base64,' + a.content.toString('base64'));
        return;   // картинка показана в тексте письма — отдельным вложением её не выводим
      }
    }
    atts.push({ idx: i, filename: a.filename || ('вложение-' + (i + 1)), contentType: a.contentType, size: a.size || (a.content ? a.content.length : 0) });
  });
  // прочитано — ставим отдельно, чтобы открытие письма не зависело от прав на запись
  const lock = await client.getMailboxLock(folder);
  try { await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true }); } catch (e) { /* ignore */ } finally { lock.release(); }
  return {
    uid, subject: p.subject || '', from: parsedAddr(p.from), to: parsedAddr(p.to), cc: parsedAddr(p.cc), replyTo: parsedAddr(p.replyTo),
    date: (p.date || new Date()).toISOString(), html, text: p.text || '', attachments: atts, important: p.priority === 'high',
    messageId: p.messageId || '', references: [].concat(p.references || [])
  };
}

// ---------- отправка ----------
const uploads = new Map();   // id -> { owner, filename, contentType, content, exp }
function cleanUploads() { const now = Date.now(); for (const [k, u] of uploads) if (u.exp < now) uploads.delete(k); }
function transportFor(email) {
  return nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: email, pass: getPassword(email) } });
}
function cleanAddrs(v) {
  const list = Array.isArray(v) ? v : String(v || '').split(/[,;]/);
  return list.map(x => (typeof x === 'string' ? x : (x && x.address) || '').trim()).filter(Boolean);
}
async function composeMail(user, body, client) {
  const to = cleanAddrs(body.to), cc = cleanAddrs(body.cc), bcc = cleanAddrs(body.bcc);
  const attachments = [];
  for (const id of body.attachments || []) {
    const u = uploads.get(id);
    if (u && u.owner === user.email) attachments.push({ filename: u.filename, contentType: u.contentType, content: u.content });
  }
  if (body.forward && body.forward.folder && body.forward.uid && client) {
    const orig = await fetchParsed(client, body.forward.folder, body.forward.uid);
    const skip = new Set((body.forward.skip || []).map(Number));
    (orig.attachments || []).forEach((a, i) => {
      if (skip.has(i) || (a.contentDisposition === 'inline' && a.contentId)) return;
      attachments.push({ filename: a.filename || ('вложение-' + (i + 1)), contentType: a.contentType, content: a.content });
    });
  }
  // картинки, вставленные в текст письма (data:), уходят вложениями с cid — так их видят все почтовые программы
  let html = String(body.html || '');
  let n = 0;
  html = html.replace(/(<img[^>]+src=["'])data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)(["'])/gi, function(m, pre, type, data, post) {
    const cid = 'img' + (++n) + '.' + crypto.randomBytes(6).toString('hex') + '@mail';
    attachments.push({ filename: 'image' + n + '.' + (type.split('/')[1] || 'png').replace('jpeg', 'jpg'), contentType: type, content: Buffer.from(data.replace(/\s/g, ''), 'base64'), cid: cid, contentDisposition: 'inline' });
    return pre + 'cid:' + cid + post;
  });
  const st = settingsOf(user.email);
  const opts = {
    from: { name: st.name || user.name || '', address: user.email }, to, cc, bcc,
    subject: String(body.subject || ''), html: html, text: body.text ? String(body.text) : undefined,
    attachments, date: new Date(), headers: {}
  };
  if (body.important) Object.assign(opts.headers, { 'X-Priority': '1 (Highest)', 'X-MSMail-Priority': 'High', 'Importance': 'High' });
  if (body.readReceipt) opts.headers['Disposition-Notification-To'] = user.email;
  if (body.inReplyTo) { opts.inReplyTo = body.inReplyTo; opts.references = [].concat(body.references || [], body.inReplyTo).filter(Boolean).join(' '); }
  const raw = await new MailComposer(opts).compile().build();
  return { raw, rcpt: [...to, ...cc, ...bcc], opts };
}

// ---------- HTTP ----------
function send(res, status, obj, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  Object.assign(headers, corsHeaders(origin));
  res.writeHead(status, headers);
  res.end(JSON.stringify(obj));
}
function corsHeaders(origin) {
  if (!origin || !ORIGINS.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Filename', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '600', 'Access-Control-Expose-Headers': 'Content-Disposition' };
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(new ApiError(413, 'TOO_LARGE', 'Файл больше 25 МБ')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) { const b = await readBody(req, 8 * 1024 * 1024); try { return b.length ? JSON.parse(b.toString('utf8')) : {}; } catch (e) { throw new ApiError(400, 'BAD_JSON'); } }
function uidList(v) { return [].concat(v || []).map(Number).filter(n => n > 0); }

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders(origin)); return res.end(); }
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/health') return send(res, 200, { ok: true }, origin);
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await whoami(token);
    if (!user) throw new ApiError(401, 'NO_SESSION', 'Войдите в NocoBase заново');
    if (!mailEnabled(user.email)) throw new ApiError(403, 'NOT_ENABLED', 'Почта для вашей учётной записи пока не подключена');
    const email = user.email;

    if (p === '/api/me') return send(res, 200, { email, name: user.name, configured: !!getPassword(email) }, origin);

    if (p === '/api/setup' && req.method === 'POST') {
      const b = await readJson(req);
      const pass = String(b.password || '');
      if (!pass) throw new ApiError(400, 'EMPTY', 'Введите пароль');
      const c = newClient(email, pass);
      try { await c.connect(); await c.logout(); }
      catch (e) { if (isAuthError(e)) throw new ApiError(401, 'BAD_PASSWORD', 'Пароль не подошёл'); throw new ApiError(502, 'IMAP_DOWN', 'Почтовый сервер не отвечает'); }
      setPassword(email, pass);
      const e = pool.get(email); if (e && e.client) { e.client.logout().catch(() => {}); e.client = null; }
      console.log(new Date().toISOString(), 'setup', email);
      return send(res, 200, { ok: true }, origin);
    }

    if (p === '/api/folders') {
      const list = await withImap(email, c => foldersOf(c, email, true));
      return send(res, 200, { folders: list }, origin);
    }
    if (p === '/api/messages') {
      const folder = url.searchParams.get('folder') || 'INBOX';
      const page = Math.max(0, Number(url.searchParams.get('page')) || 0);
      const data = await withImap(email, c => listMessages(c, folder, page, url.searchParams.get('q') || '', url.searchParams.get('filter') || ''));
      return send(res, 200, data, origin);
    }
    if (p === '/api/message') {
      const data = await withImap(email, c => readMessage(c, url.searchParams.get('folder') || 'INBOX', Number(url.searchParams.get('uid'))));
      return send(res, 200, data, origin);
    }
    if (p === '/api/attachment') {
      const idx = Number(url.searchParams.get('idx'));
      const parsed = await withImap(email, c => fetchParsed(c, url.searchParams.get('folder') || 'INBOX', Number(url.searchParams.get('uid'))));
      const a = (parsed.attachments || [])[idx];
      if (!a) throw new ApiError(404, 'NOT_FOUND', 'Вложение не найдено');
      const headers = Object.assign({ 'Content-Type': a.contentType || 'application/octet-stream', 'Content-Length': a.content.length,
        'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(a.filename || 'file'), 'Cache-Control': 'no-store' }, corsHeaders(origin));
      res.writeHead(200, headers);
      return res.end(a.content);
    }
    if (p === '/api/settings') {
      if (req.method === 'POST') { const b = await readJson(req); return send(res, 200, { settings: saveSettings(email, b) }, origin); }
      const stt = settingsOf(email);
      return send(res, 200, { settings: { name: stt.name || user.name || '', signature: stt.signature || '', sigOnReply: stt.sigOnReply !== false } }, origin);
    }
    if (p === '/api/source') {
      const raw = await withImap(email, async c => {
        const lock = await c.getMailboxLock(url.searchParams.get('folder') || 'INBOX', { readOnly: true });
        try {
          const dl = await c.download(String(Number(url.searchParams.get('uid'))), undefined, { uid: true, maxBytes: 3 * 1024 * 1024 });
          if (!dl || !dl.content) throw new ApiError(404, 'NOT_FOUND', 'Письмо не найдено');
          const chunks = []; for await (const ch of dl.content) chunks.push(ch);
          return Buffer.concat(chunks);
        } finally { lock.release(); }
      });
      res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, corsHeaders(origin)));
      return res.end(raw);
    }
    if (p === '/api/attachments.zip') {
      const parsed = await withImap(email, c => fetchParsed(c, url.searchParams.get('folder') || 'INBOX', Number(url.searchParams.get('uid'))));
      const atts = (parsed.attachments || []).filter(a => !(a.contentDisposition === 'inline' && a.contentId));
      if (!atts.length) throw new ApiError(404, 'NOT_FOUND', 'В письме нет вложений');
      res.writeHead(200, Object.assign({ 'Content-Type': 'application/zip', 'Cache-Control': 'no-store',
        'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent('Вложения.zip') }, corsHeaders(origin)));
      const zip = archiver('zip', { zlib: { level: 6 } });
      zip.pipe(res);
      const used = new Set();
      atts.forEach((a, i) => {
        let name = (a.filename || ('вложение-' + (i + 1))).replace(/[\\/]/g, '_');
        while (used.has(name)) name = name.replace(/(\.[^.]*)?$/, ' (' + (i + 1) + ')$1');
        used.add(name);
        zip.append(a.content, { name: name });
      });
      await zip.finalize();
      return;
    }
    if (p === '/api/markall' && req.method === 'POST') {
      const b = await readJson(req);
      await withImap(email, async c => {
        const lock = await c.getMailboxLock(b.folder || 'INBOX');
        try { if (c.mailbox.exists) await c.messageFlagsAdd('1:*', ['\\Seen']); } finally { lock.release(); }
      });
      return send(res, 200, { ok: true }, origin);
    }
    if (p === '/api/empty' && req.method === 'POST') {
      // «Очистить» — только для корзины и спама, как в веб-почте
      const b = await readJson(req);
      await withImap(email, async c => {
        const f = (await foldersOf(c, email, true)).find(x => x.path === b.folder);
        if (!f || (f.special !== '\\Trash' && f.special !== '\\Junk')) throw new ApiError(400, 'NOT_ALLOWED', 'Очистить можно только корзину и спам');
        const lock = await c.getMailboxLock(f.path);
        try { if (c.mailbox.exists) await c.messageDelete('1:*'); } finally { lock.release(); }
      });
      return send(res, 200, { ok: true }, origin);
    }
    if (p.startsWith('/api/folder/') && req.method === 'POST') {
      const b = await readJson(req);
      await withImap(email, async c => {
        const folders = await foldersOf(c, email, true);
        const name = String(b.name || '').trim().replace(/[\/\\*%]/g, ' ').slice(0, 80);
        if (p === '/api/folder/create') {
          if (!name) throw new ApiError(400, 'EMPTY', 'Введите название папки');
          if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) throw new ApiError(400, 'EXISTS', 'Такая папка уже есть');
          await c.mailboxCreate(name);
        } else {
          const f = folders.find(x => x.path === b.path);
          if (!f) throw new ApiError(404, 'NOT_FOUND', 'Папка не найдена');
          if (f.special) throw new ApiError(400, 'SYSTEM', 'Системную папку нельзя ' + (p === '/api/folder/rename' ? 'переименовать' : 'удалить'));
          if (p === '/api/folder/rename') { if (!name) throw new ApiError(400, 'EMPTY', 'Введите название папки'); await c.mailboxRename(f.path, name); }
          else if (p === '/api/folder/delete') {
            // письма из удаляемой папки — в корзину, чтобы ничего не пропало
            const trash = await specialPath(c, email, '\\Trash');
            if (trash && f.total) { const lock = await c.getMailboxLock(f.path); try { await c.messageMove('1:*', trash); } finally { lock.release(); } }
            await c.mailboxDelete(f.path);
          } else throw new ApiError(404, 'NOT_FOUND', 'Нет такого адреса');
        }
        folderCache.delete(email);
      });
      return send(res, 200, { ok: true }, origin);
    }
    if (p === '/api/flags' && req.method === 'POST') {
      const b = await readJson(req);
      await withImap(email, async c => {
        const lock = await c.getMailboxLock(b.folder || 'INBOX');
        try {
          const set = uidList(b.uids).join(',');
          if (!set) return;
          if (b.add && b.add.length) await c.messageFlagsAdd(set, b.add, { uid: true });
          if (b.remove && b.remove.length) await c.messageFlagsRemove(set, b.remove, { uid: true });
        } finally { lock.release(); }
      });
      return send(res, 200, { ok: true }, origin);
    }
    if ((p === '/api/move' || p === '/api/delete' || p === '/api/spam') && req.method === 'POST') {
      const b = await readJson(req);
      await withImap(email, async c => {
        const set = uidList(b.uids).join(',');
        if (!set) return;
        let to = b.to;
        if (p === '/api/spam') to = await specialPath(c, email, '\\Junk');
        const trash = await specialPath(c, email, '\\Trash');
        const lock = await c.getMailboxLock(b.folder || 'INBOX');
        try {
          if (p === '/api/delete') {
            if (!trash || trash === b.folder) await c.messageDelete(set, { uid: true });
            else await c.messageMove(set, trash, { uid: true });
          } else {
            if (!to) throw new ApiError(400, 'NO_TARGET', 'Нет такой папки');
            await c.messageMove(set, to, { uid: true });
          }
        } finally { lock.release(); }
      });
      return send(res, 200, { ok: true }, origin);
    }
    if (p === '/api/upload' && req.method === 'POST') {
      cleanUploads();
      const content = await readBody(req, MAX_UPLOAD);
      const id = crypto.randomBytes(12).toString('hex');
      let filename = 'file';
      try { filename = decodeURIComponent(String(req.headers['x-filename'] || 'file')); } catch (e) { /* ignore */ }
      uploads.set(id, { owner: email, filename: filename.slice(0, 200), contentType: req.headers['content-type'] || 'application/octet-stream', content, exp: Date.now() + 3600 * 1000 });
      return send(res, 200, { id, size: content.length }, origin);
    }
    if ((p === '/api/send' || p === '/api/draft') && req.method === 'POST') {
      const b = await readJson(req);
      const result = await withImap(email, async c => {
        const m = await composeMail(user, b, c);
        if (p === '/api/send') {
          if (!m.rcpt.length) throw new ApiError(400, 'NO_RCPT', 'Укажите получателя');
          try { await transportFor(email).sendMail({ envelope: { from: email, to: m.rcpt }, raw: m.raw }); }
          catch (e) { console.error('send', email, e.message); throw new ApiError(502, 'SMTP', 'Письмо не отправлено: ' + (e.response || e.message)); }
          const sent = await specialPath(c, email, '\\Sent');
          if (sent) { try { await c.append(sent, m.raw, ['\\Seen']); } catch (e) { /* письмо ушло, копия не сохранилась */ } }
          if (b.replyTo && b.replyTo.folder && b.replyTo.uid) {
            const lock = await c.getMailboxLock(b.replyTo.folder);
            try { await c.messageFlagsAdd(String(b.replyTo.uid), [b.forward ? '$Forwarded' : '\\Answered'], { uid: true }); } catch (e) { /* ignore */ } finally { lock.release(); }
          }
        } else {
          const drafts = await specialPath(c, email, '\\Drafts');
          if (!drafts) throw new ApiError(400, 'NO_DRAFTS', 'Нет папки «Черновики»');
          const r = await c.append(drafts, m.raw, ['\\Seen', '\\Draft']);
          if (b.draftUid) { const lock = await c.getMailboxLock(drafts); try { await c.messageDelete(String(b.draftUid), { uid: true }); } catch (e) { /* ignore */ } finally { lock.release(); } }
          return { draftUid: r && r.uid };
        }
        if (b.draftUid) {
          const drafts = await specialPath(c, email, '\\Drafts');
          if (drafts) { const lock = await c.getMailboxLock(drafts); try { await c.messageDelete(String(b.draftUid), { uid: true }); } catch (e) { /* ignore */ } finally { lock.release(); } }
        }
        return {};
      });
      (b.attachments || []).forEach(id => uploads.delete(id));
      return send(res, 200, Object.assign({ ok: true }, result), origin);
    }
    throw new ApiError(404, 'NOT_FOUND', 'Нет такого адреса');
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(new Date().toISOString(), p, e.code || '', e.message);
    if (!res.headersSent) send(res, status, { error: e.code || 'ERROR', message: e.status ? e.message : 'Ошибка почтового сервиса' }, origin);
  }
});
server.listen(PORT, () => console.log('mail service on', PORT));
