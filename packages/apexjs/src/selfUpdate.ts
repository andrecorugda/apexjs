// Keeps the globally-installed Apex CLI current. The `.alpine` extension and the
// scaffold templates are bundled *inside* a given `@apex-stack/core` build, so
// `apex upgrade` can only ever apply the version it is itself running. If the
// global CLI is stale, the project would silently upgrade to old assets — this
// closes that gap by updating the global binary first, then re-execing on it.
import { spawnSync } from 'node:child_process'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { color, VERSION } from './ui.js'
import { cmpVersion, promptYesNo } from './vscode.js'

const PKG = '@apex-stack/core'
const WIN = process.platform === 'win32'

/** Latest published version of the CLI, or null (offline / npm missing / timeout). */
function latestPublished(): string | null {
  try {
    const r = spawnSync('npm', ['view', PKG, 'version'], {
      encoding: 'utf8',
      timeout: 4000,
      shell: WIN,
    })
    if (r.status !== 0 || !r.stdout) return null
    const v = r.stdout.trim()
    return /^\d+\.\d+\.\d+/.test(v) ? v : null
  } catch {
    return null
  }
}

/**
 * Is this CLI the globally-installed one, rather than a project-local
 * node_modules copy? Local copies are updated by the normal dependency bump +
 * package-manager install, so we must NOT touch the global binary for them.
 */
function isGlobalInstall(): boolean {
  const self = fileURLToPath(import.meta.url)
  const localRoot = resolve(process.cwd(), 'node_modules') + sep
  return !self.startsWith(localRoot)
}

/** Run `npm install -g @apex-stack/core@latest`. Returns true on success. */
function installGlobalLatest(): boolean {
  return (
    spawnSync('npm', ['install', '-g', `${PKG}@latest`], { stdio: 'inherit', shell: WIN })
      .status === 0
  )
}

/**
 * If a newer CLI is published and we're the global install, offer to update it
 * and re-exec `apex` with `reexecArgv` so the rest of the command runs on the new
 * engine (which bundles the matching extension + templates). Returns true if it
 * re-exec'd — the caller should stop. `choice` is from `--self` / `--no-self`
 * (undefined = ask; non-interactive = skip).
 */
export async function maybeSelfUpdate(
  reexecArgv: string[],
  choice: boolean | undefined,
): Promise<boolean> {
  if (choice === false) return false
  if (!isGlobalInstall()) return false

  const latest = latestPublished()
  if (!latest || cmpVersion(latest, VERSION) <= 0) return false

  const log = console.log
  log(
    `\n  ${color.cyan('↑')} A newer Apex CLI is available: ${color.gray(VERSION)} → ${color.green(latest)}`,
  )
  const yes =
    choice ?? (process.stdin.isTTY ? await promptYesNo(`  Update the global CLI now?`) : false)
  if (!yes) {
    log(`  ${color.gray('Skipped. Update later with')} ${color.cyan(`npm i -g ${PKG}@latest`)}\n`)
    return false
  }
  if (!installGlobalLatest()) {
    log(`  ${color.red('✗')} Global update failed — run ${color.cyan(`npm i -g ${PKG}@latest`)}\n`)
    return false
  }
  log(`  ${color.green('✓')} CLI updated to ${latest} — re-running on the new engine…\n`)
  // Re-exec the freshly-installed global `apex` (resolved from PATH). It carries
  // `--no-self`, so the new run skips this check and proceeds straight to the work.
  const r = spawnSync('apex', reexecArgv, { stdio: 'inherit', shell: WIN })
  process.exit(r.status ?? 0)
}
