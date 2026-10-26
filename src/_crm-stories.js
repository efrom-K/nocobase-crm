// ===== Сторис — фрагмент мессенджера (лента над списком чатов, как в Telegram) =====
// Данные: crm_stories (author_id, media → attachments, text, bg, expires_at — 24 ч), crm_story_views (story_id, viewer_id); scripts/setup_stories.py.
// window.crmStoriesMount(el, me) — нарисовать ленту в el; ответ на сторис уходит личным сообщением через window.__msgrSendDm(userId, text).
window.crmStoriesMount = function (bar, me) {
  const api = ctx.api;
  const S = { list: [], seen: {}, me: me };
  const e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const BGS = { blue: ['#2f6fed', '#5cd0ff'], night: ['#1c2d58', '#5b3fa8'], sunset: ['#ff6a5c', '#ffb35c'], forest: ['#1f7a4d', '#7fd18f'], berry: ['#b0306a', '#ff7ac7'], graphite: ['#2b2f3a', '#6b7385'] };
  const bgCss = function (k) { const g = BGS[k] || BGS.blue; return 'linear-gradient(160deg,' + g[0] + ',' + g[1] + ')'; };
  const uname = function (id) { const u = window.__crmProf && window.__crmProf.byId[id]; return u ? (u.nickname || u.username) : 'Сотрудник'; };
  const first = function (id) { return id === S.me.id ? 'Вы' : String(uname(id)).split(/\s+/)[0]; };
  const ago = function (iso) {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    return m < 1 ? 'только что' : m < 60 ? m + ' мин назад' : Math.floor(m / 60) + ' ч назад';
  };
  const isVideo = function (a) { return a && /^video\//.test(a.mimetype || ''); };

  if (!document.getElementById('crm-stories-style')) {
    const st = document.createElement('style');
    st.id = 'crm-stories-style';
    st.textContent = `
      .sto-bar { display:flex; gap:14px; padding:4px 18px 12px; overflow-x:auto; scrollbar-width:none; }
      .sto-bar::-webkit-scrollbar { display:none; }
      .sto-it { display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; flex:none; width:66px; border:0; background:none; padding:0; }
      .sto-ring { position:relative; width:62px; height:62px; border-radius:50%; padding:2.5px; background:linear-gradient(45deg,#2f4a8a,#7c5cff,#e0539c); display:flex; align-items:center; justify-content:center; }
      .sto-ring.seen { background:#c3cad8; }
      .sto-ring.none { background:none; }
      .sto-ring > .crmp-ava, .sto-ring > .sto-ini { border:2.5px solid #fff; box-sizing:content-box; }
      .sto-ini { width:52px; height:52px; border-radius:50%; background:#c3cad8; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
      .sto-plus { position:absolute; right:0; bottom:0; width:20px; height:20px; border-radius:50%; background:#2f4a8a; color:#fff; border:2px solid #fff; font-size:15px; line-height:15px; text-align:center; font-weight:700; }
      .sto-nm { font-size:12px; color:#1f2433; max-width:66px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .sto-it:hover .sto-ring { transform:scale(1.04); }
      .sto-ring { transition:transform .15s; }

      .sto-ov { position:fixed; inset:0; z-index:3150; background:rgba(8,10,16,.94); display:flex; align-items:center; justify-content:center; animation:stoIn .18s ease-out; }
      @keyframes stoIn { from { opacity:0; } to { opacity:1; } }
      .sto-card { position:relative; width:min(420px, 100vw); height:min(746px, 100dvh); border-radius:14px; overflow:hidden; background:#1f2433; user-select:none; }
      .sto-media { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
      .sto-media img, .sto-media video { width:100%; height:100%; object-fit:contain; }
      .sto-text { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:40px 30px; color:#fff; font-size:26px; font-weight:700; text-align:center;
        line-height:1.3; white-space:pre-wrap; word-break:break-word; text-shadow:0 2px 8px rgba(0,0,0,.18); }
      .sto-cap { position:absolute; left:0; right:0; bottom:74px; padding:10px 18px; color:#fff; font-size:15px; text-align:center; background:linear-gradient(transparent, rgba(0,0,0,.55)); white-space:pre-wrap; }
      .sto-top { position:absolute; left:0; right:0; top:0; padding:10px 12px 26px; background:linear-gradient(rgba(0,0,0,.55), transparent); z-index:2; }
      .sto-prog { display:flex; gap:4px; }
      .sto-prog span { flex:1; height:2.5px; border-radius:2px; background:rgba(255,255,255,.35); overflow:hidden; }
      .sto-prog span i { display:block; height:100%; width:0; background:#fff; }
      .sto-who { display:flex; align-items:center; gap:10px; margin-top:10px; color:#fff; }
      .sto-who b { font-size:14px; font-weight:600; }
      .sto-who small { opacity:.75; font-size:12.5px; }
      .sto-x { margin-left:auto; border:0; background:none; color:#fff; font-size:26px; line-height:1; cursor:pointer; padding:0 4px; }
      .sto-tap { position:absolute; top:70px; bottom:70px; width:35%; z-index:1; cursor:pointer; }
      .sto-tap.l { left:0; } .sto-tap.r { right:0; width:65%; }
      .sto-foot { position:absolute; left:0; right:0; bottom:0; padding:12px; display:flex; gap:8px; align-items:center; z-index:2; }
      .sto-foot input { flex:1; border:1.5px solid rgba(255,255,255,.55); background:rgba(0,0,0,.25); color:#fff; border-radius:22px; padding:10px 16px; font-size:14.5px; outline:0; }
      .sto-foot input::placeholder { color:rgba(255,255,255,.75); }
      .sto-btn { border:0; background:rgba(255,255,255,.16); color:#fff; border-radius:20px; padding:9px 14px; font-size:13.5px; cursor:pointer; white-space:nowrap; }
      .sto-btn:hover { background:rgba(255,255,255,.26); }
      .sto-btn.del { color:#e7b9b9; }
      .sto-views { position:absolute; left:0; right:0; bottom:0; max-height:55%; background:#fff; border-radius:16px 16px 0 0; z-index:3; overflow:auto; padding:14px 16px; color:#1f2433; }
      .sto-views h4 { margin:0 0 10px; font-size:15px; }
      .sto-views div { display:flex; align-items:center; gap:10px; padding:6px 0; font-size:14px; }
      .sto-views small { color:#5b6478; margin-left:auto; }
      .sto-nav { position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px; border-radius:50%; border:0; background:rgba(255,255,255,.14); color:#fff; font-size:22px; cursor:pointer; }
      .sto-nav.p { left:calc(50% - 270px); } .sto-nav.n { right:calc(50% - 270px); }
      @media (max-width: 600px) { .sto-card { border-radius:0; } .sto-nav { display:none; } }

      .sto-new .crmp-dlg { width:420px; }
      .sto-new-h { padding:18px 20px 6px; font-size:18px; font-weight:600; }
      .sto-tabs { display:flex; gap:6px; padding:6px 20px 0; }
      .sto-tabs button { border:0; background:#eef2f9; border-radius:18px; padding:7px 14px; font-size:13.5px; cursor:pointer; color:#1f2433; }
      .sto-tabs button.on { background:#2f4a8a; color:#fff; }
      .sto-prev { margin:12px 20px 0; height:340px; border-radius:14px; overflow:hidden; background:#eef2f9; position:relative; display:flex; align-items:center; justify-content:center; color:#5b6478; cursor:pointer; }
      .sto-prev img, .sto-prev video { width:100%; height:100%; object-fit:contain; background:#1f2433; }
      .sto-prev textarea { position:absolute; inset:0; width:100%; height:100%; border:0; outline:0; resize:none; background:none; color:#fff; font-size:24px; font-weight:700; text-align:center; padding:110px 24px 20px; font-family:inherit; }
      .sto-prev textarea::placeholder { color:rgba(255,255,255,.7); }
      .sto-bgs { display:flex; gap:8px; padding:10px 20px 0; }
      .sto-bgs button { width:28px; height:28px; border-radius:50%; border:0; cursor:pointer; box-shadow:0 0 0 2px #fff, 0 0 0 3.5px transparent; }
      .sto-bgs button.on { box-shadow:0 0 0 2px #fff, 0 0 0 3.5px #2f4a8a; }
      .sto-capin { margin:10px 20px 0; width:calc(100% - 40px); border:0; border-bottom:1.5px solid #dfe3ec; outline:0; font-size:14.5px; padding:7px 0; }
      .sto-capin:focus { border-bottom-color:#2f4a8a; }
    `;
    document.head.appendChild(st);
  }

  async function load() {
    try {
      const r = await api.resource('crm_stories').list({ filter: { expires_at: { $gt: new Date().toISOString() } }, appends: ['media'], sort: ['createdAt'], pageSize: 300 });
      S.list = (r.data && r.data.data) || [];
      if (S.list.length) {
        const v = await api.resource('crm_story_views').list({ filter: { viewer_id: S.me.id, story_id: { $in: S.list.map(function (x) { return x.id; }) } }, pageSize: 1000 });
        ((v.data && v.data.data) || []).forEach(function (x) { S.seen[x.story_id] = true; });
      }
    } catch (x) { S.list = []; }
    draw();
  }
  function groups() {
    const by = {};
    S.list.forEach(function (s) { (by[s.author_id] = by[s.author_id] || []).push(s); });
    const ids = Object.keys(by).map(Number).filter(function (id) { return id !== S.me.id; });
    const unseen = function (id) { return by[id].some(function (s) { return !S.seen[s.id]; }); };
    const last = function (id) { return new Date(by[id][by[id].length - 1].createdAt).getTime(); };
    ids.sort(function (a, b) { return (unseen(b) - unseen(a)) || (last(b) - last(a)); });
    return { by: by, order: [S.me.id].concat(ids), unseen: unseen };
  }
  function draw() {
    if (!bar.isConnected) return;
    const g = groups();
    bar.className = 'sto-bar';
    bar.innerHTML = g.order.map(function (id) {
      const mine = id === S.me.id, has = !!g.by[id];
      const ava = window.crmAvatar ? window.crmAvatar(id, 52, uname(id)) : '<span class="sto-ini">' + e(first(id)[0]) + '</span>';
      return '<button class="sto-it" data-u="' + id + '"><span class="sto-ring' + (!has ? ' none' : g.unseen(id) || mine ? '' : ' seen') + '">' + ava
        + (mine ? '<span class="sto-plus" data-add>+</span>' : '') + '</span><span class="sto-nm">' + e(mine ? 'Моя история' : first(id)) + '</span></button>';
    }).join('');
    bar.querySelectorAll('.sto-it').forEach(function (b) {
      b.onclick = function (ev) {
        const id = Number(b.getAttribute('data-u'));
        if (id === S.me.id && (ev.target.hasAttribute('data-add') || !g.by[id])) return create();
        open(g, g.order.indexOf(id));
      };
    });
  }

  // просмотр: все сторис автора подряд, дальше — следующий автор
  function open(g, ai) {
    const authors = g.order.filter(function (id) { return g.by[id]; });
    let a = authors.indexOf(g.order[ai]);
    if (a < 0) return;
    let i = g.by[authors[a]].findIndex(function (s) { return !S.seen[s.id]; });
    if (i < 0 || authors[a] === S.me.id) i = 0;
    const ov = document.createElement('div');
    ov.className = 'sto-ov';
    document.body.appendChild(ov);
    let timer = null, t0 = 0, dur = 6000, paused = false, left = 0;
    const close = function () { clearInterval(timer); ov.remove(); document.removeEventListener('keydown', key, true); draw(); };
    const key = function (ev) {
      if (ev.target.tagName === 'INPUT') { if (ev.key === 'Escape') ev.target.blur(); return; }
      if (ev.key === 'Escape') close(); else if (ev.key === 'ArrowRight') next(); else if (ev.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', key, true);
    const next = function () { const l = g.by[authors[a]]; if (i < l.length - 1) i++; else if (a < authors.length - 1) { a++; i = 0; } else return close(); show(); };
    const prev = function () { if (i > 0) i--; else if (a > 0) { a--; i = g.by[authors[a]].length - 1; } show(); };
    function show() {
      clearInterval(timer);
      const list = g.by[authors[a]], s = list[i], mine = s.author_id === S.me.id, m = s.media;
      const media = m ? (isVideo(m) ? '<video src="' + e(m.url) + '" autoplay playsinline></video>' : '<img src="' + e(m.url) + '" alt="">')
        : '<div class="sto-text" style="background:' + bgCss(s.bg) + '">' + e(s.text) + '</div>';
      ov.innerHTML = '<button class="sto-nav p" data-p>‹</button><div class="sto-card"><div class="sto-media">' + media + '</div>'
        + (m && s.text ? '<div class="sto-cap">' + e(s.text) + '</div>' : '')
        + '<div class="sto-top"><div class="sto-prog">' + list.map(function (x, k) { return '<span><i style="width:' + (k < i ? 100 : 0) + '%"></i></span>'; }).join('') + '</div>'
        + '<div class="sto-who">' + (window.crmAvatar ? window.crmAvatar(s.author_id, 34) : '') + '<div><b>' + e(uname(s.author_id)) + '</b><br><small>' + ago(s.createdAt) + '</small></div><button class="sto-x" data-x>×</button></div></div>'
        + '<div class="sto-tap l" data-tl></div><div class="sto-tap r" data-tr></div>'
        + '<div class="sto-foot">' + (mine ? '<button class="sto-btn" data-views>👁 Просмотры</button><span style="flex:1"></span><button class="sto-btn del" data-del>Удалить</button>'
          : '<input data-reply maxlength="300" placeholder="Ответить ' + e(first(s.author_id)) + '…"><button class="sto-btn" data-send>Отправить</button>') + '</div>'
        + '</div><button class="sto-nav n" data-n>›</button>';
      const q = function (sel) { return ov.querySelector(sel); };
      q('[data-x]').onclick = close;
      q('[data-tl]').onclick = prev; q('[data-tr]').onclick = next; q('[data-p]').onclick = prev; q('[data-n]').onclick = next;
      ov.onclick = function (ev) { if (ev.target === ov) close(); };
      const bar1 = ov.querySelectorAll('.sto-prog i')[i];
      const v = q('video');
      const hold = function (on) { paused = on; if (v) { if (on) v.pause(); else v.play().catch(function () {}); } if (on) left = dur - (Date.now() - t0); else t0 = Date.now() - (dur - left); };
      ['tl', 'tr'].forEach(function (k) { const el = q('[data-' + k + ']'); el.onpointerdown = function () { hold(true); }; el.onpointerup = el.onpointerleave = function () { if (paused) hold(false); }; });
      const tick = function () {
        if (paused) return;
        const p = v && v.duration ? v.currentTime / v.duration : (Date.now() - t0) / dur;
        bar1.style.width = Math.min(100, p * 100) + '%';
        if (p >= 1) next();
      };
      t0 = Date.now(); dur = 6000; paused = false;
      if (v) v.onended = next;
      timer = setInterval(tick, 50);
      const inp = q('[data-reply]');
      if (inp) {
        inp.onfocus = function () { hold(true); }; inp.onblur = function () { if (paused) hold(false); };
        const send = async function () {
          const t = inp.value.trim(); if (!t || !window.__msgrSendDm) return;
          inp.value = ''; inp.placeholder = 'Отправлено ✓';
          try { await window.__msgrSendDm(s.author_id, '↩️ На вашу историю' + (s.text && !s.media ? ' «' + s.text.slice(0, 40) + '»' : '') + ': ' + t); } catch (x) { inp.placeholder = 'Не отправилось'; }
        };
        q('[data-send]').onclick = send;
        inp.onkeydown = function (ev) { if (ev.key === 'Enter') send(); };
      }
      const dv = q('[data-views]');
      if (dv) dv.onclick = async function (ev) {
        ev.stopPropagation(); hold(true);
        const r = await api.resource('crm_story_views').list({ filter: { story_id: s.id }, sort: ['-createdAt'], pageSize: 200 });
        const rows = (r.data && r.data.data) || [];
        const box = document.createElement('div');
        box.className = 'sto-views';
        box.innerHTML = '<h4>Просмотры: ' + rows.length + '</h4>' + (rows.map(function (x) {
          return '<div>' + (window.crmAvatar ? window.crmAvatar(x.viewer_id, 30) : '') + e(uname(x.viewer_id)) + '<small>' + ago(x.createdAt) + '</small></div>';
        }).join('') || '<div style="color:#5b6478">Пока никто не смотрел</div>');
        box.onclick = function (x) { x.stopPropagation(); box.remove(); hold(false); };
        q('.sto-card').appendChild(box);
      };
      const dd = q('[data-del]');
      if (dd) dd.onclick = async function () {
        if (dd.textContent !== 'Точно удалить?') { dd.textContent = 'Точно удалить?'; hold(true); return; }
        try { await api.resource('crm_stories').destroy({ filterByTk: s.id }); } catch (x) { /* нет прав */ }
        S.list = S.list.filter(function (x) { return x.id !== s.id; });
        list.splice(i, 1);
        if (!list.length) return close();
        if (i >= list.length) i = list.length - 1;
        show();
      };
      if (!mine && !S.seen[s.id]) {
        S.seen[s.id] = true;
        api.resource('crm_story_views').create({ values: { story_id: s.id, viewer_id: S.me.id } }).catch(function () {});
      }
    }
    show();
  }

  // новая сторис: фото / видео (до 30 МБ) или текст на фоне
  function create() {
    let mode = 'media', file = null, bg = 'blue';
    const m = document.createElement('div');
    m.className = 'crmp-mask sto-new';
    m.innerHTML = '<div class="crmp-dlg"><div class="sto-new-h">Новая история</div>'
      + '<div class="sto-tabs"><button data-mode="media" class="on">Фото или видео</button><button data-mode="text">Текст</button></div>'
      + '<div class="sto-prev" data-prev>Нажмите, чтобы выбрать фото или видео</div><div class="sto-bgs" data-bgs style="display:none">'
      + Object.keys(BGS).map(function (k) { return '<button data-bg="' + k + '" class="' + (k === bg ? 'on' : '') + '" style="background:' + bgCss(k) + '"></button>'; }).join('') + '</div>'
      + '<input class="sto-capin" data-cap maxlength="200" placeholder="Подпись (необязательно)">'
      + '<div class="crmp-foot"><span style="margin-right:auto;color:#5b6478;font-size:12.5px;align-self:center">Видна 24 часа всем сотрудникам</span>'
      + '<button class="crmp-btn" data-x>Отмена</button><button class="crmp-btn pri" data-ok disabled>Опубликовать</button></div></div>';
    document.body.appendChild(m);
    const q = function (sel) { return m.querySelector(sel); };
    const prevEl = q('[data-prev]'), ok = q('[data-ok]'), cap = q('[data-cap]');
    const close = function () { m.remove(); };
    m.addEventListener('mousedown', function (ev) { if (ev.target === m) close(); });
    q('[data-x]').onclick = close;
    const fileInp = document.createElement('input'); fileInp.type = 'file'; fileInp.accept = 'image/*,video/*';
    fileInp.onchange = function () {
      const f = fileInp.files && fileInp.files[0]; if (!f) return;
      if (f.size > 30 * 1024 * 1024) { prevEl.textContent = 'Файл больше 30 МБ'; return; }
      file = f; const u = URL.createObjectURL(f);
      prevEl.innerHTML = /^video\//.test(f.type) ? '<video src="' + u + '" autoplay muted loop playsinline></video>' : '<img src="' + u + '">';
      ok.disabled = false;
    };
    const setMode = function (md) {
      mode = md;
      m.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mode') === md); });
      q('[data-bgs]').style.display = md === 'text' ? 'flex' : 'none';
      cap.style.display = md === 'text' ? 'none' : '';
      if (md === 'text') {
        prevEl.style.background = bgCss(bg); prevEl.innerHTML = '<textarea maxlength="300" placeholder="Что нового?"></textarea>';
        const ta = prevEl.querySelector('textarea'); ta.oninput = function () { ok.disabled = !ta.value.trim(); }; ta.focus(); ok.disabled = true;
      } else { prevEl.style.background = ''; file = null; prevEl.textContent = 'Нажмите, чтобы выбрать фото или видео'; ok.disabled = true; }
    };
    m.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { setMode(b.getAttribute('data-mode')); }; });
    m.querySelectorAll('[data-bg]').forEach(function (b) { b.onclick = function () { bg = b.getAttribute('data-bg'); prevEl.style.background = bgCss(bg); m.querySelectorAll('[data-bg]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    prevEl.onclick = function () { if (mode === 'media') fileInp.click(); };
    ok.onclick = async function () {
      ok.disabled = true; ok.textContent = 'Публикую…';
      try {
        const vals = { author_id: S.me.id, expires_at: new Date(Date.now() + 24 * 3600e3).toISOString() };
        if (mode === 'text') { vals.text = prevEl.querySelector('textarea').value.trim(); vals.bg = bg; }
        else {
          const b = '----sto' + Date.now() + Math.random().toString(16).slice(2);
          const body = new Blob(['--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="' + file.name.replace(/"/g, '') + '"\r\nContent-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n', file, '\r\n--' + b + '--\r\n']);
          const r = await fetch('/api/attachments:upload', { method: 'POST', body: body, headers: { Authorization: 'Bearer ' + localStorage.getItem('NOCOBASE_TOKEN'), 'Content-Type': 'multipart/form-data; boundary=' + b } });
          const att = (await r.json()).data;
          if (!att || !att.id) throw new Error('upload');
          vals.media_id = att.id; vals.text = cap.value.trim() || null;
        }
        await api.resource('crm_stories').create({ values: vals });
        close(); await load();
      } catch (x) { ok.disabled = false; ok.textContent = 'Не вышло — ещё раз'; }
    };
  }

  load();
  window.addEventListener('crm-profiles', draw);
  if (window.__stoTimer) clearInterval(window.__stoTimer);
  window.__stoTimer = setInterval(function () { if (bar.isConnected) load(); else clearInterval(window.__stoTimer); }, 60000);
};
// ===== конец фрагмента сторис =====
