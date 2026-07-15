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
    quiet: { type: 'boolean', description: 'Disable per-request log lines (or APEX_LOG=off)' },
  },
  async run({ args }) {
    const dir = resolve(process.cwd(), args.dir)
    if (!existsSync(join(dir, 'apex-manifest.json'))) {
      console.error(`\n  No build found in ${args.dir}/. Run \`apex build --server\` first.\n`)
      process.exit(1)
    }
    const requestLog = !args.quiet && process.env.APEX_LOG !== 'off'
    const { port, close } = await startProdServer({ dir, port: Number(args.port), requestLog })
    console.log(`\n  \x1b[36mApex JS\x1b[0m production server\n  → http://localhost:${port}\n`)

    // Graceful shutdown: first signal drains in-flight requests + closes DB pools;
    // a second signal force-exits (escape hatch if a hook hangs).
    let closing = false
    for (const signal of ['SIGTERM', 'SIGINT'] as const) {
      process.on(signal, () => {
        if (closing) {
          console.error('  Forced exit.')
          process.exit(1)
        }
        closing = true
        console.log(`\n  ${signal} — shutting down gracefully (Ctrl+C again to force)…`)
        close()
          .then(() => process.exit(0))
          .catch(() => process.exit(1))
      })
    }
  },
})
