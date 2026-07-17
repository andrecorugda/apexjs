import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { renderFragment } from '@apex-stack/kit'
import { apex } from '@apex-stack/vite'
import { defineCommand } from 'citty'
import { createServer as createViteServer } from 'vite'
import { buildClient, type ClientAssets } from '../build/buildClient.js'
import { buildIslandsRuntime } from '../build/buildIslands.js'
import { buildServer } from '../build/buildServer.js'
import { emitFontAssets, fontHeadTags } from '../build/fonts.js'
import { deployPresets, resolveDeployPreset } from '../build/presets/index.js'
import { emitPwaAssets } from '../build/pwa.js'
import { loadComponents, scanComponents } from '../components/registry.js'
import { resolveApexConfig } from '../config/resolve.js'
import type { ApexConfig, FontConfig, PwaConfig, RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import { createI18n } from '../i18n/index.js'
import { loadMessages } from '../i18n/run.js'
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
        'Deploy preset config. Supported: vercel · netlify (serverless) · cloudflare (Workers edge) · docker (Railway/Render/Fly/any container)',
      default: '',
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const outDir = resolve(root, args.outDir)
    // maxRetries/retryDelay: Windows can transiently hold dist (EBUSY) right after a serve/build.
    rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })

    const routes = scanPages(root)
    const staticRoutes = routes.filter((r: RouteDef) => !r.isDynamic)
    const dynamic = routes.filter((r: RouteDef) => r.isDynamic)

    // Deploy presets: emit the host's config from a server build (docker scaffolds a
    // Dockerfile and lets the container run the build — serverBuild:false).
    if (args.preset) {
      const preset = resolveDeployPreset(args.preset)
      if (!preset) {
        console.error(
          `  Unknown deploy preset "${args.preset}". Supported: ${Object.keys(deployPresets).join(', ')}`,
        )
        process.exitCode = 1
        return
      }
      if (preset.serverBuild) await buildServerTarget(root, outDir, args.outDir, routes)
      await preset.build({ root, outDir: args.outDir, outDirAbs: outDir })
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

    if (args.server) {
      await buildServerTarget(root, outDir, args.outDir, routes)
      return
    }

    const vite = await createViteServer({
      root,
      appType: 'custom',
      server: { middlewareMode: true },
      plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    })

    try {
      // Resolve apex.config.ts FIRST so the image transform (config.image) is wired into
      // the client/islands bundles and self-hosted fonts (config.fonts) can be copied —
      // both need the resolved config BEFORE the client build runs.
      const { config, runtimeConfig, publicConfig } = await resolveApexConfig(
        root,
        (id) => vite.ssrLoadModule(id) as never,
      )

      // Component mode: build a client bundle per page so the prerendered HTML hydrates.
      // Islands mode: build the islands runtime instead (loader asset + lazy Alpine
      // chunk + compiled global stylesheet) — the inline dev loader's bare
      // `import('alpinejs')` cannot resolve in a static build.
      const hrefs = args.islands
        ? new Map<string, ClientAssets>()
        : await buildClient(root, staticRoutes, outDir, args.base, config)
      const islandsRuntime = args.islands
        ? await buildIslandsRuntime(root, outDir, args.base, config)
        : undefined

      // Self-hosted fonts (#18): copy declared font files into dist/fonts/ and build the
      // <head> fragment (@font-face + preload) injected into every prerendered shell below.
      const fonts = config.fonts as FontConfig | undefined
      const fontHead = fonts?.families?.length ? fontHeadTags(fonts) : ''
      if (fonts?.families?.length) {
        const copied = emitFontAssets(outDir, root, fonts)
        console.log(`  ✓ Fonts — ${copied} file(s) → fonts/`)
      }

      const { registry, css: componentCss } = await loadComponents(
        root,
        (id) => vite.ssrLoadModule(id) as never,
      )
      const stores = await loadStores(root, (id) => vite.ssrLoadModule(id) as never)
      const clientNav = config.clientNav !== false
      const pwa = config.pwa as PwaConfig | undefined
      // i18n (#54): the servers seed locals.t/locale per request — the prerender loop must
      // do the same, and bake one HTML per locale (default at the plain path, others under
      // their /<locale> prefix, matching how the servers resolve a /<locale> URL).
      const i18nCfg = config.i18n as { defaultLocale: string; locales: string[] } | undefined
      const messages = i18nCfg ? loadMessages(root, i18nCfg.locales) : {}
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

      // Default locale renders at the plain path; other locales under their prefix.
      const localeVariants: Array<{ locale?: string; prefix: string }> = i18nCfg
        ? [
            { locale: i18nCfg.defaultLocale, prefix: '' },
            ...i18nCfg.locales
              .filter((l) => l !== i18nCfg.defaultLocale)
              .map((l) => ({ locale: l, prefix: `/${l}` })),
          ]
        : [{ prefix: '' }]

      for (const route of staticRoutes) {
        for (const variant of localeVariants) {
          // Seed the same locals the servers do (prod/server.ts) — loaders use locals.t.
          const locals: Record<string, unknown> = {}
          if (i18nCfg && variant.locale) {
            locals.locale = variant.locale
            locals.t = createI18n({
              messages,
              locale: variant.locale,
              defaultLocale: i18nCfg.defaultLocale,
            }).t
          }
          const common = {
            loadModule: (id: string) => vite.ssrLoadModule(id) as Promise<PageModule>,
            pageId: route.pageId,
            // Loaders see the locale-STRIPPED path, like the servers route on.
            url: route.pattern,
            registry,
            componentCss,
            stores,
            layouts,
            runtimeConfig,
            publicConfig,
            locals,
            locale: variant.locale,
            pwa,
            fontHead,
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

          const publicPattern =
            route.pattern === '/' ? variant.prefix || '/' : `${variant.prefix}${route.pattern}`
          const dest = join(outDir, outFile(publicPattern))
          mkdirSync(dirname(dest), { recursive: true })
          writeFileSync(dest, html)
          console.log(`  ✓ ${publicPattern}  →  ${outFile(publicPattern)}`)
        }
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
  // Load apex.config.ts DEFAULTS FIRST — the image transform needs config.image before the
  // client build runs, self-hosted fonts need config.fonts, and the manifest bakes these
  // pristine defaults (never the env-resolved values, so build-time secrets don't get
  // written to dist). The prod server applies deploy-time .env / process.env over these
  // defaults at start. A short-lived Vite loads the TS config.
  let config: ApexConfig = {}
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
    config = resolved.config
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

  const clientHrefs = await buildClient(root, routes, outDir, '/', config)
  const server = await buildServer(root, routes, outDir)

  // Self-hosted fonts (#18): copy declared font files into dist/fonts/ so they're served
  // statically, and bake the prebuilt @font-face/preload <head> fragment into the manifest.
  // The prod server injects that plain string at runtime (prod/server.ts → renderPage's
  // `fontHead`), so it never imports build/fonts.ts (keeps node:fs out of the mobile bundle).
  const fonts = config.fonts as FontConfig | undefined
  const fontHead = fonts?.families?.length ? fontHeadTags(fonts) : undefined
  if (fonts?.families?.length) {
    const copied = emitFontAssets(outDir, root, fonts)
    console.log(`  ✓ Fonts — ${copied} file(s) → fonts/`)
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

  // Observability hooks (server/hooks.ts), if the app defined one.
  const hooksSrc = ['server/hooks.ts', 'server/hooks.js', 'server/hooks.mjs'].find((f) =>
    existsSync(join(root, f)),
  )
  const hooksServerFile = hooksSrc ? server.modules[`/${hooksSrc}`] : undefined
  const hooks = hooksServerFile ? { serverFile: hooksServerFile } : undefined

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
    fontHead,
    hooks,
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
