import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentEntry, ComponentRegistry } from '@apex-stack/kit'

export interface ComponentModule {
  template: string
  rootXData: string | null
  scopeId: string
  componentId?: string
  css?: string
  hasLoader?: boolean
  loader?: (ctx: { props: Record<string, unknown>; locals?: Record<string, unknown> }) => unknown
}

/**
 * Build a registry entry from a compiled component module. THE single source of
 * truth for this mapping — both the dev loader and the prod server use it, so a
 * component's server `loader` can't be dropped in one path (it was: the prod
 * server built its registry inline and lost the loader → embedded loaders never
 * ran in `apex build --server`). Only carries a loader the author declared
 * (`hasLoader`), not the compiler's injected no-op.
 */
export function toComponentEntry(mod: ComponentModule): ComponentEntry {
  return {
    template: mod.template,
    rootXData: mod.rootXData,
    scopeId: mod.scopeId,
    componentId: mod.componentId,
    ...(mod.hasLoader && typeof mod.loader === 'function' ? { loader: mod.loader } : {}),
  }
}

/**
 * Load `components/*.alpine` into a component registry keyed by PascalCase file
 * name (`components/Counter.alpine` → `<Counter/>`), plus the aggregated scoped
 * CSS of all components so their styles are included in the page shell.
 */
export async function loadComponents(
  root: string,
  loadModule: (id: string) => Promise<ComponentModule>,
): Promise<{
  registry: ComponentRegistry
  css: string
  /** Per-component CSS keyed by scopeId — enables per-component style HMR. */
  cssBlocks: Array<{ scopeId: string; css: string }>
}> {
  const dir = join(root, 'components')
  if (!existsSync(dir)) return { registry: {}, css: '', cssBlocks: [] }

  const registry: ComponentRegistry = {}
  let css = ''
  const cssBlocks: Array<{ scopeId: string; css: string }> = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.alpine'))) {
    const name = file.replace(/\.alpine$/, '')
    const mod = await loadModule(`/components/${file}`)
    registry[name] = toComponentEntry(mod)
    if (mod.css) {
      css += `${mod.css}\n`
      cssBlocks.push({ scopeId: mod.scopeId, css: mod.css })
    }
  }
  return { registry, css, cssBlocks }
}
