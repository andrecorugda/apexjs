/**
 * Reusable client logic. Import it in a <script client> block and use it in x-data:
 *
 *   <script client> import { useToggle } from '../composables/useToggle' </script>
 *   <template x-data="useToggle(true)"> <button @click="toggle()" x-text="on"></button> </template>
 */
export function useToggle(initial = false) {
  return {
    on: initial,
    toggle() {
      this.on = !this.on
    },
  }
}
