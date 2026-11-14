/*
 * Wedding invite: renders content from config.js, runs the countdown,
 * and sends RSVPs and wishes to the Google Sheet (apps-script/Code.gs).
 * You normally only need to edit config.js.
 */
(function () {
  "use strict";

  var C = window.INVITE;
  var TZ = "Asia/Kolkata";
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var demo = !C.rsvpEndpoint;

  function fmt(date, opts, locale) {
    opts.timeZone = TZ;
    return new Intl.DateTimeFormat(locale || "en-IN", opts).format(date);
  }
  function time(date) { return fmt(date, { hour: "numeric", minute: "2-digit" }, "en-US"); }
  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(key));
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
  }

  /* ───── Text from config ───── */
  document.querySelectorAll("[data-bind]").forEach(function (el) {
    var v = el.dataset.bind.split(".").reduce(function (o, k) { return o && o[k]; }, C);
    if (v) el.textContent = v;
  });
  // Wording from config.js > text (the page keeps its built-in wording for anything left out).
  var T = C.text || {};
  document.querySelectorAll("[data-text]").forEach(function (el) {
    var v = T[el.dataset.text];
    if (typeof v === "string" && v.trim()) el.textContent = v;
  });
  var sendLabel = $("sendBtn").textContent;

  // Grandparents' lines show only when config.js has them.
  ["groom", "bride"].forEach(function (who) {
    if (!(C[who].grandparents || "").trim()) {
      document.querySelectorAll('[data-grand="' + who + '"]').forEach(function (n) { n.hidden = true; });
    }
  });
  function names(str) { return str.replace(/\{groom\}/g, C.groom.name).replace(/\{bride\}/g, C.bride.name); }
  $("sideGroomNote").textContent = names(T.sideGroomNote || "({groom}'s side)");
  $("sideBrideNote").textContent = names(T.sideBrideNote || "({bride}'s side)");
  /* ───── Family blocks (config.js > familyBlocks): three columns between the RSVP and the wishes ───── */
  var blocks = (C.familyBlocks || []).filter(function (b) { return b && (b.title || (b.lines || []).length); });
  if (blocks.length) {
    if (!document.querySelector('link[href$="family.css"]')) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "css/family.css";
      document.head.appendChild(css);
    }
    var fam = document.createElement("section");
    fam.className = "family";
    fam.id = "family";
    fam.setAttribute("aria-label", T.familyLabel || "With love from the family");
    fam.innerHTML = '<div class="wrap"><div class="framed family-card has-jhalar">' +
      '<svg class="jhalar" data-jhalar aria-hidden="true"></svg><div class="family-cols"></div></div></div>';
    var cols = fam.querySelector(".family-cols");
    cols.style.setProperty("--cols", Math.min(blocks.length, 3));
    blocks.forEach(function (b) {
      var col = document.createElement("div");
      col.className = "family-col";
      if (b.title) { var h = document.createElement("h3"); h.textContent = b.title; col.appendChild(h); }
      (b.lines || []).forEach(function (line) {
        var p = document.createElement("p");
        p.textContent = line;
        col.appendChild(p);
      });
      cols.appendChild(col);
    });
    $("wishes").parentNode.insertBefore(fam, $("wishes"));
  }
  // Keep each family line (e.g. "Shri Pradeep Kumar Verma") on one line when a
  // small shrink is enough; otherwise let it wrap normally.
  function fitFamilyLines() {
    document.querySelectorAll(".family-col p").forEach(function (p) {
      p.style.fontSize = "";
      p.style.whiteSpace = "nowrap";
      var avail = p.clientWidth, need = p.scrollWidth;
      if (!avail || need <= avail) return;
      var size = parseFloat(getComputedStyle(p).fontSize) * avail / need;
      if (size >= 11.5) p.style.fontSize = (Math.floor(size * 10) / 10) + "px";
      else p.style.whiteSpace = "";
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFamilyLines);

  // "Whose side are you from?" can be switched off with  askSide: false  in config.js.
  var askSide = C.askSide !== false;
  if (!askSide) $("eSide").closest("fieldset").hidden = true;

  var wedding = new Date(C.weddingDate);
  $("heroDate").textContent = fmt(wedding, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("weekday").textContent = fmt(wedding, { weekday: "long" });
  $("dayNum").textContent = fmt(wedding, { day: "numeric" });
  $("monthYear").textContent = fmt(wedding, { month: "long", year: "numeric" });
  $("muhurat").textContent = (T.muhurat || "Muhurat at") + " " + time(wedding);

  if (C.shloka && C.shloka.length) {
    C.shloka.forEach(function (line, i) {
      if (i) $("shloka").appendChild(document.createElement("br"));
      $("shloka").appendChild(document.createTextNode(line));
    });
  } else {
    $("shloka").hidden = true;
  }

  // Personal greeting: share links like  ...?to=Sharma%20family
  var to = new URLSearchParams(location.search).get("to");
  if (to && to.trim()) {
    $("greeting").textContent = "Dear " + to.trim().slice(0, 60) + ",";
    $("greeting").hidden = false;
  }

  // Browser bar colour follows the chosen scheme.
  var ground = getComputedStyle(document.documentElement).getPropertyValue("--ground").trim();
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (ground && themeMeta) themeMeta.content = ground;

  if (C.couplePhoto) {
    $("coupleImg").src = C.couplePhoto;
    $("couple").hidden = false;
  }

  if (C.rsvpBy) $("rsvpBy").textContent = C.rsvpBy; else $("rsvpBy").hidden = true;
  $("hashtag").textContent = C.hashtag || "";
  $("families").textContent = C.families || "";

  /* ───── Toran ───── */
  var toran = $("toran");
  var hero = document.querySelector(".hero");
  function drawToran() {
    while (toran.firstChild) toran.removeChild(toran.firstChild);
    var w = Math.round(150 * toran.clientWidth / toran.clientHeight) || 400;
    window.buildToran(toran, { width: w });
    window.Effects.setBells("toran", toran.querySelectorAll(".sway"), { fmin: 0.7, fmax: 1.05 });
  }
  drawToran();

  // Jhalar frills (cards and the date band): drawn at their real width,
  // redrawn when that changes or when a hidden card (e.g. the RSVP thank-you) appears.
  var jro = window.ResizeObserver ? new ResizeObserver(function () { drawJhalar(); }) : null;
  function drawJhalar() {
    var sways = [], birds = [];
    document.querySelectorAll("[data-jhalar]").forEach(function (svg) {
      if (jro && !svg._watched) { svg._watched = true; jro.observe(svg); }
      var w = Math.round(svg.getBoundingClientRect().width);
      if (w && svg._w !== w) {
        svg._w = w;
        svg._sways = window.buildJhalar(svg, w, { gapCenter: svg.dataset.jhalar === "gap", birds: svg.dataset.jhalar === "birds" });
      }
      if (svg._sways) sways = sways.concat(svg._sways);
      if (svg._birdSways) birds = birds.concat(svg._birdSways);
    });
    window.Effects.setBells("jhalar", sways, { fmin: 1.0, fmax: 1.5, max: 26 });
    // Birds only rock a little on their perch.
    window.Effects.setBells("birds", birds, { fmin: 1.4, fmax: 1.9, max: 7, damping: 0.16, gain: 0.3 });
  }
  drawJhalar();

  /* ───── Palace arch, date medallion, footer skyline ───── */
  var archSvg = $("heroArch");
  var archSize = "";
  function drawArch() {
    var r = archSvg.getBoundingClientRect();
    var size = Math.round(r.width) + "x" + Math.round(r.height);
    if (!r.width || !r.height || size === archSize) return;
    archSize = size;
    window.buildArch(archSvg, Math.round(r.width), Math.round(r.height));
  }
  drawArch();
  if (window.ResizeObserver) new ResizeObserver(drawArch).observe(archSvg);
  window.buildMandala($("mandala"));
  var palace = $("palace");
  function drawPalace() { window.buildPalace(palace, Math.max(320, palace.clientWidth)); }
  drawPalace();

  var lastWidth = window.innerWidth;
  window.addEventListener("resize", function () {
    drawArch();
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    drawToran();
    drawJhalar();
    drawPalace();
    fitFamilyLines();
  });
  // The opening-screen entrance (garland drops in, names rise) runs when the cover opens: see Cover below.
  var heroEntered = false;
  function heroEnter() {
    if (heroEntered) return;
    heroEntered = true;
    if (reduceMotion) return;
    toran.classList.add("enter");
    hero.classList.add("enter");
    setTimeout(function () { window.Effects.kickAll(110); }, 700); // garland lands and sways
  }

  /* ───── Music ───── */
  var audio = $("music");
  var musicBtn = $("musicBtn");
  if (C.music) {
    audio.src = C.music;
    musicBtn.hidden = false;
  }
  function setPlaying(on) {
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }
  var target = typeof C.musicVolume === "number" ? Math.min(1, Math.max(0, C.musicVolume)) : 0.6;
  function playMusic() {
    if (!C.music || !audio.paused) return;
    audio.volume = 0;
    var p = audio.play();
    if (p && p.then) p.then(function () { setPlaying(true); fadeIn(); }).catch(function () { setPlaying(false); });
  }
  function fadeIn() {
    var v = 0;
    var t = setInterval(function () {
      v = Math.min(target, v + target / 20);
      audio.volume = v;
      if (v >= target) clearInterval(t);
    }, 100);
  }
  musicBtn.addEventListener("click", function () {
    if (audio.paused) playMusic(); else { audio.pause(); setPlaying(false); }
  });

  /* ───── Flower showers ───── */
  var flowers = C.flowers || {};
  var groomKind = flowers.groom || "rose";
  var brideKind = flowers.bride || "marigold";
  document.querySelectorAll("[data-shower]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      var who = b.dataset.shower;
      var kinds = who === "groom" ? [groomKind] : who === "bride" ? [brideKind] : [groomKind, brideKind];
      var point = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : null;
      window.Effects.shower(kinds, point);
    });
  });

  /* ───── Two pages: the opening page, then the invitation ─────
     Everything below the opening page stays hidden until "Open invitation" is pressed.
     The phone's Back button returns to the opening page. */
  var root = document.documentElement;
  var detailsOpen = false;
  root.classList.add("details-closed");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search); } catch (x) { /* ignore */ } }

  function showDetails(target) {
    hero.classList.remove("leaving");
    root.classList.remove("details-closed");
    root.classList.add("details-open");
    window.scrollTo(0, 0);
    drawJhalar();
    drawPalace();
    fitFamilyLines();
    if (target) $(target).scrollIntoView();
    $("invitation").focus({ preventScroll: true });
  }
  function openDetails(target) {
    if (detailsOpen) return;
    detailsOpen = true;
    window.Effects.kickAll(170);
    playMusic();
    try { history.pushState({ invitation: true }, "", "#invitation"); } catch (x) { /* ignore */ }
    if (reduceMotion) showDetails(target);
    else { hero.classList.add("leaving"); setTimeout(function () { showDetails(target); }, 520); }
  }
  function closeDetails() {
    if (!detailsOpen) return;
    detailsOpen = false;
    root.classList.remove("details-open");
    root.classList.add("details-closed");
    window.scrollTo(0, 0);
    drawArch();
    window.Effects.kickAll(110);
    $("openBtn").focus({ preventScroll: true });
  }
  window.addEventListener("popstate", function () {
    if (location.hash === "#invitation") openDetails(); else closeDetails();
  });
  $("openBtn").addEventListener("click", function () { openDetails(); });
  document.querySelector(".skip").addEventListener("click", function (e) {
    e.preventDefault();
    openDetails("rsvp");
  });

  /* ───── Cover: tap the four dots of the swastik to open the invitation ───── */
  var cover = $("cover");
  var behind = [hero, document.querySelector("main"), document.querySelector(".footer"), musicBtn, document.querySelector(".skip")];
  if (cover && C.cover !== false) {
    document.documentElement.classList.add("cover-open");
    behind.forEach(function (n) { if (n) n.inert = true; });
    if (!$("greeting").hidden) {
      $("coverGreeting").textContent = $("greeting").textContent;
      $("coverGreeting").hidden = false;
    }
    window.buildMandala($("coverMandala"));
    var dots = Array.prototype.slice.call(cover.querySelectorAll(".dot"));
    var lit = 0, opened = false;
    var coverKinds = ["rose", "marigold", "mogra", "lotus"];
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        if (opened || d.classList.contains("on")) return;
        d.classList.add("on");
        d.setAttribute("aria-pressed", "true");
        lit++;
        try { if (navigator.vibrate) navigator.vibrate(25); } catch (x) { /* not supported */ }
        var r = d.getBoundingClientRect();
        window.Effects.shower(coverKinds, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        if (lit < dots.length) {
          $("coverHint").textContent = (T.coverLeft || "{n} more to go").replace("{n}", dots.length - lit);
        } else {
          $("coverHint").textContent = T.coverDone || "शुभारंभ!";
          $("emblem").classList.add("complete");
          playMusic(); // started inside the tap, so phones allow it
          setTimeout(openCover, reduceMotion ? 300 : 1300);
        }
      });
    });
    $("coverSkip").addEventListener("click", function () { playMusic(); openCover(); });
  } else {
    if (cover) cover.remove();
    heroEnter();
  }
  function openCover() {
    if (opened) return;
    opened = true;
    cover.classList.add("leaving");          // tagline fades, then the palace doors part
    setTimeout(heroEnter, reduceMotion ? 0 : 450);
    setTimeout(function () {
      cover.remove();
      document.documentElement.classList.remove("cover-open");
      behind.forEach(function (n) { if (n) n.inert = false; });
      drawJhalar();
    }, reduceMotion ? 350 : 1650);
  }

  /* ───── Countdown, then count-up ─────
     Before the muhurat the clock counts down. At the muhurat it reaches zero
     and starts again from zero, counting the time since the wedding. */
  var wasBefore = null;
  function tick() {
    var ms = wedding - Date.now();
    var before = ms > 0;
    if (before !== wasBefore) {
      $("cdLabel").textContent = before ? (T.countdownBefore || "Counting down to the muhurat")
                                        : (T.countdownAfter || "Happily married for");
      $("countdown").setAttribute("aria-label", before ? "Time left until the wedding" : "Time since the wedding");
      if (wasBefore === true) celebrate(); // the muhurat arrived while the page was open
      wasBefore = before;
    }
    var vals, units;
    if (before) {
      var s = Math.floor(ms / 1000);
      vals = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      units = [["day", "days"], ["hour", "hours"], ["minute", "minutes"], ["second", "seconds"]];
    } else {
      vals = sinceWedding(Date.now());
      units = [["year", "years"], ["month", "months"], ["day", "days"], ["hour", "hours"]];
    }
    ["cdD", "cdH", "cdM", "cdS"].forEach(function (id, i) {
      var cell = $(id);
      cell.textContent = vals[i];
      cell.nextElementSibling.textContent = units[i][vals[i] === 1 ? 0 : 1];
    });
  }
  // Calendar-correct years, months, days and hours since the muhurat, in Indian time (IST has no daylight saving).
  var IST = 5.5 * 3600e3;
  function istParts(t) {
    var d = new Date(t + IST);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), sec: d.getUTCMinutes() * 60 + d.getUTCSeconds() };
  }
  function sinceWedding(t) {
    var a = istParts(wedding.getTime()), b = istParts(t);
    var y = b.y - a.y, mo = b.mo - a.mo, d = b.d - a.d, h = b.h - a.h;
    if (b.sec < a.sec) h--;                       // an hour counts once it is complete
    if (h < 0) { h += 24; d--; }
    if (d < 0) { mo--; d += new Date(Date.UTC(b.y, b.mo, 0)).getUTCDate(); } // days in the previous month
    if (mo < 0) { mo += 12; y--; }
    return [y, mo, d, h];
  }
  function celebrate() {
    window.Effects.shower(["rose", "marigold", "mogra", "lotus"]);
    window.Effects.kickAll(160);
  }
  tick();
  setInterval(tick, 1000);

  /* ───── Events ───── */
  function gcalDate(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  C.events.forEach(function (ev) {
    var start = new Date(ev.start);
    var end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 3 * 3600e3);
    var item = el("li", "event");
    item.dataset.type = ev.type || "vivah";
    var li = el("div", "event-card");
    item.appendChild(li);
    // Jhalar strung across the card where the arch meets its sides
    var jh = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    jh.setAttribute("class", "jhalar jhalar-event");
    jh.setAttribute("data-jhalar", "birds");
    jh.setAttribute("aria-hidden", "true");
    li.appendChild(jh);
    li.appendChild(el("h3", "ev-name", ev.name));
    li.appendChild(el("p", "ev-date", fmt(start, { weekday: "long", day: "numeric", month: "long" })));
    li.appendChild(el("p", "ev-time", time(start) + " to " + time(end)));
    if (ev.venue) li.appendChild(el("p", "ev-venue", ev.venue));
    if (ev.address) li.appendChild(el("p", "ev-address", ev.address));
    if (ev.note) li.appendChild(el("p", "ev-note", ev.note));

    var place = [ev.venue, ev.address].filter(Boolean).join(", ");
    var actions = el("p", "ev-actions");
    var map = el("a", "", "Open in Maps");
    map.href = ev.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place);
    map.target = "_blank"; map.rel = "noopener";
    var cal = el("a", "", "Add to calendar");
    cal.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(ev.name + ": " + C.groom.name + " & " + C.bride.name) +
      "&dates=" + gcalDate(start) + "/" + gcalDate(end) +
      "&location=" + encodeURIComponent(place) +
      "&details=" + encodeURIComponent(location.href.split("?")[0]);
    cal.target = "_blank"; cal.rel = "noopener";
    actions.appendChild(map); actions.appendChild(cal);
    li.appendChild(actions);
    ["hang", "hang hang-side l", "hang hang-side r"].forEach(function (cls) {
      var hang = el("span", cls);
      hang.setAttribute("aria-hidden", "true");
      li.appendChild(hang);
    });
    $("eventList").appendChild(item);

    // Matching chip in the RSVP form
    var chip = el("label", "chip");
    chip.dataset.type = ev.type || "vivah";
    var box = document.createElement("input");
    box.type = "checkbox"; box.name = "events"; box.value = ev.name;
    chip.appendChild(box);
    chip.appendChild(el("span", "", ev.name));
    $("eventChips").appendChild(chip);
  });

  drawJhalar(); // now including the function cards

  /* ───── Small hanging bell at the top of each function card's arch ───── */
  var BELL = '<svg viewBox="0 0 16 56" aria-hidden="true">' +
    '<g fill="none" stroke="#B08A4A" stroke-width=".9">' +
    [3, 7, 11, 15, 19, 23, 27].map(function (y) { return '<ellipse cx="8" cy="' + y + '" rx="1.3" ry="2"/>'; }).join("") +
    '</g>' +
    '<circle cx="8" cy="33" r="3.4" fill="#F4C2CC" stroke="#C3708A" stroke-width=".6"/>' +
    '<circle cx="8" cy="33" r="1.3" fill="#C3708A" opacity=".6"/>' +
    '<path d="M2.5 49 Q2.5 38.5 8 38.5 Q13.5 38.5 13.5 49 L15 51.5 L1 51.5Z" fill="#C9A55E" stroke="#8C6A2F" stroke-width=".7"/>' +
    '<path d="M5 41.5 Q6.5 40 8 40" fill="none" stroke="#F3E3BC" stroke-width=".9" stroke-linecap="round"/>' +
    '<circle cx="8" cy="53.4" r="1.9" fill="#8C6A2F"/></svg>';
  document.querySelectorAll(".hang").forEach(function (h) { h.innerHTML = BELL; });
  window.Effects.setBells("hang", document.querySelectorAll(".hang"), { fmin: 0.95, fmax: 1.35, max: 28 });

  /* ───── Contacts ───── */
  var ICON_CALL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3 .78.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.9c-.25-.43.25-.4.72-1.33a.45.45 0 0 0-.02-.43c-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.8 2.8 0 0 0-.87 2.07 4.85 4.85 0 0 0 1.02 2.58 11.1 11.1 0 0 0 4.25 3.75c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';
  C.contacts.forEach(function (c) {
    var li = el("li", "contact");
    var who = el("div");
    who.appendChild(el("p", "contact-name", c.name));
    who.appendChild(el("p", "contact-rel", c.relation));
    var acts = el("div", "contact-actions");
    var call = el("a"); call.href = "tel:+" + c.phone; call.innerHTML = ICON_CALL;
    call.setAttribute("aria-label", "Call " + c.name);
    var wa = el("a");
    wa.href = "https://wa.me/" + c.phone + "?text=" +
      encodeURIComponent("Namaste! I have a question about " + C.groom.name + " & " + C.bride.name + "'s wedding.");
    wa.target = "_blank"; wa.rel = "noopener"; wa.innerHTML = ICON_WA;
    wa.setAttribute("aria-label", "WhatsApp " + c.name);
    acts.appendChild(call); acts.appendChild(wa);
    li.appendChild(who); li.appendChild(acts);
    $("contactList").appendChild(li);
  });

  /* ───── Wishes wall ───── */
  function renderWishes(list) {
    $("wishList").innerHTML = "";
    list.forEach(function (w) {
      var li = el("li", "wish");
      li.appendChild(el("p", "wish-text", w.wish));
      li.appendChild(el("p", "wish-who", w.name));
      $("wishList").appendChild(li);
    });
    $("wishEmpty").hidden = list.length > 0;
  }
  var wishes = [];
  if (demo) {
    $("wishesNote").textContent = "Sample wishes. Real ones appear here once the Google Sheet is connected.";
    $("wishesNote").hidden = false;
    wishes = [
      { name: "Sunita Mausi", wish: "Bahut bahut badhai! May your home always be full of laughter." },
      { name: "Rohan", wish: "Finally! Saving my best dance moves for the Sangeet." },
      { name: "The Kulkarni family", wish: "Wishing you both a lifetime of love and understanding." },
    ];
    renderWishes(wishes);
  } else {
    fetch(C.rsvpEndpoint + "?action=wishes")
      .then(function (r) { return r.json(); })
      .then(function (data) { wishes = (data && data.wishes) || []; renderWishes(wishes); })
      .catch(function () { $("wishEmpty").hidden = false; });
  }

  /* ───── RSVP form ───── */
  var form = $("rsvpForm");
  var ifYes = $("ifYes");
  var guests = $("fGuests");

  var tried = false; // after the first failed send, errors update as the guest fixes them
  form.addEventListener("change", function (e) {
    if (e.target.name === "attending") ifYes.hidden = e.target.value !== "Yes";
    recheck();
  });
  form.addEventListener("input", recheck);
  function recheck() {
    if (tried && !validate(read()).length) $("formStatus").textContent = "";
  }
  form.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = (parseInt(guests.value, 10) || 1) + parseInt(b.dataset.step, 10);
      guests.value = Math.min(15, Math.max(1, v));
    });
  });

  function cleanPhone(v) {
    var d = String(v).replace(/\D/g, "");
    if (d.length > 10 && (d.indexOf("91") === 0 || d.indexOf("0") === 0)) d = d.slice(-10);
    return d;
  }
  function showErr(id, show, input) {
    $(id).hidden = !show;
    if (input) input.setAttribute("aria-invalid", show ? "true" : "false");
    return show;
  }
  function read() {
    var f = form.elements;
    var attending = (form.querySelector("[name=attending]:checked") || {}).value || "";
    var side = (form.querySelector("[name=side]:checked") || {}).value || "";
    var events = Array.prototype.map.call(form.querySelectorAll("[name=events]:checked"), function (b) { return b.value; });
    return {
      name: f.name.value.trim(),
      phone: cleanPhone(f.phone.value),
      attending: attending,
      guests: attending === "Yes" ? Math.min(15, Math.max(1, parseInt(guests.value, 10) || 1)) : 0,
      events: attending === "Yes" ? events : [],
      side: side,
      wish: f.wish.value.trim(),
      showWish: f.showWish.checked,
      company: f.company.value,
    };
  }
  function validate(d) {
    var bad = [];
    if (showErr("eName", !d.name, $("fName"))) bad.push($("fName"));
    if (showErr("ePhone", !/^[6-9]\d{9}$/.test(d.phone), $("fPhone"))) bad.push($("fPhone"));
    if (showErr("eAttending", !d.attending)) bad.push(form.querySelector("[name=attending]"));
    if (showErr("eEvents", d.attending === "Yes" && !d.events.length)) bad.push(form.querySelector("[name=events]"));
    if (askSide && showErr("eSide", !d.side)) bad.push(form.querySelector("[name=side]"));
    return bad;
  }

  function andList(a) {
    return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }
  function showDone(d) {
    var first = d.name.split(" ")[0];
    $("doneTitle").textContent = "RSVP sent. Thank you, " + first + "!";
    $("doneText").textContent = d.attending === "Yes"
      ? "We've noted " + d.guests + (d.guests === 1 ? " person" : " people") + " for the " + andList(d.events) + ". See you there!"
      : "We'll miss you. Thank you for letting us know" + (d.wish ? ", and for your wishes." : ".");
    $("demoNote").hidden = !d.demo;
    form.hidden = true;
    $("rsvpDone").hidden = false;
  }
  function fill(d) {
    var f = form.elements;
    f.name.value = d.name || "";
    f.phone.value = d.phone || "";
    form.querySelectorAll("[name=attending]").forEach(function (r) { r.checked = r.value === d.attending; });
    form.querySelectorAll("[name=side]").forEach(function (r) { r.checked = r.value === d.side; });
    form.querySelectorAll("[name=events]").forEach(function (b) { b.checked = (d.events || []).indexOf(b.value) !== -1; });
    guests.value = d.guests || 1;
    f.wish.value = d.wish || "";
    f.showWish.checked = d.showWish !== false;
    ifYes.hidden = d.attending !== "Yes";
  }

  var saved = store("rsvp");
  if (saved && saved.name) { fill(saved); showDone(saved); }

  $("editBtn").addEventListener("click", function () {
    $("rsvpDone").hidden = true;
    form.hidden = false;
    $("formStatus").textContent = "";
    $("fName").focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = read();
    var bad = validate(d);
    var status = $("formStatus");
    status.className = "form-status";
    if (bad.length) {
      tried = true;
      status.textContent = "Check the highlighted fields.";
      status.classList.add("error");
      bad[0].focus();
      return;
    }
    var btn = $("sendBtn");
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.textContent = "";

    var send = demo
      ? new Promise(function (ok) { setTimeout(function () { ok({ ok: true }); }, 700); })
      : fetch(C.rsvpEndpoint, { method: "POST", body: JSON.stringify(d) }).then(function (r) { return r.json(); });

    send.then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "rejected");
      d.demo = demo;
      delete d.company;
      store("rsvp", d);
      if (d.showWish && d.wish) {
        wishes = wishes.filter(function (w) { return w.name !== d.name; });
        wishes.unshift({ name: d.name, wish: d.wish });
        renderWishes(wishes);
      }
      showDone(d);
      $("rsvpDone").focus();
    }).catch(function () {
      status.textContent = "Couldn't send your RSVP. Check your internet connection and try again.";
      status.classList.add("error");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = sendLabel;
    });
  });
})();
