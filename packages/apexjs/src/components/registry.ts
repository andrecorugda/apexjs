import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentRegistry } from '@apex-stack/kit'

interface ComponentModule {
  template: string
  rootXData: string | null
  scopeId: string
  css?: string
}

/**
 * Load `components/*.alpine` into a component registry keyed by PascalCase file
 * name (`components/Counter.alpine` → `<Counter/>`), plus the aggregated scoped
 * CSS of all components so their styles are included in the page shell.
 */
export async function loadComponents(
  root: string,
  loadModule: (id: string) => Promise<ComponentModule>,
): Promise<{ registry: ComponentRegistry; css: string }> {
  const dir = join(root, 'components')
  if (!existsSync(dir)) return { registry: {}, css: '' }

  const registry: ComponentRegistry = {}
  let css = ''
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.alpine'))) {
    const name = file.replace(/\.alpine$/, '')
    const mod = await loadModule(`/components/${file}`)
    registry[name] = { template: mod.template, rootXData: mod.rootXData, scopeId: mod.scopeId }
    if (mod.css) css += `${mod.css}\n`
  }
  return { registry, css }
}
