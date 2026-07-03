import { stringify } from 'devalue'

/**
 * Serialize loader data for embedding in the page.
 *
 * devalue is used instead of JSON.stringify because it is XSS-safe for HTML
 * embedding (escapes `<`, U+2028, U+2029) and round-trips Dates, Maps, Sets and
 * cyclic references that JSON corrupts or throws on. The client runtime parses
 * it back with devalue's `parse`.
 */
export function serializeState(data: unknown): string {
  return stringify(data)
}

/** Build the `<script type="application/json">` state island for a component. */
export function stateIsland(componentId: string, data: unknown): string {
  return `<script type="application/json" data-apex-state="${componentId}">${serializeState(
    data,
  )}</script>`
}
