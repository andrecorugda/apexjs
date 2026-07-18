import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveBin } from '../util/externalTool.js'

/** Where a usable `gradle` came from — for a helpful log line. */
export type GradleKind = 'flag' | 'wrapper' | 'env' | 'path'

export interface ResolvedGradle {
  /** Absolute path (or a PATH-resolved binary) to invoke. */
  bin: string
  kind: GradleKind
}

/**
 * Resolve a Gradle to run, in precedence order:
 *   1. `--gradle <path>`   — explicit, wins over everything (e.g. a standalone gradle-8.9 not on PATH)
 *   2. project `gradlew`   — the Gradle wrapper (self-contained; only needs a JDK)
 *   3. `$APEX_GRADLE`      — env override
 *   4. `gradle` on PATH    — resolved cross-platform (.bat/.cmd on Windows)
 *
 * Returns null when nothing resolves, so the caller can print an actionable hint
 * instead of a spawn crash. `--gradle` / `$APEX_GRADLE` may name a bare binary or a
 * full path; both go through {@link resolveBin} so Windows shims resolve too.
 */
export function resolveGradle(opts: { gradleArg?: string; proj: string }): ResolvedGradle | null {
  if (opts.gradleArg) {
    const bin = resolveBin(opts.gradleArg)
    return bin ? { bin, kind: 'flag' } : null
  }
  const wrapper = join(opts.proj, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
  if (existsSync(wrapper)) return { bin: wrapper, kind: 'wrapper' }

  const envGradle = process.env.APEX_GRADLE
  if (envGradle) {
    const bin = resolveBin(envGradle)
    if (bin) return { bin, kind: 'env' }
  }
  const onPath = resolveBin('gradle')
  return onPath ? { bin: onPath, kind: 'path' } : null
}

/**
 * The Android SDK location, in precedence order: `--sdk <dir>`, then `$ANDROID_HOME`,
 * then `$ANDROID_SDK_ROOT`. Returns null when none is set.
 */
export function resolveSdkDir(sdkArg?: string): string | null {
  return sdkArg || process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || null
}

/** Serialize an SDK path for a Java `.properties` file: backslashes must be escaped, so a
 *  Windows `C:\Users\…\Sdk` becomes `C:\\Users\\…\\Sdk`. Forward-slash paths pass through. */
export function sdkDirForProperties(sdkDir: string): string {
  return sdkDir.replace(/\\/g, '\\\\')
}

/**
 * Ensure `mobile/android/local.properties` points Gradle at the SDK, so the user doesn't
 * have to export `ANDROID_HOME` on every build. Non-destructive: if the file already pins
 * `sdk.dir`, it is left untouched. Returns the action taken (for logging).
 */
export function ensureLocalProperties(
  proj: string,
  sdkDir: string | null,
): 'written' | 'exists' | 'no-sdk' {
  const file = join(proj, 'local.properties')
  if (existsSync(file) && /^\s*sdk\.dir\s*=/m.test(readFileSync(file, 'utf8'))) return 'exists'
  if (!sdkDir) return 'no-sdk'
  const line = `sdk.dir=${sdkDirForProperties(sdkDir)}\n`
  // Preserve any existing (non-sdk.dir) content; otherwise start a fresh file.
  const prev = existsSync(file) ? `${readFileSync(file, 'utf8').replace(/\n?$/, '\n')}` : ''
  writeFileSync(file, prev + line)
  return 'written'
}
