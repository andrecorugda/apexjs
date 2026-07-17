import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DeployPreset, DeployPresetContext } from './types.js'

/**
 * Generate Vercel deploy config next to a server build: one serverless function
 * (`api/index.mjs`) that serves the whole app via `createProdNodeHandler`, plus a
 * `vercel.json` that rewrites everything to it. Idempotent; commit the two files
 * and run `vercel deploy` (set DATABASE_URL / APEX_SESSION_PASSWORD in Vercel env).
 */
export function emitVercelPreset(root: string, outDir: string): void {
  mkdirSync(join(root, 'api'), { recursive: true })
  writeFileSync(
    join(root, 'api', 'index.mjs'),
    `import { fileURLToPath } from 'node:url'
import { createProdNodeHandler } from '@apex-stack/core/server'

// Serves the whole built Apex app (SSR + /api + /mcp + static) from one function.
const dir = fileURLToPath(new URL('../${outDir}', import.meta.url))
const handler = await createProdNodeHandler({ dir })

export default (req, res) => handler(req, res)
`,
  )
  writeFileSync(
    join(root, 'vercel.json'),
    `${JSON.stringify(
      {
        $schema: 'https://openapi.vercel.sh/vercel.json',
        framework: null,
        buildCommand: 'apex build --server',
        installCommand: 'npm install',
        functions: { 'api/index.mjs': { includeFiles: `${outDir}/**`, maxDuration: 30 } },
        rewrites: [{ source: '/(.*)', destination: '/api/index' }],
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    `  ${'\x1b[36m'}Vercel${'\x1b[0m'} preset → wrote api/index.mjs + vercel.json\n` +
      '  Set DATABASE_URL + APEX_SESSION_PASSWORD in your Vercel env, then: vercel deploy\n',
  )
}

export const vercelPreset: DeployPreset = {
  name: 'vercel',
  serverBuild: true,
  build({ root, outDir }: DeployPresetContext) {
    emitVercelPreset(root, outDir)
  },
}
