import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { defineEventHandler, type EventHandler, toWebRequest } from 'h3'
import { z } from 'zod'
import type { ApiEntry } from '../api/routes.js'
import type { RuntimeConfig } from '../config/runtime.js'

/** True if any loaded route opted into MCP exposure. */
export function hasMcpRoutes(entries: ApiEntry[]): boolean {
  return entries.some((e) => e.route.mcp)
}

/**
 * `tools/list` converts every tool's input shape to JSON Schema; a shape with a
 * type JSON Schema can't represent (e.g. `z.date()`) throws and kills the ENTIRE
 * list — one bad tool takes down MCP for the whole app. Verify each shape is
 * representable and, if not, degrade THAT tool to a loose schema so the rest keep
 * working. (models avoid this by mapping timestamps to strings; this guards
 * hand-written routes too.)
 */
function safeInputSchema(shape: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!shape || Object.keys(shape).length === 0) return {}
  try {
    const toJSONSchema = (z as unknown as { toJSONSchema?: (s: unknown) => unknown }).toJSONSchema
    if (typeof toJSONSchema === 'function') toJSONSchema(z.object(shape as never))
    return shape
  } catch {
    return {}
  }
}

/** Build a fresh MCP server exposing the given routes as tools. */
function buildServer(entries: ApiEntry[], config?: RuntimeConfig): McpServer {
  const server = new McpServer({ name: 'apexjs', version: '0.0.0' })
  for (const entry of entries) {
    server.registerTool(
      entry.mcpName,
      {
        description: entry.route.description ?? `Apex route ${entry.mcpName}`,
        inputSchema: safeInputSchema(entry.route.inputShape) as never,
      },
      async (args: Record<string, unknown>) => {
        const result = await entry.route.handler({
          input: args ?? {},
          url: `mcp://${entry.mcpName}`,
          config: config ?? { public: {} },
        })
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
export function createMcpHandler(entries: ApiEntry[], config?: RuntimeConfig): EventHandler {
  const mcpEntries = entries.filter((e) => e.route.mcp)

  return defineEventHandler(async (event) => {
    const server = buildServer(mcpEntries, config)
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
