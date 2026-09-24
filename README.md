# Explore Bangladesh

A tourist spot discovery and travel guide site for Bangladesh. Plain HTML, CSS and JavaScript, with Bootstrap 5 for the grid and Leaflet for maps. No build step and no database.

## Run it

Open the folder with any static server (recommended) and visit `index.html`:

```bash
cd explore-bangladesh
python3 -m http.server 8000      # then open http://localhost:8000
```

Double-clicking `index.html` also works in most browsers. You need an internet connection for Bootstrap, Leaflet, Google Fonts, map tiles, weather and route preview (all loaded from CDNs or public APIs).

## Admin

Open `admin/index.html` (or the "Admin Login" link).

- Enter `admin@explorebangladesh.com` and click "Send Verification Code". The 6-digit code appears on the page (a static site has no way to email it). Enter it and click "Verify & Sign In".
- Codes expire after 5 minutes; 5 wrong tries lock the form for 5 minutes; the session lasts 2 hours.

Once signed in you can add, edit and permanently delete tourist spots, manage map coordinates, and export/import/reset data.

### To use your own admin email

The code contains only the SHA-256 hash of the allowed email. In the browser console on any page:

```js
await EB.Auth.sha256Hex('you@yourdomain.com')
```

Paste the result into `emailHashes` in `js/authentication.js` .

## Browser-side authentication vs production authentication

`js/authentication.js` is **browser-side authentication** only. Everything in a browser can be read and bypassed by whoever uses it, so this is a UI flow, not security. It does limit exposure (no plain email, no stored OTP, expiry, attempt limits, session timeout), but it does not protect anything.

For a real site you must:

1. Verify the administrator on a server against a stored allow-list.
2. Generate and email/SMS the code from the server; never send it to the browser.
3. Use an HttpOnly, Secure, SameSite session cookie.
4. Enforce authorization on every create, update and delete API call.
5. Keep API keys and secrets on the server only.

## LocalStorage limitations

All tourist data lives in `localStorage` under the key `touristSpots` (favorites in `eb_favorites`, recent in `eb_recent`, theme in `eb_theme`).

- It is per browser and per device. Nothing is shared between visitors or synced between devices.
- Clearing site data erases it. Use Dashboard > Export JSON for backups.
- Browser storage is about 5 MB. Uploaded photos are compressed to about 1280 px JPEG and stored inside the record, and the form reports when storage is full.
- Uploaded files are not permanent server storage.
- Client-side authentication is not secure (see above).

## Architecture

```
index.html, explore.html, divisions.html, districts.html,
tourist-spots.html, tourist-details.html, map.html, travel-guide.html, about.html
admin/  index (login), dashboard, add-spot, manage-spots, edit-spot, map-management
css/    style.css, responsive.css, admin.css
js/
  data.js          static reference data + 20 sample spots (no DOM, no storage)
  util.js          escaping, toast, modal, geo maths, safe URLs
  art.js           generated scenic SVGs used as placeholder photos
  storage.js       ONLY file that touches localStorage for tourist data (EB.Spots repository)
  favorites.js     favorites + recently viewed (self-pruning)
  search.js        partial-match search, filters, suggestions
  map.js           Leaflet helpers, Google Maps links, geocoding
  tourist-spots.js cards, gallery/lightbox/video, guide print/download, route, weather, details page
  app.js, pages.js shell (navbar, footer, theme) and per-page controllers
  authentication.js, admin.js, delete-spot.js
data/tourist-spots.json   the seed data as JSON (documents the shape for a backend)
```

Pages never read localStorage directly. They call `EB.Spots.all()`, `.get()`, `.add()`, `.update()`, `.remove()`.

### Migrating to a real backend

Keep the method names in `EB.Spots` (`storage.js`) and re-implement them with `fetch()` calls to your API, making them `async` (then `await` them in `pages.js`, `tourist-spots.js`, `admin.js`, `delete-spot.js`). Store images in object storage and keep URLs in the record. Replace `authentication.js` with real server auth.

### How deletion works

`EB.Delete.deleteTouristSpot(id)` in `delete-spot.js`:

1. Removes the whole record by its unique ID (never by name). Images and video are stored inside the record, so nothing is orphaned.
2. Removes that ID from every other spot's nearby-attractions list.
3. Removes it from favorites and recently viewed.
4. Verifies nothing references the ID any more.
5. Redraws every component (homepage, search, division/district/category results, map markers, nearby lists, admin list, dashboard statistics). Other open tabs redraw via the `storage` event.

A deleted spot's details URL shows "Tourist spot not found." Spot IDs (`spot_001`...) are never reused.

## Media

- **Hero video:** drop your footage at `videos/hero.mp4` (and optionally `videos/hero.webm`). It autoplays muted and loops with a dark overlay. Until a file exists, an animated scenic backdrop is shown. Keep it small (a few MB, 1080p max) and compress it.
- **Photos:** the sample spots use generated illustrations, not photographs. Add real photos in Admin > Edit (upload or https URL), or place files in `images/` and reference them as `images/name.jpg` in the data.
- **Spot videos:** paste a YouTube or direct MP4/WebM URL. Direct upload is limited to 1.5 MB because of browser storage.

## Maps and API keys

**Each tourist spot's exact location** is shown with an embedded Google Map (`google.com/maps?q=lat,lng&output=embed`, no API key), and the route section embeds Google directions. **The Map page** shows every tourist spot as a marker on one interactive Leaflet map; choosing a spot (marker popup or the list) loads its exact location in a Google Map below. Google's free embed can show only one place at a time, so a single Google map with all markers would need the Google Maps JavaScript API and a referrer-restricted API key. The Leaflet map uses free tiles that need no API key. Providers are tried in order (CARTO, then Esri, then OpenStreetMap) and the map switches automatically if one refuses to load; OpenStreetMap's own servers block pages that send no Referer (for example when opened from `file://`), which is why CARTO is first. Dark mode uses CARTO's dark tiles, and nearby markers group into clusters. "View Location on Google Maps" and "Get Directions" are plain Google Maps links: no key. The route preview uses the public OSRM demo server (driving only, no guarantee of availability), and geocoding uses Nominatim. Weather uses Open-Meteo (no key). For heavy production use, host your own routing/geocoding or use a paid provider with keys kept server-side.

If you later use the Google Maps JavaScript API, restrict its key by HTTP referrer.

## Things to check before publishing

- **Coordinates and travel details are approximate.** Verify each spot in Admin > Map Management, and confirm bus/train/air information, fees, opening hours and access rules (for example Saint Martin's, Sajek, Sundarbans permits) with current official sources.
- **Creator profile:** edit `EB.CREATOR` in `js/data.js` (name, bio, links, email). The photo is an initials placeholder.
- **Emergency numbers:** verify them.
- **Clean URLs:** pages use query strings (`tourist-details.html?id=spot_003`). For paths like `/spots/sajek-valley`, add server rewrites once you have a backend. Per-spot title, description, Open Graph text and JSON-LD are set by JavaScript at runtime, so for search-engine indexing consider server-side rendering.
- **CDN integrity:** for production pin Bootstrap and Leaflet with Subresource Integrity hashes, or self-host them.

## Accessibility and performance

Skip link, keyboard-navigable menus, tabs, gallery and modals with focus handling, ARIA labels/live regions, visible focus, `prefers-reduced-motion` support, dark mode. Images are lazy-loaded and compressed, and only one video is ever on a page.

## Testing performed

An automated browser run (Chromium/Playwright, with CDNs blocked) covered: every page loads without script errors; partial search ("Saj", "Sylhet", "coxs"); dependent Division -> District dropdowns; details page, gallery, tabs, lightbox; not-found state; no horizontal scroll at 390 px; admin login (unknown email, wrong code, correct code); add (with validation, unique ID, HTML escaping), edit and delete (confirmation modal, cancel, cascade cleanup of favorites/recent/nearby, removal from public pages, ID never reused); cross-tab refresh. Map rendering itself was not exercised because CDNs were blocked; the "Map could not be loaded" fallback was.
