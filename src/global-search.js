
ctx.render(`<input id="global-search-input" type="text" placeholder="Поиск по номеру договора, фамилии, объекту, электронной почте…" class="ant-input" style="width:100%;padding:6px 12px;border:1px solid #d9d9d9;border-radius:6px;" />`);
if (ctx.element && ctx.element.addEventListener) {
  let timeout;
  const FIELDS = ['contract_number','object_name','tenant_name','email','phone','tenant_fio'];
  ctx.element.addEventListener('input', (e) => {
    clearTimeout(timeout);
    const val = (e.target.value || '').trim();
    timeout = setTimeout(async () => {
      const uid = window.__activeRegistryTable || 'ozazmpm4o4v';
      const target = ctx.model.flowEngine.getModel(uid);
      if (!target || !target.resource) return;
      if (!val) {
        target.resource.removeFilterGroup('search');
      } else {
        target.resource.addFilterGroup('search', {'$or': FIELDS.map(f => ({[f]: {'$includes': val}}))});
      }
      target.resource.setPage(1);
      await target.resource.refresh();
    }, 300);
  });
}
