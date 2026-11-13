/* The Dream Remembers · A Body of Deep Time — boot (runs before everything else)
 *
 * 1. Loads the Firebase SDK asynchronously. The original page loaded it with
 *    blocking <script> tags; where Google is unreachable (mainland China) that
 *    stalls the whole page. Code that needs Firebase registers with
 *    window.__whenFirebase(fn) and simply never runs if the SDK cannot load.
 * 2. Keeps one bad number from freezing the artwork: createRadialGradient
 *    throws on NaN/Infinity, and a throw inside the render loop used to stop
 *    the animation for good.
 * 3. URL options:  ?dpr=1   cap canvas pixel ratio (faster on 4K / Retina)
 *                  ?fps=1   show a frame-rate meter
 *                  ?debug=1 show error text on screen
 *                  ?kiosk=1 exhibition mode: no intro, no cursor, sound+mic
 *                           start by themselves (launch Chrome with
 *                           --autoplay-policy=no-user-gesture-required
 *                           --use-fake-ui-for-media-stream)
 */
(function () {
  var params = new URLSearchParams(location.search);
  var root = document.documentElement;
  window.__DT_PARAMS = params;

  var dprMax = parseFloat(params.get("dpr"));
  if (dprMax > 0) window.__DREAM_DPR_MAX = dprMax;
  if (params.get("debug") === "1") root.classList.add("dt-debug");
  if (params.get("kiosk") === "1") root.classList.add("dt-kiosk");

  // ---- 1. Firebase, asynchronously -------------------------------------
  var SDK = [
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js"
  ];
  var waiting = [];
  var state = "loading"; // loading | ready | failed

  window.__whenFirebase = function (fn) {
    if (state === "ready") setTimeout(fn, 0);
    else if (state === "loading") waiting.push(fn);
  };

  function giveUp() {
    if (state !== "loading") return;
    state = "failed";
    waiting.length = 0;
    root.classList.add("dt-no-phone");
  }

  function load(i) {
    if (i >= SDK.length) {
      if (state !== "loading") return;
      state = "ready";
      var fns = waiting.splice(0);
      for (var k = 0; k < fns.length; k++) {
        try { fns[k](); } catch (e) { console.warn("[deeptime] firebase hook", e); }
      }
      return;
    }
    var s = document.createElement("script");
    s.src = SDK[i];
    s.async = true;
    s.onload = function () { load(i + 1); };
    s.onerror = giveUp;
    document.head.appendChild(s);
  }

  if (params.get("phone") === "0") giveUp();
  else {
    setTimeout(giveUp, 8000);
    // Start after the page's own scripts have registered their hooks.
    document.addEventListener("DOMContentLoaded", function () { load(0); });
  }

  // ---- 2. Never let a non-finite gradient stop the render loop ----------
  var proto = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (proto && proto.createRadialGradient) {
    var original = proto.createRadialGradient;
    var bad = 0, windowStart = 0;
    proto.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
      var a = [x0, y0, r0, x1, y1, r1], fixed = false;
      for (var i = 0; i < 6; i++) {
        if (!isFinite(a[i])) { a[i] = 0; fixed = true; }
      }
      if (a[2] < 0) { a[2] = 0; fixed = true; }
      if (a[5] < 0) { a[5] = 0; fixed = true; }
      if (fixed) {
        var now = Date.now();
        if (now - windowStart > 10000) { windowStart = now; bad = 0; }
        // A value that stays NaN means the dream state itself is broken:
        // reload, but never more than once a minute.
        if (++bad > 600) {
          var last = 0;
          try { last = +sessionStorage.getItem("dt-reload") || 0; } catch (e) {}
          if (now - last > 60000) {
            try { sessionStorage.setItem("dt-reload", String(now)); } catch (e) {}
            location.reload();
          }
        }
      }
      return original.call(this, a[0], a[1], a[2], a[3], a[4], a[5]);
    };
  }

  // ---- 3. Frame-rate meter ----------------------------------------------
  if (params.get("fps") === "1") {
    document.addEventListener("DOMContentLoaded", function () {
      var el = document.createElement("div");
      el.id = "dtFps";
      document.body.appendChild(el);
      var frames = 0, t0 = performance.now();
      (function tick(t) {
        frames++;
        if (t - t0 >= 1000) {
          el.textContent = Math.round(frames * 1000 / (t - t0)) + " fps · " +
            (document.getElementById("c") || {}).width + "px";
          frames = 0; t0 = t;
        }
        requestAnimationFrame(tick);
      })(t0);
    });
  }
})();
