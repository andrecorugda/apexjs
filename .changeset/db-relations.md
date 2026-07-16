---
"@apex-stack/data": minor
---

Relationships + eager loading (the biggest Eloquent gap). Declare relations on a model with
thunk refs, then eager-load them without N+1:

```ts
const Post = defineModel('posts', {
  fields: { title: 'string', authorId: 'int' },
  relations: {
    author: belongsTo(() => User, 'authorId'),
    comments: hasMany(() => Comment, 'postId'),
  },
})
const posts = await Post.with('author', 'comments').orderBy('id', 'asc').all(handle)
posts[0].author       // a User instance
posts[0].comments     // a Collection of Comment instances
```

`hasMany` / `hasOne` / `belongsTo` supported; `.with(...)` batch-loads each relation in ONE
query keyed by the parent keys (N parents ⇒ 1 extra query, not N). Loaded relations attach as
instance properties and serialize with `toJSON`/`JSON.stringify`. (belongsToMany/pivot deferred.)
