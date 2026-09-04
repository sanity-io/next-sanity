import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URL,
})
