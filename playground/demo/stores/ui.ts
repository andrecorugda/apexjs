import { defineStore } from '@apex-stack/core'

// Global, SSR-safe UI state shared across the app.
export default defineStore('ui', () => ({
  compact: false,
  toggle() {
    this.compact = !this.compact
  },
}))
