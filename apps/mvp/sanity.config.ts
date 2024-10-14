'use client'

/* eslint-disable no-restricted-globals,no-process-env */

import sharedConfig from '@repo/sanity-config'
import {debugSecrets} from '@sanity/preview-url-secret/sanity-plugin-debug-secrets'
import {defineConfig} from 'sanity'
import {presentationTool, type PreviewUrlResolverOptions} from 'sanity/presentation'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

const previewMode = {
  enable: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/api/draft`,
} satisfies PreviewUrlResolverOptions['previewMode']

export default defineConfig({
  projectId,
  dataset,

  plugins: [
    presentationTool({
      previewUrl: {preview: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH}/` || '/', previewMode},
    }),
    sharedConfig(),
    debugSecrets(),
  ],
})
