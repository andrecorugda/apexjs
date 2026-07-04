/** Reusable client logic: a live character budget for the sign form. */
export function useCharCount(max = 280) {
  return {
    text: '',
    get remaining() {
      return max - this.text.length
    },
    get over() {
      return this.remaining < 0
    },
  }
}
