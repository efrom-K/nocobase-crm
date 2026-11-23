'use strict';

const assert = require('node:assert/strict');
const {mkdtempSync, rmSync} = require('node:fs');
const {join} = require('node:path');
const {tmpdir} = require('node:os');
const {createKnowledge, topics} = require('./knowledge');

const dir = mkdtempSync(join(tmpdir(),'crm-knowledge-'));
try {
  const filename = join(dir,'kb.sqlite');
  const kb = createKnowledge(filename);
  const editor = {isAdmin:true, name:'Редактор'};
  const reader = {knowledgeAudiences:[]};
  const manager = {knowledgeAudiences:['managers']};
  const values = {title:'Регламент',topic:topics[0],body:'Первый текст',
    audience:'managers',state:'draft',owner:'Владелец',review:'2026-12-01'};
  assert.throws(()=>kb.save(reader,values),{status:403});
  assert.throws(()=>kb.save(editor,{...values,review:'2026-02-30'}),{status:400});
  const draft = kb.save(editor,values);
  assert.throws(()=>kb.read(manager,draft.id),{status:404});
  const published = kb.save(editor,{...draft,state:'published',body:'Обновлённый текст'});
  assert.throws(()=>kb.read(reader,draft.id),{status:404});
  assert.deepEqual(kb.browse(reader,'текст'),[]);
  assert.equal(kb.browse(manager,'обновлённый ТЕКСТ')[0].id,draft.id);
  assert.throws(()=>kb.history(manager,draft.id),{status:403});
  assert.throws(()=>kb.save(editor,draft),{status:409});
  assert.deepEqual(kb.history(editor,draft.id).map(r=>r.version),[2,1]);
  assert.equal(createKnowledge(filename).read(manager,draft.id).body,published.body);
  kb.save(editor,{...published,state:'archived'});
  assert.equal(kb.browse(manager,'').length,0);
  console.log('Knowledge permissions, search, history, conflicts and persistence passed');
} finally {
  rmSync(dir,{recursive:true,force:true});
}
