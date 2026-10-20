// ===== Профили — общий фрагмент: подключается во все блоки CRM =====
// Данные — поля users (фото avatar, status_emoji, status_text, status_until, about), правятся в стандартном
// «Редактировать профиль» (scripts/setup_profiles.py). Здесь: фото вместо значка в кнопке профиля справа сверху,
// карточка в её меню (статус, почта, телефон), «Установить статус» и карточка любого человека.
// Для блоков: window.crmPhoto(id) → url|null, window.crmStatus(id) → {emoji,text,until}|null,
// window.crmStatusBadge(id) → html, window.crmProfileCard(id), событие window 'crm-profiles' после загрузки.
(function () {
  if (window.__crmProfInit) return;
  window.__crmProfInit = true;
  const api = ctx.api;
  const P = window.__crmProf = { byId: {}, me: null, at: 0 };
  const e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const GR = [['#7c5cff', '#5b8cff'], ['#3ba55c', '#2fd18f'], ['#ff6a5c', '#ff9a5c'], ['#3b9ce0', '#5cd0ff'], ['#f0a93b', '#ffd15c'], ['#e0539c', '#ff7ac7'], ['#2fb8b8', '#5ce0d8'], ['#8a6de0', '#b18aff']];
  const name = function (u) { return u ? (u.nickname || u.username || '#' + u.id) : ''; };
  const ini = function (s) { const p = String(s || '?').trim().split(/\s+/); return (p.length > 1 ? p[0][0] + p[1][0] : String(s).slice(0, 2)).toUpperCase(); };

  const st = document.createElement('style');
  st.id = 'crm-profile-style';
  st.textContent = `
    .crmp-ava { position:relative; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; flex:none; color:#fff; font-weight:700;
      background-size:cover !important; background-position:center !important; }
    .crmp-badge { position:absolute; right:-3px; bottom:-3px; width:46%; height:46%; min-width:15px; min-height:15px; border-radius:50%; background:#fff;
      display:flex; align-items:center; justify-content:center; font-size:max(10px, calc(1em * .9)); line-height:1; box-shadow:0 0 0 1.5px #fff, 0 1px 3px rgba(0,0,0,.25); }
    [data-testid=user-center-button].crmp-on .anticon-user { display:none; }
    [data-testid=user-center-button].crmp-on { display:inline-flex !important; align-items:center; height:46px; padding:0 9px !important; }
    .crmp-menu-card { display:flex; gap:12px; align-items:flex-start; padding:6px 2px; min-width:260px; max-width:320px; white-space:normal; cursor:default; color:#1f1f1f; }
    .crmp-menu-card b { font-size:15px; display:block; }
    .crmp-line { font-size:13px; color:#595959; margin-top:3px; word-break:break-word; }
    .crmp-line a { color:#1c2d58; }
    .crmp-st { margin-top:6px; padding:5px 9px; border-radius:8px; background:#f3f5fa; border:1px solid #e3e7f0; font-size:13px; color:#262626; }
    .crmp-st small { display:block; color:#8c8c8c; font-size:11.5px; margin-top:1px; }
    .crmp-mask { position:fixed; inset:0; background:rgba(15,23,42,.38); z-index:3100; display:flex; align-items:center; justify-content:center; }
    .crmp-dlg { background:#fff; border-radius:14px; box-shadow:0 18px 50px rgba(0,0,0,.28); width:440px; max-width:94vw; max-height:92vh; overflow:auto; padding:20px 22px; color:#1f1f1f; font-size:14px; }
    .crmp-dlg h3 { margin:0 0 14px; font-size:17px; }
    .crmp-in { display:flex; gap:8px; align-items:center; border:1px solid #c9d1df; border-radius:9px; padding:4px 6px; }
    .crmp-in input { border:0; outline:0; flex:1; font-size:14px; padding:5px 2px; min-width:0; }
    .crmp-emo-btn { width:36px; height:32px; border-radius:7px; border:1px solid #e3e7f0; background:#f8f9fb; font-size:18px; cursor:pointer; flex:none; }
    .crmp-emos { display:flex; flex-wrap:wrap; gap:4px; margin:10px 0 2px; }
    .crmp-emos button { width:34px; height:34px; border:1px solid transparent; background:none; border-radius:7px; font-size:19px; cursor:pointer; }
    .crmp-emos button:hover, .crmp-emos button.on { background:#eaf0ff; border-color:#b8c7f0; }
    .crmp-presets { margin:14px 0 4px; display:flex; flex-direction:column; gap:2px; }
    .crmp-presets button { text-align:left; border:0; background:none; padding:7px 8px; border-radius:7px; cursor:pointer; font-size:14px; color:#262626; }
    .crmp-presets button:hover { background:#f3f5fa; }
    .crmp-dlg label { display:block; font-size:13px; color:#595959; margin:14px 0 5px; font-weight:600; }
    .crmp-row { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
    .crmp-btn { border:1px solid #c9d1df; background:#fff; border-radius:8px; padding:7px 14px; cursor:pointer; font-size:14px; color:#262626; }
    .crmp-btn.pri { background:#1c2d58; border-color:#1c2d58; color:#fff; }
    .crmp-btn.del { margin-right:auto; color:#cf1322; border-color:#f3c2c2; }
    .crmp-card { text-align:center; }
    .crmp-card .crmp-ava { margin:4px auto 10px; }
    .crmp-card b { font-size:18px; display:block; }
    .crmp-card .crmp-st { text-align:left; margin:12px 0 4px; }
    .crmp-card .crmp-about { text-align:left; white-space:pre-wrap; font-size:13.5px; color:#262626; margin-top:12px; }
    .crmp-contacts { text-align:left; margin-top:12px; border-top:1px solid #eef1f6; padding-top:10px; }
    .crmp-contacts div { padding:4px 0; font-size:14px; }
    .crmp-contacts a { color:#1c2d58; }
    .crmp-contacts span { color:#8c8c8c; display:inline-block; width:70px; }
  `;
  document.head.appendChild(st);

  function active(u) {
    if (!u || !(u.status_emoji || u.status_text)) return null;
    if (u.status_until && new Date(u.status_until) < new Date()) return null;
    return { emoji: u.status_emoji || '', text: u.status_text || '', until: u.status_until || null };
  }
  function photo(u) { const a = u && u.avatar && u.avatar[0]; return a ? (a.thumbnailUrl || a.url) : null; }
  function untilText(s) {
    if (!s || !s.until) return '';
    const d = new Date(s.until), now = new Date();
    const t = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return 'до ' + (d.toDateString() === now.toDateString() ? t : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + (t === '23:59' ? '' : ' ' + t));
  }
  function avaHtml(u, size, label, card) {
    const id = u ? u.id : 0, g = GR[Math.abs(Number(id) || 0) % GR.length], ph = photo(u), s = active(u);
    const bg = ph ? 'url(&quot;' + e(ph) + '&quot;)' : 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
    return '<span class="crmp-ava"' + (card ? ' data-crmp-card="' + e(id) + '"' : '') + ' style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * .36) + 'px;background:' + bg + ';">'
      + (ph ? '' : e(ini(label || name(u)))) + (s && s.emoji ? '<span class="crmp-badge">' + e(s.emoji) + '</span>' : '') + '</span>';
  }
  function statusHtml(s) { return s ? '<div class="crmp-st">' + e(s.emoji) + ' ' + e(s.text) + (s.until ? '<small>' + e(untilText(s)) + '</small>' : '') + '</div>' : ''; }
  function contacts(u) {
    return '<div class="crmp-line">' + (u.email ? '✉️ <a href="mailto:' + e(u.email) + '">' + e(u.email) + '</a>' : '✉️ почта не указана') + '</div>'
      + '<div class="crmp-line">' + (u.phone ? '📞 <a href="tel:' + e(String(u.phone).replace(/[^\d+]/g, '')) + '">' + e(u.phone) + '</a>' : '📞 телефон не указан') + '</div>';
  }

  async function load() {
    try {
      if (!P.me) { const r = await api.request({ url: 'auth:check' }); P.me = (r.data && r.data.data) || null; }
      const r = await api.request({ url: 'users:list', params: { pageSize: 500, appends: ['avatar'],
        fields: ['id', 'nickname', 'username', 'email', 'phone', 'status_emoji', 'status_text', 'status_until', 'about'] } });
      const m = {};
      ((r.data && r.data.data) || []).forEach(function (u) { m[u.id] = u; });
      P.byId = m; P.at = Date.now();
      const evt = document.createEvent('Event'); evt.initEvent('crm-profiles', false, false); window.dispatchEvent(evt);  // new Event() в песочнице блоков нет
    } catch (x) { /* нет прав на список — остаются инициалы */ }
  }
  window.crmPhoto = function (id) { return photo(P.byId[id]); };
  window.crmStatus = function (id) { return active(P.byId[id]); };
  window.crmStatusBadge = function (id) { const s = active(P.byId[id]); return s && s.emoji ? '<span class="crmp-badge">' + e(s.emoji) + '</span>' : ''; };
  window.crmAvatar = function (id, size, label, card) { return avaHtml(P.byId[id] || { id: id }, size || 32, label, card); };

  function modal(html) {
    const m = document.createElement('div');
    m.className = 'crmp-mask';
    m.innerHTML = '<div class="crmp-dlg">' + html + '</div>';
    m.addEventListener('mousedown', function (ev) { if (ev.target === m) m.remove(); });
    document.body.appendChild(m);
    return m;
  }

  window.crmProfileCard = function (id) {
    const u = P.byId[id];
    if (!u) return;
    const m = modal('<div class="crmp-card">' + avaHtml(u, 96) + '<b>' + e(name(u)) + '</b>' + statusHtml(active(u))
      + (u.about ? '<div class="crmp-about">' + e(u.about) + '</div>' : '')
      + '<div class="crmp-contacts"><div><span>Почта</span>' + (u.email ? '<a href="mailto:' + e(u.email) + '">' + e(u.email) + '</a>' : '—') + '</div>'
      + '<div><span>Телефон</span>' + (u.phone ? '<a href="tel:' + e(String(u.phone).replace(/[^\d+]/g, '')) + '">' + e(u.phone) + '</a>' : '—') + '</div></div>'
      + '<div class="crmp-row"><button class="crmp-btn" data-x>Закрыть</button></div></div>');
    m.querySelector('[data-x]').onclick = function () { m.remove(); };
  };

  const EMOJI = ['💬', '🏠', '🏢', '🚗', '📅', '🍽️', '☕', '🤒', '🏖️', '✈️', '🎯', '🔥', '✅', '⏳', '🎧', '📞', '🧾', '🔧', '🎉', '😊', '😴', '🤝', '📌', '🚫'];
  const PRESETS = [['📅', 'На встрече', 1], ['🚗', 'На объекте', 'today'], ['🍽️', 'Обед', 1], ['🏠', 'Работаю удалённо', 'today'], ['🤒', 'Болею', 'today'], ['🏖️', 'В отпуске', '']];
  const UNTIL = [['', 'Не сбрасывать'], ['0.5', '30 минут'], ['1', '1 час'], ['4', '4 часа'], ['today', 'Сегодня'], ['week', 'Эта неделя']];
  function untilDate(v) {
    if (!v) return null;
    const d = new Date();
    if (v === 'today') { d.setHours(23, 59, 0, 0); return d.toISOString(); }
    if (v === 'week') { d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); d.setHours(23, 59, 0, 0); return d.toISOString(); }
    return new Date(Date.now() + Number(v) * 3600e3).toISOString();
  }
  function openStatus() {
    const me = P.byId[P.me && P.me.id] || P.me || {};
    const cur = active(me) || { emoji: '', text: '' };
    const m = modal('<h3>Статус</h3>'
      + '<div class="crmp-in"><button class="crmp-emo-btn" data-emo-cur>' + e(cur.emoji || '😊') + '</button><input maxlength="80" placeholder="Что у вас сейчас? Например: на объекте до 15:00" value="' + e(cur.text) + '"></div>'
      + '<div class="crmp-emos">' + EMOJI.map(function (x) { return '<button data-emo="' + x + '" class="' + (x === cur.emoji ? 'on' : '') + '">' + x + '</button>'; }).join('') + '</div>'
      + '<div class="crmp-presets">' + PRESETS.map(function (p, i) { return '<button data-pre="' + i + '">' + p[0] + '&nbsp; ' + e(p[1]) + '</button>'; }).join('') + '</div>'
      + '<label>Сбросить</label><select data-until>' + UNTIL.map(function (u) { return '<option value="' + u[0] + '">' + u[1] + '</option>'; }).join('') + '</select>'
      + '<div class="crmp-row">' + (active(me) ? '<button class="crmp-btn del" data-clear>Убрать статус</button>' : '') + '<button class="crmp-btn" data-x>Отмена</button><button class="crmp-btn pri" data-ok>Сохранить</button></div>');
    let emo = cur.emoji;
    const inp = m.querySelector('input'), sel = m.querySelector('[data-until]'), cb = m.querySelector('[data-emo-cur]');
    const pick = function (x) { emo = x; cb.textContent = x || '😊'; m.querySelectorAll('[data-emo]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-emo') === x); }); };
    m.querySelectorAll('[data-emo]').forEach(function (b) { b.onclick = function () { pick(emo === b.getAttribute('data-emo') ? '' : b.getAttribute('data-emo')); }; });
    cb.onclick = function () { pick(''); };
    m.querySelectorAll('[data-pre]').forEach(function (b) { b.onclick = function () { const p = PRESETS[b.getAttribute('data-pre')]; pick(p[0]); inp.value = p[1]; sel.value = String(p[2]); }; });
    m.querySelector('[data-x]').onclick = function () { m.remove(); };
    const save = async function (vals) {
      try {
        await api.request({ url: 'users:updateProfile', method: 'post', data: Object.assign({ username: P.me.username }, vals) });
        m.remove(); await load(); decorate(true);
      } catch (x) { alert('Не удалось сохранить статус: ' + ((x.response && x.response.data && x.response.data.errors && x.response.data.errors[0].message) || x.message)); }
    };
    const clr = m.querySelector('[data-clear]');
    if (clr) clr.onclick = function () { save({ status_emoji: null, status_text: null, status_until: null }); };
    m.querySelector('[data-ok]').onclick = function () {
      const t = inp.value.trim();
      if (!t && !emo) return save({ status_emoji: null, status_text: null, status_until: null });
      save({ status_emoji: emo || null, status_text: t || null, status_until: untilDate(sel.value) });
    };
    setTimeout(function () { inp.focus(); }, 30);
  }
  window.crmSetStatus = openStatus;

  // кнопка профиля и её меню — NocoBase перерисовывает шапку сам, поэтому проверка по таймеру (MutationObserver в блоках нельзя)
  let lastKey = '';
  function decorate(force) {
    const me = P.me && (P.byId[P.me.id] || P.me);
    if (!me) return;
    const key = me.id + '|' + photo(me) + '|' + JSON.stringify(active(me));
    const btn = document.querySelector('[data-testid=user-center-button]');
    if (btn && (force || key !== lastKey || !btn.querySelector('.crmp-ava'))) {
      btn.classList.add('crmp-on');
      const old = btn.querySelector('.crmp-ava'); if (old) old.remove();
      btn.insertAdjacentHTML('beforeend', avaHtml(me, 28));
      const s = active(me);
      btn.title = name(me) + (s ? ' — ' + (s.emoji + ' ' + s.text).trim() : '');
      lastKey = key;
    }
    const li = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) [data-testid=schema-settings-menu] li[title=nickname]');
    if (li && !li.querySelector('.crmp-menu-card')) {
      const t = li.querySelector('.ant-dropdown-menu-title-content') || li;
      t.innerHTML = '<div class="crmp-menu-card">' + avaHtml(me, 48) + '<div style="min-width:0;flex:1;"><b>' + e(name(me)) + '</b>' + contacts(me) + statusHtml(active(me)) + '</div></div>';
      const set = document.createElement('li');
      set.className = 'ant-dropdown-menu-item';
      set.setAttribute('role', 'menuitem');
      set.innerHTML = '<span class="ant-dropdown-menu-title-content">' + (active(me) ? '✏️ Изменить статус' : '😊 Установить статус') + '</span>';
      set.addEventListener('click', function () { const dd = li.closest('.ant-dropdown'); if (dd) dd.classList.add('ant-dropdown-hidden'); openStatus(); });
      li.parentNode.insertBefore(set, li.nextSibling);
    }
  }
  load().then(function () { decorate(true); });
  setInterval(decorate, 700);
  setInterval(load, 60000);
  // аватар с data-crmp-card (crmAvatar(id, size, label, true)) открывает карточку человека
  document.addEventListener('click', function (ev) {
    const a = ev.target.closest && ev.target.closest('[data-crmp-card]');
    if (a && !a.closest('.crmp-dlg')) { ev.stopPropagation(); window.crmProfileCard(Number(a.getAttribute('data-crmp-card'))); }
  }, true);
})();
// ===== конец фрагмента профилей =====
