import { defineApexRoute } from '@apex-stack/core'
import { z } from 'zod'

export default defineApexRoute({
  method: 'GET',
  description: 'Say hello to someone by name',
  input: { name: z.string() },
  mcp: true,
  handler: ({ input }) => ({ message: `Hello, ${input.name}!` }),
})
