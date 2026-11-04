// Guarantee fresh content for every visitor by invalidating the Next.js cache
// server-side whenever published content changes, and by holding live events
// back until that invalidation has completed.
//
// The flow: publishing a change makes Content Lake emit sync tags for the
// affected queries. A Sync Tag Invalidate Function — deployed to Sanity's
// infrastructure with Blueprints — receives them, POSTs them to the app's
// `/api/revalidate-tags` endpoint (which expires the matching `sanity:`-prefixed
// cache tags registered by `sanityFetch`), and then calls `done()`. Calling
// `done()` is what releases the held-back live events to browsers connected
// with `waitFor="function"`, so an open tab's refresh always hits an
// already-invalidated cache. Because invalidation runs with no browser
// involved, content also becomes fresh when nobody has the site open.
//
// Setup commands (run in `studio/`):
//   npx sanity blueprints init . --type ts --stack-name production --project-id xxxxxxxx
//   npx sanity functions add --name cache-invalidate --type sync-tag-invalidate
//   npx sanity blueprints deploy
//
// `sanity/live.ts` and `app/page.tsx` are unchanged.

// --- studio/sanity.blueprint.ts ---
import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: 'cache-invalidate',
      // Scope to the one dataset the app reads from: multiple
      // sync-tag-invalidate functions on a dataset risk race conditions.
      event: {resource: {type: 'dataset', id: 'xxxxxxxx.production'}},
      // Resolved from the deploying machine's environment at deploy time.
      // Alternatively: npx sanity functions env add cache-invalidate SANITY_REVALIDATE_TAGS_SECRET <value>
      env: {SANITY_REVALIDATE_TAGS_SECRET: process.env.SANITY_REVALIDATE_TAGS_SECRET!},
    }),
  ],
})

// --- studio/functions/cache-invalidate/index.ts ---
import {syncTagInvalidateEventHandler} from '@sanity/functions'

const REVALIDATE_URL = 'https://acme-blog.example.com/api/revalidate-tags'

export const handler = syncTagInvalidateEventHandler(async ({event, done}) => {
  const {syncTags} = event.data

  // Expire the Next.js cache entries that depend on these tags first…
  const res = await fetch(REVALIDATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SANITY_REVALIDATE_TAGS_SECRET}`,
    },
    body: JSON.stringify({tags: syncTags}),
  })
  console.log(`Revalidated ${syncTags.length} tags, HTTP ${res.status}`)

  // …then notify Sanity. `done()` releases the events held back for
  // `<SanityLive waitFor="function">` connections, so it must only run after
  // the cache is invalidated — and it must complete, or those clients never
  // receive the change. Confirm it succeeded and log failures.
  try {
    const response = await done(syncTags)
    console.log('Invalidation complete, Sanity responded with HTTP', response.status)
  } catch (err) {
    console.error('Error invoking the Sanity invalidation done endpoint!', err)
  }
})

// --- app/api/revalidate-tags/route.ts ---
import {revalidateTag} from 'next/cache'
import {timingSafeEqual} from 'node:crypto'

export async function POST(request: Request) {
  const expectedSecret = process.env.SANITY_REVALIDATE_TAGS_SECRET
  if (!expectedSecret) {
    return Response.json({error: 'Server configuration error'}, {status: 500})
  }

  const secret = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const expectedSecretBuffer = Buffer.from(expectedSecret)
  const secretBuffer = Buffer.from(secret)
  if (
    expectedSecretBuffer.length !== secretBuffer.length ||
    !timingSafeEqual(expectedSecretBuffer, secretBuffer)
  ) {
    return Response.json({error: 'Unauthorized'}, {status: 401})
  }

  const {tags} = (await request.json()) as {tags?: unknown}
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
    return Response.json({error: '`tags` must be an array of strings'}, {status: 400})
  }

  for (const tag of tags) {
    // `sanityFetch` from `defineLive` prefixes its cache tags with `sanity:`,
    // so the raw sync tags need the same prefix here. `{expire: 0}` expires
    // immediately instead of stale-while-revalidate, so the refresh triggered
    // after `done()` — and the next visit from anyone else — is guaranteed
    // to serve fresh content.
    revalidateTag(`sanity:${tag}`, {expire: 0})
  }

  return Response.json({revalidated: tags})
}

// --- app/layout.tsx ---
import {SanityLive} from '@/sanity/live'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* The deployed function only invalidates the production deployment's
            cache, so only production connections should wait for it. With
            `waitFor="function"` the default action becomes a plain client-side
            refresh — the function already revalidated server-side. Local dev
            and previews keep immediate events and default revalidation. */}
        <SanityLive waitFor={process.env.VERCEL_ENV === 'production' ? 'function' : undefined} />
      </body>
    </html>
  )
}
