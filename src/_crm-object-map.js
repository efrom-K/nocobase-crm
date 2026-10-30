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
function opMapPhoto(o) {
  const photo = opLocation(o).photo;
  return typeof photo === 'string' && /^\/storage\/uploads\/object-map\/[a-z0-9-]+\.webp$/.test(photo) ? photo : '';
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
  opMapSelection();
  box.style.display = op.routeFrom || op.routeTo ? '' : 'none';
  if (!op.routeFrom && !op.routeTo) { box.innerHTML = ''; return; }
  const name = function(id, fallback) { const o = op.objs.find(function(x) { return x.id === id; }); return opEsc(o ? o.name : fallback); };
  const disabled = op.routeBusy ? ' disabled' : '', r = op.routeResult;
  let summary = op.routeBusy ? 'Рассчитываю маршрут…' : op.routeError || (op.routeFrom ? 'Выберите объект и нажмите «Сюда»' : 'Выберите объект и нажмите «Отсюда»');
  if (r) {
    const minutes = Math.max(1, Math.ceil(r.duration / 60)), hours = Math.floor(minutes / 60);
    summary = opM(r.distance / 1000) + ' км · около ' + (hours ? hours + ' ч' + (minutes % 60 ? ' ' + minutes % 60 + ' мин' : '') : minutes + ' мин');
  }
  const approximate = r && op.objs.some(function(o) { return (o.id === r.from || o.id === r.to) && opLocation(o).approximate; });
  box.innerHTML = '<div class="op-route-top"><span class="op-route-point"><i>А</i><b>' + name(op.routeFrom, 'Откуда?') + '</b></span>'
    + '<button class="op-map-icon" data-act="route-swap" aria-label="Поменять начало и конец маршрута" title="Поменять местами"' + disabled + '>⇄</button>'
    + '<span class="op-route-point"><i>Б</i><b>' + name(op.routeTo, 'Куда?') + '</b></span>'
    + '<button class="op-map-icon" data-act="route-clear" aria-label="Убрать маршрут" title="Убрать маршрут">×</button></div>'
    + '<div class="op-route-bottom"><span class="op-route-result" role="status" aria-live="polite">' + opEsc(summary) + '</span>'
    + (op.routeError && op.routeFrom && op.routeTo ? '<button class="op-route-retry" data-act="route-build">Повторить</button>' : '') + '</div>'
    + (r ? '<div class="op-route-note">Без пробок' + (approximate ? ' · Примерная точка — уточните въезд' : ' · Пунктир — от дороги до объекта') + '</div>' : '');
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
function opRoutePick(side) {
  if (!op.objs.some(function(o) { return o.id === op.objId && opLocated(o); })) return;
  if (side !== 'from' && side !== 'to') return;
  const key = side === 'from' ? 'routeFrom' : 'routeTo', other = side === 'from' ? 'routeTo' : 'routeFrom';
  op[key] = op.objId;
  if (op[other] === op.objId) op[other] = null;
  opRouteReset();
  if (op.routeFrom && op.routeTo) return opRouteBuild();
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
  const map = L.map('map', { scrollWheelZoom: false, zoomControl:false }).setView([55.9, 37.7], 9);
  L.control.zoom({position:'bottomright',zoomInTitle:'Приблизить',zoomOutTitle:'Отдалить'}).addTo(map);
  map.attributionControl.addAttribution('<a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">OSRM / FOSSGIS</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Исправить карту</a>');
  function padding() { const w = map.getSize().x; return {paddingTopLeft:w > 1100 ? [312,116] : w > 800 ? [274,116] : [32,116], paddingBottomRight:w > 1100 ? [328,56] : w > 800 ? [290,56] : [32,48]}; }
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
    if (message.fit && bounds.length) map.fitBounds(bounds, Object.assign(padding(), {maxZoom:12}));
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
    if (message.fit) map.fitBounds(routeLayer.getBounds(), Object.assign(padding(), {maxZoom:15}));
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
    + '<style>.leaflet-tile-pane{filter:saturate(.62)}.leaflet-control-zoom{border:0!important;border-radius:12px!important;overflow:hidden;box-shadow:0 3px 14px #1c2d5826!important}.leaflet-control-zoom a{width:36px!important;height:36px!important;line-height:36px!important;color:#1c2d58!important}.leaflet-tooltip{border:0;border-radius:8px;padding:7px 10px;box-shadow:0 3px 12px #1c2d5820}.leaflet-control-attribution{font-size:10px!important}.route-end{background:#1c2d58;color:#fff;border:3px solid white;border-radius:50%;font:bold 14px/28px Arial;text-align:center;box-shadow:0 2px 8px #0004}</style>'
    + '<script>(' + opMapFrame.toString() + ')(' + json(data) + ',' + json(channel) + ');</script></body></html>';
}
function opMapSync(fit) {
  if (!op.mapFrame) return;
  const ids = opMapObjects().filter(opLocated).map(function(o) { return o.id; });
  op.mapFrame.contentWindow.postMessage({ type: 'crm-object-map-state', channel: op.mapChannel, ids: ids, id: op.objId, fit: !!fit, focus: !fit }, '*');
}
function opMapSelection() {
  const root = opRoot(); if (!root) return;
  root.querySelectorAll('[data-obj]').forEach(function(el) { const id = Number(el.getAttribute('data-obj')), selected = id === op.objId; el.classList.toggle('on', selected); el.setAttribute('aria-pressed', String(selected)); el.setAttribute('data-route-stop', id === op.routeFrom ? 'А' : id === op.routeTo ? 'Б' : ''); });
  [['route-from',op.routeFrom],['route-here',op.routeTo]].forEach(function(action) {
    const button = root.querySelector('[data-act="' + action[0] + '"]');
    if (button) { const selected = action[1] === op.objId; button.classList.toggle('on', selected); button.setAttribute('aria-pressed', String(selected)); }
  });
}
function opMapCard() {
  const root = opRoot(), card = root && root.querySelector('.op-map-card'); if (!card) return;
  const o = op.objs.find(function(x) { return x.id === op.objId; });
  if (!o) { card.innerHTML = '<div class="op-map-empty"><h3>Выберите объект</h3><p>Нажмите на метку на карте или на объект в списке слева.</p></div>'; return; }
  const p = opLocation(o), rooms = op.rooms.filter(function(r) { return r.object_id === o.id; }), plans = op.plans.filter(function(x) { return x.object_id === o.id; });
  const photo = opMapPhoto(o);
  card.innerHTML = (photo ? '<img class="op-map-photo" src="' + opEsc(photo) + '" alt="' + opEsc(o.name) + '">' : '')
    + '<div class="op-map-detail"><div class="op-map-eyebrow">Объект</div><h2>' + opEsc(o.name) + '</h2><p class="op-map-address">' + opEsc(p.address || 'Адрес уточняется') + '</p>'
    + (!opLocated(o) ? '<p class="op-map-note">Точка на карте пока не подтверждена.</p>' : p.approximate ? '<p class="op-map-note">Примерная точка: ' + opEsc(p.precision || 'местоположение требует уточнения') + '.</p>' : '')
    + '<div class="op-map-facts"><span><b>' + plans.length + '</b>планов</span><span><b>' + rooms.length + '</b>помещений</span></div>'
    + (opLocated(o) ? '<div class="op-map-directions"><button data-act="route-from" class="' + (op.routeFrom === o.id ? 'on' : '') + '" aria-label="Маршрут отсюда"><span aria-hidden="true">↗</span>Отсюда</button><button data-act="route-here" class="' + (op.routeTo === o.id ? 'on' : '') + '" aria-label="Маршрут сюда"><span aria-hidden="true">↘</span>Сюда</button></div>' : '')
    + '<button class="op-btn op-map-plans" data-act="open-plans">' + opIco('layers') + 'Планы и помещения <span>→</span></button>'
    + (!plans.length ? '<p class="op-map-note">Планы ещё не добавлены. В разделе планов доступен редактор.</p>' : '') + '</div>';
  opMapSelection();
}
function opMapRender() {
  const root = opRoot(), objects = opMapObjects(), located = objects.filter(opLocated);
  root.innerHTML = '<div class="op-map-wrap"><aside class="op-map-list op-card"><div class="op-map-list-head"><h2>Объекты <span>' + op.objs.length + '</span></h2><button class="op-map-icon" data-act="map-all" aria-label="Все объекты на карте" title="Все объекты на карте">⌖</button></div>'
    + '<div class="op-map-search"><span aria-hidden="true">⌕</span><input id="op-map-search" class="op-search" data-q aria-label="Найти объект по названию или адресу" placeholder="Найти объект" value="' + opEsc(op.q || '') + '"></div>'
    + '<div class="op-map-items">' + op.objs.map(function(o) {
      const p = opLocation(o), photo = opMapPhoto(o), visible = objects.some(function(x) { return x.id === o.id; });
      return '<button class="op-obj op-map-item" data-obj="' + o.id + '" style="' + (visible ? '' : 'display:none') + '"><span class="op-map-thumb">' + (photo ? '<img src="' + opEsc(photo) + '" alt="" loading="lazy">' : opIco('layers')) + '</span><span class="op-map-item-text"><b>' + opEsc(o.name) + '</b><small>' + opEsc(p.address || 'Адрес уточняется') + '</small></span></button>';
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
