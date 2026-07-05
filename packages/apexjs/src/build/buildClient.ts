import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { apex } from '@apex-stack/vite'
import { build, type Plugin } from 'vite'
import type { RouteDef } from '../routing/router.js'

const VIRT = 'virtual:apex-client:'

/** Load the project's `@tailwindcss/vite` plugin if installed (same as dev). */
async function tailwindPlugin(root: string): Promise<Plugin | null> {
  try {
    const req = createRequire(join(root, 'package.json'))
    const mod = await import(pathToFileURL(req.resolve('@tailwindcss/vite')).href)
    const tw = (mod.default ?? mod) as () => Plugin
    return tw()
  } catch {
    return null // Tailwind not installed — fine, it's opt-in
  }
}

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
export interface ClientAssets {
  /** Hashed client JS bundle href. */
  js: string
  /** Hashed CSS asset hrefs (Tailwind + shared styles) for this entry. */
  css: string[]
}

export async function buildClient(
  root: string,
  routes: RouteDef[],
  outDir: string,
  base = '/',
): Promise<Map<string, ClientAssets>> {
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

  // Global stylesheet (Tailwind + shared styles). Imported into the entry so Vite
  // extracts it to a hashed .css asset that the shell links in <head> — the built
  // site is styled from the first paint (no flash).
  const appCssRel = ['app.css', 'styles/app.css', 'src/app.css'].find((f) =>
    existsSync(join(root, f)),
  )

  const entryPlugin: Plugin = {
    name: 'apex:client-entries',
    resolveId(id) {
      if (id.startsWith(VIRT)) return `\0${id}`
    },
    load(id) {
      if (id.startsWith(`\0${VIRT}`)) {
        const pageId = id.slice(`\0${VIRT}`.length)
        return [
          ...(appCssRel ? [`import ${JSON.stringify(`/${appCssRel}`)}`] : []),
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

  const tw = await tailwindPlugin(root)
  await build({
    root,
    base,
    logLevel: 'warn',
    plugins: [...(tw ? [tw] : []), apex({ clientRuntime: '@apex-stack/core/client' }), entryPlugin],
    build: {
      outDir,
      emptyOutDir: false,
      manifest: true,
      rollupOptions: { input },
    },
  })

  // Vite writes the manifest to <outDir>/.vite/manifest.json. Its keys are the
  // resolved entry ids; match by the virtual page id we fed in.
  type ManifestChunk = {
    file: string
    isEntry?: boolean
    src?: string
    css?: string[]
    imports?: string[]
  }
  const manifest = JSON.parse(
    readFileSync(join(outDir, '.vite', 'manifest.json'), 'utf8'),
  ) as Record<string, ManifestChunk>

  // The global app.css is imported by every entry, so Vite hoists it into a shared
  // chunk — the CSS lives on that imported chunk, not directly on the entry. Walk
  // the import graph to collect every stylesheet the entry pulls in.
  const collectCss = (key: string, seen: Set<string>): string[] => {
    const m = manifest[key]
    if (!m || seen.has(key)) return []
    seen.add(key)
    const out = [...(m.css ?? [])]
    for (const imp of m.imports ?? []) out.push(...collectCss(imp, seen))
    return out
  }

  const prefix = base.endsWith('/') ? base : `${base}/`
  const hrefs = new Map<string, ClientAssets>()
  for (const r of routes) {
    const virt = `${VIRT}${r.pageId}`
    // Vite may normalize the virtual src (e.g. prefix it with `../../` or `\0`),
    // so match by suffix rather than exact equality.
    const key = Object.keys(manifest).find((k) => {
      const m = manifest[k]
      return m?.isEntry && typeof m.src === 'string' && (m.src === virt || m.src.endsWith(virt))
    })
    if (!key) continue
    const css = [...new Set(collectCss(key, new Set()))]
    hrefs.set(r.pageId, {
      js: `${prefix}${manifest[key]?.file}`,
      css: css.map((c) => `${prefix}${c}`),
    })
  }
  return hrefs
}
