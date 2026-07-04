import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { banner, color, spinner } from '../ui.js'

const TEMPLATE_DIR = fileURLToPath(new URL('../templates/default', import.meta.url))

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

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

/** Detect the package manager the user invoked us with. */
function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}

/** Synchronous, silent command (git plumbing). Returns true on success. */
function runSync(cmd: string, args: string[], cwd: string): boolean {
  return (
    spawnSync(cmd, args, { cwd, stdio: 'ignore', shell: process.platform === 'win32' }).status === 0
  )
}

/** Async install so the spinner can animate while it runs. */
function installAsync(pm: PackageManager, cwd: string): Promise<boolean> {
  const args = pm === 'npm' ? ['install', '--no-audit', '--no-fund'] : ['install']
  return new Promise((res) => {
    const child = spawn(pm, args, { cwd, stdio: 'ignore', shell: process.platform === 'win32' })
    child.on('close', (code) => res(code === 0))
    child.on('error', () => res(false))
  })
}

export const newCommand = defineCommand({
  meta: { name: 'new', description: 'Scaffold a new Apex JS app' },
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
  },
  async run({ args }) {
    const dir = String(args.dir)
    const target = resolve(process.cwd(), dir)
    const name = basename(target)

    process.stdout.write(banner())
    // biome-ignore lint/suspicious/noConsole: CLI output
    const log = console.log

    if (existsSync(target) && readdirSync(target).length > 0) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.error(`  ${color.red('✗')} Target directory is not empty: ${target}\n`)
      process.exit(1)
    }

    cpSync(TEMPLATE_DIR, target, { recursive: true })
    const gitignore = join(target, '_gitignore')
    if (existsSync(gitignore)) renameSync(gitignore, join(target, '.gitignore'))
    substituteName(target, name)
    log(`  ${color.green('✓')} Created ${color.bold(dir)}`)

    const pm = detectPackageManager()

    let gitOk = false
    if (args.git) {
      const hasGit =
        spawnSync('git', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' })
          .status === 0
      if (hasGit && runSync('git', ['init', '-q'], target)) {
        runSync('git', ['add', '-A'], target)
        runSync('git', ['commit', '-m', 'Initial commit from Apex JS', '--no-gpg-sign'], target)
        gitOk = true
      }
    }
    if (gitOk) log(`  ${color.green('✓')} Initialized a git repository`)

    let installed = false
    if (args.install) {
      const sp = spinner(
        `Installing dependencies with ${pm}…  ${color.dim('(first run can take a minute)')}`,
      )
      installed = await installAsync(pm, target)
      if (installed) sp.succeed(`Dependencies installed with ${pm}`)
      else sp.fail(`Install failed — run ${color.cyan(`${pm} install`)} inside ${dir}`)
    }

    const runPrefix = pm === 'npm' ? 'npm run' : pm
    log(`\n  ${color.bold('Next steps')}`)
    log(`    ${color.cyan(`cd ${dir}`)}`)
    if (!installed) log(`    ${color.cyan(pm === 'yarn' ? 'yarn' : `${pm} install`)}`)
    log(`    ${color.cyan('apex dev')}          ${color.gray('# → http://localhost:3000')}`)
    log(
      `\n  ${color.gray('Not installed globally? Use')} ${color.cyan(`${runPrefix} dev`)}${color.gray('.')}`,
    )
    log(
      `  ${color.gray('Islands mode:')} ${color.cyan('apex dev --islands')}${color.gray('  ·  API routes are also MCP tools at /mcp.')}\n`,
    )
  },
})
