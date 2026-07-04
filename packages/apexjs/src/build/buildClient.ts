import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { apex } from '@apex-stack/vite'
import { type Plugin, build } from 'vite'
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
): Promise<Map<string, string>> {
  const input: Record<string, string> = {}
  for (const r of routes) input[entryName(r.pageId)] = `${VIRT}${r.pageId}`

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
          `import ${JSON.stringify(pageId)}`,
          'window.Alpine = Alpine',
          'Alpine.start()',
        ].join('\n')
      }
    },
  }

  await build({
    root,
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

  const hrefs = new Map<string, string>()
  for (const r of routes) {
    const virt = `${VIRT}${r.pageId}`
    const entry = Object.values(manifest).find(
      (m) => m.isEntry && (m.src === virt || m.src === `\0${virt}`),
    )
    if (entry) hrefs.set(r.pageId, `/${entry.file}`)
  }
  return hrefs
}
