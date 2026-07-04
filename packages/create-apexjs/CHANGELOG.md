# create-apexjs

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
