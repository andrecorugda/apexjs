import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { captureTool, resolveBin } from '../util/externalTool.js'
import { resolveGradle, resolveSdkDir } from './androidToolchain.js'
import { type AndroidRequirements, parseJavaMajor } from './requirements.js'

// Official, stable landing pages — deliberately the human-facing docs, not deep-linked
// version-specific binaries (those rot). The doctor prints these next to each missing dep.
export const LINKS = {
  cmdlineTools: 'https://developer.android.com/studio#command-tools',
  jdk: 'https://adoptium.net/temurin/releases/',
  gradle: 'https://gradle.org/install/',
  xcode: 'https://apps.apple.com/app/xcode/id497799835',
  xcodegen: 'https://github.com/yonaskolb/XcodeGen#installing',
} as const

export type CheckStatus = 'ok' | 'missing' | 'outdated' | 'na'

export interface Check {
  key: string
  label: string
  status: CheckStatus
  detail: string
  /** Human copy-paste setup lines (already OS-specific), shown when not `ok`. */
  steps?: string[]
  link?: string
  /** A safe step `--fix` can run itself (present only when the prerequisites are already there). */
  auto?: { describe: string; bin: string; args: string[]; cwd?: string }
}

export interface DoctorReport {
  platform: NodeJS.Platform
  android: Check[]
  ios: Check[]
  req: AndroidRequirements
}

const win = () => process.platform === 'win32'
const exe = (name: string) => (win() ? `${name}.exe` : name)

/** The `java` binary to probe: `$JAVA_HOME/bin/java` first (what Gradle uses), else PATH. */
function javaBin(): string | null {
  const home = process.env.JAVA_HOME
  if (home) {
    const p = join(home, 'bin', exe('java'))
    if (existsSync(p)) return p
  }
  return resolveBin('java')
}

export function detectJdk(req: AndroidRequirements): Check {
  const bin = javaBin()
  const base: Check = { key: 'jdk', label: `JDK ${req.jdkFloor}+`, status: 'missing', detail: '' }
  if (!bin) {
    return {
      ...base,
      detail: 'not found (no JAVA_HOME, no java on PATH)',
      link: LINKS.jdk,
      steps: [
        `Install a JDK ${req.jdkFloor} or newer (Eclipse Temurin is a clean, free build):`,
        `  ${LINKS.jdk}`,
        win()
          ? '  then set JAVA_HOME to its folder, e.g. setx JAVA_HOME "C:\\Program Files\\Eclipse Adoptium\\jdk-17"'
          : '  then export JAVA_HOME=/path/to/jdk (add it to your shell profile)',
      ],
    }
  }
  const out = captureTool(bin, ['-version'])
  const major = out ? parseJavaMajor(out.stderr || out.stdout) : null
  if (major == null) return { ...base, status: 'ok', detail: `found (${bin}) — version unreadable` }
  if (major < req.jdkFloor)
    return {
      ...base,
      status: 'outdated',
      detail: `JDK ${major} found, but the build needs ${req.jdkFloor}+`,
      link: LINKS.jdk,
      steps: [`Install JDK ${req.jdkFloor}+ and point JAVA_HOME at it: ${LINKS.jdk}`],
    }
  return { ...base, status: 'ok', detail: `JDK ${major} (${bin})` }
}

/** All Android SDK checks: the SDK root, platform-tools, build-tools, the compile platform,
 *  and whether `sdkmanager` is available to automate installs. */
export function detectAndroidSdk(sdkDir: string | null, req: AndroidRequirements): Check[] {
  if (!sdkDir || !existsSync(sdkDir)) {
    return [
      {
        key: 'sdk',
        label: 'Android SDK',
        status: 'missing',
        detail: sdkDir ? `not found at ${sdkDir}` : 'not set ($ANDROID_HOME / --sdk)',
        link: LINKS.cmdlineTools,
        steps: [
          `Download the Android command-line tools (no Android Studio needed): ${LINKS.cmdlineTools}`,
          win()
            ? '  Unzip to  %LOCALAPPDATA%\\Android\\Sdk\\cmdline-tools\\latest'
            : '  Unzip to  ~/Android/Sdk/cmdline-tools/latest',
          win()
            ? '  setx ANDROID_HOME "%LOCALAPPDATA%\\Android\\Sdk"'
            : '  export ANDROID_HOME=~/Android/Sdk',
          `  Then run "apex mobile doctor --fix" to install platform-tools, build-tools ${req.buildTools}, and platform android-${req.compileSdk}.`,
        ],
      },
    ]
  }

  const sdkmgr = join(
    sdkDir,
    'cmdline-tools',
    'latest',
    'bin',
    win() ? 'sdkmanager.bat' : 'sdkmanager',
  )
  const hasSdkmgr = existsSync(sdkmgr)
  const autoInstall = (pkg: string): Check['auto'] =>
    hasSdkmgr ? { describe: `sdkmanager "${pkg}"`, bin: sdkmgr, args: [pkg] } : undefined

  const manual = (pkg: string): string[] => [
    hasSdkmgr
      ? `Run: "${sdkmgr}" "${pkg}"   (or: apex mobile doctor --fix)`
      : `Install the command-line tools first (${LINKS.cmdlineTools}), then: sdkmanager "${pkg}"`,
  ]

  const platformTools = existsSync(join(sdkDir, 'platform-tools', exe('adb')))
  const buildTools = existsSync(join(sdkDir, 'build-tools', req.buildTools))
  const platform = existsSync(join(sdkDir, 'platforms', `android-${req.compileSdk}`))

  return [
    { key: 'sdk', label: 'Android SDK', status: 'ok', detail: sdkDir },
    {
      key: 'platform-tools',
      label: 'platform-tools',
      status: platformTools ? 'ok' : 'missing',
      detail: platformTools ? 'installed' : 'missing (adb)',
      ...(platformTools
        ? {}
        : {
            steps: manual('platform-tools'),
            auto: autoInstall('platform-tools'),
          }),
    },
    {
      key: 'build-tools',
      label: `build-tools ${req.buildTools}`,
      status: buildTools ? 'ok' : 'missing',
      detail: buildTools ? 'installed' : `missing (build-tools;${req.buildTools})`,
      ...(buildTools
        ? {}
        : {
            steps: manual(`build-tools;${req.buildTools}`),
            auto: autoInstall(`build-tools;${req.buildTools}`),
          }),
    },
    {
      key: 'platform',
      label: `platform android-${req.compileSdk}`,
      status: platform ? 'ok' : 'missing',
      detail: platform ? 'installed' : `missing (platforms;android-${req.compileSdk})`,
      ...(platform
        ? {}
        : {
            steps: manual(`platforms;android-${req.compileSdk}`),
            auto: autoInstall(`platforms;android-${req.compileSdk}`),
          }),
    },
  ]
}

export function detectGradle(opts: { proj: string; gradleArg?: string }): Check {
  const g = resolveGradle({ gradleArg: opts.gradleArg, proj: opts.proj })
  if (!g)
    return {
      key: 'gradle',
      label: 'Gradle',
      status: 'missing',
      detail: 'not found (--gradle, project gradlew, $APEX_GRADLE, or PATH)',
      link: LINKS.gradle,
      steps: [
        `Install Gradle (${LINKS.gradle}) and put it on PATH, or pass --gradle <path>.`,
        'Or generate the project wrapper once: apex mobile android --wrapper --gradle <path>  (then no system Gradle is needed).',
      ],
    }
  const out = captureTool(g.bin, ['-v'])
  const ver = out?.stdout.match(/Gradle\s+([\d.]+)/)?.[1]
  const via = g.kind === 'wrapper' ? 'gradlew wrapper' : g.kind
  return {
    key: 'gradle',
    label: 'Gradle',
    status: 'ok',
    detail: ver ? `Gradle ${ver} (${via})` : `found (${via})`,
  }
}

/** iOS checks. Off macOS this is a single, honest "needs a Mac" line — the rest is `na`. */
export function detectIos(): Check[] {
  if (process.platform !== 'darwin') {
    return [
      {
        key: 'macos',
        label: 'macOS',
        status: 'na',
        detail: `iOS builds require a Mac + Xcode (you're on ${process.platform}). Use a Mac or a macOS CI runner.`,
      },
    ]
  }
  const xcode = captureTool('xcodebuild', ['-version'])
  const xcodegen = resolveBin('xcodegen')
  const brew = resolveBin('brew')
  return [
    {
      key: 'xcode',
      label: 'Xcode',
      status: xcode && xcode.code === 0 ? 'ok' : 'missing',
      detail: xcode?.stdout.split('\n')[0]?.trim() || 'not found',
      ...(xcode && xcode.code === 0
        ? {}
        : {
            link: LINKS.xcode,
            steps: [
              `Install Xcode from the Mac App Store: ${LINKS.xcode}`,
              'Then: xcode-select --install (command-line tools).',
            ],
          }),
    },
    {
      key: 'xcodegen',
      label: 'XcodeGen',
      status: xcodegen ? 'ok' : 'missing',
      detail: xcodegen ? 'installed' : 'not found',
      ...(xcodegen
        ? {}
        : {
            link: LINKS.xcodegen,
            steps: [
              brew
                ? 'Run: brew install xcodegen   (or: apex mobile doctor --fix)'
                : `Install Homebrew, then: brew install xcodegen — ${LINKS.xcodegen}`,
            ],
            auto: brew
              ? { describe: 'brew install xcodegen', bin: brew, args: ['install', 'xcodegen'] }
              : undefined,
          }),
    },
  ]
}

export interface DoctorOptions {
  proj: string
  sdkArg?: string
  gradleArg?: string
  req: AndroidRequirements
}

/** Run every probe and assemble the full report. Pure orchestration over the detectors above. */
export function runDoctor(opts: DoctorOptions): DoctorReport {
  const sdkDir = resolveSdkDir(opts.sdkArg)
  return {
    platform: process.platform,
    req: opts.req,
    android: [
      detectJdk(opts.req),
      ...detectAndroidSdk(sdkDir, opts.req),
      detectGradle({ proj: opts.proj, gradleArg: opts.gradleArg }),
    ],
    ios: detectIos(),
  }
}

const ICON: Record<CheckStatus, string> = { ok: '✓', missing: '✗', outdated: '△', na: '–' }

/** Render the report as the walkthrough: a status board plus, for each gap, a link + the exact
 *  copy-paste setup commands for this OS. Pure — returns the string, prints nothing. */
export function renderReport(
  report: DoctorReport,
  color: {
    green: (s: string) => string
    red: (s: string) => string
    gray: (s: string) => string
    cyan: (s: string) => string
    bold: (s: string) => string
  },
): string {
  const paint = (s: CheckStatus, t: string) =>
    s === 'ok' ? color.green(t) : s === 'na' ? color.gray(t) : color.red(t)
  const lines: string[] = []
  const section = (title: string, checks: Check[]) => {
    lines.push('', color.bold(title))
    for (const c of checks) {
      lines.push(
        `  ${paint(c.status, ICON[c.status])} ${c.label.padEnd(22)} ${color.gray(c.detail)}`,
      )
      if (c.status !== 'ok' && c.status !== 'na') {
        for (const step of c.steps ?? []) lines.push(`      ${color.gray(step)}`)
      }
    }
  }
  section('Android', report.android)
  section('iOS', report.ios)

  const gaps = report.android.filter((c) => c.status === 'missing' || c.status === 'outdated')
  const autoable = gaps.filter((c) => c.auto).length
  lines.push('')
  if (gaps.length === 0) {
    lines.push(color.green('  ✓ Android toolchain ready — run: apex mobile android --assemble'))
  } else {
    lines.push(color.gray(`  ${gaps.length} item(s) to resolve.`))
    if (autoable > 0)
      lines.push(
        color.cyan(
          `  Run "apex mobile doctor --fix" to auto-install ${autoable} of them (with your consent).`,
        ),
      )
  }
  return `${lines.join('\n')}\n`
}

/** The subset of gaps `--fix` can safely act on right now (their prerequisites are present). */
export function fixableSteps(report: DoctorReport): NonNullable<Check['auto']>[] {
  return [...report.android, ...report.ios]
    .filter((c) => c.status !== 'ok' && c.auto)
    .map((c) => c.auto as NonNullable<Check['auto']>)
}
