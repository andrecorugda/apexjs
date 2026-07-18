import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ensureLocalProperties,
  resolveGradle,
  resolveSdkDir,
  sdkDirForProperties,
} from './androidToolchain.js'

let dir: string
const isWindows = process.platform === 'win32'
const savedEnv = { ...process.env }

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'apex-android-'))
  process.env.APEX_GRADLE = undefined
  process.env.ANDROID_HOME = undefined
  process.env.ANDROID_SDK_ROOT = undefined
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
    process.env.ANDROID_HOME = undefined
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
