# @sanity/next-sanity-functions

Sanity Functions helpers for [`next-sanity`](https://github.com/sanity-io/next-sanity). The package signs sync tag invalidations and POSTs them to the route handler that `defineInvalidateSyncTags` from `next-sanity/live/invalidate` returns. `<SanityLive waitFor="function">` clients then refresh only after the Next.js cache has been expired.

The package has no Next.js or React dependency, so a Sanity Function bundle that imports it stays small.

## Install

```bash
npm install @sanity/next-sanity-functions @sanity/functions @sanity/blueprints
```

## Usage

By default every browser tab connected through `<SanityLive>` reacts to a live event by calling a Server Action that expires the cache and refreshes the page. The tabs race the revalidation. With `waitFor="function"` Sanity runs the function below first, holds the event until it calls `done()`, and only then lets browsers refresh. The full guide, with the deploy and CI steps, is in the [`next-sanity` README](https://github.com/sanity-io/next-sanity/tree/main/packages/next-sanity#invalidate-the-cache-before-live-events-reach-the-browser). The pieces are these.

**1. Generate a secret** with `openssl rand -hex 32` and set it as `SANITY_REVALIDATE_SECRET` on the Next.js deployment.

**2. Add the route handler.**

```ts
// app/api/revalidate/route.ts
import {defineInvalidateSyncTags} from 'next-sanity/live/invalidate'

export const {POST} = defineInvalidateSyncTags({secret: process.env.SANITY_REVALIDATE_SECRET})
```

**3. Add the function.**

```ts
// functions/invalidate-sync-tags/index.ts
import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URL,
})
```

`urls` splits a string on commas, so one `REVALIDATE_URL` can name several deployments. The handler POSTs to every URL in parallel, logs each outcome, and always calls `done()`, so a failing origin never holds the live event back.

**4. Add the blueprint.** It scopes the function to one dataset and passes the two variables to the deployed function. Blueprint `env` is additive. A value left out of the deploy keeps whatever is already deployed.

```ts
// sanity.blueprint.ts
import {loadEnvConfig} from '@next/env'
import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

loadEnvConfig(__dirname, process.env.NODE_ENV !== 'production', {
  info: () => null,
  error: console.error,
})

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET,
  REVALIDATE_URL,
  SANITY_REVALIDATE_SECRET,
} = process.env

const env: Record<string, string> = {}
if (REVALIDATE_URL) env.REVALIDATE_URL = REVALIDATE_URL
if (SANITY_REVALIDATE_SECRET) env.SANITY_REVALIDATE_SECRET = SANITY_REVALIDATE_SECRET

export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: 'invalidate-sync-tags',
      event: {
        resource: {
          type: 'dataset',
          id: `${NEXT_PUBLIC_SANITY_PROJECT_ID}.${NEXT_PUBLIC_SANITY_DATASET}`,
        },
      },
      env: Object.keys(env).length > 0 ? env : undefined,
    }),
  ],
})
```

**5. Deploy.** With `REVALIDATE_URL=https://<your-site>/api/revalidate` and `SANITY_REVALIDATE_SECRET` in `.env.local`, run `npx sanity blueprints init` once and then `npx sanity blueprints deploy`. From CI, use `sanity-io/blueprints-actions/plan@plan-v2` on pull requests and `sanity-io/blueprints-actions/deploy@deploy-v3` on the default branch. Then set `SANITY_LIVE_WAIT_FOR_FUNCTION=true` on the site, render `<SanityLive waitFor="function" />` when it is set, and redeploy the site.

To run the function against a local dev server without deploying anything:

```shell
REVALIDATE_URL=http://localhost:3000/api/revalidate SANITY_REVALIDATE_SECRET=<secret> \
  npx sanity functions test invalidate-sync-tags --data '{"syncTags": ["s1:example"]}'
```

## Why the request is signed

`invalidateSyncTags` signs the body with `@sanity/webhook`, the same HMAC scheme Sanity uses for GROQ-powered webhooks. The signature covers the body and the time it was created, so a captured request cannot be edited or replayed after the receiver's `maxAge`, five minutes by default. A bearer token would be a static credential sent in the clear on every call, and any log line that captures it is enough to expire the cache at will. `defineInvalidateSyncTags` therefore accepts only signed requests.

## Composing your own handler

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
