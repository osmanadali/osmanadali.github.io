/* Osman Adalı — küçük site betiği. Kütüphane yok. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- Dil (TR / EN) ----------
     Türkçe metin HTML'de yazılı; İngilizcesi data-en özniteliğinde.
     data-attr="content" gibi bir değer varsa metin yerine o öznitelik değişir.
     data-html varsa data-en HTML olarak yerleştirilir (yalnız kendi yazdığımız metin). */
  var i18nNodes = document.querySelectorAll("[data-en]");

  function applyLang(lang) {
    root.lang = lang;
    for (var i = 0; i < i18nNodes.length; i++) {
      var el = i18nNodes[i];
      var attr = el.getAttribute("data-attr");
      var html = el.hasAttribute("data-html");
      if (el.__tr === undefined) {
        el.__tr = attr ? el.getAttribute(attr) : (html ? el.innerHTML : el.textContent);
      }
      var value = lang === "en" ? el.getAttribute("data-en") : el.__tr;
      if (attr) el.setAttribute(attr, value);
      else if (html) el.innerHTML = value;
      else el.textContent = value;
    }
    var og = document.querySelector('meta[property="og:locale"]');
    if (og) og.setAttribute("content", lang === "en" ? "en_US" : "tr_TR");
    var btn = document.querySelector("[data-lang-toggle]");
    if (btn) {
      btn.textContent = lang === "en" ? "TR" : "EN";
      btn.setAttribute("aria-label", lang === "en" ? "Türkçeye geç" : "Switch to English");
      btn.setAttribute("lang", lang === "en" ? "tr" : "en");
    }
    updateThemeLabel();
  }

  /* ---------- Tema ---------- */
  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return darkQuery && darkQuery.matches ? "dark" : "light";
  }
  function updateThemeLabel() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var en = root.lang === "en";
    var next = currentTheme() === "dark" ? "light" : "dark";
    var label = en
      ? (next === "dark" ? "Switch to dark theme" : "Switch to light theme")
      : (next === "dark" ? "Koyu temaya geç" : "Açık temaya geç");
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", currentTheme() === "dark" ? "#0b0b0c" : "#f5f4f1");
  }

  var themeBtn = document.querySelector("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store("oa-theme", next);
      updateThemeLabel();
    });
  }
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener("change", updateThemeLabel);

  var langBtn = document.querySelector("[data-lang-toggle]");
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      var next = root.lang === "en" ? "tr" : "en";
      store("oa-lang", next);
      applyLang(next);
    });
  }

  applyLang(root.lang === "en" ? "en" : "tr");
  root.classList.remove("i18n-wait");

  /* Açılış animasyonu oturumda bir kez oynasın */
  if (root.classList.contains("intro")) {
    try { sessionStorage.setItem("oa-intro", "1"); } catch (e) {}
  }

  /* ---------- Kaydırınca beliren bölümler ----------
     Ekranda olanlar hemen görünür; aşağıdakiler bölüm bütün olarak gelir. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-pending");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    var vh = window.innerHeight || 800;
    document.querySelectorAll(".reveal").forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add("is-pending");
      io.observe(el);
    });
  }

  /* ---------- Ekran görüntüsü şeridi ---------- */
  var strip = document.querySelector("[data-shots]");
  if (strip) {
    var prev = document.querySelector("[data-shots-prev]");
    var next = document.querySelector("[data-shots-next]");
    var step = function () {
      var item = strip.querySelector("li");
      return item ? item.getBoundingClientRect().width + 16 : 240;
    };
    var sync = function () {
      var max = strip.scrollWidth - strip.clientWidth - 2;
      if (prev) prev.disabled = strip.scrollLeft <= 2;
      if (next) next.disabled = strip.scrollLeft >= max;
    };
    var behavior = reduceMotion ? "auto" : "smooth";
    if (prev) prev.addEventListener("click", function () { strip.scrollBy({ left: -step() * 2, behavior: behavior }); });
    if (next) next.addEventListener("click", function () { strip.scrollBy({ left: step() * 2, behavior: behavior }); });
    strip.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  }

  /* ---------- Destek: uygulama seçimi ---------- */
  var options = document.querySelectorAll("[data-app-option]");
  if (options.length) {
    var select = function (app) {
      options.forEach(function (o) {
        o.setAttribute("aria-pressed", String(o.getAttribute("data-app-option") === app));
      });
      document.querySelectorAll("[data-app-faq]").forEach(function (g) {
        g.hidden = g.getAttribute("data-app-faq") !== app;
      });
    };
    options.forEach(function (o) {
      o.addEventListener("click", function () {
        var app = o.getAttribute("data-app-option");
        select(app);
        if (history.replaceState) history.replaceState(null, "", "#" + app);
      });
    });
    var fromHash = location.hash.slice(1);
    var known = Array.prototype.some.call(options, function (o) { return o.getAttribute("data-app-option") === fromHash; });
    select(known ? fromHash : options[0].getAttribute("data-app-option"));
  }
})();
