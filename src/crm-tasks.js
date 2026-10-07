// Страница «Задачи (тест)» (/admin/tskpage01, блок crmblock002) — тестовый контур CRM.
// Коллекции — scripts/setup_crm_tasks.py, начальные данные — scripts/import_pyrus.py.
// Процесс задачи: Новая → В работе → Ждёт → На проверке (исполнитель отметил «Выполнена») → Закрыта проверяющим, + Отменена.
// Проверяющий = ответственный, если не указан — автор. Уведомления — очередь task_notifications → колокольчик.
// Вкладки: Задачи · Отчёты. Сотрудники и структура — на странице «Персонал» (src/crm-hr.js), ссылки на людей ведут туда.
// ?new=<u id учётки | e id сотрудника> — новая задача этому человеку, ?new=hr:<id сотрудника> — кадровая задача (из карточки «Персонала»).
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
if (!document.getElementById('crm-tk-style')) {
  const st = document.createElement('style');
  st.id = 'crm-tk-style';
  st.textContent = `
    .tk { color:#1f1f1f; font-size:14px; }
    [aria-label="Открыть ИИ-чат"] { display:none !important; }
    .tk-head { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:4px; }
    .tk-title { font-size:20px; font-weight:700; }
    .tk-sub { color:#8c8c8c; font-size:13px; margin-bottom:14px; }
    .tk-tabs { display:flex; gap:2px; border-bottom:1px solid #f0f0f0; margin-bottom:14px; flex-wrap:wrap; }
    .tk-tab { border:none; background:none; padding:9px 14px; font:inherit; font-size:14px; color:#595959; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
    .tk-tab.on { color:#1c2d58; border-bottom-color:#1c2d58; font-weight:600; }
    .tk-tab b { font-weight:600; color:#8c8c8c; margin-left:4px; font-size:12.5px; }
    .tk-new { margin-left:auto; border:none; background:#1c2d58; color:#fff; border-radius:8px; padding:9px 18px; font:inherit; font-size:14px; font-weight:600; cursor:pointer; }
    .tk-new:hover { background:#2f4373; }
    .tk-views { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
    .tk-view { border:1px solid #f0f0f0; background:#fff; border-radius:10px; padding:8px 14px; font:inherit; cursor:pointer; text-align:left; min-width:120px; }
    .tk-view:hover { border-color:#b4bfd9; }
    .tk-view .n { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; display:block; line-height:1.2; }
    .tk-view .l { font-size:12.5px; color:#595959; }
    .tk-view.on { border-color:#1c2d58; background:#eef1f8; }
    .tk-view.on .l { color:#142142; font-weight:600; }
    .tk-view.bad .n { color:#cf1322; }
    .tk-layout { display:flex; gap:2px; background:#f5f5f5; border-radius:6px; padding:2px; }
    .tk-layout button { border:none; background:transparent; padding:4px 12px; border-radius:5px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    .tk-layout button.on { background:#fff; color:#1f1f1f; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
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
    .tk-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
    .tk select, .tk input[type=text], .tk input[type=date], .tk textarea, .tk-modal select, .tk-modal input[type=text], .tk-modal input[type=date], .tk-modal textarea {
      border:1px solid #d9d9d9; border-radius:6px; padding:7px 10px; font:inherit; font-size:13.5px; background:#fff; color:#262626; box-sizing:border-box; }
    .tk-filters select { min-width:160px; }
    .tk-filters input[type=text] { flex:1; min-width:200px; }
    .tk-reset { border:none; background:none; color:#1c2d58; font:inherit; font-size:13px; cursor:pointer; padding:4px; }
    .tk-list { display:flex; flex-direction:column; gap:6px; }
    .tk-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; border:1px solid #f0f0f0; border-left:4px solid var(--c); border-radius:8px; padding:10px 14px; background:#fff; cursor:pointer; }
    .tk-row:hover { border-color:#b4bfd9; border-left-color:var(--c); background:#fcfdff; }
    .tk-row-title { font-weight:600; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tk-row-meta { font-size:12.5px; color:#8c8c8c; display:flex; gap:12px; flex-wrap:wrap; margin-top:3px; }
    .tk-row-meta span { white-space:nowrap; }
    .tk-row-side { text-align:right; white-space:nowrap; }
    .tk-pill { display:inline-block; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; border:1px solid; white-space:nowrap; }
    .tk-tag { display:inline-block; padding:0 7px; border-radius:4px; background:#f5f5f5; color:#595959; font-size:12px; }
    .tk-urg { font-weight:600; }
    .tk-late { color:#cf1322; font-weight:600; }
    .tk-empty { color:#8c8c8c; padding:36px 12px; text-align:center; background:#fafafa; border-radius:8px; }
    .tk-empty b { display:block; color:#434343; font-size:15px; margin-bottom:4px; }
    .tk-more { display:block; margin:10px auto 0; }
    .tk-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
    .tk-tile { border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; background:#fff; }
    .tk-tile-l { font-size:12.5px; color:#8c8c8c; }
    .tk-tile-v { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px; }
    .tk-tile-n { font-size:12px; color:#8c8c8c; margin-top:2px; }
    .tk-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(460px, 1fr)); gap:12px; }
    .tk-card { border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; background:#fff; min-width:0; overflow-x:auto; }
    .tk-card-t { font-weight:600; margin-bottom:8px; }
    .tk table, .tk-modal table { width:100%; border-collapse:collapse; font-size:13px; }
    .tk th, .tk-modal th { text-align:left; font-weight:600; color:#595959; padding:6px 8px; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
    .tk td, .tk-modal td { padding:6px 8px; border-bottom:1px solid #f5f5f5; font-variant-numeric:tabular-nums; }
    .tk th.n, .tk td.n, .tk-modal td.n { text-align:right; }
    .tk tr[data-go], .tk-modal tr[data-task] { cursor:pointer; }
    .tk tr[data-go]:hover td, .tk-modal tr[data-task]:hover td { background:#f5faff; }
    /* окна */
    .tk-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
    .tk-box { background:#fff; border-radius:12px; width:100%; max-width:760px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f1f1f; }
    .tk-box-h { display:flex; align-items:flex-start; gap:10px; padding:16px 20px 12px; border-bottom:1px solid #f0f0f0; }
    .tk-box-t { font-size:17px; font-weight:700; flex:1; min-width:0; }
    .tk-box-t small { display:block; margin-top:6px; font-size:13px; font-weight:400; color:#595959; }
    .tk-x { border:none; background:transparent; font-size:18px; color:#8c8c8c; cursor:pointer; padding:2px 6px; }
    .tk-box-b { padding:16px 20px 20px; }
    .tk-form { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px 16px; }
    .tk-form .full { grid-column:1 / -1; }
    .tk-f label { display:block; font-size:12.5px; color:#595959; margin-bottom:4px; }
    .tk-f label i { color:#cf1322; font-style:normal; }
    .tk-f select, .tk-f input, .tk-f textarea { width:100%; }
    .tk-f textarea { min-height:70px; resize:vertical; }
    .tk-hint { font-size:12px; color:#8c8c8c; margin-top:3px; }
    .tk-seg { display:flex; gap:6px; flex-wrap:wrap; }
    .tk-seg button { flex:1; border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:7px 8px; font:inherit; font-size:13px; cursor:pointer; white-space:nowrap; }
    .tk-seg button.on { border-color:var(--c); background:var(--c); color:#fff; font-weight:600; }
    .tk-quickdue { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
    .tk-quickdue button { border:1px solid #d9d9d9; background:#fafafa; border-radius:12px; padding:2px 10px; font:inherit; font-size:12.5px; cursor:pointer; color:#434343; }
    .tk-quickdue button:hover { border-color:#1c2d58; color:#1c2d58; }
    .tk-adv { margin-top:14px; border-top:1px dashed #e8e8e8; padding-top:10px; }
    .tk-adv-t { border:none; background:none; color:#1c2d58; font:inherit; font-size:13.5px; cursor:pointer; padding:0; }
    .tk-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; align-items:center; }
    .tk-btn { border:1px solid #d9d9d9; background:#fff; border-radius:6px; padding:7px 14px; font:inherit; font-size:13.5px; cursor:pointer; color:#262626; }
    .tk-btn:hover { border-color:#1c2d58; color:#1c2d58; }
    .tk-btn.pri { border-color:#1c2d58; background:#1c2d58; color:#fff; font-weight:600; }
    .tk-btn.ok { border-color:#389e0d; background:#389e0d; color:#fff; font-weight:600; }
    .tk-btn.warn { color:#cf1322; border-color:#ffccc7; }
    .tk-btn.link { border-color:transparent; color:#595959; }
    .tk-btn:disabled { opacity:.5; cursor:default; }
    .tk-next { border:1px solid #d6e4ff; background:#f3f5fa; border-radius:10px; padding:12px 14px; margin-bottom:14px; }
    .tk-next-t { font-weight:600; margin-bottom:2px; }
    .tk-next-s { font-size:13px; color:#595959; }
    .tk-next .tk-actions { margin-top:10px; }
    .tk-meta { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:10px 16px; font-size:13.5px; }
    .tk-meta .l { font-size:12px; color:#8c8c8c; margin-bottom:1px; }
    .tk-desc { white-space:pre-wrap; background:#fafafa; border-radius:8px; padding:10px 12px; margin-top:12px; font-size:13.5px; }
    .tk-actbox { margin-top:12px; padding:12px; border:1px solid #d6e4ff; background:#fff; border-radius:8px; }
    .tk-more-menu { display:none; gap:6px; flex-wrap:wrap; margin-top:8px; }
    .tk-more-menu.on { display:flex; }
    .tk-tl { margin-top:18px; border-top:1px solid #f0f0f0; padding-top:12px; }
    .tk-tl-h { display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap; }
    .tk-tl-h b { font-size:14.5px; }
    .tk-msg { display:flex; gap:10px; padding:8px 0; font-size:13.5px; }
    .tk-msg .tk-ava { width:30px; height:30px; font-size:11.5px; }
    .tk-msg-b { min-width:0; flex:1; }
    .tk-msg-h { font-size:12.5px; color:#8c8c8c; }
    .tk-msg-h b { color:#434343; margin-right:6px; }
    .tk-msg-t { white-space:pre-wrap; margin-top:1px; }
    .tk-msg.sys { font-size:12.5px; color:#8c8c8c; padding:4px 0 4px 40px; }
    .tk-msg.sys .tk-msg-t { display:inline; }
    .tk-msg a { color:#1c2d58; cursor:pointer; }
    .tk-comment { display:flex; gap:8px; margin-top:12px; align-items:flex-start; }
    .tk-comment textarea { flex:1; min-height:40px; resize:vertical; }
    .tk-sec { font-weight:600; margin:18px 0 6px; display:flex; align-items:center; gap:10px; }
    @media (max-width: 700px) {
      .tk-new { margin-left:0; width:100%; padding:12px; font-size:15px; }
      .tk-view { flex:1 1 30%; min-width:0; padding:6px 10px; }
      .tk-filters select, .tk-filters input[type=text] { flex:1 1 100%; min-width:0; }
      .tk-row { grid-template-columns:1fr; }
      .tk-row-side { text-align:left; }
      .tk-grid2 { grid-template-columns:1fr; }
      .tk-modal { padding:0; }
      .tk-box { border-radius:0; min-height:100%; max-width:none; }
      .tk-form, .tk-meta { grid-template-columns:1fr; }
      .tk-btn { flex:1 1 45%; padding:10px; }
      .tk-comment { flex-wrap:wrap; }
      .tk-comment textarea { flex:1 1 100%; min-height:60px; }
      .tk-comment .tk-btn { flex:1 1 auto; }
    }
  `;
  document.head.appendChild(st);
}

const TK_PAGE = '/admin/tskpage01';   // «Задачи (тест)»
const TK_HR_PAGE = '/admin/hrpage01'; // «Персонал (тест)»: сотрудники, структура, кадры
const TK_ST = {
  new: { l: 'Новая', c: '#1c2d58' }, in_work: { l: 'В работе', c: '#d48806' }, waiting: { l: 'Ждёт', c: '#722ed1' },
  done: { l: 'На проверке', c: '#13a8a8' }, closed: { l: 'Закрыта', c: '#389e0d' }, cancelled: { l: 'Отменена', c: '#8c8c8c' }
};
const TK_OPEN = ['new', 'in_work', 'waiting'];
const TK_URG = { normal: { l: 'Обычная', d: 3, c: '#595959' }, urgent: { l: 'Срочно', d: 1, c: '#d46b08' }, asap: { l: 'Горит', d: 0, c: '#cf1322' } };
const TK_KINDS = ['Общая', 'Объект и арендаторы', 'Финансы и платежи', 'Документы', 'Кадры'];
const TK_WAIT = ['ответа коллеги', 'ответа арендатора', 'подрядчика', 'оплаты', 'согласования руководства', 'документов', 'другое'];
const TK_HR_TPL = ['Отпуск', 'Больничный', 'Приём на работу', 'Увольнение', 'Перевод / смена должности', 'Командировка', 'Отгул'];
const TK_HR_DEPT = 'HR служба персонала';
const TK_AVA = ['#1c2d58', '#13a8a8', '#722ed1', '#d46b08', '#389e0d', '#c41d7f', '#2f4373', '#08979c'];
const tk = { data: null, me: null, myEmp: null, tab: 'list', view: '', exec: '', kind: '', obj: '', q: '', limit: 50, layout: 'list', drop: null };
try { if (localStorage.getItem('crm-tasks-layout') === 'board') tk.layout = 'board'; } catch (e) { /* хранилище недоступно — список */ }

function tkEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function tkToken() { try { return localStorage.getItem('NOCOBASE_TOKEN'); } catch (e) { return null; } }
function tkRows(res) { const d = (res && res.data && res.data.data) ? res.data.data : (res && res.data) ? res.data : []; return Array.isArray(d) ? d : (d ? [d] : []); }
function tkIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function tkToday() { return tkIso(new Date()); }
function tkDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function tkDateTime(v) { if (!v) return ''; const d = new Date(v); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + String(d.getFullYear()).slice(2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function tkDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
function tkNoun(n, a, b, c) { const x = Math.abs(n) % 100, y = x % 10; return (x > 10 && x < 20) ? c : y === 1 ? a : (y >= 2 && y <= 4) ? b : c; }
function tkMedian(a) { if (!a.length) return null; const s = a.slice().sort(function(x, y) { return x - y; }); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
// ponytail: только выходные, праздники не учитываются — производственный календарь, если сроки начнут спорить
function tkAddWorkDays(n) {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) i++; }
  return tkIso(d);
}
function tkAddDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return tkIso(d); }
function tkIsOpen(t) { return TK_OPEN.indexOf(t.status) !== -1; }
function tkLate(t) { return tkIsOpen(t) && t.due_date && String(t.due_date).slice(0, 10) < tkToday(); }
// срок по-человечески: «срок сегодня», «срок завтра», «просрочено на 3 дня»
function tkDue(t) {
  if (!t.due_date) return 'без срока';
  const d = String(t.due_date).slice(0, 10), n = tkDays(tkToday(), d);
  if (!tkIsOpen(t)) return 'срок ' + tkDate(d);
  if (n < 0) return '<span class="tk-late">просрочено на ' + (-n) + ' ' + tkNoun(-n, 'день', 'дня', 'дней') + '</span>';
  if (n === 0) return '<span class="tk-late">срок сегодня</span>';
  if (n === 1) return 'срок завтра';
  return 'срок ' + tkDate(d);
}
function tkUserName(id) { const u = tk.data && tk.data.users[id]; return u ? (u.nickname || u.username) : null; }
function tkEmp(id) { return (tk.data.emps || []).find(function(e) { return e.id === Number(id); }) || null; }
function tkEmpOfUser(uid) { return uid ? (tk.data.emps || []).find(function(e) { return Number(e.user_id) === Number(uid); }) || null : null; }
// единый вид «Фамилия Имя»: для учётки — ФИО из справочника сотрудников, иначе сохранённое имя, иначе ник учётки
function tkWho(id, name) {
  const e = tkEmpOfUser(id);
  if (e && e.full_name) return e.full_name;
  return name || String(tkUserName(id) || '').replace(/ \(тест\)$/, '') || (id ? '#' + id : '—');
}
function tkInitials(n) { const p = String(n || '?').split(/\s+/); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }
function tkAva(n) {
  let h = 0; for (let i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) >>> 0;
  return '<span class="tk-ava" style="background:' + TK_AVA[h % TK_AVA.length] + ';">' + tkEsc(tkInitials(n).toUpperCase()) + '</span>';
}
function tkExecKey(t) { return t.executor_id ? 'u' + t.executor_id : t.executor_name ? 'n' + t.executor_name : ''; }
function tkIsAdmin() { return !!(tk.me && tk.me.__isAdmin); }
function tkPill(s) { const x = TK_ST[s] || { l: s, c: '#8c8c8c' }; return '<span class="tk-pill" style="color:' + x.c + ';border-color:' + x.c + '55;background:' + x.c + '10;">' + tkEsc(x.l) + '</span>'; }
function tkChecker(t) { return Number(t.controller_id || t.author_id) || null; }
function tkEmpTasks(e) {
  return tk.data.tasks.filter(function(t) {
    return (e.user_id && Number(t.executor_id) === Number(e.user_id)) || (t.executor_name && t.executor_name === e.full_name) || Number(t.employee_id) === e.id;
  });
}

async function tkMe() {
  const res = await fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + tkToken() } });
  const u = ((await res.json()) || {}).data || null;
  if (u) { const n = (u.roles || []).map(function(r) { return r.name; }); u.__isAdmin = n.indexOf('admin') !== -1 || n.indexOf('root') !== -1; }
  return u;
}
async function tkLoad() {
  const all = await Promise.all([
    ctx.api.resource('crm_tasks').list({ paginate: false, sort: ['-id'] }),
    ctx.api.resource('users').list({ paginate: false, fields: ['id', 'nickname', 'username'] }),
    ctx.api.resource('contract_objects').list({ paginate: false, sort: ['name'], fields: ['id', 'name'] }),
    ctx.api.resource('rental_contracts').list({ paginate: false, fields: ['id', 'contract_number', 'tenant_name', 'object_name'] }).catch(function() { return null; }),
    ctx.api.resource('crm_employees').list({ paginate: false, sort: ['last_name', 'first_name'] }),
    ctx.api.resource('crm_departments').list({ paginate: false, sort: ['sort', 'name'] })
  ]);
  const users = {};
  tkRows(all[1]).forEach(function(u) { users[u.id] = u; });   // служебные учётки — только для отображения имени, в выбор не попадают
  tk.data = { tasks: tkRows(all[0]), users: users, objects: tkRows(all[2]), contracts: tkRows(all[3]), emps: tkRows(all[4]), depts: tkRows(all[5]) };
  tk.myEmp = tkEmpOfUser(tk.me.id);
}
function tkNotify(userId, title, text, taskId) {
  if (!userId || (tk.me && Number(userId) === Number(tk.me.id))) return;
  ctx.api.resource('task_notifications').create({ values: { user_id: Number(userId), title: title, text: text, url: TK_PAGE + '?open=task:' + taskId } }).catch(function() { /* уведомление не должно ломать действие */ });
}
function tkEvent(taskId, kind, text, fileId) {
  return ctx.api.resource('crm_task_events').create({ values: { task_id: taskId, author_id: tk.me.id, author_name: tkWho(tk.me.id), kind: kind, text: text || '', file_id: fileId || null } });
}
async function tkUpload(file) {
  const boundary = '----tkBoundary' + Math.random().toString(16).slice(2);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';
  const res = await fetch('/api/attachments:upload', { method: 'POST', headers: { Authorization: 'Bearer ' + tkToken(), 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body: new Blob([head, file, '\r\n--' + boundary + '--\r\n']) });
  const id = (((await res.json()) || {}).data || {}).id;
  if (!id) throw new Error('upload');
  return id;
}
function tkToast(t) {
  const el = document.createElement('div');
  el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1100;max-width:90vw;';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2800);
}
function tkModal(html) {
  const m = document.createElement('div');
  m.className = 'tk-modal';
  m.innerHTML = '<div class="tk-box">' + html + '</div>';
  m.addEventListener('click', function(e) { if (e.target === m || (e.target.closest && e.target.closest('.tk-x'))) m.remove(); });
  document.body.appendChild(m);
  return m;
}
// люди для выбора: работающие сотрудники, value — "u<id учётки>" (без учётки — "e<id сотрудника>")
function tkPeopleOptions(selKey) {
  const seen = {}, out = [];
  tk.data.emps.filter(function(e) { return e.status !== 'fired'; }).forEach(function(e) {
    if (e.user_id) seen[e.user_id] = 1;
    out.push([e.user_id ? 'u' + e.user_id : 'e' + e.id, e.full_name || '', e.position || '']);
  });
  Object.keys(tk.data.users).forEach(function(id) {
    const u = tk.data.users[id];
    if (!seen[id] && u.username !== 'mail-service' && u.username !== 'nocobase' && !/^test_/.test(u.username)) out.push(['u' + id, tkWho(Number(id)), '']);
  });
  return out.sort(function(a, b) { return a[1].localeCompare(b[1], 'ru'); })
    .map(function(x) { return '<option value="' + x[0] + '"' + (x[0] === selKey ? ' selected' : '') + '>' + tkEsc(x[1] + (x[2] ? ' — ' + x[2] : '')) + '</option>'; }).join('');
}
function tkPersonFromKey(k) {
  if (!k) return { id: null, name: null };
  if (k[0] === 'u') { const id = Number(k.slice(1)); return { id: id, name: tkWho(id) }; }
  const e = tkEmp(Number(k.slice(1)));
  return { id: e && e.user_id ? Number(e.user_id) : null, name: e ? e.full_name : null };
}
function tkKeyOf(id, name) {
  if (id) return 'u' + id;
  const e = (tk.data.emps || []).find(function(x) { return x.full_name === name; });
  return e ? (e.user_id ? 'u' + e.user_id : 'e' + e.id) : '';
}

// ---------- задачи: списки по смыслу ----------
const TK_VIEWS = [
  ['mine', 'Мне поручено', function(l) { return l.filter(function(t) { return tkIsOpen(t) && Number(t.executor_id) === tk.me.id; }); }],
  ['given', 'Поручил я', function(l) { return l.filter(function(t) { return (tkIsOpen(t) || t.status === 'done') && Number(t.executor_id) !== tk.me.id && (Number(t.author_id) === tk.me.id || Number(t.controller_id) === tk.me.id); }); }],
  ['check', 'Проверить', function(l) { return l.filter(function(t) { return t.status === 'done' && tkChecker(t) === tk.me.id; }); }],
  ['open', 'Все открытые', function(l) { return l.filter(tkIsOpen); }],
  ['late', 'Просроченные', function(l) { return l.filter(tkLate); }],
  ['closed', 'Закрытые', function(l) { return l.filter(function(t) { return t.status === 'closed' || t.status === 'cancelled'; }); }]
];
const TK_EMPTY = {
  mine: ['Вам сейчас ничего не поручено', 'Когда кто-то поставит вам задачу, она появится здесь.'],
  given: ['Вы пока никому не поручали задач', 'Нажмите «+ Поставить задачу», выберите исполнителя и срок.'],
  check: ['Проверять нечего', 'Здесь появятся задачи, которые исполнители отметили выполненными.'],
  open: ['Открытых задач нет', ''], late: ['Просроченных задач нет', 'Все укладываются в сроки.'], closed: ['Закрытых задач пока нет', '']
};

// ---------- каркас ----------
ctx.render('<div id="crm-tasks" class="tk"><div class="tk-empty">Загрузка…</div></div>');
function tkRoot() { return (ctx.element && ctx.element.querySelector('#crm-tasks')) || document.getElementById('crm-tasks'); }
function tkBody() { return tkRoot().querySelector('[data-tk-body]'); }
async function tkStart() {
  try {
    tk.me = await tkMe();
    await tkLoad();
    tk.view = TK_VIEWS[0][2](tk.data.tasks).length ? 'mine' : TK_VIEWS[2][2](tk.data.tasks).length ? 'check' : 'open';
    tkRender();
    const m = location.search.match(/[?&]open=(task|emp):(\d+)/);
    if (m) {
      if (m[1] === 'task') tkOpenCard(Number(m[2])); else tkOpenEmp(Number(m[2]));
      try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ }
    }
    const n = location.search.match(/[?&]new=(hr:)?([ue]?\d+)/);
    if (n) {
      if (n[1]) tkOpenNew({ kind: 'Кадры', employee_id: Number(n[2]), executor: tk.myEmp && tk.myEmp.department === TK_HR_DEPT ? 'u' + tk.me.id : '' });
      else tkOpenNew({ executor: n[2] });
      try { window.history.replaceState(null, '', location.pathname); } catch (e) { /* песочница */ }
    }
  } catch (e) {
    tkRoot().innerHTML = '<div class="tk-empty" style="color:#cf1322;">Не удалось загрузить задачи. Обновите страницу.</div>';
  }
}
async function tkReload() { await tkLoad(); tkRender(); }
tkRoot().addEventListener('click', tkOnClick);
tkRoot().addEventListener('change', tkOnChange);
tkRoot().addEventListener('input', function(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'q') { tk.q = e.target.value; tk.limit = 50; tkRenderList(); }
});
tkStart();

function tkRender() {
  const open = tk.data.tasks.filter(tkIsOpen).length;
  const tabs = [['list', 'Задачи', open], ['stats', 'Отчёты', '']];
  tkRoot().innerHTML = '<div class="tk-head"><div class="tk-title">Задачи</div><button class="tk-new" data-act="new"><svg class=nb-plus viewBox=0,0,12,12 width=.75em height=.75em style=vertical-align:-.04em;margin-right:.4em;flex:none aria-hidden=true><path d=M6,1.5V10.5M1.5,6H10.5 stroke=currentColor stroke-width=1.8 stroke-linecap=round /></svg>Поставить задачу</button></div>'
    + '<div class="tk-sub">Поставьте задачу → исполнитель получит уведомление → отметит «Выполнена» → вы проверите и закроете.</div>'
    + '<div class="tk-tabs">' + tabs.map(function(t) { return '<button class="tk-tab' + (tk.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + (t[2] !== '' ? '<b>' + t[2] + '</b>' : '') + '</button>'; }).join('') + '</div>'
    + '<div data-tk-body></div>';
  if (tk.tab === 'list') tkRenderListShell();
  else tkRenderStats();
}

function tkHasFilter() { return !!(tk.q || tk.exec || tk.kind || tk.obj); }
function tkRenderListShell() {
  const d = tk.data, execs = {};
  d.tasks.forEach(function(t) { const k = tkExecKey(t); if (k) execs[k] = tkWho(t.executor_id, t.executor_name); });
  const ek = Object.keys(execs).sort(function(a, b) { return execs[a].localeCompare(execs[b], 'ru'); });
  tkBody().innerHTML = '<div class="tk-views" data-tk-views></div><div class="tk-filters">'
    + '<input type="text" data-f="q" placeholder="Найти: текст задачи, номер, фамилия" value="' + tkEsc(tk.q) + '">'
    + '<select data-f="exec"><option value="">Любой исполнитель</option>' + ek.map(function(k) { return '<option value="' + tkEsc(k) + '"' + (tk.exec === k ? ' selected' : '') + '>' + tkEsc(execs[k]) + '</option>'; }).join('') + '</select>'
    + '<select data-f="kind"><option value="">Любой тип</option>' + TK_KINDS.map(function(k) { return '<option' + (tk.kind === k ? ' selected' : '') + '>' + tkEsc(k) + '</option>'; }).join('') + '</select>'
    + '<select data-f="obj"><option value="">Любой объект</option><option value="-"' + (tk.obj === '-' ? ' selected' : '') + '>— без объекта —</option>' + d.objects.map(function(o) { return '<option' + (tk.obj === o.name ? ' selected' : '') + '>' + tkEsc(o.name) + '</option>'; }).join('') + '</select>'
    + '<button class="tk-reset" data-act="reset"' + (tkHasFilter() ? '' : ' style="display:none;"') + '>Сбросить фильтры</button>'
    + '<div class="tk-layout" style="margin-left:auto;">' + [['list', 'Список'], ['board', 'Доска']].map(function(v) { return '<button data-layout="' + v[0] + '"' + (tk.layout === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>'; }).join('') + '</div>'
    + '</div><div class="tk-list" data-tk-list></div>';
  tkRenderList();
}
function tkFiltered() {
  const q = tk.q.trim().toLowerCase();
  return tk.data.tasks.filter(function(t) {
    if (tk.exec && tkExecKey(t) !== tk.exec) return false;
    if (tk.kind && t.kind !== tk.kind) return false;
    if (tk.obj === '-' ? !!t.object_name : (tk.obj && t.object_name !== tk.obj)) return false;
    if (q && [t.title, t.description, t.object_name, '№' + t.id, String(t.id), tkWho(t.executor_id, t.executor_name), tkWho(t.controller_id, t.controller_name), tkWho(t.author_id, t.author_name)].join(' ').toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
function tkRenderList() {
  const base = tkFiltered();
  const rs = tkRoot().querySelector('[data-act="reset"]'); if (rs) rs.style.display = tkHasFilter() ? '' : 'none';
  if (tk.layout === 'board') { tkRenderBoard(base); return; }
  tkRoot().querySelector('[data-tk-views]').innerHTML = TK_VIEWS.map(function(v) {
    const n = v[2](base).length;
    return '<button class="tk-view' + (tk.view === v[0] ? ' on' : '') + ((v[0] === 'late' || v[0] === 'check') && n ? ' bad' : '') + '" data-view="' + v[0] + '"><span class="n">' + n + '</span><span class="l">' + v[1] + '</span></button>';
  }).join('');
  const cur = TK_VIEWS.find(function(v) { return v[0] === tk.view; }) || TK_VIEWS[3];
  const rows = cur[2](base).sort(function(a, b) {   // открытые: «горит» и просрочка сверху, потом по сроку; закрытые — свежие сверху
    const w = function(t) { return !tkIsOpen(t) ? (t.status === 'done' ? 0 : 3) : t.urgency === 'asap' ? 0 : tkLate(t) ? 1 : 2; };
    return w(a) - w(b) || (w(a) === 3 ? String(b.closed_at || b.createdAt).localeCompare(String(a.closed_at || a.createdAt)) : String(a.due_date || '9').localeCompare(String(b.due_date || '9'))) || b.id - a.id;
  });
  const empty = TK_EMPTY[cur[0]] || ['Ничего нет', ''];
  tkRoot().querySelector('[data-tk-list]').innerHTML = rows.length ? rows.slice(0, tk.limit).map(tkRowHtml).join('')
      + (rows.length > tk.limit ? '<button class="tk-btn tk-more" data-act="more">Показать ещё ' + Math.min(100, rows.length - tk.limit) + ' из ' + (rows.length - tk.limit) + '</button>' : '')
    : '<div class="tk-empty"><b>' + (tkHasFilter() ? 'Под фильтр ничего не попало' : empty[0]) + '</b>' + (tkHasFilter() ? 'Измените или сбросьте фильтры.' : empty[1]) + '</div>';
}
function tkRowHtml(t) {
  const open = tkIsOpen(t), u = TK_URG[t.urgency], chk = tkChecker(t);
  return '<div class="tk-row" data-open="' + t.id + '" style="--c:' + (t.urgency === 'asap' && open ? '#cf1322' : (TK_ST[t.status] || {}).c || '#d9d9d9') + ';">'
    + '<div style="min-width:0;"><div class="tk-row-title">' + (u && t.urgency !== 'normal' && open ? '<span class="tk-urg" style="color:' + u.c + ';">' + tkEsc(u.l) + ' · </span>' : '') + tkEsc(t.title || 'Без названия') + '</div>'
    + '<div class="tk-row-meta"><span>👤 ' + tkEsc(tkWho(t.executor_id, t.executor_name)) + '</span><span>📅 ' + tkDue(t) + '</span>'
    + (t.status === 'done' && chk ? '<span>проверяет ' + tkEsc(tkWho(chk)) + '</span>' : '')
    + (t.object_name ? '<span class="tk-tag">' + tkEsc(t.object_name) + '</span>' : '') + (t.kind && t.kind !== 'Общая' ? '<span class="tk-tag">' + tkEsc(t.kind) + '</span>' : '') + '</div></div>'
    + '<div class="tk-row-side">' + tkPill(t.status) + (t.status === 'waiting' && t.wait_reason ? '<div class="tk-hint">ждём ' + tkEsc(t.wait_reason) + '</div>' : '') + '<div class="tk-hint">№' + t.id + '</div></div></div>';
}

function tkOnChange(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'exec' || f === 'kind' || f === 'obj') { tk[f] = e.target.value; tk.limit = 50; tkRenderList(); }
}
function tkOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  if (c('a[href^="tel:"], a[href^="mailto:"]')) return;
  const tab = c('[data-tab]');
  if (tab) { tk.tab = tab.getAttribute('data-tab'); tkRender(); return; }
  if (c('[data-act="new"]')) { tkOpenNew({}); return; }
  if (c('[data-act="more"]')) { tk.limit += 100; tkRenderList(); return; }
  if (c('[data-act="reset"]')) { tk.q = ''; tk.exec = ''; tk.kind = ''; tk.obj = ''; tkRenderListShell(); return; }
  const ly = c('[data-layout]');
  if (ly) { tk.layout = ly.getAttribute('data-layout'); try { localStorage.setItem('crm-tasks-layout', tk.layout); } catch (err) { /* не запомним — не страшно */ } tkRenderListShell(); return; }
  const vw = c('[data-view]');
  if (vw) { tk.view = vw.getAttribute('data-view'); tk.limit = 50; tkRenderList(); return; }
  const go = c('[data-go]');
  if (go) {   // из отчётов — в список с фильтром
    const p = JSON.parse(go.getAttribute('data-go'));
    tk.exec = p.exec || ''; tk.kind = p.kind || ''; tk.obj = p.obj || ''; tk.view = p.view || 'open'; tk.q = ''; tk.tab = 'list'; tk.limit = 50;
    tkRender(); return;
  }
  const op = c('[data-open]');
  if (op) tkOpenCard(Number(op.getAttribute('data-open')));
}

// ---------- доска ----------
// Колонки = статусы, одной высоты (до низа экрана), прокрутка внутри колонки. Взяли карточку — колонки, куда её можно
// перенести, подсвечены, остальные бледные. Перенос = то же действие, что кнопка в карточке (tkNext + tkDo): права, история,
// уведомления. Где нужен ввод (что сделано, чего ждём, причина) — форма прямо на карточке в новой колонке, без окон.
// Фильтры (исполнитель, тип, объект, поиск) действуют и на доске.
const TK_COLS = [['new', ['new'], 'Новые'], ['in_work', ['in_work'], 'В работе'], ['waiting', ['waiting'], 'Ждут'], ['done', ['done'], 'На проверке'], ['closed', ['closed', 'cancelled'], 'Закрытые']];
const TK_CLOSED_DAYS = 30;
const TK_DROP_ASK = { wait: 'Чего ждём', done: 'Что сделано — коротко, увидит проверяющий', reopen: 'Что нужно доделать', cancel: 'Почему отменяем' };
function tkColOf(st) { return (TK_COLS.find(function(c) { return c[1].indexOf(st) !== -1; }) || [''])[0]; }
function tkDropAction(from, col) {
  const open = TK_OPEN.indexOf(from) !== -1;
  if (col === 'in_work') return from === 'new' ? 'take' : from === 'waiting' ? 'resume' : !open ? 'reopen' : null;
  if (col === 'waiting') return (from === 'new' || from === 'in_work') ? 'wait' : null;
  if (col === 'done') return open ? 'done' : null;
  if (col === 'closed') return from === 'done' ? 'close' : open ? 'cancel' : null;
  return null;
}
function tkDropAllowed(t, col) {
  const a = tkDropAction(t.status, col), n = tkNext(t);
  return a && n.main.concat(n.more).some(function(x) { return x[0] === a; }) ? a : null;
}
function tkRenderBoard(base) {
  tkRoot().querySelector('[data-tk-views]').innerHTML = '';
  const d = new Date(); d.setDate(d.getDate() - TK_CLOSED_DAYS);
  const since = tkIso(d), pd = tk.drop;
  tkRoot().querySelector('[data-tk-list]').innerHTML = '<div class="kb" data-kb>' + TK_COLS.map(function(col) {
    let items = base.filter(function(t) { return pd && t.id === pd.id ? col[0] === pd.col : col[1].indexOf(t.status) !== -1; });
    const all = items.length;
    if (col[0] === 'closed') items = items.filter(function(t) { return String(t.closed_at || '').slice(0, 10) >= since; }).sort(function(a, b) { return String(b.closed_at || '').localeCompare(String(a.closed_at || '')); });
    else items.sort(function(a, b) {
      const w = function(t) { return pd && t.id === pd.id ? -1 : t.urgency === 'asap' ? 0 : tkLate(t) ? 1 : 2; };
      return w(a) - w(b) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')) || b.id - a.id;
    });
    return '<div class="kb-col" data-col="' + col[0] + '"><div class="kb-col-h" style="--c:' + TK_ST[col[1][0]].c + ';"><i></i>' + col[2] + '<b>' + items.length + '</b></div><div class="kb-col-b">'
      + items.map(tkCardHtml).join('')
      + (all > items.length ? '<div class="kb-note">Ещё ' + (all - items.length) + ' старше ' + TK_CLOSED_DAYS + ' дней — в списке «Закрытые»</div>' : '')
      + (items.length ? '' : '<div class="kb-empty">Пусто</div>') + '</div></div>';
  }).join('') + '</div>';
  kbFit();
  const f = document.querySelector('.kb-form [data-bf-in]'); if (f) f.focus();
}
function tkCardHtml(t) {
  const open = tkIsOpen(t), u = TK_URG[t.urgency], pd = tk.drop && tk.drop.id === t.id ? tk.drop : null;
  return '<div class="kb-card' + (pd ? ' pending' : '') + '"' + (pd ? '' : ' draggable="true" data-open="' + t.id + '"') + ' data-id="' + t.id + '" style="--c:' + (t.urgency === 'asap' && open ? '#cf1322' : (TK_ST[t.status] || {}).c || '#d9d9d9') + ';">'
    + '<div class="kb-t">' + (u && t.urgency !== 'normal' && open ? '<span style="color:' + u.c + ';">' + tkEsc(u.l) + ' · </span>' : '') + tkEsc(t.title || 'Без названия') + '</div>'
    + '<div class="kb-s">№' + t.id + ' · ' + tkEsc(tkWho(t.executor_id, t.executor_name)) + (t.object_name ? ' · ' + tkEsc(t.object_name) : '') + '</div>'
    + '<div class="kb-s">' + (open ? tkDue(t) : t.status === 'cancelled' ? 'отменена' : 'закрыта ' + tkDate(t.closed_at))
    + (t.status === 'waiting' && t.wait_reason ? ' · <span style="color:#722ed1;">ждём ' + tkEsc(t.wait_reason) + '</span>' : '') + '</div>'
    + (pd ? '<div class="kb-form"><label>' + TK_DROP_ASK[pd.a] + '</label>'
      + (pd.a === 'wait' ? '<select data-bf-in>' + TK_WAIT.map(function(w) { return '<option>' + w + '</option>'; }).join('') + '</select>' : '<textarea data-bf-in rows="2"></textarea>')
      + '<div class="kb-form-b"><button class="kb-ok" data-bf-ok>Сохранить</button><button class="kb-no" data-bf-no>Отмена</button><span>Ctrl+Enter — сохранить, Esc — отмена</span></div></div>' : '')
    + '</div>';
}
async function tkDrop(id, col) {
  const t = tk.data.tasks.find(function(x) { return x.id === id; });
  if (!t || tkColOf(t.status) === col) return;
  const a = tkDropAllowed(t, col);
  if (!a) return;
  if (TK_DROP_ASK[a]) { tk.drop = { id: id, col: col, a: a }; tkRenderList(); return; }   // нужен ввод — форма на карточке
  await tkDropSave(t, a, '');
}
async function tkDropSave(t, a, v) {
  try {
    const res = await tkDo(t, a, v, '', '', '');
    if (res && res.err) { tkToast(res.err); const f = document.querySelector('.kb-form [data-bf-in]'); if (f) f.focus(); return; }
    tk.drop = null;
    await tkReload();
    tkToast('№' + t.id + ': ' + (TK_DONE_MSG[a] || 'сохранено').toLowerCase());
  } catch (e) { tkToast('Не удалось сохранить'); tk.drop = null; tkRenderList(); }
}
function tkDropSubmit() {
  const pd = tk.drop, f = document.querySelector('.kb-form [data-bf-in]');
  if (!pd || !f) return;
  const t = tk.data.tasks.find(function(x) { return x.id === pd.id; });
  document.querySelectorAll('.kb-form button').forEach(function(b) { b.disabled = true; });
  tkDropSave(t, pd.a, f.value.trim()).then(function() { document.querySelectorAll('.kb-form button').forEach(function(b) { b.disabled = false; }); });
}
// доска до низа окна: колонки прокручиваются внутри, страница не растягивается
function kbFit() {
  const kb = document.querySelector('[data-kb]');
  if (!kb || window.innerWidth <= 700) return;
  kb.style.height = Math.max(380, window.innerHeight - kb.getBoundingClientRect().top - window.scrollY - 24) + 'px';
}
(function() {
  const root = tkRoot();
  let drag = null;
  if (!window.__tkKbResize) { window.__tkKbResize = true; window.addEventListener('resize', function() { kbFit(); }); }
  root.addEventListener('dragstart', function(e) {
    const k = e.target.closest ? e.target.closest('.kb-card[draggable]') : null;
    if (!k) return;
    const t = tk.data.tasks.find(function(x) { return x.id === Number(k.getAttribute('data-id')); });
    if (!t) return;
    drag = t;
    k.classList.add('drag');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(t.id));
    root.querySelectorAll('.kb-col').forEach(function(c) {
      const col = c.getAttribute('data-col');
      c.classList.add(col === tkColOf(t.status) ? 'home' : tkDropAllowed(t, col) ? 'ok' : 'no');
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
    tkDrop(drag.id, c.getAttribute('data-col'));
  });
  root.addEventListener('click', function(e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-bf-ok]')) { tkDropSubmit(); return; }
    if (e.target.closest('[data-bf-no]')) { tk.drop = null; tkRenderList(); }
  });
  root.addEventListener('keydown', function(e) {
    if (!tk.drop || !e.target.closest || !e.target.closest('.kb-form')) return;
    if (e.key === 'Escape') { tk.drop = null; tkRenderList(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.target.tagName === 'SELECT')) { e.preventDefault(); tkDropSubmit(); }
  });
})();

// ---------- новая задача ----------
// preset: { kind, employee_id, title, object_name, executor } — например, кадровая задача из карточки сотрудника
function tkOpenNew(preset) {
  const d = tk.data, hr = preset.kind === 'Кадры';
  const m = tkModal('<div class="tk-box-h"><div class="tk-box-t">' + (hr ? 'Кадровая задача' : 'Новая задача') + '</div><button class="tk-x">✕</button></div><div class="tk-box-b"><div class="tk-form">'
    + (hr ? '<div class="tk-f full"><label>Что оформляем</label><div class="tk-seg">' + TK_HR_TPL.map(function(x) { return '<button type="button" style="--c:#1c2d58;" data-hr="' + tkEsc(x) + '">' + tkEsc(x) + '</button>'; }).join('') + '</div></div>' : '')
    + '<div class="tk-f full"><label>Что сделать <i>*</i></label><input type="text" data-n="title" placeholder="Например: подготовить акт сверки с арендатором" value="' + tkEsc(preset.title || '') + '"></div>'
    + '<div class="tk-f"><label>Кому <i>*</i></label><select data-n="executor"><option value="">Выберите сотрудника</option>' + tkPeopleOptions(preset.executor || '') + '</select></div>'
    + '<div class="tk-f"><label>Срок</label><input type="date" data-n="due_date" min="2000-01-01" max="2099-12-31" value="' + tkAddWorkDays(TK_URG.normal.d) + '">'
    + '<div class="tk-quickdue"><button type="button" data-due="0">сегодня</button><button type="button" data-due="1">завтра</button><button type="button" data-due="7">через неделю</button><button type="button" data-due="">без срока</button></div></div>'
    + '<div class="tk-f full"><label>Подробности</label><textarea data-n="description" placeholder="Что именно нужно, где взять данные, что уже сделано"></textarea></div>'
    + '<div class="tk-f full"><label>Срочность</label><div class="tk-seg">' + Object.keys(TK_URG).map(function(k) { return '<button type="button" data-urg="' + k + '" style="--c:' + (k === 'normal' ? '#1c2d58' : TK_URG[k].c) + ';"' + (k === 'normal' ? ' class="on"' : '') + '>' + TK_URG[k].l + '</button>'; }).join('') + '</div></div>'
    + '</div>'
    + '<div class="tk-adv"><button type="button" class="tk-adv-t" data-adv>' + (hr ? '▾' : '▸') + ' Дополнительно: тип, объект, договор, кто проверяет, файл</button><div class="tk-form" data-adv-b style="margin-top:10px;' + (hr ? '' : 'display:none;') + '">'
    + '<div class="tk-f"><label>Тип</label><select data-n="kind">' + TK_KINDS.map(function(k) { return '<option' + ((preset.kind || 'Общая') === k ? ' selected' : '') + '>' + tkEsc(k) + '</option>'; }).join('') + '</select></div>'
    + '<div class="tk-f"><label>Кто проверяет и закрывает</label><select data-n="controller"><option value="">я (' + tkEsc(tkWho(tk.me.id)) + ')</option>' + tkPeopleOptions('') + '</select></div>'
    + '<div class="tk-f"><label>Объект</label><select data-n="object_name"><option value="">— не относится к объекту —</option>' + d.objects.map(function(o) { return '<option' + (preset.object_name === o.name ? ' selected' : '') + '>' + tkEsc(o.name) + '</option>'; }).join('') + '</select></div>'
    + '<div class="tk-f"><label>Договор / арендатор</label><select data-n="contract_id"><option value="">— не по договору —</option></select></div>'
    + '<div class="tk-f" data-emp-f><label>Сотрудник, по которому задача</label><select data-n="employee_id"><option value="">—</option>' + d.emps.filter(function(e) { return e.status !== 'fired' || e.id === preset.employee_id; }).map(function(e) { return '<option value="' + e.id + '"' + (e.id === preset.employee_id ? ' selected' : '') + '>' + tkEsc(e.full_name) + '</option>'; }).join('') + '</select></div>'
    + '<div class="tk-f"><label>Файл</label><input type="file" data-n="file"></div>'
    + '</div></div>'
    + '<div class="tk-actions"><button class="tk-btn pri" data-save>Поставить задачу</button><button class="tk-btn link tk-x">Отмена</button></div></div>');
  const q = function(n) { return m.querySelector('[data-n="' + n + '"]'); };
  let urg = 'normal', dueTouched = false;
  q('due_date').addEventListener('change', function() { dueTouched = true; });
  m.querySelector('[data-adv]').addEventListener('click', function(e) {
    const b = m.querySelector('[data-adv-b]'), show = b.style.display === 'none';
    b.style.display = show ? '' : 'none'; e.target.textContent = (show ? '▾' : '▸') + e.target.textContent.slice(1);
  });
  function onKind() { m.querySelector('[data-emp-f]').style.display = q('kind').value === 'Кадры' ? '' : 'none'; }
  q('kind').addEventListener('change', onKind); onKind();
  function onObject() {
    const name = q('object_name').value;
    q('contract_id').innerHTML = '<option value="">— не по договору —</option>' + d.contracts.filter(function(c) { return c.object_name === name; })
      .map(function(c) { return '<option value="' + c.id + '">' + tkEsc([c.contract_number, c.tenant_name].filter(Boolean).join(' · ') || ('#' + c.id)) + '</option>'; }).join('');
  }
  q('object_name').addEventListener('change', onObject); onObject();
  m.querySelectorAll('[data-due]').forEach(function(b) {
    b.addEventListener('click', function() { const v = b.getAttribute('data-due'); q('due_date').value = v === '' ? '' : tkAddDays(Number(v)); dueTouched = true; });
  });
  m.querySelectorAll('[data-urg]').forEach(function(b) {
    b.addEventListener('click', function() {
      urg = b.getAttribute('data-urg');
      m.querySelectorAll('[data-urg]').forEach(function(x) { x.classList.toggle('on', x === b); });
      if (!dueTouched) q('due_date').value = tkAddWorkDays(TK_URG[urg].d);
    });
  });
  m.querySelectorAll('[data-hr]').forEach(function(b) {
    b.addEventListener('click', function() {
      m.querySelectorAll('[data-hr]').forEach(function(x) { x.classList.toggle('on', x === b); });
      const e = tkEmp(Number(q('employee_id').value));
      q('title').value = b.getAttribute('data-hr') + (e ? ': ' + e.full_name : '') + (b.getAttribute('data-hr') === 'Отпуск' ? ' с ДД.ММ по ДД.ММ' : '');
      q('title').focus();
    });
  });
  setTimeout(function() { q('title').focus(); }, 50);
  m.querySelector('[data-save]').addEventListener('click', async function(e) {
    const title = q('title').value.trim(), ex = tkPersonFromKey(q('executor').value);
    if (!title) { tkToast('Напишите, что нужно сделать'); q('title').focus(); return; }
    if (!ex.id && !ex.name) { tkToast('Выберите, кому поручить'); q('executor').focus(); return; }
    const due = q('due_date').value;
    if (due && !/^(19|20)\d{2}-\d{2}-\d{2}$/.test(due)) { tkToast('Проверьте срок'); q('due_date').focus(); return; }
    const ctl = tkPersonFromKey(q('controller').value).id || tk.me.id;
    e.target.disabled = true;
    try {
      const fileId = q('file').files[0] ? await tkUpload(q('file').files[0]) : null;
      const vals = { title: title, description: q('description').value.trim(), kind: q('kind').value, urgency: urg, due_date: due || null, status: 'new', due_moved: 0,
        executor_id: ex.id, executor_name: ex.name, controller_id: ctl, controller_name: tkWho(ctl),
        author_id: tk.me.id, author_name: tkWho(tk.me.id), object_name: q('object_name').value || null,
        contract_id: Number(q('contract_id').value) || null, employee_id: q('kind').value === 'Кадры' ? (Number(q('employee_id').value) || null) : null, source: 'crm' };
      const rec = tkRows(await ctx.api.resource('crm_tasks').create({ values: vals }))[0];
      await tkEvent(rec.id, 'create', 'Поставил задачу' + (fileId ? ', приложил файл' : ''), fileId);
      tkNotify(vals.executor_id, 'Новая задача №' + rec.id, (urg === 'asap' ? 'Горит! ' : urg === 'urgent' ? 'Срочно: ' : '') + title + (due ? ' (срок ' + tkDate(due) + ')' : ''), rec.id);
      if (ctl !== vals.executor_id) tkNotify(ctl, 'Задача №' + rec.id, 'Вы проверяете: ' + title, rec.id);
      m.remove();
      tkToast('Задача поставлена: ' + ex.name);
      tk.view = Number(vals.executor_id) === tk.me.id ? 'mine' : 'given';
      tk.tab = 'list';
      await tkReload();
    } catch (err) { tkToast('Не удалось поставить задачу'); e.target.disabled = false; }
  });
}

// ---------- карточка задачи ----------
async function tkOpenCard(id) {
  let t = tk.data.tasks.find(function(x) { return x.id === id; });
  if (!t) { try { t = tkRows(await ctx.api.resource('crm_tasks').get({ filterByTk: id }))[0]; } catch (e) { t = null; } }
  if (!t) { tkToast('Задача №' + id + ' не найдена'); return; }
  const m = tkModal('<div data-tk-card></div>');
  await tkRenderCard(m, t);
}
// следующий шаг и доступные действия. Исполнитель ведёт задачу, проверяющий (ответственный или автор) закрывает,
// администратор может всё; если у исполнителя нет учётки — задачу ведёт проверяющий
function tkNext(t) {
  const me = tk.me.id, adm = tkIsAdmin();
  const chk = tkChecker(t) === me || Number(t.author_id) === me || adm;
  const ex = Number(t.executor_id) === me || adm || (!t.executor_id && chk);
  const exName = tkWho(t.executor_id, t.executor_name), chkName = tkWho(tkChecker(t));
  let title = '', text = '', main = [];
  if (t.status === 'new') {
    if (ex) { title = 'Задачу ещё не взяли в работу'; text = 'Нажмите «Взять в работу» — проверяющий увидит, что вы начали.'; main = [['take', 'Взять в работу', 'pri'], ['done', 'Уже выполнено', 'ok']]; }
    else { title = 'Ждём, когда ' + exName + ' возьмёт задачу'; text = 'Исполнитель получил уведомление.'; }
  } else if (t.status === 'in_work') {
    if (ex) { title = 'Задача в работе'; text = 'Когда закончите — нажмите «Выполнена» и коротко напишите результат.'; main = [['done', 'Выполнена', 'ok'], ['wait', 'Жду чего-то…', '']]; }
    else { title = exName + ' работает над задачей'; text = tkLate(t) ? 'Срок прошёл — напишите в обсуждении или перенесите срок.' : ''; }
  } else if (t.status === 'waiting') {
    title = 'Задача ждёт: ' + (t.wait_reason || '—');
    if (ex) { text = 'Когда дождётесь — продолжите работу.'; main = [['resume', 'Продолжить работу', 'pri'], ['done', 'Выполнена', 'ok']]; }
  } else if (t.status === 'done') {
    if (chk) { title = 'Проверьте результат'; text = 'Если всё сделано — закройте задачу. Если нет — верните исполнителю.'; main = [['close', 'Принять и закрыть', 'ok'], ['reopen', 'Вернуть на доработку', 'warn']]; }
    else { title = 'Задача выполнена и ждёт проверки'; text = 'Проверяет ' + chkName + '.'; }
  } else if (t.status === 'closed') { title = 'Задача закрыта'; if (chk) main = [['reopen', 'Возобновить', '']]; }
  else if (t.status === 'cancelled') { title = 'Задача отменена'; if (chk) main = [['reopen', 'Возобновить', '']]; }
  const more = [];
  if (tkIsOpen(t) && (ex || chk)) { more.push(['due', 'Перенести срок', '']); more.push(['assign', 'Передать другому', '']); }
  if (chk) more.push(['edit', 'Тип, объект, срочность', '']);
  if (tkIsOpen(t) && chk) more.push(['cancel', 'Отменить задачу', 'warn']);
  return { title: title, text: text, main: main, more: more };
}
async function tkRenderCard(m, t) {
  const box = m.querySelector('[data-tk-card]');
  const u = TK_URG[t.urgency], emp = t.employee_id ? tkEmp(t.employee_id) : null;
  const c = t.contract_id ? tk.data.contracts.find(function(x) { return x.id === Number(t.contract_id); }) : null;
  const nx = tkNext(t);
  let evs = [];
  try { evs = tkRows(await ctx.api.resource('crm_task_events').list({ filter: { task_id: t.id }, sort: ['createdAt', 'id'], appends: ['file'], paginate: false })); } catch (e) { evs = []; }
  const isMsg = function(x) { return x.kind === 'comment' || !!x.file; };
  const nMsg = evs.filter(isMsg).length, nSys = evs.length - nMsg;
  const btn = function(a) { return '<button class="tk-btn ' + a[2] + '" data-a="' + a[0] + '">' + a[1] + '</button>'; };
  box.innerHTML = '<div class="tk-box-h"><div class="tk-box-t">' + tkEsc(t.title) + '<small>' + tkPill(t.status)
    + (u && t.urgency !== 'normal' ? ' <span class="tk-pill" style="color:' + u.c + ';border-color:' + u.c + '55;">' + tkEsc(u.l) + '</span>' : '') + ' &nbsp;№' + t.id + '</small></div><button class="tk-x">✕</button></div>'
    + '<div class="tk-box-b">'
    + '<div class="tk-next"><div class="tk-next-t">' + tkEsc(nx.title) + '</div>' + (nx.text ? '<div class="tk-next-s">' + tkEsc(nx.text) + '</div>' : '')
    + ((nx.main.length || nx.more.length) ? '<div class="tk-actions">' + nx.main.map(btn).join('') + (nx.more.length ? '<button class="tk-btn link" data-more>Ещё ▾</button>' : '') + '</div>'
      + '<div class="tk-more-menu" data-more-menu>' + nx.more.map(btn).join('') + '</div>' : '') + '<div data-actbox></div></div>'
    + '<div class="tk-meta">'
    + '<div><div class="l">Исполнитель</div>' + tkEsc(tkWho(t.executor_id, t.executor_name)) + '</div>'
    + '<div><div class="l">Проверяет</div>' + tkEsc(tkWho(tkChecker(t), t.controller_name || t.author_name)) + '</div>'
    + '<div><div class="l">Срок</div>' + tkDue(t) + (t.due_moved ? ' <span class="tk-hint">(переносили ' + t.due_moved + ' раз)</span>' : '') + '</div>'
    + '<div><div class="l">Поставил</div>' + tkEsc(tkWho(t.author_id, t.author_name)) + ' · ' + tkDateTime(t.createdAt) + '</div>'
    + (t.object_name ? '<div><div class="l">Объект</div>' + tkEsc(t.object_name) + '</div>' : '')
    + (t.contract_id ? '<div><div class="l">Договор</div><a class="tk-link" href="/admin/b5znz7yxpy3?open=active:' + t.contract_id + '">' + tkEsc(c ? [c.contract_number, c.tenant_name].filter(Boolean).join(' · ') : '#' + t.contract_id) + '</a></div>' : '')
    + (t.kind && t.kind !== 'Общая' ? '<div><div class="l">Тип</div>' + tkEsc(t.kind) + '</div>' : '')
    + (emp ? '<div><div class="l">Сотрудник</div><a class="tk-link" data-emp-open="' + emp.id + '" style="cursor:pointer;">' + tkEsc(emp.full_name) + '</a></div>' : '')
    + '</div>'
    + (t.description ? '<div class="tk-desc">' + tkEsc(t.description) + '</div>' : '')
    + (t.result ? '<div class="tk-desc" style="background:#f6ffed;"><b>Результат:</b> ' + tkEsc(t.result) + '</div>' : '')
    + '<div class="tk-tl"><div class="tk-tl-h"><b>Обсуждение</b><span class="tk-hint" style="margin:0;">' + nMsg + ' ' + tkNoun(nMsg, 'сообщение', 'сообщения', 'сообщений') + '</span>'
    + (nSys ? '<label class="tk-hint" style="margin:0 0 0 auto;cursor:pointer;"><input type="checkbox" data-show-sys> история изменений (' + nSys + ')</label>' : '') + '</div>'
    + '<div data-evs>' + evs.map(function(x) {
        const who = tkWho(x.author_id, x.author_name), f = x.file;
        const file = f ? ' <a data-file="' + tkEsc(f.url) + '">📎 ' + tkEsc((f.title || 'файл') + (f.extname || '')) + '</a>' : '';
        if (isMsg(x)) return '<div class="tk-msg">' + tkAva(who) + '<div class="tk-msg-b"><div class="tk-msg-h"><b>' + tkEsc(who) + '</b>' + tkDateTime(x.createdAt) + '</div><div class="tk-msg-t">' + tkEsc(x.text) + file + '</div></div></div>';
        return '<div class="tk-msg sys" data-sys style="display:none;">' + tkDateTime(x.createdAt) + ' · ' + tkEsc(who) + ': <span class="tk-msg-t">' + tkEsc(x.text) + '</span></div>';
      }).join('') + (nMsg ? '' : '<div class="tk-hint" style="padding:6px 0;">Сообщений пока нет — напишите первым.</div>') + '</div>'
    + '<div class="tk-comment"><textarea placeholder="Написать сообщение… (Ctrl+Enter — отправить)" data-cmt></textarea><input type="file" data-cmt-file style="display:none;"><button class="tk-btn" data-cmt-attach title="Приложить файл">📎</button><button class="tk-btn pri" data-cmt-send>Отправить</button></div>'
    + '<div data-cmt-fname class="tk-hint"></div></div></div>';
  box.querySelectorAll('[data-a]').forEach(function(b) { b.addEventListener('click', function() { tkAction(m, t, b.getAttribute('data-a')); }); });
  const mo = box.querySelector('[data-more]');
  if (mo) mo.addEventListener('click', function() { box.querySelector('[data-more-menu]').classList.toggle('on'); });
  const eo = box.querySelector('[data-emp-open]');
  if (eo) eo.addEventListener('click', function() { m.remove(); tkOpenEmp(Number(eo.getAttribute('data-emp-open'))); });
  const ss = box.querySelector('[data-show-sys]');
  if (ss) ss.addEventListener('change', function() { box.querySelectorAll('[data-sys]').forEach(function(x) { x.style.display = ss.checked ? '' : 'none'; }); });
  box.querySelectorAll('[data-file]').forEach(function(a) {
    a.addEventListener('click', async function() {
      try { const res = await fetch(a.getAttribute('data-file'), { headers: { Authorization: 'Bearer ' + tkToken() } }); window.open(URL.createObjectURL(await res.blob()), '_blank'); }
      catch (e) { tkToast('Не удалось открыть файл'); }
    });
  });
  const fin = box.querySelector('[data-cmt-file]'), ta = box.querySelector('[data-cmt]'), send = box.querySelector('[data-cmt-send]');
  box.querySelector('[data-cmt-attach]').addEventListener('click', function() { fin.click(); });
  fin.addEventListener('change', function() { box.querySelector('[data-cmt-fname]').textContent = fin.files[0] ? 'Файл: ' + fin.files[0].name : ''; });
  ta.addEventListener('keydown', function(e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send.click(); });
  send.addEventListener('click', async function(e) {
    const txt = ta.value.trim();
    if (!txt && !fin.files[0]) { ta.focus(); return; }
    e.target.disabled = true;
    try {
      const fid = fin.files[0] ? await tkUpload(fin.files[0]) : null;
      await tkEvent(t.id, 'comment', txt || 'Файл', fid);
      [t.executor_id, tkChecker(t), t.author_id].filter(function(v, i, a) { return v && a.indexOf(v) === i; })
        .forEach(function(uid) { tkNotify(uid, 'Задача №' + t.id, tkWho(tk.me.id) + ': ' + (txt || 'приложил файл'), t.id); });
      await tkRenderCard(m, t);
    } catch (err) { tkToast('Не удалось отправить'); e.target.disabled = false; }
  });
}
// действие по задаче: где нужен ввод — встроенная форма, без окон браузера
function tkAction(m, t, a) {
  const box = m.querySelector('[data-actbox]');
  const lbl = function(s) { return '<label style="font-size:12.5px;color:#595959;display:block;margin-top:6px;">' + s + '</label>'; };
  const need = {
    wait: lbl('Чего ждём') + '<select data-in style="width:100%;margin-top:4px;">' + TK_WAIT.map(function(w) { return '<option>' + w + '</option>'; }).join('') + '</select>',
    done: lbl('Что сделано — коротко, увидит проверяющий') + '<textarea data-in style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    reopen: lbl(t.status === 'done' ? 'Что нужно доделать' : 'Почему возобновляем') + '<textarea data-in style="width:100%;margin-top:4px;min-height:60px;"></textarea>',
    cancel: lbl('Почему отменяем') + '<textarea data-in style="width:100%;margin-top:4px;min-height:50px;"></textarea>',
    due: lbl('Новый срок') + '<input type="date" data-in min="2000-01-01" max="2099-12-31" value="' + tkEsc(String(t.due_date || '').slice(0, 10)) + '" style="width:100%;margin-top:4px;">'
      + lbl('Почему переносим') + '<input type="text" data-in2 style="width:100%;margin-top:4px;">',
    assign: lbl('Кому передать') + '<select data-in style="width:100%;margin-top:4px;">' + tkPeopleOptions(tkKeyOf(t.executor_id, t.executor_name)) + '</select>',
    edit: lbl('Тип') + '<select data-in style="width:100%;margin-top:4px;">' + TK_KINDS.map(function(k) { return '<option' + (t.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>'
      + lbl('Объект') + '<select data-in2 style="width:100%;margin-top:4px;"><option value="">— не относится к объекту —</option>' + tk.data.objects.map(function(o) { return '<option' + (t.object_name === o.name ? ' selected' : '') + '>' + tkEsc(o.name) + '</option>'; }).join('') + '</select>'
      + lbl('Срочность') + '<select data-in4 style="width:100%;margin-top:4px;">' + Object.keys(TK_URG).map(function(k) { return '<option value="' + k + '"' + ((t.urgency || 'normal') === k ? ' selected' : '') + '>' + TK_URG[k].l + '</option>'; }).join('') + '</select>'
      + lbl('Сотрудник (для кадровой задачи)') + '<select data-in3 style="width:100%;margin-top:4px;"><option value="">—</option>' + tk.data.emps.map(function(e) { return '<option value="' + e.id + '"' + (Number(t.employee_id) === e.id ? ' selected' : '') + '>' + tkEsc(e.full_name) + '</option>'; }).join('') + '</select>'
  }[a];
  if (need) {
    box.innerHTML = '<div class="tk-actbox">' + need + '<div class="tk-actions" style="margin-top:10px;"><button class="tk-btn pri" data-go-a>Сохранить</button><button class="tk-btn link" data-no-a>Отмена</button></div></div>';
    box.querySelector('[data-no-a]').addEventListener('click', function() { box.innerHTML = ''; });
    box.querySelector('[data-go-a]').addEventListener('click', function(e) { tkApply(m, t, a, e.target); });
    const f = box.querySelector('[data-in]'); if (f) f.focus();
  } else tkApply(m, t, a, null);
}
// действие по задаче без интерфейса — его зовут и кнопки карточки, и доска. Ошибка ввода → { err, field: 1|2 };
// ничего не меняется → { skip: true }; сбой сети → исключение. Перерисовку делает вызывающий.
async function tkDo(t, a, v, v2, v3, v4) {
  const now = new Date().toISOString(), title = 'Задача №' + t.id, chk = tkChecker(t);
  let upd = null, ev = '', kind = 'status', notify = [];
  if (a === 'take') { upd = { status: 'in_work' }; ev = 'Взял в работу'; notify = [[chk, 'Взята в работу: ' + t.title]]; }
  if (a === 'wait') { upd = { status: 'waiting', wait_reason: v }; ev = 'Ждёт ' + v; notify = [[chk, 'Ждёт ' + v + ': ' + t.title]]; }
  if (a === 'resume') { upd = { status: 'in_work', wait_reason: null }; ev = 'Продолжил работу'; }
  if (a === 'done') { if (!v) return { err: 'Напишите, что сделано', field: 1 }; upd = { status: 'done', result: v, done_at: now, wait_reason: null }; ev = 'Выполнил: ' + v; notify = [[chk, 'Выполнена, проверьте: ' + t.title]]; }
  if (a === 'close') { upd = { status: 'closed', closed_at: now }; ev = 'Принял и закрыл'; notify = [[t.executor_id, 'Закрыта: ' + t.title]]; }
  if (a === 'reopen') { if (!v) return { err: 'Напишите, что не так', field: 1 }; upd = { status: 'in_work', done_at: null, closed_at: null }; ev = 'Вернул в работу: ' + v; notify = [[t.executor_id, 'Вернули в работу: ' + v]]; }
  if (a === 'cancel') { if (!v) return { err: 'Напишите причину', field: 1 }; upd = { status: 'cancelled', closed_at: now, result: v }; ev = 'Отменил: ' + v; notify = [[t.executor_id, 'Отменена: ' + t.title]]; }
  if (a === 'due') {
    const reason = v2;
    if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(v)) return { err: 'Укажите новый срок', field: 1 };
    if (!reason) return { err: 'Напишите, почему переносим', field: 2 };
    upd = { due_date: v, due_moved: (Number(t.due_moved) || 0) + 1 };
    ev = 'Перенёс срок с ' + (tkDate(t.due_date) || '«без срока»') + ' на ' + tkDate(v) + ': ' + reason; kind = 'due';
    notify = [[t.executor_id, 'Срок перенесён на ' + tkDate(v) + ': ' + reason], [chk, 'Срок перенесён на ' + tkDate(v) + ': ' + reason]];
  }
  if (a === 'assign') {
    const p = tkPersonFromKey(v);
    if ((!p.id && !p.name) || tkKeyOf(p.id, p.name) === tkKeyOf(t.executor_id, t.executor_name)) return { skip: true };
    upd = { executor_id: p.id, executor_name: p.name };
    ev = 'Передал: ' + tkWho(t.executor_id, t.executor_name) + ' → ' + p.name; kind = 'assign';
    notify = [[p.id, 'Вам передана задача: ' + t.title + (t.due_date ? ' (срок ' + tkDate(t.due_date) + ')' : '')]];
  }
  if (a === 'edit') {
    upd = { kind: v, object_name: v2 || null, urgency: v4, employee_id: v === 'Кадры' ? (Number(v3) || null) : null };
    const ch = [];
    if (upd.kind !== t.kind) ch.push('тип: ' + upd.kind);
    if ((upd.object_name || '') !== (t.object_name || '')) ch.push('объект: ' + (upd.object_name || '—'));
    if (upd.urgency !== (t.urgency || 'normal')) ch.push('срочность: ' + TK_URG[upd.urgency].l);
    if ((upd.employee_id || null) !== (t.employee_id ? Number(t.employee_id) : null)) ch.push('сотрудник: ' + (upd.employee_id ? tkEmp(upd.employee_id).full_name : '—'));
    if (!ch.length) return { skip: true };
    ev = 'Изменил ' + ch.join(', '); kind = 'edit';
  }
  if (!upd) return { skip: true };
  await ctx.api.resource('crm_tasks').update({ filterByTk: t.id, values: upd });
  await tkEvent(t.id, kind, ev);
  notify.forEach(function(n) { tkNotify(n[0], title, n[1], t.id); });
  Object.assign(t, upd);
  return null;
}
const TK_DONE_MSG = { take: 'Задача в работе', done: 'Отправлено на проверку', close: 'Задача закрыта', reopen: 'Задача снова в работе', cancel: 'Задача отменена', due: 'Срок перенесён', assign: 'Задача передана', wait: 'Задача ждёт', resume: 'Задача снова в работе' };
async function tkApply(m, t, a, btn) {
  const box = m.querySelector('[data-actbox]');
  const inp = box.querySelector('[data-in]'), inp2 = box.querySelector('[data-in2]'), inp3 = box.querySelector('[data-in3]'), inp4 = box.querySelector('[data-in4]');
  const val = function(x) { return x ? x.value.trim() : ''; };
  if (btn) btn.disabled = true;
  try {
    const res = await tkDo(t, a, val(inp), val(inp2), val(inp3), val(inp4));
    if (res && res.err) { tkToast(res.err); const f = res.field === 2 ? inp2 : inp; if (f) f.focus(); if (btn) btn.disabled = false; return; }
    if (res && res.skip) { box.innerHTML = ''; return; }
    await tkReload();
    const fresh = tk.data.tasks.find(function(x) { return x.id === t.id; }) || t;
    await tkRenderCard(m, fresh);
    tkToast(TK_DONE_MSG[a] || 'Сохранено');
  } catch (e) { tkToast('Не удалось сохранить'); if (btn) btn.disabled = false; }
}

// ---------- сотрудники — на странице «Персонал» ----------
function tkOpenEmp(id) { location.href = TK_HR_PAGE + '?open=emp:' + id; }

// ---------- отчёты ----------
function tkRenderStats() {
  const tasks = tk.data.tasks, since = function(n) { const d = new Date(); d.setDate(d.getDate() - n); return tkIso(d); };
  const d7 = since(7), d30 = since(30);
  const open = tasks.filter(tkIsOpen);
  const finished = function(t) { return String(t.done_at || t.closed_at || '').slice(0, 10); };
  const closedIn = function(list, from) { return list.filter(function(t) { return (t.status === 'closed' || t.status === 'done') && finished(t) >= from; }); };
  const days = function(list) { return closedIn(list, d30).map(function(t) { return tkDays(String(t.createdAt).slice(0, 10), finished(t)); }); };
  const med = tkMedian(days(tasks));
  const tiles = [
    ['Открыто сейчас', open.length, open.filter(tkLate).length ? '<span class="tk-late">из них просрочено ' + open.filter(tkLate).length + '</span>' : 'просрочек нет', { view: 'open' }],
    ['Горит и срочно', open.filter(function(t) { return t.urgency && t.urgency !== 'normal'; }).length, '«горит»: ' + open.filter(function(t) { return t.urgency === 'asap'; }).length, { view: 'open' }],
    ['Поставлено за неделю', tasks.filter(function(t) { return String(t.createdAt).slice(0, 10) >= d7; }).length, 'за месяц: ' + tasks.filter(function(t) { return String(t.createdAt).slice(0, 10) >= d30; }).length, { view: 'open' }],
    ['Закрыто за неделю', closedIn(tasks, d7).length, 'ждут проверки: ' + tasks.filter(function(t) { return t.status === 'done'; }).length, { view: 'closed' }],
    ['Обычно на задачу уходит', med === null ? '—' : med + ' ' + tkNoun(Math.round(med), 'день', 'дня', 'дней'), 'медиана за последний месяц', { view: 'closed' }]
  ];
  function table(title, keyFn, labelFn, goKey) {
    const g = {};
    tasks.forEach(function(t) { const k = keyFn(t); if (!k) return; (g[k] = g[k] || []).push(t); });
    const rows = Object.keys(g).map(function(k) {
      const l = g[k], o = l.filter(tkIsOpen);
      return { k: k, open: o.length, late: o.filter(tkLate).length, done30: closedIn(l, d30).length, med: tkMedian(days(l)) };
    }).filter(function(x) { return x.open || x.done30; }).sort(function(a, b) { return b.late - a.late || b.open - a.open || b.done30 - a.done30; });
    return '<div class="tk-card"><div class="tk-card-t">' + title + '</div>' + (rows.length ? '<table><thead><tr><th></th><th class="n">В работе</th><th class="n">Просрочено</th><th class="n" title="Закрыто за последние 30 дней">Закрыто за месяц</th><th class="n" title="Медиана дней от постановки до выполнения">Дней на задачу</th></tr></thead><tbody>'
      + rows.map(function(x) { const go = { view: 'open' }; go[goKey] = x.k; return '<tr data-go="' + tkEsc(JSON.stringify(go)) + '"><td>' + tkEsc(labelFn(x.k)) + '</td><td class="n">' + x.open + '</td><td class="n' + (x.late ? ' tk-late' : '') + '">' + x.late + '</td><td class="n">' + x.done30 + '</td><td class="n">' + (x.med === null ? '—' : x.med) + '</td></tr>'; }).join('')
      + '</tbody></table>' : '<div class="tk-hint">Данных пока нет</div>') + '</div>';
  }
  const names = {};
  tasks.forEach(function(t) { const k = tkExecKey(t); if (k) names[k] = tkWho(t.executor_id, t.executor_name); });
  const weeks = [], mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  for (let i = 7; i >= 0; i--) { const s = new Date(mon); s.setDate(s.getDate() - 7 * i); const e = new Date(s); e.setDate(e.getDate() + 7); weeks.push([tkIso(s), tkIso(e)]); }
  const inW = function(v, w) { const x = String(v || '').slice(0, 10); return x >= w[0] && x < w[1]; };
  const weeksHtml = '<div class="tk-card"><div class="tk-card-t">По неделям</div><table><thead><tr><th>Неделя с</th><th class="n">Поставлено</th><th class="n">Закрыто</th><th class="n">Из них в срок</th></tr></thead><tbody>'
    + weeks.map(function(w) {
        const done = tasks.filter(function(t) { return (t.status === 'closed' || t.status === 'done') && inW(finished(t), w); });
        return '<tr><td>' + tkDate(w[0]) + '</td><td class="n">' + tasks.filter(function(t) { return inW(t.createdAt, w); }).length + '</td><td class="n">' + done.length + '</td><td class="n">' + done.filter(function(t) { return !t.due_date || finished(t) <= String(t.due_date).slice(0, 10); }).length + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  tkBody().innerHTML = '<div class="tk-tiles">' + tiles.map(function(t) {
      return '<div class="tk-tile" data-go="' + tkEsc(JSON.stringify(t[3])) + '" style="cursor:pointer;"><div class="tk-tile-l">' + t[0] + '</div><div class="tk-tile-v">' + t[1] + '</div><div class="tk-tile-n">' + t[2] + '</div></div>';
    }).join('') + '</div>'
    + '<div class="tk-grid2">' + table('По исполнителям', tkExecKey, function(k) { return names[k] || k; }, 'exec')
    + table('По объектам', function(t) { return t.object_name; }, function(k) { return k; }, 'obj')
    + table('По типам', function(t) { return t.kind; }, function(k) { return k; }, 'kind') + weeksHtml + '</div>'
    + '<div class="tk-hint" style="margin-top:10px;">Нажмите на строку или плитку — откроется список этих задач.</div>';
}
