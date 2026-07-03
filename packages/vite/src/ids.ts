import { createHash } from 'node:crypto'

/**
 * Derive the stable component id and scoped-CSS attribute for a `.alpine` file.
 * Both the SSR module and the client module compute these from the same path,
 * so the server-rendered `x-data="apex_<id>"` reference and the client's
 * `Alpine.data('apex_<id>')` registration always line up.
 */
export function computeIds(filePath: string): { componentId: string; scopeId: string } {
  const hash = createHash('sha256').update(filePath).digest('hex').slice(0, 8)
  return {
    componentId: `c${hash}`,
    scopeId: `data-apex-${hash}`,
  }
}
