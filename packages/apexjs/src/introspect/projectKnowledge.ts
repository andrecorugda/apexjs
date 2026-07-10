// Tolerant, dependency-free parsers that turn an Apex app's model and route
// source into structured knowledge for `apex_project_info` (the MCP tool an AI
// agent reads before it writes). These are best-effort static reads of the
// conventional `defineModel` / `defineApexRoute` shapes — not a type-checker. A
// field or flag written in an unusual way may be missed; that's acceptable for
// "understand the app before changing it", and never throws.

export interface ModelField {
  name: string
  type: string
  notNull?: boolean
  default?: string
}

export interface ModelInfo {
  /** The table name — `defineModel('<table>', …)`. */
  table?: string
  fields: ModelField[]
  /** Behavior names from `use: [...]` (e.g. `timestamps`, `owned`). */
  behaviors: string[]
}

export interface RouteInfo {
  method: string
  /** True when the route is exposed as an MCP tool (`mcp: true`). */
  mcp: boolean
  /** Explicit MCP tool name override, if any (`mcpName: '…'`). */
  mcpName?: string
  /** True when the route/resource is auth-gated (`auth: true`). */
  auth?: boolean
  /** `route` = a single `defineApexRoute`; `resource` = a model resource (CRUD). */
  kind: 'route' | 'resource'
}

/** Return the inner text of the `{ … }` whose opening brace is at `open`, honoring nesting. */
function sliceBalanced(src: string, open: number): string | undefined {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return src.slice(open + 1, i)
    }
  }
  return undefined
}

/** Parse a `models/*.ts` file's `defineModel(...)` into table + fields + behaviors. */
export function parseModelInfo(src: string): ModelInfo {
  const table = src.match(/defineModel\(\s*['"]([^'"]+)['"]/)?.[1]

  const fields: ModelField[] = []
  const fieldsAt = src.search(/fields\s*:\s*\{/)
  if (fieldsAt !== -1) {
    const brace = src.indexOf('{', fieldsAt)
    const block = brace === -1 ? undefined : sliceBalanced(src, brace)
    if (block) {
      // Each field is `name: { … }` (object form) — the conventional shape.
      const re = /(\w+)\s*:\s*\{([^{}]*)\}/g
      let m: RegExpExecArray | null
      // biome-ignore lint/suspicious/noAssignInExpressions: standard exec loop
      while ((m = re.exec(block)) !== null) {
        const name = m[1]
        const inner = m[2] ?? ''
        if (!name) continue
        const type = inner.match(/type\s*:\s*['"](\w+)['"]/)?.[1] ?? 'unknown'
        const notNull = /notNull\s*:\s*true/.test(inner)
        const def = inner.match(/default\s*:\s*([^,}]+)/)?.[1]?.trim()
        fields.push({
          name,
          type,
          ...(notNull ? { notNull: true } : {}),
          ...(def ? { default: def } : {}),
        })
      }
    }
  }

  const useBlock = src.match(/use\s*:\s*\[([^\]]*)\]/)?.[1] ?? ''
  const behaviors = [...useBlock.matchAll(/(\w+)\s*\(/g)]
    .map((b) => b[1])
    .filter((n): n is string => Boolean(n))

  return { table, fields, behaviors }
}

/** Parse a `server/api/*.ts` file's route/resource metadata. */
export function parseRouteInfo(src: string): RouteInfo {
  const kind: RouteInfo['kind'] = /\.resource\s*\(|defineResource\s*\(/.test(src)
    ? 'resource'
    : 'route'
  const method =
    src.match(/method\s*:\s*['"](\w+)['"]/)?.[1] ?? (kind === 'resource' ? 'ANY' : 'GET')
  const mcp = /\bmcp\s*:\s*true/.test(src)
  const mcpName = src.match(/mcpName\s*:\s*['"]([^'"]+)['"]/)?.[1]
  const auth = /\bauth\s*:\s*true/.test(src)
  return { method, mcp, kind, ...(mcpName ? { mcpName } : {}), ...(auth ? { auth: true } : {}) }
}

/** Derive the mounted URL of a `server/api/**` route from its path relative to `server/api`. */
export function mountedApiPath(relFromApi: string): string {
  const noExt = relFromApi.replace(/\.[cm]?tsx?$/, '')
  const trimmed = noExt.replace(/(^|\/)index$/, '') // index.ts → its parent path
  return trimmed ? `/api/${trimmed}` : '/api'
}
