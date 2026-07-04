import { createScopeProxy, type ScopeLayer } from './scope.js'

/**
 * Server-side expression evaluator, mirroring Alpine 3's own strategy of
 * building a function with a `with(scope)` block. Alpine uses an AsyncFunction;
 * for SSR we use a synchronous Function since loader data is already resolved.
 *
 * This is NOT a sandbox. Expressions are the developer's own trusted template
 * code, exactly as in Alpine. We compile-cache by expression string.
 */

type CompiledExpr = (scope: Record<PropertyKey, unknown>) => unknown

const cache = new Map<string, CompiledExpr>()

export class AlpineEvalError extends Error {
  constructor(
    readonly expression: string,
    override readonly cause: unknown,
  ) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    super(`Failed to evaluate Alpine expression \`${expression}\`: ${reason}`)
    this.name = 'AlpineEvalError'
  }
}

function compile(expression: string): CompiledExpr {
  const cached = cache.get(expression)
  if (cached) return cached

  let fn: CompiledExpr
  try {
    // Expression form first: `return (expr)`.
    // eslint-disable-next-line no-new-func
    fn = new Function('__scope', `with (__scope) { return (${expression}) }`) as CompiledExpr
  } catch {
    // Statement-shaped fallback (rare): run without the `return (...)` wrapper.
    // eslint-disable-next-line no-new-func
    fn = new Function('__scope', `with (__scope) { ${expression} }`) as CompiledExpr
  }

  cache.set(expression, fn)
  return fn
}

/**
 * Evaluate an Alpine expression against a layered scope. `throwOnError: false`
 * (the default for SSR) returns `undefined` on failure so a single bad/browser-
 * only expression degrades to "render nothing" rather than crashing the page —
 * the browser then fills it in on hydration.
 */
export function evaluate(
  expression: string,
  layers: ScopeLayer[],
  opts: { throwOnError?: boolean } = {},
): unknown {
  const scope = createScopeProxy(layers)
  try {
    return compile(expression)(scope)
  } catch (cause) {
    if (opts.throwOnError) throw new AlpineEvalError(expression, cause)
    return undefined
  }
}

/** Clear the compile cache (used by tests / dev HMR). */
export function clearExprCache(): void {
  cache.clear()
}
