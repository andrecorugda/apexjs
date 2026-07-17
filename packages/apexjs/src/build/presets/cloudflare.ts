import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { DeployPreset, DeployPresetContext } from './types.js'

/** Compatibility date pinning the Workers runtime (recent enough for `nodejs_compat`). */
const CF_COMPAT_DATE = '2024-09-23'

/** Build-only subtrees + files that must NOT be served as public static assets. */
const SERVER_ONLY = new Set(['server', 'mobile'])
const SERVER_ONLY_FILES = new Set(['apex-manifest.json'])

/**
 * Walk the built output dir and collect the public URL path of every static asset —
 * i.e. every file EXCEPT the server modules (`server/`), the mobile bundle, and the
 * run manifest, which are private to the SSR runtime. Paths are normalised to
 * forward-slashed, root-absolute URLs (`/assets/app-abc.js`); a root `index.html`
 * also maps to `/`.
 */
export function collectCloudflareAssets(outDirAbs: string): string[] {
  const assets: string[] = []
  if (!existsSync(outDirAbs)) return assets

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry)
      const rel = relative(outDirAbs, abs)
      const topSegment = rel.split(sep)[0]
      if (statSync(abs).isDirectory()) {
        if (SERVER_ONLY.has(entry) && dir === outDirAbs) continue // skip server-only top-level trees
        walk(abs)
        continue
      }
      if (dir === outDirAbs && SERVER_ONLY_FILES.has(entry)) continue
      if (topSegment && SERVER_ONLY.has(topSegment)) continue
      const url = `/${rel.split(sep).join('/')}`
      assets.push(url)
      // A root index.html is also reachable at the bare path.
      if (url === '/index.html') assets.push('/')
    }
  }
  walk(outDirAbs)
  return assets.sort()
}

/**
 * Generate a Cloudflare Workers (edge) deploy config next to a server build:
 *
 *  - `_worker.js` — a **module worker** (`export default { fetch(request, env, ctx) }`).
 *    Static assets are handed straight to the Workers static-asset binding (`env.ASSETS`);
 *    everything else (SSR + `/api` + `/mcp`) goes through the thin h3 **web** handler
 *    (`createProdWebHandler`, a `fetch`-style `(Request) => Response` adapter — no `node:http`).
 *  - `apex-cf-assets.json` — the asset manifest the worker consults to route static vs SSR.
 *  - `wrangler.toml` — points `[assets]` at the build output and enables `nodejs_compat`
 *    (the built server reads its manifest via `node:fs`/`node:path`, provided by the flag).
 *
 * Idempotent; commit the three files and run `wrangler deploy` (set DATABASE_URL /
 * APEX_SESSION_PASSWORD as Worker secrets, and pair with a fetch-based DB driver —
 * Turso / Supabase / Neon).
 */
export function emitCloudflarePreset(root: string, outDir: string, outDirAbs: string): void {
  const assets = collectCloudflareAssets(outDirAbs)

  // Asset manifest — the worker uses it to decide static-first vs SSR fall-through.
  writeFileSync(
    join(root, 'apex-cf-assets.json'),
    `${JSON.stringify({ outDir, assets }, null, 2)}\n`,
  )

  // Module worker. Keep the edge path free of `node:*`: import a plain JSON manifest and
  // resolve the built dir with a relative string — no `node:url`/`fileURLToPath` here.
  writeFileSync(
    join(root, '_worker.js'),
    `import { createProdWebHandler } from '@apex-stack/core/server'
import manifest from './apex-cf-assets.json'

// Static asset URLs (served by Cloudflare's asset binding, not SSR).
const assets = new Set(manifest.assets)
let handler

// Cloudflare Workers module worker: one fetch entry for the whole built Apex app.
export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url)
    // Static assets → the Workers asset binding, straight through (no SSR overhead).
    if (env && env.ASSETS && assets.has(pathname)) return env.ASSETS.fetch(request)
    // SSR + /api + /mcp → the thin h3 web handler (fetch-style; no Node http server on the edge).
    if (!handler) handler = await createProdWebHandler({ dir: './${outDir}' })
    return handler(request)
  },
}
`,
  )

  writeFileSync(
    join(root, 'wrangler.toml'),
    `name = "apex-app"
main = "_worker.js"
compatibility_date = "${CF_COMPAT_DATE}"
# The built server reads its run manifest + modules via node:fs/node:path.
compatibility_flags = ["nodejs_compat"]

# Serve the build output as static assets; the worker gets an env.ASSETS binding.
[assets]
directory = "./${outDir}"
binding = "ASSETS"
`,
  )

  console.log(
    `  ${'\x1b[36m'}Cloudflare${'\x1b[0m'} preset → wrote _worker.js + apex-cf-assets.json + wrangler.toml\n` +
      `  ${assets.length} static asset(s) mapped to env.ASSETS; SSR/API/MCP fall through to the worker.\n` +
      '  Set DATABASE_URL + APEX_SESSION_PASSWORD as Worker secrets, then: wrangler deploy\n',
  )
}

export const cloudflarePreset: DeployPreset = {
  name: 'cloudflare',
  serverBuild: true,
  build({ root, outDir, outDirAbs }: DeployPresetContext) {
    emitCloudflarePreset(root, outDir, outDirAbs)
  },
}
