import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { defineCommand, runMain } from 'citty'

const TEMPLATE_DIR = fileURLToPath(new URL('../templates/default', import.meta.url))

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
    // On Windows, npm/pnpm/yarn are .cmd shims that need a shell.
    shell: process.platform === 'win32',
  })
  return res.status === 0
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
    dir: { type: 'positional', required: false, description: 'Target directory', default: 'apex-app' },
    install: { type: 'boolean', default: true, description: 'Install dependencies (use --no-install to skip)' },
    git: { type: 'boolean', default: true, description: 'Initialize a git repository (use --no-git to skip)' },
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

    console.log(`\n  ${c.cyan('Apex JS')} app created in ${args.dir}`)

    const pm = detectPackageManager()

    // Initialize git (like create-next-app / nuxi) — best-effort, never fatal.
    let gitOk = false
    if (args.git) {
      const hasGit = spawnSync('git', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' }).status === 0
      if (hasGit && run('git', ['init', '-q'], target, true)) {
        run('git', ['add', '-A'], target, true)
        run('git', ['commit', '-m', 'Initial commit from Apex JS', '--no-gpg-sign'], target, true)
        gitOk = true
      }
    }

    // Install dependencies with the detected package manager.
    let installed = false
    if (args.install) {
      console.log(`\n  Installing dependencies with ${c.cyan(pm)}…\n`)
      installed = run(pm, ['install'], target)
      if (!installed) {
        console.log(`\n  ${c.yellow('⚠')}  Dependency install failed — run it yourself after cd'ing in.\n`)
      }
    }

    // Package-manager-aware run commands.
    const runPrefix = pm === 'npm' ? 'npm run' : pm

    const steps: string[] = [`cd ${args.dir}`]
    if (!installed) steps.push(pm === 'yarn' ? 'yarn' : `${pm} install`)
    steps.push(`${runPrefix} dev          ${c.dim('# http://localhost:3000')}`)
    steps.push(`${runPrefix} dev:islands  ${c.dim('# static-first islands mode')}`)

    console.log(`
  ${installed ? c.green('Ready.') : 'Next steps:'}
${steps.map((s) => `    ${s}`).join('\n')}

  ${gitOk ? c.dim('Git repository initialized.') : ''}
  Your server/api/*.ts routes are also MCP tools at /mcp.
`)
  },
})

runMain(main)
