## Migrate

### Table of contents<!-- omit in toc -->

- [Replace the `revalidateSyncTags` prop on `<SanityLive>` with `action`](#replace-the-revalidatesynctags-prop-on-sanitylive-with-action)
  - [Opting in to guaranteed live content updates](#opting-in-to-guaranteed-live-content-updates)
  - [Restore the previous default behavior](#restore-the-previous-default-behavior)
  - [`waitFor="function"` no longer ignores custom actions](#waitforfunction-no-longer-ignores-custom-actions)
- [`sanityFetch` in `cacheComponents: false` mode no longer caches the internal sync-tag lookup request](#sanityfetch-in-cachecomponents-false-mode-no-longer-caches-the-internal-sync-tag-lookup-request)
- [`refreshOnFocus` prop removed from `<SanityLive>`](#refreshonfocus-prop-removed-from-sanitylive)
- [`refreshOnReconnect` prop removed from `<SanityLive>`](#refreshonreconnect-prop-removed-from-sanitylive)
- [`refreshOnMount` prop removed from `<SanityLive>`](#refreshonmount-prop-removed-from-sanitylive)
- [`intervalOnGoAway` removed and `onGoAway` signature changed on `<SanityLive>`](#intervalongoaway-removed-and-ongoaway-signature-changed-on-sanitylive)
- [`fetchOptions` removed from `defineLive`](#fetchoptions-removed-from-definelive)
- [`stega` option removed from `defineLive`](#stega-option-removed-from-definelive)
- [`useDraftModePerspective` hook removed](#usedraftmodeperspective-hook-removed)
- [`useIsLivePreview` hook removed](#useislivepreview-hook-removed)
- [`useDraftModeEnvironment` hook removed](#usedraftmodeenvironment-hook-removed)
- [`tag` option on `sanityFetch` removed, use `requestTag`](#tag-option-on-sanityfetch-removed-use-requesttag)
- [`tag` prop on `<SanityLive>` removed, use `requestTag`](#tag-prop-on-sanitylive-removed-use-requesttag)
- [Renamed type exports on `next-sanity/live`](#renamed-type-exports-on-next-sanitylive)

### Replace the `revalidateSyncTags` prop on `<SanityLive>` with `action`

The prop was initially introduced to allow overriding the default cache invalidation behavior when a live event was received. Back then the [`revalidateTag` function did not have a second argument that allows configuring the revalidation behavior](https://nextjs.org/docs/app/api-reference/functions/revalidateTag#revalidation-behavior), and we did not have support for [Invalidate Sync Tags Functions](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6).
Both platforms have evolved, and the name `revalidateSyncTags` is no longer accurate, and its default behavior is not ideal.

This API change is only a breaking change for you if you either:

- Passed a custom function to `revalidateSyncTags` on `<SanityLive>`
- Rely on the default behavior of how cache tags were invalidated when a live event was received

The default behavior that you might have relied on is that when a live event was received:

- if `draftMode.isEnabled` is false then the cache tags [were invalidated with `updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- if `draftMode.isEnabled` is true then the cache tags [were invalidated with `revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) with the `max` cache profile

In practice this meant that if you published a change to your Next.js app while at least one visitor was connected to `<SanityLive>` and not in draft mode, then they would be guaranteed to see the change within a few seconds.
If you were in Presentation Tool or otherwise in draft mode, and nobody else observed the change, then they would eventually see the change if they manually refresh the page a couple of times, or something else triggered a `refresh()` event after the cache is updated. This is a side-effect of using `revalidateTag` with the `max` cache profile instead of `updateTag`, and was a change we made in https://github.com/sanity-io/next-sanity/pull/3432 to avoid the impact of the Next.js regression reported by Sanity to Vercel in https://github.com/vercel/next.js/issues/93210 as `draftMode` generally implies that `<SanityLive>` will enable `includeDrafts` and thus see live events for draft content, and not just published content, and thus receive far more events than if you were not in draft mode.

The new behavior further mitigates the impact we've seen in https://github.com/vercel/next.js/issues/93210 by:

- using `revalidateTag` with the `max` cache profile instead of `updateTag`
- when in draft mode, we don't `updateTag` nor `revalidateTag` at all, we just call [`refresh()`](https://nextjs.org/docs/app/api-reference/functions/refresh)

In practice this means that by default content changes are no longer guaranteed to be seen by all visitors within a few seconds, they may need to refresh, or trigger a navigation event, before the new content is visible. This makes the default experience "less live", and is a trade-off we're making until Next.js addresses the regression reported in https://github.com/vercel/next.js/issues/93210 and gives us a path to guaranteed live content updates pushed to all visitors that is also cost efficient.

#### Opting in to guaranteed live content updates

The recommended way to opt in to guaranteed live content updates is to implement an [Invalidate Sync Tags Function](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6) ([example](https://github.com/sanity-io/lcapi-examples/blob/3a093ebe95572ca910c81084bb57ce9049d1aae0/studio/functions/cache-invalidate/index.ts)) that calls a `/api/revalidate-tags` endpoint in your app ([example](https://github.com/sanity-io/lcapi-examples/blob/3a093ebe95572ca910c81084bb57ce9049d1aae0/next-enterprise/src/app/api/revalidate-tags/route.ts)).

We recommend using `revalidateTag` with the `max` cache profile to invalidate the cache tags, and using dedicated client components if you want to drive specific experiences that have to be real-time ([example](https://github.com/sanity-io/lcapi-examples/blob/9f40340b4d147a6a6bcf26e10045388b951d3212/next-enterprise/src/app/Reactions.tsx#L35-L67)), but if you want to have the same instant experience as `next-sanity@12` you can set `{expire: 0}` in your route handler:

```ts
import {revalidateTag} from 'next/cache'

export async function POST(request: Request) {
  const expectedSecret = process.env.SANITY_REVALIDATE_TAGS_SECRET
  const secret = new URL(request.url).searchParams.get('secret')

  if (!expectedSecret) {
    return Response.json({error: 'Missing SANITY_REVALIDATE_TAGS_SECRET environment variable'}, {status: 500})
  }

  if (secret !== expectedSecret) {
    return Response.json({error: 'Unauthorized'}, {status: 401})
  }

  const {tags} = (await request.json()) as {tags?: string[]}

  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
    return Response.json({error: '`tags` must be an array of strings'}, {status: 400})
  }

  for (const tag of tags) {
    // `sanityFetch` returned by `defineLive` from `next-sanity/live` prefixes its `cacheTag` calls with `sanity:`, so we need to add the same prefix here
    revalidateTag(`sanity:${tag}`, {expire: 0})
  }

  return Response.json({revalidated: tags})
}
```

You then set `waitFor="function"` on your `<SanityLive>` component, when you are on a deployment that also handles incoming events to `/api/revalidate-tags`:

```tsx
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive waitFor={process.env.VERCEL_ENV === 'production' ? 'function' : undefined} />
      </body>
    </html>
  )
}
```

#### Restore the previous default behavior

If you want to restore the previous default behavior without implementing an [Invalidate Sync Tags Function](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6), you may do so by setting a custom `action` prop on `<SanityLive>`:

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
            const logTags: string[] = []
            for (const tag of tags) {
              if (isDraftMode) {
                revalidateTag(tag, 'max')
              } else {
                updateTag(tag)
              }
              logTags.push(tag)
            }

            console.log(
              `<SanityLive /> ${isDraftMode ? `revalidated tags: ${logTags.join(', ')} with cache profile "max" ` : `updated tags: ${logTags.join(', ')}`}`,
            )

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

#### waitFor="function" no longer ignores custom actions

Previously setting `waitFor="function"` would ignore any custom `revalidateSyncTags` function and always call `router.refresh()` internally.
That's not the case with `action` anymore, so if your implementation looks like this today:

```tsx
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive
          revalidateSyncTags={async (tags) => {
            'use server'
            console.log('this only logs if `waitFor` is not set to `function`', {tags})
          }}
          waitFor={process.env.VERCEL_ENV === 'production' ? 'function' : undefined}
        />
      </body>
    </html>
  )
}
```

You need to conditionally set `action` to your own function, or the string `'refresh'`, if you want it to work the same way, as `action` is always respected:

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
                  console.log('this only logs if `isProduction` is false', {tags: tagsWithoutPrefix})
                }
          }
          waitFor={isProduction ? 'function' : undefined}
        />
      </body>
    </html>
  )
}
```

### `sanityFetch` in `cacheComponents: false` mode no longer caches the internal sync-tag lookup request

Sanity Live uses Content Lake `syncTags` to revalidate cached routes when documents change. When `cacheComponents: true` is enabled, `sanityFetch` can perform a single Content Lake request: the response includes `syncTags`, and Next.js exposes `cacheTag()` so those response-derived tags can be added to the cache entry before it is stored.

When `cacheComponents: false`, Next.js requires cache tags to be known before the cached fetch is made, regardless of whether the result is cached with [`fetch(url, {next: {tags}})`](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags) or [`unstable_cache()`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache). To make Sanity Live revalidation work without requiring custom tag naming conventions, `sanityFetch` uses two Content Lake requests in this mode: one request to discover the `syncTags` for the query, and one request for the actual result using those precise `syncTags` as Next.js cache tags. The sync-tag lookup request does not count toward Sanity API usage quotas.

Previously both requests used the Next.js fetch cache, but the sync-tag lookup shared a broad `sanity:fetch-sync-tags` tag across all queries and params. That could let the discovered `syncTags` drift over time as documents gained new references.

In next-sanity v12, the default `revalidateSyncTags` prop implementation on `<SanityLive />` called `revalidateTag('sanity:fetch-sync-tags', 'max')` for that broad lookup tag, marking those routes as stale and letting them follow Next.js stale-while-revalidate semantics. Actual content sync tags were expired with `revalidateTag(tag, {expire: 0})`, so only routes whose content changed were guaranteed fresh with `CACHE: REVALIDATED` instead of serving stale content. In next-sanity v13, the equivalent default `action` implementation no longer calls `revalidateTag('sanity:fetch-sync-tags', 'max')` because sync-tag lookup requests are not cached, so there is no broad lookup tag to expire and no sync-tag drift.

The sync-tag lookup request now bypasses the Next.js fetch cache, so only the second request with precise `next.tags` is cached. For statically generated routes this should usually behave the same, because the route output can still be cached even though the lookup request is not. Fully dynamic routes that rely on the fetch cache may see the first request hit the Sanity API CDN on each render. That first request still does not count toward Sanity API usage quotas, but it can add latency.

If that extra dynamic-route latency matters, either opt in to `cacheComponents: true` and use the `use cache: remote` directive, or call `client.fetch()` directly on those routes and provide your own cache tags and revalidation options:

```ts
client.fetch(query, params, {
  next: {revalidate: 15, tags: ['custom-revalidation-tag']},
})
```

### `refreshOnFocus` prop removed from `<SanityLive>`

This prop was enabled by default for published content in top-level windows, so if you relied on it you can add it back like this:

Create a new `RefreshOnFocus` component:

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

Then update your layout to include it:

```diff
// app/layout.tsx
import {SanityLive} from '#sanity/live'
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

The motivation for removing this feature is that most users saw this as unexpected behavior, especially since window focus events often trigger when using browser debug tools. [Paired with how Next.js v16 behaves differently with link prefetching and the `router.refresh()` call, it's best to remove it.](https://github.com/vercel/next.js/issues/93210)

### `refreshOnReconnect` prop removed from `<SanityLive>`

It was removed because Next.js itself is working on [first-class support for handling network connectivity changes](https://github.com/vercel/next.js/pull/92011), which can already be tested using `experimental.useOffline`, so it no longer makes sense for us to implement it ourselves.

This prop was `true` by default, and only used when not in draft mode, so if you relied on this behavior you can add it back like this:

Create a new `RefreshOnReconnect` component:

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

Then update your layout to include it:

```diff
// app/layout.tsx
import {SanityLive} from '#sanity/live'
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

### `refreshOnMount` prop removed from `<SanityLive>`

This prop was `false` by default, so if you weren't using it you won't be affected by this change.

If you were using it, here's how you can add back the same functionality:

Create a new `RefreshOnMount` component:

```tsx
// app/RefreshOnMount.tsx
'use client'

import {useRouter} from 'next/navigation'
import {useEffect, useReducer, startTransition} from 'react'

/**
 * Handles refreshing the page when the page is mounted,
 * in case the content changes at a high enough frequency that by
 * the time the page started streaming, and the <SanityLive> component sets
 * up the EventSource connection, content might have changed.
 */
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

Then update your layout to include it:

```diff
// app/layout.tsx
import {SanityLive} from '#sanity/live'
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

### `intervalOnGoAway` removed and `onGoAway` signature changed on `<SanityLive>`

If you customized `intervalOnGoAway` or `onGoAway`, move that logic into the new `onGoAway` callback and call the provided `setPollingInterval()` helper.

#### Before

`onGoAway` received `(event, intervalOnGoAway)`, and the polling interval was configured separately:

```tsx
// app/client-functions.ts
'use client'
import type {LiveEventGoAway} from '@sanity/client'

export function onGoAway(event: LiveEventGoAway, intervalOnGoAway: number | false) {
  if (intervalOnGoAway) {
    console.warn(
      'Sanity Live connection closed, switching to long polling set to an interval of',
      intervalOnGoAway / 1000,
      'seconds and the server gave this reason:',
      event.reason,
    )
  } else {
    console.error(
      'Sanity Live connection closed, automatic revalidation is disabled, the server gave this reason:',
      event.reason,
    )
  }
}
```

```tsx
// app/layout.tsx
import {onGoAway} from './client-functions'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive intervalOnGoAway={15_000} onGoAway={onGoAway} />
    </>
  )
}
```

#### After

`onGoAway` now receives `(event, context, setPollingInterval)`.
Use `setPollingInterval(ms)` from inside `onGoAway` when you want long-polling fallback:

```tsx
// app/client-functions.ts
'use client'

import type {SanityLiveOnGoaway} from 'next-sanity/live'

export const onGoAway: SanityLiveOnGoaway = (event, {includeDrafts}, setPollingInterval) => {
  const interval = 15_000
  console.warn(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> connection is closed after receiving a 'goaway' event, the server gave this reason:`,
    JSON.stringify(event.reason),
    `Content will now be refreshed every ${interval / 1_000} seconds`,
  )
  setPollingInterval(interval)
}
```

```tsx
// app/layout.tsx
import {onGoAway} from './client-functions'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive onGoAway={onGoAway} />
    </>
  )
}
```

To disable fallback polling entirely, pass `onGoAway={false}`.

### `fetchOptions` removed from `defineLive`

This option was used to set a [time-based revalidation](https://nextjs.org/docs/app/guides/caching-without-cache-components#time-based-revalidation) as a fallback strategy for when content might change in the dataset without an active browser session connected to `<SanityLive>`, thus making the cached content stale.
The downside to this approach was that time-based revalidation ended up causing many unnecessary ISR writes, since they trigger based on a fixed interval rather than on the actual content changes.

Now that we have [Invalidate Sync Tags support in Sanity Functions](https://www.sanity.io/docs/functions/sync-tag-function-quickstart), the preferred fallback approach is to use it to call a `/api/revalidate-tags` endpoint in your app so that the content is eventually fresh even if the content change happened without an active browser session connected to `<SanityLive>`.

### `stega` option removed from `defineLive`

When the `client` given to `defineLive` has a `stega.studioUrl` configured, and `draftMode().isEnabled` is `true`, then `sanityFetch` calls would use `true` as the default value for its `stega` option.

To opt out of `stega` being set by default in draft mode, you have 3 options:

1. Do not define `stega.studioUrl` in the `client` config
2. Set `stega: false` in the `sanityFetch` call itself
3. Set `stega: false` in the `defineLive` call

With this change you no longer have option 3, and you have to use option 2 or 1.

### `useDraftModePerspective` hook removed

When used in an app that has `<SanityLive />` and `<VisualEditing />`, it would resolve to the `perspective` that is used by the `sanityFetch` calls on the page.
The `resolvePerspectiveFromCookies` server component helper can be used instead. Here's how you can create your own `useDraftModePerspective` hook that works the same way as the deprecated one:

#### Before

```tsx
// app/layout.tsx
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '#sanity/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

```tsx
// app/DebugStatus.tsx
'use client'
import {useDraftModePerspective} from 'next-sanity/hooks'

export function DebugStatus() {
  const perspective = useDraftModePerspective()
  return <p>Perspective: {JSON.stringify(perspective)}</p>
}
```

```tsx
// app/page.tsx
import {DebugStatus} from './DebugStatus'

export default function Page() {
  return (
    <>
      <DebugStatus />
    </>
  )
}
```

In this example the `DebugStatus` component will log `Perspective: "unknown"` in production, and when in draft mode it'll log `Perspective: "drafts"` or if a content release is previewed in Presentation Tool it could log `Perspective: ["rHFvpQcCq","r5RGhbQN9","drafts"]`.

#### After

```tsx
// app/layout.tsx
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '#sanity/live'
import {DraftModePerspective} from './DraftModePerspectiveProvider'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        <DraftModePerspective>{children}</DraftModePerspective>
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

```tsx
// app/DraftModePerspectiveProvider.tsx
import {resolvePerspectiveFromCookies} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import {Suspense} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'

async function DraftModePerspectiveProvider({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) return children
  const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
  return <DraftModePerspectiveContext value={perspective}>{children}</DraftModePerspectiveContext>
}

export function DraftModePerspective({children}: {children: React.ReactNode}) {
  return (
    <Suspense
      fallback={
        <DraftModePerspectiveContext value="checking">{children}</DraftModePerspectiveContext>
      }
    >
      <DraftModePerspectiveProvider>{children}</DraftModePerspectiveProvider>
    </Suspense>
  )
}
```

```tsx
// app/DraftModePerspectiveContext.tsx
'use client'

import type {LivePerspective} from 'next-sanity/live'
import {createContext} from 'react'

export const DraftModePerspectiveContext = createContext<'checking' | 'unknown' | LivePerspective>(
  'unknown',
)
```

```tsx
// app/DebugStatus.tsx
'use client'
import {use} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'

export function DebugStatus() {
  const perspective = use(DraftModePerspectiveContext)
  return <p>Perspective: {JSON.stringify(perspective)}</p>
}
```

```tsx
// app/page.tsx
import {DebugStatus} from './DebugStatus'

export default function Page() {
  return (
    <>
      <DebugStatus />
    </>
  )
}
```

### `useIsLivePreview` hook removed

The `useIsLivePreview` hook would return `true` in two cases:

- a) If the app is detected as rendered within an iframe, or a new window, where the parent window is a Sanity Studio running Presentation Tool.
- b) `<SanityLive />` is rendered on the page with `browserToken` in `defineLive` given a value, and draft mode is enabled.

For use case a) you can use the `useIsPresentationTool` hook instead. For use case b) things started getting a bit tricky when desiring to add support for multiple instances of `<SanityLive />` on the same page that connect to different datasets or even different projects, as well as giving userland control over when `<SanityLive />` sets the `includeDrafts` option, instead of relying on the v12 behavior of always setting it to `true` when `draftMode().isEnabled`, with no way to opt out when in draft mode, nor to opt in when not in draft mode.

#### Before

`useIsLivePreview()` could resolve as long as `<SanityLive />` was rendered (with `browserToken` configured in `defineLive`) while draft mode was enabled:

```tsx
// app/layout.tsx
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'
import {SanityLive} from '#sanity/live'

import {DebugStatus} from './DebugStatus'

export default async function Layout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      {isDraftMode && <DebugStatus />}
      {children}
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  )
}
```

```tsx
// app/DebugStatus.tsx
'use client'
import {useIsLivePreview} from 'next-sanity/hooks'

export function DebugStatus() {
  const isLivePreview = useIsLivePreview()
  return <p>Is Live Preview: {String(isLivePreview)}</p>
}
```

#### After

Create a userland provider (for example `IsLivePreviewProvider`) and wrap the components that call `useIsLivePreview()`:

```tsx
// app/IsLivePreviewContext.tsx
'use client'

import {useVisualEditingEnvironment} from 'next-sanity/hooks'
import {createContext, use} from 'react'

const IsLivePreviewContext = createContext<boolean | null>(false)

export function IsLivePreviewProvider({children}: {children: React.ReactNode}) {
  // The useVisualEditingEnvironment() hook requires `<VisualEditing />` to render in the root layout for it to resolve the env correctly.
  const environment = useVisualEditingEnvironment()

  return (
    <IsLivePreviewContext value={environment === null ? null : true}>
      {children}
    </IsLivePreviewContext>
  )
}

export function useIsLivePreview() {
  return use(IsLivePreviewContext)
}
```

```tsx
// app/layout.tsx
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'
import {SanityLive} from '#sanity/live'

import {DebugStatus} from './DebugStatus'
import {IsLivePreviewProvider} from './IsLivePreviewContext'

export default async function Layout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      {isDraftMode && (
        <IsLivePreviewProvider>
          <DebugStatus />
        </IsLivePreviewProvider>
      )}
      {children}
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  )
}
```

```tsx
// app/DebugStatus.tsx
'use client'
import {useIsLivePreview} from './IsLivePreviewContext'

export function DebugStatus() {
  const isLivePreview = useIsLivePreview()
  return <p>Is Live Preview: {String(isLivePreview)}</p>
}
```

### `useDraftModeEnvironment` hook removed

Use the `useVisualEditingEnvironment` hook instead. The values map as follows:

| `useDraftModeEnvironment` | `useVisualEditingEnvironment` |
| ------------------------- | ----------------------------- |
| `"presentation-iframe"`   | `"presentation-iframe"`       |
| `"presentation-window"`   | `"presentation-window"`       |
| `"live"`                  | `"standalone"`                |
| `"checking"`              | `null`                        |
| `"static"`                | `null`                        |
| `"unknown"`               | `null`                        |

### `tag` option on `sanityFetch` removed, use `requestTag`

The `requestTag` option ties into the `requestTagPrefix` option on `client` and [request log filtering in Sanity Content Lake](https://www.sanity.io/docs/platform-management/reference-api-request-tags). The old `tag` name is easy to confuse with `sanityFetch({tags})`, which forwards `fetch(url, {next: {tags}})` from [Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags).

### `tag` prop on `<SanityLive>` removed, use `requestTag`

The deprecated `tag` prop on `<SanityLive>` has been removed; use `requestTag` instead.

### Renamed type exports on `next-sanity/live`

Three type exports were renamed:

- `DefinedSanityFetchType` to `DefinedFetchType`
- `DefinedSanityLiveProps` to `DefinedLiveProps`
- `DefineSanityLiveOptions` to `DefineLiveOptions`
