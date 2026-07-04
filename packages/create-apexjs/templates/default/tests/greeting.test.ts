import { describe, expect, it } from 'vitest'
import { GreetingService } from '../services/GreetingService'

// Services are plain classes, so they test in isolation — no server needed.
// Generate more with:  apex make test <name>
describe('GreetingService', () => {
  it('greets by name', () => {
    const g = new GreetingService().greet('Apex')
    expect(g.message).toBe('Hello, Apex!')
    expect(typeof g.at).toBe('string')
  })
})
