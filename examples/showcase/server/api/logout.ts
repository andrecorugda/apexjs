import { defineApexRoute, useRuntimeConfig } from '@apex-stack/core'
import { logout } from '@apex-stack/core/server'

export default defineApexRoute({
  method: 'POST',
  description: 'Clear the session cookie',
  handler: async ({ event }) => {
    await logout(event, { password: String(useRuntimeConfig().sessionPassword) })
    return { ok: true }
  },
})
