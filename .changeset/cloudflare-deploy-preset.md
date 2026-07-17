---
"@apex-stack/core": minor
---

Add a **Cloudflare Workers (edge) deploy preset**: `apex build --preset cloudflare`.

- Emits a **module worker** (`_worker.js` — `export default { fetch(request, env, ctx) }`) that
  serves static assets from Cloudflare's `env.ASSETS` binding and falls through to the thin h3
  **web** handler (`createProdWebHandler`, a `fetch`-style adapter — no Node HTTP server on the edge)
  for SSR + `/api` + `/mcp`.
- Emits an **asset manifest** (`apex-cf-assets.json`) — the public URL of every static file in the
  build (server modules + the run manifest excluded) — plus a `wrangler.toml` that points `[assets]`
  at the build output and enables `nodejs_compat`.
- Refactors the deploy presets into a shared `DeployPreset` contract under
  `src/build/presets/` (`types.ts` + one module per target: vercel · netlify · docker · cloudflare)
  with a registry, so `apex build --preset <name>` routes through it and third parties can add their
  own targets. Vercel / Netlify / Docker output is unchanged.
- Docs: a Cloudflare Workers section on the Build &amp; Deploy page.
