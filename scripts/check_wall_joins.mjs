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
