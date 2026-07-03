import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { defineEventHandler, type EventHandler, toWebRequest } from 'h3'
import type { ApiEntry } from '../api/routes.js'

/** True if any loaded route opted into MCP exposure. */
export function hasMcpRoutes(entries: ApiEntry[]): boolean {
  return entries.some((e) => e.route.mcp)
}

/** Build a fresh MCP server exposing the given routes as tools. */
function buildServer(entries: ApiEntry[]): McpServer {
  const server = new McpServer({ name: 'apexjs', version: '0.0.0' })
  for (const entry of entries) {
    server.registerTool(
      entry.mcpName,
      {
        description: entry.route.description ?? `Apex route ${entry.mcpName}`,
        inputSchema: entry.route.inputShape ?? {},
      },
      async (args: Record<string, unknown>) => {
        const result = await entry.route.handler({ input: args ?? {}, url: `mcp://${entry.mcpName}` })
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
      },
    )
  }
  return server
}

/**
 * An h3 handler mounting an MCP server (Streamable HTTP, stateless JSON mode) that
 * exposes every `mcp: true` route — including resource routes — as a tool. Same
 * typed definitions power both REST and AI tool calls.
 */
export function createMcpHandler(entries: ApiEntry[]): EventHandler {
  const mcpEntries = entries.filter((e) => e.route.mcp)

  return defineEventHandler(async (event) => {
    const server = buildServer(mcpEntries)
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
