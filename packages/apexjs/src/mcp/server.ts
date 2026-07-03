import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { defineEventHandler, type EventHandler, toWebRequest } from 'h3'
import type { LoadedRoute } from '../api/routes.js'

// MCP tool names must match ^[a-zA-Z0-9_-]{1,64}$ (claude.ai web-connector rule).
const INVALID_NAME_CHARS = /[^a-zA-Z0-9_-]/g

function toolName(r: LoadedRoute): string {
  return (r.route.mcpName ?? r.name).replace(INVALID_NAME_CHARS, '_').slice(0, 64)
}

/** True if any loaded route opted into MCP exposure. */
export function hasMcpRoutes(routes: LoadedRoute[]): boolean {
  return routes.some((r) => r.route.mcp)
}

/** Build a fresh MCP server exposing the given routes as tools. */
function buildServer(routes: LoadedRoute[]): McpServer {
  const server = new McpServer({ name: 'apexjs', version: '0.0.0' })
  for (const r of routes) {
    server.registerTool(
      toolName(r),
      {
        description: r.route.description ?? `Apex route ${r.name}`,
        inputSchema: r.route.inputShape ?? {},
      },
      async (args: Record<string, unknown>) => {
        const result = await r.route.handler({ input: args ?? {}, url: `mcp://${r.name}` })
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
      },
    )
  }
  return server
}

/**
 * An h3 handler mounting an MCP server (Streamable HTTP, stateless JSON mode) that
 * exposes every `mcp: true` route as a tool. This is the "any API can be MCP, no
 * extra lib" payoff: the same typed route definitions become AI-callable tools.
 *
 * Stateless mode builds a fresh server + transport per request — simple and safe
 * for a request/response tool server (no long-lived SSE session to track).
 */
export function createMcpHandler(routes: LoadedRoute[]): EventHandler {
  const mcpRoutes = routes.filter((r) => r.route.mcp)

  return defineEventHandler(async (event) => {
    const server = buildServer(mcpRoutes)
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    })
    await server.connect(transport)
    const response = await transport.handleRequest(toWebRequest(event))
    void server.close()
    return response
  })
}
