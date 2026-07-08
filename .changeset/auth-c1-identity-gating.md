---
"@apex-stack/core": minor
---

Phase C1 — auth identity + route gating. New `defineAuth({ resolve })` in
`server/auth.ts` resolves the request's user once per request and injects it as
`user` into every route handler and MCP tool call (and `locals.user` for page
loaders). Routes gain a `auth: true` gate (anonymous → 401) and an optional
`can: ({ user, input }) => boolean` (→ 403). The MCP endpoint filters `tools/list`
per user and re-checks authorization on `tools/call` (defense-in-depth). Enforced
identically over REST and MCP, in the handler layer (not middleware-only),
fail-closed. Wired through both the dev server and the production build/server.
