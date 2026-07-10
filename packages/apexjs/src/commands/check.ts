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
// With `--alpine` (preview), it ALSO type-checks the `<script server>` /
// `<script client>` blocks inside `.alpine` components — which plain `tsc` can't
// see. That path uses the TypeScript compiler API (so it needs `typescript`, or
// `@typescript/typescript6` on a TS7 app) and does not use `tsgo`.
//
// Extra args pass through: `apex check --watch`, `apex check -p tsconfig.build.json`.
export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Type-check the app (tsc --noEmit; --alpine also checks .alpine script blocks)',
  },
  args: {
    alpine: {
      type: 'boolean',
      default: false,
      description: 'Also type-check the <script> blocks inside .alpine components (preview)',
    },
  },
  async run({ args, rawArgs }) {
    const cwd = process.cwd()

    if (args.alpine) {
      const { checkAlpineProject } = await import('../typecheck/checkAlpine.js')
      const res = checkAlpineProject(cwd)
      if (res.unavailable) {
        console.error(`\n  ${res.message}\n`)
        process.exit(1)
      }
      if (res.output) process.stdout.write(res.output)
      const files = res.checkedAlpine
      console.log(
        res.errorCount === 0
          ? `\n  ✓ No type errors (checked .ts + ${files} .alpine file${files === 1 ? '' : 's'}).\n`
          : `\n  ✗ ${res.errorCount} type error${res.errorCount === 1 ? '' : 's'} (including ${files} .alpine file${files === 1 ? '' : 's'}).\n`,
      )
      process.exit(res.errorCount === 0 ? 0 : 1)
    }

    // Default path: fast `tsc`/`tsgo --noEmit` over the app's `.ts` files.
    const win = process.platform === 'win32'
    const passthrough = rawArgs.filter((a) => a !== 'check' && a !== '--alpine')
    const tsgoBin = join(cwd, 'node_modules', '.bin', win ? 'tsgo.cmd' : 'tsgo')
    const bin = existsSync(tsgoBin) ? 'tsgo' : 'tsc'
    const child = spawn(win ? 'npx.cmd' : 'npx', [bin, '--noEmit', ...passthrough], {
      stdio: 'inherit',
      shell: win,
    })
    child.on('error', () => {
      console.error('\n  TypeScript not found. Install it: npm i -D typescript\n')
      process.exit(1)
    })
    child.on('exit', (code) => process.exit(code ?? 0))
  },
})
