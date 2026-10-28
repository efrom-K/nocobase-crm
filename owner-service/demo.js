// Демо-данные кабинета собственника. Позже их заменят выборки из CRM (договоры, начисления, поступления) — формат ответа /api/me тот же.
'use strict';

// 13 месяцев: октябрь 2025 (база для «к прошлому году») … октябрь 2026
const MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const monthName = (ym, cap = true) => { const s = MONTH_NAMES[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4); return cap ? s[0].toUpperCase() + s.slice(1) : s; };
const monthShort = (ym) => MONTH_NAMES[+ym.slice(5) - 1].slice(0, 3);

const OBJECTS = [
  {
    id: 'shchelkovo', title: 'Щёлково, Московская', address: 'г. Щёлково, ул. Московская, д. 70А', type: 'Производственный комплекс', area: 22803,
    occ: [81, 82, 83, 84, 84, 86, 88, 89, 90, 91, 92, 93, 94], rate: [535, 540, 540, 545, 550, 560, 565, 570, 580, 585, 590, 595, 600], opex: 900000,
    // [арендатор, м², договор до, долг ₽, дней просрочки]
    tenants: [['ООО «СеверПласт»', 6800, '2031-09', 0, 0], ['ООО «Мебельная фабрика»', 5100, '2027-03', 0, 0], ['ООО «Логистик Плюс»', 4200, '2026-12', 340000, 12], ['ООО «ТрансСервис»', 2900, '2028-06', 0, 0], ['ООО «ПромКомплект»', 2080, '2027-01', 125000, 5], ['ИП Карпов А. В.', 350, '2027-08', 0, 0]],
    vacant: [{ title: 'Блок 7 · 2 этаж', area: 953, rate: 540, status: 'Переговоры', note: 'ООО «Альфа-Склад», договор на согласовании' }, { title: 'Блок 3 · 1 этаж', area: 420, rate: 650, status: 'В рекламе', note: '3 показа за неделю' }],
  },
  {
    id: 'mytishchi', title: 'Мытищи, Фабричная', address: 'г. Мытищи, ул. Фабричная, д. 17Б', type: 'Складской комплекс', area: 8982,
    occ: [89, 90, 90, 92, 93, 93, 95, 96, 97, 98, 100, 100, 100], rate: [555, 560, 565, 570, 575, 585, 590, 600, 610, 620, 630, 635, 640], opex: 350000,
    tenants: [['ООО «Сладкий дом»', 3600, '2029-02', 0, 0], ['ООО «Автозапчасть-М»', 2400, '2027-02', 0, 0], ['ООО «Эко-Упаковка»', 1800, '2028-11', 0, 0], ['ИП Семёнова О. Л.', 1182, '2026-12', 0, 0]],
    vacant: [],
  },
];
const COLLECT = [0.965, 0.968, 0.97, 0.972, 0.975, 0.978, 0.98, 0.982, 0.984, 0.985, 0.986, 0.987, 0.988];
const FEE = 0.07;   // вознаграждение УК — от собранной аренды
const PLAN_K = 1.043;   // демо: факт выше бюджета года на 4,3%

// помесячные цифры объекта: начислено, поступило, к перечислению собственнику
function series(o) {
  return MONTHS.map((m, i) => {
    const charged = Math.round(o.area * o.occ[i] / 100 * o.rate[i]);
    const collected = Math.round(charged * COLLECT[i]);
    return { month: m, occ: o.occ[i], rate: o.rate[i], charged, collected, payout: Math.round(collected * (1 - FEE) - o.opex) };
  });
}
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);

// портфель на месяц `upTo` (индекс в MONTHS): KPI, 12 месяцев для графиков, объекты
function portfolio(upTo = MONTHS.length - 1) {
  const objs = OBJECTS.map((o) => ({ ...o, s: series(o).slice(0, upTo + 1) }));
  const total = (i) => {
    const rows = objs.map((o) => o.s[i]);
    const area = sum(objs, 'area');
    return { month: MONTHS[i], charged: sum(rows, 'charged'), collected: sum(rows, 'collected'), payout: sum(rows, 'payout'),
      occ: Math.round(objs.reduce((s, o) => s + o.area * o.s[i].occ, 0) / area * 10) / 10,
      rate: Math.round(objs.reduce((s, o) => s + o.area * o.s[i].occ * o.s[i].rate, 0) / objs.reduce((s, o) => s + o.area * o.s[i].occ, 0)) };
  };
  const months = MONTHS.slice(0, upTo + 1).map((_, i) => total(i));
  const cur = months[upTo], prev = months[upTo - 1], yearAgo = upTo >= 12 ? months[upTo - 12] : months[0];
  const year = MONTHS[upTo].slice(0, 4);
  const ytd = months.filter((m) => m.month.startsWith(year));
  return {
    month: MONTHS[upTo], monthName: monthName(MONTHS[upTo]),
    kpi: {
      collected: cur.collected, collectedYoY: cur.collected / yearAgo.collected - 1, collectedMoM: cur.collected / prev.collected - 1,
      payout: cur.payout, payoutYtd: sum(ytd, 'payout'), collectedYtd: sum(ytd, 'collected'),
      occ: cur.occ, occYoY: cur.occ - yearAgo.occ, rate: cur.rate, rateYoY: cur.rate / yearAgo.rate - 1,
      collection: cur.collected / cur.charged, area: sum(objs, 'area'),
      // куда уходят деньги месяца: начислено → поступило → вознаграждение УК → эксплуатация → вам
      charged: cur.charged, fee: Math.round(cur.collected * FEE), opex: sum(objs, 'opex'),
      // план/факт года: бюджет утверждается с собственником в декабре; прогноз — факт + текущий месяц × оставшиеся
      planYtd: Math.round(sum(ytd, 'payout') / PLAN_K), planYear: Math.round(sum(ytd, 'payout') / PLAN_K / ytd.length * 12),
      forecastYear: sum(ytd, 'payout') + cur.payout * (12 - ytd.length),
    },
    months: months.slice(-12),
    objects: objs.map((o) => {
      const c = o.s[upTo], y = upTo >= 12 ? o.s[upTo - 12] : o.s[0];
      const occupied = o.tenants.reduce((s, t) => s + t[1], 0);
      return { id: o.id, title: o.title, address: o.address, type: o.type, area: o.area, occ: c.occ, occYoY: c.occ - y.occ, rate: c.rate, rateYoY: c.rate / y.rate - 1,
        collected: c.collected, collectedYoY: c.collected / y.collected - 1, payout: c.payout, months: o.s.slice(-12),
        tenants: o.tenants.map(([name, area, until, debt, debtDays]) => ({ name, area, share: area / occupied, rate: c.rate, until, debt, debtDays })), vacant: o.vacant };
    }),
  };
}

const OWNER = { name: 'ООО «Пример Инвест»', person: 'Андрей Сергеевич', email: 'demo@example.ru' };
const MANAGER = { name: 'Имя Фамилия', role: 'Главный управляющий', phone: '+7 495 797-77-42', phoneHref: 'tel:+74957977742', telegram: 'https://t.me/+79161477144' };

// работы на объектах: ведём сами в рамках годового бюджета эксплуатации, собственник только видит
const WORKS_BUDGET = 4200000;
const WORKS = [
  { obj: 'shchelkovo', title: 'Замена ворот блока 3', cost: 240000, status: 'Запланировано', date: '2026-11-05', note: 'Ворота закрываются неплотно — заменим до холодов, подрядчик выбран по трём предложениям' },
  { obj: 'shchelkovo', title: 'Ремонт кровли корпуса 2', cost: 1850000, status: 'В работе', date: '2026-11-20', note: 'Выполнено 60%, сдача в срок' },
  { obj: 'shchelkovo', title: 'Плановое ТО инженерных систем', cost: 180000, status: 'Выполнено', date: '2026-10-10', note: 'Ежеквартально, замечаний нет' },
  { obj: 'mytishchi', title: 'Асфальтирование подъезда', cost: 640000, status: 'Выполнено', date: '2026-08-12', note: 'В срок и в рамках сметы; ставка выросла на 15 ₽/м²' },
  { obj: 'mytishchi', title: 'Ремонт освещения на рампе', cost: 58000, status: 'Выполнено', date: '2026-09-30', note: 'По заявке арендатора, закрыто за 2 дня' },
];

// новости месяца — без операционки, только то, что влияет на доход
const NEWS = [
  { date: '2026-10-21', title: 'Сдан блок 3А · 380 м²', text: 'Новый арендатор на 3 года, ставка 660 ₽/м²', effect: '+3,0 млн ₽ в год' },
  { date: '2026-10-14', title: 'Индексация по 4 договорам', text: 'Ставки приведены к рынку с 1 ноября', effect: '+1,1 млн ₽ в год' },
  { date: '2026-10-03', title: 'Задолженность снижена до 1,2%', text: 'Взыскано 1,8 млн ₽ просроченных платежей', effect: '+1,8 млн ₽' },
  { date: '2026-09-25', title: 'Продлён договор с ООО «СеверПласт»', text: '5 лет, ставка выросла на 8%', effect: '+3,3 млн ₽ в год' },
  { date: '2026-09-18', title: 'Мытищи заполнены на 100%', text: 'Последний свободный блок сдан на 5 лет', effect: '+2,4 млн ₽ в год' },
  { date: '2026-09-09', title: 'Собираемость 98,7% — лучший месяц года', text: 'Просрочек дольше 30 дней нет', effect: '+0,3 млн ₽' },
  { date: '2026-08-27', title: 'Сдан блок 5 · 610 м²', text: 'Производство, договор на 4 года', effect: '+4,4 млн ₽ в год' },
  { date: '2026-08-12', title: 'Подъезд в Мытищах заасфальтирован', text: 'В срок и в рамках сметы 640 тыс. ₽', effect: 'Ставка +15 ₽/м²' },
  { date: '2026-07-21', title: 'Индексация по 3 договорам', text: 'Ставки приведены к рынку с 1 августа', effect: '+0,9 млн ₽ в год' },
  { date: '2026-07-04', title: 'Сдан блок 2 · 520 м²', text: 'Склад, договор на 3 года', effect: '+3,6 млн ₽ в год' },
  { date: '2026-06-16', title: 'Взыскан долг ООО «Вектор»', text: 'Арендатор съехал, долг погашен полностью', effect: '+0,7 млн ₽' },
  { date: '2026-05-19', title: 'Сдан блок 9 · 340 м²', text: 'Сервис, договор на 2 года', effect: '+2,3 млн ₽ в год' },
];

// отчёты: ежемесячные, квартальные и короткие еженедельные сводки
const REPORTS = [
  ...['2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05'].map((m) => ({ id: m + '-month', kind: 'month', title: 'Отчёт за ' + monthName(m, false), period: m, sent: m === '2026-10' ? '2026-11-03' : nextMonth5(m) })),
  { id: '2026-q3', kind: 'quarter', title: 'Отчёт за III квартал 2026', period: '2026-09', sent: '2026-10-07' },
  ...[['2026-w43', '20–26 октября', '2026-10-27'], ['2026-w42', '13–19 октября', '2026-10-20'], ['2026-w41', '6–12 октября', '2026-10-13'], ['2026-w40', '29 сентября – 5 октября', '2026-10-06']]
    .map(([id, title, sent]) => ({ id, kind: 'week', title: 'Сводка за неделю ' + title, period: '2026-10', sent })),
];
function nextMonth5(m) { const [y, mm] = m.split('-').map(Number); const d = new Date(Date.UTC(y, mm, 5)); return d.toISOString().slice(0, 10); }
// отчёт за октябрь собирается 3 ноября: в демо «сегодня» 27 октября, поэтому показываем только уже отправленные
const TODAY = '2026-10-27';
const sentReports = () => REPORTS.filter((r) => r.sent <= TODAY);

module.exports = { MONTHS, MONTH_GEN, monthName, monthShort, OBJECTS, portfolio, OWNER, MANAGER, NEWS, WORKS, WORKS_BUDGET, REPORTS, sentReports, TODAY };
