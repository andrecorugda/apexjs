import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The optional user client hook. If `app.client.ts` (or `.js`) exists at the app
 * root, its default export — `(Alpine) => void` — is imported and called **before
 * `Alpine.start()`** in every client bootstrap (dev, prod build, islands). That's
 * where an app registers Alpine plugins, custom directives, and magics:
 *
 *   // app.client.ts
 *   import persist from '@alpinejs/persist'
 *   export default (Alpine) => { Alpine.plugin(persist) }
 *
 * Returns the root-absolute module id (forward slashes, for Vite) or null.
 */
export function clientEntryId(root: string): string | null {
  for (const name of ['app.client.ts', 'app.client.js']) {
    if (existsSync(join(root, name))) return `/${name}`
  }
  return null
}
