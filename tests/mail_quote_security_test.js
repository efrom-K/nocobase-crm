const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync(__dirname + '/../src/mail.js', 'utf8');
const code = src.slice(src.indexOf('function quoteHeader(m)'), src.indexOf('async function loadContacts()'));
const message = {
  folder: 'INBOX', uid: 1, subject: 'Hello', date: '2026-11-03',
  from: [{ name: 'Sender', address: 'sender@example.com' }],
  to: [], cc: [], attachments: [],
  html: '<img src=x onerror="alert(1)"><script>alert(2)</script>',
  text: '<img src=x onerror="alert(3)">'
};
let opened;
const context = {
  S: { me: { email: 'me@example.com' }, settings: { sigOnReply: true, signature: 'My signature' } },
  esc: value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  longDate: value => value,
  sigHtml: () => '<div>My signature</div>',
  fetchMessage: async () => message,
  openCompose: value => { opened = value; }
};
vm.createContext(context);
vm.runInContext(code, context);

for (const mode of ['reply', 'replyAll', 'forward']) {
  const draft = context.replyDraft(message, mode);
  assert(draft.html.includes('&lt;img src=x onerror=&quot;alert(3)&quot;&gt;'));
  assert(!draft.html.includes('<img') && !draft.html.includes('<script'));
  assert(draft.html.includes('My signature'));
}
(async () => {
  await context.openDraft(1);
  assert.equal(opened.html, '&lt;img src=x onerror=&quot;alert(3)&quot;&gt;');
  assert(!opened.html.includes('<img') && !opened.html.includes('<script'));
  console.log('mail quote security: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
