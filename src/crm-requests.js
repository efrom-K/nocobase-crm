// «Тестовая страница» (/admin/j3a32zo1jzo, блок crmblock001): заявки по объектам — ремонт, эксплуатация, вопросы
// арендаторов, расторжения, платежи, проверки. Тестовый контур CRM; коллекции — scripts/setup_crm_requests.py.
// Процесс (решения владельца 28.09): Новая → В работе → Ждёт → Выполнена (на проверке) → Закрыта автором (или сама через 3 дня),
// + Отменена. Срок по срочности: обычная 5 рабочих дней, срочно 1, авария — сегодня. Ответственный по умолчанию —
// управляющий объекта. Напоминания, эскалация старшему управляющему (3 дня просрочки), автозакрытие и сводка по
// понедельникам — scripts/request_reminders.py на сервере. Уведомления из интерфейса — очередь request_notifications.
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
if (!document.getElementById('crm-req-style')) {
  const st = document.createElement('style');
  st.id = 'crm-req-style';
  st.textContent = `
    #crm-req { color:#1f1f1f; font-size:14px; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    #crm-req .rq-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    #crm-req .rq-title { font-size:18px; font-weight:700; margin-right:6px; }
    #crm-req .rq-tabs { display:flex; gap:4px; background:#f5f5f5; border-radius:8px; padding:3px; }
    #crm-req .rq-tab { border:none; background:transparent; padding:5px 12px; border-radius:6px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    #crm-req .rq-tab.on { background:#fff; color:#1f1f1f; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
    #crm-req .rq-new { margin-left:auto; border:none; background:#1c2d58; color:#fff; border-radius:6px; padding:8px 16px; font:inherit; font-size:13.5px; font-weight:600; cursor:pointer; }
    #crm-req .rq-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
    #crm-req .rq-chip { border:1px solid #d9d9d9; background:#fff; border-radius:14px; padding:3px 12px; font:inherit; font-size:13px; cursor:pointer; color:#434343; }
    #crm-req .rq-chip b { font-variant-numeric:tabular-nums; margin-left:4px; }
    #crm-req .rq-chip.on { border-color:#1c2d58; background:#eef1f8; color:#142142; font-weight:600; }
    #crm-req .rq-chip.bad b { color:#cf1322; }
    #crm-req .rq-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
    #crm-req select, #crm-req input[type=text], #crm-req input[type=date], #crm-req textarea, .rq-modal select, .rq-modal input[type=text], .rq-modal input[type=date], .rq-modal textarea {
      border:1px solid #d9d9d9; border-radius:6px; padding:6px 10px; font:inherit; font-size:13.5px; background:#fff; color:#262626; box-sizing:border-box; }
    #crm-req .rq-filters select, #crm-req .rq-filters input { min-width:150px; }
    #crm-req .rq-list { display:flex; flex-direction:column; gap:8px; }
    #crm-req .rq-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; border:1px solid #f0f0f0; border-left:4px solid var(--c); border-radius:8px; padding:10px 14px; background:#fff; cursor:pointer; }
    #crm-req .rq-row:hover { border-color:#b4bfd9; border-left-color:var(--c); }
    #crm-req .rq-row-title { font-weight:600; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #crm-req .rq-row-sub { font-size:12.5px; color:#8c8c8c; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #crm-req .rq-row-side { text-align:right; font-size:12.5px; white-space:nowrap; }
    .rq-pill { display:inline-block; padding:1px 8px; border-radius:10px; font-size:12px; font-weight:600; border:1px solid; white-space:nowrap; }
    .rq-late { color:#cf1322; font-weight:600; }
    #crm-req .rq-empty { color:#bfbfbf; padding:24px 0; text-align:center; }
    /* статистика */
    #crm-req .st { display:flex; flex-direction:column; gap:16px; }
    #crm-req .st-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    #crm-req .st-lbl { font-size:13px; color:#434343; font-weight:600; }
    #crm-req .st-bar .rq-view, #crm-req .st-ch .rq-view { margin-left:0; }
    #crm-req .st-hint { font-size:12.5px; color:#595959; }
    #crm-req .st-tiles { display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:10px; }
    #crm-req .st-tile { border:1px solid #dfe3ea; border-radius:10px; padding:12px 14px; background:#fff; cursor:pointer; transition:border-color .15s, box-shadow .15s; min-width:0; }
    #crm-req .st-tile:hover { border-color:#1c2d58; box-shadow:0 2px 8px rgba(16,24,40,.08); }
    #crm-req .st-tl { font-size:12.5px; color:#434343; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #crm-req .st-tv { font-size:26px; font-weight:700; font-variant-numeric:tabular-nums; margin:4px 0 2px; color:#141414; white-space:nowrap; }
    #crm-req .st-tv small { font-size:13px; font-weight:600; color:#595959; }
    #crm-req .st-tn { font-size:12.5px; color:#595959; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #crm-req .st-card { border:1px solid #dfe3ea; border-radius:10px; background:#fff; padding:14px 16px 12px; min-width:0; }
    #crm-req .st-ch { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
    #crm-req .st-ct { font-size:15px; font-weight:700; color:#141414; margin-right:4px; }
    #crm-req .st-scroll { overflow-x:auto; }
    #crm-req table.st-t { width:100%; table-layout:fixed; border-collapse:collapse; font-size:13.5px; color:#1f1f1f; }
    #crm-req .st-t th { font-weight:600; color:#262626; font-size:12.5px; padding:8px 12px; background:#eef1f6; border-bottom:2px solid #c9d1df; white-space:nowrap; text-align:left; }
    #crm-req .st-t th.n { text-align:right; }
    #crm-req .st-t th.st-now { background:#e6ebf5; }
    #crm-req .st-t td { padding:9px 12px; border-bottom:1px solid #e8ebf0; font-variant-numeric:tabular-nums; white-space:nowrap; font-weight:500; }
    #crm-req .st-t td.n { text-align:right; }
    #crm-req .st-t tbody tr:nth-child(even) td { background:#f8f9fb; }
    #crm-req .st-t th.st-name, #crm-req .st-t td.st-name { width:24%; }
    #crm-req .st-t th.st-pr { width:18%; }
    #crm-req .st-t td.st-name { white-space:normal; font-weight:600; color:#141414; }
    #crm-req .st-t .st-sep { border-left:2px solid #dfe3ea; }
    #crm-req .st-t tr.st-link { cursor:pointer; }
    #crm-req .st-t tr.st-link:hover td { background:#eaf0ff; }
    #crm-req .st-t td.st-pr { white-space:normal; }
    #crm-req .st-t thead th { white-space:normal; line-height:1.25; vertical-align:bottom; }
    #crm-req .st-sub { font-size:12px; color:#595959; font-weight:400; margin-top:2px; line-height:1.35; }
    #crm-req .st-tag { display:inline-block; background:#f0f0f0; color:#595959; border-radius:4px; padding:0 5px; margin-right:6px; font-size:11px; line-height:16px; }
    #crm-req .st-mute { color:#a6a6a6; font-weight:400; }
    #crm-req .st-bad { display:inline-block; color:#fff; background:#cf1322; border-radius:10px; padding:0 8px; font-weight:700; font-size:12.5px; line-height:20px; }
    #crm-req .st-badt { color:#cf1322; font-weight:700; }
    #crm-req .st-ok { color:#237804; font-weight:700; }
    #crm-req .st-warn { color:#ad6800; font-weight:700; }
    #crm-req .st-chip { display:inline-block; background:#fff7e6; color:#873800; border:1px solid #ffd591; border-radius:10px; padding:0 8px; font-size:12px; line-height:20px; margin:1px 0; font-weight:600; }
    #crm-req .st-legend { display:flex; align-items:center; gap:6px; font-size:12px; color:#595959; margin-top:8px; }
    #crm-req .st-legend span { width:12px; height:12px; border-radius:3px; display:inline-block; margin-left:10px; }
    #crm-req .st-legend span:first-child { margin-left:0; }
    #crm-req .st-legend .st-now { background:#e6ebf5; border:1px solid #c9d1df; }
    #crm-req .st-legend .st-per { background:#eef1f6; border:1px solid #c9d1df; }
    #crm-req .st-wk th:first-child { background:#eef1f6; width:16%; }
    #crm-req .st-wk tbody th { background:#f8f9fb; border-bottom:1px solid #e8ebf0; font-weight:600; color:#262626; cursor:help; }
    #crm-req .st-scroll table.st-t { min-width:900px; }
    @media (max-width: 1100px) { #crm-req .st-tiles { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 600px) { #crm-req .st-tiles { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
    #crm-req .rq-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
    #crm-req .rq-tile { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; }
    #crm-req .rq-tile-l { font-size:12px; color:#8c8c8c; }
    #crm-req .rq-tile-v { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px; }
    #crm-req .rq-tile-n { font-size:12px; color:#8c8c8c; margin-top:2px; }
    #crm-req .rq-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(540px, 1fr)); gap:12px; }
    #crm-req .rq-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; overflow-x:auto; }
    #crm-req .rq-card-t { font-weight:600; margin-bottom:8px; }
    #crm-req table { width:100%; border-collapse:collapse; font-size:13px; }
    #crm-req th { text-align:left; font-weight:600; color:#595959; padding:6px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    #crm-req td { padding:6px 8px; border-bottom:1px solid #f5f5f5; font-variant-numeric:tabular-nums; }
    #crm-req th.n, #crm-req td.n { text-align:right; }
    #crm-req tr[data-go] { cursor:pointer; }
    #crm-req tr[data-go]:hover td { background:#f5faff; }
    /* модальные окна */
    .rq-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
    .rq-box { background:#fff; border-radius:10px; width:100%; max-width:760px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f1f1f; }
    .rq-box-h { display:flex; align-items:flex-start; gap:10px; padding:16px 20px; border-bottom:1px solid #f0f0f0; }
    .rq-box-t { font-size:17px; font-weight:700; flex:1; min-width:0; }
    .rq-x { border:none; background:transparent; font-size:18px; color:#8c8c8c; cursor:pointer; padding:2px 6px; }
    .rq-box-b { padding:16px 20px 20px; }
    .rq-form { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px 16px; }
    .rq-form .full { grid-column:1 / -1; }
    .rq-f label { display:block; font-size:12.5px; color:#595959; margin-bottom:4px; }
    .rq-f select, .rq-f input, .rq-f textarea { width:100%; }
    .rq-f textarea { min-height:70px; resize:vertical; }
    .rq-hint { font-size:12px; color:#8c8c8c; margin-top:3px; }
    .rq-seg { display:flex; gap:6px; flex-wrap:wrap; }
    .rq-seg button { flex:1; border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:7px 8px; font:inherit; font-size:13px; cursor:pointer; }
    .rq-seg button.on { border-color:var(--c); background:var(--c); color:#fff; font-weight:600; }
    .rq-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
    .rq-btn { border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:7px 14px; font:inherit; font-size:13.5px; cursor:pointer; color:#262626; }
    .rq-btn.pri { border-color:#1c2d58; background:#1c2d58; color:#fff; font-weight:600; }
    .rq-btn.ok { border-color:#389e0d; background:#389e0d; color:#fff; font-weight:600; }
    .rq-btn.warn { color:#cf1322; border-color:#ffccc7; }
    .rq-btn:disabled { opacity:.5; cursor:default; }
    .rq-meta { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px 16px; font-size:13.5px; }
    .rq-meta .l { font-size:12px; color:#8c8c8c; }
    .rq-desc { white-space:pre-wrap; background:#fafafa; border-radius:6px; padding:10px 12px; margin-top:12px; font-size:13.5px; }
    .rq-actbox { margin-top:12px; padding:12px; border:1px solid #eef1f8; background:#f5faff; border-radius:8px; }
    .rq-tl { margin-top:18px; border-top:1px solid #f0f0f0; padding-top:12px; }
    .rq-ev { display:flex; gap:10px; padding:7px 0; font-size:13px; }
    .rq-ev-d { color:#8c8c8c; font-size:12px; white-space:nowrap; min-width:92px; }
    .rq-ev.sys { color:#8c8c8c; }
    .rq-ev a { color:#1c2d58; cursor:pointer; }
    .rq-comment { display:flex; gap:8px; margin-top:10px; align-items:flex-start; }
    .rq-comment textarea { flex:1; min-height:38px; resize:vertical; }
    /* доска */
    #crm-req .rq-view { display:flex; gap:2px; background:#f5f5f5; border-radius:6px; padding:2px; margin-left:auto; }
    #crm-req .rq-view button { border:none; background:transparent; padding:4px 12px; border-radius:5px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    #crm-req .rq-view button.on { background:#fff; color:#1f1f1f; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
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
    @media (max-width: 700px) {
      #crm-req .rq-new { margin-left:0; width:100%; padding:11px; font-size:15px; }
      #crm-req .rq-filters select, #crm-req .rq-filters input { flex:1 1 45%; min-width:0; }
      #crm-req .rq-row { grid-template-columns:1fr; }
      #crm-req .rq-row-side { text-align:left; }
      #crm-req .rq-grid2 { grid-template-columns:1fr; }
      .rq-modal { padding:0; }
      .rq-box { border-radius:0; min-height:100%; max-width:none; }
      .rq-form, .rq-meta { grid-template-columns:1fr; }
      .rq-btn { flex:1 1 45%; padding:10px; }
      .rq-comment { flex-wrap:wrap; }
      .rq-comment textarea { flex:1 1 100%; min-height:60px; }
      .rq-comment .rq-btn { flex:1 1 auto; }
    }
  `;
  document.head.appendChild(st);
}

// @include src/_crm-config.js
// @include src/_crm-settings-ui.js
// @include src/_crm-calls.js
// @include src/_crm-mobile.js
// @include src/_crm-xlsx.js
const RQ_PAGE = '/admin/j3a32zo1jzo';   // «Тестовая страница» — тестовый контур CRM
const RQ_ST = cfg('requests.status');
const RQ_OPEN = ['new', 'in_work', 'waiting'];
const RQ_URG = cfg('requests.urgency');
const RQ_KINDS = cfg('requests.kinds');
const RQ_WAIT = cfg('requests.wait');
const rq = { data: null, me: null, tab: 'list', quick: 'open', obj: '', kind: '', resp: '', q: '', view: 'list', drop: null, statsDays: 30, statsBy: 'mgr' };
try { if (localStorage.getItem('crm-req-view') === 'board') rq.view = 'board'; } catch (e) { /* хранилище недоступно — список */ }

function rqEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function rqToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function rqRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function rqIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function rqToday() { return rqIso(new Date()); }
function rqDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function rqDateTime(v) { if (!v) return ''; const d = new Date(v); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function rqDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
// ponytail: только выходные, праздники не учитываются — добавить производственный календарь, если сроки начнут спорить
function rqAddWorkDays(n) {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) i++; }
  return rqIso(d);
}
function rqUser(id) { const u = rq.data && rq.data.users[id]; return u ? (u.nickname || u.username) : (id ? '#' + id : 'Система'); }
function rqIsAdmin() { return !!(rq.me && rq.me.__isAdmin); }
function rqLate(r) { return RQ_OPEN.indexOf(r.status) !== -1 && r.due_date && String(r.due_date).slice(0, 10) < rqToday(); }
function rqPill(s) { const x = RQ_ST[s] || { l: s, c: '#8c8c8c' }; return '<span class="rq-pill" style="color:' + x.c + ';border-color:' + x.c + '55;background:' + x.c + '10;">' + rqEsc(x.l) + '</span>'; }
function rqNoun(n, a, b, c) { const x = Math.abs(n) % 100, y = x % 10; return (x > 10 && x < 20) ? c : y === 1 ? a : (y >= 2 && y <= 4) ? b : c; }
function rqMedian(a) { if (!a.length) return null; const s = a.slice().sort(function(x, y) { return x - y; }); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

async function rqMe() {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + rqToken() } });
  const u = ((await res.json()) || {}).data || null;
  if (u) { const n = (u.roles || []).map(function(r) { return r.name; }); u.__isAdmin = n.indexOf('admin') !== -1 || n.indexOf('root') !== -1; }
  return u;
}
async function rqLoad() {
  const all = await Promise.all([
    ctx.api.resource('object_requests').list({ paginate: false, sort: ['-id'] }),
    ctx.api.resource('users').list({ paginate: false, fields: ['id', 'nickname', 'username'] }),
    ctx.api.resource('contract_objects').list({ paginate: false, sort: ['name'] }),
    ctx.api.resource('rental_contracts').list({ paginate: false, fields: ['id', 'contract_number', 'tenant_name', 'object_name'] }).catch(function() { return null; })
  ]);
  const users = {};
  rqRows(all[1]).forEach(function(u) { if (u.username !== 'mail-service') users[u.id] = u; });
  rq.data = { reqs: rqRows(all[0]), users: users, objects: rqRows(all[2]), contracts: rqRows(all[3]) };
}
function rqObj(name) { return (rq.data.objects || []).find(function(o) { return o.name === name; }) || null; }
function rqNotify(userId, title, text, reqId) {
  if (!userId || (rq.me && Number(userId) === Number(rq.me.id))) return;
  ctx.api.resource('request_notifications').create({ values: { user_id: Number(userId), title: title, text: text, url: RQ_PAGE + '?open=req:' + reqId } }).catch(function() { /* уведомление не должно ломать действие */ });
}
function rqEvent(reqId, kind, text, fileId) {
  return ctx.api.resource('request_events').create({ values: { request_id: reqId, author_id: rq.me.id, kind: kind, text: text || '', file_id: fileId || null } });
}
async function rqUpload(file) {
  const boundary = '----rqBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + rqToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const id = (((await res.json()) || {}).data || {}).id;
  if (!id) throw new Error('upload');
  return id;
}
function rqToast(t) {
  const el = document.createElement('div');
  el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1100;max-width:90vw;';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2800);
}

// ---------- страница ----------
ctx.render('<div id="crm-req"><div class="rq-empty">Загрузка…</div></div>');
function rqRoot() { return (ctx.element && ctx.element.querySelector('#crm-req')) || document.getElementById('crm-req'); }
async function rqStart() {
  try {
    rq.me = await rqMe();
    await rqLoad();
    rqRender();
    const m = location.search.match(/[?&]open=req:(\d+)/);
    if (m) { rqOpenCard(Number(m[1])); try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ } }
  } catch (e) {
    rqRoot().innerHTML = '<div class="rq-empty" style="color:#cf1322;">Не удалось загрузить заявки</div>';
  }
}
async function rqReload() { await rqLoad(); rqRender(); }
rqRoot().addEventListener('click', rqOnClick);
rqRoot().addEventListener('change', rqOnChange);
rqRoot().addEventListener('input', function(e) { if (e.target.getAttribute('data-f') === 'q') { rq.q = e.target.value; rqRenderList(); } });
rqStart();

function rqRender() {
  const tabs = [['list', 'Заявки'], ['stats', 'Статистика']].concat(rqIsAdmin() ? [['objects', 'Управляющие объектов']] : []);
  rqRoot().innerHTML = '<div class="rq-head"><div class="rq-title">Заявки по объектам</div>' + crmSettingsGear('Заявки') + '<div class="rq-tabs">'
    + tabs.map(function(t) { return '<button class="rq-tab' + (rq.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('')
    + '</div><button class="rq-new" data-act="new"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Новая заявка</button></div><div id="rq-body"></div>';
  if (rq.tab === 'list') rqRenderListShell();
  else if (rq.tab === 'stats') rqRenderStats();
  else rqRenderObjects();
}

// ---------- список ----------
const RQ_QUICK = [
  ['mine', 'Мои', function(r) { return RQ_OPEN.concat(['done']).indexOf(r.status) !== -1 && (Number(r.responsible_id) === rq.me.id || Number(r.author_id) === rq.me.id); }],
  ['open', 'Открытые', function(r) { return RQ_OPEN.indexOf(r.status) !== -1; }],
  ['late', 'Просроченные', rqLate],
  ['check', 'На проверке', function(r) { return r.status === 'done'; }],
  ['closed', 'Закрытые', function(r) { return r.status === 'closed' || r.status === 'cancelled'; }],
  ['all', 'Все', function() { return true; }]
];
function rqRenderListShell() {
  const d = rq.data;
  const objs = d.objects.map(function(o) { return o.name; });
  const people = Object.keys(d.users).map(Number).filter(function(id) { return d.reqs.some(function(r) { return Number(r.responsible_id) === id; }); });
  document.getElementById('rq-body').innerHTML = '<div class="rq-chips" id="rq-chips"></div><div class="rq-filters">'
    + '<select data-f="obj"><option value="">Все объекты</option>' + objs.map(function(o) { return '<option' + (rq.obj === o ? ' selected' : '') + '>' + rqEsc(o) + '</option>'; }).join('') + '</select>'
    + '<select data-f="kind"><option value="">Все типы</option>' + RQ_KINDS.map(function(k) { return '<option' + (rq.kind === k ? ' selected' : '') + '>' + rqEsc(k) + '</option>'; }).join('') + '</select>'
    + '<select data-f="resp"><option value="">Все ответственные</option>' + people.map(function(id) { return '<option value="' + id + '"' + (String(rq.resp) === String(id) ? ' selected' : '') + '>' + rqEsc(rqUser(id)) + '</option>'; }).join('') + '</select>'
    + '<input type="text" data-f="q" placeholder="Поиск: суть, арендатор, номер" value="' + rqEsc(rq.q) + '">'
    + '<div class="rq-view">' + [['list', 'Список'], ['board', 'Доска']].map(function(v) { return '<button data-view="' + v[0] + '"' + (rq.view === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>'; }).join('') + '</div>'
    + '</div><div class="rq-list" id="rq-list"></div>';
  rqRenderList();
}
function rqFiltered(skipQuick) {
  const q = rq.q.trim().toLowerCase();
  return rq.data.reqs.filter(function(r) {
    if (rq.obj && r.object_name !== rq.obj) return false;
    if (rq.kind && r.kind !== rq.kind) return false;
    if (rq.resp && String(r.responsible_id) !== String(rq.resp)) return false;
    if (q && [r.title, r.tenant_label, r.object_name, '№' + r.id, String(r.id)].join(' ').toLowerCase().indexOf(q) === -1) return false;
    if (!skipQuick) { const qf = RQ_QUICK.find(function(x) { return x[0] === rq.quick; }); if (qf && !qf[2](r)) return false; }
    return true;
  });
}
function rqRenderList() {
  if (rq.view === 'board') { rqRenderBoard(); return; }
  const base = rqFiltered(true);
  document.getElementById('rq-chips').innerHTML = RQ_QUICK.map(function(x) {
    const n = base.filter(x[2]).length;
    return '<button class="rq-chip' + (rq.quick === x[0] ? ' on' : '') + (x[0] === 'late' && n ? ' bad' : '') + '" data-quick="' + x[0] + '">' + x[1] + '<b>' + n + '</b></button>';
  }).join('');
  const rows = rqFiltered(false).sort(function(a, b) {   // сначала аварии и просрочка, потом по сроку
    const w = function(r) { return (r.urgency === 'emergency' && RQ_OPEN.indexOf(r.status) !== -1 ? 0 : rqLate(r) ? 1 : 2); };
    return w(a) - w(b) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')) || b.id - a.id;
  });
  document.getElementById('rq-list').innerHTML = rows.length ? rows.map(rqRowHtml).join('')
    : '<div class="rq-empty">' + (rq.data.reqs.length ? 'Под фильтр ничего не попало' : 'Заявок пока нет — нажмите «+ Новая заявка»') + '</div>';
}
function rqRowHtml(r) {
  const late = rqLate(r), open = RQ_OPEN.indexOf(r.status) !== -1, u = RQ_URG[r.urgency] || RQ_URG.normal;
  const due = r.due_date ? (late ? '<span class="rq-late">просрочено на ' + rqDays(String(r.due_date).slice(0, 10), rqToday()) + ' дн. (срок ' + rqDate(r.due_date) + ')</span>' : 'срок ' + rqDate(r.due_date)) : '';
  return '<div class="rq-row" data-open="' + r.id + '" style="--c:' + (r.urgency === 'emergency' && open ? '#cf1322' : (RQ_ST[r.status] || {}).c || '#d9d9d9') + ';">'
    + '<div style="min-width:0;"><div class="rq-row-title">' + ((r.urgency === 'urgent' || r.urgency === 'emergency') && open ? '<span style="color:' + u.c + ';">' + (r.urgency === 'emergency' ? '⚠ ' : '') + rqEsc(u.l) + ' · </span>' : '') + rqEsc(r.title || 'Без названия') + '</div>'
    + '<div class="rq-row-sub">' + (r.demo ? '<span class="rq-pill" style="color:#8c8c8c;border-color:#d9d9d9;margin-right:6px;">демо</span>' : '') + '№' + r.id + ' · ' + rqEsc([r.object_name, r.tenant_label, r.kind].filter(Boolean).join(' · ')) + '</div></div>'
    + '<div class="rq-row-side">' + rqPill(r.status) + (r.status === 'waiting' && r.wait_reason ? ' <span style="color:#722ed1;">ждём ' + rqEsc(r.wait_reason) + '</span>' : '')
    + '<div style="margin-top:3px;color:#595959;">' + rqEsc(rqUser(r.responsible_id)) + (open && due ? ' · ' + due : '') + '</div></div></div>';
}

function rqOnChange(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'obj' || f === 'kind' || f === 'resp') { rq[f] = e.target.value; rqRenderList(); }
  const om = e.target.getAttribute('data-objset');
  if (om) rqSaveObjectPerson(e.target, om);
}
function rqOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  const tab = c('[data-tab]');
  if (tab) { rq.tab = tab.getAttribute('data-tab'); rqRender(); return; }
  if (c('[data-act="new"]')) { rqOpenNew(); return; }
  const qk = c('[data-quick]');
  if (qk) { rq.quick = qk.getAttribute('data-quick'); rqRenderList(); return; }
  const sb = c('[data-by]');
  if (sb) { rq.statsBy = sb.getAttribute('data-by'); rqRenderStats(); return; }
  const pr = c('[data-period]');
  if (pr) { rq.statsDays = Number(pr.getAttribute('data-period')); rqRenderStats(); return; }
  if (c('[data-act="xlsx"]')) { try { rqExportStats(); } catch (err) { rqToast('Не удалось выгрузить'); } return; }
  const vw = c('[data-view]');
  if (vw) { rq.view = vw.getAttribute('data-view'); try { localStorage.setItem('crm-req-view', rq.view); } catch (err) { /* не запомним — не страшно */ } rqRenderListShell(); return; }
  const go = c('[data-go]');
  if (go) {   // из статистики — в список с фильтром
    const p = JSON.parse(go.getAttribute('data-go'));
    rq.obj = p.obj || ''; rq.kind = p.kind || ''; rq.resp = p.resp || ''; rq.quick = p.quick || 'open'; rq.q = ''; rq.tab = 'list';
    rqRender(); return;
  }
  const op = c('[data-open]');
  if (op) rqOpenCard(Number(op.getAttribute('data-open')));
}

// ---------- доска ----------
// Колонки = статусы, одной высоты (до низа экрана), прокрутка внутри колонки. Взяли карточку — колонки, куда её можно
// перенести, подсвечены, остальные бледные. Перенос = то же действие, что кнопка в карточке (rqCan + rqDo): права, история,
// уведомления. Где нужен ввод (что сделано, чего ждём, причина) — форма прямо на карточке в новой колонке, без окон.
const RQ_COLS = [['new', ['new'], 'Новые'], ['in_work', ['in_work'], 'В работе'], ['waiting', ['waiting'], 'Ждут'], ['done', ['done'], 'На проверке'], ['closed', ['closed', 'cancelled'], 'Закрытые']];
const RQ_CLOSED_DAYS = cfg('requests.closedDays');   // закрытые на доске — только за последний месяц, остальные в списке «Закрытые»
const RQ_DROP_ASK = { wait: 'Чего ждём', done: 'Что сделано — увидит автор при проверке', reopen: 'Что не так — увидит ответственный', cancel: 'Причина отмены' };
const RQ_DROP_OK = { take: 'Взята в работу', resume: 'Снова в работе', wait: 'Ждём', done: 'Отправлена на проверку', close: 'Закрыта', reopen: 'Возвращена в работу', cancel: 'Отменена' };
function rqColOf(st) { return (RQ_COLS.find(function(c) { return c[1].indexOf(st) !== -1; }) || [''])[0]; }
// куда перетащили → какое действие карточки это означает
function rqDropAction(from, col) {
  if (col === 'in_work') return from === 'new' ? 'take' : from === 'waiting' ? 'resume' : from === 'done' ? 'reopen' : null;
  if (col === 'waiting') return (from === 'new' || from === 'in_work') ? 'wait' : null;
  if (col === 'done') return (from === 'in_work' || from === 'waiting') ? 'done' : null;
  if (col === 'closed') return from === 'done' ? 'close' : RQ_OPEN.indexOf(from) !== -1 ? 'cancel' : null;
  return null;
}
function rqDropAllowed(r, col) {
  const a = rqDropAction(r.status, col);
  return a && rqCan(r).some(function(x) { return x[0] === a; }) ? a : null;
}
function rqRenderBoard() {
  document.getElementById('rq-chips').innerHTML = '';
  const rows = rqFiltered(true), d = new Date(); d.setDate(d.getDate() - RQ_CLOSED_DAYS);
  const since = rqIso(d), pd = rq.drop;
  document.getElementById('rq-list').innerHTML = '<div class="kb" data-kb>' + RQ_COLS.map(function(col) {
    let items = rows.filter(function(r) { return pd && r.id === pd.id ? col[0] === pd.col : col[1].indexOf(r.status) !== -1; });
    const all = items.length;
    if (col[0] === 'closed') items = items.filter(function(r) { return String(r.closed_at || r.updatedAt || '').slice(0, 10) >= since; }).sort(function(a, b) { return String(b.closed_at || '').localeCompare(String(a.closed_at || '')); });
    else items.sort(function(a, b) {
      const w = function(r) { return pd && r.id === pd.id ? -1 : r.urgency === 'emergency' ? 0 : rqLate(r) ? 1 : 2; };
      return w(a) - w(b) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')) || b.id - a.id;
    });
    return '<div class="kb-col" data-col="' + col[0] + '"><div class="kb-col-h" style="--c:' + RQ_ST[col[1][0]].c + ';"><i></i>' + col[2] + '<b>' + items.length + '</b></div><div class="kb-col-b">'
      + items.map(rqCardHtml).join('')
      + (all > items.length ? '<div class="kb-note">Ещё ' + (all - items.length) + ' старше ' + RQ_CLOSED_DAYS + ' дней — в списке «Закрытые»</div>' : '')
      + (items.length ? '' : '<div class="kb-empty">Пусто</div>') + '</div></div>';
  }).join('') + '</div>';
  kbFit();
  const f = document.querySelector('.kb-form [data-bf-in]'); if (f) f.focus();
}
function rqCardHtml(r) {
  const late = rqLate(r), open = RQ_OPEN.indexOf(r.status) !== -1, u = RQ_URG[r.urgency] || RQ_URG.normal, pd = rq.drop && rq.drop.id === r.id ? rq.drop : null;
  return '<div class="kb-card' + (pd ? ' pending' : '') + '"' + (pd ? '' : ' draggable="true" data-open="' + r.id + '"') + ' data-id="' + r.id + '" style="--c:' + (r.urgency === 'emergency' && open ? '#cf1322' : (RQ_ST[r.status] || {}).c || '#d9d9d9') + ';">'
    + '<div class="kb-t">' + (r.urgency !== 'normal' && open && RQ_URG[r.urgency] ? '<span style="color:' + u.c + ';">' + (r.urgency === 'emergency' ? '⚠ ' : '') + rqEsc(u.l) + ' · </span>' : '') + rqEsc(r.title || 'Без названия') + '</div>'
    + '<div class="kb-s">№' + r.id + ' · ' + rqEsc(r.object_name || '') + '</div>'
    + '<div class="kb-s">' + rqEsc(rqUser(r.responsible_id))
    + (open && r.due_date ? ' · ' + (late ? '<span class="rq-late">просрочено ' + rqDays(String(r.due_date).slice(0, 10), rqToday()) + ' дн.</span>' : 'до ' + rqDate(r.due_date)) : '')
    + (r.status === 'waiting' && r.wait_reason ? ' · <span style="color:#722ed1;">ждём ' + rqEsc(r.wait_reason) + '</span>' : '')
    + (r.status === 'cancelled' ? ' · отменена' : '') + '</div>'
    + (pd ? '<div class="kb-form"><label>' + RQ_DROP_ASK[pd.a] + '</label>'
      + (pd.a === 'wait' ? '<select data-bf-in>' + RQ_WAIT.map(function(w) { return '<option>' + w + '</option>'; }).join('') + '</select>' : '<textarea data-bf-in rows="2"></textarea>')
      + '<div class="kb-form-b"><button class="kb-ok" data-bf-ok>Сохранить</button><button class="kb-no" data-bf-no>Отмена</button><span>Ctrl+Enter — сохранить, Esc — отмена</span></div></div>' : '')
    + '</div>';
}
async function rqDrop(id, col) {
  const r = rq.data.reqs.find(function(x) { return x.id === id; });
  if (!r || rqColOf(r.status) === col) return;
  const a = rqDropAllowed(r, col);
  if (!a) return;
  if (RQ_DROP_ASK[a]) { rq.drop = { id: id, col: col, a: a }; rqRenderBoard(); return; }   // нужен ввод — форма на карточке
  await rqDropSave(r, a, '');
}
async function rqDropSave(r, a, v) {
  try {
    const res = await rqDo(r, a, v, '');
    if (res && res.err) { rqToast(res.err); const f = document.querySelector('.kb-form [data-bf-in]'); if (f) f.focus(); return; }
    rq.drop = null;
    await rqReload();
    rqToast('№' + r.id + ': ' + (RQ_DROP_OK[a] || 'сохранено').toLowerCase());
  } catch (e) { rqToast('Не удалось сохранить'); rq.drop = null; rqRenderBoard(); }
}
function rqDropSubmit() {
  const pd = rq.drop, f = document.querySelector('.kb-form [data-bf-in]');
  if (!pd || !f) return;
  const r = rq.data.reqs.find(function(x) { return x.id === pd.id; });
  document.querySelectorAll('.kb-form button').forEach(function(b) { b.disabled = true; });
  rqDropSave(r, pd.a, f.value.trim()).then(function() { document.querySelectorAll('.kb-form button').forEach(function(b) { b.disabled = false; }); });
}
// доска до низа окна: колонки прокручиваются внутри, страница не растягивается
function kbFit() {
  const kb = document.querySelector('[data-kb]');
  if (!kb || window.innerWidth <= 700) return;
  kb.style.height = Math.max(380, window.innerHeight - kb.getBoundingClientRect().top - window.scrollY - 24) + 'px';
}
(function() {
  const root = rqRoot();
  let drag = null;
  if (!window.__rqKbResize) { window.__rqKbResize = true; window.addEventListener('resize', function() { kbFit(); }); }
  root.addEventListener('dragstart', function(e) {
    const k = e.target.closest ? e.target.closest('.kb-card[draggable]') : null;
    if (!k) return;
    const r = rq.data.reqs.find(function(x) { return x.id === Number(k.getAttribute('data-id')); });
    if (!r) return;
    drag = r;
    k.classList.add('drag');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(r.id));
    root.querySelectorAll('.kb-col').forEach(function(c) {
      const col = c.getAttribute('data-col');
      c.classList.add(col === rqColOf(r.status) ? 'home' : rqDropAllowed(r, col) ? 'ok' : 'no');
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
    const id = drag.id;
    rqDrop(id, c.getAttribute('data-col'));
  });
  root.addEventListener('click', function(e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-bf-ok]')) { rqDropSubmit(); return; }
    if (e.target.closest('[data-bf-no]')) { rq.drop = null; rqRenderBoard(); }
  });
  root.addEventListener('keydown', function(e) {
    if (!rq.drop || !e.target.closest || !e.target.closest('.kb-form')) return;
    if (e.key === 'Escape') { rq.drop = null; rqRenderBoard(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.target.tagName === 'SELECT')) { e.preventDefault(); rqDropSubmit(); }
  });
})();

// ---------- новая заявка ----------
function rqModal(html) {
  const m = document.createElement('div');
  m.className = 'rq-modal';
  m.innerHTML = '<div class="rq-box">' + html + '</div>';
  m.addEventListener('click', function(e) { if (e.target === m || (e.target.closest && e.target.closest('.rq-x'))) m.remove(); });
  document.body.appendChild(m);
  return m;
}
function rqPeopleOptions(sel) {
  return Object.keys(rq.data.users).map(Number).sort(function(a, b) { return rqUser(a).localeCompare(rqUser(b), 'ru'); })
    .map(function(id) { return '<option value="' + id + '"' + (Number(sel) === id ? ' selected' : '') + '>' + rqEsc(rqUser(id)) + '</option>'; }).join('');
}
function rqOpenNew() {
  const d = rq.data;
  const m = rqModal('<div class="rq-box-h"><div class="rq-box-t">Новая заявка</div><button class="rq-x">✕</button></div><div class="rq-box-b"><div class="rq-form">'
    + '<div class="rq-f"><label>Объект *</label><select data-n="object_name"><option value="">Выберите объект</option>' + d.objects.map(function(o) { return '<option' + (rq.obj === o.name ? ' selected' : '') + '>' + rqEsc(o.name) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Договор / арендатор</label><select data-n="contract_id"><option value="">— не по договору —</option></select></div>'
    + '<div class="rq-f"><label>Тип *</label><select data-n="kind"><option value="">Выберите тип</option>' + RQ_KINDS.map(function(k) { return '<option>' + rqEsc(k) + '</option>'; }).join('') + '</select></div>'
    + '<div class="rq-f"><label>Срочность</label><div class="rq-seg" data-n="urgency">' + Object.keys(RQ_URG).map(function(k) { return '<button type="button" data-urg="' + k + '" style="--c:' + (k === 'normal' ? '#1c2d58' : RQ_URG[k].c) + ';"' + (k === 'normal' ? ' class="on"' : '') + '>' + RQ_URG[k].l + '</button>'; }).join('') + '</div><div class="rq-hint" data-urg-hint>Срок: ' + RQ_URG.normal.hint + '</div></div>'
    + '<div class="rq-f full"><label>Суть *</label><input type="text" data-n="title" placeholder="Коротко: что случилось или что нужно сделать"></div>'
    + '<div class="rq-f full"><label>Подробности</label><textarea data-n="description" placeholder="Где, что, контакты арендатора, что уже сделано"></textarea></div>'
    + '<div class="rq-f"><label>Ответственный</label><select data-n="responsible_id"><option value="">—</option>' + rqPeopleOptions(rq.me.id) + '</select><div class="rq-hint" data-resp-hint></div></div>'
    + '<div class="rq-f"><label>Срок</label><input type="date" data-n="due_date" min="2000-01-01" max="2099-12-31" value="' + rqAddWorkDays(5) + '"></div>'
    + '<div class="rq-f full"><label>Фото или файл</label><input type="file" data-n="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"></div>'
    + '</div><div class="rq-actions"><button class="rq-btn pri" data-save>Создать заявку</button><button class="rq-btn rq-x">Отмена</button></div></div>');
  const q = function(n) { return m.querySelector('[data-n="' + n + '"]'); };
  let urg = 'normal', dueTouched = false, respTouched = false;
  q('due_date').addEventListener('change', function() { dueTouched = true; });
  q('responsible_id').addEventListener('change', function() { respTouched = true; });
  function onObject() {   // договоры объекта и управляющий по умолчанию
    const name = q('object_name').value;
    q('contract_id').innerHTML = '<option value="">— не по договору —</option>' + d.contracts.filter(function(c) { return c.object_name === name; })
      .map(function(c) { return '<option value="' + c.id + '">' + rqEsc([c.contract_number, c.tenant_name].filter(Boolean).join(' · ') || ('#' + c.id)) + '</option>'; }).join('');
    const o = rqObj(name);
    const hint = m.querySelector('[data-resp-hint]');
    if (o && o.manager_user_id && !respTouched) q('responsible_id').value = String(o.manager_user_id);
    hint.textContent = o && (o.manager_name || o.manager_user_id) ? 'Управляющий объекта: ' + (o.manager_user_id ? rqUser(o.manager_user_id) : o.manager_name + ' (нет учётки в CRM)') : '';
  }
  q('object_name').addEventListener('change', onObject);
  onObject();
  m.querySelectorAll('[data-urg]').forEach(function(b) {
    b.addEventListener('click', function() {
      urg = b.getAttribute('data-urg');
      m.querySelectorAll('[data-urg]').forEach(function(x) { x.classList.toggle('on', x === b); });
      m.querySelector('[data-urg-hint]').textContent = 'Срок: ' + RQ_URG[urg].hint;
      if (!dueTouched) q('due_date').value = rqAddWorkDays(RQ_URG[urg].d);
    });
  });
  m.querySelector('[data-save]').addEventListener('click', async function(e) {
    const v = { object_name: q('object_name').value, kind: q('kind').value, title: q('title').value.trim() };
    if (!v.object_name) { rqToast('Выберите объект'); q('object_name').focus(); return; }
    if (!v.kind) { rqToast('Выберите тип'); q('kind').focus(); return; }
    if (!v.title) { rqToast('Опишите суть заявки'); q('title').focus(); return; }
    const due = q('due_date').value;
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(due)) { rqToast('Укажите срок'); q('due_date').focus(); return; }
    const cid = q('contract_id').value, c = d.contracts.find(function(x) { return String(x.id) === cid; });
    e.target.disabled = true;
    try {
      const fileId = q('file').files[0] ? await rqUpload(q('file').files[0]) : null;
      const vals = Object.assign(v, { description: q('description').value.trim(), urgency: urg, due_date: due, status: 'new', due_moved: 0,
        contract_id: c ? c.id : null, tenant_label: c ? [c.contract_number, c.tenant_name].filter(Boolean).join(' · ') : null,
        responsible_id: Number(q('responsible_id').value) || rq.me.id, author_id: rq.me.id });
      const rec = rqRows(await ctx.api.resource('object_requests').create({ values: vals }))[0];
      await rqEvent(rec.id, 'create', 'Заявка создана' + (fileId ? ', приложен файл' : ''), fileId);
      const title = 'Заявка №' + rec.id + ' · ' + vals.object_name;
      rqNotify(vals.responsible_id, title, (urg === 'emergency' ? 'АВАРИЯ: ' : urg === 'urgent' ? 'Срочно: ' : 'Новая заявка: ') + vals.title + ' (срок ' + rqDate(due) + ')', rec.id);
      const o = rqObj(vals.object_name);
      if (urg === 'emergency' && o && o.senior_user_id) rqNotify(o.senior_user_id, title, 'АВАРИЯ: ' + vals.title, rec.id);
      m.remove();
      rqToast('Заявка №' + rec.id + ' создана');
      await rqReload();
    } catch (err) { rqToast('Не удалось создать заявку'); e.target.disabled = false; }
  });
}

// ---------- карточка заявки ----------
async function rqOpenCard(id) {
  let r = rq.data.reqs.find(function(x) { return x.id === id; });
  if (!r) { try { r = rqRows(await ctx.api.resource('object_requests').get({ filterByTk: id }))[0]; } catch (e) { r = null; } }
  if (!r) { rqToast('Заявка №' + id + ' не найдена'); return; }
  const m = rqModal('<div id="rq-card"></div>');
  m.__rqId = id;
  await rqRenderCard(m, r);
}
function rqCan(r) {
  const me = rq.me.id, adm = rqIsAdmin(), resp = Number(r.responsible_id) === me || adm, auth = Number(r.author_id) === me || adm;
  const a = [];
  if (r.status === 'new' && resp) a.push(['take', 'Взять в работу', 'pri']);
  if ((r.status === 'new' || r.status === 'in_work') && resp) a.push(['wait', 'Ждём…', '']);
  if (r.status === 'waiting' && resp) a.push(['resume', 'Вернуть в работу', '']);
  if ((r.status === 'in_work' || r.status === 'waiting') && resp) a.push(['done', 'Выполнена', 'ok']);
  if (r.status === 'done' && auth) { a.push(['close', 'Принять и закрыть', 'ok']); a.push(['reopen', 'Не выполнено — вернуть', 'warn']); }
  if (RQ_OPEN.indexOf(r.status) !== -1 && (resp || auth)) { a.push(['due', 'Перенести срок', '']); a.push(['assign', 'Передать другому', '']); }
  if (RQ_OPEN.indexOf(r.status) !== -1 && auth) a.push(['cancel', 'Отменить', 'warn']);
  return a;
}
async function rqRenderCard(m, r) {
  const box = m.querySelector('#rq-card');
  const late = rqLate(r), u = RQ_URG[r.urgency] || RQ_URG.normal;
  let evs = [];
  // файл — связь file (belongsTo attachments): отдельный attachments:list в этой версии NocoBase недоступен (404)
  try { evs = rqRows(await ctx.api.resource('request_events').list({ filter: { request_id: r.id }, sort: ['createdAt'], appends: ['file'], paginate: false })); } catch (e) { evs = []; }
  box.innerHTML = '<div class="rq-box-h"><div class="rq-box-t">№' + r.id + ' · ' + rqEsc(r.title) + '<div style="margin-top:6px;font-size:13px;font-weight:400;">' + rqPill(r.status)
    + (r.status === 'waiting' && r.wait_reason ? ' <span style="color:#722ed1;">ждём ' + rqEsc(r.wait_reason) + '</span>' : '')
    + (RQ_URG[r.urgency] && r.urgency !== 'normal' ? ' <span class="rq-pill" style="color:' + u.c + ';border-color:' + u.c + '55;">' + rqEsc(u.l) + '</span>' : '') + '</div></div><button class="rq-x">✕</button></div>'
    + '<div class="rq-box-b"><div class="rq-meta">'
    + '<div><div class="l">Объект</div>' + rqEsc(r.object_name) + '</div>'
    + '<div><div class="l">Договор / арендатор</div>' + (r.contract_id ? '<a href="/admin/b5znz7yxpy3?open=active:' + r.contract_id + '" style="color:#1c2d58;">' + rqEsc(r.tenant_label || '#' + r.contract_id) + '</a>' : '—') + '</div>'
    + '<div><div class="l">Тип</div>' + rqEsc(r.kind || '—') + '</div>'
    + '<div><div class="l">Срок</div>' + (RQ_OPEN.indexOf(r.status) !== -1 && late ? '<span class="rq-late">' + rqDate(r.due_date) + ', просрочено на ' + rqDays(String(r.due_date).slice(0, 10), rqToday()) + ' дн.</span>' : rqDate(r.due_date)) + (r.due_moved ? ' <span style="color:#8c8c8c;font-size:12px;">(переносили ' + r.due_moved + ' раз)</span>' : '') + '</div>'
    + '<div><div class="l">Ответственный</div>' + rqEsc(rqUser(r.responsible_id)) + '</div>'
    + '<div><div class="l">Автор</div>' + rqEsc(rqUser(r.author_id)) + ' · ' + rqDateTime(r.createdAt) + '</div>'
    + '</div>'
    + (r.description ? '<div class="rq-desc">' + rqEsc(r.description) + '</div>' : '')
    + (r.result ? '<div class="rq-desc" style="background:#f6ffed;"><b>Результат:</b> ' + rqEsc(r.result) + '</div>' : '')
    + '<div class="rq-actions">' + rqCan(r).map(function(a) { return '<button class="rq-btn ' + a[2] + '" data-a="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>'
    + '<div id="rq-actbox"></div>'
    + '<div class="rq-tl"><div style="font-weight:600;margin-bottom:4px;">Переписка и история</div>'
    + evs.map(function(x) {
        const f = x.file;
        return '<div class="rq-ev' + (x.kind === 'comment' ? '' : ' sys') + '"><div class="rq-ev-d">' + rqDateTime(x.createdAt) + '</div><div style="min-width:0;"><b style="color:#434343;">' + rqEsc(rqUser(x.author_id)) + ':</b> ' + rqEsc(x.text)
          + (f ? ' <a data-file="' + rqEsc(f.url) + '" data-fname="' + rqEsc((f.title || 'файл') + (f.extname || '')) + '">📎 ' + rqEsc((f.title || 'файл') + (f.extname || '')) + '</a>' : '') + '</div></div>';
      }).join('')
    + '<div class="rq-comment"><textarea placeholder="Комментарий…" id="rq-cmt"></textarea><input type="file" id="rq-cmt-file" style="display:none;"><button class="rq-btn" id="rq-cmt-attach" title="Приложить фото или файл">📎</button><button class="rq-btn pri" id="rq-cmt-send">Отправить</button></div>'
    + '<div id="rq-cmt-fname" class="rq-hint"></div></div></div>';
  box.querySelectorAll('[data-a]').forEach(function(b) { b.addEventListener('click', function() { rqAction(m, r, b.getAttribute('data-a')); }); });
  box.querySelectorAll('[data-file]').forEach(function(a) {
    a.addEventListener('click', async function() {
      try { const res = await fetch(a.getAttribute('data-file'), { headers: { Authorization: 'Bearer ' + rqToken() } }); window.open(URL.createObjectURL(await res.blob()), '_blank'); }
      catch (e) { rqToast('Не удалось открыть файл'); }
    });
  });
  const fin = box.querySelector('#rq-cmt-file');
  box.querySelector('#rq-cmt-attach').addEventListener('click', function() { fin.click(); });
  fin.addEventListener('change', function() { box.querySelector('#rq-cmt-fname').textContent = fin.files[0] ? 'Файл: ' + fin.files[0].name : ''; });
  box.querySelector('#rq-cmt-send').addEventListener('click', async function(e) {
    const t = box.querySelector('#rq-cmt').value.trim();
    if (!t && !fin.files[0]) return;
    e.target.disabled = true;
    try {
      const fid = fin.files[0] ? await rqUpload(fin.files[0]) : null;
      await rqEvent(r.id, 'comment', t || 'Файл', fid);
      [r.responsible_id, r.author_id].filter(function(v, i, a) { return v && a.indexOf(v) === i; })
        .forEach(function(uid) { rqNotify(uid, 'Заявка №' + r.id + ' · ' + r.object_name, rqUser(rq.me.id) + ': ' + (t || 'приложил файл'), r.id); });
      await rqRenderCard(m, r);
    } catch (err) { rqToast('Не удалось отправить'); e.target.disabled = false; }
  });
}
// действие по заявке: где нужен ввод (причина, результат, срок, кому) — встроенная форма, без окон браузера
function rqAction(m, r, a) {
  const box = m.querySelector('#rq-actbox');
  const need = {
    wait: '<label style="font-size:12.5px;color:#595959;">Чего ждём</label><select id="rq-in" style="width:100%;margin-top:4px;">' + RQ_WAIT.map(function(w) { return '<option>' + w + '</option>'; }).join('') + '</select>',
    done: '<label style="font-size:12.5px;color:#595959;">Что сделано (обязательно — увидит автор при проверке)</label><textarea id="rq-in" style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    reopen: '<label style="font-size:12.5px;color:#595959;">Что не так (обязательно)</label><textarea id="rq-in" style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    cancel: '<label style="font-size:12.5px;color:#595959;">Причина отмены (обязательно)</label><textarea id="rq-in" style="width:100%;margin-top:4px;min-height:50px;"></textarea>',
    due: '<label style="font-size:12.5px;color:#595959;">Новый срок</label><input type="date" id="rq-in" min="2000-01-01" max="2099-12-31" value="' + rqEsc(String(r.due_date || '').slice(0, 10)) + '" style="width:100%;margin-top:4px;">'
      + '<label style="font-size:12.5px;color:#595959;display:block;margin-top:8px;">Причина переноса (обязательно — видна в статистике)</label><input type="text" id="rq-in2" style="width:100%;margin-top:4px;">',
    assign: '<label style="font-size:12.5px;color:#595959;">Кому передать</label><select id="rq-in" style="width:100%;margin-top:4px;">' + rqPeopleOptions(r.responsible_id) + '</select>'
  }[a];
  if (need) {
    box.innerHTML = '<div class="rq-actbox">' + need + '<div class="rq-actions" style="margin-top:10px;"><button class="rq-btn pri" id="rq-go">Подтвердить</button><button class="rq-btn" id="rq-no">Отмена</button></div></div>';
    box.querySelector('#rq-no').addEventListener('click', function() { box.innerHTML = ''; });
    box.querySelector('#rq-go').addEventListener('click', function(e) { rqApply(m, r, a, e.target); });
    const f = box.querySelector('#rq-in'); if (f) f.focus();
  } else rqApply(m, r, a, null);
}
// действие по заявке без интерфейса — его зовут и кнопки карточки, и доска: проверка ввода, запись, история, уведомления.
// Ошибка ввода → { err, field: 1|2 }; ничего не меняется → { skip: true }; сбой сети → исключение. Перерисовку делает вызывающий.
async function rqDo(r, a, v, v2) {
  const now = new Date().toISOString();
  const title = 'Заявка №' + r.id + ' · ' + r.object_name;
  let upd = null, ev = '', notify = [];
  if (a === 'take') { upd = { status: 'in_work' }; ev = 'Взята в работу'; notify = [[r.author_id, 'Взята в работу: ' + r.title]]; }
  if (a === 'wait') { if (!v) return { err: 'Выберите, чего ждём', field: 1 }; upd = { status: 'waiting', wait_reason: v }; ev = 'Ждём ' + v; notify = [[r.author_id, 'Ждём ' + v + ': ' + r.title]]; }
  if (a === 'resume') { upd = { status: 'in_work', wait_reason: null }; ev = 'Снова в работе'; }
  if (a === 'done') { if (!v) return { err: 'Напишите, что сделано', field: 1 }; upd = { status: 'done', result: v, done_at: now, wait_reason: null }; ev = 'Выполнена: ' + v; notify = [[r.author_id, 'Выполнена, проверьте и закройте: ' + r.title]]; }
  if (a === 'close') { upd = { status: 'closed', closed_at: now }; ev = 'Принята и закрыта'; notify = [[r.responsible_id, 'Закрыта автором: ' + r.title]]; }
  if (a === 'reopen') { if (!v) return { err: 'Напишите, что не так', field: 1 }; upd = { status: 'in_work', done_at: null }; ev = 'Возвращена в работу: ' + v; notify = [[r.responsible_id, 'Вернули в работу: ' + v]]; }
  if (a === 'cancel') { if (!v) return { err: 'Укажите причину', field: 1 }; upd = { status: 'cancelled', closed_at: now, result: v }; ev = 'Отменена: ' + v; notify = [[r.responsible_id, 'Отменена: ' + r.title]]; }
  if (a === 'due') {
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(v)) return { err: 'Укажите новый срок', field: 1 };
    if (!v2) return { err: 'Укажите причину переноса', field: 2 };
    upd = { due_date: v, due_moved: (Number(r.due_moved) || 0) + 1, reminded_on: null, escalated_at: null };
    ev = 'Срок перенесён с ' + rqDate(r.due_date) + ' на ' + rqDate(v) + ': ' + v2;
    notify = [[r.responsible_id, 'Срок перенесён на ' + rqDate(v) + ': ' + v2], [r.author_id, 'Срок перенесён на ' + rqDate(v) + ': ' + v2]];
  }
  if (a === 'assign') {
    const to = Number(v);
    if (!to || to === Number(r.responsible_id)) return { skip: true };
    upd = { responsible_id: to, reminded_on: null, escalated_at: null };
    ev = 'Передана: ' + rqUser(r.responsible_id) + ' → ' + rqUser(to);
    notify = [[to, 'Вам передана заявка: ' + r.title + ' (срок ' + rqDate(r.due_date) + ')']];
  }
  if (!upd) return { skip: true };
  await ctx.api.resource('object_requests').update({ filterByTk: r.id, values: upd });
  await rqEvent(r.id, a === 'due' ? 'due' : a === 'assign' ? 'assign' : 'status', ev);
  notify.forEach(function(n) { rqNotify(n[0], title, n[1], r.id); });
  Object.assign(r, upd);
  return null;
}
async function rqApply(m, r, a, btn) {
  const box = m.querySelector('#rq-actbox');
  const inp = box.querySelector('#rq-in'), inp2 = box.querySelector('#rq-in2');
  if (btn) btn.disabled = true;
  try {
    const res = await rqDo(r, a, inp ? inp.value.trim() : '', inp2 ? inp2.value.trim() : '');
    if (res && res.err) { rqToast(res.err); const f = res.field === 2 ? inp2 : inp; if (f) f.focus(); if (btn) btn.disabled = false; return; }
    if (res && res.skip) { box.innerHTML = ''; return; }
    await rqReload();
    const fresh = rq.data.reqs.find(function(x) { return x.id === r.id; }) || r;
    await rqRenderCard(m, fresh);
  } catch (e) { rqToast('Не удалось сохранить'); if (btn) btn.disabled = false; }
}

// ---------- статистика ----------
// Все цифры считает rqStats() — их же показывает экран и выгружает Excel, расхождений быть не может.
// Период (30 / 90 / 365 дней / всё время) — для «поступило, выполнено, в срок, медиана, переносы, эскалации, возвраты»;
// «открыто / просрочено / аварии» — всегда на сегодня.
const RQ_PERIODS = [[30, '30 дней'], [90, '3 месяца'], [365, 'год'], [0, 'всё время']];
function rqMgrKey(o) { return !o ? '' : o.manager_user_id ? 'u' + o.manager_user_id : o.manager_name ? 'n' + o.manager_name : ''; }
function rqMgrLabel(k) { return !k ? 'Без управляющего' : k[0] === 'u' ? rqUser(Number(k.slice(1))) : k.slice(1) + ' (нет учётки в CRM)'; }
function rqStats() {
  const reqs = rq.data.reqs, days = rq.statsDays;
  const sinceD = function(n) { const d = new Date(); d.setDate(d.getDate() - n); return rqIso(d); };
  const from = days ? sinceD(days) : '0000';
  const inP = function(v) { return !!v && String(v).slice(0, 10) >= from; };
  const isOpen = function(r) { return RQ_OPEN.indexOf(r.status) !== -1; };
  const inTime = function(r) { return !r.due_date || String(r.done_at).slice(0, 10) <= String(r.due_date).slice(0, 10); };
  const reopenOf = {};
  (rq.data.reopens || []).forEach(function(e) { if (inP(e.createdAt)) reopenOf[e.request_id] = (reopenOf[e.request_id] || 0) + 1; });
  function metrics(l) {
    const o = l.filter(isOpen), done = l.filter(function(r) { return inP(r.done_at); });
    const med = rqMedian(done.map(function(r) { return rqDays(String(r.createdAt).slice(0, 10), String(r.done_at).slice(0, 10)); }));
    return { total: l.length, open: o.length, late: o.filter(rqLate).length, em: o.filter(function(r) { return r.urgency === 'emergency'; }).length,
      created: l.filter(function(r) { return inP(r.createdAt); }).length, done: done.length,
      ontime: done.length ? Math.round(100 * done.filter(inTime).length / done.length) : null, med: med,
      moved: l.filter(function(r) { return inP(r.createdAt) && r.due_moved > 0; }).length,
      esc: l.filter(function(r) { return inP(r.escalated_at); }).length,
      reopen: l.reduce(function(n, r) { return n + (reopenOf[r.id] || 0); }, 0) };
  }
  function group(keyFn, labelFn) {
    const g = {};
    reqs.forEach(function(r) { const k = keyFn(r); if (k === null || k === undefined) return; (g[k] = g[k] || []).push(r); });
    return Object.keys(g).map(function(k) { return Object.assign({ k: k, label: labelFn(k) }, metrics(g[k])); })
      .sort(function(a, b) { return b.late - a.late || b.open - a.open || b.done - a.done || a.label.localeCompare(b.label, 'ru'); });
  }
  const objs = rq.data.objects || [];
  const mgrOfObj = {}; objs.forEach(function(o) { mgrOfObj[o.name] = rqMgrKey(o); });
  const byMgr = group(function(r) { return mgrOfObj[r.object_name] || ''; }, rqMgrLabel).map(function(x) {
    x.objects = objs.filter(function(o) { return rqMgrKey(o) === x.k; }).map(function(o) { return o.name; });
    return x;
  });
  const all = metrics(reqs);
  const weeks = [];
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  for (let i = 7; i >= 0; i--) { const s = new Date(mon); s.setDate(s.getDate() - 7 * i); const e = new Date(s); e.setDate(e.getDate() + 7); weeks.push([rqIso(s), rqIso(e)]); }
  const inW = function(v, w) { const x = String(v || '').slice(0, 10); return x >= w[0] && x < w[1]; };
  return {
    all: all, byMgr: byMgr,
    byObj: group(function(r) { return r.object_name || null; }, function(k) { return k; }),
    byResp: group(function(r) { return r.responsible_id ? String(r.responsible_id) : null; }, function(k) { return rqUser(Number(k)); }),
    byKind: group(function(r) { return r.kind || null; }, function(k) { return k; }),
    weeks: weeks.map(function(w) {
      const done = reqs.filter(function(r) { return inW(r.done_at, w); });
      const openEnd = reqs.filter(function(r) {   // висело открытыми на конец недели
        const c = String(r.createdAt || '').slice(0, 10), d = String(r.done_at || '').slice(0, 10), x = String(r.closed_at || '').slice(0, 10);
        return c && c < w[1] && !(d && d < w[1]) && !(x && x < w[1]);
      }).length;
      return { from: w[0], created: reqs.filter(function(r) { return inW(r.createdAt, w); }).length, done: done.length, ontime: done.filter(inTime).length, openEnd: openEnd };
    })
  };
}
const RQ_COLS_STAT = [['open', 'Открыто'], ['late', 'Просрочено'], ['em', 'Аварии'], ['created', 'Поступило'], ['done', 'Выполнено'], ['ontime', 'В срок, %'], ['med', 'Медиана, дн.'], ['moved', 'Переносили срок'], ['esc', 'Эскалации'], ['reopen', 'Возвраты']];
const RQ_COLS_HINT = { open: 'Сейчас', late: 'Сейчас, срок прошёл', em: 'Открытые аварии сейчас', created: 'Поступило за период', done: 'Выполнено за период', ontime: 'Доля выполненных за период не позже срока',
  med: 'Медиана дней от создания до выполнения (за период)', moved: 'Заявки за период, срок которых переносили', esc: 'Эскалации старшему управляющему за период', reopen: 'Сколько раз за период автор вернул «не выполнено»' };
function rqCell(x, k) { const v = x[k]; return v === null || v === undefined ? '—' : k === 'med' ? Math.round(v * 10) / 10 : v; }
const RQ_BY = [['mgr', 'Управляющие', 'byMgr', null], ['obj', 'Объекты', 'byObj', 'obj'], ['resp', 'Ответственные', 'byResp', 'resp'], ['kind', 'Типы заявок', 'byKind', 'kind']];
const RQ_MAIN = [['open', 'Открыто', 'now'], ['late', 'Просрочено', 'now'], ['em', 'Аварии', 'now'], ['created', 'Поступило', 'per'], ['done', 'Выполнено', 'per'], ['ontime', 'В срок', 'per'], ['med', 'Медиана, дн.', 'per']];
function rqStatCell(x, k) {
  const v = rqCell(x, k);
  if (v === '—') return '<span class="st-mute">—</span>';
  if (k === 'late') return v ? '<span class="st-bad">' + v + '</span>' : '<span class="st-mute">0</span>';
  if (k === 'em') return v ? '<span class="st-bad">⚠ ' + v + '</span>' : '<span class="st-mute">0</span>';
  if (k === 'ontime') return '<span class="' + (v >= 80 ? 'st-ok' : v >= 50 ? 'st-warn' : 'st-badt') + '">' + v + '%</span>';
  return v === 0 ? '<span class="st-mute">0</span>' : v;
}
function rqProblems(x) {
  const p = [];
  if (x.moved) p.push('переносили срок: ' + x.moved);
  if (x.reopen) p.push('возвраты: ' + x.reopen);
  if (x.esc) p.push('эскалации: ' + x.esc);
  return p.length ? p.map(function(t) { return '<span class="st-chip">' + t + '</span>'; }).join(' ') : '<span class="st-mute">нет</span>';
}
async function rqRenderStats() {
  const body = document.getElementById('rq-body');
  if (!rq.data.reopens) {
    body.innerHTML = '<div class="rq-empty">Считаю…</div>';
    try { rq.data.reopens = rqRows(await ctx.api.resource('request_events').list({ filter: { kind: 'status', text: { $includes: 'Возвращена в работу' } }, fields: ['request_id', 'createdAt'], paginate: false })); }
    catch (e) { rq.data.reopens = []; }
    if (rq.tab !== 'stats') return;
  }
  const st = rqStats(), a = st.all, urgent = rq.data.reqs.filter(function(r) { return RQ_OPEN.indexOf(r.status) !== -1 && r.urgency === 'urgent'; }).length;
  const per = (RQ_PERIODS.find(function(p) { return p[0] === rq.statsDays; }) || [0, ''])[1];
  const tiles = [
    ['Открыто сейчас', a.open, a.late ? '<span class="st-bad">просрочено ' + a.late + '</span>' : 'просрочек нет', { quick: 'open' }],
    ['Аварии в работе', a.em, 'срочных: ' + urgent, { quick: 'open' }],
    ['Поступило', a.created, 'за ' + per, { quick: 'all' }],
    ['Выполнено', a.done, a.ontime === null ? 'за ' + per : 'в срок <b>' + a.ontime + '%</b>', { quick: 'closed' }],
    ['Срок выполнения', a.med === null ? '—' : rqCell(a, 'med') + '<small> ' + rqNoun(Math.round(a.med), 'день', 'дня', 'дней') + '</small>', 'медиана за ' + per, { quick: 'closed' }],
    ['Проблемы', a.moved + a.reopen + a.esc, [[a.moved, 'переносы'], [a.reopen, 'возвраты'], [a.esc, 'эскалации']].filter(function(x) { return x[0]; }).map(function(x) { return x[1] + ' ' + x[0]; }).join(' · ') || 'за ' + per + ' нет', { quick: 'open' }]
  ];
  const by = RQ_BY.find(function(b) { return b[0] === rq.statsBy; }) || RQ_BY[0];
  const rows = st[by[2]];
  const table = rows.length ? '<div class="st-scroll"><table class="st-t"><thead><tr><th class="st-name">' + by[1].replace('Типы заявок', 'Тип') + '</th>'
      + RQ_MAIN.map(function(c, n) { return '<th class="n' + (n === 3 ? ' st-sep' : '') + ' st-' + c[2] + '" title="' + RQ_COLS_HINT[c[0]] + '">' + c[1] + '</th>'; }).join('')
      + '<th class="st-sep st-pr" title="Переносы срока, возвраты на доработку и эскалации старшему за период">Проблемы за период</th></tr></thead><tbody>'
      + rows.map(function(x) {
          const go = {}; if (by[3]) go[by[3]] = x.k;
          const noAcc = / \(нет учётки в CRM\)$/.test(x.label);
          return '<tr' + (by[3] ? ' data-go="' + rqEsc(JSON.stringify(go)) + '" class="st-link"' : '') + '><td class="st-name"><div>' + rqEsc(x.label.replace(/ \(нет учётки в CRM\)$/, '')) + '</div>'
            + (x.objects ? '<div class="st-sub">' + (noAcc ? '<span class="st-tag">нет учётки в CRM</span>' : '') + rqEsc(x.objects.join(', ') || 'объектов нет') + '</div>' : '') + '</td>'
            + RQ_MAIN.map(function(c, n) { return '<td class="n' + (n === 3 ? ' st-sep' : '') + '">' + rqStatCell(x, c[0]) + '</td>'; }).join('')
            + '<td class="st-sep st-pr">' + rqProblems(x) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
    : '<div class="rq-empty">Данных пока нет</div>';
  // неделя за неделей: растёт ли очередь — поступило против выполнено, разница, сколько висит на конец недели
  const W = st.weeks;
  const wrow = function(title, fn, hint) { return '<tr><th title="' + (hint || '') + '">' + title + '</th>' + W.map(function(w, i) { return '<td class="n">' + fn(w, i) + '</td>'; }).join('') + '</tr>'; };
  const weeks = '<div class="st-scroll"><table class="st-t st-wk"><thead><tr><th>Неделя с</th>' + W.map(function(w, i) { return '<th class="n">' + (i === W.length - 1 ? 'эта' : rqDate(w.from).slice(0, 5)) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + wrow('Поступило', function(w) { return w.created || '<span class="st-mute">0</span>'; })
    + wrow('Выполнено', function(w) { return w.done || '<span class="st-mute">0</span>'; })
    + wrow('Очередь за неделю', function(w) { const d = w.created - w.done; return d > 0 ? '<span class="st-badt">+' + d + '</span>' : d < 0 ? '<span class="st-ok">−' + (-d) + '</span>' : '<span class="st-mute">0</span>'; }, 'Поступило минус выполнено: плюс — очередь растёт, минус — разбирается')
    + wrow('Открыто на конец', function(w) { return '<b>' + w.openEnd + '</b>'; }, 'Сколько заявок оставалось незакрытыми в конце недели')
    + wrow('Выполнено в срок', function(w) { if (!w.done) return '<span class="st-mute">—</span>'; const p = Math.round(100 * w.ontime / w.done); return '<span class="' + (p >= 80 ? 'st-ok' : p >= 50 ? 'st-warn' : 'st-badt') + '">' + p + '%</span>'; })
    + '</tbody></table></div>';
  const first = W[0].openEnd, last = W[W.length - 1].openEnd;
  const trend = last > first ? '<span class="st-badt">очередь выросла с ' + first + ' до ' + last + '</span>' : last < first ? '<span class="st-ok">очередь сократилась с ' + first + ' до ' + last + '</span>' : 'очередь не изменилась: ' + last;
  body.innerHTML = '<div class="st">'
    + '<div class="st-bar"><span class="st-lbl">Период</span><div class="rq-view">' + RQ_PERIODS.map(function(p) { return '<button data-period="' + p[0] + '"' + (rq.statsDays === p[0] ? ' class="on"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div>'
    + '<button class="rq-btn" data-act="xlsx" style="margin-left:auto;">⬇ Выгрузить в Excel</button></div>'
    + '<div class="st-tiles">' + tiles.map(function(t) {
        return '<div class="st-tile" data-go="' + rqEsc(JSON.stringify(t[3])) + '"><div class="st-tl">' + t[0] + '</div><div class="st-tv">' + t[1] + '</div><div class="st-tn">' + t[2] + '</div></div>';
      }).join('') + '</div>'
    + '<div class="st-card"><div class="st-ch"><div class="st-ct">В разрезе</div><div class="rq-view">' + RQ_BY.map(function(b) { return '<button data-by="' + b[0] + '"' + (by[0] === b[0] ? ' class="on"' : '') + '>' + b[1] + '</button>'; }).join('') + '</div>'
    + '<span class="st-hint">открыто, просрочено, аварии — на ' + rqDate(rqToday()) + '; остальное — за ' + per + (by[3] ? '. Клик по строке — список этих заявок' : '') + '</span></div>' + table + '</div>'
    + '<div class="st-card"><div class="st-ch"><div class="st-ct">Неделя за неделей</div><span class="st-hint">за 8 недель ' + trend + '</span></div>' + weeks + '</div>'
    + '</div>';
}

// ---------- выгрузка статистики в Excel: общий вид всех выгрузок CRM (src/_crm-xlsx.js) ----------
// Цифры — из rqStats(), как на экране; «Итого» в разрезах — общие показатели (одна заявка может быть у нескольких ответственных).
const RQ_COL_T = { ontime: 'pct', med: 'days' };
function rqExportStats() {
  const st = rqStats(), per = (RQ_PERIODS.find(function(p) { return p[0] === rq.statsDays; }) || [0, ''])[1];
  const val = function(x, k) { const v = x[k]; return v === null || v === undefined ? null : k === 'med' ? Math.round(v * 10) / 10 : v; };
  const statCols = RQ_COLS_STAT.map(function(c) { return { h: c[1], t: RQ_COL_T[c[0]] || 'int', total: val(st.all, c[0]) }; });
  const cut = function(name, first, rows, extra) {
    return { name: name, title: 'Заявки по объектам — ' + name.toLowerCase(), total: true, freezeCols: 1,
      cols: [{ h: first, total: 'Итого' }].concat(extra ? extra.cols : [], statCols),
      rows: rows.map(function(x) { return [x.label].concat(extra ? extra.v(x) : [], RQ_COLS_STAT.map(function(c) { return val(x, c[0]); })); }) };
  };
  const a = st.all;
  const list = rq.data.reqs.slice().sort(function(x, y) { return y.id - x.id; }).map(function(r) {
    const o = (rq.data.objects || []).find(function(z) { return z.name === r.object_name; });
    return [r.id, r.createdAt, r.object_name || '', rqMgrKey(o) ? rqMgrLabel(rqMgrKey(o)) : '', r.kind || '', r.title || '', r.tenant_label || '', (RQ_URG[r.urgency] || RQ_URG.normal).l,
      (RQ_ST[r.status] || { l: r.status }).l, rqUser(r.responsible_id), rqUser(r.author_id), r.due_date || null,
      rqLate(r) ? rqDays(String(r.due_date).slice(0, 10), rqToday()) : null, Number(r.due_moved) || null, r.done_at || null, r.closed_at || null, r.result || ''];
  });
  crmXlsx('Заявки по объектам — статистика', {
    title: 'Заявки по объектам — статистика', filters: [['Период', per]],
    notes: RQ_COLS_STAT.map(function(c) { return [c[1], RQ_COLS_HINT[c[0]]]; }),
    sheets: [
      { name: 'Сводка', title: 'Заявки по объектам — сводка за период: ' + per, cols: [{ h: 'Показатель', w: 26 }, { h: 'Значение', t: 'num', w: 14 }, { h: 'Что это', t: 'long', w: 70 }],
        rows: RQ_COLS_STAT.map(function(c) { const v = val(a, c[0]); return [c[1], c[0] === 'ontime' && v !== null ? v + '%' : v, RQ_COLS_HINT[c[0]]]; }) },
      cut('По управляющим', 'Управляющий', st.byMgr, { cols: [{ h: 'Объекты', t: 'long', w: 34, total: false }], v: function(x) { return [x.objects.join(', ')]; } }),
      cut('По объектам', 'Объект', st.byObj),
      cut('По ответственным', 'Ответственный', st.byResp),
      cut('По типам', 'Тип заявки', st.byKind),
      { name: 'По неделям', title: 'Заявки по объектам — динамика по неделям', total: true,
        cols: [{ h: 'Неделя с', t: 'date', total: 'Итого' }, { h: 'Поступило', t: 'int' }, { h: 'Выполнено', t: 'int' }, { h: 'Очередь за неделю (+ растёт)', t: 'int' }, { h: 'Открыто на конец недели', t: 'int', total: false }, { h: 'Из них в срок', t: 'int' }, { h: 'В срок, %', t: 'pct', total: a.ontime == null ? false : a.ontime }],
        rows: st.weeks.map(function(w) { return [w.from, w.created, w.done, w.created - w.done, w.openEnd, w.ontime, w.done ? Math.round(100 * w.ontime / w.done) : null]; }) },
      { name: 'Все заявки', title: 'Заявки по объектам — все заявки', freezeCols: 1,
        cols: [{ h: '№', t: 'int', w: 7 }, { h: 'Создана', t: 'date' }, { h: 'Объект' }, { h: 'Управляющий' }, { h: 'Тип' }, { h: 'Суть', t: 'long', w: 40 }, { h: 'Арендатор' }, { h: 'Срочность' }, { h: 'Статус' },
          { h: 'Ответственный' }, { h: 'Автор' }, { h: 'Срок', t: 'date' }, { h: 'Просрочено, дн.', t: 'int' }, { h: 'Переносов срока', t: 'int' }, { h: 'Выполнена', t: 'date' }, { h: 'Закрыта', t: 'date' }, { h: 'Результат', t: 'long', w: 40 }],
        rows: list }
    ]
  });
}

// ---------- управляющие объектов (кому по умолчанию уходят заявки и кому эскалация) ----------
function rqRenderObjects() {
  const sel = function(o, f) { return '<select data-objset="' + f + '" data-id="' + o.id + '"><option value="">— нет учётки —</option>' + rqPeopleOptions(o[f]) + '</select>'; };
  document.getElementById('rq-body').innerHTML = '<div class="rq-card"><div class="rq-card-t">Управляющие объектов</div>'
    + '<div class="rq-hint" style="margin-bottom:8px;">Управляющий получает новые заявки объекта по умолчанию и напоминания о сроках; старший управляющий — аварии, эскалации после 3 дней просрочки и сводку по понедельникам. Пока у человека нет учётки в CRM, уведомления ему не приходят.</div>'
    + '<table><thead><tr><th>Объект</th><th>Управляющий</th><th>Учётка в CRM</th><th>Старший управляющий</th><th>Учётка в CRM</th></tr></thead><tbody>'
    + rq.data.objects.map(function(o) {
        return '<tr><td>' + rqEsc(o.name) + '</td><td>' + rqEsc(o.manager_name || '—') + '</td><td>' + sel(o, 'manager_user_id') + '</td><td>' + rqEsc(o.senior_name || '—') + '</td><td>' + sel(o, 'senior_user_id') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
}
async function rqSaveObjectPerson(el, field) {
  const id = Number(el.getAttribute('data-id')), val = Number(el.value) || null;
  try {
    const values = {}; values[field] = val;
    await ctx.api.resource('contract_objects').update({ filterByTk: id, values: values });
    const o = rq.data.objects.find(function(x) { return x.id === id; }); if (o) o[field] = val;
    rqToast('Сохранено');
  } catch (e) { rqToast('Не удалось сохранить'); }
}
