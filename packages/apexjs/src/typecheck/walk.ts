import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SKIP = new Set(['node_modules', 'dist', '.git', '.apex', 'build', '.vercel', '.netlify'])

/** Recursively list absolute paths of every `.alpine` file under `root`. */
export function listAlpineFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.name !== '.') continue
      if (SKIP.has(entry.name)) continue
      const p = join(dir, entry.name)
      if (entry.isDirectory()) walk(p)
      else if (entry.name.endsWith('.alpine')) out.push(p)
    }
  }
  walk(root)
  return out
}
