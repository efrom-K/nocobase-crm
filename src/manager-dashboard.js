// @include src/_crm-config.js
// @include src/_crm-department-links.js
// @include src/_crm-room-card.js
// @include src/_crm-request-row.js
// @include src/_crm-dashboard-floor.js
ctx.render('<section aria-label="Дашборд управляющих"><div data-manager-floor></div></section>');
crmMountFloor(ctx.element.querySelector('[data-manager-floor]'));
