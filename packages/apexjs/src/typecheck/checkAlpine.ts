import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type * as TS from 'typescript'
import { virtualFilesForAlpine, virtualToAlpine } from './alpineVirtual.js'
import { listAlpineFiles } from './walk.js'

export interface AlpineCheckResult {
  /** True when TypeScript couldn't be loaded from the app (see `message`). */
  unavailable?: boolean
  message?: string
  /** Number of type errors found (0 = clean). */
  errorCount: number
  /** Formatted, `.alpine`-remapped diagnostics (empty when clean). */
  output: string
  /** How many `.alpine` files were included. */
  checkedAlpine: number
}

/** Load the app's own TypeScript (has the compiler API on 5.x/6; on TS7 needs the compat pkg). */
function loadTypeScript(cwd: string): typeof TS | undefined {
  const req = createRequire(join(cwd, 'noop.js'))
  for (const name of ['typescript', '@typescript/typescript6']) {
    try {
      return req(req.resolve(name)) as typeof TS
    } catch {
      /* try next */
    }
  }
  return undefined
}

/**
 * Type-check an Apex app's `.ts` files AND the `<script server>` / `<script client>`
 * blocks inside its `.alpine` components. The `.alpine` blocks are represented as
 * line-preserved virtual `.ts` files served through a custom compiler host, so their
 * imports resolve from the real directory and diagnostics map back to the `.alpine`.
 */
export function checkAlpineProject(cwd: string): AlpineCheckResult {
  const ts = loadTypeScript(cwd)
  if (!ts) {
    return {
      unavailable: true,
      message:
        'TypeScript not found. Install it: npm i -D typescript (on a TypeScript 7 app, also: npm i -D @typescript/typescript6)',
      errorCount: 0,
      output: '',
      checkedAlpine: 0,
    }
  }

  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, 'tsconfig.json')
  const config = configPath
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(configPath, ts.sys.readFile).config,
        ts.sys,
        cwd,
      )
    : { fileNames: [] as string[], options: {} as TS.CompilerOptions }
  const options: TS.CompilerOptions = { ...config.options, noEmit: true, skipLibCheck: true }

  // Build the virtual `.ts` for every script block in every `.alpine`.
  const alpineFiles = listAlpineFiles(cwd)
  const virtual = new Map<string, string>()
  for (const file of alpineFiles) {
    let src: string
    try {
      src = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const vf of virtualFilesForAlpine(src, file)) virtual.set(vf.path, vf.content)
  }

  const rootNames = [...config.fileNames, ...virtual.keys()]

  const host = ts.createCompilerHost(options)
  const origGetSourceFile = host.getSourceFile.bind(host)
  const origReadFile = host.readFile.bind(host)
  const origFileExists = host.fileExists.bind(host)
  host.fileExists = (p) => virtual.has(p) || origFileExists(p)
  host.readFile = (p) => (virtual.has(p) ? virtual.get(p) : origReadFile(p))
  host.getSourceFile = (p, lang, onErr, shouldCreate) => {
    const v = virtual.get(p)
    return v !== undefined
      ? ts.createSourceFile(p, v, lang, true)
      : origGetSourceFile(p, lang, onErr, shouldCreate)
  }

  const program = ts.createProgram({ rootNames, options, host })
  const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()]

  const formatHost: TS.FormatDiagnosticsHost = {
    getCanonicalFileName: (p) => p,
    getCurrentDirectory: () => cwd,
    getNewLine: () => '\n',
  }
  let output = ts.formatDiagnostics(diagnostics, formatHost)
  // Remap virtual filenames back to the real `.alpine` (line/col already match).
  output = output.replace(/([^\s(]+)\.alpine\.(server|client)\.ts/g, (_m, base) => `${base}.alpine`)

  return { errorCount: diagnostics.length, output, checkedAlpine: alpineFiles.length }
}

export { virtualToAlpine }
