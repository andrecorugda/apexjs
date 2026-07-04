/**
 * Reusable client logic: a live character budget for the sign form.
 *
 * Note: these are methods, not getters. Composables are commonly merged into an
 * x-data via object spread (`x-data="{ ...useCharCount(280), submit }"`), and
 * spreading an object *evaluates* its getters into static values — killing
 * reactivity. Methods survive the spread and re-evaluate on every render.
 */
export function useCharCount(max = 280) {
  return {
    text: '',
    remaining() {
      return max - this.text.length
    },
    over() {
      return this.remaining() < 0
    },
  }
}
