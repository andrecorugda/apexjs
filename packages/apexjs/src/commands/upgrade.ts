import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { banner, color } from '../ui.js'

const TEMPLATE_DIR = fileURLToPath(new URL('../templates/default', import.meta.url))

// Never overwritten — the user owns these (deps, scripts, TS config, build config).
const PROTECTED = new Set(['package.json'])

function projectName(root: string): string {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name || basename(root)
  } catch {
    return basename(root)
  }
}

function walk(dir: string, onFile: (absFile: string) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, onFile)
    else onFile(p)
  }
}

/** Where a template file lands in the project (`_gitignore` → `.gitignore`). */
function targetRelPath(rel: string): string {
  return basename(rel) === '_gitignore' ? join(dirname(rel), '.gitignore') : rel
}

export const upgradeCommand = defineCommand({
  meta: {
    name: 'upgrade',
    description: 'Adopt new scaffold defaults in an existing app (non-destructive)',
  },
  args: {
    root: { type: 'positional', required: false, description: 'Project root', default: '.' },
    force: {
      type: 'boolean',
      default: false,
      description: 'Re-sync files that differ from the template (package.json is always preserved)',
    },
  },
  run({ args }) {
    const root = resolve(process.cwd(), String(args.root))
    // biome-ignore lint/suspicious/noConsole: CLI output
    const log = console.log
    if (!existsSync(join(root, 'package.json'))) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.error(`\n  ${color.red('✗')} No package.json in ${root} — is this an Apex project?\n`)
      process.exit(1)
    }

    const name = projectName(root)
    process.stdout.write(banner())

    const added: string[] = []
    const updated: string[] = []
    let unchanged = 0

    walk(TEMPLATE_DIR, (absFile) => {
      const rel = targetRelPath(relative(TEMPLATE_DIR, absFile))
      const target = join(root, rel)
      let content = readFileSync(absFile, 'utf8')
      if (content.includes('{{name}}')) content = content.replaceAll('{{name}}', name)

      if (!existsSync(target)) {
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, content)
        added.push(rel)
        return
      }
      if (args.force && !PROTECTED.has(rel)) {
        if (readFileSync(target, 'utf8') !== content) {
          writeFileSync(target, content)
          updated.push(rel)
          return
        }
      }
      unchanged++
    })

    if (added.length) {
      log(`\n  ${color.green('+')} Added ${added.length} new file(s):`)
      for (const f of added.sort()) log(`      ${color.green(f)}`)
    }
    if (updated.length) {
      log(`\n  ${color.cyan('~')} Re-synced ${updated.length} file(s):`)
      for (const f of updated.sort()) log(`      ${color.cyan(f)}`)
    }
    if (!added.length && !updated.length) {
      log(`\n  ${color.green('✓')} Already up to date — no new scaffold defaults to add.`)
    } else {
      log(`\n  ${color.gray(`${unchanged} existing file(s) left untouched.`)}`)
    }

    log(
      `\n  ${color.gray('Non-destructive: existing files are never overwritten')}${
        args.force ? color.gray(' except with --force') : color.gray(' (use --force to re-sync)')
      }${color.gray('; package.json is always preserved.')}`,
    )
    log(
      `  ${color.gray('Bump the runtime separately:')} ${color.cyan('npm i @apex-stack/core@latest')}\n`,
    )
  },
})
