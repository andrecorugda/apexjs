import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineCommand } from 'citty'

interface DataModule {
  createDb: (path: string) => { sqlite: unknown }
  applyMigrations: (sqlite: unknown, dir: string) => string[]
}

export const migrateCommand = defineCommand({
  meta: { name: 'migrate', description: 'Apply pending SQL migrations (db/migrations/*.sql)' },
  args: {
    db: { type: 'string', description: 'SQLite file path', default: 'data.db' },
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
      console.error('\n  @apex-stack/data is not installed in this project. Run: npm i @apex-stack/data\n')
      process.exit(1)
    }

    const { sqlite } = data.createDb(resolve(root, args.db))
    const applied = data.applyMigrations(sqlite, resolve(root, args.dir))
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(
      applied.length
        ? `\n  ✓ Applied ${applied.length} migration(s): ${applied.join(', ')}\n`
        : '\n  ✓ Up to date — no pending migrations.\n',
    )
  },
})
