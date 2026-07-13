import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { build, type Plugin, type Rollup } from 'vite'
import { clientEntryId } from '../client-entry.js'
import { islandLoader } from '../islands/render.js'
import { runtimeAlias } from './buildClient.js'

const VIRT = 'virtual:apex-islands'

export interface IslandsRuntimeAssets {
  /** Hashed href of the islands runtime bundle (loader; Alpine is a lazy chunk). */
  js: string
  /** Hashed stylesheet hrefs (Tailwind + shared styles). */
  css: string[]
}

/**
 * Build the islands runtime for a static `apex build --islands` output.
 *
 * The dev server inlines the island loader and lets Vite rewrite its
 * `import('alpinejs')`; a static build has no rewriter, so the bare specifier
 * would throw in the browser and no island would ever hydrate. This bundles the
 * loader to a real asset — Alpine stays a lazily-imported chunk, so pages
 * without hydrating islands still ship zero JS — and compiles the project's
 * global stylesheet (Tailwind) alongside it.
 */
export async function buildIslandsRuntime(
  root: string,
  outDir: string,
  base = '/',
): Promise<IslandsRuntimeAssets> {
  const appCssRel = ['app.css', 'styles/app.css', 'src/app.css'].find((f) =>
    existsSync(join(root, f)),
  )
  const clientEntry = clientEntryId(root)

  const entryPlugin: Plugin = {
    name: 'apex:islands-entry',
    resolveId(id) {
      if (id === VIRT) return `\0${VIRT}`
    },
    load(id) {
      if (id === `\0${VIRT}`) {
        return [
          ...(appCssRel ? [`import ${JSON.stringify(`/${appCssRel}`)}`] : []),
          islandLoader(clientEntry),
        ].join('\n')
      }
    },
  }

  // Reuse the project's Tailwind plugin if installed (same as buildClient).
  let tw: Plugin | null = null
  try {
    const { createRequire } = await import('node:module')
    const { pathToFileURL } = await import('node:url')
    const req = createRequire(join(root, 'package.json'))
    const mod = await import(pathToFileURL(req.resolve('@tailwindcss/vite')).href)
    tw = ((mod.default ?? mod) as () => Plugin)()
  } catch {
    // Tailwind not installed — fine, it's opt-in.
  }

  const result = (await build({
    root,
    base,
    logLevel: 'warn',
    resolve: { alias: runtimeAlias() },
    plugins: [...(tw ? [tw] : []), entryPlugin],
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: { input: { islands: VIRT } },
    },
  })) as Rollup.RollupOutput

  let js = ''
  const css: string[] = []
  for (const chunk of result.output) {
    if (chunk.type === 'chunk' && chunk.isEntry) js = base + chunk.fileName
    if (chunk.type === 'asset' && chunk.fileName.endsWith('.css')) css.push(base + chunk.fileName)
  }
  return { js, css }
}
