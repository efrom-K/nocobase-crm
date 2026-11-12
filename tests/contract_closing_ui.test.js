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
assert(source.indexOf('>Закрытие документов<') < source.indexOf('>Архив<'));
console.log('Contract closing tabs passed');
