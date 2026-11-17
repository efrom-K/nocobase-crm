const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('src/registry-tabs.js', 'utf8');
const calls = [], cards = {};
const resource = {
  addFilterGroup: (name, filter) => calls.push([name, filter.closure_state]),
  removeFilterGroup: name => calls.push(['remove', name]), setPage: n => calls.push(['page', n]),
  refresh: () => calls.push(['refresh'])
};
const context = {
  ctx: { render() {}, model: { flowEngine: {} } }, window: {}, localStorage: { getItem() {} },
  location: { pathname: '/admin' }, setInterval() {}, clearInterval() {},
  colTable: () => ({ resource }),
  document: {
    querySelectorAll: () => [],
    querySelector: selector => ({ closest: () => ({ style: cards[selector] = {} }) }),
    getElementById: () => null
  }
};
vm.createContext(context);
vm.runInContext(source.split('// ---------- личная настройка столбцов таблиц ----------')[0], context);
vm.runInContext("switchRegistryTable('cm-closing-tab')", context);
assert(calls.some(x => x[0] === 'closure' && x[1] === 'pending'));
assert.strictEqual(cards['[data-uid="ipb7gfluldk"]'].display, '');
assert.strictEqual(cards['[data-uid="ozazmpm4o4v"]'].display, 'none');
assert.strictEqual(context.window.__cmRegistryTableUid('cm-closing-tab'), 'ipb7gfluldk');
vm.runInContext("switchRegistryTable('ipb7gfluldk')", context);
assert(calls.some(x => x[0] === 'closure' && x[1] === 'archived'));
const n = calls.length;
vm.runInContext("applyVisibility('ipb7gfluldk')", context);
assert.strictEqual(calls.length, n, 'visibility retry must not refetch unchanged state');
assert(source.indexOf('>Завершение документов · …<') < source.indexOf('>Архив<'));
console.log('Contract closing tabs passed');

const countStart = source.indexOf('async function refreshClosingCount()');
const countEnd = source.indexOf('async function refreshNotifRows()', countStart);
const tab = {textContent:'Завершение документов · …'};
let countResponse = {ok:true,json:async()=>({data:[{id:1}],meta:{count:137}})}, countUrl;
context.colAuthHeaders = () => ({});
context.fetch = async url => {countUrl=url;return countResponse;};
context.document.querySelector = () => tab;
vm.runInContext(source.slice(countStart,countEnd),context);
(async()=>{
  await context.refreshClosingCount();
  assert.strictEqual(tab.textContent,'Завершение документов · 137');
  assert.deepStrictEqual(JSON.parse(decodeURIComponent(countUrl.split('filter=')[1])),{closure_state:'pending'});
  assert(countUrl.includes('pageSize=1'), 'counter should not download every contract');
  countResponse={ok:true,json:async()=>({data:[],meta:{count:0}})};
  await context.refreshClosingCount();
  assert.strictEqual(tab.textContent,'Завершение документов · 0');
  countResponse={ok:false};await context.refreshClosingCount();
  assert.strictEqual(tab.textContent,'Завершение документов · 0','failed request must keep the last count');
  console.log('Closing tab total count passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
