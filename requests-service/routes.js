'use strict';
class RouteError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const cache = new Map();
let requesting = false, lastRequest = 0;
function located(p) {
  return p && typeof p.lat === 'number' && typeof p.lon === 'number'
    && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
}
async function objectRoute(user, body, loadObjects) {
  // This tab is currently admin-only; routing must not widen access to object locations.
  if (!user.isAdmin) throw new RouteError(403, 'Нет доступа к карте объектов');
  const {from, to} = body || {};
  if (!Number.isSafeInteger(from) || from < 1 || !Number.isSafeInteger(to) || to < 1 || from === to) {
    throw new RouteError(400, 'Выберите два разных объекта');
  }
  const objects = await loadObjects([from, to]);
  const a = objects.find(o => o.id === from), b = objects.find(o => o.id === to);
  if (!a || !b) throw new RouteError(404, 'Объект не найден или недоступен');
  const start = a.map_location, end = b.map_location;
  if (!located(start) || !located(end)) throw new RouteError(422, 'У объекта нет точки на карте');
  const coordinates = start.lon + ',' + start.lat + ';' + end.lon + ',' + end.lat;
  const cached = cache.get(coordinates);
  if (cached && cached.expires > Date.now()) return cached.route;
  // Provider policy: at most one request per second, no bulk queries; only explicit user requests.
  if (requesting || Date.now() - lastRequest < 1100) throw new RouteError(429, 'Расчёт занят. Повторите через несколько секунд');
  requesting = true; lastRequest = Date.now();
  try {
    // shortcut: public routing has no SLA; use our own OSRM when traffic or availability requirements grow.
    const response = await fetch('https://routing.openstreetmap.de/routed-car/route/v1/driving/' + coordinates
      + '?overview=full&geometries=geojson&steps=false&radiuses=1500;1500', {
      headers: { 'User-Agent': 'NocobaseCRM/1.0 (+https://github.com/efrom-K/nocobase-crm)', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if (result && (result.code === 'NoRoute' || result.code === 'NoSegment')) throw new RouteError(422, 'Дорога рядом с точкой не найдена. Уточните расположение объекта');
    if (!response.ok) throw new RouteError(502, 'Сервис маршрутов временно недоступен. Попробуйте позже');
    const r = result.routes && result.routes[0];
    if (result.code !== 'Ok' || !r || !Number.isFinite(r.distance) || r.distance < 0 || !Number.isFinite(r.duration) || r.duration < 0
      || !r.geometry || r.geometry.type !== 'LineString' || !Array.isArray(r.geometry.coordinates)
      || r.geometry.coordinates.length < 2 || r.geometry.coordinates.length > 50000
      || !r.geometry.coordinates.every(p => Array.isArray(p) && p.length === 2 && located({lon:p[0],lat:p[1]}))) {
      throw new RouteError(502, 'Сервис маршрутов вернул некорректный ответ. Попробуйте позже');
    }
    const route = { distance:r.distance, duration:r.duration, geometry:r.geometry };
    if (cache.size >= 256) cache.delete(cache.keys().next().value);
    cache.set(coordinates, {expires:Date.now() + 86400000, route});
    return route;
  } catch (e) {
    if (e instanceof RouteError) throw e;
    throw new RouteError(502, 'Не удалось рассчитать маршрут. Попробуйте позже');
  } finally { requesting = false; }
}
module.exports = {objectRoute, RouteError};
