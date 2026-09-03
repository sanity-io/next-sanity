import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

// `REVALIDATE_URL` and `SANITY_REVALIDATE_SECRET` are set by `sanity.blueprint.ts` at deploy time.
// `urls` splits on commas, so one variable still fans out to several deployments.
export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URL,
})
