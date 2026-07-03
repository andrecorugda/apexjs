// Go/no-go check: a real MCP client against the Apex dev server's /mcp endpoint.
// Proves that `defineApexRoute({ mcp: true })` routes are live, schema-carrying,
// callable MCP tools. Exits non-zero on any mismatch.
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const port = process.argv[2] ?? '3170'
const client = new Client({ name: 'apex-mcp-check', version: '1.0.0' })
await client.connect(new StreamableHTTPClientTransport(new URL(`http://localhost:${port}/mcp`)))

const { tools } = await client.listTools()
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

// 1. Both routes surfaced as tools with their route descriptions.
assert.ok(byName.add, 'add tool missing')
assert.ok(byName.greet, 'greet tool missing')
assert.equal(byName.add.description, 'Add two numbers and return their sum')

// 2. Input schema derived from the zod contract.
assert.equal(byName.add.inputSchema.properties.a.type, 'number')
assert.equal(byName.add.inputSchema.properties.b.type, 'number')

// 3. Tools execute the same handler as the REST route.
const add = await client.callTool({ name: 'add', arguments: { a: 2, b: 3 } })
assert.equal(JSON.parse(add.content[0].text).sum, 5)
const greet = await client.callTool({ name: 'greet', arguments: { name: 'Apex' } })
assert.equal(JSON.parse(greet.content[0].text).message, 'Hello, Apex!')

await client.close()
console.log('✓ MCP check passed: routes are live MCP tools (list + schema + call)')
