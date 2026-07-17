# Apex JS Roadmap

**Positioning:** *HTML-first apps, AI-native APIs.* Three pillars:

- **Light** — Alpine + islands, near-zero JS by default
- **Full-stack** — file routing, SSR, typed API routes on Node
- **AI-native** — every typed route is also an MCP tool, no extra lib

## Strategy

Don't out-build Laravel/Rails feature-by-feature. **Curate + integrate** best-in-class Node
libraries, wrap them in Apex conventions + one CLI, and give each an **MCP hook**. The moat is
that *every model, route, and job is AI-callable by construction* — nothing else has that.

| Concern | Leverage (don't rebuild) | Apex twist |
| --- | --- | --- |
| ORM + migrations | Drizzle | models/queries exposable as MCP tools |
| CLI + generators | citty | `apex make:*`, `apex migrate` |
| Jobs + queues | BullMQ | a job = an MCP tool; queue state AI-observable |
| Events + observers | thin event bus + model hooks | lifecycle events → watchers/MCP |
| Validation | zod | one schema → REST + MCP + TS types |
| Auth | Lucia / Auth.js | route + tool scoping in one place |

## Status

**Latest release (npm):** `@apex-stack/core@0.9.0` · `@apex-stack/kit@0.4.0` · `create-apexjs@0.5.0`
· `@apex-stack/theme@0.3.0` · `@apex-stack/data@0.1.27` · `@apex-stack/vite@0.2.0`. Docs + UI Kit +
Theme Builder live at **apexjs.site**. Client-side nav (0.8.0), style-only HMR + islands static
build (0.9.0).

### ✅ Phase 0 — Spike
`.alpine` SFC → SSR (hydration-safe, no flash) + Vite HMR. Proven.

### ✅ AI-native APIs
`defineApexRoute` serves REST **and** an auto-MCP tool at `/mcp`. `apex mcp` CLI inspector.

### ✅ Islands
`apex dev --islands` — static-first, per-island lazy hydration (`client:load|idle|visible|none`),
zero JS until an island needs it.

### ✅ Phase 1 — Base Camp
- File-based routing: `pages/**/*.alpine`, static + `[param]` dynamic segments, 404s.
- Component embedding: `<Counter start="5" />` → `components/Counter.alpine`, props (static + `:bound`),
  resolved x-data baked as a prop-free literal for hydration; works as component islands too, **and
  inside `x-for` / `x-if`** (components in loops/conditionals hydrate fully styled — the bit raw
  Alpine can't do).
- `create-apexjs` scaffolder: `npm create apexjs@latest` — scaffolds a **real themed demo app**
  (layout + navbar + dark toggle, landing, blog list + dynamic `[slug]`, About with SEO, an
  MCP-exposed API route, bundled themed components).

### ◑ Phase 2 — Data
- **Done:** `@apex-stack/data` — Drizzle + SQLite, `createDb`, SQL-file `applyMigrations`, and
  `defineResource` (list/get/create) where one table → REST endpoints **and** MCP tools on one DB.
  Proven: an MCP-tool write is visible via the REST list.
  Full CRUD (list/get/create/update/delete). `apex migrate` CLI + `apex make page/component/api`.
- **Next:** `drizzle-kit`-generated migrations, more Drizzle drivers. *(`apex make model`,
  per-route/resource auth scoping, and component `<script server>` loaders + slots all shipped.)*

### ✅ Production build & deploy
- `apex build --islands` — zero-JS static site (SSG).
- `apex build` — prerender + per-page client bundle; interactive apps from a **static** `dist/`.
- `apex build --server` + `apex start` — a production **Node server** for dynamic routes (`[slug]`),
  API + MCP, static assets, and any database. Verified end-to-end.
- **Next:** Nitro deploy presets (Vercel/Netlify/Cloudflare adapters); streaming SSR. *(Island-mode
  client bundling in the built output shipped in core 0.9.0 — islands hydrate from static hosting.)*

### ◑ Phase 3 — Backend
- **Done — auth (all MCP-aware):** `defineAuth` + `ctx.user`, route `auth`/`can`
  (401/403), resource/model `access` + row-level `scope`, per-user MCP `tools/list` +
  `tools/call` re-check, sealed-cookie sessions + CSRF + rate-limiter + security
  headers, `apex make auth`. One policy enforced across pages/REST/MCP; fail-closed;
  verified by two independent adversarial passes + prod-build parity. See
  [AUTH_DESIGN.md](AUTH_DESIGN.md).
- **Next:** jobs/queues, events/observers (→ model behaviors, [AUTH_DESIGN.md](AUTH_DESIGN.md) §8).

### ▢ Phase F — Apex Compass (AI agent enablement)
*Planned. Name: **Apex Compass** — it orients a coding agent in your app.* The Laravel-Boost
equivalent, but native — Apex already speaks MCP, so a coding agent can be made an
expert in both Apex and *your* app. Distinct from the runtime per-route MCP (which
exposes app **data**); this is **dev-time** codebase + framework awareness. Includes:
- **Project MCP for coding agents** — introspection tools: list pages/routes/components/
  models/resources + their input/output schemas, the DB schema + migration status, the
  MCP tools already defined, resolved config; run read-only queries; tail logs.
- **Framework guidelines** — curated, version-aware Apex conventions (the `.alpine`
  format, `defineApexRoute`/`defineModel`/behaviors/auth/testing patterns, do's & don'ts)
  fed to the agent so it writes idiomatic Apex.
- **Docs access** — search the version-matched Apex docs as a tool.
- **Rules-file generation** — `apex compass init` writes/updates `CLAUDE.md` / `AGENTS.md`
  / `.cursor/rules` with Apex conventions + a live map of the project.
Package `@apex-stack/compass`, CLI `apex compass`.

### ● Phase E — Reach: on-device mobile + PWA
*Both **shipped**.*
- **On-device mobile (shipped — `@apex-stack/core@0.38.0`):** `apex build --mobile` packages an
  app so its **full SSR + API pipeline runs on the device** in a bare JS engine (Android
  `androidx.javascriptengine` / iOS JavaScriptCore) — offline, no server, no port: server-rendered
  pages, typed API routes, on-device **SQLite** (sql.js as pure JS, persisted across cold starts),
  and **sealed-cookie auth** — the same server code as the web build, unchanged. `apex mobile
  android` scaffolds the native WebView shell + builds an APK in one command; an iOS shell exists
  (engine CI-verified on the iOS Simulator). This went *beyond* a static Capacitor/Tauri wrap — it
  runs your server on the device. See [mobile docs](https://apexjs.site/docs/mobile.html). *Honest
  scope: a WebView app (not native-widget UI); the on-device DB is in-memory + snapshot-persisted;
  native device APIs (camera, …) need shell wiring.*
- **PWA (shipped — `@apex-stack/core@0.40.0`, 🟡):** a `pwa: { name, … }` config block makes
  `apex build` emit `manifest.webmanifest` + a generated precache service worker; the HTML shells
  link the manifest/theme-color and register the worker automatically. Static/islands precache the
  whole dist (full offline); the server build precaches assets and serves pages network-first with
  a cache fallback. `apex extend pwa` scaffolds default icons + the config block. *Design note:
  hand-rolled ~60-line worker instead of `vite-plugin-pwa` — Apex has no index.html for a plugin
  to transform (shells are string-built) and the precache list is known at build time; zero deps.*

### ◑ Phase D — Model behaviors ("traits")
*Status: shipped in `@apex-stack/data@0.5.0` (see `AUTH_DESIGN.md` §8).* The model is the
center of gravity, so cross-cutting concerns attach there once and flow to every
surface. A **behavior** is a pure, composable descriptor passed via `use: [...]` on
`defineModel` — the model's OCP extension seam (author your own against a public
contract). Each may contribute **fields**, an **insert-shape** tweak, lifecycle
**hooks**, a row-level **scope**, non-equality **filters**, and per-op **access**.
Composition is deterministic and fail-closed: fields merge (collision = define-time
error), scopes AND-combine, access is most-restrictive-wins, hooks run in order.
Behaviors fold into an *effective spec* inside `defineModel`, and their
hooks/scope/access ride into `defineResource` — so they fire on the **single dispatch
path for both REST and MCP** (an `observable` hook logs the AI's tool calls for free;
same seam as auth). **Built-ins:** `timestamps()`, `owned(col)` (Phase C's
`access`+`scope` packaged), `observable(hooks)`, `softDeletes(col)`, `auditable()`
(companion `<name>_audit` table, auto-provisioned; logs an AI's MCP writes for free).
- **Next:** `policy(...)` sugar and auto-diff model→ALTER migrations.

## Known deferrals
- **Client-side navigation in islands mode** — SPA nav ships for the standard SSR/hydration path;
  islands pages (lazy-Alpine, `x-ignore`) still full-load. Separate design (re-run the island loader
  on swapped content). Also deferred within SPA nav: **persistent layout regions** (`data-apex-persist`
  so a navbar keeps open-dropdown state across navigation) — v1 swaps the whole `[data-apex-root]`.
- `x-for`/`x-if` inside **islands** (per-island clone removal at `initTree`). *(Note: in the
  standard SSR/hydration path, components in `x-for`/`x-if` now work — this deferral is islands-only.)*
- Component-in-loop where the component's **root x-data computes from props** (Counter-in-loop) uses
  a `with()` runtime shim — works, but a factory-based (`Alpine.data`) approach would be cleaner.
- Nitro production build + deploy presets (dev server is h3 + Vite middleware today).
- `outputSchema` → MCP structured content. *(Route-level auth scoping for tools shipped — see Security model.)*
- **Apex Language Server (LSP).** The VS Code extension is grammar-only (TextMate
  syntax highlighting): it colors any PascalCase tag as a component by convention,
  but has no project awareness. An LSP would add: does-this-component-exist checks
  (red squiggle on `<Typo/>`), go-to-definition, prop/`x-data` autocomplete, and
  `.alpine` template type-checking (Volar-style). Bigger build than the grammar.

## Gap analysis vs Next.js / Nuxt

The goal isn't to clone Next/Nuxt — it's to give Alpine developers what a modern meta-framework
offers, the **Apex way** (HTML-first, ~zero-JS by default, AI-native by construction). Where a
server surface has a schema, it should be AI-callable for free — that's the moat neither Next nor
Nuxt has.

### Capability matrix vs Next.js & Nuxt

The proof of concept: as of **`@apex-stack/core@0.6.x`**, Apex matches the core meta-framework surface
of Next.js and Nuxt — **and** every server surface with a schema is an MCP tool for free, which
neither of them has. Legend: ✅ have · 🟡 partial · ❌ not yet.

| Dimension | Next.js | Nuxt | **Apex** | How (Apex) |
|---|:---:|:---:|:---:|---|
| File-based routing | ✅ | ✅ | ✅ | `pages/**` + `[param]` |
| Dynamic / catch-all routes | ✅ | ✅ | ✅ | `[param]`, `[...name]` |
| Server data loading | ✅ | ✅ | ✅ | `loader()` |
| Layouts | ✅ | ✅ | ✅ | `layouts/*.alpine` + `<slot>` |
| **Nested layouts** | ✅ | ✅ | ✅ | layout `export const layout` |
| Head / SEO / meta | ✅ | ✅ | ✅ | `head()` export |
| Composables / reusable logic | ✅ | ✅ | ✅ | `<script client>` + plain fns |
| Global store / shared state | 🟡 | ✅ | ✅ | `defineStore` (SSR-safe) |
| Typed API routes | ✅ | ✅ | ✅ | `defineApexRoute` |
| **Shared FE/BE types** | ✅ | ✅ | ✅ | `InferInput`/`InferOutput` |
| Data / ORM layer | 🟡 | 🟡 | ✅ | `defineResource` (REST+MCP) |
| **Server actions / form sugar** | ✅ | ✅ | ✅ | `createAction` + routes |
| **Env vars / runtime config** | ✅ | ✅ | ✅ | `defineConfig` + `.env` |
| **Middleware** | ✅ | ✅ | ✅ | `middleware/*.ts` |
| **Error boundary** | ✅ | ✅ | ✅ | `pages/error.alpine` |
| Component slots / children | ✅ | ✅ | ✅ | `<slot>` + fallback |
| Scoped styles | 🟡 | ✅ | ✅ | `<style scoped>` |
| Global / shared styles | ✅ | ✅ | ✅ | `app.css` (auto-loaded) |
| Tailwind | ✅ | ✅ | ✅ | `@tailwindcss/vite` auto |
| **Component library + theming** | 🟡 | ✅ | ✅ | 36 UI Kit components, `apex add`, `apex theme` |
| Editor support | ✅ | ✅ | ✅ | `.alpine` VS Code extension |
| Prod build (static / SSR / node) | ✅ | ✅ | ✅ | static · islands · server |
| Islands / partial hydration | 🟡 | 🟡 | ✅ | `client:load\|idle\|visible` |
| **AI-native — every route is an MCP tool** | ❌ | ❌ | ✅ | **unique moat** |
| Client-side navigation (SPA) | ✅ | ✅ | ✅ | fetch + swap, history, prefetch, progress bar |
| Loading boundaries | ✅ | ✅ | ✅ | `pages/loading.alpine` on slow navs |
| Component-level data loaders | ✅ | ✅ | ✅ | `<script server> loader({props})` — singleton + in `x-for`/`x-if`, memoized |
| Fine-grained HMR | ✅ | ✅ | 🟡 | style edits hot-swap in place; template edits reload w/ scroll restored |
| Template type-checking | ✅ | ✅ | ❌ | Volar-style (P3) |
| Image / font optimization | ✅ | ✅ | ❌ | (P3) |
| Auth module | 🟡 | 🟡 | ✅ | `defineAuth` + `auth`/`can` + resource `access`/`scope`; **one policy across pages/REST/MCP** |
| **Auth governs the AI/MCP surface** | ❌ | ❌ | ✅ | per-user `tools/list` + `tools/call` re-check — **unique** |
| Deploy presets (Vercel/CF/…) | ✅ | ✅ | ❌ | node only (P3) |
| Testing kit for users | ✅ | ✅ | ✅ | `@apex-stack/core/testing` (`createTestApp`) + `factory()` + `apex test` + test-aware `make` |
| i18n | 🟡 | ✅ | ✅ | `i18n` config + `locales/*.json`; `t`/`locale` in loaders; `/<locale>` + Accept-Language; SSR `<html lang>` |
| PWA — offline / installable | 🟡 | ✅ | ❌ | planned — integrate `vite-plugin-pwa` + a `pwa` config (manifest + service worker) |
| Mobile / desktop packaging | ❌ | ❌ | ❌ | planned — wrap the static build with Capacitor/Tauri (WebView shell + device APIs); not native UI |
| **AI agent enablement (Boost-style)** | ❌ | ❌ | ▢ | planned — **Apex Compass**: project MCP + guidelines + docs + rules-file gen (Laravel Boost equivalent) |
| Plugin / module ecosystem | ✅ | ✅ | ❌ | (P3) |

**Scorecard:** ~24 of the core dimensions at parity (✅), plus the AI-native moat that's ✅ for Apex
and ❌ for both Next and Nuxt (now including auth that governs the MCP surface). Remaining are
fine-grained (DOM-morphing) HMR and the P3 ecosystem (deploy presets, image/font,
Volar, plugins). *(Auth + component-level loaders + test kit + i18n shipped.)* *(Auth + component-level loaders shipped.)*

**Delivery waves:**
- **Wave B — "scales to real apps" (P2):** ✅ runtime config, middleware, `InferInput/Output`, nested
  layouts, error boundary, form-action sugar, global styles, `apex upgrade`, **client-side navigation
  + loading boundary + prefetch** (browser-verified in dev *and* the prod server) and
  **component-level loaders** shipped. Remaining: fine-grained HMR is now partial (style-only edits
  hot-swap without a reload, template edits reload with scroll restored — DOM-morphing template HMR
  is the remaining piece).
- **Wave C — "ecosystem & polish" (P3):** deploy presets, image/font optimization,
  template type-checking (Volar), plugin/module system. *(Auth, test kit, and i18n shipped.)*

## ✅ Big epic — Apex Stack Components + Theme Builder (SHIPPED)

A first-class component library + theming story, all delivered:

1. ✅ **`@apex-stack/components`** — 36 curated `.alpine` components adapted from Penguin UI (MIT),
   token-driven. `apex add <name...>` / `apex add --all` copies them into a project (registry bundled
   into core). Browse + tick-to-generate at **apexjs.site/ui.html** (each previewed live).
2. ✅ **`@apex-stack/theme`** — Tailwind v4 `@theme` token contract (colors/radius/fonts + `dark`
   variant). `apex theme --primary … --radius … --font-*` rewrites the managed block in `app.css`.
3. ✅ **Visual theme builder** at **apexjs.site/theme.html** — pick colors/radius/fonts, live preview,
   copy the `apex theme …` command (only changed flags).
4. ✅ **Inherited theming** — every component reads the shared tokens, so one `apex theme` restyles
   the whole app.
5. ✅ **New default scaffold** built on these components + theme (replaces the old placeholder demo).
6. ✅ **Components work in `x-for`/`x-if`** — component-driven lists hydrate fully styled.

**Deferred within this area:** heavier AI-oriented components (`ai-*`); scaffold `.dark` persisted via
SSR (today it's a client-side toggle); factory-based x-data for prop-computed component roots in loops.

## Security model (shipped)

*Status: built + verified (two independent adversarial passes + prod-build parity).* One auth
policy enforced on the server, applied to **every** surface — pages/loaders, REST `/api/*`, and MCP
`/mcp` — so the AI-callable surface can never do more than the logged-in user can. **Fail-closed.**
Full threat model + design: [AUTH_DESIGN.md](AUTH_DESIGN.md).

- **`defineAuth`** (`server/auth.ts`) resolves "who is this request?" (cookie / JWT / adapter like
  Lucia, Better-Auth, Auth.js) and injects `user` into every loader, route handler, and MCP tool
  call. `apex make auth` scaffolds it + login/logout routes.
- **Route gating** on `defineApexRoute` via `auth: true` + optional `can: ({ user, input }) => …`.
  Unauthenticated REST → 401, unauthorized → 403. For MCP, an unauthorized route is **omitted from
  `tools/list`** per-user and refused on `tools/call` (defense-in-depth).
- **`defineResource` / `defineModel`** get per-operation `access` (`'public' | 'authed' | fn`) plus
  row-level `scope(...)` applied on every read/write (list/get/update/delete + create), so an AI
  sees only the caller's rows. Declaring either gates the whole resource (unlisted ops → `authed`).
  These are **behavior-settable** (see Phase D) — `owned('ownerId')` / `policy(...)`.
- **Backend → UI gating:** loaders return only permitted data and SSR emits only permitted HTML;
  non-secret `can` flags seed the hydration island for show/hide (UX only — server policy is the
  security).
- **Hardening (`@apex-stack/core/server`):** CSRF Origin-check for cookie mutations, sealed
  (`HttpOnly`/`Secure`/`SameSite=Lax`) session cookies (`sessionAuth`/`login`/`logout`), a
  rate-limiter (`createRateLimiter`), and a security-headers helper. OAuth / JWT issuance / 2FA are
  adapter territory (wire via `sessionAuth`'s `toUser` or a custom `defineAuth`).
- **Delivered as** `@apex-stack/core@0.15.0` + `@apex-stack/data@0.4.1`, in three verified
  increments (C1 identity + gating · C2 access + scope · C3 sessions + hardening).
