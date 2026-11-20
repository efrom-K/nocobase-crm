const CRM_REQUEST_ROW_CSS = `
    .rq-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; border:1px solid #dfe3ec; border-left:4px solid var(--c); border-radius:8px; padding:10px 14px; background:#fff; cursor:pointer; }
    .rq-row:hover { border-color:#dde5f3; border-left-color:var(--c); }
    .rq-row-title { font-weight:600; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .rq-row-sub { font-size:12.5px; color:#5b6478; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .rq-row-side { text-align:right; font-size:12.5px; white-space:nowrap; }
    .rq-from { display:inline-block; padding:1px 7px; border-radius:4px; font-size:12px; font-weight:600; margin-right:6px; white-space:nowrap; }
    .rq-from.t { color:#2f4a8a; background:#eef2f9; border:1px solid #9cc7f0; }
    .rq-from.c { color:#8a5a00; background:#f6eedb; border:1px solid #e8d3a6; }
    .rq-pill { display:inline-block; padding:1px 8px; border-radius:10px; font-size:12px; font-weight:600; border:1px solid; white-space:nowrap; }
    .rq-late { color:#c23b3b; font-weight:600; }
`;
function crmRequestRowHtml(r, ui) {
  const { rqLate, RQ_OPEN, RQ_URG, rqDays, rqToday, rqDate, RQ_ST, rqEsc, rqFromTag, rqPill, rqUser } = ui;
  const late = rqLate(r), open = RQ_OPEN.indexOf(r.status) !== -1, u = RQ_URG[r.urgency] || RQ_URG.normal;
  const due = r.due_date ? (late ? '<span class="rq-late">просрочено на ' + rqDays(String(r.due_date).slice(0, 10), rqToday()) + ' дн. (срок ' + rqDate(r.due_date) + ')</span>' : 'срок ' + rqDate(r.due_date)) : '';
  return '<div class="rq-row"' + (ui.readOnly ? '' : ' data-open="' + r.id + '"') + ' style="--c:' + (r.urgency === 'emergency' && open ? '#c23b3b' : (RQ_ST[r.status] || {}).c || '#c3cad8') + ';">'
    + '<div style="min-width:0;"><div class="rq-row-title">' + ((r.urgency === 'urgent' || r.urgency === 'emergency') && open ? '<span style="color:' + u.c + ';">' + (r.urgency === 'emergency' ? '⚠ ' : '') + rqEsc(u.l) + ' · </span>' : '') + (ui.readOnly ? '<a href="/admin/j3a32zo1jzo?open=req:' + Number(r.id) + '">' + rqEsc(r.title || 'Без названия') + '</a>' : rqEsc(r.title || 'Без названия')) + '</div>'
    + '<div class="rq-row-sub">' + rqFromTag(r) + (r.demo ? '<span class="rq-pill" style="color:#5b6478;border-color:#c3cad8;margin-right:6px;">демо</span>' : '') + '№' + r.id + ' · ' + rqEsc([r.object_name, r.tenant_label, r.kind].filter(Boolean).join(' · ')) + '</div></div>'
    + '<div class="rq-row-side">' + rqPill(r.status) + (r.status === 'waiting' && r.wait_reason ? ' <span style="color:#5b6478;">ждём ' + rqEsc(r.wait_reason) + '</span>' : '')
    + '<div style="margin-top:3px;color:#3a4256;">' + rqEsc(rqUser(r.responsible_id)) + (open && due ? ' · ' + due : '') + '</div></div></div>';
}
