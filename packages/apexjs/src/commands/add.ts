import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { componentName } from '../components/registry.js'
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
    name: {
      type: 'positional',
      required: false,
      description: 'Component(s) to add, space-separated (e.g. button card modal)',
    },
    all: { type: 'boolean', default: false, description: 'Add every component in the registry' },
    root: { type: 'string', description: 'Project root', default: '.' },
    force: { type: 'boolean', default: false, description: 'Overwrite existing component files' },
  },
  run({ args }) {
    const registry = loadRegistry()
    const log = console.log
    process.stdout.write(banner())

    const keys = Object.keys(registry)
    if (!keys.length) {
      console.error(`  ${color.red('✗')} No component registry bundled in this build.\n`)
      process.exit(1)
    }

    // Collect requested names (all positionals, deduped, lowercased) or --all.
    const rest = (args._ as string[] | undefined) ?? []
    // Each name may carry a target folder, like a page: `ui/button` → registry
    // component `button` copied into `components/ui/`. The folder is created if missing.
    const requested = args.all
      ? keys.map((k) => ({ dir: '', key: k }))
      : [
          ...new Set(
            [...rest, ...(args.name ? [String(args.name)] : [])].map((s) => s.toLowerCase()),
          ),
        ].map((s) => {
          const clean = s.replace(/^\/+/, '')
          const i = clean.lastIndexOf('/')
          return i === -1
            ? { dir: '', key: clean }
            : { dir: clean.slice(0, i), key: clean.slice(i + 1) }
        })

    // No names → list what's available.
    if (!requested.length) {
      log(
        `  ${color.bold('Available components')}  ${color.gray('— apex add <name...> | --all')}\n`,
      )
      for (const k of keys) {
        log(`    ${color.cyan(k.padEnd(14))} ${color.gray(registry[k]?.description ?? '')}`)
      }
      log(
        `\n  ${color.gray('Pick several at once, e.g.')} ${color.cyan('apex add button card modal')}\n`,
      )
      return
    }

    const unknown = requested.filter((r) => !registry[r.key])
    if (unknown.length) {
      console.error(
        `  ${color.red('✗')} Unknown component(s): ${unknown.map((u) => u.key).join(', ')}. Run ${color.cyan('apex add')} to list.\n`,
      )
      process.exit(1)
    }

    const root = resolve(process.cwd(), String(args.root))
    const added: Array<{ rel: string; tag: string }> = []
    const skipped: string[] = []
    for (const { dir, key } of requested) {
      const entry = registry[key] as RegistryEntry
      const rel = dir ? `${dir}/${entry.name}` : entry.name
      const dest = join(root, 'components', `${rel}.alpine`)
      if (existsSync(dest) && !args.force) {
        skipped.push(rel)
        continue
      }
      mkdirSync(dirname(dest), { recursive: true })
      cpSync(join(REGISTRY_DIR, entry.file), dest)
      added.push({ rel, tag: componentName(rel) })
    }

    if (added.length) {
      log(
        `  ${color.green('+')} Added ${added.length} component(s) to ${color.bold('components/')}:`,
      )
      for (const { rel, tag } of added)
        log(`      ${color.green(`${rel}.alpine`)}  ${color.gray(`<${tag} />`)}`)
    }
    if (skipped.length) {
      log(
        `  ${color.gray(`• Skipped ${skipped.length} existing: ${skipped.join(', ')} (use --force)`)}`,
      )
    }

    // Components style via Tailwind + theme tokens — nudge if the project isn't wired.
    const appCss = ['app.css', 'styles/app.css', 'src/app.css']
      .map((p) => join(root, p))
      .find(existsSync)
    const themed = appCss ? readFileSync(appCss, 'utf8').includes('@theme') : false
    if (!themed && added.length) {
      log(
        `\n  ${color.gray('Tip: run')} ${color.cyan('apex theme')} ${color.gray('to set up Tailwind + the theme (apps from')} ${color.cyan('apex new')} ${color.gray('already have it).')}`,
      )
    }
    log('')
  },
})
