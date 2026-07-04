// Terminal UI kit for the Apex CLI — brand banner, spinner, and status output.
// Truecolor when the terminal supports it; degrades cleanly to plain text in
// non-TTY / NO_COLOR / dumb-terminal environments (CI, piped output).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TTY = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR && process.env.TERM !== 'dumb'
const RESET = '\x1b[0m'

/** This package's version, read from its own package.json (for the banner + `apex --version`). */
export const VERSION: string = (() => {
  try {
    return (
      JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'))
        .version || ''
    )
  } catch {
    return ''
  }
})()

function truecolor(r: number, g: number, b: number, s: string): string {
  return TTY ? `\x1b[38;2;${r};${g};${b}m${s}${RESET}` : s
}
function style(code: string, s: string): string {
  return TTY ? `\x1b[${code}m${s}${RESET}` : s
}

export const color = {
  cyan: (s: string) => truecolor(34, 211, 238, s),
  indigo: (s: string) => truecolor(129, 140, 248, s),
  green: (s: string) => truecolor(52, 211, 153, s),
  red: (s: string) => truecolor(248, 113, 113, s),
  gray: (s: string) => truecolor(154, 166, 196, s),
  bold: (s: string) => style('1', s),
  dim: (s: string) => style('2', s),
}

// APEX in the "ANSI Shadow" figlet style.
const LOGO = [
  ' █████╗ ██████╗ ███████╗██╗  ██╗',
  '██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝',
  '███████║██████╔╝█████╗   ╚███╔╝ ',
  '██╔══██║██╔═══╝ ██╔══╝   ██╔██╗ ',
  '██║  ██║██║     ███████╗██╔╝ ██╗',
  '╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝',
]
const FROM: [number, number, number] = [99, 102, 241] // indigo
const TO: [number, number, number] = [34, 211, 238] // cyan

/** The Apex brand banner: the APEX wordmark with a left→right indigo→cyan gradient. */
export function banner(
  subtitle = 'The full-stack, AI-native meta-framework for Alpine.js',
): string {
  const width = LOGO[0]?.length ?? 0
  const rows = LOGO.map((line) => {
    if (!TTY) return `  ${line}`
    let out = '  '
    for (let i = 0; i < line.length; i++) {
      const t = width > 1 ? i / (width - 1) : 0
      const r = Math.round(FROM[0] + (TO[0] - FROM[0]) * t)
      const g = Math.round(FROM[1] + (TO[1] - FROM[1]) * t)
      const b = Math.round(FROM[2] + (TO[2] - FROM[2]) * t)
      out += `\x1b[38;2;${r};${g};${b}m${line[i] ?? ''}`
    }
    return out + RESET
  })
  const ver = VERSION ? `${color.cyan(`v${VERSION}`)}  ${color.gray('·')}  ` : ''
  return `\n${rows.join('\n')}\n  ${ver}${color.gray(subtitle)}\n`
}

export interface Spinner {
  succeed(text?: string): void
  fail(text?: string): void
  stop(): void
}

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/** An animated spinner. Safe with async work (setInterval-driven); no-op animation in non-TTY. */
export function spinner(text: string): Spinner {
  if (!TTY) {
    process.stdout.write(`  ${text}\n`)
    return {
      succeed: (t) => console.log(`  ${color.green('✓')} ${t || text}`),
      fail: (t) => console.log(`  ${color.red('✗')} ${t || text}`),
      stop: () => {},
    }
  }
  let i = 0
  process.stdout.write('\x1b[?25l') // hide cursor
  const id = setInterval(() => {
    process.stdout.write(`\r\x1b[2K  ${color.cyan(FRAMES[i++ % FRAMES.length] ?? '')} ${text}`)
  }, 80)
  const end = (symbol: string, t?: string) => {
    clearInterval(id)
    process.stdout.write(`\r\x1b[2K  ${symbol} ${t || text}\n\x1b[?25h`) // clear line, restore cursor
  }
  return {
    succeed: (t) => end(color.green('✓'), t),
    fail: (t) => end(color.red('✗'), t),
    stop: () => {
      clearInterval(id)
      process.stdout.write('\r\x1b[2K\x1b[?25h')
    },
  }
}

/** Vite-style "ready" block: aligned ➜ label → value rows. */
export function ready(rows: Array<[string, string]>): void {
  const w = Math.max(...rows.map(([l]) => l.length))
  console.log()
  for (const [label, value] of rows) {
    console.log(`  ${color.cyan('➜')}  ${color.bold(label.padEnd(w))}   ${color.cyan(value)}`)
  }
  console.log()
}
