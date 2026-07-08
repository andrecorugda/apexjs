import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentRegistry } from '@apex-stack/kit'

interface ComponentModule {
  template: string
  rootXData: string | null
  scopeId: string
  componentId?: string
  css?: string
  hasLoader?: boolean
  loader?: (ctx: { props: Record<string, unknown>; locals?: Record<string, unknown> }) => unknown
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
    registry[name] = {
      template: mod.template,
      rootXData: mod.rootXData,
      scopeId: mod.scopeId,
      componentId: mod.componentId,
      // Only carry a loader the author actually declared (not the injected no-op).
      ...(mod.hasLoader && typeof mod.loader === 'function' ? { loader: mod.loader } : {}),
    }
    if (mod.css) {
      css += `${mod.css}\n`
      cssBlocks.push({ scopeId: mod.scopeId, css: mod.css })
    }
  }
  return { registry, css, cssBlocks }
}
