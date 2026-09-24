/* ==========================================================================
   map.js — interactive maps
   --------------------------------------------------------------------------
   Interactive maps use Leaflet with free raster tiles that need NO API key.
   Tile providers are tried in order (Esri, OpenStreetMap): if one refuses to
   load (for example OpenStreetMap blocks requests that carry no Referer,
   such as pages opened from file://) the next one is used.
   CARTO is intentionally NOT used here: since late August 2026 CARTO
   requires an API key on its raster basemaps. Without a key the tiles still
   load successfully (no tileerror fires), but every tile is stamped with an
   "API KEY REQUIRED" watermark — so the automatic fallback below would never
   trigger and the map would look broken forever. If you later want CARTO's
   look back, get a free key from CARTO and append it as ?key=... to its
   tile URLs; don't add it back keyless.
   Google Maps is used through plain links ("View Location on Google Maps",
   "Get Directions"), which also need no key and expose no secrets.
   If you prefer the Google Maps JavaScript API, keep the key server-side or
   restrict it by HTTP referrer in Google Cloud Console; never ship an
   unrestricted key in this folder.
   ========================================================================== */
(function () {
  const EB = window.EB,
    U = EB.Util;
  const BD_CENTER = [23.75, 90.35];
  const BD_BOUNDS = [
    [20.4, 87.9],
    [26.8, 92.9],
  ];

  const PROVIDERS = [
    {
      name: "Esri",
      light:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      opts: {
        maxZoom: 19,
        attribution:
          "Tiles &copy; Esri, HERE, Garmin, OpenStreetMap contributors",
      },
    },
    {
      name: "OpenStreetMap",
      light: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      opts: {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      },
    },
  ];

  /* Adds a tile layer that falls back to the next provider when tiles fail, and follows the dark/light theme */
  function addTiles(map, el) {
    let idx = 0,
      layer = null,
      errors = 0,
      loaded = 0,
      warned = false;
    const isDark = () => document.documentElement.dataset.theme === "dark";
    const urlFor = (pr) => (isDark() && pr.dark ? pr.dark : pr.light);
    const paintTheme = () =>
      el.classList.toggle("map-invert", isDark() && !PROVIDERS[idx].dark); // no dark tiles -> CSS invert
    const use = (i) => {
      if (layer) map.removeLayer(layer);
      idx = i;
      errors = 0;
      loaded = 0;
      const pr = PROVIDERS[i];
      layer = L.tileLayer(
        urlFor(pr),
        Object.assign({ crossOrigin: false }, pr.opts),
      ).addTo(map);
      layer.on("tileload", () => {
        loaded++;
      });
      layer.on("tileerror", () => {
        errors++;
        if (loaded === 0 && errors >= 3) {
          if (idx < PROVIDERS.length - 1) use(idx + 1);
          else if (!warned) {
            warned = true;
            el.insertAdjacentHTML(
              "beforeend",
              '<div class="map-tile-warn" role="alert">Map tiles could not be loaded. Markers are still shown.</div>',
            );
          }
        }
      });
      paintTheme();
    };
    use(0);
    const mo = new MutationObserver(() => {
      if (layer) {
        layer.setUrl(urlFor(PROVIDERS[idx]));
        paintTheme();
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    map.on("unload", () => mo.disconnect());
  }

  const M = (EB.Map = {
    available() {
      return typeof window.L !== "undefined";
    },

    fail(el) {
      el.innerHTML =
        '<div class="map-fail" role="alert"><p><strong>Map could not be loaded. Please try again.</strong></p>' +
        '<p class="muted">Interactive maps need an internet connection.</p>' +
        '<button type="button" class="eb-btn eb-btn--ghost" data-retry>Try again</button></div>';
      const b = el.querySelector("[data-retry]");
      if (b) b.addEventListener("click", () => location.reload());
      return null;
    },

    create(el, opts) {
      opts = opts || {};
      if (!M.available()) return M.fail(el);
      try {
        el.innerHTML = "";
        const map = L.map(el, {
          center: opts.center || BD_CENTER,
          zoom: opts.zoom || 7,
          scrollWheelZoom: opts.scrollWheelZoom !== false,
          zoomControl: true,
          maxBounds: [
            [10, 75],
            [35, 105],
          ],
          minZoom: 5,
        });
        addTiles(map, el);
        el.classList.add("map-ready");
        setTimeout(() => map.invalidateSize(), 250);
        return map;
      } catch (err) {
        console.error(err);
        return M.fail(el);
      }
    },

    /* Google Maps embed URLs: real Google look, no API key, exact coordinates */
    embedUrl(spot, zoom) {
      return (
        "https://www.google.com/maps?q=" +
        spot.latitude +
        "," +
        spot.longitude +
        "&z=" +
        (zoom || 13) +
        "&output=embed"
      );
    },
    embedDirections(spot, from, mode) {
      const flag = { driving: "d", transit: "r", walking: "w" }[mode] || "d";
      return (
        "https://www.google.com/maps?saddr=" +
        encodeURIComponent(from) +
        "&daddr=" +
        spot.latitude +
        "," +
        spot.longitude +
        "&dirflg=" +
        flag +
        "&output=embed"
      );
    },

    pin(cls) {
      return L.divIcon({
        className: "eb-pin " + (cls || ""),
        html: "<span></span>",
        iconSize: [26, 34],
        iconAnchor: [13, 32],
        popupAnchor: [0, -30],
      });
    },

    popupHtml(s) {
      return (
        '<div class="map-pop"><img src="' +
        EB.Art.resolve(s.mainImage || EB.Art.forCategory(s.category)) +
        '" alt="' +
        U.esc(s.name) +
        '" loading="lazy">' +
        "<h4>" +
        U.esc(s.name) +
        '</h4><p class="loc">' +
        U.esc(s.district + ", " + s.division + " Division") +
        "</p>" +
        "<p>" +
        U.esc(U.trunc(s.description, 110)) +
        "</p>" +
        '<div class="map-pop__actions"><button type="button" class="eb-btn eb-btn--primary sm" data-select="' +
        U.esc(s.id) +
        '">Exact location</button>' +
        '<a class="eb-btn eb-btn--ghost sm" href="' +
        U.detailsUrl(s.id) +
        '">View Details</a>' +
        '<a class="eb-btn eb-btn--ghost sm" href="' +
        U.gmapsDir(s.latitude, s.longitude) +
        '" target="_blank" rel="noopener">Get Directions</a></div></div>'
      );
    },

    /* replaces the marker layer; returns { layer, byId } */
    showSpots(map, spots, prev, onSelect) {
      if (!map) return null;
      if (prev && prev.layer) map.removeLayer(prev.layer);
      const layer = (
          L.markerClusterGroup
            ? L.markerClusterGroup({
                showCoverageOnHover: false,
                maxClusterRadius: 40,
              })
            : L.layerGroup()
        ).addTo(map),
        byId = {};
      spots.forEach((s) => {
        if (!Number.isFinite(s.latitude) || !Number.isFinite(s.longitude))
          return;
        const m = L.marker([s.latitude, s.longitude], {
          icon: M.pin(),
          title: s.name,
          keyboard: true,
          alt: s.name,
        })
          .bindPopup(M.popupHtml(s), { maxWidth: 260 })
          .addTo(layer);
        if (onSelect) m.on("click", () => onSelect(s, false));
        byId[s.id] = m;
      });
      return { layer, byId };
    },

    /* pan to a marker and open its popup (works when the marker is inside a cluster) */
    openMarker(map, markers, spot) {
      const m = markers && markers.byId[spot.id];
      if (!m) return;
      if (markers.layer.zoomToShowLayer)
        markers.layer.zoomToShowLayer(m, () => m.openPopup());
      else {
        map.setView([spot.latitude, spot.longitude], 12);
        m.openPopup();
      }
    },

    fit(map, spots) {
      if (!map) return;
      const pts = spots
        .filter((s) => Number.isFinite(s.latitude))
        .map((s) => [s.latitude, s.longitude]);
      if (pts.length === 1) map.setView(pts[0], 11);
      else if (pts.length > 1)
        map.fitBounds(pts, { padding: [40, 40], maxZoom: 11 });
      else map.fitBounds(BD_BOUNDS);
    },

    /* free geocoding through Nominatim (no key). Returns {lat,lng,name} or null */
    async geocode(q) {
      try {
        const r = await fetch(
          "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bd&q=" +
            encodeURIComponent(q),
          { headers: { Accept: "application/json" } },
        );
        if (!r.ok) return null;
        const j = await r.json();
        return j && j[0]
          ? { lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name }
          : null;
      } catch (e) {
        return null;
      }
    },

    /* draggable marker picker for the admin forms */
    picker(el, opts) {
      opts = opts || {};
      const map = M.create(el, {
        center: Number.isFinite(opts.lat) ? [opts.lat, opts.lng] : BD_CENTER,
        zoom: Number.isFinite(opts.lat) ? 11 : 7,
      });
      if (!map) return null;
      let marker = null;
      const set = (lat, lng, silent) => {
        lat = +lat;
        lng = +lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        if (!marker) {
          marker = L.marker([lat, lng], {
            draggable: true,
            icon: M.pin("eb-pin--edit"),
          }).addTo(map);
          marker.on("dragend", () => {
            const p = marker.getLatLng();
            if (opts.onChange) opts.onChange(p.lat, p.lng);
          });
        } else marker.setLatLng([lat, lng]);
        if (!silent && opts.onChange) opts.onChange(lat, lng);
      };
      map.on("click", (e) => set(e.latlng.lat, e.latlng.lng));
      if (Number.isFinite(opts.lat)) set(opts.lat, opts.lng, true);
      return {
        map,
        set,
        focus(lat, lng, z) {
          map.setView([lat, lng], z || 12);
        },
        clear() {
          if (marker) {
            map.removeLayer(marker);
            marker = null;
          }
        },
      };
    },
  });
})();
