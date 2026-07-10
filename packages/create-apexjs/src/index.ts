import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { defineCommand, runMain } from 'citty'

const TEMPLATE_DIR = fileURLToPath(new URL('../templates/default', import.meta.url))

/**
 * Optional features the installed CLI can add via `apex extend <name>`. Kept as a
 * tiny local list (key + title) so this scaffolder stays dependency-light — it
 * must NOT import @apex-stack/core's features.ts. The keys mirror it exactly.
 */
const FEATURES: { key: 'data' | 'auth' | 'i18n'; title: string }[] = [
  { key: 'data', title: 'Data & models' },
  { key: 'auth', title: 'Auth' },
  { key: 'i18n', title: 'i18n' },
]

/** Replace the `{{name}}` placeholder in every scaffolded file. */
function substituteName(dir: string, name: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) substituteName(p, name)
    else {
      const txt = readFileSync(p, 'utf8')
      if (txt.includes('{{name}}')) writeFileSync(p, txt.replaceAll('{{name}}', name))
    }
  }
}

/** Detect the package manager the user invoked us with (npm/pnpm/yarn/bun). */
function detectPackageManager(): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}

/** Run a command in the target dir, inheriting stdio. Returns true on success. */
function run(cmd: string, cmdArgs: string[], cwd: string, quiet = false): boolean {
  const res = spawnSync(cmd, cmdArgs, {
    cwd,
    stdio: quiet ? 'ignore' : 'inherit',
    // On Windows, npm/pnpm/yarn/npx are .cmd shims that need a shell.
    shell: process.platform === 'win32',
  })
  return res.status === 0
}

/** Minimal readline yes/no prompt. Returns `def` on an empty answer. */
function promptYesNo(question: string, def = false): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((res) => {
    rl.question(`${question} ${c.dim(def ? '(Y/n)' : '(y/N)')} `, (ans) => {
      rl.close()
      const a = ans.trim().toLowerCase()
      res(a === '' ? def : a === 'y' || a === 'yes')
    })
  })
}

const c = {
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
}

const main = defineCommand({
  meta: {
    name: 'create-apexjs',
    description: 'Scaffold a new Apex JS app',
  },
  args: {
    dir: {
      type: 'positional',
      required: false,
      description: 'Target directory',
      default: 'apex-app',
    },
    install: {
      type: 'boolean',
      default: true,
      description: 'Install dependencies (use --no-install to skip)',
    },
    git: {
      type: 'boolean',
      default: true,
      description: 'Initialize a git repository (use --no-git to skip)',
    },
    data: {
      type: 'boolean',
      description: 'Include the data/models feature (skips the prompt)',
    },
    auth: {
      type: 'boolean',
      description: 'Include the auth feature (skips the prompt)',
    },
    i18n: {
      type: 'boolean',
      description: 'Include the i18n feature (skips the prompt)',
    },
  },
  async run({ args }) {
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

    substituteName(target, name)

    console.log(`\n  ${c.cyan('Apex JS')} app created in ${args.dir}`)

    const pm = detectPackageManager()

    // Optional features — honor an explicit --data/--auth/--i18n flag; otherwise
    // prompt (interactive TTY only); otherwise (CI) default to none. Selection
    // happens now, but the features are applied AFTER install (see below), since
    // `apex extend` needs @apex-stack/core on disk.
    const selected: string[] = []
    let headerShown = false
    for (const f of FEATURES) {
      const flag = (args as Record<string, unknown>)[f.key] as boolean | undefined
      let want = false
      if (flag !== undefined) {
        want = flag
      } else if (process.stdin.isTTY) {
        if (!headerShown) {
          console.log(
            `\n  ${c.cyan('Optional features')} ${c.dim("(add later anytime with 'apex extend <name>')")}`,
          )
          headerShown = true
        }
        want = await promptYesNo(`  Add ${f.title}?`, false)
      }
      if (want) selected.push(f.key)
    }

    // Install dependencies with the detected package manager.
    // For npm, skip the audit + fund passes — the audit call is a common source
    // of long "stuck" hangs after the packages are already on disk.
    let installed = false
    if (args.install) {
      console.log(
        `\n  Installing dependencies with ${c.cyan(pm)}… ${c.dim('(first install can take a minute)')}\n`,
      )
      const installArgs = pm === 'npm' ? ['install', '--no-audit', '--no-fund'] : ['install']
      installed = run(pm, installArgs, target)
      if (!installed) {
        console.log(
          `\n  ${c.yellow('⚠')}  Dependency install failed — run it yourself after cd'ing in.\n`,
        )
      }
    }

    // Apply the selected features via the installed CLI's `apex extend <feature>`.
    // npx resolves the local `apex` bin from the freshly installed node_modules.
    // Best-effort throughout — a feature failure warns but never aborts.
    const applied: string[] = []
    if (selected.length) {
      if (installed) {
        console.log(`\n  Adding features: ${c.cyan(selected.join(', '))}…\n`)
        for (const key of selected) {
          if (run('npx', ['apex', 'extend', key], target)) applied.push(key)
          else
            console.log(
              `\n  ${c.yellow('⚠')}  Could not add ${key} — run ${c.cyan(`npx apex extend ${key}`)} yourself.\n`,
            )
        }
      } else {
        // No deps on disk (--no-install or a failed install) → extend can't run.
        console.log(
          `\n  ${c.yellow('⚠')}  Features ${selected.join(', ')} need dependencies — after installing, run: ${c.cyan(
            selected.map((k) => `apex extend ${k}`).join(' && '),
          )}\n`,
        )
      }
    }

    // Initialize git LAST (like create-next-app / nuxi) — best-effort, never
    // fatal — so any features applied above land in the initial commit.
    let gitOk = false
    if (args.git) {
      const hasGit =
        spawnSync('git', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' })
          .status === 0
      if (hasGit && run('git', ['init', '-q'], target, true)) {
        run('git', ['add', '-A'], target, true)
        run('git', ['commit', '-m', 'Initial commit from Apex JS', '--no-gpg-sign'], target, true)
        gitOk = true
      }
    }

    // Package-manager-aware run commands.
    const runPrefix = pm === 'npm' ? 'npm run' : pm

    const steps: string[] = [`cd ${args.dir}`]
    if (!installed) steps.push(pm === 'yarn' ? 'yarn' : `${pm} install`)
    steps.push(
      `${runPrefix} dev          ${c.dim('# start the dev server → http://localhost:3000')}`,
    )

    const featuresNote = applied.length
      ? `\n  ${c.green('Features added:')} ${c.cyan(applied.join(', '))} ${c.dim("(add more with 'apex extend <name>')")}`
      : ''

    console.log(`
  ${installed ? c.green('Ready.') : 'Next steps:'}
${steps.map((s) => `    ${s}`).join('\n')}
${featuresNote}
  ${c.yellow('Run the CLI with:')} ${c.cyan(`${runPrefix} dev`)}   ${c.dim('(or ' + 'npx apex dev' + ')')}
        A bare ${c.cyan('apex')} won't resolve — it's a local dependency, like ${c.cyan('next')} or ${c.cyan('vite')}.
        ${c.dim('Prefer a global command? ')}${c.cyan('npm i -g @apex-stack/core')}${c.dim(' → then `apex dev` works anywhere.')}
  ${c.dim('Islands mode:')} ${runPrefix} dev:islands
  ${gitOk ? c.dim('Git repository initialized. ') : ''}Your server/api/*.ts routes are also MCP tools at /mcp.
`)
  },
})

runMain(main)
