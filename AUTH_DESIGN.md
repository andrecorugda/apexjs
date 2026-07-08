# Phase C — Auth & Access Control: Threat Model + Design

> Status: **C1–C3 built + self-tested on `develop` (not yet released).** Independent
> (fresh-session) verification + the docs/site/roadmap security-wording pass are still
> pending — no security claim ships to the site/README/roadmap until that verification
> passes. This document is the threat model + design the implementation follows.
>
> **Build status (2026-07-08):**
> - **C1 — identity + route gating** ✅ `defineAuth` + `user` in handlers/MCP + `auth`/
>   `can` (401/403) + per-user MCP `tools/list` + `tools/call` re-check. 18 tests.
> - **C2 — resource/model access + scope** ✅ per-op `access` + row-level `scope` on
>   `defineResource`/`defineModel`, fail-closed. 5 PGlite tests.
> - **C3 — sessions + hardening** ✅ `@apex-stack/core/server`: `sessionAuth` (h3 sealed
>   cookies) + `login`/`logout`, CSRF in `createApiHandler`, rate-limiter, security
>   headers, `apex make auth`. 8 tests.

## 1. Why this is existential, not polish

Apex's headline is **"every typed route is also an MCP tool your AI can call."**
Without access control that sentence reads, to an attacker, as *"anyone's AI can call
your data."* An AI-native, API-first framework with an unguarded surface isn't
"almost done" — it's a liability. Auth is what makes the whole pitch safe to make.

## 2. Threat model

**Assets**
- App data — rows exposed via `defineResource`/`defineModel` (REST + MCP CRUD).
- Business actions — mutations in route handlers.
- Secrets — env/config, DB credentials, session keys.

**Attack surface (all public by default today)**
- `GET/POST/PATCH/PUT/DELETE /api/*` — REST routes + resource CRUD.
- `POST /mcp` — every `mcp: true` route exposed as an AI-callable tool.
- Pages/loaders — SSR data; the hydration state island is shipped to the client.
- Static assets.

**Actors** — anonymous HTTP client · authenticated user · privileged (role) user ·
**an AI agent acting over MCP** with whatever credentials the caller gave it.

**Trust boundary** — the server. The browser, the client bundle, the SSR state
island, and any MCP client are **untrusted**. Every authorization decision is made
server-side. `can`-style flags may be sent to the client for show/hide, but that is
**UX only** — never the security control.

**Current state (insecure baseline)** — no identity, no gating, no row scoping.
Anyone (or any AI) can enumerate and mutate every row and call every action.

**Definition of "secure" for Apex** — *one* policy, enforced on the server, applied
**identically to pages, REST, and MCP**, so the AI-callable surface can never exceed
what the logged-in user is allowed to do. **Fail-closed.**

## 3. Non-negotiable principles

1. **Server-side only.** No security decision depends on client-sent data beyond an
   authenticated identity the server itself verified.
2. **Fail-closed.** If auth can't be resolved, the caller is anonymous. An opted-in
   route with no user → 401. A resource op with no matching `access` rule → deny.
3. **Scope applies to *every* row op** — `list`, `get`, `update`, `delete` — not just
   `list`. Guessing an id must not read or mutate another user's row.
4. **MCP defense-in-depth.** Unauthorized tools are omitted from `tools/list` per user
   *and* refused on `tools/call`. Never rely on hiding alone.
5. **No secrets in the SSR state island.** Loaders must not serialize anything the
   client shouldn't see; permission flags baked in are non-authoritative.
6. **One enforcement path per surface.** No scattered ad-hoc checks.

## 3.5 Prior art — what Next.js & Nuxt do (and their scars)

**Next.js**
- **Authorize at the Data Access Layer, fail-closed** — Next's current official
  guidance is to centralize `verifySession()` + authorization in a server-only data
  layer, *not* in components. Born from **CVE-2025-29927**: an `x-middleware-subrequest`
  header let attackers skip `middleware.ts` entirely — so **middleware is not a
  security boundary.** Enforce next to the data.
- **Server Actions are public endpoints** — Next docs say treat every action like an
  unauthenticated POST: authenticate + authorize *inside* it. Mitigations: encrypted
  action IDs, dead-code elimination of unused actions, and **Origin/Host header checks
  for CSRF**.
- **`server-only` import poison** + **`NEXT_PUBLIC_` prefix** — server code can't be
  bundled to the client; only explicitly-prefixed env vars reach the browser.
- **Taint API** (`taintObjectReference`/`taintUniqueValue`) — runtime guard so secret
  objects can't be passed across the server→client boundary.
- Identity is **bring-your-own** (Auth.js/NextAuth); Next doesn't build a user store.
  CSP via nonce headers.

**Nuxt**
- **`runtimeConfig` public/private split** — private keys server-only, `public` subset
  to the client (Apex already copied this exact model).
- **`nuxt-security`** — the de-facto module: CSP/HSTS/X-Frame headers, CORS, rate
  limiting, request-size limits, XSS/CSRF helpers.
- **`nuxt-auth-utils` / h3 `useSession`** — **sealed (encrypted, signed) cookies**,
  `requireUserSession(event)`; enforce in Nitro server routes. Payload hygiene: don't
  put secrets in the SSR payload (same island concern as Apex).

**Convergent best practices (both):** explicit env public/private split · enforce
authorization at the data/server layer and **fail-closed** (never middleware-only) ·
treat every server route/action as a public endpoint · sealed/signed `HttpOnly`
`Secure` `SameSite` cookies · CSRF via Origin check + SameSite · security headers/CSP
· rate-limit public endpoints · never serialize secrets to the client · adopt an
adapter for identity rather than rolling your own.

**How this shapes Apex** — our design already reflects the big lessons: enforce in the
**query/handler layer + route gating**, not middleware (§5, fail-closed §3); routes
are public endpoints gated server-side (§4.2); no secrets in the state island (§3.6);
sealed cookies + CSRF (§4.5). Two Apex-specific implications:
1. **MCP is a Server-Action-grade public endpoint — doubled.** An AI tool call is an
   unauthenticated POST *that an autonomous agent drives*. So MCP must inherit the
   *exact* same gating as REST (per-user `tools/list` + `tools/call` re-check, §4.2),
   and `scope` must hold there too. Neither Next nor Nuxt has this surface — it's our
   novel risk and our moat, and it's why data-layer enforcement (not middleware) is
   mandatory: the AI never goes through page middleware.
2. **Adopt `server-only`-style hygiene + a taint-like guard** so a loader can't leak a
   secret into the SSR state island (§3.6, C3 lint/guard).

## 4. Design

### 4.1 Identity — `defineAuth` (`server/auth.ts`, one per app)
```ts
export default defineAuth({
  // Verify the request → the caller's identity (or null). Bring-your-own:
  // cookie/JWT/header, or an adapter (Lucia / Better-Auth / Auth.js).
  async resolve({ headers, cookies }) {
    return await getUserFromSession(cookies.session) // → { id, roles, ... } | null
  },
})
```
Resolved **once per request**, early in the pipeline, and injected as `ctx.user`
(and `ctx.session`) into every **loader**, **route handler**, and **MCP tool call**.
No built-in user store in v1 — you provide `resolve`. (C3 adds an optional
signed-cookie session helper + `apex make auth` scaffold so you don't have to.)

### 4.2 Route gating — `defineApexRoute`
```ts
defineApexRoute({
  method: 'POST',
  auth: true,                                   // require a user → 401 if anonymous
  can: ({ user, input }) => user.roles.includes('admin'),  // → 403 if false
  handler: ({ input, user }) => { /* user is present + authorized here */ },
})
```
- REST: 401 (no user) / 403 (user, not permitted).
- MCP: the tool is **omitted from `tools/list`** for users who fail `auth`/`can`,
  **and** `tools/call` re-runs the same check and refuses otherwise.

### 4.3 Resource / model access + row-level scope
```ts
defineModel('todos', {
  fields: { title: 'string!', ownerId: 'int' },
  access: {                                     // per-operation
    list: 'authed', get: 'authed',
    create: 'authed', update: 'authed', delete: 'authed',
    // or a fn: (ctx) => boolean
  },
  scope: ({ user }) => ({ ownerId: user.id }),  // row filter applied to EVERY op
})
```
- `access` gates the operation (public / authed / predicate).
- `scope` returns a filter injected into the Drizzle query for `list` **and**
  `get`/`update`/`delete` (via an added `WHERE`), and stamped onto `create`. So a
  caller only ever sees or touches their own rows — enforced in the query layer, not
  the handler. Holds identically over REST and MCP.

### 4.4 Pages / loaders
Loaders receive `ctx.user`; a page guards by redirect (middleware or a page-level
`auth`) and returns only permitted data. SSR emits only permitted HTML. Non-secret
`can` flags may seed hydration for show/hide — **UX only.**

### 4.5 Hardening (C3) — the "hybrid" scope (DECIDED)
Because Apex **owns the h3 server end to end**, it ships more secure-by-default than
Next core without reinventing an identity provider:

**Built-in (Apex ships it):**
- **Sealed-cookie sessions** via h3 `useSession` — encrypted+signed, `HttpOnly`/
  `Secure`/`SameSite=Lax` defaults, one `session.password` secret. `apex make auth`
  scaffolds login/logout + a `defineAuth` resolver on top of it.
- **CSRF** — Origin/Host check on cookie-authenticated mutations (Next's model) +
  `SameSite=Lax`; opt-in double-submit token for cross-origin cases.
- **Rate-limit / throttle hook** on `/api` + `/mcp` (we own the handlers) — pluggable
  store, sensible default.
- **Security-headers / CSP helper** + a guard that secrets never reach the state island.

**Adapter (bring-your-own / ecosystem — Apex does NOT reinvent):**
- OAuth providers, JWT *issuance/rotation*, 2FA/TOTP, password/account management —
  wired through `defineAuth.resolve` with guides for Lucia / Better-Auth / Auth.js.
  (`resolve` can verify a bearer JWT or read the sealed session — both supported.)

### 4.6 MCP tool annotations + confirmation (advisory — NOT the gate)
The MCP spec (2025-06-18) lets a tool carry `annotations` — `readOnlyHint` (default
`false`), `destructiveHint` (default `true`), `idempotentHint` (default `false`),
`openWorldHint` (default `true`), plus `title`. Clients use them to decide whether to
auto-run a tool or ask the user first. **The spec requires clients to treat annotations
as untrusted** — so they are UX hints only, never our authorization control (principle
§3.1 stands: `access`/`can`/`scope` enforce server-side regardless).

Apex emits them automatically from each generated resource op, so a client treats a
`delete` tool more carefully than a `list`:

| Op | `readOnlyHint` | `destructiveHint` | `idempotentHint` |
|---|---|---|---|
| `list`, `get` | `true` | — | — |
| `create` | `false` | `false` | `false` |
| `update` | `false` | `true` | `true` |
| `delete` | `false` | `true` | `true` |

**Confirmation for destructive ops (elicitation).** The spec also mandates a
human-in-the-loop for sensitive operations. We reserve a route/behavior flag
`confirm: true` (implicit for `destructiveHint` ops) that surfaces via MCP
**elicitation** — the tool call pauses and asks the user to confirm before the AI
executes it. This is a *safety* prompt, layered on top of (never instead of) the
server-side authorization gate, and it pairs with the `observable`/`auditable`
behaviors (§8) so a confirmed destructive action is also logged with its actor.

## 5. Enforcement architecture (single source of truth)

Identity resolves once (auth step in the request pipeline) → `ctx.user`. Then:
- **`createApiHandler`** — check route `auth`/`can`; for resources apply `access` +
  inject `scope` into the query; dispatch.
- **`createMcpHandler`** — build the per-request tool list filtered by `access`; on
  `tools/call`, re-check + apply `scope`.
- **page render** — pass `ctx.user` to the loader; enforce page guard.

Three surfaces, one policy object, one resolved identity. No per-handler ad-hoc auth.

## 6. Phased delivery (each shipped + independently verified)

- **C1 — identity + route gating.** `defineAuth` + `ctx.user` threading + `auth`/`can`
  on `defineApexRoute` + 401/403 (REST) + per-user MCP `tools/list` filtering +
  `tools/call` refusal. Server-side, unit-testable.
  *Acceptance:* anon → 401 on `auth` routes; wrong role → 403; MCP list omits
  unauthorized tools and the call is refused even if invoked directly.
- **C2 — resource/model `access` + `scope`.** Per-op gate + row-level scope on
  `defineResource`/`defineModel`.
  *Acceptance:* user A cannot `list`/`get`/`update`/`delete` user B's rows (all four);
  `create` stamps ownership; scope holds over REST **and** MCP.
- **C3 — sessions + hardening.** Signed-cookie session helper, `apex make auth`
  (login/logout + CSRF), secure-cookie defaults, adapter guides (Lucia/Better-Auth/
  Auth.js).
  *Acceptance:* cookie session round-trips; CSRF blocks a cross-site mutation; no
  secret in the SSR state island.

## 7. Scope: hybrid (DECIDED 2026-07-08)
Ship the security surface Apex can own safely (§4.5 built-in); delegate identity
providers to adapters (§4.5 adapter). More out-of-box than Next core, no reinvented
IdP. See §3.5 for why this matches Next/Nuxt's proven division of labor.

**Non-goals (v1):** from-scratch OAuth *provider*, JWT issuance/rotation service,
TOTP/2FA engine, password/account-management UI, field-level encryption — all adapter
territory.

## 8. Behaviors — the model's extension mechanism ("traits") — Phase D

`defineModel` is the center of gravity, so cross-cutting concerns attach *there*, once,
and flow to every surface. In a functional framework the Laravel-"trait" idiom becomes
a **behavior**: a pure, composable descriptor that augments the model. This is the
model's OCP extension seam — you add capability without editing the framework, and you
author your own behaviors against a public contract.

```ts
defineModel('todos', {
  fields: { title: 'string!' },
  use: [
    timestamps(),                 // + created_at/updated_at, server-managed
    softDeletes(),                // + deleted_at, auto-hides deleted rows
    auditable(),                  // + companion todos_audit table, logs who/what/when
    observable({                  // lifecycle hooks (fire on REST *and* MCP)
      afterCreate: ({ row, ctx }) => notify(row),
      beforeDelete: ({ id, ctx }) => assertDeletable(id, ctx.user),
    }),
    owned('ownerId'),             // row-level auth: scope + stamp owner on create
  ],
})
```

### 8.1 The `Behavior` contract
A behavior is `(config) => Behavior`, evaluated at definition time with **no side
effects** (so each is unit-testable in isolation). It may contribute any of six things:

| Contribution | Effect | Example |
|---|---|---|
| `fields` | extra columns merged into the model → flow into `table`/`insert`/`migrationSql` for free | `timestamps` adds `created_at`/`updated_at` |
| `insert` tweak | omit/require in the create shape (server-managed columns) | timestamps/`deleted_at` omitted from `insert` |
| `migration` | extra up + **down** SQL fragments — companion tables, indexes, triggers | `auditable` emits `CREATE TABLE todos_audit … / -- @down DROP …` |
| `hooks` | lifecycle callbacks the resource dispatch invokes | `before/afterCreate\|Update\|Delete`, `after Get\|List` |
| `scope` | row filter `(ctx) => Partial<Row>`, **AND-combined** with all other scopes | `softDeletes` → `{ deletedAt: null }`; `owned` → `{ ownerId: ctx.user.id }` |
| `access` | per-op access contribution, combined **most-restrictive-wins** | `owned` → writes `authed` |

Hooks receive `{ row?, id?, input?, ctx, db }` — `ctx.user` comes from `defineAuth`
(§4.1). `before*` hooks may mutate `input` or **throw to abort** (→ 4xx); `after*`
hooks react (audit, notify, cache-bust).

### 8.2 Composition semantics (deterministic + fail-closed)
- Behaviors apply **in array order**; the model's own `fields`/`access`/`scope` are
  treated as the last, highest-priority layer.
- **Fields** merge; a behavior adding a field the model already declares is a
  **definition-time error** (fail fast, no silent shadowing). Reserved names (`pk`,
  another behavior's column) likewise error.
- **Scopes** AND-combine — every behavior's filter *and* the model's must hold. More
  behaviors can only *narrow* what a row op sees, never widen it (fail-closed).
- **Access** combines most-restrictive-wins — a behavior can tighten an op, never
  loosen one another behavior locked.
- **Hooks** run in array order for `before*` and array order for `after*` (documented;
  no hidden onion reordering). One throwing `before*` aborts the op transactionally.

### 8.3 Where they run — one seam, both surfaces
`applyBehaviors(spec, use)` folds the behaviors into an **effective spec** *inside*
`defineModel`, before it derives `table`/`insert`/`migrationSql`/`resource`. So the
existing derivation pipeline is untouched — it just sees more fields. The `hooks`,
`scope`, and `access` ride on the `ApexModel` into `defineResource`, and fire on the
**single dispatch path** (§5) — so an `observable`/`auditable` hook runs identically
whether a human hit REST or an **AI called the MCP tool**. Audit captures the AI's
actions for free. This is the same seam auth enforces on; behaviors and auth are one
mechanism, not two.

### 8.4 Named examples (the ones you asked for)
- **Audit table** — `auditable(opts?)`: declares companion `<name>_audit`
  (`id, row_id, action, actor_id, changes json, at`) in the migration (+ its own
  `-- @down`), and registers `afterCreate/Update/Delete` hooks that write a row with
  `actor_id = ctx.user?.id`. *(Depends on `ctx.user` for the actor — degrades to null
  actor before Phase C ships.)*
- **Observable** — `observable({ ...hooks })`: pure lifecycle-hook registration.
- **Inherit auth** — `owned(col='ownerId')`: `scope: ctx => ({ [col]: ctx.user.id })`
  + stamps the owner on `create` + `access` authed. And `policy(sharedPolicy)` to reuse
  one `{access, scope}` bundle across many models (DRY auth).
- Stretch built-ins: `slug(from)`, `versioned()`, `searchable(cols)`.

### 8.5 Robustness guarantees
- Each behavior + `applyBehaviors` are unit-testable; a golden **migration snapshot**
  per built-in behavior (up **and** down) guards drift.
- Behaviors are **model-scoped** — not general request middleware (that stays
  `defineMiddleware`) and not cross-model joins. Keeps the seam small and reasoned-about.
- **Type-carrying (goal):** a behavior carries a phantom type of the fields it adds so
  the model's inferred `Row` type includes them (e.g. `created_at` is typed after
  `timestamps()`). Heavy generics; tracked as a follow-up, not a v1 gate.

### 8.6 Interlock with the phases
- **Pure-data** behaviors (`timestamps`, `softDeletes`) need no auth → can land first.
- **Hook** behaviors (`observable`, `auditable`) need the hook seam in the resource
  dispatch + `ctx.user` → ride on Phase C plumbing.
- **Auth** behaviors (`owned`, `policy`) **are** Phase C's `access`/`scope`, packaged
  for reuse. Decision (my lean): keep C1's `access`/`scope` as first-class fields but
  make them **behavior-settable**, so the trait system slots in as Phase D with no
  rewrite.

## 9. Open decisions

1. **Default posture when `defineAuth` exists.** *(still open — Andre's call before
   C1.)* Fail-closed (a resource op with no declared `access` is denied) is safest but
   breaks today's open resources. Options: (a) require explicit `access` per resource
   once auth is configured (fail-closed + clear error), (b) default reads `public` /
   writes `authed`, override per-op. **Recommendation: (a)** — explicit, safe, no
   silent exposure.
2. ~~**C3 session strategy.**~~ **RESOLVED (hybrid):** built-in sealed-cookie sessions
   (h3 `useSession`) + documented adapters.
3. **`ctx.user` shape.** Minimal + bring-your-own type (`resolve` returns whatever you
   want; framework only requires an identity is present). **Recommendation: yes.**
