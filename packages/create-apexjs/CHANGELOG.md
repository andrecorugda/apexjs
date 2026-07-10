# create-apexjs

## 0.6.0

### Minor Changes

- feat: `npm create apexjs` feature parity + richer `apex_project_info`

  **create-apexjs** now supports the optional-feature selection that `apex new`
  always had: pass `--data` / `--auth` / `--i18n` (or answer the interactive
  prompt) and the scaffolder applies them via `apex extend` after install, landing
  them in the initial commit. Previously these flags were silently ignored by the
  `npm create apexjs` path — the two entry points are now at parity.

  **`apex_project_info`** (the MCP tool agents read before writing) now returns
  _shape_, not just an inventory: API routes carry their `method`, mounted `path`,
  and `mcp`/`auth` flags (and whether they're a route or a model resource); models
  carry their `table`, `fields` (name/type/notNull/default), and `behaviors`. An
  agent can now act — "add a `views:int` field to `Post`" — without opening files.
  Best-effort static parse; never throws. Additive; API contract stays green.

## 0.5.3

### Patch Changes

- **AI-native tooling (Apex Compass + CLI-as-MCP).** New `apex mcp-server` runs an MCP
  server (stdio) that exposes the Apex CLI as tools — `apex_make`, `apex_extend`,
  `apex_add`, `apex_build`, `apex_list` — so an AI agent scaffolds/extends/builds an app
  by calling structured tools instead of hand-writing files. Point any agent host at
  `apex mcp-server`. Scaffolded apps now include an `AGENTS.md` that teaches agents the
  conventions, generators, and APIs (also synced into existing apps by `apex upgrade`).

## 0.5.2

### Patch Changes

- One-command Vercel deploys: `apex build --preset vercel` builds the server target
  and generates `api/index.mjs` (a serverless function serving the whole app via
  `createProdNodeHandler`) + `vercel.json` — commit them and run `vercel deploy`.
  The `data` feature is now Supabase-ready: its `db/index.ts` uses Postgres when
  `DATABASE_URL` is set (in-memory libSQL otherwise), and ships the `postgres` driver.

## 0.5.1

### Patch Changes

- Support Vite 7. `@apex-stack/vite` widens its `vite` peer range to include `^7`
  (still `^5`/`^6`), and `@apex-stack/core` + `create-apexjs` build and run on Vite
  7.3.x. Also bumps `citty` to 0.2.2. No public API changes.

## 0.5.0

### Minor Changes

- 9600a30: Islands mode now applies layouts + `head()`, and the demo scaffold is branded.

  - **Islands fix:** `apex dev --islands` (and the islands build) previously rendered
    the bare page — no layout, no `head()`/SEO — so nav/branding/footer vanished and
    pages looked broken. The page is now wrapped in its layout chain and the whole
    tree (layout + page) runs through the islands walker, so `client:*` directives in
    the layout or page hydrate. Root x-data defaults are available as SSR scope too.
  - **Branded scaffold:** the starter ships the Apex mark (`public/favicon.svg`),
    shows it in the nav + a hero ("Built with Apex JS"), and the shell emits a
    `<link rel="icon">` by default. The demo's interactivity now uses `client:*`
    islands, so it works in BOTH default and islands mode (dark toggle, counter,
    and the reveal all hydrate). Theme also respects `prefers-color-scheme` on first
    visit.
  - **Smarter editor extension prompt:** `apex new` / `apex upgrade` now detect VS
    Code **and its forks** (Cursor, Windsurf, VSCodium) and check the installed
    extension version — they only prompt to _install_ (not present) or _update_
    (older), and stay quiet with an "up to date" note when it's already current.
    Extension icon is the Apex mark.

## 0.4.0

### Minor Changes

- f39ad83: New default scaffold: a real, themed multi-page demo app.

  `create-apexjs` / `apex new` now scaffold a proper starter instead of a bare
  placeholder — a themed layout with a navbar, branding, and a dark-mode toggle; a
  landing page; a blog (list + dynamic `[slug]` detail) served from a sample-data
  `PostService` (no database); an About page with SEO via `head()`; bundled themed
  components (Button, Card, Badge, Counter); and an API route that's also an MCP
  tool. The default `build` script targets the server (SSR + dynamic routes + API/
  MCP work in production); `build:static` prerenders the static pages. Verified via
  a fresh install: dev, server build + start, typecheck, and tests all green.

## 0.3.0

### Minor Changes

- 26d83ca: Turnkey styling + `apex theme`.

  - **Scaffold is now styled out of the box** — `apex new` apps ship an `app.css` wired for Tailwind v4 (`@import 'tailwindcss'; @source './**/*.alpine';`) with the theme's `@theme` token block, plus `tailwindcss` + `@tailwindcss/vite` dev deps. Components added with `apex add` render themed immediately.
  - **`apex theme`** — write/update your theme tokens in `app.css` (or `--out`): `apex theme --primary '#e11d48' --radius 0.75rem --font-title '"Inter"'`. It edits a managed `/* apex-theme:start … end */` block, so every component restyles at once. No flags re-applies the default theme. (`@apex-stack/theme` is bundled into the CLI, so it works from a global install.)
  - `apex add` now nudges you to run `apex theme` if the project isn't Tailwind-wired yet.

## 0.2.0

### Minor Changes

- f1a7eca: Runtime configuration from `apex.config.ts` + `.env` (Nuxt/Laravel-style).

  - **`apex.config.ts`** with `defineConfig({ runtimeConfig })` — declare defaults; `public` values reach the browser, everything else is server-only.
  - **`.env` loading** — `.env`, `.env.<mode>`, `.env.local`, `.env.<mode>.local` (later wins), real env vars are never clobbered. Any declared leaf is overridden from the environment: `APEX_<KEY>` (private) / `APEX_PUBLIC_<KEY>` (public), camelCase ↔ SCREAMING_SNAKE, with type coercion.
  - **`useRuntimeConfig()`** — full config on the server, the `public` subset in the browser (seeded into the page, `</script>`-escaped). **`env('KEY', fallback)`** is the raw escape hatch.
  - **`config` in context** — page `loader({ config })`, `head({ config })`, and every `defineApexRoute` / resource handler (`{ input, config }`) — REST **and** MCP tool calls. Private values never ship to the client.
  - Wired through dev, prod (`apex start` applies deploy-time env over baked defaults), and the static/server build. The scaffold ships `apex.config.ts` + `.env.example` and gitignores real `.env` files.
