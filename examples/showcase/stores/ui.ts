import { defineStore } from '@apex-stack/core'

// Global, SSR-safe state shared across pages, components, and islands: $store.ui
export default defineStore('ui', () => ({
  menuOpen: false,
  toggleMenu() {
    this.menuOpen = !this.menuOpen
  },
}))
