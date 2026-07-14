#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import { newCommand } from './commands/new.js'
import { banner, color, VERSION } from './ui.js'

// Heavy commands (dev/build/start/make/migrate/mcp) are imported lazily so that
// `apex new`, the banner, and `--help` never pull in Vite + rollup — which can
// crash on a broken/mismatched native rollup binary (npm optional-deps bug).

const COMMANDS: Array<[string, string]> = [
  ['new', 'Scaffold a new app'],
  ['dev', 'Start the dev server (SSR + hydrate, API + MCP)'],
  ['build', 'Build for production (static, islands, or server)'],
  ['mobile', 'Package as an offline native app (Android)'],
  ['start', 'Run a production server build'],
  ['make', 'Generate a page, component, route, store, middleware…'],
  ['add', 'Add a themeable component (button, card, badge…)'],
  ['extend', 'Add an optional feature (data, auth, i18n)'],
  ['theme', 'Write/update your theme tokens (colors, radius, fonts)'],
  ['upgrade', 'Adopt new scaffold defaults (non-destructive)'],
  ['migrate', 'Apply pending database migrations'],
  ['check', 'Type-check the app (fast with the native compiler)'],
  ['mcp', 'Inspect the MCP server — list or call tools'],
  ['mcp-server', 'Run an MCP server exposing the CLI as tools (for AI agents)'],
  ['test', 'Run your tests with Vitest'],
]

const main = defineCommand({
  meta: {
    name: 'apex',
    version: VERSION,
    description: 'The full-stack meta-framework for Alpine.js',
  },
  subCommands: {
    new: newCommand,
    dev: () => import('./commands/dev.js').then((m) => m.devCommand),
    build: () => import('./commands/build.js').then((m) => m.buildCommand),
    mobile: () => import('./commands/mobile.js').then((m) => m.mobileCommand),
    start: () => import('./commands/start.js').then((m) => m.startCommand),
    make: () => import('./commands/make.js').then((m) => m.makeCommand),
    add: () => import('./commands/add.js').then((m) => m.addCommand),
    extend: () => import('./commands/extend.js').then((m) => m.extendCommand),
    theme: () => import('./commands/theme.js').then((m) => m.themeCommand),
    upgrade: () => import('./commands/upgrade.js').then((m) => m.upgradeCommand),
    migrate: () => import('./commands/migrate.js').then((m) => m.migrateCommand),
    check: () => import('./commands/check.js').then((m) => m.checkCommand),
    mcp: () => import('./commands/mcp.js').then((m) => m.mcpCommand),
    'mcp-server': () => import('./commands/mcp-server.js').then((m) => m.mcpServerCommand),
    test: () => import('./commands/test.js').then((m) => m.testCommand),
  },
  // Shown for a bare `apex` (no subcommand): the brand banner + a command menu.
  run({ rawArgs }) {
    if (rawArgs.length > 0) return // a subcommand or --help was requested; let citty handle it
    process.stdout.write(banner())
    const log = console.log
    log(
      `  ${color.bold('Usage')}  ${color.gray('apex')} ${color.cyan('<command>')} ${color.gray('[options]')}\n`,
    )
    log(`  ${color.bold('Commands')}`)
    for (const [name, desc] of COMMANDS) {
      log(`    ${color.cyan(`apex ${name}`.padEnd(13))} ${color.gray(desc)}`)
    }
    log(
      `\n  ${color.gray('Run')} ${color.cyan('apex <command> --help')} ${color.gray('for details.')}\n`,
    )
  },
})

runMain(main)
