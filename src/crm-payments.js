// @include src/_crm-profile.js
ctx.render('<section id="crm-payments-page" aria-label="Заявки на оплату"><h2>Заявки на оплату</h2><div data-payment-register role="region" aria-label="Реестр заявок на оплату"></div></section>');
window.crmPaymentRegister(document.querySelector('#crm-payments-page [data-payment-register]'));
