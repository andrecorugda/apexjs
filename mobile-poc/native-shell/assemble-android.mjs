// assemble-android.mjs — assemble a buildable Android project from an Apex app.
// Reference for `apex mobile android` (the eventual CLI). Run from your app root:
//   node path/to/assemble-android.mjs [--icon public/icon.png] [--splash public/splash.png] [--bg '#0b1120']
//
// 1) apex build --mobile        → dist/mobile/server.mjs (+ dist/assets client bundle)
// 2) copy server.mjs + apex-bridge.js + client assets into android/app/src/main/assets/
// 3) generate launcher icons + native splash from your source images
// Then: open native-shell/android in Android Studio → Run (or ./gradlew assembleDebug).
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const app = process.cwd()
const args = process.argv.slice(2)
const flag = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const icon = flag('--icon', 'public/icon.png')
const splash = flag('--splash', null)
const bg = flag('--bg', '#0b0b0b')

const assets = join(here, 'android', 'app', 'src', 'main', 'assets')
mkdirSync(join(assets, 'assets'), { recursive: true })

// 1) build the mobile bundle
console.log('› apex build --mobile')
execSync('npx apex build --mobile', { cwd: app, stdio: 'inherit' })

// 2) copy the self-contained server + the JS bridge + the client assets into APK assets/
cpSync(join(app, 'dist', 'mobile', 'server.mjs'), join(assets, 'server.mjs'))
cpSync(join(here, 'apex-bridge.js'), join(assets, 'apex-bridge.js'))
if (existsSync(join(app, 'dist', 'assets')))
  cpSync(join(app, 'dist', 'assets'), join(assets, 'assets'), { recursive: true })
if (existsSync(join(app, 'dist', 'favicon.svg')))
  cpSync(join(app, 'dist', 'favicon.svg'), join(assets, 'favicon.svg'))
console.log('✓ bundled server + client assets into android/app/src/main/assets/')

// 3) launcher icons + native splash + app name
if (existsSync(join(app, icon))) {
  const genArgs = [join(app, icon), '--out', join(here, 'android'), '--bg', bg]
  if (splash && existsSync(join(app, splash))) genArgs.push('--splash', join(app, splash))
  execSync(`node ${JSON.stringify(join(here, '..', 'gen-mobile-assets.mjs'))} ${genArgs.map((a) => JSON.stringify(a)).join(' ')}`, { stdio: 'inherit' })
} else {
  console.log(`(no ${icon} — keeping the default launcher icon; add one and re-run for a branded icon)`)
}

// app name from apex.config public.appName, if present
try {
  const cfg = readFileSync(join(app, 'apex.config.ts'), 'utf8')
  const name = cfg.match(/appName['"]?\s*:\s*['"]([^'"]+)['"]/)?.[1]
  if (name) {
    const strings = join(here, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml')
    mkdirSync(dirname(strings), { recursive: true })
    writeFileSync(strings, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">${name}</string>\n</resources>\n`)
    console.log(`✓ app name → "${name}"`)
  }
} catch {}

console.log('\n  Done. Open native-shell/android in Android Studio and Run, or:')
console.log('    cd native-shell/android && ./gradlew assembleDebug   → app/build/outputs/apk/debug/app-debug.apk\n')
