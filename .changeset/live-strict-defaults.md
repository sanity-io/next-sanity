---
"next-sanity": major
---

`defineLive({strict: true})` now makes draft mode the single source of truth instead of demanding every option on every call.

- `sanityFetch` reads `draftMode()` itself, which Next.js allows inside `'use cache'`. Outside draft mode every fetch is forced to `perspective: 'published'`, `stega: false`, and no `variant`, whatever the caller passed. Inside draft mode `stega` defaults to `true`.
- `stega` is no longer required on `sanityFetch`, and `includeDrafts` is no longer required on `<SanityLive />`. Both default to `draftMode().isEnabled`.
- `perspective` is still required on `sanityFetch` unless `defineLive` receives a `perspective` resolver, typically the `[perspective]` root param getter from `next/root-params`. The resolver is only called inside draft mode and its value is sanitized, so a raw route segment is fine. The types enforce the rule: `sanityFetch` accepts an optional `perspective` exactly when a resolver was configured.
- `StrictDefinedLiveProps` is removed. `<SanityLive />` takes `DefinedLiveProps` in every mode.
- New entry point `next-sanity/live/proxy` exports `definePerspectiveProxy()`, a `proxy.ts` function that rewrites `/x` to `/<perspective>/x` from the draft mode cookies. It is safe to import in the proxy runtime and never pulls in React server APIs. The `matcher` stays in your `proxy.ts` because Next.js needs it as a literal.
- `sanitizePerspective` and `resolvePerspectiveFromCookies` now return the fallback for `undefined`, `null`, and `''` instead of an undefined perspective.

Loose mode (`strict` omitted or `false`) is unchanged in both the `react-server` and the Cache Components implementation.

Before, with v13 strict mode, every option had to be resolved outside the cache and threaded through props:

```tsx
// sanity/live.ts
export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken,
  browserToken,
  strict: true,
})

export const cachedSanity: StrictDefinedFetchType = async (options) => {
  "use cache"
  return sanityFetch(options)
}

export async function getDynamicFetchOptions() {
  const {isEnabled} = await draftMode()
  if (!isEnabled) return {perspective: "published", stega: false}
  const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
  return {perspective, stega: true}
}

// app/layout.tsx
const {isEnabled} = await draftMode()
return <SanityLive includeDrafts={isEnabled} />

// app/[slug]/page.tsx
export default async function Page({params}) {
  const {isEnabled} = await draftMode()
  if (isEnabled) {
    return (
      <Suspense>
        <DynamicPage params={params} />
      </Suspense>
    )
  }
  const {slug} = await params
  return <CachedPage slug={slug} perspective="published" stega={false} />
}
async function DynamicPage({params}) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  return <CachedPage slug={slug} perspective={perspective} stega={stega} />
}
async function CachedPage({slug, perspective, stega}) {
  const {data} = await cachedSanity({query: POST_QUERY, params: {slug}, perspective, stega})
  return <Post data={data} />
}
```

After, the library reads draft mode and the perspective inside the cache:

```tsx
// sanity/live.ts
import {perspective} from "next/root-params"

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken,
  browserToken,
  strict: true,
  perspective,
})

// proxy.ts
import {definePerspectiveProxy} from "next-sanity/live/proxy"

export const proxy = definePerspectiveProxy()
export const config = {
  matcher: [
    "/((?!_next|_vercel|api|studio|favicon|\\.well-known|robots\\.|sitemap\\.|[^/]*\\.).*)?",
  ],
}

// app/[perspective]/layout.tsx
export function generateStaticParams() {
  return [{perspective: "published"}]
}
export default function RootLayout({children}) {
  return (
    <html>
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}

// app/[perspective]/[slug]/page.tsx
export default function Page({params}) {
  return (
    <Suspense>
      {params.then(({slug}) => (
        <CachedPage slug={slug} />
      ))}
    </Suspense>
  )
}
async function CachedPage({slug}) {
  "use cache"
  const {data} = await sanityFetch({query: POST_QUERY, params: {slug}})
  return <Post data={data} />
}
```

Apps that cannot add a `[perspective]` root segment keep `defineLive({strict: true})` without a resolver and pass `perspective` on each call. Only the draft mode value matters, so `sanityFetch({query, perspective: 'drafts'})` inside `'use cache'` is a published fetch outside draft mode and a drafts fetch inside it.
