import { existsSync, readdirSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { apex } from '@apex-stack/vite'
import { build, type Rollup } from 'vite'
import type { RouteDef } from '../routing/router.js'

export interface ServerBuild {
  /** Absolute module id (e.g. `/pages/index.alpine`) → built file path relative to server outDir. */
  modules: Record<string, string>
}

/**
 * SSR-build every page, component, and API module into plain ESM so a production
 * server can import them without Vite. Returns a map from source module id to the
 * built file, which the prod server uses in place of `vite.ssrLoadModule`.
 */
export async function buildServer(
  root: string,
  routes: RouteDef[],
  outDir: string,
): Promise<ServerBuild> {
  // Collect entry module ids (as root-absolute ids, matching dev's ssrLoadModule keys).
  const ids: string[] = routes.map((r) => r.pageId)

  const compDir = join(root, 'components')
  if (existsSync(compDir)) {
    for (const f of readdirSync(compDir).filter((f) => f.endsWith('.alpine'))) {
      ids.push(`/components/${f}`)
    }
  }
  // Layouts must be SSR-built too so the prod server can wrap pages in them
  // (renderPage loads `/layouts/<name>.alpine` at request time).
  const layoutsDir = join(root, 'layouts')
  if (existsSync(layoutsDir)) {
    for (const f of readdirSync(layoutsDir).filter((f) => f.endsWith('.alpine'))) {
      ids.push(`/layouts/${f}`)
    }
  }
  const apiDir = join(root, 'server', 'api')
  if (existsSync(apiDir)) {
    for (const f of readdirSync(apiDir).filter((f) => /\.(ts|js|mjs)$/.test(f))) {
      ids.push(`/server/api/${f}`)
    }
  }
  const mwDir = join(root, 'middleware')
  if (existsSync(mwDir)) {
    for (const f of readdirSync(mwDir).filter((f) => /\.(ts|js|mjs)$/.test(f))) {
      ids.push(`/middleware/${f}`)
    }
  }

  const input: Record<string, string> = {}
  for (const id of ids) input[entryName(id)] = join(root, id.slice(1))

  const result = (await build({
    root,
    logLevel: 'warn',
    plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    build: {
      ssr: true,
      target: 'esnext', // Node target — allow top-level await in server modules
      outDir: join(outDir, 'server'),
      emptyOutDir: false,
      rollupOptions: {
        input,
        // Externalize every package import (bare specifier) — deps are resolved at
        // runtime from node_modules. Only the app's own relative/absolute files are
        // bundled. This keeps native/workspace deps (@libsql/client, drizzle, …) out.
        external: (id: string) => !id.startsWith('.') && !isAbsolute(id),
        output: { format: 'esm', entryFileNames: '[name].mjs' },
      },
    },
  })) as Rollup.RollupOutput

  // Map each source id → its built .mjs via the chunk's facadeModuleId.
  // Rollup always reports facadeModuleId with forward slashes; `join()` yields
  // backslashes on Windows — normalize both sides or the lookup misses on Windows
  // (leaving every route's serverFile undefined → the prod server crashes).
  const byFacade = new Map<string, string>()
  for (const chunk of result.output) {
    if (chunk.type === 'chunk' && chunk.isEntry && chunk.facadeModuleId) {
      byFacade.set(chunk.facadeModuleId.replace(/\\/g, '/'), chunk.fileName)
    }
  }

  const modules: Record<string, string> = {}
  for (const id of ids) {
    const abs = join(root, id.slice(1)).replace(/\\/g, '/')
    const file = byFacade.get(abs)
    if (file) modules[id] = file
  }
  return { modules }
}

function entryName(id: string): string {
  return id
    .replace(/^\//, '')
    .replace(/\.(alpine|ts|js|mjs)$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
}
