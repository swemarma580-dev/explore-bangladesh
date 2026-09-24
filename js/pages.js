/* ==========================================================================
   pages.js — one small controller per public page
   Each page registers a render function with EB.Refresh, so when a tourist
   spot is added, edited or deleted (here or in another tab) every visible
   list, count, map marker and detail view redraws from the live data.
   ========================================================================== */
(function () {
  const EB = window.EB, U = EB.Util, I = EB.Icons;
  const $ = (s, r) => U.qs(s, r);
  const P = (EB.Pages = {});

  /* ---------- shared helpers ---------- */
  const divByParam = (v) => EB.DIVISIONS.find((d) => d.id === v || U.norm(d.name) === U.norm(v)) || null;
  const fillOptions = (sel, values, placeholder, current) => {
    sel.innerHTML = '<option value="">' + U.esc(placeholder) + '</option>' + values.map((v) => '<option value="' + U.esc(v) + '"' + (v === current ? ' selected' : '') + '>' + U.esc(v) + '</option>').join('');
  };
  const districtsFor = (divName) => {
    if (divName) { const d = divByParam(divName); return d ? d.districts : []; }
    return EB.DIVISIONS.flatMap((d) => d.districts).sort();
  };
  /* Dynamic Division -> District dropdown pair */
  const linkSelects = (divSel, disSel, onChange, init) => {
    init = init || {};
    const phDiv = divSel.dataset.ph || 'Select Division', phDis = disSel.dataset.ph || 'Select District';
    fillOptions(divSel, EB.DIVISIONS.map((d) => d.name), phDiv, init.division);
    fillOptions(disSel, districtsFor(init.division), phDis, init.district);
    divSel.addEventListener('change', () => { fillOptions(disSel, districtsFor(divSel.value), phDis); onChange(); });
    disSel.addEventListener('change', onChange);
  };
  P._u = { fillOptions, districtsFor, linkSelects, divByParam }; // reused by admin.js
  const divisionCard = (d, i) => {
    const spots = EB.Spots.forDivision(d.name).length;
    return '<article class="div-card"><a class="div-card__media" href="' + EB.base + 'divisions.html?division=' + d.id + '" tabindex="-1" aria-hidden="true"><img src="' + EB.Art.uri(d.scene, i % 4) + '" alt="" loading="lazy" width="800" height="520"></a>' +
      '<div class="div-card__body"><h3><a href="' + EB.base + 'divisions.html?division=' + d.id + '">' + U.esc(d.name) + '</a></h3><p class="muted">' + U.esc(d.blurb) + '</p>' +
      '<p class="div-card__stats"><span><strong>' + d.districts.length + '</strong> districts</span><span><strong>' + spots + '</strong> tourist ' + (spots === 1 ? 'spot' : 'spots') + '</span></p>' +
      '<a class="eb-btn eb-btn--primary sm" href="' + EB.base + 'divisions.html?division=' + d.id + '">Explore ' + U.esc(d.name) + '</a></div></article>';
  };
  const sortedByNewest = () => EB.Search.sort(EB.Spots.all(), 'newest');

  /* ------------------------------------------------------------------ HOME */
  P.home = () => {
    const box = $('#hero-search'), list = $('#hero-suggest');
    EB.Search.mount(box, list, { button: $('#hero-search-btn') });
    $('#quick-filters').innerHTML = EB.QUICK_FILTERS.map((f) => '<a class="chip" href="' + EB.base + 'tourist-spots.html?group=' + f.id + '">' + U.esc(f.label) + '</a>').join('');

    /* Popular = the 12 most liked spots (ranking only, counts are never shown).
       If fewer than 12 spots have likes yet, fill with featured, then newest spots. */
    const POPULAR_MAX = 12;
    const popularSpots = () => {
      const all = EB.Spots.all(), byId = new Map(all.map((s) => [s.id, s])), out = [], seen = new Set();
      const add = (s) => { if (s && !seen.has(s.id) && out.length < POPULAR_MAX) { seen.add(s.id); out.push(s); } };
      EB.Likes.cachedTop().forEach((id) => add(byId.get(id)));
      all.filter((s) => s.featured).forEach(add);
      EB.Search.sort(all, 'newest').forEach(add);
      return out;
    };

    const render = () => {
      Cards_grid('#popular-grid', popularSpots());
      $('#division-grid').innerHTML = EB.DIVISIONS.map(divisionCard).join('');
      $('#category-chips').innerHTML = EB.CATEGORIES.map((c) => {
        const n = EB.Spots.all().filter((s) => s.category === c.name).length;
        return '<a class="cat-chip" href="' + EB.base + 'tourist-spots.html?category=' + encodeURIComponent(c.name) + '"><span aria-hidden="true">' + c.icon + '</span>' + U.esc(c.name) + '<em>' + n + '</em></a>';
      }).join('');
      const rec = EB.Recent.spots().slice(0, 4);
      $('#recent-section').hidden = !rec.length;
      Cards_grid('#recent-grid', rec);
      $('#hero-count').textContent = U.plural(EB.Spots.all().length, 'destination') + ' across 8 divisions';
    };
    render();
    EB.Likes.top().then(render); // refresh the ranking from the server, then redraw
    EB.Refresh.register('homepage', render);
    EB.Refresh.register('favorites', render);

    // district finder
    const dsel = $('#find-division'), disel = $('#find-district');
    linkSelects(dsel, disel, () => {});
    $('#find-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new URLSearchParams();
      if (dsel.value) q.set('division', dsel.value);
      if (disel.value) q.set('district', disel.value);
      location.href = EB.base + 'districts.html?' + q.toString();
    });
  };
  function Cards_grid(sel, spots) { EB.Cards.grid($(sel), spots); }

  /* --------------------------------------------------------------- EXPLORE */
  P.explore = () => {
    const render = () => {
      $('#category-tiles').innerHTML = EB.CATEGORIES.map((c) => {
        const n = EB.Spots.all().filter((s) => s.category === c.name).length;
        return '<a class="cat-tile" href="' + EB.base + 'tourist-spots.html?category=' + encodeURIComponent(c.name) + '"><img src="' + EB.Art.uri(c.scene, 0) + '" alt="" loading="lazy"><span class="cat-tile__label"><span aria-hidden="true">' + c.icon + '</span> ' + U.esc(c.name) + '<small>' + U.plural(n, 'spot') + '</small></span></a>';
      }).join('');
      Cards_grid('#top-picks', EB.Spots.all().filter((s) => s.featured).slice(0, 4));
      const rec = EB.Recent.spots();
      $('#recent-section').hidden = !rec.length;
      Cards_grid('#recent-grid', rec.slice(0, 4));
    };
    render();
    EB.Refresh.register('explore', render);
    EB.Refresh.register('favorites', render);
  };

  /* ------------------------------------------------------------- DIVISIONS */
  P.divisions = () => {
    const render = () => {
      const cur = divByParam(U.param('division') || '');
      $('#division-grid').innerHTML = EB.DIVISIONS.map(divisionCard).join('');
      const panel = $('#division-detail');
      if (!cur) { panel.hidden = true; return; }
      panel.hidden = false;
      const spots = EB.Spots.forDivision(cur.name);
      $('#division-title').textContent = cur.name + ' Division';
      $('#division-blurb').textContent = cur.blurb;
      $('#district-grid').innerHTML = cur.districts.map((dn) => {
        const n = EB.Spots.forDistrict(dn).filter((s) => s.division === cur.name).length;
        return '<a class="district-tile' + (n ? '' : ' is-empty') + '" href="' + EB.base + 'districts.html?division=' + encodeURIComponent(cur.name) + '&district=' + encodeURIComponent(dn) + '"><strong>' + U.esc(dn) + '</strong><span>' + U.plural(n, 'spot') + '</span></a>';
      }).join('');
      $('#division-spots-title').textContent = 'Tourist spots in ' + cur.name;
      Cards_grid('#division-spots', spots);
    };
    render();
    EB.Refresh.register('divisions', render);
    EB.Refresh.register('favorites', render);
    if (U.param('division')) setTimeout(() => { const p = $('#division-detail'); if (p && !p.hidden) p.scrollIntoView({ behavior: 'smooth' }); }, 200);
  };

  /* ------------------------------------------------------------- DISTRICTS */
  P.districts = () => {
    const dsel = $('#sel-division'), disel = $('#sel-district');
    const d0 = divByParam(U.param('division') || '');
    let dis0 = U.param('district') || '';
    if (dis0 && !d0) { const owner = EB.DIVISIONS.find((d) => d.districts.includes(dis0)); if (owner) { dsel.dataset.init = owner.name; } }
    const init = { division: d0 ? d0.name : dsel.dataset.init || '', district: dis0 };
    const render = () => {
      const division = dsel.value, district = disel.value;
      const spots = EB.Search.filter({ division, district, sort: 'name' });
      $('#district-title').textContent = district ? 'Tourist spots in ' + district : division ? 'Tourist spots in ' + division + ' Division' : 'All tourist spots';
      $('#district-count').textContent = U.plural(spots.length, 'tourist spot') + ' found';
      EB.Cards.grid($('#district-results'), spots, 'No tourist spots found for this location.');
    };
    linkSelects(dsel, disel, render, init);
    render();
    EB.Refresh.register('districts', render);
    EB.Refresh.register('favorites', render);
  };

  /* ---------------------------------------------------------- TOURIST SPOTS */
  P.spots = () => {
    const q = $('#f-q'), dv = $('#f-division'), ds = $('#f-district'), ct = $('#f-category'), bt = $('#f-best'), so = $('#f-sort');
    const group = EB.QUICK_FILTERS.find((g) => g.id === U.param('group'));
    let view = 'all';
    q.value = U.param('q') || '';
    const d0 = divByParam(U.param('division') || '');
    fillOptions(ct, EB.CATEGORIES.map((c) => c.name), 'All categories', U.param('category') || '');
    fillOptions(bt, EB.BEST_TIMES, 'Any season', '');
    linkSelects(dv, ds, render, { division: d0 ? d0.name : '', district: U.param('district') || '' });
    [q, ct, bt, so].forEach((el) => el.addEventListener(el === q ? 'input' : 'change', el === q ? U.debounce(render, 150) : render));
    U.qsa('[data-view]').forEach((b) => b.addEventListener('click', () => {
      view = b.dataset.view;
      U.qsa('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    $('#f-reset').addEventListener('click', () => {
      q.value = ''; dv.value = ''; fillOptions(ds, districtsFor(''), 'All districts'); ct.value = ''; bt.value = ''; so.value = 'name'; render();
      history.replaceState(null, '', location.pathname);
    });
    function render() {
      const spots = EB.Search.filter({ q: q.value, division: dv.value, district: ds.value, category: ct.value, bestTime: bt.value, sort: so.value, favoritesOnly: view === 'favorites', categories: group && !ct.value ? group.categories : null });
      $('#result-count').textContent = U.plural(spots.length, 'tourist spot') + (view === 'favorites' ? ' in your favorites' : ' found') + (group && !ct.value ? ' (' + group.label + ')' : '');
      EB.Cards.grid($('#spots-grid'), spots, view === 'favorites' ? 'You have no favorites yet.' : 'No tourist spots found for this location.');
    }
    render();
    EB.Refresh.register('spots', render);
    EB.Refresh.register('favorites', render);
  };

  /* --------------------------------------------------------------- DETAILS */
  P.details = () => {
    const root = $('#detail-root');
    const draw = () => {
      const id = U.param('id');
      const s = id ? EB.Spots.get(id) : null;
      if (!s) { EB.Detail.notFound(root); return; }
      EB.Recent.add(s.id);
      EB.Detail.render(root, s);
    };
    draw();
    EB.Refresh.register('detail', draw);
  };

  /* ------------------------------------------------------------------- MAP */
  /* All spots on one interactive map; picking one shows its exact place in Google Maps below. */
  P.map = () => {
    const dsel = $('#m-division'), disel = $('#m-district'), csel = $('#m-category');
    fillOptions(csel, EB.CATEGORIES.map((c) => c.name), 'All categories', '');
    const map = EB.Map.create($('#big-map'), { zoom: 7 });
    let markers = null, first = true, selectedId = null;
    const panel = $('#sel-panel'), frame = $('#sel-frame');

    const select = (spot, scroll) => {
      selectedId = spot.id;
      const cur = new URL(location.href); cur.searchParams.set('spot', spot.id); history.replaceState(null, '', cur.pathname + cur.search);
      panel.hidden = false;
      frame.src = EB.Map.embedUrl(spot, 14);
      frame.title = 'Google Map showing ' + spot.name;
      $('#sel-title').textContent = spot.name;
      $('#sel-info').innerHTML = '<p class="loc">' + I.pin + '<span>' + U.esc(spot.district + ', ' + spot.division + ' Division') + '</span></p>' +
        '<p>' + U.esc(U.trunc(spot.description, 170)) + '</p>' +
        '<p class="muted small">Latitude ' + U.fmtCoord(spot.latitude) + ', longitude ' + U.fmtCoord(spot.longitude) + '</p>' +
        '<div class="d-flex gap-2 flex-wrap"><a class="eb-btn eb-btn--primary sm" href="' + U.detailsUrl(spot.id) + '">View Details</a>' +
        '<a class="eb-btn eb-btn--ghost sm" href="' + U.gmapsView(spot.latitude, spot.longitude) + '" target="_blank" rel="noopener">View Location on Google Maps</a>' +
        '<a class="eb-btn eb-btn--ghost sm" href="' + U.gmapsDir(spot.latitude, spot.longitude) + '" target="_blank" rel="noopener">Get Directions</a></div>';
      if (scroll) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const clearSelection = () => { selectedId = null; panel.hidden = true; frame.removeAttribute('src'); };

    const render = () => {
      const spots = EB.Search.filter({ division: dsel.value, district: disel.value, category: csel.value, sort: 'name' });
      $('#m-count').textContent = U.plural(spots.length, 'tourist spot') + ' on the map';
      $('#m-list').innerHTML = spots.length ? spots.map((s) => '<li><button type="button" data-focus="' + U.esc(s.id) + '"><strong>' + U.esc(s.name) + '</strong><span>' + U.esc(s.district + ', ' + s.division) + '</span></button></li>').join('') : '<li class="muted">No tourist spots found for this location.</li>';
      if (selectedId && !EB.Spots.get(selectedId)) clearSelection(); // deleted spots vanish here too
      if (map) {
        markers = EB.Map.showSpots(map, spots, markers, select);
        if (first && selectedId && markers.byId[selectedId]) { EB.Map.fit(map, spots); EB.Map.openMarker(map, markers, EB.Spots.get(selectedId)); }
        else EB.Map.fit(map, spots);
      }
      first = false;
    };
    const focusId = U.param('spot');
    if (focusId && EB.Spots.get(focusId)) { select(EB.Spots.get(focusId), false); }
    linkSelects(dsel, disel, () => { first = false; render(); });
    csel.addEventListener('change', () => { first = false; render(); });
    $('#m-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-focus]'); if (!b) return;
      const s = EB.Spots.get(b.dataset.focus); if (!s) return;
      if (map && markers) EB.Map.openMarker(map, markers, s);
      select(s, true);
    });
    if (map) map.on('popupopen', (e) => {
      const b = e.popup.getElement() && e.popup.getElement().querySelector('[data-select]');
      if (b) b.addEventListener('click', () => { const s = EB.Spots.get(b.dataset.select); if (s) select(s, true); });
    });
    $('#sel-back').addEventListener('click', () => $('#big-map').scrollIntoView({ behavior: 'smooth', block: 'center' }));
    render();
    EB.Refresh.register('map', render);
  };

  /* ----------------------------------------------------------------- GUIDE */
  P.guide = () => {
    $('#emergency-list').innerHTML = EB.EMERGENCY.map((e) => '<li><span>' + U.esc(e.label) + '</span><a href="tel:' + U.esc(e.number) + '"><strong>' + U.esc(e.number) + '</strong></a><small>' + U.esc(e.note) + '</small></li>').join('');
    const sel = $('#guide-spot');
    const render = () => {
      const cur = sel.value, spots = EB.Search.sort(EB.Spots.all(), 'name');
      sel.innerHTML = '<option value="">Select a tourist spot</option>' + spots.map((s) => '<option value="' + U.esc(s.id) + '"' + (s.id === cur ? ' selected' : '') + '>' + U.esc(s.name + ' (' + s.district + ')') + '</option>').join('');
      sync();
    };
    const sync = () => { const has = !!EB.Spots.get(sel.value); U.qsa('[data-guide-act]').forEach((b) => (b.disabled = !has)); $('#guide-open').hidden = !has; if (has) $('#guide-open').href = U.detailsUrl(sel.value); };
    sel.addEventListener('change', sync);
    U.qsa('[data-guide-act]').forEach((b) => b.addEventListener('click', () => {
      const s = EB.Spots.get(sel.value); if (!s) { U.toast('Tourist spot not found.', 'error'); return; }
      EB.Guide[b.dataset.guideAct](s);
    }));
    render();
    EB.Refresh.register('guide', render);
  };

  /* ----------------------------------------------------------------- ABOUT */
  P.about = () => {
    const c = EB.CREATOR;
    $('#creator-card').innerHTML =
      '<div class="creator__photo"><img src="' + EB.Art.avatar(c.name) + '" alt="Portrait placeholder for ' + U.esc(c.name) + '" width="400" height="400"></div>' +
      '<div class="creator__info"><h3>' + U.esc(c.name) + '</h3><p class="creator__role">' + U.esc(c.profession) + '</p><p>' + U.esc(c.bio) + '</p>' +
      '<dl class="facts"><div><dt>Education</dt><dd>' + U.esc(c.education) + '</dd></div><div><dt>Skills</dt><dd><ul class="tags">' + c.skills.map((s) => '<li>' + U.esc(s) + '</li>').join('') + '</ul></dd></div>' +
      '<div><dt>Email</dt><dd><a href="mailto:' + U.esc(c.email) + '">' + U.esc(c.email) + '</a></dd></div></dl>' +
      '<ul class="social">' + [['GitHub', c.github], ['Facebook', c.facebook]].map((s) => '<li><a href="' + U.esc(s[1]) + '" target="_blank" rel="noopener">' + s[0] + '</a></li>').join('') + '</ul></div>';
  };
})();