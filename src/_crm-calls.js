// ===== Звонки мессенджера — общий фрагмент: подключается во все блоки CRM, чтобы входящий звонок был слышен на любой странице =====
// Сигнализация — почтовый сервис на svc (/mailsvc/rtc/*: поток событий, отправка, ключи TURN), медиа — WebRTC напрямую между браузерами
// (шифрование DTLS-SRTP), при необходимости через coturn на svc. Групповой звонок — «каждый с каждым» (до ~6 человек).
// Начать звонок: window.crmCall([userId, …], { video: true|false, title: 'Название', names: { id: 'Имя' } }).
// Работает только по https (crm.ykinvest.ru): по http браузер не даёт микрофон и камеру.
if (!document.getElementById('crm-call-style')) {
  const st = document.createElement('style');
  st.id = 'crm-call-style';
  st.textContent = `
    .rtc-in { position:fixed; top:18px; left:50%; transform:translateX(-50%); z-index:1200; background:#fff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.25);
      padding:16px 18px; display:flex; align-items:center; gap:14px; min-width:340px; max-width:92vw; font-size:14px; color:#1f1f1f; animation:rtcDrop .25s ease-out; }
    @keyframes rtcDrop { from { transform:translate(-50%,-20px); opacity:0; } to { transform:translate(-50%,0); opacity:1; } }
    .rtc-ava { width:46px; height:46px; border-radius:50%; background:#1c2d58; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600; flex:none; }
    .rtc-in .rtc-ava { animation:rtcPulse 1.4s infinite; }
    @keyframes rtcPulse { 0% { box-shadow:0 0 0 0 rgba(56,158,13,.5); } 70% { box-shadow:0 0 0 12px rgba(56,158,13,0); } 100% { box-shadow:0 0 0 0 rgba(56,158,13,0); } }
    .rtc-in-t { flex:1; min-width:0; } .rtc-in-t b { display:block; font-size:15px; } .rtc-in-t span { color:#8c8c8c; font-size:12.5px; }
    .rtc-b { border:none; border-radius:50%; width:42px; height:42px; cursor:pointer; color:#fff; display:inline-flex; align-items:center; justify-content:center; flex:none; }
    .rtc-b.ok { background:#389e0d; } .rtc-b.ok:hover { background:#2f8a0b; }
    .rtc-b.no { background:#cf1322; } .rtc-b.no:hover { background:#a8071a; }
    .rtc-b.tool { background:rgba(255,255,255,.14); } .rtc-b.tool:hover { background:rgba(255,255,255,.24); }
    .rtc-b.tool.off { background:#fff; color:#262626; }
    .rtc-win { position:fixed; right:18px; bottom:18px; z-index:1150; width:380px; max-width:94vw; background:#141a2a; color:#fff; border-radius:16px; box-shadow:0 14px 44px rgba(0,0,0,.35);
      display:flex; flex-direction:column; overflow:hidden; font-size:13.5px; }
    .rtc-win.big { right:3vw; bottom:3vh; width:94vw; height:90vh; }
    .rtc-top { display:flex; align-items:center; gap:10px; padding:10px 14px; background:rgba(255,255,255,.05); }
    .rtc-top b { font-weight:600; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .rtc-top span { color:#a7b0c4; font-variant-numeric:tabular-nums; }
    .rtc-ic { background:none; border:none; color:#a7b0c4; cursor:pointer; width:28px; height:28px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; }
    .rtc-ic:hover { background:rgba(255,255,255,.1); color:#fff; }
    .rtc-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:6px; padding:6px; flex:1; min-height:150px; }
    .rtc-win.big .rtc-grid { grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); }
    .rtc-tile { position:relative; background:#0b0f1a; border-radius:10px; overflow:hidden; min-height:140px; display:flex; align-items:center; justify-content:center; }
    .rtc-tile video { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
    .rtc-tile.screen video { object-fit:contain; }
    .rtc-tile.novideo video { opacity:0; }
    .rtc-tile .rtc-ava { position:relative; z-index:1; width:58px; height:58px; font-size:18px; }
    .rtc-tile:not(.novideo) .rtc-ava { display:none; }
    .rtc-name { position:absolute; left:8px; bottom:6px; z-index:2; font-size:12px; background:rgba(0,0,0,.45); padding:2px 8px; border-radius:8px; }
    .rtc-state { position:absolute; right:8px; top:6px; z-index:2; font-size:11.5px; color:#ffd666; }
    .rtc-me { position:absolute; right:12px; bottom:76px; width:110px; height:76px; border-radius:8px; overflow:hidden; background:#000; z-index:3; box-shadow:0 2px 8px rgba(0,0,0,.4); }
    .rtc-me video { width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }
    .rtc-me.screen video { transform:none; object-fit:contain; }
    .rtc-bar { display:flex; justify-content:center; gap:12px; padding:12px; }
    .rtc-msg { padding:18px; text-align:center; color:#a7b0c4; }
    .msgr-call-btn { border:none; background:transparent; color:#1c2d58; width:34px; height:34px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; flex:none; }
    .msgr-call-btn:hover { background:#eef1f8; }
  `;
  document.head.appendChild(st);
}

const RTC_ICON = {
  phone: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15 8v8H5V8h10m1-2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4V7a1 1 0 0 0-1-1z"/></svg>',
  hang: '<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1a1 1 0 0 1-.56.9 11.3 11.3 0 0 0-2.66 1.85 1 1 0 0 1-1.4-.02L.29 13.08a1 1 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67a1 1 0 0 1 0 1.41l-2.48 2.48a1 1 0 0 1-1.4.02 11.3 11.3 0 0 0-2.67-1.85 1 1 0 0 1-.56-.9v-3.1A15 15 0 0 0 12 9z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg>',
  screen: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6v2H8v2h8v-2h-2v-2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H4V5h16zM12 7l-4 4h3v3h2v-3h3z"/></svg>',
  big: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"/></svg>'
};
function rtcEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function rtcIni(n) { const p = String(n || '?').trim().split(/\s+/); return (((p[0] || '')[0] || '') + ((p[1] || '')[0] || '')).toUpperCase() || '?'; }
function rtcToast(t) {
  const el = document.createElement('div'); el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#262626;color:#fff;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:1300;max-width:90vw;';
  document.body.appendChild(el); setTimeout(function() { el.remove(); }, 4000);
}

if (!window.__crmRtc) {
  const R = window.__crmRtc = { me: null, call: null, incoming: null, names: {}, ice: null, iceAt: 0 };
  const BASE = location.port ? location.protocol + '//' + location.hostname + ':8096' : '/mailsvc';
  const tok = function() { return localStorage.getItem('NOCOBASE_TOKEN') || ''; };
  const W = window, PC = W.RTCPeerConnection, MD = W.navigator && W.navigator.mediaDevices;
  const sleep = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };
  const api = async function(path, body) {
    const r = await fetch(BASE + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ Authorization: 'Bearer ' + tok() }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error('rtc ' + r.status);
    return r.json();
  };
  const sendCall = function(callId, to, type, data) { return api('/rtc/send', { to: to, type: type, call: callId, data: data }).catch(function() { return { delivered: {} }; }); };

  // ---------- звуки: гудки у звонящего и мелодия у вызываемого (WebAudio, без файлов) ----------
  let actx = null, toneTimer = null;
  const tone = function(kind) {
    stopTone();
    try { actx = actx || new (W.AudioContext || W.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { return; }
    const beep = function(f, dur, at) {
      const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime + (at || 0); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .02); g.gain.setValueAtTime(.18, t + dur - .05); g.gain.linearRampToValueAtTime(0, t + dur);
      o.start(t); o.stop(t + dur + .02);
    };
    const play = kind === 'ring' ? function() { beep(880, .18); beep(660, .18, .22); beep(880, .18, .5); beep(660, .18, .72); } : function() { beep(425, 1); };
    play(); toneTimer = setInterval(play, kind === 'ring' ? 2200 : 4000);
  };
  const stopTone = function() { if (toneTimer) clearInterval(toneTimer); toneTimer = null; };
  let titleTimer = null, titleWas = '';
  const flashTitle = function(t) { stopFlash(); titleWas = document.title; let on = false; titleTimer = setInterval(function() { document.title = (on = !on) ? t : titleWas; }, 900); };
  const stopFlash = function() { if (titleTimer) { clearInterval(titleTimer); titleTimer = null; document.title = titleWas || document.title; } };

  // ---------- медиа ----------
  const getMedia = async function(video) {
    if (!MD || !PC) throw new Error('Браузер не поддерживает звонки' + (location.protocol !== 'https:' ? ' по http — откройте CRM по адресу https://crm.ykinvest.ru' : ''));
    try { return await MD.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false }); }
    catch (e) {
      if (video) { try { const s = await MD.getUserMedia({ audio: true, video: false }); rtcToast('Камера недоступна — звонок без видео'); return s; } catch (e2) { /* ниже */ } }
      throw new Error(e && e.name === 'NotAllowedError' ? 'Браузер не дал доступ к микрофону — разрешите его в адресной строке (значок замка)' : 'Не найден микрофон');
    }
  };
  const iceServers = async function() {
    if (R.ice && Date.now() - R.iceAt < 6 * 3600 * 1000) return R.ice;
    try { R.ice = (await api('/rtc/ice')).iceServers; R.iceAt = Date.now(); } catch (e) { R.ice = []; }
    return R.ice;
  };

  // ---------- соединения «каждый с каждым» ----------
  const peer = function(uid) {
    const c = R.call; if (!c) return null;
    if (c.peers[uid]) return c.peers[uid];
    const pc = new PC({ iceServers: c.ice });
    const p = c.peers[uid] = { pc: pc, q: [], stream: null, screenSender: null };
    c.local.getTracks().forEach(function(t) { pc.addTrack(t, c.local); });
    pc.onicecandidate = function(e) { if (e.candidate) sendCall(c.id, [uid], 'ice', e.candidate.toJSON ? e.candidate.toJSON() : e.candidate); };
    pc.ontrack = function(e) { p.stream = e.streams[0] || new W.MediaStream([e.track]); e.track.onunmute = render; e.track.onmute = render; render(); };
    pc.onconnectionstatechange = function() {
      const s = pc.connectionState;
      if (s === 'connected') { p.ok = true; if (!c.startedAt) { c.startedAt = Date.now(); stopTone(); } }
      if (s === 'failed') { try { pc.restartIce(); } catch (e) { /* */ } }
      render();
    };
    render();
    return p;
  };
  const offerTo = async function(uid) {
    const p = peer(uid); if (!p) return;
    const o = await p.pc.createOffer(); await p.pc.setLocalDescription(o);
    sendCall(R.call.id, [uid], 'offer', { sdp: p.pc.localDescription.sdp, type: 'offer' });
  };
  const flushIce = function(p) { const q = p.q.splice(0); q.forEach(function(x) { p.pc.addIceCandidate(x).catch(function() {}); }); };
  const dropPeer = function(uid) { const c = R.call, p = c && c.peers[uid]; if (!p) return; try { p.pc.close(); } catch (e) { /* */ } delete c.peers[uid]; };

  // ---------- звонок ----------
  W.crmCall = async function(ids, o) {
    o = o || {};
    if (R.call) { rtcToast('Уже идёт звонок'); return; }
    if (R.incoming) { rtcToast('Сначала ответьте на входящий звонок'); return; }
    ids = (ids || []).map(Number).filter(function(x) { return x && x !== R.me; });
    if (!ids.length) return;
    Object.assign(R.names, o.names || {});
    let local;
    try { local = await getMedia(!!o.video); } catch (e) { rtcToast(e.message); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    R.call = { id: id, title: o.title || '', video: !!o.video, members: [R.me].concat(ids), peers: {}, local: local, ice: await iceServers(), state: 'calling', startedAt: 0, out: true, left: {} };
    render();
    tone('back');
    const res = await sendCall(id, ids, 'ring', { members: R.call.members, title: R.call.title, video: R.call.video, names: Object.assign({}, R.names, R.me ? { [R.me]: R.myName || '' } : {}) });
    const online = ids.filter(function(u) { return (res.delivered || {})[u]; });
    if (!online.length) { end(ids.length === 1 ? (R.names[ids[0]] || 'Собеседник') + ' сейчас не в CRM — позвонить не получится' : 'Никого из участников сейчас нет в CRM'); return; }
    R.call.ringTimer = setTimeout(function() {
      if (R.call && R.call.id === id && !Object.keys(R.call.peers).length) { sendCall(id, ids, 'cancel'); end('Не ответили'); }
    }, 45000);
  };
  const accept = async function(video) {
    const m = R.incoming; if (!m) return;
    closeIncoming();
    let local;
    try { local = await getMedia(video); } catch (e) { rtcToast(e.message); sendCall(m.call, [m.from], 'decline'); return; }
    Object.assign(R.names, (m.data && m.data.names) || {}); R.names[m.from] = m.fromName;
    const members = ((m.data && m.data.members) || [m.from, R.me]).map(Number);
    R.call = { id: m.call, title: (m.data && m.data.title) || m.fromName, video: video, members: members, peers: {}, local: local, ice: await iceServers(), state: 'active', startedAt: 0, out: false, left: {} };
    render();
    sendCall(m.call, members.filter(function(u) { return u !== R.me; }), 'join', { members: members, video: video });
  };
  const end = function(note) {
    const c = R.call; if (!c) return;
    clearTimeout(c.ringTimer); clearInterval(c.tick);
    Object.keys(c.peers).forEach(dropPeer);
    c.local.getTracks().forEach(function(t) { t.stop(); });
    if (c.screen) c.screen.getTracks().forEach(function(t) { t.stop(); });
    stopTone(); stopFlash();
    R.call = null;
    const w = document.querySelector('.rtc-win'); if (w) w.remove();
    if (note) rtcToast(note);
  };
  const hangup = function() {
    const c = R.call; if (!c) return;
    const others = c.members.filter(function(u) { return u !== R.me; });
    sendCall(c.id, others, Object.keys(c.peers).length || !c.out ? 'hangup' : 'cancel');
    end(c.startedAt ? 'Звонок завершён · ' + dur(c.startedAt) : null);
  };
  const dur = function(t0) { const s = Math.floor((Date.now() - t0) / 1000); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
  const toggleMic = function() { const c = R.call; if (!c) return; c.muted = !c.muted; c.local.getAudioTracks().forEach(function(t) { t.enabled = !c.muted; }); render(); };
  const toggleCam = function() { const c = R.call; if (!c) return; c.camOff = !c.camOff; c.local.getVideoTracks().forEach(function(t) { t.enabled = !c.camOff; }); render(); };
  const toggleScreen = async function() {
    const c = R.call; if (!c) return;
    if (c.screen) { stopScreen(); return; }
    let s; try { s = await MD.getDisplayMedia({ video: true, audio: false }); } catch (e) { return; }
    c.screen = s; const track = s.getVideoTracks()[0];
    track.onended = stopScreen;
    for (const uid of Object.keys(c.peers)) {
      const p = c.peers[uid], vs = p.pc.getSenders().find(function(x) { return x.track && x.track.kind === 'video'; });
      if (vs) await vs.replaceTrack(track);
      else { p.screenSender = p.pc.addTrack(track, s); await offerTo(Number(uid)); }
    }
    render();
  };
  const stopScreen = async function() {
    const c = R.call; if (!c || !c.screen) return;
    c.screen.getTracks().forEach(function(t) { t.stop(); }); c.screen = null;
    const cam = c.local.getVideoTracks()[0];
    for (const uid of Object.keys(c.peers)) {
      const p = c.peers[uid];
      if (p.screenSender) { try { p.pc.removeTrack(p.screenSender); } catch (e) { /* */ } p.screenSender = null; await offerTo(Number(uid)); }
      else { const vs = p.pc.getSenders().find(function(x) { return x.track && x.track.kind === 'video'; }); if (vs && cam) await vs.replaceTrack(cam); }
    }
    render();
  };

  // ---------- окно звонка ----------
  const render = function() {
    const c = R.call; if (!c) return;
    let w = document.querySelector('.rtc-win');
    if (!w) {
      w = document.createElement('div'); w.className = 'rtc-win';
      w.addEventListener('click', function(e) {
        const b = e.target.closest && e.target.closest('[data-rtc]'); if (!b) return;
        const a = b.getAttribute('data-rtc');
        if (a === 'hang') hangup(); else if (a === 'mic') toggleMic(); else if (a === 'cam') toggleCam(); else if (a === 'screen') toggleScreen(); else if (a === 'big') { w.classList.toggle('big'); }
      });
      document.body.appendChild(w);
      c.tick = setInterval(function() { const t = w.querySelector('[data-rtc-time]'); if (t && R.call) t.textContent = R.call.startedAt ? dur(R.call.startedAt) : (R.call.out ? 'вызов…' : 'соединение…'); }, 1000);
    }
    const others = c.members.filter(function(u) { return u !== R.me && !c.left[u]; });
    const tiles = others.map(function(u) {
      const p = c.peers[u], nm = R.names[u] || 'Участник', st = !p ? (c.out ? 'вызов…' : 'ждём…') : p.pc.connectionState === 'connected' ? '' : p.pc.connectionState === 'failed' ? 'нет связи' : 'соединение…';
      const hasVideo = p && p.stream && p.stream.getVideoTracks().some(function(t) { return t.readyState === 'live' && !t.muted; });
      return '<div class="rtc-tile' + (hasVideo ? '' : ' novideo') + '" data-tile="' + u + '"><video autoplay playsinline></video><div class="rtc-ava">' + rtcEsc(rtcIni(nm)) + '</div>'
        + '<div class="rtc-name">' + rtcEsc(nm) + '</div>' + (st ? '<div class="rtc-state">' + st + '</div>' : '') + '</div>';
    }).join('');
    const showMe = c.local.getVideoTracks().length || c.screen;
    w.innerHTML = '<div class="rtc-top">' + (c.video ? RTC_ICON.video : RTC_ICON.phone) + '<b>' + rtcEsc(c.title || others.map(function(u) { return R.names[u] || ''; }).join(', ')) + '</b><span data-rtc-time>' + (c.startedAt ? dur(c.startedAt) : c.out ? 'вызов…' : 'соединение…') + '</span>'
      + '<button class="rtc-ic" data-rtc="big" title="Развернуть / свернуть">' + RTC_ICON.big + '</button></div>'
      + '<div class="rtc-grid">' + (tiles || '<div class="rtc-msg">Все вышли</div>') + '</div>'
      + (showMe ? '<div class="rtc-me' + (c.screen ? ' screen' : '') + '"><video autoplay playsinline muted></video></div>' : '')
      + '<div class="rtc-bar"><button class="rtc-b tool' + (c.muted ? ' off' : '') + '" data-rtc="mic" title="' + (c.muted ? 'Включить микрофон' : 'Выключить микрофон') + '">' + RTC_ICON.mic + '</button>'
      + (c.local.getVideoTracks().length ? '<button class="rtc-b tool' + (c.camOff ? ' off' : '') + '" data-rtc="cam" title="Камера">' + RTC_ICON.video + '</button>' : '')
      + (MD && MD.getDisplayMedia ? '<button class="rtc-b tool' + (c.screen ? ' off' : '') + '" data-rtc="screen" title="' + (c.screen ? 'Остановить показ экрана' : 'Показать экран') + '">' + RTC_ICON.screen + '</button>' : '')
      + '<button class="rtc-b no" data-rtc="hang" title="Завершить">' + RTC_ICON.hang + '</button></div>';
    others.forEach(function(u) { const p = c.peers[u], v = w.querySelector('[data-tile="' + u + '"] video'); if (p && p.stream && v) { v.srcObject = p.stream; v.play().catch(function() {}); } });
    const mv = w.querySelector('.rtc-me video'); if (mv) { mv.srcObject = c.screen || c.local; mv.play().catch(function() {}); }
  };

  // ---------- входящий ----------
  const showIncoming = function(m) {
    R.incoming = m; R.names[m.from] = m.fromName;
    const d = m.data || {}, group = (d.members || []).length > 2;
    const el = document.createElement('div'); el.className = 'rtc-in';
    el.innerHTML = '<div class="rtc-ava">' + rtcEsc(rtcIni(m.fromName)) + '</div><div class="rtc-in-t"><b>' + rtcEsc(m.fromName) + '</b><span>' + (d.video ? 'Видеозвонок' : 'Звонок') + (group ? ' · ' + rtcEsc(d.title || 'группа') + ', ' + d.members.length + ' участн.' : '') + '</span></div>'
      + '<button class="rtc-b ok" data-a="audio" title="Ответить">' + RTC_ICON.phone + '</button>'
      + (d.video ? '<button class="rtc-b ok" data-a="video" title="Ответить с видео">' + RTC_ICON.video + '</button>' : '')
      + '<button class="rtc-b no" data-a="no" title="Отклонить">' + RTC_ICON.hang + '</button>';
    el.addEventListener('click', function(e) {
      const b = e.target.closest && e.target.closest('[data-a]'); if (!b) return;
      const a = b.getAttribute('data-a');
      if (a === 'no') { sendCall(m.call, [m.from], 'decline'); closeIncoming(); } else accept(a === 'video');
    });
    document.body.appendChild(el);
    tone('ring'); flashTitle('📞 ' + m.fromName);
    try { if (W.Notification && W.Notification.permission === 'granted' && document.hidden) new W.Notification('Звонок в CRM', { body: m.fromName + (d.video ? ' — видеозвонок' : ' — звонок') }); } catch (e) { /* */ }
    m.timer = setTimeout(function() { if (R.incoming === m) { closeIncoming(); rtcToast('Пропущенный звонок: ' + m.fromName); } }, 50000);
  };
  const closeIncoming = function() { const m = R.incoming; if (m) clearTimeout(m.timer); R.incoming = null; const el = document.querySelector('.rtc-in'); if (el) el.remove(); stopTone(); stopFlash(); };

  // ---------- события от сервера ----------
  const onMsg = async function(m) {
    if (m.type === 'hello') { R.me = Number(m.me); return; }
    const c = R.call, mine = c && c.id === m.call;
    if (m.fromName) R.names[m.from] = m.fromName;
    try {
      if (m.type === 'ring') {
        if (c || R.incoming) { sendCall(m.call, [m.from], 'busy'); return; }
        showIncoming(m); return;
      }
      if (m.type === 'cancel') {
        if (R.incoming && R.incoming.call === m.call) { closeIncoming(); rtcToast('Пропущенный звонок: ' + m.fromName); }
        else if (mine && !Object.keys(c.peers).length) end(m.fromName + ' отменил звонок');
        return;
      }
      if (!mine) return;
      if (m.type === 'busy' || m.type === 'decline') {
        c.left[m.from] = true;
        const waiting = c.members.filter(function(u) { return u !== R.me && !c.left[u]; });
        if (!waiting.length && !Object.keys(c.peers).length) end(m.fromName + (m.type === 'busy' ? ' сейчас на другом звонке' : ' отклонил звонок'));
        else render();
        return;
      }
      if (m.type === 'join') {
        (m.data && m.data.members || []).map(Number).forEach(function(u) { if (c.members.indexOf(u) === -1) c.members.push(u); });
        if (c.members.indexOf(m.from) === -1) c.members.push(m.from);
        delete c.left[m.from];
        clearTimeout(c.ringTimer); c.state = 'active'; stopTone();
        await offerTo(m.from); return;
      }
      if (m.type === 'offer') {
        const p = peer(m.from); delete c.left[m.from];
        await p.pc.setRemoteDescription(m.data); flushIce(p);
        const a = await p.pc.createAnswer(); await p.pc.setLocalDescription(a);
        sendCall(c.id, [m.from], 'answer', { sdp: p.pc.localDescription.sdp, type: 'answer' }); return;
      }
      if (m.type === 'answer') { const p = c.peers[m.from]; if (p) { await p.pc.setRemoteDescription(m.data); flushIce(p); } return; }
      if (m.type === 'ice') { const p = c.peers[m.from]; if (!p) return; if (p.pc.remoteDescription) p.pc.addIceCandidate(m.data).catch(function() {}); else p.q.push(m.data); return; }
      if (m.type === 'hangup') {
        dropPeer(m.from); c.left[m.from] = true;
        if (!Object.keys(c.peers).length) end(c.members.length > 2 ? 'Все вышли из звонка' : m.fromName + ' завершил звонок · ' + (c.startedAt ? dur(c.startedAt) : '0:00'));
        else render();
      }
    } catch (e) { console.warn('call', m.type, e); }
  };

  // ---------- поток событий: держим, пока пользователь вошёл; переподключаемся ----------
  (async function loop() {
    const dec = W.TextDecoder ? new W.TextDecoder('utf-8') : null;
    for (;;) {
      if (!tok()) { await sleep(15000); continue; }
      try {
        const r = await fetch(BASE + '/rtc/stream', { headers: { Authorization: 'Bearer ' + tok() } });
        if (r.status === 401 || r.status === 403) { await sleep(60000); continue; }
        if (!r.ok || !r.body || !r.body.getReader || !dec) { await sleep(30000); continue; }
        const rd = r.body.getReader(); let buf = '';
        for (;;) {
          const x = await rd.read(); if (x.done) break;
          buf += dec.decode(x.value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n\n')) !== -1) {
            const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
            chunk.split('\n').forEach(function(l) { if (l.indexOf('data: ') === 0) { try { onMsg(JSON.parse(l.slice(6))); } catch (e) { /* */ } } });
          }
        }
      } catch (e) { /* сеть — переподключимся */ }
      await sleep(3000);
    }
  })();
  // имя для собеседника
  fetch('/api/auth:check', { headers: { Authorization: 'Bearer ' + tok() } }).then(function(r) { return r.json(); }).then(function(j) { const u = j && j.data; if (u) { R.me = R.me || u.id; R.myName = u.nickname || u.username; } }).catch(function() {});
  // закрыли или обновили страницу посреди звонка — сообщить собеседникам (keepalive переживает выгрузку страницы)
  W.addEventListener('beforeunload', function() {
    const c = R.call; if (!c) return;
    try { fetch(BASE + '/rtc/send', { method: 'POST', keepalive: true, headers: { Authorization: 'Bearer ' + tok(), 'Content-Type': 'application/json' }, body: JSON.stringify({ to: c.members.filter(function(u) { return u !== R.me; }), type: 'hangup', call: c.id }) }); } catch (e) { /* */ }
  });
}
// кнопки «позвонить» для шапки чата: data-call-ids="1,2" data-call-video="1"
function crmCallButtons(ids, title, names) {
  const d = ' data-call-ids="' + rtcEsc(ids.join(',')) + '" data-call-title="' + rtcEsc(title || '') + '" data-call-names="' + rtcEsc(JSON.stringify(names || {})) + '"';
  return '<button class="msgr-call-btn" title="Позвонить" data-call-go' + d + '>' + RTC_ICON.phone + '</button><button class="msgr-call-btn" title="Видеозвонок" data-call-go data-call-video="1"' + d + '>' + RTC_ICON.video + '</button>';
}
if (!window.__crmRtcBtn) {
  window.__crmRtcBtn = true;
  document.addEventListener('click', function(e) {
    const b = e.target.closest && e.target.closest('[data-call-go]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    let names = {}; try { names = JSON.parse(b.getAttribute('data-call-names') || '{}'); } catch (x) { /* */ }
    window.crmCall(b.getAttribute('data-call-ids').split(',').map(Number), { video: b.hasAttribute('data-call-video'), title: b.getAttribute('data-call-title'), names: names });
  }, true);
}
// ===== конец фрагмента звонков =====
