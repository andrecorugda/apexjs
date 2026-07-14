import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'

const TEMPLATE = fileURLToPath(new URL('../templates/mobile', import.meta.url))
const CLI = fileURLToPath(new URL('./cli.js', import.meta.url))

export const mobileIosCommand = defineCommand({
  meta: {
    name: 'ios',
    description: 'Package the app as an offline iOS app (WKWebView + on-device Apex engine)',
  },
  args: {
    appId: { type: 'string', alias: 'app-id', description: 'iOS bundle identifier, e.g. com.acme.app' },
    name: { type: 'string', description: 'App display name' },
    generate: { type: 'boolean', description: 'Run `xcodegen generate` to emit the .xcodeproj (needs XcodeGen + a Mac)' },
    force: { type: 'boolean', description: 'Re-scaffold mobile/ios even if it exists' },
  },
  async run({ args }) {
    const root = process.cwd()
    const outDir = join(root, 'dist')
    const proj = join(root, 'mobile', 'ios')
    const log = (m: string) => console.log(`  ${m}`)

    // 1) Ensure the self-contained mobile bundle exists (build it if not).
    if (!existsSync(join(outDir, 'mobile', 'server.mjs'))) {
      log('Building mobile bundle (apex build --mobile)…')
      execFileSync(process.execPath, [CLI, 'build', '--mobile'], { cwd: root, stdio: 'inherit' })
    }

    // 2) Scaffold the iOS shell from the template (idempotent). The project is generated from
    //    project.yml with XcodeGen, so no .xcodeproj is committed.
    if (!existsSync(proj) || args.force) {
      mkdirSync(dirname(proj), { recursive: true })
      cpSync(join(TEMPLATE, 'ios'), proj, { recursive: true })
      log(`Scaffolded native shell → ${'mobile/ios'}`)
    }

    // 3) Apply bundle id / display name (idempotent value replacement).
    if (args.appId) {
      const yml = join(proj, 'project.yml')
      if (existsSync(yml)) {
        let y = readFileSync(yml, 'utf8')
        y = y.replace(/(PRODUCT_BUNDLE_IDENTIFIER:\s*)site\.apexjs\.shell\.tests/, `$1${args.appId}.tests`)
        y = y.replace(/(PRODUCT_BUNDLE_IDENTIFIER:\s*)site\.apexjs\.shell(?!\.)/, `$1${args.appId}`)
        writeFileSync(yml, y)
        log(`bundle id → ${args.appId}`)
      }
    }
    if (args.name) {
      const plist = join(proj, 'Info.plist')
      if (existsSync(plist)) {
        writeFileSync(
          plist,
          readFileSync(plist, 'utf8').replace(
            /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
            `$1${args.name}$2`,
          ),
        )
        log(`app name → ${args.name}`)
      }
    }

    // 4) Sync the server bundle + JS bridge + client assets into the app's Resources (Generated/).
    const gen = join(proj, 'Generated')
    mkdirSync(join(gen, 'assets'), { recursive: true })
    cpSync(join(outDir, 'mobile', 'server.mjs'), join(gen, 'server.mjs'))
    cpSync(join(TEMPLATE, 'apex-bridge.js'), join(gen, 'apex-bridge.js'))
    if (existsSync(join(outDir, 'assets')))
      cpSync(join(outDir, 'assets'), join(gen, 'assets'), { recursive: true })
    if (existsSync(join(outDir, 'favicon.svg')))
      cpSync(join(outDir, 'favicon.svg'), join(gen, 'favicon.svg'))
    log('Synced server + client assets into mobile/ios/Generated')

    // 5) Generate the Xcode project, or print how (both need a Mac).
    if (args.generate) {
      log('Running xcodegen generate…')
      execFileSync('xcodegen', ['generate'], { cwd: proj, stdio: 'inherit' })
    }
    console.log(
      `\n  iOS needs a Mac + Xcode. Then:\n    brew install xcodegen\n    cd mobile/ios && xcodegen generate && open ApexShell.xcodeproj\n  Add a free Apple ID signing team, pick your iPhone, and Run. (The Simulator needs no signing.)\n`,
    )
  },
})
