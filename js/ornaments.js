/*
 * Royal ornaments drawn as SVG at the exact size they are shown:
 *   buildArch    – the cusped palace archway (jharokha) around the hero
 *   buildMandala – the ringed medallion around the wedding date
 *   buildPalace  – the palace skyline at the top of the footer
 * Colours come from CSS (classes .o-gold, .o-fill, .o-soft, .o-palace, ...).
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function f(n) { return Math.round(n * 10) / 10; }

  /* Cusped pointed arch from x0..x1, apex at y0, sides down to y1. */
  function archPath(x0, y0, x1, y1, rise, lobes) {
    var cx = (x0 + x1) / 2;
    var ys = y0 + rise; // springline
    // Left half of a pointed (ogee-like) arch as a cubic curve.
    var P = [[x0, ys], [x0, ys - rise * 0.62], [cx - (x1 - x0) * 0.2, y0 + rise * 0.16], [cx, y0]];
    function at(t) {
      var u = 1 - t;
      return [
        u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
        u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
      ];
    }
    var pts = [];
    for (var i = 0; i <= lobes; i++) pts.push(at(i / lobes));
    var d = "M" + f(x0) + " " + f(y1) + " L" + f(x0) + " " + f(ys);
    function arc(a, b) {
      var chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var r = chord * 0.62;
      return " A" + f(r) + " " + f(r) + " 0 0 1 " + f(b[0]) + " " + f(b[1]);
    }
    for (i = 1; i < pts.length; i++) d += arc(pts[i - 1], pts[i]);
    var right = pts.slice().reverse().map(function (p) { return [x1 - (p[0] - x0), p[1]]; });
    for (i = 1; i < right.length; i++) d += arc(right[i - 1], right[i]);
    return d + " L" + f(x1) + " " + f(y1);
  }

  window.buildArch = function (svg, W, H) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var top = 44;                          // room for the finial
    var rise = Math.min(W * 0.5, H * 0.32);
    var lobes = W > 520 ? 9 : 7;
    var outer = archPath(1.5, top, W - 1.5, H, rise, lobes);
    var inner = archPath(9, top + 10, W - 9, H, rise - 8, lobes);
    var defs = el("defs", {}, svg);
    var glow = el("radialGradient", { id: "archGlow", cx: "50%", cy: "38%", r: "75%" }, defs);
    el("stop", { offset: "0%", class: "o-glow-in" }, glow);
    el("stop", { offset: "100%", class: "o-glow-out" }, glow);

    el("path", { d: outer + " Z", fill: "url(#archGlow)" }, svg);
    el("path", { d: outer, class: "o-gold", fill: "none", "stroke-width": 2 }, svg);
    el("path", { d: inner, class: "o-gold", fill: "none", "stroke-width": 0.9 }, svg);
    // Threshold step at the foot of the arch
    el("path", { d: "M1.5 " + (H - 1) + " H" + (W - 1.5), class: "o-gold", "stroke-width": 2 }, svg);
    el("path", { d: "M9 " + (H - 6) + " H" + (W - 9), class: "o-gold", "stroke-width": 0.9 }, svg);

    // Finial: a small gold dome with a spire, as on palace chhatris.
    var cx = W / 2;
    var g = el("g", { class: "o-gold-fill" }, svg);
    el("path", { d: "M" + (cx - 9) + " " + (top + 1) + " C" + (cx - 14) + " " + (top - 12) + " " + (cx - 2) + " " + (top - 16) + " " + cx + " " + (top - 26) +
      " C" + (cx + 2) + " " + (top - 16) + " " + (cx + 14) + " " + (top - 12) + " " + (cx + 9) + " " + (top + 1) + "Z" }, g);
    el("rect", { x: cx - 0.8, y: top - 40, width: 1.6, height: 15 }, g);
    el("circle", { cx: cx, cy: top - 41, r: 2.4 }, g);
    // Lotus capitals where the arch springs from its pillars.
    var ys = top + rise;
    [[1.5, 1], [W - 1.5, -1]].forEach(function (p) {
      var x = p[0], s = p[1];
      el("path", { d: "M" + x + " " + (ys - 3) + " l" + (s * 12) + " 0 l" + (-s * 4) + " 6 l" + (-s * 8) + " 0Z" }, g);
      el("circle", { cx: x + s * 15, cy: ys, r: 1.8 }, g);
    });
    // A row of small dots along the inner line, like inlay work.
    var probe = el("path", { d: inner, fill: "none", stroke: "none" }, svg);
    var len = probe.getTotalLength ? probe.getTotalLength() : 0;
    var archLen = len - 2 * (H - (top + 10 + rise - 8));
    var side = H - (top + 10 + rise - 8);
    for (var t = 14; t < archLen - 10; t += 14) {
      var pt = probe.getPointAtLength(side + t), nx = probe.getPointAtLength(side + t + 1);
      var tx = nx.x - pt.x, ty = nx.y - pt.y, m = Math.hypot(tx, ty) || 1;
      // Step inward (to the right of the direction of travel).
      el("circle", { cx: f(pt.x - 5 * ty / m), cy: f(pt.y + 5 * tx / m), r: 1.1, class: "o-gold-fill", opacity: 0.8 }, svg);
    }
    probe.remove();
    return svg;
  };

  window.buildMandala = function (svg) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 200 200");
    var c = 100;
    el("circle", { cx: c, cy: c, r: 97, class: "o-gold", fill: "none", "stroke-width": 1.2 }, svg);
    el("circle", { cx: c, cy: c, r: 93, class: "o-gold", fill: "none", "stroke-width": 0.5 }, svg);
    // Outer petal ring
    var petals = el("g", {}, svg);
    for (var i = 0; i < 24; i++) {
      var a = (i / 24) * 360;
      el("path", {
        d: "M100 9 C105 14 106 20 100 27 C94 20 95 14 100 9Z",
        transform: "rotate(" + a + " 100 100)", class: i % 2 ? "o-petal-a" : "o-petal-b",
        "stroke-width": 0.6,
      }, petals);
    }
    // Scalloped inner border
    var d = "";
    for (i = 0; i < 36; i++) {
      var a0 = (i / 36) * Math.PI * 2, a1 = ((i + 1) / 36) * Math.PI * 2;
      var R = 74;
      var p0 = [c + R * Math.sin(a0), c - R * Math.cos(a0)], p1 = [c + R * Math.sin(a1), c - R * Math.cos(a1)];
      d += (i ? "" : "M" + f(p0[0]) + " " + f(p0[1])) + " A7 7 0 0 1 " + f(p1[0]) + " " + f(p1[1]);
    }
    el("path", { d: d + "Z", class: "o-fill o-gold", "stroke-width": 1 }, svg);
    el("circle", { cx: c, cy: c, r: 66, class: "o-gold", fill: "none", "stroke-width": 0.6, "stroke-dasharray": "1 3" }, svg);
    // Dots between petals
    for (i = 0; i < 24; i++) {
      var b = ((i + 0.5) / 24) * Math.PI * 2;
      el("circle", { cx: f(c + 84 * Math.sin(b)), cy: f(c - 84 * Math.cos(b)), r: 1.3, class: "o-gold-fill" }, svg);
    }
    return svg;
  };

  function dome(parent, cx, base, w, h) {
    el("path", {
      d: "M" + f(cx - w / 2) + " " + f(base) +
         " C" + f(cx - w * 0.72) + " " + f(base - h * 0.5) + " " + f(cx - w * 0.14) + " " + f(base - h * 0.68) + " " + f(cx) + " " + f(base - h) +
         " C" + f(cx + w * 0.14) + " " + f(base - h * 0.68) + " " + f(cx + w * 0.72) + " " + f(base - h * 0.5) + " " + f(cx + w / 2) + " " + f(base) + "Z",
    }, parent);
    el("rect", { x: f(cx - 0.7), y: f(base - h - h * 0.35), width: 1.4, height: f(h * 0.36) }, parent);
    el("circle", { cx: f(cx), cy: f(base - h - h * 0.36), r: Math.max(1.4, w * 0.04) }, parent);
  }
  function windows(parent, x0, x1, top, h, step) {
    for (var x = x0 + step / 2; x < x1 - 4; x += step) {
      var w = step * 0.46;
      el("path", {
        d: "M" + f(x - w / 2) + " " + f(top + h) + " L" + f(x - w / 2) + " " + f(top + w * 0.5) +
           " Q" + f(x - w / 2) + " " + f(top) + " " + f(x) + " " + f(top - w * 0.2) +
           " Q" + f(x + w / 2) + " " + f(top) + " " + f(x + w / 2) + " " + f(top + w * 0.5) +
           " L" + f(x + w / 2) + " " + f(top + h) + "Z",
        class: "o-window",
      }, parent);
    }
  }
  // Rajput chhatri: a small domed pavilion on four pillars (two seen from the front).
  function chhatri(parent, cx, base, w) {
    var pillarH = w * 0.62;
    el("rect", { x: f(cx - w / 2 - 2), y: f(base - 3), width: f(w + 4), height: 3 }, parent);
    [-0.42, 0, 0.42].forEach(function (k) { el("rect", { x: f(cx + k * w - 1.1), y: f(base - pillarH), width: 2.2, height: f(pillarH) }, parent); });
    // Overhanging chhajja (eave)
    el("path", { d: "M" + f(cx - w / 2 - 4) + " " + f(base - pillarH) + " L" + f(cx + w / 2 + 4) + " " + f(base - pillarH) +
      " L" + f(cx + w / 2) + " " + f(base - pillarH - 4) + " L" + f(cx - w / 2) + " " + f(base - pillarH - 4) + "Z" }, parent);
    dome(parent, cx, base - pillarH - 4, w * 0.92, w * 0.58);
  }
  function parapet(parent, x0, x1, y) {
    el("rect", { x: f(x0 - 3), y: f(y - 3), width: f(x1 - x0 + 6), height: 3 }, parent);
    for (var x = x0 + 3; x < x1 - 2; x += 7) el("rect", { x: f(x), y: f(y - 6), width: 3.5, height: 3 }, parent);
  }

  /* ───────── Jhalar: scalloped frill with hanging bells, flowers, latkans ───────── */
  function bellItem(k, g, L) {
    for (var y = 2; y < L; y += 4) {
      el("ellipse", { cx: 0, cy: y, rx: 1.2, ry: 1.9, fill: "none", class: "o-gold", "stroke-width": 0.8 }, g);
    }
    k.rose(g, 0, L + 3.5, 3.4, false);
    k.bell(g, L + 8, 1.1);
  }
  function flowerItem(k, g, count, c) {
    var end = 6 + (count - 1) * 8;
    el("path", { d: "M0 0 V" + (end + 2), class: "o-gold", "stroke-width": 0.7 }, g);
    for (var m = 0; m < count; m++) {
      var y = 6 + m * 8;
      if (m % 2) k.rose(g, 0, y, 3.6, (c + m) % 3 === 0);
      else { k.bud(g, -1.5, y, -18, 3); k.bud(g, 1.5, y + 1, 18, 3); }
    }
    k.rose(g, 0, end + 6, 4.4, c % 2 === 0);
  }
  function latkanItem(g, L, c) {
    var silk = c % 2 ? "#D9789A" : "#E9A23B";
    var silk2 = c % 2 ? "#EDA9BE" : "#F4C66E";
    el("path", { d: "M0 0 V" + L, class: "o-gold", "stroke-width": 0.7 }, g);
    el("circle", { cx: 0, cy: L - 6, r: 1.4, fill: "#FFFFFF", class: "o-gold", "stroke-width": 0.5 }, g);
    el("circle", { cx: 0, cy: L, r: 2.5, class: "o-gold-fill" }, g);
    el("path", { d: "M-2.6 " + (L + 2) + " H2.6 L4.6 " + (L + 7) + " H-4.6Z", class: "o-gold-fill" }, g);
    for (var i = -4; i <= 4; i++) {
      el("path", {
        d: "M" + (i * 1.05) + " " + (L + 7) + " L" + (i * 1.6) + " " + (L + 21),
        stroke: i % 2 ? silk : silk2, "stroke-width": 1.15, "stroke-linecap": "round",
      }, g);
    }
    el("rect", { x: -5, y: L + 6.4, width: 10, height: 1.6, rx: 0.8, class: "o-gold-fill" }, g);
  }

  /* ───────── Birds that perch on a jhalar. Drawn facing right, feet at (0,0). ───────── */
  function parrot(g) {
    // Long tail hanging down over the frill
    el("path", { d: "M-2.5 -9 L-8.5 13 L-5.6 13.6 L0.2 -7.5Z", fill: "#4E9A55" }, g);
    el("path", { d: "M-1.2 -8.5 L-5.2 12.2 L-3.4 12.4 L1.2 -7.2Z", fill: "#7DBF6C" }, g);
    // Body and head
    el("path", { d: "M0.5 -2.5 C-6 -3.5 -7.2 -13.5 -2.2 -18.5 C1.5 -21.8 7 -20.5 7.2 -15 C7.6 -9 5 -2.8 0.5 -2.5Z", fill: "#8FCC7B" }, g);
    el("circle", { cx: 4.3, cy: -19.6, r: 4.7, fill: "#9DD688" }, g);
    // Wing with feather lines
    el("path", { d: "M-4.6 -15.4 C-1.2 -17.6 4 -14.4 2.8 -7.2 C1 -3.8 -4 -4.6 -5.4 -9.2Z", fill: "#62AE57" }, g);
    el("path", { d: "M-3.6 -12.2 Q-0.6 -11 1.6 -8.2 M-4.4 -9.4 Q-1.8 -8 0.4 -5.6", fill: "none", stroke: "#3F7E44", "stroke-width": 0.5, opacity: 0.7 }, g);
    // Rose-ringed neck
    el("path", { d: "M1.4 -15.9 Q4.8 -13.9 8 -16.6", fill: "none", stroke: "#F08CA0", "stroke-width": 0.9 }, g);
    el("path", { d: "M1.4 -15.2 Q4.8 -13.2 8 -15.9", fill: "none", stroke: "#2D2D2D", "stroke-width": 0.45 }, g);
    // Hooked red beak, eye
    el("path", { d: "M7.8 -21.3 C11.4 -21.4 12 -17.2 9.2 -15.4 C9.4 -17.2 8.5 -18.3 7.3 -18.6Z", fill: "#E2575E" }, g);
    el("path", { d: "M7.6 -18.3 Q8.6 -17.2 8.9 -16.4", fill: "none", stroke: "#B83E46", "stroke-width": 0.4 }, g);
    el("circle", { cx: 5.6, cy: -21.1, r: 1, fill: "#2A2A2A" }, g);
    el("circle", { cx: 5.9, cy: -21.4, r: 0.35, fill: "#FFFFFF" }, g);
    // Feet gripping the perch
    el("path", { d: "M-1.6 -2.6 Q-1.4 0.6 -2.8 1.2 M1.6 -2.6 Q1.8 0.6 0.6 1.2", fill: "none", stroke: "#C98C7A", "stroke-width": 0.9, "stroke-linecap": "round" }, g);
  }

  function peacock(g) {
    // Train: a soft fan behind the feathers, trailing back and draping over the frill
    el("path", { d: "M-4 -7.5 C-14 -11 -28 -8 -34 -1 C-37 6 -33 15 -24 21.5 C-17 24 -12 16 -9 9 C-7 3 -5 -1 -3.5 -3Z", fill: "#A9CC9A", opacity: 0.55 }, g);
    var ends = [[-31, -3], [-34, 3], [-34.5, 9.5], [-31.5, 15.5], [-26, 20], [-19.5, 21.5]];
    ends.forEach(function (p, i) {
      var c1x = -10 - i * 0.6, c1y = -6 + i * 1.6;
      el("path", { d: "M-4 -6 Q" + f(c1x - 8) + " " + f(c1y - 2) + " " + p[0] + " " + p[1], fill: "none", stroke: i % 2 ? "#7FAE73" : "#5E9A68", "stroke-width": 1.1 }, g);
      // barbs along the feather tip
      el("path", { d: "M" + (p[0] + 6) + " " + (p[1] - 2.2) + " L" + (p[0] + 2) + " " + (p[1] - 0.6) + " M" + (p[0] + 6) + " " + (p[1] + 2.2) + " L" + (p[0] + 2) + " " + (p[1] + 0.6),
        stroke: "#9CC48E", "stroke-width": 0.6, opacity: 0.8 }, g);
      var eye = el("g", { transform: "translate(" + p[0] + " " + p[1] + ") rotate(" + f(Math.atan2(p[1] + 6, p[0] + 4) * 180 / Math.PI) + ")" }, g);
      el("ellipse", { rx: 3.6, ry: 2.6, fill: "#C9B451" }, eye);
      el("ellipse", { rx: 2.5, ry: 1.9, fill: "#3E9A93" }, eye);
      el("ellipse", { rx: 1.3, ry: 1.1, fill: "#23468C" }, eye);
    });
    // Body: royal blue, with a speckled gold wing
    el("path", { d: "M-6.5 -3.5 C-8.5 -10 -2.5 -16 2.6 -16 C6 -16 7.2 -12 6.4 -8 C5.4 -3.6 0 -1.2 -6.5 -3.5Z", fill: "#4A78BF" }, g);
    el("path", { d: "M-5.6 -6 C-3.8 -11.4 1.8 -12.2 4 -8.2 C2.2 -5 -2 -4 -5.6 -6Z", fill: "#CDAE70" }, g);
    el("path", { d: "M-3.8 -8.2 l1 -1 l1 1 M-1 -9 l1 -1 l1 1 M-2.6 -6.4 l1 -1 l1 1", fill: "none", stroke: "#8C6A2F", "stroke-width": 0.45 }, g);
    // Long curved neck and small head
    el("path", { d: "M1 -12.5 C1.6 -20 3 -25.4 5 -28.6 L8.2 -27.8 C7 -23.4 6.4 -18.4 6.4 -12Z", fill: "#3F6EB8" }, g);
    el("circle", { cx: 6.9, cy: -29.2, r: 2.7, fill: "#3F6EB8" }, g);
    el("path", { d: "M5.6 -30 Q7.2 -31 8.4 -29.8 Q7.2 -29 5.6 -30Z", fill: "#FFFFFF" }, g);
    el("circle", { cx: 7.3, cy: -29.9, r: 0.55, fill: "#1E2A44" }, g);
    el("path", { d: "M9.3 -29.6 L11.6 -28.8 L9.3 -28.1Z", fill: "#B9A27A" }, g);
    // Crest (fan of plumes with tips)
    [[3.8, -37], [6, -38.2], [8.3, -37.4]].forEach(function (t) {
      el("path", { d: "M6.6 -31.6 L" + t[0] + " " + t[1], stroke: "#3F6EB8", "stroke-width": 0.5 }, g);
      el("circle", { cx: t[0], cy: t[1], r: 0.95, fill: "#3E9A93", stroke: "#C9B451", "stroke-width": 0.35 }, g);
    });
    // Feet
    el("path", { d: "M-1.8 -2.4 Q-1.6 0.6 -3 1.2 M1.6 -2.6 Q1.8 0.6 0.6 1.2", fill: "none", stroke: "#A08060", "stroke-width": 0.9, "stroke-linecap": "round" }, g);
  }
  window.Birds = { parrot: parrot, peacock: peacock };

  var jhalarCount = 0;
  /* Returns the swinging groups so js/effects.js can animate them. */
  window.buildJhalar = function (svg, W, opts) {
    opts = opts || {};
    clear(svg);
    var H = 84, top = 7;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var k = window.GarlandKit("j" + (++jhalarCount) + "-");
    k.defs(svg);
    var n = Math.max(6, Math.round(W / 26));
    var s = W / n, mid = n / 2;
    var types = ["bell", "flowers", "latkan", "flowers"];
    var sways = [];

    // Hanging pieces first, so the frill overlaps their tops.
    var hangs = el("g", {}, svg);
    for (var c = 1; c < n; c++) {
      if (opts.gapCenter && Math.abs(c - mid) < 1.01) continue; // room for the kalash
      var g = el("g", { transform: "translate(" + f(c * s) + " " + top + ")" }, hangs);
      var sw = el("g", { class: "sway" }, g);
      sways.push(sw);
      var t = types[c % types.length];
      if (t === "bell") bellItem(k, sw, 24 + (c % 3) * 7);
      else if (t === "latkan") latkanItem(sw, 18 + (c % 2) * 8, c);
      else flowerItem(k, sw, 4 + (c % 3), c);
    }

    // Gold zari band with the scalloped frill and mirror (shisha) work.
    var band = el("g", {}, svg);
    el("rect", { x: 0, y: 0, width: W, height: top, fill: "#E2CC97" }, band);
    el("path", { d: "M0 0.6 H" + W + " M0 " + (top - 0.6) + " H" + W, class: "o-gold", "stroke-width": 0.8 }, band);
    for (var dx = s / 4; dx < W; dx += s / 2) el("circle", { cx: f(dx), cy: top / 2, r: 0.9, fill: "#8C6A2F" }, band);
    for (var i = 0; i < n; i++) {
      var x0 = i * s, cx = x0 + s / 2, depth = s * 0.42;
      el("path", {
        d: "M" + f(x0) + " " + top + " A" + f(s / 2) + " " + f(depth) + " 0 0 0 " + f(x0 + s) + " " + top + "Z",
        class: i % 2 ? "o-petal-a" : "o-petal-b", "stroke-width": 0.8,
      }, band);
      el("circle", { cx: f(cx), cy: f(top + depth * 0.45), r: 2.4, fill: "#FFFFFF", class: "o-gold", "stroke-width": 0.7 }, band);
      el("circle", { cx: f(cx - 0.6), cy: f(top + depth * 0.45 - 0.6), r: 0.8, fill: "#DCE6EE" }, band);
      el("circle", { cx: f(cx - s * 0.26), cy: f(top + depth * 0.22), r: 0.8, class: "o-gold-fill" }, band);
      el("circle", { cx: f(cx + s * 0.26), cy: f(top + depth * 0.22), r: 0.8, class: "o-gold-fill" }, band);
    }
    // Parrots and peacocks perched on the band (function cards)
    svg._birdSways = null;
    if (opts.birds) {
      var perch = el("g", {}, svg);
      svg._birdSways = [[0.15, false, peacock], [0.385, false, parrot], [0.615, true, parrot], [0.85, true, peacock]].map(function (b) {
        var bg = el("g", { transform: "translate(" + f(W * b[0]) + " 0.5)" + (b[1] ? " scale(-1 1)" : "") }, perch);
        var bs = el("g", { class: "bird" }, bg);
        b[2](bs);
        return bs;
      });
    }

    // A little drop from the bottom of every scallop: a mogra bud or a pearl.
    var drops = el("g", {}, svg);
    for (i = 0; i < n; i++) {
      var dg = el("g", { transform: "translate(" + f(i * s + s / 2) + " " + f(top + s * 0.42) + ")" }, drops);
      var ds = el("g", { class: "sway" }, dg);
      sways.push(ds);
      el("path", { d: "M0 0 V5", class: "o-gold", "stroke-width": 0.6 }, ds);
      if (i % 2) k.bud(ds, 0, 9, 0, 3.4);
      else {
        el("circle", { cx: 0, cy: 8, r: 2.6, fill: "#FFFDF8", class: "o-gold", "stroke-width": 0.6 }, ds);
        el("circle", { cx: -0.7, cy: 7.3, r: 0.8, fill: "#FFFFFF" }, ds);
      }
    }
    return sways;
  };

  /* A Rajasthani palace skyline: stepped blocks crowned with chhatris. */
  window.buildPalace = function (svg, W) {
    clear(svg);
    var H = 140, base = H;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var g = el("g", { class: "o-palace" }, svg);
    var cx = W / 2;
    var wallTop = base - 34, sideTop = base - 52, mainTop = base - 66;

    el("rect", { x: 0, y: wallTop, width: W, height: 34 }, g);
    parapet(g, 0, W, wallTop);
    [-1, 1].forEach(function (s) {
      var x0 = s < 0 ? cx - 150 : cx + 74;
      el("rect", { x: f(x0), y: sideTop, width: 76, height: 52 }, g);
      parapet(g, x0, x0 + 76, sideTop);
      chhatri(g, x0 + 38, sideTop - 6, 22);
    });
    el("rect", { x: cx - 76, y: mainTop, width: 152, height: 66 }, g);
    parapet(g, cx - 76, cx + 76, mainTop);
    chhatri(g, cx, mainTop - 6, 34);
    chhatri(g, cx - 56, mainTop - 6, 16);
    chhatri(g, cx + 56, mainTop - 6, 16);
    // Central jharokha balcony
    el("rect", { x: cx - 20, y: mainTop + 14, width: 40, height: 4 }, g);
    for (var k = 0; cx - 200 - 96 * k > -24; k++) {
      [-1, 1].forEach(function (s) { chhatri(g, cx + s * (200 + 96 * k), wallTop - 6, 18); });
    }
    windows(svg, 0, cx - 150, wallTop + 9, 19, 17);
    windows(svg, cx + 150, W, wallTop + 9, 19, 17);
    windows(svg, cx - 150, cx - 74, sideTop + 12, 24, 25);
    windows(svg, cx + 74, cx + 150, sideTop + 12, 24, 25);
    windows(svg, cx - 76, cx + 76, mainTop + 22, 18, 25);
    windows(svg, cx - 76, cx + 76, base - 28, 22, 38);
    return svg;
  };
})();
