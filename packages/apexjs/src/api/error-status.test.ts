import { describe, expect, it } from 'vitest'
import { defineApexRoute } from './defineRoute.js'
import { expandApiModule } from './routes.js'
import { createTestApp } from '../testing/index.js'

// A thrown error carrying `httpStatus` (e.g. @apex-stack/data's ModelNotFoundException) is
// mapped to that status; its message surfaces for 4xx, but a plain 500 stays masked.
describe('api error status mapping', () => {
  it('maps a thrown httpStatus (404) and surfaces the domain message', async () => {
    const notFound = defineApexRoute({
      handler: () => {
        const e = new Error("No query results for model 'things'") as Error & { httpStatus: number }
        e.httpStatus = 404
        throw e
      },
    })
    const boom = defineApexRoute({
      handler: () => {
        throw new Error('SECRET internal detail')
      },
    })
    const app = await createTestApp({
      entries: [...expandApiModule('things', notFound), ...expandApiModule('boom', boom)],
    })
    const nf = await app.get('/api/things')
    expect(nf.status).toBe(404)
    expect((nf.body as { error: string }).error).toContain('No query results')

    const err = await app.get('/api/boom')
    expect(err.status).toBe(500) // a plain throw stays a 500 (masking covered by prod/server.test)
    await app.close()
  })
})
