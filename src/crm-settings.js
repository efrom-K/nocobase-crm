// Старая страница «Настройки CRM» (/admin/crmcfg01, блок crmblock006) — скрыта из меню. Настройки теперь в шестерёнке NocoBase
// (пункт «Настройки CRM»), в шапках модулей (⚙) и в карточке сотрудника; сам интерфейс — общий фрагмент src/_crm-settings-ui.js.
// Страница оставлена для старых ссылок: открывает ту же шторку.
// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
ctx.render('<div class="cs-empty" style="padding:40px;text-align:center;color:#8c8c8c;">Настройки CRM открываются из шестерёнки NocoBase в верхней панели → «Настройки CRM».<br><button class="cs-btn pri" style="margin-top:14px;" data-crm-settings-open>Открыть настройки</button></div>');
const csPageBtn = ctx.element && ctx.element.querySelector('[data-crm-settings-open]');
if (csPageBtn) csPageBtn.addEventListener('click', function() { window.crmSettingsOpen({}); });
window.crmSettingsOpen({});
