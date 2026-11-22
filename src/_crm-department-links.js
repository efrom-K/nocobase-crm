// Быстрые переходы используют те же фильтры этапов, что и сводка по объектам.
function crmDepartmentLinks(activeRole, assignedRoles, departments) {
  const roles = !activeRole || activeRole === '__union__' ? assignedRoles : [activeRole];
  const registry = '/admin/b5znz7yxpy3';
  const sections = {
    rental_dept: ['Отдел аренды', [['Мои черновики', '#drafts'], ['Заявки на аренду', '?stage=0'], ['Размещение объявлений', '?stage=1']]],
    legal_dept: ['Юридический отдел', [['Согласование условий', '?stage=2'], ['Оплата счетов', '?stage=4'], ['Акт и скан', '?stage=5']]],
    accounting_dept: ['Бухгалтерия', [['Подписание и реквизиты', '?stage=3']]]
  };
  return departments.filter(function(role) { return roles.includes(role); }).map(function(role) {
    const [title, links] = sections[role];
    return '<nav class="crm-dept-links" aria-label="' + title + '"><h2>' + title + '</h2><div>' +
      links.map(function(link) { return '<a href="' + registry + link[1] + '">' + link[0] + '</a>'; }).join('') + '</div></nav>';
  }).join('');
}
function crmShowDepartmentLinks(node, activeRole, roles, departments) {
  if (!node) return;
  node.innerHTML = crmDepartmentLinks(activeRole, roles, departments);
  if (!node.firstChild || document.getElementById('crm-dept-links-style')) return;
  const style = document.createElement('style');
  style.id = 'crm-dept-links-style';
  style.textContent = '.crm-dept-links{margin:0 0 18px;color:#1c2d58}.crm-dept-links h2{margin:0 0 8px;font:650 18px/1.3 system-ui,sans-serif}.crm-dept-links div{display:flex;flex-wrap:wrap;gap:6px 16px}.crm-dept-links a{padding:4px 0;color:#294779;text-decoration:underline;text-underline-offset:3px}.crm-dept-links a:focus-visible{outline:2px solid currentColor;outline-offset:2px}';
  document.head.appendChild(style);
}
