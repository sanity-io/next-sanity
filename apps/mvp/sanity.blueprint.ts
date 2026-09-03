import {loadEnvConfig} from '@next/env'
import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig(__dirname, dev, {info: () => null, error: console.error})

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET,
  REVALIDATE_URL,
  SANITY_REVALIDATE_SECRET,
} = process.env

// Blueprint `env` is additive, so leaving a value out keeps whatever is already deployed.
const env: Record<string, string> = {}
if (REVALIDATE_URL) env.REVALIDATE_URL = REVALIDATE_URL
if (SANITY_REVALIDATE_SECRET) env.SANITY_REVALIDATE_SECRET = SANITY_REVALIDATE_SECRET

/**
 * Deploys `functions/invalidate-sync-tags` with `npx sanity blueprints deploy`.
 * A dataset can have one sync tag invalidate function, so it is scoped to the dataset this app reads from.
 */
export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: 'invalidate-sync-tags',
      event:
        NEXT_PUBLIC_SANITY_PROJECT_ID && NEXT_PUBLIC_SANITY_DATASET
          ? {
              resource: {
                type: 'dataset',
                id: `${NEXT_PUBLIC_SANITY_PROJECT_ID}.${NEXT_PUBLIC_SANITY_DATASET}`,
              },
            }
          : undefined,
      env: Object.keys(env).length > 0 ? env : undefined,
    }),
  ],
})
