import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { apex } from '@apex-stack/vite'
import { defineCommand } from 'citty'
import { createServer as createViteServer } from 'vite'
import { buildClient } from '../build/buildClient.js'
import { buildServer } from '../build/buildServer.js'
import { loadComponents } from '../components/registry.js'
import { resolveApexConfig } from '../config/resolve.js'
import type { RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import { renderIslandsPage } from '../islands/render.js'
import { type RouteDef, scanPages } from '../routing/router.js'
import { loadStores } from '../stores/loader.js'

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
    base: {
      type: 'string',
      description: 'Public base path for a subpath deploy (e.g. /demo/)',
      default: '/',
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const outDir = resolve(root, args.outDir)
    rmSync(outDir, { recursive: true, force: true })

    const routes = scanPages(root)
    const staticRoutes = routes.filter((r: RouteDef) => !r.isDynamic)
    const dynamic = routes.filter((r: RouteDef) => r.isDynamic)

    if (args.server) {
      return buildServerTarget(root, outDir, args.outDir, routes)
    }

    // Component mode: build a client bundle per page so the prerendered HTML hydrates.
    const hrefs = args.islands
      ? new Map<string, string>()
      : await buildClient(root, staticRoutes, outDir, args.base)

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
      const { runtimeConfig, publicConfig } = await resolveApexConfig(
        root,
        (id) => vite.ssrLoadModule(id) as never,
      )
      const layoutsDir = join(root, 'layouts')
      const layouts = existsSync(layoutsDir)
        ? readdirSync(layoutsDir)
            .filter((f) => f.endsWith('.alpine'))
            .map((f) => f.replace(/\.alpine$/, ''))
        : []

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
        }
        const html = args.islands
          ? await renderIslandsPage(common)
          : await renderPage({ ...common, clientHref: hrefs.get(route.pageId) })

        const dest = join(outDir, outFile(route.pattern))
        mkdirSync(dirname(dest), { recursive: true })
        writeFileSync(dest, html)
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log(`  ✓ ${route.pattern}  →  ${outFile(route.pattern)}`)
      }

      const pub = join(root, 'public')
      if (existsSync(pub)) cpSync(pub, outDir, { recursive: true })

      // biome-ignore lint/suspicious/noConsole: CLI output
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
  } finally {
    await cfgVite.close()
  }

  const components: Record<string, string> = {}
  const compDir = join(root, 'components')
  if (existsSync(compDir)) {
    for (const f of readdirSync(compDir).filter((f) => f.endsWith('.alpine'))) {
      const sf = server.modules[`/components/${f}`]
      if (sf) components[f.replace(/\.alpine$/, '')] = sf
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

  const manifest = {
    islands: false,
    routes: routes.map((r) => ({
      ...r,
      serverFile: server.modules[r.pageId],
      clientHref: clientHrefs.get(r.pageId),
    })),
    components,
    api,
    middleware,
    runtimeConfig,
  }
  writeFileSync(join(outDir, 'apex-manifest.json'), JSON.stringify(manifest, null, 2))

  const pub = join(root, 'public')
  if (existsSync(pub)) cpSync(pub, outDir, { recursive: true })

  // biome-ignore lint/suspicious/noConsole: CLI output
  console.log(
    `\n  Built server target → ${outLabel}/  (${routes.length} route(s), ${api.length} API module(s))\n  Run it:  apex start\n`,
  )
}
