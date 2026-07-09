import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineCommand } from 'citty'
import { applyFeature, featureKeys, featureList, isFeature } from '../features.js'
import { banner, color } from '../ui.js'

// `apex extend <feature>` — add an optional capability (data, auth, i18n) to an
// existing app: copies the feature's files and wires up deps, apex.config.ts,
// .env, and nav. Idempotent (a feature already present is skipped). This is the
// "later" counterpart to the interactive prompts in `apex new`.
//
// Distinct from `apex add`, which copies themeable UI components.
export const extendCommand = defineCommand({
  meta: {
    name: 'extend',
    description: 'Add an optional feature (data, auth, i18n) to your app',
  },
  args: {
    name: {
      type: 'positional',
      required: false,
      description: 'Feature(s) to add, space-separated: data | auth | i18n',
    },
    root: { type: 'string', description: 'Project root', default: '.' },
  },
  run({ args }) {
    process.stdout.write(banner())
    const log = console.log
    const root = resolve(process.cwd(), String(args.root))

    const rest = (args._ as string[] | undefined) ?? []
    const requested = [
      ...new Set([...rest, ...(args.name ? [String(args.name)] : [])].map((s) => s.toLowerCase())),
    ]

    // No args → list the available features.
    if (!requested.length) {
      log(`  ${color.bold('Available features')} ${color.gray('— apex extend <name>')}\n`)
      for (const f of featureList()) {
        log(`    ${color.cyan(f.key.padEnd(6))} ${color.gray(f.summary)}`)
      }
      log('')
      return
    }

    const unknown = requested.filter((n) => !isFeature(n))
    if (unknown.length) {
      console.error(
        `  ${color.red('✗')} Unknown feature(s): ${unknown.join(', ')}. Available: ${featureKeys().join(', ')}\n`,
      )
      process.exit(1)
    }

    if (!existsSync(join(root, 'apex.config.ts'))) {
      console.error(
        `  ${color.red('✗')} No apex.config.ts in ${root} — run this inside an Apex app.\n`,
      )
      process.exit(1)
    }

    let added = 0
    for (const key of requested) if (applyFeature(root, key, log)) added++

    if (added > 0) {
      log(`\n  ${color.green('✓')} Done — install new deps, then restart the dev server:`)
      log(`    ${color.cyan('npm install')} ${color.gray('&&')} ${color.cyan('apex dev')}\n`)
    } else {
      log(`\n  Nothing to do — everything requested is already present.\n`)
    }
  },
})
