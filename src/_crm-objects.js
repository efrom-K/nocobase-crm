// Общий справочник объектов: создание через штатные права NocoBase, без изменения существующих записей.
(function () {
  if (window.__crmObjects) return;
  const normalize = function(name) { return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase(); };
  const clean = function(name) { return String(name || '').trim().replace(/\s+/g, ' '); };
  const rows = function(res) {
    const d = res && res.data && res.data.data !== undefined ? res.data.data : res && res.data;
    if (!Array.isArray(d)) throw new Error('Не удалось загрузить справочник объектов');
    return d;
  };
  async function list() {
    return rows(await ctx.api.resource('contract_objects').list({ paginate: false, fields: ['id', 'name'], sort: ['name'] }));
  }
  async function canCreate() {
    try {
      const token = localStorage.getItem('NOCOBASE_TOKEN');
      if (!token) return false;
      const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return false;
      const data = await res.json();
      return !!(data.data && (data.data.roles || []).some(function(r) {
        return ['root', 'admin', 'rental_dept', 'legal_dept', 'accounting_dept'].indexOf(r.name) !== -1;
      }));
    } catch (e) { return false; }
  }
  function changed() {
    const ev = document.createEvent('Event'); ev.initEvent('crm-objects-changed', false, false); window.dispatchEvent(ev);
  }
  async function create(name) {
    name = clean(name);
    if (!name || name.length > 255) throw new Error('Укажите название объекта — от 1 до 255 символов');
    if (!(await canCreate())) throw new Error('Недостаточно прав для добавления объекта');
    const key = normalize(name);
    let existing = (await list()).find(function(o) { return normalize(o.name) === key; });
    if (existing) { changed(); return { object: existing, existing: true }; }
    let object;
    try {
      const res = await ctx.api.resource('contract_objects').create({ values: { name: name } });
      object = res && res.data && res.data.data ? res.data.data : res && res.data;
      if (!object || !object.id || !object.name) throw new Error('CRM не вернула созданный объект');
    } catch (e) {
      // Уникальный индекс разрешает гонку двух пользователей; повторное чтение возвращает победившую запись.
      existing = (await list()).find(function(o) { return normalize(o.name) === key; });
      if (existing) { changed(); return { object: existing, existing: true }; }
      throw new Error('Не удалось добавить объект. Проверьте подключение и права, затем повторите.');
    }
    changed();
    return { object: object, existing: false };
  }
  async function open(initial) {
    if (document.getElementById('crm-object-create-dialog')) return null;
    if (!(await canCreate()) || document.getElementById('crm-object-create-dialog')) return null;
    const previous = document.activeElement;
    return new Promise(function(resolve) {
      const overlay = document.createElement('div');
      overlay.id = 'crm-object-create-dialog';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.innerHTML = '<form role="dialog" aria-modal="true" aria-labelledby="crm-object-create-title" style="background:#fff;border-radius:6px;padding:24px;width:420px;max-width:100%;box-shadow:0 12px 40px #0003;color:#1f2433;font:14px system-ui;">'
        + '<div id="crm-object-create-title" style="font-size:19px;font-weight:600;margin-bottom:20px;">Добавить объект</div>'
        + '<label for="crm-object-create-name" style="display:block;margin-bottom:6px;">Название объекта</label>'
        + '<input id="crm-object-create-name" autocomplete="off" maxlength="255" required style="box-sizing:border-box;width:100%;padding:9px 12px;border:1px solid #c3cad8;border-radius:6px;font:inherit;">'
        + '<div role="status" aria-live="polite" data-object-status style="font-size:13px;min-height:38px;padding:8px 0;color:#5b6478;">Объект будет доступен во всех разделах CRM.</div>'
        + '<div style="display:flex;gap:8px;justify-content:flex-end;"><button type="button" data-object-cancel style="font:inherit;padding:8px 16px;border:1px solid #c3cad8;border-radius:6px;background:#fff;cursor:pointer;">Отмена</button>'
        + '<button type="submit" data-object-save style="font:inherit;padding:8px 16px;border:1px solid #1c2d58;border-radius:6px;background:#1c2d58;color:#fff;cursor:pointer;">Добавить</button></div></form>';
      const form = overlay.querySelector('form'), input = overlay.querySelector('input');
      const save = overlay.querySelector('[data-object-save]'), cancel = overlay.querySelector('[data-object-cancel]');
      const status = overlay.querySelector('[data-object-status]');
      let saving = false;
      function close(value) {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        if (previous && previous.isConnected) previous.focus();
        resolve(value);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (!saving) close(null); }
        if (e.key === 'Tab') {
          const last = save.disabled ? cancel : save;
          if (e.shiftKey && document.activeElement === input) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); input.focus(); }
        }
      }
      cancel.addEventListener('click', function() { if (!saving) close(null); });
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (saving) return;
        saving = true; save.disabled = true; cancel.disabled = true; input.readOnly = true;
        status.style.color = '#5b6478'; status.textContent = 'Сохранение…';
        try {
          const result = await create(input.value);
          close(result.object);
        } catch (err) {
          status.style.color = '#c23b3b'; status.textContent = err.message;
          saving = false; save.disabled = false; cancel.disabled = false; input.readOnly = false; input.focus();
        }
      });
      input.value = clean(initial);
      document.body.appendChild(overlay);
      document.addEventListener('keydown', onKey, true);
      input.focus();
    });
  }
  window.__crmObjects = { normalize: normalize, list: list, canCreate: canCreate, create: create, open: open };
})();
