import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ensureLocalProperties,
  findDebugApk,
  resolveGradle,
  resolveSdkDir,
  sdkDirForProperties,
} from './androidToolchain.js'

let dir: string
const isWindows = process.platform === 'win32'
const savedEnv = { ...process.env }

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'apex-android-'))
  // `= undefined` would store the string "undefined" — delete is the real unset.
  delete process.env.APEX_GRADLE
  delete process.env.ANDROID_HOME
  delete process.env.ANDROID_SDK_ROOT
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  process.env = { ...savedEnv }
})

describe('resolveGradle — precedence', () => {
  it('honors an explicit --gradle path above everything else', () => {
    // A wrapper also exists, but the flag must win.
    writeFileSync(join(dir, isWindows ? 'gradlew.bat' : 'gradlew'), '')
    const r = resolveGradle({ gradleArg: process.execPath, proj: dir })
    expect(r).toEqual({ bin: process.execPath, kind: 'flag' })
  })

  it('uses the project gradlew wrapper when no flag is given', () => {
    const wrapper = join(dir, isWindows ? 'gradlew.bat' : 'gradlew')
    writeFileSync(wrapper, '')
    const r = resolveGradle({ proj: dir })
    expect(r).toEqual({ bin: wrapper, kind: 'wrapper' })
  })

  it('falls back to $APEX_GRADLE when there is no flag and no wrapper', () => {
    process.env.APEX_GRADLE = process.execPath
    const r = resolveGradle({ proj: dir })
    expect(r).toEqual({ bin: process.execPath, kind: 'env' })
  })

  it('returns null for an explicit --gradle path that does not resolve', () => {
    expect(resolveGradle({ gradleArg: 'no-such-gradle-xyz', proj: dir })).toBeNull()
  })
})

describe('resolveSdkDir — precedence', () => {
  it('prefers the --sdk arg', () => {
    process.env.ANDROID_HOME = '/env/home'
    expect(resolveSdkDir('/flag/sdk')).toBe('/flag/sdk')
  })
  it('falls back to $ANDROID_HOME then $ANDROID_SDK_ROOT', () => {
    process.env.ANDROID_HOME = '/env/home'
    expect(resolveSdkDir()).toBe('/env/home')
    delete process.env.ANDROID_HOME
    process.env.ANDROID_SDK_ROOT = '/env/root'
    expect(resolveSdkDir()).toBe('/env/root')
  })
  it('returns null when nothing is set', () => {
    expect(resolveSdkDir()).toBeNull()
  })
})

describe('sdkDirForProperties — Java .properties escaping', () => {
  it('escapes Windows backslashes so gradle parses the path', () => {
    expect(sdkDirForProperties('C:\\Users\\andre\\AppData\\Local\\Android\\Sdk')).toBe(
      'C:\\\\Users\\\\andre\\\\AppData\\\\Local\\\\Android\\\\Sdk',
    )
  })
  it('leaves a POSIX path unchanged', () => {
    expect(sdkDirForProperties('/home/andre/Android/Sdk')).toBe('/home/andre/Android/Sdk')
  })
})

describe('findDebugApk', () => {
  const outDir = () => join(dir, 'app', 'build', 'outputs', 'apk', 'debug')

  it('returns null before any assemble (no output dir / no apk)', () => {
    expect(findDebugApk(dir)).toBeNull()
    mkdirSync(outDir(), { recursive: true })
    writeFileSync(join(outDir(), 'output-metadata.json'), '{}')
    expect(findDebugApk(dir)).toBeNull()
  })

  it('finds the default app-debug.apk', () => {
    mkdirSync(outDir(), { recursive: true })
    writeFileSync(join(outDir(), 'app-debug.apk'), '')
    expect(findDebugApk(dir)).toBe(join(outDir(), 'app-debug.apk'))
  })

  it('picks the newest apk when archivesName produced a renamed one', () => {
    mkdirSync(outDir(), { recursive: true })
    const stale = join(outDir(), 'app-debug.apk')
    const fresh = join(outDir(), 'doctor-test-debug.apk')
    writeFileSync(stale, '')
    writeFileSync(fresh, '')
    utimesSync(stale, new Date(2000, 0, 1), new Date(2000, 0, 1))
    expect(findDebugApk(dir)).toBe(fresh)
  })
})

describe('ensureLocalProperties', () => {
  it('writes sdk.dir when absent', () => {
    expect(ensureLocalProperties(dir, 'C:\\Android\\Sdk')).toBe('written')
    const content = readFileSync(join(dir, 'local.properties'), 'utf8')
    expect(content).toContain('sdk.dir=C:\\\\Android\\\\Sdk')
  })

  it('does not clobber an existing sdk.dir', () => {
    writeFileSync(join(dir, 'local.properties'), 'sdk.dir=/existing/sdk\n')
    expect(ensureLocalProperties(dir, '/other/sdk')).toBe('exists')
    expect(readFileSync(join(dir, 'local.properties'), 'utf8')).toContain('/existing/sdk')
  })

  it('reports no-sdk when there is nothing to point at', () => {
    expect(ensureLocalProperties(dir, null)).toBe('no-sdk')
  })
})
