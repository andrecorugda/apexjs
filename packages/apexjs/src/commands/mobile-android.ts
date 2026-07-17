import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'

// The native-shell template ships with the package (packages/apexjs/templates/mobile). The CLI
// build is flat (dist/<cmd>-HASH.js), so ../templates and ./cli.js resolve from the dist root.
const TEMPLATE = fileURLToPath(new URL('../templates/mobile', import.meta.url))
const CLI = fileURLToPath(new URL('./cli.js', import.meta.url))

/** Replace a `key = "value"` (kotlin) assignment's value — idempotent. */
function setKotlinAssign(src: string, key: string, value: string): string {
  return src.replace(new RegExp(`(${key}\\s*=\\s*")[^"]*(")`), `$1${value}$2`)
}

export const mobileAndroidCommand = defineCommand({
  meta: {
    name: 'android',
    description: 'Package the app as an offline Android app (WebView + on-device Apex engine)',
  },
  args: {
    appId: {
      type: 'string',
      alias: 'app-id',
      description: 'Android applicationId, e.g. com.acme.app',
    },
    name: { type: 'string', description: 'App display name' },
    icon: { type: 'string', description: 'Source icon (PNG/SVG) to generate launcher icons from' },
    assemble: { type: 'boolean', description: 'Run gradle assembleDebug to produce an APK' },
    force: { type: 'boolean', description: 'Re-scaffold mobile/android even if it exists' },
    build: {
      type: 'boolean',
      default: true,
      description: 'Rebuild the mobile bundle first (--no-build reuses dist/mobile)',
    },
  },
  async run({ args }) {
    const root = process.cwd()
    const outDir = join(root, 'dist')
    const proj = join(root, 'mobile', 'android')
    const log = (m: string) => console.log(`  ${m}`)

    // 1) Ensure a /splash route exists (the shell loads /splash first) — add the branded default
    //    if the app has none, BEFORE building so it lands in the bundle. Delete it to opt out.
    const splashDst = join(root, 'pages', 'splash.alpine')
    if (!existsSync(splashDst) && existsSync(join(TEMPLATE, 'splash.alpine'))) {
      mkdirSync(dirname(splashDst), { recursive: true })
      cpSync(join(TEMPLATE, 'splash.alpine'), splashDst)
      log('Added a default pages/splash.alpine (delete it to opt out)')
    }

    // 2) Build the self-contained bundle from current source (never stale), unless --no-build
    //    (then reuse an existing one, building only if none exists yet).
    if (args.build || !existsSync(join(outDir, 'mobile', 'server.mjs'))) {
      log('Building mobile bundle (apex build --mobile)…')
      execFileSync(process.execPath, [CLI, 'build', '--mobile'], { cwd: root, stdio: 'inherit' })
    }

    // 2) Scaffold the Android project from the template (idempotent).
    if (!existsSync(proj) || args.force) {
      mkdirSync(dirname(proj), { recursive: true })
      cpSync(join(TEMPLATE, 'android'), proj, { recursive: true })
      cpSync(join(TEMPLATE, 'apex-bridge.js'), join(root, 'mobile', 'apex-bridge.js'))
      log(`Scaffolded native shell → ${'mobile/android'}`)
    }

    // 3) Apply appId / display name (idempotent value replacement).
    if (args.appId || args.name) {
      const gradle = join(proj, 'app', 'build.gradle.kts')
      if (args.appId && existsSync(gradle)) {
        // Only the applicationId (install identity) becomes the custom id. `namespace` stays
        // `site.apexjs.shell` to match the Kotlin package, so the manifest's relative
        // `android:name=".MainActivity"` still resolves to a real class — otherwise a custom id
        // yields `<appId>.MainActivity` and the app crashes with ClassNotFoundException at launch.
        writeFileSync(
          gradle,
          setKotlinAssign(readFileSync(gradle, 'utf8'), 'applicationId', args.appId),
        )
        log(`applicationId → ${args.appId}`)
      }
      const strings = join(proj, 'app', 'src', 'main', 'res', 'values', 'strings.xml')
      if (args.name && existsSync(strings)) {
        writeFileSync(
          strings,
          readFileSync(strings, 'utf8').replace(
            /(<string name="app_name">)[^<]*(<\/string>)/,
            `$1${args.name}$2`,
          ),
        )
        log(`app name → ${args.name}`)
      }
    }

    // 4) Sync the server bundle + JS bridge + client assets into the APK.
    const assets = join(proj, 'app', 'src', 'main', 'assets')
    mkdirSync(join(assets, 'assets'), { recursive: true })
    cpSync(join(outDir, 'mobile', 'server.mjs'), join(assets, 'server.mjs'))
    cpSync(join(root, 'mobile', 'apex-bridge.js'), join(assets, 'apex-bridge.js'))
    if (existsSync(join(outDir, 'assets')))
      cpSync(join(outDir, 'assets'), join(assets, 'assets'), { recursive: true })
    if (existsSync(join(outDir, 'favicon.svg')))
      cpSync(join(outDir, 'favicon.svg'), join(assets, 'favicon.svg'))
    log('Synced server + client assets into the APK')

    // 5) Launcher icons from a source image (optional).
    if (args.icon) {
      execFileSync(
        process.execPath,
        [join(TEMPLATE, 'gen-mobile-assets.mjs'), args.icon, '--out', proj],
        { cwd: root, stdio: 'inherit' },
      )
      log('Generated launcher icons')
    }

    // 6) Assemble the APK, or print how to.
    if (args.assemble) {
      log('Running gradle assembleDebug…')
      execFileSync('gradle', ['assembleDebug'], { cwd: proj, stdio: 'inherit' })
      console.log(
        `\n  ✓ APK → mobile/android/app/build/outputs/apk/debug/app-debug.apk\n    Install: adb install -r that.apk\n`,
      )
    } else {
      console.log(
        `\n  Next: build the APK (needs Android SDK + gradle):\n    cd mobile/android && gradle assembleDebug\n  Or re-run with --assemble. Then: adb install -r app/build/outputs/apk/debug/app-debug.apk\n`,
      )
    }
  },
})
