// The frame only receives map labels and coordinates; it cannot access CRM cookies or tokens.
function opLocation(o) {
  const p = o && o.map_location;
  return p && typeof p === 'object' ? p : {};
}
function opLocated(o) {
  const p = opLocation(o);
  return typeof p.lat === 'number' && typeof p.lon === 'number' && Number.isFinite(p.lat) && Number.isFinite(p.lon)
    && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
}
function opMapObjects() {
  const q = (op.q || '').trim().toLowerCase();
  return op.objs.filter(function(o) { return !q || (o.name + ' ' + (opLocation(o).address || '')).toLowerCase().indexOf(q) !== -1; });
}
function opSelectObject(id) {
  if (!op.objs.some(function(o) { return o.id === id; })) return;
  op.objId = id;
  try { localStorage.setItem('crm-objplan-obj', id); } catch (e) { /* no storage */ }
  op.sel = null; op.panel = 'room'; op.undo = []; opPickPlan();
  if (op.screen === 'map') { opMapCard(); opMapSync(); } else opRender();
}
function opRoutePanel() {
  const box = opRoot() && opRoot().querySelector('.op-route'); if (!box) return;
  const options = function(id) { return '<option value="">Выберите объект</option>' + op.objs.filter(opLocated).map(function(o) {
    return '<option value="' + o.id + '"' + (o.id === id ? ' selected' : '') + '>' + opEsc(o.name) + '</option>';
  }).join(''); };
  const disabled = op.routeBusy ? ' disabled' : '', r = op.routeResult;
  let summary = op.routeBusy ? 'Рассчитываю маршрут…' : op.routeError || '';
  if (r) {
    const minutes = Math.max(1, Math.ceil(r.duration / 60)), hours = Math.floor(minutes / 60);
    summary = opM(r.distance / 1000) + ' км · около ' + (hours ? hours + ' ч' + (minutes % 60 ? ' ' + minutes % 60 + ' мин' : '') : minutes + ' мин');
  }
  const approximate = r && op.objs.some(function(o) { return (o.id === r.from || o.id === r.to) && opLocation(o).approximate; });
  box.innerHTML = '<div class="op-cap">Маршрут на автомобиле</div><div class="op-route-fields">'
    + '<label>Откуда<select data-route="from"' + disabled + '>' + options(op.routeFrom) + '</select></label>'
    + '<button class="op-btn" data-act="route-swap" aria-label="Поменять начало и конец маршрута" title="Поменять местами"' + disabled + '>⇄</button>'
    + '<label>Куда<select data-route="to"' + disabled + '>' + options(op.routeTo) + '</select></label></div>'
    + '<div class="op-route-actions"><button class="op-btn primary" data-act="route-build"' + disabled + '>' + (op.routeBusy ? 'Расчёт…' : 'Построить') + '</button>'
    + '<button class="op-btn" data-act="route-clear">Убрать маршрут</button><span class="op-route-result" role="status" aria-live="polite">' + opEsc(summary) + '</span></div>'
    + (r ? '<p class="op-map-note">Без учёта текущих пробок. Пунктир — участок от дороги до точки объекта.' + (approximate ? ' <b>Маршрут до примерной точки: уточните въезд.</b>' : '') + '</p>' : '')
    + '<div class="op-route-credit">Расчёт: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener noreferrer">OSRM / FOSSGIS</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">Исправить карту</a></div>';
}
function opRouteDraw(fit) {
  if (op.screen !== 'map' || !op.mapFrame) return;
  op.mapFrame.contentWindow.postMessage({type:'crm-object-map-route', channel:op.mapChannel, route:op.routeResult || null, fit:!!fit}, '*');
}
function opRouteReset() {
  op.routeVersion = (op.routeVersion || 0) + 1;
  op.routeBusy = false; op.routeResult = null; op.routeError = '';
  opRoutePanel(); opRouteDraw(false);
}
function opRouteField(el) {
  const key = el.getAttribute('data-route');
  if (key !== 'from' && key !== 'to') return false;
  op[key === 'from' ? 'routeFrom' : 'routeTo'] = Number(el.value) || null;
  opRouteReset(); return true;
}
function opRouteHere() {
  op.routeTo = op.objId;
  if (op.routeFrom === op.routeTo) op.routeFrom = null;
  opRouteReset();
  const el = opRoot().querySelector(op.routeFrom ? '[data-act="route-build"]' : '[data-route="from"]');
  if (el) el.focus();
}
async function opRouteBuild() {
  if (op.routeBusy) return;
  opRouteReset();
  const from = op.routeFrom, to = op.routeTo;
  if (!from || !to || from === to) { op.routeError = 'Выберите два разных объекта'; opRoutePanel(); return; }
  op.routeBusy = true; opRoutePanel();
  const version = op.routeVersion;
  try {
    const base = location.port ? location.protocol + '//' + location.hostname + ':8097' : '/rqsvc';
    let token = ''; try { token = localStorage.getItem('NOCOBASE_TOKEN') || ''; } catch (e) { /* no storage */ }
    const res = await fetch(base + '/object-route', {method:'POST', headers:{Authorization:'Bearer ' + token, 'Content-Type':'application/json'}, body:JSON.stringify({from:from,to:to})});
    const result = await res.json().catch(function() { return null; });
    if (!res.ok) throw new Error(result && result.error || 'Сервис маршрутов недоступен');
    if (!result || !Number.isFinite(result.distance) || !Number.isFinite(result.duration) || !result.geometry) throw new Error('Не удалось получить маршрут');
    if (version !== op.routeVersion) return;
    op.routeResult = Object.assign({from:from,to:to}, result);
    opRouteDraw(true);
  } catch (e) { if (version === op.routeVersion) op.routeError = e.message || 'Не удалось рассчитать маршрут'; }
  finally { if (version === op.routeVersion) { op.routeBusy = false; opRoutePanel(); } }
}
function opMapFrame(data, channel) {
  const status = document.getElementById('status');
  if (!window.L) { status.textContent = 'Карта недоступна. Выберите объект в списке слева.'; return; }
  const map = L.map('map', { scrollWheelZoom: false }).setView([55.9, 37.7], 9);
  let loaded = false;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).on('tileload', function() { loaded = true; status.hidden = true; })
    .on('tileerror', function() { if (!loaded) { status.hidden = false; status.textContent = 'Подложка карты недоступна. Метки и список объектов работают.'; } }).addTo(map);
  const markers = {};
  data.forEach(function(o) {
    const marker = L.marker([o.lat, o.lon], { title: o.name, keyboard: true, icon: L.divIcon({
      className: '', html: '<span class="pin"></span>', iconSize: [34, 38], iconAnchor: [17, 38]
    }) }).addTo(map);
    const label = document.createElement('span'); label.textContent = o.name;
    marker.bindTooltip(label, { direction: 'top', offset: [0, -30] });
    marker.on('click', function() { parent.postMessage({ type: 'crm-object-map-select', channel: channel, id: o.id }, '*'); });
    markers[o.id] = marker;
  });
  function update(message) {
    const bounds = [];
    data.forEach(function(o) {
      const m = markers[o.id], visible = message.ids.indexOf(o.id) !== -1;
      if (visible) { if (!map.hasLayer(m)) m.addTo(map); bounds.push([o.lat, o.lon]); } else map.removeLayer(m);
      const el = m.getElement(); if (el) el.classList.toggle('selected', o.id === message.id);
      m.setZIndexOffset(o.id === message.id ? 1000 : 0);
    });
    if (message.fit && bounds.length) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 12 });
    else if (message.focus && markers[message.id] && message.ids.indexOf(message.id) !== -1) {
      map.setView(markers[message.id].getLatLng(), Math.max(map.getZoom(), 13));
      markers[message.id].openTooltip();
    }
  }
  let routeLayer = null;
  function drawRoute(message) {
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = null;
    const r = message.route; if (!r) return;
    routeLayer = L.featureGroup().addTo(map);
    L.geoJSON(r.geometry, {style:{color:'#fff',weight:9,opacity:0.95}}).addTo(routeLayer);
    L.geoJSON(r.geometry, {style:{color:'#2f4a8a',weight:5,opacity:1}}).addTo(routeLayer);
    [r.from,r.to].forEach(function(id,i) {
      const o = data.find(function(x) { return x.id === id; }); if (!o) return;
      const coords = r.geometry.coordinates, point = coords[i ? coords.length - 1 : 0], road = L.latLng(point[1],point[0]);
      if (road.distanceTo([o.lat,o.lon]) > 20) L.polyline([[o.lat,o.lon],road], {color:'#2f4a8a',weight:3,dashArray:'5 7'}).addTo(routeLayer);
      const label = document.createElement('span'); label.textContent = (i ? 'Б · ' : 'А · ') + o.name;
      L.marker([o.lat,o.lon], {title:label.textContent,zIndexOffset:2000,icon:L.divIcon({className:'route-end',html:i ? 'Б' : 'А',iconSize:[28,28],iconAnchor:[14,14]})})
        .bindTooltip(label).addTo(routeLayer);
    });
    if (message.fit) map.fitBounds(routeLayer.getBounds(), {padding:[45,45],maxZoom:15});
  }
  window.addEventListener('message', function(e) {
    if (e.source !== parent || !e.data || e.data.channel !== channel) return;
    if (e.data.type === 'crm-object-map-state') update(e.data);
    if (e.data.type === 'crm-object-map-route') drawRoute(e.data);
  });
  map.on('click focus', function() { map.scrollWheelZoom.enable(); });
  parent.postMessage({ type: 'crm-object-map-ready', channel: channel }, '*');
}
function opMapDoc(data, channel) {
  const json = function(v) { return JSON.stringify(v).replace(/</g, '\\u003c'); };
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer">'
    + '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">'
    + '<style>html,body,#map{height:100%;margin:0}body{font:14px Arial;color:#1f2433;background:#e9edf5}.leaflet-container{font:13px Arial}.pin{display:block;width:26px;height:26px;background:#1c2d58;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px #1c2d5855}.pin:after{content:"";display:block;width:8px;height:8px;background:#fff;border-radius:50%;margin:9px}.selected .pin{background:#2f4a8a;outline:5px solid #a6c2e8}.leaflet-marker-icon:focus{outline:3px solid #2f4a8a}#status{position:absolute;z-index:1000;bottom:28px;left:12px;right:12px;padding:10px;background:#fff;border-radius:6px;box-shadow:0 2px 8px #0002}button{font:inherit}</style>'
    + '</head><body><div id="map" aria-label="Карта объектов"></div><div id="status" role="status">Загрузка карты…</div>'
    + '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>'
    + '<style>.route-end{background:#1c2d58;color:#fff;border:3px solid white;border-radius:50%;font:bold 14px/28px Arial;text-align:center;box-shadow:0 2px 8px #0004}</style>'
    + '<script>(' + opMapFrame.toString() + ')(' + json(data) + ',' + json(channel) + ');</script></body></html>';
}
function opMapSync(fit) {
  if (!op.mapFrame) return;
  const ids = opMapObjects().filter(opLocated).map(function(o) { return o.id; });
  op.mapFrame.contentWindow.postMessage({ type: 'crm-object-map-state', channel: op.mapChannel, ids: ids, id: op.objId, fit: !!fit, focus: !fit }, '*');
}
function opMapCard() {
  const root = opRoot(), card = root && root.querySelector('.op-map-card'); if (!card) return;
  const o = op.objs.find(function(x) { return x.id === op.objId; });
  root.querySelectorAll('[data-obj]').forEach(function(el) { const selected = Number(el.getAttribute('data-obj')) === op.objId; el.classList.toggle('on', selected); el.setAttribute('aria-pressed', String(selected)); });
  if (!o) { card.innerHTML = '<div class="op-map-empty"><h3>Выберите объект</h3><p>Нажмите на метку на карте или на объект в списке слева.</p></div>'; return; }
  const p = opLocation(o), rooms = op.rooms.filter(function(r) { return r.object_id === o.id; }), plans = op.plans.filter(function(x) { return x.object_id === o.id; });
  const photo = typeof p.photo === 'string' && /^\/storage\/uploads\/object-map\/[a-z0-9-]+\.webp$/.test(p.photo) ? p.photo : '';
  card.innerHTML = (photo ? '<img class="op-map-photo" src="' + opEsc(photo) + '" alt="' + opEsc(o.name) + '">' : '')
    + '<div class="op-map-detail"><div class="op-cap">Объект</div><h2>' + opEsc(o.name) + '</h2><p>' + opEsc(p.address || 'Адрес уточняется') + '</p>'
    + (!opLocated(o) ? '<p class="op-map-note">Точка на карте пока не подтверждена.</p>' : p.approximate ? '<p class="op-map-note">Примерная точка: ' + opEsc(p.precision || 'местоположение требует уточнения') + '.</p>' : '')
    + '<div class="op-map-facts"><span><b>' + plans.length + '</b>планов</span><span><b>' + rooms.length + '</b>помещений</span></div>'
    + '<button class="op-btn primary" data-act="open-plans">Планы и помещения →</button>'
    + (opLocated(o) ? ' <button class="op-btn" data-act="route-here">Маршрут сюда</button>' : '')
    + (!plans.length ? '<p class="op-map-note">Планы ещё не добавлены. В разделе планов доступен редактор.</p>' : '') + '</div>';
}
function opMapRender() {
  const root = opRoot(), objects = opMapObjects(), located = objects.filter(opLocated);
  root.innerHTML = '<div class="op-map-head"><div><div class="op-cap">Объекты</div><h2>Карта объектов</h2><p>Выберите объект, чтобы открыть его карточку и планы.</p></div><button class="op-btn" data-act="map-all">Все объекты на карте</button></div>'
    + '<div class="op-map-wrap"><aside class="op-map-list op-card"><label class="op-cap" for="op-map-search">Объекты · ' + op.objs.length + '</label>'
    + '<input id="op-map-search" class="op-search" data-q placeholder="Название или адрес" value="' + opEsc(op.q || '') + '">'
    + '<div class="op-map-items">' + op.objs.map(function(o) {
      const p = opLocation(o), visible = objects.some(function(x) { return x.id === o.id; });
      return '<button class="op-obj op-map-item" data-obj="' + o.id + '" style="' + (visible ? '' : 'display:none') + '"><span><b>' + opEsc(o.name) + '</b><small>' + opEsc(p.address || 'Адрес уточняется') + '</small></span>' + (!opLocated(o) ? '<span class="op-map-note">Без точки</span>' : '') + '</button>';
    }).join('') + '</div><p class="op-map-count" role="status">' + opMapCount(objects, located) + '</p></aside>'
    + '<div class="op-map-center"><section class="op-route op-card" aria-label="Построение маршрута"></section><div class="op-map-canvas op-card"></div></div><aside class="op-map-card op-card" aria-live="polite"></aside></div>';
  opMapCard(); opRoutePanel();
  const frame = document.createElement('iframe'); frame.title = 'Карта объектов';
  frame.setAttribute('sandbox', 'allow-scripts allow-popups'); frame.setAttribute('referrerpolicy', 'no-referrer');
  op.mapChannel = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  op.mapFrame = frame;
  frame.srcdoc = opMapDoc(op.objs.filter(opLocated).map(function(o) { const p = opLocation(o); return { id: o.id, name: o.name, lat: p.lat, lon: p.lon }; }), op.mapChannel);
  root.querySelector('.op-map-canvas').appendChild(frame);
}
function opMapCount(objects, located) {
  return objects.length ? 'На карте: ' + located.length + ' из ' + objects.length + (located.length < objects.length ? '. Остальные доступны в списке.' : '') : 'Объекты не найдены';
}
function opMapFilter() {
  const objects = opMapObjects(), ids = objects.map(function(o) { return o.id; });
  opRoot().querySelectorAll('.op-map-item').forEach(function(el) { el.style.display = ids.indexOf(Number(el.getAttribute('data-obj'))) !== -1 ? '' : 'none'; });
  opRoot().querySelector('.op-map-count').textContent = opMapCount(objects, objects.filter(opLocated));
  opMapSync(true);
}
window.addEventListener('message', function(e) {
  const d = e.data;
  if (op.screen !== 'map' || !opRoot() || !opRoot().isConnected || !d || d.channel !== op.mapChannel || e.origin !== 'null') return;
  if (d.type === 'crm-object-map-ready') { opMapSync(true); opRouteDraw(!!op.routeResult); }
  if (d.type === 'crm-object-map-select' && opMapObjects().some(function(o) { return o.id === d.id && opLocated(o); })) opSelectObject(d.id);
});
