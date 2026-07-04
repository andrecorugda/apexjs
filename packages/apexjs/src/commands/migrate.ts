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
}

export const migrateCommand = defineCommand({
  meta: { name: 'migrate', description: 'Apply pending SQL migrations (db/migrations/*.sql)' },
  args: {
    db: { type: 'string', description: 'SQLite file path (libSQL)', default: 'data.db' },
    driver: { type: 'string', description: 'sqlite | postgres | pglite', default: 'sqlite' },
    url: { type: 'string', description: 'Connection URL (postgres) — overrides --db' },
    dir: { type: 'string', description: 'Migrations directory', default: 'db/migrations' },
    root: { type: 'string', description: 'Project root', default: '.' },
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
    const applied = await data.applyMigrations(handle, resolve(root, args.dir))
    await handle.close()
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(
      applied.length
        ? `\n  ✓ Applied ${applied.length} migration(s): ${applied.join(', ')}\n`
        : '\n  ✓ Up to date — no pending migrations.\n',
    )
  },
})
