import { spawn } from 'node:child_process'
import { defineCommand } from 'citty'

// `apex test` — a thin wrapper over Vitest (the runner Apex apps ship with). Any
// extra args pass through: `apex test run`, `apex test --coverage`, `apex test foo`.
export const testCommand = defineCommand({
  meta: {
    name: 'test',
    description: 'Run your tests with Vitest (args pass through, e.g. `apex test run`)',
  },
  run({ rawArgs }) {
    const passthrough = rawArgs.filter((a) => a !== 'test')
    const win = process.platform === 'win32'
    const child = spawn(win ? 'npx.cmd' : 'npx', ['vitest', ...passthrough], {
      stdio: 'inherit',
      shell: win,
    })
    child.on('error', () => {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.error('\n  Vitest not found. Install it: npm i -D vitest\n')
      process.exit(1)
    })
    child.on('exit', (code) => process.exit(code ?? 0))
  },
})
