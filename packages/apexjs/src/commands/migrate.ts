import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineCommand } from 'citty'

interface DbHandle {
  close(): Promise<void>
}
interface DataModule {
  createDb: (config: unknown) => Promise<DbHandle>
  applyMigrations: (handle: DbHandle, dir: string) => Promise<string[]>
  rollbackMigrations: (
    handle: DbHandle,
    dir: string,
    steps?: number,
  ) => Promise<{ reverted: string[]; blocked: string | null }>
}

export const migrateCommand = defineCommand({
  meta: {
    name: 'migrate',
    description: 'Apply pending SQL migrations (or --rollback the last one)',
  },
  args: {
    db: { type: 'string', description: 'SQLite file path (libSQL)', default: 'data.db' },
    driver: { type: 'string', description: 'sqlite | postgres | pglite', default: 'sqlite' },
    url: { type: 'string', description: 'Connection URL (postgres) — overrides --db' },
    dir: { type: 'string', description: 'Migrations directory', default: 'db/migrations' },
    root: { type: 'string', description: 'Project root', default: '.' },
    rollback: { type: 'boolean', description: 'Revert the most recent migration(s)' },
    steps: { type: 'string', description: 'How many migrations to roll back', default: '1' },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)

    // Resolve @apex-stack/data from the app (not the CLI's own location) so it works
    // under pnpm's strict node_modules layout.
    let data: DataModule
    try {
      const require = createRequire(join(root, 'package.json'))
      data = (await import(pathToFileURL(require.resolve('@apex-stack/data')).href)) as DataModule
    } catch {
      console.error(
        '\n  @apex-stack/data is not installed in this project. Run: npm i @apex-stack/data\n',
      )
      process.exit(1)
    }

    const config =
      args.driver === 'postgres'
        ? { driver: 'postgres', url: args.url }
        : args.driver === 'pglite'
          ? { driver: 'pglite', dir: args.url }
          : resolve(root, args.db)
    const handle = await data.createDb(config)
    const dir = resolve(root, args.dir)
    // biome-ignore lint/suspicious/noConsole: CLI output
    const log = console.log

    if (args.rollback) {
      const steps = Math.max(1, Number.parseInt(String(args.steps), 10) || 1)
      const { reverted, blocked } = await data.rollbackMigrations(handle, dir, steps)
      await handle.close()
      if (reverted.length) log(`\n  ↩ Rolled back ${reverted.length}: ${reverted.join(', ')}`)
      if (blocked) {
        log(
          `  ⚠ Stopped at ${blocked} — it has no \`-- @down\` section (or its file is gone), so it can't be reverted.`,
        )
      }
      if (!reverted.length && !blocked) log('\n  ✓ Nothing to roll back.')
      log('')
      return
    }

    const applied = await data.applyMigrations(handle, dir)
    await handle.close()
    log(
      applied.length
        ? `\n  ✓ Applied ${applied.length} migration(s): ${applied.join(', ')}\n`
        : '\n  ✓ Up to date — no pending migrations.\n',
    )
  },
})
