'use client'


import sharedConfig from '@repo/sanity-config'
import {defineConfig} from 'sanity'
import {presentationTool, type PreviewUrlResolverOptions} from 'sanity/presentation'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

const previewMode = {
  enable: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/api/draft-mode/enable`,
} satisfies PreviewUrlResolverOptions['previewMode']

export default defineConfig({
  title: 'next-sanity',
  projectId,
  dataset,

  plugins: [
    presentationTool({
      previewUrl: {preview: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/`, previewMode},
    }),
    sharedConfig(),
  ],
})
