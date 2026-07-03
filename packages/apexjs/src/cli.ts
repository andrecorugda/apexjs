#!/usr/bin/env node
import { resolve } from 'node:path'
import { defineCommand, runMain } from 'citty'
import { buildCommand } from './commands/build.js'
import { makeCommand } from './commands/make.js'
import { mcpCommand } from './commands/mcp.js'
import { migrateCommand } from './commands/migrate.js'
import { newCommand } from './commands/new.js'
import { startCommand } from './commands/start.js'
import { startDevServer } from './dev/server.js'
import { banner, color, ready, spinner } from './ui.js'

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
    process.stdout.write(banner())
    const sp = spinner(`Starting dev server${args.islands ? ' (islands mode)' : ''}…`)
    try {
      const { port: actual } = await startDevServer({ root, port, islands: args.islands })
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

const COMMANDS: Array<[string, string]> = [
  ['new', 'Scaffold a new app'],
  ['dev', 'Start the dev server (SSR + hydrate, API + MCP)'],
  ['build', 'Build for production (static, islands, or server)'],
  ['start', 'Run a production server build'],
  ['make', 'Generate a page, component, or API route'],
  ['migrate', 'Apply pending database migrations'],
  ['mcp', 'Inspect the MCP server — list or call tools'],
]

const main = defineCommand({
  meta: {
    name: 'apex',
    description: 'The full-stack meta-framework for Alpine.js',
  },
  subCommands: {
    new: newCommand,
    dev,
    build: buildCommand,
    start: startCommand,
    make: makeCommand,
    migrate: migrateCommand,
    mcp: mcpCommand,
  },
  // Shown for a bare `apex` (no subcommand): the brand banner + a command menu.
  run({ rawArgs }) {
    if (rawArgs.length > 0) return // a subcommand or --help was requested; let citty handle it
    process.stdout.write(banner())
    // biome-ignore lint/suspicious/noConsole: CLI output
    const log = console.log
    log(`  ${color.bold('Usage')}  ${color.gray('apex')} ${color.cyan('<command>')} ${color.gray('[options]')}\n`)
    log(`  ${color.bold('Commands')}`)
    for (const [name, desc] of COMMANDS) {
      log(`    ${color.cyan(`apex ${name}`.padEnd(13))} ${color.gray(desc)}`)
    }
    log(`\n  ${color.gray('Run')} ${color.cyan('apex <command> --help')} ${color.gray('for details.')}\n`)
  },
})

runMain(main)
