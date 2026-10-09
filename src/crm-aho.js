// «Дашборд АХО (тест)» (/admin/ahodash01, блок crmblock005) — рабочее место офис-менеджера (административно-хозяйственный отдел).
// Устроен как дашборд HR: главный экран = плитки разделов + лента «Требует внимания»; клик по плитке открывает раздел, «← Дашборд АХО» возвращает.
// Разделы повторяют её работу: регулярные дела по регламенту, счета (согласование, оплата, закрывающие) и регулярные платежи с планом/фактом,
// доверенности, требования арендаторам по пожарной безопасности, корреспонденция и служебные записки, машины и штрафы, рассылки арендаторам.
// Коллекции — scripts/setup_crm_aho.py. Кто согласует счета — app_settings aho_approver_user_id; уведомления о согласовании — через очередь
// task_notifications (сразу в колокольчик), сроки — ночным scripts/aho_reminders.py.
// единый вид выпадающих списков и кнопок «Выберите файл» во всех блоках CRM — тот же фрагмент в каждом блоке, где они есть
// (не в branding/global.css: его браузеры кэшируют на год, правка дошла бы только после Ctrl+F5)
if (!document.getElementById('crm-controls-style')) {
  const st = document.createElement('style');
  st.id = 'crm-controls-style';
  st.textContent = `
    select:not([multiple]):not([size]) { -webkit-appearance:none; -moz-appearance:none; appearance:none; cursor:pointer;
      background-color:#fff; border:1px solid #d9d9d9; border-radius:6px; color:#262626; font-family:inherit; line-height:1.4;
      padding-right:30px !important; text-overflow:ellipsis; transition:border-color .2s, box-shadow .2s;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%238c8c8c' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
      background-repeat:no-repeat !important; background-position:right 10px center !important; background-size:12px 12px !important; }
    select:not([multiple]):not([size]):hover { border-color:#4b5f8f; }
    select:not([multiple]):not([size]):focus { outline:none; border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
    select:not([multiple]):not([size]):disabled { background-color:#f5f5f5 !important; color:#bfbfbf; cursor:not-allowed; border-color:#d9d9d9; }
    select option { color:#262626; background:#fff; }
    select option:disabled { color:#bfbfbf; }
    input[type=file] { font-family:inherit; font-size:13px; color:#595959; max-width:100%; }
    input[type=file]::file-selector-button { font:inherit; font-size:13px; color:#1c2d58; background:#fff; border:1px solid #d9d9d9; border-radius:6px;
      padding:5px 12px; margin-right:10px; cursor:pointer; transition:border-color .2s, color .2s, background .2s; }
    input[type=file]::file-selector-button:hover { border-color:#1c2d58; background:#f3f5fa; }
  `;
  document.head.appendChild(st);
}
if (!document.getElementById('crm-aho-style')) {
  const st = document.createElement('style');
  st.id = 'crm-aho-style';
  st.textContent = `
    .hr { color:#1f1f1f; font-size:14px; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    .hr-head { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
    .hr-title { font-size:20px; font-weight:700; }
    .hr-tabs { display:flex; gap:2px; border-bottom:1px solid #f0f0f0; margin-bottom:14px; flex-wrap:wrap; }
    .hr-tab { border:none; background:none; padding:9px 14px; font:inherit; font-size:14px; color:#595959; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
    .hr-tab.on { color:#1c2d58; border-bottom-color:#1c2d58; font-weight:600; }
    .hr-tab b { font-weight:600; color:#8c8c8c; margin-left:4px; font-size:12.5px; }
    .hr-tab b.red { color:#cf1322; }
    .hr-new { margin-left:auto; border:none; background:#1c2d58; color:#fff; border-radius:8px; padding:9px 18px; font:inherit; font-size:14px; font-weight:600; cursor:pointer; }
    .hr-new:hover { background:#2f4373; }
    .hr-bar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
    .hr select, .hr input[type=text], .hr input[type=date], .hr input[type=number], .hr textarea,
    .hr-modal select, .hr-modal input[type=text], .hr-modal input[type=date], .hr-modal input[type=number], .hr-modal textarea {
      border:1px solid #d9d9d9; border-radius:6px; padding:7px 10px; font:inherit; font-size:13.5px; background:#fff; color:#262626; box-sizing:border-box; }
    .hr-bar select { min-width:150px; }
    .hr-bar input[type=text] { flex:1; min-width:200px; }
    .hr-seg { display:inline-flex; border:1px solid #d9d9d9; border-radius:6px; overflow:hidden; }
    .hr-seg button { border:none; background:#fff; padding:7px 12px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    .hr-seg button.on { background:#1c2d58; color:#fff; font-weight:600; }
    .hr-only { display:flex; gap:10px; align-items:center; background:#eef1f8; border:1px solid #b4bfd9; border-radius:8px; padding:8px 12px; margin-bottom:12px; font-size:13.5px; }
    .hr-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
    .hr-tile { border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; background:#fff; }
    .hr-tile[data-go], .hr-sect { cursor:pointer; }
    .hr-sect { display:flex; flex-direction:column; }
    .hr-sect:hover { border-color:#1c2d58; box-shadow:0 2px 8px rgba(28,45,88,.08); }
    .hr-tile-go { margin-top:auto; padding-top:6px; font-size:12.5px; color:#1c2d58; }
    .hr-sect .hr-tile-l { color:#262626; font-weight:600; font-size:13.5px; }
    .hr-tile[data-go]:hover { border-color:#b4bfd9; }
    .hr-tile-l { font-size:12.5px; color:#8c8c8c; }
    .hr-tile-v { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px; }
    .hr-tile-v.red { color:#cf1322; }
    .hr-tile-n { font-size:12px; color:#8c8c8c; margin-top:2px; }
    .hr-cols { display:grid; grid-template-columns:minmax(0, 3fr) minmax(0, 2fr); gap:12px; align-items:start; }
    .hr-card { border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; background:#fff; min-width:0; overflow-x:auto; margin-bottom:12px; }
    .hr-card-t { font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
    .hr-card-t .hr-btn { margin-left:auto; }
    .hr-card-t small { font-weight:400; color:#8c8c8c; }
    .hr-al { display:flex; gap:10px; align-items:flex-start; padding:8px 4px; border-bottom:1px solid #f5f5f5; cursor:pointer; font-size:13.5px; }
    .hr-al:hover { background:#f5faff; }
    .hr-al:last-child { border-bottom:none; }
    .hr-dot { flex:none; width:8px; height:8px; border-radius:50%; margin-top:6px; }
    .hr-al-t { flex:1; min-width:0; }
    .hr-al-s { font-size:12px; color:#8c8c8c; }
    .hr table, .hr-modal table { width:100%; border-collapse:collapse; font-size:13px; }
    .hr th, .hr-modal th { text-align:left; font-weight:600; color:#595959; padding:6px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    .hr td, .hr-modal td { padding:6px 8px; border-bottom:1px solid #f5f5f5; font-variant-numeric:tabular-nums; }
    .hr th.n, .hr td.n { text-align:right; }
    .hr td .hr-none, .hr td .hr-ok, .hr td .hr-soon, .hr td .hr-late { white-space:nowrap; }
    .hr tr[data-emp], .hr tr[data-rec], .hr-modal tr[data-task] { cursor:pointer; }
    .hr tr[data-emp]:hover td, .hr tr[data-rec]:hover td, .hr-modal tr[data-task]:hover td { background:#f5faff; }
    .hr-empty { color:#8c8c8c; padding:28px 12px; text-align:center; background:#fafafa; border-radius:8px; }
    .hr-empty b { display:block; color:#434343; font-size:15px; margin-bottom:4px; }
    .hr-hint { font-size:12px; color:#8c8c8c; margin-top:3px; }
    .hr-grp { display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; font-weight:600; font-size:15px; margin:18px 0 8px; }
    .hr-grp span { font-weight:400; color:#8c8c8c; font-size:12.5px; }
    .hr-chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .hr-chip { font-size:11.5px; padding:1px 7px; border-radius:10px; background:#f5f5f5; color:#595959; white-space:nowrap; }
    .hr-chip.blue { background:#eef1f8; color:#142142; }
    .hr-chip.orange { background:#fff7e6; color:#d46b08; }
    .hr-chip.red { background:#fff1f0; color:#cf1322; }
    .hr-chip.green { background:#f6ffed; color:#389e0d; }
    .hr-chip.purple { background:#f9f0ff; color:#722ed1; }
    .hr-ok { color:#389e0d; } .hr-soon { color:#d46b08; font-weight:600; } .hr-late { color:#cf1322; font-weight:600; } .hr-none { color:#bfbfbf; }
    /* окна */
    .hr-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
    .hr-box { background:#fff; border-radius:12px; width:100%; max-width:720px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f1f1f; }
    .hr-box.wide { max-width:980px; }
    .hr-box-h { display:flex; align-items:flex-start; gap:12px; padding:16px 20px 12px; border-bottom:1px solid #f0f0f0; }
    .hr-box-t { font-size:17px; font-weight:700; flex:1; min-width:0; }
    .hr-box-t small { display:block; margin-top:4px; font-size:13px; font-weight:400; color:#595959; }
    .hr-x { border:none; background:transparent; font-size:18px; color:#8c8c8c; cursor:pointer; padding:2px 6px; }
    .hr-box-b { padding:16px 20px 20px; }
    .hr-form { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px 16px; }
    .hr-form .full, .hr-f.full { grid-column:1 / -1; }
    .hr-f label { display:block; font-size:12.5px; color:#595959; margin-bottom:4px; }
    .hr-f label i { color:#cf1322; font-style:normal; }
    .hr-f select, .hr-f input, .hr-f textarea { width:100%; }
    .hr-f textarea { min-height:64px; resize:vertical; }
    .hr-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; align-items:center; }
    .hr-btn { border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:6px 13px; font:inherit; font-size:13.5px; cursor:pointer; color:#262626; text-decoration:none; }
    .hr-btn:hover { border-color:#1c2d58; color:#1c2d58; }
    .hr-btn.pri { border-color:#1c2d58; background:#1c2d58; color:#fff; font-weight:600; }
    .hr-btn.warn { color:#cf1322; border-color:#ffccc7; margin-left:auto; }
    .hr-btn.sm { padding:2px 9px; font-size:12.5px; }
    .hr-btn:disabled { opacity:.5; cursor:default; }
    .hr-secs { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; }
    .hr-sec { border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; min-width:0; }
    .hr-sec.full { grid-column:1 / -1; }
    .hr-sec-t { font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
    .hr-sec-t .hr-btn { margin-left:auto; }
    .hr-kv { display:grid; grid-template-columns:minmax(0, 2fr) minmax(0, 3fr); gap:4px 12px; font-size:13.5px; }
    .hr-kv .k { color:#8c8c8c; font-size:12.5px; padding-top:1px; }
    .hr-kv .v { white-space:pre-wrap; overflow-wrap:anywhere; }
    .hr-lines > div { display:flex; gap:8px; align-items:baseline; padding:4px 0; border-bottom:1px solid #f5f5f5; font-size:13.5px; }
    .hr-lines > div:last-child { border-bottom:none; }
    .hr-lines > div > span:first-child { flex:1; min-width:0; }
    .hr-lines [data-rec], .hr-lines [data-task] { cursor:pointer; }
    .hr-lines [data-rec]:hover, .hr-lines [data-task]:hover { color:#1c2d58; }
    .hr-pick { max-height:260px; overflow:auto; border:1px solid #f0f0f0; border-radius:8px; padding:6px 10px; columns:2; }
    .hr-pick label { display:block; font-size:13px; padding:2px 0; break-inside:avoid; cursor:pointer; }
    .hr-lock { font-size:12.5px; color:#8c8c8c; }
    .hr-files { margin-top:14px; border-top:1px dashed #e8e8e8; padding-top:10px; }
    .hr-files-h { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
    .hr-files-h b { font-size:13.5px; margin-right:auto; }
    .hr-files-h select { font-size:12.5px; padding:4px 8px; }
    .hr-flink { color:#1c2d58; text-decoration:none; font-size:13px; cursor:pointer; }
    .hr-fcell { display:inline-flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    .hr-fdel { border:none; background:none; color:#bfbfbf; cursor:pointer; font-size:12px; padding:0 2px; }
    .hr-fdel:hover { color:#cf1322; }
    @media (max-width: 800px) {
      .hr-cols, .hr-secs, .hr-form { grid-template-columns:1fr; }
      .hr-new { margin-left:0; width:100%; }
      .hr-bar select, .hr-bar input[type=text] { flex:1 1 100%; min-width:0; }
      .hr-modal { padding:0; }
      .hr-box { border-radius:0; min-height:100%; max-width:none; }
      .hr-pick { columns:1; }
    }
  
    .kb { display:grid; grid-template-columns:repeat(var(--n, 5), minmax(0, 1fr)); gap:12px; min-height:380px; }
    .kb-col { display:flex; flex-direction:column; min-height:0; min-width:0; background:#f4f5f7; border-radius:10px; border:2px solid transparent; transition:opacity .15s, border-color .15s, background .15s; }
    .kb-col.no { opacity:.4; }
    .kb-col.ok { border-color:#c9d3ea; border-style:dashed; }
    .kb-col.drop { border-color:#1c2d58; border-style:solid; background:#eaeef7; }
    .kb-col-h { display:flex; align-items:center; gap:7px; font-weight:600; font-size:13px; padding:10px 12px 8px; color:#262626; }
    .kb-col-h i { width:8px; height:8px; border-radius:50%; background:var(--c); flex:none; }
    .kb-col-h b { margin-left:auto; color:#8c8c8c; font-weight:600; font-variant-numeric:tabular-nums; background:#fff; border-radius:9px; padding:0 7px; font-size:12px; }
    .kb-col-b { flex:1; overflow-y:auto; padding:0 8px 8px; min-height:0; }
    .kb-card { background:#fff; border:1px solid #e8eaef; border-left:3px solid var(--c); border-radius:8px; padding:9px 11px; margin-bottom:8px; font-size:12.5px; cursor:grab; user-select:none; box-shadow:0 1px 2px rgba(16,24,40,.04); }
    .kb-card:hover { border-color:#b4bfd9; border-left-color:var(--c); box-shadow:0 2px 6px rgba(16,24,40,.08); }
    .kb-card:active { cursor:grabbing; }
    .kb-card.drag { opacity:.35; }
    .kb-card.pending { cursor:default; border-color:#1c2d58; border-left-color:var(--c); box-shadow:0 4px 14px rgba(28,45,88,.18); user-select:auto; }
    .kb-t { font-weight:600; font-size:13.5px; line-height:1.35; margin-bottom:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
    .kb-s { color:#8c8c8c; line-height:1.5; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .kb-note, .kb-empty { font-size:12px; color:#a6a6a6; padding:6px 4px; text-align:center; }
    .kb-form { margin-top:8px; padding-top:8px; border-top:1px dashed #d9d9d9; }
    .kb-form label { display:block; font-size:12px; color:#595959; margin-bottom:4px; }
    .kb-form textarea, .kb-form select { width:100%; box-sizing:border-box; border:1px solid #d9d9d9; border-radius:6px; padding:6px 8px; font:inherit; font-size:13px; resize:vertical; background:#fff; }
    .kb-form textarea:focus, .kb-form select:focus { outline:none; border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
    .kb-form-b { display:flex; align-items:center; gap:6px; margin-top:6px; flex-wrap:wrap; }
    .kb-form-b span { font-size:11px; color:#a6a6a6; }
    .kb-ok { border:none; background:#1c2d58; color:#fff; border-radius:6px; padding:5px 12px; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
    .kb-no { border:1px solid #d9d9d9; background:#fff; color:#434343; border-radius:6px; padding:4px 10px; font:inherit; font-size:12.5px; cursor:pointer; }
    .kb-ok:disabled, .kb-no:disabled { opacity:.5; }
    @media (max-width: 700px) { .kb { grid-template-columns:repeat(var(--n, 5), 260px); overflow-x:auto; } .kb-col-b { max-height:70vh; } }
    .hr-chip.grey { background:#f5f5f5; color:#8c8c8c; }
    .hr-st { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
    .hr-st button { border:1px solid #d9d9d9; background:#fff; border-radius:14px; padding:3px 11px; font:inherit; font-size:12.5px; cursor:pointer; color:#595959; }
    .hr-st button.on { border-color:#1c2d58; background:#eef1f8; color:#142142; font-weight:600; }
    .hr-st button b { font-weight:600; margin-left:3px; }
    .hr td.btn { white-space:nowrap; text-align:right; }
    .hr-flow { display:flex; gap:4px; flex-wrap:wrap; margin:0 0 12px; font-size:12px; }
    .hr-flow span { padding:2px 8px; border-radius:10px; background:#f5f5f5; color:#8c8c8c; }
    .hr-flow span.on { background:#1c2d58; color:#fff; }
    .hr-flow span.done { background:#eef1f8; color:#142142; }
    .hr-plan input { width:90px; padding:3px 6px !important; text-align:right; font-size:12.5px !important; }
    .hr-plan td, .hr-plan th { white-space:nowrap; }
    .hr-mails { font-size:12.5px; color:#595959; word-break:break-all; background:#fafafa; border-radius:8px; padding:8px 10px; }
    /* читаемость (как в статистике заявок): контрастные плитки, карточки и таблицы */
    .hr-tile { border-color:#dfe3ea; }
    .hr-tile[data-go]:hover { border-color:#1c2d58; box-shadow:0 2px 8px rgba(16,24,40,.08); }
    .hr-tile-l { color:#434343; font-weight:600; }
    .hr-tile-v { color:#141414; font-size:24px; }
    .hr-tile-n, .hr-hint, .hr-al-s, .hr-card-t small, .hr-grp span { color:#595959; }
    .hr-tile-go { font-weight:600; }
    .hr-tiles-home { grid-template-columns:repeat(var(--tiles, 6), minmax(0, 1fr)); }
    @media (max-width: 1200px) { .hr-tiles-home { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .hr-tiles-home { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
    .hr-card { border-color:#dfe3ea; padding:14px 16px; }
    .hr-card-t { font-size:15px; font-weight:700; color:#141414; margin-bottom:10px; }
    .hr-al { color:#1f1f1f; border-bottom-color:#e8ebf0; }
    .hr-al:hover { background:#eaf0ff; }
    .hr table, .hr-modal table { font-size:13.5px; color:#1f1f1f; }
    .hr th, .hr-modal th { color:#262626; font-size:12.5px; background:#eef1f6; border-bottom:2px solid #c9d1df; padding:8px 10px; }
    .hr td, .hr-modal td { padding:8px 10px; border-bottom-color:#e8ebf0; }
    .hr tbody tr:nth-child(even) td, .hr-modal tbody tr:nth-child(even) td { background:#f8f9fb; }
    .hr tr[data-emp]:hover td, .hr tr[data-rec]:hover td, .hr tr[data-go]:hover td, .hr-modal tr[data-task]:hover td { background:#eaf0ff; }
    .hr-empty { color:#595959; }
  `;
  document.head.appendChild(st);
}

// ---------- справочники ----------
// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
// @include src/_crm-calls.js
// @include src/_crm-xlsx.js
const AHO_PAGE = '/admin/ahodash01', AHO_MAIL_PAGE = '/admin/mailpage01';
const A_PERIOD = cfg('aho.period');
const A_WEEKDAYS = ['', 'по понедельникам', 'по вторникам', 'по средам', 'по четвергам', 'по пятницам', 'по субботам', 'по воскресеньям'];
const A_EXP_ST = cfg('aho.expStatus');
const A_EXP_C = { new: '', approval: 'orange', approved: 'blue', rejected: 'red', paid: 'purple', docs: 'green', handed: 'grey' };
const A_FLOW = ['new', 'approval', 'approved', 'paid', 'docs', 'handed'];
const A_SUB_PERIOD = { month: 'Ежемесячно', quarter: 'Раз в квартал', year: 'Раз в год' };
const A_SUB_MONTHS = { month: 1, quarter: 3, year: 12 };
const A_POA_ST = cfg('aho.poaStatus');
const A_POA_PURPOSE = cfg('aho.poaPurpose');
const A_FIRE_ST = cfg('aho.fireStatus');
const A_FIRE_C = { sent: 'orange', repeat: 'red', fixed: 'green' };
const A_MAIL_KIND = cfg('aho.mailKind');
const A_MAIL_ST = cfg('aho.mailStatus');
const A_MAIL_METHOD = cfg('aho.mailMethod');
const A_DOC_KINDS = {
  exp: cfg('aho.docKinds.exp'),
  poa: cfg('aho.docKinds.poa'),
  fire: cfg('aho.docKinds.fire'),
  mail: cfg('aho.docKinds.mail'),
  car: cfg('aho.docKinds.car'),
  fine: cfg('aho.docKinds.fine'),
  routine: cfg('aho.docKinds.routine')
};
const A_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const ah = { tab: 'home', d: null, me: null, approver: null, year: new Date().getFullYear(), expSt: 'open', mailKind: '', fireObj: '', poaLe: '', mObj: '', moneyView: 'exp', expLayout: 'list',
  att: { view: 'day', day: null, month: null, ev: [], cardsOnlyFree: false } };

// ---------- мелочи ----------
function hEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function hToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function hRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function hIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function hToday() { return hIso(new Date()); }
function hD(v) { return String(v || '').slice(0, 10); }
function hDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function hDays(a, b) { return Math.round((new Date(hD(b) + 'T00:00:00') - new Date(hD(a) + 'T00:00:00')) / 86400000); }
function hNoun(n, a, b, c) { const x = Math.abs(n) % 100, y = x % 10; return (x > 10 && x < 20) ? c : y === 1 ? a : (y >= 2 && y <= 4) ? b : c; }
function hMoney(n) { return (Math.round(Number(n) || 0)).toLocaleString('ru-RU') + ' ₽'; }
function hToast(t) {
  const el = document.createElement('div');
  el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1100;max-width:90vw;';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2800);
}
function hModal(html, wide) {
  const m = document.createElement('div');
  m.className = 'hr-modal';
  m.innerHTML = '<div class="hr-box' + (wide ? ' wide' : '') + '">' + html + '</div>';
  m.addEventListener('click', function(e) { if (e.target === m || (e.target.closest && e.target.closest('.hr-x'))) m.remove(); });
  document.body.appendChild(m);
  return m;
}
async function hUpload(file) {
  const boundary = '----ahBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + hToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const data = ((await res.json()) || {}).data || {};
  if (!data.id) throw new Error('upload');
  return data;
}
// день месяца с поправкой на короткие месяцы (31-е в феврале → 28/29)
function aDay(y, m, day) { const last = new Date(y, m + 1, 0).getDate(); return hIso(new Date(y, m, Math.min(day || 1, last))); }
function aAddMonths(iso, n) { const p = hD(iso).split('-').map(Number); return aDay(p[0], p[1] - 1 + n, p[2]); }
// следующий срок регулярного дела строго после даты from
function aNext(r, from) {
  const f = new Date(hD(from) + 'T00:00:00'), day = Number(r.day) || 1;
  if (r.period === 'daily') { do { f.setDate(f.getDate() + 1); } while (f.getDay() === 0 || f.getDay() === 6); return hIso(f); }
  if (r.period === 'weekly') { const wd = ((day - 1) % 7) + 1; do { f.setDate(f.getDate() + 1); } while (((f.getDay() + 6) % 7) + 1 !== wd); return hIso(f); }
  const step = r.period === 'quarterly' ? 3 : r.period === 'yearly' ? 12 : 1;
  let y = f.getFullYear(), m = f.getMonth(), c = aDay(y, m, day);
  while (c <= hD(from)) { m += step; c = aDay(y, m, day); }
  return c;
}
// состояние срока: late | today | soon (≤ n дней) | ok
function aDue(date, soonDays) {
  if (!date) return 'ok';
  const n = hDays(hToday(), date);
  return n < 0 ? 'late' : n === 0 ? 'today' : n <= (soonDays || 3) ? 'soon' : 'ok';
}
function aDueChip(date, soonDays, okText) {
  if (!date) return '<span class="hr-none">—</span>';
  const s = aDue(date, soonDays), n = hDays(hToday(), date);
  if (s === 'late') return '<span class="hr-chip red">просрочено ' + (-n) + ' дн. (' + hDate(date) + ')</span>';
  if (s === 'today') return '<span class="hr-chip orange">сегодня</span>';
  if (s === 'soon') return '<span class="hr-chip orange">' + hDate(date) + ' — через ' + n + ' дн.</span>';
  return '<span class="hr-ok">' + (okText || '') + hDate(date) + '</span>';
}

// ---------- данные ----------
function aLe(id) { return ah.d.les.find(function(x) { return x.id === Number(id); }) || null; }
function aLeName(id) { const l = aLe(id); return l ? l.name : ''; }
function aArt(id) { return ah.d.arts.find(function(x) { return x.id === Number(id); }) || null; }
function aCar(id) { return ah.d.cars.find(function(x) { return x.id === Number(id); }) || null; }
function aIsApprover() { return !!(ah.me && ah.approver && Number(ah.me.id) === Number(ah.approver)); }
async function aMe() {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + hToken() } });
  return ((await res.json()) || {}).data || null;
}
async function aLoad() {
  const L = function(c, p) { return ctx.api.resource(c).list(Object.assign({ paginate: false }, p || {})).then(hRows); };
  const r = await Promise.all([
    L('crm_aho_routines', { sort: ['next_on'] }), L('crm_aho_articles', { sort: ['sort', 'name'] }), L('crm_aho_subs', { sort: ['next_pay_on'] }),
    L('crm_aho_expenses', { sort: ['-id'] }), L('crm_aho_poa', { sort: ['valid_until'] }), L('crm_aho_fire', { sort: ['-issued_on'] }),
    L('crm_aho_mail', { sort: ['-reg_on', '-id'] }), L('crm_aho_cars', { sort: ['name'] }), L('crm_aho_fines', { sort: ['-issued_on'] }),
    L('crm_aho_files', { appends: ['file'], sort: ['-id'] }).catch(function() { return []; }),
    L('crm_legal_entities', { sort: ['sort', 'name'] }).catch(function() { return []; }),
    L('contract_objects', { sort: ['name'], fields: ['id', 'name'] }).catch(function() { return []; }),
    L('app_settings', { filter: { name: 'aho_approver_user_id' } }).catch(function() { return []; }),
    L('crm_skud_cards', { sort: ['skud_name'] }).catch(function() { return []; }),
    L('crm_employees', { filter: { status: { $ne: 'fired' } }, sort: ['last_name', 'first_name'], fields: ['id', 'full_name', 'last_name', 'first_name', 'position', 'department', 'work_schedule'] }).catch(function() { return []; }),
    L('crm_vacations', { filter: { end_date: { $gte: (new Date().getFullYear() - 1) + '-01-01' } }, fields: ['employee_id', 'kind', 'start_date', 'end_date'] }).catch(function() { return []; }),
    L('app_settings', { filter: { name: { $in: ['skud_work_start', 'skud_grace_min', 'skud_synced_at', 'skud_last_event'] } } }).catch(function() { return []; }),
    L('crm_skud_events', { filter: { day: hToday(), kind: 'card' }, fields: ['day', 'time', 'card'] }).catch(function() { return []; })
  ]);
  ah.d = { routines: r[0], arts: r[1], subs: r[2], exps: r[3], poa: r[4], fire: r[5], mail: r[6], cars: r[7], fines: r[8], files: r[9], les: r[10], objects: r[11] };
  ah.approver = r[12][0] && r[12][0].value ? Number(r[12][0].value) : null;
  ah.d.cards = r[13]; ah.d.emps = r[14]; ah.d.vacs = r[15]; ah.d.evToday = r[17];
  ah.d.skud = {}; r[16].forEach(function(s) { ah.d.skud[s.name] = s.value; });
}
async function aNotify(userId, title, text, url) {
  if (!userId) return;
  try { await ctx.api.resource('task_notifications').create({ values: { user_id: Number(userId), title: title, text: text, url: url || AHO_PAGE } }); } catch (e) { /* не критично */ }
}

// ---------- формы по описанию полей: [ключ, подпись, тип, варианты, обязательное] ----------
function hOpts(o) {
  const v = typeof o === 'function' ? o() : o || [];
  return Array.isArray(v) ? v.map(function(x) { return Array.isArray(x) ? x : [x, x]; }) : Object.keys(v).map(function(k) { return [k, v[k]]; });
}
function hField(f, val) {
  const k = f[0], t = f[2], v = val == null ? '' : val;
  let inp;
  if (t === 'select') inp = '<select data-v="' + k + '"><option value="">—</option>' + hOpts(f[3]).map(function(p) { return '<option value="' + hEsc(p[0]) + '"' + (String(p[0]) === String(v) ? ' selected' : '') + '>' + hEsc(p[1]) + '</option>'; }).join('') + '</select>';
  else if (t === 'textarea') inp = '<textarea data-v="' + k + '">' + hEsc(v) + '</textarea>';
  else if (t === 'date') inp = '<input type="date" data-v="' + k + '" min="1900-01-01" max="2099-12-31" value="' + hEsc(hD(v)) + '">';
  else if (t === 'check') inp = '<label style="display:flex;gap:6px;align-items:center;font-size:13.5px;color:#262626;"><input type="checkbox" data-v="' + k + '"' + (v === '' || v ? ' checked' : '') + ' style="width:auto;"> да</label>';
  else if (t === 'list') inp = '<input type="text" list="ah-dl-' + k + '" data-v="' + k + '" value="' + hEsc(v) + '"><datalist id="ah-dl-' + k + '">' + hOpts(f[3]).map(function(p) { return '<option value="' + hEsc(p[1]) + '">'; }).join('') + '</datalist>';
  else inp = '<input type="' + (t === 'num' ? 'number' : 'text') + '" data-v="' + k + '" value="' + hEsc(v) + '"' + (t === 'num' ? ' step="any"' : '') + '>';
  return '<div class="hr-f' + (t === 'textarea' ? ' full' : '') + '" data-fk="' + k + '"><label>' + hEsc(f[1]) + (f[4] ? ' <i>*</i>' : '') + '</label>' + inp + '</div>';
}
function hForm(spec, rec) { return '<div class="hr-form">' + spec.map(function(f) { return hField(f, rec ? rec[f[0]] : null); }).join('') + '</div>'; }
function hRead(box, spec) {
  const v = {};
  for (const f of spec) {
    const x = box.querySelector('[data-v="' + f[0] + '"]');
    if (!x) continue;
    if (f[2] === 'check') { v[f[0]] = x.checked; continue; }
    let s = x.value.trim();
    if (s === '') { if (f[4]) return 'Заполните «' + f[1] + '»'; v[f[0]] = null; continue; }
    if (f[2] === 'date' && !/^(19|20)\d{2}-\d{2}-\d{2}$/.test(s)) return 'Проверьте дату «' + f[1] + '»';
    if (f[2] === 'num' || /_id$/.test(f[0])) { s = Number(s.replace(',', '.').replace(/\s/g, '')); if (isNaN(s)) return 'В «' + f[1] + '» нужно число'; }
    v[f[0]] = s;
  }
  return v;
}

// ---------- документы к записям (crm_aho_files → attachments) ----------
function aFilesOf(entity, id) { return (ah.d.files || []).filter(function(f) { return f.entity === entity && Number(f.record_id) === Number(id); }); }
if (!window.__ahFileOpen) {
  window.__ahFileOpen = true;
  document.addEventListener('click', async function(e) {
    const a = e.target.closest && e.target.closest('a[data-ahfile]'); if (!a) return;
    e.preventDefault();
    try {
      const res = await fetch(a.getAttribute('data-ahfile'), { headers: { Authorization: 'Bearer ' + hToken() } });
      if (!res.ok) throw new Error(res.status);
      const blob = await res.blob(), url = URL.createObjectURL(blob), l = document.createElement('a');
      l.href = url; l.target = '_blank';
      if (!/^(application\/pdf|image\/)/.test(blob.type)) l.download = a.getAttribute('data-ahname');
      document.body.appendChild(l); l.click(); l.remove();
      setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
    } catch (err) { hToast('Не удалось открыть файл'); }
  });
}
function aFileRow(f) {
  const a = f.file || {};
  return '<div><span><a class="hr-flink" data-ahfile="' + hEsc(a.url || '') + '" data-ahname="' + hEsc((a.title || 'файл') + (a.extname || '')) + '">📄 ' + hEsc(a.title || a.filename || 'файл') + '</a></span>'
    + '<span class="hr-hint" style="margin:0;">' + hEsc(f.doc || '') + (f.createdAt ? ' · ' + hDate(f.createdAt) : '') + '</span>'
    + (f.id ? '<button type="button" class="hr-fdel" data-fdel="' + f.id + '" title="Открепить">✕</button>' : '') + '</div>';
}
function aFilesBox(entity, id) {
  const list = id ? aFilesOf(entity, id) : [];
  return '<div class="hr-files" data-files="' + entity + '"><div class="hr-files-h"><b>Документы</b>'
    + '<select data-fkind>' + A_DOC_KINDS[entity].map(function(k) { return '<option>' + hEsc(k) + '</option>'; }).join('') + '</select>'
    + '<label class="hr-btn sm" style="cursor:pointer;">📎 Прикрепить<input type="file" multiple data-fup style="display:none;"></label></div>'
    + '<div class="hr-lines" data-flist>' + (list.length ? list.map(aFileRow).join('') : '<div class="hr-hint" style="margin:0;">Файлов нет' + (id ? '' : ' — прикреплённые сейчас сохранятся вместе с записью') + '</div>') + '</div></div>';
}
async function aReloadFiles() { try { ah.d.files = hRows(await ctx.api.resource('crm_aho_files').list({ paginate: false, appends: ['file'], sort: ['-id'] })); } catch (e) { /* нет доступа */ } }
function aWireFiles(m, entity, getId) {
  const box = m.querySelector('[data-files="' + entity + '"]'); if (!box) return;
  const redraw = function() {
    const id = getId(), rows = (id ? aFilesOf(entity, id) : []).concat((m.__pending || []).map(function(p) { return { doc: p.doc, file: p.file }; }));
    box.querySelector('[data-flist]').innerHTML = rows.length ? rows.map(aFileRow).join('') : '<div class="hr-hint" style="margin:0;">Файлов нет</div>';
  };
  box.querySelector('[data-fup]').addEventListener('change', async function(ev) {
    const files = Array.prototype.slice.call(ev.target.files || []); ev.target.value = '';
    const doc = box.querySelector('[data-fkind]').value, id = getId();
    let n = 0;
    for (const f of files) {
      try {
        const a = await hUpload(f);
        if (id) await ctx.api.resource('crm_aho_files').create({ values: { entity: entity, record_id: id, doc: doc, file_id: a.id } });
        else { m.__pending = m.__pending || []; m.__pending.push({ entity: entity, doc: doc, file_id: a.id, file: a }); }
        n++;
      } catch (e) { hToast('Не удалось загрузить: ' + f.name); }
    }
    if (id) await aReloadFiles();
    redraw(); if (n) hToast('Прикреплено: ' + n);
  });
  box.addEventListener('click', async function(ev) {
    const b = ev.target.closest && ev.target.closest('[data-fdel]'); if (!b) return;
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Открепить?'; return; }
    try { await ctx.api.resource('crm_aho_files').destroy({ filterByTk: Number(b.getAttribute('data-fdel')) }); await aReloadFiles(); redraw(); } catch (e) { hToast('Не удалось открепить'); }
  });
}

// окно создания/правки записи. o: { coll, rec, preset, spec, title, files, extra(rec) → html, wire(m, rec), prepare(vals, rec) → vals | 'ошибка', after(saved) }
function aEdit(o) {
  const rec = o.rec || null;
  const m = hModal('<div class="hr-box-h"><div class="hr-box-t">' + hEsc(o.title) + '</div><button class="hr-x">✕</button></div><div class="hr-box-b">'
    + (o.top ? o.top(rec) : '') + hForm(o.spec, rec || o.preset) + (o.extra ? o.extra(rec) : '') + (o.files ? aFilesBox(o.files, rec && rec.id) : '')
    + '<div class="hr-actions"><button class="hr-btn pri" data-save>Сохранить</button><button class="hr-btn hr-x">Отмена</button>'
    + (rec && rec.id ? '<button class="hr-btn warn" data-del>Удалить</button>' : '') + '</div></div>', o.wide);
  if (o.files) aWireFiles(m, o.files, function() { return rec && rec.id; });
  if (o.wire) o.wire(m, rec);
  const sv = m.querySelector('[data-save]');
  sv.addEventListener('click', async function() {
    let vals = hRead(m, o.spec);
    if (typeof vals === 'string') { hToast(vals); return; }
    if (o.prepare) { vals = o.prepare(vals, rec); if (typeof vals === 'string') { hToast(vals); return; } }
    sv.disabled = true;
    try {
      const res = rec && rec.id ? await ctx.api.resource(o.coll).update({ filterByTk: rec.id, values: vals }) : await ctx.api.resource(o.coll).create({ values: vals });
      const saved = hRows(res)[0] || rec;
      for (const pf of (m.__pending || [])) {
        await ctx.api.resource('crm_aho_files').create({ values: { entity: pf.entity, record_id: saved.id, doc: pf.doc, file_id: pf.file_id } }).catch(function() { hToast('Файл не привязался'); });
      }
      m.remove();
      await aReload();
      hToast('Сохранено');
      if (o.after) o.after(saved);
    } catch (e) { hToast('Не удалось сохранить'); sv.disabled = false; }
  });
  const del = m.querySelector('[data-del]');
  if (del) del.addEventListener('click', async function() {
    if (!del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Точно удалить?'; return; }
    try { await ctx.api.resource(o.coll).destroy({ filterByTk: rec.id }); m.remove(); await aReload(); hToast('Удалено'); }
    catch (e) { hToast('Не удалось удалить'); }
  });
  return m;
}

// ---------- описания полей ----------
const aLeOpts = function() { return ah.d.les.map(function(x) { return [x.id, x.name]; }); };
const aArtOpts = function() { return ah.d.arts.map(function(x) { return [x.id, x.name]; }); };
const aObjOpts = function() { return ah.d.objects.map(function(x) { return x.name; }).concat(['Офис']); };
const aCarOpts = function() { return ah.d.cars.map(function(x) { return [x.id, x.name + (x.plate ? ' · ' + x.plate : '')]; }); };
const A_ROUTINE = [['title', 'Что сделать', 'text', null, 1], ['period', 'Как часто', 'select', A_PERIOD, 1],
  ['day', 'День: число месяца (для «раз в неделю» — 1 = пн … 7 = вс)', 'num'], ['next_on', 'Следующий срок (пусто — посчитается)', 'date'],
  ['link', 'Инструкция (ссылка)', 'text'], ['active', 'Действует', 'check'], ['note', 'Заметки', 'textarea']];
const A_EXP = [['title', 'Что оплачиваем', 'text', null, 1], ['supplier', 'Поставщик', 'text'], ['amount', 'Сумма, ₽', 'num', null, 1], ['due_on', 'Оплатить до', 'date'],
  ['article_id', 'Статья расходов', 'select', aArtOpts], ['legal_entity_id', 'Юрлицо-плательщик', 'select', aLeOpts], ['object_name', 'Объект (для кого)', 'list', aObjOpts],
  ['invoice_no', 'Номер счёта', 'text'], ['note', 'Заметки', 'textarea']];
const A_SUB = [['title', 'Что оплачиваем', 'text', null, 1], ['amount', 'Сумма, ₽', 'num', null, 1], ['period', 'Период', 'select', A_SUB_PERIOD, 1],
  ['next_pay_on', 'Следующая оплата', 'date', null, 1], ['pay_note', 'Когда платить (как в договоре)', 'text'], ['article_id', 'Статья расходов', 'select', aArtOpts],
  ['legal_entity_id', 'Юрлицо-плательщик', 'select', aLeOpts], ['active', 'Действует', 'check'], ['note', 'Заметки', 'textarea']];
const A_ART = [['name', 'Статья', 'text', null, 1], ['sort', 'Порядок', 'num']];
const A_POA = [['legal_entity_id', 'Юрлицо', 'select', aLeOpts, 1], ['to_whom', 'На кого', 'text', null, 1], ['purpose', 'Для чего / куда', 'list', A_POA_PURPOSE, 1],
  ['number', 'Номер', 'text'], ['issued_on', 'Выдана', 'date'], ['valid_until', 'Действует до', 'date'], ['status', 'Статус', 'select', A_POA_ST, 1], ['note', 'Заметки', 'textarea']];
const A_FIRE = [['object_name', 'Объект', 'list', aObjOpts, 1], ['tenant', 'Арендатор', 'text', null, 1], ['legal_entity_id', 'Юрлицо-арендодатель', 'select', aLeOpts],
  ['issued_on', 'Требование вручено', 'date', null, 1], ['deadline_on', 'Устранить до', 'date'], ['status', 'Статус', 'select', A_FIRE_ST, 1], ['fixed_on', 'Устранено', 'date'],
  ['issues', 'Недочёты', 'textarea'], ['note', 'Заметки', 'textarea']];
const A_MAIL = [['kind', 'Вид', 'select', A_MAIL_KIND, 1], ['reg_on', 'Дата', 'date', null, 1], ['subject', 'О чём', 'text', null, 1], ['counterparty', 'От кого / кому', 'text'],
  ['object_name', 'Объект', 'list', aObjOpts], ['legal_entity_id', 'Юрлицо', 'select', aLeOpts], ['number', 'Номер', 'text'], ['method', 'Как', 'list', A_MAIL_METHOD],
  ['track', 'Трек-номер', 'text'], ['status', 'Статус', 'select', A_MAIL_ST, 1], ['due_on', 'Ответить / сделать до', 'date'], ['note', 'Заметки', 'textarea']];
const A_CAR = [['name', 'Машина', 'text', null, 1], ['plate', 'Госномер', 'text'], ['owner', 'Собственник', 'text'], ['driver', 'Кто ездит', 'text'], ['active', 'Используется', 'check'], ['note', 'Заметки', 'textarea']];
const A_FINE = [['car_id', 'Машина', 'select', aCarOpts, 1], ['issued_on', 'Дата постановления', 'date', null, 1], ['amount', 'Сумма, ₽', 'num', null, 1],
  ['uin', 'УИН / номер постановления', 'text'], ['discount_until', 'Скидка 50% до (20 дней с постановления)', 'date'], ['paid_on', 'Оплачен', 'date'], ['note', 'Заметки', 'textarea']];

// ---------- лента «Требует внимания» ----------
function aAlerts() {
  const d = ah.d, t = hToday(), out = [];
  let sec = 'routines';
  const add = function(lvl, text, sub, go, date) { out.push({ lvl: lvl, text: text, sub: sub || '', go: go, date: date || '', sec: sec }); };
  d.routines.filter(function(r) { return r.active !== false && r.next_on; }).forEach(function(r) {
    if (aDue(r.next_on, 1) === 'late') add(0, r.title, 'просрочено с ' + hDate(r.next_on), { routine: r.id }, r.next_on);   // сегодняшние — в «Сегодня по регламенту»
  });
  sec = 'money';
  if (aIsApprover()) d.exps.filter(function(x) { return x.status === 'approval'; }).forEach(function(x) { add(0, 'Ждёт вашего согласования: ' + x.title + ' — ' + hMoney(x.amount), x.supplier || '', { exp: x.id }, x.due_on); });
  d.exps.forEach(function(x) {
    if (x.status === 'rejected') add(1, 'Счёт отклонён: ' + x.title, x.decision_note || '', { exp: x.id });
    if ((x.status === 'approved' || x.status === 'new') && x.due_on) {
      const s = aDue(x.due_on, 3);
      if (s !== 'ok') add(s === 'late' ? 0 : 1, (x.status === 'new' ? 'Не отправлен на согласование: ' : 'Оплатить: ') + x.title + ' — ' + hMoney(x.amount), (s === 'late' ? 'срок был ' : 'до ') + hDate(x.due_on), { exp: x.id }, x.due_on);
    }
    if (x.status === 'paid' && x.paid_on && hDays(x.paid_on, t) > 7) add(1, 'Нет закрывающих документов: ' + x.title, 'оплачен ' + hDate(x.paid_on), { exp: x.id }, x.paid_on);
    if (x.status === 'docs' && x.docs_on && hDays(x.docs_on, t) > 3) add(2, 'Передать в бухгалтерию: ' + x.title, 'закрывающие с ' + hDate(x.docs_on), { exp: x.id });
  });
  d.subs.filter(function(s) { return s.active !== false && s.next_pay_on; }).forEach(function(s) {
    const st = aDue(s.next_pay_on, 3);
    if (st !== 'ok') add(st === 'late' ? 0 : 1, 'Регулярный платёж: ' + s.title + ' — ' + hMoney(s.amount), (st === 'late' ? 'срок был ' : 'до ') + hDate(s.next_pay_on), { sub: s.id }, s.next_pay_on);
  });
  sec = 'poa';
  const noDate = d.poa.filter(function(p) { return p.status !== 'revoked' && !p.valid_until; });
  d.poa.filter(function(p) { return p.status !== 'revoked' && p.valid_until; }).forEach(function(p) {
    const n = hDays(t, p.valid_until);
    if (n < 0 && n > -60) add(1, 'Доверенность истекла: ' + p.to_whom + ' — ' + (p.purpose || ''), aLeName(p.legal_entity_id) + ', до ' + hDate(p.valid_until), { poa: p.id }, p.valid_until);
    else if (n >= 0 && n <= 30) add(1, 'Доверенность истекает: ' + p.to_whom + ' — ' + (p.purpose || ''), aLeName(p.legal_entity_id) + ', до ' + hDate(p.valid_until), { poa: p.id }, p.valid_until);
  });
  if (noDate.length) add(2, 'Доверенности без срока действия: ' + noDate.length, 'укажите «Действует до» — иначе не будет напоминаний', { tab: 'poa' });
  sec = 'fire';
  d.fire.filter(function(f) { return f.status !== 'fixed' && f.deadline_on && hD(f.deadline_on) < t; }).forEach(function(f) {
    add(0, 'ПБ не устранено: ' + f.tenant + ' (' + f.object_name + ')', 'срок был ' + hDate(f.deadline_on), { fire: f.id }, f.deadline_on);
  });
  const noDl = d.fire.filter(function(f) { return f.status !== 'fixed' && !f.deadline_on; });
  if (noDl.length) add(2, 'Требования по ПБ без срока устранения: ' + noDl.length, 'укажите «Устранить до»', { tab: 'fire' });
  sec = 'mail';
  d.mail.filter(function(x) { return x.status !== 'done' && x.status !== 'answered' && x.due_on; }).forEach(function(x) {
    const s = aDue(x.due_on, 2);
    if (s !== 'ok') add(s === 'late' ? 0 : 1, A_MAIL_KIND[x.kind] + ': ' + x.subject, (s === 'late' ? 'срок был ' : 'до ') + hDate(x.due_on), { mail: x.id }, x.due_on);
  });
  sec = 'att';
  const wd = new Date().getDay(), hr = new Date().getHours();
  if (wd >= 1 && wd <= 5 && hr >= 9 && hr < 20 && (ah.d.cards || []).length) {
    const syn = ah.d.skud.skud_synced_at, lastEv = ah.d.skud.skud_last_event;
    if (!syn || (Date.now() - new Date(syn).getTime()) > 40 * 60000) add(0, 'Нет связи с компьютером СКУД', 'последняя загрузка ' + (syn ? hDate(syn) + ' ' + String(syn).slice(11, 16) : 'не было') + ' — компьютер выключен или нет сети', { tab: 'att' });
    else if (hr >= 10 && (!lastEv || hD(lastEv) < t || (Date.now() - new Date(String(lastEv).replace(' ', 'T')).getTime()) > 3 * 3600000)) add(1, 'Проходы не поступают — проверьте, открыта ли программа Guard Light', 'последний проход ' + (lastEv ? hDate(lastEv) + ' ' + String(lastEv).slice(11, 16) : '—'), { tab: 'att' });
  }
  const lateToday = aAttDay(t, ah.d.evToday || []).lateList;
  if (lateToday.length) add(2, 'Опоздали сегодня: ' + lateToday.length, lateToday.map(function(x) { return x.name + ' ' + x.first.slice(0, 5); }).join(', '), { tab: 'att' });
  sec = 'cars';
  d.fines.filter(function(f) { return !f.paid_on; }).forEach(function(f) {
    const c = aCar(f.car_id), s = f.discount_until ? aDue(f.discount_until, 5) : 'ok';
    add(s === 'late' ? 1 : s === 'ok' ? 2 : 0, 'Штраф не оплачен: ' + (c ? c.name : '') + ' — ' + hMoney(f.amount), f.discount_until ? (s === 'late' ? 'скидка 50% закончилась ' : 'скидка 50% до ') + hDate(f.discount_until) : '', { fine: f.id }, f.discount_until);
  });
  return out.sort(function(a, b) { return a.lvl - b.lvl || String(a.date || '9').localeCompare(String(b.date || '9')); });
}

// ---------- каркас ----------
ctx.render('<div id="crm-aho" class="hr"><div class="hr-empty">Загрузка…</div></div>');
function aRoot() { return (ctx.element && ctx.element.querySelector('#crm-aho')) || document.getElementById('crm-aho'); }
function aBody() { return aRoot().querySelector('[data-hr-body]'); }
const A_SECTIONS = { routines: 'Регулярные дела', money: 'Счета и расходы', poa: 'Доверенности', fire: 'Пожарная безопасность у арендаторов', mail: 'Корреспонденция и служебные записки', cars: 'Машины и штрафы', mailing: 'Рассылки арендаторам', att: 'Приходы сотрудников (СКУД)' };
async function aStart() {
  try {
    ah.me = await aMe();
    await aLoad();
    const sc = location.search.match(/[?&]sec=(\w+)/), op = location.search.match(/[?&]open=(\w+):(\d+)/);
    if (sc && A_SECTIONS[sc[1]]) ah.tab = sc[1];
    aRender();
    if (op) aGo(JSON.parse('{"' + op[1] + '":' + op[2] + '}'));
    if (sc || op) { try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ } }
  } catch (e) {
    aRoot().innerHTML = '<div class="hr-empty" style="color:#cf1322;">Не удалось загрузить данные. Обновите страницу.</div>';
  }
}
async function aReload() { await aLoad(); aRender(); }
function aRender() {
  const head = ah.tab === 'home'
    ? '<div class="hr-head"><div class="hr-title">Дашборд АХО</div>' + crmSettingsGear('АХО') + '<button class="hr-new" data-act="newexp"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Счёт</button></div>'
    : '<div class="hr-head"><button class="hr-btn" data-tab="home">← Дашборд АХО</button><div class="hr-title">' + A_SECTIONS[ah.tab] + '</div></div>';
  aRoot().innerHTML = head + '<div data-hr-body></div>';
  ({ home: aRenderHome, routines: aRenderRoutines, money: aRenderMoney, poa: aRenderPoa, fire: aRenderFire, mail: aRenderMail, cars: aRenderCars, mailing: aRenderMailing, att: aRenderAtt })[ah.tab]();
}
function aFind(list, id) { return list.find(function(x) { return x.id === Number(id); }); }
function aGo(go) {
  if (go.routine) return aOpenRoutine(aFind(ah.d.routines, go.routine));
  if (go.exp) return aOpenExp(aFind(ah.d.exps, go.exp));
  if (go.sub) return aOpenSub(aFind(ah.d.subs, go.sub));
  if (go.poa) return aOpenPoa(aFind(ah.d.poa, go.poa));
  if (go.fire) return aOpenFire(aFind(ah.d.fire, go.fire));
  if (go.mail) return aOpenMail(aFind(ah.d.mail, go.mail));
  if (go.fine) return aOpenFine(aFind(ah.d.fines, go.fine));
  if (go.tab) { ah.tab = go.tab; aRender(); }
}

// ---------- главный экран ----------
function aRenderHome() {
  const d = ah.d, t = hToday(), al = aAlerts();
  const tile = function(sec, v, n) {
    const a = al.filter(function(x) { return x.sec === sec && x.lvl < 2; }), red = a.some(function(x) { return x.lvl === 0; });
    return '<div class="hr-tile hr-sect" data-tab="' + sec + '"><div class="hr-tile-l">' + A_SECTIONS[sec] + (a.length ? ' <span class="hr-chip ' + (red ? 'red' : 'orange') + '">' + a.length + '</span>' : '') + '</div>'
      + '<div class="hr-tile-v">' + v + '</div><div class="hr-tile-n">' + n + '</div><div class="hr-tile-go">открыть →</div></div>';
  };
  const sm = function(s) { return ' <small style="font-size:13px;font-weight:400;">' + s + '</small>'; };
  const act = d.routines.filter(function(r) { return r.active !== false; });
  const todayR = act.filter(function(r) { return r.next_on && hD(r.next_on) <= t; });
  const openExp = d.exps.filter(function(x) { return ['new', 'approval', 'approved', 'paid', 'docs'].indexOf(x.status) !== -1; });
  const month = t.slice(0, 7), paidMonth = d.exps.filter(function(x) { return x.paid_on && hD(x.paid_on).slice(0, 7) === month; }).reduce(function(s, x) { return s + (Number(x.amount) || 0); }, 0);
  const poaAct = d.poa.filter(function(p) { return p.status !== 'revoked' && (!p.valid_until || hD(p.valid_until) >= t); });
  const fireOpen = d.fire.filter(function(f) { return f.status !== 'fixed'; });
  const mailOpen = d.mail.filter(function(x) { return x.status !== 'done' && x.status !== 'answered'; });
  const finesOpen = d.fines.filter(function(f) { return !f.paid_on; });
  const lvlC = ['#cf1322', '#fa8c16', '#1c2d58'];
  const week = act.filter(function(r) { return r.next_on && hD(r.next_on) > t && hDays(t, r.next_on) <= 7; }).sort(function(a, b) { return hD(a.next_on).localeCompare(hD(b.next_on)); });
  aBody().innerHTML = (aIsApprover() ? '<div class="hr-only">Вы согласуете счета АХО — счета на согласовании выделены в ленте ниже.</div>' : '')
    + '<div class="hr-tiles hr-tiles-home" style="--tiles:4;">'
    + tile('routines', todayR.length ? todayR.length + sm('на сегодня') : '✓', act.length + ' ' + hNoun(act.length, 'дело', 'дела', 'дел') + ' по регламенту')
    + tile('money', openExp.length + sm(hNoun(openExp.length, 'счёт', 'счёта', 'счетов') + ' в работе'), 'на согласовании ' + d.exps.filter(function(x) { return x.status === 'approval'; }).length + ' · оплачено в этом месяце ' + hMoney(paidMonth))
    + tile('poa', poaAct.length + sm('действуют'), 'по ' + (new Set(poaAct.map(function(p) { return p.legal_entity_id; }))).size + ' юрлицам')
    + tile('fire', fireOpen.length ? '<span style="color:#cf1322;">' + fireOpen.length + '</span>' + sm('не устранено') : '✓', 'требований всего ' + d.fire.length)
    + tile('mail', mailOpen.length + sm('в работе'), 'входящие, исходящие, служебные записки')
    + tile('cars', d.cars.filter(function(c) { return c.active !== false; }).length + sm('машин'), finesOpen.length ? 'неоплаченных штрафов ' + finesOpen.length : 'неоплаченных штрафов нет')
    + tile('att', (function() { const s = aAttDay(hToday(), ah.d.evToday); return s.came + sm('пришли сегодня'); })(),
        (function() { const s = aAttDay(hToday(), ah.d.evToday); return 'опозданий ' + s.late + ' · данные СКУД ' + aSkudAge(); })())
    + tile('mailing', '✉', 'адреса арендаторов по объектам')
    + '</div><div class="hr-cols"><div>'
    + '<div class="hr-card"><div class="hr-card-t">Требует внимания <small>' + al.length + '</small></div>'
    + (al.length ? al.map(function(x) {
        return '<div class="hr-al" data-go="' + hEsc(JSON.stringify(x.go)) + '"><span class="hr-dot" style="background:' + lvlC[x.lvl] + ';"></span><div class="hr-al-t">' + hEsc(x.text) + (x.sub ? '<div class="hr-al-s">' + hEsc(x.sub) + '</div>' : '') + '</div></div>';
      }).join('') : '<div class="hr-hint">Всё в порядке</div>') + '</div></div><div>'
    + '<div class="hr-card"><div class="hr-card-t">Сегодня по регламенту</div>' + (todayR.length ? '<div class="hr-lines">' + todayR.map(aRoutineLine).join('') + '</div>' : '<div class="hr-hint">На сегодня всё сделано</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">На неделе</div>' + (week.length ? '<div class="hr-lines">' + week.map(aRoutineLine).join('') + '</div>' : '<div class="hr-hint">Ничего</div>') + '</div>'
    + '</div></div>';
}
function aRoutineLine(r) {
  return '<div data-rec="routine:' + r.id + '"><span>' + hEsc(r.title) + '</span>' + aDueChip(r.next_on, 1) + '<button class="hr-btn sm" data-act="done" data-id="' + r.id + '">✓ Сделано</button></div>';
}

// ---------- регулярные дела ----------
function aRoutineWhen(r) {
  const day = Number(r.day) || 0;
  if (r.period === 'weekly') return A_WEEKDAYS[day] || A_WEEKDAYS[1];
  if (r.period === 'daily') return 'каждый рабочий день';
  return (A_PERIOD[r.period] || '').toLowerCase() + (day ? ', ' + day + '-го' : '');
}
function aRenderRoutines() {
  const list = ah.d.routines.slice().sort(function(a, b) { return (a.active === false) - (b.active === false) || String(a.next_on || '9').localeCompare(String(b.next_on || '9')); });
  aBody().innerHTML = '<div class="hr-bar"><span class="hr-hint" style="margin:0;">Нажмите «✓ Сделано» — следующий срок посчитается сам по периоду. Сегодняшние — в «Сегодня по регламенту» на дашборде, просроченные — в ленте «Требует внимания», и те и другие — в колокольчике.</span>'
    + '<button class="hr-new" data-act="newroutine"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Дело</button></div>'
    + (list.length ? '<div class="hr-card"><table><thead><tr><th>Что</th><th>Как часто</th><th>Следующий срок</th><th>Последний раз</th><th></th></tr></thead><tbody>'
      + list.map(function(r) {
        return '<tr data-rec="routine:' + r.id + '"' + (r.active === false ? ' style="opacity:.5;"' : '') + '><td>' + hEsc(r.title) + (r.link ? ' <a class="hr-flink" href="' + hEsc(r.link) + '" target="_blank">инструкция</a>' : '') + '</td>'
          + '<td>' + hEsc(aRoutineWhen(r)) + '</td><td>' + (r.active === false ? '<span class="hr-none">не действует</span>' : aDueChip(r.next_on, 1)) + '</td><td>' + hEsc(hDate(r.last_done_on)) + '</td>'
          + '<td class="btn">' + (r.active === false ? '' : '<button class="hr-btn sm" data-act="done" data-id="' + r.id + '">✓ Сделано</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="hr-empty"><b>Регулярных дел пока нет</b>Добавьте пункты регламента: что, как часто, в какой день.</div>');
}
function aOpenRoutine(r) {
  aEdit({ coll: 'crm_aho_routines', rec: r, preset: { period: 'monthly', active: true }, spec: A_ROUTINE, title: r ? r.title : 'Новое регулярное дело', files: 'routine',
    prepare: function(v, rec) { if (!v.next_on) v.next_on = aNext(v, rec && rec.last_done_on ? rec.last_done_on : hIso(new Date(Date.now() - 86400000))); return v; } });
}
async function aDone(id) {
  const r = aFind(ah.d.routines, id); if (!r) return;
  const t = hToday();
  try { await ctx.api.resource('crm_aho_routines').update({ filterByTk: r.id, values: { last_done_on: t, next_on: aNext(r, t > hD(r.next_on || t) ? t : r.next_on) } }); await aReload(); hToast('Отмечено. Следующий раз — ' + hDate(aFind(ah.d.routines, id).next_on)); }
  catch (e) { hToast('Не удалось сохранить'); }
}

// ---------- счета и расходы ----------
try { if (localStorage.getItem('crm-aho-exp-layout') === 'board') ah.expLayout = 'board'; } catch (e) { /* хранилище недоступно — таблица */ }
function aExpChip(x) { return '<span class="hr-chip ' + (A_EXP_C[x.status] || '') + '">' + hEsc(A_EXP_ST[x.status] || 'Новый') + '</span>'; }
function aRenderMoney() {
  const v = ah.moneyView;
  const seg = '<div class="hr-seg">' + [['exp', 'Счета'], ['subs', 'Регулярные платежи'], ['plan', 'План / факт']].map(function(x) { return '<button data-act="mv" data-v="' + x[0] + '"' + (v === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>';
  if (v === 'subs') return aRenderSubs(seg);
  if (v === 'plan') return aRenderPlan(seg);
  const groups = { open: ['new', 'approval', 'approved', 'paid', 'docs'], approval: ['approval'], topay: ['approved'], nodocs: ['paid'], rejected: ['rejected'], done: ['handed'], all: null };
  const gl = { open: 'В работе', approval: 'На согласовании', topay: 'К оплате', nodocs: 'Ждут закрывающих', rejected: 'Отклонены', done: 'Переданы в бухгалтерию', all: 'Все' };
  const cnt = function(k) { return ah.d.exps.filter(function(x) { return !groups[k] || groups[k].indexOf(x.status || 'new') !== -1; }).length; };
  const list = ah.d.exps.filter(function(x) { return !groups[ah.expSt] || groups[ah.expSt].indexOf(x.status || 'new') !== -1; });
  aBody().innerHTML = '<div class="hr-bar">' + seg + '<button class="hr-new" data-act="newexp"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Счёт</button></div>'
    + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><div class="hr-flow" style="flex:1;">' + A_FLOW.map(function(s) { return '<span>' + A_EXP_ST[s] + '</span>'; }).join('<span style="background:none;padding:2px 0;">→</span>') + '</div>'
    + '<div class="hr-seg">' + [['list', 'Таблица'], ['board', 'Доска']].map(function(x) { return '<button data-act="explayout" data-v="' + x[0] + '"' + (ah.expLayout === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div></div>'
    + (ah.expLayout === 'board' ? aExpBoard() : '<div class="hr-st">' + Object.keys(gl).map(function(k) { return '<button data-act="expst" data-v="' + k + '"' + (ah.expSt === k ? ' class="on"' : '') + '>' + gl[k] + '<b>' + cnt(k) + '</b></button>'; }).join('') + '</div>'
    + (list.length ? '<div class="hr-card"><table><thead><tr><th>Что</th><th>Поставщик</th><th>Статья</th><th>Юрлицо / объект</th><th class="n">Сумма</th><th>Оплатить до</th><th>Статус</th></tr></thead><tbody>'
      + list.map(function(x) {
        const a = aArt(x.article_id);
        return '<tr data-rec="exp:' + x.id + '"><td>' + hEsc(x.title) + (aFilesOf('exp', x.id).length ? ' 📎' : '') + '</td><td>' + hEsc(x.supplier || '') + '</td><td>' + hEsc(a ? a.name : '') + '</td>'
          + '<td>' + hEsc([aLeName(x.legal_entity_id), x.object_name].filter(Boolean).join(' · ')) + '</td><td class="n">' + hMoney(x.amount) + '</td>'
          + '<td>' + (['new', 'approval', 'approved'].indexOf(x.status || 'new') !== -1 ? aDueChip(x.due_on, 3) : hEsc(hDate(x.due_on))) + '</td><td>' + aExpChip(x) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="hr-empty"><b>Счетов нет</b>«+ Счёт» — заведите счёт, прикрепите PDF и отправьте на согласование.</div>'));
  if (ah.expLayout === 'board') kbFit();
}
// доска счетов: колонки = шаги A_FLOW (отклонённые — в «Новый», их снова отправляют на согласование), одной высоты,
// прокрутка внутри. Взяли карточку — подсвечена колонка следующего шага (если этот шаг вам доступен), остальные бледные.
// Перенос = тот же шаг, что кнопка в карточке (aExpDo): PDF приложен, согласует только согласующий, уведомления.
// Отклонить — только из карточки: нужна причина.
const A_EXP_DONE_DAYS = cfg('aho.expDoneDays');
const A_EXP_NEXT = { new: 'send', rejected: 'send', approval: 'approve', approved: 'paid', paid: 'docs', docs: 'handed' };
function aExpCol(x) { const s = x.status || 'new'; return s === 'rejected' ? 'new' : s; }
function aExpAllowed(x, col) {
  const s = x.status || 'new', step = A_EXP_NEXT[s];
  if (!step || A_FLOW[A_FLOW.indexOf(aExpCol(x)) + 1] !== col) return null;
  return step === 'approve' && !aIsApprover() ? null : step;
}
function aExpBoard() {
  const d = new Date(); d.setDate(d.getDate() - A_EXP_DONE_DAYS);
  const since = hIso(d);
  return '<div class="kb" data-kb data-exp-board style="--n:6;">' + A_FLOW.map(function(col) {
    let items = ah.d.exps.filter(function(x) { return aExpCol(x) === col; });
    const all = items.length;
    if (col === 'handed') items = items.filter(function(x) { return hD(x.handed_on || x.updatedAt) >= since; });
    items.sort(function(a, b) { return String(a.due_on || '9').localeCompare(String(b.due_on || '9')) || b.id - a.id; });
    return '<div class="kb-col" data-col="' + col + '"><div class="kb-col-h" style="--c:#1c2d58;"><i></i>' + A_EXP_ST[col] + '<b>' + items.length + '</b></div><div class="kb-col-b">'
      + items.map(function(x) {
        const a = aArt(x.article_id);
        return '<div class="kb-card" draggable="true" data-rec="exp:' + x.id + '" data-id="' + x.id + '" style="--c:' + (x.status === 'rejected' ? '#cf1322' : '#1c2d58') + ';">'
          + '<div class="kb-t">' + hEsc(x.title) + (aFilesOf('exp', x.id).length ? ' 📎' : '') + '</div>'
          + '<div class="kb-s"><b style="color:#262626;">' + hMoney(x.amount) + '</b>' + (x.supplier ? ' · ' + hEsc(x.supplier) : '') + '</div>'
          + '<div class="kb-s">' + (x.status === 'rejected' ? '<span style="color:#cf1322;">отклонён</span> · ' : '')
          + (['new', 'approval', 'approved'].indexOf(x.status || 'new') !== -1 && x.due_on ? 'оплатить до ' + hEsc(hDate(x.due_on)) : hEsc(a ? a.name : '')) + '</div></div>';
      }).join('')
      + (all > items.length ? '<div class="kb-note">Ещё ' + (all - items.length) + ' старше ' + A_EXP_DONE_DAYS + ' дней — в таблице</div>' : '')
      + (items.length ? '' : '<div class="kb-empty">Пусто</div>') + '</div></div>';
  }).join('') + '</div>';
}
async function aExpDrop(id, col) {
  const x = aFind(ah.d.exps, id);
  const step = x && aExpAllowed(x, col);
  if (!step) return;
  try {
    const err = await aExpDo(x, step, '', aFilesOf('exp', x.id).length > 0);
    if (err) { hToast(err); return; }
    await aReload(); hToast(x.title + ': ' + A_EXP_ST[col].toLowerCase());
  } catch (e) { hToast('Не удалось сохранить'); }
}
// доска до низа окна: колонки прокручиваются внутри, страница не растягивается
function kbFit() {
  const kb = document.querySelector('[data-kb]');
  if (!kb || window.innerWidth <= 700) return;
  kb.style.height = Math.max(380, window.innerHeight - kb.getBoundingClientRect().top - window.scrollY - 24) + 'px';
}
(function() {
  const root = aRoot();
  let drag = null;
  if (!window.__ahoKbResize) { window.__ahoKbResize = true; window.addEventListener('resize', function() { kbFit(); }); }
  root.addEventListener('dragstart', function(e) {
    const k = e.target.closest ? e.target.closest('[data-exp-board] .kb-card') : null;
    if (!k) return;
    const x = aFind(ah.d.exps, k.getAttribute('data-id'));
    if (!x) return;
    drag = x;
    k.classList.add('drag');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(x.id));
    root.querySelectorAll('[data-exp-board] .kb-col').forEach(function(c) {
      const col = c.getAttribute('data-col');
      c.classList.add(col === aExpCol(x) ? 'home' : aExpAllowed(x, col) ? 'ok' : 'no');
    });
  });
  root.addEventListener('dragend', function() {
    drag = null;
    root.querySelectorAll('.kb-card.drag, .kb-col').forEach(function(x) { x.classList.remove('drag', 'drop', 'ok', 'no', 'home'); });
  });
  root.addEventListener('dragover', function(e) {
    const c = e.target.closest ? e.target.closest('.kb-col.ok') : null;
    if (!c || !drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    root.querySelectorAll('.kb-col.drop').forEach(function(x) { if (x !== c) x.classList.remove('drop'); });
    c.classList.add('drop');
  });
  root.addEventListener('dragleave', function(e) {
    const c = e.target.closest ? e.target.closest('.kb-col.drop') : null;
    if (c && !c.contains(e.relatedTarget)) c.classList.remove('drop');
  });
  root.addEventListener('drop', function(e) {
    const c = e.target.closest ? e.target.closest('.kb-col.ok') : null;
    if (!c || !drag) return;
    e.preventDefault();
    aExpDrop(drag.id, c.getAttribute('data-col'));
  });
})();

// кнопки шага в карточке счёта: кто что может сделать сейчас
function aExpSteps(x) {
  if (!x || !x.id) return '';
  const s = x.status || 'new', b = [];
  if (s === 'new' || s === 'rejected') b.push(['send', 'Отправить на согласование →', 'pri']);
  if (s === 'approval' && aIsApprover()) { b.push(['approve', '✓ Согласовать', 'pri']); b.push(['reject', 'Отклонить', '']); }
  if (s === 'approval' && !aIsApprover()) b.push(['', 'Ждёт согласования' + (ah.approver ? '' : ' (согласующий не назначен — app_settings aho_approver_user_id)'), 'wait']);
  if (s === 'approved') b.push(['paid', 'Оплачен', 'pri']);
  if (s === 'paid') b.push(['docs', 'Закрывающие получены', 'pri']);
  if (s === 'docs') b.push(['handed', 'Передан в бухгалтерию', 'pri']);
  const idx = A_FLOW.indexOf(s === 'rejected' ? 'approval' : s);
  return '<div class="hr-flow">' + A_FLOW.map(function(k, i) { return '<span class="' + (k === s ? 'on' : i < idx ? 'done' : '') + '">' + A_EXP_ST[k] + '</span>'; }).join('') + (s === 'rejected' ? '<span class="on" style="background:#cf1322;">Отклонён</span>' : '') + '</div>'
    + (x.decision_note ? '<div class="hr-only" style="background:#fff7e6;border-color:#ffd591;">Комментарий согласующего: ' + hEsc(x.decision_note) + '</div>' : '')
    + '<div class="hr-actions" style="margin:0 0 14px;">' + b.map(function(y) {
      return y[2] === 'wait' ? '<span class="hr-hint" style="margin:0;">' + hEsc(y[1]) + '</span>' : '<button class="hr-btn ' + y[2] + '" data-step="' + y[0] + '">' + hEsc(y[1]) + '</button>';
    }).join('') + (b.some(function(y) { return y[0] === 'reject'; }) ? '<input type="text" data-reason placeholder="Почему отклоняете (увидит офис-менеджер)" style="flex:1;min-width:200px;">' : '') + '</div>';
}
function aOpenExp(x, preset) {
  const m = aEdit({ coll: 'crm_aho_expenses', rec: x, preset: preset || { due_on: null }, spec: A_EXP, title: x ? x.title : 'Новый счёт', files: 'exp', wide: true,
    top: aExpSteps,
    prepare: function(v, rec) { if (!rec) { v.status = 'new'; v.author_id = ah.me && ah.me.id; } return v; } });
  m.querySelectorAll('[data-step]').forEach(function(b) {
    b.addEventListener('click', function() { aExpStep(x, b.getAttribute('data-step'), m); });
  });
  return m;
}
// шаг счёта без интерфейса — его зовут кнопки карточки и доска. Ошибка → текст; успех → null; сбой сети → исключение.
async function aExpDo(x, step, reason, hasFile) {
  const t = hToday(), v = {};
  if (step === 'send') { if (!hasFile) return 'Прикрепите счёт (PDF) — согласующему нужно его видеть'; Object.assign(v, { status: 'approval', sent_on: t, decision_note: null }); }
  if (step === 'approve') { if (!aIsApprover()) return 'Согласовать может только согласующий'; Object.assign(v, { status: 'approved', approved_on: t, approved_by: (ah.me && (ah.me.nickname || ah.me.username)) || '' }); }
  if (step === 'reject') { if (!reason) return 'Напишите, почему отклоняете'; Object.assign(v, { status: 'rejected', approved_on: t, approved_by: (ah.me && (ah.me.nickname || ah.me.username)) || '', decision_note: reason }); }
  if (step === 'paid') Object.assign(v, { status: 'paid', paid_on: t });
  if (step === 'docs') Object.assign(v, { status: 'docs', docs_on: t });
  if (step === 'handed') Object.assign(v, { status: 'handed', handed_on: t });
  if (!v.status) return 'Неизвестный шаг';
  await ctx.api.resource('crm_aho_expenses').update({ filterByTk: x.id, values: v });
  const url = AHO_PAGE + '?open=exp:' + x.id, what = x.title + ' — ' + hMoney(x.amount) + (x.supplier ? ', ' + x.supplier : '');
  if (step === 'send') await aNotify(ah.approver, 'Счёт на согласование', what, url);
  if (step === 'approve') await aNotify(x.author_id, 'Счёт согласован — можно оплачивать', what, url);
  if (step === 'reject') await aNotify(x.author_id, 'Счёт отклонён', what + '. ' + reason, url);
  return null;
}
async function aExpStep(x, step, m) {
  const reason = m.querySelector('[data-reason]') ? m.querySelector('[data-reason]').value.trim() : '';
  try {
    const err = await aExpDo(x, step, reason, aFilesOf('exp', x.id).length > 0 || !!m.__pending);
    if (err) { hToast(err); return; }
    m.remove(); await aReload(); hToast(A_EXP_ST[{ send: 'approval', approve: 'approved', reject: 'rejected' }[step] || step]);
  } catch (e) { hToast('Не удалось сохранить'); }
}
function aRenderSubs(seg) {
  const list = ah.d.subs.slice().sort(function(a, b) { return (a.active === false) - (b.active === false) || String(a.next_pay_on || '9').localeCompare(String(b.next_pay_on || '9')); });
  const monthly = list.filter(function(s) { return s.active !== false; }).reduce(function(n, s) { return n + (Number(s.amount) || 0) / (A_SUB_MONTHS[s.period] || 1); }, 0);
  aBody().innerHTML = '<div class="hr-bar">' + seg + '<span class="hr-hint" style="margin:0;">≈ ' + hMoney(monthly) + ' в месяц</span><button class="hr-new" data-act="newsub"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Платёж</button></div>'
    + '<div class="hr-hint" style="margin-bottom:10px;">«Оплачено» заводит счёт со статусом «Оплачен» (для плана/факта и закрывающих) и переносит следующую оплату на период вперёд.</div>'
    + (list.length ? '<div class="hr-card"><table><thead><tr><th>Что</th><th>Статья</th><th>Юрлицо</th><th class="n">Сумма</th><th>Период</th><th>Следующая оплата</th><th></th></tr></thead><tbody>'
      + list.map(function(s) {
        const a = aArt(s.article_id);
        return '<tr data-rec="sub:' + s.id + '"' + (s.active === false ? ' style="opacity:.5;"' : '') + '><td>' + hEsc(s.title) + (s.pay_note ? '<div class="hr-hint" style="margin:0;">' + hEsc(s.pay_note) + '</div>' : '') + '</td><td>' + hEsc(a ? a.name : '') + '</td>'
          + '<td>' + hEsc(aLeName(s.legal_entity_id)) + '</td><td class="n">' + hMoney(s.amount) + '</td><td>' + hEsc(A_SUB_PERIOD[s.period] || '') + '</td>'
          + '<td>' + (s.active === false ? '<span class="hr-none">не действует</span>' : aDueChip(s.next_pay_on, 3)) + '</td>'
          + '<td class="btn">' + (s.active === false ? '' : '<button class="hr-btn sm" data-act="subpaid" data-id="' + s.id + '">Оплачено</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="hr-empty"><b>Регулярных платежей нет</b>Связь, хостинги, подписки — с датой оплаты, чтобы напоминало заранее.</div>');
}
function aOpenSub(s) { aEdit({ coll: 'crm_aho_subs', rec: s, preset: { period: 'month', active: true }, spec: A_SUB, title: s ? s.title : 'Новый регулярный платёж' }); }
async function aSubPaid(id) {
  const s = aFind(ah.d.subs, id); if (!s) return;
  const t = hToday();
  try {
    await ctx.api.resource('crm_aho_expenses').create({ values: { title: s.title + (s.next_pay_on ? ' за ' + A_MONTHS[Number(hD(s.next_pay_on).slice(5, 7)) - 1].toLowerCase() + ' ' + hD(s.next_pay_on).slice(0, 4) : ''),
      amount: s.amount, article_id: s.article_id, legal_entity_id: s.legal_entity_id, status: 'paid', paid_on: t, due_on: s.next_pay_on, sub_id: s.id, author_id: ah.me && ah.me.id } });
    await ctx.api.resource('crm_aho_subs').update({ filterByTk: s.id, values: { next_pay_on: aAddMonths(s.next_pay_on || t, A_SUB_MONTHS[s.period] || 1) } });
    await aReload(); hToast('Оплата записана, следующая — ' + hDate(aFind(ah.d.subs, id).next_pay_on));
  } catch (e) { hToast('Не удалось сохранить'); }
}
// план по статьям × месяцам (вводится прямо в таблице), факт = оплаченные счета по дате оплаты
function aRenderPlan(seg) {
  const y = ah.year, months = A_MONTHS.map(function(m, i) { return y + '-' + ('0' + (i + 1)).slice(-2); });
  const fact = function(artId, ym) { return ah.d.exps.filter(function(x) { return x.paid_on && hD(x.paid_on).slice(0, 7) === ym && (artId === null ? !x.article_id || !aArt(x.article_id) : Number(x.article_id) === artId); }).reduce(function(s, x) { return s + (Number(x.amount) || 0); }, 0); };
  const n0 = function(v) { return v ? Math.round(v).toLocaleString('ru-RU') : ''; };
  const rows = ah.d.arts.map(function(a) { return { id: a.id, name: a.name, plan: a.plan || {} }; }).concat([{ id: null, name: 'Без статьи', plan: {} }]);
  let tp = 0, tf = 0;
  const body = rows.map(function(a) {
    let sp = 0, sf = 0;
    const cells = months.map(function(ym) {
      const p = Number(a.plan[ym]) || 0, f = fact(a.id, ym); sp += p; sf += f;
      return '<td>' + (a.id === null ? '' : '<input type="text" inputmode="decimal" data-plan="' + a.id + '|' + ym + '" value="' + (p || '') + '">') + '<div class="hr-hint" style="margin:0;text-align:right;' + (p && f > p ? 'color:#cf1322;' : '') + '">' + (f ? 'факт ' + n0(f) : '') + '</div></td>';
    }).join('');
    if (a.id === null && !sf) return '';
    tp += sp; tf += sf;
    return '<tr><td>' + (a.id === null ? hEsc(a.name) : '<a class="hr-flink" data-act="art" data-id="' + a.id + '">' + hEsc(a.name) + '</a>') + '</td>' + cells
      + '<td class="n"><b>' + n0(sp) + '</b><div class="hr-hint" style="margin:0;' + (sp && sf > sp ? 'color:#cf1322;' : '') + '">факт ' + n0(sf) + '</div></td></tr>';
  }).join('');
  aBody().innerHTML = '<div class="hr-bar">' + seg + '<button class="hr-btn" data-act="year" data-d="-1">‹</button><b>' + y + '</b><button class="hr-btn" data-act="year" data-d="1">›</button>'
    + '<button class="hr-new" data-act="newart"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Статья</button></div>'
    + '<div class="hr-hint" style="margin-bottom:10px;">План вводится прямо в ячейке (сохраняется при выходе из неё). Факт — оплаченные счета этой статьи по дате оплаты; красный — перерасход.</div>'
    + '<div class="hr-card hr-plan"><table><thead><tr><th>Статья</th>' + A_MONTHS.map(function(m) { return '<th class="n">' + m + '</th>'; }).join('') + '<th class="n">Год</th></tr></thead><tbody>' + body
    + '<tr><td><b>Итого</b></td><td colspan="12"></td><td class="n"><b>' + n0(tp) + '</b><div class="hr-hint" style="margin:0;">факт ' + n0(tf) + '</div></td></tr></tbody></table></div>';
}
async function aSavePlan(key, val) {
  const p = key.split('|'), a = aArt(p[0]); if (!a) return;
  const plan = Object.assign({}, a.plan || {}), n = Number(String(val).replace(',', '.').replace(/\s/g, ''));
  if (val === '' || !n) delete plan[p[1]]; else if (isNaN(n)) { hToast('Нужно число'); return; } else plan[p[1]] = n;
  try { await ctx.api.resource('crm_aho_articles').update({ filterByTk: a.id, values: { plan: plan } }); a.plan = plan; } catch (e) { hToast('Не удалось сохранить план'); }
}

// ---------- доверенности ----------
function aPoaState(p) {
  if (p.status === 'revoked') return '<span class="hr-chip grey">отозвана</span>';
  if (!p.valid_until) return '<span class="hr-chip">срок не указан</span>';
  const n = hDays(hToday(), p.valid_until);
  if (n < 0) return '<span class="hr-chip red">истекла ' + hDate(p.valid_until) + '</span>';
  if (n <= 30) return '<span class="hr-chip orange">до ' + hDate(p.valid_until) + ' (' + n + ' дн.)</span>';
  return '<span class="hr-chip green">до ' + hDate(p.valid_until) + '</span>';
}
function aRenderPoa() {
  const list = ah.d.poa.filter(function(p) { return !ah.poaLe || String(p.legal_entity_id) === ah.poaLe; });
  const byLe = {};
  list.forEach(function(p) { (byLe[p.legal_entity_id || 0] = byLe[p.legal_entity_id || 0] || []).push(p); });
  aBody().innerHTML = '<div class="hr-bar"><select data-f="poaLe"><option value="">Все юрлица</option>' + ah.d.les.map(function(l) { return '<option value="' + l.id + '"' + (ah.poaLe === String(l.id) ? ' selected' : '') + '>' + hEsc(l.name) + '</option>'; }).join('') + '</select>'
    + '<button class="hr-new" data-act="newpoa"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Доверенность</button></div>'
    + (list.length ? Object.keys(byLe).map(function(k) {
      return '<div class="hr-grp">' + hEsc(aLeName(k) || 'Юрлицо не указано') + '<span>' + byLe[k].length + '</span></div><div class="hr-card"><table><thead><tr><th>На кого</th><th>Для чего</th><th>Номер</th><th>Выдана</th><th>Срок</th></tr></thead><tbody>'
        + byLe[k].map(function(p) {
          return '<tr data-rec="poa:' + p.id + '"' + (p.status === 'revoked' ? ' style="opacity:.5;"' : '') + '><td>' + hEsc(p.to_whom) + (aFilesOf('poa', p.id).length ? ' 📎' : '') + '</td><td>' + hEsc(p.purpose || '') + '</td><td>' + hEsc(p.number || '') + '</td><td>' + hEsc(hDate(p.issued_on)) + '</td><td>' + aPoaState(p) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('') : '<div class="hr-empty"><b>Доверенностей нет</b>Заведите доверенность: юрлицо, на кого, для чего, срок — за 30 дней до конца придёт напоминание.</div>');
}
function aOpenPoa(p) { aEdit({ coll: 'crm_aho_poa', rec: p, preset: { status: 'active', legal_entity_id: ah.poaLe || null }, spec: A_POA, title: p ? 'Доверенность: ' + p.to_whom : 'Новая доверенность', files: 'poa' }); }

// ---------- пожарная безопасность у арендаторов ----------
function aRenderFire() {
  const objs = ah.d.fire.map(function(f) { return f.object_name; }).filter(function(x, i, a) { return x && a.indexOf(x) === i; }).sort();
  const list = ah.d.fire.filter(function(f) { return !ah.fireObj || f.object_name === ah.fireObj; });
  const by = {};
  list.forEach(function(f) { (by[f.object_name || '—'] = by[f.object_name || '—'] || []).push(f); });
  aBody().innerHTML = '<div class="hr-bar"><select data-f="fireObj"><option value="">Все объекты</option>' + objs.map(function(o) { return '<option' + (ah.fireObj === o ? ' selected' : '') + '>' + hEsc(o) + '</option>'; }).join('') + '</select>'
    + '<button class="hr-new" data-act="newfire"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Требование</button></div>'
    + (list.length ? Object.keys(by).sort().map(function(o) {
      const open = by[o].filter(function(f) { return f.status !== 'fixed'; }).length;
      return '<div class="hr-grp">' + hEsc(o) + '<span>' + by[o].length + ' ' + hNoun(by[o].length, 'требование', 'требования', 'требований') + (open ? ', не устранено ' + open : '') + '</span></div>'
        + '<div class="hr-card"><table><thead><tr><th>Арендатор</th><th>Вручено</th><th>Устранить до</th><th>Статус</th><th>Недочёты</th></tr></thead><tbody>'
        + by[o].map(function(f) {
          return '<tr data-rec="fire:' + f.id + '"><td>' + hEsc(f.tenant) + (aFilesOf('fire', f.id).length ? ' 📎' : '') + '</td><td>' + hEsc(hDate(f.issued_on)) + '</td>'
            + '<td>' + (f.status === 'fixed' ? hEsc(hDate(f.deadline_on)) : aDueChip(f.deadline_on, 5)) + '</td>'
            + '<td><span class="hr-chip ' + (A_FIRE_C[f.status] || '') + '">' + hEsc(A_FIRE_ST[f.status] || '') + '</span>' + (f.fixed_on ? ' <span class="hr-hint">' + hDate(f.fixed_on) + '</span>' : '') + '</td>'
            + '<td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + hEsc(f.issues || '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('') : '<div class="hr-empty"><b>Требований нет</b>Заведите требование арендатору: объект, что не так, срок — скан прикрепите к записи.</div>');
}
function aOpenFire(f) {
  aEdit({ coll: 'crm_aho_fire', rec: f, preset: { status: 'sent', issued_on: hToday(), object_name: ah.fireObj || '' }, spec: A_FIRE, title: f ? f.tenant + ' — ' + f.object_name : 'Новое требование по пожарной безопасности', files: 'fire',
    prepare: function(v) { if (v.status === 'fixed' && !v.fixed_on) v.fixed_on = hToday(); return v; } });
}

// ---------- корреспонденция и служебные записки ----------
function aRenderMail() {
  const list = ah.d.mail.filter(function(x) { return !ah.mailKind || x.kind === ah.mailKind; });
  const cnt = function(k) { return ah.d.mail.filter(function(x) { return !k || x.kind === k; }).length; };
  aBody().innerHTML = '<div class="hr-bar"><div class="hr-st" style="margin:0;">' + [['', 'Все']].concat(Object.keys(A_MAIL_KIND).map(function(k) { return [k, A_MAIL_KIND[k]]; })).map(function(x) {
      return '<button data-act="mailkind" data-v="' + x[0] + '"' + (ah.mailKind === x[0] ? ' class="on"' : '') + '>' + x[1] + '<b>' + cnt(x[0]) + '</b></button>'; }).join('') + '</div>'
    + '<button class="hr-new" data-act="newmail"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Запись</button></div>'
    + (list.length ? '<div class="hr-card"><table><thead><tr><th>Дата</th><th>Вид</th><th>О чём</th><th>От кого / кому</th><th>Объект</th><th>Как</th><th>Статус</th><th>Срок</th></tr></thead><tbody>'
      + list.map(function(x) {
        const open = x.status !== 'done' && x.status !== 'answered';
        return '<tr data-rec="mail:' + x.id + '"><td>' + hEsc(hDate(x.reg_on)) + '</td><td>' + hEsc(A_MAIL_KIND[x.kind] || '') + '</td><td>' + hEsc(x.subject) + (x.number ? ' <span class="hr-hint">№ ' + hEsc(x.number) + '</span>' : '') + (aFilesOf('mail', x.id).length ? ' 📎' : '') + '</td>'
          + '<td>' + hEsc(x.counterparty || '') + '</td><td>' + hEsc(x.object_name || '') + '</td><td>' + hEsc(x.method || '') + (x.track ? '<div class="hr-hint" style="margin:0;">' + hEsc(x.track) + '</div>' : '') + '</td>'
          + '<td><span class="hr-chip' + (open ? ' blue' : '') + '">' + hEsc(A_MAIL_ST[x.status] || '') + '</span></td><td>' + (open ? aDueChip(x.due_on, 2) : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="hr-empty"><b>Записей нет</b>Входящие и исходящие письма, отправки курьером и Почтой России, служебные записки по объектам.</div>');
}
function aOpenMail(x) { aEdit({ coll: 'crm_aho_mail', rec: x, preset: { kind: ah.mailKind || 'out', reg_on: hToday(), status: 'registered' }, spec: A_MAIL, title: x ? (A_MAIL_KIND[x.kind] || '') + ': ' + x.subject : 'Новая запись', files: 'mail' }); }

// ---------- машины и штрафы ----------
function aRenderCars() {
  const fines = ah.d.fines;
  aBody().innerHTML = '<div class="hr-cols"><div><div class="hr-card"><div class="hr-card-t">Штрафы <small>не оплачено ' + fines.filter(function(f) { return !f.paid_on; }).length + '</small><button class="hr-btn sm" data-act="newfine"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Штраф</button></div>'
    + (fines.length ? '<table><thead><tr><th>Машина</th><th>Дата</th><th class="n">Сумма</th><th>Скидка 50% до</th><th>Оплачен</th></tr></thead><tbody>' + fines.map(function(f) {
      const c = aCar(f.car_id);
      return '<tr data-rec="fine:' + f.id + '"><td>' + hEsc(c ? c.name : '') + '</td><td>' + hEsc(hDate(f.issued_on)) + '</td><td class="n">' + hMoney(f.amount) + '</td><td>' + (f.paid_on ? hEsc(hDate(f.discount_until)) : aDueChip(f.discount_until, 5)) + '</td>'
        + '<td>' + (f.paid_on ? '<span class="hr-ok">' + hDate(f.paid_on) + '</span>' : '<span class="hr-chip red">нет</span>') + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="hr-hint">Штрафов нет</div>') + '</div></div><div>'
    + '<div class="hr-card"><div class="hr-card-t">Машины <small>' + ah.d.cars.length + '</small><button class="hr-btn sm" data-act="newcar"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Машина</button></div>'
    + (ah.d.cars.length ? '<div class="hr-lines">' + ah.d.cars.map(function(c) {
      const unpaid = fines.filter(function(f) { return Number(f.car_id) === c.id && !f.paid_on; }).length;
      return '<div data-rec="car:' + c.id + '"' + (c.active === false ? ' style="opacity:.5;"' : '') + '><span>' + hEsc(c.name) + (c.plate ? ' <span class="hr-hint">' + hEsc(c.plate) + '</span>' : '') + (aFilesOf('car', c.id).length ? ' 📎' : '') + '</span>'
        + '<span class="hr-hint" style="margin:0;">' + hEsc([c.owner, c.driver].filter(Boolean).join(' · ')) + '</span>' + (unpaid ? '<span class="hr-chip red">' + unpaid + '</span>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="hr-hint">Машин нет</div>') + '</div></div></div>';
}
function aOpenCar(c) { aEdit({ coll: 'crm_aho_cars', rec: c, preset: { active: true }, spec: A_CAR, title: c ? c.name : 'Новая машина', files: 'car' }); }
function aOpenFine(f) {
  aEdit({ coll: 'crm_aho_fines', rec: f, preset: {}, spec: A_FINE, title: f ? 'Штраф ' + hMoney(f.amount) : 'Новый штраф', files: 'fine',
    prepare: function(v) { if (!v.discount_until && v.issued_on) { const d = new Date(v.issued_on + 'T00:00:00'); d.setDate(d.getDate() + 20); v.discount_until = hIso(d); } return v; } });
}

// ---------- рассылки арендаторам: адреса из контактов действующих договоров ----------
async function aRenderMailing() {
  aBody().innerHTML = '<div class="hr-empty">Загрузка адресов…</div>';
  let cons = [], ctr = [];
  try {
    const r = await Promise.all([
      ctx.api.resource('rental_contracts').list({ paginate: false, fields: ['id', 'object_name', 'tenant_name', 'contract_number'] }).then(hRows),
      ctx.api.resource('contract_contacts').list({ paginate: false, filter: { contract_type: 'active' }, fields: ['contract_ref_id', 'name', 'email'] }).then(hRows)
    ]);
    ctr = r[0]; cons = r[1];
  } catch (e) { aBody().innerHTML = '<div class="hr-empty">Нет доступа к договорам</div>'; return; }
  const objs = ctr.map(function(c) { return c.object_name; }).filter(function(x, i, a) { return x && a.indexOf(x) === i; }).sort();
  const rows = ctr.filter(function(c) { return !ah.mObj || c.object_name === ah.mObj; }).map(function(c) {
    const mails = cons.filter(function(x) { return Number(x.contract_ref_id) === c.id && x.email; }).map(function(x) { return x.email.trim(); });
    return { c: c, mails: mails };
  });
  const all = [];
  rows.forEach(function(r) { r.mails.forEach(function(m) { if (all.indexOf(m) === -1) all.push(m); }); });
  aBody().innerHTML = '<div class="hr-bar"><select data-f="mObj"><option value="">Все объекты</option>' + objs.map(function(o) { return '<option' + (ah.mObj === o ? ' selected' : '') + '>' + hEsc(o) + '</option>'; }).join('') + '</select>'
    + '<button class="hr-btn pri" data-act="copymails"' + (all.length ? '' : ' disabled') + '>Скопировать ' + all.length + ' ' + hNoun(all.length, 'адрес', 'адреса', 'адресов') + '</button>'
    + '<a class="hr-btn" href="' + AHO_MAIL_PAGE + '">Открыть «Почту» →</a></div>'
    + '<div class="hr-hint" style="margin-bottom:10px;">Адреса берутся из блока «Контактные данные» действующих договоров — отдельный список вести не нужно. Нет адреса — добавьте контакт в карточке договора. Вставьте адреса в поле «Скрытая копия», чтобы арендаторы не видели друг друга.</div>'
    + (all.length ? '<div class="hr-mails" data-mails>' + hEsc(all.join(', ')) + '</div>' : '')
    + '<div class="hr-card" style="margin-top:12px;"><table><thead><tr><th>Арендатор</th><th>Объект</th><th>Договор</th><th>Адреса</th></tr></thead><tbody>'
    + rows.map(function(r) { return '<tr><td>' + hEsc(r.c.tenant_name || '') + '</td><td>' + hEsc(r.c.object_name || '') + '</td><td>' + hEsc(r.c.contract_number || '') + '</td><td>' + (r.mails.length ? hEsc(r.mails.join(', ')) : '<span class="hr-chip orange">нет адреса</span>') + '</td></tr>'; }).join('')
    + '</tbody></table></div>';
  ah.mailList = all;
}
function aCopy(text) {
  try { if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function() { hToast('Скопировано'); }, function() { hToast('Выделите адреса и скопируйте вручную'); }); return; } } catch (e) { /* песочница */ }
  hToast('Выделите адреса и скопируйте вручную');
}


// ---------- приходы сотрудников (СКУД): данные кладёт scripts/skud_sync.py; выход — кнопкой без карты, поэтому видны только входы ----------
const A_WD = { 'пн': 1, 'вт': 2, 'ср': 3, 'чт': 4, 'пт': 5, 'сб': 6, 'вс': 7 };
// «пн-чт», «вт-пт», «пн,ср-пт» → [1..7]
function aDaysSpec(s) {
  const out = [];
  String(s || '').toLowerCase().split(/[,\s]+/).forEach(function(p) {
    const m = p.match(/^(пн|вт|ср|чт|пт|сб|вс)(?:-(пн|вт|ср|чт|пт|сб|вс))?$/);
    if (!m) return;
    for (let i = A_WD[m[1]]; i <= A_WD[m[2] || m[1]]; i++) out.push(i);
  });
  return out;
}
// «График работы» из карточки сотрудника: «9:30-18:30», «9:00-18:00 · Удаленно: вт-пт», «12:00-20:00 · Удаленно», «пн-чт»
function aSched(e) {
  const s = String((e && e.work_schedule) || ''), tm = s.match(/(\d{1,2}):(\d{2})/);
  const parts = s.split('·').map(function(x) { return x.trim(); });
  const rem = parts.find(function(x) { return /^удал[её]нно/i.test(x); }) || '';
  const work = aDaysSpec(parts.filter(function(x) { return !/удал/i.test(x) && !/\d:\d/.test(x); }).join(','));
  return { start: tm ? ('0' + tm[1]).slice(-2) + ':' + tm[2] : (ah.d.skud.skud_work_start || '09:00'),
    remoteAll: !!rem && !/:/.test(rem), remoteDays: rem.indexOf(':') !== -1 ? aDaysSpec(rem.split(':')[1]) : [], workDays: work.length ? work : [1, 2, 3, 4, 5] };
}
function aEmp(id) { return (ah.d.emps || []).find(function(e) { return e.id === Number(id); }) || null; }
function aOnVac(empId, day) { return (ah.d.vacs || []).find(function(v) { return Number(v.employee_id) === Number(empId) && hD(v.start_date) <= day && hD(v.end_date) >= day; }) || null; }
function aMin(hm) { const p = String(hm || '').split(':'); return Number(p[0]) * 60 + Number(p[1] || 0); }
function aSkudAge() {
  const s = ah.d.skud && ah.d.skud.skud_synced_at;
  if (!s) return 'не загружались';
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  return m < 60 ? m + ' мин назад' : hDate(s) + ' ' + String(s).slice(11, 16);
}
// люди, которых СКУД может видеть: сотрудники CRM с привязанной картой (+ несопоставленные карты, если по ним были проходы)
function aAttPeople() {
  const by = {};
  (ah.d.cards || []).forEach(function(c) {
    if (c.ignore) return;
    const key = c.employee_id ? 'e' + c.employee_id : 's' + c.skud_name;
    if (!by[key]) by[key] = { key: key, emp: c.employee_id ? aEmp(c.employee_id) : null, name: c.skud_name, cards: [] };
    by[key].cards.push(c.card);
  });
  Object.keys(by).forEach(function(k) { const p = by[k]; if (p.emp) p.name = p.emp.full_name || p.name; if (k[0] === 'e' && !p.emp) delete by[k]; });
  return Object.keys(by).map(function(k) { return by[k]; }).sort(function(a, b) { return a.name.localeCompare(b.name, 'ru'); });
}
// статус человека за день: came | late | absent | vac | remote | off; first / last — время первого и последнего входа
function aAttStatus(p, day, evs) {
  const mine = evs.filter(function(x) { return x.day === day && p.cards.indexOf(x.card) !== -1; }).map(function(x) { return x.time; }).sort();
  const wd = ((new Date(day + 'T00:00:00').getDay() + 6) % 7) + 1, sc = aSched(p.emp), grace = Number(ah.d.skud.skud_grace_min || 10);
  const r = { first: mine[0] || '', last: mine[mine.length - 1] || '', n: mine.length, start: sc.start };
  if (mine.length) { r.st = p.emp && aMin(r.first) > aMin(sc.start) + grace ? 'late' : 'came'; r.lateMin = aMin(r.first) - aMin(sc.start); return r; }
  if (p.emp && aOnVac(p.emp.id, day)) { r.st = 'vac'; r.vac = aOnVac(p.emp.id, day); return r; }
  if (sc.workDays.indexOf(wd) === -1) { r.st = 'off'; return r; }
  if (sc.remoteAll || sc.remoteDays.indexOf(wd) !== -1) { r.st = 'remote'; return r; }
  r.st = p.emp ? 'absent' : 'off';
  return r;
}
function aAttDay(day, evs) {
  const ppl = aAttPeople(), out = { came: 0, late: 0, lateList: [] };
  ppl.forEach(function(p) {
    const s = aAttStatus(p, day, evs || []);
    if (s.n) out.came++;
    if (s.st === 'late') { out.late++; out.lateList.push({ name: p.name, first: s.first }); }
  });
  return out;
}
async function aAttLoad(month) {
  const from = month + '-01', to = aAddMonths(from, 1);
  const res = await ctx.api.resource('crm_skud_events').list({ paginate: false, filter: { kind: 'card', day: { $gte: from, $lt: to } }, fields: ['day', 'time', 'card'], sort: ['day', 'time'] });
  ah.att.ev = hRows(res); ah.att.month = month;
}
function aAttShift(n) {
  const a = ah.att;
  if (a.view === 'month') { a.day = aAddMonths(a.day.slice(0, 7) + '-01', n); }
  else { const d = new Date(a.day + 'T00:00:00'); d.setDate(d.getDate() + n); a.day = hIso(d); }
  aRenderAtt();
}
const A_ATT_ST = { came: ['вовремя', 'green'], late: ['опоздание', 'red'], absent: ['нет прохода', 'orange'], vac: ['в отпуске', 'blue'], remote: ['удалённо', 'grey'], off: ['выходной', 'grey'] };
async function aRenderAtt() {
  const a = ah.att;
  a.day = a.day || hToday();
  if (a.month !== a.day.slice(0, 7)) { aBody().innerHTML = '<div class="hr-empty">Загрузка проходов…</div>'; try { await aAttLoad(a.day.slice(0, 7)); } catch (e) { aBody().innerHTML = '<div class="hr-empty">Нет доступа к данным СКУД</div>'; return; } }
  const seg = '<div class="hr-seg">' + [['day', 'День'], ['month', 'Месяц'], ['cards', 'Карты']].map(function(x) { return '<button data-act="attv" data-v="' + x[0] + '"' + (a.view === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>';
  const nav = a.view === 'cards' ? '' : '<button class="hr-btn" data-act="attd" data-d="-1">‹</button>'
    + (a.view === 'day' ? '<input type="date" data-f="attDay" value="' + a.day + '">' : '<b>' + ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][Number(a.day.slice(5, 7)) - 1] + ' ' + a.day.slice(0, 4) + '</b>')
    + '<button class="hr-btn" data-act="attd" data-d="1">›</button>';
  const head = '<div class="hr-bar">' + seg + nav + (a.view === 'month' ? '<button class="hr-btn" data-act="attcsv">⬇ Выгрузить в Excel</button>' : '')
    + '<span class="hr-hint" style="margin:0 0 0 auto;">данные СКУД: ' + hEsc(aSkudAge()) + '</span></div>'
    + '<div class="hr-hint" style="margin-bottom:10px;">СКУД видит только вход по карте (выход — кнопкой), поэтому «приход» — первый проход за день, «последний» — последний вход (например, после обеда), а не уход. '
    + 'Начало дня — из «Графика работы» в карточке сотрудника (иначе ' + hEsc(ah.d.skud.skud_work_start || '09:00') + '), опоздание — больше ' + hEsc(ah.d.skud.skud_grace_min || '10') + ' мин; удалённые дни и отпуска учитываются.</div>';
  if (a.view === 'cards') return aRenderCards(head);
  if (a.view === 'month') return aRenderAttMonth(head);
  const ppl = aAttPeople(), rows = ppl.map(function(p) { return { p: p, s: aAttStatus(p, a.day, a.ev) }; })
    .filter(function(x) { return x.s.st !== 'off' || x.s.n; })
    .sort(function(x, y) { const o = { late: 0, absent: 1, came: 2, vac: 3, remote: 4, off: 5 }; return o[x.s.st] - o[y.s.st] || (x.s.first || '99').localeCompare(y.s.first || '99'); });
  const cnt = function(st) { return rows.filter(function(x) { return x.s.st === st; }).length; };
  aBody().innerHTML = head
    + '<div class="hr-tiles">' + [['came', 'Пришли вовремя'], ['late', 'Опоздали'], ['absent', 'Нет прохода'], ['vac', 'В отпуске'], ['remote', 'Удалённо']].map(function(x) {
      return '<div class="hr-tile"><div class="hr-tile-l">' + x[1] + '</div><div class="hr-tile-v' + (x[0] === 'late' && cnt('late') ? ' red' : '') + '">' + cnt(x[0]) + '</div></div>'; }).join('') + '</div>'
    + (rows.length ? '<div class="hr-card"><table><thead><tr><th>Сотрудник</th><th>Должность</th><th>Начало дня</th><th>Приход</th><th>Последний вход</th><th class="n">Проходов</th><th>Статус</th></tr></thead><tbody>'
      + rows.map(function(x) {
        const s = x.s, st = A_ATT_ST[s.st];
        return '<tr><td>' + hEsc(x.p.name) + (x.p.emp ? '' : ' <span class="hr-chip orange" title="Карта не сопоставлена с сотрудником CRM — вкладка «Карты»">не сопоставлен</span>') + '</td>'
          + '<td>' + hEsc(x.p.emp ? x.p.emp.position || '' : '') + '</td><td>' + (x.p.emp ? hEsc(s.start) : '') + '</td><td><b>' + hEsc(s.first.slice(0, 5)) + '</b></td><td>' + hEsc(s.n > 1 ? s.last.slice(0, 5) : '') + '</td>'
          + '<td class="n">' + (s.n || '') + '</td><td><span class="hr-chip ' + st[1] + '">' + st[0] + (s.st === 'late' ? ' ' + s.lateMin + ' мин' : '') + '</span></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="hr-empty"><b>Нет данных</b>Карты СКУД ещё не загружены или ни одна не сопоставлена с сотрудниками.</div>');
}
function aAttMonthData() {
  const a = ah.att, m = a.day.slice(0, 7), n = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate(), t = hToday();
  const days = []; for (let i = 1; i <= n; i++) days.push(m + '-' + ('0' + i).slice(-2));
  const ppl = aAttPeople().filter(function(p) { return p.emp || a.ev.some(function(x) { return p.cards.indexOf(x.card) !== -1; }); });
  return { days: days, rows: ppl.map(function(p) {
    const cells = days.map(function(d) { return d > t ? { st: 'future' } : aAttStatus(p, d, a.ev); });
    return { p: p, cells: cells, came: cells.filter(function(c) { return c.n; }).length, late: cells.filter(function(c) { return c.st === 'late'; }).length, absent: cells.filter(function(c) { return c.st === 'absent'; }).length };
  }) };
}
function aRenderAttMonth(head) {
  const md = aAttMonthData();
  const cell = function(c, d) {
    const we = [0, 6].indexOf(new Date(d + 'T00:00:00').getDay()) !== -1;
    if (c.n) return '<td class="n" style="' + (c.st === 'late' ? 'color:#cf1322;font-weight:600;' : '') + (we ? 'background:#fafafa;' : '') + '" title="' + hEsc((c.st === 'late' ? 'опоздание ' + c.lateMin + ' мин, ' : '') + 'проходов ' + c.n + (c.n > 1 ? ', последний ' + c.last.slice(0, 5) : '')) + '">' + c.first.slice(0, 5) + '</td>';
    const txt = { vac: 'О', remote: 'У', absent: '—' }[c.st] || '';
    return '<td class="n" style="' + (we || c.st === 'off' || c.st === 'future' ? 'background:#fafafa;' : '') + (c.st === 'absent' ? 'color:#d46b08;' : 'color:#8c8c8c;') + '">' + txt + '</td>';
  };
  aBody().innerHTML = head + '<div class="hr-hint" style="margin-bottom:8px;">О — отпуск, У — удалённый день, — — рабочий день без прохода; красным — опоздание. Наведите на время — подробности.</div>'
    + '<div class="hr-card hr-plan"><table><thead><tr><th>Сотрудник</th>' + md.days.map(function(d) { return '<th class="n">' + Number(d.slice(8)) + '</th>'; }).join('')
    + '<th class="n">Дней</th><th class="n">Опозд.</th><th class="n">Без прохода</th></tr></thead><tbody>'
    + md.rows.map(function(r) { return '<tr><td>' + hEsc(r.p.name) + '</td>' + r.cells.map(function(c, i) { return cell(c, md.days[i]); }).join('') + '<td class="n"><b>' + r.came + '</b></td><td class="n"' + (r.late ? ' style="color:#cf1322;"' : '') + '>' + r.late + '</td><td class="n">' + r.absent + '</td></tr>'; }).join('')
    + '</tbody></table></div>';
}
// табель СКУД за месяц в Excel — общий вид выгрузок CRM (src/_crm-xlsx.js)
function aAttXlsx() {
  const md = aAttMonthData(), m = ah.att.day.slice(0, 7);
  const mon = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][Number(m.slice(5, 7)) - 1] + ' ' + m.slice(0, 4);
  const lates = [];
  md.rows.forEach(function(r) { r.cells.forEach(function(c, i) { if (c.st === 'late') lates.push([md.days[i], r.p.name, r.p.emp ? r.p.emp.position || '' : '', c.start || '', c.first.slice(0, 5), c.lateMin]); }); });
  lates.sort(function(x, y) { return x[0].localeCompare(y[0]) || x[1].localeCompare(y[1], 'ru'); });
  crmXlsx('Табель СКУД ' + m, {
    title: 'Приходы по СКУД — ' + mon, filters: [['Месяц', mon], ['Данные СКУД', aSkudAge()]],
    notes: [['Время в ячейке', 'Первый проход по карте за день; «оп.» — опоздание'], ['О', 'Отпуск'], ['У', 'Удалённый день'], ['—', 'Рабочий день без прохода'],
      ['Начало дня', 'Из «Графика работы» в карточке сотрудника, иначе ' + (ah.d.skud.skud_work_start || '09:00') + '; опоздание — больше ' + (ah.d.skud.skud_grace_min || '10') + ' мин'],
      ['Ограничение СКУД', 'Видно только вход по карте (выход — кнопкой), поэтому время ухода не считается']],
    sheets: [
      { name: 'Табель', title: 'Табель приходов по СКУД — ' + mon, total: true, freezeCols: 1,
        cols: [{ h: 'Сотрудник', total: 'Итого' }].concat(md.days.map(function(d) { const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][new Date(d + 'T00:00:00').getDay()]; return { h: Number(d.slice(8)) + ' ' + wd, w: 8, total: false }; }),
          [{ h: 'Дней с проходом', t: 'int' }, { h: 'Опозданий', t: 'int' }, { h: 'Без прохода', t: 'int' }]),
        rows: md.rows.map(function(r) {
          return [r.p.name].concat(r.cells.map(function(c) { return c.n ? c.first.slice(0, 5) + (c.st === 'late' ? ' оп.' : '') : ({ vac: 'О', remote: 'У', absent: '—' }[c.st] || ''); }), [r.came, r.late, r.absent]);
        }) },
      { name: 'Опоздания', title: 'Опоздания — ' + mon, total: true,
        cols: [{ h: 'Дата', t: 'date', total: 'Итого' }, { h: 'Сотрудник', w: 30 }, { h: 'Должность', w: 30 }, { h: 'Начало дня' }, { h: 'Пришёл' }, { h: 'Опоздание, мин', t: 'int' }],
        rows: lates }
    ]
  });
}
function aRenderCards(head) {
  const cards = (ah.d.cards || []).filter(function(c) { return !ah.att.cardsOnlyFree || (!c.employee_id && !c.ignore); });
  const free = (ah.d.cards || []).filter(function(c) { return !c.employee_id && !c.ignore; }).length;
  const opts = function(sel) { return '<option value="">— не сопоставлен —</option>' + (ah.d.emps || []).map(function(e) { return '<option value="' + e.id + '"' + (Number(sel) === e.id ? ' selected' : '') + '>' + hEsc(e.full_name) + '</option>'; }).join(''); };
  aBody().innerHTML = head + '<div class="hr-bar"><label style="display:flex;gap:6px;align-items:center;font-size:13.5px;"><input type="checkbox" data-f="cardsFree"' + (ah.att.cardsOnlyFree ? ' checked' : '') + '> только несопоставленные (' + free + ')</label>'
    + '<span class="hr-hint" style="margin:0;">Карты и ФИО приходят из программы СКУД. Сотрудник CRM подставляется по ФИО сам; если не нашёлся — выберите вручную. Гостевые и служебные карты отметьте «не учитывать».</span></div>'
    + '<div class="hr-card"><table><thead><tr><th>ФИО в СКУД</th><th>Должность в СКУД</th><th>Карта</th><th>Сотрудник CRM</th><th>Не учитывать</th></tr></thead><tbody>'
    + cards.map(function(c) {
      return '<tr' + (c.ignore ? ' style="opacity:.5;"' : '') + '><td>' + hEsc(c.skud_name) + '</td><td>' + hEsc(c.skud_position || '') + '</td><td><span class="hr-hint" style="margin:0;">' + hEsc(c.card) + '</span></td>'
        + '<td><select data-card-emp="' + c.id + '"' + (c.employee_id ? '' : ' style="border-color:#ffd591;"') + '>' + opts(c.employee_id) + '</select>' + (c.manual ? ' <span class="hr-hint">вручную</span>' : '') + '</td>'
        + '<td><input type="checkbox" data-card-ign="' + c.id + '"' + (c.ignore ? ' checked' : '') + '></td></tr>';
    }).join('') + '</tbody></table></div>';
}
async function aSaveCard(id, vals) {
  try { await ctx.api.resource('crm_skud_cards').update({ filterByTk: id, values: vals }); const c = (ah.d.cards || []).find(function(x) { return x.id === id; }); if (c) Object.assign(c, vals); hToast('Сохранено'); aRenderAtt(); }
  catch (e) { hToast('Не удалось сохранить'); }
}

// ---------- события ----------
aRoot().addEventListener('click', function(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  if (c('a[href], a[data-ahfile]') && !c('[data-act]')) return;
  const tab = c('[data-tab]');
  if (tab) { ah.tab = tab.getAttribute('data-tab'); aRender(); try { window.scrollTo(0, 0); } catch (err) { /* песочница */ } return; }
  const act = c('[data-act]'), a = act && act.getAttribute('data-act');
  if (a) {
    e.stopPropagation();
    const id = Number(act.getAttribute('data-id'));
    if (a === 'done') return aDone(id);
    if (a === 'subpaid') return aSubPaid(id);
    if (a === 'newroutine') return aOpenRoutine(null);
    if (a === 'newexp') return aOpenExp(null);
    if (a === 'newsub') return aOpenSub(null);
    if (a === 'newart') return aEdit({ coll: 'crm_aho_articles', rec: null, spec: A_ART, title: 'Новая статья расходов' });
    if (a === 'art') return aEdit({ coll: 'crm_aho_articles', rec: aArt(id), spec: A_ART, title: 'Статья расходов' });
    if (a === 'newpoa') return aOpenPoa(null);
    if (a === 'newfire') return aOpenFire(null);
    if (a === 'newmail') return aOpenMail(null);
    if (a === 'newcar') return aOpenCar(null);
    if (a === 'newfine') return aOpenFine(null);
    if (a === 'mv') { ah.moneyView = act.getAttribute('data-v'); return aRenderMoney(); }
    if (a === 'explayout') { ah.expLayout = act.getAttribute('data-v'); try { localStorage.setItem('crm-aho-exp-layout', ah.expLayout); } catch (err) { /* не запомним — не страшно */ } return aRenderMoney(); }
    if (a === 'expst') { ah.expSt = act.getAttribute('data-v'); return aRenderMoney(); }
    if (a === 'mailkind') { ah.mailKind = act.getAttribute('data-v'); return aRenderMail(); }
    if (a === 'year') { ah.year += Number(act.getAttribute('data-d')); return aRenderMoney(); }
    if (a === 'copymails') return aCopy((ah.mailList || []).join(', '));
    if (a === 'attv') { ah.att.view = act.getAttribute('data-v'); return aRenderAtt(); }
    if (a === 'attd') { return aAttShift(Number(act.getAttribute('data-d'))); }
    if (a === 'attcsv') { try { aAttXlsx(); } catch (err) { console.error(err); } return; }
    return;
  }
  const go = c('[data-go]');
  if (go) return aGo(JSON.parse(go.getAttribute('data-go')));
  const rec = c('[data-rec]');
  if (rec) {
    const p = rec.getAttribute('data-rec').split(':'), id = Number(p[1]);
    if (p[0] === 'routine') return aOpenRoutine(aFind(ah.d.routines, id));
    if (p[0] === 'exp') return aOpenExp(aFind(ah.d.exps, id));
    if (p[0] === 'sub') return aOpenSub(aFind(ah.d.subs, id));
    if (p[0] === 'poa') return aOpenPoa(aFind(ah.d.poa, id));
    if (p[0] === 'fire') return aOpenFire(aFind(ah.d.fire, id));
    if (p[0] === 'mail') return aOpenMail(aFind(ah.d.mail, id));
    if (p[0] === 'car') return aOpenCar(aFind(ah.d.cars, id));
    if (p[0] === 'fine') return aOpenFine(aFind(ah.d.fines, id));
  }
});
aRoot().addEventListener('change', function(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'poaLe') { ah.poaLe = e.target.value; return aRenderPoa(); }
  if (f === 'fireObj') { ah.fireObj = e.target.value; return aRenderFire(); }
  if (f === 'mObj') { ah.mObj = e.target.value; return aRenderMailing(); }
  if (f === 'attDay') { if (e.target.value) { ah.att.day = e.target.value; return aRenderAtt(); } return; }
  if (f === 'cardsFree') { ah.att.cardsOnlyFree = e.target.checked; return aRenderAtt(); }
  const ce = e.target.getAttribute('data-card-emp'), ci = e.target.getAttribute('data-card-ign');
  if (ce) return aSaveCard(Number(ce), { employee_id: e.target.value ? Number(e.target.value) : null, manual: true });
  if (ci) return aSaveCard(Number(ci), { ignore: e.target.checked });
  const pl = e.target.getAttribute('data-plan');
  if (pl) aSavePlan(pl, e.target.value.trim());
});
aStart();
