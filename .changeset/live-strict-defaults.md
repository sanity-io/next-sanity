---
"next-sanity": major
---

`draftMode()` now controls the default of every `sanityFetch` and `<SanityLive />` option that v13 strict mode required, and the `strict` option is gone. An explicit value always wins, in either direction.

| Option                              | Outside draft mode | Inside draft mode                                                                                                                                      |
| ----------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `perspective`                       | `'published'`      | the `perspective` resolver given to `defineLive`, else the Presentation Tool cookie (`cacheComponents: false`) or `'drafts'` (`cacheComponents: true`) |
| `variant`                           | none               | the Presentation Tool cookie (`cacheComponents: false`, no resolver), else none                                                                        |
| `stega`                             | `false`            | `true` when `defineLive` has a `serverToken` and the client has `stega.studioUrl`                                                                      |
| `includeDrafts` on `<SanityLive />` | `false`            | `true` when `defineLive` has a `browserToken`                                                                                                          |

- `perspective` and `stega` on `sanityFetch`, and `includeDrafts` on `<SanityLive />`, are optional in every export condition. Nothing throws for a missing option.
- Passing an option overrides the default. `stega: false` inside draft mode stays off. `stega: true` or `perspective: 'drafts'` outside draft mode is honoured.
- `sanityFetch` reads `draftMode()` itself, which Next.js allows inside `'use cache'`. Without a `serverToken` it does not read `draftMode()` at all.
- The two server implementations now apply the same rule. The only difference left is where the draft mode perspective comes from when the call passes none. Without Cache Components `sanityFetch` reads the Presentation Tool cookies. With Cache Components it calls the `perspective` resolver and falls back to `'drafts'`, because `cookies()` cannot be read inside `'use cache'`. When a resolver is configured neither implementation reads cookies, so an app with a `[perspective]` root segment behaves the same under either setting.
- `strict`, `StrictDefinedFetchType`, and `StrictDefinedLiveProps` are removed. Delete `strict: true` from your `defineLive` call.
- New entry point `next-sanity/live/proxy` exports `definePerspectiveProxy()`, a `proxy.ts` function that rewrites `/x` to `/<perspective>/x` from the draft mode cookies. It is safe to import in the proxy runtime and never pulls in React server APIs. The `matcher` stays in your `proxy.ts` because Next.js needs it as a literal.
- `sanitizePerspective` and `resolvePerspectiveFromCookies` return the fallback for `undefined`, `null`, and `''` instead of an undefined perspective.

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

Apps that cannot add a `[perspective]` root segment leave the resolver off and call `sanityFetch({query})` as before. Inside draft mode the perspective is then the Presentation Tool cookie without Cache Components and `'drafts'` with them, so content release previews need the `[perspective]` segment when `cacheComponents` is on.
