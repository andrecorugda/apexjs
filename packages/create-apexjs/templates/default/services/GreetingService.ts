import type { Greeting } from '../shared/types'

/**
 * A service holds business logic as a plain class — testable in isolation and
 * reusable from routes, page loaders, and jobs. Keep routes/loaders thin: they
 * validate input and delegate to a service. This is the clean-code backbone.
 */
export class GreetingService {
  greet(name: string): Greeting {
    return { message: `Hello, ${name}!`, at: new Date().toISOString() }
  }
}
