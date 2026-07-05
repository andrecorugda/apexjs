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

**Latest release (npm):** `@apex-stack/core@0.8.0` · `@apex-stack/kit@0.4.0` · `create-apexjs@0.5.0`
· `@apex-stack/theme@0.3.0` · `@apex-stack/data@0.1.23` · `@apex-stack/vite@0.1.8`. Docs + UI Kit +
Theme Builder live at **apexjs.site**. Client-side navigation (SPA) shipped in core 0.8.0.

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
- **Client-side navigation in islands mode** — SPA nav ships for the standard SSR/hydration path;
  islands pages (lazy-Alpine, `x-ignore`) still full-load. Separate design (re-run the island loader
  on swapped content). Also deferred within SPA nav: **persistent layout regions** (`data-apex-persist`
  so a navbar keeps open-dropdown state across navigation) — v1 swaps the whole `[data-apex-root]`.
- `x-for`/`x-if` inside **islands** (per-island clone removal at `initTree`). *(Note: in the
  standard SSR/hydration path, components in `x-for`/`x-if` now work — this deferral is islands-only.)*
- Component `<script server>` loaders. *(Slots shipped.)*
- Component-in-loop where the component's **root x-data computes from props** (Counter-in-loop) uses
  a `with()` runtime shim — works, but a factory-based (`Alpine.data`) approach would be cleaner.
- Nitro production build + deploy presets (dev server is h3 + Vite middleware today).
- `outputSchema` → MCP structured content; route-level auth scoping for tools.
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
| Component-level data loaders | ✅ | ✅ | ❌ | props only (P2) |
| Fine-grained HMR | ✅ | ✅ | 🟡 | full reload (P2, browser-verify) |
| Template type-checking | ✅ | ✅ | ❌ | Volar-style (P3) |
| Image / font optimization | ✅ | ✅ | ❌ | (P3) |
| Auth module | 🟡 | 🟡 | ❌ | Security model below (P3) |
| Deploy presets (Vercel/CF/…) | ✅ | ✅ | ❌ | node only (P3) |
| Testing kit for users | ✅ | ✅ | 🟡 | internal tests only (P3) |
| i18n | 🟡 | ✅ | ❌ | (P3) |
| Plugin / module ecosystem | ✅ | ✅ | ❌ | (P3) |

**Scorecard:** ~22 of the core dimensions at parity (✅), plus the AI-native moat that's ✅ for Apex
and ❌ for both Next and Nuxt. Remaining are the SPA/browser-runtime niceties (client-nav, loading
boundaries, fine-grained HMR — need live-browser verification), component-level loaders, and the
P3 ecosystem (deploy presets, image/font, i18n, auth, test kit, Volar, plugins).

**Delivery waves:**
- **Wave B — "scales to real apps" (P2):** ✅ runtime config, middleware, `InferInput/Output`, nested
  layouts, error boundary, form-action sugar, global styles, `apex upgrade`, **client-side navigation
  + loading boundary + prefetch** (browser-verified in dev *and* the prod server) shipped. Remaining:
  fine-grained HMR (needs live-browser verification), component-level loaders.
- **Wave C — "ecosystem & polish" (P3):** deploy presets, image/font optimization, i18n, auth
  module, test kit, template type-checking (Volar), plugin/module system.

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
