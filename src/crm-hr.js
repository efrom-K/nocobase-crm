// Один код — две страницы (режим по адресу):
//  • «Сотрудники (тест)» (/admin/hrpage01, блок crmblock003) — общий раздел для всех: справочник, структура, отпуска; только просмотр.
//  • «Дашборд HR (тест)» (/admin/hrdash01, блок crmblock004) — рабочее место HR-службы: без вкладок, главный экран = плитки разделов
//    + лента «Требует внимания»; клик по плитке открывает раздел, «← Дашборд HR» возвращает. Разделы: сотрудники (сводная таблица и структура), отпуска,
// охрана труда (обучение, инструктажи, пожарная безопасность, СОУТ), воинский учёт (по организациям и людям), документы и мероприятия
// (ЛНА, мотивация, корпоративы). Разделы повторяют рабочие папки HR: всё ведётся по юрлицам (их больше десятка, человек может быть в нескольких).
// Коллекции — scripts/setup_crm_hr.py. Закрытые данные (паспорт, воинский учёт, мотивация) — crm_hr_private: сервер отдаёт их
// только ролям admin и hr, поэтому «можно править» = «сервер отдал закрытые данные». Остальные видят справочник и отпуска.
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
if (!document.getElementById('crm-hr-style')) {
  const st = document.createElement('style');
  st.id = 'crm-hr-style';
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
    .hr-people { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:8px; }
    .hr-person { display:flex; gap:10px; align-items:flex-start; border:1px solid #f0f0f0; border-radius:10px; padding:10px 12px; background:#fff; cursor:pointer; min-width:0; }
    .hr-person:hover { border-color:#b4bfd9; }
    .hr-list { padding:4px 8px; }
    .hr-list td { vertical-align:middle; }
    .hr-list td.nm { white-space:nowrap; }
    .hr-list td.nm .hr-ava { width:28px; height:28px; font-size:11px; display:inline-flex; vertical-align:middle; margin-right:10px; }
    .hr-list td.nm b { font-weight:600; margin-right:8px; }
    .hr-list td.nm .hr-chip { margin-right:4px; }
    .hr-list td.ph { white-space:nowrap; }
    .hr-list a { color:#1c2d58; text-decoration:none; }
    .hr-list tr.hr-dept td { background:#fafafa; font-weight:600; padding-top:10px; border-bottom:1px solid #f0f0f0; }
    .hr-list tr.hr-dept td span { color:#8c8c8c; font-weight:400; margin-left:6px; }
    .hr-list tr[data-emp] { cursor:pointer; }
    .hr-list tr[data-emp]:hover td { background:#f5faff; }
    .hr-person.off { opacity:.55; }
    .hr-ava { flex:none; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13.5px; color:#fff; }
    .hr-person-b { min-width:0; flex:1; }
    .hr-person-n { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hr-person-p { font-size:12.5px; color:#595959; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hr-chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .hr-chip { font-size:11.5px; padding:1px 7px; border-radius:10px; background:#f5f5f5; color:#595959; white-space:nowrap; }
    .hr-chip.blue { background:#eef1f8; color:#142142; }
    .hr-chip.orange { background:#fff7e6; color:#d46b08; }
    .hr-chip.red { background:#fff1f0; color:#cf1322; }
    .hr-chip.green { background:#f6ffed; color:#389e0d; }
    .hr-chip.purple { background:#f9f0ff; color:#722ed1; }
    /* оргструктура */
    .hr-le { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:8px; margin-bottom:16px; }
    .hr-le-c { border:1px solid #dfe3ea; border-radius:10px; padding:10px 12px; background:#fff; }
    .hr-le-c[data-le] { cursor:pointer; }
    .hr-le-c[data-le]:hover { border-color:#b4bfd9; }
    .hr-le-c b { display:block; color:#141414; }
    .hr-le-c a { color:#1c2d58; cursor:pointer; }
    .hr-org-top { display:flex; justify-content:center; }
    .hr-org-ceo-c { width:100%; max-width:560px; border:2px solid #1c2d58; border-radius:12px; background:#fff; padding:10px 14px; }
    .hr-org-board { border-top:1px solid #e8ebf0; margin-top:6px; padding-top:4px; }
    .hr-org-line { width:2px; height:18px; background:#b4bfd9; margin:0 auto; }
    .hr-org-cols { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:12px; align-items:start; }
    .hr-org-col { border:1px solid #dfe3ea; border-radius:12px; background:#f8f9fb; padding:10px; }
    .hr-dt { background:#fff; border:1px solid #dfe3ea; border-radius:10px; padding:8px 10px; }
    .hr-dt.sub { margin-top:8px; border-left:3px solid #b4bfd9; }
    .hr-dt-h { display:flex; align-items:baseline; gap:8px; cursor:pointer; padding:2px 0 4px; }
    .hr-dt-h b { font-size:15px; color:#141414; }
    .hr-dt.sub .hr-dt-h b { font-size:14px; }
    .hr-dt-h span { margin-left:auto; font-size:12.5px; color:#1c2d58; white-space:nowrap; }
    .hr-dt-h:hover b { color:#1c2d58; text-decoration:underline; }
    .hr-dt-n { font-size:12.5px; color:#595959; padding:4px 0 2px; }
    .hr-dt-head .hr-pr { background:#eef1f8; border-radius:8px; }
    .hr-pr { display:flex; align-items:center; gap:10px; padding:5px 6px; border-radius:6px; cursor:pointer; min-width:0; }
    .hr-pr:hover { background:#eaf0ff; }
    .hr-pr .hr-ava { width:30px; height:30px; font-size:11.5px; }
    .hr-pr-t { flex:1; min-width:0; }
    .hr-pr-t b { font-size:13.5px; color:#1f1f1f; font-weight:600; }
    .hr-pr-t span:not(.hr-chip) { display:block; font-size:12.5px; color:#595959; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hr-cbs { display:inline-flex; gap:4px; flex:none; flex-wrap:wrap; }
    .hr-cb { display:inline-flex; align-items:center; gap:4px; height:28px; min-width:30px; justify-content:center; padding:0 8px; border:1px solid #d9d9d9; border-radius:6px; background:#fff;
      color:#1c2d58 !important; font-size:13px; text-decoration:none !important; white-space:nowrap; }
    .hr-cb:hover { border-color:#1c2d58; background:#f3f5fa; }
    .hr-sr { border:1px solid #dfe3ea; border-radius:10px; padding:8px 12px; margin-bottom:6px; cursor:pointer; background:#fff; font-size:13.5px; }
    .hr-sr:hover { border-color:#1c2d58; background:#f8f9fb; }
    .hr-obj { border:1px solid #e8ebf0; border-radius:10px; padding:6px 8px; margin-bottom:8px; }
    .hr-obj-h { font-weight:600; font-size:13.5px; padding:2px 6px 4px; color:#141414; }
    .hr-obj-h span { font-weight:400; color:#8c8c8c; font-size:12px; }
    .hr-crumbs { font-size:12.5px; font-weight:400; color:#8c8c8c; margin-bottom:4px; }
    .hr-crumbs a, a.hr-link { color:#1c2d58; cursor:pointer; }
    /* отпуска: годовая шкала */
    .hr-tl { width:100%; border-collapse:collapse; table-layout:fixed; }
    .hr-tl td { padding:3px 6px; border-bottom:1px solid #f5f5f5; }
    .hr-tl td.nm { width:210px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
    .hr-tl td.nm:hover { color:#1c2d58; }
    .hr-tl td.rest { width:80px; text-align:right; font-size:12.5px; }
    .hr-track { position:relative; height:22px; display:flex; cursor:copy; }
    .hr-track > i { display:block; height:100%; border-left:1px solid #f0f0f0; box-sizing:border-box; }
    .hr-track > i.odd { background:#fafafa; }
    .hr-vb { position:absolute; top:3px; height:16px; border-radius:4px; cursor:pointer; font-size:10.5px; color:#fff; overflow:hidden; white-space:nowrap; padding:0 3px; box-sizing:border-box; line-height:16px; }
    .hr-vb.sched { background:#1c2d58; }
    .hr-vb.unsched { background:#faad14; color:#613400; }
    .hr-vb.unpaid { background:#8c8c8c; }
    .hr-vb.other { background:#9254de; }
    .hr-vb.draft { opacity:.45; }
    .hr-vb.demo { outline:1px dashed #262626; outline-offset:-1px; }
    .hr-now { position:absolute; top:0; bottom:0; width:2px; background:#cf1322; opacity:.6; pointer-events:none; }
    .hr-months { display:flex; font-size:11.5px; color:#8c8c8c; }
    .hr-months > i { font-style:normal; text-align:center; }
    .hr-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12.5px; color:#595959; align-items:center; }
    .hr-legend i { display:inline-block; width:14px; height:10px; border-radius:3px; margin-right:5px; vertical-align:middle; }
    /* охрана труда: матрица */
    .hr-mx td.c { text-align:center; cursor:pointer; font-size:12px; white-space:nowrap; }
    .hr-mx td.c:hover { outline:2px solid #b4bfd9; outline-offset:-2px; }
    .hr-mx th.c { text-align:center; white-space:normal; font-size:12px; min-width:80px; }
    .hr-ok { color:#389e0d; } .hr-soon { color:#d46b08; font-weight:600; } .hr-late { color:#cf1322; font-weight:600; } .hr-none { color:#bfbfbf; }
    .hr-cls { display:inline-block; min-width:32px; text-align:center; padding:1px 6px; border-radius:4px; font-weight:600; font-size:12px; }
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
    /* подбор: воронка */
    .hr-kb { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; align-items:start; }
    .hr-kb-col { background:#fafafa; border-radius:10px; padding:8px; min-width:0; }
    .hr-kb-h { font-weight:600; font-size:13px; padding:2px 4px 8px; display:flex; gap:6px; }
    .hr-kb-h span { color:#8c8c8c; font-weight:400; }
    .hr-kb-c { background:#fff; border:1px solid #f0f0f0; border-radius:8px; padding:8px 10px; margin-bottom:6px; cursor:pointer; font-size:13px; }
    .hr-kb-c:hover { border-color:#b4bfd9; }
    .hr-kb-c b { display:block; font-size:13.5px; }
    @media (max-width: 800px) {
      .hr-kb { grid-template-columns:1fr; }
      .hr-cols, .hr-secs, .hr-form { grid-template-columns:1fr; }
      .hr-new { margin-left:0; width:100%; }
      .hr-bar select, .hr-bar input[type=text] { flex:1 1 100%; min-width:0; }
      .hr-modal { padding:0; }
      .hr-box { border-radius:0; min-height:100%; max-width:none; }
      .hr-tl td.nm { width:110px; }
      .hr-pick { columns:1; }
    }
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

// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
const HR_TASKS_PAGE = '/admin/tskpage01';
const HR_STAFF_PAGE = '/admin/hrpage01', HR_DASH_PAGE = '/admin/hrdash01';
const HR_MODE = location.pathname.indexOf(HR_DASH_PAGE) !== -1 ? 'hr' : 'staff';
const HR_DEPT = cfg('org.hrDept');
const HR_EMP_TYPE = cfg('hr.empType');
const HR_EMP_ST = { active: 'Работает', fired: 'Уволен' };
const HR_VAC_KINDS = cfg('hr.vacKinds');
const HR_VAC_ST = cfg('hr.vacStatus');
const HR_VAC_SCHED = { yes: 'По графику отпусков', no: 'Вне графика (внеплановый)' };
// цвет полосы: ежегодный по графику / вне графика, за свой счёт, прочие; пусто в in_schedule = по графику (так загружен утверждённый график)
function hVacCls(v) { return !v.kind || v.kind === HR_VAC_KINDS[0] ? (v.in_schedule === 'no' ? 'unsched' : 'sched') : v.kind === HR_VAC_KINDS[1] ? 'unpaid' : 'other'; }
const HR_VAC_CLS = { sched: 'ежегодный по графику', unsched: 'ежегодный вне графика', unpaid: 'за свой счёт', other: 'учебный, декретный, по уходу' };
// вид, раздел, период в месяцах (0 — однократно), подпись столбца. Периоды — типовые, дата «следующее» правится вручную.
// виды — как в таблице HR «Сроки прохождения обучения по ОТ и ПБ» + журналы инструктажей (повторный — раз в полгода)
const HR_SAFETY = [
  ['Вводный инструктаж (журнал)', 'ot', 0, 'Вводный'],
  ['Повторный инструктаж (журнал)', 'ot', 6, 'Повторный'],
  ['Общая охрана труда (ОТА)', 'ot', 36, 'ОТ'],
  ['Первая помощь (ОТБ ОПП)', 'ot', 36, 'Первая помощь'],
  ['Пожарная безопасность (МПБ)', 'pb', 36, 'ПБ'],
  ['Электробезопасность', 'ot', 12, 'Электро'],
  ['Экологическая безопасность', 'ot', 36, 'Экология']
];
const HR_FILE_DOCS = cfg('hr.fileDocs');
const HR_FILE_DOCS_SELF = cfg('hr.fileDocsSelf');
const HR_PB_COMMON = [['Проверка огнетушителей', 12], ['Тренировка по эвакуации', 12], ['Проверка пожарной сигнализации', 12], ['Проверка внутреннего противопожарного водопровода', 6], ['Обучение ответственного за пожарную безопасность', 36]];
const HR_SOUT_CLS = { '1': '#389e0d', '2': '#52c41a', '3.1': '#faad14', '3.2': '#fa8c16', '3.3': '#fa541c', '3.4': '#f5222d', '4': '#a8071a' };
const HR_LNA_KINDS = cfg('hr.lnaKinds');
const HR_PROG_KINDS = cfg('hr.progKinds');
const HR_EVENT_KINDS = cfg('hr.eventKinds');
const HR_STAGES = cfg('hr.stages');
const HR_STAGE_C = { new: '', interview: 'blue', offer: 'orange', hired: 'green', rejected: '', declined: '' };
const HR_VACANCY_ST = cfg('hr.vacancyStatus');
const HR_COMPS = cfg('hr.comps');
const HR_SOURCES = cfg('hr.sources');
const HR_RANKS = ['рядовой', 'ефрейтор', 'младший сержант', 'сержант', 'старший сержант', 'старшина', 'прапорщик', 'старший прапорщик', 'лейтенант', 'старший лейтенант', 'капитан', 'майор', 'подполковник', 'полковник'];
const HR_AVA = ['#1c2d58', '#13a8a8', '#722ed1', '#d46b08', '#389e0d', '#c41d7f', '#2f4373', '#08979c'];
const HR_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const hr = { d: null, me: null, myEmp: null, tab: '', staffView: 'list', le: '', type: '', dept: '', q: '', fired: false, only: null,
  year: new Date().getFullYear(), orgQ: '', mxLe: '', hireView: 'funnel', hireVac: '' };

// ---------- мелочи ----------
function hEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function hToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function hRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function hIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function hToday() { return hIso(new Date()); }
function hD(v) { return String(v || '').slice(0, 10); }
function hDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + (m[1] === '1900' ? '' : '.' + m[1]) : ''; }
function hDays(a, b) { return Math.round((new Date(hD(b) + 'T00:00:00') - new Date(hD(a) + 'T00:00:00')) / 86400000); }
function hAddDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return hIso(d); }
function hAddMonths(iso, n) { const p = hD(iso).split('-').map(Number); return hIso(new Date(p[0], p[1] - 1 + n, p[2])); }
function hNoun(n, a, b, c) { const x = Math.abs(n) % 100, y = x % 10; return (x > 10 && x < 20) ? c : y === 1 ? a : (y >= 2 && y <= 4) ? b : c; }
function hPeople(n) { return n + ' ' + hNoun(n, 'сотрудник', 'сотрудника', 'сотрудников'); }
function hAva(n) {
  let h = 0; for (let i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) >>> 0;
  const p = String(n || '?').split(/\s+/);
  return '<span class="hr-ava" style="background:' + HR_AVA[h % HR_AVA.length] + ';">' + hEsc((((p[0] || '')[0] || '') + ((p[1] || '')[0] || '')).toUpperCase()) + '</span>';
}
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
  const boundary = '----hrBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + hToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const data = ((await res.json()) || {}).data || {};
  if (!data.id) throw new Error('upload');
  return data;   // { id, url, title, filename, … }
}

// ---------- данные ----------
function hHasHr() { return !!(hr.d && hr.d.priv !== null); }   // сервер отдал закрытые данные → admin или hr
function hCan() { return HR_MODE === 'hr' && hHasHr(); }       // править можно только в дашборде HR
function hEmp(id) { return hr.d.emps.find(function(e) { return e.id === Number(id); }) || null; }
function hActive() { return hr.d.emps.filter(function(e) { return e.status !== 'fired'; }); }
function hStaff() { return hActive().filter(function(e) { return (e.employment_type || 'staff') === 'staff'; }); }
function hLes(e) { return [e.legal_entity_id].concat(e.extra_le_ids || []).filter(Boolean).map(Number).filter(function(x, i, a) { return a.indexOf(x) === i; }); }
function hInLe(e, leId) { return hLes(e).indexOf(Number(leId)) !== -1; }
function hMonthName(ym) { return ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4); }
function hPrevMonth() { const d = new Date(); d.setDate(0); return hIso(d).slice(0, 7); }
function hLe(id) { return hr.d.les.find(function(x) { return x.id === Number(id); }) || null; }
function hPriv(empId) { return (hr.d.priv || []).find(function(p) { return Number(p.employee_id) === Number(empId); }) || null; }
function hSout(id) { return hr.d.sout.find(function(x) { return x.id === Number(id); }) || null; }
function hDeptNames() {
  const names = hr.d.depts.map(function(d) { return d.name; });
  hr.d.emps.forEach(function(e) { if (e.department && names.indexOf(e.department) === -1) names.push(e.department); });
  return names;
}
function hVacNow(e) {
  const t = hToday();
  return hr.d.vacs.find(function(v) { return Number(v.employee_id) === e.id && hD(v.start_date) <= t && hD(v.end_date) >= t; }) || null;
}
function hVacUsed(e, year) {
  return hr.d.vacs.filter(function(v) { return Number(v.employee_id) === e.id && v.kind === HR_VAC_KINDS[0] && hD(v.start_date).slice(0, 4) === String(year); })
    .reduce(function(a, v) { return a + (Number(v.days) || 0); }, 0);
}
// ponytail: остаток = норма за год − запланированное в этом году; перенос с прошлых лет и начисление пропорционально стажу не считаются
function hVacLeft(e, year) { return (Number(e.vacation_days) || 28) - hVacUsed(e, year); }
// последняя запись по каждой компании (обучение ответственного идёт отдельно по юрлицу; компания — начало поля «Документ»)
function hSafetyRecs(empId, kind) {
  const by = {};
  hr.d.safety.forEach(function(s) {
    if (Number(s.employee_id || 0) !== Number(empId || 0) || s.kind !== kind) return;
    const c = String(s.doc || '').split(' · ')[0];
    if (!by[c] || hD(s.done_on) >= hD(by[c].done_on)) by[c] = s;
  });
  return Object.keys(by).map(function(c) { return by[c]; });
}
// для статуса — самая срочная из них
function hSafetyLast(empId, kind) {
  return hSafetyRecs(empId, kind).sort(function(a, b) { return String(a.next_on || '9').localeCompare(String(b.next_on || '9')) || hD(b.done_on).localeCompare(hD(a.done_on)); })[0] || null;
}
// состояние записи: none | ok | soon (≤30 дней) | late
function hDue(next) {
  if (!next) return 'ok';
  const n = hDays(hToday(), next);
  return n < 0 ? 'late' : n <= 30 ? 'soon' : 'ok';
}
function hLnaFor(l) { return hStaff().filter(function(e) { return !l.legal_entity_id || hInLe(e, l.legal_entity_id); }); }
function hLnaMissing(l) { const a = l.acks || {}; return l.need_ack ? hLnaFor(l).filter(function(e) { return !a[e.id]; }) : []; }
function hSeniority(e) {
  if (!e.hired_on) return '';
  const to = e.status === 'fired' && e.fired_on ? hD(e.fired_on) : hToday();
  const a = hD(e.hired_on).split('-').map(Number), b = to.split('-').map(Number);
  let m = (b[0] - a[0]) * 12 + (b[1] - a[1]) - (b[2] < a[2] ? 1 : 0);
  if (m < 0) return '';
  const y = Math.floor(m / 12); m %= 12;
  return (y ? y + ' ' + hNoun(y, 'год', 'года', 'лет') + ' ' : '') + (m || !y ? m + ' мес.' : '');
}

async function hMe() {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + hToken() } });
  return ((await res.json()) || {}).data || null;
}
async function hLoad() {
  const L = function(c, p) { return ctx.api.resource(c).list(Object.assign({ paginate: false }, p || {})).then(hRows); };
  const r = await Promise.all([
    L('crm_employees', { sort: ['last_name', 'first_name'] }), L('crm_departments', { sort: ['sort', 'name'] }), L('crm_legal_entities', { sort: ['sort', 'name'] }),
    // охрана труда, ЛНА, программы и мероприятия сервер отдаёт только HR и администратору — остальным пусто
    L('crm_vacations', { sort: ['start_date'] }), L('crm_safety', { sort: ['done_on'] }).catch(function() { return []; }), L('crm_sout', { sort: ['workplace'] }).catch(function() { return []; }),
    L('crm_lna', { sort: ['title'], appends: ['file'] }).catch(function() { return []; }), L('crm_hr_programs', { sort: ['title'] }).catch(function() { return []; }), L('crm_hr_events', { sort: ['-event_date'] }).catch(function() { return []; }),
    L('crm_hr_private').catch(function() { return null; }),
    L('crm_hr_files', { appends: ['file'], sort: ['-id'] }).catch(function() { return []; }),
    L('contract_objects', { sort: ['name'], fields: ['id', 'name'] }).catch(function() { return []; }),
    L('crm_tasks', { filter: { status: { $in: ['new', 'in_work', 'waiting', 'done'] } }, fields: ['id', 'title', 'status', 'due_date', 'executor_id', 'executor_name', 'employee_id', 'kind'] }).catch(function() { return []; }),
    L('crm_staff_positions', { sort: ['department', 'position'] }).catch(function() { return []; }),   // подбор и штат — только admin и hr
    L('crm_vacancies', { sort: ['-opened_on'] }).catch(function() { return []; }),
    L('crm_candidates', { sort: ['interview_on', 'interview_time'] }).catch(function() { return []; }),
    L('users', { fields: ['id', 'username'] }).catch(function() { return []; })
  ]);
  hr.d = { emps: r[0], depts: r[1], les: r[2], vacs: r[3], safety: r[4], sout: r[5], lna: r[6], progs: r[7], events: r[8], priv: r[9], files: r[10], objects: r[11], tasks: r[12], pos: r[13], vacancies: r[14], cands: r[15], users: r[16] };
  hr.myEmp = hr.d.emps.find(function(e) { return hr.me && Number(e.user_id) === Number(hr.me.id); }) || null;
}

// ---------- формы по описанию полей: [ключ, подпись, тип, варианты, обязательное] ----------
// типы: text | num | date | textarea | select (варианты: объект, массив или функция) | list (свободный ввод с подсказками)
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
  else if (t === 'multi') { const cur = (Array.isArray(v) ? v : []).map(String); inp = '<div class="hr-pick" data-v="' + k + '" data-multi style="max-height:150px;">' + hOpts(f[3]).map(function(p) { return '<label><input type="checkbox" value="' + hEsc(p[0]) + '"' + (cur.indexOf(String(p[0])) !== -1 ? ' checked' : '') + '> ' + hEsc(p[1]) + '</label>'; }).join('') + '</div>'; }
  else if (t === 'list') inp = '<input type="text" list="hr-dl-' + k + '" data-v="' + k + '" value="' + hEsc(v) + '"><datalist id="hr-dl-' + k + '">' + hOpts(f[3]).map(function(p) { return '<option value="' + hEsc(p[1]) + '">'; }).join('') + '</datalist>';
  else inp = '<input type="' + (t === 'num' ? 'number' : 'text') + '" data-v="' + k + '" value="' + hEsc(v) + '">';
  return '<div class="hr-f' + (t === 'textarea' || t === 'multi' ? ' full' : '') + '" data-fk="' + k + '"><label>' + hEsc(f[1]) + (f[4] ? ' <i>*</i>' : '') + '</label>' + inp + '</div>';
}
function hForm(spec, rec) { return '<div class="hr-form">' + spec.map(function(f) { return hField(f, rec ? rec[f[0]] : null); }).join('') + '</div>'; }
// значения формы; ошибка — строкой
function hRead(box, spec) {
  const v = {};
  for (const f of spec) {
    const x = box.querySelector('[data-v="' + f[0] + '"]');
    if (!x) continue;
    if (f[2] === 'multi') { v[f[0]] = Array.prototype.map.call(x.querySelectorAll('input:checked'), function(c) { return isNaN(Number(c.value)) ? c.value : Number(c.value); }); continue; }
    let s = x.value.trim();
    if (s === '') { if (f[4]) return 'Заполните «' + f[1] + '»'; v[f[0]] = null; continue; }
    if (f[2] === 'date' && !/^(19|20)\d{2}-\d{2}-\d{2}$/.test(s)) return 'Проверьте дату «' + f[1] + '»';
    if (f[2] === 'num' || /_id$/.test(f[0])) { if (isNaN(Number(s))) return 'В «' + f[1] + '» нужно число'; s = Number(s); }
    v[f[0]] = s;
  }
  return v;
}
function hShow(f, v) {
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '<span class="hr-none">—</span>';
  if (f[2] === 'multi') return hEsc(v.map(function(x) { const p = hOpts(f[3]).find(function(o) { return String(o[0]) === String(x); }); return p ? p[1] : x; }).join(', '));
  if (f[2] === 'date') return hEsc(hDate(v));
  if (f[2] === 'select') { const p = hOpts(f[3]).find(function(x) { return String(x[0]) === String(v); }); return hEsc(p ? p[1] : v); }
  return hEsc(v);
}
function hKv(spec, rec) { return '<div class="hr-kv">' + spec.map(function(f) { return '<div class="k">' + hEsc(f[1]) + '</div><div class="v">' + hShow(f, rec && rec[f[0]]) + '</div>'; }).join('') + '</div>'; }

// ---------- документы к записям (crm_hr_files → attachments; сервер отдаёт их только admin и hr) ----------
const HR_DOC_KINDS = {
  vac: cfg('hr.docKinds.vac'),
  safety: cfg('hr.docKinds.safety'),
  sout: cfg('hr.docKinds.sout'),
  le: cfg('hr.docKinds.le'),
  event: cfg('hr.docKinds.event'),
  prog: cfg('hr.docKinds.prog'),
  lna: cfg('hr.docKinds.lna'),
  cand: cfg('hr.docKinds.cand'),
  vacancy: cfg('hr.docKinds.vacancy'),
  emp: cfg('hr.docKinds.emp')
};
function hFilesOf(entity, id, doc) {
  return (hr.d.files || []).filter(function(f) { return f.entity === entity && Number(f.record_id) === Number(id) && (doc === undefined || f.doc === doc); });
}
// файлы отдаются только с токеном — открываем через fetch (как в задачах), обработчик на document: окна живут вне блока
function hFileA(a, label, title) { return '<a class="hr-flink" data-hrfile="' + hEsc(a.url || '') + '" data-hrname="' + hEsc((a.title || 'файл') + (a.extname || '')) + '"' + (title ? ' title="' + hEsc(title) + '"' : '') + '>' + label + '</a>'; }
function hFileLink(f) { const a = f.file || {}; return hFileA(a, '📄 ' + hEsc(a.title || a.filename || 'файл')); }
if (!window.__hrFileOpen) {
  window.__hrFileOpen = true;
  document.addEventListener('click', async function(e) {
    const a = e.target.closest && e.target.closest('a[data-hrfile]'); if (!a) return;
    e.preventDefault();
    try {
      const res = await fetch(a.getAttribute('data-hrfile'), { headers: { Authorization: 'Bearer ' + hToken() } });
      if (!res.ok) throw new Error(res.status);
      const blob = await res.blob(), url = URL.createObjectURL(blob), l = document.createElement('a');
      l.href = url; l.target = '_blank';
      if (!/^(application\/pdf|image\/)/.test(blob.type)) l.download = a.getAttribute('data-hrname');   // docx/xlsx — скачать с именем
      document.body.appendChild(l); l.click(); l.remove();
      setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
    } catch (err) { hToast('Не удалось открыть файл'); }
  });
}
function hFileRow(f) {
  return '<div><span>' + hFileLink(f) + '</span><span class="hr-hint" style="margin:0;">' + hEsc(f.doc || '') + (f.createdAt ? ' · ' + hDate(f.createdAt) : '') + '</span>'
    + (f.id ? '<button type="button" class="hr-fdel" data-fdel="' + f.id + '" title="Открепить">✕</button>' : '') + '</div>';
}
async function hLoadFiles() { try { hr.d.files = hRows(await ctx.api.resource('crm_hr_files').list({ paginate: false, appends: ['file'], sort: ['-id'] })); } catch (e) { /* нет доступа */ } }
// skip — виды документов, которые показываются отдельно (пункты личного дела)
function hFilesBox(entity, id, skip) {
  const list = id ? hFilesOf(entity, id).filter(function(f) { return !skip || skip.indexOf(f.doc) === -1; }) : [];
  return '<div class="hr-files" data-files="' + entity + '"><div class="hr-files-h"><b>' + (skip ? 'Другие документы' : 'Документы') + '</b>'
    + '<select data-fkind>' + HR_DOC_KINDS[entity].map(function(k) { return '<option>' + hEsc(k) + '</option>'; }).join('') + '</select>'
    + '<label class="hr-btn sm" style="cursor:pointer;">📎 Прикрепить<input type="file" multiple data-fup style="display:none;"></label></div>'
    + '<div class="hr-lines" data-flist>' + (list.length ? list.map(hFileRow).join('') : '<div class="hr-hint" style="margin:0;">Файлов нет' + (id ? '' : ' — прикреплённые сейчас сохранятся вместе с записью') + '</div>') + '</div></div>';
}
// загрузить файлы и привязать к записи; у новой записи — отложить до сохранения (m.__pending)
async function hAttach(files, entity, id, doc, m) {
  let n = 0;
  for (const f of files) {
    try {
      const a = await hUpload(f);
      if (id) await ctx.api.resource('crm_hr_files').create({ values: { entity: entity, record_id: id, doc: doc, file_id: a.id } });
      else { m.__pending = m.__pending || []; m.__pending.push({ entity: entity, doc: doc, file_id: a.id, file: a }); }
      n++;
    } catch (e) { hToast('Не удалось загрузить: ' + f.name); }
  }
  if (id) await hLoadFiles();
  return n;
}
function hWireFiles(m, entity, getId, onChange) {
  const box = m.querySelector('[data-files="' + entity + '"]'); if (!box) return;
  const redraw = function() {
    const id = getId(), list = box.querySelector('[data-flist]');
    const rows = (id ? hFilesOf(entity, id) : []).concat((m.__pending || []).filter(function(x) { return x.entity === entity; }));
    list.innerHTML = rows.length ? rows.map(hFileRow).join('') : '<div class="hr-hint" style="margin:0;">Файлов нет</div>';
  };
  box.querySelector('[data-fup]').addEventListener('change', async function(ev) {
    const files = Array.prototype.slice.call(ev.target.files || []); ev.target.value = '';
    if (!files.length) return;
    const n = await hAttach(files, entity, getId(), box.querySelector('[data-fkind]').value, m);
    redraw(); if (n) hToast('Прикреплено: ' + n); if (onChange) onChange();
  });
  box.addEventListener('click', async function(ev) {
    const b = ev.target.closest && ev.target.closest('[data-fdel]'); if (!b) return;
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Открепить?'; return; }
    try { await ctx.api.resource('crm_hr_files').destroy({ filterByTk: Number(b.getAttribute('data-fdel')) }); await hLoadFiles(); redraw(); if (onChange) onChange(); } catch (e) { hToast('Не удалось открепить'); }
  });
}

// окно создания/правки записи. o: { coll, rec, spec, title, extra(rec) → html, wire(m, rec), prepare(vals, m, rec) → vals | 'ошибка', after(saved) }
function hEdit(o) {
  const rec = o.rec || null;
  const m = hModal('<div class="hr-box-h"><div class="hr-box-t">' + hEsc(o.title) + '</div><button class="hr-x">✕</button></div><div class="hr-box-b">'
    + hForm(o.spec, rec || o.preset) + (o.extra ? o.extra(rec) : '') + (o.files && hCan() ? hFilesBox(o.files, rec && rec.id) : '')
    + '<div class="hr-actions"><button class="hr-btn pri" data-save>Сохранить</button><button class="hr-btn hr-x">Отмена</button>'
    + (rec && rec.id ? '<button class="hr-btn warn" data-del>Удалить</button>' : '') + '</div></div>', o.wide);
  if (o.wire) o.wire(m, rec);
  if (o.files && hCan()) hWireFiles(m, o.files, function() { return rec && rec.id; });
  const sv = m.querySelector('[data-save]');
  sv.addEventListener('click', async function() {
    let vals = hRead(m, o.spec);
    if (typeof vals === 'string') { hToast(vals); return; }
    if (o.prepare) { vals = await o.prepare(vals, m, rec); if (typeof vals === 'string') { hToast(vals); return; } }
    sv.disabled = true;
    try {
      const res = rec && rec.id ? await ctx.api.resource(o.coll).update({ filterByTk: rec.id, values: vals }) : await ctx.api.resource(o.coll).create({ values: vals });
      const saved = hRows(res)[0] || rec;
      for (const pf of (m.__pending || [])) {   // файлы, прикреплённые до первого сохранения
        await ctx.api.resource('crm_hr_files').create({ values: { entity: pf.entity, record_id: saved.id, doc: pf.doc, file_id: pf.file_id } }).catch(function() { hToast('Файл не привязался'); });
      }
      m.remove();
      await hReload();
      hToast('Сохранено');
      if (o.after) o.after(hRows(res)[0] || rec);
    } catch (e) { hToast('Не удалось сохранить'); sv.disabled = false; }
  });
  const del = m.querySelector('[data-del]');
  if (del) del.addEventListener('click', async function() {
    if (!del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Точно удалить?'; return; }
    try { await ctx.api.resource(o.coll).destroy({ filterByTk: rec.id }); m.remove(); await hReload(); hToast('Удалено'); if (o.after) o.after(null); }
    catch (e) { hToast('Не удалось удалить'); }
  });
  return m;
}
// выбор сотрудников галочками (участники мероприятия, ознакомление с ЛНА)
function hPicker(list, checked, dates) {
  return '<div class="hr-actions" style="margin:14px 0 6px;"><b style="font-size:13.5px;">' + hEsc(dates ? 'Ознакомлены' : 'Участники') + '</b><button type="button" class="hr-btn sm" data-all>Отметить всех</button><button type="button" class="hr-btn sm" data-none>Снять всех</button></div>'
    + (list.length ? '<div class="hr-pick">' + list.map(function(e) {
      const on = checked(e);
      return '<label><input type="checkbox" data-pick="' + e.id + '"' + (on ? ' checked' : '') + '> ' + hEsc(e.full_name) + (dates && on && on !== true ? ' <span class="hr-hint">' + hEsc(hDate(on)) + '</span>' : '') + '</label>';
    }).join('') + '</div>' : '<div class="hr-hint">Нет подходящих сотрудников</div>');
}
function hWirePicker(m) {
  const all = function(v) { m.querySelectorAll('[data-pick]').forEach(function(x) { x.checked = v; }); };
  const a = m.querySelector('[data-all]'), n = m.querySelector('[data-none]');
  if (a) a.addEventListener('click', function() { all(true); });
  if (n) n.addEventListener('click', function() { all(false); });
}
function hPicked(m) { return Array.prototype.map.call(m.querySelectorAll('[data-pick]:checked'), function(x) { return Number(x.getAttribute('data-pick')); }); }

// ---------- описания полей ----------
const hLeOpts = function() { return hr.d.les.map(function(x) { return [x.id, x.name]; }); };
const hEmpOpts = function() { return hActive().map(function(e) { return [e.id, e.full_name]; }); };
const H_MAIN = [
  ['last_name', 'Фамилия', 'text', null, 1], ['first_name', 'Имя', 'text'], ['middle_name', 'Отчество', 'text'], ['position', 'Должность', 'text'],
  ['department', 'Отдел', 'select', function() { return hDeptNames(); }], ['legal_entity_id', 'Основное юрлицо', 'select', hLeOpts],
  ['employment_type', 'Тип занятости', 'select', HR_EMP_TYPE], ['rate', 'Ставка', 'select', ['1', '0.75', '0.5', '0.25']],
  ['object_name', 'Объект', 'list', function() { return (hr.d.objects || []).map(function(o) { return o.name; }); }], ['contract_until', 'Договор ГПХ / с самозанятым до', 'date'],
  ['hired_on', 'Принят', 'date'], ['fired_on', 'Уволен', 'date'], ['status', 'Статус', 'select', HR_EMP_ST],
  ['vacation_days', 'Дней отпуска в год', 'num'], ['sout_id', 'Рабочее место (СОУТ)', 'select', function() { return hr.d.sout.map(function(s) { return [s.id, s.workplace + (s.work_class ? ' — класс ' + s.work_class : '')]; }); }],
  ['phone', 'Телефон', 'text'], ['email', 'Почта', 'text'], ['work_schedule', 'График работы', 'text'], ['birthday', 'День рождения', 'date'],
  ['extra_le_ids', 'Также оформлен в юрлицах (совместительство, директор)', 'multi', hLeOpts], ['note', 'Заметки', 'textarea']
];
const H_PERSONAL = [['passport', 'Паспорт (серия, номер, кем и когда выдан)', 'text'], ['snils', 'СНИЛС', 'text'], ['inn', 'ИНН', 'text'],
  ['emergency', 'Экстренный контакт (кто, телефон)', 'text'], ['reg_address', 'Адрес регистрации', 'textarea']];
const H_MIL = [['mil_status', 'Воинский учёт', 'select', { liable: 'Военнообязанный, состоит на учёте', not: 'Не военнообязанный' }],
  ['mil_special', 'Учёт', 'select', ['общий', 'специальный (бронирование)']], ['mil_category', 'Категория запаса', 'select', ['1', '2']],
  ['mil_composition', 'Состав', 'select', ['солдаты, матросы, сержанты, старшины', 'прапорщики и мичманы', 'офицеры']],
  ['mil_rank', 'Воинское звание', 'list', HR_RANKS], ['mil_vus', 'ВУС (полное кодовое обозначение)', 'text'],
  ['mil_fitness', 'Категория годности', 'select', { 'А': 'А — годен', 'Б': 'Б — годен с незначительными ограничениями', 'В': 'В — ограниченно годен', 'Г': 'Г — временно не годен', 'Д': 'Д — не годен' }],
  ['mil_office', 'Военкомат', 'text'], ['mil_ticket', 'Военный билет (серия, номер)', 'text'],
  ['mil_sent_on', 'Сведения о приёме / увольнении отправлены в военкомат', 'date'], ['mil_note', 'Заметки', 'textarea']];
const H_MOT = [['program_id', 'Мотивационная программа', 'select', function() { return hr.d.progs.map(function(p) { return [p.id, p.title]; }); }],
  ['motivation', 'Мотивация: что важно сотруднику, чем мотивирован', 'textarea']];
// рабочий профиль: только то, что помогает работать с человеком; без здоровья, личной жизни и оценок личности — сотрудник вправе увидеть запись (ст. 89 ТК)
const H_WP = [['wp_strengths', 'Сильные стороны в работе', 'textarea'], ['wp_growth', 'Зоны развития', 'textarea'], ['wp_tasks', 'Как лучше ставить задачи и давать обратную связь', 'textarea'],
  ['wp_comm', 'Удобный канал связи', 'select', ['Лично', 'Мессенджер', 'Почта', 'Звонок']],
  ['wp_assessment', 'Формальная оценка: методика (если проводилась)', 'list', ['DISC', 'Оценка 360°', 'Тест профессиональных знаний', 'Ассессмент-центр']], ['wp_assessed_on', 'Дата оценки', 'date'],
  ['wp_consent_on', 'Письменное согласие на оценку получено', 'date'], ['wp_assessment_result', 'Результат оценки (кратко)', 'textarea']];
const H_LE_MIL = [['mil_office', 'Военкомат организации', 'text'], ['mil_check_on', 'Последняя ежегодная сверка', 'date'], ['mil_plan_year', 'План воинского учёта получен на год', 'num']];
const H_LE = [['name', 'Название', 'text', null, 1], ['inn', 'ИНН', 'text'], ['kpp', 'КПП', 'text'], ['ogrn', 'ОГРН', 'text'], ['director', 'Руководитель', 'text']].concat(H_LE_MIL, [['address', 'Адрес', 'textarea'], ['note', 'Заметки', 'textarea']]);
const H_VAC = [['employee_id', 'Сотрудник', 'select', hEmpOpts, 1], ['kind', 'Вид отпуска', 'select', HR_VAC_KINDS, 1], ['start_date', 'С', 'date', null, 1], ['end_date', 'По (включительно)', 'date', null, 1],
  ['in_schedule', 'По графику? (для ежегодного; пусто — определится по дате)', 'select', HR_VAC_SCHED], ['status', 'Оформление', 'select', HR_VAC_ST, 1], ['note', 'Заметки', 'textarea']];
const H_SAFETY = [['employee_id', 'Сотрудник (пусто — общее мероприятие)', 'select', hEmpOpts], ['kind', 'Что', 'list', HR_SAFETY.map(function(x) { return x[0]; }).concat(HR_PB_COMMON.map(function(x) { return x[0]; })), 1],
  ['done_on', 'Проведено', 'date', null, 1], ['next_on', 'Следующее (пусто — посчитается само)', 'date'], ['doc', 'Документ / протокол / журнал', 'text'], ['note', 'Заметки', 'textarea']];
const H_SOUT = [['workplace', 'Рабочее место (должность)', 'text', null, 1], ['legal_entity_id', 'Юрлицо', 'select', hLeOpts], ['work_class', 'Класс условий труда', 'select', Object.keys(HR_SOUT_CLS)],
  ['card_no', 'Номер карты СОУТ', 'text'], ['assessed_on', 'Дата оценки', 'date'], ['next_on', 'Следующая оценка (пусто — через 5 лет)', 'date'], ['guarantees', 'Гарантии и компенсации', 'textarea'], ['note', 'Заметки', 'textarea']];
const H_LNA = [['title', 'Название', 'text', null, 1], ['kind', 'Вид', 'select', HR_LNA_KINDS], ['legal_entity_id', 'Юрлицо (пусто — все)', 'select', hLeOpts], ['number', 'Номер приказа', 'text'],
  ['approved_on', 'Утверждён', 'date'], ['review_on', 'Пересмотреть до', 'date'], ['need_ack', 'Ознакомление под подпись', 'select', [['1', 'нужно'], ['0', 'не нужно']]], ['note', 'Заметки', 'textarea']];
const H_PROG = [['title', 'Название', 'text', null, 1], ['kind', 'Вид', 'select', HR_PROG_KINDS], ['start_on', 'С', 'date'], ['end_on', 'По', 'date'], ['description', 'Условия: за что, сколько, как считается', 'textarea'], ['note', 'Заметки', 'textarea']];
const H_EVENT = [['title', 'Название', 'text', null, 1], ['kind', 'Вид', 'select', HR_EVENT_KINDS], ['event_date', 'Дата', 'date', null, 1], ['place', 'Место', 'text'], ['budget', 'Бюджет, ₽', 'num'], ['note', 'Заметки', 'textarea']];
const hVacancyOpts = function() { return hr.d.vacancies.map(function(v) { return [v.id, v.title + (hLe(v.legal_entity_id) ? ' — ' + hLe(v.legal_entity_id).name : '') + (v.status === 'open' ? '' : ' (' + (HR_VACANCY_ST[v.status] || '').toLowerCase() + ')')]; }); };
const H_POS = [['legal_entity_id', 'Юрлицо', 'select', hLeOpts, 1], ['department', 'Подразделение', 'list', function() { return hDeptNames(); }], ['position', 'Должность', 'text', null, 1],
  ['units', 'Ставок', 'num', null, 1], ['salary', 'Оклад, ₽', 'num'], ['note', 'Заметки', 'textarea']];
const H_VACANCY = [['title', 'Должность', 'text', null, 1], ['status', 'Статус', 'select', HR_VACANCY_ST, 1], ['legal_entity_id', 'Юрлицо', 'select', hLeOpts], ['department', 'Подразделение', 'list', function() { return hDeptNames(); }],
  ['object_name', 'Объект', 'list', function() { return (hr.d.objects || []).map(function(o) { return o.name; }); }], ['manager', 'Непосредственный руководитель', 'text'],
  ['opened_on', 'Открыта', 'date'], ['due_on', 'Закрыть до', 'date'], ['salary', 'Зарплата (вилка)', 'text'], ['schedule', 'График', 'text'],
  ['place', 'Место работы (адрес)', 'text'], ['sources', 'Где размещена', 'text'], ['duties', 'Обязанности (пойдут в оффер)', 'textarea'], ['requirements', 'Требования', 'textarea'], ['note', 'Заметки', 'textarea']];
const H_CAND = [['full_name', 'ФИО', 'text', null, 1], ['vacancy_id', 'Вакансия', 'select', hVacancyOpts, 1], ['stage', 'Этап', 'select', HR_STAGES, 1], ['source', 'Откуда', 'list', HR_SOURCES],
  ['phone', 'Телефон', 'text'], ['email', 'Почта', 'text'], ['interview_on', 'Собеседование', 'date'], ['interview_time', 'Время собеседования', 'text'],
  ['rating', 'Общее впечатление (1–5)', 'select', ['1', '2', '3', '4', '5']], ['offer_on', 'Оффер отправлен', 'date'],
  ['offer_salary', 'Оклад на испытательный срок, ₽ на руки', 'text'], ['offer_salary_after', 'Оклад после испытательного срока', 'text'],
  ['probation', 'Испытательный срок, мес.', 'num'], ['start_on', 'Выход на работу', 'date'], ['reject_reason', 'Причина отказа', 'text'], ['note', 'Заметки', 'textarea']];

// ---------- «требует внимания»: единая лента для дашборда ----------
// lvl: 0 — просрочено/срочно, 1 — скоро, 2 — к сведению. go: { emp } | { tab, ... } | { ids, title } (список сотрудников)
function hAlerts() {
  const d = hr.d, t = hToday(), out = [], staff = hStaff();
  let sec = 'safety';   // раздел дашборда, к которому относится пункт (счётчик на плитке)
  const add = function(lvl, text, sub, go, date) { out.push({ lvl: lvl, text: text, sub: sub || '', go: go, date: date || '', sec: sec }); };
  // охрана труда: последние записи с датой следующего
  staff.forEach(function(e) {
    HR_SAFETY.forEach(function(k) {
      hSafetyRecs(e.id, k[0]).forEach(function(r) {
        if (!r.next_on) return;
        const s = hDue(r.next_on), comp = String(r.doc || '').split(' · ')[0];
        if (s === 'late') add(0, k[3] + ': просрочено — ' + e.full_name + (comp ? ' (' + comp + ')' : ''), 'нужно было до ' + hDate(r.next_on), { emp: e.id }, r.next_on);
        else if (s === 'soon') add(1, k[3] + ': ' + e.full_name + (comp ? ' (' + comp + ')' : '') + ' до ' + hDate(r.next_on), '', { emp: e.id }, r.next_on);
      });
    });
  });
  HR_SAFETY.slice(0, 2).forEach(function(k) {
    const miss = staff.filter(function(e) { return !hSafetyLast(e.id, k[0]); });
    if (miss.length) add(2, k[0] + ': нет записи у ' + hPeople(miss.length), 'отметьте в «Охране труда»', { ids: miss.map(function(e) { return e.id; }), title: k[0] + ' — нет записи' });
  });
  const common = {};
  d.safety.filter(function(s) { return !s.employee_id && s.next_on; }).forEach(function(s) { if (!common[s.kind] || hD(s.done_on) >= hD(common[s.kind].done_on)) common[s.kind] = s; });
  Object.keys(common).forEach(function(k) {
    const s = hDue(common[k].next_on);
    if (s !== 'ok') add(s === 'late' ? 0 : 1, 'Пожарная безопасность: ' + k, (s === 'late' ? 'просрочено, ' : '') + 'до ' + hDate(common[k].next_on), { tab: 'safety' }, common[k].next_on);
  });
  sec = 'vac';
  // отпуска: уведомить сотрудника не позднее чем за 2 недели (ст. 123 ТК РФ) → напоминаем за 3 недели
  d.vacs.forEach(function(v) {
    const e = hEmp(v.employee_id); if (!e || e.status === 'fired') return;
    const n = hDays(t, v.start_date);
    if (v.status === 'plan' && hVacCls(v) !== 'sched' && n >= -3 && n <= 3) { add(0, 'Отпуск ' + e.full_name + ' (' + HR_VAC_CLS[hVacCls(v)] + ') с ' + hDate(v.start_date) + ' — оформить приказ', '', { vac: v.id }, v.start_date); return; }
    if (v.status === 'plan' && hVacCls(v) === 'sched' && n >= 0 && n <= 21) add(n <= 14 ? 0 : 1, 'Отпуск ' + e.full_name + ' с ' + hDate(v.start_date) + ' — уведомить и оформить приказ', 'уведомление — не позднее чем за 2 недели до начала', { vac: v.id }, v.start_date);
  });
  const y = new Date().getFullYear(), md = t.slice(5);
  if (md >= '11-01') {
    const noPlan = staff.filter(function(e) { return !d.vacs.some(function(v) { return Number(v.employee_id) === e.id && hD(v.start_date).slice(0, 4) === String(y + 1); }); });
    if (noPlan.length) add(md >= '12-10' ? 0 : 1, 'График отпусков на ' + (y + 1) + ': не запланировано у ' + hPeople(noPlan.length), 'график утверждается не позднее 17 декабря', { tab: 'vac', year: y + 1 });
  }
  sec = 'staff';
  // договоры ГПХ и самозанятых
  hActive().forEach(function(e) {
    if (!e.contract_until || (e.employment_type || 'staff') === 'staff') return;
    const n = hDays(t, e.contract_until);
    if (n <= 30) add(n < 0 ? 0 : 1, 'Договор ' + (HR_EMP_TYPE[e.employment_type] || '').toLowerCase() + ': ' + e.full_name, (n < 0 ? 'закончился ' : 'заканчивается ') + hDate(e.contract_until), { emp: e.id }, e.contract_until);
  });
  sec = 'safety';
  // СОУТ
  d.sout.forEach(function(s) {
    if (!s.next_on) return;
    const n = hDays(t, s.next_on);
    if (n <= 180) add(n < 0 ? 0 : 1, 'СОУТ: ' + s.workplace, (n < 0 ? 'срок оценки прошёл ' : 'повторная оценка до ') + hDate(s.next_on), { tab: 'safety' }, s.next_on);
  });
  if (!d.sout.length) add(2, 'СОУТ: рабочие места не заведены', 'добавьте в «Охране труда» → СОУТ', { tab: 'safety' });
  else { const ns = staff.filter(function(e) { return !e.sout_id; }); if (ns.length) add(2, 'СОУТ: рабочее место не указано у ' + hPeople(ns.length), '', { ids: ns.map(function(e) { return e.id; }), title: 'Не указано рабочее место СОУТ' }); }
  sec = 'docs';
  // ЛНА
  const lnaMiss = d.lna.filter(function(l) { return hLnaMissing(l).length; });
  if (lnaMiss.length) add(2, 'ЛНА: нет отметок об ознакомлении — ' + lnaMiss.length + ' ' + hNoun(lnaMiss.length, 'документ', 'документа', 'документов'),
    'отметьте, кто подписал лист ознакомления («Документы и мероприятия»)', { tab: 'docs' });
  d.lna.forEach(function(l) {
    if (l.review_on && hDays(t, l.review_on) <= 30) add(hDays(t, l.review_on) < 0 ? 0 : 1, '«' + l.title + '»: пересмотреть', 'до ' + hDate(l.review_on), { lna: l.id }, l.review_on);
  });
  sec = 'mil';
  // воинский учёт (только те, кому сервер отдал закрытые данные)
  if (d.priv) {
    const unknown = staff.filter(function(e) { const p = hPriv(e.id); return !p || !p.mil_status; });
    if (unknown.length) add(2, 'Воинский учёт: не указано, военнообязан ли, у ' + hPeople(unknown.length), '', { ids: unknown.map(function(e) { return e.id; }), title: 'Воинский учёт не заполнен' });
    const partial = staff.filter(function(e) { const p = hPriv(e.id); return p && p.mil_status === 'liable' && !(p.mil_office && p.mil_vus && p.mil_category && p.mil_fitness); });
    if (partial.length) add(1, 'Воинский учёт: неполные данные у ' + hPeople(partial.length), 'нужны военкомат, ВУС, категория запаса и годности', { ids: partial.map(function(e) { return e.id; }), title: 'Неполные данные воинского учёта' });
  }
  // воинский учёт организаций: ежегодная сверка, план на следующий год (забирают в военкомате)
  const noCheck = [];
  d.les.forEach(function(l) {
    const hasLiable = hActive().some(function(e) { const p = hPriv(e.id); return hInLe(e, l.id) && p && p.mil_status === 'liable'; });
    if (!hasLiable) return;   // сверка и план нужны, только если в организации есть военнообязанные
    if (!l.mil_check_on) noCheck.push(l.name);
    else if (hDays(l.mil_check_on, t) > 365) add(0, 'Воинский учёт «' + l.name + '»: ежегодная сверка просрочена', 'последняя ' + hDate(l.mil_check_on), { tab: 'mil' });
    if (md >= '10-01' && Number(l.mil_plan_year || 0) < y + 1) add(1, 'Воинский учёт «' + l.name + '»: план на ' + (y + 1) + ' год', 'подготовить приказ, план ВУ и карточку организации (форма 18)', { tab: 'mil' });
  });
  if (noCheck.length) add(2, 'Воинский учёт: не указана дата последней сверки у ' + noCheck.length + ' ' + hNoun(noCheck.length, 'организации', 'организаций', 'организаций'), noCheck.join(', '), { tab: 'mil' });
  if (d.priv) hr.d.emps.forEach(function(e) {   // приём и увольнение военнообязанного — сведения в военкомат в течение 2 недель
    const p = hPriv(e.id); if (!p || p.mil_status !== 'liable') return;
    const ev = e.status === 'fired' ? e.fired_on : e.hired_on; if (!ev) return;
    const n = hDays(ev, t);
    if (n >= 0 && n <= 60 && !(p.mil_sent_on && hD(p.mil_sent_on) >= hD(ev))) add(n > 10 ? 0 : 1, 'Военкомат: сообщить об ' + (e.status === 'fired' ? 'увольнении' : 'приёме') + ' — ' + e.full_name, 'в течение 2 недель с ' + hDate(ev), { emp: e.id }, ev);
  });
  sec = 'staff';
  // самозанятые: ежемесячные акты за прошлый месяц
  const pm = hPrevMonth(), noAct = hActive().filter(function(e) { return e.employment_type === 'self' && !(e.acts || {})[pm]; });
  if (noAct.length && t.slice(8) >= '03') add(t.slice(8) >= '10' ? 0 : 1, 'Акты самозанятых за ' + hMonthName(pm) + ': не подписано ' + noAct.length, 'отметьте на «Обзоре» → «Акты самозанятых»', { ids: noAct.map(function(e) { return e.id; }), title: 'Нет акта за ' + hMonthName(pm) });
  if (d.priv) {
    const inc = hStaff().filter(function(e) { const p = hPriv(e.id); return !p || (p.file_docs || []).length < HR_FILE_DOCS.length - 1; });
    if (inc.length) add(2, 'Личное дело не укомплектовано у ' + hPeople(inc.length), 'отметьте документы в карточке → «Личное дело»', { ids: inc.map(function(e) { return e.id; }), title: 'Личное дело не укомплектовано' });
  }
  const noLe = hActive().filter(function(e) { return !hLes(e).length; });
  if (noLe.length) add(2, 'Юрлицо не указано у ' + hPeople(noLe.length), d.les.length ? '' : 'сначала добавьте юрлица в «Сотрудники» → «Структура»', { ids: noLe.map(function(e) { return e.id; }), title: 'Без юрлица' });
  sec = 'hire';
  const vacName = function(c) { const v = hVacancy(c.vacancy_id); return v ? v.title : ''; };
  d.cands.forEach(function(c) {
    if (c.stage === 'interview' && c.interview_on) {
      const n = hDays(t, c.interview_on);
      if (n === 0 || n === 1) add(1, 'Собеседование ' + (n ? 'завтра' : 'сегодня') + (c.interview_time ? ' в ' + c.interview_time : '') + ' — ' + c.full_name, vacName(c), { cand: c.id }, c.interview_on);
    }
    if (c.stage === 'offer' && c.offer_on && hDays(c.offer_on, t) >= 3) add(1, 'Оффер без ответа ' + hDays(c.offer_on, t) + ' дн. — ' + c.full_name, vacName(c), { cand: c.id }, c.offer_on);
    if ((c.stage === 'offer' || c.stage === 'hired') && !c.employee_id && c.start_on && hDays(t, c.start_on) <= 7) add(hDays(t, c.start_on) <= 0 ? 0 : 1, 'Выход на работу ' + hDate(c.start_on) + ' — ' + c.full_name + ': оформить', vacName(c), { cand: c.id }, c.start_on);
  });
  const stale = d.cands.filter(function(c) { return c.stage === 'new' && c.createdAt && hDays(c.createdAt, t) > 3; });
  if (stale.length) add(1, 'Новые кандидаты без движения больше 3 дней: ' + stale.length, stale.map(function(c) { return c.full_name; }).join(', '), { tab: 'hire' });
  d.vacancies.forEach(function(v) { if (v.status === 'open' && v.due_on && hD(v.due_on) < t) add(0, 'Вакансия «' + v.title + '» не закрыта в срок', 'нужно было до ' + hDate(v.due_on), { vacancy: v.id }, v.due_on); });
  const free = d.pos.filter(function(p) { return hPosFree(p) > 0 && !d.vacancies.some(function(v) { return v.status === 'open' && Number(v.position_id) === p.id; }); });
  if (free.length) add(2, 'Свободные ставки без открытой вакансии: ' + free.length, free.map(function(p) { return p.position + (hLe(p.legal_entity_id) ? ' (' + hLe(p.legal_entity_id).name + ')' : ''); }).join(', '), { tab: 'hire', hire: 'pos' });
  sec = 'docs';
  // приятное: дни рождения и мероприятия
  hActive().forEach(function(e) {
    if (!e.birthday) return;
    let bd = y + hD(e.birthday).slice(4); if (bd < t) bd = (y + 1) + hD(e.birthday).slice(4);
    const n = hDays(t, bd);
    if (n <= 7) add(2, '🎂 ' + e.full_name + (n === 0 ? ' — сегодня день рождения' : ' — день рождения ' + hDate(bd).slice(0, 5)), '', { emp: e.id }, bd);
  });
  d.events.forEach(function(ev) { const n = hDays(t, ev.event_date); if (n >= 0 && n <= 14) add(2, '🎉 ' + ev.title + ' — ' + hDate(ev.event_date), ev.place || '', { ev: ev.id }, ev.event_date); });
  return out.sort(function(a, b) { return a.lvl - b.lvl || String(a.date || '9').localeCompare(String(b.date || '9')); });
}

// ---------- каркас ----------
ctx.render('<div id="crm-hr" class="hr"><div class="hr-empty">Загрузка…</div></div>');
function hRoot() { return (ctx.element && ctx.element.querySelector('#crm-hr')) || document.getElementById('crm-hr'); }
function hBody() { return hRoot().querySelector('[data-hr-body]'); }
async function hStart() {
  try {
    hr.me = await hMe();
    await hLoad();
    if (HR_MODE === 'hr' && !hHasHr()) { hRoot().innerHTML = '<div class="hr-empty"><b>Дашборд HR доступен HR-службе и администратору</b>Справочник сотрудников — в разделе «Сотрудники».</div>'; return; }
    hr.tab = HR_MODE === 'hr' ? 'home' : 'staff';
    if (HR_MODE === 'hr') hr.staffView = 'table';
    hRender();
    const sc = location.search.match(/[?&]sec=(\w+)/);
    if (sc && HR_MODE === 'hr' && HR_SECTIONS[sc[1]]) { hr.tab = sc[1]; hRender(); try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ } }
    const m = location.search.match(/[?&]open=emp:(\d+)/);
    if (m) {
      hOpenEmp(Number(m[1]));
      try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ }
    }
  } catch (e) {
    hRoot().innerHTML = '<div class="hr-empty" style="color:#cf1322;">Не удалось загрузить данные. Обновите страницу.</div>';
  }
}
async function hReload() { await hLoad(); hRender(); }
hRoot().addEventListener('click', hOnClick);
hRoot().addEventListener('change', hOnChange);
hRoot().addEventListener('input', function(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'q') { hr.q = e.target.value; hRenderStaffList(); }
  if (f === 'oq') { hr.orgQ = e.target.value; hRenderOrg(); }
});
hStart();

const HR_SECTIONS = { staff: 'Сотрудники', hire: 'Подбор и штат', vac: 'Отпуска', safety: 'Охрана труда и СОУТ', mil: 'Воинский учёт', docs: 'Документы и мероприятия' };
function hRender() {
  let head;
  if (HR_MODE === 'staff') {   // общий раздел: три вкладки
    const t = [['staff', 'Список', '<b>' + hActive().length + '</b>'], ['org', 'Структура', ''], ['vac', 'Отпуска', '']];
    head = '<div class="hr-head"><div class="hr-title">Сотрудники</div>' + crmSettingsGear('Компания') + '' + (hHasHr() ? '<a class="hr-btn" href="' + HR_DASH_PAGE + '" style="margin-left:auto;">Дашборд HR →</a>' : '') + '</div>'
      + '<div class="hr-tabs">' + t.map(function(x) { return '<button class="hr-tab' + (hr.tab === x[0] ? ' on' : '') + '" data-tab="' + x[0] + '">' + x[1] + x[2] + '</button>'; }).join('') + '</div>';
    hr.staffView = hr.tab === 'org' ? 'org' : 'list';
  } else {                     // дашборд HR: без вкладок, раздел открывается с главного экрана
    head = hr.tab === 'home'
      ? '<div class="hr-head"><div class="hr-title">Дашборд HR</div>' + crmSettingsGear('HR') + '<button class="hr-new" data-act="newemp"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Сотрудник</button></div>'
      : '<div class="hr-head"><button class="hr-btn" data-tab="home">← Дашборд HR</button><div class="hr-title">' + HR_SECTIONS[hr.tab] + '</div>'
        + (hr.tab === 'staff' ? '<button class="hr-new" data-act="newemp"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Сотрудник</button>' : '') + '</div>';
  }
  hRoot().innerHTML = head + '<div data-hr-body></div>';
  ({ home: hRenderHome, staff: hRenderStaff, org: hRenderStaff, vac: hRenderVac, safety: hRenderSafety, mil: hRenderMil, docs: hRenderDocs, hire: hRenderHire })[hr.tab]();
}
function hGo(go) {
  if (go.emp) return hOpenEmp(go.emp);
  if (go.vac) return hOpenVac(hr.d.vacs.find(function(v) { return v.id === go.vac; }));
  if (go.lna) return hOpenLna(hr.d.lna.find(function(l) { return l.id === go.lna; }));
  if (go.ev) return hOpenEvent(hr.d.events.find(function(x) { return x.id === go.ev; }));
  if (go.cand) return hOpenCand(hr.d.cands.find(function(x) { return x.id === go.cand; }));
  if (go.vacancy) return hOpenVacancy(hr.d.vacancies.find(function(x) { return x.id === go.vacancy; }));
  if (go.hire) hr.hireView = go.hire;
  if (go.ids) { hr.only = { ids: go.ids, title: go.title }; hr.staffView = 'table'; hr.tab = 'staff'; }
  else { hr.tab = go.tab; if (go.tab === 'staff') hr.staffView = 'table'; if (go.year) hr.year = go.year; if (go.le !== undefined) hr.le = go.le; if (go.type !== undefined) hr.type = go.type; }
  hRender();
}
function hOnChange(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'le' || f === 'type' || f === 'dept') { hr[f] = e.target.value; hRenderStaffList(); }
  if (f === 'fired') { hr.fired = e.target.checked; hRenderStaffList(); }
  if (f === 'mxLe') { hr.mxLe = e.target.value; hRenderSafety(); }
  if (f === 'hireVac') { hr.hireVac = e.target.value; hRenderHire(); }
  const au = e.target.getAttribute('data-act-up');
  if (au) {   // загруженный акт = акт подписан
    const p = au.split('|'), files = Array.prototype.slice.call(e.target.files || []); e.target.value = '';
    if (files.length) hAttach(files, 'act', Number(p[0]), p[1], null).then(function(n) { if (n) hSaveAct(Number(p[0]), p[1], true); });
    return;
  }
  const am = e.target.getAttribute('data-act-m');
  if (am) { const p = am.split('|'); hSaveAct(Number(p[0]), p[1], e.target.checked); return; }
}
function hOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  if (c('a[href^="tel:"], a[href^="mailto:"], a[target], a[data-hrfile], a.hr-cb')) return;
  const tab = c('[data-tab]');
  if (tab) { hr.tab = tab.getAttribute('data-tab'); hr.only = null; hRender(); try { window.scrollTo(0, 0); } catch (err) { /* песочница */ } return; }
  const act = c('[data-act]'), a = act && act.getAttribute('data-act');
  if (a === 'newemp') return hOpenNewEmp();
  if (a === 'unonly') { hr.only = null; hRenderStaff(); return; }
  if (a === 'sv') { hr.staffView = act.getAttribute('data-v'); hRenderStaff(); return; }
  if (a === 'newdep') return hEditDept(null, hDepTop(), function(x) { if (x) hOpenDept(x.id); });
  if (a === 'newle') return hOpenLe(null);
  if (a === 'year') { hr.year += Number(act.getAttribute('data-d')); (hr.tab === 'hire' ? hRenderHire : hRenderVac)(); return; }
  if (a === 'newvac') return hOpenVac(null, {});
  if (a === 'newpb') return hOpenSafety(null, { kind: HR_PB_COMMON[0][0] });
  if (a === 'newsout') return hOpenSout(null);
  if (a === 'newlna') return hOpenLna(null);
  if (a === 'newprog') return hOpenProg(null);
  if (a === 'newev') return hOpenEvent(null);
  if (a === 'hv') { hr.hireView = act.getAttribute('data-v'); hRenderHire(); return; }
  if (a === 'newcand') return hOpenCand(null, hr.hireVac ? { vacancy_id: Number(hr.hireVac) } : {});
  if (a === 'newvacancy') return hOpenVacancy(null);
  if (a === 'newpos') return hOpenPos(null);
  if (a === 'pos2vac') { const p = hr.d.pos.find(function(x) { return x.id === Number(act.getAttribute('data-id')); }); return hOpenVacancy(null, { title: p.position, legal_entity_id: p.legal_entity_id, department: p.department, position_id: p.id, salary: p.salary ? String(p.salary) : '' }); }
  const go = c('[data-go]');
  if (go) return hGo(JSON.parse(go.getAttribute('data-go')));
  const le = c('[data-le]');
  if (le) return hOpenLe(hLe(le.getAttribute('data-le')));
  const vb = c('[data-vac]');
  if (vb) { e.stopPropagation(); return hOpenVac(hr.d.vacs.find(function(v) { return v.id === Number(vb.getAttribute('data-vac')); })); }
  const tr = c('[data-track]');
  if (tr) {   // клик по пустому месту шкалы — новый отпуск с этой даты
    const r = tr.getBoundingClientRect(), y = hr.year, diy = hDays(y + '-01-01', (y + 1) + '-01-01');
    const s = new Date(y, 0, 1 + Math.floor((e.clientX - r.left) / r.width * diy));
    const en = new Date(s); en.setDate(en.getDate() + 13);
    return hOpenVac(null, { employee_id: Number(tr.getAttribute('data-track')), start_date: hIso(s), end_date: hIso(en) });
  }
  const cell = c('[data-cell]');
  if (cell) { const p = cell.getAttribute('data-cell').split('|'); return hOpenSafetyCell(Number(p[0]), p[1]); }
  const empA = c('a[data-emp]');   // ссылка на человека внутри строки записи (штатное расписание) — открыть человека, а не строку
  if (empA) return hOpenEmp(Number(empA.getAttribute('data-emp')));
  const rec = c('[data-rec]');
  if (rec) {
    const p = rec.getAttribute('data-rec').split(':'), id = Number(p[1]);
    const find = function(l) { return l.find(function(x) { return x.id === id; }); };
    if (p[0] === 'safety') return hOpenSafety(find(hr.d.safety));
    if (p[0] === 'sout') return hOpenSout(find(hr.d.sout));
    if (p[0] === 'lna') return hOpenLna(find(hr.d.lna));
    if (p[0] === 'prog') return hOpenProg(find(hr.d.progs));
    if (p[0] === 'ev') return hOpenEvent(find(hr.d.events));
    if (p[0] === 'cand') return hOpenCand(find(hr.d.cands));
    if (p[0] === 'vacancy') return hOpenVacancy(find(hr.d.vacancies));
    if (p[0] === 'pos') return hOpenPos(find(hr.d.pos));
  }
  const dep = c('[data-dep]');
  if (dep) return hOpenDept(Number(dep.getAttribute('data-dep')));
  const emp = c('[data-emp]');
  if (emp && !c('select')) hOpenEmp(Number(emp.getAttribute('data-emp')));
}

// ---------- главный экран дашборда HR: плитки разделов + лента «Требует внимания» ----------
function hRenderHome() {
  const d = hr.d, act = hActive(), t = hToday(), al = hAlerts();
  const byType = function(k) { return act.filter(function(e) { return (e.employment_type || 'staff') === k; }).length; };
  const onVac = act.filter(hVacNow), soon = d.vacs.filter(function(v) { const n = hDays(t, v.start_date); return n > 0 && n <= 30 && hEmp(v.employee_id); });
  const liable = (d.priv || []).filter(function(p) { const e = hEmp(p.employee_id); return p.mil_status === 'liable' && e && e.status !== 'fired'; }).length;
  const nextEv = d.events.filter(function(x) { return hD(x.event_date) >= t; }).sort(function(a, b) { return hD(a.event_date).localeCompare(hD(b.event_date)); })[0];
  const lateSafety = hStaff().reduce(function(n, e) { return n + HR_SAFETY.filter(function(k) { const r = hSafetyLast(e.id, k[0]); return r && r.next_on && hDue(r.next_on) === 'late'; }).length; }, 0);
  const noAck = d.lna.reduce(function(n, l) { return n + hLnaMissing(l).length; }, 0);
  // плитка = раздел: название, главная цифра, пояснение, сколько там пунктов «требует внимания»
  const tile = function(sec, v, n) {
    const a = al.filter(function(x) { return x.sec === sec && x.lvl < 2; }), red = a.some(function(x) { return x.lvl === 0; });
    return '<div class="hr-tile hr-sect" data-tab="' + sec + '"><div class="hr-tile-l">' + HR_SECTIONS[sec] + (a.length ? ' <span class="hr-chip ' + (red ? 'red' : 'orange') + '">' + a.length + '</span>' : '') + '</div>'
      + '<div class="hr-tile-v">' + v + '</div><div class="hr-tile-n">' + n + '</div><div class="hr-tile-go">открыть →</div></div>';
  };
  const lvlC = ['#cf1322', '#fa8c16', '#1c2d58'];
  const leRows = d.les.map(function(l) { return [l.id, l.name]; }).concat([['', 'Юрлицо не указано']]).map(function(x) {
    const l = act.filter(function(e) { return x[0] === '' ? !hLes(e).length : hInLe(e, x[0]); });
    if (!l.length) return '';
    const n = function(k) { return l.filter(function(e) { return (e.employment_type || 'staff') === k; }).length; };
    return '<tr data-go="' + hEsc(JSON.stringify({ tab: 'staff', le: x[0] === '' ? '-' : String(x[0]), type: '' })) + '" style="cursor:pointer;"><td>' + hEsc(x[1]) + '</td><td class="n">' + n('staff') + '</td><td class="n">' + n('external') + '</td><td class="n">' + n('self') + '</td><td class="n"><b>' + l.length + '</b></td></tr>';
  }).join('');
  hBody().innerHTML = '<div class="hr-tiles hr-tiles-home" style="--tiles:6;">'
    + tile('staff', act.length, 'штат ' + byType('staff') + ' · ГПХ ' + byType('external') + ' · самозанятые ' + byType('self'))
    + tile('hire', d.vacancies.filter(function(v) { return v.status === 'open'; }).length + ' <small style="font-size:13px;font-weight:400;">вакансий</small>',
        'кандидатов в работе ' + d.cands.filter(function(c) { return ['new', 'interview', 'offer'].indexOf(c.stage) !== -1; }).length
        + ' · собеседований на неделе ' + d.cands.filter(function(c) { return c.stage === 'interview' && c.interview_on && hDays(t, c.interview_on) >= 0 && hDays(t, c.interview_on) <= 7; }).length
        + ' · свободно ставок ' + d.pos.reduce(function(n, p) { return n + Math.max(0, hPosFree(p)); }, 0))
    + tile('vac', onVac.length + ' <small style="font-size:13px;font-weight:400;">в отпуске</small>', soon.length ? 'в ближайший месяц уходят ' + soon.length : 'в ближайший месяц никто не уходит')
    + tile('safety', lateSafety ? '<span style="color:#cf1322;">' + lateSafety + '</span> <small style="font-size:13px;font-weight:400;">просрочено</small>' : '✓', 'обучение, инструктажи, пожарная безопасность, СОУТ · ' + d.sout.length + ' раб. мест')
    + tile('mil', liable + ' <small style="font-size:13px;font-weight:400;">на учёте</small>', 'организации: сверки и планы; военнообязанные')
    + tile('docs', d.lna.length + ' <small style="font-size:13px;font-weight:400;">ЛНА</small>', (noAck ? 'не ознакомлены: ' + noAck + ' · ' : '') + (nextEv ? 'ближайшее мероприятие ' + hDate(nextEv.event_date).slice(0, 5) : 'мероприятий не запланировано'))
    + '</div><div class="hr-cols"><div>'
    + '<div class="hr-card"><div class="hr-card-t">Требует внимания <small>' + al.length + '</small></div>'
    + (al.length ? al.map(function(x) {
        return '<div class="hr-al" data-go="' + hEsc(JSON.stringify(x.go)) + '"><span class="hr-dot" style="background:' + lvlC[x.lvl] + ';"></span><div class="hr-al-t">' + hEsc(x.text) + (x.sub ? '<div class="hr-al-s">' + hEsc(x.sub) + '</div>' : '') + '</div></div>';
      }).join('') : '<div class="hr-hint">Всё в порядке</div>') + '</div></div><div>'
    + '<div class="hr-card"><div class="hr-card-t">По юрлицам</div><table><thead><tr><th></th><th class="n">Штат</th><th class="n">ГПХ</th><th class="n">Самоз.</th><th class="n">Всего</th></tr></thead><tbody>' + leRows + '</tbody></table>'
    + (d.les.length ? '' : '<div class="hr-hint">Юрлица пока не заведены: «Воинский учёт» → «+ Юрлицо».</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">Отпуска в ближайший месяц</div>' + (soon.length || onVac.length ? '<div class="hr-lines">'
      + onVac.map(function(e) { const v = hVacNow(e); return '<div data-go="' + hEsc(JSON.stringify({ vac: v.id })) + '" style="cursor:pointer;"><span>' + hEsc(e.full_name) + '</span><span class="hr-chip green">в отпуске до ' + hDate(v.end_date).slice(0, 5) + '</span></div>'; }).join('')
      + soon.map(function(v) { return '<div data-go="' + hEsc(JSON.stringify({ vac: v.id })) + '" style="cursor:pointer;"><span>' + hEsc(hEmp(v.employee_id).full_name) + '</span><span class="hr-hint">' + hDate(v.start_date).slice(0, 5) + '–' + hDate(v.end_date).slice(0, 5) + '</span></div>'; }).join('')
      + '</div>' : '<div class="hr-hint">Никто не уходит</div>') + '</div>'
    + hActsCard()
    + '</div></div>';
}
// самозанятые: отметка ежемесячного акта (за прошлый и текущий месяц)
function hActsCard() {
  const self = hActive().filter(function(e) { return e.employment_type === 'self'; });
  if (!self.length) return '';
  const pm = hPrevMonth(), cm = hToday().slice(0, 7);
  return '<div class="hr-card"><div class="hr-card-t">Акты самозанятых</div><table><thead><tr><th></th><th class="n">' + hMonthName(pm) + '</th><th class="n">' + hMonthName(cm) + '</th></tr></thead><tbody>'
    + self.map(function(e) {
        const a = e.acts || {}, c = function(m) {
          const fs = hFilesOf('act', e.id, m);
          return '<td class="n" style="white-space:nowrap;"><label style="cursor:pointer;"><input type="checkbox" data-act-m="' + e.id + '|' + m + '"' + (a[m] ? ' checked' : '') + '>' + (a[m] && hDate(a[m]) ? ' <span class="hr-hint">' + hDate(a[m]).slice(0, 5) + '</span>' : '') + '</label>'
            + fs.map(function(f) { return ' ' + hFileA(f.file || {}, '📄', (f.file || {}).title); }).join('')
            + ' <label class="hr-btn sm" style="cursor:pointer;padding:0 6px;" title="Загрузить подписанный акт">📎<input type="file" data-act-up="' + e.id + '|' + m + '" style="display:none;"></label></td>';
        };
        return '<tr><td><a data-emp="' + e.id + '" style="cursor:pointer;">' + hEsc(e.full_name) + '</a>' + (e.object_name ? '<div class="hr-hint">' + hEsc(e.object_name) + '</div>' : '') + '</td>' + c(pm) + c(cm) + '</tr>';
      }).join('') + '</tbody></table></div>';
}
async function hSaveAct(empId, month, on) {
  const e = hEmp(empId), acts = Object.assign({}, e.acts || {});
  if (on) acts[month] = hToday(); else delete acts[month];
  try { await ctx.api.resource('crm_employees').update({ filterByTk: empId, values: { acts: acts } }); await hReload(); } catch (err) { hToast('Не удалось сохранить'); }
}

// ---------- воинский учёт: организации (сверка, план) и военнообязанные ----------
function hRenderMil() {
  const d = hr.d, t = hToday(), y = new Date().getFullYear(), act = hActive();
  const liable = act.filter(function(e) { const p = hPriv(e.id); return p && p.mil_status === 'liable'; });
  const unknown = hStaff().filter(function(e) { const p = hPriv(e.id); return !p || !p.mil_status; });
  const orgs = d.les.map(function(l) {
    const n = liable.filter(function(e) { return hInLe(e, l.id); }).length, all = act.filter(function(e) { return hInLe(e, l.id); }).length;
    const chk = l.mil_check_on ? (hDays(l.mil_check_on, t) > 365 ? 'late' : hDays(l.mil_check_on, t) > 330 ? 'soon' : 'ok') : 'none';
    const plan = Number(l.mil_plan_year || 0);
    return '<tr data-le="' + l.id + '"><td>' + hEsc(l.name) + '</td><td>' + (l.mil_office ? hEsc(l.mil_office) : '<span class="hr-none">—</span>') + '</td>'
      + '<td class="hr-' + chk + '">' + (hDate(l.mil_check_on) || '—') + '</td><td class="' + (plan >= y + 1 ? 'hr-ok' : plan === y ? '' : 'hr-soon') + '">' + (plan || '—') + '</td>'
      + '<td class="n">' + n + '</td><td class="n hr-hint">' + all + '</td></tr>';
  }).join('');
  const col = function(k) { return H_MIL.find(function(f) { return f[0] === k; }); };
  hBody().innerHTML = '<div class="hr-card"><div class="hr-card-t">Организации<button class="hr-btn sm" data-act="newle"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Юрлицо</button></div>'
    + '<div class="hr-hint" style="margin:-4px 0 8px;">Ежегодная сверка с военкоматом; план воинского учёта на следующий год — осенью (приказ об организации ВУ, план, карточка организации по форме 18). Нажмите на строку, чтобы отметить.</div>'
    + (orgs ? '<table><thead><tr><th>Юрлицо</th><th>Военкомат</th><th>Последняя сверка</th><th>План на год</th><th class="n">На учёте</th><th class="n">Всего людей</th></tr></thead><tbody>' + orgs + '</tbody></table>' : '<div class="hr-hint">Юрлица не заведены.</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">Военнообязанные <small>' + liable.length + '</small></div>'
    + (liable.length ? '<table><thead><tr><th>Сотрудник</th><th>Юрлицо</th><th>Звание</th><th>Категория годности</th><th>Военкомат</th><th>Сведения в военкомат</th></tr></thead><tbody>' + liable.map(function(e) {
        const p = hPriv(e.id), ev = e.status === 'fired' ? e.fired_on : e.hired_on, sent = p.mil_sent_on && (!ev || hD(p.mil_sent_on) >= hD(ev));
        return '<tr data-emp="' + e.id + '"><td>' + hEsc(e.full_name) + '</td><td>' + hEsc(hLes(e).map(hLe).filter(Boolean).map(function(l) { return l.name; }).join(', ')) + '</td><td>' + hShow(col('mil_rank'), p.mil_rank) + '</td>'
          + '<td>' + hEsc(p.mil_fitness || '—') + '</td><td>' + hShow(col('mil_office'), p.mil_office) + '</td><td class="' + (sent ? 'hr-ok' : 'hr-none') + '">' + (p.mil_sent_on ? hDate(p.mil_sent_on) : '—') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="hr-hint">Никто не отмечен. Отметьте в карточке сотрудника → «Воинский учёт».</div>')
    + (unknown.length ? '<div class="hr-hint" style="margin-top:8px;">Не указано, военнообязан ли: <a data-go="' + hEsc(JSON.stringify({ ids: unknown.map(function(e) { return e.id; }), title: 'Воинский учёт не заполнен' })) + '" style="color:#1c2d58;cursor:pointer;">' + hPeople(unknown.length) + '</a></div>' : '') + '</div>';
}

// ---------- сотрудники: список и структура ----------
function hRenderStaff() {
  const hrm = HR_MODE === 'hr', view = hr.staffView, org = view === 'org';
  const leSel = '<select data-f="le"><option value="">Все юрлица</option>' + hr.d.les.map(function(l) { return '<option value="' + l.id + '"' + (String(hr.le) === String(l.id) ? ' selected' : '') + '>' + hEsc(l.name) + '</option>'; }).join('') + '<option value="-"' + (hr.le === '-' ? ' selected' : '') + '>— юрлицо не указано —</option></select>';
  const deptSel = '<select data-f="dept"><option value="">Все отделы</option>' + hDeptNames().map(function(n) { return '<option' + (hr.dept === n ? ' selected' : '') + '>' + hEsc(n) + '</option>'; }).join('') + '</select>';
  const typeSel = '<select data-f="type"><option value="">Любой тип занятости</option>' + Object.keys(HR_EMP_TYPE).map(function(k) { return '<option value="' + k + '"' + (hr.type === k ? ' selected' : '') + '>' + HR_EMP_TYPE[k] + '</option>'; }).join('') + '</select>';
  hBody().innerHTML = '<div class="hr-bar">'
    + (hrm ? '<span class="hr-seg"><button data-act="sv" data-v="table" class="' + (!org ? 'on' : '') + '">Таблица</button><button data-act="sv" data-v="org" class="' + (org ? 'on' : '') + '">Структура</button></span>' : '')
    + (!org ? '<input type="text" data-f="q" placeholder="Найти: фамилия, должность, телефон" value="' + hEsc(hr.q) + '">' + leSel + deptSel + (hrm ? typeSel : '')
      + '<label class="hr-hint" style="margin:0;cursor:pointer;"><input type="checkbox" data-f="fired"' + (hr.fired ? ' checked' : '') + '> уволенные</label>'
      : '<input type="text" data-f="oq" placeholder="Найти: фамилия, должность, отдел, объект" value="' + hEsc(hr.orgQ) + '" style="flex:1;min-width:260px;">'
        + (hCan() ? '<button class="hr-btn sm" data-act="newle"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Юрлицо</button><button class="hr-btn sm" data-act="newdep"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Отдел</button>' : ''))
    + '</div>' + (hr.only && !org ? '<div class="hr-only">Показаны: <b>' + hEsc(hr.only.title) + '</b> (' + hr.only.ids.length + ')<button class="hr-btn sm" data-act="unonly" style="margin-left:auto;">Показать всех</button></div>' : '')
    + '<div data-staff-list></div>';
  if (org) hRenderOrg(); else hRenderStaffList();
}
// отбор сотрудников по фильтрам раздела
function hStaffFiltered() {
  const q = hr.q.trim().toLowerCase();
  return hr.d.emps.filter(function(e) {
    if (hr.only) return hr.only.ids.indexOf(e.id) !== -1;
    if (!hr.fired && e.status === 'fired') return false;
    if (hr.le === '-' ? hLes(e).length : (hr.le && !hInLe(e, hr.le))) return false;
    if (HR_MODE === 'hr' && hr.type && (e.employment_type || 'staff') !== hr.type) return false;
    if (hr.dept && e.department !== hr.dept) return false;
    if (q && [e.full_name, e.middle_name, e.position, e.email, e.phone, e.department, e.object_name].join(' ').toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
// дашборд HR: сводная таблица — по строке на человека, всё кадровое в столбцах
function hRenderHrTable(box) {
  const y = new Date().getFullYear(), list = hStaffFiltered().sort(function(a, b) { return String(a.full_name).localeCompare(String(b.full_name), 'ru'); });
  const cellOt = function(e) {
    if ((e.employment_type || 'staff') !== 'staff') return '<span class="hr-none">не нужно</span>';
    const recs = HR_SAFETY.map(function(k) { const r = hSafetyLast(e.id, k[0]); return r ? hDue(r.next_on) : 'none'; });
    const late = recs.filter(function(x) { return x === 'late'; }).length, soon = recs.filter(function(x) { return x === 'soon'; }).length, has = recs.filter(function(x) { return x !== 'none'; }).length;
    return late ? '<span class="hr-late">просрочено ' + late + '</span>' : soon ? '<span class="hr-soon">скоро ' + soon + '</span>' : has ? '<span class="hr-ok">✓ ' + has + ' из ' + HR_SAFETY.length + '</span>' : '<span class="hr-none">нет данных</span>';
  };
  const cellMil = function(e) { const p = hPriv(e.id); return !p || !p.mil_status ? '<span class="hr-none">?</span>' : p.mil_status === 'liable' ? (p.mil_rank ? hEsc(p.mil_rank) : 'на учёте') : '<span class="hr-hint">нет</span>'; };
  const cellFile = function(e) {
    const need = e.employment_type === 'self' ? HR_FILE_DOCS_SELF.length : (e.employment_type || 'staff') === 'staff' ? HR_FILE_DOCS.length : 4, n = ((hPriv(e.id) || {}).file_docs || []).length;
    return '<span class="' + (n >= need ? 'hr-ok' : n ? 'hr-soon' : 'hr-none') + '">' + n + ' / ' + need + '</span>';
  };
  box.innerHTML = list.length ? '<div class="hr-card"><table><thead><tr><th>Сотрудник</th><th>Юрлицо</th><th>Тип</th><th class="n">Отпуск, осталось</th><th>ОТ и ПБ</th><th>Воинский учёт</th><th>Личное дело</th><th>СОУТ</th></tr></thead><tbody>'
    + list.map(function(e) {
        const so = hSout(e.sout_id), v = hVacNow(e), st = e.employment_type || 'staff';
        return '<tr data-emp="' + e.id + '"' + (e.status === 'fired' ? ' style="opacity:.55;"' : '') + '><td><b style="font-weight:600;">' + hEsc(e.full_name) + '</b><div class="hr-hint" style="margin:0;">' + hEsc([e.position, e.department].filter(Boolean).join(' · ')) + '</div></td>'
          + '<td>' + (hEsc(hLes(e).map(hLe).filter(Boolean).map(function(l) { return l.name; }).join(', ')) || '<span class="hr-none">—</span>') + '</td>'
          + '<td>' + (st === 'staff' ? 'штат' + (e.rate && e.rate !== '1' ? ', ' + hEsc(e.rate) : '') : st === 'self' ? 'самозанятый' : 'ГПХ') + '</td>'
          + '<td class="n">' + (st === 'staff' ? (v ? '<span class="hr-chip green">в отпуске</span> ' : '') + hVacLeft(e, y) + ' дн.' : '') + '</td>'
          + '<td>' + cellOt(e) + '</td><td>' + cellMil(e) + '</td><td>' + cellFile(e) + '</td>'
          + '<td>' + (so ? hEsc(so.work_class || '—') : '<span class="hr-none">—</span>') + '</td></tr>';
      }).join('') + '</tbody></table><div class="hr-hint">' + hPeople(list.length) + '. Нажмите на строку — откроется карточка со всеми данными.</div></div>'
    : '<div class="hr-empty"><b>Никого не нашли</b>Измените поиск или фильтры.</div>';
}
function hEmpChips(e) {
  const out = [], v = hVacNow(e), t = e.employment_type || 'staff';
  if (e.status === 'fired') out.push('<span class="hr-chip">уволен</span>');
  if (t !== 'staff') out.push('<span class="hr-chip purple">' + (t === 'self' ? 'самозанятый' : 'ГПХ') + (e.contract_until ? ' до ' + hDate(e.contract_until) : '') + '</span>');
  if (v) out.push('<span class="hr-chip green">в отпуске до ' + hDate(v.end_date).slice(0, 5) + '</span>');
  hLes(e).map(hLe).filter(Boolean).forEach(function(l) { out.push('<span class="hr-chip blue">' + hEsc(l.name) + '</span>'); });
  if (e.object_name) out.push('<span class="hr-chip">' + hEsc(e.object_name) + '</span>');
  return out.join('');
}
function hRenderStaffList() {
  const box = hRoot().querySelector('[data-staff-list]'); if (!box || hr.staffView === 'org') return;
  if (HR_MODE === 'hr') return hRenderHrTable(box);
  const list = hStaffFiltered();
  const groups = {}, order = hDeptNames().concat(['Без отдела']);
  list.forEach(function(e) { const k = e.department || 'Без отдела'; (groups[k] = groups[k] || []).push(e); });
  const heads = {};
  hr.d.depts.forEach(function(d) { if (d.head_employee_id) heads[d.head_employee_id] = 1; });
  // одна таблица на всех: заголовок отдела — строкой, столбцы выровнены по всей странице
  const tel = function(p) { return p ? '<a href="tel:' + hEsc(String(p).replace(/[^\d+]/g, '')) + '">' + hEsc(String(p).replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 $1 $2-$3-$4')) + '</a>' : '<span class="hr-none">—</span>'; };
  const body = order.filter(function(n) { return groups[n]; }).map(function(n) {
    const people = groups[n].sort(function(a, b) { return (heads[b.id] ? 1 : 0) - (heads[a.id] ? 1 : 0) || String(a.full_name).localeCompare(String(b.full_name), 'ru'); });
    return '<tr class="hr-dept"><td colspan="5">' + hEsc(n) + ' <span>' + people.length + '</span></td></tr>' + people.map(function(e) {
      const v = hVacNow(e), t = e.employment_type || 'staff';
      const tags = (heads[e.id] ? '<span class="hr-chip blue">руководитель</span>' : '') + (v ? '<span class="hr-chip green">в отпуске до ' + hDate(v.end_date).slice(0, 5) + '</span>' : '')
        + (t !== 'staff' ? '<span class="hr-chip purple">' + (t === 'self' ? 'самозанятый' : 'ГПХ') + '</span>' : '') + (e.status === 'fired' ? '<span class="hr-chip">уволен</span>' : '');
      return '<tr data-emp="' + e.id + '"' + (e.status === 'fired' ? ' style="opacity:.55;"' : '') + '><td class="nm">' + hAva(e.full_name) + '<b>' + hEsc(e.full_name) + '</b>' + tags + '</td>'
        + '<td>' + (hEsc(e.position) || '<span class="hr-none">—</span>') + '</td>'
        + '<td>' + (hEsc(hLes(e).map(hLe).filter(Boolean).map(function(l) { return l.name; }).join(', ')) || '<span class="hr-none">—</span>') + '</td>'
        + '<td class="ph">' + tel(e.phone) + '</td><td>' + (e.email ? '<a href="mailto:' + hEsc(e.email) + '">' + hEsc(e.email) + '</a>' : '<span class="hr-none">—</span>') + '</td></tr>';
    }).join('');
  }).join('');
  box.innerHTML = body ? '<div class="hr-card hr-list"><table><thead><tr><th>Сотрудник</th><th>Должность</th><th>Юрлицо</th><th>Телефон</th><th>Почта</th></tr></thead><tbody>' + body + '</tbody></table></div>'
    : '<div class="hr-empty"><b>Никого не нашли</b>Измените поиск или фильтры.</div>';
}
// ---------- оргструктура: кто чем занимается и как связаться ----------
// Видна всем. Отдел — кликабельный (окно отдела: руководитель, люди, подотделы, чат и письмо всему отделу).
// У каждого человека кнопки связи: мессенджер (если есть настоящая учётка в CRM), внутренняя почта, телефон.
// Править структуру (отделы, подчинённость, руководители) — HR и администратор в дашборде HR.
const HR_MSG_PAGE = '/admin/msgspage01', HR_MAIL_PAGE = '/admin/mailpage01';
const HR_OBJ_DEPT = cfg('org.objDept');   // люди этого отдела группируются по объектам
function hPhone(p) { return String(p || '').replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 $1 $2-$3-$4'); }
// учётка, через которую человек реально читает мессенджер; тестовые test.* — не канал связи
function hUser(e) { const u = e && e.user_id ? (hr.d.users || []).find(function(x) { return x.id === Number(e.user_id); }) : null; return u && !/^test\./.test(u.username || '') ? u : null; }
function hIsMe(e) { return !!(hr.me && e && e.user_id && Number(e.user_id) === Number(hr.me.id)); }
function hContacts(e, big) {
  if (!e || e.status === 'fired') return '';
  const u = hUser(e), me = hIsMe(e), b = [];
  if (u && !me) b.push('<a class="hr-cb" href="' + HR_MSG_PAGE + '?dm=' + u.id + '" title="Написать в мессенджере">💬' + (big ? ' Написать' : '') + '</a>');
  if (e.email && !me) b.push('<a class="hr-cb" href="' + HR_MAIL_PAGE + '?to=' + encodeURIComponent(e.email) + '" title="Письмо: ' + hEsc(e.email) + '">✉️' + (big ? ' Письмо' : '') + '</a>');
  if (e.phone) b.push('<a class="hr-cb" href="tel:' + hEsc(String(e.phone).replace(/[^\d+]/g, '')) + '" title="Позвонить: ' + hEsc(hPhone(e.phone)) + '">📞' + (big ? ' ' + hEsc(hPhone(e.phone)) : '') + '</a>');
  return b.length ? '<span class="hr-cbs">' + b.join('') + '</span>' : '';
}
function hDep(id) { return hr.d.depts.find(function(x) { return x.id === Number(id); }) || null; }
function hDepByName(n) { return hr.d.depts.find(function(x) { return x.name === n; }) || null; }
function hDepKids(dep) { return hr.d.depts.filter(function(x) { return x.parent_name === dep.name && x.id !== dep.id; }).sort(function(a, b) { return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), 'ru'); }); }
function hDepHead(dep) { const h = dep && dep.head_employee_id ? hEmp(dep.head_employee_id) : null; return h && h.status !== 'fired' ? h : null; }
function hDepOwn(dep) { return hActive().filter(function(e) { return e.department === dep.name; }); }
function hDepAll(dep, seen) {   // все люди отдела вместе с подотделами
  seen = seen || {}; if (seen[dep.id]) return []; seen[dep.id] = 1;
  return hDepOwn(dep).concat.apply(hDepOwn(dep), hDepKids(dep).map(function(k) { return hDepAll(k, seen); }));
}
function hDepPath(dep) { const p = []; let x = dep; while (x && p.indexOf(x) === -1 && p.length < 12) { p.unshift(x); x = hDepByName(x.parent_name); } return p; }
function hDepTop() { return hr.d.depts.find(function(x) { return !x.parent_name || !hDepByName(x.parent_name); }) || null; }
function hDepVisible(dep) { return hDepAll(dep).length > 0 || !!hDepHead(dep) || hCan(); }
// руководитель человека: глава его отдела, а для самого главы — глава вышестоящего
function hBoss(e) {
  let dep = hDepByName(e.department), n = 0;
  while (dep && n++ < 12) { const h = hDepHead(dep); if (h && h.id !== e.id) return h; dep = hDepByName(dep.parent_name); }
  return null;
}
function hPersonRow(e, opts) {
  opts = opts || {};
  const v = hVacNow(e);
  return '<div class="hr-pr" data-emp="' + e.id + '">' + hAva(e.full_name) + '<div class="hr-pr-t"><b>' + hEsc(e.full_name) + '</b>'
    + (v ? ' <span class="hr-chip green">в отпуске до ' + hDate(v.end_date).slice(0, 5) + '</span>' : '')
    + '<span>' + hEsc([e.position || 'должность не указана'].concat(opts.dept ? [e.department] : []).concat(opts.obj && e.object_name ? [e.object_name] : []).filter(Boolean).join(' · ')) + '</span></div>'
    + hContacts(e) + '</div>';
}
function hDepTile(dep, depth) {
  const h = hDepHead(dep), all = hDepAll(dep), own = hDepOwn(dep).filter(function(e) { return !h || e.id !== h.id; });
  const kids = hDepKids(dep).filter(hDepVisible);
  const people = dep.name === HR_OBJ_DEPT
    ? '<div class="hr-dt-n">' + hPeople(own.length) + ' · объектов: ' + Object.keys(own.reduce(function(a, e) { if (e.object_name) a[e.object_name] = 1; return a; }, {})).length + '</div>'
    : own.length > 6 ? '<div class="hr-dt-n">' + hPeople(own.length) + '</div>'
    : own.map(function(e) { return hPersonRow(e); }).join('');
  return '<div class="hr-dt' + (depth ? ' sub' : '') + '"><div class="hr-dt-h" data-dep="' + dep.id + '"><b>' + hEsc(dep.name) + '</b><span>' + all.length + ' чел. ›</span></div>'
    + (h ? '<div class="hr-dt-head">' + hPersonRow(h) + '</div>' : '<div class="hr-hint" style="margin:4px 0;">руководитель не назначен</div>')
    + people + kids.map(function(k) { return hDepTile(k, (depth || 0) + 1); }).join('') + '</div>';
}
function hOrgLes() {
  if (!hr.d.les.length) return hCan() ? '<div class="hr-hint" style="margin-bottom:16px;">Юрлица не заведены.</div>' : '';
  const act = hActive();
  return '<div class="hr-card-t" style="margin:4px 0 6px;">Юрлица группы</div><div class="hr-le">' + hr.d.les.map(function(l) {
    const raw = String(l.director || ''), role = (raw.match(/^([^:]+):/) || [])[1] || 'Руководитель', name = raw.replace(/^[^:]*:\s*/, '').trim();
    const de = name ? act.find(function(e) { return hNorm(name).indexOf(hNorm(e.last_name + ' ' + e.first_name)) === 0; }) : null;
    const n = act.filter(function(e) { return hInLe(e, l.id); }).length;
    return '<div class="hr-le-c"' + (hCan() ? ' data-le="' + l.id + '"' : '') + '><b>' + hEsc(l.name) + '</b><span class="hr-hint">'
      + (name ? hEsc(role) + ': ' + (de ? '<a data-emp="' + de.id + '">' + hEsc(name) + '</a>' : hEsc(name)) : 'руководитель не указан') + (n ? ' · ' + n + ' чел.' : '') + '</span></div>';
  }).join('') + '</div>';
}
function hRenderOrg() {
  const box = hRoot().querySelector('[data-staff-list]'); if (!box) return;
  const q = hNorm(hr.orgQ || '');
  if (q) { box.innerHTML = hOrgSearch(q); return; }
  const top = hDepTop();
  if (!top) { box.innerHTML = hOrgLes() + '<div class="hr-empty"><b>Структура пока не заполнена</b></div>'; return; }
  const ceo = hDepHead(top), board = hDepOwn(top).filter(function(e) { return !ceo || e.id !== ceo.id; });
  const cols = hDepKids(top).filter(hDepVisible);
  const lost = hActive().filter(function(e) { return !e.department || !hDepByName(e.department); });
  box.innerHTML = '<div class="hr-org">'
    + '<div class="hr-org-top"><div class="hr-org-ceo-c"><div class="hr-dt-h" data-dep="' + top.id + '"><b>' + hEsc(top.name) + '</b><span>' + hActive().length + ' чел. ›</span></div>'
    + (ceo ? hPersonRow(ceo) : '<div class="hr-hint">руководитель не назначен</div>')
    + (board.length ? '<div class="hr-org-board">' + board.map(function(e) { return hPersonRow(e); }).join('') + '</div>' : '') + '</div></div>'
    + '<div class="hr-org-line"></div>'
    + '<div class="hr-org-cols">' + cols.map(function(c) { return '<div class="hr-org-col">' + hDepTile(c, 0) + '</div>'; }).join('') + '</div>'
    + (lost.length ? '<div class="hr-card" style="margin-top:12px;"><div class="hr-card-t">Отдел не указан <small>' + lost.length + '</small></div>' + lost.map(function(e) { return hPersonRow(e); }).join('') + '</div>' : '')
    + '<div style="margin-top:18px;">' + hOrgLes() + '</div></div>';
}
// поиск по людям (имя, должность, отдел, объект) и по отделам (название)
function hOrgSearch(q) {
  const words = q.split(' ').filter(Boolean);
  const hit = function(s) { s = hNorm(s); return words.every(function(w) { return s.indexOf(w) !== -1; }); };
  const deps = hr.d.depts.filter(function(d) { return hDepVisible(d) && hit(d.name); });
  const people = hActive().filter(function(e) { return hit([e.full_name, e.middle_name, e.position, e.department, e.object_name, e.email].join(' ')); });
  if (!deps.length && !people.length) return '<div class="hr-empty"><b>Ничего не нашли</b>Попробуйте фамилию, должность, отдел или объект.</div>';
  return (deps.length ? '<div class="hr-card"><div class="hr-card-t">Отделы <small>' + deps.length + '</small></div>' + deps.map(function(d) {
      const h = hDepHead(d);
      return '<div class="hr-sr" data-dep="' + d.id + '"><b>' + hEsc(d.name) + '</b> <span class="hr-hint">' + hEsc(hDepPath(d).slice(0, -1).map(function(x) { return x.name; }).join(' › ')) + '</span>'
        + (h ? '<div class="hr-hint">Руководитель: ' + hEsc(h.full_name) + '</div>' : '') + '</div>';
    }).join('') + '</div>' : '')
    + (people.length ? '<div class="hr-card"><div class="hr-card-t">Сотрудники <small>' + people.length + '</small></div>' + people.map(function(e) { return hPersonRow(e, { dept: true, obj: true }); }).join('') + '</div>' : '');
}
// окно отдела
function hOpenDept(id) {
  if (!hDep(id)) return;
  const m = hModal('<div data-dep-box></div>', true);
  m.addEventListener('click', function(ev) {
    const c = function(s) { return ev.target.closest ? ev.target.closest(s) : null; };
    if (c('a[href]')) return;
    const d = c('[data-dep]'); if (d) { hRenderDept(m, Number(d.getAttribute('data-dep'))); m.scrollTop = 0; return; }
    const ed = c('[data-depedit]'); if (ed) return hEditDept(hDep(ed.getAttribute('data-depedit')), null, function(x) { if (x && document.body.contains(m)) hRenderDept(m, x.id); else m.remove(); });
    const nd = c('[data-depnew]'); if (nd) return hEditDept(null, hDep(nd.getAttribute('data-depnew')), function(x) { if (x && document.body.contains(m)) hRenderDept(m, x.id); });
    const em = c('[data-emp]'); if (em) hOpenEmp(Number(em.getAttribute('data-emp')));
  });
  hRenderDept(m, id);
}
function hRenderDept(m, id) {
  const dep = hDep(id), box = m.querySelector('[data-dep-box]'); if (!dep) { m.remove(); return; }
  const path = hDepPath(dep), h = hDepHead(dep), own = hDepOwn(dep).filter(function(e) { return !h || e.id !== h.id; });
  const kids = hDepKids(dep).filter(hDepVisible), all = hDepAll(dep), can = hCan();
  const chatIds = all.filter(function(e) { return hUser(e) && !hIsMe(e); }).map(function(e) { return hUser(e).id; }).filter(function(x, i, a) { return a.indexOf(x) === i; });
  const mails = all.filter(function(e) { return e.email && !hIsMe(e); }).map(function(e) { return e.email; }).filter(function(x, i, a) { return a.indexOf(x) === i; });
  let people;
  if (dep.name === HR_OBJ_DEPT) {   // по объектам: управляющий и персонал объекта вместе
    const g = {};
    own.forEach(function(e) { const k = e.object_name || 'Объект не указан'; (g[k] = g[k] || []).push(e); });
    const isMgr = function(e) { return /управляющ/i.test(e.position || ''); };
    people = Object.keys(g).sort(function(a, b) { return (a === 'Объект не указан') - (b === 'Объект не указан') || a.localeCompare(b, 'ru'); }).map(function(k) {
      const list = g[k].sort(function(a, b) { return isMgr(b) - isMgr(a) || String(a.full_name).localeCompare(String(b.full_name), 'ru'); });
      return '<div class="hr-obj"><div class="hr-obj-h">' + hEsc(k) + ' <span>' + list.length + '</span></div>' + list.map(function(e) { return hPersonRow(e); }).join('') + '</div>';
    }).join('');
  } else people = own.map(function(e) { return hPersonRow(e); }).join('');
  box.innerHTML = '<div class="hr-box-h"><div class="hr-box-t">'
    + (path.length > 1 ? '<div class="hr-crumbs">' + path.slice(0, -1).map(function(x) { return '<a data-dep="' + x.id + '">' + hEsc(x.name) + '</a>'; }).join(' › ') + ' ›</div>' : '')
    + hEsc(dep.name) + '<small>' + hPeople(all.length) + (kids.length ? ' · подотделов: ' + kids.length : '') + '</small>'
    + '<div class="hr-cbs" style="margin-top:8px;">'
    + (chatIds.length ? '<a class="hr-cb" href="' + HR_MSG_PAGE + '?group=' + chatIds.join(',') + '&name=' + encodeURIComponent(dep.name) + '">💬 Чат отдела</a>' : '')
    + (mails.length ? '<a class="hr-cb" href="' + HR_MAIL_PAGE + '?to=' + encodeURIComponent(mails.join(',')) + '">✉️ Письмо всему отделу</a>' : '')
    + (can ? '<button class="hr-btn sm" data-depedit="' + dep.id + '">Изменить отдел</button><button class="hr-btn sm" data-depnew="' + dep.id + '">+ Подотдел</button>' : '') + '</div>'
    + '</div><button class="hr-x">✕</button></div><div class="hr-box-b">'
    + '<div class="hr-sec full"><div class="hr-sec-t">Руководитель</div>' + (h ? '<div class="hr-dt-head">' + hPersonRow(h) + '</div>' + '<div style="margin-top:6px;">' + hContacts(h, true) + '</div>' : '<div class="hr-hint">Не назначен</div>') + '</div>'
    + (people ? '<div class="hr-sec full"><div class="hr-sec-t">Сотрудники <span class="hr-hint" style="font-weight:400;">' + own.length + '</span></div>' + people + '</div>' : '')
    + (kids.length ? '<div class="hr-sec full"><div class="hr-sec-t">Подотделы</div><div class="hr-org-cols">' + kids.map(function(k) {
        const kh = hDepHead(k);
        return '<div class="hr-sr" data-dep="' + k.id + '"><b>' + hEsc(k.name) + '</b> <span class="hr-hint">' + hDepAll(k).length + ' чел.</span>' + (kh ? '<div class="hr-hint">Руководитель: ' + hEsc(kh.full_name) + '</div>' : '') + '</div>';
      }).join('') + '</div></div>' : '')
    + '</div>';
}
const H_DEP = [['name', 'Название отдела', 'text', null, true], ['parent_name', 'Входит в', 'select', null], ['head_employee_id', 'Руководитель', 'select', null],
  ['sort', 'Порядок среди соседних отделов', 'num']];
function hEditDept(dep, parent, after) {
  const under = function(x, root) { let n = 0; while (x && n++ < 12) { if (x.id === root.id) return true; x = hDepByName(x.parent_name); } return false; };
  const spec = H_DEP.map(function(f) {
    if (f[0] === 'parent_name') return [f[0], f[1], 'select', function() { return hr.d.depts.filter(function(x) { return !dep || !under(x, dep); }).map(function(x) { return [x.name, x.name]; }); }];
    if (f[0] === 'head_employee_id') return [f[0], f[1], 'select', function() { return hActive().map(function(e) { return [e.id, e.full_name + (e.position ? ' — ' + e.position : '')]; }); }];
    return f;
  });
  hEdit({ coll: 'crm_departments', rec: dep, preset: { parent_name: parent ? parent.name : null }, spec: spec, title: dep ? dep.name : 'Новый отдел', wide: true,
    wire: function(m) {   // удалить можно только пустой отдел
      const del = m.querySelector('[data-del]');
      if (del && dep && (hDepOwn(dep).length || hDepKids(dep).length)) { del.disabled = true; del.title = 'Сначала переведите людей и подотделы'; }
    },
    prepare: async function(v) {
      const clash = hr.d.depts.find(function(x) { return x.name === v.name && (!dep || x.id !== dep.id); });
      if (clash) return 'Отдел с таким названием уже есть';
      if (dep && v.name !== dep.name) {   // отдел у людей и подчинённость хранятся названием — переименовать везде
        for (const e of hr.d.emps.filter(function(x) { return x.department === dep.name; })) await ctx.api.resource('crm_employees').update({ filterByTk: e.id, values: { department: v.name } });
        for (const k of hDepKids(dep)) await ctx.api.resource('crm_departments').update({ filterByTk: k.id, values: { parent_name: v.name } });
      }
      return v;
    },
    after: after });
}
function hOpenLe(l) { hEdit({ coll: 'crm_legal_entities', rec: l, spec: H_LE, title: l ? l.name : 'Новое юрлицо', files: 'le', wide: true }); }
function hEmpVals(v) {
  v.full_name = v.last_name + (v.first_name ? ' ' + v.first_name : '');
  if (v.status === 'fired' && !v.fired_on) v.fired_on = hToday();
  if (!v.employment_type) v.employment_type = 'staff';
  if (!v.status) v.status = 'active';
  return v;
}
function hOpenNewEmp() {
  hEdit({ coll: 'crm_employees', spec: H_MAIN, title: 'Новый сотрудник', preset: { employment_type: 'staff', status: 'active', vacation_days: 28, hired_on: hToday() },
    prepare: function(v) { return hEmpVals(v); }, after: function(r) { if (r && r.id) hOpenEmp(r.id); } });
}

// личное дело: пункт — есть ли документ (отметка или загруженный файл), файлы пункта, загрузка прямо в пункт; ниже — прочие документы
function hFileDocsView(e, p, list) {
  const have = p.file_docs || [];
  return '<div class="hr-lines">' + list.map(function(k) {
      const fs = hFilesOf('emp', e.id, k), ok = have.indexOf(k) !== -1 || fs.length;
      return '<div><span><span class="' + (ok ? 'hr-ok' : 'hr-none') + '" style="display:inline-block;width:18px;">' + (ok ? '✓' : '○') + '</span>' + hEsc(k) + '</span>'
        + '<span class="hr-fcell">' + fs.map(function(f) { return hFileLink(f) + '<button type="button" class="hr-fdel" data-fdel-emp="' + f.id + '" title="Открепить">✕</button>'; }).join(' ')
        + '<label class="hr-btn sm" style="cursor:pointer;" title="Загрузить скан">📎<input type="file" multiple data-fdoc="' + hEsc(k) + '" style="display:none;"></label></span></div>';
    }).join('') + '</div><div class="hr-hint" style="margin-top:6px;">' + list.filter(function(k) { return have.indexOf(k) !== -1 || hFilesOf('emp', e.id, k).length; }).length + ' из ' + list.length
    + ' · отметка без файла — «Изменить», файл — 📎 у пункта</div>' + hFilesBox('emp', e.id, list);
}

// ---------- карточка сотрудника: всё о человеке в одном окне ----------
function hOpenEmp(id) {
  const e = hEmp(id);
  if (!e) { hToast('Сотрудник не найден'); return; }
  const m = hModal('<div data-hr-emp></div>', true);
  m.__edit = '';
  hRenderEmp(m, id);
}
function hRenderEmp(m, id) {
  const e = hEmp(id), can = hCan(), p = hPriv(id) || {}, box = m.querySelector('[data-hr-emp]'), t = hToday(), y = new Date().getFullYear();
  const staff = (e.employment_type || 'staff') === 'staff', ed = m.__edit;
  const fileList = e.employment_type === 'self' ? HR_FILE_DOCS_SELF : staff ? HR_FILE_DOCS : ['Договор ГПХ', 'Копия паспорта', 'СНИЛС и ИНН', 'Согласие на обработку персональных данных'];
  const H_FILE = [['file_docs', 'Есть в личном деле', 'multi', fileList]];
  const sec = function(key, title, spec, rec, full, view) {
    const editing = ed === key;
    return '<div class="hr-sec' + (full || editing ? ' full' : '') + '" data-sec="' + key + '"><div class="hr-sec-t">' + title
      + (can && spec ? (editing ? '' : '<button class="hr-btn sm" data-edit="' + key + '">Изменить</button>') : '') + '</div>'
      + (editing ? hForm(spec, rec) + '<div class="hr-actions"><button class="hr-btn pri" data-secsave="' + key + '">Сохранить</button><button class="hr-btn" data-edit="">Отмена</button></div>'
        : (view || hKv(spec, rec))) + '</div>';
  };
  const lines = function(arr, empty) { return arr.length ? '<div class="hr-lines">' + arr.join('') + '</div>' : '<div class="hr-hint">' + empty + '</div>'; };
  // основное: только заполненное + главное
  const PUBLIC = ['position', 'department', 'legal_entity_id', 'extra_le_ids', 'object_name', 'phone', 'email', 'work_schedule', 'birthday'];   // справочник для всех
  const mainView = hKv(H_MAIN.filter(function(f) {
      if (HR_MODE !== 'hr') return PUBLIC.indexOf(f[0]) !== -1 && (e[f[0]] || f[0] === 'phone') && !(Array.isArray(e[f[0]]) && !e[f[0]].length);
      return f[0] !== 'note' && f[0] !== 'last_name' && f[0] !== 'first_name' && (e[f[0]] || ['position', 'department', 'legal_entity_id', 'phone', 'hired_on'].indexOf(f[0]) !== -1) && !(f[0] === 'contract_until' && staff);
    }), e)
    + (e.note && HR_MODE === 'hr' ? '<div class="hr-hint" style="white-space:pre-wrap;margin-top:8px;">' + hEsc(e.note) + '</div>' : '');
  // отпуска
  const vacs = hr.d.vacs.filter(function(v) { return Number(v.employee_id) === e.id && hD(v.end_date).slice(0, 4) >= String(y); });
  const vacView = (staff && HR_MODE === 'hr' ? '<div class="hr-hint" style="margin:0 0 6px;">Осталось в ' + y + ': <b style="color:#262626;">' + hVacLeft(e, y) + ' дн.</b> из ' + (e.vacation_days || 28) + '</div>' : '')
    + lines(vacs.map(function(v) { return '<div data-rec="vac:' + v.id + '"><span>' + hDate(v.start_date) + ' – ' + hDate(v.end_date) + ' · ' + (v.days || '') + ' дн.' + (hVacCls(v) !== 'sched' ? ' · ' + hEsc(hVacCls(v) === 'other' ? v.kind : HR_VAC_CLS[hVacCls(v)]) : '') + '</span><span class="hr-chip' + (v.status === 'ordered' ? ' blue' : '') + '">' + hEsc(HR_VAC_ST[v.status] || '') + '</span></div>'; }), 'Отпусков не запланировано')
    + (can ? '<div class="hr-actions" style="margin-top:8px;"><button class="hr-btn sm" data-newvac><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Отпуск</button></div>' : '');
  // охрана труда
  const so = hSout(e.sout_id);
  const otView = (staff ? lines(HR_SAFETY.map(function(k) {
      const r = hSafetyLast(e.id, k[0]), s = r ? hDue(r.next_on) : 'none';
      return '<div data-rec="cell:' + k[0] + '"><span>' + hEsc(k[0]) + '</span><span class="hr-' + s + '">' + (r ? (r.next_on ? 'до ' + hDate(r.next_on) : '✓ ' + hDate(r.done_on)) : 'нет записи') + '</span></div>';
    }), '') : '<div class="hr-hint">Для внештатных и самозанятых инструктажи не ведутся.</div>')
    + '<div class="hr-hint" style="margin-top:8px;">СОУТ: ' + (so ? hEsc(so.workplace) + (so.work_class ? ' — класс <span class="hr-cls" style="background:' + HR_SOUT_CLS[so.work_class] + '22;color:' + HR_SOUT_CLS[so.work_class] + ';">' + hEsc(so.work_class) + '</span>' : '') : 'рабочее место не указано') + '</div>';
  // документы (ЛНА)
  const lnas = hr.d.lna.filter(function(l) { return l.need_ack && hLnaFor(l).some(function(x) { return x.id === e.id; }); });
  const lnaView = lines(lnas.map(function(l) {
    const a = (l.acks || {})[e.id];
    return '<div><span>' + hEsc(l.title) + '</span>' + (a ? '<span class="hr-ok">✓ ' + hDate(a) + '</span>' : '<span class="hr-late">не ознакомлен</span>' + (can ? ' <button class="hr-btn sm" data-ack="' + l.id + '">Ознакомлен сегодня</button>' : '')) + '</div>';
  }), staff ? 'Документов для ознакомления нет' : 'Не требуется');
  // мероприятия и задачи
  const evs = hr.d.events.filter(function(x) { return (x.participants || []).indexOf(e.id) !== -1; });
  const evView = lines(evs.slice(0, 10).map(function(x) { return '<div data-rec="ev:' + x.id + '"><span>' + hEsc(x.title) + '</span><span class="hr-hint">' + hDate(x.event_date) + '</span></div>'; }), 'Пока не участвовал(а)');
  const tasks = hr.d.tasks.filter(function(x) { return (e.user_id && Number(x.executor_id) === Number(e.user_id)) || (x.executor_name && x.executor_name === e.full_name) || Number(x.employee_id) === e.id; });
  const taskView = lines(tasks.slice(0, 8).map(function(x) { return '<div data-task="' + x.id + '"><span>' + hEsc(x.title) + '</span><span class="' + (x.due_date && hD(x.due_date) < t ? 'hr-late' : 'hr-hint') + '">' + (x.due_date ? 'срок ' + hDate(x.due_date) : '') + '</span></div>'; }), 'Открытых задач нет')
    + '<div class="hr-actions" style="margin-top:8px;"><a class="hr-btn sm" href="' + HR_TASKS_PAGE + '?new=' + (e.user_id ? 'u' + e.user_id : 'e' + e.id) + '">Поставить задачу</a>' + (can ? '<a class="hr-btn sm" href="' + HR_TASKS_PAGE + '?new=hr:' + e.id + '"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Кадровая задача</a>' : '') + '</div>';
  const milView = p.mil_status === 'liable' ? hKv(H_MIL.filter(function(f) { return p[f[0]] || f[0] === 'mil_office' || f[0] === 'mil_vus'; }), p) : hKv(H_MIL.slice(0, 1), p);
  const prog = hr.d.progs.find(function(x) { return x.id === Number(p.program_id); });
  const motView = '<div class="hr-kv"><div class="k">Программа</div><div class="v">' + (prog ? '<a class="hr-link" data-rec="prog:' + prog.id + '" style="color:#1c2d58;cursor:pointer;">' + hEsc(prog.title) + '</a>' : '<span class="hr-none">—</span>') + '</div>'
    + '<div class="k">Мотивация</div><div class="v">' + (p.motivation ? hEsc(p.motivation) : '<span class="hr-none">—</span>') + '</div></div>';
  const cand = hr.d.cands.find(function(c) { return Number(c.employee_id) === e.id; });
  const wpFilled = H_WP.filter(function(f) { return p[f[0]]; });
  const wpView = (wpFilled.length ? hKv(wpFilled, p) + (p.wp_reviewed_on ? '<div class="hr-hint">обновлён ' + hDate(p.wp_reviewed_on) + '</div>' : '') : '<div class="hr-hint">Не заполнен.</div>')
    + (cand && cand.comp_scores && Object.keys(cand.comp_scores).length ? '<div class="hr-hint" style="margin-top:8px;"><b style="color:#595959;">На собеседовании' + (cand.interview_on ? ' ' + hDate(cand.interview_on) : '') + ':</b> '
      + HR_COMPS.filter(function(k) { return cand.comp_scores[k]; }).map(function(k) { return hEsc(k) + ' ' + cand.comp_scores[k]; }).join(' · ') + (cand.note ? '<div style="white-space:pre-wrap;">' + hEsc(cand.note) + '</div>' : '') + '</div>' : '')
    + '<div class="hr-hint" style="margin-top:8px;">Только факты о работе: без здоровья, личной жизни и оценок характера. Сотрудник вправе запросить и прочитать эту запись.</div>';
  const v = hVacNow(e), sen = hSeniority(e);
  box.innerHTML = '<div class="hr-box-h">' + hAva(e.full_name) + '<div class="hr-box-t">' + hEsc([e.last_name, e.first_name, e.middle_name].filter(Boolean).join(' ') || e.full_name)
    + '<small>' + hEsc([e.position, e.department].filter(Boolean).join(' · ') || '—') + '</small>'
    + '<div class="hr-chips" style="margin-top:6px;">' + hLes(e).map(hLe).filter(Boolean).map(function(l) { return '<span class="hr-chip blue">' + hEsc(l.name) + '</span>'; }).join('')
    + (e.rate && e.rate !== '1' ? '<span class="hr-chip">' + hEsc(e.rate) + ' ставки</span>' : '') + (e.object_name ? '<span class="hr-chip">' + hEsc(e.object_name) + '</span>' : '') + '<span class="hr-chip' + (staff ? '' : ' purple') + '">' + HR_EMP_TYPE[e.employment_type || 'staff'] + '</span>'
    + (e.status === 'fired' ? '<span class="hr-chip">уволен ' + hDate(e.fired_on) + '</span>' : v ? '<span class="hr-chip green">в отпуске до ' + hDate(v.end_date) + '</span>' : '<span class="hr-chip green">работает</span>')
    + (sen ? '<span class="hr-chip">стаж ' + sen + '</span>' : '')
    + (e.phone ? '<a class="hr-chip" style="text-decoration:none;" href="tel:' + hEsc(String(e.phone).replace(/[^\d+]/g, '')) + '">' + hEsc(e.phone) + '</a>' : '')
    + (e.email ? '<a class="hr-chip" style="text-decoration:none;" href="mailto:' + hEsc(e.email) + '">' + hEsc(e.email) + '</a>' : '') + '</div>'
    + (e.status !== 'fired' ? '<div style="margin-top:8px;">' + hContacts(e, true) + '</div>' : '')
    + (function() {
        const b = hBoss(e), d = hDepByName(e.department);
        return b || d ? '<div class="hr-hint" style="margin-top:8px;">' + (d ? 'Отдел: <a data-dep="' + d.id + '" class="hr-link">' + hEsc(d.name) + '</a>' : '') + (b ? (d ? ' · ' : '') + 'Руководитель: <a data-emp="' + b.id + '" class="hr-link">' + hEsc(b.full_name) + '</a>' : '') + '</div>' : '';
      })()
    + '</div><button class="hr-x">✕</button></div>'
    + '<div class="hr-box-b"><div class="hr-secs">'
    + (document.documentElement.classList.contains('crm-admin') ? '<div class="hr-sec full" style="padding:0;border:none;">' + crmAccountBox(e, e.user_id ? (hr.d.users || []).find(function(x) { return x.id === Number(e.user_id); }) : null) + '</div>' : '')
    + (HR_MODE !== 'hr' && hHasHr() ? '<div class="hr-sec full" style="background:#f3f5fa;border-color:#d6e4ff;">Кадровые данные (отпуска, охрана труда, воинский учёт, личное дело) — <a href="' + HR_DASH_PAGE + '?open=emp:' + e.id + '" style="color:#1c2d58;">открыть в дашборде HR →</a></div>' : '')
    + sec('main', HR_MODE === 'hr' ? 'Основное' : 'Контакты и работа', H_MAIN, e, false, mainView)
    + sec('vac', 'Отпуска', null, null, false, vacView)
    + (can ? sec('mot', 'Мотивация', H_MOT, p, false, motView) : '')
    + (can ? sec('wp', 'Рабочий профиль <span class="hr-lock">🔒 видят HR и администратор</span>', H_WP, p, true, wpView) : '')
    + (HR_MODE === 'hr' ? sec('ot', 'Охрана труда и СОУТ', null, null, false, otView) : '')
    + (can ? sec('mil', 'Воинский учёт', H_MIL, p, false, milView) : '')
    + (can ? sec('pers', 'Личные данные <span class="hr-lock">🔒 видят HR и администратор</span>', H_PERSONAL, p) : '')
    + (can ? sec('file', 'Личное дело', H_FILE, p, true, hFileDocsView(e, p, fileList)) : '')
    + (HR_MODE === 'hr' ? sec('lna', 'Ознакомление с документами', null, null, false, lnaView) + sec('ev', 'Мероприятия', null, null, false, evView) : '')
    + sec('tasks', 'Задачи', null, null, true, taskView)
    + '</div></div>';
  // события карточки
  box.querySelectorAll('.hr-box-h [data-emp]').forEach(function(a) { a.addEventListener('click', function() { m.remove(); hOpenEmp(Number(a.getAttribute('data-emp'))); }); });
  box.querySelectorAll('.hr-box-h [data-dep]').forEach(function(a) { a.addEventListener('click', function() { m.remove(); hOpenDept(Number(a.getAttribute('data-dep'))); }); });
  box.querySelectorAll('[data-edit]').forEach(function(b) { b.addEventListener('click', function() { m.__edit = b.getAttribute('data-edit'); hRenderEmp(m, id); }); });
  box.querySelectorAll('[data-secsave]').forEach(function(b) {
    b.addEventListener('click', async function() {
      const key = b.getAttribute('data-secsave'), spec = { main: H_MAIN, mot: H_MOT, wp: H_WP, mil: H_MIL, pers: H_PERSONAL, file: H_FILE }[key];
      let vals = hRead(box.querySelector('[data-sec="' + key + '"]'), spec);
      if (typeof vals === 'string') { hToast(vals); return; }
      if (key === 'wp') {
        if ((vals.wp_assessment || vals.wp_assessment_result) && !vals.wp_consent_on) { hToast('Результат формальной оценки — только с письменным согласием сотрудника: укажите дату согласия'); return; }
        vals.wp_reviewed_on = hToday();
      }
      b.disabled = true;
      try {
        if (key === 'main') await ctx.api.resource('crm_employees').update({ filterByTk: id, values: hEmpVals(vals) });
        else if (hPriv(id)) await ctx.api.resource('crm_hr_private').update({ filterByTk: hPriv(id).id, values: vals });
        else { vals.employee_id = id; await ctx.api.resource('crm_hr_private').create({ values: vals }); }
        m.__edit = '';
        await hReload(); hRenderEmp(m, id); hToast('Сохранено');
      } catch (err) { hToast('Не удалось сохранить'); b.disabled = false; }
    });
  });
  box.querySelectorAll('[data-ack]').forEach(function(b) {
    b.addEventListener('click', async function() {
      const l = hr.d.lna.find(function(x) { return x.id === Number(b.getAttribute('data-ack')); });
      const acks = Object.assign({}, l.acks || {}); acks[id] = t;
      try { await ctx.api.resource('crm_lna').update({ filterByTk: l.id, values: { acks: acks } }); await hReload(); hRenderEmp(m, id); } catch (err) { hToast('Не удалось сохранить'); }
    });
  });
  box.querySelectorAll('[data-rec]').forEach(function(r) {
    r.addEventListener('click', function() {
      const k = r.getAttribute('data-rec'), i = k.indexOf(':'), typ = k.slice(0, i), val = k.slice(i + 1);
      const back = function() { if (document.body.contains(m)) hRenderEmp(m, id); };
      if (typ === 'vac') { if (can) hOpenVac(hr.d.vacs.find(function(x) { return x.id === Number(val); }), null, back); }
      else if (typ === 'cell') { if (can) hOpenSafetyCell(id, val, back); }
      else if (typ === 'ev') { if (can) hOpenEvent(hr.d.events.find(function(x) { return x.id === Number(val); }), back); }
      else if (typ === 'prog') hOpenProg(hr.d.progs.find(function(x) { return x.id === Number(val); }));
    });
  });
  box.querySelectorAll('[data-task]').forEach(function(r) { r.addEventListener('click', function() { location.href = HR_TASKS_PAGE + '?open=task:' + r.getAttribute('data-task'); }); });
  box.querySelectorAll('[data-fdoc]').forEach(function(inp) {
    inp.addEventListener('change', async function(ev) {
      const files = Array.prototype.slice.call(ev.target.files || []), doc = inp.getAttribute('data-fdoc'); ev.target.value = '';
      if (!files.length) return;
      const n = await hAttach(files, 'emp', id, doc, m);
      const pr = hPriv(id), docs = ((pr && pr.file_docs) || []).slice();
      if (n && docs.indexOf(doc) === -1) {   // загруженный документ — отмечен в личном деле
        docs.push(doc);
        try { if (pr) await ctx.api.resource('crm_hr_private').update({ filterByTk: pr.id, values: { file_docs: docs } }); else await ctx.api.resource('crm_hr_private').create({ values: { employee_id: id, file_docs: docs } }); } catch (err) { /* файл уже загружен */ }
      }
      await hReload(); hRenderEmp(m, id); if (n) hToast('Загружено: ' + doc);
    });
  });
  box.querySelectorAll('[data-fdel-emp]').forEach(function(b) {
    b.addEventListener('click', async function() {
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Открепить?'; return; }
      try { await ctx.api.resource('crm_hr_files').destroy({ filterByTk: Number(b.getAttribute('data-fdel-emp')) }); await hLoadFiles(); hRenderEmp(m, id); } catch (err) { hToast('Не удалось открепить'); }
    });
  });
  if (can) hWireFiles(m, 'emp', function() { return id; });
  const nv = box.querySelector('[data-newvac]');
  if (nv) nv.addEventListener('click', function() { hOpenVac(null, { employee_id: id }, function() { hRenderEmp(m, id); }); });
}

// ---------- отпуска ----------
function hVacDays(v) { return hDays(v.start_date, v.end_date) + 1; }
function hOpenVac(v, preset, after) {
  if (!hCan()) { if (v) hOpenEmp(v.employee_id); return; }
  hEdit({ coll: 'crm_vacations', rec: v, files: 'vac', preset: Object.assign({ kind: HR_VAC_KINDS[0], status: 'plan' }, preset || {}), spec: H_VAC,
    title: v ? 'Отпуск: ' + ((hEmp(v.employee_id) || {}).full_name || '') : 'Новый отпуск',
    extra: function() { return '<div class="hr-hint" data-vd style="margin-top:8px;"></div>'; },
    wire: function(m) {
      const upd = function() {
        const s = m.querySelector('[data-v="start_date"]').value, en = m.querySelector('[data-v="end_date"]').value, e = hEmp(m.querySelector('[data-v="employee_id"]').value);
        const n = s && en ? hDays(s, en) + 1 : 0;
        m.querySelector('[data-vd]').innerHTML = n > 0 ? n + ' ' + hNoun(n, 'календарный день', 'календарных дня', 'календарных дней') + (e ? ' · осталось у сотрудника в ' + s.slice(0, 4) + ': ' + hVacLeft(e, s.slice(0, 4)) + ' дн. (без учёта этого отпуска' + (v ? ' и с его прежней длиной' : '') + ')' : '') : '';
      };
      const sch = function() { m.querySelector('[data-fk="in_schedule"]').style.display = m.querySelector('[data-v="kind"]').value === HR_VAC_KINDS[0] ? '' : 'none'; };
      m.querySelectorAll('[data-v]').forEach(function(x) { x.addEventListener('change', upd); x.addEventListener('change', sch); });
      upd(); sch();
    },
    prepare: function(vals) {
      if (vals.end_date < vals.start_date) return 'Окончание раньше начала';
      vals.days = hVacDays(vals);
      // график на год утверждается до 17 декабря: отпуск текущего года, добавленный сейчас, — скорее всего внеплановый
      if (vals.kind !== HR_VAC_KINDS[0]) vals.in_schedule = null;
      else if (!vals.in_schedule) vals.in_schedule = Number(vals.start_date.slice(0, 4)) > new Date().getFullYear() ? 'yes' : 'no';
      const clash = hr.d.vacs.find(function(x) { return Number(x.employee_id) === Number(vals.employee_id) && (!v || x.id !== v.id) && hD(x.start_date) <= vals.end_date && hD(x.end_date) >= vals.start_date; });
      if (clash) return 'Пересекается с отпуском ' + hDate(clash.start_date) + ' – ' + hDate(clash.end_date);
      return vals;
    }, after: after });
}
function hRenderVac() {
  const y = hr.year, diy = hDays(y + '-01-01', (y + 1) + '-01-01'), t = hToday(), can = hCan();
  const mw = HR_MONTHS.map(function(x, i) { return hDays(hIso(new Date(y, i, 1)), hIso(new Date(y, i + 1, 1))) / diy * 100; });
  const bg = mw.map(function(w, i) { return '<i style="width:' + w + '%;"' + (i % 2 ? ' class="odd"' : '') + '></i>'; }).join('');
  const people = hStaff().sort(function(a, b) { return String(a.department || 'я').localeCompare(String(b.department || 'я'), 'ru') || String(a.full_name).localeCompare(String(b.full_name), 'ru'); });
  const ys = y + '-01-01', ye = y + '-12-31';
  let lastDept = null;
  const rows = people.map(function(e) {
    const bars = hr.d.vacs.filter(function(v) { return Number(v.employee_id) === e.id && hD(v.start_date) <= ye && hD(v.end_date) >= ys; }).map(function(v) {
      const s = Math.max(0, hDays(ys, v.start_date)), en = Math.min(diy - 1, hDays(ys, v.end_date));
      const demo = String(v.note || '').indexOf('ДЕМО') === 0, cls = hVacCls(v) + (v.status === 'plan' ? ' draft' : '') + (demo ? ' demo' : '');
      return '<span class="hr-vb ' + cls + '" data-vac="' + v.id + '" title="' + hEsc(hDate(v.start_date) + ' – ' + hDate(v.end_date) + ', ' + v.days + ' дн. · ' + HR_VAC_CLS[hVacCls(v)] + (hVacCls(v) === 'other' ? ' (' + v.kind + ')' : '') + ' · ' + (HR_VAC_ST[v.status] || '') + (demo ? ' · ДЕМО' : '')) + '" style="left:' + (s / diy * 100) + '%;width:' + ((en - s + 1) / diy * 100) + '%;">' + (en - s >= 6 ? v.days : '') + '</span>';
    }).join('');
    const now = t.slice(0, 4) === String(y) ? '<span class="hr-now" style="left:' + (hDays(ys, t) / diy * 100) + '%;"></span>' : '';
    const left = hVacLeft(e, y);
    const grp = e.department !== lastDept ? '<tr><td colspan="3" style="font-weight:600;padding-top:12px;">' + hEsc(e.department || 'Без отдела') + '</td></tr>' : '';
    lastDept = e.department;
    return grp + '<tr><td class="nm" data-emp="' + e.id + '">' + hEsc(e.full_name) + '</td><td><div class="hr-track"' + (can ? ' data-track="' + e.id + '"' : '') + '>' + bg + bars + now + '</div></td>'
      + '<td class="rest' + (left < 0 ? ' hr-late' : left > 0 && y <= new Date().getFullYear() ? '' : ' hr-ok') + '" title="осталось из ' + (e.vacation_days || 28) + '">' + left + ' дн.</td></tr>';
  }).join('');
  hBody().innerHTML = '<div class="hr-bar"><button class="hr-btn" data-act="year" data-d="-1">‹</button><b style="font-size:16px;">' + y + '</b><button class="hr-btn" data-act="year" data-d="1">›</button>'
    + '<div class="hr-legend" style="margin-left:12px;">' + ['sched', 'unsched', 'unpaid', 'other'].map(function(k) { return '<span><i class="hr-vb ' + k + '" style="position:static;display:inline-block;height:10px;"></i>' + HR_VAC_CLS[k] + '</span>'; }).join('')
      + '<span><i class="hr-vb sched draft" style="position:static;display:inline-block;height:10px;"></i>бледная — приказа ещё нет</span><span><i style="background:#cf1322;width:2px;"></i>сегодня</span></div>'
    + (can ? '<button class="hr-new" data-act="newvac"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Отпуск</button>' : '') + '</div>'
    + (can ? '<div class="hr-hint" style="margin-bottom:8px;">Нажмите на пустое место в строке сотрудника — откроется новый отпуск с этой даты. Нажмите на отпуск — изменить. Справа — сколько дней ежегодного отпуска осталось запланировать.</div>' : '')
    + (function() {   // итог года по видам: сколько дней и у скольких людей
        const yv = hr.d.vacs.filter(function(v) { const e = hEmp(v.employee_id); return e && e.status !== 'fired' && hD(v.start_date).slice(0, 4) === String(y); });
        return '<div class="hr-tiles">' + ['sched', 'unsched', 'unpaid', 'other'].map(function(k) {
          const l = yv.filter(function(v) { return hVacCls(v) === k; }), dd = l.reduce(function(n, v) { return n + (Number(v.days) || 0); }, 0);
          const ppl = l.map(function(v) { return v.employee_id; }).filter(function(x, i, a) { return a.indexOf(x) === i; }).length;
          return '<div class="hr-tile"><div class="hr-tile-l"><i class="hr-vb ' + k + '" style="position:static;display:inline-block;width:10px;height:10px;margin-right:6px;"></i>' + HR_VAC_CLS[k] + '</div><div class="hr-tile-v">' + dd + ' <small style="font-size:13px;font-weight:400;">дн.</small></div><div class="hr-tile-n">' + (ppl ? hPeople(ppl) + ', ' + l.length + ' ' + hNoun(l.length, 'отпуск', 'отпуска', 'отпусков') : 'нет') + '</div></div>';
        }).join('') + '</div>';
      })()
    + '<div class="hr-card"><table class="hr-tl"><thead><tr><td class="nm"></td><td><div class="hr-months">' + HR_MONTHS.map(function(x, i) { return '<i style="width:' + mw[i] + '%;">' + x + '</i>'; }).join('') + '</div></td><td class="rest hr-hint">осталось</td></tr></thead><tbody>'
    + (rows || '<tr><td colspan="3" class="hr-hint">Нет штатных сотрудников</td></tr>') + '</tbody></table></div>'
    + '<div class="hr-hint">В графике — только штатные сотрудники. Праздничные дни в длительность отпуска не пересчитываются.</div>';
}

// ---------- охрана труда: инструктажи (матрица), пожарная безопасность, СОУТ ----------
function hOpenSafetyCell(empId, kind, after) {
  const hist = hr.d.safety.filter(function(s) { return Number(s.employee_id) === empId && s.kind === kind; }).sort(function(a, b) { return hD(b.done_on).localeCompare(hD(a.done_on)); });
  const e = hEmp(empId);
  hOpenSafety(null, { employee_id: empId, kind: kind, done_on: hToday() }, after,
    (e ? e.full_name + ': ' : '') + kind,
    hist.length ? '<div style="margin-top:14px;"><b style="font-size:13.5px;">История</b><div class="hr-lines">' + hist.map(function(s) {
      return '<div data-srec="' + s.id + '" style="cursor:pointer;"><span>' + hDate(s.done_on) + (s.doc ? ' · ' + hEsc(s.doc) : '') + '</span><span class="hr-hint">' + (s.next_on ? 'следующее ' + hDate(s.next_on) : '') + '</span></div>';
    }).join('') + '</div></div>' : '');
}
function hOpenSafety(s, preset, after, title, extraHtml) {
  const m = hEdit({ coll: 'crm_safety', rec: s, files: 'safety', preset: preset, spec: H_SAFETY, title: title || (s ? s.kind : 'Новая запись'),
    extra: function() { return extraHtml || ''; },
    prepare: function(v) {
      const k = HR_SAFETY.find(function(x) { return x[0] === v.kind; }) || HR_PB_COMMON.find(function(x) { return x[0] === v.kind; });
      v.area = (k && k[1] === 'ot') ? 'ot' : 'pb';
      const months = k ? (k.length === 2 ? k[1] : k[2]) : 0;
      if (!v.next_on && months) v.next_on = hAddMonths(v.done_on, months);
      return v;
    }, after: after });
  m.querySelectorAll('[data-srec]').forEach(function(r) { r.addEventListener('click', function() { m.remove(); hOpenSafety(hr.d.safety.find(function(x) { return x.id === Number(r.getAttribute('data-srec')); }), null, after); }); });
}
function hOpenSout(s) {
  hEdit({ coll: 'crm_sout', rec: s, files: 'sout', spec: H_SOUT, title: s ? 'СОУТ: ' + s.workplace : 'Новое рабочее место (СОУТ)',
    extra: function(r) {
      const who = r ? hActive().filter(function(e) { return Number(e.sout_id) === r.id; }) : [];
      return r ? '<div class="hr-hint" style="margin-top:10px;">На этом рабочем месте: ' + (who.length ? hEsc(who.map(function(e) { return e.full_name; }).join(', ')) : 'никто не указан') + '. Привязка — в карточке сотрудника.</div>' : '';
    },
    prepare: function(v) { if (!v.next_on && v.assessed_on) v.next_on = hAddMonths(v.assessed_on, 60); return v; } });
}
function hRenderSafety() {
  const d = hr.d, t = hToday();
  const people = hStaff().filter(function(e) { return !hr.mxLe || hInLe(e, hr.mxLe); });
  const cell = function(e, k) {
    const r = hSafetyLast(e.id, k[0]);
    if (!r) return '<td class="c hr-none" data-cell="' + e.id + '|' + hEsc(k[0]) + '">—</td>';
    const s = hDue(r.next_on);
    return '<td class="c hr-' + s + '" data-cell="' + e.id + '|' + hEsc(k[0]) + '" title="проведено ' + hDate(r.done_on) + '">' + (r.next_on ? (s === 'late' ? '⚠ ' : '') + hDate(r.next_on) : '✓ ' + hDate(r.done_on)) + '</td>';
  };
  const common = {};
  d.safety.filter(function(s) { return !s.employee_id; }).forEach(function(s) { if (!common[s.kind] || hD(s.done_on) >= hD(common[s.kind].done_on)) common[s.kind] = s; });
  const ck = Object.keys(common).sort();
  hBody().innerHTML = '<div class="hr-card"><div class="hr-card-t">Обучение и инструктажи по ОТ и ПБ <small>штатные сотрудники</small>'
    + (d.les.length ? '<select data-f="mxLe" style="margin-left:auto;font-weight:400;"><option value="">Все юрлица</option>' + d.les.map(function(l) { return '<option value="' + l.id + '"' + (hr.mxLe === String(l.id) ? ' selected' : '') + '>' + hEsc(l.name) + '</option>'; }).join('') + '</select>' : '') + '</div>'
    + '<div class="hr-legend" style="margin-bottom:8px;"><span class="hr-ok">дата — когда следующее</span><span class="hr-soon">меньше 30 дней</span><span class="hr-late">⚠ просрочено</span><span class="hr-ok">✓ — однократное, проведено</span><span class="hr-none">— нет записи</span></div>'
    + '<table class="hr-mx"><thead><tr><th>Сотрудник</th>' + HR_SAFETY.map(function(k) { return '<th class="c" title="' + hEsc(k[0] + (k[2] ? ', раз в ' + k[2] + ' мес.' : ', однократно')) + '">' + hEsc(k[3]) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + people.map(function(e) { return '<tr><td class="nm" data-emp="' + e.id + '" style="cursor:pointer;white-space:nowrap;">' + hEsc(e.full_name) + '</td>' + HR_SAFETY.map(function(k) { return cell(e, k); }).join('') + '</tr>'; }).join('')
    + '</tbody></table><div class="hr-hint">Нажмите на ячейку — отметить проведение (дата следующего посчитается по типовому периоду) или посмотреть историю.</div></div>'
    + '<div class="hr-cols"><div class="hr-card"><div class="hr-card-t">Пожарная безопасность: общие мероприятия<button class="hr-btn sm" data-act="newpb"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Запись</button></div>'
    + (ck.length ? '<table><thead><tr><th>Что</th><th>Проведено</th><th>Следующее</th></tr></thead><tbody>' + ck.map(function(k) {
        const s = common[k], st = s.next_on ? hDue(s.next_on) : 'ok';
        return '<tr data-rec="safety:' + s.id + '"><td>' + hEsc(k) + (s.doc ? '<div class="hr-hint">' + hEsc(s.doc) + '</div>' : '') + '</td><td>' + hDate(s.done_on) + '</td><td class="hr-' + st + '">' + (hDate(s.next_on) || '—') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="hr-hint">Нет записей. Например: проверка огнетушителей, тренировка по эвакуации, проверка пожарной сигнализации.</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">СОУТ — специальная оценка условий труда<button class="hr-btn sm" data-act="newsout"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Рабочее место</button></div>'
    + '<div class="hr-hint" style="margin:-4px 0 8px;">Оценка каждого рабочего места раз в 5 лет; класс условий: 1–2 допустимые, 3.1–4 вредные и опасные (доплаты, доп. отпуск).</div>'
    + (d.sout.length ? '<table><thead><tr><th>Рабочее место</th><th>Класс</th><th class="n">Людей</th><th>Следующая</th></tr></thead><tbody>' + d.sout.map(function(s) {
        const c = HR_SOUT_CLS[s.work_class] || '#8c8c8c', n = hActive().filter(function(e) { return Number(e.sout_id) === s.id; }).length;
        const st = s.next_on ? (hD(s.next_on) < t ? 'late' : hDays(t, s.next_on) <= 180 ? 'soon' : 'ok') : 'none';
        return '<tr data-rec="sout:' + s.id + '"><td>' + hEsc(s.workplace) + (hLe(s.legal_entity_id) ? '<div class="hr-hint">' + hEsc(hLe(s.legal_entity_id).name) + '</div>' : '') + '</td><td>' + (s.work_class ? '<span class="hr-cls" style="background:' + c + '22;color:' + c + ';">' + hEsc(s.work_class) + '</span>' : '—') + '</td><td class="n">' + n + '</td><td class="hr-' + st + '">' + (hDate(s.next_on) || '—') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="hr-hint">Рабочие места не заведены.</div>') + '</div></div>';
}

// ---------- документы и программы: ЛНА, мотивационные программы, мероприятия ----------
function hOpenLna(l) {
  let fileId = l ? l.file_id : null;
  hEdit({ coll: 'crm_lna', files: 'lna', rec: l ? Object.assign({}, l, { need_ack: l.need_ack ? '1' : '0' }) : null, preset: { need_ack: '1' }, spec: H_LNA, title: l ? l.title : 'Новый документ (ЛНА)', wide: true,
    extra: function() {
      const who = l ? hLnaFor(l) : hStaff();
      return '<div class="hr-actions" style="margin-top:12px;"><span class="hr-hint" style="margin:0;" data-fname>' + (l && l.file ? 'Файл: ' + hFileA(l.file, hEsc(l.file.title || l.file.filename || 'открыть')) : 'Файл не прикреплён') + '</span>'
        + '<label class="hr-btn sm" style="cursor:pointer;">Прикрепить файл<input type="file" data-file style="display:none;"></label></div>'
        + hPicker(who, function(e) { return ((l && l.acks) || {})[e.id] || false; }, true);
    },
    wire: function(m) {
      hWirePicker(m);
      m.querySelector('[data-file]').addEventListener('change', async function(ev) {
        const f = ev.target.files[0]; if (!f) return;
        m.querySelector('[data-fname]').textContent = 'Загружаю…';
        try { fileId = (await hUpload(f)).id; m.querySelector('[data-fname]').textContent = 'Файл: ' + f.name; } catch (err) { m.querySelector('[data-fname]').textContent = 'Не удалось загрузить файл'; }
      });
    },
    prepare: function(v, m) {
      v.need_ack = v.need_ack !== '0';
      v.file_id = fileId || null;
      const old = (l && l.acks) || {}, acks = {};
      hPicked(m).forEach(function(id) { acks[id] = old[id] || hToday(); });
      v.acks = acks;
      return v;
    } });
}
function hOpenProg(p) {
  hEdit({ coll: 'crm_hr_programs', rec: p, files: 'prog', spec: H_PROG, title: p ? p.title : 'Новая мотивационная программа',
    extra: function(r) {
      if (!r) return '';
      const who = (hr.d.priv || []).filter(function(x) { return Number(x.program_id) === r.id; }).map(function(x) { return hEmp(x.employee_id); }).filter(Boolean);
      return '<div class="hr-hint" style="margin-top:10px;">Участники: ' + (who.length ? hEsc(who.map(function(e) { return e.full_name; }).join(', ')) : 'пока нет') + '. Программа назначается в карточке сотрудника, раздел «Мотивация».</div>';
    } });
}
function hOpenEvent(x, after) {
  hEdit({ coll: 'crm_hr_events', rec: x, files: 'event', spec: H_EVENT, title: x ? x.title : 'Новое мероприятие', wide: true,
    extra: function() { return hPicker(hActive(), function(e) { return ((x && x.participants) || []).indexOf(e.id) !== -1; }); },
    wire: hWirePicker,
    prepare: function(v, m) { v.participants = hPicked(m); return v; }, after: after });
}
function hRenderDocs() {
  const d = hr.d, t = hToday();
  const lnaRows = d.lna.map(function(l) {
    const all = hLnaFor(l).length, miss = hLnaMissing(l).length;
    return '<tr data-rec="lna:' + l.id + '"><td>' + hEsc(l.title) + '<div class="hr-hint">' + hEsc([l.kind, hLe(l.legal_entity_id) ? hLe(l.legal_entity_id).name : 'все юрлица'].filter(Boolean).join(' · ')) + '</div></td>'
      + '<td>' + hEsc([l.number ? '№ ' + l.number : '', l.approved_on ? 'от ' + hDate(l.approved_on) : ''].filter(Boolean).join(' ')) + '</td>'
      + '<td class="' + (l.review_on && hD(l.review_on) < t ? 'hr-late' : '') + '">' + (hDate(l.review_on) || '—') + '</td>'
      + '<td class="n ' + (miss ? 'hr-soon' : 'hr-ok') + '">' + (l.need_ack ? (all - miss) + ' из ' + all : 'не нужно') + '</td>'
      + '<td>' + (l.file ? hFileA(l.file, '📄 файл') : '') + '</td></tr>';
  }).join('');
  const progCount = function(p) { return (d.priv || []).filter(function(x) { return Number(x.program_id) === p.id && hEmp(x.employee_id) && hEmp(x.employee_id).status !== 'fired'; }).length; };
  const up = d.events.filter(function(x) { return hD(x.event_date) >= t; }).reverse(), past = d.events.filter(function(x) { return hD(x.event_date) < t; });
  const evRow = function(x) { return '<tr data-rec="ev:' + x.id + '"><td>' + hDate(x.event_date) + '</td><td>' + hEsc(x.title) + '<div class="hr-hint">' + hEsc([x.kind, x.place].filter(Boolean).join(' · ')) + '</div></td><td class="n">' + (x.participants || []).length + '</td><td class="n">' + (x.budget ? Number(x.budget).toLocaleString('ru-RU') + ' ₽' : '') + '</td></tr>'; };
  hBody().innerHTML = '<div class="hr-card"><div class="hr-card-t">Локальные нормативные акты<button class="hr-btn sm" data-act="newlna"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Документ</button></div>'
    + (lnaRows ? '<table><thead><tr><th>Документ</th><th>Приказ</th><th>Пересмотр</th><th class="n">Ознакомлены</th><th></th></tr></thead><tbody>' + lnaRows + '</tbody></table>'
      : '<div class="hr-hint">Документов нет. Обычно это правила внутреннего трудового распорядка, положения об оплате труда и премировании, о персональных данных, инструкции по охране труда и пожарной безопасности.</div>') + '</div>'
    + '<div class="hr-cols"><div class="hr-card"><div class="hr-card-t">Корпоративные мероприятия и тимбилдинги<button class="hr-btn sm" data-act="newev"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Мероприятие</button></div>'
    + (d.events.length ? '<table><thead><tr><th>Дата</th><th>Мероприятие</th><th class="n">Участников</th><th class="n">Бюджет</th></tr></thead><tbody>'
        + (up.length ? '<tr><td colspan="4" class="hr-hint" style="font-weight:600;">Впереди</td></tr>' + up.map(evRow).join('') : '')
        + (past.length ? '<tr><td colspan="4" class="hr-hint" style="font-weight:600;">Прошедшие</td></tr>' + past.map(evRow).join('') : '') + '</tbody></table>'
      : '<div class="hr-hint">Мероприятий пока нет.</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">Мотивационные программы<button class="hr-btn sm" data-act="newprog"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Программа</button></div>'
    + (d.progs.length ? '<div class="hr-lines">' + d.progs.map(function(p) {
        const on = (!p.end_on || hD(p.end_on) >= t);
        return '<div data-rec="prog:' + p.id + '" style="cursor:pointer;"><span><b>' + hEsc(p.title) + '</b><div class="hr-hint">' + hEsc([p.kind, p.start_on || p.end_on ? (hDate(p.start_on) || '…') + ' – ' + (hDate(p.end_on) || 'бессрочно') : ''].filter(Boolean).join(' · ')) + '</div></span>'
          + '<span class="hr-chip' + (on ? ' green' : '') + '">' + progCount(p) + ' чел.</span></div>';
      }).join('') + '</div>' : '<div class="hr-hint">Программ пока нет. У каждого сотрудника в карточке → «Мотивация» указывается его программа и что его мотивирует.</div>') + '</div></div>';
}

// ---------- подбор и штат: воронка кандидатов, вакансии, штатное расписание ----------
function hVacancy(id) { return hr.d.vacancies.find(function(v) { return v.id === Number(id); }) || null; }
function hNorm(x) { return String(x || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); }
// занятые ставки позиции = работающие штатные сотрудники того же юрлица с той же должностью (совпадение текста без учёта регистра)
function hPosPeople(p) { return hStaff().filter(function(e) { return hInLe(e, p.legal_entity_id) && hNorm(e.position) === hNorm(p.position); }); }
function hPosFree(p) { return (Number(p.units) || 0) - hPosPeople(p).reduce(function(n, e) { return n + (Number(e.rate) || 1); }, 0); }
function hRub(v) { return v ? Number(v).toLocaleString('ru-RU') + ' ₽' : ''; }
function hCandLine(c) {
  const v = hVacancy(c.vacancy_id);
  return '<b>' + hEsc(c.full_name) + '</b>' + (v ? '<div class="hr-hint" style="margin:0;">' + hEsc(v.title) + '</div>' : '')
    + (c.stage === 'interview' && c.interview_on ? '<div class="hr-hint" style="margin:0;">📅 ' + hDate(c.interview_on).slice(0, 5) + (c.interview_time ? ' ' + hEsc(c.interview_time) : '') + '</div>' : '')
    + (c.stage === 'offer' && c.offer_on ? '<div class="hr-hint" style="margin:0;">оффер ' + hDate(c.offer_on).slice(0, 5) + (c.start_on ? ' · выход ' + hDate(c.start_on).slice(0, 5) : '') + '</div>' : '')
    + (c.rating ? '<div class="hr-hint" style="margin:0;">' + '★'.repeat(Number(c.rating)) + '</div>' : '')
    + (function() { const x = Object.values(c.comp_scores || {}); return x.length ? '<div class="hr-hint" style="margin:0;">компетенции ' + (x.reduce(function(a, b) { return a + b; }, 0) / x.length).toFixed(1) + ' из 5</div>' : ''; })();
}
function hRenderHire() {
  const d = hr.d, t = hToday(), v = hr.hireView;
  const seg = '<span class="hr-seg">' + [['funnel', 'Кандидаты'], ['vac', 'Вакансии'], ['pos', 'Штатное расписание']].map(function(x) { return '<button data-act="hv" data-v="' + x[0] + '" class="' + (v === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</span>';
  const btn = { funnel: ['newcand', '<svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Кандидат'], vac: ['newvacancy', '<svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Вакансия'], pos: ['newpos', '<svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Должность'] }[v];
  let body = '';
  if (v === 'funnel') {
    const vsel = '<select data-f="hireVac"><option value="">Все вакансии</option>' + d.vacancies.filter(function(x) { return x.status === 'open' || x.status === 'paused' || String(x.id) === hr.hireVac; })
      .map(function(x) { return '<option value="' + x.id + '"' + (String(x.id) === hr.hireVac ? ' selected' : '') + '>' + hEsc(x.title) + '</option>'; }).join('') + '</select>';
    const list = d.cands.filter(function(c) { return !hr.hireVac || String(c.vacancy_id) === hr.hireVac; });
    const week = list.filter(function(c) { return c.stage === 'interview' && c.interview_on && hDays(t, c.interview_on) >= 0 && hDays(t, c.interview_on) <= 7; });
    const col = function(st, items) {
      return '<div class="hr-kb-col"><div class="hr-kb-h">' + HR_STAGES[st] + ' <span>' + items.length + '</span></div>'
        + items.map(function(c) { return '<div class="hr-kb-c" data-rec="cand:' + c.id + '">' + hCandLine(c) + '</div>'; }).join('') + '</div>';
    };
    const recent = function(c) { return hDays(c.updatedAt || c.createdAt || t, t) <= 30; };   // вышедшие и отказы — за последний месяц
    const by = function(st) { return list.filter(function(c) { return c.stage === st; }); };
    const closed = list.filter(function(c) { return (c.stage === 'rejected' || c.stage === 'declined'); });
    body = '<div class="hr-bar">' + vsel + '</div>'
      + (week.length ? '<div class="hr-card"><div class="hr-card-t">Собеседования на неделе <small>' + week.length + '</small></div><div class="hr-lines">'
        + week.map(function(c) { return '<div data-rec="cand:' + c.id + '"><span>' + hEsc(c.full_name) + ' <span class="hr-hint">' + hEsc((hVacancy(c.vacancy_id) || {}).title || '') + '</span></span><span>' + hDate(c.interview_on).slice(0, 5) + (c.interview_time ? ' ' + hEsc(c.interview_time) : '') + '</span></div>'; }).join('') + '</div></div>' : '')
      + '<div class="hr-kb">' + col('new', by('new')) + col('interview', by('interview')) + col('offer', by('offer')) + col('hired', by('hired').filter(recent)) + '</div>'
      + (closed.length ? '<div class="hr-card" style="margin-top:12px;"><div class="hr-card-t">Отказы <small>' + closed.length + '</small></div><div class="hr-lines">'
        + closed.map(function(c) { return '<div data-rec="cand:' + c.id + '"><span>' + hEsc(c.full_name) + ' <span class="hr-hint">' + hEsc((hVacancy(c.vacancy_id) || {}).title || '') + '</span></span><span class="hr-hint">' + HR_STAGES[c.stage] + (c.reject_reason ? ': ' + hEsc(c.reject_reason) : '') + '</span></div>'; }).join('') + '</div></div>' : '')
      + (d.cands.length ? '' : '<div class="hr-hint" style="margin-top:8px;">Кандидатов пока нет. Добавьте вакансию, затем кандидатов с резюме — резюме прикрепляется в карточке кандидата.</div>');
  } else if (v === 'vac') {
    const row = function(x) {
      const cs = d.cands.filter(function(c) { return c.vacancy_id === x.id; }), n = function(st) { return cs.filter(function(c) { return c.stage === st; }).length; };
      const age = x.opened_on ? hDays(x.opened_on, x.closed_on || t) : null, late = x.status === 'open' && x.due_on && hD(x.due_on) < t;
      return '<tr data-rec="vacancy:' + x.id + '"><td><b>' + hEsc(x.title) + '</b><div class="hr-hint">' + hEsc([hLe(x.legal_entity_id) ? hLe(x.legal_entity_id).name : '', x.department, x.object_name].filter(Boolean).join(' · ')) + '</div></td>'
        + '<td>' + (hDate(x.opened_on) || '—') + (age !== null ? '<div class="hr-hint">' + age + ' дн.</div>' : '') + '</td><td class="' + (late ? 'hr-late' : '') + '">' + (hDate(x.due_on) || '—') + '</td>'
        + '<td class="n">' + cs.length + '</td><td class="n">' + n('interview') + '</td><td class="n">' + n('offer') + '</td>'
        + '<td><span class="hr-chip ' + ({ open: 'blue', paused: 'orange', closed: 'green' }[x.status] || '') + '">' + hEsc(HR_VACANCY_ST[x.status] || x.status || '') + '</span></td></tr>';
    };
    const act = d.vacancies.filter(function(x) { return x.status === 'open' || x.status === 'paused'; }), done = d.vacancies.filter(function(x) { return x.status !== 'open' && x.status !== 'paused'; });
    const head = '<table><thead><tr><th>Вакансия</th><th>Открыта</th><th>Закрыть до</th><th class="n">Кандидатов</th><th class="n">На собес.</th><th class="n">Оффер</th><th></th></tr></thead><tbody>';
    body = '<div class="hr-card">' + (act.length ? head + act.map(row).join('') + '</tbody></table>' : '<div class="hr-hint">Открытых вакансий нет.</div>') + '</div>'
      + (done.length ? '<div class="hr-card"><div class="hr-card-t">Закрытые и отменённые <small>' + done.length + '</small></div>' + head + done.map(row).join('') + '</tbody></table></div>' : '');
  } else {
    const y = hr.year;
    const groups = d.les.map(function(l) { return [l, d.pos.filter(function(p) { return Number(p.legal_entity_id) === l.id; })]; }).filter(function(g) { return g[1].length; });
    const tbl = groups.map(function(g) {
      const l = g[0], ps = g[1], units = ps.reduce(function(n, p) { return n + (Number(p.units) || 0); }, 0), fund = ps.reduce(function(n, p) { return n + (Number(p.units) || 0) * (Number(p.salary) || 0); }, 0);
      const known = ps.map(function(p) { return hNorm(p.position); });
      const extra = hStaff().filter(function(e) { return hInLe(e, l.id) && known.indexOf(hNorm(e.position)) === -1; });
      return '<div class="hr-card"><div class="hr-card-t">' + hEsc(l.name) + ' <small>' + units + ' ' + hNoun(units, 'ставка', 'ставки', 'ставок') + (fund ? ' · ФОТ по окладам ' + hRub(fund) + ' в мес.' : '') + '</small></div>'
        + '<table><thead><tr><th>Подразделение</th><th>Должность</th><th class="n">Ставок</th><th class="n">Оклад</th><th>Занято</th><th class="n">Свободно</th><th></th></tr></thead><tbody>'
        + ps.map(function(p) {
            const ppl = hPosPeople(p), free = hPosFree(p), vac = d.vacancies.find(function(v) { return v.status === 'open' && Number(v.position_id) === p.id; });
            return '<tr data-rec="pos:' + p.id + '"><td>' + hEsc(p.department || '') + '</td><td>' + hEsc(p.position) + '</td><td class="n">' + (p.units || 0) + '</td><td class="n">' + hRub(p.salary) + '</td>'
              + '<td>' + ppl.map(function(e) { return '<a data-emp="' + e.id + '" style="color:#1c2d58;cursor:pointer;">' + hEsc(e.full_name) + '</a>' + (Number(e.rate) && Number(e.rate) !== 1 ? ' (' + e.rate + ')' : ''); }).join(', ') + '</td>'
              + '<td class="n ' + (free > 0 ? 'hr-soon' : free < 0 ? 'hr-late' : 'hr-ok') + '">' + (free > 0 ? free : free < 0 ? 'сверх ' + (-free) : '—') + '</td>'
              + '<td>' + (free > 0 ? (vac ? '<a data-go="' + hEsc(JSON.stringify({ vacancy: vac.id })) + '" class="hr-chip blue" style="cursor:pointer;">вакансия открыта</a>' : '<button class="hr-btn sm" data-act="pos2vac" data-id="' + p.id + '">Открыть вакансию</button>') : '') + '</td></tr>';
          }).join('') + '</tbody></table>'
        + (extra.length ? '<div class="hr-hint" style="margin-top:6px;">Работают, но должности нет в штатном расписании: ' + extra.map(function(e) { return '<a data-emp="' + e.id + '" style="color:#1c2d58;cursor:pointer;">' + hEsc(e.full_name) + '</a> (' + hEsc(e.position || 'должность не указана') + ')'; }).join(', ') + '</div>' : '') + '</div>';
    }).join('');
    const moves = d.les.map(function(l) {
      const inY = function(v) { return v && hD(v).slice(0, 4) === String(y); };
      const all = d.emps.filter(function(e) { return hInLe(e, l.id) && (e.employment_type || 'staff') === 'staff'; });
      const hi = all.filter(function(e) { return inY(e.hired_on); }).length, fi = all.filter(function(e) { return inY(e.fired_on); }).length;
      return hi || fi ? '<tr><td>' + hEsc(l.name) + '</td><td class="n">' + hi + '</td><td class="n">' + fi + '</td></tr>' : '';
    }).join('');
    body = (tbl || '<div class="hr-card"><div class="hr-hint">Штатное расписание пока не заведено. Добавьте должности по каждому юрлицу («+ Должность») — занятость посчитается по сотрудникам с той же должностью в этом юрлице, свободные ставки появятся в ленте «Требует внимания». PDF штатного расписания можно прикрепить к юрлицу (документ «Штатное расписание»).</div></div>')
      + '<div class="hr-card"><div class="hr-card-t">Принято и уволено (штат)<span style="margin-left:auto;display:flex;gap:6px;align-items:center;font-weight:400;"><button class="hr-btn sm" data-act="year" data-d="-1">‹</button><b>' + y + '</b><button class="hr-btn sm" data-act="year" data-d="1">›</button></span></div>'
      + (moves ? '<table><thead><tr><th>Юрлицо</th><th class="n">Принято</th><th class="n">Уволено</th></tr></thead><tbody>' + moves + '</tbody></table>' : '<div class="hr-hint">За ' + y + ' год движений нет.</div>') + '</div>';
  }
  hBody().innerHTML = '<div class="hr-bar">' + seg + '<button class="hr-new" data-act="' + btn[0] + '">' + btn[1] + '</button></div>' + body;
}
function hOpenPos(p) {
  hEdit({ coll: 'crm_staff_positions', rec: p, spec: H_POS, preset: { units: 1 }, title: p ? p.position : 'Новая должность в штатном расписании',
    extra: function(r) { return r ? '<div class="hr-hint" style="margin-top:10px;">Занято: ' + (hPosPeople(r).map(function(e) { return hEsc(e.full_name); }).join(', ') || 'никем') + '. Совпадение по юрлицу и тексту должности в карточке сотрудника.</div>' : ''; },
    prepare: function(v) { if (v.units <= 0) return 'Ставок должно быть больше нуля'; return v; } });
}
function hOpenVacancy(x, preset) {
  const m = hEdit({ coll: 'crm_vacancies', rec: x, files: 'vacancy', spec: H_VACANCY, wide: true, preset: Object.assign({ status: 'open', opened_on: hToday() }, preset || {}),
    title: x ? 'Вакансия: ' + x.title : 'Новая вакансия',
    extra: function(r) {
      if (!r) return '';
      const cs = hr.d.cands.filter(function(c) { return c.vacancy_id === r.id; });
      return '<div class="hr-actions" style="margin:14px 0 6px;"><b style="font-size:13.5px;">Кандидаты (' + cs.length + ')</b><button type="button" class="hr-btn sm" data-newcand><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Кандидат</button></div>'
        + (cs.length ? '<div class="hr-lines">' + cs.map(function(c) { return '<div data-cand="' + c.id + '" style="cursor:pointer;"><span>' + hEsc(c.full_name) + '</span><span class="hr-chip ' + HR_STAGE_C[c.stage] + '">' + hEsc(HR_STAGES[c.stage] || '') + '</span></div>'; }).join('') + '</div>' : '<div class="hr-hint">Пока нет</div>');
    },
    wire: function(mm, r) {
      if (!r) return;
      mm.querySelector('[data-newcand]').addEventListener('click', function() { mm.remove(); hOpenCand(null, { vacancy_id: r.id }); });
      mm.querySelectorAll('[data-cand]').forEach(function(el) { el.addEventListener('click', function() { mm.remove(); hOpenCand(hr.d.cands.find(function(c) { return c.id === Number(el.getAttribute('data-cand')); })); }); });
    },
    prepare: function(v) {
      if (!v.opened_on) v.opened_on = hToday();
      if (preset && preset.position_id && !x) v.position_id = preset.position_id;
      if ((v.status === 'closed' || v.status === 'cancelled') && !(x && x.closed_on)) v.closed_on = hToday();
      if (v.status === 'open' || v.status === 'paused') v.closed_on = null;
      return v;
    } });
  return m;
}
function hOpenCand(c, preset) {
  hEdit({ coll: 'crm_candidates', rec: c, files: 'cand', spec: H_CAND, wide: true, preset: Object.assign({ stage: 'new', probation: 3 }, preset || {}),
    title: c ? c.full_name : 'Новый кандидат',
    extra: function(r) {
      const sc = (r && r.comp_scores) || {};
      const comps = '<div class="hr-f full" data-fk="comps" style="margin-top:12px;"><label>Оценка по компетенциям после собеседования (1 — слабо, 5 — отлично)</label><div class="hr-form">'
        + HR_COMPS.map(function(k) { return '<div class="hr-f"><label>' + hEsc(k) + '</label><select data-comp="' + hEsc(k) + '"><option value="">—</option>' + [1, 2, 3, 4, 5].map(function(n) { return '<option' + (Number(sc[k]) === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>'; }).join('') + '</div></div>';
      if (!r) return comps + '<div class="hr-hint" style="margin-top:8px;">Резюме прикрепите ниже — сохранится вместе с кандидатом.</div>';
      const e = r.employee_id ? hEmp(r.employee_id) : null;
      return comps + '<div class="hr-actions" style="margin-top:12px;"><button type="button" class="hr-btn" data-offer>📄 Скачать оффер (Word)</button>'
        + (e ? '<button type="button" class="hr-btn" data-toemp>Карточка сотрудника →</button>' : '<button type="button" class="hr-btn" data-hire>Оформить сотрудником</button>')
        + '<span class="hr-hint" style="margin:0;">Оффер собирается из условий вакансии и этой карточки (оклад, выход, испытательный срок); в Word его можно поправить.</span></div>';
    },
    wire: function(m, r) {
      // поля по этапу: собеседование — с этапа «Собеседование», оффер и выход — с «Оффера», причина — только у отказов
      const ord = ['new', 'interview', 'offer', 'hired'], show = {
        interview_on: 1, interview_time: 1, rating: 1, offer_on: 2, offer_salary: 2, offer_salary_after: 2, probation: 2, start_on: 2 };
      const upd = function() {
        const st = m.querySelector('[data-v="stage"]').value, lvl = ord.indexOf(st), out = lvl === -1;
        Object.keys(show).forEach(function(k) { const el = m.querySelector('[data-fk="' + k + '"]'); if (el) el.style.display = (out ? 1 : lvl) >= show[k] ? '' : 'none'; });
        m.querySelector('[data-fk="reject_reason"]').style.display = out ? '' : 'none';
        m.querySelector('[data-fk="comps"]').style.display = lvl >= 1 || out ? '' : 'none';
        const o = m.querySelector('[data-offer]'), h = m.querySelector('[data-hire]');
        if (o) o.style.display = lvl >= 1 || out ? '' : 'none';
        if (h) h.style.display = lvl >= 2 ? '' : 'none';
      };
      m.querySelector('[data-v="stage"]').addEventListener('change', upd);
      upd();
      if (!r) return;
      m.querySelector('[data-offer]').addEventListener('click', function() { hOfferDoc(r); });
      const h = m.querySelector('[data-hire]'); if (h) h.addEventListener('click', function() { m.remove(); hHireCand(r); });
      const g = m.querySelector('[data-toemp]'); if (g) g.addEventListener('click', function() { m.remove(); hOpenEmp(r.employee_id); });
    },
    prepare: function(v, m) {
      if (v.stage === 'offer' && !v.offer_on) v.offer_on = hToday();
      if (v.interview_time && !/^\d{1,2}[:.]\d{2}$/.test(v.interview_time)) return 'Время собеседования — в виде 14:00';
      if (v.interview_time) v.interview_time = v.interview_time.replace('.', ':');
      v.comp_scores = {};
      m.querySelectorAll('[data-comp]').forEach(function(x) { if (x.value) v.comp_scores[x.getAttribute('data-comp')] = Number(x.value); });
      return v;
    },
    after: function(saved) { if (saved && saved.stage === 'hired' && !saved.employee_id && (!c || c.stage !== 'hired')) hHireCand(saved); } });
}
// вышел на работу → карточка сотрудника, заполненная из кандидата и вакансии; вакансия закрывается
function hHireCand(c) {
  const v = hVacancy(c.vacancy_id) || {}, n = String(c.full_name || '').trim().split(/\s+/);
  const pos = v.position_id ? hr.d.pos.find(function(p) { return p.id === Number(v.position_id); }) : null;
  hEdit({ coll: 'crm_employees', spec: H_MAIN, title: 'Оформить сотрудником: ' + c.full_name,
    preset: { last_name: n[0], first_name: n[1] || '', middle_name: n.slice(2).join(' '), position: pos ? pos.position : v.title, department: v.department, legal_entity_id: v.legal_entity_id,
      object_name: v.object_name, phone: c.phone, email: c.email, employment_type: 'staff', status: 'active', vacation_days: 28, hired_on: c.start_on || hToday() },
    prepare: function(x) { return hEmpVals(x); },
    after: async function(r) {
      if (!r || !r.id) return;
      try {
        await ctx.api.resource('crm_candidates').update({ filterByTk: c.id, values: { employee_id: r.id, stage: 'hired', start_on: r.hired_on || c.start_on } });
        if (v.id && v.status === 'open') await ctx.api.resource('crm_vacancies').update({ filterByTk: v.id, values: { status: 'closed', closed_on: hToday() } });
        await hReload();
      } catch (e) { hToast('Сотрудник создан, но кандидат не обновился'); }
      hOpenEmp(r.id);
    } });
}
// оффер — по шаблону HR (исх. письмо: должность, обязанности, место, выход, испытательный срок, оклад, режим, руководитель); .doc = HTML, Word открывает
function hOfferDoc(c) {
  const v = hVacancy(c.vacancy_id) || {}, le = hLe(v.legal_entity_id), n = String(c.full_name || '').trim().split(/\s+/);
  const io = n.slice(1).join(' ') || c.full_name, mid = n[2] || '';
  const dear = /(вна|чна|кызы)$/i.test(mid) ? 'Уважаемая' : /(вич|ич|оглы)$/i.test(mid) ? 'Уважаемый' : 'Уважаемый(ая)';
  const p = function(x) { return '<p>' + x + '</p>'; }, gap = '____________';
  const dl = function(iso) { const m = hD(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? '«' + Number(m[3]) + '» ' + ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][Number(m[2]) - 1] + ' ' + m[1] + ' г.' : gap; };
  const prob = Number(c.probation) || 3;
  const html = '<html><head><meta charset="utf-8"><style>body{font-family:"Times New Roman";font-size:12pt;} p{margin:0 0 8pt;} h3{font-size:12pt;margin:12pt 0 6pt;}</style></head><body>'
    + p('Исх. № ' + gap + ' от ' + hDate(hToday()) + ' г.') + '<p style="text-align:center;"><b>' + dear + ' ' + hEsc(io) + '!</b></p>'
    + p('Компания «' + hEsc(le ? le.name : gap) + '», ознакомившись с Вашим профессиональным опытом, выражает Вам свое уважение и высокую оценку Ваших компетенций.')
    + p('Рады предложить Вам занять позицию <b>' + hEsc(v.title || gap) + '</b>.')
    + '<h3>1. Основные условия трудового договора</h3>'
    + p('Должностные обязанности: ' + hEsc(v.duties || gap).replace(/\n/g, '<br>'))
    + p('Место работы: ' + hEsc(v.place || gap)) + p('Дата выхода на работу: ' + dl(c.start_on))
    + p('Испытательный срок: ' + prob + ' ' + hNoun(prob, 'календарный месяц', 'календарных месяца', 'календарных месяцев') + '. В течение испытательного срока условия договора, включая размер оплаты труда, действуют в полном объеме.')
    + '<h3>2. Компенсационный пакет</h3>'
    + p('Официальный оклад NET (после вычета налогов): ' + hEsc(c.offer_salary || gap) + ' рублей ежемесячно на испытательный срок' + (c.offer_salary_after ? ', после прохождения испытательного срока — ' + hEsc(c.offer_salary_after) + ' рублей на руки' : '') + '.')
    + p('Годовая премия (бонус): по итогам года по результатам выполнения согласованных ключевых показателей эффективности.')
    + '<h3>3. Социальный пакет и льготы</h3>' + p('Полное соблюдение ТК РФ (официальное оформление, оплачиваемый отпуск — 28 календарных дней, больничные).')
    + '<h3>4. Регламент работы и подчиненность</h3>' + p('Режим работы: ' + hEsc(v.schedule || 'пятидневная рабочая неделя (пн–пт)')) + p('Непосредственный руководитель: ' + hEsc(v.manager || gap))
    + p('&nbsp;') + p('Предложение действительно в течение 5 рабочих дней с даты письма.') + p('&nbsp;') + p('С уважением,') + p((le && le.director ? hEsc(le.director) : gap))
    + '</body></html>';
  const url = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/msword' })), a = document.createElement('a');
  a.href = url; a.download = 'Оффер ' + c.full_name + '.doc';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
}
