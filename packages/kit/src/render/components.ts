export interface ComponentEntry {
  /** Inner content of the component's top-level <template>. */
  template: string
  /** The component's authored root x-data expression, if any. */
  rootXData?: string | null
  /** The component's scoped-CSS attribute. */
  scopeId: string
}

export type ComponentRegistry = Record<string, ComponentEntry>

// Attribute run that respects quoted values (so `>` inside an expression like
// :disabled="n > 5" doesn't terminate the tag match).
const ATTRS = `(?:\\s+[^\\s=/>]+(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'=<>\`]+))?)*`

/**
 * Rewrite PascalCase component tags into a lowercase, hyphenated placeholder that
 * survives HTML parsing (the DOM lowercases tag names, losing `<Counter>` vs
 * `<counter>`). `<Counter start="5"/>` → `<apex-component data-apex-name="Counter" start="5"></apex-component>`.
 * Only names present in the registry are rewritten.
 */
export function rewriteComponentTags(html: string, names: string[]): string {
  let out = html
  for (const name of names) {
    const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Self-closing or opening tag (capture attrs in $1, self-close slash in $2).
    out = out.replace(new RegExp(`<${n}(${ATTRS})\\s*(/?)>`, 'g'), (_m, attrs, slash) =>
      slash === '/'
        ? `<apex-component data-apex-name="${name}"${attrs}></apex-component>`
        : `<apex-component data-apex-name="${name}"${attrs}>`,
    )
    out = out.replace(new RegExp(`</${n}>`, 'g'), '</apex-component>')
  }
  return out
}
