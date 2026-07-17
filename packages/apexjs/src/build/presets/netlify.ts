import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DeployPreset, DeployPresetContext } from './types.js'

/**
 * Generate Netlify deploy config next to a server build: one Functions-v2 handler
 * (`netlify/functions/server.mjs`) serving the whole app via `createProdWebHandler`
 * (a Web fetch handler), plus `netlify.toml`. Commit them and run `netlify deploy`
 * (set DATABASE_URL / APEX_SESSION_PASSWORD in Netlify env).
 */
export function emitNetlifyPreset(root: string, outDir: string): void {
  mkdirSync(join(root, 'netlify', 'functions'), { recursive: true })
  writeFileSync(
    join(root, 'netlify', 'functions', 'server.mjs'),
    `import { fileURLToPath } from 'node:url'
import { createProdWebHandler } from '@apex-stack/core/server'

// Serves the whole built Apex app (SSR + /api + /mcp) as a Web fetch handler.
const dir = fileURLToPath(new URL('../../${outDir}', import.meta.url))
const handler = await createProdWebHandler({ dir })

export default (req) => handler(req)
export const config = { path: '/*', preferStatic: true }
`,
  )
  writeFileSync(
    join(root, 'netlify.toml'),
    `[build]
  command = "apex build --server"
  publish = "${outDir}"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  included_files = ["${outDir}/**"]
`,
  )
  console.log(
    `  ${'\x1b[36m'}Netlify${'\x1b[0m'} preset → wrote netlify/functions/server.mjs + netlify.toml\n` +
      '  Set DATABASE_URL + APEX_SESSION_PASSWORD in your Netlify env, then: netlify deploy\n',
  )
}

export const netlifyPreset: DeployPreset = {
  name: 'netlify',
  serverBuild: true,
  build({ root, outDir }: DeployPresetContext) {
    emitNetlifyPreset(root, outDir)
  },
}
