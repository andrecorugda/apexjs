import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { defineApexRoute, type InferInput, type InferOutput } from './defineRoute.js'

describe('defineApexRoute', () => {
  it('normalizes config into a route object', () => {
    const route = defineApexRoute({
      method: 'POST',
      input: { name: z.string() },
      mcp: true,
      handler: ({ input }) => ({ greeting: `hi ${input.name}` }),
    })
    expect(route.method).toBe('POST')
    expect(route.mcp).toBe(true)
    expect(route.inputShape).toBeDefined()
  })

  it('carries input/output types for the frontend (InferInput/InferOutput)', () => {
    const route = defineApexRoute({
      input: { id: z.coerce.number() },
      handler: ({ input }) => ({ id: input.id, ok: true }),
    })
    // Type-level assertions — the client can derive the API's types with no drift.
    expectTypeOf<InferInput<typeof route>>().toEqualTypeOf<{ id: number }>()
    expectTypeOf<InferOutput<typeof route>>().toEqualTypeOf<{ id: number; ok: boolean }>()
  })
})
