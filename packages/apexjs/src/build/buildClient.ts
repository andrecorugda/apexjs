import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { apex } from '@apex-stack/vite'
import { build, type Plugin } from 'vite'
import type { RouteDef } from '../routing/router.js'

const VIRT = 'virtual:apex-client:'

function entryName(pageId: string): string {
  return pageId
    .replace(/^\/pages\//, '')
    .replace(/\.alpine$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
}

/**
 * Build one client bundle per page (Alpine + the page's component module + start),
 * with a manifest, so the prerendered HTML can reference hashed, cacheable assets.
 * Returns pageId → public href of the built entry.
 */
export async function buildClient(
  root: string,
  routes: RouteDef[],
  outDir: string,
  base = '/',
): Promise<Map<string, string>> {
  const input: Record<string, string> = {}
  for (const r of routes) input[entryName(r.pageId)] = `${VIRT}${r.pageId}`

  // Global stores must be registered on the client before Alpine.start(), using
  // the same factory the server used — otherwise `$store.*` is undefined after
  // hydration. The dev shell does this inline; the built bundle must do it too.
  const storesDir = join(root, 'stores')
  const storeIds = existsSync(storesDir)
    ? readdirSync(storesDir)
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
        .map((f) => `/stores/${f}`)
    : []

  const entryPlugin: Plugin = {
    name: 'apex:client-entries',
    resolveId(id) {
      if (id.startsWith(VIRT)) return `\0${id}`
    },
    load(id) {
      if (id.startsWith(`\0${VIRT}`)) {
        const pageId = id.slice(`\0${VIRT}`.length)
        return [
          `import Alpine from 'alpinejs'`,
          ...storeIds.map((sid, i) => `import __s${i} from ${JSON.stringify(sid)}`),
          `import ${JSON.stringify(pageId)}`,
          'window.Alpine = Alpine',
          ...storeIds.map((_, i) => `Alpine.store(__s${i}.name, __s${i}.factory())`),
          'Alpine.start()',
        ].join('\n')
      }
    },
  }

  await build({
    root,
    base,
    logLevel: 'warn',
    plugins: [apex({ clientRuntime: '@apex-stack/core/client' }), entryPlugin],
    build: {
      outDir,
      emptyOutDir: false,
      manifest: true,
      rollupOptions: { input },
    },
  })

  // Vite writes the manifest to <outDir>/.vite/manifest.json. Its keys are the
  // resolved entry ids; match by the virtual page id we fed in.
  const manifest = JSON.parse(
    readFileSync(join(outDir, '.vite', 'manifest.json'), 'utf8'),
  ) as Record<string, { file: string; isEntry?: boolean; src?: string }>

  const prefix = base.endsWith('/') ? base : `${base}/`
  const hrefs = new Map<string, string>()
  for (const r of routes) {
    const virt = `${VIRT}${r.pageId}`
    // Vite may normalize the virtual src (e.g. prefix it with `../../` or `\0`),
    // so match by suffix rather than exact equality.
    const entry = Object.values(manifest).find(
      (m) => m.isEntry && typeof m.src === 'string' && (m.src === virt || m.src.endsWith(virt)),
    )
    if (entry) hrefs.set(r.pageId, `${prefix}${entry.file}`)
  }
  return hrefs
}
