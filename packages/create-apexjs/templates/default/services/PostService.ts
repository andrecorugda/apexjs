import type { Post } from '../shared/types'

/**
 * A service holds business logic as a plain class — testable in isolation and
 * reusable from routes, page loaders, and jobs. Here it stands in for a database
 * with in-memory sample data; swap the array for a real query (see the `db/`
 * folder and `defineModel(...).resource(handle)`) and nothing else in the app changes.
 */
const POSTS: Post[] = [
  {
    slug: 'hello-apex',
    title: 'Hello, Apex',
    excerpt: 'Why Alpine deserved a full-stack meta-framework.',
    author: 'Ada Lovelace',
    date: '2026-02-01',
    body: 'Apex renders your pages on the server as real, indexable HTML, then Alpine hydrates them in the browser — no client-side framework tax, no flash. This whole app is server-rendered from .alpine files and made interactive by Alpine.',
  },
  {
    slug: 'ssr-then-hydrate',
    title: 'SSR first, hydrate second',
    excerpt: 'Real HTML on the first byte. Interactivity right after.',
    author: 'Grace Hopper',
    date: '2026-02-08',
    body: 'Each page has a loader() that runs on the server. Its return value is handed to Alpine as x-data, so the markup you see is the markup search engines and users get instantly — then the same state powers client interactivity.',
  },
  {
    slug: 'routes-are-tools',
    title: 'Every route is also an MCP tool',
    excerpt: 'Ship an API your AI can call — from one definition.',
    author: 'Alan Turing',
    date: '2026-02-15',
    body: 'Open server/api/posts.ts: one defineApexRoute is a validated REST endpoint AND an MCP tool at /mcp. Point an AI client at it and it can list your posts with no extra glue.',
  },
]

export class PostService {
  /** All posts, newest first. */
  all(): Post[] {
    return [...POSTS].sort((a, b) => b.date.localeCompare(a.date))
  }

  /** The N most recent posts. */
  recent(n: number): Post[] {
    return this.all().slice(0, n)
  }

  /** A single post by its slug, or undefined. */
  bySlug(slug: string): Post | undefined {
    return POSTS.find((p) => p.slug === slug)
  }
}
