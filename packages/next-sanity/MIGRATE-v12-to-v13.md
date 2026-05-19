# Migrate from `v12` to `v13`

## Breaking changes

### Replace `revalidateSyncTags` prop on `<SanityLive>` with `action`

The `revalidateSyncTags` prop has been replaced by a new `action` prop. The default cache invalidation behavior has also changed to mitigate the impact of a [Next.js regression](https://github.com/vercel/next.js/issues/93210):

- Published content changes now use `revalidateTag` with `'max'` cache profile (previously `updateTag`)
- In draft mode, tags are no longer invalidated at all — only `refresh()` is called

This means content changes are no longer guaranteed to be seen by all visitors within a few seconds. They may need to refresh or trigger a navigation event.

#### Opting in to guaranteed live content updates

Implement an [Invalidate Sync Tags Function](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6) ([example](https://github.com/sanity-io/lcapi-examples/blob/9f40340b4d147a6a6bcf26e10045388b951d3212/studio/functions/cache-invalidate/index.ts)) that calls a `/api/revalidate-tags` endpoint in your app ([example](https://github.com/sanity-io/lcapi-examples/blob/9f40340b4d147a6a6bcf26e10045388b951d3212/next-enterprise/src/app/api/expire-tags/route.ts)).

For instant invalidation, use `{expire: 0}` in your route handler:

```ts
export async function POST(request: Request) {
  const {tags} = (await request.json()) as {tags?: string[]}

  for (const tag of tags) {
    revalidateTag(`sanity:${tag}`, {expire: 0})
  }

  return Response.json({revalidated: tags})
}
```

Then set `waitFor="function"` on your `<SanityLive>` component on production deployments:

```tsx
<SanityLive waitFor={process.env.VERCEL_ENV === 'production' ? 'function' : undefined} />
```

#### Restore the previous default behavior

```tsx
import {revalidateTag, updateTag} from 'next/cache'
import {draftMode} from 'next/headers'
import {parseTags} from 'next-sanity/live'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive
          action={async (unsafeTags) => {
            'use server'

            const {isEnabled: isDraftMode} = await draftMode()
            const {tags} = parseTags(unsafeTags)
            for (const tag of tags) {
              if (isDraftMode) {
                revalidateTag(tag, 'max')
              } else {
                updateTag(tag)
              }
            }

            if (isDraftMode) {
              return 'refresh'
            }
          }}
        />
      </body>
    </html>
  )
}
```

#### `waitFor="function"` no longer ignores custom actions

Previously `waitFor="function"` would ignore any custom `revalidateSyncTags` function. That's no longer the case with `action`. If you had a custom `revalidateSyncTags` alongside `waitFor="function"`, conditionally set `action`:

```tsx
import {parseTags} from 'next-sanity/live'

export default function RootLayout({children}: {children: React.ReactNode}) {
  const isProduction = process.env.VERCEL_ENV === 'production'
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive
          action={
            isProduction
              ? 'refresh'
              : async (unsafeTags) => {
                  'use server'
                  const {tagsWithoutPrefix} = parseTags(unsafeTags)
                  console.log('revalidating', {tags: tagsWithoutPrefix})
                }
          }
          waitFor={isProduction ? 'function' : undefined}
        />
      </body>
    </html>
  )
}
```

---

### `sanityFetch` sync-tag lookup request is no longer cached (`cacheComponents: false` mode)

Previously, `sanityFetch` cached both the sync-tag lookup request and the actual query. The sync-tag lookup now bypasses the Next.js fetch cache to prevent tag drift over time.

For statically generated routes this behaves the same. Fully dynamic routes may see the lookup hit the Sanity API CDN on each render (no quota impact, but possible added latency).

If that latency matters, either:

- Opt in to `cacheComponents: true` with the `'use cache: remote'` directive, or
- Call `client.fetch()` directly with your own cache tags:

```ts
client.fetch(query, params, {
  next: {revalidate: 15, tags: ['custom-revalidation-tag']},
})
```

---

### Remove `refreshOnFocus` prop from `<SanityLive>`

This prop was `true` by default for published content in top-level windows. To restore the behavior:

```tsx
// app/RefreshOnFocus.tsx
'use client'

import {useRouter} from 'next/navigation'
import {startTransition, useEffect} from 'react'

const focusThrottleInterval = 5_000

export function RefreshOnFocus() {
  const router = useRouter()

  useEffect(() => {
    // If inside an iframe then don't refresh on focus
    if (window.self !== window.top) return

    const controller = new AbortController()
    let nextFocusRevalidatedAt = 0
    const callback = () => {
      const now = Date.now()
      if (now > nextFocusRevalidatedAt && document.visibilityState !== 'hidden') {
        startTransition(() => router.refresh())
        nextFocusRevalidatedAt = now + focusThrottleInterval
      }
    }

    const {signal} = controller
    document.addEventListener('visibilitychange', callback, {passive: true, signal})
    window.addEventListener('focus', callback, {passive: true, signal})

    return () => controller.abort()
  }, [router])

  return null
}
```

```diff
// app/layout.tsx
+import {RefreshOnFocus} from './RefreshOnFocus'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive />
+      <RefreshOnFocus />
    </>
  )
}
```

---

### Remove `refreshOnReconnect` prop from `<SanityLive>`

This prop was `true` by default. Next.js itself is building [first-class support for handling network connectivity changes](https://github.com/vercel/next.js/pull/92011) via `experimental.useOffline`, so this is no longer needed.

To restore the behavior:

```tsx
// app/RefreshOnReconnect.tsx
'use client'

import {useRouter} from 'next/navigation'
import {startTransition, useEffect} from 'react'

export function RefreshOnReconnect() {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    const {signal} = controller

    window.addEventListener('online', () => startTransition(() => router.refresh()), {
      passive: true,
      signal,
    })

    return () => controller.abort()
  }, [router])

  return null
}
```

```diff
// app/layout.tsx
+import {RefreshOnReconnect} from './RefreshOnReconnect'

export default async function Layout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      {children}
      <SanityLive includeDrafts={isDraftMode} />
+      {!isDraftMode && <RefreshOnReconnect />}
    </>
  )
}
```

---

### Remove `refreshOnMount` prop from `<SanityLive>`

This prop was `false` by default, so most users are unaffected. If you used it, create a dedicated component:

```tsx
// app/RefreshOnMount.tsx
import {useRouter} from 'next/navigation'
import {useEffect, useReducer, startTransition} from 'react'

export function RefreshOnMount() {
  const router = useRouter()
  const [mounted, mount] = useReducer(() => true, false)

  useEffect(() => {
    if (!mounted) {
      startTransition(() => {
        mount()
        router.refresh()
      })
    }
  }, [mounted, router])

  return null
}
```

```diff
// app/layout.tsx
+import {RefreshOnMount} from './RefreshOnMount'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
-      <SanityLive refreshOnMount />
+      <SanityLive />
+      <RefreshOnMount />
    </>
  )
}
```

---

### Remove `intervalOnGoAway` prop, change signature of `onGoAway`

`onGoAway` now receives `(event, context, setPollingInterval)` instead of `(event, intervalOnGoAway)`. Use `setPollingInterval(ms)` inside the callback when you want long-polling fallback:

#### Before

```tsx
<SanityLive intervalOnGoAway={15_000} onGoAway={onGoAway} />
```

```tsx
export function onGoAway(event: LiveEventGoAway, intervalOnGoAway: number | false) {
  if (intervalOnGoAway) {
    console.warn('Switching to long polling at', intervalOnGoAway / 1000, 'seconds')
  }
}
```

#### After

```tsx
<SanityLive onGoAway={onGoAway} />
```

```tsx
import type {SanityLiveOnGoaway} from 'next-sanity/live'

export const onGoAway: SanityLiveOnGoaway = (event, {includeDrafts}, setPollingInterval) => {
  const interval = 15_000
  console.warn(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> connection closed:`,
    JSON.stringify(event.reason),
    `Refreshing every ${interval / 1_000}s`,
  )
  setPollingInterval(interval)
}
```

To disable fallback polling entirely, pass `onGoAway={false}`.

---

### Remove the deprecated `fetchOptions` option from `defineLive`

The time-based revalidation fallback has been removed. Use [Invalidate Sync Tags Functions](https://www.sanity.io/docs/functions/sync-tag-function-quickstart) to call a `/api/revalidate-tags` endpoint in your app instead.

---

### Remove the `stega` option from `defineLive`

You can no longer disable stega globally in `defineLive`. To opt out of stega in draft mode:

1. Do not define `stega.studioUrl` in the `client` config, or
2. Set `stega: false` in individual `sanityFetch` calls

---

### Renamed type exports on `next-sanity/live`

| Before                    | After              |
| ------------------------- | ------------------ |
| `DefinedSanityFetchType`  | `DefinedFetchType` |
| `DefinedSanityLiveProps`  | `DefinedLiveProps` |
| `DefineSanityLiveOptions` | `DefineLiveOptions` |

---

### Remove the deprecated `tag` prop from `<SanityLive>` and `tag` option from `sanityFetch`

Use `requestTag` instead. The `requestTag` option ties into `requestTagPrefix` on `client` and [request log filtering in Sanity Content Lake](https://www.sanity.io/docs/platform-management/reference-api-request-tags). The old `tag` name was easy to confuse with `sanityFetch({tags})` which forwards `fetch(url, {next: {tags}})`.

---

### Remove the deprecated `useDraftModePerspective` hook

Use `resolvePerspectiveFromCookies` server helper instead. See the [`resolvePerspectiveFromCookies` section in the changelog](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/CHANGELOG.md) for a complete example of creating your own equivalent hook using a React context.

---

### Remove the deprecated `useDraftModeEnvironment` hook

Use `useVisualEditingEnvironment` from `next-sanity/hooks` instead:

| `useDraftModeEnvironment` | `useVisualEditingEnvironment` |
| ------------------------- | ----------------------------- |
| `"presentation-iframe"`   | `"presentation-iframe"`       |
| `"presentation-window"`   | `"presentation-window"`       |
| `"live"`                  | `"standalone"`                |
| `"checking"`              | `null`                        |
| `"static"`                | `null`                        |
| `"unknown"`               | `null`                        |

---

### Remove the deprecated `useIsLivePreview` hook

Use `useVisualEditingEnvironment` from `next-sanity/hooks` together with a userland context provider. See the [full migration example in the changelog](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/CHANGELOG.md) for creating an equivalent `IsLivePreviewProvider`.
