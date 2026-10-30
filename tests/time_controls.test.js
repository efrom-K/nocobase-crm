'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const handlers = {}, buttons = [];
const context = { window: {}, document: {
  addEventListener: (name, fn) => { handlers[name] = fn; },
  createEvent: () => ({ initEvent() {} }),
  createElement: tag => ({ style: {}, setAttribute() {}, appendChild(b) { buttons.push(b); },
    addEventListener(name, fn) { this[name] = fn; } })
}};
const code = fs.readFileSync('src/_crm-settings-ui.js', 'utf8').split('// ===== Настройки CRM (интерфейс)')[0];
vm.runInNewContext(code, context);
let saves = 0;
const el = { type: 'time', value: '09:00', isConnected: true, validity: { valid: true },
  getAttribute: () => el.type, dispatchEvent: () => { saves++; }, parentNode: { insertBefore() {} } };
handlers.keydown({ target: el, key: '1' });
let stopped = 0;
handlers.change({ target: el, stopImmediatePropagation() { stopped++; } });
assert.equal(stopped, 1); assert.equal(saves, 0, 'No autosave after a digit');
el.value = '10:25';
handlers.focusout({ target: el });
assert.equal(saves, 1, 'Save once on blur');
handlers.focusout({ target: el }); assert.equal(saves, 1, 'No duplicate save');
handlers.keydown({ target: el, key: '2' });
handlers.keydown({ target: el, key: 'Enter', preventDefault() {} });
assert.equal(saves, 2, 'Enter commits');
handlers.focusin({ target: el }); assert.equal(buttons.length, 4);
el.value = '23:59'; buttons[2].click(); assert.equal(el.value, '00:00'); assert.equal(saves, 3);
buttons[0].click(); assert.equal(el.value, '23:00');
el.disabled = true; buttons[2].click(); assert.equal(el.value, '23:00'); el.disabled = false;
el.type = 'datetime-local'; el.value = '2026-01-31T23:59'; buttons[2].click();
assert.equal(el.value, '2026-02-01T00:00');
handlers.keydown({ target: el, key: '3' }); el.validity.valid = false;
const before = saves; handlers.focusout({ target: el }); assert.equal(saves, before, 'Incomplete values not saved');
handlers.focusin({ target: el }); assert.equal(buttons.length, 4, 'No duplicate controls');
console.log('Time controls: complete keyboard entry, Enter/blur, hour/minute buttons and midnight passed');
