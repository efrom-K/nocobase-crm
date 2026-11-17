const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = { dateProblem: v => /^((19|20)\d{2})-\d{2}-\d{2}$/.test(v) ? '' : 'bad date' };
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/_crm-closing.js', 'utf8'), context);
const money = context.closingMoney, amount = context.closingAmount;
assert.strictEqual(money('100 000,01'), 10000001);
assert.strictEqual(money('0.01'), 1);
assert.strictEqual(amount(10000001), '100000.01');
assert.strictEqual(money(''), null);
for (const bad of ['-1', '1.005', '1,2,3', '1e3', 'Infinity', 'NaN', '1000000000000']) assert.throws(() => money(bad));
const v = {closure_termination_mode:'unilateral',closure_deposit_amount:'100.01',closure_deposit_action:'partial',closure_deposit_refund:'30.02',closure_deposit_remainder:'rent',closure_documents:[
  {file_id:1,kind:'termination_agreement',signed_on:'2026-11-10'}, {file_id:2,kind:'return_act',signed_on:'2026-11-11'}, {file_id:3,kind:'reconciliation_act',signed_on:'2026-11-12'}]};
const plain = x => JSON.parse(JSON.stringify(x));
assert.deepStrictEqual(plain(context.closingSettlement(v)), {refund:3002,retained:6999,rent:0});
assert.deepStrictEqual(plain(context.closingSettlement({...v,closure_deposit_remainder:'retain'})), {refund:3002,retained:6999,rent:0});
assert.strictEqual(context.closingSettlement({...v,closure_deposit_refund:'100.01'}), null);
const files = [{id:1},{id:2},{id:3}];
assert.strictEqual(context.closingProblem(v,files), '');
assert(context.closingProblem({...v,closure_documents:v.closure_documents.slice(1)},files));
assert(context.closingProblem({...v,closure_documents:v.closure_documents.map(d=>({...d,signed_on:'2026-02-30'}))},files));
assert.strictEqual(context.closingProblem({...v,closure_deposit_remainder:null},files), '');
assert(context.closingProblem({...v,closure_documents:[...v.closure_documents,{file_id:4,kind:'other',signed_on:null}]},[...files,{id:4}]));
for (const [action,expected] of [['refund',{refund:10001,retained:0,rent:0}],['retain',{refund:0,retained:10001,rent:0}],['rent',{refund:0,retained:0,rent:10001}]]) {
  assert.deepStrictEqual(plain(context.closingSettlement({...v,closure_deposit_action:action})), expected);
}
console.log('Closing validation and exact kopeck allocation passed');

assert.strictEqual(context.closingCanRestore({closure_state:'archived',closure_deposit_action:'partial'}), false);
assert.strictEqual(context.closingCanRestore({closure_state:'archived'}), true);
assert.strictEqual(context.closingCanRestore({closure_state:'pending',closure_deposit_action:'partial'}), true);

// hasRole grants administrators every capability; readonly membership must be checked directly.
const modals = fs.readFileSync('src/contract-modals.js', 'utf8');
for (const name of ['hasRole', 'canArchiveContract']) {
  vm.runInContext(modals.match(new RegExp('function ' + name + '\\([^]*?\\n}'))[0], context);
}
assert.strictEqual(context.canArchiveContract({__isAdmin:true,roles:[{name:'admin'}]}), true);
assert.strictEqual(context.canArchiveContract({roles:[{name:'accounting_dept'}]}), true);
assert.strictEqual(context.canArchiveContract({roles:[{name:'legal_dept'}]}), false);
assert.strictEqual(context.canArchiveContract({roles:[{name:'accounting_dept'},{name:'crm_readonly'}]}), false);
assert.strictEqual(context.canArchiveContract({__isAdmin:true,roles:[{name:'admin'},{name:'crm_readonly'}]}), false);
assert.strictEqual(context.canArchiveContract(null), false);
console.log('Closing archive permissions passed');

const combined = {...v,closure_documents:[{...v.closure_documents[0],kind:'termination_and_return'},v.closure_documents[2]]};
assert.strictEqual(context.closingProblem(combined,[files[0],files[2]]), '');
assert(context.closingProblem({...combined,closure_documents:combined.closure_documents.slice(0,1)},[files[0]]));
assert(context.closingProblem({...combined,closure_documents:[{...combined.closure_documents[0],signed_on:null},combined.closure_documents[1]]},[files[0],files[2]]));
console.log('Combined termination and return document passed');

assert.deepStrictEqual(plain(context.closingSettlement({...v,closure_state:'archived',closure_deposit_retained:'0',closure_deposit_rent:'69.99'})), {refund:3002,retained:0,rent:6999});
