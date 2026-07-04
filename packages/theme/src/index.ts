// Apex theme — a small set of semantic design tokens exposed as CSS variables.
// One theme, applied once, is inherited by every component (they style against
// the `--ax-*` variables via the Tailwind preset or directly). The website theme
// builder emits a token override that `apex theme` writes into a project.

/** Semantic color roles. Values are any CSS color. */
export interface ThemeColors {
  bg: string
  fg: string
  muted: string
  border: string
  card: string
  cardFg: string
  primary: string
  primaryFg: string
  accent: string
  accentFg: string
  success: string
  danger: string
}

export interface Theme {
  /** Per-scheme color roles. */
  colors: { light: ThemeColors; dark: ThemeColors }
  /** Base border radius (e.g. `0.6rem`). */
  radius: string
  /** Optional font stacks. */
  fonts: { sans: string; mono: string }
}

/** A partial theme, as produced by the theme builder / passed to `defineTheme`. */
export type ThemeInput = {
  colors?: { light?: Partial<ThemeColors>; dark?: Partial<ThemeColors> }
  radius?: string
  fonts?: Partial<Theme['fonts']>
}

/** The default Apex theme — the glacier (indigo) / alpenglow (cyan) identity. */
export const defaultTheme: Theme = {
  radius: '0.6rem',
  fonts: {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
  },
  colors: {
    light: {
      bg: '#ffffff',
      fg: '#0a0e1a',
      muted: '#55617e',
      border: '#e2e8f0',
      card: '#f8fafc',
      cardFg: '#0a0e1a',
      primary: '#4f46e5',
      primaryFg: '#ffffff',
      accent: '#0891b2',
      accentFg: '#ffffff',
      success: '#0f9d6f',
      danger: '#dc2626',
    },
    dark: {
      bg: '#0a0e1a',
      fg: '#f4f7ff',
      muted: '#9aa6c4',
      border: '#1e293b',
      card: '#11172b',
      cardFg: '#f4f7ff',
      primary: '#818cf8',
      primaryFg: '#0a0e1a',
      accent: '#22d3ee',
      accentFg: '#0a0e1a',
      success: '#34d399',
      danger: '#f87171',
    },
  },
}

/** camelCase color key → kebab CSS-var name (`primaryFg` → `--ax-primary-fg`). */
function varName(key: string): string {
  return `--ax-${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

function mergeColors(base: ThemeColors, over?: Partial<ThemeColors>): ThemeColors {
  return { ...base, ...(over ?? {}) }
}

/** Merge a partial theme onto the default. Deep-merges the two color schemes. */
export function defineTheme(input: ThemeInput = {}): Theme {
  return {
    radius: input.radius ?? defaultTheme.radius,
    fonts: { ...defaultTheme.fonts, ...(input.fonts ?? {}) },
    colors: {
      light: mergeColors(defaultTheme.colors.light, input.colors?.light),
      dark: mergeColors(defaultTheme.colors.dark, input.colors?.dark),
    },
  }
}

function schemeVars(colors: ThemeColors, radius: string, fonts: Theme['fonts']): string {
  const lines = Object.entries(colors).map(([k, v]) => `  ${varName(k)}: ${v};`)
  lines.push(`  --ax-radius: ${radius};`)
  lines.push(`  --ax-font-sans: ${fonts.sans};`)
  lines.push(`  --ax-font-mono: ${fonts.mono};`)
  return lines.join('\n')
}

/**
 * Render a theme to a CSS string: light tokens on `:root`, dark tokens under both
 * the OS preference and an explicit `data-theme="dark"` (the toggle wins). Import
 * the output once (e.g. into `app.css`) and every component inherits it.
 */
export function renderThemeCss(theme: Theme = defaultTheme): string {
  const { light, dark } = theme.colors
  return [
    `:root {\n${schemeVars(light, theme.radius, theme.fonts)}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${schemeVars(dark, theme.radius, theme.fonts).replace(/^/gm, '  ')}\n  }\n}`,
    `:root[data-theme="dark"] {\n${schemeVars(dark, theme.radius, theme.fonts)}\n}`,
  ].join('\n\n')
}

/** The default theme rendered to CSS — a ready-to-import stylesheet string. */
export const defaultThemeCss: string = renderThemeCss(defaultTheme)
