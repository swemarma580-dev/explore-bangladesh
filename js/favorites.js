/* ==========================================================================
   favorites.js — visitor likes (heart), recently viewed, like ranking
   --------------------------------------------------------------------------
   The heart button IS the "like" button. One visitor can like a spot only
   once and can unlike it again; liking again after an unlike is still just
   one like, because the server stores a SET of visitor ids per spot.

   Where the numbers live
     - This browser : the list of spot ids this visitor liked (eb_favorites)
                      and an anonymous visitor id (eb_voter).
     - The server   : /api/likes/toggle  (public)  a visitor likes / unlikes
                      /api/likes/top     (public)  ranked spot ids ONLY, no counts
                      /api/likes/counts  (admin)   real counts per spot
     Visitors therefore never receive a like count. Only the admin dashboard
     asks for the counts, and the server checks the admin key for that call.

   If the server cannot be reached the change is kept in a small pending queue
   (eb_like_pending) and sent automatically on the next page load / next like.
   Both lists store only spot IDs and self-heal: prune() drops any ID whose
   tourist spot no longer exists, so a deleted spot can never linger here.
   ========================================================================== */
(function () {
  const EB = window.EB, S = EB.Store, K = S.K;
  const VOTER = 'eb_voter', PENDING = 'eb_like_pending', TOP = 'eb_like_top', BOOT = 'eb_like_boot';

  function makeList(key, max) {
    const read = () => { const v = S.get(key, []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; };
    return {
      list() { return read(); },
      has(id) { return read().includes(id); },
      remove(id) { S.set(key, read().filter((x) => x !== id)); },
      prune() {
        const live = new Set(EB.Spots.all().map((s) => s.id));
        const cur = read(), next = cur.filter((id) => live.has(id));
        if (next.length !== cur.length) S.set(key, next);
      },
      max: max
    };
  }

  /* ------------------------------------------------------------------ Likes */
  const Likes = (EB.Likes = {
    _busy: false,

    /* anonymous, random, stays in this browser: lets the server count each visitor once */
    voterId() {
      let v = S.get(VOTER, null);
      if (typeof v !== 'string' || !/^[a-f0-9]{32}$/.test(v)) {
        const bytes = new Uint8Array(16);
        if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
        else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
        v = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        S.set(VOTER, v);
      }
      return v;
    },

    /* record "this visitor now likes / does not like spot id" and send it to the server */
    sync(id, liked) {
      const p = S.get(PENDING, {});
      p[id] = !!liked;
      S.set(PENDING, p);
      Likes.flush();
    },

    /* sends queued changes one by one; stops at the first failure and retries later */
    async flush() {
      if (Likes._busy) return;
      Likes._busy = true;
      try {
        for (;;) {
          const p = S.get(PENDING, {});
          const id = Object.keys(p)[0];
          if (!id) break;
          if (!EB.Spots.get(id)) { delete p[id]; S.set(PENDING, p); continue; } // spot was deleted
          const liked = p[id];
          const r = await EB.Source.call('/api/likes/toggle', { id, liked, voter: Likes.voterId() });
          if (!r.ok) {
            // only a clear "bad request" is dropped, so one bad entry never blocks the rest;
            // every other failure (offline, wrong route, server error) keeps the like queued
            if (r.reason === 'bad_request') { const bad = S.get(PENDING, {}); delete bad[id]; S.set(PENDING, bad); continue; }
            Likes.retryLater();
            break;
          }
          Likes._tries = 0;
          const q = S.get(PENDING, {});
          if (q[id] === liked) { delete q[id]; S.set(PENDING, q); } // else changed meanwhile: send the newer value next
        }
      } finally { Likes._busy = false; }
    },

    /* no page refresh needed: a failed send is retried automatically */
    _timer: null,
    _tries: 0,
    retryLater() {
      if (Likes._timer || Likes._tries >= 6) return;
      Likes._tries++;
      Likes._timer = setTimeout(() => { Likes._timer = null; Likes.flush(); }, Math.min(30000, 2000 * Likes._tries));
    },

    /* ranked spot ids from the last successful request (no counts) */
    cachedTop() { const v = S.get(TOP, []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; },

    /* asks the server for the ranking; falls back to the cached ranking when offline */
    async top() {
      const r = await EB.Source.call('/api/likes/top', { limit: 24 });
      if (r.ok && Array.isArray(r.ids)) S.set(TOP, r.ids.filter((x) => typeof x === 'string'));
      return Likes.cachedTop();
    },

    /* ADMIN ONLY: { ok:true, counts:{ spotId: n } } or { ok:false, reason, message } */
    async counts() {
      const r = await EB.Source.call('/api/likes/counts', {});
      if (r.ok && r.counts && typeof r.counts === 'object') return { ok: true, counts: r.counts };
      return { ok: false, reason: r.reason || 'error', message: r.message };
    },

    init() {
      // first run after this feature is installed: count the hearts this visitor already gave
      if (!S.get(BOOT, false)) {
        const p = S.get(PENDING, {});
        S.get(K.fav, []).forEach((id) => { if (typeof id === 'string') p[id] = true; });
        S.set(PENDING, p);
        S.set(BOOT, true);
      }
      Likes.flush();
      window.addEventListener('online', () => { Likes._tries = 0; Likes.flush(); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) { Likes._tries = 0; Likes.flush(); } });
    }
  });

  /* -------------------------------------------------------------- Favorites */
  const Favorites = (EB.Favorites = makeList(K.fav, Infinity));
  /* One click = one change. Returns the state that was really saved, so the heart
     always matches it (if the browser refuses to save, the heart does not flip). */
  Favorites.toggle = function (id) {
    const cur = Favorites.list();
    const on = !cur.includes(id);
    S.set(K.fav, on ? cur.concat(id) : cur.filter((x) => x !== id));
    const saved = Favorites.has(id);
    if (saved === on) Likes.sync(id, on); // like / unlike, counted once per visitor on the server
    return saved;
  };
  Favorites.spots = () => Favorites.list().map((id) => EB.Spots.get(id)).filter(Boolean);

  const Recent = (EB.Recent = makeList(K.recent, 8));
  Recent.add = function (id) {
    const cur = Recent.list().filter((x) => x !== id);
    cur.unshift(id);
    S.set(K.recent, cur.slice(0, Recent.max));
  };
  Recent.spots = () => Recent.list().map((id) => EB.Spots.get(id)).filter(Boolean);

  Favorites.prune();
  Recent.prune();
  Likes.init();
})();
