import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * What the Android build actually requires — **derived from the Gradle files**, never
 * hardcoded. The JDK floor comes from `JavaVersion.VERSION_NN` (raise the template's AGP /
 * Java target and this check follows automatically); `compileSdk` and the AGP version come
 * from the same source of truth.
 */
export interface AndroidRequirements {
  /** Minimum JDK major version (a floor — newer JDKs also satisfy it). */
  jdkFloor: number
  /** `compileSdk` — the Android platform the app compiles against (`platforms;android-NN`). */
  compileSdk: number
  /** Build-tools version to install (`build-tools;X`). Defaults to `<compileSdk>.0.0`. */
  buildTools: string
  /** Android Gradle Plugin version (informational — dictates the JDK floor). */
  agp: string | null
}

const DEFAULTS: AndroidRequirements = {
  jdkFloor: 17,
  compileSdk: 34,
  buildTools: '34.0.0',
  agp: null,
}

/** Parse the major version from `java -version` output (stderr), across Java's two schemes:
 *  `"1.8.0_x"` → 8, `"17.0.9"` → 17, `openjdk 21 …` → 21. Returns null if unparseable. */
export function parseJavaMajor(versionText: string): number | null {
  // Quoted form: version "17.0.9" / "1.8.0_392".
  const quoted = versionText.match(/version\s+"(\d+)(?:\.(\d+))?/i)
  if (quoted) {
    const first = Number(quoted[1])
    if (first === 1 && quoted[2]) return Number(quoted[2]) // 1.8 → 8
    return first
  }
  // Unquoted form: `openjdk 21 2023-09-19`.
  const bare = versionText.match(/\b(?:openjdk|java)\s+(\d+)\b/i)
  return bare ? Number(bare[1]) : null
}

/**
 * Derive the Android requirements from a scaffolded project's Gradle files, falling back to
 * the packaged template, then to sane defaults. `projOrTemplateDirs` are checked in order —
 * pass the app's `mobile/android` first (authoritative for *that* app) then the template.
 */
export function deriveAndroidRequirements(...androidDirs: string[]): AndroidRequirements {
  for (const dir of androidDirs) {
    const appGradle = join(dir, 'app', 'build.gradle.kts')
    const rootGradle = join(dir, 'build.gradle.kts')
    if (!existsSync(appGradle)) continue
    const app = readFileSync(appGradle, 'utf8')
    const root = existsSync(rootGradle) ? readFileSync(rootGradle, 'utf8') : ''

    const jdk = app.match(/JavaVersion\.VERSION_(\d+)/)
    const sdk = app.match(/compileSdk\s*=\s*(\d+)/)
    const bt = app.match(/buildToolsVersion\s*=\s*["']([\d.]+)["']/)
    const agp = root.match(/com\.android\.application["']?\s*\)?\s*version\s*["']([\d.]+)["']/)

    const compileSdk = sdk ? Number(sdk[1]) : DEFAULTS.compileSdk
    return {
      jdkFloor: jdk ? Number(jdk[1]) : DEFAULTS.jdkFloor,
      compileSdk,
      buildTools: bt ? bt[1] : `${compileSdk}.0.0`,
      agp: agp ? agp[1] : DEFAULTS.agp,
    }
  }
  return { ...DEFAULTS }
}
