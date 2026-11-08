/*
 * Interactive effects:
 *   Effects.setBells(group, elements, opts) – bells that swing like pendulums
 *     whenever the page scrolls or is touched
 *   Effects.kickAll(strength)               – swing every visible bell
 *   Effects.shower(kinds, point)            – drop flowers from the top of the screen
 * Flower kinds: "rose", "marigold", "mogra", "lotus".
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rand = Math.random;
  function between(a, b) { return a + rand() * (b - a); }

  /* ═════════ Swinging bells ═════════ */
  var groups = {};
  var bells = [];
  var running = false, last = 0;

  function rebuild() {
    bells = [];
    Object.keys(groups).forEach(function (k) { bells = bells.concat(groups[k]); });
  }
  function apply(b) {
    var a = b.th.toFixed(2);
    if (b.svg) b.el.setAttribute("transform", "rotate(" + a + ")");
    else b.el.style.transform = "rotate(" + a + "deg)";
  }
  function step(now) {
    var dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    var active = false;
    bells.forEach(function (b) {
      var w0 = 2 * Math.PI * b.f;
      b.w += (-w0 * w0 * b.th - 2 * b.z * w0 * b.w) * dt;
      b.th += b.w * dt;
      if (Math.abs(b.th) > b.max) { b.th = Math.sign(b.th) * b.max; b.w *= -0.4; }
      if (Math.abs(b.th) > 0.04 || Math.abs(b.w) > 0.4) active = true;
      apply(b);
    });
    if (active) requestAnimationFrame(step);
    else { running = false; bells.forEach(function (b) { b.th = 0; b.w = 0; apply(b); }); }
  }
  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(step);
  }
  function visible(r) { return r.bottom > -40 && r.top < window.innerHeight + 40; }
  function push(b, v) { b.w += (reduce ? v * 0.35 : v) * b.gain; }

  function setBells(name, elements, opts) {
    opts = opts || {};
    groups[name] = Array.prototype.map.call(elements, function (el) {
      return {
        el: el,
        svg: !(el instanceof HTMLElement),
        th: 0, w: 0,
        f: between(opts.fmin || 0.75, opts.fmax || 1.1),   // swing frequency, Hz
        z: opts.damping || 0.085,                          // low damping = long, lazy swings
        max: reduce ? Math.min(8, opts.max || 24) : (opts.max || 24),
        gain: opts.gain || 1,                              // how strongly touches and scrolls move it
      };
    });
    rebuild();
  }

  function kickAll(strength) {
    bells.forEach(function (b, i) {
      if (!visible(b.el.getBoundingClientRect())) return;
      push(b, strength * between(0.6, 1.3) * (i % 2 ? 1 : -1));
    });
    wake();
  }

  // Scrolling: the faster the scroll, the bigger the swing.
  var lastY = window.scrollY, ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var dy = window.scrollY - lastY;
      lastY = window.scrollY;
      ticking = false;
      if (!dy) return;
      var v = Math.max(-170, Math.min(170, dy * 5));
      bells.forEach(function (b) {
        if (visible(b.el.getBoundingClientRect())) push(b, v * between(0.6, 1.2));
      });
      wake();
    });
  }, { passive: true });

  // Touch or click anywhere: bells swing away from the finger, more if close.
  document.addEventListener("pointerdown", function (e) {
    bells.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      if (!visible(r)) return;
      var dx = (r.left + r.width / 2) - e.clientX;
      var dy = (r.top + r.height / 2) - e.clientY;
      var near = Math.exp(-(dx * dx + dy * dy) / (2 * 140 * 140));
      push(b, (dx >= 0 ? 1 : -1) * (45 + 190 * near) * between(0.7, 1.2));
    });
    wake();
  }, { passive: true, capture: true });

  // Brushing a finger or mouse across a bell nudges it in that direction.
  document.addEventListener("pointermove", function (e) {
    if (!e.movementX) return;
    var hit = false;
    bells.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      if (e.clientX > r.left - 10 && e.clientX < r.right + 10 && e.clientY > r.top && e.clientY < r.bottom + 10) {
        push(b, Math.max(-120, Math.min(120, e.movementX * 9)));
        hit = true;
      }
    });
    if (hit) wake();
  }, { passive: true });

  /* ═════════ Flower showers ═════════ */
  var canvas, ctx, W = 0, H = 0, dpr = 1;
  var parts = [];
  var sprites = {};
  var looping = false, lastT = 0;
  var MAX = 280;

  function sprite(w, h, draw) {
    var c = document.createElement("canvas");
    var s = 2;
    c.width = w * s; c.height = h * s;
    var x = c.getContext("2d");
    x.scale(s, s);
    draw(x, w, h);
    c.w = w; c.h = h;
    return c;
  }
  function rosePetal(dark, light) {
    return sprite(26, 30, function (x, w, h) {
      var g = x.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, dark); g.addColorStop(1, light);
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(w / 2, h * 0.98);
      x.bezierCurveTo(w * 0.02, h * 0.74, w * 0.02, h * 0.2, w * 0.3, h * 0.07);
      x.quadraticCurveTo(w / 2, h * 0.2, w * 0.7, h * 0.07);
      x.bezierCurveTo(w * 0.98, h * 0.2, w * 0.98, h * 0.74, w / 2, h * 0.98);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(w / 2, h * 0.9); x.quadraticCurveTo(w * 0.45, h * 0.5, w / 2, h * 0.22); x.stroke();
    });
  }
  function marigold(inner, outer, edge) {
    return sprite(30, 30, function (x, w) {
      var c = w / 2;
      [[13, 20, outer], [9.5, 15, outer], [6.5, 11, inner]].forEach(function (ring) {
        var r = ring[0], n = ring[1];
        for (var i = 0; i < n; i++) {
          var a = (i / n) * Math.PI * 2 + r;
          x.save();
          x.translate(c + Math.cos(a) * r * 0.55, c + Math.sin(a) * r * 0.55);
          x.rotate(a);
          x.fillStyle = ring[2];
          x.strokeStyle = edge; x.lineWidth = 0.6;
          x.beginPath(); x.ellipse(0, 0, r * 0.5, r * 0.26, 0, 0, Math.PI * 2); x.fill(); x.stroke();
          x.restore();
        }
      });
      x.fillStyle = edge; x.beginPath(); x.arc(c, c, 2.2, 0, Math.PI * 2); x.fill();
    });
  }
  function looseMarigoldPetal(fill, edge) {
    return sprite(10, 16, function (x, w, h) {
      x.fillStyle = fill; x.strokeStyle = edge; x.lineWidth = 0.7;
      x.beginPath();
      x.moveTo(w / 2, h);
      x.bezierCurveTo(0, h * 0.7, 0, h * 0.15, w * 0.25, h * 0.05);
      x.lineTo(w * 0.42, h * 0.16); x.lineTo(w * 0.58, h * 0.04); x.lineTo(w * 0.75, h * 0.15);
      x.bezierCurveTo(w, h * 0.2, w, h * 0.7, w / 2, h);
      x.fill(); x.stroke();
    });
  }
  function jasmine() {
    return sprite(22, 22, function (x, w) {
      var c = w / 2;
      for (var i = 0; i < 6; i++) {
        x.save(); x.translate(c, c); x.rotate((i / 6) * Math.PI * 2);
        x.fillStyle = "#FFFFFF"; x.strokeStyle = "#E3D9C6"; x.lineWidth = 0.6;
        x.beginPath(); x.ellipse(0, -5.5, 2.8, 5, 0, 0, Math.PI * 2); x.fill(); x.stroke();
        x.restore();
      }
      x.fillStyle = "#E9D27A"; x.beginPath(); x.arc(c, c, 2, 0, Math.PI * 2); x.fill();
    });
  }
  function jasmineBud() {
    return sprite(10, 18, function (x, w, h) {
      x.fillStyle = "#FFFDF8"; x.strokeStyle = "#E3D9C6"; x.lineWidth = 0.6;
      x.beginPath(); x.ellipse(w / 2, h * 0.42, w * 0.32, h * 0.38, 0, 0, Math.PI * 2); x.fill(); x.stroke();
      x.fillStyle = "#8DAA87"; x.beginPath(); x.ellipse(w / 2, h * 0.86, w * 0.18, h * 0.1, 0, 0, Math.PI * 2); x.fill();
    });
  }
  function lotusPetal(tip, base) {
    return sprite(20, 34, function (x, w, h) {
      var g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, tip); g.addColorStop(1, base);
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(w / 2, 0);
      x.bezierCurveTo(w, h * 0.35, w * 0.85, h * 0.85, w / 2, h);
      x.bezierCurveTo(w * 0.15, h * 0.85, 0, h * 0.35, w / 2, 0);
      x.fill();
    });
  }

  var KINDS = {
    rose: function () {
      return [rosePetal("#9E0F2E", "#E2486A"), rosePetal("#C2185B", "#F48FB1"),
              rosePetal("#B71C3C", "#F06A80"), rosePetal("#D9467A", "#FBC1D2")];
    },
    marigold: function () {
      return [marigold("#F9C933", "#F5A10E", "#B9690A"), marigold("#FCD94A", "#FBC02D", "#C78A0C"),
              marigold("#F7A23A", "#EE7B12", "#A8500A"),
              looseMarigoldPetal("#FBC02D", "#C98B0C"), looseMarigoldPetal("#F59A1B", "#B8650A")];
    },
    mogra: function () { return [jasmine(), jasmine(), jasmineBud()]; },
    lotus: function () { return [lotusPetal("#E0789B", "#FFF1F4"), lotusPetal("#EFA0B9", "#FFFFFF")]; },
  };
  var HEAVY = { marigold: true }; // whole flowers fall a little faster

  function getSprites(kind) {
    if (!KINDS[kind]) kind = "rose";
    if (!sprites[kind]) sprites[kind] = KINDS[kind]();
    return sprites[kind];
  }

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.className = "shower";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
  }

  function make(kind, x, y, vx, vy, gravity) {
    var list = getSprites(kind);
    var img = list[Math.floor(rand() * list.length)];
    var heavy = HEAVY[kind] && img.w > 20;
    return {
      img: img, x: x, y: y, vx: vx, vy: vy, g: gravity,
      term: heavy ? between(190, 250) : between(125, 185),
      rot: rand() * 360, vr: between(-140, 140),
      sway: heavy ? between(8, 20) : between(25, 55), sf: between(1, 2.4), ph: rand() * 6.28,
      flip: heavy ? between(0.6, 1.4) : between(1.6, 3.6),
      size: between(0.75, 1.25), t: 0,
    };
  }

  function shower(kinds, point) {
    if (!kinds || !kinds.length) return;
    ensureCanvas();
    var total = reduce ? 14 : 54;
    var per = Math.ceil(total / kinds.length);
    kinds.forEach(function (kind) {
      for (var i = 0; i < per; i++) {
        parts.push(make(kind, between(-10, W + 10), -30 - rand() * H * 0.3, between(-15, 15), between(60, 120), 90));
      }
      // A small burst from where the guest tapped
      if (point && !reduce) {
        for (var j = 0; j < 6; j++) {
          parts.push(make(kind, point.x, point.y, between(-170, 170), between(-320, -140), 420));
        }
      }
    });
    if (parts.length > MAX) parts.splice(0, parts.length - MAX);
    if (!looping) { looping = true; lastT = performance.now(); requestAnimationFrame(loop); }
  }

  function loop(now) {
    var dt = Math.min(0.033, (now - lastT) / 1000 || 0.016);
    lastT = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.t += dt;
      p.vy = p.vy < p.term ? Math.min(p.term, p.vy + p.g * dt) : p.vy * 0.98;
      if (p.vy > 0) p.vx *= 0.97; // bursts slow down sideways once falling
      p.x += (p.vx + Math.sin(p.t * p.sf + p.ph) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 40) { parts.splice(i, 1); continue; }
      var flip = Math.cos(p.t * p.flip + p.ph);
      if (Math.abs(flip) < 0.15) flip = flip < 0 ? -0.15 : 0.15;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.scale(flip * p.size, p.size);
      ctx.drawImage(p.img, -p.img.w / 2, -p.img.h / 2, p.img.w, p.img.h);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else { looping = false; ctx.clearRect(0, 0, W, H); }
  }

  window.Effects = { setBells: setBells, kickAll: kickAll, shower: shower, kinds: Object.keys(KINDS) };
})();
