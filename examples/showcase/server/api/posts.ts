import { defineApexRoute } from '@apex-stack/core'
import { z } from 'zod'
import { PostService } from '../../services/PostService'

const posts = new PostService()

/**
 * A route is a thin adapter: validate input, delegate to a service, return the
 * result. Because `mcp: true`, this is ALSO an MCP tool named "posts" at /mcp —
 * one definition, REST + AI-callable. Try:
 *   curl "http://localhost:3000/api/posts"
 *   curl "http://localhost:3000/api/posts?slug=hello-apex"
 */
export default defineApexRoute({
  method: 'GET',
  description: 'List blog posts, or fetch one by slug',
  input: { slug: z.string().optional() },
  mcp: true,
  handler: ({ input }) => (input.slug ? (posts.bySlug(input.slug) ?? null) : posts.all()),
})
