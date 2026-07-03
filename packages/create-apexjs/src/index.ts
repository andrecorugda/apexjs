import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand, runMain } from 'citty'

const TEMPLATE_DIR = fileURLToPath(new URL('../templates/default', import.meta.url))

const main = defineCommand({
  meta: {
    name: 'create-apexjs',
    description: 'Scaffold a new Apex JS app',
  },
  args: {
    dir: { type: 'positional', required: false, description: 'Target directory', default: 'apex-app' },
  },
  run({ args }) {
    const target = resolve(process.cwd(), args.dir)
    const name = basename(target)

    if (existsSync(target) && readdirSync(target).length > 0) {
      console.error(`\n  ✗ Target directory is not empty: ${target}\n`)
      process.exit(1)
    }

    // Recursively copy the template, then fix up files that npm can't ship as-is
    // and substitute the {{name}} placeholder.
    cpSync(TEMPLATE_DIR, target, { recursive: true })

    const gitignore = join(target, '_gitignore')
    if (existsSync(gitignore)) renameSync(gitignore, join(target, '.gitignore'))

    for (const rel of ['package.json', 'README.md']) {
      const file = join(target, rel)
      if (existsSync(file)) {
        writeFileSync(file, readFileSync(file, 'utf8').replaceAll('{{name}}', name))
      }
    }

    console.log(`
  \x1b[36mApex JS\x1b[0m app created in ${args.dir}

  Next steps:
    cd ${args.dir}
    npm install
    npm run dev          # http://localhost:3000
    npm run dev:islands  # static-first islands mode

  Your server/api/*.ts routes are also MCP tools at /mcp.
`)
  },
})

runMain(main)
