/* The Dream Remembers · A Body of Deep Time
 *
 * A layer over the original dream renderer. The original draws 21,000
 * particles around a "base shape" (p.ox, p.oy) and every effect — breathing,
 * voice, splitting, the tunnel — is applied relative to that base. This layer
 * replaces the base shape every frame with a body that evolves through fifteen
 * stages, fish to human, and adds the deep-time overlays.
 *
 * Data: deeptime/data.js (open-data snapshot, see CREDITS.md).
 *
 * Controls
 *   scroll / ← → / swipe   travel through time
 *   click / tap            wake the memory of a real fossil from this period
 *   hold (mouse, finger,   the body re-forms into a photograph of the real
 *   space/F, phone orb)    specimen of this stage (Wikimedia Commons)
 *   breathe, speak         push the body forward in evolution (microphone)
 *   idle 10 s              the dream plays by itself, showing each fossil
 */
(function () {
  "use strict";

  var DT = window.DEEP_TIME;
  if (!DT || typeof particles === "undefined" || typeof updateTargets !== "function") {
    console.warn("[deeptime] data or renderer missing; layer disabled");
    return;
  }

  var params = window.__DT_PARAMS || new URLSearchParams(location.search);
  var KIOSK = params.get("kiosk") === "1";

  var STAGES = DT.stages;
  var NS = STAGES.length;
  var TIMELINE_MA = 540;
  var PERIODS = DT.periods.filter(function (p) { return p.t < TIMELINE_MA; });

  var PERIOD_ZH = {
    Ediacaran: "埃迪卡拉纪", Cambrian: "寒武纪", Ordovician: "奥陶纪", Silurian: "志留纪",
    Devonian: "泥盆纪", Carboniferous: "石炭纪", Permian: "二叠纪", Triassic: "三叠纪",
    Jurassic: "侏罗纪", Cretaceous: "白垩纪", Paleogene: "古近纪", Neogene: "新近纪", Quaternary: "第四纪"
  };

  // Chinese names for the classes and countries in the PBDB records.
  var CLASS_ZH = {
    Acanthodii: "棘鱼纲", Actinopterygii: "辐鳍鱼纲", Agnatha: "无颌类", Amphibia: "两栖纲", Anaspida: "缺甲鱼类",
    Ascidiacea: "海鞘纲", Aves: "鸟纲", Chondrichthyes: "软骨鱼纲", Conodonta: "牙形动物", Cyclostomi: "圆口类",
    Galeaspidomorphi: "盔甲鱼类", Mammalia: "哺乳纲", Ornithischia: "鸟臀类恐龙", Osteichthyes: "硬骨鱼纲",
    Osteostraci: "骨甲鱼类", Petromyzontida: "七鳃鳗类", Placodermi: "盾皮鱼纲", Pteraspidomorpha: "鳍甲鱼类",
    Reptilia: "爬行纲", Saurischia: "蜥臀类恐龙", Thelodonti: "花鳞鱼类", Vetulicolida: "古虫动物"
  };
  var COUNTRY = {
    AQ: ["南极洲", "Antarctica"], AR: ["阿根廷", "Argentina"], AT: ["奥地利", "Austria"], AU: ["澳大利亚", "Australia"],
    AZ: ["阿塞拜疆", "Azerbaijan"], BE: ["比利时", "Belgium"], BO: ["玻利维亚", "Bolivia"], BR: ["巴西", "Brazil"],
    BY: ["白俄罗斯", "Belarus"], CA: ["加拿大", "Canada"], CH: ["瑞士", "Switzerland"], CL: ["智利", "Chile"],
    CN: ["中国", "China"], CO: ["哥伦比亚", "Colombia"], CU: ["古巴", "Cuba"], CZ: ["捷克", "Czechia"],
    DE: ["德国", "Germany"], DZ: ["阿尔及利亚", "Algeria"], EE: ["爱沙尼亚", "Estonia"], EG: ["埃及", "Egypt"],
    ES: ["西班牙", "Spain"], ET: ["埃塞俄比亚", "Ethiopia"], FR: ["法国", "France"], GL: ["格陵兰", "Greenland"],
    GR: ["希腊", "Greece"], HU: ["匈牙利", "Hungary"], IE: ["爱尔兰", "Ireland"], IL: ["以色列", "Israel"],
    IN: ["印度", "India"], IR: ["伊朗", "Iran"], IT: ["意大利", "Italy"], JO: ["约旦", "Jordan"],
    JP: ["日本", "Japan"], KE: ["肯尼亚", "Kenya"], KG: ["吉尔吉斯斯坦", "Kyrgyzstan"], KR: ["韩国", "South Korea"],
    KZ: ["哈萨克斯坦", "Kazakhstan"], LK: ["斯里兰卡", "Sri Lanka"], LS: ["莱索托", "Lesotho"], LT: ["立陶宛", "Lithuania"],
    LU: ["卢森堡", "Luxembourg"], LV: ["拉脱维亚", "Latvia"], MA: ["摩洛哥", "Morocco"], MG: ["马达加斯加", "Madagascar"],
    MN: ["蒙古", "Mongolia"], MW: ["马拉维", "Malawi"], MX: ["墨西哥", "Mexico"], MY: ["马来西亚", "Malaysia"],
    NA: ["纳米比亚", "Namibia"], NE: ["尼日尔", "Niger"], NO: ["挪威", "Norway"], NP: ["尼泊尔", "Nepal"],
    NZ: ["新西兰", "New Zealand"], OM: ["阿曼", "Oman"], PK: ["巴基斯坦", "Pakistan"], PL: ["波兰", "Poland"],
    PS: ["巴勒斯坦", "Palestine"], PT: ["葡萄牙", "Portugal"], PY: ["巴拉圭", "Paraguay"], RO: ["罗马尼亚", "Romania"],
    RS: ["塞尔维亚", "Serbia"], RU: ["俄罗斯", "Russia"], SD: ["苏丹", "Sudan"], SE: ["瑞典", "Sweden"],
    SI: ["斯洛文尼亚", "Slovenia"], SJ: ["斯瓦尔巴", "Svalbard"], SV: ["萨尔瓦多", "El Salvador"], TH: ["泰国", "Thailand"],
    TJ: ["塔吉克斯坦", "Tajikistan"], TR: ["土耳其", "Türkiye"], TZ: ["坦桑尼亚", "Tanzania"], UA: ["乌克兰", "Ukraine"],
    UK: ["英国", "United Kingdom"], US: ["美国", "United States"], UY: ["乌拉圭", "Uruguay"], VE: ["委内瑞拉", "Venezuela"],
    VN: ["越南", "Vietnam"], ZA: ["南非", "South Africa"], ZM: ["赞比亚", "Zambia"], ZW: ["津巴布韦", "Zimbabwe"]
  };
  function country(cc) { return COUNTRY[cc] || [cc || "", cc || ""]; }

  // Great-circle distance in km.
  function haversine(la1, lo1, la2, lo2) {
    var r = Math.PI / 180, dla = (la2 - la1) * r, dlo = (lo2 - lo1) * r;
    var a = Math.sin(dla / 2) * Math.sin(dla / 2) + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo / 2) * Math.sin(dlo / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }

  // The deepest clade on the Open Tree lineage of Homo sapiens that each
  // stage has reached.
  var CLADE = {
    myllokunmingia: "Vertebrata", entelognathus: "Gnathostomata", guiyu: "Sarcopterygii",
    eusthenopteron: "Dipnotetrapodomorpha", tiktaalik: "Dipnotetrapodomorpha", ichthyostega: "Tetrapoda",
    dimetrodon: "Amniota", thrinaxodon: "Amniota", morganucodon: "Mammalia", purgatorius: "Primatomorpha",
    archicebus: "Haplorrhini", lufengpithecus: "Hominidae", afarensis: "Homininae", pekinensis: "Homo",
    sapiens: "Homo sapiens"
  };

  // ---------------------------------------------------------------------
  // Helpers
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function hexRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")"; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function periodAt(ma) {
    for (var i = 0; i < PERIODS.length; i++) {
      if (ma <= PERIODS[i].b && ma >= PERIODS[i].t) return i;
    }
    return ma > PERIODS[0].b ? 0 : PERIODS.length - 1;
  }

  function ageZh(ma) {
    if (ma >= 100) return "距今 " + (ma / 100).toFixed(2) + " 亿年";
    var wan = ma * 100;
    if (wan >= 1000) return "距今 " + (Math.round(wan / 100) * 100) + " 万年";
    return "距今 " + Math.max(1, Math.round(wan)) + " 万年";
  }
  function ageEn(ma) {
    if (ma >= 10) return Math.round(ma) + " million years ago";
    if (ma >= 1) return ma.toFixed(1) + " million years ago";
    return (Math.round(ma * 100) * 10).toLocaleString("en-US") + ",000 years ago";
  }
  function coord(lat, lng) {
    if (lat == null || lng == null) return "";
    return Math.abs(lat).toFixed(2) + "°" + (lat >= 0 ? "N" : "S") + " " +
           Math.abs(lng).toFixed(2) + "°" + (lng >= 0 ? "E" : "W");
  }

  // ---------------------------------------------------------------------
  // Morph targets: each particle keeps a fixed slot (u) in every stage's
  // x-sorted point list, so heads morph into heads and tails into tails.
  var NP = particles.length;
  var slot = [];
  for (var s = 0; s < NS; s++) slot.push(new Int32Array(NP));
  var jx = new Float32Array(NP), jy = new Float32Array(NP);
  var sx = new Float32Array(NP), sy = new Float32Array(NP);
  var uu = new Float32Array(NP), origColor = new Array(NP), origSize = new Float32Array(NP);
  for (var i = 0; i < NP; i++) {
    var u = Math.random();
    uu[i] = u;
    origColor[i] = particles[i].color;
    origSize[i] = particles[i].size;
    for (s = 0; s < NS; s++) {
      var m = STAGES[s].shape.pts.length / 2;
      slot[s][i] = Math.min(m - 1, Math.floor(u * m));
    }
    jx[i] = (Math.random() - 0.5) * 9;
    jy[i] = (Math.random() - 0.5) * 9;
    var a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.75;
    sx[i] = Math.cos(a) * r;
    sy[i] = Math.sin(a) * r * 0.75;
  }

  // Outline points of each silhouette ("1" in shape.edge) are drawn as rim light.
  var EDGE = STAGES.map(function (st) {
    var e = st.shape.edge || "", a = new Uint8Array(e.length);
    for (var k = 0; k < e.length; k++) a[k] = e.charCodeAt(k) === 49 ? 1 : 0;
    return a;
  });
  // The original palette arrays are shared by all particles, so tinting them in
  // place recolours the whole body at no per-particle cost.
  var BASE_PALETTE = palette.map(function (c) { return c.slice(); });
  var rimColor = [255, 240, 215];

  // Drifting motes: marine snow sinking while the body lives in water, dust
  // and pollen rising once it has come onto land.
  var MOTES = [];
  for (var mi = 0; mi < 240; mi++) {
    MOTES.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7,
                 ph: Math.random() * 6.283, s: 0.6 + Math.random() * 1.6 });
  }
  var flash = 0, water = 1;
  var hud = { phi: 0, psi: 0, scanV: 0, resolved: 0, kf: 0, cy: 0, picks: [], pickedAt: 0 };

  // Fit each body in a box; the renderer shrinks the body to ~0.68 when quiet.
  function stageScale(st) {
    var boxW = W * 0.74, boxH = H * 0.84;
    return Math.min(boxW / (st.shape.w * 1000), boxH / (st.shape.h * 1000));
  }

  // ---------------------------------------------------------------------
  // State
  var startStage = clamp(parseInt(params.get("stage"), 10) || 0, 0, NS - 1);
  var evo = startStage, evoTarget = startStage;     // ?stage=N starts at stage N
  var started = KIOSK || params.get("intro") === "0";
  var lastInput = performance.now();
  var auto = { on: false, phase: "forward", t: 0 };
  var lastFrame = performance.now();
  var shownStage = -1, shownGene = null, lastChime = 0;
  var tint = hexRgb(PERIODS[periodAt(STAGES[0].ma)].color), tintTarget = tint.slice();

  // Fossil mode: while someone holds, the body re-forms into a photograph of
  // the real specimen (particles take its positions and colours).
  var fos = 0, fosEase = 0, fosStage = -1, colorsOn = -1, captionStage = -1;
  var hold = { mouse: false, touch: false, key: false, phone: false, auto: false };
  function holding() { return hold.mouse || hold.touch || hold.key || hold.phone || hold.auto; }
  var specimens = new Array(NS);

  // A 3D scan (stage.model) takes the place of the photograph.
  var PART_COL = [[255, 238, 210], [200, 226, 255], [255, 210, 186], [214, 255, 226], [236, 214, 255],
                  [255, 246, 190], [190, 240, 250], [255, 222, 230], [222, 236, 200], [250, 230, 250]];
  function modelRec(mo) {
    var n = mo.pts.length / 3, rec = { state: "ready", isModel: true, n: n, model: mo };
    rec.pts = new Float32Array(n * 2); rec.z = new Float32Array(n); rec.col = new Array(n); rec.part = new Uint8Array(n);
    var relief = 0;
    for (var i = 0; i < n; i++) {
      rec.pts[2 * i] = mo.pts[3 * i]; rec.pts[2 * i + 1] = mo.pts[3 * i + 1]; rec.z[i] = mo.pts[3 * i + 2];
      rec.part[i] = mo.part.charCodeAt(i) - 48;
      rec.col[i] = PART_COL[rec.part[i] % PART_COL.length];
      relief = Math.max(relief, Math.abs(rec.z[i]));
    }
    rec.w = mo.w; rec.h = mo.h; rec.relief = relief / 1000; rec.pigment = "#F0E6D2";
    return rec;
  }

  function loadSpecimen(k) {
    if (k < 0 || k >= NS || specimens[k]) return;
    if (STAGES[k].model) { specimens[k] = modelRec(STAGES[k].model); return; }
    if (!STAGES[k].specimen) return;
    var sp = STAGES[k].specimen, rec = specimens[k] = { state: "loading" };
    var img = new Image();
    img.onload = function () {
      try { sampleSpecimen(rec, img, sp.crop || [0, 0, 1, 1], sp.sep || "auto"); rec.state = "ready"; }
      catch (err) { rec.state = "error"; console.warn("[deeptime] specimen", sp.file, err); }
    };
    img.onerror = function () { rec.state = "error"; };
    img.src = sp.file;
  }

  // Turn a photograph into 7,000 weighted points. The background colour is the
  // median of the photo's border; pixels that differ from it (the specimen)
  // get the points, and the frame of the photo fades out.
  function sampleSpecimen(rec, img, crop, sep) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var x0 = crop[0] * iw, y0 = crop[1] * ih, cw = (crop[2] - crop[0]) * iw, ch = (crop[3] - crop[1]) * ih;
    var S = 420 / Math.max(cw, ch);
    var w = Math.max(8, Math.round(cw * S)), h = Math.max(8, Math.round(ch * S));
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, x0, y0, cw, ch, 0, 0, w, h);
    var im = g.getImageData(0, 0, w, h), d = im.data;
    var R = [], G = [], B = [];
    function edge(x, y) { var o = (y * w + x) * 4; R.push(d[o]); G.push(d[o + 1]); B.push(d[o + 2]); }
    for (var x = 0; x < w; x += 2) { edge(x, 0); edge(x, 1); edge(x, h - 1); edge(x, h - 2); }
    for (var y = 0; y < h; y += 2) { edge(0, y); edge(1, y); edge(w - 1, y); edge(w - 2, y); }
    function med(a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; }
    var br = med(R), bg = med(G), bb = med(B);
    var bgLum = (0.3 * br + 0.59 * bg + 0.11 * bb) / 255;
    if (sep !== "darker" && sep !== "lighter" && sep !== "color") sep = bgLum > 0.62 ? "darker" : bgLum < 0.22 ? "lighter" : "color";
    var n = w * h, cum = new Float64Array(n), acc = 0;
    for (var i = 0, o = 0; i < n; i++, o += 4) {
      var r = d[o], gg = d[o + 1], b = d[o + 2];
      var lum = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
      var sal;
      if (sep === "darker") sal = clamp((bgLum - lum - 0.05) / 0.2, 0, 1);         // light backdrop: the specimen is darker
      else if (sep === "lighter") sal = clamp((lum - bgLum - 0.05) / 0.2, 0, 1);   // dark backdrop: the specimen is lighter
      else {                                                                  // rock or coloured backdrop: colour difference
        var dist = Math.sqrt((r - br) * (r - br) + (gg - bg) * (gg - bg) + (b - bb) * (b - bb));
        sal = clamp((dist - 24) / 50, 0, 1);
      }
      var px = (i % w) / w * 2 - 1, py = ((i / w) | 0) / h * 2 - 1;
      var vig = 1 - ease((px * px + py * py - 0.6) / 0.5);
      // A dark specimen on a light wall keeps full weight; otherwise brighter detail counts more.
      acc += sal * sal * vig * (sep === "darker" ? 1 : 0.3 + lum);
      cum[i] = acc;
      d[o + 3] = Math.round(255 * clamp(sal * 1.4, 0, 1) * vig);   // cut-out for the photo layer
    }
    if (acc <= 0) throw new Error("nothing to sample");
    g.putImageData(im, 0, 0);
    var M = 7000, pts = [], longest = Math.max(w, h);
    for (var k = 0; k < M; k++) {
      var t = Math.random() * acc, lo = 0, hi = n - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] < t) lo = mid + 1; else hi = mid; }
      var o2 = lo * 4, mx = Math.max(d[o2], d[o2 + 1], d[o2 + 2], 1);
      var lift = clamp((sep === "darker" ? 235 : 190) / mx, 1, sep === "darker" ? 3.5 : 2.6);
      pts.push({
        x: ((lo % w) + Math.random() - w / 2) / longest * 1000,
        y: (((lo / w) | 0) + Math.random() - h / 2) / longest * 1000,
        l: (0.3 * d[o2] + 0.59 * d[o2 + 1] + 0.11 * d[o2 + 2]) / 255,
        r: d[o2], g: d[o2 + 1], b: d[o2 + 2],
        c: [Math.min(255, d[o2] * lift) | 0, Math.min(255, d[o2 + 1] * lift) | 0, Math.min(255, d[o2 + 2] * lift) | 0]
      });
    }
    pts.sort(function (p, q) { return p.x - q.x || p.y - q.y; });
    // Relief: brightness becomes height (inverted for a dark specimen on a
    // light wall), on top of a gentle dome, so the photo turns as a surface.
    var ml = 0, mr = 0, mg = 0, mb = 0;
    for (k = 0; k < M; k++) { ml += pts[k].l; mr += pts[k].r; mg += pts[k].g; mb += pts[k].b; }
    ml /= M;
    rec.pigment = "#" + [mr / M, mg / M, mb / M].map(function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }).join("").toUpperCase();
    rec.n = M;
    rec.pts = new Float32Array(M * 2);
    rec.z = new Float32Array(M);
    rec.col = new Array(M);
    var relief = 0;
    for (k = 0; k < M; k++) {
      rec.pts[2 * k] = pts[k].x; rec.pts[2 * k + 1] = pts[k].y; rec.col[k] = pts[k].c;
      var nx = pts[k].x / 500, ny = pts[k].y / 500;
      var z = (pts[k].l - ml) * 300 * (sep === "darker" ? -1 : 1) - Math.max(0, 1 - nx * nx - ny * ny) * 60;
      rec.z[k] = z;
      relief = Math.max(relief, Math.abs(z));
    }
    rec.relief = relief / 1000;
    rec.w = w / longest; rec.h = h / longest;
    rec.cut = c;
  }

  function fossilScale(rec) {
    return Math.min(W * 0.8 / (rec.w * 1000), H * 0.72 / (rec.h * 1000));
  }

  function currentMa() {
    var a = Math.floor(evo), b = Math.min(NS - 1, a + 1), f = ease(evo - a);
    var la = Math.log(STAGES[a].ma), lb = Math.log(STAGES[b].ma);
    return Math.exp(la + (lb - la) * f);
  }

  function noteInput() {
    lastInput = performance.now();
    if (auto.on) stopAuto();
  }
  function step(dir) {
    noteInput();
    evoTarget = clamp(Math.round(evoTarget) + dir, 0, NS - 1);
  }

  // ---------------------------------------------------------------------
  // Per-frame: runs inside the renderer's loop, right before updateTargets.
  function frame() {
    var now = performance.now();
    var dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    // Breath and voice push the body forward in evolution.
    var drive = 0;
    if (typeof micOn !== "undefined" && micOn) {
      drive += Math.max(0, voiceLevel - 0.06) * 0.9 + Math.max(0, breathEnergy - 0.04) * 0.7;
    }
    // Only a phone that is sending right now counts; Firebase keeps the last
    // visitor's values, which arrive once when the page loads.
    var fd = window.__dreamFirebaseData;
    var phoneFresh = typeof phoneControl !== "undefined" && phoneControl.connected &&
        now - phoneControl.last < 2000 && fd && Math.abs(Date.now() - (+fd.t || 0)) < 15000;
    if (phoneFresh) drive += phoneControl.breath * 0.35 + phoneControl.motion * 0.45;
    // Holding the orb on the phone reveals the fossil (it used to open the tunnel).
    hold.phone = !!phoneFresh && (+phoneControl.touch || 0) > 0.3;
    if (holding()) drive = 0;
    if (drive > 0.12) lastInput = now;
    evoTarget += drive * dt * 0.45;

    // No tunnel in this version: holding reveals the real fossil instead.
    tunnelTarget = 0;
    window.__dreamTunnelLocked = false;
    if (tunnel < 0.05 && document.body.classList.contains("hide-ui")) document.body.classList.remove("hide-ui");

    runAuto(dt, now);

    evoTarget = clamp(evoTarget, 0, NS - 1);
    evo += (evoTarget - evo) * Math.min(1, dt * 0.95);
    if (Math.abs(evoTarget - evo) < 0.0005) evo = evoTarget;

    // Keep the original's click-shape distortions off: the body is the shape now.
    morphIndex = 0;
    morphBloom += (1 - morphBloom) * 0.04;

    // Base shape for every particle.
    var a = Math.floor(evo), b = Math.min(NS - 1, a + 1), f = evo - a, e = ease(f);
    var A = STAGES[a], B = STAGES[b];
    var pa = A.shape.pts, pb = B.shape.pts;
    var ka = stageScale(A), kb = stageScale(B);
    var sa = slot[a], sb = slot[b];
    var spread = Math.sin(Math.PI * f) * Math.min(W, H) * 0.16;
    var cx = W * 0.52, cy = H * 0.46;   // a little above centre, clear of the card

    // Fossil mode: fade in the specimen of the stage the body is at; a new
    // stage's specimen only appears after the old one has returned to the body.
    var near = Math.round(evo);
    loadSpecimen(near);
    var want = holding() ? 1 : 0;
    if (fos < 0.01) fosStage = near;
    if (fosStage !== near) want = 0;
    var fr = specimens[fosStage];
    if (!fr || fr.state !== "ready") want = 0;
    fos += (want - fos) * Math.min(1, dt * (want ? 1.5 : 2.2));
    if (!want && fos < 0.003) fos = 0;
    fosEase = fr && fr.state === "ready" ? ease(fos) : 0;
    var ef = fosEase, kf = ef > 0 ? fossilScale(fr) : 0;
    var fspread = Math.sin(Math.PI * ef) * Math.min(W, H) * 0.10;

    // A slow turn around the vertical axis: particles sit on different depth
    // layers (p.z), so they slide past each other and the body reads as volume.
    var ra = Math.max(A.shape.w, A.shape.h) * 500 * ka, rb = Math.max(B.shape.w, B.shape.h) * 500 * kb;
    var half = ra + (rb - ra) * e;
    var th = Math.sin(time * 0.13) * 0.3, cth = Math.cos(th), depth = Math.sin(th) * half * 0.6;

    // The specimen turns slowly in 3D while a scan line sweeps it.
    var isModel = !!(fr && fr.isModel);
    var phi = isModel ? time * 0.3 : Math.sin(time * 0.38) * 0.45;
    var psi = isModel ? 0.14 + Math.sin(time * 0.21) * 0.06 : 0.05 + Math.sin(time * 0.23) * 0.09;
    var fcy = cy + H * 0.045;   // the specimen sits a little lower, under its caption
    var cphi = Math.cos(phi), sphi = Math.sin(phi), cpsi = Math.cos(psi), spsi = Math.sin(psi);
    var scanU = (time * 0.11) % 1, scanV = 1 - Math.abs(2 * scanU - 1);
    var scanY = fr ? (scanV - 0.5) * fr.h * 1000 : 0, resolved = 0;

    for (var i = 0; i < NP; i++) {
      var p = particles[i];
      var ia = sa[i] * 2, ib = sb[i] * 2;
      var xa = (pa[ia] + jx[i]) * ka, ya = (pa[ia + 1] + jy[i]) * ka;
      var xb = (pb[ib] + jx[i]) * kb, yb = (pb[ib + 1] + jy[i]) * kb;
      var x = cx + (xa + (xb - xa) * e) * cth + (p.z - 0.62) * depth + sx[i] * spread;
      var y = cy + ya + (yb - ya) * e + sy[i] * spread;
      if (ef > 0) {
        var jp = Math.min(fr.n - 1, (uu[i] * fr.n) | 0), j = jp * 2;
        var fx0 = fr.pts[j], fy0 = fr.pts[j + 1], fz0 = fr.z[jp];
        var x1 = fx0 * cphi + fz0 * sphi, z1 = -fx0 * sphi + fz0 * cphi;
        var y1 = fy0 * cpsi - z1 * spsi, z2 = fy0 * spsi + z1 * cpsi;
        var per = 1700 / (1700 + z2);
        x += (cx + x1 * per * kf - x) * ef + sx[i] * fspread;
        y += (fcy + y1 * per * kf - y) * ef + sy[i] * fspread;
        if (ef > 0.5) {
          p.size = Math.abs(fy0 - scanY) < 14 ? origSize[i] * 2.8 + DPR : origSize[i];
          if (Math.abs(p.x - p.tx) < 5 * DPR && Math.abs(p.y - p.ty) < 5 * DPR) resolved++;
        }
      }
      p.ox = x;
      p.oy = y;
    }
    hud.phi = phi; hud.psi = psi; hud.scanV = scanV; hud.resolved = resolved; hud.kf = kf; hud.cy = fcy;

    // Colours: the specimen's own colours in fossil mode; otherwise the body's
    // palette, with its outline in rim light.
    var colorKey = ef > 0.5 ? "f" + fosStage : "b" + near;
    if (colorKey !== colorsOn) {
      var edge = EDGE[near], sn = slot[near];
      for (i = 0; i < NP; i++) {
        var onRim = ef <= 0.5 && edge[sn[i]];
        particles[i].color = ef > 0.5 ? fr.col[Math.min(fr.n - 1, (uu[i] * fr.n) | 0)]
                                      : (onRim ? rimColor : origColor[i]);
        particles[i].size = onRim ? origSize[i] * 1.7 + 0.5 * DPR : origSize[i];
      }
      colorsOn = colorKey;
    }

    // How far the body reaches from the centre (as drawn, ~0.68 when quiet),
    // so particle brightness covers the whole body, not just a round core.
    var reachPx = half * 0.68;
    window.__DT_REACH = Math.max(1, reachPx / (0.25 * 0.48 * Math.min(W, H))) * (1 - ef) + 9 * ef;
    updateFossilLayer(ef, kf, cx, fcy);
    updateScanPanel(now);

    var ma = currentMa();
    var pi = periodAt(ma);
    tintTarget = hexRgb(PERIODS[pi].color);
    for (var c = 0; c < 3; c++) tint[c] += (tintTarget[c] - tint[c]) * 0.04;

    // The body takes on the colour of its age (ICS period colour).
    // Hue moves toward the period colour; brightness stays as it was.
    for (var q = 0; q < palette.length; q++) {
      var bp = BASE_PALETTE[q], pp = palette[q];
      var m0 = Math.max(bp[0], bp[1], bp[2]), mix = [0, 0, 0];
      for (c = 0; c < 3; c++) mix[c] = bp[c] + (tint[c] - bp[c]) * 0.5;
      var m1 = Math.max(mix[0], mix[1], mix[2], 1);
      for (c = 0; c < 3; c++) pp[c] = Math.min(255, Math.round(mix[c] * m0 / m1));
    }
    for (c = 0; c < 3; c++) rimColor[c] = Math.round([255, 242, 220][c] + (tint[c] - [255, 242, 220][c]) * 0.15);

    updateSites(dt, pi);

    // Water until the first legs; air after.
    water = 1 - ease((evo - 4.2) / 1.8);
    var drift = dt * (water * 0.018 - (1 - water) * 0.012);
    for (q = 0; q < MOTES.length; q++) {
      var mo = MOTES[q];
      mo.y += drift * mo.z * (0.6 + 0.4 * Math.sin(time * 0.3 + mo.ph));
      mo.x += dt * 0.004 * Math.sin(time * 0.2 + mo.ph);
      if (mo.y > 1.02) mo.y -= 1.04; else if (mo.y < -0.02) mo.y += 1.04;
      if (mo.x > 1.02) mo.x -= 1.04; else if (mo.x < -0.02) mo.x += 1.04;
    }
    flash *= Math.exp(-dt * 1.4);

    updateOverlay(ma, pi);
  }

  // ---------------------------------------------------------------------
  // The dream plays by itself when nobody is touching it.
  function stopAuto() {
    auto.on = false; auto.phase = "forward"; auto.t = 0;
    hold.auto = false;
  }

  function runAuto(dt, now) {
    if (!started) return;
    if (!auto.on) {
      if (now - lastInput > 10000) { auto.on = true; auto.phase = "forward"; auto.t = 0; }
      else return;
    }
    auto.t += dt;
    if (auto.phase === "forward") {
      var here = Math.round(evoTarget);
      var last = here >= NS - 1;
      var dwell = last ? 16 : here === 0 ? 10 : 9;
      // In the middle of each stay, the body shows its real fossil.
      hold.auto = auto.t > (last ? 5 : 3.2) && auto.t < dwell - (last ? 4 : 1.6);
      if (auto.t > dwell) {
        auto.t = 0;
        hold.auto = false;
        if (last) auto.phase = "return";
        else evoTarget = here + 1;
      }
    } else if (auto.phase === "return") {
      // Time runs backwards through every body to the first fish.
      hold.auto = false;
      evoTarget -= dt * 2.6;
      if (evo < 0.25 || auto.t > 14) {
        evoTarget = 0;
        auto.phase = "forward";
        auto.t = 0;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Overlays
  var ui = el("div", "dt-ui");
  document.body.appendChild(ui);

  var clock = el("div", "dt-clock");
  clock.innerHTML = '<div class="dt-clock-zh"></div><div class="dt-clock-en"></div>';
  var clockZh = clock.firstChild, clockEn = clock.lastChild;

  var card = el("div", "dt-card");
  ui.appendChild(card);
  card.appendChild(clock);
  var cardBody = el("div", "dt-card-body");
  card.appendChild(cardBody);

  var gene = el("div", "dt-gene");
  ui.appendChild(gene);

  var lineage = el("div", "dt-lineage");
  ui.appendChild(lineage);
  var LINEAGE = (DT.lineage || []).slice().reverse(); // Vertebrata ... Homo sapiens
  var lineageRows = {};
  for (var li = LINEAGE.length - 1; li >= 0; li--) {
    var row = el("div", "dt-clade", esc(LINEAGE[li]));
    lineageRows[LINEAGE[li]] = { row: row, depth: li };
    lineage.appendChild(row);
  }
  lineage.appendChild(el("div", "dt-lineage-src", "Open Tree of Life"));

  var timeline = el("div", "dt-timeline");
  ui.appendChild(timeline);
  var bar = el("div", "dt-bar");
  timeline.appendChild(bar);
  PERIODS.forEach(function (p) {
    var left = (TIMELINE_MA - Math.min(p.b, TIMELINE_MA)) / TIMELINE_MA * 100;
    var width = (Math.min(p.b, TIMELINE_MA) - p.t) / TIMELINE_MA * 100;
    var seg = el("div", "dt-seg");
    seg.style.left = left + "%";
    seg.style.width = width + "%";
    seg.style.background = p.color;
    if (width > 5) seg.appendChild(el("span", "", esc((PERIOD_ZH[p.name] || p.name).replace("纪", ""))));
    bar.appendChild(seg);
  });
  STAGES.forEach(function (st, k) {
    var tick = el("div", "dt-tick");
    tick.style.left = ((TIMELINE_MA - st.ma) / TIMELINE_MA * 100) + "%";
    tick.title = st.sci;
    tick.addEventListener("click", function (ev) { ev.stopPropagation(); noteInput(); evoTarget = k; });
    bar.appendChild(tick);
  });
  var marker = el("div", "dt-marker");
  bar.appendChild(marker);
  timeline.appendChild(el("div", "dt-scale",
    "<span>5.4 亿年前 · 540 Ma</span>" +
    "<span class=\"dt-credit\">open data · PBDB · Macrostrat · Ensembl · Open Tree of Life · PhyloPic · Wikimedia Commons · 星图 = 化石点当年的位置 fossil sites where they were then</span>" +
    "<span>此刻 · now</span>"));

  var memLayer = el("div", "dt-memories");
  document.body.appendChild(memLayer);

  var fosLayer = el("div", "dt-fossil");
  document.body.appendChild(fosLayer);
  var fosCap = el("div", "dt-specimen");
  ui.appendChild(fosCap);

  function renderSpecimenCaption(k) {
    var st = STAGES[k], sp = st.specimen || {};
    if (st.model) {
      var mo = st.model;
      sp = { kind_zh: mo.kind_zh, kind_en: mo.kind_en, note_zh: mo.note_zh, note_en: mo.note_en,
             author: mo.credits.map(function (c) { return c.author; }).filter(function (a, i, arr) { return a && arr.indexOf(a) === i; }).join(", "),
             license: mo.credits[0].license, is3d: true };
    }
    fosCap.innerHTML =
      '<div class="dt-spec-kind">' + esc(sp.kind_zh) + ' · ' + esc(sp.kind_en) + '</div>' +
      '<div class="dt-spec-name"><i>' + esc(st.sci) + '</i><span>' + esc(st.zh) + '</span></div>' +
      (sp.note_zh ? '<div class="dt-spec-note">' + esc(sp.note_zh) + (sp.note_en ? '<br><em>' + esc(sp.note_en) + '</em>' : '') + '</div>' : '') +
      '<div class="dt-spec-src">' + (sp.is3d ? "3D " : "photo ") + esc(sp.author || "—") + ' · ' + esc(sp.license || "") + ' · Wikimedia Commons</div>';
  }

  // The cut-out photograph glows faintly under its particles.
  function updateFossilLayer(ef, kf, cx, cy) {
    document.documentElement.classList.toggle("dt-fossil-on", ef > 0.3);
    fosCap.style.opacity = ef.toFixed(3);
    if (ef <= 0) { fosLayer.style.opacity = "0"; return; }
    var fr = specimens[fosStage];
    if (captionStage !== fosStage) { captionStage = fosStage; renderSpecimenCaption(fosStage); }
    if (!fr.cut) { fosLayer.style.opacity = "0"; return; }
    if (fosLayer.firstChild !== fr.cut) {
      fosLayer.textContent = "";
      fosLayer.appendChild(fr.cut);
    }
    var s = (0.68 + dreamAgitation * 0.22 + lowEnergy * 0.08) * morphBloom;
    var wpx = fr.w * 1000 * kf * s, hpx = fr.h * 1000 * kf * s;
    var mx = W * 0.52, my = H * 0.49 + (cy - H * 0.48) * s;
    fosLayer.style.left = ((mx - wpx / 2) / DPR).toFixed(1) + "px";
    fosLayer.style.top = ((my - hpx / 2) / DPR).toFixed(1) + "px";
    fosLayer.style.width = (wpx / DPR).toFixed(1) + "px";
    fosLayer.style.height = (hpx / DPR).toFixed(1) + "px";
    fosLayer.style.opacity = (0.3 * ef).toFixed(3);
    // Same perspective as the particles' projection (1700 specimen units).
    var persp = Math.max(200, 1700 * kf * s / DPR);
    fosLayer.style.transform = "perspective(" + persp.toFixed(0) + "px) rotateX(" + (-hud.psi).toFixed(3) + "rad) rotateY(" + (-hud.phi).toFixed(3) + "rad)";
  }

  function renderCard(st) {
    var fos = st.fossil || {};
    var where = esc(st.where_zh) + " · " + esc(st.where_en);
    var c = coord(fos.lat, fos.lng);
    var src = fos.source ? esc(fos.source) : "";
    var img = st.image || {};
    cardBody.innerHTML =
      '<div class="dt-name"><i>' + esc(st.sci) + '</i><span>' + esc(st.zh) + '</span></div>' +
      '<div class="dt-trait">' + esc(st.trait_zh) + '<br><em>' + esc(st.trait_en) + '</em></div>' +
      '<div class="dt-where">' + where + (c ? ' · ' + c : '') + '</div>' +
      '<div class="dt-src">' + (src ? src + ' · ' : '') + 'silhouette ' + esc(img.license || '') +
      (img.by ? ' ' + esc(img.by) : '') + ' / PhyloPic</div>';
  }

  function renderGene(g) {
    if (!g) { gene.classList.remove("on"); return; }
    var h = "", f = "", n = Math.min(g.human.length, innerWidth < 760 ? 30 : 60);
    for (var i = 0; i < n; i++) {
      var same = g.human[i] === g.fish[i] ? "m" : "x";
      var d = ' style="animation-delay:' + (i * 22) + 'ms"';
      h += '<b class="' + same + '"' + d + '>' + g.human[i] + '</b>';
      f += '<b class="' + same + '"' + d + '>' + g.fish[i] + '</b>';
    }
    gene.innerHTML =
      '<div class="dt-gene-head"><b>' + esc(g.symbol) + '</b> ' + esc(g.zh) + ' · ' + esc(g.en) + '</div>' +
      '<div class="dt-seq"><span class="lab">人 human</span><span class="bases">' + h + '</span></div>' +
      '<div class="dt-seq"><span class="lab">' + esc(g.fish_zh) + ' ' + esc(g.fish_en) + '</span><span class="bases">' + f + '</span></div>' +
      '<div class="dt-gene-foot">你和一条鱼共享这段基因 · Ensembl identity ' + g.identity + '%</div>';
    gene.classList.remove("on");
    void gene.offsetWidth;
    gene.classList.add("on");
  }

  var GENE_BY_STAGE = {};
  (DT.genes || []).forEach(function (g) { GENE_BY_STAGE[g.stage] = g; });

  var lastClockZh = "", lastClockEn = "";
  function updateOverlay(ma, pi) {
    var zh = ageZh(ma) + " · " + (PERIOD_ZH[PERIODS[pi].name] || PERIODS[pi].name);
    var en = ageEn(ma) + " · " + PERIODS[pi].name;
    if (zh !== lastClockZh) { clockZh.textContent = zh; lastClockZh = zh; }
    if (en !== lastClockEn) { clockEn.textContent = en; lastClockEn = en; }
    clock.style.setProperty("--period", PERIODS[pi].color);
    marker.style.left = ((TIMELINE_MA - ma) / TIMELINE_MA * 100) + "%";

    var near = Math.round(evo);
    var settled = Math.abs(evo - near) < 0.18;
    card.classList.toggle("moving", !settled);
    if (near !== shownStage) {
      if (shownStage >= 0) flash = 1;
      shownStage = near;
      loadSpecimen(near + 1);
      renderCard(STAGES[near]);
      var clade = CLADE[STAGES[near].id];
      var reached = lineageRows[clade] ? lineageRows[clade].depth : 0;
      for (var k in lineageRows) {
        var r = lineageRows[k];
        r.row.className = "dt-clade" + (r.depth <= reached ? " lit" : "") + (k === clade ? " here" : "");
      }
      var now = performance.now();
      if (started && now - lastChime > 1500 && typeof playTransitionSound === "function") {
        lastChime = now;
        try { playTransitionSound("gather"); } catch (err) {}
      }
    }
    var g = settled ? GENE_BY_STAGE[STAGES[near].id] || null : null;
    if (g !== shownGene) { shownGene = g; renderGene(g); }
  }

  // ---------------------------------------------------------------------
  // Fossil star map: the period's fossil sites, placed where they were at the
  // time (PBDB paleocoordinates), drifting with the continents as time moves.
  var SITE_N = 240;
  var siteX = new Float32Array(SITE_N), siteY = new Float32Array(SITE_N);
  var siteFX = new Float32Array(SITE_N), siteFY = new Float32Array(SITE_N);
  var siteTX = new Float32Array(SITE_N), siteTY = new Float32Array(SITE_N);
  var sitePh = new Float32Array(SITE_N);
  for (var si = 0; si < SITE_N; si++) { sitePh[si] = Math.random() * 6.283; siteX[si] = Math.random(); siteY[si] = Math.random(); }
  var sitePeriod = -1, siteT = 1, siteRecs = [];
  // Equirectangular, inset from the screen edges (normalised 0..1).
  function mapU(lng) { return 0.04 + 0.92 * (lng + 180) / 360; }
  function mapV(lat) { return 0.07 + 0.78 * (90 - lat) / 180; }

  function updateSites(dt, pi) {
    if (pi !== sitePeriod) {
      sitePeriod = pi;
      siteRecs = (DT.memories || {})[PERIODS[pi].name] || [];
      for (var k = 0; k < SITE_N; k++) {
        siteFX[k] = siteX[k]; siteFY[k] = siteY[k];
        var r = siteRecs[k % Math.max(1, siteRecs.length)];
        siteTX[k] = r ? mapU(r.pn) : siteX[k];
        siteTY[k] = r ? mapV(r.pa) : siteY[k];
      }
      siteT = 0;
    }
    if (siteT < 1) {
      siteT = Math.min(1, siteT + dt / 2.6);
      var e = ease(siteT);
      for (var j = 0; j < SITE_N; j++) {
        siteX[j] = siteFX[j] + (siteTX[j] - siteFX[j]) * e;
        siteY[j] = siteFY[j] + (siteTY[j] - siteFY[j]) * e;
      }
    }
  }

  function drawStarMap() {
    var dimmed = 1 - 0.7 * fosEase;
    ctx.save();
    // Graticule every 30°, with its numbers at the edges.
    ctx.strokeStyle = rgba([255, 240, 215], 0.035 * dimmed);
    ctx.lineWidth = DPR;
    ctx.fillStyle = rgba([255, 240, 215], 0.16 * dimmed);
    ctx.font = (9 * DPR) + "px Menlo, Consolas, monospace";
    for (var lat = -60; lat <= 60; lat += 30) {
      var y = mapV(lat) * H;
      ctx.beginPath(); ctx.moveTo(mapU(-180) * W, y); ctx.lineTo(mapU(180) * W, y); ctx.stroke();
      ctx.fillText(lat === 0 ? "0°  古赤道 paleo-equator" : Math.abs(lat) + "°" + (lat > 0 ? "N" : "S"), mapU(-180) * W + 4 * DPR, y - 4 * DPR);
    }
    for (var lng = -150; lng <= 150; lng += 30) {
      var x = mapU(lng) * W;
      ctx.beginPath(); ctx.moveTo(x, mapV(90) * H); ctx.lineTo(x, mapV(-90) * H); ctx.stroke();
    }
    // The sites themselves.
    ctx.globalCompositeOperation = "screen";
    var col = [255 + (tint[0] - 255) * 0.4, 245 + (tint[1] - 245) * 0.4, 230 + (tint[2] - 230) * 0.4];
    for (var k = 0; k < SITE_N; k++) {
      var tw = 0.5 + 0.5 * Math.sin(time * 1.1 + sitePh[k]);
      ctx.fillStyle = rgba(col, (0.16 + 0.22 * tw) * dimmed);
      var sz = (1.4 + 1.2 * tw) * DPR;
      ctx.fillRect(siteX[k] * W - sz / 2, siteY[k] * H - sz / 2, sz, sz);
    }
    ctx.restore();
  }

  // Click: the nearest real fossil site lights up, with a bilingual note.
  var notes = [];
  function showFossil(x, y) {
    if (!siteRecs.length) return;
    var px = x * DPR, py = y * DPR, best = -1, bd = 1e18;
    var n = Math.min(SITE_N, siteRecs.length);
    for (var k = 0; k < n; k++) {
      var dx = siteX[k] * W - px, dy = siteY[k] * H - py, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = k; }
    }
    var rec = siteRecs[best], per = PERIODS[sitePeriod];
    var c = country(rec.cc), cls = rec.c || "";
    var mid = (rec.a + rec.b) / 2;
    var drift = haversine(rec.lat, rec.lng, rec.pa, rec.pn);
    var m = el("div", "dt-memory");
    m.innerHTML =
      '<i>' + esc(rec.n) + '</i>' +
      '<span class="zh">' + (CLASS_ZH[cls] ? esc(CLASS_ZH[cls]) + ' · ' : '') + esc(PERIOD_ZH[per.name] || per.name) + ' · ' + ageZh(mid) + '</span>' +
      '<span class="en">' + (cls ? esc(cls) + ' · ' : '') + esc(per.name) + (rec.i ? ' · ' + esc(rec.i) : '') + ' · ' +
        (rec.a === rec.b ? rec.a : rec.a + '–' + rec.b) + ' Ma</span>' +
      '<span class="num">今日 now ' + coord(rec.lat, rec.lng) + ' · ' + esc(c[0]) + ' ' + esc(c[1]) + '</span>' +
      '<span class="num">当时 then ' + coord(rec.pa, rec.pn) + ' · 漂移 drift ' + fmtInt(drift) + ' km</span>' +
      '<span class="src">PBDB occ:' + esc(rec.o) + '</span>';
    var sx0 = siteX[best] * W / DPR, sy0 = siteY[best] * H / DPR;
    var lx = sx0 + (sx0 < innerWidth * 0.6 ? 46 : -306), ly = sy0 - 64;
    lx = clamp(lx, 12, innerWidth - 300);
    ly = clamp(ly, 60, innerHeight - 190);
    m.style.left = lx + "px";
    m.style.top = ly + "px";
    m.style.setProperty("--period", per.color);
    memLayer.appendChild(m);
    var note = { el: m, k: best, born: performance.now(), lx: lx, ly: ly };
    notes.push(note);
    while (notes.length > 6) { var old = notes.shift(); if (old.el.parentNode) old.el.parentNode.removeChild(old.el); }
    setTimeout(function () { m.classList.add("fade"); }, 7500);
    setTimeout(function () {
      if (m.parentNode) m.parentNode.removeChild(m);
      var i = notes.indexOf(note); if (i >= 0) notes.splice(i, 1);
    }, 10000);
  }

  // Leader lines from each note to its site, with a small cross on the site.
  function drawNotes() {
    var now = performance.now();
    ctx.save();
    ctx.lineWidth = DPR;
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i], age = (now - n.born) / 1000;
      var a = clamp(age / 0.6, 0, 1) * (1 - clamp((age - 7.5) / 2.4, 0, 1));
      if (a <= 0) continue;
      var sx = siteX[n.k] * W, sy = siteY[n.k] * H;
      var ex = (n.lx + (n.lx * DPR > sx ? 0 : 290)) * DPR, ey = (n.ly + 12) * DPR;
      ctx.strokeStyle = "rgba(255,240,215," + (0.55 * a) + ")";
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      var r = 7 * DPR;
      ctx.beginPath(); ctx.moveTo(sx - r, sy); ctx.lineTo(sx + r, sy); ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r); ctx.stroke();
      ctx.fillStyle = "rgba(255,248,235," + (0.95 * a) + ")";
      ctx.fillRect(sx - 2 * DPR, sy - 2 * DPR, 4 * DPR, 4 * DPR);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  // Input
  function insideUi(t) { return t && t.closest && t.closest(".dt-intro, .phone-link, .dt-tick"); }

  // Click: a fossil memory from PBDB. Hold (mouse, finger, space/F, or the
  // orb on the phone): the body becomes the real specimen.
  var HOLD_MS = 380;
  var downAt = null, holdTimer = 0, suppressMouseUntil = 0;
  function beginHold(kind) { hold[kind] = true; noteInput(); }
  function releaseAll() { hold.mouse = hold.touch = hold.key = false; clearTimeout(holdTimer); downAt = null; }

  addEventListener("mousedown", function (e) {
    if (insideUi(e.target) || performance.now() < suppressMouseUntil) return;
    noteInput();
    mouse.down = false;            // the original's trembling "unstable dream" is replaced by the fossil
    downAt = { x: e.clientX, y: e.clientY };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { if (downAt) beginHold("mouse"); }, HOLD_MS);
  });
  addEventListener("mousemove", function (e) {
    if (downAt && !hold.mouse && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 14) clearTimeout(holdTimer);
  });
  addEventListener("mouseup", function () {
    clearTimeout(holdTimer);
    if (downAt && !hold.mouse) showFossil(downAt.x, downAt.y);
    hold.mouse = false;
    downAt = null;
  });
  addEventListener("blur", releaseAll);
  addEventListener("contextmenu", function (e) { if (!insideUi(e.target)) e.preventDefault(); });

  var wheelAcc = 0, wheelAt = 0;
  addEventListener("wheel", function (e) {
    var now = performance.now();
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 60 && now - wheelAt > 420) {
      step(wheelAcc > 0 ? -1 : 1); // scroll down = deeper into the past
      wheelAcc = 0; wheelAt = now;
    }
  }, { passive: true });

  addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === " " || k === "f" || k === "F") {
      e.preventDefault();
      if (!hold.key) beginHold("key");
      return;
    }
    if (k === "ArrowLeft" || k === "ArrowDown" || k === "[") step(-1);
    else if (k === "ArrowRight" || k === "ArrowUp" || k === "]") step(1);
    else noteInput();
  });
  addEventListener("keyup", function (e) {
    if (e.key === " " || e.key === "f" || e.key === "F") hold.key = false;
  });

  var touchStart = null, touchTimer = 0;
  addEventListener("touchstart", function (e) {
    if (insideUi(e.target)) return;
    var t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, moved: false };
    clearTimeout(touchTimer);
    touchTimer = setTimeout(function () { if (touchStart && !touchStart.moved) beginHold("touch"); }, HOLD_MS);
  }, { passive: true });
  addEventListener("touchmove", function (e) {
    if (!touchStart) return;
    var t = e.touches[0];
    if (Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > 14) { touchStart.moved = true; clearTimeout(touchTimer); }
  }, { passive: true });
  addEventListener("touchend", function (e) {
    clearTimeout(touchTimer);
    if (touchStart && !hold.touch) {
      var dy = e.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dy) > 50) step(dy < 0 ? -1 : 1);
    }
    if (hold.touch) suppressMouseUntil = performance.now() + 900;   // no click after a long press
    hold.touch = false;
    touchStart = null;
  }, { passive: true });
  addEventListener("touchcancel", function () { clearTimeout(touchTimer); hold.touch = false; touchStart = null; }, { passive: true });

  // ---------------------------------------------------------------------
  // Hook into the renderer.
  // The original lets every particle drift ~50 px around its base, which
  // dissolves a silhouette's head, fins and fingers. When the dream is calm,
  // pull each target part of the way back onto the body, and let the whole
  // body breathe as one.
  function sharpen() {
    if ((mode !== "gather" || dreamState > 0.08 || dotMode > 0.02) && fosEase < 0.05) return;
    var k = 0.6 * (1 - clamp(tunnel * 1.6, 0, 1)) * (1 - clamp(splitAmount, 0, 1)) *
            (1 - clamp(morphEnergy, 0, 1) * 0.5) * (1 - clamp(collapse, 0, 1));
    if (k < 0.02) return;
    // A loud voice still brings the body closer, but less than in the
    // original, so a fish stays a fish while someone is speaking.
    k = Math.min(0.75, k + dreamAgitation * 0.25);
    k += (0.93 - k) * fosEase;     // a specimen should read clearly
    var cs = (0.68 + dreamAgitation * 0.22 + lowEnergy * 0.08) * morphBloom;
    var breath = 1 + (0.025 + breathEnergy * 0.09) * Math.sin(time * (0.42 + breathEnergy * 0.32));
    var s = cs * breath;
    var cx = W * (0.52 + Math.sin(time * 0.10 + morphTwist) * (0.012 + lowEnergy * 0.018));
    var cy = H * (0.49 + Math.cos(time * 0.09 + morphTwist) * (0.014 + lowEnergy * 0.022));
    var bx = W * 0.52, by = H * 0.48;
    for (var i = 0; i < NP; i++) {
      var p = particles[i];
      p.tx += (cx + (p.ox - bx) * s - p.tx) * k;
      p.ty += (cy + (p.oy - by) * s - p.ty) * k;
    }
  }

  var origUpdateTargets = window.updateTargets;
  window.updateTargets = function () {
    try { frame(); } catch (err) { console.warn("[deeptime]", err); }
    origUpdateTargets();
    try { sharpen(); } catch (err) { console.warn("[deeptime]", err); }
  };

  // A silent room should soften the body, not erase it.
  var origVoiceMode = window.updateVoiceMode;
  if (typeof origVoiceMode === "function") {
    window.updateVoiceMode = function () {
      origVoiceMode();
      if (performance.now() > manualControlUntil && dreamTarget > 0.55 && dreamTarget < 3) dreamTarget = 0.55;
    };
  }

  // ---------------------------------------------------------------------
  // Faster particle drawing. The original made one canvas call per particle
  // (21,000 fillStyle + fillRect a frame, ~17 ms: the whole frame budget).
  // Here the particles' light is added straight into a pixel buffer and the
  // buffer is laid over the frame once ("lighter"), which is the same
  // additive look, at full resolution.
  var pbuf = null, pctx = null, pimg = null, pdata = null, pw = 0, ph = 0, pscale = 1;
  function ensureParticleBuffer() {
    var sc = 1;
    var w = Math.max(1, Math.round(W * sc)), h = Math.max(1, Math.round(H * sc));
    if (!pbuf || w !== pw || h !== ph) {
      pbuf = document.createElement("canvas");
      pbuf.width = pw = w; pbuf.height = ph = h;
      pctx = pbuf.getContext("2d");
      pimg = pctx.createImageData(pw, ph);
      pdata = pimg.data;
    }
    pscale = sc;
  }

  // ?legacy=1 keeps the original per-particle drawing (for comparison).
  if (params.get("legacy") !== "1") window.drawParticles = function () {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var vanishState = smoothstep(3.25, 4.0, dreamState);
    var core = ctx.createRadialGradient(W * .52, H * .48, 0, W * .52, H * .48, Math.min(W, H) * (.10 + dreamAgitation * .20 + lowEnergy * .06));
    core.addColorStop(0, "rgba(255,248,225," + ((.22 + dreamAgitation * .16) * (1 - dotMode * .65) * (1 - collapse * .45)) + ")");
    core.addColorStop(.36, "rgba(255,210,145," + ((.10 + dreamAgitation * .10) * (1 - dotMode * .6) * (1 - collapse * .5)) + ")");
    core.addColorStop(.72, "rgba(155,205,255," + ((.035 + breathEnergy * .035) * (1 - dotMode * .6)) + ")");
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.globalAlpha = window.__DT_CORE == null ? 1 : window.__DT_CORE;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    ensureParticleBuffer();
    var d = pdata, sc = pscale, w = pw, h = ph;
    d.fill(0);
    var cx = W * .52, cy = H * .48;
    var reach = Math.min(W, H) * (.48 + dreamAgitation * .25) * (window.__DT_REACH || 1);
    var a0 = .42 + dreamAgitation * .42;
    var lateFade = Math.max(smoothstep(0.68, 1.0, dotMode), vanishState);
    var fade = (1 - lateFade * .82) * (1 - collapse * .45);
    var glow = 1 + breathGlow * 1.8;
    var dr = highEnergy * 70, dg = lowEnergy * 35, db = lowEnergy * 95 + highEnergy * 55;
    var szK = (0.45 + dreamAgitation * .95 + highEnergy * .85 + dotMode * .25), szF = (1 - smoothstep(0.75, 1.0, dotMode) * .55);
    var collapsing = collapse > .05, t3 = time * 3;
    for (var i = 0; i < NP; i++) {
      var p = particles[i], col = p.color;
      var dx = p.x - cx, dy = p.y - cy;
      var a = a0 - Math.sqrt(dx * dx + dy * dy) / reach;
      if (a < .035) a = .035;
      a *= fade * (.55 + .45 * Math.sin(t3 + p.seed)) * glow *
           (collapsing ? (.35 + .65 * Math.random()) : (1 + highEnergy * (Math.random() * .9)));
      if (a > 1) a = 1;
      var r = col[0] + dr, g = col[1] + dg, b = col[2] + db;
      if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
      var sz = p.size * (szK + p.z * 0.7) * szF * sc;      // side length in buffer pixels
      var x = (p.x * sc) | 0, y = (p.y * sc) | 0;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      var side = sz < 1.5 ? 1 : sz < 2.5 ? 2 : 3;
      var k = a * Math.min(1, sz * sz / (side * side) + 0.15);   // light spread over the block
      var rr = r * k, gg = g * k, bb = b * k;
      for (var yy = 0; yy < side && y + yy < h; yy++) {
        var o = ((y + yy) * w + x) * 4;
        for (var xx = 0; xx < side && x + xx < w; xx++, o += 4) {
          d[o] += rr; d[o + 1] += gg; d[o + 2] += bb; d[o + 3] = 255;   // Uint8Clamped: adds and clamps
        }
      }
    }
    pctx.putImageData(pimg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(pbuf, 0, 0, W, H);

    // The occasional motion trail, in one stroke.
    ctx.strokeStyle = "rgba(255,236,214,0.07)";
    ctx.lineWidth = .65 * DPR;
    ctx.beginPath();
    for (i = 0; i < NP; i++) {
      var tp = particles[i];
      if (tp.trail > .985) { ctx.moveTo(tp.x, tp.y); ctx.lineTo(tp.x - tp.vx * 8, tp.y - tp.vy * 8); }
    }
    ctx.stroke();
    ctx.restore();
  };

  // The flower's silk strands read as scribbles around a silhouette: off.
  window.drawStrands = function () {};
  // So does the faint "stage rectangle" the original drew in the background.
  window.__DT_FRAME = 0;

  // The air of each geologic period tints the dark.
  var origBackground = window.drawBackground;
  window.drawBackground = function () {
    origBackground();
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    var g = ctx.createRadialGradient(W * 0.52, H * 0.5, 0, W * 0.52, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, rgba(tint, 0.085));
    g.addColorStop(0.55, rgba(tint, 0.035));
    g.addColorStop(1, rgba(tint, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawEnvironment();
  };

  function drawEnvironment() {
    drawStarMap();
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    // Light from a surface far above, while the body is still a fish.
    if (water > 0.01) {
      var wc = [120 + (tint[0] - 120) * 0.3, 190 + (tint[1] - 190) * 0.3, 215 + (tint[2] - 215) * 0.3];
      for (var k = 0; k < 6; k++) {
        var x = W * (0.1 + k * 0.165) + Math.sin(time * 0.11 + k * 1.7) * W * 0.04;
        var bw = W * (0.035 + 0.025 * (0.5 + 0.5 * Math.sin(k * 2.1 + time * 0.07)));
        var a = 0.03 * water * (0.55 + 0.45 * Math.sin(time * 0.31 + k * 1.3));
        var g = ctx.createLinearGradient(0, 0, 0, H * 0.9);
        g.addColorStop(0, rgba(wc, a));
        g.addColorStop(0.5, rgba(wc, a * 0.35));
        g.addColorStop(1, rgba(wc, 0));
        ctx.fillStyle = g;
        // Three nested beams: bright core, soft edges.
        for (var layer = 1; layer <= 3; layer++) {
          var f = layer / 3;
          ctx.beginPath();
          ctx.moveTo(x - bw * 0.5 * f, 0);
          ctx.lineTo(x + bw * 0.5 * f, 0);
          ctx.lineTo(x + bw * 1.6 * f + W * 0.07, H * 0.9);
          ctx.lineTo(x - bw * 0.6 * f + W * 0.07, H * 0.9);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    // Marine snow / drifting dust.
    var mc = [255 + (tint[0] - 255) * 0.35, 248 + (tint[1] - 248) * 0.35, 235 + (tint[2] - 235) * 0.35];
    for (var q = 0; q < MOTES.length; q++) {
      var m = MOTES[q];
      var tw = 0.5 + 0.5 * Math.sin(time * 0.9 + m.ph);
      ctx.fillStyle = rgba(mc, (0.1 + 0.26 * m.z) * (0.4 + 0.6 * tw));
      var sz = (0.8 + m.s * m.z * 1.4) * DPR;
      ctx.fillRect(m.x * W, m.y * H, sz, sz);
    }
    ctx.restore();
  }

  // Soft bloom: the frame, shrunk twice and laid back over itself, gives the
  // light a halo (two scaled copies stand in for a blur, and work everywhere).
  var bloomA = document.createElement("canvas"), bloomB = document.createElement("canvas");
  var bA = bloomA.getContext("2d"), bB = bloomB.getContext("2d");
  function bloom() {
    var w1 = Math.max(2, Math.round(W / 4)), h1 = Math.max(2, Math.round(H / 4));
    var w2 = Math.max(2, Math.round(W / 14)), h2 = Math.max(2, Math.round(H / 14));
    if (bloomA.width !== w1 || bloomA.height !== h1) { bloomA.width = w1; bloomA.height = h1; }
    if (bloomB.width !== w2 || bloomB.height !== h2) { bloomB.width = w2; bloomB.height = h2; }
    bA.globalCompositeOperation = "copy";
    bA.drawImage(canvas, 0, 0, w1, h1);
    // Multiplying the copy by itself (value^2) keeps mostly the bright
    // parts, so the dark stays dark and only the light glows.
    bA.globalCompositeOperation = "multiply";
    bA.drawImage(bloomA, 0, 0);
    bB.globalCompositeOperation = "copy";
    bB.drawImage(bloomA, 0, 0, w2, h2);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = Math.min(1, 0.9 + 0.5 * flash);
    ctx.drawImage(bloomB, 0, 0, W, H);
    ctx.globalAlpha = 0.55 + 0.3 * flash;
    ctx.drawImage(bloomA, 0, 0, W, H);
    ctx.restore();
  }
  var origCollapse = window.drawCollapseOverlay;
  window.drawCollapseOverlay = function () {
    origCollapse();
    try { drawNotes(); drawScanHud(); } catch (err) { console.warn("[deeptime] hud", err); }
    try { bloom(); } catch (err) {}
  };

  // Measuring frame around the turning specimen: corner brackets, rulers with
  // numbers, the scan line, and three points whose coordinates are read out.
  function drawScanHud() {
    var ef = fosEase, fr = specimens[fosStage];
    if (ef < 0.02 || !fr || fr.state !== "ready") return;
    var s = (0.68 + dreamAgitation * 0.22 + lowEnergy * 0.08) * morphBloom;
    var mx = W * 0.52, my = H * 0.49 + (hud.cy - H * 0.48) * s;
    var hw = fr.w * 500 * hud.kf * s * (Math.abs(Math.cos(hud.phi)) * 0.9 + 0.1) + 18 * DPR;
    var hh = fr.h * 500 * hud.kf * s + 18 * DPR;
    var a = ef;
    ctx.save();
    ctx.lineWidth = 1.2 * DPR;
    ctx.strokeStyle = "rgba(255,240,215," + (0.62 * a) + ")";
    ctx.fillStyle = "rgba(255,240,215," + (0.62 * a) + ")";
    ctx.font = (9 * DPR) + "px Menlo, Consolas, monospace";
    var arm = 26 * DPR, x0 = mx - hw, x1 = mx + hw, y0 = my - hh, y1 = my + hh;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + arm); ctx.lineTo(x0, y0); ctx.lineTo(x0 + arm, y0);
    ctx.moveTo(x1 - arm, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + arm);
    ctx.moveTo(x1, y1 - arm); ctx.lineTo(x1, y1); ctx.lineTo(x1 - arm, y1);
    ctx.moveTo(x0 + arm, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - arm);
    ctx.stroke();
    // Rulers (0–100 % of the specimen's length and height).
    ctx.strokeStyle = "rgba(255,240,215," + (0.32 * a) + ")";
    ctx.beginPath();
    for (var t = 0; t <= 40; t++) {
      var tx = x0 + (x1 - x0) * t / 40, ty = y0 + (y1 - y0) * t / 40, L = (t % 10 === 0 ? 9 : t % 5 === 0 ? 6 : 3) * DPR;
      ctx.moveTo(tx, y1 + 8 * DPR); ctx.lineTo(tx, y1 + 8 * DPR + L);
      ctx.moveTo(x0 - 8 * DPR, ty); ctx.lineTo(x0 - 8 * DPR - L, ty);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(255,240,215," + (0.45 * a) + ")";
    var mo = fr.model, real = mo && mo.calibrated;
    for (t = 0; t <= 4; t++) {
      // A calibrated scan gets real centimetres; everything else, % of its size.
      var bx = real ? (mo.dims_m[0] * 100 * t / 4).toFixed(1) + " cm" : (t * 25) + "%";
      var by = real ? (mo.dims_m[1] * 100 * t / 4).toFixed(1) : (t * 25) + "";
      ctx.fillText(bx, x0 + (x1 - x0) * t / 4 - 8 * DPR, y1 + 30 * DPR);
      ctx.fillText(by, x0 - 44 * DPR, y0 + (y1 - y0) * t / 4 + 3 * DPR);
    }
    if (mo) {
      // Each bone's name, on a leader line from where it is right now.
      var cph = Math.cos(hud.phi), sph = Math.sin(hud.phi), cps = Math.cos(hud.psi), sps = Math.sin(hud.psi);
      ctx.font = (11 * DPR) + "px " + "Songti SC, STSong, Noto Serif SC, serif";
      for (var pq = 0; pq < mo.parts.length; pq++) {
        var pc = mo.parts[pq].c;
        var px1 = pc[0] * cph + pc[2] * sph, pz1 = -pc[0] * sph + pc[2] * cph;
        var py1 = pc[1] * cps - pz1 * sps, pz2 = pc[1] * sps + pz1 * cps, pper = 1700 / (1700 + pz2);
        var sxp = mx + px1 * pper * hud.kf * s, syp = my + py1 * pper * hud.kf * s;
        var left = sxp < mx, lx2 = left ? x0 - 70 * DPR : x1 + 70 * DPR, ly2 = syp - 20 * DPR;
        ctx.strokeStyle = "rgba(255,240,215," + (0.5 * a) + ")";
        ctx.beginPath(); ctx.moveTo(sxp, syp); ctx.lineTo(lx2, ly2); ctx.lineTo(lx2 + (left ? -30 : 30) * DPR, ly2); ctx.stroke();
        ctx.fillStyle = "rgba(255,240,215," + (0.85 * a) + ")";
        ctx.fillRect(sxp - 2 * DPR, syp - 2 * DPR, 4 * DPR, 4 * DPR);
        var label = mo.parts[pq].zh + "  " + mo.parts[pq].en + "  · " + fmtInt(mo.parts[pq].n) + " pts";
        var tw = ctx.measureText(label).width;
        ctx.fillText(label, left ? lx2 - 34 * DPR - tw : lx2 + 34 * DPR, ly2 + 4 * DPR);
      }
      ctx.font = (9 * DPR) + "px Menlo, Consolas, monospace";
    }
    // Scan line.
    var sy = y0 + (y1 - y0) * hud.scanV;
    var g = ctx.createLinearGradient(x0 - 20 * DPR, 0, x1 + 20 * DPR, 0);
    g.addColorStop(0, "rgba(255,236,200,0)");
    g.addColorStop(0.5, "rgba(255,236,200," + (0.55 * a) + ")");
    g.addColorStop(1, "rgba(255,236,200,0)");
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 20 * DPR, sy); ctx.lineTo(x1 + 20 * DPR, sy); ctx.stroke();
    ctx.fillStyle = "rgba(255,240,215," + (0.7 * a) + ")";
    ctx.fillText("SCAN " + (hud.scanV * 100).toFixed(1) + "%", x1 + 24 * DPR, sy + 3 * DPR);
    ctx.fillText("φ " + (((hud.phi * 57.3) % 360 + 360) % 360).toFixed(1) + "°  ψ " + (hud.psi * 57.3).toFixed(1) + "°", x0, y0 - 10 * DPR);
    ctx.fillText(fmtInt(fr.n) + " pts · relief ±" + fr.relief.toFixed(2), x1 - 150 * DPR, y0 - 10 * DPR);
    // Three measured points, re-chosen every 1.2 s.
    var now = performance.now();
    if (now - hud.pickedAt > 1200) {
      hud.pickedAt = now;
      hud.picks = [0, 1, 2].map(function () { return (Math.random() * NP) | 0; });
    }
    ctx.strokeStyle = "rgba(255,240,215," + (0.7 * a) + ")";
    for (var q = 0; q < hud.picks.length; q++) {
      var i = hud.picks[q], p = particles[i];
      var jp = Math.min(fr.n - 1, (uu[i] * fr.n) | 0);
      var nx = fr.pts[jp * 2] / 1000 / fr.w + 0.5, ny = fr.pts[jp * 2 + 1] / 1000 / fr.h + 0.5, nz = fr.z[jp] / 1000;
      var r = 5 * DPR, lx = p.x + 26 * DPR, ly = p.y - 18 * DPR;
      ctx.beginPath();
      ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y); ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x, p.y + r);
      ctx.moveTo(p.x + 3 * DPR, p.y - 3 * DPR); ctx.lineTo(lx, ly);
      ctx.stroke();
      if (real) {
        var mmPerU = Math.max(mo.dims_m[0], mo.dims_m[1]) * 1000 / 1000;
        ctx.fillText("x " + (fr.pts[jp * 2] * mmPerU).toFixed(1) + "  y " + (-fr.pts[jp * 2 + 1] * mmPerU).toFixed(1) +
                     "  z " + (fr.z[jp] * mmPerU).toFixed(1) + " mm", lx + 4 * DPR, ly + 3 * DPR);
      } else {
        ctx.fillText("x " + nx.toFixed(3) + "  y " + ny.toFixed(3) + "  z " + (nz >= 0 ? "+" : "") + nz.toFixed(3), lx + 4 * DPR, ly + 3 * DPR);
      }
    }
    ctx.restore();
  }

  // Data panel (right): live numbers for the specimen and a map of where the
  // site is today and where it was then.
  var scan = el("div", "dt-scan");
  scan.innerHTML = '<div class="dt-scan-head">标本扫描 · SPECIMEN SCAN <b>●</b></div><div class="dt-scan-rows"></div>' +
    '<canvas class="dt-scan-map"></canvas><div class="dt-scan-foot">PBDB · GPlates paleogeography</div>';
  ui.appendChild(scan);
  var scanRows = scan.querySelector(".dt-scan-rows"), scanMap = scan.querySelector(".dt-scan-map");
  var scanAt = 0, scanFor = -1;
  function scanRow(zh, en, val) {
    return '<div class="r"><span class="k">' + zh + ' <em>' + en + '</em></span><span class="v">' + val + '</span></div>';
  }
  function updateScanPanel(now) {
    scan.style.opacity = fosEase.toFixed(3);
    if (fosEase < 0.02 || now - scanAt < 120) return;
    scanAt = now;
    var fr = specimens[fosStage], st = STAGES[fosStage], fo = st.fossil || {};
    if (!fr || fr.state !== "ready") return;
    var hasThen = fo.plat != null && fo.plng != null;
    var drift = hasThen ? haversine(fo.lat, fo.lng, fo.plat, fo.plng) : null;
    var age = fo.max_ma != null ? fo.max_ma.toFixed(1) + " – " + fo.min_ma.toFixed(1) + " Ma" : "~" + st.ma + " Ma";
    var mo = fr.model;
    var modelRows = mo ? scanRow("三角面", "triangles", fmtInt(mo.triangles)) +
      scanRow("尺寸", "size", mo.calibrated ? mo.dims_m.map(function (v) { return (v * 100).toFixed(1); }).join(" × ") + " cm" : "尺度未校准 uncalibrated") +
      scanRow("部件", "parts", mo.parts.map(function (q) { return q.zh; }).join(" · ")) : "";
    scanRows.innerHTML =
      scanRow("采样点", "points", fmtInt(Math.min(fr.n, hud.resolved * fr.n / NP)) + " / " + fmtInt(fr.n)) + modelRows +
      scanRow("扫描", "scan", (hud.scanV * 100).toFixed(1) + " %") +
      scanRow("旋转", "rotation", (mo ? (((hud.phi * 57.3) % 360 + 360) % 360).toFixed(1) : (hud.phi >= 0 ? "+" : "") + (hud.phi * 57.3).toFixed(1)) + "° / " + (hud.psi * 57.3).toFixed(1) + "°") +
      (mo ? "" : scanRow("浮雕", "relief", "± " + fr.relief.toFixed(3))) +
      scanRow("PBDB 记录年代", "record age", age) +
      scanRow("今日", "now", fo.lat != null ? coord(fo.lat, fo.lng) : "—") +
      scanRow("当时", "then", hasThen ? coord(fo.plat, fo.plng) : "—") +
      scanRow("漂移", "drift", drift != null ? fmtInt(drift) + " km" : "—") +
      scanRow("化石记录", "PBDB records", fo.count != null ? (fo.count >= 500 ? "500+" : fmtInt(fo.count)) : "—") +
      (mo ? "" : scanRow("平均色", "pigment", fr.pigment + ' <i style="background:' + fr.pigment + '"></i>'));
    if (scanFor !== fosStage) { scanFor = fosStage; }
    drawScanMap(fo, hasThen);
  }
  function drawScanMap(fo, hasThen) {
    var cw = scanMap.clientWidth, ch = scanMap.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!cw || !ch) return;
    if (scanMap.width !== Math.round(cw * dpr)) { scanMap.width = Math.round(cw * dpr); scanMap.height = Math.round(ch * dpr); }
    var g = scanMap.getContext("2d"), w = scanMap.width, h = scanMap.height;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,240,215,0.12)";
    g.lineWidth = dpr;
    g.beginPath();
    for (var lng = -180; lng <= 180; lng += 30) { var x = (lng + 180) / 360 * w; g.moveTo(x, 0); g.lineTo(x, h); }
    for (var lat = -90; lat <= 90; lat += 30) { var y = (90 - lat) / 180 * h; g.moveTo(0, y); g.lineTo(w, y); }
    g.stroke();
    g.fillStyle = "rgba(255,240,215,0.4)";
    for (var k = 0; k < siteRecs.length; k++) {
      var r = siteRecs[k];
      g.fillRect((r.pn + 180) / 360 * w, (90 - r.pa) / 180 * h, 1.5 * dpr, 1.5 * dpr);
    }
    if (fo.lat == null) return;
    var nx = (fo.lng + 180) / 360 * w, ny = (90 - fo.lat) / 180 * h;
    g.strokeStyle = "rgba(255,240,215,0.9)";
    g.font = (9 * dpr) + "px Menlo, Consolas, monospace";
    g.fillStyle = "rgba(255,240,215,0.9)";
    var rr = 4 * dpr;
    g.beginPath(); g.moveTo(nx - rr, ny); g.lineTo(nx + rr, ny); g.moveTo(nx, ny - rr); g.lineTo(nx, ny + rr); g.stroke();
    g.fillText("今 now", nx + 6 * dpr, ny - 4 * dpr);
    if (hasThen) {
      var tx = (fo.plng + 180) / 360 * w, ty = (90 - fo.plat) / 180 * h;
      g.setLineDash([3 * dpr, 3 * dpr]);
      g.beginPath(); g.moveTo(nx, ny); g.lineTo(tx, ty); g.stroke();
      g.setLineDash([]);
      g.fillStyle = "#fff3dc";
      g.fillRect(tx - 2.5 * dpr, ty - 2.5 * dpr, 5 * dpr, 5 * dpr);
      g.fillText("古 then", tx + 6 * dpr, ty + 12 * dpr);
    }
  }
  // The original's bright core sat at the centre of the screen: right for a
  // flower, a stray sun in the middle of a fish. Keep it faint.
  window.__DT_CORE = 0.5;

  // The original opened a ring tunnel when the phone's orb was held; in this
  // version holding reveals the fossil, so the tunnel is never opened.
  ["forceApplyPhoneBodyControl", "applyPhoneBodyControl"].forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== "function") return;
    window[name] = function () {
      orig.apply(this, arguments);
      tunnelTarget = 0;
    };
  });

  // ---------------------------------------------------------------------
  // Intro (skipped in kiosk mode) and starting sound + microphone.
  function startSound() {
    var btn = document.getElementById("startMic");
    if (btn) btn.click();
  }

  if (KIOSK) {
    setTimeout(startSound, 800);
  } else if (started) {
    // ?intro=0: no intro (for recording); sound starts on the first click.
  } else {
    var intro = el("div", "dt-intro");
    intro.innerHTML =
      '<div class="dt-intro-inner">' +
      '<div class="dt-intro-kicker">THE DREAM REMEMBERS</div>' +
      '<h1>梦记得</h1>' +
      '<div class="dt-intro-sub">一具身体的深时记忆 · a body of deep time</div>' +
      '<p>这具身体记得自己曾是一条鱼。<br>从五亿多年前云南澄江的一条小鱼，到此刻的你：十五具身体，一次呼吸。</p>' +
      '<p class="en">This body remembers being a fish. From a small fish in Yunnan, over half a billion years ago, to you: fifteen bodies, one breath.</p>' +
      '<button type="button" class="dt-enter">进入梦境 · ENTER</button>' +
      '<div class="dt-intro-note">将开启声音与麦克风 · sound and microphone will turn on</div>' +
      (matchMedia("(pointer: coarse)").matches ?
      '<ul class="dt-howto">' +
      '<li><b>上下滑动</b> 穿越时间 <em>swipe to travel through time</em></li>' +
      '<li><b>轻触</b> 唤起一块真实化石的记忆 <em>tap to wake a real fossil’s memory</em></li>' +
      '<li><b>长按</b> 身体化为真实的化石标本 <em>hold to see the real specimen</em></li>' +
      '<li><b>呼吸、说话</b> 推动身体演化 <em>breathe or speak to evolve</em></li>' +
      '</ul>' :
      '<ul class="dt-howto">' +
      '<li><b>滚动 / ← →</b> 穿越时间 <em>travel through time</em></li>' +
      '<li><b>点击</b> 唤起一块真实化石的记忆 <em>wake a real fossil’s memory</em></li>' +
      '<li><b>呼吸、说话</b> 推动身体演化 <em>breathe or speak to evolve</em></li>' +
      '<li><b>长按 / 空格</b> 身体化为真实的化石标本 <em>hold to see the real specimen</em></li>' +
      '</ul>') +
      '<div class="dt-intro-data">open data · Paleobiology Database · Macrostrat · Ensembl · Open Tree of Life · PhyloPic</div>' +
      '</div>';
    document.body.appendChild(intro);
    document.documentElement.classList.add("dt-intro-open");
    intro.querySelector(".dt-enter").addEventListener("click", function () {
      started = true;
      lastInput = performance.now();
      intro.classList.add("gone");
      document.documentElement.classList.remove("dt-intro-open");
      startSound();
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1600);
    });
  }

  // ---------------------------------------------------------------------
  // Phone link (optional): only offered when Firebase is really reachable.
  if (window.__whenFirebase) {
    window.__whenFirebase(function () {
      if (!window.firebase || !firebase.apps || !firebase.apps.length) return;
      var db = firebase.database();
      var timer = setTimeout(function () { document.documentElement.classList.add("dt-no-phone"); }, 8000);
      db.ref(".info/connected").on("value", function (snap) {
        var live = snap.val() === true;
        if (live) clearTimeout(timer);
        document.documentElement.classList.toggle("dt-phone-live", live);
      });
      var seen = 0;
      db.ref("dreamBody/memoryLight").on("value", function (snap) {
        var d = snap.val();
        if (!d || !d.t || d.t === seen) return;
        if (!seen) { seen = d.t; return; } // ignore the light left from before
        seen = d.t;
        lastInput = performance.now();
        showFossil((+d.x || Math.random()) * innerWidth, (+d.y || Math.random()) * innerHeight);
      });
    });
  }

  // For the browser console while tuning.
  window.__deepTime = {
    go: function (k) { noteInput(); evoTarget = clamp(k, 0, NS - 1); },
    state: function () { return { evo: evo, evoTarget: evoTarget, ma: currentMa(), auto: auto, fos: fos, hold: hold,
      specimens: specimens.map(function (r) { return r ? r.state : null; }) }; },
    start: function () { var b = document.querySelector(".dt-enter"); if (b) b.click(); },
    stages: STAGES.map(function (s) { return s.sci; })
  };
})();
