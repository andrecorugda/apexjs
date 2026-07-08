// Server-only: load message catalogs from `locales/<locale>.json`.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Messages } from './index.js'

/**
 * Load `locales/<locale>.json` for each locale into a `{ [locale]: catalog }` map.
 * Missing/invalid files yield an empty catalog (t falls back to the default/key).
 */
export function loadMessages(root: string, locales: string[]): Record<string, Messages> {
  const out: Record<string, Messages> = {}
  for (const locale of locales) {
    const file = join(root, 'locales', `${locale}.json`)
    if (!existsSync(file)) {
      out[locale] = {}
      continue
    }
    try {
      out[locale] = JSON.parse(readFileSync(file, 'utf8')) as Messages
    } catch {
      out[locale] = {}
    }
  }
  return out
}
