import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { renderFragment } from '@apex-stack/kit'
import { apex } from '@apex-stack/vite'
import { defineCommand } from 'citty'
import { createServer as createViteServer } from 'vite'
import { buildClient, type ClientAssets } from '../build/buildClient.js'
import { buildIslandsRuntime } from '../build/buildIslands.js'
import { buildServer } from '../build/buildServer.js'
import { emitPwaAssets } from '../build/pwa.js'
import { loadComponents, scanComponents } from '../components/registry.js'
import { resolveApexConfig } from '../config/resolve.js'
import type { PwaConfig, RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import { renderIslandsPage } from '../islands/render.js'
import { type RouteDef, scanPages } from '../routing/router.js'
import { loadStores } from '../stores/loader.js'

/**
 * Generate Vercel deploy config next to a server build: one serverless function
 * (`api/index.mjs`) that serves the whole app via `createProdNodeHandler`, plus a
 * `vercel.json` that rewrites everything to it. Idempotent; commit the two files
 * and run `vercel deploy` (set DATABASE_URL / APEX_SESSION_PASSWORD in Vercel env).
 */
function emitVercelPreset(root: string, outDir: string): void {
  mkdirSync(join(root, 'api'), { recursive: true })
  writeFileSync(
    join(root, 'api', 'index.mjs'),
    `import { fileURLToPath } from 'node:url'
import { createProdNodeHandler } from '@apex-stack/core/server'

// Serves the whole built Apex app (SSR + /api + /mcp + static) from one function.
const dir = fileURLToPath(new URL('../${outDir}', import.meta.url))
const handler = await createProdNodeHandler({ dir })

export default (req, res) => handler(req, res)
`,
  )
  writeFileSync(
    join(root, 'vercel.json'),
    `${JSON.stringify(
      {
        $schema: 'https://openapi.vercel.sh/vercel.json',
        framework: null,
        buildCommand: 'apex build --server',
        installCommand: 'npm install',
        functions: { 'api/index.mjs': { includeFiles: `${outDir}/**`, maxDuration: 30 } },
        rewrites: [{ source: '/(.*)', destination: '/api/index' }],
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    `  ${'\x1b[36m'}Vercel${'\x1b[0m'} preset → wrote api/index.mjs + vercel.json\n` +
      '  Set DATABASE_URL + APEX_SESSION_PASSWORD in your Vercel env, then: vercel deploy\n',
  )
}

/**
 * Generate Netlify deploy config next to a server build: one Functions-v2 handler
 * (`netlify/functions/server.mjs`) serving the whole app via `createProdWebHandler`
 * (a Web fetch handler), plus `netlify.toml`. Commit them and run `netlify deploy`
 * (set DATABASE_URL / APEX_SESSION_PASSWORD in Netlify env).
 */
function emitNetlifyPreset(root: string, outDir: string): void {
  mkdirSync(join(root, 'netlify', 'functions'), { recursive: true })
  writeFileSync(
    join(root, 'netlify', 'functions', 'server.mjs'),
    `import { fileURLToPath } from 'node:url'
import { createProdWebHandler } from '@apex-stack/core/server'

// Serves the whole built Apex app (SSR + /api + /mcp) as a Web fetch handler.
const dir = fileURLToPath(new URL('../../${outDir}', import.meta.url))
const handler = await createProdWebHandler({ dir })

export default (req) => handler(req)
export const config = { path: '/*', preferStatic: true }
`,
  )
  writeFileSync(
    join(root, 'netlify.toml'),
    `[build]
  command = "apex build --server"
  publish = "${outDir}"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  included_files = ["${outDir}/**"]
`,
  )
  console.log(
    `  ${'\x1b[36m'}Netlify${'\x1b[0m'} preset → wrote netlify/functions/server.mjs + netlify.toml\n` +
      '  Set DATABASE_URL + APEX_SESSION_PASSWORD in your Netlify env, then: netlify deploy\n',
  )
}

/**
 * Scaffold a Dockerfile that builds + runs the app — deployable on any container
 * host (Railway, Render, Fly.io, a VPS, Kubernetes). `apex start` honours $PORT,
 * so the host's injected port just works. Set DATABASE_URL / APEX_SESSION_PASSWORD
 * in the host's env.
 */
function emitDockerPreset(root: string): void {
  writeFileSync(
    join(root, 'Dockerfile'),
    `# Apex JS — build + run on any container host (Railway / Render / Fly / VPS).
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx apex build --server

# apex start listens on $PORT (host-injected) or 3000.
EXPOSE 3000
CMD ["npx", "apex", "start"]
`,
  )
  if (!existsSync(join(root, '.dockerignore'))) {
    writeFileSync(join(root, '.dockerignore'), 'node_modules\ndist\n.git\n.env\n.env.*\n')
  }
  console.log(
    `  ${'\x1b[36m'}Docker${'\x1b[0m'} preset → wrote Dockerfile (+ .dockerignore)\n` +
      '  Deploy on Railway/Render/Fly/any container host. Set DATABASE_URL + APEX_SESSION_PASSWORD in its env.\n',
  )
}

/** `/` → index.html, `/about` → about/index.html. */
function outFile(pattern: string): string {
  const clean = pattern.replace(/^\//, '')
  return clean === '' ? 'index.html' : `${clean}/index.html`
}

export const buildCommand = defineCommand({
  meta: { name: 'build', description: 'Prerender pages to deployable HTML + client bundles' },
  args: {
    root: { type: 'positional', required: false, description: 'Project root', default: '.' },
    outDir: { type: 'string', description: 'Output directory', default: 'dist' },
    islands: {
      type: 'boolean',
      description: 'Static-first islands mode (zero-JS static)',
      default: false,
    },
    server: {
      type: 'boolean',
      description: 'Build a Node server (dynamic routes + API/MCP)',
      default: false,
    },
    mobile: {
      type: 'boolean',
      description:
        'Bundle a self-contained server for a bare on-device engine (Hermes/QuickJS) → dist/mobile/server.mjs',
      default: false,
    },
    base: {
      type: 'string',
      description: 'Public base path for a subpath deploy (e.g. /demo/)',
      default: '/',
    },
    preset: {
      type: 'string',
      description:
        'Deploy preset config. Supported: vercel · netlify (serverless) · docker (Railway/Render/Fly/any container)',
      default: '',
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const outDir = resolve(root, args.outDir)
    rmSync(outDir, { recursive: true, force: true })

    const routes = scanPages(root)
    const staticRoutes = routes.filter((r: RouteDef) => !r.isDynamic)
    const dynamic = routes.filter((r: RouteDef) => r.isDynamic)

    // Docker preset just scaffolds a Dockerfile — the container runs the build.
    if (args.preset === 'docker') {
      emitDockerPreset(root)
      return
    }

    if (args.mobile) {
      // The mobile bundle is a flattened variant of the server target — build that first.
      await buildServerTarget(root, outDir, args.outDir, routes)
      const { buildMobile } = await import('../prod/buildMobile.js')
      const r = await buildMobile(outDir)
      console.log(
        `\n  Mobile bundle → ${args.outDir}/mobile/server.mjs  (${r.sizeKB} KB, self-contained)\n` +
          `  ${r.routes} route(s) + ${r.api} API run on-engine (bare JS engine, no Node).`,
      )
      if (r.deviceModules.length)
        console.log(
          `  Excluded (network-only driver, can't run offline): ${r.deviceModules.join(', ')}`,
        )
      console.log(
        `\n  Load it in a WebView/RN shell and call \x1b[36mAPEX.run(request)\x1b[0m — see the native-shell guide.\n`,
      )
      return
    }

    if (args.server || args.preset === 'vercel' || args.preset === 'netlify') {
      await buildServerTarget(root, outDir, args.outDir, routes)
      if (args.preset === 'vercel') emitVercelPreset(root, args.outDir)
      else if (args.preset === 'netlify') emitNetlifyPreset(root, args.outDir)
      return
    }

    // Component mode: build a client bundle per page so the prerendered HTML hydrates.
    // Islands mode: build the islands runtime instead (loader asset + lazy Alpine
    // chunk + compiled global stylesheet) — the inline dev loader's bare
    // `import('alpinejs')` cannot resolve in a static build.
    const hrefs = args.islands
      ? new Map<string, ClientAssets>()
      : await buildClient(root, staticRoutes, outDir, args.base)
    const islandsRuntime = args.islands
      ? await buildIslandsRuntime(root, outDir, args.base)
      : undefined

    const vite = await createViteServer({
      root,
      appType: 'custom',
      server: { middlewareMode: true },
      plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    })

    try {
      const { registry, css: componentCss } = await loadComponents(
        root,
        (id) => vite.ssrLoadModule(id) as never,
      )
      const stores = await loadStores(root, (id) => vite.ssrLoadModule(id) as never)
      const { config, runtimeConfig, publicConfig } = await resolveApexConfig(
        root,
        (id) => vite.ssrLoadModule(id) as never,
      )
      const clientNav = config.clientNav !== false
      const pwa = config.pwa as PwaConfig | undefined
      const layoutsDir = join(root, 'layouts')
      const layouts = existsSync(layoutsDir)
        ? readdirSync(layoutsDir)
            .filter((f) => f.endsWith('.alpine'))
            .map((f) => f.replace(/\.alpine$/, ''))
        : []

      // Prerender the slow-nav boundary (pages/loading.alpine) once, if present.
      let loadingHtml: string | undefined
      if (!args.islands && clientNav && existsSync(join(root, 'pages', 'loading.alpine'))) {
        const l = (await vite.ssrLoadModule('/pages/loading.alpine')) as unknown as PageModule
        loadingHtml = await renderFragment(l.template, {}, l.scopeId, registry)
      }

      for (const route of staticRoutes) {
        const common = {
          loadModule: (id: string) => vite.ssrLoadModule(id) as Promise<PageModule>,
          pageId: route.pageId,
          url: route.pattern,
          registry,
          componentCss,
          stores,
          layouts,
          runtimeConfig,
          publicConfig,
          pwa,
        }
        const assets = hrefs.get(route.pageId)
        const html = args.islands
          ? await renderIslandsPage({
              ...common,
              loaderHref: islandsRuntime?.js,
              cssHrefs: islandsRuntime?.css,
            })
          : await renderPage({
              ...common,
              clientHref: assets?.js,
              clientCss: assets?.css,
              clientNav,
              loadingHtml,
            })

        const dest = join(outDir, outFile(route.pattern))
        mkdirSync(dirname(dest), { recursive: true })
        writeFileSync(dest, html)
        console.log(`  ✓ ${route.pattern}  →  ${outFile(route.pattern)}`)
      }

      const pub = join(root, 'public')
      if (existsSync(pub)) cpSync(pub, outDir, { recursive: true })

      // PWA (🟡): emit manifest.webmanifest + a precache service worker AFTER every page,
      // asset, and public file is on disk — the worker's precache list is the dist tree.
      if (pwa) {
        const precached = emitPwaAssets(outDir, pwa)
        console.log(`  ✓ PWA — manifest.webmanifest + sw.js (${precached} file(s) precached)`)
      }

      console.log(
        `\n  Built ${staticRoutes.length} page(s) → ${args.outDir}/${args.islands ? ' (islands / static-first)' : ' (prerendered + hydrated)'}`,
      )
      if (dynamic.length) {
        console.log(
          `  Skipped ${dynamic.length} dynamic route(s): ${dynamic.map((r) => r.pattern).join(', ')} (server target on the roadmap).`,
        )
      }
      console.log()
    } finally {
      await vite.close()
    }
  },
})

/** Build a deployable Node server: client bundles + SSR modules + a run manifest. */
async function buildServerTarget(
  root: string,
  outDir: string,
  outLabel: string,
  routes: RouteDef[],
) {
  const clientHrefs = await buildClient(root, routes, outDir)
  const server = await buildServer(root, routes, outDir)

  // Load apex.config.ts DEFAULTS to bake into the manifest — never the env-resolved
  // values, so build-time secrets don't get written to dist. The prod server applies
  // deploy-time .env / process.env over these defaults at start. A short-lived Vite
  // loads the TS config.
  let runtimeConfig: RuntimeConfig = { public: {} }
  let clientNav = true
  let loadingHtml: string | undefined
  let i18n: { defaultLocale: string; locales: string[] } | undefined
  let pwa: PwaConfig | undefined
  const cfgVite = await createViteServer({
    root,
    appType: 'custom',
    server: { middlewareMode: true },
    plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
  })
  try {
    const resolved = await resolveApexConfig(root, (id) => cfgVite.ssrLoadModule(id) as never)
    runtimeConfig = { public: {}, ...(resolved.config.runtimeConfig ?? {}) }
    if (!runtimeConfig.public) runtimeConfig.public = {}
    clientNav = resolved.config.clientNav !== false
    i18n = resolved.config.i18n as typeof i18n
    pwa = resolved.config.pwa as PwaConfig | undefined
    // Prerender the slow-nav boundary once for the client-nav runtime to embed.
    if (clientNav && existsSync(join(root, 'pages', 'loading.alpine'))) {
      const { registry } = await loadComponents(root, (id) => cfgVite.ssrLoadModule(id) as never)
      const l = (await cfgVite.ssrLoadModule('/pages/loading.alpine')) as unknown as PageModule
      loadingHtml = await renderFragment(l.template, {}, l.scopeId, registry)
    }
  } finally {
    await cfgVite.close()
  }

  const components: Record<string, string> = {}
  for (const { id, name } of scanComponents(root)) {
    const sf = server.modules[id]
    if (sf) components[name] = sf
  }

  // Layouts, so the prod server can wrap pages in them (like dev + static build).
  const layouts: Array<{ name: string; serverFile: string }> = []
  const layoutsDir = join(root, 'layouts')
  if (existsSync(layoutsDir)) {
    for (const f of readdirSync(layoutsDir).filter((f) => f.endsWith('.alpine'))) {
      const sf = server.modules[`/layouts/${f}`]
      if (sf) layouts.push({ name: f.replace(/\.alpine$/, ''), serverFile: sf })
    }
  }

  const api: Array<{ name: string; serverFile: string }> = []
  const apiDir = join(root, 'server', 'api')
  if (existsSync(apiDir)) {
    for (const f of readdirSync(apiDir).filter((f) => /\.(ts|js|mjs)$/.test(f))) {
      const sf = server.modules[`/server/api/${f}`]
      if (sf) api.push({ name: f.replace(/\.(ts|js|mjs)$/, ''), serverFile: sf })
    }
  }

  // Middleware in filename order (matches dev; prod runs them per request).
  const middleware: Array<{ serverFile: string }> = []
  const mwDir = join(root, 'middleware')
  if (existsSync(mwDir)) {
    for (const f of readdirSync(mwDir)
      .filter((f) => /\.(ts|js|mjs)$/.test(f))
      .sort()) {
      const sf = server.modules[`/middleware/${f}`]
      if (sf) middleware.push({ serverFile: sf })
    }
  }

  // The auth resolver (server/auth.ts), if the app defined one.
  const authSrc = ['server/auth.ts', 'server/auth.js', 'server/auth.mjs'].find((f) =>
    existsSync(join(root, f)),
  )
  const authServerFile = authSrc ? server.modules[`/${authSrc}`] : undefined
  const auth = authServerFile ? { serverFile: authServerFile } : undefined

  const manifest = {
    islands: false,
    routes: routes.map((r) => ({
      ...r,
      serverFile: server.modules[r.pageId],
      clientHref: clientHrefs.get(r.pageId)?.js,
      clientCss: clientHrefs.get(r.pageId)?.css,
    })),
    components,
    layouts,
    api,
    middleware,
    auth,
    runtimeConfig,
    clientNav,
    loadingHtml,
    i18n,
    pwa,
  }
  writeFileSync(join(outDir, 'apex-manifest.json'), JSON.stringify(manifest, null, 2))
  // Copy message catalogs so the prod server can load them.
  if (i18n && existsSync(join(root, 'locales'))) {
    cpSync(join(root, 'locales'), join(outDir, 'locales'), { recursive: true })
  }

  const pub = join(root, 'public')
  if (existsSync(pub)) cpSync(pub, outDir, { recursive: true })

  // PWA (🟡): the server target precaches hashed assets + public files (pages are dynamic,
  // served network-first with a cache fallback by the worker). Emitted after the public copy
  // so the precache list sees the full dist tree (server/ + mobile/ are skipped).
  if (pwa) {
    const precached = emitPwaAssets(outDir, pwa)
    console.log(`  ✓ PWA — manifest.webmanifest + sw.js (${precached} file(s) precached)`)
  }

  console.log(
    `\n  Built server target → ${outLabel}/  (${routes.length} route(s), ${api.length} API module(s))\n  Run it:  apex start\n`,
  )
}
