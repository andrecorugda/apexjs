---
"@apex-stack/core": minor
---

Phase C3 — sessions + hardening (the "hybrid" scope). New `@apex-stack/core/server`
subpath with server-only helpers:

- **Sealed-cookie sessions** on h3: `sessionAuth({ password })` (an `AuthConfig` that
  resolves the user from an encrypted+signed, HttpOnly cookie) plus `login`/`logout`/
  `getSession`. `apex make auth` scaffolds `server/auth.ts`.
- **CSRF** — `createApiHandler` now rejects cookie-authenticated mutations whose
  Origin/Referer host doesn't match (bearer/tokenless clients are exempt). Pure
  `isCsrfSafe` + `checkCsrf(event)`.
- **Rate limiting** — `createRateLimiter({ limit, windowMs })` (pure, clock-injectable)
  + `rateLimitKey(event)`.
- **Security headers** — `securityHeaders()` / `applySecurityHeaders(event)`.

OAuth / JWT issuance / 2FA remain adapter territory (wire via `sessionAuth`'s `toUser`
or a custom `defineAuth`).
