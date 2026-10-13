// «Пароли» (/admin/vaultpage01, блок vaultblock01) — Vaultwarden внутри CRM: /vault/ на том же домене.
// Caddy (svc /opt/crm-gateway/caddy/Caddyfile) пускает на /vault/ только роль admin NocoBase, панель /vault/admin закрыта.
// В офисе по адресу :13000 пути /vault/ нет — ведём на домен.
if (location.port) {
  ctx.render('<div style="padding:40px;text-align:center;color:#262626;">Пароли открываются на <a href="https://crm.ykinvest.ru/vault/" target="_blank" rel="noopener">crm.ykinvest.ru/vault</a></div>');
} else {
  ctx.render('<iframe class="vw-frame" src="/vault/" title="Пароли" style="width:100%;border:0;display:block;background:#fff;"></iframe>');
  const vwFrame = ctx.element && ctx.element.querySelector('.vw-frame');
  const vwFit = function() { if (vwFrame) vwFrame.style.height = Math.max(480, window.innerHeight - vwFrame.getBoundingClientRect().top - 24) + 'px'; };
  vwFit(); setTimeout(vwFit, 300);
  window.addEventListener('resize', vwFit);
}
