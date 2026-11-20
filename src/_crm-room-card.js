const CRM_ROOM_CARD_CSS = `    .op-acts { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; padding-top:12px; border-top:1px solid #e9edf5; }
    .op-kv { display:grid; grid-template-columns:auto 1fr; gap:6px 12px; font-size:13px; }
    .op-kv b { color:var(--muted); font-weight:500; }
    /* карточка помещения (просмотр) */
    .op-cs { margin-top:14px; padding-top:12px; border-top:1px solid #e9edf5; }
    .op-cs > label { display:block; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#5b6478; margin-bottom:8px; }
    .op-big { font-size:22px; font-weight:800; color:var(--ink); line-height:1.15; }
    .op-big small { font-size:12.5px; font-weight:500; color:var(--muted); }
    .op-tag { display:inline-block; padding:1px 8px; border-radius:10px; font-size:12px; font-weight:600; color:#fff; }
    .op-bar { height:6px; border-radius:3px; background:#e9edf5; overflow:hidden; margin:6px 0 4px; }
    .op-bar i { display:block; height:100%; background:var(--brand); }
    .op-pay { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
    .op-pay span { font-size:11.5px; padding:1px 7px; border-radius:9px; background:#f3f5f9; color:#3a4256; }
    .op-pay span.ok { background:#e5f1ea; color:#2f7d4f; }
    .op-rq { display:block; font-size:12.5px; padding:5px 0; border-bottom:1px dashed #e9edf5; color:var(--ink); text-decoration:none; }
    .op-rq:hover { color:var(--brand); }
    .op-hint { font-size:12.5px; color:var(--muted); line-height:1.45; margin:6px 0 0; }
    .op-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:32px; padding:0 12px; border:1px solid #c3cad8; background:#fff; color:var(--ink); border-radius:7px; font:inherit; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; transition:border-color .15s, background .15s, color .15s; }
    .op-btn:hover { border-color:var(--brand); color:var(--brand); background:#f3f5f9; }
    .op-btn.on, .op-btn.pri { background:var(--brand); border-color:var(--brand); color:#fff; }
`;
const OP_CST = { '1_problem': ['Проблема', '#c23b3b'], '2_terminating': ['На расторжении', '#722ed1'], '2_docs': ['Не хватает документов', '#1c2d58'], '2_attention': ['Требует внимания', '#8a5a00'], '3_ok': ['В порядке', '#2f7d4f'] };
const OP_RQST = { new: 'Новая', in_work: 'В работе', waiting: 'Ждёт', done: 'На проверке', closed: 'Закрыта', cancelled: 'Отменена' };
const OP_REG = '/admin/b5znz7yxpy3', OP_REQ = '/admin/j3a32zo1jzo';
function opRub(n) { return n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ₽'; }
function crmRentedRoomCard(r, c0, d, options) {
  const c = d && d.c ? d.c : c0, st = OP_CST[c.contract_status], today = new Date().toISOString().slice(0, 10);
  const end = c.termination_date || c.end_date, start = c.date_act || c.date_signed;
  let h = '<h4>' + opEsc(r.code) + (r.title ? ' · ' + opEsc(r.title) : '') + '</h4>'
    + '<div class="op-kv"><b>Площадь</b><span>' + opArea(r.area_sqm) + '</span>' + (r.purpose ? '<b>Назначение</b><span>' + opEsc(r.purpose) + '</span>' : '')
    + (r.heating ? '<b>Отопление</b><span>' + opEsc(r.heating) + '</span>' : '') + '</div>'
    + (options.rooms ? '<div class="op-hint">' + options.rooms + '</div>' : '');
  // арендатор
  h += '<div class="op-cs"><label>Арендатор</label><div style="font-size:15px;font-weight:700;">' + opEsc(c.tenant_name || '—') + '</div><div class="op-kv" style="margin-top:6px;">'
    + [['ИНН', c.inn], ['КПП', c.kpp], ['ОГРН', c.ogrn], [c.director_post || 'Руководитель', c.director || c.tenant_fio], ['Контакт', c.contact_person], ['Телефон', c.phone], ['Почта', c.email]]
      .filter(function(x) { return x[1]; }).map(function(x) {
        const v = x[0] === 'Телефон' ? '<a href="tel:' + opEsc(String(x[1]).replace(/[^\d+]/g, '')) + '">' + opEsc(x[1]) + '</a>' : x[0] === 'Почта' ? '<a href="mailto:' + opEsc(x[1]) + '">' + opEsc(x[1]) + '</a>' : opEsc(x[1]);
        return '<b>' + opEsc(x[0]) + '</b><span>' + v + '</span>';
      }).join('') + '</div></div>';
  // договор и срок
  h += '<div class="op-cs"><label>Договор</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><b style="font-size:14px;">№ ' + opEsc(c.contract_number || c.id) + '</b>'
    + (st ? '<span class="op-tag" style="background:' + st[1] + ';">' + st[0] + '</span>' : '') + '</div><div class="op-kv" style="margin-top:6px;">'
    + (c.date_signed ? '<b>Подписан</b><span>' + opDate(c.date_signed) + '</span>' : '') + (c.date_act ? '<b>Акт</b><span>' + opDate(c.date_act) + '</span>' : '')
    + (end ? '<b>' + (c.termination_date ? 'Расторжение' : 'До') + '</b><span>' + opDate(end) + '</span>' : '') + (d && d.adds ? '<b>Допсоглашения</b><span>' + d.adds + '</span>' : '') + '</div>';
  if (start && end && end < '2099') {
    const t0 = Date.parse(start), t1 = Date.parse(end), pct = Math.max(0, Math.min(100, (Date.now() - t0) / Math.max(1, t1 - t0) * 100)), left = Math.ceil((t1 - Date.now()) / 864e5);
    h += '<div class="op-bar"><i style="width:' + pct.toFixed(0) + '%;' + (left < 60 ? 'background:var(--red);' : '') + '"></i></div><div class="op-hint" style="margin:0;' + (left < 60 ? 'color:var(--red);font-weight:600;' : '') + '">'
      + (left < 0 ? 'срок истёк ' + (-left) + ' дн. назад' : 'осталось ' + left + ' дн.') + '</div>';
  }
  h += '</div>';
  // деньги
  const per = Number(c.rent_per_sqm) || null, rent = Number(c.rent_amount) || null, ut = Number(c.utility_amount) || null;
  if (options.showMoney) {
  h += '<div class="op-cs"><label>Деньги</label><div class="op-big">' + opRub(rent) + ' <small>в месяц' + (per ? ' · ' + opRub(per) + '/м²' : '') + '</small></div><div class="op-kv" style="margin-top:8px;">'
    + (ut ? '<b>Коммунальные</b><span>' + opRub(ut) + ' / мес' + (c.utility_per_sqm ? ' (' + opRub(c.utility_per_sqm) + '/м²)' : '') + '</span>' : '')
    + (rent || ut ? '<b>Итого в месяц</b><span><b style="color:var(--ink);">' + opRub((rent || 0) + (ut || 0)) + '</b></span>' : '')
    + (c.deposit_amount ? '<b>Депозит</b><span>' + opRub(c.deposit_amount) + '</span>' : '') + (c.total_amount ? '<b>Сумма договора</b><span>' + opRub(c.total_amount) + '</span>' : '')
    + (rent && r.area_sqm && opNum(c.area_sqm) && Math.abs(opNum(c.area_sqm) - opNum(r.area_sqm)) > 0.05 ? '<b>На это помещение</b><span>≈ ' + opRub(Math.round(rent * opNum(r.area_sqm) / opNum(c.area_sqm))) + ' / мес (по доле площади)</span>' : '')
    + '</div><div class="op-pay">' + [['депозит', c.deposit_invoiced, c.deposit_paid, c.deposit_amount], ['аренда', c.rent_invoiced, c.rent_paid, rent], ['КУ', c.utility_invoiced, c.utility_paid, ut]]
      .filter(function(x) { return x[3]; }).map(function(x) { return '<span' + (x[2] ? ' class="ok"' : '') + ' title="первый счёт при заключении">' + x[0] + ': ' + (x[2] ? 'оплачен' : x[1] ? 'счёт выставлен' : 'счёт не выставлен') + '</span>'; }).join('') + '</div>';
  const ps = d && d.prices ? d.prices.filter(function(p) { return p.rent_on !== false && p.amount != null; }) : [];
  if (ps.length) h += '<div class="op-kv" style="margin-top:10px;">' + ps.map(function(p) {
    const cur = p.date_from <= today && today <= (p.date_to || '9999'), fut = p.date_from > today;
    return '<b' + (cur ? ' style="color:var(--ink);font-weight:700;"' : '') + '>' + opDate(p.date_from) + (p.date_to && p.date_to < '2099' ? ' – ' + opDate(p.date_to) : ' →') + '</b><span' + (cur ? ' style="font-weight:700;"' : fut ? '' : ' style="color:var(--muted);"') + '>'
      + opRub(p.amount) + ((p.basis || 'per_sqm') === 'per_sqm' ? '/м²' : ' / мес') + (cur ? ' · сейчас' : fut ? ' · будет' : '') + '</span>';
  }).join('') + '</div>';
  h += '</div>';
  }
  // заявки
  if (d && d.reqs) {
    const open = d.reqs.filter(function(q) { return ['new', 'in_work', 'waiting'].indexOf(q.status) !== -1; });
    h += '<div class="op-cs"><label>Заявки арендатора · ' + (open.length ? 'открыто ' + open.length : 'открытых нет') + (d.reqs.length ? ', всего ' + d.reqs.length : '') + '</label>'
      + d.reqs.slice(0, 5).map(function(q) {
        const late = open.indexOf(q) !== -1 && q.due_date && q.due_date < today;
        return '<a class="op-rq" href="' + OP_REQ + '?open=req:' + q.id + '">№' + q.id + ' ' + opEsc(q.title || '') + ' <span style="color:' + (late ? 'var(--red)' : 'var(--muted)') + ';">· ' + opEsc(OP_RQST[q.status] || q.status) + (late ? ', просрочена' : '') + '</span></a>';
      }).join('') + '</div>';
  }
  if (!d || d.loading) h += '<div class="op-hint" style="margin-top:12px;">Загружаю договор…</div>';
  if (d && d.err) h += '<div class="op-hint" style="margin-top:12px;color:var(--red);">Не удалось загрузить договор целиком — показано кратко.</div>';
  if (c.notes) h += '<div class="op-cs"><label>Заметки по договору</label><div class="op-hint" style="margin:0;white-space:pre-wrap;">' + opEsc(c.notes) + '</div></div>';
  if (r.note) h += '<div class="op-cs"><label>Заметки по помещению</label><div class="op-hint" style="margin:0;white-space:pre-wrap;">' + opEsc(r.note) + '</div></div>';
  return h + '<div class="op-acts"><a class="op-btn pri" href="' + OP_REG + '?open=active:' + c0.id + '">Открыть договор</a>'
    + (c.contract_scan_url ? '<a class="op-btn" href="' + opEsc(c.contract_scan_url) + '" target="_blank" rel="noopener">Скан договора</a>' : '')
    + (c.act_scan_url ? '<a class="op-btn" href="' + opEsc(c.act_scan_url) + '" target="_blank" rel="noopener">Скан акта</a>' : '') + '</div>';
}
function crmFreeRoomCard(r, state, kind) {
  return '<h4>' + opEsc(r.code) + (r.title ? ' · ' + opEsc(r.title) : '') + '</h4><div class="op-kv">'
    + '<b>Состояние</b><span>' + opEsc(state) + '</span><b>Площадь</b><span>' + opArea(r.area_sqm) + '</span><b>Тип</b><span>' + opEsc(kind || '—') + '</span>'
    + (r.purpose ? '<b>Назначение</b><span>' + opEsc(r.purpose) + '</span>' : '') + (r.heating ? '<b>Отопление</b><span>' + opEsc(r.heating) + '</span>' : '')
    + ((r.old_codes || []).length ? '<b>Прежние ID</b><span>' + opEsc(r.old_codes.join(', ')) + '</span>' : '')
    + '</div>' + (r.note ? '<div class="op-hint" style="margin-top:10px;white-space:pre-wrap;">' + opEsc(r.note) + '</div>' : '');
}
