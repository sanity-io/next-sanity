# @sanity/next-sanity-functions

Sanity Functions helpers for [`next-sanity`](https://github.com/sanity-io/next-sanity). It signs sync tag invalidations and sends them to the route handler `defineInvalidateSyncTags` from `next-sanity/live/invalidate` sets up, so `<SanityLive waitFor="function">` clients refresh only after the Next.js cache has been expired.

The package has no Next.js or React dependency, so a Sanity Function bundle that imports it stays small.

## Install

```bash
npm install @sanity/next-sanity-functions @sanity/functions
```

## Usage

Declare the function in `sanity.blueprint.ts`, one per dataset:

```ts
import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: 'invalidate-sync-tags',
      event: {resource: {type: 'dataset', id: `${projectId}.${dataset}`}},
    }),
  ],
})
```

Implement it in `functions/invalidate-sync-tags/index.ts`:

```ts
import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URL,
})
```

`urls` accepts a comma separated string, so one env var can fan out to several deployments. Every URL is called in parallel, each outcome is logged, and `done()` is always called so a failing origin never holds the live event back.

Share the secret and the URLs with the deployed function:

```bash
npx sanity functions env add invalidate-sync-tags SANITY_REVALIDATE_SECRET <same value as the Next.js app>
npx sanity functions env add invalidate-sync-tags REVALIDATE_URL https://www.example.com/api/revalidate
```

On the Next.js side, `app/api/revalidate/route.ts` is two lines:

```ts
import {defineInvalidateSyncTags} from 'next-sanity/live/invalidate'

export const {POST} = defineInvalidateSyncTags({secret: process.env.SANITY_REVALIDATE_SECRET})
```

### Composing your own handler

`invalidateSyncTags(syncTags, options)` is the send step on its own. It signs the body with `@sanity/webhook`, POSTs to every URL, and resolves to one delivery result per URL without throwing for a failed origin.

```ts
import {invalidateSyncTags} from '@sanity/next-sanity-functions'
import {syncTagInvalidateEventHandler} from '@sanity/functions'

export const handler = syncTagInvalidateEventHandler(async ({event, done}) => {
  const {syncTags} = event.data
  try {
    const deliveries = await invalidateSyncTags(syncTags, {
      secret: process.env.SANITY_REVALIDATE_SECRET,
      urls: process.env.REVALIDATE_URL,
    })
    for (const delivery of deliveries) {
      if (!delivery.ok) console.error(delivery)
    }
  } finally {
    await done(syncTags)
  }
})
```

## License

MIT
