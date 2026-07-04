import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  darkVariant,
  defaultThemeCss,
  defineTheme,
  renderThemeCss,
  type ThemeInput,
} from '@apex-stack/theme'
import { defineCommand } from 'citty'
import { banner, color } from '../ui.js'

const START = '/* apex-theme:start */'
const END = '/* apex-theme:end */'

/** Find the project's Tailwind entry stylesheet (matches the dev server's lookup). */
function findAppCss(root: string): string | null {
  return (
    ['app.css', 'styles/app.css', 'src/app.css'].map((p) => join(root, p)).find(existsSync) ?? null
  )
}

/** Replace (or insert) the managed theme block between the markers. */
function applyBlock(css: string, block: string): string {
  const re = new RegExp(
    `${START.replace(/[/*]/g, '\\$&')}[\\s\\S]*?${END.replace(/[/*]/g, '\\$&')}`,
  )
  if (re.test(css)) return css.replace(re, block)
  // No markers yet — insert after the tailwind import, else prepend.
  if (/@import\s+['"]tailwindcss['"];?/.test(css)) {
    return css.replace(/(@import\s+['"]tailwindcss['"];?\s*)/, `$1\n${block}\n`)
  }
  return `${block}\n\n${css}`
}

export const themeCommand = defineCommand({
  meta: {
    name: 'theme',
    description: 'Write/update the theme tokens (colors, radius, fonts) in your CSS',
  },
  args: {
    root: { type: 'string', description: 'Project root', default: '.' },
    out: { type: 'string', description: 'Target stylesheet (defaults to your app.css)' },
    primary: { type: 'string', description: 'Primary color (light), e.g. #4f46e5' },
    'primary-dark': { type: 'string', description: 'Primary color (dark)' },
    secondary: { type: 'string', description: 'Secondary color (light)' },
    radius: { type: 'string', description: 'Border radius, e.g. 0.5rem' },
    'font-body': { type: 'string', description: 'Body font stack' },
    'font-title': { type: 'string', description: 'Title font stack' },
  },
  run({ args }) {
    const root = resolve(process.cwd(), String(args.root))
    // biome-ignore lint/suspicious/noConsole: CLI output
    const log = console.log
    process.stdout.write(banner())

    const colors: Record<string, string> = {}
    if (args.primary) colors.primary = String(args.primary)
    if (args['primary-dark']) colors['primary-dark'] = String(args['primary-dark'])
    if (args.secondary) colors.secondary = String(args.secondary)
    const input: ThemeInput = {}
    if (Object.keys(colors).length) input.colors = colors as ThemeInput['colors']
    if (args.radius) input.radius = String(args.radius)
    if (args['font-body'] || args['font-title']) {
      input.fonts = {}
      if (args['font-body']) input.fonts.body = String(args['font-body'])
      if (args['font-title']) input.fonts.title = String(args['font-title'])
    }
    const customized = Object.keys(input).length > 0
    const block = `${START}\n${customized ? `${darkVariant}\n\n${renderThemeCss(defineTheme(input))}` : defaultThemeCss}\n${END}`

    const target = args.out ? resolve(root, String(args.out)) : findAppCss(root)
    if (!target) {
      // No stylesheet yet — create app.css set up for Tailwind + the theme.
      const created = join(root, 'app.css')
      writeFileSync(created, `@import 'tailwindcss';\n@source './**/*.alpine';\n\n${block}\n`)
      log(`  ${color.green('+')} Created ${color.bold('app.css')} with Tailwind + the theme.`)
    } else {
      const before = readFileSync(target, 'utf8')
      writeFileSync(target, applyBlock(before, block))
      const rel = target.replace(`${root}/`, '')
      log(`  ${color.green('✓')} Updated theme tokens in ${color.bold(rel)}`)
    }
    if (customized) {
      log(
        `  ${color.gray('Applied:')} ${Object.entries({ ...colors, radius: args.radius })
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}=${v}`)
          .join('  ')}`,
      )
    }
    log(
      `  ${color.gray('Every component inherits it — restart the dev server if it is running.')}\n`,
    )
  },
})
