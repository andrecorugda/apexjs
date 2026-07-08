import type { ZodRawShape, z } from 'zod'
import type { ApexUser, RouteGate } from '../auth/define.js'
import type { RuntimeConfig } from '../config/runtime.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Inferred, validated input object for a route's handler. */
type InferInputShape<Shape extends ZodRawShape | undefined> = Shape extends ZodRawShape
  ? z.infer<z.ZodObject<Shape>>
  : Record<string, never>

export interface ApexRouteHandlerContext<Shape extends ZodRawShape | undefined> {
  /** The validated input (query for GET, JSON body otherwise). */
  input: InferInputShape<Shape>
  /** The raw request URL. */
  url: string
  /** Resolved runtime config (server-side: private + public). */
  config: RuntimeConfig
  /** Request-scoped state set by middleware (e.g. an authenticated user). */
  locals: Record<string, unknown>
  /**
   * The authenticated user resolved by `defineAuth`, or `null` if anonymous. When
   * the route declares `auth: true`, this is guaranteed present (a 401 is returned
   * otherwise before the handler runs).
   */
  user: ApexUser | null
  /**
   * The raw h3 request event (server-only; typed loosely to keep this module
   * dependency-free). Pass it to the session/response helpers in
   * `@apex-stack/core/server` — e.g. `login(event, { user }, …)` or
   * `setStatus(event, 401)`. `undefined` for MCP tool calls (no HTTP event).
   */
  event: unknown
}

export interface ApexRouteConfig<Shape extends ZodRawShape | undefined, Output> extends RouteGate {
  /** HTTP method. Defaults to GET. */
  method?: HttpMethod
  /** Human + AI-readable description. Becomes the MCP tool description. */
  description?: string
  /**
   * Input contract as a Zod raw shape (an object of Zod validators). Drives both
   * REST validation AND the MCP tool's inputSchema — one definition, both worlds.
   */
  input?: Shape
  /** Opt in to exposing this route as an MCP tool. Defaults to false. */
  mcp?: boolean
  /**
   * Override the MCP tool name (must match ^[a-zA-Z0-9_-]{1,64}$). Defaults to a
   * slug derived from the file path.
   */
  mcpName?: string
  /** The route implementation. Business logic should live in a service; this is the adapter. */
  handler: (ctx: ApexRouteHandlerContext<Shape>) => Output | Promise<Output>
}

/** The normalized, framework-facing route object produced by defineApexRoute. */
export interface ApexRoute extends RouteGate {
  method: HttpMethod
  description?: string
  inputShape?: ZodRawShape
  mcp: boolean
  mcpName?: string
  handler: (ctx: {
    input: unknown
    url: string
    config?: RuntimeConfig
    locals?: Record<string, unknown>
    user?: ApexUser | null
    event?: unknown
  }) => unknown | Promise<unknown>
}

/**
 * A route that carries its input/output types (phantom fields, erased at runtime)
 * so the frontend can derive them with `InferInput`/`InferOutput` — one contract,
 * no duplicated types across backend + frontend.
 */
export interface TypedApexRoute<In, Out> extends ApexRoute {
  /** Phantom — never present at runtime; carries the validated input type. */
  readonly __input?: In
  /** Phantom — never present at runtime; carries the handler's (awaited) output type. */
  readonly __output?: Out
}

/** Derive a route's validated input type: `type In = InferInput<typeof route>`. */
export type InferInput<R> = R extends TypedApexRoute<infer In, unknown> ? In : never
/** Derive a route's output type: `type Out = InferOutput<typeof route>`. */
export type InferOutput<R> = R extends TypedApexRoute<unknown, infer Out> ? Out : never

/**
 * Define a typed API route. A single definition serves as:
 *   - a validated REST endpoint, and
 *   - (when `mcp: true`) an MCP tool whose inputSchema is derived from `input`.
 *
 * The strict, schema-carrying contract is what makes "any Apex API can be MCP"
 * possible with no extra library on the user's side. The returned route also
 * carries its input/output types — a `import type` of it on the frontend +
 * `InferInput`/`InferOutput` gives the client the API's types with zero drift.
 */
export function defineApexRoute<Shape extends ZodRawShape | undefined, Output>(
  config: ApexRouteConfig<Shape, Output>,
): TypedApexRoute<InferInputShape<Shape>, Awaited<Output>> {
  return {
    method: config.method ?? 'GET',
    description: config.description,
    inputShape: config.input,
    mcp: config.mcp ?? false,
    mcpName: config.mcpName,
    auth: config.auth,
    can: config.can,
    handler: config.handler as ApexRoute['handler'],
  }
}
