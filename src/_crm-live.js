// ===== Живое обновление блока: изменения других людей (перенос карточки на доске, новая задача) видны без перезагрузки страницы =====
// const touch = crmLive('tasks', ['crm_tasks'], reload, rootFn): раз в 15 с, только на видимой вкладке, у каждой коллекции спрашивается
// число записей и время последней правки — один лёгкий запрос на коллекцию. Изменилось → reload(). Пока человек занят (тащит карточку,
// открыта форма или карточка, курсор в поле ввода) — ждём, обновится, как только освободится. Блок ушёл со страницы — опрос останавливается.
// touch() — вызвать после своей перезагрузки данных, чтобы своё же изменение не перерисовывало блок второй раз.
function crmLive(name, colls, reload, root) {
  const key = '__crmLive_' + name;
  if (window[key]) clearInterval(window[key]);
  let last = null, running = false;
  const sig = function() {
    return Promise.all(colls.map(function(c) {
      return ctx.api.resource(c).list({ fields: ['id', 'updatedAt'], sort: ['-updatedAt'], pageSize: 1 }).then(function(r) {
        const d = (r && r.data) || {}, row = (d.data || [])[0] || {};
        return ((d.meta || {}).count || 0) + '@' + (row.updatedAt || '');
      }, function() { return '-'; });   // коллекция недоступна этой роли — просто не следим за ней
    })).then(function(a) { return a.join('|'); });
  };
  const occupied = function() {
    const a = document.activeElement;
    return !!(document.querySelector('.tk-modal, .rq-modal, .hr-modal, .kb-form, .drag')
      || (a && a !== document.body && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)));
  };
  const touch = function() { sig().then(function(s) { last = s; }, function() { /* сеть */ }); };
  touch();
  window[key] = setInterval(async function() {
    const el = typeof root === 'function' ? root() : root;
    if (!el || !el.isConnected) { clearInterval(window[key]); return; }
    if (running || document.hidden || last === null) return;
    running = true;
    try {
      const s = await sig();
      if (s !== last && !occupied()) { last = s; await reload(); }
    } catch (e) { /* сеть моргнула — в следующий раз */ }
    running = false;
  }, 15000);
  return touch;
}
// ===== конец фрагмента живого обновления =====
