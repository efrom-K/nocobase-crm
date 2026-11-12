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
assert.deepStrictEqual(plain(context.closingSettlement(v)), {refund:3002,retained:0,rent:6999});
assert.deepStrictEqual(plain(context.closingSettlement({...v,closure_deposit_remainder:'retain'})), {refund:3002,retained:6999,rent:0});
assert.strictEqual(context.closingSettlement({...v,closure_deposit_refund:'100.01'}), null);
const files = [{id:1},{id:2},{id:3}];
assert.strictEqual(context.closingProblem(v,files), '');
assert(context.closingProblem({...v,closure_documents:v.closure_documents.slice(1)},files));
assert(context.closingProblem({...v,closure_documents:v.closure_documents.map(d=>({...d,signed_on:'2026-02-30'}))},files));
assert(context.closingProblem({...v,closure_deposit_remainder:null},files));
assert(context.closingProblem({...v,closure_documents:[...v.closure_documents,{file_id:4,kind:'other',signed_on:null}]},[...files,{id:4}]));
for (const [action,expected] of [['refund',{refund:10001,retained:0,rent:0}],['retain',{refund:0,retained:10001,rent:0}],['rent',{refund:0,retained:0,rent:10001}]]) {
  assert.deepStrictEqual(plain(context.closingSettlement({...v,closure_deposit_action:action})), expected);
}
console.log('Closing validation and exact kopeck allocation passed');
