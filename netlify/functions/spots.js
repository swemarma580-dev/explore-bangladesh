/* ==========================================================================
   netlify/functions/spots.js — updates data.js on Netlify without a server
   --------------------------------------------------------------------------
   A Netlify Function cannot write to the deployed site's files. Instead it
   commits the changed data.js to your GitHub repository through the GitHub
   API. Netlify sees the commit and redeploys the site automatically, so the
   next page load serves the new data.js.

   Endpoints (via the redirect in netlify.toml):
     POST /api/spots/upsert   { mode: 'add' | 'update', spot }
     POST /api/spots/remove   { id }

   Netlify environment variables (Site settings > Environment variables):
     ADMIN_KEY        a long secret you choose; the admin panel asks for it once
     GITHUB_TOKEN     fine-grained token: this repo only, Contents = Read and write
     GITHUB_REPO      owner/repo, e.g. ushoinu/explore-bangladesh
     GITHUB_BRANCH    optional, default "main" (must be the branch Netlify deploys)
     DATA_FILE_PATH   optional, default "js/data.js" (path of data.js inside the repo)

   Same rules as server.js: only the block between ADMIN_MANAGED_START and
   ADMIN_MANAGED_END is rewritten, duplicates are rejected, and the result is
   re-evaluated before it is committed. Git history is your backup.
   ========================================================================== */
'use strict';

const vm = require('vm');
const crypto = require('crypto');

const ENV = process.env;
const REPO = ENV.GITHUB_REPO, TOKEN = ENV.GITHUB_TOKEN, ADMIN_KEY = ENV.ADMIN_KEY;
const BRANCH = ENV.GITHUB_BRANCH || 'main';
const FILE = (ENV.DATA_FILE_PATH || 'js/data.js').replace(/^\/+/, '');

/* ---------------------------------------------------------------- data.js helpers */
const BLOCK = /(\/\* >>> ADMIN_MANAGED_START[^\n]*\n)([\s\S]*?)(\n[ \t]*\/\* <<< ADMIN_MANAGED_END \*\/)/;
const fail = (status, reason, message) => Object.assign(new Error(message || reason), { status, reason });

function readAdmin(src) {
  const m = BLOCK.exec(src);
  if (!m) throw fail(500, 'bad_marker', 'data.js has no ADMIN_MANAGED_START / ADMIN_MANAGED_END markers.');
  const inner = m[2];
  let o;
  try { o = JSON.parse(inner.slice(inner.indexOf('{'), inner.lastIndexOf('}') + 1)); }
  catch (e) { throw fail(500, 'bad_marker', 'The block between the markers in data.js is not valid JSON.'); }
  return { rev: Number(o.rev) || 0, added: Array.isArray(o.added) ? o.added : [], removed: Array.isArray(o.removed) ? o.removed : [] };
}
const replaceBlock = (src, admin) => src.replace(BLOCK, (all, start, inner, end) => start + '  EB.ADMIN_DATA = ' + JSON.stringify(admin, null, 2) + ';' + end);

function evaluate(code) {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 3000 });
  const EB = sandbox.window.EB;
  if (!EB || !Array.isArray(EB.SEED_SPOTS)) throw fail(500, 'verify_failed', 'data.js did not produce EB.SEED_SPOTS.');
  return EB;
}

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

function clean(raw) {
  if (!raw || typeof raw !== 'object') throw fail(400, 'invalid', 'Missing spot.');
  const str = (v) => (v == null ? '' : String(v));
  const arr = (v) => (Array.isArray(v) ? v : []);
  const tg = raw.travelGuide || {};
  const s = {
    id: str(raw.id), name: str(raw.name).trim(), division: str(raw.division), district: str(raw.district), category: str(raw.category),
    featured: !!raw.featured, description: str(raw.description), history: str(raw.history), whyVisit: str(raw.whyVisit),
    bestTime: str(raw.bestTime) || 'Year-round', bestTimeNote: str(raw.bestTimeNote), hours: str(raw.hours), entryFee: str(raw.entryFee),
    mainImage: str(raw.mainImage), images: arr(raw.images).map(str).filter(Boolean), video: str(raw.video),
    latitude: Number(raw.latitude), longitude: Number(raw.longitude),
    travelGuide: {
      bus: str(tg.bus), train: str(tg.train), air: str(tg.air), localTransport: str(tg.localTransport),
      distance: str(tg.distance), travelTime: str(tg.travelTime), route: str(tg.route), instructions: str(tg.instructions)
    },
    nearbyAttractions: arr(raw.nearbyAttractions).map(str), safetyTips: arr(raw.safetyTips).map(str).filter(Boolean),
    createdAt: str(raw.createdAt) || new Date().toISOString(), updatedAt: str(raw.updatedAt) || new Date().toISOString()
  };
  if (!/^spot_\d+$/.test(s.id)) throw fail(400, 'invalid', 'Invalid spot id.');
  ['name', 'division', 'district', 'category', 'description'].forEach((k) => { if (!s[k].trim()) throw fail(400, 'invalid', 'Missing field: ' + k); });
  if (!(s.latitude >= 20.5 && s.latitude <= 26.7 && s.longitude >= 88 && s.longitude <= 92.8)) throw fail(400, 'invalid', 'Coordinates must be inside Bangladesh.');
  return s;
}

/* ---------------------------------------------------------------- pure operations: (src, body) -> { next, result } */
function opUpsert(src, body) {
  const mode = body && body.mode === 'add' ? 'add' : 'update';
  const spot = clean(body && body.spot);
  const admin = readAdmin(src);
  const existing = evaluate(src).SEED_SPOTS;
  const has = existing.some((x) => x.id === spot.id);
  if (mode === 'add' && has) throw fail(409, 'id_exists', 'A spot with this ID already exists in data.js.');
  if (existing.some((x) => x.id !== spot.id && norm(x.name) === norm(spot.name) && norm(x.district) === norm(spot.district)))
    throw fail(409, 'duplicate', 'A tourist spot with this name already exists in this district.');
  admin.removed = admin.removed.filter((id) => id !== spot.id);
  const i = admin.added.findIndex((a) => a.id === spot.id);
  if (i >= 0) admin.added[i] = spot; else admin.added.push(spot);
  admin.rev += 1;
  const expected = existing.length + (has ? 0 : 1);
  const next = replaceBlock(src, admin);
  const list = evaluate(next).SEED_SPOTS;
  if (list.length !== expected || !list.some((x) => x.id === spot.id && x.name === spot.name)) throw fail(500, 'verify_failed', 'Verification failed. Nothing was committed.');
  return { next, result: { ok: true, id: spot.id, rev: admin.rev, count: expected }, message: (has ? 'Update' : 'Add') + ' tourist spot: ' + spot.name };
}

function opRemove(src, body) {
  const id = String((body && body.id) || '');
  if (!/^spot_\d+$/.test(id)) throw fail(400, 'invalid', 'Invalid spot id.');
  const admin = readAdmin(src);
  const existing = evaluate(src).SEED_SPOTS;
  if (!existing.some((x) => x.id === id)) return { next: null, result: { ok: true, removed: false, rev: admin.rev, count: existing.length } };
  const baseIds = new Set(evaluate(replaceBlock(src, { rev: 0, added: [], removed: [] })).SEED_SPOTS.map((x) => x.id));
  admin.added = admin.added.filter((a) => a.id !== id);
  if (baseIds.has(id) && !admin.removed.includes(id)) admin.removed.push(id);
  admin.rev += 1;
  const expected = existing.length - 1;
  const next = replaceBlock(src, admin);
  const list = evaluate(next).SEED_SPOTS;
  if (list.length !== expected || list.some((x) => x.id === id)) throw fail(500, 'verify_failed', 'Verification failed. Nothing was committed.');
  return { next, result: { ok: true, removed: true, rev: admin.rev, count: expected }, message: 'Remove tourist spot ' + id };
}

/* ---------------------------------------------------------------- GitHub */
function gh(method, url, body, accept) {
  return fetch('https://api.github.com' + url, {
    method,
    headers: Object.assign({
      Authorization: 'Bearer ' + TOKEN, Accept: accept || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'explore-bangladesh-admin'
    }, body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
}
const contentsUrl = () => '/repos/' + REPO + '/contents/' + FILE.split('/').map(encodeURIComponent).join('/');

async function readFile() {
  const meta = await gh('GET', contentsUrl() + '?ref=' + encodeURIComponent(BRANCH));
  if (!meta.ok) throw fail(502, 'github_error', 'GitHub could not read ' + FILE + ' (HTTP ' + meta.status + '). Check GITHUB_REPO, GITHUB_BRANCH, DATA_FILE_PATH and the token permissions.');
  const j = await meta.json();
  if (j.content && j.encoding === 'base64') return { sha: j.sha, text: Buffer.from(j.content, 'base64').toString('utf8') };
  // files over 1 MB come back without inline content: fetch the raw text
  const raw = await gh('GET', contentsUrl() + '?ref=' + encodeURIComponent(BRANCH), null, 'application/vnd.github.raw+json');
  if (!raw.ok) throw fail(502, 'github_error', 'GitHub could not read the raw ' + FILE + ' (HTTP ' + raw.status + ').');
  return { sha: j.sha, text: await raw.text() };
}

async function writeFile(text, sha, message) {
  const r = await gh('PUT', contentsUrl(), { message, content: Buffer.from(text, 'utf8').toString('base64'), sha, branch: BRANCH });
  if (r.ok) return true;
  if (r.status === 409 || r.status === 422) return false;   // file changed meanwhile: caller retries
  throw fail(502, 'github_error', 'GitHub refused the commit (HTTP ' + r.status + '). The token needs Contents: Read and write on this repository.');
}

/* ---------------------------------------------------------------- handler */
exports.handler = async (event) => {
  const H = event.headers || {};
  const origin = H.origin, cors = {};
  if (origin) {
    let host = '';
    try { host = new URL(origin).hostname; } catch (e) { /* ignore */ }
    const own = String(H.host || '').split(':')[0];
    if (host !== own && !['localhost', '127.0.0.1'].includes(host)) return respond(403, { ok: false, reason: 'forbidden', message: 'Origin not allowed.' });
    Object.assign(cors, { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key' });
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return respond(405, { ok: false, reason: 'method', message: 'Use POST.' }, cors);

  const missing = ['GITHUB_REPO', 'GITHUB_TOKEN', 'ADMIN_KEY'].filter((k) => !ENV[k]);
  if (missing.length) return respond(500, { ok: false, reason: 'not_configured', message: 'Missing Netlify environment variables: ' + missing.join(', ') }, cors);

  const given = Buffer.from(String(H['x-admin-key'] || '')), want = Buffer.from(ADMIN_KEY);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return respond(401, { ok: false, reason: 'unauthorized', message: 'Wrong or missing admin key.' }, cors);

  let body;
  try { body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '{}'); }
  catch (e) { return respond(400, { ok: false, reason: 'invalid', message: 'Body is not valid JSON.' }, cors); }

  const path = String(event.path || '');
  const op = /\/upsert\/?$/.test(path) ? opUpsert : /\/remove\/?$/.test(path) ? opRemove : null;
  if (!op) return respond(404, { ok: false, reason: 'not_found', message: 'Unknown endpoint.' }, cors);

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const file = await readFile();
      const out = op(file.text, body);
      if (!out.next) return respond(200, out.result, cors);
      if (await writeFile(out.next, file.sha, out.message + ' (via admin panel)')) return respond(200, out.result, cors);
    }
    return respond(409, { ok: false, reason: 'conflict', message: 'data.js was changed by someone else at the same moment. Try again.' }, cors);
  } catch (e) {
    return respond(e.status || 500, { ok: false, reason: e.reason || 'server_error', message: e.message }, cors);
  }
};

function respond(status, obj, headers) {
  return { statusCode: status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers), body: JSON.stringify(obj) };
}