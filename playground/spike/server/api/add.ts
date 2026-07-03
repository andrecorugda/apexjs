import { defineApexRoute } from 'apexjs-core'
import { z } from 'zod'

// POST /api/add  AND  MCP tool "add" — from a single definition.
export default defineApexRoute({
  method: 'POST',
  description: 'Add two numbers and return their sum',
  input: { a: z.number(), b: z.number() },
  mcp: true,
  handler: ({ input }) => ({ sum: input.a + input.b }),
})
