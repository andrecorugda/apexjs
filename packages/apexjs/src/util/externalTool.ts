import { type ExecFileSyncOptions, execFileSync, spawnSync } from 'node:child_process'
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

/**
 * Build the command line for running a Windows `.bat`/`.cmd` through `cmd.exe /d /s /c`.
 * Exported for testing. The executable is always quoted (it may sit under `Program Files`),
 * args are quoted only when they contain whitespace/metacharacters, and the whole thing is
 * wrapped in one more pair of quotes — which `cmd /s` strips, leaving the inner quoting intact.
 */
export function windowsBatchCommandLine(bin: string, argv: string[]): string {
  const needsQuote = (s: string) => s === '' || /[\s"&|<>^()%!]/.test(s)
  const quote = (s: string) => `"${s.replace(/"/g, '""')}"`
  const parts = [quote(bin), ...argv.map((a) => (needsQuote(a) ? quote(a) : a))]
  return `"${parts.join(' ')}"`
}

/**
 * Like {@link execFileSync}, but can actually run a Windows `.bat`/`.cmd`. Node refuses to
 * `execFileSync` a batch file directly — it throws `EINVAL` since the CVE-2024-27980 fix —
 * so batch files are routed through `cmd.exe` with verbatim (pre-quoted) arguments. Everything
 * else (a real `.exe`, a POSIX binary, `gradlew` shell script) runs directly.
 */
export function execTool(bin: string, argv: string[], opts: ExecFileSyncOptions): void {
  if (isWindows && /\.(bat|cmd)$/i.test(bin)) {
    const comspec = process.env.ComSpec || 'cmd.exe'
    // windowsVerbatimArguments reaches spawnSync at runtime but @types/node omits it
    // from ExecFileSyncOptions — hence the cast.
    execFileSync(comspec, ['/d', '/s', '/c', windowsBatchCommandLine(bin, argv)], {
      ...opts,
      windowsVerbatimArguments: true,
    } as ExecFileSyncOptions)
    return
  }
  execFileSync(bin, argv, opts)
}

/**
 * Run a tool and capture its output (for version probes like `java -version`, which prints to
 * **stderr** and exits 0). Handles Windows `.bat`/`.cmd` via `cmd.exe`. Returns null when the
 * tool can't be spawned at all (not installed); otherwise `{ stdout, stderr, code }`.
 */
export function captureTool(
  bin: string,
  argv: string[],
): { stdout: string; stderr: string; code: number } | null {
  const isBatch = isWindows && /\.(bat|cmd)$/i.test(bin)
  const cmd = isBatch ? process.env.ComSpec || 'cmd.exe' : bin
  const args = isBatch ? ['/d', '/s', '/c', windowsBatchCommandLine(bin, argv)] : argv
  const r = spawnSync(cmd, args, { encoding: 'utf8', windowsVerbatimArguments: isBatch })
  if (r.error) return null
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', code: r.status ?? 0 }
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
