'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync(__dirname + '/server.js', 'utf8');
class ApiError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
let connections = 0, read = async () => Buffer.alloc(10);
const ctx = vm.createContext({
  ApiError, MAX_UPLOAD: 10, Buffer, Date, Map, crypto: require('node:crypto'),
  readBody: (...args) => read(...args), IMAP_HOST: 'mail.example.com', IMAP_PORT: 993, SMTP_HOST: 'mail.example.com', SMTP_PORT: 465,
  loadAccounts: () => ({}), saveAccounts() {}, setPassword() {}, patchState() {}, boxesList: () => [], isAuthError: () => false,
  ImapFlow: class { constructor() { connections++; } on() {} async connect() {} async logout() {} },
  nodemailer: { createTransport: () => ({ verify: async () => {} }) }
});
vm.runInContext(src.slice(src.indexOf('function requireMailboxAccess('), src.indexOf('const server = http.createServer(')), ctx);
assert.throws(() => ctx.requireMailboxAccess({readOnly:true}), {status:403,code:'READ_ONLY'});
assert.doesNotThrow(() => ctx.requireMailboxAccess({readOnly:false}));
vm.runInContext(src.slice(src.indexOf('const MAIL_PRESETS'), src.indexOf('async function guessHosts')), ctx);
vm.runInContext(src.slice(src.indexOf('async function boxesAdd'), src.indexOf('function boxesRemove')), ctx);
vm.runInContext(src.slice(src.indexOf('const uploads ='), src.indexOf('function transportFor')), ctx);
const req = { headers: { 'x-filename': 'note.txt' } };
(async () => {
  const user = { userId: 1, email: 'me@example.com' };
  for (const host of ['127.0.0.1', '169.254.169.254', '192.0.2.10', '::1', 'evil.example']) {
    await assert.rejects(ctx.boxesAdd(user, { email: 'box@example.com', password: 'test', imapHost: host }), { code: 'HOST_NOT_ALLOWED' });
  }
  assert.equal(connections, 0);
  await ctx.boxesAdd(user, { email: 'box@example.com', password: 'test', imapHost: 'imap.gmail.com', smtpHost: 'smtp.gmail.com' });
  assert.equal(connections, 1);
  const release = [];
  read = () => new Promise(resolve => release.push(resolve));
  const pending = Array.from({ length: 4 }, () => ctx.storeUpload(req, 'a'));
  await assert.rejects(ctx.storeUpload(req, 'a'), { code: 'UPLOAD_LIMIT' });
  release.forEach(resolve => resolve(Buffer.alloc(10))); await Promise.all(pending);
  await assert.rejects(ctx.storeUpload(req, 'a'), { code: 'UPLOAD_LIMIT' });
  vm.runInContext('uploads.clear()', ctx);
  read = async () => { throw new Error('disconnected'); };
  await assert.rejects(ctx.storeUpload(req, 'a'), /disconnected/);
  assert.equal(vm.runInContext('pendingUploadBytes', ctx), 0);
  assert.equal(vm.runInContext('pendingUploads.size', ctx), 0);
  read = () => new Promise(resolve => release.push(resolve)); release.length = 0;
  const globalPending = Array.from({ length: 10 }, (_, i) => ctx.storeUpload(req, 'user' + i));
  await assert.rejects(ctx.storeUpload(req, 'another'), { code: 'UPLOAD_LIMIT' });
  release.forEach(resolve => resolve(Buffer.alloc(10))); await Promise.all(globalPending);
  vm.runInContext('for (const u of uploads.values()) u.exp = 0', ctx);
  read = async () => Buffer.alloc(1);
  assert.equal((await ctx.storeUpload(req, 'a')).size, 1);
  const MailComposer = require('nodemailer/lib/mail-composer');
  const { simpleParser } = require('mailparser');
  const raw = await new MailComposer({ from: 'a@example.com', to: 'b@example.com', subject: 'Smoke', text: 'hello', html: '<b>hello</b>', attachments: [{ filename: 'note.txt', content: Buffer.from('attachment') }] }).compile().build();
  const parsed = await simpleParser(raw);
  assert.equal(parsed.subject, 'Smoke');
  assert.equal(parsed.attachments[0].content.toString(), 'attachment');
  const { ZipArchive } = require('archiver');
  const zip = new ZipArchive({ zlib: { level: 6 } }), chunks = [];
  zip.on('data', chunk => chunks.push(chunk));
  const ended = new Promise((resolve, reject) => { zip.on('end', resolve); zip.on('error', reject); });
  zip.append(Buffer.from('attachment'), { name: 'note.txt' });
  await zip.finalize(); await ended;
  assert.equal(Buffer.concat(chunks).subarray(0, 2).toString(), 'PK');
  assert.equal(require('html-to-text').convert('<b>hello</b>'), 'hello');
  console.log('mail service security: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
