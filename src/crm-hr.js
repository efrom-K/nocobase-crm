// Страница «Персонал (тест)» (/admin/hrpage01, блок crmblock003) — кадры: дашборд HR, сотрудники и структура, отпуска,
// охрана труда (обучение, инструктажи, пожарная безопасность, СОУТ), воинский учёт (по организациям и людям), документы и мероприятия
// (ЛНА, мотивация, корпоративы). Разделы повторяют рабочие папки HR: всё ведётся по юрлицам (их больше десятка, человек может быть в нескольких).
// Коллекции — scripts/setup_crm_hr.py. Закрытые данные (паспорт, воинский учёт, мотивация) — crm_hr_private: сервер отдаёт их
// только ролям admin и hr, поэтому «можно править» = «сервер отдал закрытые данные». Остальные видят справочник и отпуска.
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
    .hr-tab.on { color:#1677ff; border-bottom-color:#1677ff; font-weight:600; }
    .hr-tab b { font-weight:600; color:#8c8c8c; margin-left:4px; font-size:12.5px; }
    .hr-tab b.red { color:#cf1322; }
    .hr-new { margin-left:auto; border:none; background:#1677ff; color:#fff; border-radius:8px; padding:9px 18px; font:inherit; font-size:14px; font-weight:600; cursor:pointer; }
    .hr-new:hover { background:#4096ff; }
    .hr-bar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
    .hr select, .hr input[type=text], .hr input[type=date], .hr input[type=number], .hr textarea,
    .hr-modal select, .hr-modal input[type=text], .hr-modal input[type=date], .hr-modal input[type=number], .hr-modal textarea {
      border:1px solid #d9d9d9; border-radius:6px; padding:7px 10px; font:inherit; font-size:13.5px; background:#fff; color:#262626; box-sizing:border-box; }
    .hr-bar select { min-width:150px; }
    .hr-bar input[type=text] { flex:1; min-width:200px; }
    .hr-seg { display:inline-flex; border:1px solid #d9d9d9; border-radius:6px; overflow:hidden; }
    .hr-seg button { border:none; background:#fff; padding:7px 12px; font:inherit; font-size:13px; cursor:pointer; color:#595959; }
    .hr-seg button.on { background:#1677ff; color:#fff; font-weight:600; }
    .hr-only { display:flex; gap:10px; align-items:center; background:#e6f4ff; border:1px solid #91caff; border-radius:8px; padding:8px 12px; margin-bottom:12px; font-size:13.5px; }
    .hr-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
    .hr-tile { border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; background:#fff; }
    .hr-tile[data-go] { cursor:pointer; }
    .hr-tile[data-go]:hover { border-color:#91caff; }
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
    .hr tr[data-emp], .hr tr[data-rec], .hr-modal tr[data-task] { cursor:pointer; }
    .hr tr[data-emp]:hover td, .hr tr[data-rec]:hover td, .hr-modal tr[data-task]:hover td { background:#f5faff; }
    .hr-empty { color:#8c8c8c; padding:28px 12px; text-align:center; background:#fafafa; border-radius:8px; }
    .hr-empty b { display:block; color:#434343; font-size:15px; margin-bottom:4px; }
    .hr-hint { font-size:12px; color:#8c8c8c; margin-top:3px; }
    .hr-grp { display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; font-weight:600; font-size:15px; margin:18px 0 8px; }
    .hr-grp span { font-weight:400; color:#8c8c8c; font-size:12.5px; }
    .hr-people { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:8px; }
    .hr-person { display:flex; gap:10px; align-items:flex-start; border:1px solid #f0f0f0; border-radius:10px; padding:10px 12px; background:#fff; cursor:pointer; min-width:0; }
    .hr-person:hover { border-color:#91caff; }
    .hr-person.off { opacity:.55; }
    .hr-ava { flex:none; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13.5px; color:#fff; }
    .hr-person-b { min-width:0; flex:1; }
    .hr-person-n { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hr-person-p { font-size:12.5px; color:#595959; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hr-chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .hr-chip { font-size:11.5px; padding:1px 7px; border-radius:10px; background:#f5f5f5; color:#595959; white-space:nowrap; }
    .hr-chip.blue { background:#e6f4ff; color:#0958d9; }
    .hr-chip.orange { background:#fff7e6; color:#d46b08; }
    .hr-chip.red { background:#fff1f0; color:#cf1322; }
    .hr-chip.green { background:#f6ffed; color:#389e0d; }
    .hr-chip.purple { background:#f9f0ff; color:#722ed1; }
    /* оргсхема */
    .hr-le { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:8px; margin-bottom:16px; }
    .hr-le-c { border:1px solid #f0f0f0; border-radius:10px; padding:10px 12px; background:#fff; cursor:pointer; }
    .hr-le-c:hover { border-color:#91caff; }
    .hr-le-c b { display:block; }
    .hr-org-ceo { display:flex; justify-content:center; margin-bottom:6px; }
    .hr-org-line { width:2px; height:16px; background:#d6e4ff; margin:0 auto 6px; }
    .hr-org-cols { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; align-items:start; }
    .hr-org-col { border:1px solid #f0f0f0; border-radius:12px; background:#fafcff; padding:12px; }
    .hr-org-col-h { font-weight:700; font-size:15px; margin-bottom:8px; }
    .hr-org-face { display:flex; gap:10px; align-items:center; background:#fff; border:1px solid #d6e4ff; border-radius:10px; padding:8px 12px; cursor:pointer; min-width:0; }
    .hr-org-face:hover { border-color:#1677ff; }
    .hr-org-face b { display:block; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hr-org-face span.p { display:block; font-size:12px; color:#8c8c8c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hr-org-face .hr-ava { width:34px; height:34px; font-size:12.5px; }
    .hr-org-sub { background:#fff; border:1px solid #f0f0f0; border-radius:10px; padding:8px 12px; margin-top:8px; }
    .hr-org-sub-h { display:flex; align-items:baseline; gap:8px; font-weight:600; font-size:13.5px; }
    .hr-org-sub-h span { font-weight:400; color:#8c8c8c; font-size:12px; margin-left:auto; }
    .hr-org-names { font-size:12.5px; color:#595959; margin-top:3px; line-height:1.6; }
    .hr-org-names a { color:#595959; cursor:pointer; white-space:nowrap; }
    .hr-org-names a:hover { color:#1677ff; }
    .hr-org select { width:100%; margin-top:6px; font-size:12.5px; padding:4px 8px; }
    /* отпуска: годовая шкала */
    .hr-tl { width:100%; border-collapse:collapse; table-layout:fixed; }
    .hr-tl td { padding:3px 6px; border-bottom:1px solid #f5f5f5; }
    .hr-tl td.nm { width:210px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
    .hr-tl td.nm:hover { color:#1677ff; }
    .hr-tl td.rest { width:80px; text-align:right; font-size:12.5px; }
    .hr-track { position:relative; height:22px; display:flex; cursor:copy; }
    .hr-track > i { display:block; height:100%; border-left:1px solid #f0f0f0; box-sizing:border-box; }
    .hr-track > i.odd { background:#fafafa; }
    .hr-vb { position:absolute; top:3px; height:16px; border-radius:4px; cursor:pointer; font-size:10.5px; color:#fff; overflow:hidden; white-space:nowrap; padding:0 3px; box-sizing:border-box; line-height:16px; }
    .hr-vb.plan { background:#91caff; color:#003eb3; }
    .hr-vb.ordered { background:#1677ff; }
    .hr-vb.other { background:#b37feb; }
    .hr-now { position:absolute; top:0; bottom:0; width:2px; background:#cf1322; opacity:.6; pointer-events:none; }
    .hr-months { display:flex; font-size:11.5px; color:#8c8c8c; }
    .hr-months > i { font-style:normal; text-align:center; }
    .hr-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12.5px; color:#595959; align-items:center; }
    .hr-legend i { display:inline-block; width:14px; height:10px; border-radius:3px; margin-right:5px; vertical-align:middle; }
    /* охрана труда: матрица */
    .hr-mx td.c { text-align:center; cursor:pointer; font-size:12px; white-space:nowrap; }
    .hr-mx td.c:hover { outline:2px solid #91caff; outline-offset:-2px; }
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
    .hr-btn:hover { border-color:#1677ff; color:#1677ff; }
    .hr-btn.pri { border-color:#1677ff; background:#1677ff; color:#fff; font-weight:600; }
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
    .hr-lines [data-rec]:hover, .hr-lines [data-task]:hover { color:#1677ff; }
    .hr-pick { max-height:260px; overflow:auto; border:1px solid #f0f0f0; border-radius:8px; padding:6px 10px; columns:2; }
    .hr-pick label { display:block; font-size:13px; padding:2px 0; break-inside:avoid; cursor:pointer; }
    .hr-lock { font-size:12.5px; color:#8c8c8c; }
    @media (max-width: 800px) {
      .hr-cols, .hr-secs, .hr-form { grid-template-columns:1fr; }
      .hr-new { margin-left:0; width:100%; }
      .hr-bar select, .hr-bar input[type=text] { flex:1 1 100%; min-width:0; }
      .hr-modal { padding:0; }
      .hr-box { border-radius:0; min-height:100%; max-width:none; }
      .hr-tl td.nm { width:110px; }
      .hr-pick { columns:1; }
    }
  `;
  document.head.appendChild(st);
}

const HR_TASKS_PAGE = '/admin/tskpage01';
const HR_DEPT = 'HR служба персонала';
const HR_EMP_TYPE = { staff: 'Штатный', external: 'Внештатный (ГПХ)', self: 'Самозанятый' };
const HR_EMP_ST = { active: 'Работает', fired: 'Уволен' };
const HR_VAC_KINDS = ['Ежегодный оплачиваемый', 'Без сохранения зарплаты', 'Учебный', 'По беременности и родам', 'По уходу за ребёнком'];
const HR_VAC_ST = { plan: 'По графику', ordered: 'Оформлен приказом' };
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
const HR_FILE_DOCS = ['Заявление о приёме', 'Трудовой договор', 'Приказ о приёме', 'Согласие на обработку персональных данных', 'Договор о материальной ответственности',
  'Репутационное соглашение', 'Лист ознакомления с ЛНА', 'Копия паспорта', 'СНИЛС и ИНН', 'Военный билет / приписное', 'Опись личного дела'];
const HR_FILE_DOCS_SELF = ['Договор с самозанятым', 'Справка о статусе самозанятого', 'Копия паспорта', 'Согласие на обработку персональных данных'];
const HR_PB_COMMON = [['Проверка огнетушителей', 12], ['Тренировка по эвакуации', 12], ['Проверка пожарной сигнализации', 12], ['Проверка внутреннего противопожарного водопровода', 6], ['Обучение ответственного за пожарную безопасность', 36]];
const HR_SOUT_CLS = { '1': '#389e0d', '2': '#52c41a', '3.1': '#faad14', '3.2': '#fa8c16', '3.3': '#fa541c', '3.4': '#f5222d', '4': '#a8071a' };
const HR_LNA_KINDS = ['Правила внутреннего трудового распорядка', 'Положение об оплате труда', 'Положение о премировании', 'Положение о персональных данных',
  'Положение о системе управления охраной труда', 'Инструкция по охране труда', 'Инструкция о мерах пожарной безопасности', 'Должностная инструкция', 'Другое'];
const HR_PROG_KINDS = ['Премия по результатам', 'KPI', 'Обучение и развитие', 'ДМС', 'Нематериальная', 'Другое'];
const HR_EVENT_KINDS = ['Корпоратив', 'Тимбилдинг', 'Праздник', 'Обучение', 'Другое'];
const HR_RANKS = ['рядовой', 'ефрейтор', 'младший сержант', 'сержант', 'старший сержант', 'старшина', 'прапорщик', 'старший прапорщик', 'лейтенант', 'старший лейтенант', 'капитан', 'майор', 'подполковник', 'полковник'];
const HR_AVA = ['#1677ff', '#13a8a8', '#722ed1', '#d46b08', '#389e0d', '#c41d7f', '#2f54eb', '#08979c'];
const HR_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const hr = { d: null, me: null, myEmp: null, tab: '', staffView: 'list', group: 'dept', le: '', type: '', dept: '', q: '', fired: false, only: null,
  year: new Date().getFullYear(), orgEdit: false, mxLe: '' };

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
  const id = (((await res.json()) || {}).data || {}).id;
  if (!id) throw new Error('upload');
  return id;
}

// ---------- данные ----------
function hCan() { return hr.d && hr.d.priv !== null; }   // сервер отдал закрытые данные → admin или hr
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
function hSafetyLast(empId, kind) {
  let r = null;
  hr.d.safety.forEach(function(s) { if (Number(s.employee_id || 0) === Number(empId || 0) && s.kind === kind && (!r || hD(s.done_on) >= hD(r.done_on))) r = s; });
  return r;
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
    L('crm_vacations', { sort: ['start_date'] }), L('crm_safety', { sort: ['done_on'] }), L('crm_sout', { sort: ['workplace'] }),
    L('crm_lna', { sort: ['title'], appends: ['file'] }), L('crm_hr_programs', { sort: ['title'] }), L('crm_hr_events', { sort: ['-event_date'] }),
    L('crm_hr_private').catch(function() { return null; }),
    L('contract_objects', { sort: ['name'], fields: ['id', 'name'] }).catch(function() { return []; }),
    L('crm_tasks', { filter: { status: { $in: ['new', 'in_work', 'waiting', 'done'] } }, fields: ['id', 'title', 'status', 'due_date', 'executor_id', 'executor_name', 'employee_id', 'kind'] }).catch(function() { return []; })
  ]);
  hr.d = { emps: r[0], depts: r[1], les: r[2], vacs: r[3], safety: r[4], sout: r[5], lna: r[6], progs: r[7], events: r[8], priv: r[9], objects: r[10], tasks: r[11] };
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

// окно создания/правки записи. o: { coll, rec, spec, title, extra(rec) → html, wire(m, rec), prepare(vals, m, rec) → vals | 'ошибка', after(saved) }
function hEdit(o) {
  const rec = o.rec || null;
  const m = hModal('<div class="hr-box-h"><div class="hr-box-t">' + hEsc(o.title) + '</div><button class="hr-x">✕</button></div><div class="hr-box-b">'
    + hForm(o.spec, rec || o.preset) + (o.extra ? o.extra(rec) : '')
    + '<div class="hr-actions"><button class="hr-btn pri" data-save>Сохранить</button><button class="hr-btn hr-x">Отмена</button>'
    + (rec && rec.id ? '<button class="hr-btn warn" data-del>Удалить</button>' : '') + '</div></div>', o.wide);
  if (o.wire) o.wire(m, rec);
  const sv = m.querySelector('[data-save]');
  sv.addEventListener('click', async function() {
    let vals = hRead(m, o.spec);
    if (typeof vals === 'string') { hToast(vals); return; }
    if (o.prepare) { vals = await o.prepare(vals, m, rec); if (typeof vals === 'string') { hToast(vals); return; } }
    sv.disabled = true;
    try {
      const res = rec && rec.id ? await ctx.api.resource(o.coll).update({ filterByTk: rec.id, values: vals }) : await ctx.api.resource(o.coll).create({ values: vals });
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
  ['phone', 'Телефон', 'text'], ['email', 'Почта', 'text'], ['birthday', 'День рождения', 'date'],
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
const H_LE_MIL = [['mil_office', 'Военкомат организации', 'text'], ['mil_check_on', 'Последняя ежегодная сверка', 'date'], ['mil_plan_year', 'План воинского учёта получен на год', 'num']];
const H_LE = [['name', 'Название', 'text', null, 1], ['inn', 'ИНН', 'text'], ['kpp', 'КПП', 'text'], ['ogrn', 'ОГРН', 'text'], ['director', 'Руководитель', 'text']].concat(H_LE_MIL, [['address', 'Адрес', 'textarea'], ['note', 'Заметки', 'textarea']]);
const H_VAC = [['employee_id', 'Сотрудник', 'select', hEmpOpts, 1], ['kind', 'Вид отпуска', 'select', HR_VAC_KINDS, 1], ['start_date', 'С', 'date', null, 1], ['end_date', 'По (включительно)', 'date', null, 1],
  ['status', 'Статус', 'select', HR_VAC_ST, 1], ['note', 'Заметки', 'textarea']];
const H_SAFETY = [['employee_id', 'Сотрудник (пусто — общее мероприятие)', 'select', hEmpOpts], ['kind', 'Что', 'list', HR_SAFETY.map(function(x) { return x[0]; }).concat(HR_PB_COMMON.map(function(x) { return x[0]; })), 1],
  ['done_on', 'Проведено', 'date', null, 1], ['next_on', 'Следующее (пусто — посчитается само)', 'date'], ['doc', 'Документ / протокол / журнал', 'text'], ['note', 'Заметки', 'textarea']];
const H_SOUT = [['workplace', 'Рабочее место (должность)', 'text', null, 1], ['legal_entity_id', 'Юрлицо', 'select', hLeOpts], ['work_class', 'Класс условий труда', 'select', Object.keys(HR_SOUT_CLS)],
  ['card_no', 'Номер карты СОУТ', 'text'], ['assessed_on', 'Дата оценки', 'date'], ['next_on', 'Следующая оценка (пусто — через 5 лет)', 'date'], ['guarantees', 'Гарантии и компенсации', 'textarea'], ['note', 'Заметки', 'textarea']];
const H_LNA = [['title', 'Название', 'text', null, 1], ['kind', 'Вид', 'select', HR_LNA_KINDS], ['legal_entity_id', 'Юрлицо (пусто — все)', 'select', hLeOpts], ['number', 'Номер приказа', 'text'],
  ['approved_on', 'Утверждён', 'date'], ['review_on', 'Пересмотреть до', 'date'], ['need_ack', 'Ознакомление под подпись', 'select', [['1', 'нужно'], ['0', 'не нужно']]], ['note', 'Заметки', 'textarea']];
const H_PROG = [['title', 'Название', 'text', null, 1], ['kind', 'Вид', 'select', HR_PROG_KINDS], ['start_on', 'С', 'date'], ['end_on', 'По', 'date'], ['description', 'Условия: за что, сколько, как считается', 'textarea'], ['note', 'Заметки', 'textarea']];
const H_EVENT = [['title', 'Название', 'text', null, 1], ['kind', 'Вид', 'select', HR_EVENT_KINDS], ['event_date', 'Дата', 'date', null, 1], ['place', 'Место', 'text'], ['budget', 'Бюджет, ₽', 'num'], ['note', 'Заметки', 'textarea']];

// ---------- «требует внимания»: единая лента для дашборда ----------
// lvl: 0 — просрочено/срочно, 1 — скоро, 2 — к сведению. go: { emp } | { tab, ... } | { ids, title } (список сотрудников)
function hAlerts() {
  const d = hr.d, t = hToday(), out = [], staff = hStaff();
  const add = function(lvl, text, sub, go, date) { out.push({ lvl: lvl, text: text, sub: sub || '', go: go, date: date || '' }); };
  // охрана труда: последние записи с датой следующего
  staff.forEach(function(e) {
    HR_SAFETY.forEach(function(k) {
      const r = hSafetyLast(e.id, k[0]);
      if (!r || !r.next_on) return;
      const s = hDue(r.next_on);
      if (s === 'late') add(0, k[3] + ': просрочено — ' + e.full_name, 'нужно было до ' + hDate(r.next_on), { emp: e.id }, r.next_on);
      else if (s === 'soon') add(1, k[3] + ': ' + e.full_name + ' до ' + hDate(r.next_on), '', { emp: e.id }, r.next_on);
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
  // отпуска: уведомить сотрудника не позднее чем за 2 недели (ст. 123 ТК РФ) → напоминаем за 3 недели
  d.vacs.forEach(function(v) {
    const e = hEmp(v.employee_id); if (!e || e.status === 'fired') return;
    const n = hDays(t, v.start_date);
    if (v.status === 'plan' && n >= 0 && n <= 21) add(n <= 14 ? 0 : 1, 'Отпуск ' + e.full_name + ' с ' + hDate(v.start_date) + ' — уведомить и оформить приказ', 'уведомление — не позднее чем за 2 недели до начала', { vac: v.id }, v.start_date);
  });
  const y = new Date().getFullYear(), md = t.slice(5);
  if (md >= '11-01') {
    const noPlan = staff.filter(function(e) { return !d.vacs.some(function(v) { return Number(v.employee_id) === e.id && hD(v.start_date).slice(0, 4) === String(y + 1); }); });
    if (noPlan.length) add(md >= '12-10' ? 0 : 1, 'График отпусков на ' + (y + 1) + ': не запланировано у ' + hPeople(noPlan.length), 'график утверждается не позднее 17 декабря', { tab: 'vac', year: y + 1 });
  }
  // договоры ГПХ и самозанятых
  hActive().forEach(function(e) {
    if (!e.contract_until || (e.employment_type || 'staff') === 'staff') return;
    const n = hDays(t, e.contract_until);
    if (n <= 30) add(n < 0 ? 0 : 1, 'Договор ' + (HR_EMP_TYPE[e.employment_type] || '').toLowerCase() + ': ' + e.full_name, (n < 0 ? 'закончился ' : 'заканчивается ') + hDate(e.contract_until), { emp: e.id }, e.contract_until);
  });
  // СОУТ
  d.sout.forEach(function(s) {
    if (!s.next_on) return;
    const n = hDays(t, s.next_on);
    if (n <= 180) add(n < 0 ? 0 : 1, 'СОУТ: ' + s.workplace, (n < 0 ? 'срок оценки прошёл ' : 'повторная оценка до ') + hDate(s.next_on), { tab: 'safety' }, s.next_on);
  });
  if (!d.sout.length) add(2, 'СОУТ: рабочие места не заведены', 'добавьте в «Охране труда» → СОУТ', { tab: 'safety' });
  else { const ns = staff.filter(function(e) { return !e.sout_id; }); if (ns.length) add(2, 'СОУТ: рабочее место не указано у ' + hPeople(ns.length), '', { ids: ns.map(function(e) { return e.id; }), title: 'Не указано рабочее место СОУТ' }); }
  // ЛНА
  d.lna.forEach(function(l) {
    const miss = hLnaMissing(l);
    if (miss.length) add(1, '«' + l.title + '»: не ознакомлены ' + miss.length, '', { lna: l.id });
    if (l.review_on && hDays(t, l.review_on) <= 30) add(hDays(t, l.review_on) < 0 ? 0 : 1, '«' + l.title + '»: пересмотреть', 'до ' + hDate(l.review_on), { lna: l.id }, l.review_on);
  });
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
    if (!hActive().some(function(e) { return hInLe(e, l.id); })) return;
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
  // самозанятые: ежемесячные акты за прошлый месяц
  const pm = hPrevMonth(), noAct = hActive().filter(function(e) { return e.employment_type === 'self' && !(e.acts || {})[pm]; });
  if (noAct.length && t.slice(8) >= '03') add(t.slice(8) >= '10' ? 0 : 1, 'Акты самозанятых за ' + hMonthName(pm) + ': не подписано ' + noAct.length, 'отметьте на «Обзоре» → «Акты самозанятых»', { ids: noAct.map(function(e) { return e.id; }), title: 'Нет акта за ' + hMonthName(pm) });
  if (d.priv) {
    const inc = hStaff().filter(function(e) { const p = hPriv(e.id); return !p || (p.file_docs || []).length < HR_FILE_DOCS.length - 1; });
    if (inc.length) add(2, 'Личное дело не укомплектовано у ' + hPeople(inc.length), 'отметьте документы в карточке → «Личное дело»', { ids: inc.map(function(e) { return e.id; }), title: 'Личное дело не укомплектовано' });
  }
  const noLe = hActive().filter(function(e) { return !hLes(e).length; });
  if (noLe.length) add(2, 'Юрлицо не указано у ' + hPeople(noLe.length), d.les.length ? '' : 'сначала добавьте юрлица в «Сотрудники» → «Структура»', { ids: noLe.map(function(e) { return e.id; }), title: 'Без юрлица' });
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
    hr.tab = hCan() ? 'home' : 'staff';
    hRender();
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
hRoot().addEventListener('input', function(e) { if (e.target.getAttribute('data-f') === 'q') { hr.q = e.target.value; hRenderStaffList(); } });
hStart();

function hTabs() {
  const al = hCan() ? hAlerts().filter(function(a) { return a.lvl === 0; }).length : 0;
  const t = [['home', 'Обзор', al ? '<b class="red">' + al + '</b>' : ''], ['staff', 'Сотрудники', '<b>' + hActive().length + '</b>'], ['vac', 'Отпуска', ''],
    ['safety', 'Охрана труда и СОУТ', ''], ['mil', 'Воинский учёт', ''], ['docs', 'Документы и мероприятия', '']];
  return hCan() ? t : t.filter(function(x) { return x[0] === 'staff' || x[0] === 'vac'; });
}
function hRender() {
  hRoot().innerHTML = '<div class="hr-head"><div class="hr-title">Персонал</div>' + (hCan() ? '<button class="hr-new" data-act="newemp">+ Сотрудник</button>' : '') + '</div>'
    + '<div class="hr-tabs">' + hTabs().map(function(t) { return '<button class="hr-tab' + (hr.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + t[2] + '</button>'; }).join('') + '</div>'
    + '<div data-hr-body></div>';
  ({ home: hRenderHome, staff: hRenderStaff, vac: hRenderVac, safety: hRenderSafety, mil: hRenderMil, docs: hRenderDocs })[hr.tab]();
}
function hGo(go) {
  if (go.emp) return hOpenEmp(go.emp);
  if (go.vac) return hOpenVac(hr.d.vacs.find(function(v) { return v.id === go.vac; }));
  if (go.lna) return hOpenLna(hr.d.lna.find(function(l) { return l.id === go.lna; }));
  if (go.ev) return hOpenEvent(hr.d.events.find(function(x) { return x.id === go.ev; }));
  if (go.ids) { hr.only = { ids: go.ids, title: go.title }; hr.staffView = 'list'; hr.tab = 'staff'; }
  else { hr.tab = go.tab; if (go.year) hr.year = go.year; if (go.le !== undefined) hr.le = go.le; if (go.type !== undefined) hr.type = go.type; }
  hRender();
}
function hOnChange(e) {
  const f = e.target.getAttribute('data-f');
  if (f === 'le' || f === 'type' || f === 'dept' || f === 'group') { hr[f] = e.target.value; hRenderStaffList(); }
  if (f === 'fired') { hr.fired = e.target.checked; hRenderStaffList(); }
  if (f === 'mxLe') { hr.mxLe = e.target.value; hRenderSafety(); }
  const am = e.target.getAttribute('data-act-m');
  if (am) { const p = am.split('|'); hSaveAct(Number(p[0]), p[1], e.target.checked); return; }
  const hd = e.target.getAttribute('data-head');
  if (hd && e.target.value) hSaveHead(Number(hd), Number(e.target.value));
}
function hOnClick(e) {
  const c = function(s) { return e.target.closest ? e.target.closest(s) : null; };
  if (c('a[href^="tel:"], a[href^="mailto:"], a[target]')) return;
  const tab = c('[data-tab]');
  if (tab) { hr.tab = tab.getAttribute('data-tab'); hr.only = null; hRender(); return; }
  const act = c('[data-act]'), a = act && act.getAttribute('data-act');
  if (a === 'newemp') return hOpenNewEmp();
  if (a === 'sv') { hr.staffView = act.getAttribute('data-v'); hRenderStaff(); return; }
  if (a === 'unonly') { hr.only = null; hRenderStaff(); return; }
  if (a === 'orgedit') { hr.orgEdit = !hr.orgEdit; hRenderStaff(); return; }
  if (a === 'newle') return hOpenLe(null);
  if (a === 'year') { hr.year += Number(act.getAttribute('data-d')); hRenderVac(); return; }
  if (a === 'newvac') return hOpenVac(null, {});
  if (a === 'newpb') return hOpenSafety(null, { kind: HR_PB_COMMON[0][0] });
  if (a === 'newsout') return hOpenSout(null);
  if (a === 'newlna') return hOpenLna(null);
  if (a === 'newprog') return hOpenProg(null);
  if (a === 'newev') return hOpenEvent(null);
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
  const rec = c('[data-rec]');
  if (rec) {
    const p = rec.getAttribute('data-rec').split(':'), id = Number(p[1]);
    const find = function(l) { return l.find(function(x) { return x.id === id; }); };
    if (p[0] === 'safety') return hOpenSafety(find(hr.d.safety));
    if (p[0] === 'sout') return hOpenSout(find(hr.d.sout));
    if (p[0] === 'lna') return hOpenLna(find(hr.d.lna));
    if (p[0] === 'prog') return hOpenProg(find(hr.d.progs));
    if (p[0] === 'ev') return hOpenEvent(find(hr.d.events));
  }
  const emp = c('[data-emp]');
  if (emp && !c('select')) hOpenEmp(Number(emp.getAttribute('data-emp')));
}

// ---------- обзор (дашборд HR) ----------
function hRenderHome() {
  const d = hr.d, act = hActive(), t = hToday(), al = hAlerts();
  const byType = function(k) { return act.filter(function(e) { return (e.employment_type || 'staff') === k; }).length; };
  const onVac = act.filter(hVacNow), soon = d.vacs.filter(function(v) { const n = hDays(t, v.start_date); return n > 0 && n <= 30 && hEmp(v.employee_id); });
  const safetyLate = al.filter(function(a) { return a.lvl === 0 && /просрочено/.test(a.text); }).length;
  const liable = (d.priv || []).filter(function(p) { const e = hEmp(p.employee_id); return p.mil_status === 'liable' && e && e.status !== 'fired'; }).length;
  const nextEv = d.events.filter(function(x) { return hD(x.event_date) >= t; }).sort(function(a, b) { return hD(a.event_date).localeCompare(hD(b.event_date)); })[0];
  const tile = function(l, v, n, go, red) { return '<div class="hr-tile"' + (go ? ' data-go="' + hEsc(JSON.stringify(go)) + '"' : '') + '><div class="hr-tile-l">' + l + '</div><div class="hr-tile-v' + (red ? ' red' : '') + '">' + v + '</div><div class="hr-tile-n">' + n + '</div></div>'; };
  const lvlC = ['#cf1322', '#fa8c16', '#1677ff'];
  const leRows = d.les.map(function(l) { return [l.id, l.name]; }).concat([['', 'Юрлицо не указано']]).map(function(x) {
    const l = act.filter(function(e) { return x[0] === '' ? !hLes(e).length : hInLe(e, x[0]); });
    if (!l.length && x[0] === '') return '';
    const n = function(k) { return l.filter(function(e) { return (e.employment_type || 'staff') === k; }).length; };
    return '<tr data-go="' + hEsc(JSON.stringify({ tab: 'staff', le: x[0] === '' ? '-' : String(x[0]), type: '' })) + '" style="cursor:pointer;"><td>' + hEsc(x[1]) + '</td><td class="n">' + n('staff') + '</td><td class="n">' + n('external') + '</td><td class="n">' + n('self') + '</td><td class="n"><b>' + l.length + '</b></td></tr>';
  }).join('');
  hBody().innerHTML = '<div class="hr-tiles">'
    + tile('Сотрудников', act.length, 'штат ' + byType('staff') + ' · ГПХ ' + byType('external') + ' · самозанятые ' + byType('self'), { tab: 'staff' })
    + tile('Сейчас в отпуске', onVac.length, hEsc(onVac.map(function(e) { return e.last_name; }).join(', ') || 'никого') + (soon.length ? ' · за месяц уходят ' + soon.length : ''), { tab: 'vac' })
    + tile('Требует внимания', al.filter(function(a) { return a.lvl < 2; }).length, 'срочно: ' + al.filter(function(a) { return a.lvl === 0; }).length, null, al.some(function(a) { return a.lvl === 0; }))
    + tile('Охрана труда', safetyLate ? safetyLate : '✓', safetyLate ? 'просрочено' : 'просрочек нет', { tab: 'safety' }, safetyLate)
    + tile('Воинский учёт', liable, 'состоят на учёте', { tab: 'mil' })
    + tile('Ближайшее мероприятие', nextEv ? hDate(nextEv.event_date).slice(0, 5) : '—', nextEv ? hEsc(nextEv.title) : 'не запланировано', { tab: 'docs' })
    + '</div><div class="hr-cols"><div>'
    + '<div class="hr-card"><div class="hr-card-t">Требует внимания <small>' + al.length + '</small></div>'
    + (al.length ? al.map(function(x) {
        return '<div class="hr-al" data-go="' + hEsc(JSON.stringify(x.go)) + '"><span class="hr-dot" style="background:' + lvlC[x.lvl] + ';"></span><div class="hr-al-t">' + hEsc(x.text) + (x.sub ? '<div class="hr-al-s">' + hEsc(x.sub) + '</div>' : '') + '</div></div>';
      }).join('') : '<div class="hr-hint">Всё в порядке</div>') + '</div></div><div>'
    + '<div class="hr-card"><div class="hr-card-t">По юрлицам</div><table><thead><tr><th></th><th class="n">Штат</th><th class="n">ГПХ</th><th class="n">Самоз.</th><th class="n">Всего</th></tr></thead><tbody>' + leRows + '</tbody></table>'
    + (d.les.length ? '' : '<div class="hr-hint">Юрлица пока не заведены: «Сотрудники» → «Структура» → «+ Юрлицо».</div>') + '</div>'
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
        const a = e.acts || {}, c = function(m) { return '<td class="n"><label style="cursor:pointer;"><input type="checkbox" data-act-m="' + e.id + '|' + m + '"' + (a[m] ? ' checked' : '') + '>' + (a[m] ? ' <span class="hr-hint">' + hDate(a[m]).slice(0, 5) + '</span>' : '') + '</label></td>'; };
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
  hBody().innerHTML = '<div class="hr-card"><div class="hr-card-t">Организации<button class="hr-btn sm" data-act="newle">+ Юрлицо</button></div>'
    + '<div class="hr-hint" style="margin:-4px 0 8px;">Ежегодная сверка с военкоматом; план воинского учёта на следующий год — осенью (приказ об организации ВУ, план, карточка организации по форме 18). Нажмите на строку, чтобы отметить.</div>'
    + (orgs ? '<table><thead><tr><th>Юрлицо</th><th>Военкомат</th><th>Последняя сверка</th><th>План на год</th><th class="n">На учёте</th><th class="n">Всего людей</th></tr></thead><tbody>' + orgs + '</tbody></table>' : '<div class="hr-hint">Юрлица не заведены.</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">Военнообязанные <small>' + liable.length + '</small></div>'
    + (liable.length ? '<table><thead><tr><th>Сотрудник</th><th>Юрлицо</th><th>Звание</th><th>Категория годности</th><th>Военкомат</th><th>Сведения в военкомат</th></tr></thead><tbody>' + liable.map(function(e) {
        const p = hPriv(e.id), ev = e.status === 'fired' ? e.fired_on : e.hired_on, sent = p.mil_sent_on && (!ev || hD(p.mil_sent_on) >= hD(ev));
        return '<tr data-emp="' + e.id + '"><td>' + hEsc(e.full_name) + '</td><td>' + hEsc(hLes(e).map(hLe).filter(Boolean).map(function(l) { return l.name; }).join(', ')) + '</td><td>' + hShow(col('mil_rank'), p.mil_rank) + '</td>'
          + '<td>' + hEsc(p.mil_fitness || '—') + '</td><td>' + hShow(col('mil_office'), p.mil_office) + '</td><td class="' + (sent ? 'hr-ok' : 'hr-none') + '">' + (p.mil_sent_on ? hDate(p.mil_sent_on) : '—') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="hr-hint">Никто не отмечен. Отметьте в карточке сотрудника → «Воинский учёт».</div>')
    + (unknown.length ? '<div class="hr-hint" style="margin-top:8px;">Не указано, военнообязан ли: <a data-go="' + hEsc(JSON.stringify({ ids: unknown.map(function(e) { return e.id; }), title: 'Воинский учёт не заполнен' })) + '" style="color:#1677ff;cursor:pointer;">' + hPeople(unknown.length) + '</a></div>' : '') + '</div>';
}

// ---------- сотрудники: список и структура ----------
function hRenderStaff() {
  const can = hCan();
  hBody().innerHTML = '<div class="hr-bar"><span class="hr-seg"><button data-act="sv" data-v="list" class="' + (hr.staffView === 'list' ? 'on' : '') + '">Списком</button><button data-act="sv" data-v="org" class="' + (hr.staffView === 'org' ? 'on' : '') + '">Структура</button></span>'
    + (hr.staffView === 'list' ? '<input type="text" data-f="q" placeholder="Найти: фамилия, должность, телефон" value="' + hEsc(hr.q) + '">'
      + '<select data-f="le"><option value="">Все юрлица</option>' + hr.d.les.map(function(l) { return '<option value="' + l.id + '"' + (String(hr.le) === String(l.id) ? ' selected' : '') + '>' + hEsc(l.name) + '</option>'; }).join('') + '<option value="-"' + (hr.le === '-' ? ' selected' : '') + '>— юрлицо не указано —</option></select>'
      + '<select data-f="type"><option value="">Любой тип занятости</option>' + Object.keys(HR_EMP_TYPE).map(function(k) { return '<option value="' + k + '"' + (hr.type === k ? ' selected' : '') + '>' + HR_EMP_TYPE[k] + '</option>'; }).join('') + '</select>'
      + '<select data-f="dept"><option value="">Все отделы</option>' + hDeptNames().map(function(n) { return '<option' + (hr.dept === n ? ' selected' : '') + '>' + hEsc(n) + '</option>'; }).join('') + '</select>'
      + '<select data-f="group"><option value="dept"' + (hr.group === 'dept' ? ' selected' : '') + '>По отделам</option><option value="le"' + (hr.group === 'le' ? ' selected' : '') + '>По юрлицам</option><option value="type"' + (hr.group === 'type' ? ' selected' : '') + '>По типу занятости</option></select>'
      + '<label class="hr-hint" style="margin:0;cursor:pointer;"><input type="checkbox" data-f="fired"' + (hr.fired ? ' checked' : '') + '> уволенные</label>'
      : (can ? '<button class="hr-btn' + (hr.orgEdit ? ' pri' : '') + '" data-act="orgedit" style="margin-left:auto;">' + (hr.orgEdit ? 'Готово' : 'Изменить руководителей') + '</button>' : ''))
    + '</div>' + (hr.only && hr.staffView === 'list' ? '<div class="hr-only">Показаны: <b>' + hEsc(hr.only.title) + '</b> (' + hr.only.ids.length + ')<button class="hr-btn sm" data-act="unonly" style="margin-left:auto;">Показать всех</button></div>' : '')
    + '<div data-staff-list></div>';
  if (hr.staffView === 'list') hRenderStaffList(); else hRenderOrg();
}
function hEmpChips(e) {
  const out = [], v = hVacNow(e), t = e.employment_type || 'staff';
  if (e.status === 'fired') out.push('<span class="hr-chip">уволен</span>');
  if (t !== 'staff') out.push('<span class="hr-chip purple">' + (t === 'self' ? 'самозанятый' : 'ГПХ') + (e.contract_until ? ' до ' + hDate(e.contract_until) : '') + '</span>');
  if (v) out.push('<span class="hr-chip green">в отпуске до ' + hDate(v.end_date).slice(0, 5) + '</span>');
  if (hr.group !== 'le' || hr.tab !== 'staff') hLes(e).map(hLe).filter(Boolean).forEach(function(l) { out.push('<span class="hr-chip blue">' + hEsc(l.name) + '</span>'); });
  if (e.object_name) out.push('<span class="hr-chip">' + hEsc(e.object_name) + '</span>');
  const late = HR_SAFETY.filter(function(k) { const r = hSafetyLast(e.id, k[0]); return r && r.next_on && hDue(r.next_on) === 'late'; }).length;
  if (late && t === 'staff') out.push('<span class="hr-chip red">охрана труда: просрочено ' + late + '</span>');
  return out.join('');
}
function hRenderStaffList() {
  const box = hRoot().querySelector('[data-staff-list]'); if (!box || hr.staffView !== 'list') return;
  const q = hr.q.trim().toLowerCase();
  const list = hr.d.emps.filter(function(e) {
    if (hr.only) return hr.only.ids.indexOf(e.id) !== -1;
    if (!hr.fired && e.status === 'fired') return false;
    if (hr.le === '-' ? hLes(e).length : (hr.le && !hInLe(e, hr.le))) return false;
    if (hr.type && (e.employment_type || 'staff') !== hr.type) return false;
    if (hr.dept && e.department !== hr.dept) return false;
    if (q && [e.full_name, e.middle_name, e.position, e.email, e.phone, e.department].join(' ').toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  const keys = function(e) {   // по юрлицам человек попадает в каждую свою группу
    if (hr.group === 'le') { const l = hLes(e).map(hLe).filter(Boolean); return l.length ? l.map(function(x) { return x.name; }) : ['Юрлицо не указано']; }
    if (hr.group === 'type') return [HR_EMP_TYPE[e.employment_type || 'staff']];
    return [e.department || 'Без отдела'];
  };
  const order = hr.group === 'le' ? hr.d.les.map(function(l) { return l.name; }).concat(['Юрлицо не указано'])
    : hr.group === 'type' ? Object.keys(HR_EMP_TYPE).map(function(k) { return HR_EMP_TYPE[k]; }) : hDeptNames().concat(['Без отдела']);
  const groups = {};
  list.forEach(function(e) { keys(e).forEach(function(k) { (groups[k] = groups[k] || []).push(e); }); });
  const heads = {};
  hr.d.depts.forEach(function(d) { if (d.head_employee_id) heads[d.head_employee_id] = 1; });
  box.innerHTML = order.filter(function(n) { return groups[n]; }).map(function(n) {
    const people = groups[n].sort(function(a, b) { return (heads[b.id] ? 1 : 0) - (heads[a.id] ? 1 : 0) || String(a.full_name).localeCompare(String(b.full_name), 'ru'); });
    return '<div class="hr-grp">' + hEsc(n) + '<span>' + people.length + ' чел.</span></div><div class="hr-people">' + people.map(function(e) {
      return '<div class="hr-person' + (e.status === 'fired' ? ' off' : '') + '" data-emp="' + e.id + '">' + hAva(e.full_name) + '<div class="hr-person-b">'
        + '<div class="hr-person-n">' + hEsc(e.full_name) + '</div><div class="hr-person-p">' + hEsc(e.position || 'должность не указана') + (hr.group !== 'dept' && e.department ? ' · ' + hEsc(e.department) : '') + '</div>'
        + '<div class="hr-chips">' + hEmpChips(e) + '</div></div></div>';
    }).join('') + '</div>';
  }).join('') || '<div class="hr-empty"><b>Никого не нашли</b>Измените поиск или фильтры.</div>';
}
// оргсхема: юрлица сверху, руководитель компании, колонки подразделений первого уровня
function hRenderOrg() {
  const d = hr.d, can = hCan(), edit = can && hr.orgEdit;
  const kids = function(n) { return d.depts.filter(function(x) { return x.parent_name === n; }); };
  const staffOf = function(n) { return d.emps.filter(function(e) { return e.department === n && e.status !== 'fired'; }); };
  const size = function(dep) { return staffOf(dep.name).length + kids(dep.name).reduce(function(a, k) { return a + size(k); }, 0); };
  const head = function(dep) { return dep.head_employee_id ? hEmp(dep.head_employee_id) : null; };
  const headSel = function(dep) {
    if (!edit) return '';
    const h = head(dep);
    return '<select data-head="' + dep.id + '"><option value="">' + (h ? 'Сменить руководителя…' : 'Назначить руководителя…') + '</option>'
      + hActive().filter(function(e) { return !h || e.id !== h.id; }).map(function(e) { return '<option value="' + e.id + '">' + hEsc(e.full_name) + '</option>'; }).join('') + '</select>';
  };
  const face = function(e) { return '<div class="hr-org-face" data-emp="' + e.id + '">' + hAva(e.full_name) + '<div style="min-width:0;"><b>' + hEsc(e.full_name) + '</b><span class="p">' + hEsc(e.position || '') + '</span></div></div>'; };
  const names = function(list) { return list.map(function(e) { return '<a data-emp="' + e.id + '">' + hEsc(e.full_name) + '</a>'; }).join(', '); };
  const sub = function(dep) {
    const h = head(dep), p = staffOf(dep.name).filter(function(e) { return !h || e.id !== h.id; });
    return '<div class="hr-org-sub"><div class="hr-org-sub-h">' + hEsc(dep.name) + '<span>' + size(dep) + ' чел.</span></div>'
      + (h ? '<div class="hr-org-names"><a data-emp="' + h.id + '" style="color:#262626;font-weight:500;">' + hEsc(h.full_name) + '</a> — руководитель</div>' : '')
      + (p.length ? '<div class="hr-org-names">' + names(p) + '</div>' : '') + headSel(dep) + '</div>'
      + kids(dep.name).filter(function(k) { return size(k) || edit; }).map(sub).join('');
  };
  const top = d.depts.find(function(x) { return !x.parent_name || !d.depts.some(function(y) { return y.name === x.parent_name; }); });
  const act = hActive();
  const les = '<div class="hr-card-t" style="margin-bottom:6px;">Юрлица' + (can ? '<button class="hr-btn sm" data-act="newle">+ Юрлицо</button>' : '') + '</div>'
    + (d.les.length ? '<div class="hr-le">' + d.les.map(function(l) {
        const n = act.filter(function(e) { return hInLe(e, l.id); }).length;
        return '<div class="hr-le-c"' + (can ? ' data-le="' + l.id + '"' : '') + '><b>' + hEsc(l.name) + '</b><span class="hr-hint">' + (l.inn ? 'ИНН ' + hEsc(l.inn) + ' · ' : '') + n + ' чел.</span></div>';
      }).join('') + '</div>' : '<div class="hr-hint" style="margin-bottom:16px;">Юрлица не заведены. Добавьте их, затем укажите юрлицо в карточке каждого сотрудника.</div>');
  if (!top) { hRoot().querySelector('[data-staff-list]').innerHTML = les + '<div class="hr-empty"><b>Структура пока не заполнена</b></div>'; return; }
  const ceo = head(top), cols = kids(top.name).filter(function(c) { return size(c) || edit; });
  const empty = d.depts.filter(function(x) { return !size(x) && !head(x); });
  hRoot().querySelector('[data-staff-list]').innerHTML = '<div class="hr-org">' + les
    + (edit ? '<div class="hr-hint" style="margin-bottom:8px;">Выберите руководителя в списке под отделом — сохраняется сразу. Перевести сотрудника в другой отдел — в его карточке.</div>' : '')
    + '<div class="hr-org-ceo">' + (ceo ? face(ceo) : '<div class="hr-hint">' + hEsc(top.name) + ': руководитель не назначен</div>') + '</div>'
    + (edit ? '<div style="max-width:320px;margin:0 auto 6px;">' + headSel(top) + '</div>' : '')
    + '<div class="hr-org-line"></div><div class="hr-org-cols">' + cols.map(function(c) {
        const h = head(c), p = staffOf(c.name).filter(function(e) { return !h || e.id !== h.id; });
        return '<div class="hr-org-col"><div class="hr-org-col-h">' + hEsc(c.name) + ' <span class="hr-hint" style="font-weight:400;">' + size(c) + ' чел.</span></div>'
          + (h ? face(h) : '<div class="hr-hint">руководитель не назначен</div>') + headSel(c)
          + (p.length ? '<div class="hr-org-names" style="margin-top:6px;">' + names(p) + '</div>' : '')
          + kids(c.name).filter(function(k) { return size(k) || edit; }).map(sub).join('') + '</div>';
      }).join('') + '</div>'
    + (!edit && empty.length ? '<div class="hr-hint" style="margin-top:14px;">Отделы без сотрудников: ' + hEsc(empty.map(function(x) { return x.name; }).join(', ')) + '</div>' : '')
    + '</div>';
}
async function hSaveHead(depId, empId) {
  try {
    await ctx.api.resource('crm_departments').update({ filterByTk: depId, values: { head_employee_id: empId } });
    const dep = hr.d.depts.find(function(x) { return x.id === depId; }); if (dep) dep.head_employee_id = empId;
    hRenderOrg(); hToast('Руководитель назначен');
  } catch (e) { hToast('Не удалось сохранить'); }
}
function hOpenLe(l) { hEdit({ coll: 'crm_legal_entities', rec: l, spec: H_LE, title: l ? l.name : 'Новое юрлицо' }); }
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
  const mainView = hKv(H_MAIN.filter(function(f) { return f[0] !== 'note' && f[0] !== 'last_name' && f[0] !== 'first_name' && (e[f[0]] || ['position', 'department', 'legal_entity_id', 'phone', 'hired_on'].indexOf(f[0]) !== -1) && !(f[0] === 'contract_until' && staff); }), e)
    + (e.note ? '<div class="hr-hint" style="white-space:pre-wrap;margin-top:8px;">' + hEsc(e.note) + '</div>' : '');
  // отпуска
  const vacs = hr.d.vacs.filter(function(v) { return Number(v.employee_id) === e.id && hD(v.end_date).slice(0, 4) >= String(y); });
  const vacView = (staff ? '<div class="hr-hint" style="margin:0 0 6px;">Осталось в ' + y + ': <b style="color:#262626;">' + hVacLeft(e, y) + ' дн.</b> из ' + (e.vacation_days || 28) + '</div>' : '')
    + lines(vacs.map(function(v) { return '<div data-rec="vac:' + v.id + '"><span>' + hDate(v.start_date) + ' – ' + hDate(v.end_date) + ' · ' + (v.days || '') + ' дн.' + (v.kind !== HR_VAC_KINDS[0] ? ' · ' + hEsc(v.kind) : '') + '</span><span class="hr-chip' + (v.status === 'ordered' ? ' blue' : '') + '">' + hEsc(HR_VAC_ST[v.status] || '') + '</span></div>'; }), 'Отпусков не запланировано')
    + (can ? '<div class="hr-actions" style="margin-top:8px;"><button class="hr-btn sm" data-newvac>+ Отпуск</button></div>' : '');
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
    + '<div class="hr-actions" style="margin-top:8px;"><a class="hr-btn sm" href="' + HR_TASKS_PAGE + '?new=' + (e.user_id ? 'u' + e.user_id : 'e' + e.id) + '">Поставить задачу</a>' + (can ? '<a class="hr-btn sm" href="' + HR_TASKS_PAGE + '?new=hr:' + e.id + '">+ Кадровая задача</a>' : '') + '</div>';
  const milView = p.mil_status === 'liable' ? hKv(H_MIL.filter(function(f) { return p[f[0]] || f[0] === 'mil_office' || f[0] === 'mil_vus'; }), p) : hKv(H_MIL.slice(0, 1), p);
  const prog = hr.d.progs.find(function(x) { return x.id === Number(p.program_id); });
  const motView = '<div class="hr-kv"><div class="k">Программа</div><div class="v">' + (prog ? '<a class="hr-link" data-rec="prog:' + prog.id + '" style="color:#1677ff;cursor:pointer;">' + hEsc(prog.title) + '</a>' : '<span class="hr-none">—</span>') + '</div>'
    + '<div class="k">Мотивация</div><div class="v">' + (p.motivation ? hEsc(p.motivation) : '<span class="hr-none">—</span>') + '</div></div>';
  const v = hVacNow(e), sen = hSeniority(e);
  box.innerHTML = '<div class="hr-box-h">' + hAva(e.full_name) + '<div class="hr-box-t">' + hEsc([e.last_name, e.first_name, e.middle_name].filter(Boolean).join(' ') || e.full_name)
    + '<small>' + hEsc([e.position, e.department].filter(Boolean).join(' · ') || '—') + '</small>'
    + '<div class="hr-chips" style="margin-top:6px;">' + hLes(e).map(hLe).filter(Boolean).map(function(l) { return '<span class="hr-chip blue">' + hEsc(l.name) + '</span>'; }).join('')
    + (e.rate && e.rate !== '1' ? '<span class="hr-chip">' + hEsc(e.rate) + ' ставки</span>' : '') + (e.object_name ? '<span class="hr-chip">' + hEsc(e.object_name) + '</span>' : '') + '<span class="hr-chip' + (staff ? '' : ' purple') + '">' + HR_EMP_TYPE[e.employment_type || 'staff'] + '</span>'
    + (e.status === 'fired' ? '<span class="hr-chip">уволен ' + hDate(e.fired_on) + '</span>' : v ? '<span class="hr-chip green">в отпуске до ' + hDate(v.end_date) + '</span>' : '<span class="hr-chip green">работает</span>')
    + (sen ? '<span class="hr-chip">стаж ' + sen + '</span>' : '')
    + (e.phone ? '<a class="hr-chip" style="text-decoration:none;" href="tel:' + hEsc(String(e.phone).replace(/[^\d+]/g, '')) + '">' + hEsc(e.phone) + '</a>' : '')
    + (e.email ? '<a class="hr-chip" style="text-decoration:none;" href="mailto:' + hEsc(e.email) + '">' + hEsc(e.email) + '</a>' : '') + '</div></div><button class="hr-x">✕</button></div>'
    + '<div class="hr-box-b"><div class="hr-secs">'
    + sec('main', 'Основное', H_MAIN, e, false, mainView)
    + sec('vac', 'Отпуска', null, null, false, vacView)
    + (can ? sec('mot', 'Мотивация', H_MOT, p, false, motView) : '')
    + sec('ot', 'Охрана труда и СОУТ', null, null, false, otView)
    + (can ? sec('mil', 'Воинский учёт', H_MIL, p, false, milView) : '')
    + (can ? sec('pers', 'Личные данные <span class="hr-lock">🔒 видят HR и администратор</span>', H_PERSONAL, p) : '')
    + (can ? sec('file', 'Личное дело', H_FILE, p, false, hKv(H_FILE, p) + '<div class="hr-hint" style="margin-top:4px;">' + (p.file_docs || []).length + ' из ' + fileList.length + ' документов</div>') : '')
    + sec('lna', 'Ознакомление с документами', null, null, false, lnaView)
    + sec('ev', 'Мероприятия', null, null, false, evView)
    + sec('tasks', 'Задачи', null, null, true, taskView)
    + '</div></div>';
  // события карточки
  box.querySelectorAll('[data-edit]').forEach(function(b) { b.addEventListener('click', function() { m.__edit = b.getAttribute('data-edit'); hRenderEmp(m, id); }); });
  box.querySelectorAll('[data-secsave]').forEach(function(b) {
    b.addEventListener('click', async function() {
      const key = b.getAttribute('data-secsave'), spec = { main: H_MAIN, mot: H_MOT, mil: H_MIL, pers: H_PERSONAL, file: H_FILE }[key];
      let vals = hRead(box.querySelector('[data-sec="' + key + '"]'), spec);
      if (typeof vals === 'string') { hToast(vals); return; }
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
  const nv = box.querySelector('[data-newvac]');
  if (nv) nv.addEventListener('click', function() { hOpenVac(null, { employee_id: id }, function() { hRenderEmp(m, id); }); });
}

// ---------- отпуска ----------
function hVacDays(v) { return hDays(v.start_date, v.end_date) + 1; }
function hOpenVac(v, preset, after) {
  if (!hCan()) { if (v) hOpenEmp(v.employee_id); return; }
  hEdit({ coll: 'crm_vacations', rec: v, preset: Object.assign({ kind: HR_VAC_KINDS[0], status: 'plan' }, preset || {}), spec: H_VAC,
    title: v ? 'Отпуск: ' + ((hEmp(v.employee_id) || {}).full_name || '') : 'Новый отпуск',
    extra: function() { return '<div class="hr-hint" data-vd style="margin-top:8px;"></div>'; },
    wire: function(m) {
      const upd = function() {
        const s = m.querySelector('[data-v="start_date"]').value, en = m.querySelector('[data-v="end_date"]').value, e = hEmp(m.querySelector('[data-v="employee_id"]').value);
        const n = s && en ? hDays(s, en) + 1 : 0;
        m.querySelector('[data-vd]').innerHTML = n > 0 ? n + ' ' + hNoun(n, 'календарный день', 'календарных дня', 'календарных дней') + (e ? ' · осталось у сотрудника в ' + s.slice(0, 4) + ': ' + hVacLeft(e, s.slice(0, 4)) + ' дн. (без учёта этого отпуска' + (v ? ' и с его прежней длиной' : '') + ')' : '') : '';
      };
      m.querySelectorAll('[data-v]').forEach(function(x) { x.addEventListener('change', upd); });
      upd();
    },
    prepare: function(vals) {
      if (vals.end_date < vals.start_date) return 'Окончание раньше начала';
      vals.days = hVacDays(vals);
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
      const cls = v.kind !== HR_VAC_KINDS[0] ? 'other' : v.status;
      return '<span class="hr-vb ' + cls + '" data-vac="' + v.id + '" title="' + hEsc(hDate(v.start_date) + ' – ' + hDate(v.end_date) + ', ' + v.days + ' дн. · ' + v.kind + ' · ' + (HR_VAC_ST[v.status] || '')) + '" style="left:' + (s / diy * 100) + '%;width:' + ((en - s + 1) / diy * 100) + '%;">' + (en - s >= 6 ? v.days : '') + '</span>';
    }).join('');
    const now = t.slice(0, 4) === String(y) ? '<span class="hr-now" style="left:' + (hDays(ys, t) / diy * 100) + '%;"></span>' : '';
    const left = hVacLeft(e, y);
    const grp = e.department !== lastDept ? '<tr><td colspan="3" style="font-weight:600;padding-top:12px;">' + hEsc(e.department || 'Без отдела') + '</td></tr>' : '';
    lastDept = e.department;
    return grp + '<tr><td class="nm" data-emp="' + e.id + '">' + hEsc(e.full_name) + '</td><td><div class="hr-track"' + (can ? ' data-track="' + e.id + '"' : '') + '>' + bg + bars + now + '</div></td>'
      + '<td class="rest' + (left < 0 ? ' hr-late' : left > 0 && y <= new Date().getFullYear() ? '' : ' hr-ok') + '" title="осталось из ' + (e.vacation_days || 28) + '">' + left + ' дн.</td></tr>';
  }).join('');
  hBody().innerHTML = '<div class="hr-bar"><button class="hr-btn" data-act="year" data-d="-1">‹</button><b style="font-size:16px;">' + y + '</b><button class="hr-btn" data-act="year" data-d="1">›</button>'
    + '<div class="hr-legend" style="margin-left:12px;"><span><i style="background:#91caff;"></i>по графику</span><span><i style="background:#1677ff;"></i>оформлен приказом</span><span><i style="background:#b37feb;"></i>другой вид отпуска</span><span><i style="background:#cf1322;width:2px;"></i>сегодня</span></div>'
    + (can ? '<button class="hr-new" data-act="newvac">+ Отпуск</button>' : '') + '</div>'
    + (can ? '<div class="hr-hint" style="margin-bottom:8px;">Нажмите на пустое место в строке сотрудника — откроется новый отпуск с этой даты. Нажмите на отпуск — изменить. Справа — сколько дней ежегодного отпуска осталось запланировать.</div>' : '')
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
  const m = hEdit({ coll: 'crm_safety', rec: s, preset: preset, spec: H_SAFETY, title: title || (s ? s.kind : 'Новая запись'),
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
  hEdit({ coll: 'crm_sout', rec: s, spec: H_SOUT, title: s ? 'СОУТ: ' + s.workplace : 'Новое рабочее место (СОУТ)',
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
    + '<div class="hr-cols"><div class="hr-card"><div class="hr-card-t">Пожарная безопасность: общие мероприятия<button class="hr-btn sm" data-act="newpb">+ Запись</button></div>'
    + (ck.length ? '<table><thead><tr><th>Что</th><th>Проведено</th><th>Следующее</th></tr></thead><tbody>' + ck.map(function(k) {
        const s = common[k], st = s.next_on ? hDue(s.next_on) : 'ok';
        return '<tr data-rec="safety:' + s.id + '"><td>' + hEsc(k) + (s.doc ? '<div class="hr-hint">' + hEsc(s.doc) + '</div>' : '') + '</td><td>' + hDate(s.done_on) + '</td><td class="hr-' + st + '">' + (hDate(s.next_on) || '—') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="hr-hint">Нет записей. Например: проверка огнетушителей, тренировка по эвакуации, проверка пожарной сигнализации.</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">СОУТ — специальная оценка условий труда<button class="hr-btn sm" data-act="newsout">+ Рабочее место</button></div>'
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
  hEdit({ coll: 'crm_lna', rec: l ? Object.assign({}, l, { need_ack: l.need_ack ? '1' : '0' }) : null, preset: { need_ack: '1' }, spec: H_LNA, title: l ? l.title : 'Новый документ (ЛНА)', wide: true,
    extra: function() {
      const who = l ? hLnaFor(l) : hStaff();
      return '<div class="hr-actions" style="margin-top:12px;"><span class="hr-hint" style="margin:0;" data-fname>' + (l && l.file ? 'Файл: <a target="_blank" href="' + hEsc(l.file.url) + '" style="color:#1677ff;">' + hEsc(l.file.title || l.file.filename || 'открыть') + '</a>' : 'Файл не прикреплён') + '</span>'
        + '<label class="hr-btn sm" style="cursor:pointer;">Прикрепить файл<input type="file" data-file style="display:none;"></label></div>'
        + hPicker(who, function(e) { return ((l && l.acks) || {})[e.id] || false; }, true);
    },
    wire: function(m) {
      hWirePicker(m);
      m.querySelector('[data-file]').addEventListener('change', async function(ev) {
        const f = ev.target.files[0]; if (!f) return;
        m.querySelector('[data-fname]').textContent = 'Загружаю…';
        try { fileId = await hUpload(f); m.querySelector('[data-fname]').textContent = 'Файл: ' + f.name; } catch (err) { m.querySelector('[data-fname]').textContent = 'Не удалось загрузить файл'; }
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
  hEdit({ coll: 'crm_hr_programs', rec: p, spec: H_PROG, title: p ? p.title : 'Новая мотивационная программа',
    extra: function(r) {
      if (!r) return '';
      const who = (hr.d.priv || []).filter(function(x) { return Number(x.program_id) === r.id; }).map(function(x) { return hEmp(x.employee_id); }).filter(Boolean);
      return '<div class="hr-hint" style="margin-top:10px;">Участники: ' + (who.length ? hEsc(who.map(function(e) { return e.full_name; }).join(', ')) : 'пока нет') + '. Программа назначается в карточке сотрудника, раздел «Мотивация».</div>';
    } });
}
function hOpenEvent(x, after) {
  hEdit({ coll: 'crm_hr_events', rec: x, spec: H_EVENT, title: x ? x.title : 'Новое мероприятие', wide: true,
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
      + '<td>' + (l.file ? '<a target="_blank" href="' + hEsc(l.file.url) + '" style="color:#1677ff;">файл</a>' : '') + '</td></tr>';
  }).join('');
  const progCount = function(p) { return (d.priv || []).filter(function(x) { return Number(x.program_id) === p.id && hEmp(x.employee_id) && hEmp(x.employee_id).status !== 'fired'; }).length; };
  const up = d.events.filter(function(x) { return hD(x.event_date) >= t; }).reverse(), past = d.events.filter(function(x) { return hD(x.event_date) < t; });
  const evRow = function(x) { return '<tr data-rec="ev:' + x.id + '"><td>' + hDate(x.event_date) + '</td><td>' + hEsc(x.title) + '<div class="hr-hint">' + hEsc([x.kind, x.place].filter(Boolean).join(' · ')) + '</div></td><td class="n">' + (x.participants || []).length + '</td><td class="n">' + (x.budget ? Number(x.budget).toLocaleString('ru-RU') + ' ₽' : '') + '</td></tr>'; };
  hBody().innerHTML = '<div class="hr-card"><div class="hr-card-t">Локальные нормативные акты<button class="hr-btn sm" data-act="newlna">+ Документ</button></div>'
    + (lnaRows ? '<table><thead><tr><th>Документ</th><th>Приказ</th><th>Пересмотр</th><th class="n">Ознакомлены</th><th></th></tr></thead><tbody>' + lnaRows + '</tbody></table>'
      : '<div class="hr-hint">Документов нет. Обычно это правила внутреннего трудового распорядка, положения об оплате труда и премировании, о персональных данных, инструкции по охране труда и пожарной безопасности.</div>') + '</div>'
    + '<div class="hr-cols"><div class="hr-card"><div class="hr-card-t">Корпоративные мероприятия и тимбилдинги<button class="hr-btn sm" data-act="newev">+ Мероприятие</button></div>'
    + (d.events.length ? '<table><thead><tr><th>Дата</th><th>Мероприятие</th><th class="n">Участников</th><th class="n">Бюджет</th></tr></thead><tbody>'
        + (up.length ? '<tr><td colspan="4" class="hr-hint" style="font-weight:600;">Впереди</td></tr>' + up.map(evRow).join('') : '')
        + (past.length ? '<tr><td colspan="4" class="hr-hint" style="font-weight:600;">Прошедшие</td></tr>' + past.map(evRow).join('') : '') + '</tbody></table>'
      : '<div class="hr-hint">Мероприятий пока нет.</div>') + '</div>'
    + '<div class="hr-card"><div class="hr-card-t">Мотивационные программы<button class="hr-btn sm" data-act="newprog">+ Программа</button></div>'
    + (d.progs.length ? '<div class="hr-lines">' + d.progs.map(function(p) {
        const on = (!p.end_on || hD(p.end_on) >= t);
        return '<div data-rec="prog:' + p.id + '" style="cursor:pointer;"><span><b>' + hEsc(p.title) + '</b><div class="hr-hint">' + hEsc([p.kind, p.start_on || p.end_on ? (hDate(p.start_on) || '…') + ' – ' + (hDate(p.end_on) || 'бессрочно') : ''].filter(Boolean).join(' · ')) + '</div></span>'
          + '<span class="hr-chip' + (on ? ' green' : '') + '">' + progCount(p) + ' чел.</span></div>';
      }).join('') + '</div>' : '<div class="hr-hint">Программ пока нет. У каждого сотрудника в карточке → «Мотивация» указывается его программа и что его мотивирует.</div>') + '</div></div>';
}
