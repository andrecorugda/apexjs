# Core — the runtime + CLI (`@apex-stack/core`)

**What it is.** `packages/apexjs` is the framework runtime and the `apex` CLI. It
owns file-based routing, the h3 request pipeline (SSR + REST + MCP), islands
orchestration, config/env resolution, middleware + auth wiring, and production
server hardening. Everything is authored as **h3 event handlers** so one pipeline
serves the Vite dev server, a standalone Node server, a serverless handler, and a
bare on-device engine.

**How it's designed.** There is exactly one request pipeline, expressed twice with a
shared core: the **dev server** (`src/dev/server.ts`) fronts Vite in middleware mode
and loads project modules *per request* (edits apply with no restart); the **prod
server** (`src/prod/server.ts`) reads a build manifest and imports pre-built modules.
Both mount the *same* `createApiHandler` / `createMcpHandler` / `renderPage`. Auth is
resolved once per request and enforced identically across pages, REST, and MCP (see
[auth.md](./auth.md)).

---

## 1. File-based routing — `src/routing/router.ts`

`scanPages(root)` walks `pages/**/*.alpine` into a `RouteDef[]`; `matchRoute(routes, url)`
resolves a request path to `{ pageId, params }`.

- `pages/index.alpine` → `/`, `pages/about.alpine` → `/about`, `pages/blog/index.alpine`
  → `/blog`, `pages/blog/[slug].alpine` → `/blog/:slug`, `pages/docs/[...path].alpine`
  → catch-all `/docs/:path*`.
- A trailing `index` segment is dropped; `[param]` is a dynamic segment; `[...name]`
  is a catch-all (captures ≥1 remaining segments, joined by `/`).
- **Precedence** is explicit: static (0) < dynamic param (1) < catch-all (2), sorted
  so specific routes win.
- `error.alpine` and `loading.alpine` are **reserved** top-level pages (error boundary
  / slow-nav boundary), excluded from the navigable table.

The API surface has its own matcher: `matchApi` in `src/api/routes.ts` matches
`/api/*` patterns + method against a flat `ApiEntry[]` table.

## 2. The route/tool contract — `src/api/defineRoute.ts`

`defineApexRoute({ method, input, mcp, auth, can, handler })` returns a
`TypedApexRoute<In, Out>`. Key design points:

- **`input` is a zod raw shape** and drives *both* REST validation and the MCP tool's
  `inputSchema` — one definition, both worlds. This single-contract property is what
  makes "any Apex API can be an MCP tool" possible with no extra user library.
- The route carries **phantom `__input`/`__output` types** (erased at runtime) so a
  frontend `import type` + `InferInput`/`InferOutput` gets the API's types with zero
  drift.
- The handler receives `{ input, url, config, locals, user, event }`. `event` is the
  raw h3 event (server-only; `undefined` for MCP calls — no HTTP event). `user` is the
  resolved identity or `null`.
- `mcp: true` opts a route into the MCP surface; `mcpName` overrides the tool name
  (must match `^[a-zA-Z0-9_-]{1,64}$`).

A **resource** (`src/api/resource.ts`, produced by `@apex-stack/data`'s `defineResource`)
is recognized by `isApexResource` and expands to several `ApiEntry`s (`<name>_list`,
`_get`, `_create`, `_update`, `_delete`) via `expandApiModule`.

## 3. The REST pipeline — `src/api/routes.ts`

`loadApiRoutes(root, loadModule)` discovers `server/api/*.ts`, expanding each default
export (a single route or a resource) into the entry table. A module whose default is
a plain function (not `defineApexRoute`/`defineResource`) is **warned about, not
silently 404'd**; an unresolvable import throws an *actionable* message naming the dep
and the install command (`loadErrorMessage`) — or is skipped under `{ lenient: true }`.

`createApiHandler(entries, config, auth, opts)` is a single h3 handler that, in order:

1. `matchApi` → 404 if no route.
2. **CSRF** — `checkCsrf(event)` rejects a cookie-authed mutation with a bad
   Origin/Referer (403). Bearer/tokenless clients are exempt.
3. **Body-size cap** — reject an oversized non-GET body before parsing (413).
4. Merge input: `getQuery` (GET) or `readBody` (else) + route params, then
   `z.object(inputShape).safeParse` → 400 with issues on failure.
5. **Authorization** — `getRequestUser(event, auth, config)` then
   `checkRouteAccess(route, user, input)` → 401/403 (see [auth.md](./auth.md) §5).
6. **Idempotency** — a mutation carrying `Idempotency-Key` runs once; the outcome is
   replayed for 24h (`beginIdempotency`, `src/api/idempotency.ts`). Deliberately *after*
   auth (keys are user-scoped). Concurrent duplicate → 409.
7. Dispatch `route.handler(...)`. Result is serialized explicitly (so a `null` is a
   parseable `200 null`, not h3's `204`). A handler-set status (e.g. a login route's
   401) is preserved.
8. **Errors** — a typed domain error's `httpStatus` (e.g. `ModelNotFoundException` →
   404) is honored; 4xx bodies surface the real message; **5xx bodies are generic in
   prod** (`exposeErrors: false`) and the full error goes to `opts.onError` (the hook)
   with a request id. Dev/tests set `exposeErrors: true` and add a "run `apex migrate`"
   hint for missing-table errors.

## 4. The MCP endpoint — `src/mcp/server.ts`

Every `mcp: true` route becomes an AI-callable tool at `POST /mcp`. `createMcpHandler`
mounts an MCP server (`@modelcontextprotocol/sdk`, Streamable HTTP, stateless JSON
mode) built **per request**:

- The tool list is **filtered per user**: `checkRouteAccess(route, user, undefined,
  { listTime: true })` omits tools the caller can't reach from `tools/list`.
- Each tool **re-checks authorization at call time** with the real args — never relying
  on list-time omission (defense-in-depth, [auth.md](./auth.md) §3.4).
- `safeInputSchema` guards against a zod shape that can't be represented in JSON Schema
  (e.g. `z.date()`): rather than crash `tools/list` for the whole app, that one tool
  degrades to a loose schema.
- Tool failures mirror the REST error policy: full detail to `onError`, generic text to
  the client unless `exposeErrors`.

`hasMcpRoutes(entries)` lets the prod server mount `/mcp` only when some route opted in.

## 5. Config + runtime — `src/config/`

- **`runtime.ts` is browser-safe** (no `node:fs`): `defineConfig`, `useRuntimeConfig`,
  `env`, and the public/private split. `RuntimeConfig` top-level keys are server-only;
  the `public` subset is serialized into the page (`clientConfigScript`) and read in the
  browser. `useRuntimeConfig()` returns the full config on the server, the `public`
  subset on the client (Nuxt's model). Also here: `PwaConfig`/`ImageConfig`/`FontConfig`
  types and the PWA head/register snippets (kept here so the renderers — which also run
  on a bare mobile engine — never import `node:fs`).
- **`resolve.ts` is server-only**: loads `.env`, `.env.<mode>`, `.env.local`,
  `.env.<mode>.local` (later wins, never clobbering real `process.env`) and
  `apex.config.{ts,js,mjs}`, then **overrides each declared leaf from env** —
  `APEX_<PATH>` for private keys, `APEX_PUBLIC_<PATH>` for `public` (camelCase ↔
  SCREAMING_SNAKE), coercing to the declared type. `structuredClone` keeps the loaded
  defaults pristine so the build bakes them and the prod server applies deploy-time env
  over them at start (`applyEnvToRuntimeConfig`).

## 6. Middleware + auth resolution — `src/middleware/`, `src/auth/`

Before the API/page handlers, both servers run one h3 handler that resolves the user
and runs middleware:

- `getRequestUser(event, auth, config)` (`src/auth/run.ts`) runs `defineAuth.resolve`
  **once per request**, memoized on `event.context`. A throwing resolver yields an
  anonymous request (fail-closed), never a 500. It seeds `locals.user`.
- `loadMiddleware` + `runMiddleware` (`src/middleware/run.ts`) run `middleware/*.ts` in
  order. A middleware returns `ctx.redirect(to, status)` to short-circuit; otherwise it
  mutates `ctx.locals`, which becomes `event.context.apexLocals` and flows to every
  loader + route handler.
- i18n (when `apex.config.i18n` is set) resolves the locale from a `/<locale>` path
  prefix or `Accept-Language`, stashes the stripped path on `event.context.apexPath`,
  and seeds `locale` + a `t` function into locals.

> This middleware step **resolves identity + feeds pages**; it is **not** the security
> gate. Auth is enforced again *inside* the API/MCP handlers — the real, fail-closed
> boundary. Never move an authorization decision into middleware only (see auth.md §3.5
> on Next's CVE-2025-29927).

## 7. Islands — `src/islands/render.ts`

Islands mode renders a page static-first: the whole template is SSR'd, then every
element carrying a `client:*` directive becomes an independently-hydrating island.
The inlined `islandLoader` imports Alpine **lazily** on the first island that needs it
and hydrates per trigger — `load` (immediate), `idle` (`requestIdleCallback`),
`visible` (`IntersectionObserver`), `none` (never). A page with no hydrating islands
ships **zero JavaScript**. Details in [pages.md](./pages.md) §4 and [components.md](./components.md) §2.

## 8. Servers — dev vs prod

**Dev — `src/dev/server.ts`.** Vite in `middlewareMode` handles assets/HMR/`.alpine`
module requests; an h3 app SSRs whatever Vite doesn't serve. Everything is loaded via
`vite.ssrLoadModule` **per request** (routes, resources, middleware, auth, components,
stores, layouts), so edits apply without a restart (config/`.env` need a restart, like
Nuxt). `exposeErrors: true` gives real messages + the migrate hint. Windows path
normalization and runtime-dep aliasing (so a globally-installed `apex` works) live here.

**Prod — `src/prod/server.ts`.** `createProdApp({ dir })` reads
`<dist>/apex-manifest.json` (`ProdManifest`) and imports the built server modules —
components, API entries, middleware, auth, hooks, layouts — with **no Vite**. Handler
order: security (request-id → headers/CSP → CORS → rate-limit) → `GET /health`/`/healthz`
liveness → optional per-request JSON log → static assets → user+middleware →
`/api` → `/mcp` → SSR page. `createProdNodeHandler` / `createProdWebHandler` wrap it for
serverless (Node vs Web-fetch), and `startProdServer` runs it as a standalone Node
server with graceful drain on SIGTERM/SIGINT (`src/prod/shutdown.ts`).

**The mobile seam.** `createProdApp` accepts `loadModule` — overriding how server
modules load. The default dynamic-`import()`s files off disk; a bare on-device engine
(no filesystem) passes `(relFile) => Promise.resolve(registry[relFile])` with a static
module registry, and `createProdWebHandler` gives a `(Request) => Promise<Response>`
handler with no Node dependency. This is what lets the *same* SSR+API pipeline run in a
WebView/QuickJS isolate (see `mobile-poc/`).

## 9. Server hardening — `src/security/`

`resolveSecurityConfig(runtimeConfig.security)` resolves headers/CSP, CORS, HSTS,
rate-limit, body-size cap, and server timeouts (Slowloris/socket-exhaustion guards
applied in `startProdServer`). Every layer is on by default and env-overridable
(`APEX_SECURITY_*`). The rate limiter warns at boot when using the in-memory
single-process store (under-counts behind a load balancer) — pass a shared `KvStore`
(`rateLimitStore`) for a global counter. See [auth.md](./auth.md) §4.5.

## 10. The CLI — `src/cli.ts`, `src/commands/*`

`apex` is a `citty` command tree. Heavy commands (`dev`/`build`/`start`/`make`/…) are
**lazy-imported** so `apex new`/`--help`/the banner never pull in Vite+rollup (which can
crash on a broken native rollup binary). Commands: `new`, `dev`, `build`, `mobile`,
`start`, `make`, `add`, `extend`, `theme`, `upgrade`, `migrate`, `check`, `mcp`,
`mcp-server`, `test` (see `packages/apexjs/src/commands/`). `mcp-server` exposes the CLI
*itself* as MCP tools for AI agents (`apex_make`, `apex_check`, …).

---

## Extension points

- **A new route/tool capability** → add fields to `ApexRouteConfig` in
  `src/api/defineRoute.ts` and honor them in `createApiHandler` + `createMcpHandler`.
  Keep the *one contract, both surfaces* invariant.
- **A new request-pipeline step** (e.g. tracing) → add an h3 handler in both
  `src/dev/server.ts` and `src/prod/server.ts` at the same position, or thread it
  through `ApiHandlerOptions`/`McpHandlerOptions`. Business logic belongs in a service,
  not the handler.
- **A new route/segment convention** → extend `scanPages`/`matchRoute` in
  `src/routing/router.ts` (and `matchApi` for API paths).
- **A new deploy target** → add a preset under `src/build/presets/` (see
  `cloudflare.ts`/`vercel.ts`/`netlify.ts`/`docker.ts`) and reuse
  `createProdNodeHandler`/`createProdWebHandler`.
- **A new CLI command** → add a lazy entry in `src/cli.ts` + a module in
  `src/commands/`, and (if agent-facing) a tool in `src/commands/mcp-server.ts`.

## Gotchas

- **Middleware is not a security boundary.** It resolves identity + redirects; the
  API/MCP handlers re-enforce auth. An AI over MCP never passes through page middleware.
- **MCP list-time can't see input.** A `can` that needs input or throws is treated as
  *visible* at list time and deferred to the (fail-closed) call-time check
  (`src/auth/check.ts`).
- **One bad tool schema must not kill `tools/list`.** `safeInputSchema` degrades a
  non-representable shape (e.g. `z.date()`) to a loose one. Model timestamps map to
  strings to avoid this (see [data.md](./data.md)).
- **Config edits need a dev restart**; routes/pages hot-reload. `.env` is read from the
  *deploy* working directory at prod start, not the build dir.
- **Prod 5xx bodies are intentionally generic.** Don't "fix" a missing error message by
  flipping `exposeErrors` on in prod — wire `server/hooks.ts` `onError` instead.
- **SSR HTML is `Cache-Control: no-store`** (it embeds per-request/session data). Static
  builds are served as files with their own caching.

*Grounded in: `packages/apexjs/src/routing/router.ts`, `api/defineRoute.ts`, `api/routes.ts`,
`api/resource.ts`, `api/idempotency.ts`, `mcp/server.ts`, `config/runtime.ts`, `config/resolve.ts`,
`auth/run.ts`, `auth/check.ts`, `auth/define.ts`, `middleware/define.ts`, `middleware/run.ts`,
`islands/render.ts`, `dev/server.ts`, `prod/server.ts`, `prod/shutdown.ts`, `security/*`, `cli.ts`,
`commands/*`; plus `API.md` and `packages/apexjs/CHANGELOG.md`.*
