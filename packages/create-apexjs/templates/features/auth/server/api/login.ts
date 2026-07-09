import { defineApexRoute, useRuntimeConfig } from '@apex-stack/core'
import { login } from '@apex-stack/core/server'
import { z } from 'zod'

// Demo login: accept a name and seal it into the session. A real app would
// verify a password / OAuth code here first, then call login() with the result.
export default defineApexRoute({
  method: 'POST',
  description: 'Log in (demo: name only) and start a session',
  input: { name: z.string().min(1) },
  handler: async ({ input, event }) => {
    const user = { id: input.name.toLowerCase().replace(/\s+/g, '-'), name: input.name }
    await login(event, { user }, { password: String(useRuntimeConfig().sessionPassword) })
    return { user }
  },
})
