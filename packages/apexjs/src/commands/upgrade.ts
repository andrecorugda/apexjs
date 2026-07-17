import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { applyFeature, featureList } from '../features.js'
import { maybeSelfUpdate } from '../selfUpdate.js'
import { banner, color, VERSION } from '../ui.js'
import { offerExtension, promptYesNo } from '../vscode.js'

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

/** Latest published version of a package on npm, or null (offline / missing / timeout). */
function latestVersion(pkg: string): string | null {
  try {
    const r = spawnSync('npm', ['view', pkg, 'version'], {
      encoding: 'utf8',
      timeout: 5000,
      shell: process.platform === 'win32',
    })
    if (r.status !== 0 || !r.stdout) return null
    const v = r.stdout.trim()
    return /^\d+\.\d+\.\d+/.test(v) ? v : null
  } catch {
    return null
  }
}

/**
 * Bring every `@apex-stack/*` dependency to the latest PUBLISHED version.
 *
 * Pinned specs (`^x` / `~x` / `x`) are rewritten to `^<registry-latest>` — queried
 * per package from npm, NOT this CLI's own VERSION (so a project-local upgrade
 * isn't capped at the running version). Tag/range specs like `latest` are left
 * as-is but still counted so the caller reinstalls to pull the newest. Local
 * `file:` / `link:` / `workspace:` refs are left untouched.
 */
function syncApexDeps(root: string): {
  bumped: number
  apexDeps: number
  prod: string[]
  dev: string[]
} {
  const pkgPath = join(root, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  let bumped = 0
  let apexDeps = 0
  const prod: string[] = []
  const dev: string[] = []
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = pkg[field] as Record<string, string> | undefined
    if (!deps) continue
    for (const dep of Object.keys(deps)) {
      if (!dep.startsWith('@apex-stack/')) continue
      const spec = deps[dep] ?? ''
      if (/^(file:|link:|workspace:)/.test(spec)) continue
      apexDeps++
      ;(field === 'devDependencies' ? dev : prod).push(dep)
      // Only rewrite pinned numeric ranges; `latest`/tags refresh via the forced re-install below.
      if (/^[\d^~]/.test(spec)) {
        const latest = latestVersion(dep)
        const target = `^${latest ?? VERSION}`
        if (deps[dep] !== target) {
          deps[dep] = target
          bumped++
        }
      }
    }
  }
  if (bumped) writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  return { bumped, apexDeps, prod, dev }
}

function detectPm(): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
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
    install: {
      type: 'boolean',
      default: true,
      description: 'Run the package manager after bumping @apex-stack/* (use --no-install to skip)',
    },
    vscode: {
      type: 'boolean',
      description: 'Install the Apex VS Code extension (skip the prompt)',
    },
    self: {
      type: 'boolean',
      description: 'Update the global Apex CLI first if a newer one is published (default: ask)',
    },
    data: { type: 'boolean', description: 'Add the data/models feature (skips the prompt)' },
    auth: { type: 'boolean', description: 'Add the auth feature (skips the prompt)' },
    i18n: { type: 'boolean', description: 'Add the i18n feature (skips the prompt)' },
    pwa: { type: 'boolean', description: 'Add the PWA feature (skips the prompt)' },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), String(args.root))
    const log = console.log
    if (!existsSync(join(root, 'package.json'))) {
      console.error(`\n  ${color.red('✗')} No package.json in ${root} — is this an Apex project?\n`)
      process.exit(1)
    }

    // Refresh the global CLI first if it's behind — the extension + templates are
    // bundled inside a given build, so upgrading on a stale CLI applies stale
    // assets. Re-execs on the new engine (with --no-self) if it updates.
    const reexecArgv = [
      'upgrade',
      String(args.root),
      ...(args.force ? ['--force'] : []),
      ...(args.install === false ? ['--no-install'] : []),
      ...(args.vscode === true ? ['--vscode'] : args.vscode === false ? ['--no-vscode'] : []),
      ...(args.data === true ? ['--data'] : []),
      ...(args.auth === true ? ['--auth'] : []),
      ...(args.i18n === true ? ['--i18n'] : []),
      '--no-self',
    ]
    if (await maybeSelfUpdate(reexecArgv, args.self as boolean | undefined)) return

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
    if (added.length || updated.length) {
      log(`\n  ${color.gray(`${unchanged} existing file(s) left untouched.`)}`)
    }

    // Offer any optional feature NOT already installed (never re-offers one that's
    // present). A --data / --auth / --i18n flag adds it without prompting. Runs
    // before the dep sync below so a new feature's deps get installed too.
    for (const f of featureList()) {
      if (f.detect(root)) continue
      const flag = (args as Record<string, unknown>)[f.key] as boolean | undefined
      const want =
        flag !== undefined
          ? flag
          : await promptYesNo(
              `\n  Add ${color.bold(f.title)}? ${color.gray(`— ${f.summary}`)}`,
              false,
            )
      if (want) applyFeature(root, f.key, log)
    }

    // Bring @apex-stack/* deps to the latest PUBLISHED versions (registry-queried,
    // not this CLI's version). Pinned specs are rewritten; `latest`/ranges refresh
    // on the reinstall below.
    const { bumped, apexDeps, prod, dev } = syncApexDeps(root)
    if (bumped) log(`\n  ${color.cyan('↑')} Bumped ${bumped} @apex-stack/* dependency to latest`)

    if (!added.length && !updated.length && apexDeps === 0) {
      log(`\n  ${color.green('✓')} Already up to date.`)
    }

    // Reinstall whenever the project has @apex-stack/* deps — this applies pinned
    // bumps AND re-resolves `latest`/range specs to the newest published (the fix
    // for a stale node_modules that a bump alone wouldn't refresh). Skippable via
    // --no-install; never blocks in CI without a TTY.
    if (apexDeps > 0 && args.install) {
      const pm = detectPm()
      log(`\n  ${color.gray(`Installing latest with ${pm}…`)}`)
      // A plain `install` with a lockfile keeps `latest`/range specs pinned to the locked
      // version — npm reports "up to date" and nothing moves. Force re-resolution by
      // (re)installing each @apex-stack/* at @latest, which bumps the lockfile. `add` for
      // pnpm/yarn/bun, `install` for npm; `-D`/`--dev` keeps devDependencies in their section.
      const verb = pm === 'npm' ? 'install' : 'add'
      const devFlag = pm === 'yarn' || pm === 'bun' ? '--dev' : '-D'
      const run = (pkgs: string[], isDev: boolean): boolean => {
        if (!pkgs.length) return true
        const specs = pkgs.map((n) => `${n}@latest`)
        return (
          spawnSync(pm, [verb, ...(isDev ? [devFlag] : []), ...specs], {
            cwd: root,
            stdio: 'inherit',
            shell: process.platform === 'win32',
          }).status === 0
        )
      }
      const ok = run(prod, false) && run(dev, true)
      log(
        ok
          ? `  ${color.green('✓')} Dependencies updated to latest`
          : `  ${color.red('✗')} Install failed — run ${color.cyan(`${pm} install`)} yourself`,
      )
    } else if (apexDeps > 0) {
      log(
        `  ${color.gray('Run')} ${color.cyan(`${detectPm()} install`)} ${color.gray('to apply.')}`,
      )
    }

    // Offer the VS Code extension (prompt when interactive; --vscode / --no-vscode to skip it).
    const ext = await offerExtension(args.vscode as boolean | undefined)
    if (ext) log(`  ${color.green('✓')} ${ext}`)

    log(
      `\n  ${color.gray('Non-destructive: your files are never overwritten')}${
        args.force ? color.gray(' except with --force') : color.gray(' (use --force to re-sync)')
      }${color.gray('; package.json entries are only version-bumped.')}\n`,
    )
  },
})
