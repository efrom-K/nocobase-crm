// ===== Телефон — общий фрагмент: подключается во все блоки CRM =====
// 1) поля ввода 16px: при меньшем шрифте iPhone увеличивает страницу при фокусе, и после этого писать невозможно;
// 2) высота видимой части экрана над клавиатурой → переменные --crm-vvh / --crm-vvt (окна чата и звонка садятся над клавиатурой);
// 3) меньше «рамок в рамках»: на узком экране карточки блоков без лишних полей.
if (!document.getElementById('crm-mobile-style')) {
  const st = document.createElement('style');
  st.id = 'crm-mobile-style';
  st.textContent = `
    @media (max-width: 700px) {
      input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select { font-size:16px !important; }
      .ant-layout-content .ant-card .ant-card-body { padding:10px !important; }
      .ant-layout-content .ant-card { border-radius:10px; }
    }
  `;
  document.head.appendChild(st);
}
if (!window.__crmVV) {
  window.__crmVV = true;
  const vv = window.visualViewport, root = document.documentElement;
  const fit = function() {
    root.style.setProperty('--crm-vvh', (vv ? vv.height : window.innerHeight) + 'px');
    root.style.setProperty('--crm-vvt', (vv ? vv.offsetTop : 0) + 'px');
  };
  fit();
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } else window.addEventListener('resize', fit);
}
// ===== конец фрагмента «телефон» =====
