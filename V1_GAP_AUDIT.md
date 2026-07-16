# Apex JS — v1 Gap Audit

Consolidated from a 4-way parallel audit (data/ORM, Alpine/kit, server, CLI/build/scaffold).
Two lenses per finding: **reinvented wheel** (hand-built where a package already does it) and
**missing capability** vs the three v1 bars — Eloquent-parity ORM, full Alpine power, robust server.

`[V1]` = blocks 1.0. Severity: 🔴 blocker · 🟠 high · 🟡 med · ⚪ low.

---

## 0. Root cause (the unifying example)

The active-record layer just added in `packages/data/src/query.ts` is the textbook case of the
complaint: it **hand-rolls raw SQL** although `handle.db` is a **Drizzle instance on every backend**
(incl. on-device sql.js) and `defineResource` **already** does every write through the Drizzle
builder with a hook pipeline (`index.ts:490‑610`). Worse, it's a *parallel* write path that bypasses
that pipeline entirely. Root cause: `attachActiveRecord(model, modelSql(name, pk, fields))`
(`model.ts:286`) is handed only name/pk/fields — the composed `hooks/softDelete/scope/filters`
(`model.ts:228`) never reach it. **Fix direction: delete raw-SQL `query.ts`; rebuild the AR sugar on
`handle.db` (Drizzle) sharing `defineResource`'s write path.** This single change resolves A1–A5.
→ The `AGENTS.md` AR section + changeset added this session are premature and must be redone after.

---

## A. ORM → Eloquent parity  (`packages/data/**`)

**✅ SHIPPED (cluster A spine, 334 tests green):** `defineResource`'s write/read pipeline
extracted into shared `repository.ts`; `query.ts` rebuilt on the Drizzle builder + that
pipeline. `attachActiveRecord` now receives the full composed spec (hooks/scope/filters/
softDelete/insert). Resolves **A1–A5, A7**. Proof tests: timestamps/observers fire, soft-
delete honored + trashed hidden, tenant scope isolates, mass-assignment validated.

- ✅ **A1 — AR writes fire hooks (timestamps/audit/observers).** FIXED — `repository.create/update` runs `beforeCreate`/`afterCreate` etc.
- ✅ **A2 — soft-delete honored (no hard delete).** FIXED — `repo.remove`/`bulkRemove` stamp `deleted_at`.
- ✅ **A3 — scope/filters applied → tenant isolation + trashed hidden.** FIXED — `repo.scopeConds(user)` on every AR read/write; `opts.user`.
- ✅ **A4 — payload validated (mass-assignment safe).** FIXED — `prepareWrite` parses against the model shape.
- ✅ **A5 — rebuilt on Drizzle; upsert via `.onConflictDoUpdate()`.** FIXED — no raw SQL strings.
- ✅ **A7 — operators + pagination + aggregates.** FIXED — eq/ne/gt/gte/lt/lte/like/in/notIn/isNull, orWhere, limit/offset, count/exists/pluck/sum/avg/min/max.
### Cluster A completion — FULL Eloquent parity (Andre: "we need all of this", minus route-model binding)

Remaining parity checklist, build order (foundation → relations → builder sugar → tooling):
1. 🟠 **[V1] Model instances + Collections** — `save()`/dirty/`refresh()`/`delete()`/`wasChanged()`; `Collection` (map/filter/pluck/groupBy/sum). *Foundation — reads/writes return instances in a Collection.* ← FIRST
2. 🟠 **[V1] Serialization** — `hidden`/`visible`/`appends`/`toJSON` (hide password/secret over REST+MCP too). (A13)
3. 🟠 **[V1] Casts** — enum/decimal/date/encrypted/custom `cast` per field, beyond bool/JSON. (A12)
4. 🟠 **[V1] A6 Relationships + eager load** — `hasOne/hasMany/belongsTo/belongsToMany/through/polymorphic` + `with()`. Drizzle Relations. *Biggest single feature.*
5. 🟠 **[V1] Local/named scopes** — `Model.scope('published')` chainable. (A14)
6. 🟠 **[V1] Pagination object** — `paginate()` → `{data,total,perPage,page,lastPage}` + `cursorPaginate()`.
6b. 🟠 **[V1] Transactions + rollback** — `handle.transaction(async (tx) => { … })` auto-commits, auto-rolls-back on throw; AR/repo ops accept the `tx` so a multi-step unit is atomic (Drizzle `db.transaction()` already exists on `handle.db`). Wrap `updateOrCreate`/`save` in one. (A9)
7. 🟠 **[V1] Factories & seeders** — states/sequences/`has()`/seeder ordering. (A19) *Delegatable — `factory.ts`.*
8. 🟠 **[V1] Migrations diffing** — `drizzle-kit`-style `ALTER` generation (dev-time). (A16) *Delegatable — migrate command.*
9. 🟡 **Multiple connections / read replicas** — named handles.

**DROPPED (Andre): Route–model binding** — not needed.
Execution: I own the coupled core (1–6, all funnel through `query.ts`/`model.ts` return types); 7–8 fan out to agents (separate files).
- 🟠 **A8 — No model instances (`save/isDirty/wasChanged/refresh`).** missing. everything static returns plain `Row`. → lightweight instance wrapper + dirty tracking, or document as query-only.
- 🟠 **A9 — Transactions not surfaced; `updateOrCreate` non-atomic.** missing. `query.ts:239‑250`. → expose `handle.transaction(fn)` (Drizzle `db.transaction()` already exists).
- 🟠 **A10 — Aggregates limited to `count()`.** missing. `query.ts:185‑189`. → `sum/avg/min/max/exists/pluck`.
- 🟠 **A11 — Pagination: `limit` only.** missing. `query.ts:165‑168`. → `offset()` + `paginate()` `{data,total,page}`.
- 🟠 **A13 — No serialization control (`hidden/visible`).** missing (security-relevant — hides password/secret cols over REST+MCP). `index.ts:491,523`. → serialize step + `hidden` fields.
- 🟡 **A12 — Casts limited to bool+json.** partial. `query.ts:62‑89`. → per-field cast registry (date/decimal/enum).
- 🟡 **A14 — Named (local) query scopes absent.** partial. → builder macros.
- 🟡 **A16 — Migrations: no diffing/`ALTER` gen (CREATE-only).** partial/reinvented. `model.ts:256‑267`. → `drizzle-kit generate` (dev-time; on-device unaffected).
- ⚪ A17 `toPgPlaceholders` hand-rolled shim `index.ts:66‑82` · ⚪ A18 migration ledger uses string interpolation not binds `index.ts:298‑300,333` · ⚪ A19 factory bypasses pipeline, no states/seeders `factory.ts:82‑85` · ⚪ A20 no chunk/cursor/lazy `query.ts:170‑177` · ⚪ single-connection only `index.ts:161`.

---

## B. Alpine — full power  (`packages/kit/**`, islands/stores)

- 🔴 **[V1] B1 — `x-model` renders no initial value → every controlled field flashes empty.** missing. no `x-model` branch in `renderComponent.ts:245‑269`. → SSR-emit `value`/`checked`/`selected`. *Defeats the zero-flash headline.*
- 🔴 **[V1] B2 — `$store` seeded only in the root render (blank in islands/fragments/nested).** missing/partial. `renderComponent.ts:143,181,331` call `createMagics` without `stores` (vs root `:87`). → thread `stores` through every call site.
- 🟠 **[V1] B3 — Scope proxy omits `ownKeys`/`getOwnPropertyDescriptor` traps → `{...state}`/`Object.keys` return nothing SSR.** reinvented (incomplete `mergeProxies`). `scope.ts:33‑54`. → add enumeration traps.
- 🟠 **B4 — Hydration destroys+recreates `x-for`/`x-if` DOM (focus/scroll/selection loss).** reinvented. `runtime.ts:98‑101` (`removeSsrClones`). → `@alpinejs/morph` (pure-JS, on-device-safe) to reconcile in place.
- 🟠 **B5 — `x-teleport` not applied during SSR** (content jumps on hydrate). missing. `renderComponent.ts` walker. → move teleported subtree to target server-side.
- 🟠 **B6 — `$id` server/client id mismatch → hydration mismatch on aria/label attrs.** reinvented. `magics.ts:19`. → match Alpine's id scheme/counter.
- 🟠 **B7 — Object-source `x-for` loses the key** (`(v,key) in obj` wrong SSR). missing. `forExpression.ts:33‑35`. → `Object.entries`.
- 🟡 **B8 — Named/multiple `<slot>`s unsupported** (regex single-match). `renderComponent.ts:346,443`.
- 🟡 **B9 — Store client state recomputed, not serialized → SSR mutations/non-determinism flash.** `renderPage.ts:297‑298`. → serialize with devalue + seed.
- 🟡 **B10 — `x-modelable` unsupported.** · 🟡 **B11 — magics `$root`/`$data` absent, `$refs/$dispatch/$watch` inert SSR.** `magics.ts:22‑30`. · 🟡 **B12 — custom `Alpine.magic` don't resolve SSR.** `evaluator.ts:52‑64`. · 🟡 **B13 — no plugin-ecosystem SSR seam (`$persist`/`x-mask` flash).** `client-entry.ts`. · 🟡 **B14 — evaluator no async/`await`/multi-statement.** `evaluator.ts:35‑39`. · 🟡 **B15 — SSR expression errors silently swallowed (no dev warning).** `evaluator.ts:60‑63`.
- ⚪ B16 linkedom under-used, `innerHTML` round-trips `renderComponent.ts:368‑532` · ⚪ B17 `x-effect`/nested `x-init` root-only (undocumented) · ⚪ B18 boolean-attr allowlist incomplete `bindings.ts:5‑17` · ⚪ B19 no CSS `:deep()` escape hatch `scopedCss.ts:22‑53` · ⚪ B20 `Alpine.bind` named objects unsupported SSR.

*Biggest Alpine-fidelity gap: B1 + B2 (tied) — both break zero-flash.*

---

## C. Server — robustness  (`packages/apexjs/src/{prod,dev,middleware,hooks,auth,api,config,security,routing}/**`)

- 🔴 **[V1] C1 — Security headers/CSP/HSTS never applied by default.** missing (util exists, unwired). `applySecurityHeaders` `security/headers.ts:18` never called in `createProdApp` (`prod/server.ts:184‑356`). → default header layer (opt-out).
- 🔴 **[V1] C2 — No rate limiting / brute-force protection by default.** missing (util exists, unwired). `security/rateLimit.ts:40` never mounted. → default IP limiter + stricter auth bucket.
- 🔴 **[V1] C3 — Unbounded request body.** missing. `api/routes.ts:199` `readBody` uncapped; `/mcp` `mcp/server.ts:119` too. → enforce `maxSize`.
- 🔴 **[V1] C4 — No request/header timeout or connection cap (Slowloris).** missing. `prod/server.ts:384`. → set `requestTimeout`/`headersTimeout`/`maxConnections`.
- 🟠 **[V1] C5 — Hand-rolled SHA-256+HMAC crypto for session signing.** reinvented. `auth/hmac.ts:21,88,136`. compare is constant-time but primitive is from-scratch. → use WebCrypto/`node:crypto` where available; gate pure-JS path to bare-engine only; add reference test vectors.
- 🟠 **[V1] C6 — Session cookies: no `Secure` flag, no revocation/rotation.** weak. `auth/session.ts:48‑53,81‑85`. → set `secure` in prod; document stateless-revocation limit or add server-side session id.
- 🟠 **C7 — Signed device token has no expiry claim (valid forever).** weak. `auth/hmac.ts:136`. → embed+verify `exp`.
- 🟠 **C8 — Static serving reinvented: blocking sync I/O, no ETag/304/Range.** reinvented. `prod/server.ts:230‑245`. → h3 `serveStatic`.
- 🟡 **C9 — CSRF Origin/Referer-only, fails closed (the logout 403).** reinvented/weak. `security/csrf.ts:14‑31`. → signed-token/double-submit fallback for same-origin sans Origin.
- 🟡 **C10 — Reflected unescaped path in 404 HTML (XSS).** weak. `prod/server.ts:318`. → HTML-escape.
- 🟡 **C11 — Routes without `input` shape pass raw unvalidated data.** weak. `api/routes.ts:203‑211`. → require shape / reject unknown keys.
- 🟡 **C12 — No password hash primitive shipped (apps roll their own).** missing. → argon2id/scrypt `hashPassword`/`verifyPassword` (scrypt in `node:crypto`).
- 🟡 **C13 — No CORS policy for `/api`,`/mcp`.** missing. `prod/server.ts:289‑306`. → configurable deny-by-default CORS.
- 🟡 **C14 — No request ID / trace correlation.** missing. `prod/server.ts:206‑227`. → `randomUUID` + `x-request-id` + into log/`ErrorContext`.
- 🟡 **C15 — Readiness probe missing (liveness only, no DB check).** weak. `prod/server.ts:192‑202`. → `/readyz` + 503 while draining.
- 🟡 **C17 — Static path-escape check uses `startsWith(dir)` without sep.** weak. `prod/server.ts:236`. → compare `dir+sep` / use `serveStatic`.
- 🟡 **C18 — MCP calls bypass `locals` + body-size/idempotency/rate protections.** weak. `mcp/server.ts:70‑75`. → thread `locals`, apply same edge protections.
- ⚪ C-low idempotency/rate/session default in-memory (single-process) — warn on multi-instance without shared store `api/idempotency.ts:52`,`security/rateLimit.ts:64`.
- **Strengths (keep):** unified REST/MCP authz `auth/check.ts`; prod error-masking default-safe; graceful shutdown; no raw SQL in server; SSR `no-store` + hashed-asset `immutable`.

---

## D. Reinvented wheels + Scaffold + Docs  (CLI/build/create-apexjs)

**Reinvented (retire with a dep):**
- 🟡 **D1 — Hand-rolled dotenv parser (no `${VAR}` expansion).** `config/resolve.ts:9‑47`. → Vite `loadEnv` / `dotenv`+`dotenv-expand`. *(= server C16)*
- 🟡 **D2 — ~5 duplicated recursive fs-walkers.** `typecheck/walk.ts:7`, `components/registry.ts:54`, `mcp-server.ts:76`, `build/pwa.ts:46`, `new.ts`/`create-apexjs`. → one internal walker or `tinyglobby`.
- ⚪ D3 custom inflector (keeps needing patches) `make.ts:441‑519` → `pluralize` · ⚪ D4 three ad-hoc ANSI-color systems → consolidate on `ui.ts`/`picocolors` · ⚪ D5 duplicated scaffolder helpers across `new.ts`+`create-apexjs`.

**Scaffold quality (blocks "fix the scaffolding"):**
- 🔴 **[V1] D6 — `apex make model` emits `await createDb('data.db')` — top-level await (won't bundle for `--mobile`) + hardcoded file (ignores `DATABASE_URL`).** `make.ts:299‑309` vs canonical `lazyDb` `templates/features/data/db/index.ts:9‑11`. → emit the `lazyDb`+shared `db/index.ts` pattern.
- 🟠 **[V1] D7 — Four contradictory `createDb`/driver signatures taught.** `make.ts:306,771`, `db/index.ts:11`, `migrate.ts:49‑54`. → one config shape, one driver name everywhere.
- 🟠 **[V1] D8 — `make model` under-installs deps (missing `drizzle-orm`+`sql.js`), never scaffolds `db/index.ts`.** `make.ts:945`, `features.ts:41‑47`. → require `extend data` or install the full set.
- 🟠 **D9 — Starter migration is SQLite-only but sold as portable.** `make.ts:322‑334` vs `AGENTS.md:102`. → dialect-aware DDL from `model.migrationSql(dialect)`.
- 🟡 **D10 — `make composable` regex-scrapes model fields (drifts).** `make.ts:387‑417`. → introspect the module.

**Docs teach wrong (must fix for v1):**
- 🟠 **[V1] D11 — `db/README.md` teaches the retired `defineResource`+hand-written schema API.** `templates/default/db/README.md:12‑18`. → rewrite to `defineModel().resource()`.
- 🟠 **[V1] D14 — the AR section added to `AGENTS.md` this session teaches the raw-SQL/bypass pattern.** must be rewritten after A1–A5. (self-inflicted)
- 🟡 D12 default `typecheck` script runs `tsc` not `apex check` `package.json:13` · 🟡 D13 `apex_extend` MCP tool enum missing `pwa` `mcp-server.ts:175` · ⚪ D-low model-test "already installed" claim `make.ts:764`, deploy presets use bare `apex` not `npx apex` `build.ts:86,118`, `--mobile` sans `mobile <platform>` yields no `/splash`.

---

## v1 blocker rollup (must clear before 1.0)

| # | Cluster | Blockers |
|---|---|---|
| A1–A7 | ORM correctness + Eloquent core | AR pipeline unify (hooks/softDelete/scope/validation), rebuild on Drizzle, relations, operators |
| B1–B3 | Alpine zero-flash | x-model SSR value, $store seeding, scope-proxy enumeration |
| C1–C6 | Server hardening defaults | headers/CSP, rate-limit, body cap, timeouts, crypto, secure cookies |
| D6–D8, D11, D14 | Scaffold+docs on-ramp | bundleable/portable data scaffold, one API, fixed docs/AGENTS.md |

**Recommended fix order:** (1) ORM unify+Drizzle rebuild (A1–A7) — unblocks everything downstream and kills the reinvention; (2) server hardening defaults (C1–C6) — pure wiring of utils that already exist; (3) Alpine zero-flash (B1–B3); (4) scaffold+docs (D6–D14) last, so they teach the *final* APIs.
