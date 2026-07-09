import { useRuntimeConfig } from '@apex-stack/core'
import { sessionAuth } from '@apex-stack/core/server'

// Identity for the whole app. sessionAuth resolves the caller from the sealed
// (encrypted + signed, HttpOnly) session cookie and injects the result as
// ctx.user into every loader, API route and MCP tool. Anonymous → user = null.
// Swap this file for a JWT/OAuth adapter without touching any route.
export default sessionAuth({
  password: String(useRuntimeConfig().sessionPassword),
})
