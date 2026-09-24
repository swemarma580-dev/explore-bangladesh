/* ==========================================================================
   art.js — generated landscape illustrations
   --------------------------------------------------------------------------
   The seed data has no photo files, so every "image" is a reference like
   "art:sea:1" (scene:variant). EB.Art.resolve() turns it into an SVG data URI.
   Real photos work too: put files in /images and use "images/my-photo.jpg",
   or upload through Admin > Add Tourist Spot.
   ========================================================================== */
(function () {
  const EB = window.EB;
  const cache = {};

  // sky top, sky bottom, sun colour, sun x/y
  const SKY = [
    ["#7CC6EC", "#E6F6FF", "#FFE08A", 610, 120], // clear day
    ["#F2894A", "#FFD9A0", "#FFF1C2", 540, 250], // sunset
    ["#F4B6C2", "#FFF0D2", "#FFD27A", 220, 260], // sunrise
    ["#3E5C9A", "#B9C8E8", "#F6F0D0", 660, 110], // dusk / mist
  ];

  const hills = (color, y, amp, seed, w) => {
    let d = "M0 520 L0 " + y;
    for (let x = 0; x <= 800; x += 100) {
      const off =
        Math.sin((x + seed * 53) / 130) * amp +
        Math.cos((x + seed * 17) / 70) * amp * 0.5;
      d += " L" + x + " " + Math.round(y + off);
    }
    return (
      '<path d="' +
      d +
      ' L800 520 Z" fill="' +
      color +
      '"' +
      (w ? ' opacity="' + w + '"' : "") +
      "/>"
    );
  };
  const tree = (x, y, s, c) =>
    '<path d="M' +
    x +
    " " +
    y +
    " q" +
    -4 * s +
    " " +
    -40 * s +
    " " +
    10 * s +
    " " +
    -70 * s +
    '" stroke="#5B3A22" stroke-width="' +
    5 * s +
    '" fill="none"/>' +
    '<path d="M' +
    (x + 10 * s) +
    " " +
    (y - 70 * s) +
    " q" +
    -40 * s +
    " " +
    -6 * s +
    " " +
    -52 * s +
    " " +
    18 * s +
    " M" +
    (x + 10 * s) +
    " " +
    (y - 70 * s) +
    " q" +
    40 * s +
    " " +
    -8 * s +
    " " +
    54 * s +
    " " +
    14 * s +
    " M" +
    (x + 10 * s) +
    " " +
    (y - 70 * s) +
    " q" +
    -8 * s +
    " " +
    -36 * s +
    " " +
    -44 * s +
    " " +
    -30 * s +
    " M" +
    (x + 10 * s) +
    " " +
    (y - 70 * s) +
    " q" +
    14 * s +
    " " +
    -38 * s +
    " " +
    48 * s +
    " " +
    -26 * s +
    '" stroke="' +
    c +
    '" stroke-width="' +
    6 * s +
    '" fill="none" stroke-linecap="round"/>';
  const cloud = (x, y, s) =>
    '<g fill="#fff" opacity=".75"><ellipse cx="' +
    x +
    '" cy="' +
    y +
    '" rx="' +
    60 * s +
    '" ry="' +
    16 * s +
    '"/><ellipse cx="' +
    (x + 36 * s) +
    '" cy="' +
    (y - 12 * s) +
    '" rx="' +
    38 * s +
    '" ry="' +
    16 * s +
    '"/><ellipse cx="' +
    (x - 30 * s) +
    '" cy="' +
    (y - 8 * s) +
    '" rx="' +
    30 * s +
    '" ry="' +
    13 * s +
    '"/></g>';
  const boat = (x, y, s) =>
    '<g transform="translate(' +
    x +
    " " +
    y +
    ") scale(" +
    s +
    ')"><path d="M-46 0 Q0 26 46 0 L40 -8 L-40 -8 Z" fill="#3B2A1A"/><path d="M-20 -8 L-14 -34 L26 -34 L30 -8 Z" fill="#E8B04B"/></g>';

  const scenes = {
    sea: (v, sky) =>
      cloud(150 + v * 40, 90, 1) +
      cloud(520 - v * 30, 150, 0.7) +
      '<rect y="290" width="800" height="230" fill="#1B8CA6"/><rect y="290" width="800" height="26" fill="#6CC8D8" opacity=".55"/>' +
      '<rect y="276" width="800" height="28" fill="' +
      sky[1] +
      '" opacity=".55"/>' +
      '<ellipse cx="' +
      sky[3] +
      '" cy="330" rx="60" ry="9" fill="' +
      sky[2] +
      '" opacity=".55"/>' +
      '<path d="M0 420 Q120 396 240 420 T480 420 T720 420 T960 420 L960 520 L0 520 Z" fill="#F0D9A5"/>' +
      '<path d="M0 404 Q100 380 200 404 T400 404 T600 404 T800 404" stroke="#fff" stroke-width="5" fill="none" opacity=".8"/>' +
      tree(120 + v * 30, 470, 1.15, "#2E7D4F") +
      tree(660 - v * 20, 480, 1.4, "#2E7D4F") +
      tree(720 - v * 20, 490, 0.9, "#3B9660"),
    mountain: (v, sky) =>
      cloud(140, 110, 0.9) +
      cloud(560 - v * 20, 90, 0.8) +
      hills("#7FA3B8", 270, 34, v, 0.75) +
      hills("#3F7F6B", 330, 30, v + 1, 0.95) +
      hills("#1F5A46", 400, 26, v + 2) +
      '<path d="M0 470 Q200 430 400 470 T800 470 L800 520 L0 520 Z" fill="#12402F"/>' +
      '<rect x="0" y="330" width="800" height="70" fill="#fff" opacity=".22"/>',
    waterfall: (v, sky) =>
      hills("#5C8F6E", 200, 26, v, 0.9) +
      '<path d="M120 190 L680 190 L700 520 L100 520 Z" fill="#3E5A4D"/><path d="M120 190 L680 190 L690 260 L110 260 Z" fill="#5B7A6A"/>' +
      '<g fill="#F4FBFF"><rect x="' +
      (320 + v * 20) +
      '" y="190" width="46" height="250" rx="10"/><rect x="' +
      (410 + v * 14) +
      '" y="200" width="28" height="240" rx="10" opacity=".85"/><rect x="' +
      (250 + v * 10) +
      '" y="215" width="18" height="225" rx="8" opacity=".7"/></g>' +
      '<ellipse cx="' +
      (370 + v * 14) +
      '" cy="450" rx="150" ry="36" fill="#7CD0E0"/><ellipse cx="' +
      (370 + v * 14) +
      '" cy="452" rx="90" ry="16" fill="#F4FBFF" opacity=".8"/>' +
      '<path d="M0 470 Q200 450 400 480 T800 470 L800 520 L0 520 Z" fill="#1E5C3F"/>',
    forest: (v, sky) => {
      let t = "";
      for (let i = 0; i < 16; i++) {
        const x = 20 + i * 50 + ((i * 37 + v * 19) % 30),
          h = 70 + ((i * 53 + v * 11) % 70);
        t +=
          '<path d="M' +
          x +
          " 400 L" +
          (x - 34) +
          " 400 L" +
          x +
          " " +
          (400 - h) +
          " L" +
          (x + 34) +
          ' 400 Z" fill="' +
          (i % 3 ? "#1D6B4B" : "#2F8A5C") +
          '"/>';
      }
      let u = "";
      for (let i = 0; i < 12; i++) {
        const x = 30 + i * 68 + ((i * 29 + v * 23) % 26),
          h = 110 + ((i * 41 + v * 7) % 80);
        u +=
          '<path d="M' +
          x +
          " 470 L" +
          (x - 46) +
          " 470 L" +
          x +
          " " +
          (470 - h) +
          " L" +
          (x + 46) +
          ' 470 Z" fill="' +
          (i % 2 ? "#0E4A34" : "#155F42") +
          '"/>';
      }
      return (
        cloud(180, 100, 0.9) +
        hills("#6FA98A", 290, 20, v, 0.8) +
        t +
        '<rect y="400" width="800" height="120" fill="#2B8AA0" opacity=".9"/>' +
        u +
        '<path d="M0 470 L800 470 L800 520 L0 520 Z" fill="#0C3B2B"/>'
      );
    },
    island: (v, sky) =>
      cloud(200, 100, 1) +
      '<rect y="300" width="800" height="220" fill="#19A2B8"/><rect y="300" width="800" height="30" fill="#7CD8E4" opacity=".55"/>' +
      '<ellipse cx="' +
      (400 + v * 30) +
      '" cy="392" rx="240" ry="46" fill="#F0D9A5"/><ellipse cx="' +
      (400 + v * 30) +
      '" cy="378" rx="190" ry="34" fill="#4FA46B"/>' +
      tree(360 + v * 30, 382, 1.4, "#1F6B44") +
      tree(450 + v * 30, 388, 1.1, "#2E8A57") +
      tree(300 + v * 30, 390, 0.9, "#2E8A57") +
      '<path d="M0 460 Q100 440 200 460 T400 460 T600 460 T800 460" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/>',
    water: (v, sky) =>
      cloud(160, 100, 1) +
      hills("#6E9A82", 290, 22, v, 0.85) +
      '<rect y="330" width="800" height="190" fill="#2A8FA6"/>' +
      '<ellipse cx="' +
      sky[3] +
      '" cy="360" rx="70" ry="10" fill="' +
      sky[2] +
      '" opacity=".6"/>' +
      '<path d="M0 380 Q120 366 240 380 T480 380 T720 380" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>' +
      '<path d="M0 440 Q120 426 240 440 T480 440 T720 440" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>' +
      boat(300 + v * 60, 420, 1.2) +
      '<path d="M0 500 L800 500 L800 520 L0 520 Z" fill="#1F6B45"/>',
    heritage: (v, sky) => {
      let arches = "";
      for (let i = 0; i < 5; i++)
        arches +=
          '<path d="M' +
          (250 + i * 60) +
          ' 440 v-46 a20 20 0 0 1 40 0 v46 z" fill="#5A2E22"/>';
      return (
        cloud(170, 110, 0.9) +
        '<rect x="220" y="330" width="360" height="130" fill="#B85C3A"/><rect x="220" y="330" width="360" height="12" fill="#8E3E27"/>' +
        arches +
        '<rect x="250" y="290" width="44" height="44" fill="#C46A45"/><rect x="506" y="290" width="44" height="44" fill="#C46A45"/>' +
        '<path d="M250 290 a22 22 0 0 1 44 0z" fill="#E8B04B"/><path d="M506 290 a22 22 0 0 1 44 0z" fill="#E8B04B"/>' +
        '<path d="M340 330 a60 60 0 0 1 120 0z" fill="#E8B04B"/><rect x="396" y="252" width="8" height="24" fill="#8E3E27"/>' +
        '<path d="M0 460 L800 460 L800 520 L0 520 Z" fill="#7FB07F"/><rect x="0" y="470" width="800" height="50" fill="#5F9A66"/>' +
        tree(110 + v * 20, 470, 1.2, "#2E7D4F") +
        tree(700 - v * 20, 470, 1.2, "#2E7D4F")
      );
    },
    tea: (v, sky) => {
      let rows = "";
      for (let i = 0; i < 9; i++) {
        rows +=
          '<path d="M0 ' +
          (330 + i * 22) +
          " Q200 " +
          (300 + i * 22 + (v % 2) * 12) +
          " 400 " +
          (330 + i * 22) +
          " T800 " +
          (330 + i * 22) +
          '" stroke="' +
          (i % 2 ? "#2F8A4B" : "#3EA85E") +
          '" stroke-width="12" fill="none"/>';
      }
      return (
        cloud(180, 100, 1) +
        cloud(560, 140, 0.8) +
        hills("#7FB8A0", 270, 26, v, 0.8) +
        '<rect y="300" width="800" height="220" fill="#1F7A45"/>' +
        rows +
        tree(120 + v * 25, 340, 1.3, "#155F3A") +
        tree(680 - v * 25, 350, 1.5, "#155F3A")
      );
    },
  };

  const build = (scene, v) => {
    const sky = SKY[v % 4],
      sc = scenes[scene] || scenes.tea;
    const sun =
      '<circle cx="' +
      sky[3] +
      '" cy="' +
      sky[4] +
      '" r="92" fill="' +
      sky[2] +
      '" opacity=".28"/><circle cx="' +
      sky[3] +
      '" cy="' +
      sky[4] +
      '" r="44" fill="' +
      sky[2] +
      '"/>';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' +
      sky[0] +
      '"/><stop offset="1" stop-color="' +
      sky[1] +
      '"/></linearGradient></defs><rect width="800" height="520" fill="url(#s)"/>' +
      sun +
      sc(v, sky) +
      "</svg>"
    );
  };

  const Art = (EB.Art = {
    scenes: Object.keys(scenes),
    uri(scene, variant) {
      const key = scene + ":" + variant;
      if (!cache[key])
        cache[key] =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(build(scene, variant | 0));
      return cache[key];
    },
    /* "art:sea:1" -> data URI; anything else is validated as a normal URL */
    resolve(src) {
      src = String(src || "");
      const m = src.match(/^art:([a-z]+):(\d)$/);
      if (m) return Art.uri(m[1], +m[2]);
      return EB.Util.safeUrl(src) || Art.uri("tea", 0);
    },
    forCategory(cat, variant) {
      const c = EB.CATEGORIES.find((x) => x.name === cat);
      return "art:" + (c ? c.scene : "tea") + ":" + ((variant || 0) % 4);
    },
    /* Initials avatar used for the creator card until a real photo is added */
    avatar(name) {
      const ini = String(name || "?")
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const s =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#006A4E"/><stop offset="1" stop-color="#2A8FA6"/></linearGradient></defs><rect width="400" height="400" fill="url(#a)"/><circle cx="300" cy="100" r="40" fill="#F42A41" opacity=".9"/><text x="200" y="245" font-family="Georgia,serif" font-size="150" fill="#fff" text-anchor="middle">' +
        EB.Util.esc(ini) +
        "</text></svg>";
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    },
  });
})();
