---
"@apex-stack/core": minor
---

Route middleware — `middleware/*.ts`, each `export default defineMiddleware(ctx => …)`.

- Runs on every request (filename order; prefix `01.`/`02.` to sequence) before the page/API handler.
- `ctx` = `{ url, method, config, headers, locals, redirect(to, status?) }`. Set `ctx.locals.*` to attach request-scoped state (an authenticated user, request id, flags); return `ctx.redirect('/login')` to short-circuit.
- `locals` is threaded into the page `loader({ locals })` / `head`, and every `defineApexRoute`/resource handler (`{ locals }`) — REST and MCP.
- Wired through dev, prod (`apex start`, baked into the build manifest), and the static/server build. `apex make middleware <name>` scaffolds one. Foundation for the planned auth/permissions layer.
