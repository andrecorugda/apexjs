---
"@apex-stack/core": patch
---

On-device sessions for `apex build --mobile`. Sealed-cookie auth (`login`/`logout`/`sessionAuth`,
gated routes, `locals.user`) now works offline on a bare engine, which has no WebCrypto:

- A dependency-free HMAC-SHA256 (verified against `node:crypto`) signs the session cookie when
  `globalThis.__APEX_DEVICE__` is set — the cookie is tamper-proof (signed) rather than encrypted,
  a sound tradeoff on-device where the payload is the user's own session on their own device. On
  a server, the encrypted h3/iron session is unchanged.
- The mobile bundler no longer drops session/auth modules and restores `middleware` + `auth` in
  the mobile manifest.
- Runtime-shim fix: the bundle's `Headers` now accepts an array of `[key, value]` pairs (how h3
  emits response headers), so `Set-Cookie` and `Content-Type` reach the client correctly — this
  fixes cookies **and** content-type on the real device, not just sessions.

Verified E2E on a bare-V8 vm: gated `/api/whoami` returns 401 anonymous / 200 with the user
after `POST /api/login`, `/account` renders the signed-in name server-side, and `logout` clears
the session.
