// ===== Настройки CRM — общий фрагмент. При выкладке подставляется в блок вместо строки «// @include src/_crm-config.js» =====
// Здесь — каталог всего, что администратор меняет на странице «Настройки CRM», со значениями по умолчанию.
// Изменения хранятся в коллекции crm_config (key → value); нет записи — работает значение отсюда, поэтому интерфейс без настроек не меняется.
// Типы:
//   list   — список вариантов (типы, причины ожидания…). Новые записи берут варианты отсюда; старые записи хранят свой текст как есть.
//            fixed: N — первые N вариантов зашиты в логику (их нельзя переименовать, удалить или переставить).
//   labels — подписи для ключей, на которых держится логика (статусы, срочность): ключи постоянные, меняются только поля из fields.
//   number, text — одно значение.
const CRM_SETTINGS = {
  // ---- заявки по объектам ----
  'requests.kinds': { m: 'Заявки', t: 'Типы заявок', type: 'list',
    v: ['Ремонт и эксплуатация', 'Вопрос арендатора', 'Расторжение и выезд', 'Платёж, долг, штраф', 'Проверка, пожарная безопасность', 'Коммуналка, счётчики', 'Прочее'] },
  'requests.wait': { m: 'Заявки', t: 'Чего ждёт заявка (варианты)', type: 'list', v: ['ответа арендатора', 'подрядчика', 'оплаты', 'согласования руководства', 'другое'] },
  'requests.urgency': { m: 'Заявки', t: 'Срочность и сроки', type: 'labels', fields: [['l', 'Название'], ['d', 'Срок, рабочих дней', 'num'], ['hint', 'Подсказка в форме'], ['c', 'Цвет', 'color']],
    v: { normal: { l: 'Обычная', d: 5, c: '#595959', hint: '5 рабочих дней' }, urgent: { l: 'Срочно', d: 1, c: '#d46b08', hint: '1 рабочий день' },
      emergency: { l: 'Авария', d: 0, c: '#cf1322', hint: 'сегодня, сразу уведомление старшему управляющему' } } },
  'requests.status': { m: 'Заявки', t: 'Статусы', type: 'labels', fields: [['l', 'Название'], ['c', 'Цвет', 'color']],
    v: { new: { l: 'Новая', c: '#1c2d58' }, in_work: { l: 'В работе', c: '#d48806' }, waiting: { l: 'Ждёт', c: '#722ed1' },
      done: { l: 'Выполнена — на проверке', c: '#13a8a8' }, closed: { l: 'Закрыта', c: '#389e0d' }, cancelled: { l: 'Отменена', c: '#8c8c8c' } } },
  'requests.closedDays': { m: 'Заявки', t: 'Закрытые на доске: за сколько последних дней', type: 'number', v: 30 },
  // ---- задачи ----
  'tasks.kinds': { m: 'Задачи', t: 'Типы задач', type: 'list', v: ['Общая', 'Объект и арендаторы', 'Финансы и платежи', 'Документы', 'Кадры'] },
  'tasks.wait': { m: 'Задачи', t: 'Чего ждёт задача (варианты)', type: 'list', v: ['ответа коллеги', 'ответа арендатора', 'подрядчика', 'оплаты', 'согласования руководства', 'документов', 'другое'] },
  'tasks.hrTemplates': { m: 'Задачи', t: 'Шаблоны кадровых задач', type: 'list', v: ['Отпуск', 'Больничный', 'Приём на работу', 'Увольнение', 'Перевод / смена должности', 'Командировка', 'Отгул'] },
  'tasks.urgency': { m: 'Задачи', t: 'Срочность и сроки', type: 'labels', fields: [['l', 'Название'], ['d', 'Срок, рабочих дней', 'num'], ['c', 'Цвет', 'color']],
    v: { normal: { l: 'Обычная', d: 3, c: '#595959' }, urgent: { l: 'Срочно', d: 1, c: '#d46b08' }, asap: { l: 'Горит', d: 0, c: '#cf1322' } } },
  'tasks.status': { m: 'Задачи', t: 'Статусы', type: 'labels', fields: [['l', 'Название'], ['c', 'Цвет', 'color']],
    v: { new: { l: 'Новая', c: '#1c2d58' }, in_work: { l: 'В работе', c: '#d48806' }, waiting: { l: 'Ждёт', c: '#722ed1' },
      done: { l: 'На проверке', c: '#13a8a8' }, closed: { l: 'Закрыта', c: '#389e0d' }, cancelled: { l: 'Отменена', c: '#8c8c8c' } } },
  'tasks.closedDays': { m: 'Задачи', t: 'Закрытые на доске: за сколько последних дней', type: 'number', v: 30 },
  // ---- общее ----
  'org.hrDept': { m: 'Компания', t: 'Отдел кадров (его сотрудники правят кадровые данные)', type: 'dept', v: 'HR служба персонала' }
};
// загрузка изменений: один запрос на страницу, кэш 60 с (после сохранения на странице настроек кэш сбрасывается)
async function crmCfgLoad() {
  const c = window.__crmCfg;
  if (c && Date.now() - c.at < 60000) return c.p;
  const p = ctx.api.resource('crm_config').list({ paginate: false, fields: ['key', 'value'] })
    .then(function(r) { const d = (r && r.data && r.data.data) || []; const o = {}; d.forEach(function(x) { if (x.value != null) o[x.key] = x.value; }); return o; })
    .catch(function() { return {}; });   // нет коллекции или прав — значения по умолчанию
  window.__crmCfg = { at: Date.now(), p: p };
  return p;
}
const CRM_CFG = await crmCfgLoad();
// значение настройки: изменённое администратором поверх значения по умолчанию
function cfg(key) {
  const s = CRM_SETTINGS[key];
  if (!s) throw new Error('Нет настройки ' + key);
  return crmCfgValue(s, CRM_CFG[key]);
}
function crmCfgValue(s, v) {
  if (v == null || v === '') return s.v;
  if (s.type === 'labels') {   // только известные ключи, только поля из описания
    const out = {};
    Object.keys(s.v).forEach(function(k) {
      const d = s.v[k], o = v[k];
      if (d && typeof d === 'object') {
        out[k] = Object.assign({}, d);
        if (o && typeof o === 'object') s.fields.forEach(function(f) { if (o[f[0]] != null && o[f[0]] !== '') out[k][f[0]] = f[2] === 'num' ? Number(o[f[0]]) : o[f[0]]; });
      } else out[k] = (typeof o === 'string' && o) ? o : d;
    });
    return out;
  }
  if (s.type === 'list') {
    if (!Array.isArray(v)) return s.v;
    const fixed = s.v.slice(0, s.fixed || 0), rest = v.filter(function(x) { return typeof x === 'string' && x.trim() && fixed.indexOf(x) === -1; });
    return fixed.concat(rest).length ? fixed.concat(rest) : s.v;
  }
  if (s.type === 'number') return isNaN(Number(v)) ? s.v : Number(v);
  return v;
}
// ===== конец общего фрагмента настроек =====
