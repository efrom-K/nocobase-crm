// HTML отчёта собственника (A4, книжная) по брендбуку v1.2. В PDF печатает build-reports.js через headless Chrome.
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./demo');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
const mln = (n) => (n / 1e6).toFixed(1).replace('.', ',') + ' млн ₽';
const pct = (x, d = 0) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(d).replace('.', ',') + '%';
const pp = (x) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(1).replace('.', ',') + ' п. п.';
const date = (iso) => { const [y, m, d] = iso.split('-'); return `${+d} ${D.MONTH_GEN[+m - 1]} ${y}`; };

const brandDir = [path.join(__dirname, 'brand'), path.join(__dirname, '..', 'brand')].find((p) => fs.existsSync(path.join(p, 'brand.css')));
const logoWhite = fs.readFileSync(path.join(brandDir, 'kn-logo-white.svg'), 'utf8').replace(/<\?xml[^>]*>/, '');

// столбчатая диаграмма одной серии: тонкие столбцы, подписи значений только у первого и последнего
function bars(months, key, { w = 640, h = 150, fmt = (v) => (v / 1e6).toFixed(1).replace('.', ',') } = {}) {
  const top = 22, bottom = 26, n = months.length, gap = w / n, bw = Math.min(26, gap * 0.5);
  const max = Math.max(...months.map((m) => m[key])) * 1.08;
  const y = (v) => top + (h - top - bottom) * (1 - v / max);
  const cols = months.map((m, i) => {
    const x = gap * i + (gap - bw) / 2, yy = y(m[key]), last = i === n - 1;
    const label = i === 0 || last ? `<text x="${x + bw / 2}" y="${yy - 6}" text-anchor="middle" class="v${last ? ' v--b' : ''}">${fmt(m[key])}</text>` : '';
    return `<path d="M${x},${h - bottom} V${yy + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${h - bottom} Z" class="${last ? 'b b--cur' : 'b'}"/>${label}<text x="${x + bw / 2}" y="${h - 8}" text-anchor="middle" class="m">${D.monthShort(m.month)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img"><line x1="0" x2="${w}" y1="${h - bottom}" y2="${h - bottom}" class="ax"/>${cols}</svg>`;
}

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font: 10pt/1.45 var(--kn-sans); color: var(--kn-ink-2); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; }
.page:last-child { page-break-after: auto; }
.top { background: var(--kn-navy); color: #fff; padding: 12mm 16mm 10mm; }
.top__row { display: flex; justify-content: space-between; align-items: center; }
.top svg { height: 11mm; width: auto; display: block; }
.top__tag { font: 400 7.5pt/1 var(--kn-mono); letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.72); }
.top h1 { font: 600 26pt/1.05 var(--kn-cond); margin: 12mm 0 3mm; color: #fff; }
.top p { margin: 0; color: rgba(255,255,255,.78); font-size: 10pt; }
.thin { padding: 8mm 16mm 6mm; background: var(--kn-navy); color: #fff; display: flex; justify-content: space-between; align-items: center; }
.thin svg { height: 7mm; width: auto; display: block; }
.body { padding: 9mm 16mm 0; flex: 1; }
.eb { display: flex; align-items: center; gap: 3mm; font: 400 7.5pt/1 var(--kn-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--kn-muted); margin: 0 0 4mm; }
.eb::before { content: ""; width: 6mm; height: 1px; background: currentColor; }
h2 { font: 600 15pt/1.1 var(--kn-cond); color: var(--kn-ink); margin: 0 0 4mm; }
.sec { margin-bottom: 8mm; }
.kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.kpi div { border: 1px solid var(--kn-line); border-radius: 4mm; padding: 4mm 4.5mm; }
.kpi span { display: block; font-size: 8pt; color: var(--kn-muted); }
.kpi b { display: block; font: 600 17pt/1.1 var(--kn-cond); color: var(--kn-ink); margin: 1.5mm 0 1mm; white-space: nowrap; }
.kpi small { font: 400 7.5pt var(--kn-mono); color: var(--kn-navy); }
.kpi .hero { background: var(--kn-navy); border-color: var(--kn-navy); }
.kpi .hero span, .kpi .hero small { color: rgba(255,255,255,.75); }
.kpi .hero b { color: #fff; }
.chart { width: 100%; height: auto; display: block; }
.chart .b { fill: var(--kn-ice); } .chart .b--cur { fill: var(--kn-navy); }
.chart .ax { stroke: var(--kn-line-2); stroke-width: 1; }
.chart .m { font: 400 8px var(--kn-mono); fill: var(--kn-muted); }
.chart .v { font: 500 9px var(--kn-mono); fill: var(--kn-muted); } .chart .v--b { fill: var(--kn-ink); font-weight: 500; }
.news { list-style: none; margin: 0; padding: 0; }
.news li { display: grid; grid-template-columns: 1fr auto; gap: 1mm 6mm; padding: 3mm 0; border-top: 1px solid var(--kn-line); }
.news li:first-child { border-top: 0; padding-top: 0; }
.news b { color: var(--kn-ink); font-weight: 500; } .news span { grid-column: 1; color: var(--kn-muted); font-size: 9pt; }
.news em { grid-row: 1 / span 2; grid-column: 2; align-self: center; font: 500 9.5pt var(--kn-mono); font-style: normal; color: var(--kn-navy); white-space: nowrap; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
th { text-align: left; font: 400 7pt/1.2 var(--kn-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--kn-muted); padding: 0 2mm 2mm 0; border-bottom: 1px solid var(--kn-line-2); }
td { padding: 2.4mm 2mm 2.4mm 0; border-bottom: 1px solid var(--kn-line); }
td.n, th.n { text-align: right; font-family: var(--kn-mono); white-space: nowrap; }
tr.tot td { border-bottom: 0; border-top: 1.5px solid var(--kn-ink); font-weight: 600; color: var(--kn-ink); }
.up { color: var(--kn-navy); }
.obj { border: 1px solid var(--kn-line); border-radius: 4mm; padding: 5mm; margin-bottom: 4mm; break-inside: avoid; }
.obj__h { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 3mm; }
.obj__h h3 { font: 600 12.5pt var(--kn-cond); color: var(--kn-ink); margin: 0; }
.obj__h span { font-size: 8.5pt; color: var(--kn-muted); }
.facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; margin-bottom: 3mm; }
.facts div { background: var(--kn-paper); border-radius: 2.5mm; padding: 2.5mm 3mm; }
.facts span { display: block; font-size: 7.5pt; color: var(--kn-muted); }
.facts b { font: 600 11.5pt var(--kn-cond); color: var(--kn-ink); }
.facts small { font: 400 7pt var(--kn-mono); color: var(--kn-navy); margin-left: 1mm; }
.share { display: inline-block; height: 2mm; border-radius: 1mm; background: var(--kn-navy); vertical-align: middle; margin-right: 2mm; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.plan { margin: 0; padding-left: 5mm; } .plan li { margin-bottom: 2mm; }
.foot { padding: 5mm 16mm 7mm; display: flex; justify-content: space-between; font: 400 7.5pt var(--kn-mono); color: var(--kn-muted); border-top: 1px solid var(--kn-line); margin: 0 16mm; padding-left: 0; padding-right: 0; }
.mgr { display: flex; gap: 6mm; align-items: center; background: var(--kn-paper); border-radius: 4mm; padding: 5mm 6mm; }
.mgr b { color: var(--kn-ink); display: block; font-size: 11pt; }
.mgr span { color: var(--kn-muted); font-size: 9pt; }
.mgr__ph { width: 14mm; height: 14mm; border-radius: 3mm; background: var(--kn-navy); color: #fff; display: grid; place-items: center; font: 600 13pt var(--kn-cond); flex: none; }
.demo { font: 400 7pt var(--kn-mono); color: var(--kn-muted); text-transform: uppercase; letter-spacing: .08em; }
`;

const foot = (r, page, pages) => `<div class="foot"><span>${esc(D.OWNER.name)} · ${esc(r.title)}</span><span>Консалт Недвижимость · ykinvest.ru · ${page}/${pages}</span></div>`;
const thin = (r) => `<div class="thin">${logoWhite}<span class="top__tag">${esc(r.title)}</span></div>`;

function pageMonth(r) {
  const upTo = D.MONTHS.indexOf(r.period);
  const p = D.portfolio(upTo), k = p.kpi;
  const q = r.kind === 'quarter';
  const qMonths = p.months.slice(-3), qPrev = p.months.slice(-6, -3);
  const s = (a, key) => a.reduce((x, m) => x + m[key], 0);
  const collected = q ? s(qMonths, 'collected') : k.collected;
  const payout = q ? s(qMonths, 'payout') : k.payout;
  const cmp = q ? s(qMonths, 'collected') / s(qPrev, 'collected') - 1 : k.collectedYoY;
  const inPeriod = q ? qMonths.map((m) => m.month) : [r.period];
  const news = D.NEWS.filter((n) => inPeriod.includes(n.date.slice(0, 7))).slice(0, 4);
  const pages = 3;
  const periodLabel = q ? 'III квартал 2026 · июль — сентябрь' : p.monthName;

  const charged = q ? s(qMonths, 'charged') : p.months.at(-1).charged;
  const fee = Math.round(collected * 0.07);
  const opex = collected - fee - payout;

  return `
<section class="page">
  <div class="top">
    <div class="top__row">${logoWhite}<span class="top__tag">Отчёт собственника</span></div>
    <h1>${esc(periodLabel)}</h1>
    <p>${esc(D.OWNER.name)} · ${p.objects.length} объекта · ${num(k.area)} м² · отправлен ${date(r.sent)}</p>
  </div>
  <div class="body">
    <div class="sec">
      <p class="eb">Главные цифры</p>
      <div class="kpi">
        <div class="hero"><span>${q ? 'Поступило за квартал' : 'Поступило за месяц'}</span><b>${mln(collected)}</b><small>${pct(cmp)} ${q ? 'ко II кварталу' : 'к прошлому году'}</small></div>
        <div><span>К перечислению вам</span><b>${mln(payout)}</b><small>${mln(k.payoutYtd)} с начала года</small></div>
        <div><span>Заполняемость</span><b>${String(k.occ).replace('.', ',')}%</b><small>${pp(k.occYoY)} за год</small></div>
        <div><span>Средняя ставка</span><b>${num(k.rate)} ₽/м²</b><small>${pct(k.rateYoY)} за год</small></div>
      </div>
    </div>
    <div class="sec">
      <p class="eb">Поступления за 12 месяцев, млн ₽</p>
      ${bars(p.months, 'collected')}
    </div>
    <div class="two sec">
      <div><p class="eb">К перечислению вам, млн ₽</p>${bars(p.months, 'payout', { w: 320, h: 120 })}</div>
      <div><p class="eb">Заполняемость, %</p>${bars(p.months, 'occ', { w: 320, h: 120, fmt: (v) => String(v).replace('.', ',') })}</div>
    </div>
    <div class="sec">
      <p class="eb">Главное за ${q ? 'квартал' : 'месяц'}</p>
      <ul class="news">${news.map((n) => `<li><b>${esc(n.title)}</b><span>${esc(n.text)}</span><em>${esc(n.effect)}</em></li>`).join('')}</ul>
    </div>
  </div>
  ${foot(r, 1, pages)}
</section>
<section class="page">
  ${thin(r)}
  <div class="body">
    <p class="eb">Объекты</p>
    ${p.objects.map((o) => `<div class="obj">
      <div class="obj__h"><h3>${esc(o.title)}</h3><span>${esc(o.type)} · ${num(o.area)} м²</span></div>
      <div class="facts">
        <div><span>Поступило</span><b>${mln(o.collected)}</b><small>${pct(o.collectedYoY)}</small></div>
        <div><span>Заполняемость</span><b>${o.occ}%</b><small>${pp(o.occYoY)}</small></div>
        <div><span>Ставка</span><b>${num(o.rate)} ₽</b><small>${pct(o.rateYoY)}</small></div>
        <div><span>К перечислению</span><b>${mln(o.payout)}</b></div>
      </div>
      <table><thead><tr><th>Арендатор</th><th class="n">Площадь, м²</th><th>Доля в доходе</th></tr></thead>
      <tbody>${o.tenants.slice(0, 4).map((t) => `<tr><td>${esc(t.name)}</td><td class="n">${num(t.area)}</td><td><span class="share" style="width:${(t.share * 40).toFixed(1)}mm"></span>${Math.round(t.share * 100)}%</td></tr>`).join('')}</tbody></table>
      ${o.vacant.length ? `<p style="margin:3mm 0 0;font-size:9pt">Свободно: ${o.vacant.map((v) => `${esc(v.title)}, ${num(v.area)} м² — ${esc(v.status.toLowerCase())}`).join('; ')}</p>` : '<p style="margin:3mm 0 0;font-size:9pt" class="up">Свободных площадей нет</p>'}
    </div>`).join('')}
  </div>
  ${foot(r, 2, pages)}
</section>
<section class="page">
  ${thin(r)}
  <div class="body">
    <div class="sec">
      <p class="eb">Деньги ${q ? 'за квартал' : 'за месяц'}</p>
      <table>
        <tbody>
          <tr><td>Начислено арендаторам</td><td class="n">${num(charged)} ₽</td></tr>
          <tr><td>Поступило · собираемость ${(collected / charged * 100).toFixed(1).replace('.', ',')}%</td><td class="n">${num(collected)} ₽</td></tr>
          <tr><td>Вознаграждение управляющей компании · 7%</td><td class="n">−${num(fee)} ₽</td></tr>
          <tr><td>Эксплуатация объектов по утверждённой смете</td><td class="n">−${num(opex)} ₽</td></tr>
          <tr class="tot"><td>К перечислению собственнику</td><td class="n">${num(payout)} ₽</td></tr>
        </tbody>
      </table>
    </div>
    <div class="sec">
      <div>
        <p class="eb">План на ${q ? 'IV квартал' : 'следующий месяц'}</p>
        <ol class="plan">
          <li>Сдать блок 7 (953 м²): договор с ООО «Альфа-Склад» на согласовании</li>
          <li>Подготовить индексацию ставок с 1 января: +10,8 млн ₽ в год</li>
          <li>Ремонт кровли корпуса 2 до снега, без остановки арендатора</li>
          <li>Цель на конец года: заполняемость 97%, собираемость 99%</li>
        </ol>
      </div>
    </div>
    <div class="mgr">
      <div class="mgr__ph">ИФ</div>
      <div><b>${esc(D.MANAGER.name)}</b><span>${esc(D.MANAGER.role)} · ${esc(D.MANAGER.phone)} · Telegram</span></div>
    </div>
    <p class="demo" style="margin-top:6mm">Демо-отчёт: цифры условные, в рабочей версии формируется из CRM автоматически</p>
  </div>
  ${foot(r, 3, pages)}
</section>`;
}

const WEEK_PAID = { '2026-w40': 0.62, '2026-w41': 0.81, '2026-w42': 0.93, '2026-w43': 0.97 };
function pageWeek(r) {
  const p = D.portfolio(D.MONTHS.indexOf(r.period)), k = p.kpi;
  const paid = WEEK_PAID[r.id] || 0.97;
  const end = r.sent;
  const news = D.NEWS.filter((n) => n.date < end).slice(0, 3);
  return `
<section class="page">
  <div class="top">
    <div class="top__row">${logoWhite}<span class="top__tag">Сводка за неделю</span></div>
    <h1>${esc(r.title.replace('Сводка за неделю ', ''))}</h1>
    <p>${esc(D.OWNER.name)} · короткая сводка без операционных деталей · полный отчёт — раз в месяц</p>
  </div>
  <div class="body">
    <div class="sec">
      <p class="eb">Неделя в цифрах</p>
      <div class="kpi">
        <div class="hero"><span>Поступило с начала месяца</span><b>${mln(k.collected * paid)}</b><small>${Math.round(paid * 100)}% от начисленного</small></div>
        <div><span>Заполняемость</span><b>${String(k.occ).replace('.', ',')}%</b><small>${pp(k.occYoY)} за год</small></div>
        <div><span>Средняя ставка</span><b>${num(k.rate)} ₽/м²</b><small>${pct(k.rateYoY)} за год</small></div>
        <div><span>Собираемость</span><b>${(k.collection * 100).toFixed(1).replace('.', ',')}%</b><small>платежей за месяц</small></div>
      </div>
    </div>
    <div class="sec">
      <p class="eb">Что произошло</p>
      <ul class="news">${news.map((n) => `<li><b>${esc(n.title)}</b><span>${esc(n.text)}</span><em>${esc(n.effect)}</em></li>`).join('')}</ul>
    </div>
    <div class="mgr">
      <div class="mgr__ph">ИФ</div>
      <div><b>${esc(D.MANAGER.name)}</b><span>${esc(D.MANAGER.role)} · ${esc(D.MANAGER.phone)} · Telegram</span></div>
    </div>
    <p class="demo" style="margin-top:6mm">Демо-сводка: цифры условные</p>
  </div>
  ${foot(r, 1, 1)}
</section>`;
}

function reportHtml(r) {
  const cssUrl = 'file://' + path.join(brandDir, 'brand.css');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(r.title)} — Консалт Недвижимость</title>
<link rel="stylesheet" href="${cssUrl}"><style>${CSS}</style></head><body>${r.kind === 'week' ? pageWeek(r) : pageMonth(r)}</body></html>`;
}

module.exports = { reportHtml };
