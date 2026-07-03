import { resolve } from 'node:path'
import { defineCommand } from 'citty'
import { banner, ready, spinner } from '../ui.js'

export const devCommand = defineCommand({
  meta: { name: 'dev', description: 'Start the Apex JS development server' },
  args: {
    root: { type: 'positional', required: false, description: 'Project root', default: '.' },
    port: { type: 'string', description: 'Port to listen on', default: '3000' },
    islands: { type: 'boolean', description: 'Render in islands mode (static-first)', default: false },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), String(args.root))
    const port = Number(args.port)
    process.stdout.write(banner())
    const sp = spinner(`Starting dev server${args.islands ? ' (islands mode)' : ''}…`)
    try {
      // Imported lazily so `apex new` / `apex --help` never load Vite + rollup.
      const { startDevServer } = await import('../dev/server.js')
      const { port: actual } = await startDevServer({ root, port, islands: Boolean(args.islands) })
      sp.succeed('Dev server ready')
      ready([
        ['Local', `http://localhost:${actual}/`],
        ['MCP', `http://localhost:${actual}/mcp`],
      ])
    } catch (err) {
      sp.fail('Failed to start the dev server')
      throw err
    }
  },
})
