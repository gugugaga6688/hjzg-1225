/* ============================================================
   何杰 & 赵鸽 · 电子请帖  |  main.js
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     0. 图片淡入
     ------------------------------------------------------------ */
  function initImages() {
    var imgs = document.querySelectorAll('.media img');
    Array.prototype.forEach.call(imgs, function (img) {
      var box = img.closest('.media') || img.parentNode;
      function done() { box.classList.add('is-loaded'); }
      if (img.complete && img.naturalWidth > 0) {
        done();
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });

    var coverPhoto = document.querySelector('.cover__photo');
    if (coverPhoto && coverPhoto.complete) {
      var pre = document.querySelector('.cover__preload');
      if (pre) pre.style.opacity = '0';
    } else if (coverPhoto) {
      coverPhoto.addEventListener('load', function () {
        var pre = document.querySelector('.cover__preload');
        if (pre) pre.style.opacity = '0';
      });
    }
  }

  /* ------------------------------------------------------------
     1. 封面启封
     ------------------------------------------------------------ */
  var cover = document.getElementById('cover');
  var seal = document.getElementById('seal');
  var opened = false;

  function openInvite() {
    if (opened) return;
    opened = true;

    cover.classList.add('is-open');
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-open');
    window.scrollTo(0, 0);

    startMusic();
    startDustStop();

    window.setTimeout(function () {
      cover.setAttribute('aria-hidden', 'true');
      cover.style.visibility = 'hidden';
      var first = document.getElementById('invite');
      if (first) first.setAttribute('tabindex', '-1');
    }, 1250);
  }

  if (seal) seal.addEventListener('click', openInvite);
  if (cover) {
    cover.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openInvite();
      }
    });
  }

  /* ------------------------------------------------------------
     2. 入场动画
     ------------------------------------------------------------ */
  var revealQueue = [];

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(items, function (el) {
      io.observe(el);
      revealQueue.push(el);
    });
  }

  // 快速滑动时兜底：已经越过视口下沿的元素直接显示，避免长期隐身
  function sweepReveal() {
    if (!revealQueue.length) return;
    var vh = window.innerHeight || 800;
    for (var i = revealQueue.length - 1; i >= 0; i--) {
      var el = revealQueue[i];
      if (el.classList.contains('in') || el.getBoundingClientRect().top < vh * 0.94) {
        el.classList.add('in');
        revealQueue.splice(i, 1);
      }
    }
  }

  /* ------------------------------------------------------------
     3. 视差
     ------------------------------------------------------------ */
  var parallaxItems = [];
  function initParallax() {
    if (reduceMotion) return;
    parallaxItems = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    parallaxItems.forEach(function (img) {
      img.style.transform = 'translate3d(0,0,0) scale(1.1)';
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight || 800;
      parallaxItems.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var progress = (r.top + r.height / 2 - vh / 2) / vh;
        // 位移量跟随图片高度自适应，避免矮横幅露出边缘
        var maxShift = Math.min(42, r.height * 0.045);
        var shift = Math.max(-maxShift, Math.min(maxShift, progress * -38));
        img.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0) scale(1.1)';
      });
      updateProgress();
      sweepReveal();
    });
  }

  function updateProgress() {
    var bar = document.getElementById('progressBar');
    if (!bar) return;
    var h = docEl.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ------------------------------------------------------------
     4. 倒计时
     ------------------------------------------------------------ */
  var WEDDING_TS = new Date(
    document.body.getAttribute('data-wedding') || '2026-12-25T12:00:00+08:00'
  ).getTime();

  function initCountdown() {
    var dEl = document.getElementById('cdD');
    var hEl = document.getElementById('cdH');
    var mEl = document.getElementById('cdM');
    var sEl = document.getElementById('cdS');
    var note = document.getElementById('cdNote');
    if (!dEl) return;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var diff = WEDDING_TS - Date.now();
      if (diff <= 0) {
        dEl.textContent = '00'; hEl.textContent = '00';
        mEl.textContent = '00'; sEl.textContent = '00';
        if (note) {
          var days = Math.floor((Date.now() - WEDDING_TS) / 86400000);
          note.textContent = days <= 1 ? '良辰已至 · 感谢您与我们同在' : '新婚第 ' + days + ' 天 · 感谢您与我们同在';
        }
        return;
      }
      var sec = Math.floor(diff / 1000);
      var d = Math.floor(sec / 86400);
      var h = Math.floor((sec % 86400) / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      dEl.textContent = d < 10 ? '0' + d : String(d);
      hEl.textContent = pad(h);
      mEl.textContent = pad(m);
      sEl.textContent = pad(s);
    }

    tick();
    window.setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------
     5. 复制地址
     ------------------------------------------------------------ */
  var ADDRESS = '湖南省常德市桃源县漳江街道文昌路15号 桃诚1号小区7号楼 美豪丽致酒店（常德桃源店）';

  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-show');
    }, 2200);
  }

  function initCopy() {
    var btn = document.getElementById('copyAddr');
    if (!btn) return;
    btn.addEventListener('click', function () {
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = ADDRESS;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); toast('地址已复制'); }
        catch (e) { toast('复制失败，请手动选择地址'); }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(ADDRESS).then(function () {
          toast('地址已复制，可粘贴到地图搜索');
        }, fallback);
      } else {
        fallback();
      }
    });
  }

  /* ------------------------------------------------------------
     6. 背景音乐（Web Audio 实时合成 · 无需音频文件）
     ------------------------------------------------------------ */
  var audio = {
    ctx: null,
    master: null,
    playing: false,
    timer: null,
    loopDur: 0
  };

  var BPM = 56;
  var BEAT = 60 / BPM;
  var BAR = BEAT * 4;

  // I - V - vi - iii - IV - I - ii - V  (D 大调)
  var CHORDS = [
    [50, 57, 62, 66],
    [45, 52, 57, 61],
    [47, 54, 59, 62],
    [42, 49, 54, 57],
    [43, 50, 55, 59],
    [50, 57, 62, 66],
    [40, 47, 52, 55],
    [45, 52, 57, 61]
  ];

  var MELODY = [
    [[78, 1.0], [81, 2.5]],
    [[76, 1.0], [73, 2.5]],
    [[74, 1.0], [78, 2.5]],
    [[73, 1.0], [69, 2.5]],
    [[71, 1.0], [74, 2.5]],
    [[78, 1.0], [81, 2.5]],
    [[79, 1.0], [76, 2.5]],
    [[74, 1.0], [74, 2.5]]
  ];

  var ARP = [0, 1, 2, 3, 2, 1, 2, 1];

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function makeImpulse(ctx, seconds, decay) {
    var rate = ctx.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var data = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function bell(t, midi, vel, dur, dest, rev) {
    var ctx = audio.ctx;
    var f = midiToFreq(midi);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    g.connect(rev);

    var o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = f;

    var o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = f * 2.004;
    var g2 = ctx.createGain();
    g2.gain.value = 0.3;

    var o3 = ctx.createOscillator();
    o3.type = 'sine';
    o3.frequency.value = f * 3.99;
    var g3 = ctx.createGain();
    g3.gain.value = 0.08;

    o1.connect(g);
    o2.connect(g2); g2.connect(g);
    o3.connect(g3); g3.connect(g);

    o1.start(t); o2.start(t); o3.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
    o3.stop(t + dur + 0.05);
  }

  function pad(t, midis, dur, dest) {
    var ctx = audio.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 1.6);
    g.gain.setValueAtTime(0.035, t + dur - 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    midis.forEach(function (m) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = midiToFreq(m);
      o.detune.value = (Math.random() - 0.5) * 6;
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  function scheduleLoop(start) {
    var ctx = audio.ctx;
    var dry = ctx.createGain();
    dry.gain.value = 0.5;
    dry.connect(audio.master);

    var revIn = ctx.createGain();
    revIn.gain.value = 0.55;
    var conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 2.8, 2.6);
    revIn.connect(conv);
    conv.connect(audio.master);

    for (var bar = 0; bar < 8; bar++) {
      var t0 = start + bar * BAR;
      var chord = CHORDS[bar];

      pad(t0, [chord[0] - 12, chord[0] - 5], BAR, audio.master);

      for (var i = 0; i < ARP.length; i++) {
        var idx = ARP[i];
        var note = chord[idx] + (i === 5 ? 12 : 0);
        var vel = i === 0 ? 0.16 : (i % 2 === 0 ? 0.1 : 0.075);
        bell(t0 + i * (BAR / 8), note + 12, vel, 2.6, dry, revIn);
      }

      var mel = MELODY[bar];
      for (var j = 0; j < mel.length; j++) {
        bell(t0 + mel[j][1] * BEAT, mel[j][0], 0.11, 3.2, dry, revIn);
      }
    }

    audio.loopDur = BAR * 8;
    window.clearTimeout(audio.timer);
    audio.timer = window.setTimeout(function () {
      if (!audio.playing) return;
      scheduleLoop(start + audio.loopDur);
    }, Math.max(1000, (audio.loopDur - 1.2) * 1000));
  }

  function ensureAudio() {
    if (audio.ctx) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0;
    audio.master.connect(audio.ctx.destination);
  }

  function startMusic() {
    var btn = document.getElementById('soundBtn');
    ensureAudio();
    if (!audio.ctx) return;

    if (audio.ctx.state === 'suspended') audio.ctx.resume();

    if (!audio.playing) {
      audio.playing = true;
      var now = audio.ctx.currentTime + 0.15;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(0.0001, now);
      audio.master.gain.linearRampToValueAtTime(0.85, now + 3.2);
      scheduleLoop(now);
    }
    if (btn) {
      btn.classList.add('is-playing');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', '关闭背景音乐');
    }
  }

  function stopMusic() {
    var btn = document.getElementById('soundBtn');
    if (!audio.ctx) return;
    audio.playing = false;
    window.clearTimeout(audio.timer);
    var now = audio.ctx.currentTime;
    audio.master.gain.cancelScheduledValues(now);
    audio.master.gain.setValueAtTime(audio.master.gain.value, now);
    audio.master.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    if (btn) {
      btn.classList.remove('is-playing');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', '开启背景音乐');
    }
  }

  function initSound() {
    var btn = document.getElementById('soundBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (audio.playing) {
        stopMusic();
      } else {
        ensureAudio();
        if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
        startMusic();
      }
    });
  }

  /* ------------------------------------------------------------
     7. 封面金色微尘
     ------------------------------------------------------------ */
  var dust = {
    raf: null,
    stop: false,
    canvas: null,
    ctx: null,
    parts: [],
    w: 0,
    h: 0,
    dpr: 1
  };

  function initDust() {
    var canvas = document.getElementById('dust');
    if (!canvas || reduceMotion) return;
    dust.canvas = canvas;
    dust.ctx = canvas.getContext('2d');
    resizeDust();

    var count = window.innerWidth < 600 ? 26 : 46;
    for (var i = 0; i < count; i++) {
      dust.parts.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.4,
        vy: 0.00006 + Math.random() * 0.00016,
        vx: (Math.random() - 0.5) * 0.00008,
        a: 0.15 + Math.random() * 0.5,
        ph: Math.random() * Math.PI * 2
      });
    }
    window.addEventListener('resize', resizeDust);
    loopDust();
  }

  function resizeDust() {
    if (!dust.canvas) return;
    dust.dpr = Math.min(2, window.devicePixelRatio || 1);
    dust.w = dust.canvas.clientWidth;
    dust.h = dust.canvas.clientHeight;
    dust.canvas.width = Math.floor(dust.w * dust.dpr);
    dust.canvas.height = Math.floor(dust.h * dust.dpr);
    dust.ctx.setTransform(dust.dpr, 0, 0, dust.dpr, 0, 0);
  }

  function loopDust() {
    if (dust.stop || !dust.ctx) return;
    var c = dust.ctx;
    var t = performance.now() / 1000;
    c.clearRect(0, 0, dust.w, dust.h);

    for (var i = 0; i < dust.parts.length; i++) {
      var p = dust.parts[i];
      p.y -= p.vy;
      p.x += p.vx + Math.sin(t * 0.4 + p.ph) * 0.00006;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;

      var alpha = p.a * (0.55 + 0.45 * Math.sin(t * 0.8 + p.ph));
      c.beginPath();
      c.arc(p.x * dust.w, p.y * dust.h, p.r, 0, Math.PI * 2);
      c.fillStyle = 'rgba(226,203,158,' + alpha.toFixed(3) + ')';
      c.fill();
    }
    dust.raf = window.requestAnimationFrame(loopDust);
  }

  function startDustStop() {
    dust.stop = true;
    if (dust.raf) window.cancelAnimationFrame(dust.raf);
    if (dust.canvas) dust.canvas.style.display = 'none';
  }

  /* ------------------------------------------------------------
     8. 启动
     ------------------------------------------------------------ */
  function boot() {
    initImages();
    initReveal();
    initParallax();
    initCountdown();
    initCopy();
    initSound();
    initDust();
    updateProgress();
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 切到后台时暂停音乐
  document.addEventListener('visibilitychange', function () {
    if (!audio.ctx) return;
    if (document.hidden && audio.playing) {
      audio.ctx.suspend();
    } else if (!document.hidden && audio.playing) {
      audio.ctx.resume();
    }
  });
})();
