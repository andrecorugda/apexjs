# Apex JS — Public API & Stability Contract

This is the promise. Everything listed here is **public**; anything not listed is
**internal** and may change without notice. The goal of this document is the road
to **1.0**: a surface people can build on without it breaking under them.

> Upgrading between versions? See **[UPGRADING.md](./UPGRADING.md)** for the narrative guide
> (how to bump safely, what the 🟢/🟡 split means in practice, notable pre-1.0 shifts).

## Stability levels

| Level | Meaning | Change policy |
|---|---|---|
| 🟢 **Stable** | Battle-tested; treated as a contract. | No breaking change without a deprecation notice first (see policy below). |
| 🟡 **Experimental** | Works, but the shape may still change. | May change in any minor — the changeset will say so. Don't build load-bearing code on it yet. |

Everything **not in this file is internal** — import it and you're on your own.

## Deprecation policy

- **Post-1.0:** semver, strictly. No breaking change to a 🟢 Stable API in a minor
  or patch — breaking changes wait for a major.
- **Pre-1.0 (now):** a 🟢 Stable API is **never** removed/changed without (1) a
  `@deprecated` JSDoc tag naming the replacement, (2) an entry in the changeset,
  and (3) **at least two minor releases** of overlap before removal. 🟡 Experimental
  APIs may change in any minor, always noted in the changeset.
- **Graduation:** new surface lands as 🟡 Experimental. It becomes 🟢 Stable after
  ≥2 minors unchanged **and** at least one real app using it.
- **Golden rule:** if it's not deliberate + deprecated-first, it doesn't ship. A
  framework that hasn't broken you in months *feels* 1.0; one that breaks weekly
  never earns it.

---

## `@apex-stack/core` — app authoring (client-safe)

| Export | Status |
|---|---|
| `defineApexRoute` | 🟢 Stable |
| `defineConfig`, `env`, `useRuntimeConfig` | 🟢 Stable |
| `defineStore`, `isApexStore` | 🟢 Stable |
| `defineMiddleware` | 🟢 Stable |
| `defineAuth` | 🟢 Stable |
| `isApexResource` | 🟢 Stable |
| Types: `ApexConfig`, `RuntimeConfig`, `ApexUser`, `AuthConfig`, `AuthResolveContext`, `RouteGate`, `ApexResource`, `ResourceRoute`, `Middleware*`, `ApexStore`, `StoreState` | 🟢 Stable |
| `createI18n`, `resolveLocale` | 🟡 Experimental (the **config-based** i18n — `apex.config.i18n` + `locals.t` — is 🟢 Stable; these imperative helpers may change) |

## `@apex-stack/core/server` — server-only

| Export | Status |
|---|---|
| `sessionAuth`, `login`, `logout`, `getSession` | 🟢 Stable |
| `defineAuth`, `setStatus` | 🟢 Stable |
| `checkCsrf`, `isCsrfSafe`, `applySecurityHeaders`, `securityHeaders` | 🟢 Stable |
| `createRateLimiter`, `rateLimitKey`, `createMemoryStore` | 🟡 Experimental |
| `gracefulShutdown`, `onShutdown`, `defineHooks` | 🟡 Experimental (production reliability — drain, shutdown hooks, `server/hooks.ts`) |
| `createProdApp`, `createProdNodeHandler`, `createProdWebHandler`, `startProdServer` | 🟡 Experimental (serverless building blocks — new; shape may evolve) |
| `hashPassword`, `verifyPassword` | 🟡 Experimental (scrypt password hashing — per-hash salt + constant-time verify) |
| `resolveSecurityConfig`, `DEFAULT_CSP` (+ `SecurityConfig`, `CorsConfig`, `HstsConfig`, `HeadersConfig`, `RateLimitConfig`, `ResolvedSecurity`) | 🟡 Experimental (the hardening config the server resolves — headers/CSP, CORS, HSTS, rate-limit, body caps) |
| Types: `SessionOptions` | 🟢 Stable · `RateLimiter`, `RateLimitOptions`, `AsyncRateLimiter`, `KvStore`, `ApexServerHooks`, `RequestLogEntry`, `ErrorContext` | 🟡 Experimental |

## `@apex-stack/core/server` — platform subsystems (all 🟡 Experimental)

New in 1.1 — the batteries-included platform pillars, exported from `@apex-stack/core/server`. All are 🟡 Experimental (shape may change in a minor).

| Subsystem | Public exports |
|---|---|
| **Cache** | `createCache`, `createMemoryDriver`, `createFileDriver` (TTL + tags) |
| **File / object storage** | `createStorage`, `createLocalStorage`, `createS3Storage`, `presignGetUrl`, `verifySignedUrl`, `signRequest`, `StoragePathError` (+ `Storage`, `StorageConfig`, `PutOptions`, `StorageEntry`, `UrlOptions`, `LocalStorageConfig`, `S3StorageConfig`) |
| **Background job queue** | `createQueue`, `defineJob` (memory + database drivers, retries/backoff, delayed jobs, `work()` loop) (+ `Queue`, `JobDefinition`, `JobContext`, `EnqueueOptions`, `WorkOptions`, …) |
| **Mail** | `createMailer`, `createMemoryMailer`, `createHttpMailer`, `createSmtpMailer`, `resend`, `postmark`, `renderTemplate`, `escapeHtml` (+ `SmtpMailConfig`, `TemplateVars`) |
| **Real-time (SSE)** | `createBroadcaster`, `sseHandler`, `apexRealtimeClient`, `encodeSseFrame`, `encodeSseComment` |
| **Notifications** | `defineNotification`, `createNotifier`, `databaseChannel` (+ `Channel`, `Notifier`, `StoredNotification`, `NotifierConfig`, …) |
| **Authorization** | `createAccessControl`, `permissionGate` (roles + permissions), `createTokenStore`, `abilitiesGrant` (opaque API tokens), `createFlowTokens` (single-use password-reset / email-verify) |

> **Not shipped (deferred):** OAuth / SSO and 2FA are on the roadmap but not yet in the public surface — don't document them as available.

## `@apex-stack/core/client` — browser runtime

| Export | Status |
|---|---|
| `registerApexComponent`, `installNav`, `createAction` | 🟢 Stable |
| `createResourceClient` | 🟡 Experimental (typed CRUD data-hook for a model resource — new; generated by `apex make composable`) |
| Types: `NavOptions`, `ActionOptions`, `ActionState` | 🟢 Stable · `ResourceClientOptions`, `ResourceClientState` | 🟡 Experimental |

## `@apex-stack/core/testing`

| Export | Status |
|---|---|
| `createTestApp` | 🟢 Stable |
| Types: `TestApp`, `TestResponse`, `CallOptions`, `CreateTestAppOptions` | 🟢 Stable |

## `@apex-stack/data`

| Export | Status |
|---|---|
| `defineModel` (+ `DefineModelOptions`, `ApexModel`, `FieldType`, `FieldDef`, `Field`, `Fields`) | 🟢 Stable |
| `defineResource` (+ `DefineResourceOptions`, `ResourceOp`, `AccessRule`, `AccessMap`, `ScopeFn`) | 🟢 Stable |
| `createDb` (+ `CreateDbConfig`, `ApexDbHandle`, `Dialect`) | 🟢 Stable |
| `applyMigrations`, `rollbackMigrations` | 🟢 Stable |
| `timestamps`, `owned`, `softDeletes`, `composeBehaviors` (+ `Behavior`, `BehaviorHooks`, `HookCtx`, `FilterFn`) | 🟢 Stable |
| `auditable`, `observable` | 🟡 Experimental (hook shape not yet frozen) |
| `factory` (+ `Factory`, `FactoryOptions`) | 🟢 Stable |
| `postgresOptions`, `PostgresConnectOptions` | 🟡 Experimental (new) |
| `parseMigration` | 🟡 Experimental (low-level) |
| **Active record on `defineModel`** — reads (`first`/`find`/`findOrFail`/`firstOrFail`/`all`/`where`/`orderBy`/`limit`/`offset`/`count`/`exists`/`pluck`/`sum`/`avg`/`min`/`max`/`chunk`/`lockForUpdate`) + writes (`create`/`update`/`updateOrCreate`/`upsert`/`insertMany`/`updateMany`/`delete`) + `scope`/`tableFor` | 🟡 Experimental (new; the ORM query surface — shape may still change) |
| `QueryBuilder`, `raw`, `Raw` (+ `Row`, `Values`, `WhereConds`, `Op`, `Cond`, `QueryOpts`, `UpsertOptions`) | 🟡 Experimental |
| Model **instances** + **collections**: `Collection`, `collect` (+ `ModelInstance`) — `save`/`delete`/`refresh`/`isDirty`/`changes`/`toJSON` | 🟡 Experimental |
| **Relationships + eager loading**: `belongsTo`, `hasMany`, `hasOne` (+ `RelationDef`); model `relations` + `.with(...)` | 🟡 Experimental |
| **Typed errors**: `ApexDataError`, `ModelNotFoundException`, `QueryException`, `StaleModelException` (carry `httpStatus`) | 🟡 Experimental |
| `defineModel` options: `casts`, `scopes` (named scopes), `hidden` (serialization), `optimisticLock`, `indexes`, field `index` / `references` (FKs) | 🟡 Experimental |
| **Transactions**: `ApexDbHandle.transaction(fn)` (atomic; auto commit/rollback) · `lazyDb` (+ `LazyDbOptions`, on-device) | 🟡 Experimental |
| Bound-param SQL: `SqlParam`, `toPgPlaceholders` (`?` placeholders on `query`/`exec`) | 🟡 Experimental |
| List-API params on resources: `?page`/`?perPage` (envelope), `?sort=-col`, `?<col>=` filters (REST + `_list` MCP tool) | 🟡 Experimental |

---

## CLI — `apex <command>`

The command names + documented flags are part of the contract.

| Command | Status |
|---|---|
| `dev`, `build`, `start`, `new`, `make`, `add`, `migrate`, `theme`, `upgrade`, `test`, `mcp` | 🟢 Stable |
| `extend <feature>` | 🟡 Experimental (feature recipes — new) |
| `build --preset <vercel\|netlify\|docker>` | 🟡 Experimental (deploy presets — new; `vercel`/`docker` proven, `netlify` handler-verified) |
| `check` | 🟡 Experimental (type-check gate — new; `tsc --noEmit`, native-compiler-aware; `--alpine` also checks `.alpine` script blocks — preview) |
| `mcp-server` | 🟡 Experimental (CLI-as-MCP for AI agents — new) |

## Conventions — the "invisible API" (🟢 Stable)

These are contracts too — changing them breaks apps silently:

- **`apex.config.ts`**: `runtimeConfig` (+ `public`), `i18n: { defaultLocale, locales }`, `pwa: { name, … }` (🟡 Experimental — emits manifest.webmanifest + a precache service worker at build).
- **File routing**: `pages/**/*.alpine`; `[param]` dynamic segments; `index.alpine` → parent path.
- **`.alpine` SFC**: `<script server>` (`loader()` / `head()`), `<script client>`, `<template>`, `<style scoped>`. Scripts are **TypeScript-only** — `lang` is optional and defaults to `ts`; `lang="js"` is a parse error.
- **Islands**: `client:load` / `client:visible` / `client:idle`.
- **Server**: `server/api/*.ts` default-exports a route or resource; `server/auth.ts` default-exports an `AuthConfig`; `middleware/*.ts`.
- **Data**: `models/*.ts`, `db/migrations/*.sql`, `locales/*.json`.
- **Components in folders**: `components/**/*.alpine`; nested files are folder-namespaced (`components/ui/Card.alpine` → `<UiCard/>`).
- **Client hook** (🟡 Experimental): `app.client.ts` default-exports `(Alpine) => void`, run before `Alpine.start()` — register Alpine plugins, directives, magics.
- **Production reliability** (🟡 Experimental): the server target serves `GET /health`/`/healthz` (liveness); `apex start` drains in-flight requests + closes DB pools on SIGTERM/SIGINT; production 500s are generic (`Internal server error`) with the detail routed to `server/hooks.ts` `onError` (or the log); one JSON log line per request (`--quiet`/`APEX_LOG=off` to silence). `startProdServer` now also returns `close()`.
- **`/api` idempotency** (🟡 Experimental): send `Idempotency-Key` on a POST/PUT/PATCH/DELETE — the pipeline runs the handler once and replays the cached `{status, body}` for 24h (replays carry `x-idempotent-replay: true`); a concurrent duplicate gets 409; 5xx outcomes are not cached, so a retry re-executes. Keys are scoped per route + user. Pass a shared `KvStore` (`createProdApp({ idempotencyStore })`) for multi-instance deployments.

---

## Not public (internal — no guarantees)

`@apex-stack/kit`, `@apex-stack/vite`, `@apex-stack/theme`, `@apex-stack/components`
are **implementation packages**. Use them only via `@apex-stack/core` / the `apex`
CLI. Deep imports (`@apex-stack/core/dist/...`, any un-listed path) are internal.

---

*Toward 1.0: keep the 🟢 set from breaking, graduate 🟡 → 🟢 only after it's proven,
and never break either without deprecating first.*
