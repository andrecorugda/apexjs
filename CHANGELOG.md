# Changelog

## 0.1.5 — 2026-07-03

- **fix(scoped CSS):** `<style scoped>` no longer scopes global selectors (`body`, `html`, `:root`) —
  they can't carry the scope attribute, so page-level background/color rules were being silently
  dropped. They're now left global. (`@apex-stack/kit` 0.1.2, `@apex-stack/vite` 0.1.2, core 0.1.5.)

## 0.1.4 — 2026-07-03

- **Dev hot-reload for API routes** — `server/api/*.ts` routes and resources are re-loaded per
  request in dev, so editing a handler, schema, or resource takes effect without restarting the
  dev server (`.alpine` pages/components/styles already full-reloaded on save).

## 0.1.3 — 2026-07-03

- **Server target** — `apex build --server` + `apex start`: a production Node server (no Vite)
  serving dynamic routes (`[slug]`), REST + MCP endpoints, static client bundles, and any database.
  Verified end-to-end (`@apex-stack/core` 0.1.3).
- **`@apex-stack/data` 0.1.2** — driver abstraction: `createDb({ driver, url })` for
  **libSQL/Turso**, **Postgres (Supabase/Neon)**, and embedded **PGlite**, all via Drizzle's async
  API, so `defineResource` runs on any of them. `apex migrate` gained `--driver`/`--url`.
- Deploy guide: [BUILD.md](./BUILD.md).

## 0.1.2 — 2026-07-03

- **`apex build`** — production build: prerenders pages to HTML **and** builds a per-page client
  bundle (Vite + manifest) so interactive pages hydrate from a static `dist/`. `apex build --islands`
  for zero-JS static-first output. (Dynamic routes + API/MCP in prod need a server target — next.)
- **`apex make page|component|api`** — artisan-style generators.
- **`apex migrate`** — apply `db/migrations/*.sql` (idempotent).
- **`apex mcp`** — built-in MCP inspector (list/call tools).
- Data resources gained full CRUD (`update`/`delete`).

(Only `@apex-stack/core` changed since 0.1.1.)

## 0.1.1 — 2026-07-03

Moved the libraries under the **`@apex-stack`** npm scope for a protected namespace.

- `apexjs-core → @apex-stack/core`, `apexjs-kit → @apex-stack/kit`,
  `apexjs-vite → @apex-stack/vite`, `apexjs-data → @apex-stack/data`.
- `create-apexjs` stays unscoped so `npm create apexjs@latest` remains the entry point.
- The unscoped `0.1.0` packages are deprecated with a pointer to the scoped names.

## 0.1.0 — 2026-07-03

First public release (published unscoped as `apexjs-core` / `apexjs-kit` / `apexjs-vite` /
`apexjs-data` / `create-apexjs`; the libraries were rescoped to `@apex-stack/*` in 0.1.1).

### Packages
- **@apex-stack/core** — the `apex` CLI (`dev`, `make`, `migrate`, `mcp`) + runtime (dev server, SSR, routing, islands, API/MCP).
- **@apex-stack/kit** — `.alpine` SFC parser, SSR renderer, client runtime.
- **@apex-stack/vite** — Vite plugin for `.alpine` components.
- **@apex-stack/data** — Drizzle-backed resources that are REST + MCP by default.
- **create-apexjs** — project scaffolder (`npm create apexjs@latest`).

### Features
- **SSR + hydration** — `.alpine` single-file components server-rendered with no flash.
- **Islands** — `client:load | idle | visible | none`; zero framework JS until an island needs it.
- **File-based routing** — `pages/**/*.alpine`, static + `[param]` dynamic segments.
- **Component embedding** — `<Counter start="5" />` with props, resolved x-data baked for hydration.
- **AI-native APIs** — `defineApexRoute` serves REST **and** an MCP tool at `/mcp`, no extra library.
- **Data layer** — `defineResource` turns one Drizzle table into full CRUD (list/get/create/update/delete)
  over REST **and** MCP on one SQLite DB. SQL migrations via `apex migrate`.
- **CLI** — `apex dev [--islands]`, `apex make page|component|api`, `apex migrate`, `apex mcp`.

### Coverage
61 unit tests + 15 Playwright e2e gates + REST/MCP/data check scripts.

### Not yet
Production build (Nitro) + SSG, jobs/queues, `apex make:model` + drizzle-kit, per-route auth scoping.
