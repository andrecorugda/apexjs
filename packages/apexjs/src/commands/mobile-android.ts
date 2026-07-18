import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { ensureLocalProperties, resolveGradle, resolveSdkDir } from '../mobile/androidToolchain.js'
import { execTool } from '../util/externalTool.js'

const GRADLE_HINT =
  'Run "apex mobile doctor" to check the toolchain + get setup links/commands (--fix to install\n' +
  '  what it can). Or point Apex at a Gradle: --gradle <…/bin/gradle[.bat]>, set $APEX_GRADLE, or\n' +
  '  put gradle on PATH. A JDK 17+ and the Android SDK are also required (--sdk <dir> / $ANDROID_HOME).'

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
    gradle: {
      type: 'string',
      description: 'Path to a Gradle binary (e.g. …/gradle-8.9/bin/gradle.bat) not on PATH',
    },
    sdk: {
      type: 'string',
      description: 'Android SDK dir (writes local.properties). Defaults to $ANDROID_HOME',
    },
    wrapper: {
      type: 'boolean',
      description: 'Generate the Gradle wrapper (gradlew) so future builds need no system Gradle',
    },
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
    if (args.assemble || args.wrapper) {
      // Resolve a usable Gradle: --gradle path > project gradlew > $APEX_GRADLE > PATH gradle.
      // (Handles a standalone gradle not on PATH — the common "I have Gradle, just not on
      // PATH / no Android Studio" case — plus Windows .bat/.cmd shims.)
      const gradle = resolveGradle({ gradleArg: args.gradle, proj })
      if (!gradle) {
        // Distinguish "you gave me a --gradle path that doesn't exist" from "found nothing" —
        // the former is a path typo, not a missing toolchain.
        if (args.gradle)
          console.error(
            `\n  ✗ --gradle path does not exist: ${args.gradle}\n  Check the path (it should end in bin/gradle.bat on Windows, bin/gradle on macOS/Linux).\n`,
          )
        else {
          console.error(`\n  ✗ Gradle not found — the APK was not assembled.\n  ${GRADLE_HINT}\n`)
          console.error(
            `  Everything else is ready: the shell is scaffolded and the bundle is synced at\n  mobile/android. Only the final APK compile needs Gradle + the Android SDK.\n`,
          )
        }
        process.exitCode = 1
        return
      }

      // Point Gradle at the SDK via local.properties (so ANDROID_HOME isn't needed each run).
      const sdkDir = resolveSdkDir(args.sdk)
      const localProps = ensureLocalProperties(proj, sdkDir)
      if (localProps === 'written') log(`Wrote local.properties (sdk.dir=${sdkDir})`)
      else if (localProps === 'no-sdk')
        log(
          '⚠ No Android SDK found — set $ANDROID_HOME or pass --sdk <dir> if Gradle cannot locate it',
        )

      // Generate the wrapper on request, so subsequent builds are self-contained (JDK-only).
      if (args.wrapper) {
        log(
          `Generating the Gradle wrapper (${gradle.kind === 'wrapper' ? 'gradlew' : gradle.bin})…`,
        )
        execTool(gradle.bin, ['wrapper'], { cwd: proj, stdio: 'inherit' })
        log('Wrapper written → future builds can use ./gradlew (no system Gradle needed)')
      }

      if (args.assemble) {
        // If we just generated the wrapper, prefer it (self-contained) over the bootstrap gradle.
        const runner = args.wrapper ? (resolveGradle({ proj }) ?? gradle) : gradle
        log(`Running ${runner.kind === 'wrapper' ? 'gradlew' : 'gradle'} assembleDebug…`)
        execTool(runner.bin, ['assembleDebug', '--no-daemon'], { cwd: proj, stdio: 'inherit' })
        console.log(
          `\n  ✓ APK → mobile/android/app/build/outputs/apk/debug/app-debug.apk\n    Install: adb install -r that.apk\n`,
        )
      }
    } else {
      console.log(
        `\n  Next: build the APK. Needs a JDK 17+, the Android SDK, and Gradle:\n    apex mobile android --assemble --gradle <path-to-gradle> --sdk <android-sdk-dir>\n  Or, if Gradle is on PATH with $ANDROID_HOME set, just: apex mobile android --assemble\n  First time? Add --wrapper to generate ./gradlew so later builds need no system Gradle.\n  Then: adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk\n`,
      )
    }
  },
})
