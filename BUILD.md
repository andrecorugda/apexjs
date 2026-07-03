# Apex JS — Build & Deploy

`apex build` has three modes, from most static to most dynamic.

## 1. Static site (SSG) — `apex build --islands`
Prerenders every static route to `dist/**/index.html` with **zero framework JS** (islands hydrate
lazily where present). Deploy `dist/` to any static host (Netlify, Pages, S3, Cloudflare Pages).

## 2. Prerendered + hydrated — `apex build`
Prerenders each page to HTML **and** builds a per-page client bundle (hashed, shared runtime chunk).
Pages are server-rendered for first paint, then hydrate — fully interactive from a **static** `dist/`.
Verified: components stay interactive when `dist/` is served as plain files.

## 3. Server target — `apex build --server` + `apex start`
Builds client bundles **and** SSR modules + a run manifest, producing a deployable Node server:

```bash
apex build --server     # → dist/ (client assets + dist/server/*.mjs + apex-manifest.json)
apex migrate            # apply DB migrations (deploy step)
apex start              # run the production server (no Vite)
```

The production server (`apex start`, verified end-to-end) serves:
- **Dynamic routes** — `pages/blog/[slug].alpine` rendered per request
- **API + MCP** — `server/api/*` as REST endpoints and MCP tools at `/mcp`
- **Static assets** — hashed client bundles with long-cache headers
- **Any database** — SQLite/Turso/Supabase/Neon via `@apex-stack/data`

## Databases in production
Local SQLite is great for a Node host. For serverless/edge (Cloudflare Workers), pair with a
fetch-based driver — Turso (libSQL) or Supabase/Neon (Postgres) — since native SQLite can't run on
edge. Swap drivers in one line (`createDb({ driver, url })`); see [DATA.md](./DATA.md).

## Not yet
Nitro deploy presets (Vercel/Netlify/Workers adapters) — today `apex start` targets Node. Island-mode
client bundling in the built output. Streaming SSR.
