import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentEntry, ComponentRegistry } from '@apex-stack/kit'

/** PascalCase a path segment (`ui` → `Ui`, `my-widgets` → `MyWidgets`, `BaseButton` → `BaseButton`). */
function pascal(s: string): string {
  return s.replace(/(^|[-_ ])([a-z])/g, (_m, _b, c: string) => c.toUpperCase())
}

/**
 * Derive a component's tag name from its path relative to `components/` (no extension).
 * Top-level files keep their exact filename (`Card` → `<Card/>`) — 100% backward
 * compatible. Nested files are namespaced by folder, Nuxt-style, with overlapping
 * segments deduped: `ui/Card` → `<UiCard/>`, `base/BaseButton` → `<BaseButton/>`,
 * `base/foo/Button` → `<BaseFooButton/>`.
 */
export function componentName(relNoExt: string): string {
  const parts = relNoExt.split(/[\\/]/).filter(Boolean)
  const file = parts.pop() ?? relNoExt
  if (parts.length === 0) return file
  let name = ''
  for (const part of [...parts.map(pascal), file]) {
    let overlap = 0
    for (let i = Math.min(name.length, part.length); i > 0; i--) {
      if (name.endsWith(part.slice(0, i))) {
        overlap = i
        break
      }
    }
    name += part.slice(overlap)
  }
  return name
}

export interface ComponentFile {
  /** Root-absolute module id with forward slashes (matches dev's ssrLoadModule keys). */
  id: string
  /** Path relative to `components/`, forward slashes (e.g. `ui/Card.alpine`). */
  rel: string
  /** The resolved tag name (`<name/>`). */
  name: string
}

/**
 * Recursively find every `.alpine` under `components/` and resolve its tag name.
 * Single source of truth for the dev loader, the prod build manifest, and the SSR
 * build — so component naming can never drift between them. Throws on a collision
 * (two files resolving to the same tag).
 */
export function scanComponents(root: string): ComponentFile[] {
  const dir = join(root, 'components')
  if (!existsSync(dir)) return []
  const out: ComponentFile[] = []
  const walk = (d: string, base: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const rel = base ? `${base}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(join(d, entry.name), rel)
      else if (entry.name.endsWith('.alpine'))
        out.push({
          id: `/components/${rel}`,
          rel,
          name: componentName(rel.replace(/\.alpine$/, '')),
        })
    }
  }
  walk(dir, '')
  const seen = new Map<string, string>()
  for (const c of out) {
    const prev = seen.get(c.name)
    if (prev)
      throw new Error(
        `Two components both resolve to <${c.name}/>: components/${prev} and components/${c.rel}. Rename or move one.`,
      )
    seen.set(c.name, c.rel)
  }
  return out
}

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
 * Load every `components/**\/*.alpine` into a component registry keyed by resolved
 * tag name (`components/Counter.alpine` → `<Counter/>`; `components/ui/Card.alpine`
 * → `<UiCard/>`), plus the aggregated scoped CSS of all components so their styles
 * are included in the page shell.
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
  const registry: ComponentRegistry = {}
  let css = ''
  const cssBlocks: Array<{ scopeId: string; css: string }> = []
  for (const { id, name } of scanComponents(root)) {
    const mod = await loadModule(id)
    registry[name] = toComponentEntry(mod)
    if (mod.css) {
      css += `${mod.css}\n`
      cssBlocks.push({ scopeId: mod.scopeId, css: mod.css })
    }
  }
  return { registry, css, cssBlocks }
}
