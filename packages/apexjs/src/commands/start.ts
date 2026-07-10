import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineCommand } from 'citty'
import { startProdServer } from '../prod/server.js'

export const startCommand = defineCommand({
  meta: { name: 'start', description: 'Run a production build (from `apex build --server`)' },
  args: {
    dir: { type: 'positional', required: false, description: 'Build directory', default: 'dist' },
    port: {
      type: 'string',
      description: 'Port to listen on (defaults to $PORT, then 3000 — for Railway/Render/Fly/etc.)',
      default: process.env.PORT || '3000',
    },
  },
  async run({ args }) {
    const dir = resolve(process.cwd(), args.dir)
    if (!existsSync(join(dir, 'apex-manifest.json'))) {
      console.error(`\n  No build found in ${args.dir}/. Run \`apex build --server\` first.\n`)
      process.exit(1)
    }
    const { port } = await startProdServer({ dir, port: Number(args.port) })
    console.log(`\n  \x1b[36mApex JS\x1b[0m production server\n  → http://localhost:${port}\n`)
  },
})
