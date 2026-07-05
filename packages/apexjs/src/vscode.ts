// Helpers for offering the bundled `.alpine` editor extension during
// `apex new` / `apex upgrade`. The .vsix (+ its version) is copied into the
// package at build time by scripts/copy-templates.mjs.
//
// The extension is a VSIX (TextMate grammar + language config), so it works in
// VS Code and its forks — Cursor, Windsurf, VSCodium — via their `--install-extension`
// CLIs. It does NOT cover non-VS-Code editors (JetBrains, Neovim, Zed, …).
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const VSIX = fileURLToPath(new URL('../vscode/apex-alpine.vsix', import.meta.url))
const VERSION_FILE = fileURLToPath(new URL('../vscode/version.txt', import.meta.url))
const EXT_ID = 'apex-stack.apex-alpine'
const WIN = process.platform === 'win32'

// VS Code-family CLIs, in preference order. First one that responds wins.
const EDITOR_CLIS = ['code', 'cursor', 'windsurf', 'codium'] as const

/** Is the bundled extension present in this install? */
export function extensionBundled(): boolean {
  return existsSync(VSIX)
}

/** The version of the bundled .vsix (from version.txt), or null if unknown. */
function bundledVersion(): string | null {
  try {
    const v = readFileSync(VERSION_FILE, 'utf8').trim()
    return v || null
  } catch {
    return null
  }
}

/** First available VS Code-family editor CLI on PATH, or null. */
export function detectEditorCli(): string | null {
  for (const cli of EDITOR_CLIS) {
    try {
      if (spawnSync(cli, ['--version'], { stdio: 'ignore', shell: WIN }).status === 0) return cli
    } catch {
      // try the next one
    }
  }
  return null
}

/** Version of the installed Apex extension for a given editor CLI, or null. */
function installedVersion(cli: string): string | null {
  try {
    const r = spawnSync(cli, ['--list-extensions', '--show-versions'], {
      encoding: 'utf8',
      shell: WIN,
    })
    if (r.status !== 0 || !r.stdout) return null
    const line = r.stdout.split('\n').find((l) => l.trim().toLowerCase().startsWith(`${EXT_ID}@`))
    return line ? (line.split('@')[1]?.trim() ?? null) : null
  } catch {
    return null
  }
}

/** Compare dotted versions: negative if a<b, 0 if equal, positive if a>b. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0)
  }
  return 0
}

/** Backwards-compatible: is any VS Code-family CLI available? */
export function hasCodeCli(): boolean {
  return detectEditorCli() !== null
}

/**
 * Open a file at a line/column in the user's editor (dev-time only). Honors
 * $APEX_EDITOR / $EDITOR, else the first detected VS Code-family CLI, via the
 * `-g file:line:col` goto flag. Returns true if an editor was launched.
 */
export function openInEditor(file: string, line = 1, col = 1): boolean {
  const cli =
    process.env.APEX_EDITOR || process.env.VISUAL || process.env.EDITOR || detectEditorCli()
  if (!cli) return false
  try {
    return (
      spawnSync(cli, ['-g', `${file}:${line}:${col}`], { stdio: 'ignore', shell: WIN }).status === 0
    )
  } catch {
    return false
  }
}

/** Install/upgrade the bundled extension via `<cli> --install-extension`. */
export function installExtension(cli = detectEditorCli()): boolean {
  if (!cli || !existsSync(VSIX)) return false
  return (
    spawnSync(cli, ['--install-extension', VSIX, '--force'], { stdio: 'inherit', shell: WIN })
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
 * Offer to install or update the `.alpine` extension — but only prompt when
 * there's something to do. If it's already installed at the latest version, we
 * say so and skip the question (asking would feel pointless). `choice` overrides
 * the prompt (from --vscode / --no-vscode).
 */
export async function offerExtension(choice: boolean | undefined): Promise<string | null> {
  if (!extensionBundled()) return null
  const cli = detectEditorCli()
  if (!cli) return null

  const bundled = bundledVersion()
  const installed = installedVersion(cli)

  // Already installed and up to date → no question, just a note.
  if (installed && bundled && cmpVersion(installed, bundled) >= 0) {
    return `.alpine extension up to date (${installed})`
  }

  const prompt =
    installed && bundled
      ? `Update the Apex .alpine extension (${installed} → ${bundled})?`
      : 'Install the Apex .alpine extension (syntax highlighting)?'
  const yes = choice ?? (await promptYesNo(prompt))
  if (!yes) return null

  if (!installExtension(cli)) return 'extension install failed'
  return installed ? `.alpine extension updated to ${bundled}` : 'Apex .alpine extension installed'
}
