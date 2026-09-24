/* ==========================================================================
   netlify/functions/likes.js — server side of the like feature
   --------------------------------------------------------------------------
   Endpoints (all POST, JSON):
     /api/likes/toggle  PUBLIC  { id, liked, voter }  a visitor likes / unlikes a spot
     /api/likes/top     PUBLIC  { limit }             ranked spot ids ONLY (no counts)
     /api/likes/counts  ADMIN   {}                    { counts: { spotId: n } }
   One Netlify Blobs entry per (spot, visitor):  "<spotId>/<voterId>"
     - like   = set the entry   (liking twice just rewrites the same entry)
     - unlike = delete the entry
   So one visitor can never count more than once per spot, and there is no
   read-modify-write race between two visitors liking at the same time.
   Setup: npm i @netlify/blobs   |  env var ADMIN_KEY (same one spots.js uses)
   Local test: "netlify dev"
   ========================================================================== */
import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const isAdmin = (req) => {
  const want = process.env.ADMIN_KEY || "";
  const got = req.headers.get("x-admin-key") || "";
  if (!want) return { ok: false, reason: "not_configured", message: "ADMIN_KEY is not set." };
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b)
    ? { ok: true }
    : { ok: false, reason: "unauthorized" };
};

/* tally likes per spot from the blob keys ("spotId/voterId") */
async function tally(store) {
  const counts = {};
  for await (const page of store.list({ paginate: true })) {
    for (const b of page.blobs) {
      const i = b.key.indexOf("/");
      if (i > 0) counts[b.key.slice(0, i)] = (counts[b.key.slice(0, i)] || 0) + 1;
    }
  }
  return counts;
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, reason: "bad_request" }, 405);
  const action = new URL(req.url).pathname.replace(/\/+$/, "").split("/").pop();
  let body = {};
  try { body = await req.json(); } catch (e) { /* empty body is fine for top/counts */ }
  const store = getStore("likes");

  try {
    if (action === "toggle") {
      const id = String(body.id || ""), voter = String(body.voter || "");
      if (!/^[\w-]{1,64}$/.test(id) || !/^[a-f0-9]{32}$/.test(voter))
        return json({ ok: false, reason: "bad_request" }, 400);
      const key = id + "/" + voter;
      if (body.liked) await store.set(key, "1");
      else await store.delete(key);
      return json({ ok: true });
    }

    if (action === "top") {
      const limit = Math.min(Math.max(parseInt(body.limit, 10) || 12, 1), 50);
      const counts = await tally(store);
      const ids = Object.keys(counts)
        .sort((x, y) => counts[y] - counts[x] || x.localeCompare(y))
        .slice(0, limit);
      return json({ ok: true, ids }); // ids only, never the numbers
    }

    if (action === "counts") {
      const auth = isAdmin(req);
      if (!auth.ok) return json(auth, auth.reason === "unauthorized" ? 401 : 500);
      return json({ ok: true, counts: await tally(store) });
    }

    return json({ ok: false, reason: "bad_request" }, 404);
  } catch (e) {
    return json({ ok: false, reason: "error", message: "Like storage failed." }, 500);
  }
};

export const config = { path: "/api/likes/*" };