/* ==========================================================================
   admin.js — admin UI (sign-in: see authentication.js)
   Pages: login, dashboard, add, manage (+ quick delete), edit, map management.
   Data goes through EB.Spots only; deletion goes through EB.Delete.
   Add / Edit / Map save also go through Admin.persist(), which writes the
   change into data.js (via EB.Source and server.js) and rolls the local
   change back if data.js could not be updated.
   ========================================================================== */
(function () {
  const EB = window.EB, U = EB.Util, I = EB.Icons;
  const $ = (s, r) => U.qs(s, r);
  const Pages = (EB.AdminPages = {});
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const helpers = () => EB.Pages._u;

  /* ADMIN-ONLY like counts (fetched from /api/likes/counts, never sent to visitors) */
  const LikeData = { counts: null, error: '' };
  const likesOf = (id) => (LikeData.counts ? Number(LikeData.counts[id]) || 0 : null);
  const likeCell = (id) => { const n = likesOf(id); return n === null ? '—' : String(n); };
  const loadLikes = (done) => {
    EB.Likes.counts().then((r) => {
      LikeData.counts = r.ok ? r.counts : null;
      LikeData.error = r.ok ? '' : (r.reason === 'unauthorized' ? 'Wrong admin key, so like counts are hidden.' : 'Like counts need the server (/api/likes). Run "node server.js" or deploy netlify/functions/likes.js.');
      if (done) done();
    });
  };

  const Admin = (EB.Admin = {
    /* ---------------- shell: sidebar + top bar ---------------- */
    layout(active, title) {
      if (!EB.Auth.requireAuth()) return null;
      const items = [['dashboard', 'dashboard.html', 'Dashboard', I.grid], ['add', 'add-spot.html', 'Add Tourist Spot', I.plus], ['manage', 'manage-spots.html', 'Manage Tourist Spots', I.list], ['map', 'map-management.html', 'Map Management', I.pin]];
      document.title = title + ' | Explore Bangladesh Admin';
      $('#admin-app').innerHTML =
        '<div class="admin"><aside class="admin-side" id="admin-side" aria-label="Admin navigation">' +
        '<a class="brand" href="dashboard.html">' + EB.Layout.logo(38) + '<span class="brand__text"><strong>Explore Bangladesh</strong><small>Admin dashboard</small></span></a>' +
        '<nav><ul>' + items.map((n) => '<li><a href="' + n[1] + '"' + (n[0] === active ? ' aria-current="page"' : '') + '>' + n[3] + '<span>' + n[2] + '</span></a></li>').join('') + '</ul></nav>' +
        '<div class="admin-side__foot"><a href="../index.html">' + I.globe + '<span>View website</span></a><button type="button" id="admin-logout">' + I.logout + '<span>Log out</span></button></div></aside>' +
        '<div class="admin-scrim" id="admin-scrim"></div>' +
        '<div class="admin-main"><header class="admin-top"><button type="button" class="icon-btn admin-menu" id="admin-menu" aria-label="Open navigation" aria-expanded="false" aria-controls="admin-side">' + I.menu + '</button>' +
        '<h1>' + U.esc(title) + '</h1><div class="admin-top__tools"><button type="button" class="icon-btn" data-theme-toggle aria-pressed="false"></button></div></header>' +
        '<main id="admin-content" class="admin-content" tabindex="-1"></main></div></div>';
      const side = $('#admin-side'), toggle = $('#admin-menu'), scrim = $('#admin-scrim');
      const set = (open) => { side.classList.toggle('open', open); scrim.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); };
      toggle.onclick = () => set(!side.classList.contains('open'));
      scrim.onclick = () => set(false);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
      $('#admin-logout').onclick = () => { EB.Auth.logout(); location.href = 'index.html'; };
      EB.Layout.applyTheme(document.documentElement.dataset.theme || 'light');
      return $('#admin-content');
    },

    countUp(el, target) {
      if (reduced() || target === 0) { el.textContent = target; return; }
      const t0 = performance.now(), dur = 700;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    },
    download(name, text, type) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
      a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    quotaInfo() {
      let bytes = 0;
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); bytes += (k.length + (localStorage.getItem(k) || '').length) * 2; } } catch (e) { /* ignore */ }
      return { kb: Math.round(bytes / 1024), pct: Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100)) };
    },
    thumb(s) { return EB.Art.resolve(s.mainImage || EB.Art.forCategory(s.category)); },

    /* Writes an already-saved local change into data.js. `res` is the result of
       EB.Spots.add / EB.Spots.update; `before` is the previous record (update only).
       On failure the local change is rolled back and an error toast is shown. */
    async persist(mode, res, before) {
      const src = await EB.Source.upsert(mode, res.spot);
      if (src.ok) return { ok: true };
      if (mode === 'add') EB.Spots.removeLocal(res.spot.id);
      else if (before) EB.Spots.putLocal(before);
      EB.Refresh.all();
      U.toast(EB.Source.explain(src), 'error', 8000);
      return { ok: false };
    }
  });

  /* =================================================================== LOGIN */
  Pages['admin-login'] = () => {
    if (EB.Auth.isAuthenticated()) { location.replace('dashboard.html'); return; }
    const f1 = $('#step-email'), f2 = $('#step-code'), msg = $('#login-msg'), inbox = $('#code-box');
    const say = (t, kind) => { msg.textContent = t; msg.className = 'login-msg' + (kind === 'error' ? ' is-error' : kind === 'success' ? ' is-ok' : ''); };
    const mins = (s) => Math.ceil(s / 60) + ' minute' + (Math.ceil(s / 60) === 1 ? '' : 's');
    f1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#login-email').value.trim();
      if (!email || !email.includes('@')) { say('Please enter a valid email address.', 'error'); return; }
      const r = await EB.Auth.requestCode(email);
      if (!r.ok && r.reason === 'locked') { say('Too many attempts. Try again in ' + mins(r.seconds) + '.', 'error'); return; }
      if (!r.ok) { say('This email is not registered as an administrator.', 'error'); return; }
      f1.hidden = true; f2.hidden = false;
      inbox.hidden = false; inbox.querySelector('strong').textContent = r.code;
      say('Verification code sent.', 'success');
      $('#login-code').focus();
    });
    f2.addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = await EB.Auth.verifyCode($('#login-code').value);
      if (r.ok) { U.toast('Signed in as admin'); location.href = 'dashboard.html'; return; }
      if (r.reason === 'locked') say('Too many attempts. Try again in ' + mins(r.seconds) + '.', 'error');
      else if (r.reason === 'expired') say('This code has expired. Please request a new one.', 'error');
      else say('Incorrect verification code. ' + r.left + ' attempt' + (r.left === 1 ? '' : 's') + ' left.', 'error');
      $('#login-code').select();
    });
    $('#login-back').addEventListener('click', () => { f2.hidden = true; f1.hidden = false; inbox.hidden = true; say(''); $('#login-email').focus(); });
  };

  /* ============================================================== DASHBOARD */
  Pages['admin-dashboard'] = () => {
    const c = Admin.layout('dashboard', 'Dashboard'); if (!c) return;
    let animated = false;
    const render = () => {
      const spots = EB.Spots.all(), inUse = EB.Spots.categoriesInUse().length;
      const districts = EB.DIVISIONS.reduce((n, d) => n + d.districts.length, 0);
      const recent = EB.Search.sort(spots, 'newest').slice(0, 5);
      const byDiv = EB.DIVISIONS.map((d) => ({ name: d.name, n: spots.filter((s) => s.division === d.name).length }));
      const max = Math.max(1, ...byDiv.map((d) => d.n)), q = Admin.quotaInfo();
      const totalLikes = LikeData.counts ? spots.reduce((n, s) => n + (likesOf(s.id) || 0), 0) : 0;
      const byLikes = spots.slice().sort((x, y) => (likesOf(y.id) || 0) - (likesOf(x.id) || 0) || x.name.localeCompare(y.name));
      const stat = (label, val, sub) => '<div class="stat-card"><span class="stat-card__label">' + label + '</span><strong class="stat-card__num" data-count="' + val + '">' + (animated ? val : 0) + '</strong><small>' + sub + '</small></div>';
      c.innerHTML =
        '<div class="admin-notice">Changes are saved in this browser (localStorage) and, while server.js is running, also written to data.js. Other visitors only see them after data.js is deployed. Use Export JSON to keep a backup.</div>' +
        '<div class="stat-grid">' + stat('Total tourist spots', spots.length, inUse + (inUse === 1 ? ' category' : ' categories') + ' in use') + stat('Total divisions', EB.DIVISIONS.length, 'Fixed list') + stat('Total districts', districts, 'Fixed list') +
        stat('Total categories', EB.CATEGORIES.length, 'Available to choose') + stat('Added this week', spots.filter((s) => Date.now() - Date.parse(s.createdAt) < 7 * 864e5).length, 'Recently added spots') + stat('Total likes', totalLikes, LikeData.counts ? 'Across all spots' : 'Server not reachable') + '</div>' +
        '<div class="row g-4">' +
        '<div class="col-lg-6"><section class="admin-card"><h2>Recently added spots</h2>' +
        (recent.length ? '<ul class="recent-list">' + recent.map((s) => '<li><img src="' + Admin.thumb(s) + '" alt=""><div><strong>' + U.esc(s.name) + '</strong><span>' + U.esc(s.district + ', ' + s.division) + ' · ' + U.fmtDate(s.createdAt) + '</span></div><a class="eb-btn eb-btn--ghost sm" href="edit-spot.html?id=' + encodeURIComponent(s.id) + '">Edit</a></li>').join('') + '</ul>' : '<p class="muted">No tourist spots found.</p>') +
        '<a class="eb-btn eb-btn--primary mt-3" href="add-spot.html">Add Tourist Spot</a></section></div>' +
        '<div class="col-lg-6"><section class="admin-card"><h2>Spots by division</h2><ul class="bars">' + byDiv.map((d) => '<li><span>' + U.esc(d.name) + '</span><div class="bar"><i style="width:' + Math.round((d.n / max) * 100) + '%"></i></div><b>' + d.n + '</b></li>').join('') + '</ul></section></div>' +
        '<div class="col-12"><section class="admin-card"><h2>Likes per tourist spot</h2>' +
        (LikeData.error ? '<p class="muted" role="status">' + U.esc(LikeData.error) + '</p>' : '<p class="muted">Each visitor counts once per spot. Visitors never see these numbers. The 12 spots with the most likes appear on the homepage.</p>') +
        '<div class="table-wrap" style="max-height:420px;overflow:auto"><table class="admin-table"><thead><tr><th scope="col">Tourist Spot</th><th scope="col">District</th><th scope="col">Likes</th></tr></thead><tbody>' +
        (byLikes.length ? byLikes.map((s) => '<tr><td data-label="Tourist Spot"><strong>' + U.esc(s.name) + '</strong></td><td data-label="District">' + U.esc(s.district + ', ' + s.division) + '</td><td data-label="Likes"><strong>' + likeCell(s.id) + '</strong></td></tr>').join('') : '<tr><td colspan="3" class="empty-cell">No tourist spots found.</td></tr>') +
        '</tbody></table></div></section></div>' +
        '<div class="col-12"><section class="admin-card"><h2>Backup and data tools</h2>' +
        '<p class="muted">Browser storage is about 5 MB. You are using roughly ' + q.kb + ' KB (' + q.pct + '%). Photos are compressed, but many large images can fill it.</p><div class="quota" aria-hidden="true"><i style="width:' + q.pct + '%"></i></div>' +
        '<div class="d-flex flex-wrap gap-2 mt-3"><button type="button" class="eb-btn eb-btn--ghost" id="dash-export">' + I.download + '<span>Export JSON</span></button>' +
        '<label class="eb-btn eb-btn--ghost mb-0" for="dash-import">' + I.plus + '<span>Import JSON</span></label><input type="file" id="dash-import" accept="application/json,.json" class="sr-only">' +
        '<button type="button" class="eb-btn eb-btn--ghost" id="dash-reset">Restore original spots</button></div></section></div></div>';
      if (!animated) { U.qsa('[data-count]', c).forEach((el) => Admin.countUp(el, +el.dataset.count)); animated = true; }
      $('#dash-export').onclick = () => { Admin.download('explore-bangladesh-backup-' + new Date().toISOString().slice(0, 10) + '.json', EB.Spots.exportJson()); U.toast('Backup downloaded.', 'info'); };
      $('#dash-import').onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        if (f.size > 4 * 1024 * 1024) { U.toast('That file is too large to import.', 'error'); return; }
        const fr = new FileReader();
        fr.onload = () => {
          const r = EB.Spots.importJson(String(fr.result));
          if (r.ok) { EB.Favorites.prune(); EB.Recent.prune(); EB.Refresh.all(); U.toast('Imported ' + U.plural(r.count, 'tourist spot') + '.'); }
          else U.toast('Could not import that file. Choose a JSON backup exported from this site.', 'error');
        };
        fr.readAsText(f);
      };
      $('#dash-reset').onclick = () => {
        const m = U.modal('<h2 class="h4">Restore the original spots?</h2><p class="modal-warning">This replaces every tourist spot in this browser with the spots currently stored in data.js and clears favorites and recently viewed.</p><div class="modal-actions"><button class="eb-btn eb-btn--ghost" data-close data-autofocus type="button">Cancel</button><button class="eb-btn eb-btn--danger" data-ok type="button">Restore</button></div>', { label: 'Restore original spots' });
        m.el.querySelector('[data-ok]').onclick = () => { EB.Spots.reset(); m.close(); EB.Refresh.all(); U.toast('Original spots restored.', 'info'); };
      };
    };
    render();
    loadLikes(render);
    EB.Refresh.register('dashboard', render);
  };

  /* ========================================================= MANAGE SPOTS */
  Pages['admin-manage'] = () => {
    const c = Admin.layout('manage', 'Manage Tourist Spots'); if (!c) return;
    const PER = 8; let page = 1;
    c.innerHTML =
      '<section class="admin-card" aria-labelledby="flt-h"><h2 id="flt-h" class="sr-only">Search and filter</h2><div class="row g-3">' +
      '<div class="col-lg-3"><label class="form-label" for="a-q">Search Tourist Spot</label><input id="a-q" class="form-control" type="search" placeholder="Search by name..."></div>' +
      '<div class="col-6 col-lg-2"><label class="form-label" for="a-div">Select Division</label><select id="a-div" class="form-select" data-ph="All Divisions"></select></div>' +
      '<div class="col-6 col-lg-2"><label class="form-label" for="a-dis">Select District</label><select id="a-dis" class="form-select" data-ph="All Districts"></select></div>' +
      '<div class="col-6 col-lg-2"><label class="form-label" for="a-cat">Category</label><select id="a-cat" class="form-select"></select></div>' +
      '<div class="col-6 col-lg-3"><label class="form-label" for="a-sort">Sort by</label><select id="a-sort" class="form-select"><option value="name">Name</option><option value="district">District</option><option value="division">Division</option><option value="category">Category</option><option value="best">Best time</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="likes">Most liked</option></select></div></div></section>' +
      '<section class="admin-card"><div class="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-2"><h2 class="mb-0">Tourist spots <span class="muted small" id="a-count" aria-live="polite"></span></h2><a class="eb-btn eb-btn--primary sm" href="add-spot.html">' + I.plus + '<span>Add Tourist Spot</span></a></div>' +
      '<div class="table-wrap"><table class="admin-table"><thead><tr><th scope="col">Image</th><th scope="col">Tourist Spot</th><th scope="col">District</th><th scope="col">Division</th><th scope="col">Category</th><th scope="col">Best time</th><th scope="col">Likes</th><th scope="col">Action</th></tr></thead><tbody id="a-body"></tbody></table></div>' +
      '<nav class="pager" id="a-pager" aria-label="Pagination"></nav></section>' +
      '<section class="admin-card" id="delete-section" aria-labelledby="qd-h"><h2 id="qd-h">Delete Tourist Spot</h2><p class="muted">Pick a spot from the list, then confirm. Deletion removes the whole record and every reference to it.</p>' +
      '<div class="row g-3 align-items-end"><div class="col-lg-8"><label class="form-label" for="quick-delete">Select Tourist Spot</label><select id="quick-delete" class="form-select"></select></div>' +
      '<div class="col-lg-4"><button type="button" class="eb-btn eb-btn--danger w-100" id="quick-delete-btn">' + I.trash + '<span>Delete selected</span></button></div></div></section>';

    const q = $('#a-q'), dv = $('#a-div'), ds = $('#a-dis'), ct = $('#a-cat'), so = $('#a-sort');
    helpers().fillOptions(ct, EB.CATEGORIES.map((x) => x.name), 'All Categories', '');
    const list = () => {
      const r = EB.Search.filter({ q: q.value, division: dv.value, district: ds.value, category: ct.value, sort: so.value === 'likes' ? 'name' : so.value });
      return so.value === 'likes' ? r.sort((x, y) => (likesOf(y.id) || 0) - (likesOf(x.id) || 0)) : r;
    };
    const render = () => {
      const all = list(), pages = Math.max(1, Math.ceil(all.length / PER)); page = Math.min(page, pages);
      const rows = all.slice((page - 1) * PER, page * PER);
      $('#a-count').textContent = '(' + all.length + ')';
      $('#a-body').innerHTML = rows.length ? rows.map((s) =>
        '<tr><td data-label="Image"><img class="thumb" src="' + Admin.thumb(s) + '" alt="' + U.esc(s.name) + '"></td>' +
        '<td data-label="Tourist Spot"><strong>' + U.esc(s.name) + '</strong><small class="muted d-block">' + U.esc(s.id) + '</small></td>' +
        '<td data-label="District">' + U.esc(s.district) + '</td><td data-label="Division">' + U.esc(s.division) + '</td><td data-label="Category">' + U.esc(s.category) + '</td><td data-label="Best time">' + U.esc(s.bestTime) + '</td><td data-label="Likes"><strong>' + likeCell(s.id) + '</strong></td>' +
        '<td data-label="Action"><div class="row-actions"><a class="eb-btn eb-btn--ghost sm" href="edit-spot.html?id=' + encodeURIComponent(s.id) + '">' + I.edit + '<span>Edit</span></a>' +
        '<button type="button" class="eb-btn eb-btn--danger sm" data-del="' + U.esc(s.id) + '" aria-label="Delete ' + U.esc(s.name) + '">' + I.trash + '<span>Delete</span></button></div></td></tr>').join('')
        : '<tr><td colspan="8" class="empty-cell">No tourist spots found.</td></tr>';
      const pg = $('#a-pager'); pg.innerHTML = pages > 1 ? '<button type="button" class="eb-btn eb-btn--ghost sm" data-p="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '>Previous</button><span>Page ' + page + ' of ' + pages + '</span><button type="button" class="eb-btn eb-btn--ghost sm" data-p="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + '>Next</button>' : '';
      const cur = $('#quick-delete').value;
      $('#quick-delete').innerHTML = '<option value="">Select a tourist spot</option>' + EB.Search.sort(EB.Spots.all(), 'name').map((s) => '<option value="' + U.esc(s.id) + '"' + (s.id === cur ? ' selected' : '') + '>' + U.esc(s.name + ' (' + s.district + ')') + '</option>').join('');
    };
    helpers().linkSelects(dv, ds, () => { page = 1; render(); });
    q.oninput = U.debounce(() => { page = 1; render(); }, 150);
    ct.onchange = so.onchange = () => { page = 1; render(); };
    c.addEventListener('click', (e) => {
      const d = e.target.closest('[data-del]'); if (d) EB.Delete.confirmAndDelete(d.dataset.del, { onDone: render });
      const p = e.target.closest('[data-p]'); if (p) { page = +p.dataset.p; render(); }
    });
    $('#quick-delete-btn').onclick = () => {
      const id = $('#quick-delete').value;
      if (!id) { U.toast('Select a tourist spot first.', 'error'); return; }
      EB.Delete.confirmAndDelete(id, { onDone: render });
    };
    render();
    loadLikes(render);
    EB.Refresh.register('adminList', render);
  };

  /* ================================================================ FORM */
  const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'], VID_TYPES = ['video/mp4', 'video/webm'];
  async function processImage(file) {
    if (!IMG_TYPES.includes(file.type)) throw new Error('Only JPG, PNG or WebP images are allowed.');
    if (file.size > 6 * 1024 * 1024) throw new Error('Each image must be smaller than 6 MB.');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That file is not a valid image.')); i.src = url; });
      const sc = Math.min(1, 1280 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.78);
    } finally { URL.revokeObjectURL(url); }
  }
  function processVideo(file) {
    return new Promise((res, rej) => {
      if (!VID_TYPES.includes(file.type)) return rej(new Error('Only MP4 or WebM video is allowed.'));
      if (file.size > 1.5 * 1024 * 1024) return rej(new Error('Uploaded video must be under 1.5 MB. For larger videos paste a video URL instead.'));
      const fr = new FileReader();
      fr.onload = () => (/^data:video\/(mp4|webm);base64,/.test(fr.result) ? res(fr.result) : rej(new Error('That file is not a valid video.')));
      fr.onerror = () => rej(new Error('Could not read that file.'));
      fr.readAsDataURL(file);
    });
  }

  Admin.form = {
    map: null,
    mount(container, spot, opts) {
      opts = opts || {};
      if (Admin.form.map) { try { Admin.form.map.map.remove(); } catch (e) { /* ignore */ } Admin.form.map = null; }
      const edit = !!spot, U_ = U;
      const st = { mainImage: edit ? spot.mainImage : '', images: edit ? spot.images.slice() : [], video: edit ? spot.video : '', lat: edit ? spot.latitude : NaN, lng: edit ? spot.longitude : NaN };
      const g = edit ? spot.travelGuide : {};
      const v = (x) => U_.esc(x == null ? '' : x);
      const fld = (id, label, ctl, req, hint) => '<div class="mb-3"><label class="form-label" for="' + id + '">' + label + (req ? ' <span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span>' : '') + '</label>' + ctl + (hint ? '<div class="form-text">' + hint + '</div>' : '') + '</div>';
      const ta = (id, val, rows, ph) => '<textarea id="' + id + '" class="form-control" rows="' + rows + '" maxlength="6000"' + (ph ? ' placeholder="' + U_.esc(ph) + '"' : '') + '>' + v(val) + '</textarea>';
      const inp = (id, val, ph, extra) => '<input id="' + id + '" class="form-control" maxlength="300" value="' + v(val) + '"' + (ph ? ' placeholder="' + U_.esc(ph) + '"' : '') + (extra || '') + '>';
      const others = EB.Search.sort(EB.Spots.all().filter((s) => !edit || s.id !== spot.id), 'name');
      const sel = new Set(edit ? spot.nearbyAttractions : []);

      container.innerHTML =
        '<form id="spot-form" novalidate>' +
        '<section class="admin-card"><h2>Basic information</h2><div class="row g-3"><div class="col-md-8">' + fld('sf-name', 'Tourist Spot Name', inp('sf-name', edit ? spot.name : '', 'e.g. Sajek Valley'), true) + '</div>' +
        '<div class="col-md-4">' + fld('sf-id', 'Unique Tourist Spot ID', '<input id="sf-id" class="form-control" readonly value="' + v(edit ? spot.id : EB.Spots.nextId()) + '" aria-describedby="sf-id-h">', false, '<span id="sf-id-h">Generated automatically and never reused.</span>') + '</div></div>' +
        '<div class="row g-3"><div class="col-md-4">' + fld('sf-division', 'Division', '<select id="sf-division" class="form-select"></select>', true) + '</div><div class="col-md-4">' + fld('sf-district', 'District', '<select id="sf-district" class="form-select"></select>', true) + '</div>' +
        '<div class="col-md-4">' + fld('sf-category', 'Category', '<select id="sf-category" class="form-select"></select>', true) + '</div></div>' +
        '<div class="row g-3"><div class="col-md-4">' + fld('sf-best', 'Best Time to Visit', '<select id="sf-best" class="form-select"></select>', true) + '</div><div class="col-md-8">' + fld('sf-bestnote', 'Best time explanation', inp('sf-bestnote', edit ? spot.bestTimeNote : '', 'Why this season is best')) + '</div></div>' +
        '<div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="sf-featured"' + (edit && spot.featured ? ' checked' : '') + '><label class="form-check-label" for="sf-featured">Prefer on the homepage while fewer than 12 spots have likes</label></div></section>' +

        '<section class="admin-card"><h2>Description</h2>' + fld('sf-desc', 'Description', ta('sf-desc', edit ? spot.description : '', 5), true, 'Plain text. A blank line starts a new paragraph; start lines with "- " for bullet points.') +
        fld('sf-history', 'History', ta('sf-history', edit ? spot.history : '', 4)) + fld('sf-why', 'Why Visit', ta('sf-why', edit ? spot.whyVisit : '', 4)) +
        '<div class="row g-3"><div class="col-md-6">' + fld('sf-hours', 'Opening / Closing Information', inp('sf-hours', edit ? spot.hours : '')) + '</div><div class="col-md-6">' + fld('sf-fee', 'Entry Fee', inp('sf-fee', edit ? spot.entryFee : '', 'e.g. BDT 20 or Free')) + '</div></div></section>' +

        '<section class="admin-card"><h2>Photos and video</h2>' +
        '<div class="row g-4"><div class="col-lg-6"><h3 class="h5">Main image</h3><div class="media-main"><img id="sf-main-prev" alt="Main image preview"></div>' +
        '<input id="sf-main-file" type="file" class="form-control mt-2" accept="image/jpeg,image/png,image/webp" aria-label="Upload main image">' +
        '<div class="input-group mt-2"><input id="sf-main-url" class="form-control" placeholder="or paste an https:// image URL" aria-label="Main image URL"><button type="button" class="eb-btn eb-btn--ghost" id="sf-main-url-set">Use URL</button></div>' +
        '<button type="button" class="eb-btn eb-btn--ghost sm mt-2" id="sf-main-clear">Use category artwork</button></div>' +
        '<div class="col-lg-6"><h3 class="h5">Additional images</h3><input id="sf-extra-file" type="file" class="form-control" multiple accept="image/jpeg,image/png,image/webp" aria-label="Upload additional images">' +
        '<div class="input-group mt-2"><input id="sf-extra-url" class="form-control" placeholder="or paste an https:// image URL" aria-label="Additional image URL"><button type="button" class="eb-btn eb-btn--ghost" id="sf-extra-url-add">Add URL</button></div>' +
        '<ul class="thumb-list" id="sf-extra-list"></ul><p class="form-text">JPG, PNG or WebP, up to 6 MB each. Images are compressed to fit browser storage. Up to 8 extra images.</p></div></div>' +
        '<hr><h3 class="h5">Tourist spot video</h3><div class="row g-3"><div class="col-md-6"><input id="sf-video-url" class="form-control" placeholder="YouTube link or https://.../video.mp4" aria-label="Video URL" value="' + v(edit && /^https?:|^videos\//.test(spot.video) ? spot.video : '') + '"><div class="form-text">A YouTube link or a direct MP4/WebM link.</div></div>' +
        '<div class="col-md-6"><input id="sf-video-file" type="file" class="form-control" accept="video/mp4,video/webm" aria-label="Upload video"><div class="form-text">Or upload MP4/WebM under 1.5 MB.</div></div></div>' +
        '<div id="sf-video-prev" class="mt-2"></div></section>' +

        '<section class="admin-card"><h2>Google Map location</h2><div class="row g-2 mb-2"><div class="col-md-9"><label class="form-label" for="sf-geo">Search location</label><input id="sf-geo" class="form-control" placeholder="e.g. Sajek Valley, Rangamati"></div><div class="col-md-3 d-flex align-items-end"><button type="button" class="eb-btn eb-btn--ghost w-100" id="sf-geo-btn">Search</button></div></div>' +
        '<div class="map-frame"><div id="sf-map" class="map-box" aria-label="Click the map to place the marker"></div></div>' +
        '<p class="coords" aria-live="polite"><span>Latitude: <b id="sf-lat-out">-</b></span><span>Longitude: <b id="sf-lng-out">-</b></span></p>' +
        '<div class="row g-3"><div class="col-md-6">' + fld('sf-lat', 'Latitude', '<input id="sf-lat" class="form-control" inputmode="decimal" placeholder="e.g. 23.38200">', true) + '</div><div class="col-md-6">' + fld('sf-lng', 'Longitude', '<input id="sf-lng" class="form-control" inputmode="decimal" placeholder="e.g. 92.29400">', true) + '</div></div>' +
        '<p class="form-text">Click the map or drag the marker. Coordinates must be inside Bangladesh.</p></section>' +

        '<section class="admin-card"><h2>Nearby attractions</h2><label class="form-label" for="sf-near-q">Filter list</label><input id="sf-near-q" class="form-control mb-2" placeholder="Filter by name...">' +
        '<div class="nearby-list" id="sf-near">' + (others.length ? others.map((s) => '<label class="check" data-name="' + U_.esc(U_.norm(s.name + ' ' + s.district)) + '"><input type="checkbox" value="' + U_.esc(s.id) + '"' + (sel.has(s.id) ? ' checked' : '') + '> ' + U_.esc(s.name) + ' <small class="muted">(' + U_.esc(s.district) + ')</small></label>').join('') : '<p class="muted">No other tourist spots yet.</p>') + '</div></section>' +

        '<section class="admin-card"><h2>Travel guidance</h2><p class="muted">Directions from Dhaka. Plain text; start lines with "- " for bullets.</p>' +
        fld('sf-bus', 'Bus route', ta('sf-bus', g.bus, 3, 'Terminal, operators, duration, where to get off, local transport from the stop')) + fld('sf-train', 'Train route', ta('sf-train', g.train, 3)) + fld('sf-air', 'Air route', ta('sf-air', g.air, 3)) + fld('sf-local', 'Local transport', ta('sf-local', g.localTransport, 3, 'CNG, auto-rickshaw, bus, rickshaw, boat, jeep...')) +
        '<div class="row g-3"><div class="col-md-4">' + fld('sf-dist', 'Estimated distance', inp('sf-dist', g.distance, 'e.g. About 300 km from Dhaka')) + '</div><div class="col-md-4">' + fld('sf-time', 'Estimated travel time', inp('sf-time', g.travelTime, 'e.g. 8 to 10 hours')) + '</div><div class="col-md-4">' + fld('sf-route', 'Recommended route', inp('sf-route', g.route)) + '</div></div>' +
        fld('sf-instr', 'Important instructions', ta('sf-instr', g.instructions, 3)) + fld('sf-tips', 'Safety and travel tips', ta('sf-tips', edit ? spot.safetyTips.join('\n') : '', 5), false, 'One tip per line.') + '</section>' +

        '<div class="form-actions"><button type="submit" class="eb-btn eb-btn--primary">' + (edit ? 'Save Changes' : 'Add Tourist Spot') + '</button><a class="eb-btn eb-btn--ghost" href="manage-spots.html">Cancel</a></div></form>';

      const $f = (id) => container.querySelector('#' + id);
      const H = helpers();
      H.linkSelects($f('sf-division'), $f('sf-district'), () => {}, { division: edit ? spot.division : '', district: edit ? spot.district : '' });
      H.fillOptions($f('sf-category'), EB.CATEGORIES.map((x) => x.name), 'Select category', edit ? spot.category : '');
      H.fillOptions($f('sf-best'), EB.BEST_TIMES, 'Select season', edit ? spot.bestTime : '');

      /* ----- media previews ----- */
      const cat = () => $f('sf-category').value;
      const renderMedia = () => {
        $f('sf-main-prev').src = EB.Art.resolve(st.mainImage || EB.Art.forCategory(cat() || 'Nature'));
        $f('sf-extra-list').innerHTML = st.images.map((src, i) => '<li><img src="' + EB.Art.resolve(src) + '" alt="Additional image ' + (i + 1) + '"><div><button type="button" class="eb-btn eb-btn--ghost sm" data-main="' + i + '">Make main</button><button type="button" class="eb-btn eb-btn--danger sm" data-rm="' + i + '" aria-label="Remove image ' + (i + 1) + '">Remove</button></div></li>').join('');
        const vi = U_.videoInfo(st.video);
        $f('sf-video-prev').innerHTML = st.video ? (vi ? '<div class="d-flex align-items-center gap-2 flex-wrap"><span class="badge-eb badge-eb--time">Video attached (' + (vi.kind === 'youtube' ? 'YouTube' : 'file') + ')</span><button type="button" class="eb-btn eb-btn--ghost sm" id="sf-video-rm">Remove video</button></div>' : '<p class="text-danger">That video link is not supported.</p>') : '';
        const rm = $f('sf-video-rm'); if (rm) rm.onclick = () => { st.video = ''; $f('sf-video-url').value = ''; renderMedia(); };
      };
      const fail = (e) => U_.toast(e && e.message ? e.message : 'Could not use that file.', 'error');
      $f('sf-category').addEventListener('change', renderMedia);
      $f('sf-main-file').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { st.mainImage = await processImage(f); renderMedia(); } catch (x) { fail(x); } e.target.value = ''; };
      $f('sf-main-url-set').onclick = () => { const u = U_.safeUrl($f('sf-main-url').value); if (!/^https?:/i.test(u)) return U_.toast('Enter a valid https:// image URL.', 'error'); st.mainImage = u; renderMedia(); };
      $f('sf-main-clear').onclick = () => { st.mainImage = ''; renderMedia(); };
      $f('sf-extra-file').onchange = async (e) => {
        for (const f of Array.from(e.target.files)) {
          if (st.images.length >= 8) { U_.toast('You can add up to 8 additional images.', 'error'); break; }
          try { st.images.push(await processImage(f)); } catch (x) { fail(x); }
        }
        e.target.value = ''; renderMedia();
      };
      $f('sf-extra-url-add').onclick = () => { const u = U_.safeUrl($f('sf-extra-url').value); if (!/^https?:/i.test(u)) return U_.toast('Enter a valid https:// image URL.', 'error'); if (st.images.length >= 8) return U_.toast('You can add up to 8 additional images.', 'error'); st.images.push(u); $f('sf-extra-url').value = ''; renderMedia(); };
      $f('sf-extra-list').onclick = (e) => {
        const m = e.target.closest('[data-main]'), r = e.target.closest('[data-rm]');
        if (m) { const i = +m.dataset.main, old = st.mainImage; st.mainImage = st.images[i]; if (old) st.images[i] = old; else st.images.splice(i, 1); renderMedia(); }
        if (r) { st.images.splice(+r.dataset.rm, 1); renderMedia(); }
      };
      $f('sf-video-url').oninput = () => { st.video = $f('sf-video-url').value.trim(); renderMedia(); };
      $f('sf-video-file').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { st.video = await processVideo(f); $f('sf-video-url').value = ''; renderMedia(); } catch (x) { fail(x); } e.target.value = ''; };
      renderMedia();

      /* ----- map picker ----- */
      const showCoords = () => { $f('sf-lat-out').textContent = Number.isFinite(st.lat) ? U_.fmtCoord(st.lat) : '-'; $f('sf-lng-out').textContent = Number.isFinite(st.lng) ? U_.fmtCoord(st.lng) : '-'; };
      const setCoords = (lat, lng, fromInput) => { st.lat = +lat; st.lng = +lng; if (!fromInput) { $f('sf-lat').value = U_.fmtCoord(lat); $f('sf-lng').value = U_.fmtCoord(lng); } showCoords(); };
      const picker = (Admin.form.map = EB.Map.picker($f('sf-map'), { lat: st.lat, lng: st.lng, onChange: (la, ln) => setCoords(la, ln) }));
      if (Number.isFinite(st.lat)) { $f('sf-lat').value = U_.fmtCoord(st.lat); $f('sf-lng').value = U_.fmtCoord(st.lng); }
      showCoords();
      const fromInputs = () => { const la = parseFloat($f('sf-lat').value), ln = parseFloat($f('sf-lng').value); if (Number.isFinite(la) && Number.isFinite(ln)) { setCoords(la, ln, true); if (picker) { picker.set(la, ln, true); picker.focus(la, ln, 11); } } };
      $f('sf-lat').oninput = $f('sf-lng').oninput = fromInputs;
      const geo = async () => {
        const q = $f('sf-geo').value.trim(); if (!q) return;
        const r = await EB.Map.geocode(q);
        if (!r) return U_.toast('No location found. Try a different name or click the map.', 'error');
        setCoords(r.lat, r.lng); if (picker) { picker.set(r.lat, r.lng, true); picker.focus(r.lat, r.lng, 12); }
      };
      $f('sf-geo-btn').onclick = geo;
      $f('sf-geo').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); geo(); } };

      $f('sf-near-q').oninput = () => { const t = U_.norm($f('sf-near-q').value); U_.qsa('#sf-near .check', container).forEach((l) => (l.hidden = t && !l.dataset.name.includes(t))); };

      /* ----- submit ----- */
      const collect = () => {
        const val = (id) => $f(id).value.trim();
        const cats = val('sf-category');
        return {
          name: val('sf-name'), division: val('sf-division'), district: val('sf-district'), category: cats, bestTime: val('sf-best'), bestTimeNote: val('sf-bestnote'),
          featured: $f('sf-featured').checked, description: val('sf-desc'), history: val('sf-history'), whyVisit: val('sf-why'), hours: val('sf-hours'), entryFee: val('sf-fee'),
          mainImage: st.mainImage || EB.Art.forCategory(cats || 'Nature'), images: st.images.slice(), video: st.video && U_.videoInfo(st.video) ? st.video : '',
          latitude: parseFloat($f('sf-lat').value), longitude: parseFloat($f('sf-lng').value),
          nearbyAttractions: U_.qsa('#sf-near input:checked', container).map((c) => c.value),
          travelGuide: { bus: val('sf-bus'), train: val('sf-train'), air: val('sf-air'), localTransport: val('sf-local'), distance: val('sf-dist'), travelTime: val('sf-time'), route: val('sf-route'), instructions: val('sf-instr') },
          safetyTips: $f('sf-tips').value.split('\n').map((t) => t.trim()).filter(Boolean)
        };
      };
      const form = $f('spot-form');
      let busy = false;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (busy) return;
        const d = collect(), bad = [];
        const need = [['sf-name', d.name], ['sf-division', d.division], ['sf-district', d.district], ['sf-category', d.category], ['sf-best', d.bestTime], ['sf-desc', d.description]];
        need.forEach(([id, val]) => { if (!val) bad.push(id); });
        if (!(d.latitude >= 20.5 && d.latitude <= 26.7)) bad.push('sf-lat');
        if (!(d.longitude >= 88 && d.longitude <= 92.8)) bad.push('sf-lng');
        U_.qsa('.is-invalid', form).forEach((x) => { x.classList.remove('is-invalid'); x.removeAttribute('aria-invalid'); });
        if (bad.length) {
          bad.forEach((id) => { $f(id).classList.add('is-invalid'); $f(id).setAttribute('aria-invalid', 'true'); });
          $f(bad[0]).focus(); U_.toast('Please complete all required fields.', 'error'); return;
        }
        busy = true;
        const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
        let keepLocked = false;
        try {
          const before = edit ? EB.Spots.get(spot.id) : null;
          const res = edit ? EB.Spots.update(spot.id, d) : EB.Spots.add(d);
          if (!res.ok) { U_.toast(res.reason === 'not_found' ? 'Tourist spot not found.' : res.quota ? 'Browser storage is full. Remove some images or export a backup, then try again.' : 'Unable to save tourist spot. Please try again.', 'error'); return; }
          // the record is only "saved" once data.js has it too
          const saved = await Admin.persist(edit ? 'update' : 'add', res, before);
          if (!saved.ok) { if (!edit) $f('sf-id').value = EB.Spots.nextId(); return; }
          EB.Refresh.all();
          U_.toast(edit ? 'Tourist spot updated successfully (saved to data.js).' : 'Tourist spot added successfully (saved to data.js).', 'success');
          if (!edit) keepLocked = true; // stop a second click from creating a duplicate while redirecting
          if (opts.onSaved) opts.onSaved(res.spot);
        } finally {
          if (!keepLocked) { busy = false; btn.disabled = false; }
        }
      });
    }
  };

  Pages['admin-add'] = () => {
    const c = Admin.layout('add', 'Add Tourist Spot'); if (!c) return;
    Admin.form.mount(c, null, { onSaved: () => setTimeout(() => (location.href = 'manage-spots.html'), 900) });
  };

  Pages['admin-edit'] = () => {
    const c = Admin.layout('manage', 'Edit Tourist Spot'); if (!c) return;
    const draw = () => {
      const s = EB.Spots.get(U.param('id') || '');
      if (!s) { c.innerHTML = '<div class="empty-state empty-state--lg"><h2 class="h3">Tourist spot not found.</h2><a class="eb-btn eb-btn--primary" href="manage-spots.html">Back to Manage Tourist Spots</a></div>'; return; }
      Admin.form.mount(c, s, { onSaved: (n) => { document.title = 'Edit ' + n.name + ' | Explore Bangladesh Admin'; } });
    };
    draw();
  };

  /* ======================================================== MAP MANAGEMENT */
  Pages['admin-map'] = () => {
    const c = Admin.layout('map', 'Map Management'); if (!c) return;
    c.innerHTML =
      '<div class="row g-4"><div class="col-lg-4"><section class="admin-card"><h2>Tourist spots</h2><label class="form-label" for="mm-q">Search</label><input id="mm-q" class="form-control mb-2" type="search" placeholder="Search by name...">' +
      '<ul class="map-list" id="mm-list"></ul></section></div>' +
      '<div class="col-lg-8"><section class="admin-card"><h2 id="mm-title">Select a tourist spot</h2><div class="row g-2 mb-2"><div class="col-md-9"><label class="form-label" for="mm-geo">Search location</label><input id="mm-geo" class="form-control" placeholder="Place name"></div><div class="col-md-3 d-flex align-items-end"><button type="button" class="eb-btn eb-btn--ghost w-100" id="mm-geo-btn">Search</button></div></div>' +
      '<div class="map-frame"><div id="mm-map" class="map-box"></div></div>' +
      '<p class="coords" aria-live="polite"><span>Latitude: <b id="mm-lat">-</b></span><span>Longitude: <b id="mm-lng">-</b></span></p>' +
      '<div class="row g-3"><div class="col-md-4"><label class="form-label" for="mm-lat-in">Latitude</label><input id="mm-lat-in" class="form-control" inputmode="decimal"></div><div class="col-md-4"><label class="form-label" for="mm-lng-in">Longitude</label><input id="mm-lng-in" class="form-control" inputmode="decimal"></div>' +
      '<div class="col-md-4 d-flex align-items-end"><button type="button" class="eb-btn eb-btn--primary w-100" id="mm-save" disabled>Save coordinates</button></div></div></section></div></div>';
    let cur = null, picker = null, others = null;
    const set = (la, ln, fromInput) => { $('#mm-lat').textContent = U.fmtCoord(la); $('#mm-lng').textContent = U.fmtCoord(ln); if (!fromInput) { $('#mm-lat-in').value = U.fmtCoord(la); $('#mm-lng-in').value = U.fmtCoord(ln); } };
    picker = EB.Map.picker($('#mm-map'), { onChange: (la, ln) => set(la, ln) });
    const drawOthers = () => {
      if (!picker || !window.L) return;
      if (others) picker.map.removeLayer(others);
      others = L.layerGroup().addTo(picker.map);
      EB.Spots.all().forEach((s) => L.circleMarker([s.latitude, s.longitude], { radius: 6, color: '#006A4E', weight: 2, fillColor: '#fff', fillOpacity: 0.9 }).bindTooltip(s.name).addTo(others));
    };
    const renderList = () => {
      const t = U.norm($('#mm-q').value), spots = EB.Search.sort(EB.Spots.all(), 'name').filter((s) => !t || U.norm(s.name + ' ' + s.district).includes(t));
      $('#mm-list').innerHTML = spots.length ? spots.map((s) => '<li><button type="button" data-id="' + U.esc(s.id) + '"' + (cur && cur.id === s.id ? ' aria-current="true"' : '') + '><strong>' + U.esc(s.name) + '</strong><span>' + U.fmtCoord(s.latitude) + ', ' + U.fmtCoord(s.longitude) + '</span></button></li>').join('') : '<li class="muted">No tourist spots found.</li>';
      if (cur && !EB.Spots.get(cur.id)) { cur = null; $('#mm-title').textContent = 'Select a tourist spot'; $('#mm-save').disabled = true; if (picker) picker.clear(); }
      drawOthers();
    };
    $('#mm-list').onclick = (e) => {
      const b = e.target.closest('[data-id]'); if (!b) return;
      cur = EB.Spots.get(b.dataset.id); if (!cur) return;
      $('#mm-title').textContent = cur.name + ' (' + cur.id + ')'; $('#mm-save').disabled = false;
      set(cur.latitude, cur.longitude);
      if (picker) { picker.set(cur.latitude, cur.longitude, true); picker.focus(cur.latitude, cur.longitude, 12); }
      renderList();
    };
    const fromInputs = () => { const la = parseFloat($('#mm-lat-in').value), ln = parseFloat($('#mm-lng-in').value); if (Number.isFinite(la) && Number.isFinite(ln)) { set(la, ln, true); if (picker) { picker.set(la, ln, true); picker.focus(la, ln, 12); } } };
    $('#mm-lat-in').oninput = $('#mm-lng-in').oninput = fromInputs;
    $('#mm-q').oninput = U.debounce(renderList, 150);
    $('#mm-geo-btn').onclick = async () => {
      const q = $('#mm-geo').value.trim(); if (!q) return;
      const r = await EB.Map.geocode(q); if (!r) return U.toast('No location found. Try a different name or click the map.', 'error');
      set(r.lat, r.lng); if (picker) { picker.set(r.lat, r.lng, true); picker.focus(r.lat, r.lng, 12); }
    };
    $('#mm-save').onclick = async () => {
      if (!cur) return;
      const la = parseFloat($('#mm-lat-in').value), ln = parseFloat($('#mm-lng-in').value);
      if (!(la >= 20.5 && la <= 26.7 && ln >= 88 && ln <= 92.8)) return U.toast('Coordinates must be inside Bangladesh.', 'error');
      const btn = $('#mm-save'); btn.disabled = true;
      const before = EB.Spots.get(cur.id);
      const r = EB.Spots.update(cur.id, { latitude: la, longitude: ln });
      if (!r.ok) { btn.disabled = false; return U.toast('Unable to save tourist spot. Please try again.', 'error'); }
      const saved = await Admin.persist('update', r, before);
      btn.disabled = false;
      if (!saved.ok) return;
      cur = r.spot; EB.Refresh.all(); U.toast('Tourist spot updated successfully (saved to data.js).');
    };
    renderList();
    EB.Refresh.register('adminMap', renderList);
  };

  /* ---- boot ---- */
  document.addEventListener('DOMContentLoaded', () => { const p = document.body.dataset.page; if (Pages[p]) Pages[p](); });
})();