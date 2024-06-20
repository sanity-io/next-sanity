/* eslint-disable no-restricted-globals */
/* eslint-disable no-process-env */
import sharedConfig from '@repo/sanity-config'
import {defineConfig} from 'sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  projectId,
  dataset,

  plugins: [sharedConfig()],

  scheduledPublishing: {
    enabled: false,
  },
})
