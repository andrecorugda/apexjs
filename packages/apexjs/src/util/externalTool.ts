import { type ExecFileSyncOptions, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'

const isWindows = process.platform === 'win32'

/**
 * Resolve an executable the way a shell would — honoring Windows PATHEXT so that
 * batch/cmd shims (`gradle.bat`, `xcodegen.cmd`) are found. `execFileSync(cmd)` alone
 * does NOT do this on Windows, so a perfectly-installed tool still ENOENTs.
 *
 * Returns the resolved absolute path, or `null` when the tool is not on PATH.
 */
export function resolveBin(cmd: string): string | null {
  const exts = isWindows
    ? ['', ...(process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)]
    : ['']
  // An explicit path (absolute or containing a separator) is checked as-is.
  const bases =
    isAbsolute(cmd) || cmd.includes('/') || cmd.includes('\\')
      ? [cmd]
      : (process.env.PATH ?? '')
          .split(delimiter)
          .filter(Boolean)
          .map((d) => join(d, cmd))
  for (const base of bases) {
    for (const ext of exts) {
      const candidate = base + ext
      if (existsSync(candidate)) return candidate
    }
  }
  return null
}

/** A required external CLI tool is not installed / not on PATH. Carries an actionable hint
 *  so the CLI can print guidance instead of a raw spawn stack trace. */
export class MissingToolError extends Error {
  constructor(
    readonly tool: string,
    readonly hint: string,
  ) {
    super(`${tool} not found on PATH`)
    this.name = 'MissingToolError'
  }
}

/**
 * Run an external CLI tool cross-platform. Resolves the binary first (Windows shims
 * included) and throws a clean {@link MissingToolError} — never a circular `spawnSync …
 * ENOENT` dump — when the tool isn't installed. `hint` tells the user how to get it.
 */
export function runExternalTool(
  cmd: string,
  argv: string[],
  opts: ExecFileSyncOptions,
  hint: string,
): void {
  const bin = resolveBin(cmd)
  if (!bin) throw new MissingToolError(cmd, hint)
  execFileSync(bin, argv, opts)
}
