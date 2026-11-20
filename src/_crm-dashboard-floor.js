// Read-only floor viewer mounted by dashboards. The object editor owns the geometry.
function crmFloorEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
const opEsc = crmFloorEscape;
function opNum(v) { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(',', '.').replace(/\s/g, '')); return isNaN(n) ? null : n; }
function opArea(n) { return n === null || n === undefined ? '—' : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' м²'; }
function opDate(v) { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function crmFloorPoints(room) {
  if (Array.isArray(room.poly) && room.poly.length >= 3 &&
      room.poly.every(function(p) { return Array.isArray(p) && p.length === 2 && p.every(Number.isFinite); })) return room.poly;
  const x = Number(room.x) || 0, y = Number(room.y) || 0;
  const w = Math.max(0.1, Number(room.w) || 1), h = Math.max(0.1, Number(room.h) || 1);
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
function crmFloorRoomState(room, contracts) {
  if (room.kind === 'tech') return 'Техническое';
  if (room.kind === 'common') return 'Общее';
  if (!room.contract_id) return 'Свободно';
  return contracts.has(Number(room.contract_id)) ? 'Сдано' : 'Занятость не подтверждена';
}
function crmFloorMatch(request, rooms) {
  if (!request.contract_id) return [];
  return rooms.filter(function(r) { return Number(r.contract_id) === Number(request.contract_id); });
}
function crmMountFloor(mount) {
  if (!mount) return;
  const esc = crmFloorEscape;
  const requestStatus = cfg('requests.status'), urgency = cfg('requests.urgency');
  const contractCards = new Map();
  let showMoney = false;
  const open = ['new', 'in_work', 'waiting', 'dept', 'done'];
  const color = { 'Сдано': '#dde5f3', 'Свободно': '#e5f1ea', 'Техническое': '#e9edf5', 'Общее': '#f6eedb', 'Занятость не подтверждена': '#fff' };
  if (!document.getElementById('crm-dashboard-floor-style')) {
    const style = document.createElement('style');
    style.id = 'crm-dashboard-floor-style';
    style.textContent = [CRM_ROOM_CARD_CSS,CRM_REQUEST_ROW_CSS].flatMap(function(css) {
      return css.split('\n').filter(function(line) { return line.trim().startsWith('.'); }).map(function(line) {
        return line.replace(/^(\s*)/, '$1.crm-dfloor ').replace(/, (?=\.op-btn)/g, ', .crm-dfloor ');
      });
    }).join('\n') + `
      .crm-dfloor { color:#1f2433; font-variant-numeric:tabular-nums; }
      .crm-dfloor-title { font:650 20px/1.25 var(--kn-tilda,"Tilda Sans",system-ui,sans-serif); color:#1c2d58; margin:0 0 14px; }
      .crm-dfloor h3 { margin:0; font-size:15px; font-weight:650; }
      .crm-dfloor button,.crm-dfloor select { font:inherit; }
      .crm-dfloor button { cursor:pointer; }
      .crm-dfloor :is(button,select,summary,a):focus-visible { outline:2px solid #2f4a8a; outline-offset:2px; }
      .crm-dfloor-panel { background:#fff; border:1px solid #dfe3ec; border-radius:8px; min-width:0; }
      .crm-dfloor-topline { display:flex; flex-wrap:wrap; align-items:center; gap:7px 16px; margin-bottom:12px; color:#5b6478; font-size:13px; }
      .crm-dfloor-topline b { color:#1f2433; font-weight:650; }
      .crm-dfloor-topline button { padding:4px 9px; border:1px solid #c3cad8; border-radius:6px; background:#fff; color:#1c2d58; font-size:13px; }
      .crm-dfloor-topline button:hover { border-color:#2f4a8a; background:#eef2f9; }
      .crm-dfloor small { color:#5b6478; font-size:12px; }
      .crm-dfloor-panel { padding:12px 14px; }
      .crm-dfloor-main { display:grid; grid-template-columns:minmax(0,1fr) minmax(290px,350px); align-items:start; gap:12px; margin-bottom:12px; }
      .crm-dfloor-attention { scroll-margin-top:75px; }
      .crm-dfloor-attention > details { border-top:1px solid #e9edf5; padding-top:10px; margin-top:10px; }
      .crm-dfloor-legend { display:flex; flex-wrap:wrap; gap:6px 12px; margin:8px 0; }
      .crm-dfloor-legend span { display:inline-flex; align-items:center; gap:5px; }
      .crm-dfloor-legend i { width:11px; height:11px; border:1px solid #8a92a3; border-radius:3px; }
      .crm-dfloor-room-card { --ink:#1f2433; --muted:#5b6478; --brand:#1c2d58; --red:#c23b3b; margin-top:12px; padding:12px 14px; border:1px solid #dfe3ec; border-radius:8px; background:#f8f9fc; }
      .crm-dfloor-room-card h4 { margin:0 0 8px; font-size:15px; }
      .crm-dfloor-attention h3 { margin-bottom:6px; }
      .crm-dfloor-attention > ul { max-height:460px; overflow:auto; scrollbar-width:thin; }
      .crm-dfloor-attention ul,.crm-dfloor-side ul { list-style:none; margin:0; padding:0; }
      .crm-dfloor-attention li + li,.crm-dfloor-side li + li { border-top:1px solid #e9edf5; }
      .crm-dfloor .crm-dfloor-alert { width:100%; display:grid; grid-template-columns:8px minmax(0,1fr); gap:3px 8px; align-items:baseline;
        border:0; border-radius:5px; padding:9px 5px; background:transparent; text-align:left; color:inherit; }
      .crm-dfloor-attention li { padding:4px 0; }
      .crm-dfloor-attention .rq-row,.crm-dfloor-side .rq-row { grid-template-columns:1fr; gap:5px; padding:8px 10px; cursor:default; }
      .crm-dfloor-attention .rq-row-title,.crm-dfloor-attention .rq-row-sub,
      .crm-dfloor-side .rq-row-title,.crm-dfloor-side .rq-row-sub { white-space:normal; overflow-wrap:anywhere; }
      .crm-dfloor-attention .rq-row-side,.crm-dfloor-side .rq-row-side { text-align:left; white-space:normal; }
      .crm-dfloor .rq-row a { color:#1c2d58; }
      .crm-dfloor .crm-dfloor-show-request { border:0; background:none; color:#1c2d58; padding:2px 0; font-size:12px; text-align:left; }
      .crm-dfloor .crm-dfloor-show-request:hover { text-decoration:underline; }
      .crm-dfloor summary { color:#1c2d58; font-weight:650; cursor:pointer; }
      .crm-dfloor-work { scroll-margin-top:75px; }
      .crm-dfloor-bar { display:flex; flex-wrap:wrap; gap:8px 12px; align-items:flex-end; margin:12px 0 8px; }
      .crm-dfloor-bar label { display:grid; gap:3px; min-width:0; color:#5b6478; font-size:12px; }
      .crm-dfloor select { appearance:none; width:min(300px,75vw); max-width:100%; min-height:32px; padding:5px 30px 5px 9px;
        border:1px solid #c3cad8; border-radius:6px; color:#1f2433; background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%235b6478' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; font-size:13px; }
      .crm-dfloor select:hover { border-color:#2f4a8a; }
      .crm-dfloor-plan + .crm-dfloor-plan { margin-top:16px; }
      .crm-dfloor-plan-title { display:flex; align-items:baseline; gap:8px; margin:8px 0 5px; }
      .crm-dfloor svg { display:block; width:100%; height:clamp(300px,54vh,560px); background-color:#f8f9fc;
        background-image:radial-gradient(circle,#dce3ee 1px,transparent 1px); background-size:16px 16px; border:1px solid #dfe3ec; border-radius:6px; }
      .crm-dfloor svg [data-floor-room]:hover polygon { stroke:#2f4a8a; stroke-width:2; }
      .crm-dfloor-legend { padding-bottom:8px; border-bottom:1px solid #eef2f9; }
      .crm-dfloor-context { display:flex; align-items:end; justify-content:space-between; flex-wrap:wrap; gap:8px 14px; margin:10px 0; }
      .crm-dfloor-context .crm-dfloor-bar { margin:0; }
      .crm-dfloor-context p { margin:0; font-size:12px; color:#5b6478; }
      .crm-dfloor-plan-title strong { font-size:13px; }
      .crm-dfloor svg [role=button] { cursor:pointer; }
      .crm-dfloor svg [role=button]:focus polygon { stroke:#2f4a8a; stroke-width:3; }
      .crm-dfloor-side { min-width:0; overflow-wrap:anywhere; margin-top:8px; }
      .crm-dfloor-side li { padding:7px 0; }
      .crm-dfloor-side section { margin-top:12px; }
      .crm-dfloor-side button,.crm-dfloor-table button,.crm-dfloor-grid details button { padding:0; border:0; background:transparent; color:#1c2d58; text-align:left; font-weight:600; }
      .crm-dfloor-side button:hover,.crm-dfloor-table button:hover,.crm-dfloor-grid details button:hover { text-decoration:underline; }
      .crm-dfloor-side button[aria-pressed=true] { background:#eef2f9; }
      .crm-dfloor-table { overflow:auto; margin-top:10px; }
      .crm-dfloor table { width:100%; border-collapse:collapse; text-align:left; }
      .crm-dfloor th,.crm-dfloor td { padding:6px 9px; border-bottom:1px solid #e9edf5; }
      .crm-dfloor th { background:#eef2f9; color:#1c2d58; font-size:12px; white-space:nowrap; }
      .crm-dfloor tbody tr:hover { background:#f8f9fc; }
      @media(max-width:850px) { .crm-dfloor-main { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }
  mount.innerHTML = '<h2 class="crm-dfloor-title">Дашборд управляющих</h2><div class="crm-dfloor" data-floor-body></div>';
  const body = mount.querySelector('[data-floor-body]');
  let data, objectId, selected, requestId, lateOnly = false, showRequests = false, expanded = false;
  const list = async function(name, extra) {
    const response = await ctx.api.resource(name).list(Object.assign({ paginate:false }, extra));
    const rows = response && response.data && (response.data.data || response.data);
    return Array.isArray(rows) ? rows : [];
  };
  async function load() {
    const response = await ctx.api.request({ url:'auth:check' });
    const me = response && response.data && response.data.data;
    if (!me || !Number(me.id)) throw new Error('User unavailable');
    const roles = (me.roles || []).map(function(r) { return r.name; });
    const all = roles.some(function(role) { return ['admin','root','requests_control'].includes(role); });
    showMoney = roles.some(function(role) { return ['admin','root','crm_readonly','requests_control','rental_dept','legal_dept','accounting_dept'].includes(role); });
    const available = (await list('contract_objects', { sort:['name'], filter:all ? {} : { $or:[{ manager_user_id:Number(me.id) },{ senior_user_id:Number(me.id) }] } })).filter(function(o) {
      return all || Number(o.manager_user_id) === Number(me.id) || Number(o.senior_user_id) === Number(me.id);
    });
    const objects = available;
    if (!objects.length) { data = { objects:[] }; render(); return; }
    const ids = objects.map(function(o) { return o.id; }), names = objects.map(function(o) { return o.name; });
    const objectFilter = { object_id:{ $in:ids } }, nameFilter = { object_name:{ $in:names } };
    const results = await Promise.allSettled([
      list('crm_floor_plans',{ filter:objectFilter, sort:['object_id','sort','id'] }),
      list('crm_rooms',{ filter:objectFilter, sort:['code'] }),
      list('rental_contracts',{ filter:nameFilter, fields:['id','tenant_name','contract_number','end_date'] }),
      list('object_requests',{ filter:nameFilter, sort:['-id'], fields:['id','object_name','title','status','urgency','due_date','contract_id','tenant_label','source','responsible_id','demo','kind','wait_reason'] }),
      all ? list('users',{ fields:['id','nickname','username'] }) : Promise.resolve([]),
      list('crm_tasks',{ filter:nameFilter, sort:['-id'], fields:['id','object_name','title','status','due_date','executor_name'] })
    ]);
    const rows = results.map(function(r) { return r.status === 'fulfilled' ? r.value : []; });
    data = { objects, plans:rows[0], rooms:rows[1], contracts:new Map(rows[2].map(function(c) { return [Number(c.id),c]; })),
      requests:rows[3].filter(function(r) { return !r.demo && open.includes(r.status); }),
      users:new Map(rows[4].map(function(u) { return [Number(u.id), u.nickname || u.username]; })),
      tasks:rows[5], tasksAvailable:results[5].status === 'fulfilled',
      incomplete:results.some(function(r) { return r.status === 'rejected'; }), requestsAvailable:results[3].status === 'fulfilled', plansAvailable:results[0].status === 'fulfilled' };
    render();
  }
  function localToday() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(new Date());
    return ['year','month','day'].map(function(type) { return parts.find(function(p) { return p.type === type; }).value; }).join('-');
  }
  function requestRows(requests, allRooms, attention = false) {
    const today = localToday();
    const ui = {
      readOnly:true, rqEsc:esc, rqDate:opDate, rqToday:function() { return today; }, RQ_OPEN:open.filter(function(status) { return status !== 'done'; }),
      RQ_ST:requestStatus, RQ_URG:urgency,
      rqLate:function(r) { return r.status !== 'done' && r.due_date && String(r.due_date).slice(0,10) < today; },
      rqDays:function(a,b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); },
      rqUser:function(id) { return data.users.get(Number(id)) || (id ? '#' + id : '—'); },
      rqFromTag:function(r) { return ['portal','phone'].includes(r.source) ? '<span class="rq-from t">Арендатор</span>' : '<span class="rq-from c">Компания</span>'; },
      rqPill:function(status) {
        const value = requestStatus[status] || { l:status, c:'#5b6478' };
        return '<span class="rq-pill" style="color:' + esc(value.c) + ';border-color:' + esc(value.c) + '55;background:' + esc(value.c) + '10;">' + esc(value.l) + '</span>';
      }
    };
    return requests.length ? '<ul>' + requests.map(function(r) {
      const obj = data.objects.find(function(o) { return o.name === r.object_name; });
      const id = Number(r.id), match = crmFloorMatch(r,allRooms);
      return '<li>' + crmRequestRowHtml(r,ui) + (attention && obj ?
        '<button class="crm-dfloor-show-request" type="button" data-floor-object="' + Number(obj.id) + '" data-floor-highlight="' + id + '">Показать на плане →</button>' :
        match.length === 1 ? '<button class="crm-dfloor-show-request" type="button" data-floor-request="' + id + '"' + (requestId === id ? ' aria-pressed="true"' : '') +
          '>Помещение ' + esc(match[0].code) + ' →</button>' : match.length > 1 ? '<small>Помещение не уточнено</small>' : '') + '</li>';
    }).join('') + '</ul>' : '<p>Открытых заявок нет.</p>';
  }
  function loadContractCard(summary, requests) {
    const id = Number(summary.id);
    if (contractCards.has(id)) return;
    contractCards.set(id,{loading:true});
    Promise.allSettled([
      ctx.api.resource('rental_contracts').get({filterByTk:id}),
      showMoney ? list('contract_price_periods',{filter:{contract_type:'active',contract_ref_id:id},sort:['date_from']}) : [],
      list('contract_addendums',{filter:{contract_type:'active',contract_ref_id:id},fields:['id']})
    ]).then(function(results) {
      const response = results[0].value;
      const record = response && response.data && (response.data.data || response.data);
      contractCards.set(id,{c:record || summary,err:!record,prices:results[1].value || [],adds:(results[2].value || []).length,
        reqs:requests.filter(function(r) { return Number(r.contract_id) === id; })});
      if (mount.isConnected) render();
    });
  }
  function draw(plan, rooms, marks) {
    const w = Math.max(1, Number(plan.width_m) || 1), h = Math.max(1, Number(plan.height_m) || 1);
    const size = Math.max(w,h) / 33;
    const pad = Math.max(w,h) * .04;
    const bg = typeof plan.bg_url === 'string' && /^\/(?:storage\/uploads|files)\/[a-z0-9_./%-]+$/i.test(plan.bg_url) && !plan.bg_url.includes('..') ? plan.bg_url : '';
    const rect = plan.drawing?.bg;
    const b = rect && [rect.x,rect.y,rect.w,rect.h].every(Number.isFinite) && rect.w > 0 && rect.h > 0
      ? rect : {x:0,y:0,w,h};
    const walls = (plan.drawing && Array.isArray(plan.drawing.items) ? plan.drawing.items : []).filter(function(i) {
      return i && i.k === 'wall' && [i.x1,i.y1,i.x2,i.y2].every(Number.isFinite);
    });
    return '<svg viewBox="' + -pad + ' ' + -pad + ' ' + (w + 2 * pad) + ' ' + (h + 2 * pad) + '" aria-label="Поэтажный план">' +
      (bg ? '<image href="' + esc(bg) + '" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" preserveAspectRatio="none"/>' : '') +
      rooms.map(function(r) {
        const id = Number(r.id), pts = crmFloorPoints(r), state = crmFloorRoomState(r,data.contracts);
        const cx = pts.reduce(function(s,p) { return s + p[0]; },0) / pts.length, cy = pts.reduce(function(s,p) { return s + p[1]; },0) / pts.length;
        const count = marks.get(id) || 0;
        const tenant = data.contracts.get(Number(r.contract_id))?.tenant_name || '';
        const words = String(tenant).replace(/^(ООО|ИП|АО|ПАО)\s+/i,'').replace(/[«»"]/g,'').trim();
        const roomWidth = Math.max(...pts.map(function(p) { return p[0]; })) - Math.min(...pts.map(function(p) { return p[0]; }));
        const maxChars = Math.max(3,Math.floor(roomWidth / (size * .43)) - 1);
        const shortTenant = words.length > maxChars ? words.slice(0,maxChars - 1) + '…' : words;
        const label = esc([r.code || r.title || id,state,tenant,count ? 'Заявок: ' + count : ''].filter(Boolean).join(' · '));
        const caption = shortTenant ? '<tspan x="' + cx + '" dy="1.28em" font-size=".80em" font-weight="400">' + esc(shortTenant) + '</tspan>' : '';
        const clip = 'crm-dfloor-clip-' + id;
        return '<g role="button" tabindex="0" aria-label="' + label + '" aria-pressed="' + (selected === id) + '" data-floor-room="' + id + '"><title>' + label + '</title><polygon points="' +
          pts.map(function(p) { return p.join(','); }).join(' ') + '" fill="' + color[state] + '" fill-opacity="' + (bg ? '.72' : '1') +
          '" stroke="' + (selected === id ? '#2f4a8a' : '#8a92a3') + '" vector-effect="non-scaling-stroke" stroke-width="' + (selected === id ? 3 : 1) + '"/>' +
          '<clipPath id="' + clip + '"><polygon points="' + pts.map(function(p) { return p.join(','); }).join(' ') + '"/></clipPath>' +
          '<text clip-path="url(#' + clip + ')" x="' + cx + '" y="' + (caption ? cy - size * .48 : cy) + '" font-size="' + size + '" font-weight="600" text-anchor="middle" dominant-baseline="middle" pointer-events="none" fill="#1c2d58">' + esc(r.code || '') + caption + '</text>' +
          (count ? '<g pointer-events="none"><circle cx="' + (cx + Math.min(roomWidth * .34,size * 2.3)) + '" cy="' + (cy - size * 1.15) + '" r="' + (size * .58) + '" fill="#c23b3b"/>' +
            '<text x="' + (cx + Math.min(roomWidth * .34,size * 2.3)) + '" y="' + (cy - size * 1.15) + '" fill="#fff" font-size="' + (size * .67) + '" text-anchor="middle" dominant-baseline="middle">' + count + '</text></g>' : '') + '</g>';
      }).join('') +
      walls.map(function(i) { return '<line x1="' + i.x1 + '" y1="' + i.y1 + '" x2="' + i.x2 + '" y2="' + i.y2 + '" stroke="#1c2d58" vector-effect="non-scaling-stroke" pointer-events="none"/>'; }).join('') + '</svg>';
  }
  function render() {
    if (!data.objects.length) { body.textContent = 'Нет доступных назначенных объектов.'; return; }
    const object = data.objects.find(function(o) { return Number(o.id) === objectId; }) || data.objects[0];
    objectId = Number(object.id);
    const plans = data.plans.filter(function(p) { return Number(p.object_id) === objectId; });
    const allRooms = data.rooms.filter(function(r) { return Number(r.object_id) === objectId; });
    const room = allRooms.find(function(r) { return Number(r.id) === selected; });
    const roomPlan = room && plans.find(function(p) { return Number(p.id) === Number(room.plan_id); });
    const requests = data.requests.filter(function(r) { return r.object_name === object.name; });
    const today = localToday();
    const isLate = function(r) { return r.status !== 'done' && r.due_date && String(r.due_date).slice(0,10) < today; };
    const activeRequests = lateOnly ? requests.filter(isLate) : requests;
    const marks = new Map();
    requests.forEach(function(r) {
      const match = crmFloorMatch(r,allRooms);
      if (match.length === 1) marks.set(Number(match[0].id),(marks.get(Number(match[0].id)) || 0) + 1);
    });
    const area = allRooms.reduce(function(sum,r) { return sum + (crmFloorRoomState(r,data.contracts) === 'Свободно' ? Number(r.area_sqm) || 0 : 0); },0);
    const opts = function(items,current) { return items.map(function(x) { return '<option value="' + Number(x.id) + '"' + (Number(x.id) === current ? ' selected' : '') + '>' + esc(x.name || [x.building,x.title].filter(Boolean).join(' · ')) + '</option>'; }).join(''); };
    const contract = room && data.contracts.get(Number(room.contract_id));
    const areaText = new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(area);
    const overview = data.objects.length > 1 && data.requestsAvailable ? '<div class="crm-dfloor-table"><table><thead><tr><th>Объект</th><th>Управляющий</th><th>Открыто</th><th>Просрочено</th><th>Аварии</th></tr></thead><tbody>' +
      data.objects.map(function(o) {
        const own = data.requests.filter(function(r) { return r.object_name === o.name; });
        const late = own.filter(isLate).length;
        return { object:o, count:own.length, late, urgent:own.filter(function(r) { return r.urgency === 'emergency'; }).length };
      }).sort(function(a,b) { return b.urgent-a.urgent || b.late-a.late; }).map(function(x) {
        return '<tr><td><button type="button" data-floor-object="' + Number(x.object.id) + '">' + esc(x.object.name) + '</button></td><td>' + esc(data.users.get(Number(x.object.manager_user_id)) || x.object.manager_name || '—') + '</td><td>' + x.count +
          '</td><td><button type="button" data-floor-object="' + Number(x.object.id) + '" data-floor-late="1">' + x.late + '</button></td><td>' + x.urgent + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '';
    const tasks = data.tasks.filter(function(t) { return t.object_name === object.name; });
    const currentTasks = tasks.filter(function(t) { return ['new','in_work','waiting','done'].includes(t.status); });
    const taskPanel = data.tasksAvailable ? '<section><h3>Задачи объекта</h3><p>В работе и на приёмке: ' + currentTasks.length + '</p>' +
      (currentTasks.length ? '<ul>' + currentTasks.map(function(t) {
        return '<li><a href="/admin/tskpage01?open=task:' + Number(t.id) + '">' + esc(t.title || ('Задача №' + t.id)) + '</a> <small>' +
          esc([t.executor_name,t.due_date && ('до ' + String(t.due_date).slice(0,10))].filter(Boolean).join(' · ')) + '</small></li>';
      }).join('') + '</ul>' : '') + '</section>' : '<p>Задачи недоступны.</p>';
    const allLate = data.requests.filter(isLate).length;
    const urgent = data.requests.filter(function(r) { return r.urgency === 'emergency' && r.status !== 'done'; }).length;
    const attention = data.requests.filter(function(r) { return r.urgency === 'emergency' && r.status !== 'done' || isLate(r); })
      .sort(function(a,b) { return Number(b.urgency === 'emergency') - Number(a.urgency === 'emergency') || String(a.due_date || '~').localeCompare(String(b.due_date || '~')); });
    const topline = '<div class="crm-dfloor-topline"><span>Объекты <b>' + data.objects.length + '</b></span>' +
      (data.requestsAvailable ? '<span>Открыто <b>' + data.requests.length + '</b></span><span>Просрочено <b>' + allLate +
      '</b></span><span>Аварии <b>' + urgent + '</b></span>' : '') +
      (overview ? '<button type="button" data-floor-jump="objects">Сводка по объектам</button>' : '') + '</div>';
    const attentionPanel = '<section class="crm-dfloor-panel crm-dfloor-attention" data-floor-anchor="attention"><h3>Требует внимания</h3>' +
      (attention.length ? requestRows(attention,allRooms,true) : '<small>' + (data.requestsAvailable ? 'Аварий и просроченных заявок нет.' : 'Заявки недоступны с текущими правами.') + '</small>') +
      (data.requestsAvailable ? '<details' + (showRequests ? ' open' : '') + '><summary>' +
        (lateOnly ? 'Просроченные заявки объекта' : 'Заявки объекта') + ' · ' + activeRequests.length + '</summary><div class="crm-dfloor-side">' +
        requestRows(activeRequests,allRooms) + '</div></details>' : '') +
      '<details><summary>Задачи объекта' + (data.tasksAvailable ? ' · ' + currentTasks.length : '') + '</summary><div class="crm-dfloor-side">' + taskPanel + '</div></details></section>';
    if (contract) loadContractCard(contract,requests);
    const roomCard = room && contract ? '<section class="crm-dfloor-room-card">' +
      crmRentedRoomCard(room,contract,contractCards.get(Number(contract.id)),{
        showMoney:showMoney,rooms:allRooms.filter(function(r) { return Number(r.contract_id) === Number(contract.id); }).length > 1 ?
          'Помещения по договору: ' + allRooms.filter(function(r) { return Number(r.contract_id) === Number(contract.id); }).map(function(r) { return esc(r.code); }).join(', ') : ''
      }) + '</section>' : room ? '<section class="crm-dfloor-room-card">' +
      crmFreeRoomCard(room,crmFloorRoomState(room,data.contracts),{rent:'Под аренду',tech:'Техническое',common:'Общего пользования'}[room.kind]) +
      '</section>' : '';
    const legend = allRooms.length ? '<div class="crm-dfloor-legend" aria-label="Статусы помещений">' + Object.keys(color).map(function(state) {
      return '<span><i aria-hidden="true" style="background:' + color[state] + '"></i><small>' + state + '</small></span>';
    }).join('') + '<span><i aria-hidden="true" style="background:#c23b3b;border-color:#c23b3b;border-radius:50%"></i><small>Есть заявки</small></span></div>' : '';
    const floorViews = plans.map(function(plan) {
      const rooms = allRooms.filter(function(r) { return Number(r.plan_id) === Number(plan.id); });
      return '<section class="crm-dfloor-plan"><div class="crm-dfloor-plan-title"><strong>' + esc([plan.building,plan.title].filter(Boolean).join(' · ')) + '</strong>' +
        (plan.schematic ? '<small>Условная схема</small>' : '') + '</div>' + draw(plan,rooms,marks) + (roomPlan === plan ? roomCard : '') + '</section>';
    }).join('');
    body.innerHTML = topline + '<div class="crm-dfloor-main">' +
      '<section class="crm-dfloor-panel crm-dfloor-work" data-floor-anchor="work"><h3>План объекта</h3><div class="crm-dfloor-context"><div class="crm-dfloor-bar">' + (data.objects.length > 1 ? '<label>Объект <select data-floor-select="object">' +
      opts(data.objects,objectId) + '</select></label>' : '<strong>' + esc(object.name) + '</strong>') +
      '</div><p>' + (allRooms.length ? 'Свободно по нанесённым помещениям: <b>' + areaText + ' м²</b> · ' : '') +
      (data.requestsAvailable ? 'Открытых заявок: <b>' + requests.length + '</b>' : 'Заявки недоступны') + '</p></div>' +
      (data.incomplete ? '<p><small>Часть данных недоступна с текущими правами.</small></p>' : '') +
      legend + (floorViews || '<p>' + (data.plansAvailable ? 'Для объекта нет доступного плана.' : 'Планы недоступны.') + '</p>') +
      '</section>' + attentionPanel + '</div>' +
      (overview ? '<details class="crm-dfloor-panel" data-floor-overview' + (expanded ? ' open' : '') +
        '><summary>Сводка по объектам</summary>' + overview + '</details>' : '');

  }
  function chooseObject(id, late) {
    objectId = Number(id); selected = requestId = null;
    lateOnly = showRequests = late;
  }
  body.addEventListener('change',function(e) {
    if (e.target.getAttribute('data-floor-select') === 'object') { chooseObject(e.target.value,false); render(); body.querySelector('[data-floor-select="object"]').focus(); }

  });
  function activate(target) {
    expanded = body.querySelector('[data-floor-overview]')?.open || false;
    const room = target.getAttribute('data-floor-room'), request = target.getAttribute('data-floor-request');
    const object = target.getAttribute('data-floor-object');
    if (room) { selected = Number(room); requestId = null; }
    if (object) {
      chooseObject(object,target.hasAttribute('data-floor-late'));
    }
    const highlight = target.getAttribute('data-floor-highlight');
    if (request || highlight) {
      requestId = Number(request || highlight);
      if (highlight) showRequests = true;
      selected = null;
      const r = data.requests.find(function(x) { return Number(x.id) === requestId; });
      const matches = crmFloorMatch(r,data.rooms.filter(function(x) { return Number(x.object_id) === objectId; }));
      if (matches.length === 1) selected = Number(matches[0].id);
    }
    render();
    if (object) {
      (body.querySelector('.crm-dfloor-room-card') || body.querySelector('[data-floor-anchor="work"]')).scrollIntoView({block:'nearest'});
      body.querySelector(selected ? '[data-floor-room="' + selected + '"]' : '[data-floor-select="object"]')?.focus({preventScroll:true});
      return;
    }
    if (room) {
      body.querySelector('[data-floor-room="' + room + '"]')?.focus({preventScroll:true});
      body.querySelector('.crm-dfloor-room-card')?.scrollIntoView({block:'nearest'});
    } else if (request) {
      body.querySelector('[data-floor-request="' + request + '"]')?.focus({preventScroll:true});
      body.querySelector('.crm-dfloor-room-card')?.scrollIntoView({block:'nearest'});
    }
  }
  body.addEventListener('click',function(e) {
    const shortcut = e.target.closest('[data-floor-jump]');
    if (shortcut) {
      const kind = shortcut.getAttribute('data-floor-jump');
      if (kind === 'requests') { showRequests = true; lateOnly = false; render(); }
      const summary = body.querySelector('[data-floor-overview]');
      if (kind === 'objects' && summary) { summary.open = expanded = true; summary.scrollIntoView({block:'nearest'}); summary.querySelector('summary').focus(); return; }
      const dest = body.querySelector('[data-floor-anchor="' + (kind === 'attention' || kind === 'requests' ? 'attention' : 'work') + '"]');
      dest.scrollIntoView({block:'start'});
      dest.querySelector('button,select')?.focus();
      return;
    }
    const target = e.target.closest('[data-floor-room],[data-floor-object],[data-floor-request]');
    if (target) activate(target);
  });
  body.addEventListener('keydown',function(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g[data-floor-room]')) { e.preventDefault(); activate(e.target); }
  });
  body.textContent = 'Загрузка объектов, планов и заявок…';
  load().catch(function() { body.textContent = 'Не удалось загрузить дашборд. Обновите страницу.'; });
}
