import { defineCommand } from 'citty'

/**
 * `apex mcp` — a built-in MCP inspector.
 *
 * Reuses the MCP SDK already bundled with Apex (no extra install) to connect to
 * a running dev server's /mcp endpoint, list its tools with their schemas, and
 * call one — the local test loop for AI-callable routes, right in the CLI.
 */
export const mcpCommand = defineCommand({
  meta: { name: 'mcp', description: 'Inspect the local MCP server (list or call tools)' },
  args: {
    url: { type: 'string', description: 'MCP endpoint URL', default: 'http://localhost:3000/mcp' },
    call: { type: 'string', description: 'Name of a tool to call' },
    args: { type: 'string', description: 'JSON arguments for --call', default: '{}' },
  },
  async run({ args }) {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
    const { StreamableHTTPClientTransport } = await import(
      '@modelcontextprotocol/sdk/client/streamableHttp.js'
    )

    const client = new Client({ name: 'apex-mcp-cli', version: '0.0.0' })
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(args.url)))
    } catch (err) {
      console.error(
        `\n  Could not reach an MCP server at ${args.url}\n  Is \`apex dev\` running? ${(err as Error).message}\n`,
      )
      process.exit(1)
    }

    if (args.call) {
      const result = await client.callTool({
        name: args.call,
        arguments: JSON.parse(args.args),
      })
      console.log(`\n  \x1b[36m${args.call}\x1b[0m(${args.args}) →`)
      for (const part of result.content as Array<{ type: string; text?: string }>) {
        console.log(`  ${part.text ?? JSON.stringify(part)}`)
      }
      console.log()
    } else {
      const { tools } = await client.listTools()
      console.log(`\n  \x1b[36mMCP tools\x1b[0m at ${args.url} (${tools.length})\n`)
      for (const t of tools) {
        const props = (t.inputSchema as { properties?: Record<string, { type?: string }> })
          ?.properties
        const sig = props
          ? Object.entries(props)
              .map(([k, v]) => `${k}: ${v.type ?? 'any'}`)
              .join(', ')
          : ''
        console.log(`  • \x1b[1m${t.name}\x1b[0m(${sig})`)
        if (t.description) console.log(`    ${t.description}`)
      }
      console.log(`\n  Call one:  apex mcp --call <name> --args '{...}'\n`)
    }

    await client.close()
  },
})
