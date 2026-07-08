// i18n runtime — client-safe (no node:fs). The server catalog loader lives in
// ./run.ts. Translations resolve dotted keys, interpolate `{param}` placeholders, and
// fall back to the default locale then the key itself. See the i18n guide.

/** A message catalog — nested objects of strings, keyed however you like. */
export type Messages = Record<string, unknown>

export interface I18nOptions {
  /** Catalogs by locale, e.g. `{ en: {...}, fr: {...} }`. */
  messages: Record<string, Messages>
  /** The active locale. */
  locale: string
  /** Locale to fall back to for missing keys. */
  defaultLocale?: string
}

export interface I18n {
  locale: string
  /** Translate `key` (dotted path), interpolating `{param}` values. */
  t(key: string, params?: Record<string, unknown>): string
}

/** Resolve a dotted key (`a.b.c`) against a nested catalog. */
function lookup(catalog: Messages | undefined, key: string): unknown {
  if (!catalog) return undefined
  return key
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      catalog,
    )
}

/** Replace `{name}` placeholders; unknown placeholders are left as-is. */
function interpolate(str: string, params?: Record<string, unknown>): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
}

/**
 * Build an i18n instance for a locale.
 *
 * ```ts
 * const { t } = createI18n({ messages, locale: 'fr', defaultLocale: 'en' })
 * t('welcome', { name: 'Ada' }) // "Bienvenue, Ada"
 * ```
 */
export function createI18n(opts: I18nOptions): I18n {
  const { messages, locale, defaultLocale } = opts
  const t = (key: string, params?: Record<string, unknown>): string => {
    let value = lookup(messages[locale], key)
    if (value === undefined && defaultLocale && defaultLocale !== locale) {
      value = lookup(messages[defaultLocale], key)
    }
    if (typeof value !== 'string') return key // missing → the key itself (visible + debuggable)
    return interpolate(value, params)
  }
  return { locale, t }
}

export interface ResolveLocaleInput {
  /** Request path (e.g. `/fr/about`). */
  path?: string
  /** `Accept-Language` header value. */
  acceptLanguage?: string
  /** Supported locales. */
  locales: string[]
  /** Fallback locale. */
  defaultLocale: string
}

export interface ResolvedLocale {
  locale: string
  /** The path with any leading `/<locale>` prefix stripped (for route matching). */
  path: string
}

/**
 * Determine the request's locale: a leading `/<locale>` path prefix wins, else the
 * best `Accept-Language` match among `locales`, else `defaultLocale`. Returns the
 * locale and the path with the prefix stripped so routing matches locale-free.
 */
export function resolveLocale(input: ResolveLocaleInput): ResolvedLocale {
  const { acceptLanguage = '', locales, defaultLocale } = input
  const path = input.path || '/'
  const segments = path.split('/').filter(Boolean)

  if (segments[0] && locales.includes(segments[0])) {
    const rest = `/${segments.slice(1).join('/')}`
    return { locale: segments[0], path: rest === '/' ? '/' : rest }
  }

  for (const part of acceptLanguage.split(',')) {
    const tag = part.trim().split(';')[0]?.trim() ?? ''
    const base = tag.split('-')[0]
    if (tag && locales.includes(tag)) return { locale: tag, path }
    if (base && locales.includes(base)) return { locale: base, path }
  }

  return { locale: defaultLocale, path }
}

/** i18n config block for `apex.config.ts`. */
export interface I18nConfig {
  defaultLocale: string
  locales: string[]
}
