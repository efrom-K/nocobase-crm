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
    .crmp-task-count { position:absolute; top:5px; right:2px; min-width:16px; height:16px; line-height:16px; padding:0 4px; border-radius:8px;
      background:#c23b3b; color:#fff; font-size:10.5px; font-weight:600; text-align:center; box-sizing:border-box; pointer-events:none; }
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
      if (ev.key !== 'Escape' || ev.target.matches?.('[data-person-key][aria-expanded=true]')) return;
      if (m.matches('.crmp-mask:not(:has(~ .crmp-mask))')) m.close();
    };
    document.addEventListener('keydown', onKey, true);
    m.close = close;
    document.body.appendChild(m);
    return m;
  }

  let tkPickerCount = 0;
  function taskPersonPicker(people, attr, label, selected, empty) {
    const id = 'tk-people-' + (++tkPickerCount);
    const current = people.find(function(person) { return person[0] === selected; });
    return '<div class="tk-person" data-person-picker><input type="text" ' + attr + ' role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="' + id
      + '" aria-label="' + e(label) + '" placeholder="' + e(empty) + '" autocomplete="off" data-person-key="' + e(current ? current[0] : '') + '" value="' + e(current ? current[1] : '') + '">'
      + '<div class="tk-person-list" hidden><div role="listbox" id="' + id + '" aria-label="' + e(label) + '">'
      + people.map(function(person, i) {
        return '<div class="tk-person-option" role="option" aria-selected="false" id="' + id + '-' + i + '" data-key="' + e(person[0]) + '"><span>' + e(person[1]) + '</span>'
          + (person[2] ? '<small>' + e(person[2]) + '</small>' : '') + '</div>';
      }).join('') + '</div><div class="tk-person-empty" role="status" hidden>Сотрудники не найдены</div></div></div>';
  }
  function taskPersonKey(input) { return input.getAttribute('data-person-key') || ''; }
  function bindTaskPeople(root) {
    root.querySelectorAll('[data-person-picker]').forEach(function(picker) {
      const input = picker.querySelector('input'), menu = picker.querySelector('.tk-person-list');
      const empty = menu.querySelector('[role="status"]'), options = Array.from(menu.querySelectorAll('[data-key]'));
      const names = options.map(function(option) { return option.querySelector('span').textContent; });
      const normalize = function(value) { return value.toLocaleLowerCase('ru').replace(/ё/g, 'е'); };
      const searchable = names.map(normalize);
      let visible = [], active = -1;
      function highlight(index) {
        if (visible[active]) visible[active].setAttribute('aria-selected', 'false');
        active = index;
        const option = visible[active];
        if (!option) { input.removeAttribute('aria-activedescendant'); return; }
        option.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({block: 'nearest'});
      }
      function show() {
        highlight(-1);
        const words = taskPersonKey(input) ? [] : normalize(input.value.trim()).split(/\s+/);
        visible = options.filter(function(option, i) {
          option.hidden = !words.every(function(word) { return searchable[i].includes(word); });
          return !option.hidden;
        });
        empty.hidden = !!visible.length;
        input.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
      }
      function close() {
        highlight(-1);
        input.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
      function choose(option) {
        input.value = names[options.indexOf(option)];
        input.setAttribute('data-person-key', option.getAttribute('data-key'));
        close();
      }
      input.addEventListener('focus', show);
      input.addEventListener('click', show);
      input.addEventListener('blur', close);
      input.addEventListener('input', function() {
        input.setAttribute('data-person-key', '');
        show();
      });
      menu.addEventListener('mousedown', function(e) {
        if (e.target.closest('[data-key]')) e.preventDefault();
      });
      menu.addEventListener('click', function(e) {
        const option = e.target.closest('[data-key]');
        if (option) choose(option);
      });
      input.addEventListener('keydown', function(e) {
        if (e.isComposing) return;
        if (e.key === 'Escape' && !menu.hidden) {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (menu.hidden) show();
          if (visible.length) highlight(e.key === 'ArrowDown' ? Math.min(active + 1, visible.length - 1) : active <= 0 ? visible.length - 1 : active - 1);
        } else if (e.key === 'Enter' && !menu.hidden && (visible[active] || visible.length === 1)) {
          e.preventDefault();
          choose(visible[active] || visible[0]);
        }
      });
    });
  }
  window.crmTaskPersonPicker = taskPersonPicker;
  window.crmTaskPersonKey = taskPersonKey;
  window.crmBindTaskPeople = bindTaskPeople;

  window.crmTaskStyles = function () {
    if (!document.getElementById('crm-controls-style')) {
      const st = document.createElement('style');
      st.id = 'crm-controls-style';
      st.textContent = `
        select:not([multiple]):not([size]) { -webkit-appearance:none; -moz-appearance:none; appearance:none; cursor:pointer;
          background-color:#fff; border:1px solid #c3cad8; border-radius:6px; color:#1f2433; font-family:inherit; line-height:1.4;
          padding-right:30px !important; text-overflow:ellipsis; transition:border-color .2s, box-shadow .2s;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%238c8c8c' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
          background-repeat:no-repeat !important; background-position:right 10px center !important; background-size:12px 12px !important; }
        select:not([multiple]):not([size]):hover { border-color:#2f4a8a; }
        select:not([multiple]):not([size]):focus { outline:none; border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
        select:not([multiple]):not([size]):disabled { background-color:#f3f5f9 !important; color:#8a92a3; cursor:not-allowed; border-color:#c3cad8; }
        select option { color:#1f2433; background:#fff; }
        select option:disabled { color:#8a92a3; }
        input[type=file] { font-family:inherit; font-size:13px; color:#3a4256; max-width:100%; }
        input[type=file]::file-selector-button { font:inherit; font-size:13px; color:#1c2d58; background:#fff; border:1px solid #c3cad8; border-radius:6px;
          padding:5px 12px; margin-right:10px; cursor:pointer; transition:border-color .2s, color .2s, background .2s; }
        input[type=file]::file-selector-button:hover { border-color:#1c2d58; background:#e9edf5; }
      `;
      document.head.appendChild(st);
    }
  if (!document.getElementById('crm-tk-style')) {
    const st = document.createElement('style');
    st.id = 'crm-tk-style';
    st.textContent = `
      .tk { color:#1f2433; font-size:14px; }
      body:has(#crm-tasks) [aria-label="Открыть ИИ-чат"] { display:none !important; }
      .tk-head { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
      .tk-title { font-family:var(--kn-tilda,"Tilda Sans","Segoe UI",sans-serif); font-size:20px; font-weight:650; line-height:1.25; color:#1c2d58; }
      .tk-sub { color:#5b6478; font-size:13px; margin-bottom:14px; }
      .tk-tabs { display:flex; gap:2px; border-bottom:1px solid #dfe3ec; margin-bottom:14px; flex-wrap:wrap; }
      .tk-tab { border:none; background:none; padding:9px 14px; font:inherit; font-size:14px; color:#3a4256; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
      .tk-tab.on { color:#1c2d58; border-bottom-color:#1c2d58; font-weight:600; }
      .tk-tab b { font-weight:600; color:#5b6478; margin-left:4px; font-size:12.5px; }
      .tk-new { margin-left:auto; border:none; background:#1c2d58; color:#fff; border-radius:8px; padding:9px 18px; font:inherit; font-size:14px; font-weight:600; cursor:pointer; }
      .tk-new:hover { background:#2f4a8a; }
      .tk-views { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
      .tk-view { border:1px solid #dfe3ec; background:#fff; border-radius:10px; padding:8px 14px; font:inherit; cursor:pointer; text-align:left; min-width:120px; }
      .tk-view:hover { border-color:#dde5f3; }
      .tk-view .n { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; display:block; line-height:1.2; }
      .tk-view .l { font-size:12.5px; color:#3a4256; }
      .tk-view.on { border-color:#1c2d58; background:#eef2f9; }
      .tk-view.on .l { color:#121d3a; font-weight:600; }
      .tk-view.bad .n { color:#c23b3b; }
      .tk-layout { display:flex; gap:2px; background:#f3f5f9; border-radius:6px; padding:2px; }
      .tk-layout button { border:none; background:transparent; padding:4px 12px; border-radius:5px; font:inherit; font-size:13px; cursor:pointer; color:#3a4256; }
      .tk-layout button.on { background:#fff; color:#1f2433; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
      .kb { display:grid; grid-template-columns:repeat(var(--n, 5), minmax(0, 1fr)); gap:12px; min-height:380px; }
      .kb-col { display:flex; flex-direction:column; min-height:0; min-width:0; background:#f3f5f9; border-radius:10px; border:2px solid transparent; transition:opacity .15s, border-color .15s, background .15s; }
      .kb-col.no { opacity:.4; }
      .kb-col.ok { border-color:#dde5f3; border-style:dashed; }
      .kb-col.drop { border-color:#1c2d58; border-style:solid; background:#eef2f9; }
      .kb-col-h { display:flex; align-items:center; gap:7px; font-weight:600; font-size:13px; padding:10px 12px 8px; color:#1f2433; }
      .kb-col-h i { width:8px; height:8px; border-radius:50%; background:var(--c); flex:none; }
      .kb-col-h b { margin-left:auto; color:#5b6478; font-weight:600; font-variant-numeric:tabular-nums; background:#fff; border-radius:9px; padding:0 7px; font-size:12px; }
      .kb-col-b { flex:1; overflow-y:auto; padding:0 8px 8px; min-height:0; }
      .kb-card { background:#fff; border:1px solid #dfe3ec; border-left:3px solid var(--c); border-radius:8px; padding:9px 11px; margin-bottom:8px; font-size:12.5px; cursor:grab; user-select:none; box-shadow:0 1px 2px rgba(16,24,40,.04); }
      .kb-card:hover { border-color:#dde5f3; border-left-color:var(--c); box-shadow:0 2px 6px rgba(16,24,40,.08); }
      .kb-card:active { cursor:grabbing; }
      .kb-card.drag { opacity:.35; }
      .kb-card.pending { cursor:default; border-color:#1c2d58; border-left-color:var(--c); box-shadow:0 4px 14px rgba(28,45,88,.18); user-select:auto; }
      .kb-t { font-weight:600; font-size:13.5px; line-height:1.35; margin-bottom:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
      .kb-s { color:#5b6478; line-height:1.5; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .kb-note, .kb-empty { font-size:12px; color:#8a92a3; padding:6px 4px; text-align:center; }
      .kb-form { margin-top:8px; padding-top:8px; border-top:1px dashed #c3cad8; }
      .kb-form label { display:block; font-size:12px; color:#3a4256; margin-bottom:4px; }
      .kb-form textarea, .kb-form select { width:100%; box-sizing:border-box; border:1px solid #c3cad8; border-radius:6px; padding:6px 8px; font:inherit; font-size:13px; resize:vertical; background:#fff; }
      .kb-form textarea:focus, .kb-form select:focus { outline:none; border-color:#1c2d58; box-shadow:0 0 0 2px rgba(28,45,88,.12); }
      .kb-form-b { display:flex; align-items:center; gap:6px; margin-top:6px; flex-wrap:wrap; }
      .kb-form-b span { font-size:11px; color:#8a92a3; }
      .kb-ok { border:none; background:#1c2d58; color:#fff; border-radius:6px; padding:5px 12px; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
      .kb-no { border:1px solid #c3cad8; background:#fff; color:#3a4256; border-radius:6px; padding:4px 10px; font:inherit; font-size:12.5px; cursor:pointer; }
      .kb-ok:disabled, .kb-no:disabled { opacity:.5; }
      @media (max-width: 700px) { .kb { grid-template-columns:repeat(var(--n, 5), 260px); overflow-x:auto; } .kb-col-b { max-height:70vh; } }
      .tk-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
      .tk select, .tk input[type=text], .tk input[type=date], .tk textarea, .tk-modal select, .tk-modal input[type=text], .tk-modal input[type=date], .tk-modal textarea {
        border:1px solid #c3cad8; border-radius:6px; padding:7px 10px; font:inherit; font-size:13.5px; background:#fff; color:#1f2433; box-sizing:border-box; }
      .tk-filters select { min-width:160px; }
      .tk-filters input[type=text] { flex:1; min-width:200px; }
      .tk-reset { border:none; background:none; color:#1c2d58; font:inherit; font-size:13px; cursor:pointer; padding:4px; }
      .tk-list { display:flex; flex-direction:column; gap:6px; }
      .tk-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; border:1px solid #dfe3ec; border-left:4px solid var(--c); border-radius:8px; padding:10px 14px; background:#fff; cursor:pointer; }
      .tk-row:hover { border-color:#dde5f3; border-left-color:var(--c); background:#f3f5f9; }
      .tk-row-title { font-weight:600; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tk-row-meta { font-size:12.5px; color:#5b6478; display:flex; gap:12px; flex-wrap:wrap; margin-top:3px; }
      .tk-row-meta span { white-space:nowrap; }
      .tk-row-side { text-align:right; white-space:nowrap; }
      .tk-pill { display:inline-block; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; border:1px solid; white-space:nowrap; }
      .tk-tag { display:inline-block; padding:0 7px; border-radius:4px; background:#f3f5f9; color:#3a4256; font-size:12px; }
      .tk-urg { font-weight:600; }
      .tk-late { color:#c23b3b; font-weight:600; }
      .tk-empty { color:#5b6478; padding:36px 12px; text-align:center; background:#f3f5f9; border-radius:8px; }
      .tk-empty b { display:block; color:#3a4256; font-size:15px; margin-bottom:4px; }
      .tk-more { display:block; margin:10px auto 0; }
      .tk-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px; }
      .tk-tile { border:1px solid #dfe3ec; border-radius:10px; padding:12px 14px; background:#fff; }
      .tk-tile-l { font-size:12.5px; color:#5b6478; }
      .tk-tile-v { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px; }
      .tk-tile-n { font-size:12px; color:#5b6478; margin-top:2px; }
      /* статистика */
      #crm-tasks .st { display:flex; flex-direction:column; gap:16px; }
      #crm-tasks .st-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
      #crm-tasks .st-lbl { font-size:13px; color:#3a4256; font-weight:600; }
      #crm-tasks .st-bar .tk-layout { margin-left:0; }
      #crm-tasks .st-hint { font-size:12.5px; color:#3a4256; }
      #crm-tasks .st-tiles { display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:10px; }
      #crm-tasks .st-tile { border:1px solid #dfe3ec; border-radius:10px; padding:12px 14px; background:#fff; cursor:pointer; transition:border-color .15s, box-shadow .15s; min-width:0; }
      #crm-tasks .st-tile:hover { border-color:#1c2d58; box-shadow:0 2px 8px rgba(16,24,40,.08); }
      #crm-tasks .st-tl { font-size:12.5px; color:#3a4256; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #crm-tasks .st-tv { font-size:26px; font-weight:700; font-variant-numeric:tabular-nums; margin:4px 0 2px; color:#1f2433; white-space:nowrap; }
      #crm-tasks .st-tv small { font-size:13px; font-weight:600; color:#3a4256; }
      #crm-tasks .st-tn { font-size:12.5px; color:#3a4256; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #crm-tasks .st-card { border:1px solid #dfe3ec; border-radius:10px; background:#fff; padding:14px 16px 12px; min-width:0; }
      #crm-tasks .st-ch { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
      #crm-tasks .st-ct { font-size:15px; font-weight:700; color:#1f2433; margin-right:4px; }
      #crm-tasks .st-scroll { overflow-x:auto; }
      #crm-tasks table.st-t { width:100%; table-layout:fixed; border-collapse:collapse; font-size:13.5px; color:#1f2433; }
      #crm-tasks .st-t th { font-weight:600; color:#1f2433; font-size:12.5px; padding:8px 12px; background:#e9edf5; border-bottom:2px solid #c3cad8; white-space:nowrap; text-align:left; }
      #crm-tasks .st-t th.n { text-align:right; }
      #crm-tasks .st-t th.st-now { background:#dde5f3; }
      #crm-tasks .st-t td { padding:9px 12px; border-bottom:1px solid #dfe3ec; font-variant-numeric:tabular-nums; white-space:nowrap; font-weight:500; }
      #crm-tasks .st-t td.n { text-align:right; }
      #crm-tasks .st-t tbody tr:nth-child(even) td { background:#f3f5f9; }
      #crm-tasks .st-t th.st-name, #crm-tasks .st-t td.st-name { width:24%; }
      #crm-tasks .st-t th.st-pr { width:18%; }
      #crm-tasks .st-t td.st-name { white-space:normal; font-weight:600; color:#1f2433; }
      #crm-tasks .st-t .st-sep { border-left:2px solid #dfe3ec; }
      #crm-tasks .st-t tr.st-link { cursor:pointer; }
      #crm-tasks .st-t tr.st-link:hover td { background:#eef2f9; }
      #crm-tasks .st-t td.st-pr { white-space:normal; }
      #crm-tasks .st-t thead th { white-space:normal; line-height:1.25; vertical-align:bottom; }
      #crm-tasks .st-sub { font-size:12px; color:#3a4256; font-weight:400; margin-top:2px; line-height:1.35; }
      #crm-tasks .st-tag { display:inline-block; background:#dfe3ec; color:#3a4256; border-radius:4px; padding:0 5px; margin-right:6px; font-size:11px; line-height:16px; }
      #crm-tasks .st-mute { color:#8a92a3; font-weight:400; }
      #crm-tasks .st-bad { display:inline-block; color:#fff; background:#c23b3b; border-radius:10px; padding:0 8px; font-weight:700; font-size:12.5px; line-height:20px; }
      #crm-tasks .st-badt { color:#c23b3b; font-weight:700; }
      #crm-tasks .st-ok { color:#2f7d4f; font-weight:700; }
      #crm-tasks .st-warn { color:#8a5a00; font-weight:700; }
      #crm-tasks .st-chip { display:inline-block; background:#f6eedb; color:#8a5a00; border:1px solid #e8d3a6; border-radius:10px; padding:0 8px; font-size:12px; line-height:20px; margin:1px 0; font-weight:600; }
      #crm-tasks .st-legend { display:flex; align-items:center; gap:6px; font-size:12px; color:#3a4256; margin-top:8px; }
      #crm-tasks .st-legend span { width:12px; height:12px; border-radius:3px; display:inline-block; margin-left:10px; }
      #crm-tasks .st-legend span:first-child { margin-left:0; }
      #crm-tasks .st-legend .st-now { background:#dde5f3; border:1px solid #c3cad8; }
      #crm-tasks .st-legend .st-per { background:#e9edf5; border:1px solid #c3cad8; }
      #crm-tasks .st-wk th:first-child { background:#e9edf5; width:16%; }
      #crm-tasks .st-wk tbody th { background:#f3f5f9; border-bottom:1px solid #dfe3ec; font-weight:600; color:#1f2433; cursor:help; }
      #crm-tasks .st-scroll table.st-t { min-width:900px; }
      @media (max-width: 1100px) { #crm-tasks .st-tiles { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
      @media (max-width: 600px) { #crm-tasks .st-tiles { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
      #crm-tasks .st-hot { display:inline-block; color:#8a5a00; background:#f6eedb; border-radius:10px; padding:0 8px; font-weight:700; font-size:12.5px; line-height:20px; }
      .tk-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(460px, 1fr)); gap:12px; }
      .tk-card { border:1px solid #dfe3ec; border-radius:8px; padding:12px 14px; background:#fff; min-width:0; overflow-x:auto; }
      .tk-card-t { font-weight:600; margin-bottom:8px; }
      .tk table, .tk-modal table { width:100%; border-collapse:collapse; font-size:13px; }
      .tk th, .tk-modal th { text-align:left; font-weight:600; color:#3a4256; padding:6px 8px; border-bottom:1px solid #dfe3ec; white-space:nowrap; }
      .tk td, .tk-modal td { padding:6px 8px; border-bottom:1px solid #f3f5f9; font-variant-numeric:tabular-nums; }
      .tk th.n, .tk td.n, .tk-modal td.n { text-align:right; }
      .tk tr[data-go], .tk-modal tr[data-task] { cursor:pointer; }
      .tk tr[data-go]:hover td, .tk-modal tr[data-task]:hover td { background:#eef2f9; }
      /* окна */
      .tk-modal { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:24px 12px; overflow:auto; }
      .tk-box { background:#fff; border-radius:12px; width:100%; max-width:760px; box-shadow:0 6px 16px rgba(0,0,0,.12); font-size:14px; color:#1f2433; }
      .tk-box-h { display:flex; align-items:flex-start; gap:10px; padding:16px 20px 12px; border-bottom:1px solid #dfe3ec; }
      .tk-box-t { font-size:17px; font-weight:700; flex:1; min-width:0; }
      .tk-box-t small { display:block; margin-top:6px; font-size:13px; font-weight:400; color:#3a4256; }
      .tk-x { border:none; background:transparent; font-size:18px; color:#5b6478; cursor:pointer; padding:2px 6px; }
      .tk-box-b { padding:16px 20px 20px; }
      .tk-form { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px 16px; }
      .tk-form .full { grid-column:1 / -1; }
      .tk-f label { display:block; font-size:12.5px; color:#3a4256; margin-bottom:4px; }
      .tk-person { position:relative; }
      .tk-person input { width:100%; background:#fff; }
      .tk-person-list { position:absolute; z-index:5; top:calc(100% + 4px); left:0; right:0; max-height:230px; overflow:auto; overscroll-behavior:contain; border:1px solid #dfe3ec; border-radius:10px; padding:4px; background:#fff; box-shadow:0 8px 20px rgba(28,45,88,.15); }
      .tk-person-option { padding:8px 10px; border-radius:6px; cursor:pointer; overflow-wrap:anywhere; }
      .tk-person-option:hover, .tk-person-option[aria-selected="true"] { background:#eef2f9; color:#1c2d58; }
      .tk-person-option small, .tk-person-empty { color:#5b6478; font-size:12px; }
      .tk-person-option small { display:block; }
      .tk-person-empty { padding:8px 10px; }
      [data-observer-list]:not(:empty) { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
      [data-observer-add] { margin-top:6px; }
      .tk-f label i { color:#c23b3b; font-style:normal; }
      .tk-f select, .tk-f input, .tk-f textarea { width:100%; }
      .tk-f textarea { min-height:70px; resize:vertical; }
      .tk-hint { font-size:12px; color:#5b6478; margin-top:3px; }
      .tk-seg { display:flex; gap:6px; flex-wrap:wrap; }
      .tk-seg button { flex:1; border:1px solid #c3cad8; background:#fff; border-radius:6px; padding:7px 8px; font:inherit; font-size:13px; cursor:pointer; white-space:nowrap; }
      .tk-seg button.on { border-color:var(--c); background:var(--c); color:#fff; font-weight:600; }
      .tk-quickdue { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
      .tk-quickdue button { border:1px solid #c3cad8; background:#f3f5f9; border-radius:12px; padding:2px 10px; font:inherit; font-size:12.5px; cursor:pointer; color:#3a4256; }
      .tk-quickdue button:hover { border-color:#1c2d58; color:#1c2d58; }
      .tk-adv { margin-top:14px; border-top:1px dashed #dfe3ec; padding-top:10px; }
      .tk-adv-t { border:none; background:none; color:#1c2d58; font:inherit; font-size:13.5px; cursor:pointer; padding:0; }
      .tk-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; align-items:center; }
      .tk-btn { border:1px solid #c3cad8; background:#fff; border-radius:6px; padding:7px 14px; font:inherit; font-size:13.5px; cursor:pointer; color:#1f2433; }
      .tk-btn:hover { border-color:#1c2d58; color:#1c2d58; }
      .tk-btn.pri { border-color:#1c2d58; background:#1c2d58; color:#fff; font-weight:600; }
      .tk-btn.ok { border-color:#2f7d4f; background:#2f7d4f; color:#fff; font-weight:600; }
      .tk-btn.warn { color:#c23b3b; border-color:#e7b9b9; }
      .tk-btn.link { border-color:transparent; color:#3a4256; }
      .tk-btn:disabled { opacity:.5; cursor:default; }
      .tk-next { border:1px solid #dde5f3; background:#e9edf5; border-radius:10px; padding:12px 14px; margin-bottom:14px; }
      .tk-next-t { font-weight:600; margin-bottom:2px; }
      .tk-next-s { font-size:13px; color:#3a4256; }
      .tk-next .tk-actions { margin-top:10px; }
      .tk-meta { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:10px 16px; font-size:13.5px; }
      .tk-meta .l { font-size:12px; color:#5b6478; margin-bottom:1px; }
      .tk-desc { white-space:pre-wrap; background:#f3f5f9; border-radius:8px; padding:10px 12px; margin-top:12px; font-size:13.5px; }
      .tk-actbox { margin-top:12px; padding:12px; border:1px solid #dde5f3; background:#fff; border-radius:8px; }
      .tk-more-menu { display:none; gap:6px; flex-wrap:wrap; margin-top:8px; }
      .tk-more-menu.on { display:flex; }
      .tk-tl { margin-top:18px; border:1px solid #dfe3ec; border-radius:14px; overflow:hidden; background:#fff; }
      .tk-tl-h { display:flex; align-items:center; gap:10px; padding:10px 14px; flex-wrap:wrap; }
      .tk-tl-h b { font-size:14.5px; }
      .tk-thread { background:#f3f5f9; padding:14px; min-height:88px; max-height: min(360px, 45vh); overflow-y:auto; overscroll-behavior:contain; }
      .tk-msg { display:flex; gap:8px; align-items:flex-end; margin:0 0 6px; }
      .tk-msg.own { justify-content:flex-end; }
      .tk-msg .tk-ava { width:28px; height:28px; font-size:11px; flex-shrink:0; }
      .tk-msg-b { min-width:0; max-width:72%; padding:8px 12px; border-radius:16px 16px 16px 5px; background:#fff; color:#1f2433; font-size:13.5px; line-height:1.42; overflow-wrap:anywhere; box-shadow:0 1px 2px rgba(20,30,60,.06); }
      .tk-msg.own .tk-msg-b { background:#1c2d58; color:#fff; border-radius:16px 16px 5px 16px; }
      .tk-msg-author { display:block; color:#1c2d58; font-size:11px; margin-bottom:2px; }
      .tk-msg-time { display:block; text-align:right; font-size:11px; opacity:.8; margin-top:2px; }
      .tk-msg-t { white-space:pre-wrap; }
      .tk-msg.sys { display:block; text-align:center; font-size:12px; color:#5b6478; padding:4px; overflow-wrap:anywhere; }
      .tk-msg-file { display:block; background:transparent; border:0; padding:2px 0; color:inherit; font:inherit; text-align:left; text-decoration:underline; cursor:pointer; overflow-wrap:anywhere; }
      .tk-comment { display:flex; gap:8px; padding:10px 12px; align-items:flex-end; border-top:1px solid #dfe3ec; }
      .tk-comment textarea { flex:1; min-width:0; min-height:40px; max-height:110px; resize:vertical; background:#f3f5f9; border-radius:14px; }
      .tk-comment textarea:focus { background:#fff; }
      .tk-comment .tk-btn { flex:0 0 40px; width:40px; height:40px; padding:0; border-radius:50%; font-size:17px; }
      .tk-comment-file:not(:empty) { padding:0 14px 8px; overflow-wrap:anywhere; }
      .tk-card-modal > .tk-box { max-width:none; overflow:hidden; }
      .tk-card-modal .tk-box-h { padding:18px 24px; }
      .tk-card-modal .tk-box-t { font-size:clamp(18px, 2vw, 24px); overflow-wrap:anywhere; }
      .tk-card-body { display:grid; grid-template-columns:minmax(0, 2fr) minmax(0, 3fr); grid-template-areas:"thread details"; min-height:0; }
      .tk-card-data { grid-area:details; min-width:0; overflow:auto; overscroll-behavior:contain; padding:20px 24px; }
      .tk-card-section { margin-top:14px; padding:14px 16px; border:1px solid #dfe3ec; border-radius:10px; overflow-wrap:anywhere; }
      .tk-card-section h3 { margin:0 0 10px; color:#1c2d58; font-size:15px; }
      .tk-card-section .tk-desc { margin:0; }
      .tk-card-body .tk-tl { grid-area:thread; display:flex; flex-direction:column; min-width:0; min-height:0; margin:0; border:0; border-right:1px solid #dfe3ec; border-radius:0; }
      .tk-card-body .tk-thread { flex:1; max-height:none; }
      .tk-card-body .tk-tl-h, .tk-card-body .tk-comment { flex-shrink:0; }
      @media (min-width: 851px) {
        .tk-card-modal { padding:8px; }
        .tk-card-modal > .tk-box { height:calc(100dvh - 16px); min-height:440px; }
        .tk-card-modal [data-tk-card] { display:grid; grid-template-rows:auto minmax(0, 1fr); height:100%; }
      }
      .tk-card-switch { display:none; }
      @media (max-width: 850px) {
        .tk-card-modal { padding:0; }
        .tk-card-modal > .tk-box { height:100dvh; border-radius:0; }
        .tk-card-modal [data-tk-card] { display:grid; grid-template-rows:auto auto minmax(0, 1fr); height:100%; }
        .tk-card-modal .tk-box-h { padding:max(8px, env(safe-area-inset-top)) 12px 8px 16px; align-items:center; }
        .tk-card-modal .tk-x { min-width:44px; min-height:44px; }
        .tk-card-switch { display:flex; gap:4px; padding:4px 12px; background:#f3f5f9; border-bottom:1px solid #dfe3ec; }
        .tk-card-switch button { min-width:0; flex:1; min-height:44px; border:0; border-radius:6px; background:transparent; color:#26354f; font:inherit; cursor:pointer; }
        .tk-card-switch button[aria-pressed="true"] { background:#1c2d58; color:#fff; font-weight:600; }
        .tk-card-body { display:grid; grid-template-columns:minmax(0, 1fr); grid-template-areas:"details"; }
        .tk-card-data { padding:12px 12px max(12px, env(safe-area-inset-bottom)); }
        .tk-card-data .tk-meta { grid-template-columns:repeat(2, minmax(0,1fr)); }
        .tk-card-data .tk-btn { min-height:44px; }
        .tk-card-modal [data-tk-card] :is(input[type=text], input[type=date], textarea, select) { font-size:16px; }
        .tk-card-body .tk-tl { display:none; border:0; padding-bottom:env(safe-area-inset-bottom); }
        .tk-card-body .tk-thread { min-height:0; }
        .tk-card-body .tk-comment .tk-btn { flex-basis:44px; width:44px; height:44px; }
        [data-tk-card][data-task-pane="chat"] .tk-card-body { grid-template-areas:"thread"; }
        [data-tk-card][data-task-pane="chat"] .tk-card-data { display:none; }
        [data-tk-card][data-task-pane="chat"] .tk-tl { display:flex; }
      }
      @media (min-width: 851px) and (max-width: 1100px) {
        .tk-card-data .tk-meta { grid-template-columns:repeat(2, minmax(0,1fr)); }
      }
      .tk-sec { font-weight:600; margin:18px 0 6px; display:flex; align-items:center; gap:10px; }
      @media (max-width: 700px) {
        .tk-new { margin-left:0; width:100%; padding:12px; font-size:15px; }
        .tk-view { flex:1 1 30%; min-width:0; padding:6px 10px; }
        .tk-filters select, .tk-filters input[type=text] { flex:1 1 100%; min-width:0; }
        .tk-row { grid-template-columns:1fr; }
        .tk-row-side { text-align:left; }
        .tk-grid2 { grid-template-columns:1fr; }
        .tk-modal { padding:0; }
        .tk-box { border-radius:0; min-height:100%; max-width:none; }
        .tk-form, .tk-meta { grid-template-columns:1fr; }
        .tk-btn { flex:1 1 45%; padding:10px; }
        .tk-msg-b { max-width:84%; font-size:15px; }
        .tk-thread { padding:10px; }
      }
    `;
    document.head.appendChild(st);
  }
  };

  function workDialogStyles() {
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
    .crm-pay-register { min-width:0; }
    .crm-pay-register .kb-card { display:block; color:inherit; text-decoration:none; cursor:pointer; }
    .crm-pay-register .kb-card[draggable=true] { cursor:grab; }
    .crm-pay-register .kb-card[draggable=true]:active { cursor:grabbing; }
    .crm-pay-register .kb-col-h { overflow-wrap:anywhere; }
    .crm-pay-mask.tk-modal { align-items:flex-start; backdrop-filter:none; background:rgba(0,0,0,.45); }
    .crm-pay-card label { display:block; margin:0 0 8px; }
    .crm-pay-card .tk-f :is(input, textarea, select) { display:block; margin-top:4px; }
    .crm-pay-card .tk-f { margin-top:10px; }
    .crm-pay-card .tk-box-t small { overflow-wrap:anywhere; }
    .crm-pay-card .tk-pill { white-space:normal; }
    .crm-pay-card .tk-meta { overflow-wrap:anywhere; }
    .crm-pay-card .tk-meta dl,.crm-pay-card .tk-meta dd { margin:0; }
    .crm-pay-card [data-pay-status] { position:absolute; bottom:0; right:0; margin:0; background:#fff; }
    .crm-pay-card { position:relative; }
    .crm-pay-card [data-pay-status]:not(:empty) { padding:4px 14px; }
    .crm-pay-card .tk-msg[hidden] { display:none; }
    .crm-pay-card .tk-tl-h label { margin:0 0 0 auto; }
    .crm-pay-card [data-pay-files] { display:grid; gap:6px; }

`;
      document.head.appendChild(style);
    }
  }
  function workDialog(title, key, cls, html, trigger) {
    workDialogStyles();
    const titleId = 'crm-'+key+'-title';
    const m = modal('<header class="kb-heading"><h2 id="'+titleId+'">'+title+'</h2>'
      + '<button type="button" class="kb-close" aria-label="Закрыть">×</button></header>'+html, 'crm-work-dialog '+cls);
    m.classList.add('crm-work-mask');
    const dialog = m.querySelector('.crm-work-dialog');
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby',titleId);
    const close = m.close;
    m.close = () => {
      close();
      if (!trigger) return;
      if (!trigger.matches('button,a[href],input,select,textarea,[tabindex]')) trigger.setAttribute('tabindex','-1');
      setTimeout(() => trigger.focus(),0);
    };
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

  async function paymentApi(path, input) {
    const token = localStorage.getItem('NOCOBASE_TOKEN');
    const response = await fetch('/rqsvc/' + path, {
      method: input ? 'POST' : 'GET',
      headers: {Authorization:'Bearer ' + (token || ''), 'Content-Type':'application/json'},
      body: input && JSON.stringify(input)
    });
    if (response.status === 401) throw new Error('Войдите в CRM и повторите действие');
    if (response.status === 413) throw new Error('Файл слишком большой');
    if (response.ok && path.includes('/files/')) return response.blob();
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Сервис заявок недоступен');
    return result;
  }
  async function paymentFile(file) {
    if (!file) return undefined;
    if (file.size > 5 * 1024 * 1024) throw new Error('Размер документа больше 5 МБ');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const encoded = [];
    for (let i = 0; i < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      encoded.push(alphabet[n >> 18 & 63] + alphabet[n >> 12 & 63]
        + (i + 1 < bytes.length ? alphabet[n >> 6 & 63] : '=') + (i + 2 < bytes.length ? alphabet[n & 63] : '='));
    }
    const data = encoded.join('');
    return {name:file.name,data};
  }
  const paymentAmount = v => Number.isFinite(v) ? v.toLocaleString('ru-RU', {minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₽' : '—';
  const paymentDate = v => v ? String(v).slice(0,10).split('-').reverse().join('.') : '—';
  const paymentColors = {0:'#5b6478',2:'#1c2d58',3:'#2f4a8a',4:'#8a5a00',5:'#5b6478',6:'#2f7d4f'};
  function paymentRegister(panel) {
    window.crmTaskStyles();
    workDialogStyles();
    panel.classList.add('tk','crm-pay-register');
    let filter = '', rows = [], statuses = {};
    function render() {
      const stages = Object.entries(statuses).filter(([id]) => id !== '0' || rows.some(x => x.status === 0));
      const columns = stages.filter(([id]) => !filter || id === filter);
      const scroll = panel.querySelector('.kb')?.scrollLeft || 0;
      panel.innerHTML = '<div class="tk-filters"><select aria-label="Статус" data-pay-filter><option value="">Все статусы</option>'
        + stages.map(([id,name]) => '<option value="' + id + '"' + (id === filter ? ' selected' : '') + '>' + e(name) + '</option>').join('')
        + '</select><button type="button" class="tk-btn" data-pay-refresh>Обновить</button></div>'
        + '<div class="kb" style="--n:'+columns.length+'" tabindex="0" role="region" aria-label="Канбан заявок">'
        + columns.map(([status,name]) => {
          const items = rows.filter(x => String(x.status) === status);
          return '<section class="kb-col" data-pay-stage="'+status+'"><div class="kb-col-h" style="--c:'+paymentColors[status]+'"><i></i>' + e(name) + '<b>' + items.length + '</b></div><div class="kb-col-b">'
            + items.map(x => '<a class="kb-card" style="--c:'+paymentColors[status]+'" draggable="'
              + String(!filter && x.nextStatus != null && x.nextStatus !== x.status) + '" data-pay-id="' + Number(x.id) + '" href="/admin/payreqpage1?payments='
              + Number(x.id) + '"><div class="kb-t">' + e(x.purpose || 'Заявка на оплату') + '</div><div class="kb-s">№' + Number(x.id)
              + ' · ' + e(x.object || '—') + '</div><div class="kb-s">' + e(x.counterparty || '—') + '</div><div class="kb-s">'
              + e(paymentAmount(x.amount)) + ' · до ' + e(paymentDate(x.due)) + '</div>'
              + (x.needsAction ? '<div class="kb-s tk-urg">Ждёт вашего действия</div>' : '') + '</a>').join('')
            + (items.length ? '' : '<div class="kb-empty">Пусто</div>') + '</div></section>';
        }).join('') + '</div>';
      const board = panel.querySelector('.kb');
      let dragged;
      function clearDrag() {
        dragged = null;
        board.querySelectorAll('.kb-card.drag, .kb-col').forEach(el => el.classList.remove('drag','ok','no','drop'));
      }
      board.ondragstart = event => {
        const link = event.target.closest('.kb-card[draggable=true]');
        if (!link) return;
        dragged = rows.find(x => x.id === Number(link.dataset.payId));
        link.classList.add('drag');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain',String(dragged.id));
        board.querySelectorAll('[data-pay-stage]').forEach(column => {
          const stage = Number(column.dataset.payStage);
          if (stage !== dragged.status) column.classList.add(stage === dragged.nextStatus ? 'ok' : 'no');
        });
      };
      board.ondragend = clearDrag;
      board.ondragover = event => {
        const column = event.target.closest('.kb-col.ok');
        if (!dragged || !column) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        column.classList.add('drop');
      };
      board.ondragleave = event => {
        const column = event.target.closest('.kb-col.drop');
        if (column && !column.contains(event.relatedTarget)) column.classList.remove('drop');
      };
      board.ondrop = event => {
        if (!dragged) return;
        event.preventDefault();
        const column = event.target.closest('.kb-col.ok');
        const link = board.querySelector('.kb-card.drag');
        const {id,status,nextStatus} = dragged;
        clearDrag();
        if (column && link) openPaymentCard(id,link,refresh,{status,nextStatus});
      };
      board.scrollLeft = scroll;
      fitPaymentBoards();
      panel.querySelector('[data-pay-filter]').onchange = event => {
        filter = event.target.value;
        render();
        panel.querySelector('[data-pay-filter]').focus();
      };
      panel.querySelector('[data-pay-refresh]').onclick = refresh;
      panel.querySelectorAll('[data-pay-id]').forEach(link => {
        link.onclick = event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          openPaymentCard(Number(link.getAttribute('data-pay-id')),link,refresh);
        };
      });
    }
    async function refresh() {
      try {
        ({rows,statuses} = await paymentApi('payments'));
        if (filter === '0' && !rows.some(x => x.status === 0)) filter = '';
        render();
      } catch (error) {
        panel.textContent = error.message;
      }
    }
    panel.textContent = 'Загрузка заявок…';
    return refresh();
  }
  function fitPaymentBoards() {
    document.querySelectorAll('.crm-pay-register .kb').forEach(board => {
      const frame = board.closest('.kb-dialog');
      const bottom = frame ? frame.getBoundingClientRect().bottom : window.innerHeight;
      board.style.height = window.innerWidth > 700 ? Math.max(380,bottom - board.getBoundingClientRect().top - 24) + 'px' : '';
    });
  }
  window.addEventListener('resize',fitPaymentBoards);
  window.crmPaymentRegister = paymentRegister;
  function openPaymentRegister(trigger) {
    const m = workDialog('Заявки на оплату','payment-register','kb-dialog','<div class="kb-article" data-pay-register></div>',trigger);
    paymentRegister(m.querySelector('[data-pay-register]'));
  }
  function openPaymentCard(id, trigger, onChange, transition) {
    if (document.querySelector('[data-pay-card]')) return;
    window.crmTaskStyles();
    workDialogStyles();
    const m = modal('<div data-tk-card data-pay-card>Загрузка…</div>','tk-box crm-pay-card');
    m.classList.add('tk-modal','tk-card-modal','crm-pay-mask');
    const dialog = m.querySelector('.tk-box');
    dialog.classList.remove('crmp-dlg');
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','Заявка на оплату № ' + id);
    const close = m.close;
    m.close = () => {
      const updated = trigger && (trigger.isConnected ? trigger : document.querySelector('[data-pay-id="'+id+'"]'));
      close();
      updated?.focus();
    };
    const body = m.querySelector('[data-pay-card]');
    async function render() {
      try {
        const data = await paymentApi('payments/' + id);
        const r = data.record;
        const values = [['Объект',r.object],['Сумма',paymentAmount(r.amount)],['Оплатить до',paymentDate(r.due)],
          ['Контрагент',r.counterparty],['Контактное лицо',r.contact],['Телефон',r.phone],['Эл. почта',r.email],['Исходный номер',r.legacyId]];
        const fileInput = (label, key) => '<label>' + label + '<input type="file" name="' + key + '" accept=".pdf,.jpg,.jpeg,.png"></label>';
        const roleLabels = {senior:'Старший управляющий',approver:'Главный согласующий',chief:'Главный бухгалтер',accountant:'Бухгалтер объекта'};
        const employees = (data.employees || []).map(person => [String(person.id), person.name]);
        const returnStages = [2,3].filter(id => r.status < 5 && id < r.status);
        const manage = r.canManage ? '<details><summary>Управление заявкой</summary><form class="tk-f" data-pay-manage>'
          + '<label>Действие<select name="action"><option value="assign">Передать сотруднику</option><option value="due">Перенести срок оплаты</option>'
          + (returnStages.length ? '<option value="return">Вернуть на этап согласования</option>' : '') + '</select></label>'
          + '<div data-pay-adjust="assign"><label>Чью роль передать<select name="role">'
          + r.awaiting.map(x=>'<option value="'+e(x.role)+'">'+e(roleLabels[x.role]+' · '+x.name)+'</option>').join('')
          + '</select></label><label>Кому передать</label>'
          + taskPersonPicker(employees,'name="user"','Кому передать','','Выберите сотрудника') + '</div>'
          + '<div data-pay-adjust="due" hidden><label>Новый срок оплаты<input type="date" name="due" value="'+e(r.due)+'"></label></div>'
          + '<div data-pay-adjust="return" hidden><label>Этап<select name="stage">'
          + returnStages.map(id=>'<option value="'+id+'">'+e(data.statuses[id])+'</option>').join('') + '</select></label></div>'
          + '<label>Причина<textarea name="comment" required maxlength="2000"></textarea></label>'
          + '<button type="submit" class="tk-btn pri">Сохранить изменение</button></form></details>' : '';
        const action = r.status === 4 ? 'Подтвердить оплату' : r.status === 5 ? 'Подтвердить документы и закрыть' : 'Согласовать';
        const fileButton = f => '<button type="button" class="tk-msg-file" data-pay-file="'+Number(f.id)+'">📎 ' + e(f.name) + '</button>';
        const observers = (r.subscribers || []).map(person => '<span class="tk-tag">' + e(person.name) + (r.canWatch
          ? ' <button type="button" class="tk-reset" data-pay-remove="' + Number(person.id) + '" aria-label="' + e('Удалить наблюдающего ' + person.name) + '">×</button>' : '') + '</span>').join(' ');
        const watch = r.canWatch ? '<form class="tk-f" data-pay-watch><label>Добавить наблюдающего</label>'
          + taskPersonPicker(employees.filter(([id]) => !data.observerExclusions.includes(Number(id))),
            'name="user"','Добавить наблюдающего','','Выберите сотрудника')
          + '<button type="submit" class="tk-btn" data-observer-add>Добавить</button></form>' : '';
        const awaiting = r.awaiting.map(x => x.name).join(', ');
        const canConfirm = !transition || (r.status === transition.status && r.nextStatus === transition.nextStatus);
        const color = paymentColors[r.status];
        const isSystem = entry => entry.kind !== 'message' && !entry.fileId && /^(Подана заявка$|Согласовано(?: старшим управляющим)?(?::|$)|Оплата подтверждена(?::|$)|Закрывающие документы проверены(?::|$)|Передано:|Срок перенесён:|Возврат на этап:|(?:Добавлен|Удалён) наблюдающий:|Заявка закрыта$|Этап изменён$)/.test(entry.text);
        const systemCount = r.history.filter(isSystem).length;
        const messageCount = r.history.length - systemCount;
        const showSystem = body.querySelector('[data-pay-show-system]')?.checked || false;
        const restoreFocus = body.contains(document.activeElement);
        body.innerHTML = '<header class="tk-box-h"><div class="tk-box-t">' + e(r.purpose || 'Заявка на оплату')
          + '<small><span class="tk-pill" style="color:'+color+';border-color:'+color+'55;background:'+color+'10">' + e(data.statuses[r.status])
          + '</span> &nbsp;№' + id + '</small></div><button class="tk-x" type="button" aria-label="Закрыть карточку заявки">✕</button></header>'
          + '<div class="tk-card-switch" role="group" aria-label="Разделы заявки"><button type="button" data-pay-pane="details">Сведения</button>'
          + '<button type="button" data-pay-pane="chat">Переписка' + (messageCount ? ' (' + messageCount + ')' : '') + '</button></div>'
          + '<div class="tk-card-body"><aside class="tk-card-data" aria-label="Сведения о заявке">'
          + '<div class="tk-next"><div class="tk-next-t">' + (r.needsAction ? 'Заявка ждёт вашего действия' : e(data.statuses[r.status])) + '</div>'
          + (awaiting ? '<div class="tk-next-s">' + e(awaiting) + '</div>' : '')
          + (transition ? '<div class="tk-next-s">' + e(canConfirm ? 'Перенос в «' + data.statuses[transition.nextStatus] + '» после подтверждения' : 'Этап изменился. Закройте карточку и обновите доску') + '</div>' : '')
          + (r.needsAction && canConfirm ? '<form class="tk-f" data-pay-advance><label>Комментарий к решению<textarea name="comment" maxlength="2000"></textarea></label>'
            + (r.status === 4 ? fileInput('Платёжное поручение','bill') : r.status === 5 ? fileInput('Акт / накладная / счёт-фактура','bill') + fileInput('Дополнения','extra') : '')
            + '<div class="tk-actions"><button type="submit" class="tk-btn ok">'+action+'</button></div></form>' : '')
          + '</div><section class="tk-card-section"><h3>Участники</h3><div class="tk-meta"><div><div class="l">Подал заявку</div>'
          + e(r.author) + ' · ' + e(paymentDate(r.created)) + '</div>'
          + (awaiting ? '<div><div class="l">Ожидается действие</div>' + e(awaiting) + '</div>' : '')
          + '<div><div class="l">Наблюдающие</div>' + (observers || '—') + '</div></div>' + watch + '</section>'
          + '<section class="tk-card-section"><h3>Сведения о заявке</h3><div class="tk-meta">'
          + values.filter(x=>x[1]).map(([label,value]) => '<dl><dt class="l">'+e(label)+'</dt><dd>'+e(value)+'</dd></dl>').join('')
          + '</div></section>' + (r.comment ? '<section class="tk-card-section"><h3>Комментарий при подаче</h3><div class="tk-desc">'+e(r.comment)+'</div></section>' : '')
          + (r.files.length ? '<section class="tk-card-section"><h3>Документы</h3><div data-pay-files>' + r.files.map(f=>'<div><span class="tk-hint">'
            + e(data.fileLabels[f.kind] || 'Документ') + '</span>' + fileButton(f) + '</div>').join('') + '</div></section>' : '')
          + (manage ? '<section class="tk-card-section">' + manage + '</section>' : '') + '</aside>'
          + '<section class="tk-tl" aria-label="Переписка"><div class="tk-tl-h"><b>Обсуждение</b>'
          + (systemCount ? '<label class="tk-hint"><input type="checkbox" data-pay-show-system' + (showSystem ? ' checked' : '') + '> история изменений (' + systemCount + ')</label>' : '') + '</div>'
          + '<div class="tk-thread" tabindex="0" role="region" aria-label="Переписка по заявке">' + r.history.map(entry => {
            const file = r.files.find(x => x.id === entry.fileId);
            const time = e(paymentDate(entry.date) + (entry.date?.includes('T') ? ' · ' + new Date(entry.date).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : ''));
            if (isSystem(entry)) return '<div class="tk-msg sys" data-pay-system' + (showSystem ? '' : ' hidden') + '>'+time+' · '+e(entry.author)+': '+e(entry.text)+'</div>';
            const own = entry.authorId && entry.authorId === P.me?.id;
            return '<div class="tk-msg' + (own ? ' own' : '') + '">'
              + (own ? '' : avaHtml(P.byId[entry.authorId] || {id:0},28,entry.author)) + '<div class="tk-msg-b">'
              + (own ? '' : '<b class="tk-msg-author">'+e(entry.author)+'</b>') + '<div class="tk-msg-t">'+e(entry.text)+'</div>'
              + (file ? fileButton(file) : '') + '<time class="tk-msg-time">'+time+'</time></div></div>';
          }).join('') + (messageCount ? '' : '<div class="tk-hint">Сообщений пока нет.</div>') + '</div>'
          + '<form class="tk-comment" data-pay-message><textarea name="comment" aria-label="Сообщение" placeholder="Написать сообщение…" maxlength="2000"></textarea>'
          + '<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" hidden><button type="button" class="tk-btn" data-pay-attach title="Приложить файл" aria-label="Приложить файл">📎</button>'
          + '<button type="submit" class="tk-btn pri" title="Отправить (Ctrl/⌘ + Enter)" aria-label="Отправить сообщение">➤</button></form>'
          + '<div class="tk-hint tk-comment-file" data-pay-filename aria-live="polite"></div></section></div><p class="tk-hint" role="status" data-pay-status></p>';
        bindTaskPeople(body);
        const thread = body.querySelector('.tk-thread');
        const panes = body.querySelectorAll('[data-pay-pane]');
        function selectPane(pane) {
          body.setAttribute('data-task-pane',pane);
          panes.forEach(button => button.setAttribute('aria-pressed',String(button.getAttribute('data-pay-pane') === pane)));
          thread.scrollTop = thread.scrollHeight;
        }
        body.querySelector('.tk-x').onclick = m.close;
        if (restoreFocus || !body.hasAttribute('data-task-pane')) body.querySelector('.tk-x').focus({preventScroll:true});
        panes.forEach(button => { button.onclick = () => selectPane(button.getAttribute('data-pay-pane')); });
        selectPane(body.getAttribute('data-task-pane') || 'details');
        if (transition && canConfirm && !restoreFocus) body.querySelector('[data-pay-advance] textarea')?.focus();
        const show = body.querySelector('[data-pay-show-system]');
        if (show) show.onchange = () => {
          body.querySelectorAll('[data-pay-system]').forEach(event => { event.hidden = !show.checked; });
        };
        const status = body.querySelector('[data-pay-status]');
        body.querySelectorAll('[data-pay-file]').forEach(button => {
          button.onclick = async () => {
            try {
              const file = r.files.find(f => f.id === Number(button.getAttribute('data-pay-file')));
              const blob = await paymentApi('payments/' + id + '/files/' + file.id);
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
              setTimeout(() => URL.revokeObjectURL(url),60000);
            } catch (error) { status.textContent = error.message; }
          };
        });
        async function discuss(button, input) {
          if (button.disabled) return;
          button.disabled = true;
          try {
            await paymentApi('payments/' + id,await input());
            await render();
            const feedback = body.querySelector('[data-pay-status]');
            if (feedback) feedback.textContent = 'Сохранено';
          } catch (error) { status.textContent = error.message; button.disabled = false; }
        }
        const message = body.querySelector('[data-pay-message]');
        message.querySelector('[data-pay-attach]').onclick = () => message.elements.file.click();
        message.elements.file.onchange = () => {
          body.querySelector('[data-pay-filename]').textContent = message.elements.file.files[0]?.name || '';
        };
        message.elements.comment.onkeydown = event => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            message.requestSubmit();
          }
        };
        message.onsubmit = event => {
          event.preventDefault();
          discuss(message.querySelector('[type=submit]'),async () => ({action:'message',comment:message.elements.comment.value,
            file:await paymentFile(message.elements.file.files[0])}));
        };
        const watchForm = body.querySelector('[data-pay-watch]');
        if (watchForm) watchForm.onsubmit = event => {
          event.preventDefault();
          const userId = Number(taskPersonKey(watchForm.elements.user));
          if (!userId) { watchForm.elements.user.focus(); return; }
          discuss(watchForm.querySelector('button'),() => ({action:'watch-add',userId}));
        };
        body.querySelectorAll('[data-pay-remove]').forEach(button => {
          button.onclick = () => discuss(button,() => ({action:'watch-remove',userId:Number(button.getAttribute('data-pay-remove'))}));
        });
        const form = body.querySelector('[data-pay-advance]');
        const adjust = body.querySelector('[data-pay-manage]');
        if (adjust) {
          const field = key => adjust.querySelector('[name='+key+']').value;
          adjust.querySelector('[name=action]').addEventListener('change', () => {
            adjust.querySelectorAll('[data-pay-adjust]').forEach(part => { part.hidden = part.getAttribute('data-pay-adjust') !== field('action'); });
          });
          adjust.addEventListener('submit', async event => {
            event.preventDefault();
            const userId = Number(taskPersonKey(adjust.elements.user));
            if (field('action') === 'assign' && !userId) { adjust.elements.user.focus(); return; }
            const submit = adjust.querySelector('button');
            if (submit.disabled) return;
            submit.disabled = true;
            try {
              await paymentApi('payments/' + id, {action:field('action'), status:r.status, revision:r.revision, comment:field('comment'),
                role:field('role'), userId, due:field('due'), stage:Number(field('stage'))});
              if (onChange) onChange();
              await render();
              const feedback = body.querySelector('[data-pay-status]');
              if (feedback) feedback.textContent = 'Изменение сохранено';
            } catch (error) { status.textContent = error.message; submit.disabled = false; }
          });
        }
        if (form) form.onsubmit = async event => {
          event.preventDefault();
          const submit = form.querySelector('button');
          if (submit.disabled) return;
          submit.disabled = true;
          try {
            await paymentApi('payments/' + id, {status:r.status, targetStatus:transition?.nextStatus, comment:form.querySelector('textarea').value,
              file:await paymentFile(form.querySelector('[name=bill]')?.files[0]), extra:await paymentFile(form.querySelector('[name=extra]')?.files[0])});
            transition = undefined;
            if (onChange) onChange();
            await render();
            const feedback = body.querySelector('[data-pay-status]');
            if (feedback) feedback.textContent = 'Сохранено';
          } catch (error) { status.textContent = error.message; submit.disabled = false; }
        };
      } catch (error) {
        body.innerHTML = '<header class="tk-box-h"><div class="tk-box-t">Заявка №' + id + '</div><button type="button" class="tk-x" aria-label="Закрыть">✕</button></header><div class="tk-box-b" role="alert">'+e(error.message)+'</div>';
        body.querySelector('.tk-x').onclick = m.close;
      }
    }
    render();
  }
  function openPayment(trigger) {
    window.crmTaskStyles();
    if (document.querySelector('.kp-dialog')) return;
    const m = workDialog('Заявка на оплату','kp','kp-dialog',
      '<form hidden><label>Объект<select name="object" required><option value="">Выберите объект</option></select></label>'
      + '<label>Цель расхода<textarea name="purpose" rows="3" maxlength="1000" required></textarea></label>'
      + '<div class="kb-fields"><label>Сумма, ₽<input name="amount" inputmode="decimal" pattern="[0-9]{1,10}([.,][0-9]{1,2})?" required></label>'
      + '<label>Оплатить до<input type="date" name="due" required></label></div>'
      + '<label>Контрагент<input name="counterparty" maxlength="300" required></label>'
      + '<div class="kb-fields"><label>Контактное лицо<input name="contact" maxlength="300"></label>'
      + '<label>Телефон<input name="phone" type="tel" maxlength="100"></label><label>Эл. почта<input name="email" type="email" maxlength="300"></label></div>'
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
      const api = input => paymentApi('payment-request/api',input);
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
          const file = await paymentFile(bill);
          sending = true;
          const result = await api({
            object:Number(field('object').value), purpose:field('purpose').value, amount:field('amount').value, due:field('due').value,
            counterparty:field('counterparty').value, contact:field('contact').value, phone:field('phone').value, email:field('email').value,
            comment:field('comment').value, file
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
  let taskCount = 0, taskBadge = null, taskCountRequest = 0;
  function paintTaskCount() {
    if (!taskCount) {
      if (taskBadge) taskBadge.remove();
      taskBadge = null;
      return;
    }
    if (!taskBadge || !taskBadge.isConnected) {
      const item = Array.from(document.querySelectorAll('.ant-menu-item')).find(function (node) {
        return node.querySelector('a[href="/admin/tskpage01"]') || (node.innerText || '').trim() === 'Задачи';
      });
      if (!item) return;
      taskBadge = document.createElement('span');
      taskBadge.className = 'crmp-task-count';
      item.style.position = 'relative';
      item.appendChild(taskBadge);
    }
    const label = 'Новых задач: ' + taskCount;
    taskBadge.title = label;
    taskBadge.setAttribute('aria-label', label);
    taskBadge.textContent = taskCount > 99 ? '99+' : String(taskCount);
  }
  async function refreshTaskCount() {
    if (!P.me || document.hidden || !location.pathname.startsWith('/admin')) return;
    const request = ++taskCountRequest;
    try {
      const res = await api.request({ url: 'crm_tasks:list', params: {
        pageSize: 1, fields: ['id'], filter: { status: 'new', executor_id: P.me.id }
      } });
      const count = res.data && res.data.meta && res.data.meta.count;
      if (request !== taskCountRequest || !Number.isInteger(count) || count < 0) return;
      taskCount = count;
      paintTaskCount();
    } catch (error) {
      if (request === taskCountRequest && [401, 403].includes(error.response?.status)) {
        taskCount = 0;
        paintTaskCount();
      }
    }
  }
  window.crmRefreshTaskCount = refreshTaskCount;
  function decorate(force) {
    const btn = document.querySelector('[data-testid=user-center-button]');
    paintMayDay(btn);
    if (taskCount && (!taskBadge || !taskBadge.isConnected)) paintTaskCount();
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
      if (!li.parentNode.querySelector('.crmp-li-pay-register')) {
        const register = document.createElement('li');
        register.className = 'ant-dropdown-menu-item crmp-li-pay-register';
        register.innerHTML = '<a class="ant-dropdown-menu-title-content" href="/admin/payreqpage1">Заявки на оплату</a>';
        const payment = li.parentNode.querySelector('.crmp-li-payment');
        li.parentNode.insertBefore(register,payment.nextSibling);
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
    refreshTaskCount();
    const deepLink = location.search.match(/[?&]knowledge=(open|[1-9]\d*)(?:&|$)/);
    if (deepLink) openKnowledge(Number(deepLink[1]) || undefined);
    if (/[?&]payment=open(?:&|$)/.test(location.search)) openPayment();
    const paymentLink = location.search.match(/[?&]payments=(open|[1-9]\d*)(?:&|$)/);
    if (paymentLink) {
      if (paymentLink[1] === 'open') openPaymentRegister();
      else openPaymentCard(Number(paymentLink[1]));
    }
  });
  setInterval(decorate, 600);
  setInterval(load, 60000);
  setInterval(refreshTaskCount, 20000);
  document.addEventListener('visibilitychange', refreshTaskCount);
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
