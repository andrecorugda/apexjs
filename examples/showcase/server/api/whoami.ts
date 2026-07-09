import { defineApexRoute } from '@apex-stack/core'

// A gated route: `auth: true` → 401 for anonymous callers, and it's hidden from
// the MCP tool list for users who can't reach it. ctx.user is the session identity.
export default defineApexRoute({
  method: 'GET',
  description: 'Return the currently signed-in user',
  auth: true,
  mcp: true,
  handler: ({ user }) => ({ user }),
})
