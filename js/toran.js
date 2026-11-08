/*
 * Garland drawing kit, shared by the toran (door garland across the top of
 * the opening screen) and the jhalar frills on the cards (js/ornaments.js):
 * pastel roses, white mogra buds, sage leaves and gold bells.
 * Used by tools/og.html for the WhatsApp preview image too.
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

  // Seeded random so garlands look the same on every phone.
  function rng(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  /* Each SVG gets its own gradient ids (prefix) so several can live on one page. */
  function kit(prefix) {
    var id = function (n) { return prefix + n; };
    var url = function (n) { return "url(#" + id(n) + ")"; };

    function defs(svg) {
      var d = el("defs", {}, svg);
      [["roseA", "#FBE1E6", "#EDB0BF", "#D98A9F"], ["roseB", "#FDEADF", "#F3C3A8", "#E0A07E"]].forEach(function (g) {
        var r = el("radialGradient", { id: id(g[0]), cx: "42%", cy: "38%", r: "68%" }, d);
        el("stop", { offset: "0%", "stop-color": g[1] }, r);
        el("stop", { offset: "70%", "stop-color": g[2] }, r);
        el("stop", { offset: "100%", "stop-color": g[3] }, r);
      });
      var m = el("radialGradient", { id: id("mogra"), cx: "40%", cy: "35%", r: "70%" }, d);
      el("stop", { offset: "0%", "stop-color": "#FFFFFF" }, m);
      el("stop", { offset: "100%", "stop-color": "#EFE6D6" }, m);
      var gold = el("linearGradient", { id: id("gold"), x1: "0", y1: "0", x2: "0", y2: "1" }, d);
      el("stop", { offset: "0%", "stop-color": "#E7CF97" }, gold);
      el("stop", { offset: "100%", "stop-color": "#A9823F" }, gold);
    }

    function rose(parent, x, y, r, peach) {
      var g = el("g", { transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")" }, parent);
      el("circle", { r: r, fill: peach ? url("roseB") : url("roseA") }, g);
      var s = r * 0.62;
      el("path", {
        d: "M" + (-s) + " 0 A" + s + " " + s + " 0 1 1 " + s * 0.2 + " " + s * 0.9 +
           " M" + (-s * 0.35) + " " + (-s * 0.1) + " A" + s * 0.45 + " " + s * 0.45 + " 0 1 1 " + s * 0.15 + " " + s * 0.4,
        fill: "none", stroke: peach ? "#C9805E" : "#C3708A", "stroke-width": r * 0.13, opacity: 0.55,
        "stroke-linecap": "round",
      }, g);
    }

    function bud(parent, x, y, angle, size) {
      el("ellipse", {
        cx: 0, cy: 0, rx: size * 0.62, ry: size,
        transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + angle.toFixed(1) + ")",
        fill: url("mogra"), stroke: "#D9CDB8", "stroke-width": 0.5,
      }, parent);
    }

    function leaf(parent, x, y, len, angle, light) {
      var g = el("g", { transform: "translate(" + x.toFixed(1) + " " + y + ") rotate(" + angle.toFixed(1) + ")" }, parent);
      var w = len * 0.22;
      el("path", {
        d: "M0 0 C" + w + " " + len * 0.25 + " " + w * 1.1 + " " + len * 0.65 + " 0 " + len +
           " C" + -w * 1.1 + " " + len * 0.65 + " " + -w + " " + len * 0.25 + " 0 0Z",
        fill: light ? "#A7C2A0" : "#86A682",
      }, g);
      el("path", { d: "M0 2 L0 " + (len - 3), stroke: "#C9B27A", "stroke-width": 0.7, opacity: 0.8 }, g);
    }

    function bell(parent, y, scale) {
      var g = el("g", { transform: "translate(0 " + y + ") scale(" + (scale || 1) + ")" }, parent);
      el("path", { d: "M-5 9 Q-5 1 0 1 Q5 1 5 9 L6.5 11 L-6.5 11Z", fill: url("gold"), stroke: "#8C6A2F", "stroke-width": 0.6 }, g);
      el("path", { d: "M-2.8 4.5 Q-2 2.6 0 2.4", fill: "none", stroke: "#F3E3BC", "stroke-width": 0.8, "stroke-linecap": "round" }, g);
      el("circle", { cx: 0, cy: 12.6, r: 1.8, fill: "#8C6A2F" }, g);
      el("circle", { cx: 0, cy: -0.5, r: 1.6, fill: "#F7F1E6", stroke: "#B08A4A", "stroke-width": 0.5 }, g);
    }

    return { el: el, defs: defs, rose: rose, bud: bud, leaf: leaf, bell: bell };
  }

  window.GarlandKit = kit;
  window.garlandRng = rng;

  /* The toran. opts.width: viewBox width (height is fixed at 150) */
  window.buildToran = function (svg, opts) {
    opts = opts || {};
    var W = opts.width || 400;
    var rand = rng(opts.seed || 11);
    var k = kit("t");
    svg.setAttribute("viewBox", "0 0 " + W + " 150");
    k.defs(svg);

    // Hanging strands: mogra buds with a rose every few, ending in a bell.
    var strands = el("g", { class: "strands" }, svg);
    var n = Math.max(4, Math.round(W / 62));
    var spacing = W / n;
    var pattern = [8, 6, 9, 7, 9, 6, 8, 7];
    for (var s = 0; s < n; s++) {
      var count = s === n - 1 ? pattern[0] : pattern[s % pattern.length];
      var g = el("g", { class: "strand", transform: "translate(" + (spacing * (s + 0.5)).toFixed(1) + " 16)" }, strands);
      var inner = el("g", { class: "sway" }, g);
      el("path", { d: "M0 0 L0 " + (count * 10 + 4), stroke: "#B08A4A", "stroke-width": 0.8 }, inner);
      for (var m = 0; m < count; m++) {
        var y = 10 + m * 10;
        if (m % 3 === 2) k.rose(inner, 0, y, 4.6, s % 2 === 1);
        else { k.bud(inner, -1.6, y, -18, 3.3); k.bud(inner, 1.6, y + 1, 18, 3.3); }
      }
      k.bell(inner, count * 10 + 6);
    }

    var leaves = el("g", { class: "leaves" }, svg);
    for (var x = 8, i = 0; x < W; x += 15, i++) {
      k.leaf(leaves, x, 18, 24 + rand() * 6, (i % 2 ? 8 : -8) + (rand() - 0.5) * 6, i % 2 === 0);
    }

    // Gold thread and the dense flower band along the top.
    el("path", { d: "M0 12 L" + W + " 12", stroke: "#B08A4A", "stroke-width": 1.4 }, svg);
    var band = el("g", { class: "band" }, svg);
    for (var bx = 3, j = 0; bx < W + 8; bx += 10, j++) {
      k.bud(band, bx + 5, 6 + rand() * 2, 70 + rand() * 40, 3.2);
      k.bud(band, bx + 5, 18 + rand() * 2, 70 + rand() * 40, 3.2);
      k.rose(band, bx, 12 + (j % 2 ? 1.5 : -1.5), 6.4 + rand() * 1.2, j % 3 === 1);
    }
    return svg;
  };
})();
