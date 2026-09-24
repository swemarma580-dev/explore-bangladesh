/* ==========================================================================
   app.js — site shell (navbar, footer, theme, hero media) + page boot
   --------------------------------------------------------------------------
   HERO BACKGROUND
   1. প্রথমে সবসময় আঁকা ছবি (.hero-scene) দেখায় — instant, কোনো নেটওয়ার্ক লাগে না।
   2. পেছনে local mp4 ভিডিও (Layout.HERO_VIDEO_SRC) লোড হতে থাকে।
   3. ভিডিও সত্যিকারে PLAYING হলে তবেই .video-ready ক্লাস বসে, ছবি fade out হয়ে
      ভিডিও fade in হয়। ধীর নেট / ফাইল না পাওয়া / এরর হলে ছবিই থেকে যায়।
   ========================================================================== */
(function () {
  const EB = window.EB,
    U = EB.Util,
    I = EB.Icons;

  const Layout = (EB.Layout = {
    NAV: [
      ["home", "index.html", "Home"],
      ["explore", "explore.html", "Explore"],
      ["divisions", "divisions.html", "Divisions"],
      ["districts", "districts.html", "Districts"],
      ["spots", "tourist-spots.html", "Tourist Spots"],
      ["map", "map.html", "Map"],
      ["guide", "travel-guide.html", "Travel Guide"],
      ["about", "about.html", "About"],
    ],

    // hero background video — local file, relative to site root (EB.base)
    HERO_VIDEO_SRC: "videos/Explore Bangladesh_1080p.mp4",

    /* Bangladesh outline + location pin + mountains + river + sun */
    logo(size) {
      size = size || 40;
      return (
        '<svg class="logo" width="' +
        size +
        '" height="' +
        size +
        '" viewBox="0 0 64 64" role="img" aria-label="Explore Bangladesh logo">' +
        '<circle cx="32" cy="32" r="30" fill="#04382C"/>' +
        '<path d="M30 9 37 11 41 17 47 18 50 24 47 31 51 38 50 46 52 55 49 52 45 45 43 40 38 47 36 55 32 50 27 47 22 40 18 37 17 30 22 27 20 21 25 17 27 12Z" fill="#12805F"/>' +
        '<circle cx="47" cy="17" r="6" fill="#F42A41"/>' +
        '<path d="M8 47 22 29 30 40 37 31 56 47Z" fill="#CFE8DC"/><path d="M30 40 37 31 44 39 38 43Z" fill="#9CCDB8"/>' +
        '<path d="M8 51Q20 45 30 51T56 51" fill="none" stroke="#4FC3E0" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M28 10a9 9 0 0 1 9 9c0 7-9 15-9 15s-9-8-9-15a9 9 0 0 1 9-9z" fill="#E8B04B" stroke="#04382C" stroke-width="1.5"/><circle cx="28" cy="19" r="3.200" fill="#04382C"/></svg>'
      );
    },

    header() {
      const page = document.body.dataset.page || "";
      const links =
        Layout.NAV.map(
          (n) =>
            '<li><a href="' +
            EB.base +
            n[1] +
            '"' +
            (n[0] === page ? ' aria-current="page"' : "") +
            ">" +
            n[2] +
            "</a></li>",
        ).join("") +
        '<li class="nav-admin"><a href="' +
        EB.base +
        'admin/index.html">Admin Login</a></li>';
      return (
        '<a class="skip-link" href="#main">Skip to main content</a>' +
        '<header class="site-nav" id="site-nav"><div class="container nav-inner">' +
        '<a class="brand" href="' +
        EB.base +
        'index.html" aria-label="Explore Bangladesh, home">' +
        Layout.logo(40) +
        '<span class="brand__text"><strong>Explore Bangladesh</strong><small>Discover the Beauty of Bangladesh</small></span></a>' +
        '<div class="nav-tools">' +
        '<button type="button" class="icon-btn" id="nav-search-btn" aria-label="Search tourist spots" aria-expanded="false" aria-controls="nav-search">' +
        I.search +
        "</button>" +
        '<button type="button" class="icon-btn" data-theme-toggle aria-pressed="false"></button>' +
        '<button type="button" class="icon-btn nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu">' +
        I.menu +
        "</button></div>" +
        '<nav id="nav-menu" class="nav-menu" aria-label="Primary"><ul>' +
        links +
        "</ul></nav></div>" +
        '<div class="nav-search" id="nav-search" hidden><div class="container"><label class="sr-only" for="nav-search-input">Search tourist spots, districts or divisions</label>' +
        '<input id="nav-search-input" class="form-control form-control-lg" type="search" placeholder="Search tourist spots, districts or divisions..." autocomplete="off">' +
        '<ul class="suggest" id="nav-suggest" role="listbox" hidden></ul></div></div></header>'
      );
    },

    footer() {
      const c = EB.CREATOR,
        b = EB.base;
      const col = (arr) =>
        arr
          .map((n) => '<li><a href="' + b + n[1] + '">' + n[2] + "</a></li>")
          .join("");
      return (
        '<footer class="site-footer"><div class="container"><div class="row g-4">' +
        '<div class="col-lg-5"><a class="brand brand--footer" href="' +
        b +
        'index.html">' +
        Layout.logo(46) +
        '<span class="brand__text"><strong>Explore Bangladesh</strong></span></a>' +
        '<p class="footer-line">"' +
        U.esc(EB.APP.footerLine) +
        '"</p><p class="footer-bn" lang="bn">সোনার বাংলা</p>' +
        '<ul class="social" aria-label="Social links">' +
        [
          ["Facebook", c.facebook],
          ["GitHub", c.github],
          ["YouTube", "https://www.youtube.com/"],
        ]
          .map(
            (s) =>
              '<li><a href="' +
              U.esc(s[1]) +
              '" target="_blank" rel="noopener">' +
              s[0] +
              "</a></li>",
          )
          .join("") +
        "</ul></div>" +
        '<div class="col-6 col-lg-3"><h2 class="footer-h">Explore</h2><ul class="footer-links">' +
        col(Layout.NAV.slice(0, 4)) +
        "</ul></div>" +
        '<div class="col-6 col-lg-4"><h2 class="footer-h">More</h2><ul class="footer-links">' +
        col(Layout.NAV.slice(4)) +
        '<li><a href="' +
        b +
        'admin/index.html">Admin Login</a></li></ul></div></div>' +
        '<p class="copyright">© 2026 Explore Bangladesh. All Rights Reserved.</p></div></footer>'
      );
    },

    /* ---------- hero background markup ----------
       .hero-scene = আঁকা ছবি (সবসময় থাকে, নিচের স্তরে)
       .hero-video = local mp4 (শুরুতে opacity:0)                */
    heroMedia() {
      return (
        '<div class="hero-media" aria-hidden="true"><div class="hero-scene" style="background-image:url(&quot;' +
        EB.Art.uri("sea", 1) +
        '&quot;)"></div>' +
        '<video class="hero-video" muted loop playsinline autoplay preload="auto" src="' +
        U.esc(EB.base + Layout.HERO_VIDEO_SRC) +
        '"></video>' +
        '<div class="hero-overlay"></div></div>'
      );
    },

    initHeroMedia() {
      const slots = U.qsa("[data-hero-media]");
      if (!slots.length) return;
      slots.forEach((slot) => {
        slot.innerHTML = Layout.heroMedia();
      });
      // reduced-motion: ভিডিও একেবারেই লোড হবে না, শুধু স্থির ছবি
      if (
        window.matchMedia &&
        matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      Layout.initHeroVideos();
    },

    /* প্রতিটি .hero-video-এর জন্য প্লে/এরর হ্যান্ডলিং বসায়।
       ছবি শুধু তখনই সরে যখন ভিডিও সত্যিই "playing" অবস্থায় পৌঁছায়;
       বাফারিং/পজ/এরর হলে আবার আঁকা ছবি দেখানো হয়, যাতে ব্যবহারকারী
       কখনো ফাঁকা/কালো ফ্রেম না দেখে। */
    initHeroVideos() {
      U.qsa(".hero-video").forEach((video) => {
        if (video.dataset.mounted) return;
        video.dataset.mounted = "1";
        const media = video.closest(".hero-media");
        const showArt = () => {
          if (media) media.classList.remove("video-ready");
        };
        const showVideo = () => {
          if (media) media.classList.add("video-ready");
        };

        video.addEventListener("playing", showVideo);
        video.addEventListener("waiting", showArt);
        video.addEventListener("pause", showArt);
        video.addEventListener("stalled", showArt);
        video.addEventListener("error", showArt); // ফাইল না পাওয়া গেলে ছবিই থাকবে

        video.muted = true; // autoplay-র জন্য বাধ্যতামূলক
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(showArt);

        // ট্যাব ফিরে এলে ভিডিও আবার চালু করি (ব্রাউজার পজ করে দিলে)
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) return;
          if (video.paused) {
            const rp = video.play();
            if (rp && typeof rp.catch === "function") rp.catch(showArt);
          }
        });
      });
    },

    /* ---------- theme ---------- */
    applyTheme(t) {
      document.documentElement.dataset.theme = t;
      document.documentElement.setAttribute("data-bs-theme", t);
      EB.Store.set(EB.Store.K.theme, t);
      U.qsa("[data-theme-toggle]").forEach((b) => {
        b.setAttribute("aria-pressed", String(t === "dark"));
        b.setAttribute(
          "aria-label",
          t === "dark" ? "Switch to light mode" : "Switch to dark mode",
        );
        b.title = t === "dark" ? "Light mode" : "Dark mode";
        b.innerHTML = t === "dark" ? I.sun : I.moon;
      });
    },
    initTheme() {
      const saved = EB.Store.get(EB.Store.K.theme, null);
      const t =
        saved ||
        (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");
      Layout.applyTheme(t);
      document.addEventListener("click", (e) => {
        if (e.target.closest("[data-theme-toggle]"))
          Layout.applyTheme(
            document.documentElement.dataset.theme === "dark"
              ? "light"
              : "dark",
          );
      });
    },

    initNav() {
      const nav = U.qs("#site-nav");
      if (!nav) return;
      const overlay = document.body.dataset.nav === "overlay";
      const onScroll = () =>
        nav.classList.toggle("scrolled", !overlay || window.scrollY > 24);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      const tog = U.qs("#nav-toggle"),
        menu = U.qs("#nav-menu");
      const setMenu = (open) => {
        menu.classList.toggle("open", open);
        tog.setAttribute("aria-expanded", String(open));
        tog.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        tog.innerHTML = open ? I.close : I.menu;
        nav.classList.toggle("menu-open", open);
      };
      tog.addEventListener("click", () =>
        setMenu(!menu.classList.contains("open")),
      );
      menu.addEventListener("click", (e) => {
        if (e.target.closest("a")) setMenu(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setMenu(false);
          closeSearch();
        }
      });

      const sb = U.qs("#nav-search-btn"),
        panel = U.qs("#nav-search"),
        input = U.qs("#nav-search-input");
      function closeSearch() {
        panel.hidden = true;
        sb.setAttribute("aria-expanded", "false");
      }
      sb.addEventListener("click", () => {
        const open = panel.hidden;
        panel.hidden = !open;
        sb.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("search-open", open);
        if (open) input.focus();
      });
      EB.Search.mount(input, U.qs("#nav-suggest"));
    },

    revealOnScroll() {
      const els = U.qsa("[data-reveal]");
      if (
        !("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        els.forEach((e) => e.classList.add("in"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          }),
        { threshold: 0.12 },
      );
      els.forEach((e) => io.observe(e));
    },

    init() {
      const h = U.qs("#app-header"),
        f = U.qs("#app-footer");
      if (h) h.outerHTML = Layout.header();
      if (f) f.outerHTML = Layout.footer();
      Layout.initTheme();
      Layout.initNav();
      Layout.initHeroMedia();
      EB.Cards.bindFavorites();
    },
  });

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    Layout.init();
    const page = document.body.dataset.page;
    if (EB.Pages && EB.Pages[page]) EB.Pages[page]();
    Layout.revealOnScroll();
  });
})();