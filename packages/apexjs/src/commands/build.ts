import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineCommand } from 'citty'
import { createServer as createViteServer } from 'vite'
import { apex } from '@apex-stack/vite'
import { loadComponents } from '../components/registry.js'
import { renderIslandsPage } from '../islands/render.js'
import { type PageModule } from '../dev/renderPage.js'
import { type RouteDef, scanPages } from '../routing/router.js'

/** Map a route pattern to an output file: `/` → index.html, `/about` → about/index.html. */
function outFile(pattern: string): string {
  const clean = pattern.replace(/^\//, '')
  return clean === '' ? 'index.html' : `${clean}/index.html`
}

export const buildCommand = defineCommand({
  meta: { name: 'build', description: 'Prerender static pages to deployable HTML (SSG)' },
  args: {
    root: { type: 'positional', required: false, description: 'Project root', default: '.' },
    outDir: { type: 'string', description: 'Output directory', default: 'dist' },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const outDir = resolve(root, args.outDir)

    const vite = await createViteServer({
      root,
      appType: 'custom',
      server: { middlewareMode: true },
      plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    })

    try {
      const routes = scanPages(root)
      const staticRoutes = routes.filter((r: RouteDef) => !r.isDynamic)
      const dynamic = routes.filter((r: RouteDef) => r.isDynamic)

      const { registry, css: componentCss } = await loadComponents(
        root,
        (id) => vite.ssrLoadModule(id) as never,
      )

      let written = 0
      let interactive = 0
      for (const route of staticRoutes) {
        // No transformHtml → no dev client injection; clean static output.
        // renderIslandsPage emits zero <script> when the page has no hydrating islands.
        const html = await renderIslandsPage({
          loadModule: (id) => vite.ssrLoadModule(id) as Promise<PageModule>,
          pageId: route.pageId,
          url: route.pattern,
          registry,
          componentCss,
        })
        if (html.includes('data-apex-island') || html.includes('type="module"')) interactive++

        const dest = join(outDir, outFile(route.pattern))
        mkdirSync(dirname(dest), { recursive: true })
        writeFileSync(dest, html)
        written++
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log(`  ✓ ${route.pattern}  →  ${outFile(route.pattern)}`)
      }

      // Copy public/ assets if present.
      const pub = join(root, 'public')
      if (existsSync(pub)) cpSync(pub, outDir, { recursive: true })

      // biome-ignore lint/suspicious/noConsole: CLI output
      console.log(`\n  Built ${written} page(s) → ${args.outDir}/`)
      if (interactive) {
        console.log(
          `  Note: ${interactive} page(s) use islands/interactivity; client bundling for SSG is coming — those ship SSR HTML only for now.`,
        )
      }
      if (dynamic.length) {
        console.log(
          `  Skipped ${dynamic.length} dynamic route(s) (${dynamic
            .map((r) => r.pattern)
            .join(', ')}) — prerendering params is on the roadmap.`,
        )
      }
      console.log()
    } finally {
      await vite.close()
    }
  },
})
