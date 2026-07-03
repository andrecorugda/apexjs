import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { apex } from '@apex-stack/vite'
import { defineCommand } from 'citty'
import { createServer as createViteServer } from 'vite'
import { buildClient } from '../build/buildClient.js'
import { loadComponents } from '../components/registry.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import { renderIslandsPage } from '../islands/render.js'
import { type RouteDef, scanPages } from '../routing/router.js'

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
    islands: { type: 'boolean', description: 'Static-first islands mode (zero-JS static)', default: false },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const outDir = resolve(root, args.outDir)
    rmSync(outDir, { recursive: true, force: true })

    const routes = scanPages(root)
    const staticRoutes = routes.filter((r: RouteDef) => !r.isDynamic)
    const dynamic = routes.filter((r: RouteDef) => r.isDynamic)

    // Component mode: build a client bundle per page so the prerendered HTML hydrates.
    const hrefs = args.islands ? new Map<string, string>() : await buildClient(root, staticRoutes, outDir)

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

      for (const route of staticRoutes) {
        const common = {
          loadModule: (id: string) => vite.ssrLoadModule(id) as Promise<PageModule>,
          pageId: route.pageId,
          url: route.pattern,
          registry,
          componentCss,
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
        `\n  Built ${staticRoutes.length} page(s) → ${args.outDir}/` +
          (args.islands ? ' (islands / static-first)' : ' (prerendered + hydrated)'),
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
