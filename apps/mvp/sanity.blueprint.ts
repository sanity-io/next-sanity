import {loadEnvConfig} from '@next/env'
import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig(__dirname, dev, {info: () => null, error: console.error})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

/**
 * Deploys `functions/invalidate-sync-tags` with `npx sanity blueprints deploy`.
 * A dataset can have one sync tag invalidate function, so it is scoped to the dataset this app reads from.
 */
export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: 'invalidate-sync-tags',
      event:
        projectId && dataset
          ? {resource: {type: 'dataset', id: `${projectId}.${dataset}`}}
          : undefined,
    }),
  ],
})
