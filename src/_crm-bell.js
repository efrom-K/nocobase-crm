// В колокольчике используем штатный фильтр: прочитанное исчезает из списка сразу.
if (!document.getElementById('nb-bell-tabs-style')) {
  const style = document.createElement('style');
  style.id = 'nb-bell-tabs-style';
  style.textContent = '.ant-tabs:has(> .ant-tabs-nav [data-node-key="unread"].ant-tabs-tab-active):has(> .ant-tabs-nav [data-node-key="read"]) > .ant-tabs-nav { display:none !important; }';
  document.head.appendChild(style);
}
if (!window.__nbBellUnreadTimer) {
  // MutationObserver недоступен в песочнице JS-блоков.
  window.__nbBellUnreadTimer = setInterval(function () {
    document.querySelectorAll('.ant-tabs-tab-active:is([data-node-key="all"], [data-node-key="read"])').forEach(active => {
      const nav = active.closest('.ant-tabs-nav');
      if (!nav?.querySelector('.ant-tabs-tab[data-node-key="read"]')) return;
      nav.querySelector('.ant-tabs-tab[data-node-key="unread"] .ant-tabs-tab-btn')?.click();
    });
  }, 250);
}
