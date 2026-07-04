// Helpers for offering the bundled `.alpine` VS Code extension during
// `apex new` / `apex upgrade`. The .vsix is copied into the package at build
// time by scripts/copy-templates.mjs.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const VSIX = fileURLToPath(new URL('../vscode/apex-alpine.vsix', import.meta.url))
const WIN = process.platform === 'win32'

/** Is the bundled extension present in this install? */
export function extensionBundled(): boolean {
  return existsSync(VSIX)
}

/** Is the VS Code `code` CLI on PATH? */
export function hasCodeCli(): boolean {
  try {
    return spawnSync('code', ['--version'], { stdio: 'ignore', shell: WIN }).status === 0
  } catch {
    return false
  }
}

/** Install the bundled extension via `code --install-extension`. Returns true on success. */
export function installExtension(): boolean {
  if (!existsSync(VSIX)) return false
  return (
    spawnSync('code', ['--install-extension', VSIX, '--force'], { stdio: 'inherit', shell: WIN })
      .status === 0
  )
}

/**
 * Ask a yes/no question on an interactive terminal. Non-interactive (no TTY,
 * e.g. CI) resolves to `def` without prompting.
 */
export function promptYesNo(question: string, def = true): Promise<boolean> {
  if (!process.stdin.isTTY) return Promise.resolve(def)
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${question} ${def ? '(Y/n) ' : '(y/N) '}`, (answer) => {
      rl.close()
      const a = answer.trim().toLowerCase()
      resolve(a === '' ? def : a === 'y' || a === 'yes')
    })
  })
}

/**
 * Offer to install the extension. `choice` overrides the prompt (from a
 * --vscode / --no-vscode flag); undefined → prompt when interactive + available.
 * Returns a short status string for the caller to log, or null if nothing done.
 */
export async function offerExtension(choice: boolean | undefined): Promise<string | null> {
  if (!extensionBundled() || !hasCodeCli()) return null
  const yes =
    choice ??
    (await promptYesNo('Install the Apex .alpine VS Code extension (syntax highlighting)?'))
  if (!yes) return null
  return installExtension() ? 'VS Code extension installed' : 'VS Code extension install failed'
}
