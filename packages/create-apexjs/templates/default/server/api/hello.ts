import { defineApexRoute } from '@apex-stack/core'
import { z } from 'zod'
import { GreetingService } from '../../services/GreetingService'

const greetings = new GreetingService()

/**
 * A route is a thin adapter: validate input, delegate to a service, return the
 * result. Because `mcp: true`, this is ALSO an MCP tool named "hello" at /mcp —
 * one definition, REST + AI-callable.
 */
export default defineApexRoute({
  method: 'GET',
  description: 'Greet someone by name',
  input: { name: z.string() },
  mcp: true,
  handler: ({ input }) => greetings.greet(input.name),
})
