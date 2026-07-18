import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { ensureLocalProperties, resolveSdkDir } from '../mobile/androidToolchain.js'
import { fixableSteps, renderReport, runDoctor } from '../mobile/doctor.js'
import { deriveAndroidRequirements } from '../mobile/requirements.js'
import { color } from '../ui.js'
import { execTool } from '../util/externalTool.js'

const TEMPLATE = fileURLToPath(new URL('../templates/mobile', import.meta.url))
const win = () => process.platform === 'win32'

export const mobileDoctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Check the native mobile toolchain (JDK/SDK/Gradle, Xcode) and help set it up',
  },
  args: {
    fix: {
      type: 'boolean',
      description:
        'Run the safe automatable setup steps (sdkmanager installs, licenses, local.properties)',
    },
    sdk: { type: 'string', description: 'Android SDK dir to check (defaults to $ANDROID_HOME)' },
    gradle: {
      type: 'string',
      description: 'Gradle binary to check (as for `apex mobile android`)',
    },
    root: { type: 'string', description: 'Project root', default: '.' },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.root)
    const proj = join(root, 'mobile', 'android')
    // Requirements come from the scaffolded project's Gradle files first (authoritative for
    // THIS app), then the packaged template — never hardcoded in the CLI.
    const req = deriveAndroidRequirements(proj, join(TEMPLATE, 'android'))

    const report = runDoctor({ proj, sdkArg: args.sdk, gradleArg: args.gradle, req })
    process.stdout.write(renderReport(report, color))

    if (!args.fix) return

    const steps = fixableSteps(report)
    if (steps.length === 0) {
      console.log(
        color.gray(
          '\n  Nothing to auto-fix — the remaining items need a manual install (see the links above).\n',
        ),
      )
      return
    }

    // Accept the SDK licenses once, before any package install (a legal gate that installs need).
    const sdkDir = resolveSdkDir(args.sdk)
    const sdkmgr = sdkDir
      ? join(sdkDir, 'cmdline-tools', 'latest', 'bin', win() ? 'sdkmanager.bat' : 'sdkmanager')
      : null
    const installingSdk = steps.some((s) => s.bin === sdkmgr)
    if (sdkmgr && existsSync(sdkmgr) && installingSdk) {
      console.log(color.cyan('\n  → sdkmanager --licenses  (accept to continue)'))
      try {
        execTool(sdkmgr, ['--licenses'], { cwd: root, stdio: 'inherit' })
      } catch {
        console.error(
          color.red('  ✗ License acceptance failed/declined — package installs may fail.'),
        )
      }
    }

    for (const s of steps) {
      console.log(color.cyan(`\n  → ${s.describe}`))
      try {
        execTool(s.bin, s.args, { cwd: s.cwd ?? root, stdio: 'inherit' })
      } catch {
        console.error(
          color.red(`  ✗ ${s.describe} failed — run it manually (see the steps above).`),
        )
      }
    }

    // Wire the SDK into the project so `--assemble` finds it without env each run.
    if (sdkDir && existsSync(proj)) {
      const wrote = ensureLocalProperties(proj, sdkDir)
      if (wrote === 'written')
        console.log(color.gray(`\n  Wrote mobile/android/local.properties (sdk.dir=${sdkDir})`))
    }

    console.log(color.bold('\n  Re-checking…'))
    process.stdout.write(
      renderReport(runDoctor({ proj, sdkArg: args.sdk, gradleArg: args.gradle, req }), color),
    )
  },
})
