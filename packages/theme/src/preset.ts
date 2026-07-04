// Tailwind preset that maps utility classes to the Apex theme's CSS variables.
// Add it to a project's Tailwind config and utilities like `bg-primary`,
// `text-primary-fg`, `border-border`, `rounded` become theme-driven — restyle
// the whole app by changing the tokens, no component edits.
//
//   // tailwind.config.js
//   import { apexPreset } from '@apex-stack/theme/preset'
//   export default { presets: [apexPreset], content: ['./**/*.alpine'] }

export const apexPreset = {
  theme: {
    extend: {
      colors: {
        bg: 'var(--ax-bg)',
        fg: 'var(--ax-fg)',
        muted: 'var(--ax-muted)',
        border: 'var(--ax-border)',
        card: { DEFAULT: 'var(--ax-card)', fg: 'var(--ax-card-fg)' },
        primary: { DEFAULT: 'var(--ax-primary)', fg: 'var(--ax-primary-fg)' },
        accent: { DEFAULT: 'var(--ax-accent)', fg: 'var(--ax-accent-fg)' },
        success: 'var(--ax-success)',
        danger: 'var(--ax-danger)',
      },
      borderColor: { DEFAULT: 'var(--ax-border)' },
      borderRadius: { DEFAULT: 'var(--ax-radius)' },
      fontFamily: {
        sans: 'var(--ax-font-sans)',
        mono: 'var(--ax-font-mono)',
      },
    },
  },
}

export default apexPreset
