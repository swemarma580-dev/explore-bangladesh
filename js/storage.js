/* ==========================================================================
   storage.js — the ONLY file that touches localStorage for tourist data
   --------------------------------------------------------------------------
   The UI talks to EB.Spots (a repository). localStorage is the fast local
   working copy; data.js (through server.js and EB.Source) is the permanent
   source of truth:
     - add / update : admin.js writes locally, then awaits EB.Source.upsert().
                      If data.js cannot be updated the local change is rolled back.
     - remove       : EB.Spots.remove() deletes locally and then asks the server
                      to update data.js.
     - load         : EB.Spots.init() seeds from data.js, and reconcile() merges
                      spots added / edited / removed in data.js into a browser
                      whose localStorage was seeded earlier.

   LIMITATIONS
   - Browsers cannot write project files, so data.js is updated by the Netlify
     Function (production) or server.js (local). If neither answers, Add/Edit
     show an error and are rolled back. On Netlify, visitors see a change once
     the automatic redeploy after the GitHub commit finishes.
   - Import JSON and Restore original spots only change this browser.
   - Uploaded images are stored as data URLs inside the record (and therefore
     inside data.js). Browser storage is small (about 5 MB).
   ========================================================================== */
(function () {
  const EB = window.EB;

  const K = { spots: 'touristSpots', counter: 'eb_id_counter', fav: 'eb_favorites', recent: 'eb_recent', theme: 'eb_theme' };

  /* ---- low-level adapter ---- */
  const S = (EB.Store = {
    K,
    has(key) { try { return localStorage.getItem(key) !== null; } catch (e) { return false; } },
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return { ok: true }; }
      catch (e) { return { ok: false, error: e, quota: e && (e.name === 'QuotaExceededError' || e.code === 22) }; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  });

  /* ---- data.js writer ----
     Talks to the same /api/spots/* URLs in both setups:
       - Netlify: netlify/functions/spots.js commits data.js to GitHub (see netlify.toml)
       - local:   server.js writes data.js on disk */
  const KEY = 'eb_admin_key';
  const isLocal = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);
  const Source = (EB.Source = {
    base: null,
    candidates() {
      const b = [];
      if (window.EB_API_BASE) b.push(String(window.EB_API_BASE).replace(/\/$/, ''));
      b.push('');
      if (isLocal && !/^https?:\/\/(localhost|127\.0\.0\.1):3000$/.test(location.origin)) b.push('http://localhost:3000');
      return b.filter((x, i) => b.indexOf(x) === i);
    },
    /* returns { ok:true, ... } or { ok:false, reason, message } — never throws */
    async call(path, body, retried) {
      const list = Source.base !== null ? [Source.base] : Source.candidates();
      let key = ''; try { key = sessionStorage.getItem(KEY) || ''; } catch (e) { /* ignore */ }
      for (const base of list) {
        try {
          const r = await fetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, key ? { 'X-Admin-Key': key } : {}), body: JSON.stringify(body) });
          let j = null; try { j = await r.json(); } catch (e) { /* not our server */ }
          if (!j || typeof j.ok !== 'boolean') continue;
          Source.base = base;
          if (j.reason === 'unauthorized') {
            try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
            if (!retried) {
              const k = window.prompt('Enter the admin key (the ADMIN_KEY value from your Netlify settings) to publish changes:');
              if (k) { try { sessionStorage.setItem(KEY, k.trim()); } catch (e) { /* ignore */ } return Source.call(path, body, true); }
            }
          }
          return j;
        } catch (e) { /* try next candidate */ }
      }
      return { ok: false, reason: 'offline' };
    },
    upsert(mode, spot) { return Source.call('/api/spots/upsert', { mode, spot }); },
    remove(id) { return Source.call('/api/spots/remove', { id }); },
    explain(r) {
      switch (r && r.reason) {
        case 'offline': return isLocal
          ? 'Could not reach the data endpoint, so data.js was not updated. Run "node server.js" and open http://localhost:3000, or run "netlify dev".'
          : 'Could not reach the data endpoint (/api/spots). Check that netlify.toml and netlify/functions/spots.js are deployed.';
        case 'unauthorized': return 'Wrong admin key. Nothing was changed.';
        case 'not_configured': return (r.message || 'The server is not configured.') + ' Set them in Netlify > Site settings > Environment variables, then redeploy.';
        case 'github_error': return r.message || 'GitHub rejected the request.';
        case 'conflict': return r.message;
        case 'duplicate': return 'A tourist spot with this name already exists in this district.';
        case 'id_exists': return 'This ID already exists in data.js. Reload the page and try again.';
        case 'bad_marker': return 'data.js is missing the ADMIN_MANAGED markers. See the setup steps.';
        default: return (r && r.message) || 'data.js could not be updated.';
      }
    }
  });

  /* ---- refresh registry: pages register render functions here ---- */
  const registry = {};
  EB.Refresh = {
    register(name, fn) { registry[name] = fn; },
    run(name) { if (registry[name]) registry[name](); },
    all() { Object.keys(registry).forEach((n) => { try { registry[n](); } catch (e) { console.error('Refresh failed:', n, e); } }); }
  };

  /* ---- shape normaliser: makes imported/edited data safe to render ---- */
  const str = (v) => (v == null ? '' : String(v));
  const arr = (v) => (Array.isArray(v) ? v : []);
  function normalize(s) {
    const tg = s.travelGuide || {};
    return {
      id: str(s.id),
      name: str(s.name).trim(),
      division: str(s.division),
      district: str(s.district),
      category: str(s.category),
      featured: !!s.featured,
      description: str(s.description),
      history: str(s.history),
      whyVisit: str(s.whyVisit),
      bestTime: str(s.bestTime) || 'Year-round',
      bestTimeNote: str(s.bestTimeNote),
      hours: str(s.hours),
      entryFee: str(s.entryFee),
      mainImage: str(s.mainImage),
      images: arr(s.images).map(str).filter(Boolean),
      video: str(s.video),
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      travelGuide: {
        bus: str(tg.bus), train: str(tg.train), air: str(tg.air), localTransport: str(tg.localTransport),
        distance: str(tg.distance), travelTime: str(tg.travelTime), route: str(tg.route), instructions: str(tg.instructions)
      },
      nearbyAttractions: arr(s.nearbyAttractions).map(str),
      safetyTips: arr(s.safetyTips).map(str).filter(Boolean),
      createdAt: str(s.createdAt) || new Date().toISOString(),
      updatedAt: str(s.updatedAt) || new Date().toISOString()
    };
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const idNum = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

  /* ---- repository ---- */
  const Spots = (EB.Spots = {
    normalize,
    /* seed once from data.js (EB.SEED_SPOTS already includes admin-added spots).
       An existing (even empty) list is never overwritten; it is reconciled instead. */
    init() {
      if (!S.has(K.spots)) { S.set(K.spots, clone(EB.SEED_SPOTS)); S.set(K.counter, EB.SEED_SPOTS.length); return; }
      Spots.reconcile();
    },
    /* merge changes recorded in data.js (EB.ADMIN_DATA) into this browser's copy.
       Idempotent: spots added in data.js are appended, edited ones are replaced only
       when data.js is newer, removed ones are dropped. Other local spots are kept. */
    reconcile() {
      const src = EB.ADMIN_DATA;
      if (!src) return;
      const removed = new Set(arr(src.removed));
      let changed = false;
      const next = Spots.all().filter((s) => { if (removed.has(s.id)) { changed = true; return false; } return true; });
      arr(src.added).forEach((a) => {
        const n = normalize(a), i = next.findIndex((s) => s.id === n.id);
        if (i < 0) { next.push(n); changed = true; }
        else if (Date.parse(n.updatedAt) > Date.parse(next[i].updatedAt)) { next[i] = n; changed = true; }
      });
      if (!changed) return;
      S.set(K.spots, next);
      S.set(K.counter, Math.max(S.get(K.counter, 0), 0, ...next.map((s) => idNum(s.id))));
    },
    all() { const v = S.get(K.spots, []); return Array.isArray(v) ? v : []; },
    get(id) { return Spots.all().find((s) => s.id === id) || null; },
    nextId() {
      const max = Math.max(S.get(K.counter, 0), 0, ...Spots.all().map((s) => idNum(s.id)));
      return 'spot_' + String(max + 1).padStart(3, '0');
    },
    add(data) {
      const id = Spots.nextId();
      const now = new Date().toISOString();
      const spot = normalize(Object.assign({}, data, { id, createdAt: now, updatedAt: now }));
      const list = Spots.all(); list.push(spot);
      const r = S.set(K.spots, list);
      if (!r.ok) return { ok: false, quota: r.quota };
      S.set(K.counter, idNum(id)); // ids are never reused, even after deletion
      return { ok: true, spot };
    },
    update(id, data) {
      const list = Spots.all(); const i = list.findIndex((s) => s.id === id);
      if (i < 0) return { ok: false, reason: 'not_found' };
      const spot = normalize(Object.assign({}, list[i], data, { id, createdAt: list[i].createdAt, updatedAt: new Date().toISOString() }));
      list[i] = spot;
      const r = S.set(K.spots, list);
      return r.ok ? { ok: true, spot } : { ok: false, quota: r.quota };
    },
    /* local-only helpers used by admin.js to roll back a change data.js refused */
    putLocal(spot) {
      const n = normalize(spot), list = Spots.all(), i = list.findIndex((s) => s.id === n.id);
      if (i < 0) list.push(n); else list[i] = n;
      return S.set(K.spots, list);
    },
    /* removes the WHOLE record from this browser only (filter by id, write back, verify) */
    removeLocal(id) {
      const list = Spots.all();
      const next = list.filter((s) => s.id !== id);
      if (next.length === list.length) return { ok: false, reason: 'not_found' };
      const r = S.set(K.spots, next);
      if (!r.ok) return { ok: false, reason: 'write_failed' };
      if (Spots.all().some((s) => s.id === id)) return { ok: false, reason: 'verify_failed' };
      return { ok: true };
    },
    /* removes the record locally, then updates data.js through the server */
    remove(id) {
      const r = Spots.removeLocal(id);
      if (r.ok) {
        Source.remove(id).then((sr) => {
          if (!sr.ok && EB.Util && EB.Util.toast) EB.Util.toast('Deleted in this browser, but data.js was not updated. ' + Source.explain(sr), 'error', 8000);
        });
      }
      return r;
    },
    replaceAll(list) { return S.set(K.spots, list.map(normalize)); },
    reset() {
      S.set(K.spots, clone(EB.SEED_SPOTS));
      S.set(K.counter, EB.SEED_SPOTS.length);
      S.del(K.fav); S.del(K.recent);
    },
    exportJson() { return JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, spots: Spots.all() }, null, 2); },
    importJson(text) {
      let data;
      try { data = JSON.parse(text); } catch (e) { return { ok: false, reason: 'invalid_json' }; }
      const list = Array.isArray(data) ? data : data && data.spots;
      if (!Array.isArray(list)) return { ok: false, reason: 'invalid_shape' };
      const clean = list.filter((s) => s && s.id && s.name).map(normalize);
      const r = Spots.replaceAll(clean);
      if (!r.ok) return { ok: false, reason: 'write_failed' };
      S.set(K.counter, Math.max(S.get(K.counter, 0), ...clean.map((s) => idNum(s.id)), 0));
      return { ok: true, count: clean.length };
    },
    /* derived helpers */
    forDivision(name) { return Spots.all().filter((s) => s.division === name); },
    forDistrict(name) { return Spots.all().filter((s) => s.district === name); },
    categoriesInUse() { return Array.from(new Set(Spots.all().map((s) => s.category))); },
    /* nearby = explicit references (that still exist) then nearest others */
    nearby(spot, limit) {
      const all = Spots.all().filter((s) => s.id !== spot.id);
      const dist = (s) => EB.Util.haversine(spot.latitude, spot.longitude, s.latitude, s.longitude);
      const out = [];
      spot.nearbyAttractions.forEach((id) => {
        const s = all.find((x) => x.id === id);
        if (s) out.push({ spot: s, km: dist(s) });
      });
      all.filter((s) => !out.some((o) => o.spot.id === s.id))
        .map((s) => ({ spot: s, km: dist(s) })).filter((o) => o.km <= 120).sort((a, b) => a.km - b.km)
        .forEach((o) => out.push(o));
      return out.slice(0, limit || 4);
    }
  });

  /* keep other open tabs in sync */
  window.addEventListener('storage', (e) => {
    if (e.key === K.spots || e.key === K.fav || e.key === K.recent || e.key === null) {
      if (EB.Favorites) EB.Favorites.prune();
      EB.Refresh.all();
    }
  });

  Spots.init();
})();