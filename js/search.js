/* ==========================================================================
   search.js — partial-match search + filters + suggestion dropdown
   Always reads the live repository, so deleted spots never appear.
   ========================================================================== */
(function () {
  const EB = window.EB, U = EB.Util;

  const haystack = (s) => U.norm([s.name, s.district, s.division, s.division + ' division', s.category].join(' '));

  const Search = (EB.Search = {
    /* opts: q, division, district, category, categories[], bestTime, favoritesOnly, sort */
    filter(opts) {
      opts = opts || {};
      let list = EB.Spots.all();
      if (opts.division) list = list.filter((s) => s.division === opts.division);
      if (opts.district) list = list.filter((s) => s.district === opts.district);
      if (opts.category) list = list.filter((s) => s.category === opts.category);
      if (opts.categories && opts.categories.length) list = list.filter((s) => opts.categories.includes(s.category));
      if (opts.bestTime) list = list.filter((s) => s.bestTime === opts.bestTime);
      if (opts.favoritesOnly) { const f = EB.Favorites.list(); list = list.filter((s) => f.includes(s.id)); }
      const tokens = U.norm(opts.q).split(/\s+/).filter(Boolean);
      if (tokens.length) list = list.filter((s) => { const h = haystack(s); return tokens.every((t) => h.includes(t)); });
      return Search.sort(list, opts.sort);
    },
    sort(list, key) {
      const l = list.slice();
      const by = {
        name: (a, b) => a.name.localeCompare(b.name),
        district: (a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name),
        division: (a, b) => a.division.localeCompare(b.division) || a.name.localeCompare(b.name),
        category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
        best: (a, b) => a.bestTime.localeCompare(b.bestTime) || a.name.localeCompare(b.name),
        newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
        oldest: (a, b) => String(a.createdAt).localeCompare(String(b.createdAt))
      };
      return key && by[key] ? l.sort(by[key]) : l;
    },
    label(s) { return s.name + ' – ' + s.district + ' – ' + s.division + ' Division'; },

    /* Attach a suggestion dropdown to <input> and <ul>. Enter goes to the results page. */
    mount(input, listEl, opts) {
      opts = opts || {};
      let active = -1;
      const go = (q) => { location.href = EB.base + 'tourist-spots.html?q=' + encodeURIComponent(q); };
      const close = () => { listEl.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
      const items = () => U.qsa('[role="option"]', listEl);
      const paint = () => items().forEach((li, i) => { li.classList.toggle('active', i === active); li.setAttribute('aria-selected', i === active ? 'true' : 'false'); });

      const render = () => {
        const q = input.value.trim();
        if (!q) { close(); return; }
        const found = Search.filter({ q, sort: 'name' }).slice(0, 6);
        let html = found.map((s) =>
          '<li role="option"><a href="' + U.detailsUrl(s.id) + '"><strong>' + U.esc(s.name) + '</strong><span>' + U.esc(s.district + ', ' + s.division + ' Division') + '</span></a></li>').join('');
        if (!found.length) html = '<li class="empty" role="option" aria-disabled="true">No tourist spots found for this location.</li>';
        html += '<li role="option"><a href="' + EB.base + 'tourist-spots.html?q=' + encodeURIComponent(q) + '"><strong>See all results for “' + U.esc(q) + '”</strong></a></li>';
        listEl.innerHTML = html;
        listEl.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        active = -1;
      };

      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'false');
      input.addEventListener('input', U.debounce(render, 120));
      input.addEventListener('focus', render);
      input.addEventListener('keydown', (e) => {
        const n = items().length;
        if (e.key === 'ArrowDown' && n) { e.preventDefault(); active = (active + 1) % n; paint(); }
        else if (e.key === 'ArrowUp' && n) { e.preventDefault(); active = (active - 1 + n) % n; paint(); }
        else if (e.key === 'Escape') { close(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          const a = active >= 0 ? items()[active].querySelector('a') : null;
          if (a) location.href = a.href; else if (input.value.trim()) go(input.value.trim());
        }
      });
      document.addEventListener('click', (e) => { if (!listEl.contains(e.target) && e.target !== input) close(); });
      if (opts.button) opts.button.addEventListener('click', () => { if (input.value.trim()) go(input.value.trim()); else input.focus(); });
      return { close };
    }
  });
})();
