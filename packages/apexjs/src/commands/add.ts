import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { banner, color } from '../ui.js'

// The component registry is bundled into the package at build time
// (scripts/copy-templates.mjs copies it from @apex-stack/components).
const REGISTRY_DIR = fileURLToPath(new URL('../components', import.meta.url))

interface RegistryEntry {
  name: string
  file: string
  description: string
}

function loadRegistry(): Record<string, RegistryEntry> {
  const p = join(REGISTRY_DIR, 'registry.json')
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Record<string, RegistryEntry>
  } catch {
    return {}
  }
}

export const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Add a themeable component into your project (copies the .alpine source)',
  },
  args: {
    name: { type: 'positional', required: false, description: 'Component to add (e.g. button)' },
    root: { type: 'string', description: 'Project root', default: '.' },
    force: { type: 'boolean', default: false, description: 'Overwrite an existing component file' },
  },
  run({ args }) {
    const registry = loadRegistry()
    // biome-ignore lint/suspicious/noConsole: CLI output
    const log = console.log
    process.stdout.write(banner())

    const keys = Object.keys(registry)
    if (!keys.length) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.error(`  ${color.red('✗')} No component registry bundled in this build.\n`)
      process.exit(1)
    }

    // No name → list what's available.
    const name = args.name ? String(args.name).toLowerCase() : ''
    if (!name) {
      log(`  ${color.bold('Available components')}  ${color.gray('— apex add <name>')}\n`)
      for (const k of keys) {
        log(`    ${color.cyan(k.padEnd(12))} ${color.gray(registry[k]?.description ?? '')}`)
      }
      log('')
      return
    }

    const entry = registry[name]
    if (!entry) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.error(
        `  ${color.red('✗')} Unknown component "${name}". Available: ${keys.join(', ')}\n`,
      )
      process.exit(1)
    }

    const root = resolve(process.cwd(), String(args.root))
    const dest = join(root, 'components', `${entry.name}.alpine`)
    if (existsSync(dest) && !args.force) {
      log(
        `  ${color.gray('•')} ${entry.name} already exists at components/${entry.name}.alpine ${color.gray('(use --force to overwrite)')}\n`,
      )
      return
    }
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(join(REGISTRY_DIR, entry.file), dest)
    log(`  ${color.green('+')} Added ${color.bold(`components/${entry.name}.alpine`)}`)
    log(`\n  Use it:  ${color.cyan(`<${entry.name} />`)}  ${color.gray('in any page/component.')}`)

    // Components style via Tailwind + theme tokens — nudge if the project isn't wired.
    const appCss = ['app.css', 'styles/app.css', 'src/app.css']
      .map((p) => join(root, p))
      .find(existsSync)
    const themed = appCss ? readFileSync(appCss, 'utf8').includes('@theme') : false
    if (!themed) {
      log(
        `  ${color.gray('Tip: run')} ${color.cyan('apex theme')} ${color.gray('to set up Tailwind + the theme so it styles up (apps from')} ${color.cyan('apex new')} ${color.gray('already have it).')}`,
      )
    }
    log('')
  },
})
