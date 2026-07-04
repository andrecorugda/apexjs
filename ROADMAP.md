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
  resolved x-data baked as a prop-free literal for hydration; works as component islands too.
- `create-apexjs` scaffolder: `npm create apexjs@latest`.

### ◑ Phase 2 — Data
- **Done:** `@apex-stack/data` — Drizzle + SQLite, `createDb`, SQL-file `applyMigrations`, and
  `defineResource` (list/get/create) where one table → REST endpoints **and** MCP tools on one DB.
  Proven: an MCP-tool write is visible via the REST list.
  Full CRUD (list/get/create/update/delete). `apex migrate` CLI + `apex make page/component/api`.
- **Next:** `apex make:model` + `drizzle-kit`-generated migrations, per-route auth scoping, more
  Drizzle drivers. Component `<script server>` loaders + slots.

### ✅ Production build & deploy
- `apex build --islands` — zero-JS static site (SSG).
- `apex build` — prerender + per-page client bundle; interactive apps from a **static** `dist/`.
- `apex build --server` + `apex start` — a production **Node server** for dynamic routes (`[slug]`),
  API + MCP, static assets, and any database. Verified end-to-end.
- **Next:** Nitro deploy presets (Vercel/Netlify/Cloudflare adapters); island-mode client bundling
  in the built output; streaming SSR.

### ▢ Phase 3 — Backend
Jobs/queues, events/observers, auth — all MCP-aware.

## Known deferrals
- `x-for`/`x-if` inside islands (per-island clone removal at `initTree`).
- Component `<script server>` loaders, slots.
- Nitro production build + deploy presets (dev server is h3 + Vite middleware today).
- `outputSchema` → MCP structured content; route-level auth scoping for tools.

## Gap analysis vs Next.js / Nuxt

The goal isn't to clone Next/Nuxt — it's to give Alpine developers what a modern meta-framework
offers, the **Apex way** (HTML-first, ~zero-JS by default, AI-native by construction). Where a
server surface has a schema, it should be AI-callable for free — that's the moat neither Next nor
Nuxt has.

**Already shipped** (no longer gaps): global store (`defineStore`), composables + `<script client>`,
layouts (`layouts/*.alpine` + `<slot>`), head/SEO (`head()` export), Tailwind (`@tailwindcss/vite`),
dynamic + catch-all routes (`[param]` / `[...name]`), component slots, and the `.alpine` VSCode
extension. Typed API routes, server data loaders (`loader()`), and `defineResource` (REST+MCP) were
already in place.

**Recently shipped (on `develop`, unreleased):**
- ✅ **Env vars / runtime config from `.env`** — `defineConfig({ runtimeConfig })` in `apex.config.ts`,
  `.env`/`.env.<mode>`/`.env.local` loading with `APEX_`/`APEX_PUBLIC_` overrides, `useRuntimeConfig()`
  + `env('KEY', fallback)`, `config` in loaders/routes (REST + MCP), public-only client seed. Wired
  through dev, prod (`apex start`), and the static/server build. Tested + E2E-verified.
- ✅ **Route middleware** — `middleware/*.ts` → `defineMiddleware(ctx => …)`, filename order, runs on
  every request; `ctx.locals` threaded into loaders + route handlers, `ctx.redirect()` short-circuits.
  Dev + prod + build. `apex make middleware`. Tested + E2E-verified. Foundation for auth.
- ✅ **Shared FE/BE types** — `defineApexRoute` carries input/output types; `InferInput`/`InferOutput`
  derive them on the frontend from one contract (no drift). Type-checked + tested.

**Remaining gaps** (Next/Nuxt have them, Apex doesn't yet):

| Gap | Apex today | Priority |
|---|---|---|
| Client-side navigation (SPA nav / `<Link>`) | ❌ full page loads | P2 |
| Loading / error boundaries (per-route) | 🟡 dev error page only | P2 |
| Server actions / form-action sugar | 🟡 REST via `defineApexRoute`, no form sugar | P2 |
| Global / shared styles (documented `app.css`) | 🟡 works, undocumented | P2 |
| Component-level data loaders | ❌ props only | P2 |
| Fine-grained HMR (morph vs full reload) | 🟡 full reload | P2 |
| Nested layouts | ✅ single layout, nesting pending | P2 |
| Template type-checking (Volar-style) | ❌ | P3 |
| Image / font optimization | ❌ | P3 |
| Env-based auth module | ❌ (see Security model below) | P3 |
| Deploy presets (Vercel/Netlify/Workers) | ❌ node only | P3 |
| Testing kit for users | 🟡 internal tests only | P3 |
| i18n | ❌ | P3 |
| Plugin / module ecosystem | ❌ | P3 |

**Delivery waves:**
- **Wave B — "scales to real apps" (P2):** ✅ runtime config, ✅ middleware, ✅ `InferInput/Output`
  shipped. Remaining: client-side navigation, per-route error/loading boundaries, server-action/form
  sugar, component-level loaders, global-styles docs, fine-grained HMR, nested layouts.
- **Wave C — "ecosystem & polish" (P3):** deploy presets, image/font optimization, i18n, auth
  module, test kit, template type-checking (Volar), plugin/module system.

## Security model (planned)

*Status: design, not yet built.* One auth policy enforced on the server, applied to **every**
surface — pages/loaders, REST `/api/*`, and MCP `/mcp` — so the AI-callable surface can never do
more than the logged-in user can. Today all three are open.

- **`defineAuth`** (`server/auth.ts`) resolves "who is this request?" (cookie / JWT / adapter like
  Lucia, Better-Auth, Auth.js) and injects `ctx.session` / `ctx.user` into every loader, route, and
  MCP tool call.
- **Route gating** on `defineApexRoute` via `auth: true` + optional `can: ({ user }) => …`.
  Unauthenticated REST → 401, unauthorized → 403. For MCP, an unauthorized route is **omitted from
  `tools/list`** per-user and refused on `tools/call`.
- **`defineResource`** gets per-operation `access` (`'public' | 'authed' | fn`) plus row-level
  `scope(...)` applied on every read/write, so an AI sees only the caller's rows.
- **Backend → UI gating:** loaders return only permitted data and SSR emits only permitted HTML;
  non-secret `can` flags seed the hydration island for show/hide (UX only — server policy is the
  security).
- **Hardening defaults:** CSRF for cookie-based mutations, secure signed cookies
  (`HttpOnly`/`Secure`/`SameSite=Lax`), rate-limit hook on `/api` + `/mcp`, never serialize secrets
  into the SSR state island, security-headers/CSP helper.
- **Phased plan:** Phase 1 — `defineAuth` + `ctx.user` threading + `auth`/`can` + 401/403 + per-user
  `tools/list` (server-side, unit-testable). Phase 2 — `access` + `scope` on resources + `user`/`can`
  in templates. Phase 3 — signed-cookie session helper, `apex make auth`, login/logout + CSRF, and
  Lucia/Better-Auth/Auth.js + OAuth adapters.
