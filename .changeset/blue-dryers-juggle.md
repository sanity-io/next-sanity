---
'next-sanity': patch
---

Allow enabling `stega: true` on `sanityFetch` if `serverToken` is provided

Previously, if you tried to enable stega on `perspective: 'published'` it would not work:

```ts
const {data} =await sanityFetch({query, params: perspective: 'published', stega: true})
// data has no stega
```

Now it does, allowing you to show visual editing overlays on published content. This is especially useful when using features like [Vercel's Content Link](https://vercel.com/docs/edit-mode#content-link).
