// Дописывает русские displayName/description в package.json плагинов NocoBase и недостающие ключи в их ru-RU.json.
// Запуск внутри контейнера: node patch_plugins_ru.js /tmp/ru_dict.json   (после обновления образа NocoBase запускать заново)
const fs = require('fs'), path = require('path');
const RU = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/ru_dict.json', 'utf8'));
const base = '/app/nocobase/node_modules/@nocobase';
let pkgChanged = 0, locChanged = 0;
// ключи, которые встречаются в интерфейсе плагинов без перевода даже когда их нет в en-US.json своего плагина
const FORCE = new Set(['AI employees', 'Data source', 'Category', 'Enabled']);
const hasCyr = v => /[А-Яа-яЁё]/.test(String(v || ''));
for (const p of fs.readdirSync(base).filter(n => n.startsWith('plugin-'))) {
  const pj = path.join(base, p, 'package.json');
  try {
    const d = JSON.parse(fs.readFileSync(pj, 'utf8')); let touched = false;
    for (const f of ['displayName', 'description']) {
      const key = f + '.ru-RU';
      if (RU[d[f]] && d[key] !== RU[d[f]]) { d[key] = RU[d[f]]; touched = true; }
    }
    if (touched) { fs.writeFileSync(pj, JSON.stringify(d, null, 2) + '\n'); pkgChanged++; }
  } catch (e) { /* skip */ }
}
for (const p of fs.readdirSync(base)) {
  for (const sub of ['dist/locale', 'lib/locale']) {
    const dir = path.join(base, p, sub);
    const enF = path.join(dir, 'en-US.json');
    if (!fs.existsSync(enF)) continue;
    let en; try { en = JSON.parse(fs.readFileSync(enF, 'utf8')); } catch (e) { continue; }
    const ruF = path.join(dir, 'ru-RU.json');
    const ru = fs.existsSync(ruF) ? JSON.parse(fs.readFileSync(ruF, 'utf8')) : {};
    let touched = false;
    for (const k of Object.keys(RU)) if ((k in en || FORCE.has(k)) && !hasCyr(ru[k])) { ru[k] = RU[k]; touched = true; }
    if (touched) { fs.writeFileSync(ruF, JSON.stringify(ru, null, 2) + '\n'); locChanged++; }
  }
}
// явные переопределения: { "plugin-имя": { "Ключ": "Перевод" } } — применяются всегда (даже поверх существующего перевода)
const ovF = path.join(path.dirname(process.argv[2] || '/tmp/ru_dict.json'), 'overrides.json');
if (fs.existsSync(ovF)) {
  const OV = JSON.parse(fs.readFileSync(ovF, 'utf8'));
  for (const [plugin, kv] of Object.entries(OV)) {
    const ruF = path.join(base, plugin, 'dist/locale/ru-RU.json');
    const ru = fs.existsSync(ruF) ? JSON.parse(fs.readFileSync(ruF, 'utf8')) : {};
    let touched = false;
    for (const [k, v] of Object.entries(kv)) if (ru[k] !== v) { ru[k] = v; touched = true; }
    if (touched) { fs.writeFileSync(ruF, JSON.stringify(ru, null, 2) + '\n'); locChanged++; }
  }
}
console.log('package.json изменено:', pkgChanged, '| ru-RU.json изменено/создано:', locChanged);
