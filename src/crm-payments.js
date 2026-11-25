// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
// @include src/_crm-bell.js
// @include src/_crm-profile.js
ctx.render('<section class="tk" id="crm-payments-page" aria-label="Заявки на оплату"><div class="tk-head"><h2 class="tk-title" style="margin:0">Заявки на оплату</h2><span hidden data-pay-route-settings>' + crmSettingsGear('Заявки на оплату','data-pay-routes-open') + '</span><button type="button" class="tk-new" data-pay-submit hidden>Подать заявку на оплату</button></div><div data-payment-register role="region" aria-label="Заявки на оплату"></div></section>');
window.crmPaymentRegister(document.querySelector('#crm-payments-page [data-payment-register]'));
