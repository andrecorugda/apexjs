/**
 * Shared types — the single source of truth for shapes used across the app,
 * on the BACKEND (routes, services) and the FRONTEND. Import from '../shared/types'.
 *
 * Defining types here (instead of inline) is what keeps a growing codebase clean:
 * one place to change a shape, and the compiler enforces it everywhere it's used.
 */
export interface Greeting {
  message: string
  at: string
}
