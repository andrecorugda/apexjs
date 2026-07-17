import { defineConfig } from '@apex-stack/core'

// Runtime configuration — declare defaults here, override any value from the
// environment. Private keys map to APEX_<KEY>; public keys to APEX_PUBLIC_<KEY>
// (camelCase ↔ SCREAMING_SNAKE). Values in .env win over these defaults.
//
// Read it anywhere:
//   • loaders/routes:  ({ config }) => config.public.appName
//   • components/composables (client): useRuntimeConfig().public.appName
//   • raw escape hatch: env('SOME_KEY', 'fallback')
export default defineConfig({
  // Runs first in <head>, before paint — sets the `dark` class from the saved theme (or the
  // OS preference) so there's no light→dark flash on load or on any reload.
  head: `<script>try{var t=localStorage.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}</script>`,

  runtimeConfig: {
    // Private — server-only, never sent to the browser.
    apiSecret: '', // ← APEX_API_SECRET
    // Seals the session cookie (auth). MUST be ≥32 chars; override in prod.
    sessionPassword: 'apex-showcase-dev-session-password-change-me', // ← APEX_SESSION_PASSWORD

    // Public — serialized into the page, readable in the browser.
    public: {
      appName: 'apex-showcase', //            ← APEX_PUBLIC_APP_NAME
      siteUrl: 'http://localhost:3000', // ← APEX_PUBLIC_SITE_URL
    },
  },

  // Internationalization. Catalogs live in locales/<locale>.json; a /<locale>
  // path prefix or the Accept-Language header selects the active locale.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
  },
})
