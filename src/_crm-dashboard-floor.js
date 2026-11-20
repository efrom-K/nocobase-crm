// Read-only floor viewer mounted by dashboards. The object editor owns the geometry.
function crmFloorEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
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
function crmMountFloor(mount, options) {
  if (!mount) return;
  const esc = crmFloorEscape;
  const open = ['new', 'in_work', 'waiting', 'dept', 'done'];
  const color = { 'Сдано': '#dde5f3', 'Свободно': '#e5f1ea', 'Техническое': '#e9edf5', 'Общее': '#f6eedb', 'Занятость не подтверждена': '#fff' };
  if (!document.getElementById('crm-dashboard-floor-style')) {
    const style = document.createElement('style');
    style.id = 'crm-dashboard-floor-style';
    style.textContent = `
      .crm-dfloor { margin:12px 0; padding:12px 14px; border:1px solid #dfe3ec; border-radius:8px; background:#fff; }
      .crm-dfloor summary { color:#1c2d58; font-weight:650; cursor:pointer; }
      .crm-dfloor-bar { display:flex; flex-wrap:wrap; gap:8px 12px; align-items:center; margin:12px 0; }
      .crm-dfloor select,.crm-dfloor button { font:inherit; border:1px solid #c3cad8; border-radius:6px; padding:4px 8px; background:#fff; color:#1c2d58; }
      .crm-dfloor button { cursor:pointer; } .crm-dfloor button[aria-pressed=true] { background:#dde5f3; }
      .crm-dfloor-grid { display:grid; grid-template-columns:minmax(0,2fr) minmax(230px,1fr); gap:12px; }
      .crm-dfloor svg { width:100%; max-height:540px; background:#f8f9fc; border:1px solid #dfe3ec; border-radius:6px; }
      .crm-dfloor svg [role=button] { cursor:pointer; } .crm-dfloor svg [role=button]:focus polygon { stroke:#2f4a8a; stroke-width:3; }
      .crm-dfloor-side { min-width:0; overflow-wrap:anywhere; } .crm-dfloor-side ul { padding-left:20px; }
      .crm-dfloor-side li { margin:6px 0; } .crm-dfloor small { color:#5b6478; }
      .crm-dfloor-table { overflow:auto; } .crm-dfloor table { width:100%; border-collapse:collapse; text-align:left; }
      .crm-dfloor th,.crm-dfloor td { padding:5px 8px; border-bottom:1px solid #dfe3ec; }
      @media(max-width:750px) { .crm-dfloor-grid { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }
  mount.innerHTML = '<details class="crm-dfloor"><summary>Планы, помещения и заявки</summary><div data-floor-body></div></details>';
  const details = mount.querySelector('details'), body = mount.querySelector('[data-floor-body]');
  let data, pending, objectId, planId, selected, requestId, mode = 'rent';
  const list = async function(name, extra) {
    const response = await ctx.api.resource(name).list(Object.assign({ paginate:false }, extra));
    const rows = response && response.data && (response.data.data || response.data);
    return Array.isArray(rows) ? rows : [];
  };
  async function load() {
    const response = await ctx.api.request({ url:'auth:check' });
    const me = response && response.data && response.data.data;
    if (!me || !Number(me.id)) throw new Error('User unavailable');
    const all = (me.roles || []).some(function(r) { return ['admin','root','requests_control'].includes(r.name); });
    const available = (options.objects || await list('contract_objects', { sort:['name'] })).filter(function(o) {
      return all || Number(o.manager_user_id) === Number(me.id) || Number(o.senior_user_id) === Number(me.id);
    });
    const objects = available.filter(function(o) { return !options.name || o.name === options.name; });
    if (!objects.length) { data = { objects:[] }; render(); return; }
    const ids = objects.map(function(o) { return o.id; }), names = objects.map(function(o) { return o.name; });
    const objectFilter = { object_id:{ $in:ids } }, nameFilter = { object_name:{ $in:names } };
    const results = await Promise.allSettled([
      list('crm_floor_plans',{ filter:objectFilter, sort:['object_id','sort','id'] }),
      list('crm_rooms',{ filter:objectFilter, sort:['code'] }),
      list('rental_contracts',{ filter:nameFilter, fields:['id','tenant_name','contract_number','end_date'] }),
      list('object_requests',{ filter:nameFilter, sort:['-id'], fields:['id','object_name','title','status','urgency','due_date','contract_id','tenant_label','source','responsible_id','demo'] }),
      all ? list('users',{ fields:['id','nickname','username'] }) : Promise.resolve([])
    ]);
    const rows = results.map(function(r) { return r.status === 'fulfilled' ? r.value : []; });
    data = { objects, plans:rows[0], rooms:rows[1], contracts:new Map(rows[2].map(function(c) { return [Number(c.id),c]; })),
      requests:rows[3].filter(function(r) { return !r.demo && open.includes(r.status); }),
      users:new Map(rows[4].map(function(u) { return [Number(u.id), u.nickname || u.username]; })),
      incomplete:results.slice(0,4).some(function(r) { return r.status === 'rejected'; }), requestsAvailable:results[3].status === 'fulfilled', plansAvailable:results[0].status === 'fulfilled' };
    render();
  }
  function localToday() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(new Date());
    return ['year','month','day'].map(function(type) { return parts.find(function(p) { return p.type === type; }).value; }).join('-');
  }
  function requestRows(requests, allRooms) {
    return requests.length ? '<ul>' + requests.map(function(r) {
      const matches = crmFloorMatch(r,allRooms);
      const where = matches.length === 1 ? 'По договору: ' + matches[0].code : matches.length ? 'Помещение не уточнено' : 'Без привязки к помещению';
      return '<li><button type="button" data-floor-request="' + Number(r.id) + '"' + (Number(r.id) === requestId ? ' aria-pressed="true"' : '') + '>' + esc(r.title || ('Заявка №' + r.id)) + '</button><br><small>' +
        esc([r.tenant_label || (r.source === 'portal' ? 'Портал арендатора' : ''), where, data.users.get(Number(r.responsible_id)), r.due_date && ('до ' + String(r.due_date).slice(0,10))].filter(Boolean).join(' · ')) +
        '</small> · <a href="/admin/j3a32zo1jzo?open=req:' + Number(r.id) + '">Открыть заявку</a></li>';
    }).join('') + '</ul>' : '<p>Открытых заявок нет.</p>';
  }
  function draw(plan, rooms, marks) {
    const w = Math.max(1, Number(plan.width_m) || 1), h = Math.max(1, Number(plan.height_m) || 1);
    const size = Math.max(w,h) / 42;
    const bg = typeof plan.bg_url === 'string' && /^\/(?:storage\/uploads|files)\/[a-z0-9_./%-]+$/i.test(plan.bg_url) && !plan.bg_url.includes('..') ? plan.bg_url : '';
    const walls = (plan.drawing && Array.isArray(plan.drawing.items) ? plan.drawing.items : []).filter(function(i) {
      return i && i.k === 'wall' && [i.x1,i.y1,i.x2,i.y2].every(Number.isFinite);
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" aria-label="Поэтажный план">' +
      (mode === 'bti' && bg ? '<image href="' + esc(bg) + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none"/>' : '') +
      rooms.map(function(r) {
        const id = Number(r.id), pts = crmFloorPoints(r), state = crmFloorRoomState(r,data.contracts);
        const cx = pts.reduce(function(s,p) { return s + p[0]; },0) / pts.length, cy = pts.reduce(function(s,p) { return s + p[1]; },0) / pts.length;
        const count = marks.get(id) || 0;
        const label = esc((r.code || r.title || id) + ' · ' + state);
        return '<g role="button" tabindex="0" aria-label="' + label + '" aria-pressed="' + (selected === id) + '" data-floor-room="' + id + '"><title>' + label + '</title><polygon points="' +
          pts.map(function(p) { return p.join(','); }).join(' ') + '" fill="' + (mode === 'bti' ? '#fff' : color[state]) + '" fill-opacity="' + (mode === 'bti' ? '.35' : '1') +
          '" stroke="' + (selected === id ? '#2f4a8a' : '#8a92a3') + '" vector-effect="non-scaling-stroke" stroke-width="' + (selected === id ? 3 : 1) + '"/>' +
          '<text x="' + cx + '" y="' + cy + '" font-size="' + size + '" text-anchor="middle" dominant-baseline="middle" pointer-events="none" fill="' + ((mode === 'requests' || mode === 'late') && count ? '#a02729' : '#1c2d58') + '">' + esc(r.code || '') + ((mode === 'requests' || mode === 'late') && count ? ' · ' + count : '') + '</text></g>';
      }).join('') +
      walls.map(function(i) { return '<line x1="' + i.x1 + '" y1="' + i.y1 + '" x2="' + i.x2 + '" y2="' + i.y2 + '" stroke="#1c2d58" vector-effect="non-scaling-stroke" pointer-events="none"/>'; }).join('') + '</svg>';
  }
  function render() {
    if (!data.objects.length) { body.textContent = 'Нет доступных назначенных объектов.'; return; }
    const object = data.objects.find(function(o) { return Number(o.id) === objectId; }) || data.objects[0];
    objectId = Number(object.id);
    const plans = data.plans.filter(function(p) { return Number(p.object_id) === objectId; });
    const plan = plans.find(function(p) { return Number(p.id) === planId; }) || plans[0];
    planId = plan ? Number(plan.id) : null;
    const allRooms = data.rooms.filter(function(r) { return Number(r.object_id) === objectId; });
    const rooms = allRooms.filter(function(r) { return Number(r.plan_id) === planId; });
    const room = rooms.find(function(r) { return Number(r.id) === selected; });
    const requests = data.requests.filter(function(r) { return r.object_name === object.name; });
    const today = localToday();
    const isLate = function(r) { return r.status !== 'done' && r.due_date && String(r.due_date).slice(0,10) < today; };
    const activeRequests = mode === 'late' ? requests.filter(isLate) : requests;
    const marks = new Map();
    activeRequests.forEach(function(r) {
      const match = crmFloorMatch(r,allRooms);
      if (match.length === 1) marks.set(Number(match[0].id),(marks.get(Number(match[0].id)) || 0) + 1);
    });
    const area = allRooms.reduce(function(sum,r) { return sum + (crmFloorRoomState(r,data.contracts) === 'Свободно' ? Number(r.area_sqm) || 0 : 0); },0);
    const opts = function(items,current) { return items.map(function(x) { return '<option value="' + Number(x.id) + '"' + (Number(x.id) === current ? ' selected' : '') + '>' + esc(x.name || [x.building,x.title].filter(Boolean).join(' · ')) + '</option>'; }).join(''); };
    const contract = room && data.contracts.get(Number(room.contract_id));
    const related = room ? requests.filter(function(r) { return crmFloorMatch(r,allRooms).includes(room); }) : [];
    const areaText = new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(area);
    const free = rooms.filter(function(r) { return crmFloorRoomState(r,data.contracts) === 'Свободно'; });
    const pickRooms = mode === 'rent' && free.length ? '<details><summary>Свободные помещения на плане (' + free.length + ')</summary><ul>' + free.map(function(r) {
      return '<li><button type="button" data-floor-room="' + Number(r.id) + '">' + esc([r.code,r.title,r.area_sqm != null ? r.area_sqm + ' м²' : ''].filter(Boolean).join(' · ')) + '</button></li>';
    }).join('') + '</ul></details>' : '';
    const overview = options.overview && data.objects.length > 1 && data.requestsAvailable ? '<div class="crm-dfloor-table"><table><thead><tr><th>Объект</th><th>Управляющий</th><th>Открыто</th><th>Просрочено</th><th>Аварии</th></tr></thead><tbody>' +
      data.objects.map(function(o) {
        const own = data.requests.filter(function(r) { return r.object_name === o.name; });
        const late = own.filter(isLate).length;
        return { object:o, count:own.length, late, urgent:own.filter(function(r) { return r.urgency === 'emergency'; }).length };
      }).sort(function(a,b) { return b.urgent-a.urgent || b.late-a.late; }).map(function(x) {
        return '<tr><td><button type="button" data-floor-object="' + Number(x.object.id) + '">' + esc(x.object.name) + '</button></td><td>' + esc(data.users.get(Number(x.object.manager_user_id)) || x.object.manager_name || '—') + '</td><td>' + x.count +
          '</td><td><button type="button" data-floor-object="' + Number(x.object.id) + '" data-floor-late="1">' + x.late + '</button></td><td>' + x.urgent + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '';
    const roomOptions = allRooms.filter(function(r) { return plans.some(function(p) { return Number(p.id) === Number(r.plan_id); }); }).map(function(r) {
      const tenant = data.contracts.get(Number(r.contract_id));
      const floor = plans.find(function(p) { return Number(p.id) === Number(r.plan_id); });
      return { id:r.id, name:[r.code || r.title, floor.title, tenant && tenant.tenant_name].filter(Boolean).join(' · ') };
    });
    body.innerHTML = overview + '<div class="crm-dfloor-bar"><label>Объект <select data-floor-select="object">' + opts(data.objects,objectId) + '</select></label>' +
      (plan ? '<label>План <select data-floor-select="plan">' + opts(plans,planId) + '</select></label>' : '') +
      (roomOptions.length ? '<label>Помещение / арендатор <select data-floor-select="room"><option value="">Выбрать</option>' + opts(roomOptions,selected) + '</select></label>' : '') +
      [['rent','Аренда'],['requests','Заявки'],['bti','БТИ']].map(function(m) { return '<button type="button" data-floor-mode="' + m[0] + '" aria-pressed="' + (mode === m[0] || mode === 'late' && m[0] === 'requests') + '">' + m[1] + '</button>'; }).join('') +
      '</div><p>' + (allRooms.length ? 'Свободно по нанесённым помещениям: <b>' + areaText + ' м²</b> · ' : '') +
      (data.requestsAvailable ? 'Открытых заявок: <b>' + requests.length + '</b>' : 'Заявки недоступны') + '</p>' +
      (data.incomplete ? '<p><small>Часть данных недоступна с текущими правами.</small></p>' : '') +
      '<div class="crm-dfloor-grid"><div>' + (plan ? (plan.schematic ? '<small>Условная схема</small>' : '') + draw(plan,rooms,marks) + pickRooms : '<p>' + (data.plansAvailable ? 'Для объекта нет доступного плана.' : 'Планы недоступны.') + '</p>') +
      '</div><div class="crm-dfloor-side">' + (room ? '<strong>' + esc(room.code || room.title) + '</strong><p>' +
         esc([crmFloorRoomState(room,data.contracts),room.area_sqm != null ? room.area_sqm + ' м²' : '',contract && contract.tenant_name,contract && contract.contract_number,contract && contract.end_date && ('до ' + contract.end_date)].filter(Boolean).join(' · ')) +
         '</p>' + (data.requestsAvailable ? '<strong>Заявки по договору</strong>' + requestRows(related,allRooms) : '') : '') +
      (data.requestsAvailable ? '<strong>' + (mode === 'late' ? 'Просроченные заявки объекта' : 'Заявки объекта') + '</strong>' + requestRows(activeRequests,allRooms) : '') +
      '</div></div>';
  }
  function chooseObject(id, late) {
    objectId = Number(id); planId = selected = requestId = null;
    mode = late ? 'late' : 'rent';
  }
  body.addEventListener('change',function(e) {
    if (e.target.getAttribute('data-floor-select') === 'object') { chooseObject(e.target.value,false); render(); body.querySelector('[data-floor-select="object"]').focus(); }
    if (e.target.getAttribute('data-floor-select') === 'room') {
      selected = Number(e.target.value) || null; requestId = null;
      const room = data.rooms.find(function(r) { return Number(r.id) === selected && Number(r.object_id) === objectId; });
      if (room) planId = Number(room.plan_id);
      render(); body.querySelector('[data-floor-select="room"]')?.focus();
    }
    if (e.target.getAttribute('data-floor-select') === 'plan') { planId = Number(e.target.value); selected = requestId = null; render(); body.querySelector('[data-floor-select="plan"]').focus(); }
  });
  function activate(target) {
    const room = target.getAttribute('data-floor-room'), request = target.getAttribute('data-floor-request');
    const object = target.getAttribute('data-floor-object'), layer = target.getAttribute('data-floor-mode');
    if (room) { selected = Number(room); requestId = null; }
    if (layer) mode = layer;
    if (object) chooseObject(object,target.hasAttribute('data-floor-late'));
    if (request) {
      requestId = Number(request); selected = null;
      const r = data.requests.find(function(x) { return Number(x.id) === requestId; });
      const matches = crmFloorMatch(r,data.rooms.filter(function(x) { return Number(x.object_id) === objectId; }));
      if (matches.length === 1) { planId = Number(matches[0].plan_id); selected = Number(matches[0].id); }
    }
    render();
    const attr = room ? 'room' : request ? 'request' : object ? 'object' : 'mode';
    const value = room || request || object || layer;
    body.querySelector('[data-floor-' + attr + '="' + value + '"]')?.focus();
  }
  body.addEventListener('click',function(e) {
    const target = e.target.closest('[data-floor-room],[data-floor-mode],[data-floor-object],[data-floor-request]');
    if (target) activate(target);
  });
  body.addEventListener('keydown',function(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g[data-floor-room]')) { e.preventDefault(); activate(e.target); }
  });
  details.addEventListener('toggle',function() {
    if (!details.open || data || pending) return;
    body.textContent = 'Загрузка планов и заявок…';
    pending = load().catch(function() { body.textContent = 'Не удалось загрузить планы. Закройте и откройте блок, чтобы повторить.'; }).finally(function() { pending = null; });
  });
}
