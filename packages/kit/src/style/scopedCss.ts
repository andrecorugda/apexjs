import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

/**
 * Rewrite CSS selectors so they only match elements carrying the component's
 * scope attribute. Mirrors Vue's SFC scoping: the attribute is appended to the
 * last compound selector of each complex selector, e.g.
 *
 *   `.card h1`  →  `.card h1[data-apex-abc123]`
 *
 * `scopeAttr` is the bare attribute name (no brackets), e.g. `data-apex-abc123`.
 * A real selector parser is used rather than regex because pseudo-classes,
 * combinators and attribute selectors break naive string manipulation.
 *
 * Global targets — `html`, `body`, `:root` — are left UNSCOPED: they live outside
 * the component and can't carry the scope attribute, so scoping them would silently
 * drop the rule (a page-level background/color would never apply).
 */
const GLOBAL_TAGS = new Set(['html', 'body'])
const GLOBAL_PSEUDOS = new Set([':root', ':host'])

export function scopeCss(css: string, scopeAttr: string): string {
  const rewriter = selectorParser((selectors) => {
    selectors.each((selector) => {
      // Find the last "real" node (skip trailing combinators/whitespace) and
      // insert the attribute right after it.
      // `any` sidesteps the parser's strict child-node union on insertAfter.
      let last: any
      selector.each((node) => {
        if (node.type !== 'combinator' && node.type !== 'comment') last = node
      })
      if (!last) return
      // Don't scope a bare global target (its last compound is html/body/:root).
      const isGlobal =
        (last.type === 'tag' && GLOBAL_TAGS.has(String(last.value).toLowerCase())) ||
        (last.type === 'pseudo' && GLOBAL_PSEUDOS.has(String(last.value).toLowerCase()))
      if (!isGlobal) {
        selector.insertAfter(last, selectorParser.attribute({ attribute: scopeAttr } as any))
      }
    })
  })

  const root = postcss.parse(css)
  root.walkRules((rule) => {
    // Skip rules inside @keyframes (their "selectors" are keyframe stops).
    if (rule.parent?.type === 'atrule') {
      const name = (rule.parent as postcss.AtRule).name.toLowerCase()
      if (name.endsWith('keyframes')) return
    }
    rule.selector = rewriter.processSync(rule.selector)
  })

  return root.toString()
}
