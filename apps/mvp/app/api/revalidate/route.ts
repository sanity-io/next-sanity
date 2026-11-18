import {defineInvalidateSyncTags} from 'next-sanity/live/invalidate'

export const {POST} = defineInvalidateSyncTags({
  secret: process.env.SANITY_REVALIDATE_SECRET,
})
