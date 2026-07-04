// Apex theme — the design-token contract every component inherits.
//
// Adopts the PenguinUI token vocabulary (Tailwind v4 `@theme`): semantic color
// roles (surface / primary / secondary / on-* / outline / info-success-warning-
// danger), a `-dark` set toggled by a `.dark` ancestor, a radius, and two font
// roles. Components style against these (`bg-primary`, `text-on-surface`, …), so
// one theme — applied once — restyles the whole app.
//
// Tokens + component patterns adapted from PenguinUI (MIT). See NOTICE.

/** All color roles (light + `-dark` + scheme-shared). Kebab keys map to `--color-<key>`. */
export interface ThemeColors {
  surface: string
  'surface-alt': string
  'on-surface': string
  'on-surface-strong': string
  primary: string
  'on-primary': string
  secondary: string
  'on-secondary': string
  outline: string
  'outline-strong': string
  'surface-dark': string
  'surface-dark-alt': string
  'on-surface-dark': string
  'on-surface-dark-strong': string
  'primary-dark': string
  'on-primary-dark': string
  'secondary-dark': string
  'on-secondary-dark': string
  'outline-dark': string
  'outline-dark-strong': string
  info: string
  'on-info': string
  success: string
  'on-success': string
  warning: string
  'on-warning': string
  danger: string
  'on-danger': string
}

export interface Theme {
  colors: ThemeColors
  radius: string
  fonts: { body: string; title: string }
}

export type ThemeInput = {
  colors?: Partial<ThemeColors>
  radius?: string
  fonts?: Partial<Theme['fonts']>
}

const SANS = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'

/** The default Apex theme — PenguinUI's neutral base, resolved to portable hex. */
export const defaultTheme: Theme = {
  radius: '0.25rem',
  fonts: {
    body: `"Instrument Sans", ${SANS}`,
    title: `"Montserrat", ${SANS}`,
  },
  colors: {
    // Light
    surface: '#ffffff',
    'surface-alt': '#fafafa',
    'on-surface': '#525252',
    'on-surface-strong': '#171717',
    primary: '#000000',
    'on-primary': '#f5f5f5',
    secondary: '#262626',
    'on-secondary': '#ffffff',
    outline: '#d4d4d4',
    'outline-strong': '#262626',
    // Dark
    'surface-dark': '#0a0a0a',
    'surface-dark-alt': '#171717',
    'on-surface-dark': '#d4d4d4',
    'on-surface-dark-strong': '#ffffff',
    'primary-dark': '#ffffff',
    'on-primary-dark': '#000000',
    'secondary-dark': '#d4d4d4',
    'on-secondary-dark': '#000000',
    'outline-dark': '#404040',
    'outline-dark-strong': '#d4d4d4',
    // Shared (scheme-independent status colors)
    info: '#0ea5e9',
    'on-info': '#ffffff',
    success: '#22c55e',
    'on-success': '#ffffff',
    warning: '#f59e0b',
    'on-warning': '#ffffff',
    danger: '#ef4444',
    'on-danger': '#ffffff',
  },
}

/** Merge a partial theme onto the default (flat color merge). */
export function defineTheme(input: ThemeInput = {}): Theme {
  return {
    radius: input.radius ?? defaultTheme.radius,
    fonts: { ...defaultTheme.fonts, ...(input.fonts ?? {}) },
    colors: { ...defaultTheme.colors, ...(input.colors ?? {}) },
  }
}

/** The Tailwind v4 dark variant used by the components (`dark:` → a `.dark` ancestor). */
export const darkVariant = '@custom-variant dark (&:where(.dark, .dark *));'

/**
 * Render a theme to a Tailwind v4 `@theme` block — registers the tokens as
 * utilities (`bg-primary`, `rounded-radius`, `font-title`, …) AND exposes them as
 * runtime CSS variables. Import the output once (e.g. in `app.css`, after
 * `@import 'tailwindcss'`) and every component inherits it.
 */
export function renderThemeCss(theme: Theme = defaultTheme): string {
  const lines: string[] = [
    `  --font-body: ${theme.fonts.body};`,
    `  --font-title: ${theme.fonts.title};`,
  ]
  for (const [key, value] of Object.entries(theme.colors)) {
    lines.push(`  --color-${key}: ${value};`)
  }
  lines.push(`  --radius-radius: ${theme.radius};`)
  return `@theme {\n${lines.join('\n')}\n}`
}

/** A ready-to-import stylesheet: the dark variant + the default theme. */
export const defaultThemeCss: string = `${darkVariant}\n\n${renderThemeCss(defaultTheme)}`
