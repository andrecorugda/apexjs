---
"@apex-stack/data": minor
---

Named query scopes: define reusable, chainable query fragments on a model via
`scopes: { published: (q) => q.where({ status: 'published' }), top: (q, n) => q.orderBy('score','desc').limit(n) }`
and call them with `Model.scope('published').all(h)` or `Model.scope('top', 5).all(h)`.
An unknown scope name throws.
