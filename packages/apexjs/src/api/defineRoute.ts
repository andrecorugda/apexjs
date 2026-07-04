import type { ZodRawShape, z } from 'zod'
import type { RuntimeConfig } from '../config/runtime.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Inferred, validated input object for a route's handler. */
type InferInput<Shape extends ZodRawShape | undefined> = Shape extends ZodRawShape
  ? z.infer<z.ZodObject<Shape>>
  : Record<string, never>

export interface ApexRouteHandlerContext<Shape extends ZodRawShape | undefined> {
  /** The validated input (query for GET, JSON body otherwise). */
  input: InferInput<Shape>
  /** The raw request URL. */
  url: string
  /** Resolved runtime config (server-side: private + public). */
  config: RuntimeConfig
}

export interface ApexRouteConfig<Shape extends ZodRawShape | undefined, Output> {
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
export interface ApexRoute {
  method: HttpMethod
  description?: string
  inputShape?: ZodRawShape
  mcp: boolean
  mcpName?: string
  handler: (ctx: {
    input: unknown
    url: string
    config?: RuntimeConfig
  }) => unknown | Promise<unknown>
}

/**
 * Define a typed API route. A single definition serves as:
 *   - a validated REST endpoint, and
 *   - (when `mcp: true`) an MCP tool whose inputSchema is derived from `input`.
 *
 * The strict, schema-carrying contract is what makes "any Apex API can be MCP"
 * possible with no extra library on the user's side.
 */
export function defineApexRoute<Shape extends ZodRawShape | undefined, Output>(
  config: ApexRouteConfig<Shape, Output>,
): ApexRoute {
  return {
    method: config.method ?? 'GET',
    description: config.description,
    inputShape: config.input,
    mcp: config.mcp ?? false,
    mcpName: config.mcpName,
    handler: config.handler as ApexRoute['handler'],
  }
}
