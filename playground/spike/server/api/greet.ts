import { defineApexRoute } from 'apexjs-core'
import { z } from 'zod'

// GET /api/greet?name=...  AND  MCP tool "greet".
export default defineApexRoute({
  method: 'GET',
  description: 'Greet a person by name',
  input: { name: z.string() },
  mcp: true,
  handler: ({ input }) => ({ message: `Hello, ${input.name}!` }),
})
