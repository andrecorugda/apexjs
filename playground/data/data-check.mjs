// Go/no-go: prove one Drizzle table → REST endpoints AND MCP tools on one DB.
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const port = process.argv[2] ?? '3420'
const base = `http://localhost:${port}`
const json = (r) => r.json()

// 1. Create via REST.
const created = await fetch(`${base}/api/todos`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'via REST' }),
}).then(json)
assert.equal(created.text, 'via REST')
assert.ok(typeof created.id === 'number', 'create returns an id')
assert.equal(created.done, false, 'default applied')

// 2. Create via an MCP tool (as an AI client would); full CRUD tool surface.
const client = new Client({ name: 'apex-data-check', version: '1.0.0' })
await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)))
const toolNames = (await client.listTools()).tools.map((t) => t.name).sort()
assert.deepEqual(toolNames, [
  'todos_create',
  'todos_delete',
  'todos_get',
  'todos_list',
  'todos_update',
])
await client.callTool({ name: 'todos_create', arguments: { text: 'via MCP', done: true } })
await client.close()

// 3. Both writes are visible through the same REST list — one DB, two surfaces.
const list = await fetch(`${base}/api/todos`).then(json)
const texts = list.map((t) => t.text)
assert.ok(texts.includes('via REST'), 'REST-created row present')
assert.ok(texts.includes('via MCP'), 'MCP-created row present in REST list')

// 4. Dynamic get by id.
const one = await fetch(`${base}/api/todos/${created.id}`).then(json)
assert.equal(one.id, created.id)
assert.equal(one.text, 'via REST')

// 5. Update (PATCH, partial) and delete (DELETE).
const updated = await fetch(`${base}/api/todos/${created.id}`, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ done: true }),
}).then(json)
assert.equal(updated.done, true)
assert.equal(updated.text, 'via REST', 'partial update leaves other fields intact')

await fetch(`${base}/api/todos/${created.id}`, { method: 'DELETE' })
const afterDelete = await fetch(`${base}/api/todos`).then(json)
assert.ok(!afterDelete.some((t) => t.id === created.id), 'deleted row is gone')

console.log(
  `✓ data check passed — full CRUD over REST + MCP on one Drizzle/SQLite DB (${afterDelete.length} todos remain)`,
)
