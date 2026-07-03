# Changelog

## 0.1.0 — 2026-07-03

First public release. All packages published to npm.

### Packages
- **apexjs-core** — the `apex` CLI (`dev`, `make`, `migrate`, `mcp`) + runtime (dev server, SSR, routing, islands, API/MCP).
- **apexjs-kit** — `.alpine` SFC parser, SSR renderer, client runtime.
- **apexjs-vite** — Vite plugin for `.alpine` components.
- **apexjs-data** — Drizzle-backed resources that are REST + MCP by default.
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
