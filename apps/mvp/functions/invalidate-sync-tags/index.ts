import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

/**
 * Configure the deployed function with:
 *   npx sanity functions env add invalidate-sync-tags SANITY_REVALIDATE_SECRET <same value as the Next.js app>
 *   npx sanity functions env add invalidate-sync-tags REVALIDATE_URLS https://<your-site>/api/revalidate
 */
export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URLS,
})
