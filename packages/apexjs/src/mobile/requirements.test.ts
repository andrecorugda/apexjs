import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deriveAndroidRequirements, parseJavaMajor } from './requirements.js'

describe('parseJavaMajor', () => {
  it('parses the modern scheme (9+)', () => {
    expect(parseJavaMajor('openjdk version "17.0.9" 2023-10-17')).toBe(17)
    expect(parseJavaMajor('java version "21.0.1" 2023-10-17 LTS')).toBe(21)
  })
  it('parses the legacy 1.x scheme (Java 8)', () => {
    expect(parseJavaMajor('java version "1.8.0_392"')).toBe(8)
  })
  it('parses the unquoted form', () => {
    expect(parseJavaMajor('openjdk 21 2023-09-19')).toBe(21)
  })
  it('returns null when unreadable', () => {
    expect(parseJavaMajor('not a version at all')).toBeNull()
  })
})

describe('deriveAndroidRequirements', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'apex-req-'))
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  const writeGradle = (app: string, root = '') => {
    mkdirSync(join(dir, 'app'), { recursive: true })
    writeFileSync(join(dir, 'app', 'build.gradle.kts'), app)
    if (root) writeFileSync(join(dir, 'build.gradle.kts'), root)
  }

  it('derives the JDK floor from JavaVersion.VERSION_NN — NOT hardcoded', () => {
    // The whole point: bump the template's Java target and the requirement follows.
    writeGradle('compileSdk = 35\n  sourceCompatibility = JavaVersion.VERSION_21\n')
    const req = deriveAndroidRequirements(dir)
    expect(req.jdkFloor).toBe(21)
    expect(req.compileSdk).toBe(35)
    expect(req.buildTools).toBe('35.0.0') // defaults to <compileSdk>.0.0
  })

  it('reads an explicit buildToolsVersion and the AGP version', () => {
    writeGradle(
      'compileSdk = 34\n  buildToolsVersion = "34.0.0"\n  targetCompatibility = JavaVersion.VERSION_17\n',
      'id("com.android.application") version "8.5.0" apply false\n',
    )
    const req = deriveAndroidRequirements(dir)
    expect(req).toMatchObject({ jdkFloor: 17, compileSdk: 34, buildTools: '34.0.0', agp: '8.5.0' })
  })

  it('falls back to the next dir, then to defaults', () => {
    // First dir has no gradle → falls through to defaults (17/34).
    const req = deriveAndroidRequirements(join(dir, 'nope'))
    expect(req).toMatchObject({ jdkFloor: 17, compileSdk: 34, buildTools: '34.0.0' })
  })

  it('prefers the first dir that has gradle files (scaffold over template)', () => {
    writeGradle('compileSdk = 33\n  sourceCompatibility = JavaVersion.VERSION_11\n')
    const template = mkdtempSync(join(tmpdir(), 'apex-tmpl-'))
    mkdirSync(join(template, 'app'), { recursive: true })
    writeFileSync(
      join(template, 'app', 'build.gradle.kts'),
      'compileSdk = 34\n  JavaVersion.VERSION_17\n',
    )
    // The scaffold (dir) wins.
    expect(deriveAndroidRequirements(dir, template).jdkFloor).toBe(11)
    rmSync(template, { recursive: true, force: true })
  })
})
