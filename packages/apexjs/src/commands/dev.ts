import { spawnSync } from 'node:child_process'
import { networkInterfaces } from 'node:os'
import { resolve } from 'node:path'
import { defineCommand } from 'citty'
import { banner, color, ready, spinner } from '../ui.js'

/** First non-internal IPv4 — the address a device/simulator on the same network reaches. */
function lanAddress(): string | undefined {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address
    }
  }
  return undefined
}

/** Map the device's `localhost:<port>` to this machine — the standard Android dev bridge.
 * Best-effort: silent when adb or a device isn't present. */
function adbReverse(port: number): boolean {
  try {
    const r = spawnSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    })
    return r.status === 0
  } catch {
    return false
  }
}

export const devCommand = defineCommand({
  meta: { name: 'dev', description: 'Start the Apex JS development server' },
  args: {
    root: { type: 'positional', required: false, description: 'Project root', default: '.' },
    port: { type: 'string', description: 'Port to listen on', default: '3000' },
    islands: {
      type: 'boolean',
      description: 'Render in islands mode (static-first)',
      default: false,
    },
    mobile: {
      type: 'boolean',
      description:
        'Mobile dev loop: print the LAN URL + wire `adb reverse` so an emulator/device WebView hits this server (with HMR)',
      default: false,
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), String(args.root))
    const port = Number(args.port)
    process.stdout.write(banner())
    const sp = spinner(`Starting dev server${args.islands ? ' (islands mode)' : ''}…`)
    try {
      // Imported lazily so `apex new` / `apex --help` never load Vite + rollup.
      const { startDevServer } = await import('../dev/server.js')
      const { port: actual } = await startDevServer({ root, port, islands: Boolean(args.islands) })
      sp.succeed('Dev server ready')

      const rows: Array<[string, string]> = [['Local', `http://localhost:${actual}/`]]
      if (args.mobile) {
        const lan = lanAddress()
        if (lan) rows.push(['Network', `http://${lan}:${actual}/`])
      }
      rows.push(['MCP', `http://localhost:${actual}/mcp`])
      ready(rows)

      if (args.mobile) {
        // The dev server already binds all interfaces — this just makes it reachable + obvious.
        const bridged = adbReverse(actual)
        const lan = lanAddress()
        console.log(
          `\n  ${color.cyan('Mobile dev')} — point your WebView / emulator at the app, with live HMR:\n` +
            `    ${color.bold('Android')}  ${
              bridged
                ? `${color.green('✓')} adb reverse active → load ${color.cyan(`http://localhost:${actual}/`)}`
                : `run ${color.cyan(`adb reverse tcp:${actual} tcp:${actual}`)} (no device detected), then load ${color.cyan(`http://localhost:${actual}/`)}`
            }\n` +
            `    ${color.bold('iOS')}      load ${color.cyan(lan ? `http://${lan}:${actual}/` : `http://<your-LAN-ip>:${actual}/`)} (device on the same Wi-Fi)\n` +
            `  ${color.gray('SSR + API run here on your machine (full Node + HMR). `apex build --mobile` is only for the offline on-device bundle.')}\n`,
        )
      }
    } catch (err) {
      sp.fail('Failed to start the dev server')
      throw err
    }
  },
})
