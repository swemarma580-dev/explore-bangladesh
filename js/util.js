/* ==========================================================================
   util.js — small, dependency-free helpers shared by every page
   ========================================================================== */
(function () {
  const EB = (window.EB = window.EB || {});
  const U = (EB.Util = {});

  /* ---- DOM / strings ---- */
  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.qs = (sel, root) => (root || document).querySelector(sel);
  U.qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  U.param = (name) => new URLSearchParams(location.search).get(name);
  U.debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 200); };
  };
  U.trunc = (s, n) => {
    s = String(s || '').trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
  };
  /* lower-case, strip accents and apostrophes so "coxs" matches "Cox's" */
  U.norm = (s) =>
    String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`]/g, '').trim();
  U.slug = (s) => U.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  U.plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
  U.fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* Only allow safe URL schemes for images/videos coming from admin input */
  U.safeUrl = (u) => {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|data:image\/(jpeg|png|webp);base64,|data:video\/(mp4|webm);base64,)/i.test(u)) return u;
    if (/^(images|videos)\/[\w\-./ %]+$/i.test(u) || /^\.\.\/(images|videos)\/[\w\-./ %]+$/i.test(u)) return u;
    return '';
  };

  /* Turn plain text into safe HTML: blank line = new paragraph, "- item" = bullet */
  U.rich = (text) => {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    let out = '', list = false, para = [];
    const flush = () => { if (para.length) { out += '<p>' + para.map(U.esc).join('<br>') + '</p>'; para = []; } };
    const closeList = () => { if (list) { out += '</ul>'; list = false; } };
    lines.forEach((raw) => {
      const l = raw.trim();
      if (!l) { flush(); closeList(); return; }
      const m = l.match(/^[-*•]\s+(.*)$/);
      if (m) { flush(); if (!list) { out += '<ul>'; list = true; } out += '<li>' + U.esc(m[1]) + '</li>'; }
      else { closeList(); para.push(l); }
    });
    flush(); closeList();
    return out;
  };

  /* ---- geo ---- */
  U.haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371, rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  U.fmtCoord = (n) => (Number.isFinite(+n) ? (+n).toFixed(5) : '');
  U.gmapsView = (lat, lng) => 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
  U.gmapsDir = (lat, lng, origin, mode) =>
    'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=' + (mode || 'driving') +
    (origin ? '&origin=' + encodeURIComponent(origin) : '');
  U.detailsUrl = (id) => EB.base + 'tourist-details.html?id=' + encodeURIComponent(id);
  U.mapUrl = (id) => EB.base + 'map.html?spot=' + encodeURIComponent(id);

  /* ---- video URL handling ---- */
  U.videoInfo = (url) => {
    url = String(url || '').trim();
    if (!url) return null;
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/i);
    if (m) return { kind: 'youtube', id: m[1], src: 'https://www.youtube-nocookie.com/embed/' + m[1] };
    if (/^data:video\/(mp4|webm);base64,/i.test(url) || /^https?:\/\/.+\.(mp4|webm|ogv)(\?.*)?$/i.test(url) || /^(\.\.\/)?videos\//i.test(url))
      return { kind: 'file', src: url };
    return null;
  };

  /* ---- toast (aria-live) ---- */
  U.toast = (msg, type, ms) => {
    let host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'toast-eb toast-eb--' + (type || 'success');
    t.textContent = msg;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms || 3800);
  };

  /* ---- accessible modal ---- */
  U.modal = (html, opts) => {
    opts = opts || {};
    const prev = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'eb-modal';
    wrap.innerHTML =
      '<div class="eb-modal__backdrop" data-close></div>' +
      '<div class="eb-modal__dialog" role="dialog" aria-modal="true" aria-label="' + U.esc(opts.label || 'Dialog') + '" tabindex="-1">' + html + '</div>';
    document.body.appendChild(wrap);
    document.body.classList.add('modal-open');
    const dlg = wrap.querySelector('.eb-modal__dialog');
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        const f = U.qsa('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', dlg);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    function close() {
      if (!wrap.parentNode) return;
      wrap.remove();
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
      if (prev && prev.focus) prev.focus();
      if (opts.onClose) opts.onClose();
    }
    wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { wrap.classList.add('show'); (dlg.querySelector('[data-autofocus]') || dlg).focus(); });
    return { el: dlg, wrap, close };
  };

  /* ---- icons (inline SVG, currentColor) ---- */
  const svg = (p, extra) =>
    '<svg class="ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' + (extra || '') + '>' + p + '</svg>';
  EB.Icons = {
    heart: svg('<path d="M12 20.5s-7.5-4.6-9.3-9.3C1.5 8 3.4 5 6.4 5c1.9 0 3.4 1 4.4 2.5h.4C12.2 6 13.7 5 15.6 5c3 0 4.9 3 3.7 6.2-1.8 4.7-9.3 9.3-9.3 9.3z"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    pin: svg('<path d="M12 21s-7-6.1-7-11.2A7 7 0 0 1 19 9.8C19 14.900 12 21 12 21z"/><circle cx="12" cy="10" r="2.5"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.700 17.700l1.4 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>'),
    moon: svg('<path d="M20 14.5A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    external: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    share: svg('<circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="6" r="2.500"/><circle cx="18" cy="18" r="2.500"/><path d="m8.200 10.900 7.600-3.800M8.200 13.100l7.600 3.800"/>'),
    print: svg('<path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="7"/>'),
    download: svg('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>'),
    left: svg('<path d="m15 5-7 7 7 7"/>'),
    right: svg('<path d="m9 5 7 7-7 7"/>'),
    expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    play: svg('<path d="M8 5v14l11-7z" fill="currentColor"/>'),
    compass: svg('<circle cx="12" cy="12" r="9"/><path d="m15.500 8.500-2 5-5 2 2-5z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    edit: svg('<path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16v4z"/>'),
    trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    grid: svg('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
    list: svg('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
    logout: svg('<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18"/>')
  };

  /* Base path so the same scripts work from / and /admin/ */
  EB.base = document.body && document.body.dataset.base ? document.body.dataset.base : '';
  document.addEventListener('DOMContentLoaded', () => { EB.base = document.body.dataset.base || ''; });
})();
