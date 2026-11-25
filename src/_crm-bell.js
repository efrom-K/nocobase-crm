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

// Значки разделов используют те же непрочитанные уведомления, что колокольчик.
// У мессенджера свой статус прочтения: последнее прочитанное сообщение в беседе.
if (!window.crmRefreshMenuBadges) {
  (function () {
    const aliases = {
      tskpage01: 'Задачи', payreqpage1: 'Заявки на оплату', j3a32zo1jzo: 'Объекты',
      b5znz7yxpy3: 'Реестр договоров', hrdash01: 'Кадры', hometabhr01: 'Кадры',
      ahodash01: 'АХО', hometabaho1: 'АХО'
    };
    const counts = {};
    let account, busy;
    const style = document.createElement('style');
    style.textContent = '.crm-menu-badge{position:absolute;top:5px;right:2px;min-width:16px;height:16px;line-height:16px;padding:0 4px;border-radius:8px;background:#c23b3b;color:#fff;font-size:10.5px;font-weight:600;text-align:center;box-sizing:border-box;pointer-events:none;z-index:1}';
    document.head.appendChild(style);

    function paint() {
      document.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title').forEach(function (item) {
        let badge = item.querySelector('.crm-menu-badge');
        const text = (item.innerText || '').trim();
        const label = badge && text.endsWith(badge.textContent) ? text.slice(0, -badge.textContent.length).trim() : text;
        const href = item.querySelector('a[href^="/admin/"]')?.getAttribute('href') || '';
        const count = counts[label] || counts[href.split(/[?#]/)[0]];
        if (!count) { if (badge) badge.remove(); return; }
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'crm-menu-badge';
          item.style.position = 'relative';
          item.appendChild(badge);
        }
        const value = count > 99 ? '99+' : String(count);
        if (badge.textContent !== value) badge.textContent = value;
        badge.setAttribute('aria-label', 'Непрочитанных: ' + count);
      });
    }

    async function unreadChat(get, userId) {
      const members = await get('chat_conversation_members:list?paginate=false&fields=conversation_id,last_read_at&filter='
        + encodeURIComponent(JSON.stringify({ user_id: userId })));
      const conversations = members.data.map(function (m) {
        return { conversation_id: m.conversation_id, created_at: { $gt: m.last_read_at || '1970-01-01T00:00:00.000Z' } };
      });
      let count = 0;
      for (let i = 0; i < conversations.length; i += 30) {
        const messages = await get('chat_messages:list?pageSize=1&fields=id&filter='
          + encodeURIComponent(JSON.stringify({ author_id: { $ne: userId }, $or: conversations.slice(i, i + 30) })));
        count += messages.meta.count;
      }
      return count;
    }

    async function refresh() {
      if (busy || /\/signin|\/signup/.test(location.pathname)) return;
      const token = localStorage.getItem('NOCOBASE_TOKEN');
      if (!token) {
        Object.keys(counts).forEach(function (key) { delete counts[key]; });
        paint();
        return;
      }
      busy = true;
      const get = async function (path) {
        const response = await fetch('/api/' + path, { headers: { Authorization: 'Bearer ' + token } });
        if (!response.ok) throw new Error('Notification query failed');
        return response.json();
      };
      try {
        if (!account || account.token !== token) {
          Object.keys(counts).forEach(function (key) { delete counts[key]; });
          account = { token: token, id: (await get('auth:check')).data.id };
        }
        await Promise.all([
          unreadChat(get, account.id).then(function (count) { counts['Мессенджер'] = count; }).catch(function () {}),
          get('myInAppMessages:list?filter[status]=unread&pageSize=200').then(function (result) {
            Object.keys(counts).forEach(function (key) { if (key !== 'Мессенджер') delete counts[key]; });
            result.data.messages.forEach(function (message) {
              const path = String(message.options?.url || '').match(/^\/admin\/[\w/-]+/)?.[0];
              if (!path || path.startsWith('/admin/msgspage01') || path.startsWith('/admin/mailpage01')) return;
              const section = path.split('/').find(function (part) { return aliases[part]; });
              const key = aliases[section] || path;
              counts[key] = (counts[key] || 0) + 1;
            });
          }).catch(function () {})
        ]);
        paint();
      } catch (e) { /* следующий опрос повторит запрос */ }
      finally { busy = false; }
    }

    window.crmRefreshMenuBadges = refresh;
    refresh();
    setInterval(refresh, 15000);
    setInterval(paint, 1500);
    window.addEventListener('focus', refresh);
  })();
}
