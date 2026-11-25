'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createPayments, paymentManagementPosition } = require('./payments');

const route = {id:19,name:'Тестовый объект',senior:2,chief:3,approver:4,accountant:5};
const user = id => ({id,name:'Сотрудник ' + id});
const bytes = Buffer.from('%PDF-1.7\nsynthetic');
const file = {name:'Счёт.pdf',data:bytes.toString('base64')};
const input = {object:19,counterparty:'Контрагент',purpose:'Обслуживание',due:'2026-12-01',amount:'100,55',file};
const act = (db,id,actor,status,extra) => db.act(user(actor),id,{status,...extra});
test('local payment uses the assigned workflow, parallel approvals, files and scoped access', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  assert.deepEqual(db.objects(),[{id:19,name:route.name}]);
  assert.throws(() => db.submit(user(1),{...input,file:{...file,data:'eA=='}}),{status:400});
  const {id,pending} = db.submit(user(1),input);
  assert.deepEqual(pending,[2]);
  assert.equal(db.browse(user(99)).length,0);
  assert.equal(db.browse({...user(7),isPaymentManager:true}).length,1);
  assert.equal(db.browse({...user(1),readOnly:true}).length,0);
  const f = db.detail(id,user(1)).files[0];
  assert.deepEqual(Buffer.from(db.file(id,f.id,user(2)).bytes),bytes);
  assert.throws(() => db.file(id,f.id,user(99)),{status:404});
  assert.throws(() => act(db,id,1,2),{status:403});
  assert.deepEqual(act(db,id,2,2).pending,[4,3]);
  assert.throws(() => act(db,id,2,2),{status:404});
  assert.equal(act(db,id,4,3).status,3);
  assert.throws(() => act(db,id,4,3),{status:404});
  assert.deepEqual(act(db,id,3,3).pending,[5]);
  assert.equal(act(db,id,5,4,{file}).status,5);
  assert.throws(() => act(db,id,5,5,{file,extra:{...file,data:'eA=='}}),{status:400});
  assert.equal(db.detail(id,user(1)).files.length,2);
  assert.equal(act(db,id,5,5,{file,extra:file}).status,6);
  assert.equal(db.detail(id,user(1)).history.length,6);
  assert.deepEqual(db.detail(id,user(1)).files.map(x=>x.kind),[11,19,21,22]);
});
test('import retains IDs, attachments and an already approved parallel branch without duplicating records', () => {
  const db = createPayments(':memory:');
  const legacy = {legacyId:99,legacyVersion:"1",status:3,route,approved:['approver'],authorId:1,history:[],files:[{kind:11,name:file.name,bytes}]};
  assert.deepEqual(db.loadSnapshot([route],[legacy]),{added:1,updated:0,imported:1,files:1,routes:1});
  assert.deepEqual(db.loadSnapshot([route],[legacy]),{added:0,updated:0,imported:1,files:1,routes:1});
  const [r] = db.browse(user(1));
  assert.equal(r.legacyId,99);
  assert.equal(db.loadSnapshot([route],[{...legacy,legacyVersion:'2'}]).updated,1);
  assert.equal(db.detail(r.id,user(3)).needsAction,true);
  assert.throws(() => db.detail(r.id,user(4)),{status:404});
  assert.equal(act(db,r.id,3,3).status,4);
  assert.throws(() => db.loadSnapshot([route],[{...legacy,legacyVersion:'3'}]),/changed in both systems/);
  assert.equal(db.detail(r.id,user(1)).status,4);
});
test('administrator can transfer, reschedule and return only open eligible stages, with audit', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  const admin={...user(10),isAdmin:true}, employees=[user(7)];
  const {id}=db.submit(user(1),input);
  const change=(operator,action) => {
    const r=db.detail(id,operator);
    return db.manage(operator,id,{status:r.status,revision:r.revision,comment:'Есть основание',...action},employees);
  };
  assert.throws(()=>change(user(2),{action:'assign',role:'senior',userId:7}),{status:403});
  assert.throws(()=>change(admin,{action:'assign',role:'chief',userId:7}),{status:400});
  assert.throws(()=>change(admin,{action:'assign',role:'senior',userId:99}),{status:400});
  assert.deepEqual(change(admin,{action:'assign',role:'senior',userId:7}).pending,[7]);
  assert.equal(db.detail(id,user(7)).needsAction,true);
  assert.throws(()=>act(db,id,2,2),{status:404});
  assert.throws(()=>change(admin,{action:'due',due:'2026-02-31'}),{status:400});
  change(admin,{action:'due',due:'2026-12-02'});
  assert.equal(db.detail(id,admin).due,'2026-12-02');
  act(db,id,7,2);
  act(db,id,4,3);
  assert.equal(change(admin,{action:'return',stage:2}).status,2);
  act(db,id,7,2);
  act(db,id,3,3);
  act(db,id,4,3);
  act(db,id,5,4);
  assert.throws(()=>change(admin,{action:'return',stage:3}),{status:400});
  assert.ok(db.detail(id,admin).history.some(event=>event.text.includes('Передано')));
});
test('payment discussion retains documents and observer access without granting approval', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  const admin = {...user(10),isAdmin:true};
  const {id} = db.submit(user(1),input);
  const observer = {...user(7),isPaymentManager:true};
  const change = (actor,action,userId) => db.discuss(actor,id,{action,userId},[observer]);
  assert.throws(() => change(user(1),'watch-add',7),{status:403});
  assert.throws(() => change(admin,'watch-add',99),{status:400});
  assert.deepEqual(change(admin,'watch-add',7).pending,[7]);
  assert.equal(db.detail(id,observer).needsAction,false);
  assert.throws(() => db.detail(id,user(7)),{status:404});
  assert.throws(() => db.act(observer,id,{status:2}),{status:403});
  assert.throws(() => db.discuss(observer,id,{action:'message',comment:'   '},[]),{status:400});
  assert.throws(() => db.discuss(observer,id,{action:'message',file:{...file,data:'eA=='}},[]),{status:400});
  assert.deepEqual(db.discuss(observer,id,{action:'message',comment:'Документ',file},[observer]).pending,[1,7,2]);
  const record = db.detail(id,user(1));
  assert.equal(record.status,2);
  assert.equal(record.history.length,3);
  assert.deepEqual(db.discuss(user(1),id,{action:'message',comment:'Ответ'},[]).pending,[1,2]);
  const entry = record.history.at(-1);
  assert.equal(entry.kind,'message');
  assert.equal(entry.authorId,7);
  assert.equal(entry.text,'Документ');
  assert.deepEqual(Buffer.from(db.file(id,entry.fileId,observer).bytes),bytes);
  change(admin,'watch-remove',7);
  assert.throws(() => db.file(id,entry.fileId,user(7)),{status:404});
  assert.equal(db.detail(id,user(1)).files.length,2);
});
test('board targets and document types follow the current assignee, including parallel approval', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  const author = user(1), senior = user(2), chief = user(3), approver = user(4), accountant = user(5);
  const aho = {...user(6),isAho:true}, observer = {...user(7),isPaymentManager:true}, admin = {...user(8),isAdmin:true};
  const outsider = user(9), readOnly = {...senior,readOnly:true};
  assert.throws(() => db.submit(author,{...input,file:undefined}),{status:400});
  const {id} = db.submit(author,input);
  const advance = (actor,status,targetStatus,docs) => db.act(actor,id,{status,targetStatus,...docs});
  db.discuss(admin,id,{action:'watch-add',userId:observer.id},[observer]);
  for (const actor of [author,observer]) {
    assert.equal(db.browse(actor)[0].nextStatus,null);
    assert.throws(() => advance(actor,2,3,{file}),{status:403});
  }
  for (const actor of [outsider,readOnly,aho,chief,approver,accountant]) {
    assert.equal(db.browse(actor).length,0);
    assert.throws(() => db.discuss(actor,id,{action:'message',file}),{status:404});
    assert.throws(() => advance(actor,2,3,{file}),{status:404});
  }
  assert.equal(db.browse(senior)[0].nextStatus,3);
  assert.throws(() => advance(senior,2,4),{status:409});
  assert.throws(() => advance(senior,2,3,{file}),{status:400});
  assert.deepEqual(advance(senior,2,3).pending,[4,3]);
  assert.equal(db.browse(approver)[0].nextStatus,3);
  assert.equal(db.browse(chief)[0].nextStatus,3);
  assert.throws(() => advance(approver,3,4),{status:409});
  assert.equal(advance(approver,3).status,3);
  assert.equal(db.browse(approver).length,0);
  assert.equal(db.browse(chief)[0].nextStatus,4);
  assert.deepEqual(advance(chief,3,4).pending,[5]);
  assert.throws(() => advance(chief,4,5,{file}),{status:404});
  assert.throws(() => advance(accountant,4,5,{file,extra:file}),{status:400});
  assert.deepEqual(db.detail(id,author).files.map(f=>f.kind),[11]);
  const receipt = db.discuss(observer,id,{action:'message',file},[observer]);
  assert.equal(receipt.status,4);
  assert.deepEqual(db.detail(id,author).files.map(f=>f.kind),[11,23]);
  assert.deepEqual(advance(accountant,4,5,{file}).pending,[5]);
  assert.equal(advance(accountant,5,6,{file,extra:file}).status,6);
  const record = db.detail(id,author);
  assert.equal(record.nextStatus,null);
  assert.deepEqual(record.files.map(f=>f.kind),[11,23,19,21,22]);
  for (const f of record.files) assert.deepEqual(Buffer.from(db.file(id,f.id,observer).bytes),bytes);
  assert.throws(() => db.file(id,record.files[0].id,outsider),{status:404});
});

test('route settings are admin-only, validate staff, and affect only new payments', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  const admin = {...user(10),isAdmin:true}, readOnly = {...admin,readOnly:true}, employee = user(7);
  const old = db.submit(user(1),input);
  const [current] = db.routes(admin);
  for (const actor of [user(2),readOnly]) {
    assert.throws(() => db.routes(actor),{status:403});
    assert.throws(() => db.saveRoute(actor,current,[employee]),{status:403});
  }
  assert.throws(() => db.saveRoute(admin,{...current,senior:99},[employee]),{status:400});
  const updated = db.saveRoute(admin,{...current,senior:7},[employee]);
  assert.equal(updated.senior,7);
  assert.throws(() => db.saveRoute(admin,current,[employee]),{status:409});
  assert.equal(db.detail(old.id,user(2)).needsAction,true);
  assert.equal(db.submit(user(1),input).pending[0],7);
  db.loadSnapshot([route],[]);
  assert.equal(db.routes(admin)[0].senior,7);
  assert.equal(db.submit(user(1),input).pending[0],7);
});

test('administrator can act through every stage without changing personal action counts', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  const admin = {...user(10),isAdmin:true};
  const {id} = db.submit(user(1),input);
  const advance = (status,targetStatus,docs) => db.act(admin,id,{status,targetStatus,...docs});
  const record = () => db.detail(id,admin);
  assert.equal(record().needsAction,false);
  assert.equal(record().actsAsAdmin,true);
  assert.throws(() => db.act({...admin,readOnly:true},id,{status:2}),{status:404});
  assert.throws(() => advance(2,4),{status:409});
  assert.deepEqual(advance(2,3).pending,[4,3]);
  assert.equal(act(db,id,4,3).status,3);
  assert.deepEqual(advance(3,4).pending,[5]);
  assert.equal(advance(4,5,{file}).status,5);
  assert.equal(advance(5,6,{file,extra:file}).status,6);
  assert.equal(record().nextStatus,null);
  assert.throws(() => advance(6),{status:403});
  assert.deepEqual(record().files.map(file => file.kind),[11,19,21,22]);
  const audit = record().history.filter(event => event.text.includes('действие администратора'));
  assert.equal(audit.length,4);
  assert.ok(audit.every(event => event.authorId === admin.id));
});

test('authors retain their own conversation, and assigned staff read only their pending stages', () => {
  const db = createPayments(':memory:');
  db.loadSnapshot([route],[]);
  const author = user(1), senior = user(2), approver = user(4), chief = user(3), accountant = user(5);
  const manager = {...user(10),isPaymentManager:true}, director = {...user(11),isCtl:true};
  const {id} = db.submit(author,input);
  const other = db.submit(user(9),input);
  const docs = db.detail(id,author).files;
  assert.deepEqual(db.browse(author).map(row => row.id),[id]);
  assert.equal(db.browse(manager).length,2);
  assert.equal(db.browse(director).length,2);
  assert.equal(db.detail(id,director).nextStatus,null);
  assert.throws(() => db.detail(other.id,author),{status:404});
  assert.throws(() => db.discuss(author,other.id,{action:'message',comment:'Тест'},[]),{status:404});
  assert.throws(() => db.file(id,docs[0].id,approver),{status:404});
  assert.equal(db.act(senior,id,{status:2}).canRead,false);
  assert.throws(() => db.detail(id,senior),{status:404});
  assert.deepEqual(db.browse(approver).map(row => row.id),[id]);
  assert.equal(db.act(approver,id,{status:3}).canRead,false);
  assert.equal(db.browse(approver).length,0);
  assert.equal(db.act(chief,id,{status:3}).canRead,false);
  assert.deepEqual(db.browse(accountant).map(row => row.id),[id]);
  assert.equal(db.act(accountant,id,{status:4}).canRead,true);
  assert.equal(db.act(accountant,id,{status:5}).canRead,false);
  assert.equal(db.detail(id,author).status,6);
  db.discuss(author,id,{action:'message',comment:'Получено'},[]);
  assert.equal(db.detail(id,author).history.at(-1).text,'Получено');
  assert.throws(() => db.file(id,docs[0].id,accountant),{status:404});
});

test('only designated management job titles grant wide payment visibility', () => {
  assert.equal(paymentManagementPosition(' ОПЕРАЦИОННЫЙ   ДИРЕКТОР '),true);
  assert.equal(paymentManagementPosition('Старший управляющий объектов'),true);
  for (const position of [null,'Бухгалтер','Помощник управляющего','Менеджер по сдаче']) {
    assert.equal(paymentManagementPosition(position),false);
  }
});
