'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const src = fs.readFileSync('src/crm-hr.js', 'utf8');
const uploads = [], links = [], notices = [];
const panel = {}, body = { innerHTML: '', querySelector: () => panel };
let allowed = false, calendar = 0, fileViews = 0;
const c = vm.createContext({
  hr: { year: 2027, vacView: 'files' }, hBody: () => body, hCan: () => allowed,
  hRenderVacCalendar: box => { assert.equal(box, body); calendar++; },
  hRenderVacPdfs: box => { assert.equal(box, panel); fileViews++; },
  hUpload: async f => { uploads.push(f.name); return { id: uploads.length }; },
  hToast: text => notices.push(text), hLoadFiles: async () => {},
  ctx: { api: { resource: name => {
    assert.equal(name, 'crm_hr_files');
    return { create: async ({ values }) => links.push(values) };
  } } }
});
vm.runInContext(src.slice(src.indexOf('async function hAttach('), src.indexOf('function hWireFiles(')), c);
vm.runInContext(src.slice(src.indexOf('function hRenderVac()'), src.indexOf('function hFilterVacPdfs()')), c);
const file = (name, data) => ({ name, slice: (a, b) => new Blob([data]).slice(a, b) });
(async () => {
  c.hRenderVac();
  assert.equal(calendar, 1); assert.equal(fileViews, 0); assert.equal(body.innerHTML, '');
  allowed = true; c.hRenderVac();
  assert.equal(fileViews, 1); assert.match(body.innerHTML, /PDF по отделам/);
  const n = await c.hAttach([
    file('schedule.PDF', '%PDF-1.7\n'), file('fake.pdf', '<html>'),
    file('other.txt', '%PDF-1.7'), file('second.pdf', '%PDF-1.4\n')
  ], 'vac_schedule', 2027, 'Department', null);
  assert.equal(n, 2); assert.deepEqual(uploads, ['schedule.PDF', 'second.pdf']);
  assert.equal(notices.length, 2);
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.equal(link.entity, 'vac_schedule'); assert.equal(link.record_id, 2027);
    assert.equal(link.doc, 'Department'); assert.ok(link.file_id);
  }
  // Other HR documents keep supporting their existing file formats.
  assert.equal(await c.hAttach([file('order.docx', 'docx')], 'vac', 42, 'Order', null), 1);
  assert.equal(links[2].record_id, 42);
  console.log('HR vacation PDFs: HR-only view, PDF validation, multiple uploads, year/department, other files passed');
})().catch(e => { console.error(e); process.exitCode = 1; });
