/* ==========================================================================
   authentication.js — admin sign-in (email + one-time code), browser-side
   --------------------------------------------------------------------------
   NOTE FOR DEVELOPERS: this is NOT real security. Anything that runs in the
   browser can be read and bypassed by the person using it; it exists so the
   admin flow (email -> code -> dashboard) works on a static site with no
   server. What it does to limit exposure:
     - the allowed admin email is stored only as a SHA-256 hash
     - the one-time code is never stored in plain text (hash + expiry only)
     - codes expire after 5 minutes, allow 5 tries, then lock for 5 minutes
     - the session lives in sessionStorage and expires after 2 hours
   Because there is no email service here, the code is shown on the login
   page instead of being emailed. A production system MUST instead:
     1. verify the admin on a server (allow-list in a database),
     2. generate and email/SMS the code from the server, never show it,
     3. issue an HttpOnly, Secure, SameSite session cookie,
     4. enforce authorization on every create/update/delete API call.
   No API keys, secrets or admin credentials belong in this folder.
   ========================================================================== */
(function () {
  const EB = window.EB;

  const CFG = {
    otpSalt: "eb-otp-v1",
    // SHA-256 of the lower-cased, trimmed admin email (admin@explorebangladesh.com).
    // To use your own admin email run  await EB.Auth.sha256Hex('you@yourdomain.com')
    // in the browser console and paste the result here.
    emailHashes: [
      "9ef7eb37f432ddbdaec83beb46502947010a44223646661ba1472d41e8ec1714",
    ],
    otpTtlMs: 5 * 60 * 1000,
    maxAttempts: 5,
    lockMs: 5 * 60 * 1000,
    sessionTtlMs: 2 * 60 * 60 * 1000,
  };
  const KEY = {
    otp: "eb_admin_otp",
    session: "eb_admin_session",
    lock: "eb_admin_lock",
  };

  /* ---- SHA-256: WebCrypto when available, small pure-JS fallback otherwise ---- */
  function sha256js(str) {
    const bytes = Array.from(new TextEncoder().encode(str));
    const primes = [];
    for (let n = 2; primes.length < 64; n++)
      if (primes.every((p) => n % p)) primes.push(n);
    const frac = (x) => Math.floor((x - Math.floor(x)) * 4294967296);
    const K = primes.map((p) => frac(Math.cbrt(p)));
    const H = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));
    const len = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const bits = len * 8;
    for (let i = 7; i >= 0; i--)
      bytes.push(i > 3 ? 0 : (bits >>> (i * 8)) & 255);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < bytes.length; off += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++)
        w[i] =
          (bytes[off + 4 * i] << 24) |
          (bytes[off + 4 * i + 1] << 16) |
          (bytes[off + 4 * i + 2] << 8) |
          bytes[off + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3),
          s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25),
          ch = (e & f) ^ (~e & g),
          t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22),
          maj = (a & b) ^ (a & c) ^ (b & c),
          t2 = (S0 + maj) | 0;
        h = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) | 0));
    }
    return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
  }
  async function sha256(str) {
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(str),
        );
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
    } catch (e) {
      /* fall through */
    }
    return sha256js(str);
  }

  const ss = {
    get(k) {
      try {
        return JSON.parse(sessionStorage.getItem(k));
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        sessionStorage.setItem(k, JSON.stringify(v));
      } catch (e) {
        /* ignore */
      }
    },
    del(k) {
      try {
        sessionStorage.removeItem(k);
      } catch (e) {
        /* ignore */
      }
    },
  };
  const randomCode = () => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return String(a[0] % 1000000).padStart(6, "0");
  };
  const randomToken = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const Auth = (EB.Auth = {
    /* SHA-256 hex of the lower-cased, trimmed text (used for the admin email allow-list) */
    sha256Hex: (text) =>
      sha256(
        String(text || "")
          .trim()
          .toLowerCase(),
      ),

    lockedFor() {
      const l = ss.get(KEY.lock);
      return l && l.until > Date.now()
        ? Math.ceil((l.until - Date.now()) / 1000)
        : 0;
    },

    /* Step 1. Checks the email hash, then issues a one-time code. */
    async requestCode(email) {
      const wait = Auth.lockedFor();
      if (wait) return { ok: false, reason: "locked", seconds: wait };
      const h = await Auth.sha256Hex(email);
      if (!CFG.emailHashes.includes(h)) {
        ss.del(KEY.otp);
        return { ok: false, reason: "not_registered" };
      }
      const code = randomCode();
      ss.set(KEY.otp, {
        h: await sha256(CFG.otpSalt + ":" + code),
        exp: Date.now() + CFG.otpTtlMs,
        tries: 0,
      });
      // production: the server emails this code; it is never returned to the browser
      return { ok: true, code };
    },

    /* Step 2 */
    async verifyCode(code) {
      const wait = Auth.lockedFor();
      if (wait) return { ok: false, reason: "locked", seconds: wait };
      const otp = ss.get(KEY.otp);
      if (!otp || otp.exp < Date.now()) {
        ss.del(KEY.otp);
        return { ok: false, reason: "expired" };
      }
      otp.tries += 1;
      const good =
        (await sha256(CFG.otpSalt + ":" + String(code || "").trim())) === otp.h;
      if (good) {
        ss.del(KEY.otp);
        ss.del(KEY.lock);
        ss.set(KEY.session, {
          t: randomToken(),
          exp: Date.now() + CFG.sessionTtlMs,
        });
        return { ok: true };
      }
      if (otp.tries >= CFG.maxAttempts) {
        ss.del(KEY.otp);
        ss.set(KEY.lock, { until: Date.now() + CFG.lockMs });
        return { ok: false, reason: "locked", seconds: CFG.lockMs / 1000 };
      }
      ss.set(KEY.otp, otp);
      return { ok: false, reason: "wrong", left: CFG.maxAttempts - otp.tries };
    },

    isAuthenticated() {
      const s = ss.get(KEY.session);
      return !!(s && s.t && s.exp > Date.now());
    },
    logout() {
      ss.del(KEY.session);
      ss.del(KEY.otp);
    },
    requireAuth() {
      if (Auth.isAuthenticated()) return true;
      location.replace(EB.base + "admin/index.html");
      return false;
    },
  });
})();
