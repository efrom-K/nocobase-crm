// ===== Телефон — общий фрагмент: подключается во все блоки CRM =====
// 1) поля ввода 16px: при меньшем шрифте iPhone увеличивает страницу при фокусе, и после этого писать невозможно;
// 2) высота видимой части экрана над клавиатурой → переменные --crm-vvh / --crm-vvt (окна чата и звонка садятся над клавиатурой);
// 3) меньше «рамок в рамках»: на узком экране карточки блоков без лишних полей;
// 4) таблицы NocoBase (реестр и др.) на телефоне — списком карточек.
if (!document.getElementById('crm-mobile-style')) {
  const st = document.createElement('style');
  st.id = 'crm-mobile-style';
  st.textContent = `
    @media (max-width: 700px) {
      input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select { font-size:16px !important; }
      .ant-layout-content .ant-card .ant-card-body { padding:10px !important; }
      .ant-layout-content .ant-card { border-radius:10px; }
      /* таблицы NocoBase — карточками: первое поле заголовком, остальные «название: значение» (подписи ставит опрос ниже) */
      .ant-layout-content .ant-table-content, .ant-layout-content .ant-table-body { overflow:visible !important; }
      .ant-layout-content .ant-table table { display:block; width:100% !important; min-width:0 !important; }
      .ant-layout-content .ant-table colgroup, .ant-layout-content .ant-table thead, .ant-layout-content .ant-table-measure-row { display:none !important; }
      .ant-layout-content .ant-table tbody { display:block; }
      .ant-layout-content .ant-table tbody > tr.ant-table-row { display:block; padding:10px 12px; border-bottom:1px solid #e3e7ee; }
      .ant-layout-content .ant-table tbody > tr.ant-table-row > td { display:block; border:none !important; padding:1px 0 !important; white-space:normal !important; overflow:visible !important; text-overflow:clip !important; position:static !important; max-width:none !important; width:auto !important; font-size:14px; }
      .ant-layout-content .ant-table tbody > tr > td.ant-table-selection-column, .ant-layout-content .ant-table tbody > tr > td.crm-m-empty { display:none !important; }
      .ant-layout-content .ant-table tbody > tr > td.crm-m-title { font-size:15.5px; font-weight:600; padding-bottom:3px !important; }
      .ant-layout-content .ant-table tbody > tr.ant-table-row > td { background:transparent !important; }
      .ant-layout-content .ant-table tbody > tr > td[data-l]:not(.crm-m-title) { display:flex !important; flex-wrap:wrap; align-items:baseline; column-gap:6px; }
      .ant-layout-content .ant-table tbody > tr > td[data-l]:not(.crm-m-title)::before { content:attr(data-l) ':'; color:#8c8c8c; flex:none; }
      .ant-layout-content .ant-table tbody > tr > td .ant-table-cell-content, .ant-layout-content .ant-table tbody > tr > td > * { white-space:normal !important; display:inline; }
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
// подписи для таблиц-карточек: название столбца → data-l у ячейки (строки пересоздаются при листании и сортировке — поэтому опрос)
if (!window.__crmMTables) {
  window.__crmMTables = setInterval(function() {
    if (window.innerWidth > 700) return;
    document.querySelectorAll('.ant-layout-content .ant-table').forEach(function(t) {
      const heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function(th) { return (th.textContent || '').trim().replace(/, квадратных метров$/, ', м²').replace(/^(Статус|Сумма) договора$/, '$1').replace(/^Дата заключения договора$/, 'Заключён').replace(/^Дата расторжения договора$/, 'Расторжение'); });
      t.querySelectorAll('tbody > tr.ant-table-row').forEach(function(tr) {
        let first = true;
        Array.prototype.forEach.call(tr.children, function(td, i) {
          if (td.classList.contains('ant-table-selection-column')) return;
          const l = heads[i] || '';
          if (l && td.getAttribute('data-l') !== l) td.setAttribute('data-l', l);
          const empty = !(td.textContent || '').trim() && !td.querySelector('img,button,a,input');
          td.classList.toggle('crm-m-empty', empty);
          td.classList.toggle('crm-m-title', first && !empty);
          if (!empty) first = false;
        });
      });
    });
  }, 700);
}
// ===== конец фрагмента «телефон» =====
