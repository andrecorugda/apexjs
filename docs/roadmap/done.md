# Shipped

What actually exists today, grouped by area. Each row cites the version that shipped it
(from the package `CHANGELOG.md`s). Statuses (🟢 Stable / 🟡 Experimental) are per
[`API.md`](../../API.md) — most newer surface is 🟡 by design (graduates to 🟢 after ≥2
minors unchanged + a real app using it).

> The honest headline: **one proof point ties the whole stack together** — a canvas game
> built as a single Apex app and shipped to **web + Android (APK) + iOS shell + PWA** off
> one codebase, its full SSR + API + on-device SQLite running on a bare on-device JS engine
> (`@apex-stack/core@0.43.2` closed the last on-device build/asset bugs from that real build).

---

## Core — rendering, routing, islands, MCP

| Capability | Since | Notes |
|---|---|---|
| `.alpine` SFC → SSR, hydration-safe (no flash) + Vite HMR | 0.2.x (Phase 0) | `<script server>` `loader()`/`head()`, `<script client>`, `<template>`, `<style scoped>` |
| **`.alpine` is TypeScript-only** | 0.30.0 | `lang="js"` is a parse error; scripts default to TS |
| File-based routing | 0.2.x | `pages/**/*.alpine`, `[param]` dynamic, `index.alpine` → parent, 404s |
| Layouts + nested layouts, error boundary, loading boundary | Wave B | `layouts/*.alpine` + `<slot>`, `pages/error.alpine`, `pages/loading.alpine` |
| Components, folder-namespaced | 0.28.0 | `components/ui/Card.alpine` → `<UiCard/>`; props static + `:bound` |
| Components inside `x-for` / `x-if` (fully styled hydration) | 0.9.0–0.11.0 | the thing raw Alpine can't do; scoped CSS fixed in-loop (0.9.1) |
| Islands / partial hydration | 0.x | `client:load \| idle \| visible \| none`; zero JS until an island needs it |
| **AI-native — every typed route is an MCP tool** | AI-native phase | `defineApexRoute` serves REST **and** an auto-MCP tool at `/mcp`; `apex mcp` inspector |
| Client-side navigation (SPA) | 0.8.0 | fetch + swap, history, prefetch, progress bar |
| Component-level server loaders (singleton + in `x-for`/`x-if`, memoized) | 0.10.0–0.11.0 | self-contained widgets own their data; no payload island |
| `defineStore` (SSR-safe global state), `createAction` (form sugar) | Wave B | |
| Runtime config, middleware, `InferInput/Output` shared FE/BE types | Wave B | `defineConfig` + `.env`; `middleware/*.ts` |
| i18n | 0.17.0 | `i18n` config + `locales/*.json`; `t`/`locale` in loaders; `/<locale>` + `Accept-Language`; SSR `<html lang>` |
| `app.client.ts` hook | 0.29.0 | register Alpine plugins/directives/magics (`$persist`, `x-mask`, morph…); root-x-data magic support (0.32–0.34) |
| **Fine-grained (DOM-morphing) HMR** 🟡 | vite 0.5.0 / kit 0.10.0 ([#20](https://github.com/andrecorugda/apexjs/issues/20)) | template-markup edits morph the live DOM preserving Alpine state (open dropdowns, input, scroll); style edits hot-swap; `x-data`/`<script>` changes fall back to full-reload. Verified in a real browser |
| **Image & font optimization** 🟡 | core 0.44.0 / kit 0.10.0 ([#18](https://github.com/andrecorugda/apexjs/issues/18)) | `<Image>` helper (responsive `srcset`/`sizes` + explicit dims); build-time transform → hashed webp/avif variants (`apex build` / `--server`); self-hosted fonts (`@font-face` + `<link rel=preload>`). Islands-mode transform is a follow-up ([#57](https://github.com/andrecorugda/apexjs/issues/57)) |

## Data layer — `@apex-stack/data` (Eloquent-parity ORM)

Built on Drizzle. One `defineModel` is the single source of truth: schema + migration +
Drizzle table + zod validation + REST endpoints + MCP CRUD tools **and** a typed client hook.

| Capability | Since | Notes |
|---|---|---|
| `defineModel` — one spec → schema/migration/table/REST+MCP resource | data 0.2.0 | 🟢 Stable (the model definition); dialect-agnostic (SQLite/libSQL/Turso + Postgres/Supabase/Neon/PGlite) |
| **Active-record query API on the model** | data 0.11.0 | reads (`first/find/findOrFail/where/orderBy/limit/count/exists/pluck/sum/avg/min/max/chunk/lockForUpdate`) + writes (`create/update/updateOrCreate/upsert/insertMany/updateMany/delete`) — 🟡 |
| Writes go through the **same pipeline as REST/MCP** | data 0.11.0 | `repository()` extracted + shared, so `Model.*` and `/api/*` can't diverge; mass-assignment-safe, column names validated |
| **Relations + eager loading** (no N+1) | data 0.11.0 | `belongsTo/hasOne/hasMany` + `.with(...)` (N parents → 1 extra query); belongsToMany/pivot deferred |
| Model **instances** + **Collections** + serialization | data 0.11.0 | `save/delete/refresh/isDirty/changes/toJSON`; `hidden` omits secrets from every REST/MCP response |
| **Attribute casts** | data 0.11.0 | `date/number/boolean/json` or custom `{get,set}` |
| Named scopes | data 0.11.0 | `scopes: {...}` → `Model.scope('published').all(h)` |
| **Transactions** (atomic, auto commit/rollback) | data 0.11.0 | `handle.transaction(fn)`; savepoints for nesting; works on-device via manual BEGIN/COMMIT |
| Optimistic + pessimistic locking | data 0.11.0 | `optimisticLock: 'version'` → `StaleModelException` (409); `.lockForUpdate()` (Postgres) |
| **Typed errors** carrying `httpStatus` | data 0.11.0 | `ApexDataError`, `ModelNotFoundException` (404), `QueryException` (500), `StaleModelException` (409) |
| Schema depth — indexes + foreign keys | data 0.11.0 | field `index`/`references` (cascade/set-null/restrict), model `indexes`; identifiers quoted (fixes Postgres camelCase) |
| Model behaviors ("traits") | data 0.5.0–0.6.1 | `use: [...]` composable descriptors: `timestamps()`, `owned()`, `softDeletes()`, `observable()`, `auditable()` (companion audit table logs an AI's MCP writes for free) |
| Migrations — up/down + rollback, versioned files | data 0.3.0 | `.sql` files, `_apex_migrations` ledger, `apex migrate [--rollback --steps N]`; scaffolds use real migration files (core 0.43.1) |
| Test-data factories | data 0.7.0 | `factory(model)` infers schema-valid rows; pluggable faker |
| List-API params on resources | data 0.11.0 | `?page`/`?perPage` envelope, `?sort=-col`, `?<col>=` filters — REST + `_list` MCP tool |
| **Bound-param SQL** (safety) | data 0.10.0 | `?` placeholders on `query`/`exec`, translated to `$1,$2…` on Postgres — no hand-rolled escaping |
| Postgres/Supabase pooler-aware `createDb` | data 0.8.0 | auto-disables prepared statements on Supavisor/pgBouncer, SSL for remote hosts |

## Platform pillars — `@apex-stack/core/server` (all 🟡)

Batteries for real apps; each is a small factory over an interface, drivers configurable,
on-device-safe defaults. Shipped in the 1.1 platform push (core 0.42.0–0.43.0).

| Pillar | Since | Public surface |
|---|---|---|
| **Cache** | 0.42.0 | `createCache` — TTL + tags; `memory`/`file` drivers, `remember()` |
| **File / object storage** | 0.42.0 | `createStorage` — `local`/`s3` (SigV4), signed URLs |
| **Background job queue** | 0.42.0 | `createQueue` + `defineJob` — memory/database drivers, retries/backoff, delayed jobs, `work()` loop |
| **Mail** | 0.43.0 | `createMailer` — memory/http (Resend, Postmark)/smtp, `{{var}}` templates |
| **Real-time (SSE)** | 0.43.0 | `createBroadcaster` + `sseHandler` + browser `apexRealtimeClient` |
| **Notifications** | 0.43.0 | `defineNotification` + `createNotifier` + `databaseChannel`, pluggable mail/custom |
| **Authorization** | 0.43.0 | roles+permissions (`createAccessControl`, `permissionGate`), opaque API tokens (`createTokenStore`, hashed at rest), single-use flow tokens (`createFlowTokens`) |

## Auth & security (shipped, adversarially verified)

One policy on the server, enforced identically across **pages / REST `/api/*` / MCP `/mcp`** —
so the AI-callable surface can never do more than the logged-in user. Fail-closed.
Delivered core 0.14.0–0.15.0 + data 0.4.0, verified by two independent adversarial passes + prod-build parity.

- `defineAuth` (`server/auth.ts`) → `ctx.user` in every loader/route/MCP call; `apex make auth` scaffolds it.
- Route gating: `auth: true` + `can()` → 401/403; unauthorized routes **omitted from per-user `tools/list`** and refused on `tools/call`.
- Resource/model per-op `access` + row-level `scope()` on every read/write — an AI sees only the caller's rows.
- Sealed-cookie sessions (`sessionAuth`/`login`/`logout`), CSRF Origin-check, rate-limiter, security headers, scrypt password hashing.

## Server hardening / production reliability (🟡)

- **Graceful shutdown** (core 0.41.0) — `apex start` drains in-flight requests on SIGTERM/SIGINT + closes DB pools (shutdown registry).
- **Health checks** — `GET /health` / `/healthz`, served before auth.
- **Safe 500s** — production clients never see error detail; full detail routed to `server/hooks.ts` `onError` (wire Sentry here).
- **Structured request logging** — one JSON line per request; `server/hooks.ts` (`defineHooks`) for `onRequest`/`onError`/`onShutdown`.
- **`/api` idempotency + pluggable `KvStore`** (core 0.39.0) — `Idempotency-Key` replay for 24h, per route+user; shared store for multi-instance.
- SSR responses send `Cache-Control: no-store` (core 0.41.2) so per-request state can't be served stale.

## Mobile — on-device SSR (the "reach" pillar)

`apex build --mobile` packages an app so its **full SSR + API pipeline runs on the device**
in a bare JS engine (no server, no port, offline). Went beyond a static Capacitor/Tauri wrap —
it runs your server on the device.

- **Runtime** (core 0.37.0) — manifest → static module registry + VFS + pure-JS shim → one self-contained `dist/mobile/server.mjs` on Hermes/QuickJS/androidx.javascriptengine.
- **On-device SQLite** (data 0.9.0) — `createDb`'s sqlite driver transparently uses **sql.js asm.js** (pure JS, no WASM — the sandboxed engines can't compile WASM); **persisted across cold starts** via snapshot export/restore.
- **On-device sessions** (core 0.37.0) — sealed-cookie auth works offline via dependency-free HMAC-SHA256 signing.
- **Android** (core 0.38.0) — `apex mobile android` scaffolds the native WebView shell + builds an APK in one command.
- **iOS** (core 0.38.1) — `apex mobile ios` scaffolds the WKWebView + JavaScriptCore shell (engine CI-verified on the iOS Simulator; build on a Mac with xcodegen).
- *Honest scope:* it's a WebView app (not native-widget UI); native device APIs (camera, …) still need shell wiring.

## PWA (🟡)

- **PWA** (core 0.40.0) — a `pwa: { name, … }` config block makes `apex build` emit `manifest.webmanifest` + a generated ~60-line precache service worker (zero new deps). Static/islands precache the whole dist (full offline); server build precaches assets + network-first pages. `apex extend pwa` scaffolds icons + config.

## Deploy presets (🟡)

- `apex build --preset vercel` (core 0.20.0) — Build Output API function + `vercel.json`; data layer Supabase-ready.
- `apex build --preset docker` (core 0.21.0) — Dockerfile for Railway/Render/Fly/VPS/K8s; `apex start` honors `$PORT`.
- `apex build --preset netlify` (core 0.22.0) — Netlify Functions-v2 handler (`createProdWebHandler`) + `netlify.toml`.
- **Cloudflare (edge) is *not* shipped** — it's the remaining preset ([#19](https://github.com/andrecorugda/apexjs/issues/19), see [upcoming](upcoming.md)).
- Serverless building blocks: `createProdApp` / `createProdNodeHandler` / `createProdWebHandler` (core 0.19.0).

## Component library + theming (SHIPPED epic)

- **`@apex-stack/components`** (0.4.0) — 36 curated `.alpine` components (PenguinUI, MIT), token-driven; `apex add <name…>` / `--all`. Browse + tick-to-generate at apexjs.site/ui.html.
- **`@apex-stack/theme`** (0.3.0) — Tailwind v4 `@theme` token contract; `apex theme --primary … --radius … --font-*` rewrites the managed block in `app.css`; every component inherits it. Visual builder at apexjs.site/theme.html.

## AI-agent tooling (dev-time)

- **CLI-as-MCP** — `apex mcp-server` (stdio) exposes the CLI as tools: `apex_make`, `apex_extend`, `apex_add`, `apex_build`, `apex_list`, `apex_project_info` (routes/models/components + their shapes), `apex_check`, `apex_test` — the full write→read→check→test agent loop (core 0.23.0–0.26.0).
- Scaffolded apps ship an [`AGENTS.md`](../../packages/create-apexjs/templates/default/AGENTS.md) that teaches agents the conventions (synced by `apex upgrade`).

## Testing kit (🟢)

- `@apex-stack/core/testing` (core 0.16.0) — `createTestApp({ root })` boots the whole app (API + MCP) in-process; REST helpers + `mcp.listTools`/`mcp.call`; auth/scope/CSRF stay live; cookie jar. `apex test` (Vitest wrapper). `apex make` co-generates a test for every logic-bearing kind (core 0.35.0).
- `apex check` (core 0.25.0) — `tsc --noEmit` type gate, native-compiler-aware; `--alpine` also type-checks `.alpine` `<script>` blocks (core 0.27.0, preview / Phase 1 of [#21](https://github.com/andrecorugda/apexjs/issues/21)).
