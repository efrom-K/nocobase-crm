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
  frame.setAttribute('sandbox', 'allow-scripts allow-popups'); frame.setAttribute('referrerpolicy', 'origin');
  op.mapChannel = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  op.mapFrame = frame;
  const channel = op.mapChannel;
  frame.addEventListener('load', function() {
    if (op.mapFrame !== frame || op.mapChannel !== channel) return;
    frame.contentWindow.postMessage({type:'crm-object-map-init', channel:channel, objects:op.objs.filter(opLocated).map(function(o) {
      const p = opLocation(o); return {id:o.id,name:o.name,lat:p.lat,lon:p.lon};
    })}, '*');
  });
  frame.src = (location.port ? location.protocol + '//' + location.hostname + ':8097' : '/rqsvc') + '/object-map';
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
async function opMapTile(d) {
  if (!Number.isSafeInteger(d.requestId) || d.requestId < 1 || !Number.isInteger(d.z) || d.z < 0 || d.z > 18
    || !Number.isInteger(d.x) || !Number.isInteger(d.y) || d.x < 0 || d.y < 0 || d.x >= Math.pow(2,d.z) || d.y >= Math.pow(2,d.z)) return;
  const frame = op.mapFrame, channel = op.mapChannel;
  const reply = function(values) { const target = frame && frame.isConnected && frame.contentWindow; if (target && frame === op.mapFrame && channel === op.mapChannel) target.postMessage(Object.assign({type:'crm-object-map-tile',channel:channel,requestId:d.requestId},values),'*'); };
  if ((op.mapTileLoads || 0) >= 48) { reply({error:true}); return; }
  op.mapTileLoads = (op.mapTileLoads || 0) + 1;
  let timeout;
  try {
    // The CRM document supplies the real Referer; the opaque renderer never receives credentials.
    const buffer = await Promise.race([
      (async function() {
        const response = await fetch('https://tile.openstreetmap.org/' + d.z + '/' + d.x + '/' + d.y + '.png', {referrerPolicy:'origin'});
        if (!response.ok || !(response.headers.get('Content-Type') || '').startsWith('image/png')) throw new Error('Tile unavailable');
        return response.arrayBuffer();
      })(),
      new Promise(function(resolve,reject) { timeout = setTimeout(function() { reject(new Error('Tile timeout')); },15000); })
    ]);
    if (buffer.byteLength > 524288) throw new Error('Tile too large');
    reply({buffer:buffer});
  } catch (e) { reply({error:true}); }
  finally { clearTimeout(timeout); op.mapTileLoads--; }
}
window.addEventListener('message', function(e) {
  const d = e.data;
  if (op.screen !== 'map' || !opRoot() || !opRoot().isConnected || !d || d.channel !== op.mapChannel || e.origin !== 'null') return;
  if (d.type === 'crm-object-map-tile-request') { opMapTile(d); return; }
  if (d.type === 'crm-object-map-ready') { opMapSync(true); opRouteDraw(!!op.routeResult); }
  if (d.type === 'crm-object-map-select' && opMapObjects().some(function(o) { return o.id === d.id && opLocated(o); })) opSelectObject(d.id);
});
