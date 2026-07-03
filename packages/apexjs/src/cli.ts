import { resolve } from 'node:path'
import { defineCommand, runMain } from 'citty'
import { buildCommand } from './commands/build.js'
import { makeCommand } from './commands/make.js'
import { mcpCommand } from './commands/mcp.js'
import { migrateCommand } from './commands/migrate.js'
import { startDevServer } from './dev/server.js'

const dev = defineCommand({
  meta: { name: 'dev', description: 'Start the Apex JS development server' },
  args: {
    root: { type: 'positional', required: false, description: 'Project root', default: '.' },
    port: { type: 'string', description: 'Port to listen on', default: '3000' },
    islands: { type: 'boolean', description: 'Render in islands mode (static-first)', default: false },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const port = Number(args.port)
    const { port: actual } = await startDevServer({ root, port, islands: args.islands })
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`\n  \x1b[36mApex JS\x1b[0m dev server ready\n  → http://localhost:${actual}\n`)
  },
})

const main = defineCommand({
  meta: {
    name: 'apex',
    description: 'The full-stack meta-framework for Alpine.js',
  },
  subCommands: {
    dev,
    build: buildCommand,
    make: makeCommand,
    migrate: migrateCommand,
    mcp: mcpCommand,
  },
})

runMain(main)
