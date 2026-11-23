// ===== Профили — общий фрагмент: подключается во все блоки CRM =====
// Данные — поля users (фото avatar, status_emoji, status_text, status_until, about) + nickname/phone/email; сохраняет родной
// users:updateProfile (принимает только поля из формы «Редактировать профиль», см. scripts/setup_profiles.py; username обязателен).
// Здесь: фото вместо значка в кнопке профиля справа сверху, плашка профиля в её меню, «Мой профиль» в стиле Telegram
// (смена фото, правка на месте), статус (эмодзи + текст + срок), карточка любого человека.
// Для блоков: window.crmPhoto(id) → url|null, window.crmStatus(id) → {emoji,text,until}|null, window.crmAvatar(id, size, label, card),
// window.crmProfileCard(id), window.crmSetStatus(); событие window 'crm-profiles' после загрузки.
(function () {
  if (window.__crmProfInit) return;
  window.__crmProfInit = true;
  const api = ctx.api;
  const P = window.__crmProf = { byId: {}, me: null, at: 0 };
  const e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const GR = [['#7c5cff', '#5b8cff'], ['#3ba55c', '#2fd18f'], ['#ff6a5c', '#ff9a5c'], ['#3b9ce0', '#5cd0ff'], ['#f0a93b', '#ffd15c'], ['#e0539c', '#ff7ac7'], ['#2fb8b8', '#5ce0d8'], ['#8a6de0', '#b18aff']];
  const grad = function (id) { return GR[Math.abs(Number(id) || 0) % GR.length]; };
  const name = function (u) { return u ? (u.nickname || u.username || '#' + u.id) : ''; };
  const ini = function (s) { const p = String(s || '?').trim().split(/\s+/); return (p.length > 1 ? p[0][0] + p[1][0] : String(s).slice(0, 2)).toUpperCase(); };
  const tel = function (p) { return String(p || '').replace(/[^\d+]/g, ''); };
  // телефон по маске: +7 (999) 123-45-67 (российские 10/11 цифр), иначе как ввели
  const fmtPhone = function (p) {
    let d = String(p || '').replace(/\D/g, '');
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    if (d.length !== 10) return String(p || '');
    return '+7 (' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 8) + '-' + d.slice(8);
  };
  const maskPhone = function (inp) {
    let d = inp.value.replace(/\D/g, '');
    if (!d) { inp.value = ''; return; }
    if (d[0] === '8' || d[0] === '7') d = d.slice(1);
    d = d.slice(0, 10);
    let v = '+7';
    if (d.length) v += ' (' + d.slice(0, 3);
    if (d.length >= 3) v += ')';
    if (d.length > 3) v += ' ' + d.slice(3, 6);
    if (d.length > 6) v += '-' + d.slice(6, 8);
    if (d.length > 8) v += '-' + d.slice(8, 10);
    inp.value = v;
  };
  // шапка профиля: готовые градиенты (users.cover_style) или своё фото (users.cover)
  const COVERS = { ocean: ['#2f6fed', '#5cd0ff'], night: ['#1c2d58', '#5b3fa8'], sunset: ['#ff6a5c', '#ffb35c'], forest: ['#1f7a4d', '#7fd18f'],
    berry: ['#b0306a', '#ff7ac7'], sand: ['#c08a3e', '#ffd99a'], graphite: ['#2b2f3a', '#6b7385'], mint: ['#13a8a8', '#9ef0d8'] };
  const coverBg = function (u) {
    const c = u && u.cover && u.cover[0];
    if (c) return 'url(&quot;' + e(c.url) + '&quot;) center/cover';
    const g = COVERS[u && u.cover_style] || grad(u && u.id);
    return 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
  };
  const link = function (v, kind) {
    v = String(v || '').trim();
    if (kind === 'telegram') { const h = v.replace(/^@|^https?:\/\/t\.me\//, ''); return { href: 'https://t.me/' + h, text: '@' + h }; }
    if (kind === 'github') { const h = v.replace(/^@|^https?:\/\/github\.com\//, '').replace(/\/$/, ''); return { href: 'https://github.com/' + h, text: h }; }
    return { href: /^https?:/.test(v) ? v : 'https://' + v, text: v.replace(/^https?:\/\//, '').replace(/\/$/, '') };
  };
  const ICON = {
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    smile: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    tg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>',
    gh: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.6 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22"/></svg>',
    web: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
    brief: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
  };

  const st = document.createElement('style');
  st.id = 'crm-profile-style';
  st.textContent = `
    .crmp-ava { position:relative; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; flex:none; color:#fff; font-weight:600;
      background-size:cover !important; background-position:center !important; letter-spacing:.02em; }
    .crmp-badge { position:absolute; right:-2px; bottom:-2px; width:44%; height:44%; min-width:16px; min-height:16px; border-radius:50%; background:#fff;
      display:flex; align-items:center; justify-content:center; font-size:max(10px, calc(1em * .85)); line-height:1; box-shadow:0 1px 4px rgba(0,0,0,.22); }
    [data-testid=user-center-button].crmp-on .anticon-user { display:none; }
    [data-testid=user-center-button].crmp-on { display:inline-flex !important; align-items:center; height:46px; padding:0 9px !important; }
    [data-testid=user-center-button].crmp-on .crmp-ava { box-shadow:0 0 0 2px rgba(255,255,255,.55); transition:box-shadow .15s; }
    [data-testid=user-center-button].crmp-on:hover .crmp-ava { box-shadow:0 0 0 2px #fff; }

    /* плашка в меню профиля */
    li.crmp-li { padding:0 !important; margin:-4px -4px 4px !important; background:none !important; cursor:pointer !important; }
    li.crmp-li .ant-dropdown-menu-title-content { display:block; }
    .crmp-head { display:flex; gap:12px; align-items:center; padding:14px 14px 14px 16px; min-width:290px; border-radius:8px 8px 0 0; color:#fff; position:relative; overflow:hidden; }
    .crmp-head::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.3)); pointer-events:none; }
    .crmp-head > * { position:relative; z-index:1; }
    .crmp-head .crmp-ava { box-shadow:0 0 0 2.5px rgba(255,255,255,.85); }
    .crmp-head-t { flex:1; min-width:0; }
    .crmp-head-t b { display:block; font-size:16px; font-weight:600; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-shadow:0 1px 2px rgba(0,0,0,.18); }
    .crmp-head-t div { font-size:12.5px; opacity:.92; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .crmp-head-st { display:inline-block; max-width:100%; margin-top:6px; padding:2px 9px; border-radius:20px; background:rgba(255,255,255,.22); font-size:12.5px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; backdrop-filter:blur(4px); }
    .crmp-head svg { opacity:.85; flex:none; }
    li.crmp-li-st .ant-dropdown-menu-title-content { display:flex; align-items:center; gap:10px; }
    li.crmp-li-st svg { color:#5b6478; width:18px; height:18px; }

    /* окно */
    .crmp-mask { position:fixed; inset:0; background:rgba(10,16,30,.45); backdrop-filter:blur(3px); z-index:3100; display:flex; align-items:center; justify-content:center;
      animation:crmpFade .16s ease-out; }
    @keyframes crmpFade { from { opacity:0; } to { opacity:1; } }
    @keyframes crmpPop { from { transform:scale(.96) translateY(8px); opacity:0; } to { transform:none; opacity:1; } }
    .crmp-dlg { background:#fff; border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,.3); width:400px; max-width:94vw; max-height:92vh; overflow:auto; color:#1f2433;
      font-size:14px; animation:crmpPop .2s cubic-bezier(.2,.9,.3,1.2); position:relative; }
    .crmp-x { position:absolute; top:12px; right:12px; z-index:3; width:34px; height:34px; border-radius:50%; border:0; cursor:pointer; display:flex; align-items:center;
      justify-content:center; background:rgba(0,0,0,.22); color:#fff; transition:background .15s; }
    .crmp-x:hover { background:rgba(0,0,0,.38); }

    /* профиль */
    .crmp-cover { height:132px; position:relative; transition:background .3s; }
    .crmp-sub { display:flex; justify-content:center; align-items:center; gap:6px; flex-wrap:wrap; margin-top:4px; color:#3a4256; font-size:13.5px; }
    .crmp-sub svg { color:#5b6478; vertical-align:-2px; margin-right:2px; }
    .crmp-sub i { width:4px; height:4px; border-radius:50%; background:#c3cad8; margin:0 4px; }
    .crmp-covers { display:flex; gap:8px; flex-wrap:wrap; padding:4px 0 2px; }
    .crmp-covers button { width:34px; height:34px; border-radius:50%; border:0; cursor:pointer; box-shadow:0 0 0 2px #fff, 0 0 0 3.5px transparent; transition:box-shadow .15s, transform .12s; }
    .crmp-covers button:hover { transform:scale(1.08); }
    .crmp-covers button.on { box-shadow:0 0 0 2px #fff, 0 0 0 3.5px #2f4a8a; }
    .crmp-covers button.ph { background:#eef2f9; color:#2f4a8a; display:flex; align-items:center; justify-content:center; }
    .crmp-big { position:absolute; left:50%; bottom:-52px; transform:translateX(-50%); z-index:2; }
    .crmp-big .crmp-ava { box-shadow:0 0 0 4px #fff, 0 6px 18px rgba(0,0,0,.18); }
    .crmp-cam { position:absolute; right:-2px; bottom:2px; width:36px; height:36px; border-radius:50%; background:#2f4a8a; color:#fff; border:3px solid #fff;
      display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.2); transition:transform .15s; }
    .crmp-cam:hover { transform:scale(1.08); }
    .crmp-name { text-align:center; margin-top:60px; padding:0 20px; }
    .crmp-name b { font-size:21px; font-weight:600; display:block; line-height:1.25; }
    .crmp-name .crmp-pill { display:inline-flex; align-items:center; gap:6px; margin-top:8px; padding:5px 12px; border-radius:20px; background:#eef2f9; color:#1f2433;
      font-size:13.5px; max-width:100%; cursor:default; }
    .crmp-name .crmp-pill small { color:#5b6478; font-size:12.5px; }
    .crmp-name .crmp-pill.empty { color:#2f4a8a; background:#eef2f9; cursor:pointer; }
    .crmp-acts { display:flex; justify-content:center; gap:10px; margin:18px 20px 6px; }
    .crmp-act { flex:1; max-width:110px; border:0; background:#eef2f9; border-radius:12px; padding:10px 6px 8px; cursor:pointer; color:#2f4a8a; font-size:12.5px; font-weight:500;
      display:flex; flex-direction:column; align-items:center; gap:4px; transition:background .15s; }
    .crmp-act:hover { background:#eef2f9; }
    .crmp-rows { padding:8px 8px 14px; }
    .crmp-r { display:flex; gap:16px; align-items:center; padding:10px 14px; border-radius:12px; cursor:pointer; transition:background .12s; position:relative; }
    .crmp-r:hover { background:#f3f5f9; }
    .crmp-r > svg { color:#5b6478; flex:none; }
    .crmp-r div { min-width:0; flex:1; }
    .crmp-r .v { font-size:15px; color:#1f2433; word-break:break-word; white-space:pre-wrap; }
    .crmp-r .k { font-size:12.5px; color:#5b6478; margin-top:1px; }
    .crmp-r .v.no { color:#8a92a3; }
    .crmp-copied { position:absolute; right:14px; top:50%; transform:translateY(-50%); font-size:12px; color:#2f7d4f; background:#e5f1ea; padding:2px 8px; border-radius:10px; }
    .crmp-f { padding:4px 22px 0; }
    .crmp-f label { display:block; font-size:12.5px; color:#2f4a8a; margin:14px 0 2px; font-weight:500; }
    .crmp-f input, .crmp-f textarea { width:100%; border:0; border-bottom:1.5px solid #dfe3ec; outline:0; font-size:15px; padding:6px 0; background:none; font-family:inherit;
      transition:border-color .15s; resize:vertical; }
    .crmp-f input:focus, .crmp-f textarea:focus { border-bottom-color:#2f4a8a; }
    .crmp-f small { color:#5b6478; font-size:12px; }
    .crmp-foot { display:flex; gap:8px; justify-content:flex-end; padding:18px 20px 18px; }
    .crmp-btn { border:0; background:none; border-radius:10px; padding:9px 16px; cursor:pointer; font-size:14px; font-weight:500; color:#2f4a8a; transition:background .15s; }
    .crmp-btn:hover { background:#eef2f9; }
    .crmp-btn.pri { background:#2f4a8a; color:#fff; }
    .crmp-btn.pri:hover { background:#2f4a8a; }
    .crmp-btn.del { margin-right:auto; color:#c23b3b; }
    .crmp-btn.del:hover { background:#f9e6e6; }
    .crmp-btn[disabled] { opacity:.5; cursor:default; }

    /* статус */
    .crmp-sdlg { padding:20px 20px 0; }
    .crmp-sdlg h3 { margin:0 0 14px; font-size:18px; font-weight:600; }
    .crmp-in { display:flex; gap:6px; align-items:center; background:#eef2f9; border-radius:12px; padding:5px 10px 5px 5px; border:1.5px solid transparent; transition:border-color .15s; }
    .crmp-in:focus-within { border-color:#2f4a8a; background:#fff; }
    .crmp-in input { border:0; outline:0; flex:1; font-size:15px; padding:6px 2px; min-width:0; background:none; }
    .crmp-emo-cur { width:38px; height:38px; border-radius:10px; border:0; background:#fff; font-size:21px; cursor:pointer; flex:none; box-shadow:0 1px 3px rgba(0,0,0,.08); }
    .crmp-in .crmp-clr { border:0; background:none; color:#8a92a3; cursor:pointer; padding:2px; display:flex; }
    .crmp-emos { display:grid; grid-template-columns:repeat(8, 1fr); gap:2px; margin:12px 0 4px; }
    .crmp-emos button { aspect-ratio:1; border:0; background:none; border-radius:10px; font-size:22px; cursor:pointer; transition:transform .1s, background .1s; }
    .crmp-emos button:hover { background:#eef2f9; transform:scale(1.15); }
    .crmp-emos button.on { background:#eef2f9; }
    .crmp-sec { font-size:12.5px; color:#5b6478; font-weight:500; margin:14px 0 6px; text-transform:uppercase; letter-spacing:.04em; }
    .crmp-pre { display:flex; align-items:center; gap:12px; width:100%; border:0; background:none; text-align:left; padding:8px 10px; border-radius:10px; cursor:pointer; font-size:14.5px; color:#1f2433; }
    .crmp-pre:hover { background:#f3f5f9; }
    .crmp-pre i { font-style:normal; font-size:20px; width:26px; text-align:center; }
    .crmp-pre small { margin-left:auto; color:#5b6478; font-size:12.5px; }
    .crmp-chips { display:flex; flex-wrap:wrap; gap:6px; }
    .crmp-chips button { border:1.5px solid #dfe3ec; background:#fff; border-radius:20px; padding:5px 12px; font-size:13px; cursor:pointer; color:#1f2433; transition:all .12s; }
    .crmp-chips button:hover { border-color:#dde5f3; }
    .crmp-chips button.on { background:#2f4a8a; border-color:#2f4a8a; color:#fff; }
    .crmp-toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%); background:rgba(30,34,44,.92); color:#fff; padding:9px 16px; border-radius:10px; z-index:3300;
      font-size:13.5px; animation:crmpFade .15s; }
  `;
  document.head.appendChild(st);

  function active(u) {
    if (!u || !(u.status_emoji || u.status_text)) return null;
    if (u.status_until && new Date(u.status_until) < new Date()) return null;
    return { emoji: u.status_emoji || '', text: u.status_text || '', until: u.status_until || null };
  }
  function photo(u) { const a = u && u.avatar && u.avatar[0]; return a ? (a.thumbnailUrl || a.url) : null; }
  function untilText(until) {
    if (!until) return '';
    const d = new Date(until), now = new Date();
    const t = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const day = d.toDateString() === now.toDateString() ? '' : d.toDateString() === tomorrow.toDateString() ? 'завтра' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    if (t === '23:59') return day ? 'до конца дня ' + day : 'до конца дня';
    return 'до ' + (day ? day + ' ' : '') + t;
  }
  function stLine(s) { return s ? ((s.emoji ? s.emoji + ' ' : '') + s.text).trim() : ''; }
  function avaHtml(u, size, label, card) {
    const id = u ? u.id : 0, g = grad(id), ph = photo(u), s = active(u);
    const bg = ph ? 'url(&quot;' + e(ph) + '&quot;)' : 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
    return '<span class="crmp-ava"' + (card ? ' data-crmp-card="' + e(id) + '" style="cursor:pointer;' : ' style="') + 'width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * .38) + 'px;background:' + bg + ';"'
      + (s ? ' title="' + e(stLine(s)) + '"' : '') + '>'
      + (ph ? '' : e(ini(label || name(u)))) + (s && s.emoji && size < 80 ? '<span class="crmp-badge">' + e(s.emoji) + '</span>' : '') + '</span>';
  }
  function toast(t) {
    const d = document.createElement('div'); d.className = 'crmp-toast'; d.textContent = t; document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 1800);
  }

  async function load() {
    try {
      if (!P.me) { const r = await api.request({ url: 'auth:check' }); P.me = (r.data && r.data.data) || null; }
      const r = await api.request({ url: 'users:list', params: { pageSize: 500,
        fields: ['id', 'nickname', 'username', 'email', 'phone', 'status_emoji', 'status_text', 'status_until', 'about',
          'cover_style', 'position', 'location', 'telegram', 'github', 'website'], appends: ['avatar', 'cover'] } });
      const m = {};
      ((r.data && r.data.data) || []).forEach(function (u) { m[u.id] = u; });
      P.byId = m; P.at = Date.now();
      const evt = document.createEvent('Event'); evt.initEvent('crm-profiles', false, false); window.dispatchEvent(evt);  // new Event() в песочнице блоков нет
    } catch (x) { /* нет прав на список — остаются инициалы */ }
  }
  async function saveMe(vals) {
    try {
      await api.request({ url: 'users:updateProfile', method: 'post', data: Object.assign({ username: P.me.username }, vals) });
      await load(); decorate(true);
      return true;
    } catch (x) {
      toast('Не сохранилось: ' + ((x.response && x.response.data && x.response.data.errors && x.response.data.errors[0].message) || x.message));
      return false;
    }
  }
  window.crmPhoto = function (id) { return photo(P.byId[id]); };
  window.crmFmtPhone = fmtPhone;
  window.crmStatus = function (id) { return active(P.byId[id]); };
  window.crmStatusBadge = function (id) { const s = active(P.byId[id]); return s && s.emoji ? '<span class="crmp-badge">' + e(s.emoji) + '</span>' : ''; };
  window.crmAvatar = function (id, size, label, card) { return avaHtml(P.byId[id] || { id: id }, size || 32, label, card); };

  function modal(html, cls) {
    const m = document.createElement('div');
    m.className = 'crmp-mask';
    m.innerHTML = '<div class="crmp-dlg ' + (cls || '') + '">' + html + '</div>';
    const close = function () { m.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = function (ev) {
      if (ev.key !== 'Escape') return;
      if (m.matches('.crmp-mask:not(:has(~ .crmp-mask))')) m.close();
    };
    document.addEventListener('keydown', onKey, true);
    m.close = close;
    document.body.appendChild(m);
    return m;
  }

  function workDialog(title, key, cls, html, trigger) {
    if (!document.getElementById('crm-knowledge-style')) {
      const style = document.createElement('style');
      style.id = 'crm-knowledge-style';
      style.textContent = `
    .crmp-mask.crm-work-mask { background:rgba(0,0,0,.45); backdrop-filter:none; }
    .crmp-dlg.crm-work-dialog { background:#fff; border-radius:8px; box-shadow:0 6px 16px rgba(0,0,0,.12); max-height:92dvh; }
    .crmp-dlg.kb-dialog { width:1160px; height:min(780px, 92dvh); display:flex; flex-direction:column; overflow:hidden; }
    .crm-work-dialog * { box-sizing:border-box; }
    .kb-heading { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; gap:12px; border-bottom:1px solid #dfe3ec; flex-shrink:0; }
    .kb-heading h2 { color:inherit; font-size:16px; font-weight:600; margin:0; }
    .kb-layout { display:grid; grid-template-columns:minmax(230px, 290px) minmax(0,1fr); flex:1; min-height:0; }
    .kb-sidebar { padding:18px; background:#f3f5f9; border-right:1px solid #dfe3ec; overflow:auto; }
    .kb-article { padding:28px clamp(20px,4vw,54px); overflow:auto; min-width:0; }
    .kb-article h2 { color:#1c2d58; font-size:22px; line-height:1.25; margin:5px 0 14px; overflow-wrap:anywhere; }
    .kb-article p, .kb-article li { font-size:14px; line-height:1.65; overflow-wrap:anywhere; }
    .crm-work-dialog input, .crm-work-dialog textarea, .crm-work-dialog select { width:100%; padding:7px 10px; border:1px solid #c3cad8; border-radius:6px; font:inherit; color:inherit; background:#fff; }
    .crm-work-dialog input:focus, .crm-work-dialog textarea:focus, .crm-work-dialog select:focus { outline:2px solid #315996; outline-offset:1px; }
    .crm-work-dialog label { display:block; margin:0 0 10px; font-size:13px; }
    .crm-work-dialog label > input,.crm-work-dialog label > textarea,.crm-work-dialog label > select { margin-top:4px; }
    .crm-work-dialog button { cursor:pointer; border:1px solid #c3cad8; border-radius:6px; background:#fff; padding:6px 11px; color:#1c2d58; font:inherit; }
    .crm-work-dialog button:hover { border-color:#315996; }
    .crm-work-dialog .kb-primary { color:white; background:#1c2d58; border-color:#1c2d58; }
    .crm-work-dialog button:disabled { opacity:.6; cursor:wait; }
    .kb-heading .kb-close { border-color:transparent; color:#5b6478; font-size:21px; line-height:1; padding:5px 8px; }
    .kb-sidebar h3 { margin:18px 6px 5px; color:#5b6478; font-weight:600; font-size:12px; }
    .kb-sidebar nav button { display:block; width:100%; text-align:left; padding:5px 8px; margin:1px 0; overflow-wrap:anywhere; border-color:transparent; background:transparent; }
    .kb-sidebar nav button:hover,.kb-sidebar nav button[aria-current=true] { background:#e6ebf5; border-color:#d6deed; }
    .kb-sidebar nav button[aria-current=true] { font-weight:600; }
    .kb-content { max-width:720px; margin-top:16px; }
    .kb-content h3,.kb-content h4,.kb-content h5 { color:#1c2d58; margin:22px 0 6px; }
    .kb-content ul { padding-left:22px; }
    .kb-dialog .kb-meta { color:#5b6478; font-size:12.5px; }
    .kb-tools,.kb-fields { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0; }
    .kb-fields > * { flex:1 1 175px; }
    .kb-status { color:#46536b; min-width:0; overflow-wrap:anywhere; padding:8px 24px; border-bottom:1px solid #dfe3ec; }
    .kb-status:empty,.crm-work-dialog [hidden] { display:none; }
    .kb-article details { border-bottom:1px solid #dfe3ec; padding:10px 0; }
    @media(max-width:660px) {
      .crmp-dlg.kb-dialog { max-width:calc(100vw - 12px); height:calc(100dvh - 16px); max-height:none; }
      .kb-heading { padding:12px 16px; }
      .kb-layout { grid-template-columns:minmax(0,1fr); grid-template-rows:minmax(105px,32%) minmax(0,1fr); }
      .kb-sidebar { padding:12px 16px; border-right:0; border-bottom:1px solid #dfe3ec; }
      .kb-article { padding:18px 16px; }
    }
    .crmp-dlg.kp-dialog { width:650px; }
    .kp-dialog form { padding:20px 24px; }
    .kp-dialog .kb-fields { margin:0; }
    .kp-dialog .kb-tools { justify-content:flex-end; margin:14px 0 0; }
    .kp-dialog .kb-status { border:0; }
    .kp-dialog form:not([hidden]) + .kb-status { padding-top:0; padding-bottom:16px; }
    .kp-dialog input[type=file] { padding:6px; }
    .kp-dialog small { color:#5b6478; font-weight:400; }

`;
      document.head.appendChild(style);
    }
    const titleId = 'crm-'+key+'-title';
    const m = modal('<header class="kb-heading"><h2 id="'+titleId+'">'+title+'</h2>'
      + '<button type="button" class="kb-close" aria-label="Закрыть">×</button></header>'+html, 'crm-work-dialog '+cls);
    m.classList.add('crm-work-mask');
    const dialog = m.querySelector('.crm-work-dialog');
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby',titleId);
    const close = m.close;
    m.close = () => { close(); trigger?.focus(); };
    const closeButton=m.querySelector('.kb-close');
    closeButton.onclick = () => m.close();
    m.addEventListener('keydown', ev => {
      if (ev.key !== 'Tab') return;
      const fields = [...dialog.querySelectorAll('button,input,textarea,select,a[href],summary')].filter(x=>!x.disabled && x.offsetParent);
      const first = fields[0], last = fields[fields.length-1];
      if (ev.shiftKey && first?.matches(':focus')) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && last?.matches(':focus')) { ev.preventDefault(); first.focus(); }
    });
    closeButton.focus();
    return m;
  }

  function openKnowledge(id) {
    if (document.querySelector('.kb-dialog')) return;
    const m = workDialog('База знаний','kb','kb-dialog',
      '<div class="kb-status" role="status" data-kb="status"></div>'
      + '<div class="kb-layout"><aside class="kb-sidebar"><label>Поиск по статьям<input data-kb="search" type="search" maxlength="200"></label>'
      + '<button type="button" class="kb-primary" data-kb="new" hidden>Создать статью</button>'
      + '<nav data-kb="topics" aria-label="Темы и статьи"></nav></aside>'
      + '<article class="kb-article" data-kb="article"><p>Загрузка…</p></article></div>',
      document.querySelector('[data-testid=user-center-button]'));
    const close=m.close;
    m.close=()=>{clearTimeout(searchTimer);close();};
    const el = id => m.querySelector('[data-kb='+id+']');
    const status = el('status'), panel = el('article'), nav = el('topics'), search = el('search');
    const labels = {all:'Все сотрудники',managers:'Управляющие',accounting_dept:'Бухгалтерия',legal_dept:'Юристы',
      rental_dept:'Аренда',hr:'Кадры',aho:'АХО',draft:'Черновик',published:'Опубликована',archived:'Архив'};
    let model, searchTimer, articleId = 0, browseSequence = 0, articleSequence = 0;
    function node(tag,text,parent) {
      const element = document.createElement(tag);
      if (text != null) element.textContent = text;
      if (parent) parent.appendChild(element);
      return element;
    }
    function btn(parent,label,action) {
      const element = node('button',label,parent);
      element.type = 'button';
      element.onclick = action;
      return element;
    }
    async function api(query='', values) {
      const res = await fetch('/rqsvc/knowledge/api' + query, {
        method: values ? 'POST' : 'GET',
        headers: {Authorization:'Bearer '+(localStorage.getItem('NOCOBASE_TOKEN') || ''),'Content-Type':'application/json'},
        body: values && JSON.stringify(values)
      });
      if (res.status === 401) throw Error('Войдите в CRM, затем снова откройте базу знаний');
      const result = await res.json();
      if (!res.ok) throw Error(result.error || 'Запрос не выполнен');
      return result;
    }
    function report(error) { status.textContent = error.message; }
    async function browse() {
      const sequence = ++browseSequence;
      const next = await api('?q='+encodeURIComponent(search.value));
      if (sequence !== browseSequence) return;
      model = next;
      el('new').hidden = !model.canEdit;
      nav.textContent='';
      for (const topic of new Set([...model.topics,...model.articles.map(a=>a.topic)])) {
        const articles = model.articles.filter(a=>a.topic===topic);
        if (!articles.length) continue;
        node('h3',topic,nav);
        for (const a of articles) {
          const link = btn(nav,a.title + (a.state==='published' ? '' : ' · '+labels[a.state]),()=>open(a.id).catch(report));
          link.dataset.id = String(a.id);
          if (a.id === articleId) link.setAttribute('aria-current','true');
        }
      }
      if (!nav.children.length) node('p',search.value.trim() ? 'Ничего не найдено' : 'Статей пока нет',nav).className='kb-meta';
    }
    function inline(text,target) {
      let cursor = 0;
      for (const match of text.matchAll(/\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*/g)) {
        node('span',text.slice(cursor,match.index),target);
        if (match[3]) node('strong',match[3],target);
        else if (/^(https:\/\/|\/(?![\/\\]))/i.test(match[2])) {
          const a = node('a',match[1],target);
          a.href = match[2];
          a.rel = 'noreferrer';
        } else node('span',match[0],target);
        cursor = match.index + match[0].length;
      }
      node('span',text.slice(cursor),target);
    }
    function body(text,target) {
      let list = null;
      for (const line of text.split('\n')) {
        const heading = /^(#{1,3})\s+(.*)$/.exec(line);
        const item = /^[-*]\s+(.*)$/.exec(line);
        if (item) { list ||= node('ul',null,target); inline(item[1],node('li',null,list)); continue; }
        list = null;
        if (heading) inline(heading[2],node('h'+(heading[1].length+2),null,target));
        else if (line.trim()) inline(line,node('p',null,target));
      }
    }
    function show(article) {
      panel.textContent='';
      node('p',article.topic,panel).className='kb-meta';
      node('h2',article.title,panel);
      node('p',[article.owner && 'Ответственный: '+article.owner,article.review && 'Пересмотр: '+article.review,
        model.canEdit && labels[article.state]].filter(Boolean).join(' · '),panel).className='kb-meta';
      const content=node('div',null,panel); content.className='kb-content';
      body(article.body,content);
      const tools=node('div',null,panel); tools.className='kb-tools';
      btn(tools,'Скопировать ссылку', async () => {
        const path='/rqsvc/knowledge?id='+article.id;
        try { await navigator.clipboard.writeText(location.origin+path); status.textContent='Ссылка скопирована'; }
        catch (error) {
          const link=node('input',null,tools);
          link.readOnly=true;
          link.value=location.origin+path;
          link.setAttribute('aria-label','Ссылка на статью');
          link.focus();
          link.select();
        }
      });
      if (model.canEdit) {
        btn(tools,'Редактировать',()=>edit(article));
        btn(tools,'История версий',async()=>{
          try {
            const revisions=await api('?id='+article.id+'&history=1');
            if (articleId!==article.id) return;
            panel.textContent='';
            node('h2','История · '+article.title,panel);
            btn(panel,'К статье',()=>show(article));
            for (const r of revisions) {
              const details=node('details',null,panel);
              node('summary','Версия '+r.version+' · '+new Date(r.updated).toLocaleString('ru')+' · '+r.editor,details);
              body(r.body,details);
              if (r.version!==article.version) btn(details,'Взять за основу',()=>edit({...r,version:article.version,state:'draft'}));
            }
          } catch (error) { report(error); }
        });
      }
    }
    async function open(id) {
      const sequence=++articleSequence;
      status.textContent='';
      articleId=id;
      const result=await api('?id='+id);
      if (sequence!==articleSequence) return;
      show(result);
      nav.querySelectorAll('[aria-current]').forEach(x=>x.removeAttribute('aria-current'));
      nav.querySelector('[data-id="'+id+'"]')?.setAttribute('aria-current','true');
    }
    function edit(article={}) {
      ++articleSequence;
      status.textContent='';
      panel.textContent='';
      node('h2',article.id ? 'Редактирование статьи' : 'Новая статья',panel);
      const form=node('form',null,panel), controls={};
      function field(parent,key,label,type,options) {
        const group=node('label',label,parent);
        const input=node(options ? 'select' : type==='textarea' ? 'textarea' : 'input',null,group);
        if (options) for (const value of options) node('option',labels[value] || value,input).value=value;
        else if (type==='textarea') { input.rows=16; input.maxLength=70000; }
        else { input.type=type; if (key==='title') input.maxLength=180; if (key==='owner') input.maxLength=120; }
        input.value=article[key] ?? options?.[0] ?? '';
        controls[key]=input;
        return input;
      }
      field(form,'title','Заголовок','text').required=true;
      const fields=node('div',null,form); fields.className='kb-fields';
      const topic=field(fields,'topic','Тема','text');
      topic.value=article.topic || model.topics[0];
      topic.required=true;
      topic.maxLength=100;
      const suggestions=node('datalist',null,form);
      suggestions.id='topic-suggestions';
      for (const name of new Set([...model.topics,...model.articles.map(a=>a.topic)])) node('option',name,suggestions).value=name;
      topic.setAttribute('list',suggestions.id);
      field(fields,'audience','Кому доступна',null,model.audiences);
      field(fields,'state','Статус',null,['draft','published','archived']);
      field(fields,'owner','Ответственный','text');
      field(fields,'review','Дата пересмотра','date');
      field(form,'body','Текст · поддерживаются Markdown-заголовки, списки и ссылки','textarea').required=true;
      const tools=node('div',null,form); tools.className='kb-tools';
      const save=node('button','Сохранить',tools); save.className='kb-primary';
      btn(tools,'Отмена',()=>article.id ? show(article) : showIntro());
      form.onsubmit=async event=>{
        event.preventDefault(); save.disabled=true; status.textContent='';
        try {
          const values=Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.value]));
          if (article.id) Object.assign(values,{id:article.id,version:article.version});
          const saved=await api('',values);
          await open(saved.id);
          await browse();
        } catch (error) { report(error); }
        finally { save.disabled=false; }
      };
    }
    el('new').onclick=()=>edit();
    search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>browse().catch(report),220);};
    function showIntro() {
      const intro=model.articles.find(a=>a.title==='С чего начать в CRM');
      if (intro) { open(intro.id).catch(report); return; }
      panel.textContent='';
      node('h2','Инструкции',panel);
      node('p','Выберите статью в списке или воспользуйтесь поиском.',panel);
    }
    browse().then(() => id ? open(id) : showIntro()).catch(report);
    search.focus();
  }

  function openPayment(trigger) {
    if (document.querySelector('.kp-dialog')) return;
    const m = workDialog('Заявка на оплату','kp','kp-dialog',
      '<form hidden><label>Объект<select name="object" required><option value="">Выберите объект</option></select></label>'
      + '<label>Цель расхода<textarea name="purpose" rows="3" maxlength="1000" required></textarea></label>'
      + '<div class="kb-fields"><label>Сумма, ₽<input name="amount" inputmode="decimal" pattern="[0-9]{1,10}([.,][0-9]{1,2})?" required></label>'
      + '<label>Оплатить до<input type="date" name="due" required></label></div>'
      + '<label>Комментарий<textarea name="comment" rows="2" maxlength="2000"></textarea></label>'
      + '<label>Счёт<input name="bill" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="crm-kp-file" required>'
      + '<small id="crm-kp-file">PDF, JPEG или PNG до 5 МБ</small></label>'
      + '<div class="kb-tools"><button type="submit" class="kb-primary">Отправить на согласование</button></div></form>'
      + '<p class="kb-status" role="status" data-kp-status>Загрузка формы…</p>',trigger);
    const form = m.querySelector('form');
      const status = m.querySelector('[data-kp-status]');
      const close = m.close;
      m.close = () => { if (!button.disabled) close(); };
      const field = name => form.querySelector('[name='+name+']');
      const button = form.querySelector('button');
      async function api(input) {
        const token = localStorage.getItem('NOCOBASE_TOKEN');
        const response = await fetch('/rqsvc/payment-request/api', {
          method: input ? 'POST' : 'GET',
          headers: { Authorization: 'Bearer ' + (token || ''), 'Content-Type': 'application/json' },
          body: input && JSON.stringify(input)
        });
        if (response.status === 401) throw new Error('Войдите в CRM, затем снова откройте форму');
        if (response.status === 413) throw new Error('Файл слишком большой');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Не удалось связаться с Pyrus');
        return result;
      }
      api().then(result => {
        for (const object of result.objects) {
          const option = document.createElement('option');
          option.textContent = object.name;
          option.value = object.id;
          field('object').appendChild(option);
        }
        form.hidden = false;
        status.textContent = '';
      }).catch(error => { status.textContent = error.message; });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (button.disabled) return;
        const bill = field('bill').files[0];
        if (!bill || bill.size > 5 * 1024 * 1024) {
          status.textContent = 'Приложите счёт размером до 5 МБ';
          return;
        }
        button.disabled = true;
        m.querySelector('.kb-close').disabled = true;
        status.textContent = 'Отправляем заявку…';
        let sending = false;
        try {
          const bytes = new Uint8Array(await bill.arrayBuffer());
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const encoded = [];
        for (let i = 0; i < bytes.length; i += 3) {
          const value = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
          encoded.push(alphabet[(value >> 18) & 63] + alphabet[(value >> 12) & 63]
            + (i + 1 < bytes.length ? alphabet[(value >> 6) & 63] : '=')
            + (i + 2 < bytes.length ? alphabet[value & 63] : '='));
        }
        const data = encoded.join('');
        sending = true;
          const result = await api({
            object: Number(field('object').value), purpose: field('purpose').value,
            amount: field('amount').value, due: field('due').value,
            comment: field('comment').value, file: { name: bill.name, data }
          });
            form.hidden = true;
          status.textContent = 'Заявка № ' + result.id + ' отправлена на согласование.';
        } catch (error) {
          status.textContent = error instanceof TypeError && sending
            ? 'Связь прервалась. Уточните в АХО, появилась ли заявка, прежде чем отправлять её повторно'
            : error.message || 'Не удалось прочитать счёт';
        } finally {
          button.disabled = false;
          m.querySelector('.kb-close').disabled = false;
        }
      });
  }

  // фото: квадрат до 512 px по центру (как в Telegram), JPEG; загрузка тем же способом, что вложения мессенджера
  function pickPhoto(done, wide) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const img = document.createElement('img');
      const url = URL.createObjectURL(f);
      img.onload = function () {
        // аватар — квадрат по центру, шапка — полоса 3:1
        const W = img.naturalWidth, H = img.naturalHeight, ar = wide ? 3 : 1;
        const sw = Math.min(W, H * ar), sh = sw / ar, c = document.createElement('canvas');
        c.width = Math.min(wide ? 1200 : 512, sw); c.height = Math.round(c.width / ar);
        c.getContext('2d').drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { upload(b || f, 'avatar.jpg').then(done, function () { done(null); }); }, 'image/jpeg', 0.88);
      };
      img.onerror = function () { URL.revokeObjectURL(url); toast('Это не картинка'); };
      img.src = url;
    };
    inp.click();
  }
  async function upload(blob, fname) {
    const b = '----crmp' + Date.now() + Math.random().toString(16).slice(2);
    const body = new Blob(['--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="' + fname + '"\r\nContent-Type: image/jpeg\r\n\r\n', blob, '\r\n--' + b + '--\r\n']);
    const r = await fetch('/api/attachments:upload', { method: 'POST', body: body,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('NOCOBASE_TOKEN'), 'Content-Type': 'multipart/form-data; boundary=' + b } });
    const d = await r.json();
    return d && d.data;
  }

  function rows(u) {
    const r = function (icon, v, k, copy, href) {
      return '<div class="crmp-r"' + (copy ? ' data-copy="' + e(copy) + '"' : '') + (href ? ' data-href="' + e(href) + '"' : '') + '>' + icon
        + '<div><div class="v' + (v ? '' : ' no') + '">' + e(v || 'не указано') + '</div><div class="k">' + k + '</div></div></div>';
    };
    const lk = function (icon, v, kind, k) { if (!v) return ''; const l = link(v, kind); return r(icon, l.text, k, l.href, l.href).replace('class="crmp-r"', 'class="crmp-r" data-open="1"'); };
    return r(ICON.phone, fmtPhone(u.phone), 'Телефон', fmtPhone(u.phone), u.phone ? 'tel:' + tel(fmtPhone(u.phone)) : '') + r(ICON.mail, u.email, 'Почта', u.email, '')
      + (u.about ? r(ICON.info, u.about, 'О себе', u.about, '') : '')
      + lk(ICON.tg, u.telegram, 'telegram', 'Telegram') + lk(ICON.gh, u.github, 'github', 'GitHub') + lk(ICON.web, u.website, 'web', 'Сайт')
      + r(ICON.user, '@' + u.username, 'Логин', u.username, '');
  }

  function openProfile(id, editing) {
    const u = P.byId[id];
    if (!u) return;
    const mine = P.me && id === P.me.id, s = active(u);
    const cover = 'class="crmp-cover" style="background:' + coverBg(u) + '"';
    const sub = [u.position, u.location].filter(Boolean);
    const pill = s ? '<span class="crmp-pill">' + e(stLine(s)) + (s.until ? ' <small>· ' + e(untilText(s.until)) + '</small>' : '') + '</span>'
      : (mine ? '<span class="crmp-pill empty" data-st>＋ Установить статус</span>' : '');
    let body;
    if (editing) {
      body = '<div class="crmp-f">'
        + '<label>Имя и фамилия</label><input data-f="nickname" maxlength="60" value="' + e(u.nickname || '') + '">'
        + '<label>Шапка</label><div class="crmp-covers">' + Object.keys(COVERS).map(function (k) { return '<button data-cover="' + k + '" class="' + (!(u.cover && u.cover[0]) && u.cover_style === k ? 'on' : '') + '" style="background:linear-gradient(135deg,' + COVERS[k][0] + ',' + COVERS[k][1] + ')"></button>'; }).join('')
        + '<button data-cover-photo class="ph' + (u.cover && u.cover[0] ? ' on' : '') + '" title="Своё фото">' + ICON.cam + '</button></div>'
        + '<label>Должность</label><input data-f="position" maxlength="60" placeholder="Например: менеджер по аренде" value="' + e(u.position || '') + '">'
        + '<label>Телефон</label><input data-f="phone" data-phone inputmode="tel" maxlength="18" placeholder="+7 (900) 000-00-00" value="' + e(fmtPhone(u.phone)) + '">'
        + '<label>Почта</label><input data-f="email" maxlength="80" value="' + e(u.email || '') + '">'
        + '<label>О себе</label><textarea data-f="about" rows="3" maxlength="300" placeholder="Чем занимаетесь, как с вами связаться">' + e(u.about || '') + '</textarea>'
        + '<label>Город</label><input data-f="location" maxlength="60" value="' + e(u.location || '') + '">'
        + '<label>Telegram</label><input data-f="telegram" maxlength="60" placeholder="@username" value="' + e(u.telegram || '') + '">'
        + '<label>GitHub</label><input data-f="github" maxlength="60" placeholder="username" value="' + e(u.github || '') + '">'
        + '<label>Сайт</label><input data-f="website" maxlength="120" placeholder="example.ru" value="' + e(u.website || '') + '">'
        + '<small>Видно всем сотрудникам в карточке профиля</small></div>'
        + '<div class="crmp-foot"><button class="crmp-btn" data-cancel>Отмена</button><button class="crmp-btn pri" data-save>Сохранить</button></div>';
    } else {
      const acts = mine
        ? '<button class="crmp-act" data-st>' + ICON.smile + 'Статус</button><button class="crmp-act" data-edit>' + ICON.edit + 'Изменить</button>'
        : '<button class="crmp-act" data-dm>' + ICON.chat + 'Написать</button>'
          + (window.crmCall ? '<button class="crmp-act" data-call>' + ICON.phone + 'Позвонить</button>' : '')
          + (u.email ? '<button class="crmp-act" data-mail>' + ICON.mail + 'Почта</button>' : '');
      body = '<div class="crmp-acts">' + acts + '</div><div class="crmp-rows">' + rows(u) + '</div>';
    }
    const m = modal('<button class="crmp-x" data-x>' + ICON.x + '</button>'
      + '<div ' + cover + '><div class="crmp-big">' + avaHtml(u, 104) + (mine ? '<span class="crmp-cam" data-cam title="Сменить фото">' + ICON.cam + '</span>' : '') + '</div></div>'
      + '<div class="crmp-name"><b>' + e(name(u)) + '</b>'
      + (sub.length && !editing ? '<div class="crmp-sub">' + (u.position ? ICON.brief.replace('width="20" height="20"', 'width="15" height="15"') + e(u.position) : '')
        + (u.position && u.location ? '<i></i>' : '') + (u.location ? ICON.pin.replace('width="20" height="20"', 'width="15" height="15"') + e(u.location) : '') + '</div>' : '')
      + (editing ? '' : pill) + '</div>' + body);
    const q = function (sel) { return m.querySelector(sel); };
    const on = function (sel, fn) { m.querySelectorAll(sel).forEach(function (b) { b.onclick = fn; }); };
    on('[data-x]', function () { m.close(); });
    on('[data-st]', function () { m.close(); openStatus(); });
    on('[data-edit]', function () { m.close(); openProfile(id, true); });
    on('[data-cancel]', function () { m.close(); openProfile(id); });
    on('[data-dm]', function () { m.close(); location.href = '/admin/msgspage01?dm=' + id; });
    on('[data-call]', function () { m.close(); const nm = {}; nm[id] = name(u); window.crmCall([id], { video: false, names: nm }); });
    on('[data-mail]', function () { location.href = 'mailto:' + u.email; });
    on('[data-cam]', function () {
      pickPhoto(async function (att) {
        if (!att || !att.id) return toast('Фото не загрузилось');
        if (await saveMe({ avatar: [{ id: att.id }] })) { m.close(); openProfile(id, editing); toast('Фото обновлено'); }
      });
    });
    on('[data-save]', async function () {
      const btn = this, v = {};
      m.querySelectorAll('[data-f]').forEach(function (x) { v[x.getAttribute('data-f')] = x.value.trim() || null; });
      if (v.phone && v.phone.replace(/\D/g, '').length < 11 && /^\+7/.test(v.phone)) return toast('Телефон не дописан');
      if (!v.nickname) return toast('Имя не может быть пустым');
      btn.disabled = true;
      if (await saveMe(v)) { m.close(); openProfile(id); toast('Сохранено'); } else btn.disabled = false;
    });
    m.querySelectorAll('.crmp-r[data-copy]').forEach(function (r) {
      r.onclick = function () {
        const h = r.getAttribute('data-href');
        if (r.hasAttribute('data-open')) { window.open(h, '_blank', 'noopener'); return; }
        if (h && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { location.href = h; return; }
        const done = function () { const c = document.createElement('span'); c.className = 'crmp-copied'; c.textContent = 'скопировано'; r.appendChild(c); setTimeout(function () { c.remove(); }, 1200); };
        try { navigator.clipboard.writeText(r.getAttribute('data-copy')).then(done, function () { /* нет доступа к буферу */ }); } catch (x) { /* http без буфера */ }
      };
    });
    const ph1 = q('[data-phone]');
    if (ph1) ph1.addEventListener('input', function () { maskPhone(ph1); });
    on('[data-cover]', async function () {
      const k = this.getAttribute('data-cover');
      if (await saveMe({ cover_style: k, cover: [] })) { const c = m.querySelector('.crmp-cover'); c.style.background = coverBg(P.byId[id]); m.querySelectorAll('[data-cover],[data-cover-photo]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-cover') === k); }); }
    });
    on('[data-cover-photo]', function () {
      pickPhoto(async function (att) {
        if (!att || !att.id) return toast('Фото не загрузилось');
        if (await saveMe({ cover: [{ id: att.id }] })) { m.querySelector('.crmp-cover').style.background = coverBg(P.byId[id]); m.querySelectorAll('[data-cover]').forEach(function (b) { b.classList.remove('on'); }); q('[data-cover-photo]').classList.add('on'); }
      }, true);
    });
    if (editing) setTimeout(function () { const i = q('[data-f="nickname"]'); if (i) i.focus(); }, 30);
  }
  window.crmProfileCard = function (id) { openProfile(id); };

  const EMOJI = ['💬', '🏠', '🏢', '🚗', '📅', '🍽️', '☕', '🤒', '🏖️', '✈️', '🎯', '🔥', '✅', '⏳', '🎧', '📞', '🧾', '🔧', '🎉', '😊', '😴', '🤝', '📌', '🚫'];
  const PRESETS = [['📅', 'На встрече', '1'], ['🚗', 'На объекте', 'today'], ['🍽️', 'Обед', '1'], ['🏠', 'Работаю удалённо', 'today'], ['🤒', 'Болею', 'today'], ['🏖️', 'В отпуске', '']];
  const UNTIL = [['0.5', '30 мин'], ['1', '1 час'], ['4', '4 часа'], ['today', 'Сегодня'], ['week', 'Неделя'], ['', 'Не сбрасывать']];
  const UNTIL_HINT = { '1': '1 час', 'today': 'сегодня' };
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
    let emo = cur.emoji, until = cur.emoji || cur.text ? '' : 'today';
    const m = modal('<div class="crmp-sdlg"><h3>Статус</h3>'
      + '<div class="crmp-in"><button class="crmp-emo-cur" data-emo-cur title="Убрать эмодзи">' + e(cur.emoji || '😊') + '</button>'
      + '<input maxlength="80" placeholder="Что у вас сейчас?" value="' + e(cur.text) + '"><button class="crmp-clr" data-clr title="Очистить">' + ICON.x + '</button></div>'
      + '<div class="crmp-emos">' + EMOJI.map(function (x) { return '<button data-emo="' + x + '" class="' + (x === cur.emoji ? 'on' : '') + '">' + x + '</button>'; }).join('') + '</div>'
      + '<div class="crmp-sec">Быстрый выбор</div>'
      + PRESETS.map(function (p, i) { return '<button class="crmp-pre" data-pre="' + i + '"><i>' + p[0] + '</i>' + e(p[1]) + '<small>' + e(UNTIL_HINT[p[2]] || '') + '</small></button>'; }).join('')
      + '<div class="crmp-sec">Сбросить через</div><div class="crmp-chips">' + UNTIL.map(function (u) { return '<button data-until="' + u[0] + '">' + u[1] + '</button>'; }).join('') + '</div></div>'
      + '<div class="crmp-foot">' + (active(me) ? '<button class="crmp-btn del" data-clear>Убрать статус</button>' : '') + '<button class="crmp-btn" data-x>Отмена</button><button class="crmp-btn pri" data-ok>Сохранить</button></div>');
    const inp = m.querySelector('input'), cb = m.querySelector('[data-emo-cur]');
    const pick = function (x) { emo = x; cb.textContent = x || '😊'; m.querySelectorAll('[data-emo]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-emo') === x); }); };
    const setUntil = function (v) { until = v; m.querySelectorAll('[data-until]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-until') === v); }); };
    setUntil(until);
    m.querySelectorAll('[data-emo]').forEach(function (b) { b.onclick = function () { pick(emo === b.getAttribute('data-emo') ? '' : b.getAttribute('data-emo')); inp.focus(); }; });
    m.querySelectorAll('[data-until]').forEach(function (b) { b.onclick = function () { setUntil(b.getAttribute('data-until')); }; });
    cb.onclick = function () { pick(''); };
    m.querySelector('[data-clr]').onclick = function () { inp.value = ''; pick(''); inp.focus(); };
    m.querySelectorAll('[data-pre]').forEach(function (b) { b.onclick = function () { const p = PRESETS[b.getAttribute('data-pre')]; pick(p[0]); inp.value = p[1]; setUntil(p[2]); }; });
    m.querySelector('[data-x]').onclick = function () { m.close(); };
    const save = async function (vals) { if (await saveMe(vals)) { m.close(); toast(vals.status_text || vals.status_emoji ? 'Статус установлен' : 'Статус убран'); } };
    const clr = m.querySelector('[data-clear]');
    if (clr) clr.onclick = function () { save({ status_emoji: null, status_text: null, status_until: null }); };
    const ok = function () {
      const t = inp.value.trim();
      if (!t && !emo) return save({ status_emoji: null, status_text: null, status_until: null });
      save({ status_emoji: emo || null, status_text: t || null, status_until: untilDate(until) });
    };
    m.querySelector('[data-ok]').onclick = ok;
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') ok(); });
    setTimeout(function () { inp.focus(); }, 30);
  }
  window.crmSetStatus = openStatus;

  // кнопка профиля и её меню — NocoBase перерисовывает шапку сам, поэтому проверка по таймеру (MutationObserver в блоках нельзя)
  let lastKey = '';
  function mayDayCountdown(now) {
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    let target = Date.UTC(now.getFullYear(), 4, 1);
    if (today > target) target = Date.UTC(now.getFullYear() + 1, 4, 1);
    return (target - today) / 86400000;
  }
  function paintMayDay(btn) {
    if (!document.body) return;
    let badge = document.getElementById('crmp-mayday-countdown');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'crmp-mayday-countdown';
      badge.setAttribute('role', 'status');
      badge.style.cssText = 'position:fixed;transform:translateY(-50%);display:inline-flex;align-items:center;white-space:pre-line;text-align:center;font-size:10px;font-weight:600;line-height:12px;color:#fff;background:rgba(255,255,255,.15);padding:2px 6px;border-radius:9px;pointer-events:none;z-index:1000;';
      document.body.appendChild(badge);
    }
    const days = mayDayCountdown(new Date());
    const text = days === 0 ? 'С 1 Мая!' : 'До 1 мая\n' + days + ' дн.';
    if (badge.textContent !== text) badge.textContent = text;
    badge.title = days === 0 ? 'С 1 Мая!' : 'До 1 мая: ' + days + ' дн.';
    const buttonRect = btn && btn.getBoundingClientRect();
    if (buttonRect && buttonRect.width) {
      const group = btn.parentNode.parentNode.parentNode.parentNode;
      const groupRect = group.getBoundingClientRect();
      badge.style.left = Math.max(8, groupRect.left - badge.getBoundingClientRect().width - 8) + 'px';
      badge.style.right = 'auto';
      badge.style.top = buttonRect.top + buttonRect.height / 2 + 'px';
    } else {
      badge.style.left = 'auto';
      badge.style.right = '44px';
      badge.style.top = '23px';
    }
  }
  function decorate(force) {
    const btn = document.querySelector('[data-testid=user-center-button]');
    paintMayDay(btn);
    const me = P.me && (P.byId[P.me.id] || P.me);
    if (!me) return;
    const s = active(me);
    const key = me.id + '|' + photo(me) + '|' + JSON.stringify(s) + '|' + name(me) + '|' + me.phone + '|' + me.email + '|' + me.cover_style + '|' + JSON.stringify(me.cover || null);
    if (btn && (force || key !== lastKey || !btn.querySelector('.crmp-ava'))) {
      btn.classList.add('crmp-on');
      const old = btn.querySelector('.crmp-ava'); if (old) old.remove();
      btn.insertAdjacentHTML('beforeend', avaHtml(me, 30));
      lastKey = key;
    }
    const li = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden) [data-testid=schema-settings-menu] li[title=nickname]');
    if (li && li.getAttribute('data-k') !== key) {
      li.className = 'ant-dropdown-menu-item crmp-li';
      li.removeAttribute('aria-disabled');
      li.setAttribute('data-k', key);
      const t = li.querySelector('.ant-dropdown-menu-title-content') || li;
      t.innerHTML = '<div class="crmp-head" style="background:' + coverBg(me) + ';">'
        + avaHtml(me, 54) + '<div class="crmp-head-t"><b>' + e(name(me)) + '</b>'
        + (me.phone ? '<div>' + e(fmtPhone(me.phone)) + '</div>' : '') + (me.email ? '<div>' + e(me.email) + '</div>' : '')
        + (s ? '<span class="crmp-head-st">' + e(stLine(s)) + '</span>' : '') + '</div>' + ICON.chev + '</div>';
      t.onclick = function (ev) { ev.stopPropagation(); const dd = li.closest('.ant-dropdown'); if (dd) dd.classList.add('ant-dropdown-hidden'); openProfile(me.id); };
      let set = li.parentNode.querySelector('li.crmp-li-st');
      if (!set) {
        set = document.createElement('li');
        set.className = 'ant-dropdown-menu-item crmp-li-st';
        set.setAttribute('role', 'menuitem');
        set.addEventListener('click', function () { const dd = li.closest('.ant-dropdown'); if (dd) dd.classList.add('ant-dropdown-hidden'); openStatus(); });
        li.parentNode.insertBefore(set, li.nextSibling);
      }
      set.innerHTML = '<span class="ant-dropdown-menu-title-content">' + ICON.smile + (s ? 'Изменить статус' : 'Установить статус') + '</span>';
      if (!li.parentNode.querySelector('.crmp-li-payment')) {
        const payment = document.createElement('li');
        payment.className = 'ant-dropdown-menu-item crmp-li-payment';
        payment.innerHTML = '<a class="ant-dropdown-menu-title-content" href="/rqsvc/payment-request">Подать заявку на оплату</a>';
        li.parentNode.insertBefore(payment, set.nextSibling);
      }
      if (!li.parentNode.querySelector('.crmp-li-knowledge')) {
        const knowledge = document.createElement('li');
        knowledge.className = 'ant-dropdown-menu-item crmp-li-knowledge';
        knowledge.innerHTML = '<a class="ant-dropdown-menu-title-content" href="/rqsvc/knowledge">База знаний</a>';
        knowledge.querySelector('a').onclick = function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          li.closest('.ant-dropdown')?.classList.add('ant-dropdown-hidden');
          openKnowledge();
        };
        const payment = li.parentNode.querySelector('.crmp-li-payment');
        li.parentNode.insertBefore(knowledge, payment.nextSibling);
      }
      // одна форма профиля: стандартный пункт «Редактировать профиль» открывает редактор выше (стандартная форма остаётся
      // служебной — по ней users:updateProfile решает, какие поля можно сохранять)
      li.parentNode.querySelectorAll('li').forEach(function (x) {
        if (x.__crmpEdit || !/^Редактировать профиль|^Edit profile/.test((x.textContent || '').trim())) return;
        x.__crmpEdit = true;
        x.addEventListener('click', function (ev) {
          ev.stopPropagation(); ev.preventDefault();
          const dd = li.closest('.ant-dropdown'); if (dd) dd.classList.add('ant-dropdown-hidden');
          openProfile(me.id, true);
        }, true);
      });
    }
  }
  load().then(function () {
    decorate(true);
    const deepLink = location.search.match(/[?&]knowledge=(open|[1-9]\d*)(?:&|$)/);
    if (deepLink) openKnowledge(Number(deepLink[1]) || undefined);
    if (/[?&]payment=open(?:&|$)/.test(location.search)) openPayment();
  });
  setInterval(decorate, 600);
  setInterval(load, 60000);
  document.addEventListener('click', function (ev) {
    const link = ev.target.closest && ev.target.closest('a[href="/rqsvc/payment-request"]');
    if (!link || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    ev.stopPropagation();
    const menu = link.closest('.ant-dropdown');
    if (menu) menu.classList.add('ant-dropdown-hidden');
    openPayment(menu ? document.querySelector('[data-testid=user-center-button]') : link);
  }, true);
  // аватар с data-crmp-card (crmAvatar(id, size, label, true)) открывает карточку человека
  document.addEventListener('click', function (ev) {
    const a = ev.target.closest && ev.target.closest('[data-crmp-card]');
    if (a && !a.closest('.crmp-dlg')) { ev.stopPropagation(); openProfile(Number(a.getAttribute('data-crmp-card'))); }
  }, true);
})();
// ===== конец фрагмента профилей =====
