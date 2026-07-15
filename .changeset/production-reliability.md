---
"@apex-stack/core": minor
"@apex-stack/data": patch
---

Production reliability (#25). 🟡 Experimental — the server target now ships the deploy basics:

- **Graceful shutdown** — `apex start` drains in-flight requests on SIGTERM/SIGINT (10s window,
  then force-close) and closes database pools: `@apex-stack/data` handles register their own
  `close()` with the new shutdown registry (a manual `handle.close()` deregisters — no
  double-close). A second Ctrl+C force-exits. Embedders: `gracefulShutdown(server)` +
  `onShutdown(fn)` from `@apex-stack/core/server`; `startProdServer` also returns `close()`.
- **Health checks** — `GET /health` / `/healthz` → `200 {status:'ok', uptime}` (liveness; served
  before auth/middleware).
- **Safe 500s** — production clients never see error messages, causes, or hints; a thrown API
  handler, MCP tool, or page loader returns a generic body while the FULL detail goes to your
  `onError` hook (or the server log). Dev and the test harness keep rich errors
  (`exposeErrors: true`).
- **Structured request logging + hooks** — one JSON line per request
  (`{time, method, path, status, ms}`, health probes skipped; `--quiet`/`APEX_LOG=off`), and a new
  `server/hooks.ts` convention (`defineHooks`): `onRequest` (replaces the default line), `onError`
  (wire Sentry here — kinds `api`/`page`/`mcp`/`http`), `onShutdown`. Programmatic:
  `createProdApp({ hooks, requestLog })`.
