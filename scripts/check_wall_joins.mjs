// проверка стыков стен «Объекты → Планы»: node scripts/check_wall_joins.mjs src/objects-plans.js
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const pick = (n) => { const i = src.indexOf('function ' + n + '('); let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; if (src[j] === '}' && !--d) break; } return src.slice(i, j + 1); };
const code = ['opR', 'opWallLen', 'opArc', 'opWallArcLen', 'opWallAt', 'opWtByT', 'opWT', 'opWallPolys'].map(pick).join('\n') + "\nconst OP_WT={ext:1,bear:1,part:1};";
const f = new Function(code + '\nreturn opWallPolys;')();
const eq = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
// L-угол 0,5 м: прямоугольник 10×6
const W = (id, x1, y1, x2, y2, t) => ({ id, k: 'wall', x1, y1, x2, y2, t });
let r = f([W('a', 0, 0, 10, 0, 0.5), W('b', 10, 0, 10, 6, 0.5), W('c', 10, 6, 0, 6, 0.5), W('d', 0, 6, 0, 0, 0.5)]);
const A = r.polys.find(p => p.w.id === 'a').pts, B = r.polys.find(p => p.w.id === 'b').pts;
console.log('a', JSON.stringify(A)); console.log('b', JSON.stringify(B));
// у стены a в углу (10,0) должны быть точки (10.25,-0.25) и (9.75,0.25), и те же — у стены b
for (const q of [[10.25, -0.25], [9.75, 0.25]]) { if (!A.some(p => eq(p, q)) || !B.some(p => eq(p, q))) throw new Error('L joint ' + q); }
if (r.hubs.length) throw new Error('hub on L');
// T из трёх концов: заплатка есть
r = f([W('a', 0, 0, 5, 0, 0.5), W('b', 5, 0, 10, 0, 0.5), W('c', 5, 0, 5, 4, 0.12)]);
if (r.hubs.length !== 1) throw new Error('hub');
console.log('hub', JSON.stringify(r.hubs[0].pts));
// разная толщина по прямой — ступенька, без уса
r = f([W('a', 0, 0, 5, 0, 0.5), W('b', 5, 0, 10, 0, 0.12)]);
console.log('step a', JSON.stringify(r.polys[0].pts));
// дуга с прямой
r = f([W('a', 0, 0, 5, 0, 0.3), Object.assign(W('b', 5, 0, 10, 0, 0.3), { b: 2 })]);
console.log('arc ok', r.polys[1].pts.length);
console.log('OK');
// наложения: стены Матросской 16.10 (комнаты обведены «Стенами по контуру» по очереди)
{
  const g = new Function(['opR', 'opWallLen', 'opArc', 'opNewId', 'opWallsClean'].map(pick).join('\n') + "\nconst OP_OPEN={door:1,window:1,gate:1}; let n=0; function opNewId(){return 'n'+(n++)}\nreturn opWallsClean;")();
  const ws = [[30, 20, 13, 20, .5], [13, 20, 13, 26, .5], [30, 33.5, 30, 20, .5], [30, 20, 30, 20, .5], [10, 20, 30, 20, .38], [30, 20, 30, 13, .5], [30, 13, 23, 13, .5], [23, 13, 10, 13, .38],
    [23, 5.5, 23, 13, .12], [36, 13, 23, 13, .38], [30, 13, 30, 33.5, .38], [36, 13, 30, 13, .38]].map((w, i) => ({ id: 'w' + i, k: 'wall', x1: w[0], y1: w[1], x2: w[2], y2: w[3], t: w[4] }));
  const dw = { items: ws }; const ch = g(dw);
  const W = dw.items;
  // попарно: ни одна пара на одной линии не перекрывается
  for (const a of W) for (const b of W) { if (a === b) continue; const L = Math.hypot(a.x2 - a.x1, a.y2 - a.y1), ux = (a.x2 - a.x1) / L, uy = (a.y2 - a.y1) / L;
    if (Math.abs((b.x1 - a.x1) * uy - (b.y1 - a.y1) * ux) > 0.02 || Math.abs((b.x2 - a.x1) * uy - (b.y2 - a.y1) * ux) > 0.02) continue;
    const p = [(b.x1 - a.x1) * ux + (b.y1 - a.y1) * uy, (b.x2 - a.x1) * ux + (b.y2 - a.y1) * uy].sort((x, y) => x - y);
    if (Math.min(L, p[1]) - Math.max(0, p[0]) > 0.02) throw new Error('overlap ' + a.id + ' ' + b.id); }
  if (W.some(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) < 0.01)) throw new Error('zero wall');
  console.log('clean: changed', ch, 'walls', ws.length, '→', W.length, 'OK');
}
// примыкание: перегородка упирается в середину стены — стена режется на две в точке примыкания, дверь уезжает во вторую часть
{
  const f = new Function(['opR', 'opWallLen', 'opArc', 'opWallSplit', 'opSplitJunctions'].map(pick).join('\n') + "\nconst OP_OPEN={door:1,window:1,gate:1}; let n=0; function opNewId(){return 'n'+(n++)}\nreturn opSplitJunctions;")();
  const dw = { items: [{ id: 'a', k: 'wall', x1: 0, y1: 0, x2: 10, y2: 0, t: 0.5 }, { id: 'b', k: 'wall', x1: 4, y1: 0, x2: 4, y2: 6, t: 0.12 }, { id: 'd', k: 'door', wid: 'a', u: 7, w: 0.9 }] };
  const n = f(dw), A = dw.items.filter(w => w.k === 'wall' && w.y1 === 0 && w.y2 === 0), D = dw.items.find(o => o.k === 'door');
  if (n !== 1 || A.length !== 2 || A[0].x2 !== 4 || A[1].x1 !== 4 || A[1].x2 !== 10 || D.wid !== A[1].id || D.u !== 3) throw new Error('split ' + JSON.stringify(dw.items));
  if (f(dw) !== 0) throw new Error('split twice');
  console.log('split OK');
}
