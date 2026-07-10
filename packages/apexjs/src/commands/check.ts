import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineCommand } from 'citty'

// `apex check` — type-check the app with `--noEmit`. It's a thin wrapper over the
// project's TypeScript, so it honors the app's own tsconfig.json. When the native
// compiler is installed (the `tsgo` bin from `@typescript/native-preview`, or
// TypeScript 7's native `tsc`), the check is ~10x faster — fast enough to run as a
// gate after every code change, including from an AI agent (see `apex mcp-server`).
//
// Extra args pass through: `apex check --watch`, `apex check -p tsconfig.build.json`.
export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Type-check the app (tsc --noEmit; uses the native compiler when installed)',
  },
  run({ rawArgs }) {
    const cwd = process.cwd()
    const win = process.platform === 'win32'
    const passthrough = rawArgs.filter((a) => a !== 'check')

    // Prefer the native `tsgo` binary when present; otherwise fall back to `tsc`
    // (which is itself native + fast when TypeScript 7 is the installed compiler).
    const tsgoBin = join(cwd, 'node_modules', '.bin', win ? 'tsgo.cmd' : 'tsgo')
    const bin = existsSync(tsgoBin) ? 'tsgo' : 'tsc'
    const args = ['--noEmit', ...passthrough]

    const child = spawn(win ? 'npx.cmd' : 'npx', [bin, ...args], { stdio: 'inherit', shell: win })
    child.on('error', () => {
      console.error('\n  TypeScript not found. Install it: npm i -D typescript\n')
      process.exit(1)
    })
    child.on('exit', (code) => process.exit(code ?? 0))
  },
})
