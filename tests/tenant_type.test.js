const assert = require('assert');
const fs = require('fs');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'contract-modals.js'), 'utf8');

function extract(name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' exists');
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated ' + name);
}

const values = new Function('TENANT_TYPES', extract('tenantTypeChanges') + ';return tenantTypeChanges;')(
  ['Юрлицо', 'ИП', 'Самозанятый', 'Физлицо'],
);
const hasStatus = new Function(extract('tenantTypeShowsRegistryStatus') + ';return tenantTypeShowsRegistryStatus;')();

assert.deepStrictEqual(values('Самозанятый', { tenant_name: 'ИП Графов', ogrn: '123', kpp: '', passport: '' }), {
  ogrn: '', tenant_name: 'Графов',
});
assert.deepStrictEqual(values('Юрлицо', { kpp: '1', ogrn: '2', passport: '3', director: '4' }), { passport: '' });
assert.deepStrictEqual(values('ИП', { kpp: '1', ogrn: '2', passport: '3', director: '4' }), {
  kpp: '', passport: '', director: '',
});
assert.deepStrictEqual(values('other', { tenant_name: 'ИП Графов', ogrn: '123' }), {});
assert.strictEqual(hasStatus('ИП'), true);
assert.strictEqual(hasStatus('Юрлицо'), true);
assert.strictEqual(hasStatus('Самозанятый'), false);
assert.strictEqual(hasStatus('Физлицо'), false);
assert.strictEqual(hasStatus('Юрлицо', 'ИП'), false);
assert.strictEqual(hasStatus('ИП', 'ИП'), true);
assert.strictEqual(hasStatus('Юрлицо', 'Юрлицо'), true);
console.log('tenant type checks passed');
