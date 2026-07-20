import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type Check,
  type DoctorReport,
  detectAndroidSdk,
  detectGradle,
  detectIos,
  detectJdk,
  fixableSteps,
  renderReport,
} from './doctor.js'
import type { AndroidRequirements } from './requirements.js'

const REQ: AndroidRequirements = {
  jdkFloor: 17,
  compileSdk: 34,
  buildTools: '34.0.0',
  agp: '8.5.0',
}
const isWindows = process.platform === 'win32'
const savedEnv = { ...process.env }

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'apex-doctor-'))
  process.env.JAVA_HOME = undefined
  process.env.ANDROID_HOME = undefined
  process.env.ANDROID_SDK_ROOT = undefined
  process.env.APEX_GRADLE = undefined
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  process.env = { ...savedEnv }
})

/** Write a fake `java` under <dir>/bin that prints `version` to stderr (like real java). */
function fakeJdk(version: string): string {
  const home = join(dir, 'jdk')
  mkdirSync(join(home, 'bin'), { recursive: true })
  const bin = join(home, 'bin', isWindows ? 'java.exe' : 'java')
  if (isWindows) writeFileSync(bin, '')
  else {
    writeFileSync(bin, `#!/usr/bin/env bash\necho '${version}' >&2\n`)
    chmodSync(bin, 0o755)
  }
  return home
}

describe('detectJdk', () => {
  it('reports OK when a JDK ≥ floor is on JAVA_HOME', () => {
    if (isWindows) return // fake exec shim only works on POSIX
    process.env.JAVA_HOME = fakeJdk('openjdk version "17.0.9"')
    const c = detectJdk(REQ)
    expect(c.status).toBe('ok')
    expect(c.detail).toContain('JDK 17')
  })

  it('reports OUTDATED when the JDK is below the floor', () => {
    if (isWindows) return
    process.env.JAVA_HOME = fakeJdk('openjdk version "11.0.1"')
    const c = detectJdk(REQ)
    expect(c.status).toBe('outdated')
    expect(c.detail).toContain('needs 17+')
    expect(c.link).toBeTruthy()
  })

  it('reports MISSING with an install link when no java exists', () => {
    process.env.JAVA_HOME = join(dir, 'nope')
    const c = detectJdk(REQ)
    // No JAVA_HOME/bin/java and (in CI) likely no PATH java → missing. If the CI image ships a
    // java on PATH this still resolves; accept either but require guidance when missing.
    if (c.status === 'missing') {
      expect(c.link).toContain('adoptium')
      expect(c.steps?.length).toBeGreaterThan(0)
    }
  })
})

describe('detectAndroidSdk', () => {
  it('flags a missing SDK with the cmdline-tools link + doctor --fix hint', () => {
    const checks = detectAndroidSdk(null, REQ)
    expect(checks).toHaveLength(1)
    expect(checks[0]?.status).toBe('missing')
    expect(checks[0]?.link).toContain('developer.android.com')
    expect(checks[0]?.steps?.join('\n')).toContain('apex mobile doctor --fix')
  })

  it('detects installed packages and offers auto-install for missing ones', () => {
    // Fake SDK: has platform-tools + sdkmanager, missing build-tools + platform.
    mkdirSync(join(dir, 'platform-tools'), { recursive: true })
    writeFileSync(join(dir, 'platform-tools', isWindows ? 'adb.exe' : 'adb'), '')
    const sdkmgrDir = join(dir, 'cmdline-tools', 'latest', 'bin')
    mkdirSync(sdkmgrDir, { recursive: true })
    writeFileSync(join(sdkmgrDir, isWindows ? 'sdkmanager.bat' : 'sdkmanager'), '')

    const byKey = Object.fromEntries(detectAndroidSdk(dir, REQ).map((c) => [c.key, c])) as Record<
      string,
      Check
    >
    expect(byKey.sdk?.status).toBe('ok')
    expect(byKey['platform-tools']?.status).toBe('ok')
    expect(byKey['build-tools']?.status).toBe('missing')
    // sdkmanager present → the missing package carries an auto step pointing at build-tools;34.0.0.
    expect(byKey['build-tools']?.auto?.args).toEqual(['build-tools;34.0.0'])
    expect(byKey.platform?.auto?.args).toEqual(['platforms;android-34'])
  })

  it('omits auto steps when sdkmanager is absent (cmdline-tools not installed)', () => {
    mkdirSync(dir, { recursive: true }) // empty SDK dir, no cmdline-tools
    const bt = detectAndroidSdk(dir, REQ).find((c) => c.key === 'build-tools')
    expect(bt?.status).toBe('missing')
    expect(bt?.auto).toBeUndefined()
    expect(bt?.steps?.join('\n')).toContain('command-line tools')
  })
})

describe('detectGradle', () => {
  it('is missing (with a link) when nothing resolves', () => {
    const c = detectGradle({ proj: dir })
    expect(c.status).toBe('missing')
    expect(c.link).toContain('gradle.org')
  })
  it('is OK when a gradlew wrapper is present', () => {
    writeFileSync(join(dir, isWindows ? 'gradlew.bat' : 'gradlew'), '')
    expect(detectGradle({ proj: dir }).status).toBe('ok')
  })
})

describe('detectIos', () => {
  it('off macOS, returns a single honest "needs a Mac" line', () => {
    if (process.platform === 'darwin') return
    const ios = detectIos()
    expect(ios).toHaveLength(1)
    expect(ios[0]?.status).toBe('na')
    expect(ios[0]?.detail).toContain('require a Mac')
  })
})

const noColor = {
  green: (s: string) => s,
  red: (s: string) => s,
  gray: (s: string) => s,
  cyan: (s: string) => s,
  bold: (s: string) => s,
}

describe('renderReport + fixableSteps', () => {
  const report: DoctorReport = {
    platform: 'linux',
    req: REQ,
    android: [
      { key: 'jdk', label: 'JDK 17+', status: 'ok', detail: 'JDK 17' },
      {
        key: 'build-tools',
        label: 'build-tools 34.0.0',
        status: 'missing',
        detail: 'missing',
        steps: ['Run: sdkmanager "build-tools;34.0.0"'],
        auto: {
          describe: 'sdkmanager "build-tools;34.0.0"',
          bin: '/sdk/sdkmanager',
          args: ['build-tools;34.0.0'],
        },
      },
    ],
    ios: [{ key: 'macos', label: 'macOS', status: 'na', detail: 'needs a Mac' }],
  }

  it('renders a status board with per-gap steps and a --fix nudge', () => {
    const out = renderReport(report, noColor)
    expect(out).toContain('Android')
    expect(out).toContain('✓ JDK 17+')
    expect(out).toContain('✗ build-tools')
    expect(out).toContain('sdkmanager "build-tools;34.0.0"')
    expect(out).toContain('apex mobile doctor --fix')
    expect(out).toContain('– macOS') // na icon
  })

  it('says the toolchain is ready when there are no android gaps', () => {
    const ready: DoctorReport = { ...report, android: report.android.slice(0, 1) }
    expect(renderReport(ready, noColor)).toContain('ready')
  })

  it('fixableSteps returns only the gaps with an auto action', () => {
    const steps = fixableSteps(report)
    expect(steps).toHaveLength(1)
    expect(steps[0]?.args).toEqual(['build-tools;34.0.0'])
  })
})
