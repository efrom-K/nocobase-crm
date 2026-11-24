// @include src/_crm-profile.js
ctx.render('<section class="tk" id="crm-payments-page" aria-label="Заявки на оплату"><div class="tk-head"><h2 class="tk-title" style="margin:0">Заявки на оплату</h2></div><div data-payment-register role="region" aria-label="Заявки на оплату"></div></section>');
window.crmPaymentRegister(document.querySelector('#crm-payments-page [data-payment-register]'));
