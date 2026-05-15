---
'next-sanity': major
---

Replace the `revalidateSyncTags` prop on `<SanityLive>` with `action`

The prop was initially introduced to allow overriding the default cache invalidation behavior when a live event was received. Back then the [`revalidateTag` function did not have an second argument that allows configuring the revalidatino behavior](https://nextjs.org/docs/app/api-reference/functions/revalidateTag#revalidation-behavior), and we did not have support for [Invalidate Sync Tags Functions](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6).
Both platforms have evolved, and the name `revalidateSyncTags` is no longer accurate, and its default behavior is not ideal.

This API change is only a breaking change for you if you either:

- Passed a custom function to `revalidateSyncTags` on `<SanityLive>`
- Rely on the default behavior of how cache tags were invalidated when a live event was received

The default behavior that you might have relied on is that when a live event was received:

- if `draftMode.isEnabled` is false then the cache tags [were invalidated with `updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- if `draftMode.isEnabled` is true then the cache tags [were invalidated with `revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) with the `max` cache profile

In practice this meant that if you published a change to your nextjs app while at least one visitor was connected to `<SanityLive>` and not in draft mode, then they would be guaranteed to see the change within a few seconds.
If you were in Presentation Tool or otherwise in draft mode, and nobody else observed the change, then they would eventually see the change if they manually refresh the page a couple of times, or something else triggered a `refresh()` event after the cache is updated. This is a side-effect of using `revalidateTag` with the `max` cache profile instead of `updateTag`, and was a change we made in https://github.com/sanity-io/next-sanity/pull/3432 to avoid the impact of the Next.js regression reported by Sanity to Vercel in https://github.com/vercel/next.js/issues/93210 as `draftMode` generally implies that `<SanityLive>` will enable `includeDrafts` and thus see live events for draft content, and not just published content, and thus receive far more events than if you were not in draft mode.

The new behavior further mitiates the impact we've seen in https://github.com/vercel/next.js/issues/93210 by:

- using `revalidateTag` with the `max` cache profile instead of `updateTag`
- when in draft mode, we don't `updateTag` nor `revalidateTag` at all, we just call [`refresh()`](https://nextjs.org/docs/app/api-reference/functions/refresh)

In practice this means that by default content changes are no longer guaranteed to be seen by all visitors within a few seconds, they may need to refresh, or trigger a navigation event, before the new content is visible. This makes the default experience "less live", and is a trade-off we're making until nextjs addresses the regression reported in https://github.com/vercel/next.js/issues/93210 and gives us a path to guaranteed live content updates pushed to all visitors that is also cost efficient.

#### Opting in to guaranteed live content updates

The recommended way to opt in to guaranteed live content updates is to implement a [Invalidate Sync Tags Function](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6) ([example](https://github.com/sanity-io/lcapi-examples/blob/9f40340b4d147a6a6bcf26e10045388b951d3212/studio/functions/cache-invalidate/index.ts)) that calls a `/api/revalidate-tags` endpoint in your app ([example](https://github.com/sanity-io/lcapi-examples/blob/9f40340b4d147a6a6bcf26e10045388b951d3212/next-enterprise/src/app/api/expire-tags/route.ts)).

We recommend using `revalidateTag` with the `max` cache profile to invalidate the cache tags, and use dedicated client components if you want to drive specific experiences that have to be real-time ([example](https://github.com/sanity-io/lcapi-examples/blob/9f40340b4d147a6a6bcf26e10045388b951d3212/next-enterprise/src/app/Reactions.tsx#L35-L67)), but if you want to have the same instant experience as `next-sanity@12` you can set `{expire: 0}` in your route handler:

```ts
export async function POST(request: Request) {
  const {tags} = (await request.json()) as {tags?: string[]}

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

If you want to restore the previous default behavior without implementing an [Invalidate Sync Tags Function](https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6), you may do so by setting a custom `action` prop to `<SanityLive>`:

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
              `<SanityLive /> ${isDraftMode ? `revalidated tags: ${logTags.join(', ')} with cache profile "max" ` : `updated tags: ${logTags.join(', ')} and revalidated tag: "sanity:fetch-sync-tags" with cache profile "max"`}`,
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
                  console.log('this only logs if `waitFor` is not set to `function`', {tags})
                }
          }
          waitFor={isProduction ? 'function' : undefined}
        />
      </body>
    </html>
  )
}
```
