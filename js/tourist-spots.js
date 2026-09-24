/* ==========================================================================
   tourist-spots.js — reusable public components
   Cards, Gallery (slider + lightbox + video), Guide (print/download),
   Route planner, Weather, and the full Detail page renderer.
   Everything user-supplied goes through U.esc() / U.rich() / U.safeUrl().
   ========================================================================== */
(function () {
  const EB = window.EB, U = EB.Util, I = EB.Icons;
  const imgOf = (s) => EB.Art.resolve(s.mainImage || EB.Art.forCategory(s.category));
  const locOf = (s) => s.district + ', ' + s.division + ' Division';

  /* ------------------------------------------------------------------ Cards */
  const Cards = (EB.Cards = {
    favBtn(s) {
      const on = EB.Favorites.has(s.id);
      return '<button type="button" class="fav-btn" data-fav="' + U.esc(s.id) + '" aria-pressed="' + on + '" aria-label="Favorite ' + U.esc(s.name) + '">' + I.heart + '</button>';
    },
    card(s) {
      return '<article class="spot-card" data-spot="' + U.esc(s.id) + '">' +
        '<a class="spot-card__media" href="' + U.detailsUrl(s.id) + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + imgOf(s) + '" alt="' + U.esc(s.name + ', ' + s.district) + '" loading="lazy" width="800" height="520">' +
        '<span class="badge-eb badge-eb--cat">' + U.esc(s.category) + '</span></a>' + Cards.favBtn(s) +
        '<div class="spot-card__body">' +
        '<h3 class="spot-card__title"><a href="' + U.detailsUrl(s.id) + '">' + U.esc(s.name) + '</a></h3>' +
        '<p class="loc">' + I.pin + '<span>' + U.esc(locOf(s)) + '</span></p>' +
        '<p class="spot-card__desc">' + U.esc(U.trunc(s.description, 118)) + '</p>' +
        '<p><span class="badge-eb badge-eb--time">Best time: ' + U.esc(s.bestTime) + '</span></p>' +
        '<div class="spot-card__actions">' +
        '<a class="eb-btn eb-btn--primary sm" href="' + U.detailsUrl(s.id) + '">View Details</a>' +
        '<a class="eb-btn eb-btn--ghost sm" href="' + U.mapUrl(s.id) + '">View Map</a>' +
        '<a class="eb-btn eb-btn--ghost sm" href="' + U.gmapsDir(s.latitude, s.longitude) + '" target="_blank" rel="noopener">Get Directions<span class="sr-only"> (opens Google Maps)</span></a>' +
        '</div></div></article>';
    },
    empty(msg) {
      return '<div class="empty-state"><p><strong>' + U.esc(msg || 'No tourist spots found for this location.') + '</strong></p><p class="muted">Try another district or clear the filters.</p></div>';
    },
    grid(container, spots, msg) {
      if (!container) return;
      container.innerHTML = spots.length ? spots.map(Cards.card).join('') : Cards.empty(msg);
    },
    bindFavorites() {
      if (Cards._bound) return; Cards._bound = true;
      document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-fav]');
        if (!b) return;
        e.preventDefault();
        const id = b.getAttribute('data-fav');
        const before = EB.Favorites.has(id);
        const on = EB.Favorites.toggle(id);
        U.qsa('[data-fav]').filter((x) => x.getAttribute('data-fav') === id).forEach((x) => x.setAttribute('aria-pressed', String(on)));
        if (on === before) U.toast('Could not save your like. Browser storage is full.', 'error');
        else U.toast(on ? 'You liked this spot.' : 'Like removed.', 'info');
        EB.Refresh.run('favorites');
      });
    }
  });

  /* ---------------------------------------------------------------- Gallery */
  const Gallery = (EB.Gallery = {
    items(spot) {
      const imgs = [spot.mainImage || EB.Art.forCategory(spot.category)].concat(spot.images || []);
      const list = imgs.map((src, i) => ({ type: 'img', src: EB.Art.resolve(src), alt: spot.name + ' photo ' + (i + 1) }));
      const v = U.videoInfo(spot.video);
      if (v) list.push({ type: 'video', v, src: EB.Art.resolve(imgs[0]), alt: 'Video of ' + spot.name });
      return list;
    },
    stage(it) {
      if (it.type === 'img') return '<img src="' + it.src + '" alt="' + U.esc(it.alt) + '" class="gallery__img">';
      if (it.v.kind === 'youtube')
        return '<iframe class="gallery__video" src="' + U.esc(it.v.src) + '" title="' + U.esc(it.alt) + '" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
      return '<video class="gallery__video" controls playsinline preload="metadata" src="' + U.esc(it.v.src) + '" aria-label="' + U.esc(it.alt) + '"></video>';
    },
    mount(el, spot) {
      const items = Gallery.items(spot); let idx = 0;
      el.classList.add('gallery');
      el.innerHTML = '<div class="gallery__stage"></div>' +
        '<button type="button" class="gallery__nav gallery__nav--prev" aria-label="Previous">' + I.left + '</button>' +
        '<button type="button" class="gallery__nav gallery__nav--next" aria-label="Next">' + I.right + '</button>' +
        '<button type="button" class="gallery__zoom" aria-label="Open full-screen viewer">' + I.expand + '</button>' +
        '<div class="gallery__count" aria-live="polite"></div>' +
        '<div class="gallery__thumbs" role="tablist" aria-label="Photos and video">' +
        items.map((it, i) => '<button type="button" role="tab" class="gallery__thumb" data-i="' + i + '" aria-label="' + (it.type === 'video' ? 'Play video' : 'Photo ' + (i + 1)) + '"><img src="' + it.src + '" alt="" loading="lazy">' + (it.type === 'video' ? '<span class="gallery__play">' + I.play + '</span>' : '') + '</button>').join('') +
        '</div>' + (spot.video && !U.videoInfo(spot.video) ? '<p class="muted small">The video link could not be played.</p>' : (!spot.video ? '<p class="muted small gallery__note">No video has been added for this spot yet.</p>' : ''));
      const stage = el.querySelector('.gallery__stage'), count = el.querySelector('.gallery__count');
      const thumbs = U.qsa('.gallery__thumb', el);
      const show = (i) => {
        idx = (i + items.length) % items.length;
        stage.innerHTML = Gallery.stage(items[idx]);
        count.textContent = (idx + 1) + ' / ' + items.length;
        thumbs.forEach((t, n) => { t.setAttribute('aria-selected', String(n === idx)); t.classList.toggle('active', n === idx); });
        el.classList.toggle('is-video', items[idx].type === 'video');
        const zoom = el.querySelector('.gallery__zoom'); zoom.hidden = items[idx].type === 'video';
      };
      el.querySelector('.gallery__nav--prev').onclick = () => show(idx - 1);
      el.querySelector('.gallery__nav--next').onclick = () => show(idx + 1);
      thumbs.forEach((t) => (t.onclick = () => show(+t.dataset.i)));
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-roledescription', 'carousel');
      el.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
      el.querySelector('.gallery__zoom').onclick = () => Gallery.lightbox(items.filter((x) => x.type === 'img'), Math.min(idx, items.filter((x) => x.type === 'img').length - 1));
      stage.addEventListener('click', (e) => { if (e.target.classList.contains('gallery__img')) el.querySelector('.gallery__zoom').click(); });
      show(0);
    },
    lightbox(imgs, start) {
      let i = start || 0;
      const m = U.modal('<div class="lightbox"><button type="button" class="lightbox__btn lightbox__close" data-close aria-label="Close viewer" data-autofocus>' + I.close + '</button>' +
        '<button type="button" class="lightbox__btn lightbox__full" aria-label="Toggle full screen">' + I.expand + '</button>' +
        '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous photo">' + I.left + '</button>' +
        '<img alt=""><button type="button" class="lightbox__btn lightbox__next" aria-label="Next photo">' + I.right + '</button></div>', { label: 'Photo viewer' });
      m.wrap.classList.add('eb-modal--dark');
      const img = m.el.querySelector('img');
      const set = (n) => { i = (n + imgs.length) % imgs.length; img.src = imgs[i].src; img.alt = imgs[i].alt; };
      m.el.querySelector('.lightbox__prev').onclick = () => set(i - 1);
      m.el.querySelector('.lightbox__next').onclick = () => set(i + 1);
      m.el.querySelector('.lightbox__full').onclick = () => {
        const t = m.el; if (document.fullscreenElement) document.exitFullscreen(); else if (t.requestFullscreen) t.requestFullscreen().catch(() => {});
      };
      m.el.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') set(i - 1); if (e.key === 'ArrowRight') set(i + 1); });
      set(i);
    }
  });

  /* ------------------------------------------------- Printable / downloadable guide */
  const Guide = (EB.Guide = {
    html(s) {
      const g = s.travelGuide, sec = (t, body) => (body ? '<h2>' + U.esc(t) + '</h2>' + body : '');
      return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + U.esc(s.name) + ' – Travel Guide</title>' +
        '<style>body{font:15px/1.6 Georgia,serif;max-width:760px;margin:32px auto;padding:0 20px;color:#111}h1{margin:0 0 4px;font-size:30px}h2{font-size:18px;margin:22px 0 6px;border-bottom:1px solid #999;padding-bottom:3px}' +
        '.meta{color:#444;margin:0 0 14px}table{border-collapse:collapse;width:100%}td{padding:4px 8px 4px 0;vertical-align:top}td:first-child{width:170px;font-weight:bold}ul{margin:4px 0 8px 20px}footer{margin-top:28px;font-size:12px;color:#555;border-top:1px solid #999;padding-top:8px}' +
        '@media print{body{margin:0}}</style></head><body>' +
        '<h1>' + U.esc(s.name) + '</h1><p class="meta">' + U.esc(locOf(s)) + ' | ' + U.esc(s.category) + '</p>' +
        sec('Description', U.rich(s.description)) +
        sec('Location and map', '<table><tr><td>Coordinates</td><td>' + U.fmtCoord(s.latitude) + ', ' + U.fmtCoord(s.longitude) + '</td></tr>' +
          '<tr><td>Google Maps</td><td>' + U.esc(U.gmapsView(s.latitude, s.longitude)) + '</td></tr>' +
          '<tr><td>OpenStreetMap</td><td>' + U.esc('https://www.openstreetmap.org/?mlat=' + s.latitude + '&mlon=' + s.longitude + '#map=13/' + s.latitude + '/' + s.longitude) + '</td></tr></table>') +
        sec('Best time to visit', '<p><strong>' + U.esc(s.bestTime) + '.</strong> ' + U.esc(s.bestTimeNote) + '</p>') +
        sec('Visiting information', '<table><tr><td>Opening / closing</td><td>' + U.esc(s.hours || 'Not listed') + '</td></tr><tr><td>Entry fee</td><td>' + U.esc(s.entryFee || 'Not listed') + '</td></tr></table>') +
        sec('How to get there', '<table><tr><td>Distance</td><td>' + U.esc(g.distance) + '</td></tr><tr><td>Travel time</td><td>' + U.esc(g.travelTime) + '</td></tr><tr><td>Recommended route</td><td>' + U.esc(g.route) + '</td></tr></table>') +
        sec('Full tour guide (from Dhaka and back, estimated cost)', U.rich(EB.Spots.guideText(s))) +
        sec('Important instructions', U.rich(g.instructions)) +
        sec('Safety and travel tips', s.safetyTips.length ? '<ul>' + s.safetyTips.map((t) => '<li>' + U.esc(t) + '</li>').join('') + '</ul>' : '') +
        sec('Emergency numbers', '<ul>' + EB.EMERGENCY.map((e) => '<li>' + U.esc(e.label) + ': <strong>' + U.esc(e.number) + '</strong> (' + U.esc(e.note) + ')</li>').join('') + '</ul>') +
        '<footer>Generated by Explore Bangladesh on ' + U.esc(new Date().toLocaleDateString()) + '. Schedules, fares and access rules change; confirm before you travel.</footer></body></html>';
    },
    print(s) {
      const w = window.open('', '_blank');
      if (!w) { U.toast('Pop-ups are blocked. Allow pop-ups to print the guide.', 'error'); return; }
      w.document.write(Guide.html(s)); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch (e) { /* user can print manually */ } }, 350);
    },
    download(s) {
      const blob = new Blob([Guide.html(s)], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'travel-guide-' + (U.slug(s.name) || s.id) + '.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      U.toast('Travel guide downloaded. Open it and choose Print to save as PDF.', 'info', 5200);
    },
    async share(s) {
      const url = location.origin && location.origin !== 'null' ? U.detailsUrl(s.id) : location.href;
      const data = { title: s.name + ' – Explore Bangladesh', text: U.trunc(s.description, 120), url: new URL(url, location.href).href };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        if (navigator.clipboard) { await navigator.clipboard.writeText(data.url); U.toast('Link copied to clipboard.', 'info'); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      window.prompt('Copy this link:', data.url);
    }
  });

  /* ------------------------------------------------------------- Route planner */
  const CITIES = { 'Dhaka': [23.8103, 90.4125], 'Chattogram': [22.3569, 91.7832], 'Sylhet': [24.8949, 91.8687], 'Khulna': [22.8456, 89.5403], 'Rajshahi': [24.3745, 88.6042], 'Barishal': [22.701, 90.3535], 'Rangpur': [25.7439, 89.2752], 'Mymensingh': [24.7471, 90.4203] };
  const Route = (EB.Route = {
    mount(root, spot) {
      root.innerHTML =
        '<form class="route-form" novalidate><div class="row g-3 align-items-end">' +
        '<div class="col-md-5"><label for="route-from" class="form-label">Starting location</label><input id="route-from" class="form-control" list="route-cities" value="Dhaka" autocomplete="off" placeholder="e.g. Dhaka or a place name"><datalist id="route-cities">' + Object.keys(CITIES).map((c) => '<option value="' + c + '">').join('') + '</datalist></div>' +
        '<div class="col-md-3"><label for="route-mode" class="form-label">Travel mode</label><select id="route-mode" class="form-select"><option value="driving">Driving</option><option value="transit">Public transport</option><option value="walking">Walking</option></select></div>' +
        '<div class="col-md-4 d-flex gap-2 flex-wrap"><button type="submit" class="eb-btn eb-btn--primary">Show route</button><a class="eb-btn eb-btn--ghost" data-gdir target="_blank" rel="noopener">Get Directions<span class="sr-only"> (opens Google Maps)</span></a></div></div></form>' +
        '<div class="map-frame map-embed route-embed" hidden><iframe title="Route to ' + U.esc(spot.name) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>' +
        '<p class="route-result" role="status" aria-live="polite"></p>';
      const from = root.querySelector('#route-from'), mode = root.querySelector('#route-mode'), out = root.querySelector('.route-result'), link = root.querySelector('[data-gdir]');
      const box = root.querySelector('.route-embed'), frame = box.querySelector('iframe');
      const setLink = () => { link.href = U.gmapsDir(spot.latitude, spot.longitude, from.value.trim(), mode.value); };
      from.addEventListener('input', setLink); mode.addEventListener('change', setLink); setLink();
      root.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = from.value.trim();
        if (!name) { out.textContent = 'Enter a starting location.'; return; }
        frame.src = EB.Map.embedDirections(spot, name, mode.value);
        box.hidden = false;
        out.textContent = 'Route shown in Google Maps above. Open Get Directions for live traffic and step-by-step guidance.';
        if (mode.value !== 'driving') return;
        // driving distance and time estimate (public OSRM server; optional extra)
        let start = CITIES[Object.keys(CITIES).find((c) => U.norm(c) === U.norm(name))];
        if (!start) { const g = await EB.Map.geocode(name); if (g) start = [g.lat, g.lng]; }
        if (!start) return;
        try {
          const r = await fetch('https://router.project-osrm.org/route/v1/driving/' + start[1] + ',' + start[0] + ';' + spot.longitude + ',' + spot.latitude + '?overview=false');
          const j = await r.json(), rt = j.routes && j.routes[0];
          if (!rt) return;
          const km = Math.round(rt.distance / 1000), mins = Math.round(rt.duration / 60);
          out.textContent = 'About ' + km + ' km, roughly ' + Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min by road without traffic. Bridges, ferries and traffic can change this; use Get Directions for live conditions.';
        } catch (err) { /* keep the generic message */ }
      });
    }
  });

  /* ------------------------------------------------------------------ Weather */
  const WMO = { 0: ['Clear sky', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'], 45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌦️'], 61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'], 80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '⛈️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm', '⛈️'], 99: ['Thunderstorm', '⛈️'] };
  EB.Weather = {
    // Open-Meteo needs no API key, so nothing secret ships in this folder
    async load(spot, el) {
      el.innerHTML = '<p class="muted">Loading current weather…</p>';
      try {
        const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + spot.latitude + '&longitude=' + spot.longitude + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto');
        if (!r.ok) throw new Error('bad');
        const c = (await r.json()).current;
        const w = WMO[c.weather_code] || ['Current conditions', '🌡️'];
        el.innerHTML = '<div class="weather"><span class="weather__icon" aria-hidden="true">' + w[1] + '</span><div><p class="weather__temp">' + Math.round(c.temperature_2m) + '°C <span>' + U.esc(w[0]) + '</span></p>' +
          '<p class="muted small">Humidity ' + Math.round(c.relative_humidity_2m) + '%, wind ' + Math.round(c.wind_speed_10m) + ' km/h</p></div></div>';
      } catch (e) { el.innerHTML = '<p class="muted">Weather is unavailable right now. Check a forecast before you travel.</p>'; }
    }
  };

  /* ------------------------------------------------------------ Detail page */
  const Detail = (EB.Detail = {
    notFound(container) {
      document.title = 'Tourist spot not found – Explore Bangladesh';
      container.innerHTML = '<div class="container section"><div class="empty-state empty-state--lg"><h1 class="h2">Tourist spot not found.</h1>' +
        '<p class="muted">This place may have been removed or the link is incorrect.</p>' +
        '<a class="eb-btn eb-btn--primary" href="' + EB.base + 'tourist-spots.html">Browse tourist spots</a></div></div>';
    },
    seo(s) {
      document.title = s.name + ' – ' + s.district + ', ' + s.division + ' | Explore Bangladesh';
      const set = (sel, attr, val) => { const m = document.querySelector(sel); if (m) m.setAttribute(attr, val); };
      set('meta[name="description"]', 'content', U.trunc(s.description, 155));
      set('meta[property="og:title"]', 'content', s.name + ' – Explore Bangladesh');
      set('meta[property="og:description"]', 'content', U.trunc(s.description, 155));
      const ld = document.getElementById('ld-json') || Object.assign(document.createElement('script'), { id: 'ld-json', type: 'application/ld+json' });
      ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'TouristAttraction', name: s.name, description: U.trunc(s.description, 300),
        geo: { '@type': 'GeoCoordinates', latitude: s.latitude, longitude: s.longitude }, address: { '@type': 'PostalAddress', addressLocality: s.district, addressRegion: s.division, addressCountry: 'BD' } }).replace(/</g, '\\u003c');
      document.head.appendChild(ld);
    },
    render(container, s) {
      Detail.seo(s);
      const g = s.travelGuide;
      const fact = (k, v) => (v ? '<div><dt>' + k + '</dt><dd>' + U.esc(v) + '</dd></div>' : '');
      const block = (title, body) => (body ? '<section class="prose-block"><h2>' + title + '</h2>' + body + '</section>' : '');
      const guideHtml = EB.Spots.guideText(s).trim() ? U.rich(EB.Spots.guideText(s)) : '<p class="muted">No tour guide has been added for this spot yet.</p>';
      const near = EB.Spots.nearby(s, 4);

      container.innerHTML =
        '<div class="container detail-head">' +
        '<nav aria-label="Breadcrumb" class="crumbs"><a href="' + EB.base + 'index.html">Home</a><span aria-hidden="true">/</span><a href="' + EB.base + 'tourist-spots.html">Tourist Spots</a><span aria-hidden="true">/</span><span aria-current="page">' + U.esc(s.name) + '</span></nav>' +
        '<h1>' + U.esc(s.name) + '</h1>' +
        '<p class="loc loc--lg">' + I.pin + '<span>' + U.esc(locOf(s)) + '</span></p>' +
        '<p class="badges"><span class="badge-eb badge-eb--cat">' + U.esc(s.category) + '</span><span class="badge-eb badge-eb--time">Best time: ' + U.esc(s.bestTime) + '</span></p>' +
        '<div class="action-row">' +
        '<button type="button" class="eb-btn eb-btn--ghost fav-inline" data-fav="' + U.esc(s.id) + '" aria-pressed="' + EB.Favorites.has(s.id) + '">' + I.heart + '<span>Favorite</span></button>' +
        '<button type="button" class="eb-btn eb-btn--ghost" data-act="share">' + I.share + '<span>Share Tourist Spot</span></button>' +
        '<button type="button" class="eb-btn eb-btn--ghost" data-act="print">' + I.print + '<span>Print Travel Guide</span></button>' +
        '<button type="button" class="eb-btn eb-btn--ghost" data-act="download">' + I.download + '<span>Download Travel Guide</span></button>' +
        '<a class="eb-btn eb-btn--primary" href="' + U.gmapsView(s.latitude, s.longitude) + '" target="_blank" rel="noopener">' + I.external + '<span>View Location on Google Maps</span></a></div></div>' +

        '<div class="container"><div class="row g-4 detail-cols">' +
        '<div class="col-lg-6 order-2 order-lg-1 detail-info">' +
        block('About this place', U.rich(s.description)) + block('History', U.rich(s.history)) + block('Why visit', U.rich(s.whyVisit)) +
        '<section class="prose-block"><h2>Visitor information</h2><dl class="facts">' +
        fact('Best time to visit', s.bestTime + (s.bestTimeNote ? ': ' + s.bestTimeNote : '')) + fact('Opening / closing', s.hours) + fact('Entry fee', s.entryFee) +
        fact('Coordinates', U.fmtCoord(s.latitude) + ', ' + U.fmtCoord(s.longitude)) + '</dl></section>' +
        (s.safetyTips.length ? '<section class="prose-block"><h2>Safety and travel tips</h2><ul>' + s.safetyTips.map((t) => '<li>' + U.esc(t) + '</li>').join('') + '</ul></section>' : '') +
        '</div>' +
        '<div class="col-lg-6 order-1 order-lg-2"><div class="detail-media"><div id="gallery"></div></div></div></div></div>' +

        '<div class="container section" id="location"><div class="section-head"><h2>Tourist Spot Location</h2><p class="muted">Latitude ' + U.fmtCoord(s.latitude) + ', longitude ' + U.fmtCoord(s.longitude) + '. The pin marks the exact location.</p></div>' +
        '<div class="map-frame map-embed"><iframe id="spot-map" title="Google Map showing ' + U.esc(s.name) + '" src="' + EB.Map.embedUrl(s) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>' +
        '<p class="map-fail-msg" id="spot-map-fail" role="alert" hidden><strong>Map could not be loaded. Please try again.</strong> <button type="button" class="eb-btn eb-btn--ghost sm" id="spot-map-retry">Try again</button></p>' +
        '<p class="mt-3"><a class="eb-btn eb-btn--primary" href="' + U.gmapsView(s.latitude, s.longitude) + '" target="_blank" rel="noopener">' + I.external + '<span>View Location on Google Maps</span></a></p></div>' +

        '<div class="container section" id="how-to-get-there"><div class="section-head"><h2>How to Get There</h2><p class="muted">Directions from Dhaka. Timings are estimates.</p></div>' +
        '<div class="row g-3 stat-row"><div class="col-md-4"><div class="stat-tile"><span>Estimated distance</span><strong>' + U.esc(g.distance || 'Not listed') + '</strong></div></div>' +
        '<div class="col-md-4"><div class="stat-tile"><span>Estimated travel time</span><strong>' + U.esc(g.travelTime || 'Not listed') + '</strong></div></div>' +
        '<div class="col-md-4"><div class="stat-tile"><span>Recommended route</span><strong>' + U.esc(g.route || 'Not listed') + '</strong></div></div></div>' +
        '<div class="prose-block tour-guide"><h3 class="h5">Full tour guide: Dhaka to ' + U.esc(s.name) + ' and back, with estimated cost</h3>' + guideHtml + '</div>' +
        (g.instructions ? '<div class="notice"><strong>Important instructions</strong>' + U.rich(g.instructions) + '</div>' : '') + '</div>' +

        '<div class="container section" id="route"><div class="section-head"><h2>Route Map</h2><p class="muted">Choose where you are starting. The destination is ' + U.esc(s.name) + '.</p></div><div id="route-box"></div></div>' +

        '<div class="container section"><div class="row g-4"><div class="col-lg-6"><div class="info-card"><h2 class="h4">Weather now</h2><div id="weather"></div></div></div>' +
        '<div class="col-lg-6"><div class="info-card"><h2 class="h4">Emergency information</h2><ul class="emergency">' +
        EB.EMERGENCY.map((e) => '<li><span>' + U.esc(e.label) + '</span><a href="tel:' + U.esc(e.number) + '"><strong>' + U.esc(e.number) + '</strong></a><small>' + U.esc(e.note) + '</small></li>').join('') + '</ul></div></div></div></div>' +

        '<div class="container section" id="nearby"><div class="section-head"><h2>Nearby Tourist Attractions</h2><p class="muted">Distances are straight-line estimates. Tick the places you want to include and plan one trip.</p></div>' +
        (near.length ? '<div class="row g-4">' + near.map((o) =>
          '<div class="col-sm-6 col-lg-3"><article class="mini-card"><a href="' + U.detailsUrl(o.spot.id) + '" class="mini-card__media"><img src="' + imgOf(o.spot) + '" alt="' + U.esc(o.spot.name) + '" loading="lazy"></a>' +
          '<div class="mini-card__body"><h3><a href="' + U.detailsUrl(o.spot.id) + '">' + U.esc(o.spot.name) + '</a></h3><p class="loc">' + U.esc(o.spot.district) + '</p><p class="muted small">About ' + Math.round(o.km) + ' km away</p>' +
          '<label class="check"><input type="checkbox" data-trip="' + U.esc(o.spot.id) + '"> Add to trip</label><a class="eb-btn eb-btn--ghost sm" href="' + U.detailsUrl(o.spot.id) + '">View Details</a></div></article></div>').join('') + '</div>' +
          '<p class="mt-4"><a class="eb-btn eb-btn--primary" id="plan-trip" href="#" target="_blank" rel="noopener" aria-disabled="true">Plan a trip in Google Maps</a> <span class="muted small" id="trip-hint">Tick at least one nearby place.</span></p>'
          : '<p class="muted">No nearby tourist attractions are listed yet.</p>') + '</div>';

      Gallery.mount(container.querySelector('#gallery'), s);
      Route.mount(container.querySelector('#route-box'), s);
      const frame = container.querySelector('#spot-map'), fail = container.querySelector('#spot-map-fail');
      let loaded = false;
      frame.addEventListener('load', () => { loaded = true; fail.hidden = true; });
      const showFail = () => { if (!loaded) fail.hidden = false; };
      window.addEventListener('offline', showFail, { once: true });
      setTimeout(showFail, 20000);
      container.querySelector('#spot-map-retry').onclick = () => { fail.hidden = true; loaded = false; frame.src = EB.Map.embedUrl(s); };
      EB.Weather.load(s, container.querySelector('#weather'));

      // actions
      container.querySelector('[data-act="share"]').onclick = () => Guide.share(s);
      container.querySelector('[data-act="print"]').onclick = () => Guide.print(s);
      container.querySelector('[data-act="download"]').onclick = () => Guide.download(s);

      // multi-stop trip planner
      const plan = container.querySelector('#plan-trip');
      if (plan) {
        const upd = () => {
          const chosen = U.qsa('[data-trip]:checked', container).map((c) => EB.Spots.get(c.dataset.trip)).filter(Boolean);
          if (!chosen.length) { plan.href = '#'; plan.setAttribute('aria-disabled', 'true'); return; }
          const last = chosen[chosen.length - 1], mid = chosen.slice(0, -1);
          plan.href = 'https://www.google.com/maps/dir/?api=1&origin=' + s.latitude + ',' + s.longitude + '&destination=' + last.latitude + ',' + last.longitude +
            (mid.length ? '&waypoints=' + mid.map((m) => m.latitude + ',' + m.longitude).join('%7C') : '') + '&travelmode=driving';
          plan.setAttribute('aria-disabled', 'false');
          container.querySelector('#trip-hint').textContent = 'Starts at ' + s.name + ' and visits ' + U.plural(chosen.length, 'stop') + '.';
        };
        U.qsa('[data-trip]', container).forEach((c) => c.addEventListener('change', upd));
        plan.addEventListener('click', (e) => { if (plan.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
      }
    }
  });
})();
