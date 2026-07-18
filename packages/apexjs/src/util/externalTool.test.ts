import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import {
  execTool,
  MissingToolError,
  resolveBin,
  runExternalTool,
  windowsBatchCommandLine,
} from './externalTool.js'

describe('resolveBin', () => {
  it('resolves a real tool that exists on PATH', () => {
    // `node` is guaranteed present (we run under it).
    expect(resolveBin('node')).not.toBeNull()
  })

  it('returns null for a tool that does not exist', () => {
    expect(resolveBin('definitely-not-a-real-binary-xyz')).toBeNull()
  })

  it('honors an explicit absolute path', () => {
    expect(resolveBin(process.execPath)).toBe(process.execPath)
  })
})

describe('runExternalTool', () => {
  it('runs a present tool without throwing', () => {
    expect(() =>
      runExternalTool('node', ['-e', 'process.exit(0)'], { stdio: 'ignore' }, 'hint'),
    ).not.toThrow()
  })

  it('throws a clean MissingToolError (not a raw spawn ENOENT) when the tool is absent', () => {
    let caught: unknown
    try {
      runExternalTool('gradle-not-installed-zzz', ['x'], { stdio: 'ignore' }, 'install gradle')
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(MissingToolError)
    expect((caught as MissingToolError).tool).toBe('gradle-not-installed-zzz')
    expect((caught as MissingToolError).hint).toBe('install gradle')
    // Crucially: the message is human, not a circular spawnSync dump.
    expect((caught as Error).message).not.toContain('spawnSync')
  })

  it('the old direct spawn path is what we replaced (raw ENOENT proof)', () => {
    // Documents the failure mode we fixed: a bare execFileSync of a missing tool throws ENOENT.
    expect(() => execFileSync('gradle-not-installed-zzz', ['x'], { stdio: 'ignore' })).toThrow()
  })
})

describe('windowsBatchCommandLine', () => {
  it('quotes the executable and wraps the whole line for cmd /s', () => {
    // `cmd /s /c` strips exactly the outer pair, leaving the inner quoting intact.
    expect(windowsBatchCommandLine('C:\\g\\gradle.bat', ['assembleDebug', '--no-daemon'])).toBe(
      '""C:\\g\\gradle.bat" assembleDebug --no-daemon"',
    )
  })

  it('quotes an executable path containing spaces (e.g. Program Files)', () => {
    expect(windowsBatchCommandLine('C:\\Program Files\\gradle\\bin\\gradle.bat', ['tasks'])).toBe(
      '""C:\\Program Files\\gradle\\bin\\gradle.bat" tasks"',
    )
  })

  it('quotes only the args that need it', () => {
    expect(windowsBatchCommandLine('g.bat', ['a b', 'plain'])).toBe('""g.bat" "a b" plain"')
  })
})

describe('execTool', () => {
  it('runs a normal (non-batch) binary directly on any platform', () => {
    // node is not a .bat, so execTool goes straight through execFileSync — works on Linux/macOS/Win.
    expect(() => execTool('node', ['-e', 'process.exit(0)'], { stdio: 'ignore' })).not.toThrow()
  })

  it('propagates a non-zero exit from the underlying tool', () => {
    expect(() => execTool('node', ['-e', 'process.exit(3)'], { stdio: 'ignore' })).toThrow()
  })
})
