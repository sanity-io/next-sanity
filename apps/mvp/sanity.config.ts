'use client'

import sharedConfig from '@repo/sanity-config'
import {buildTheme} from '@sanity/themer'
import {defineConfig} from 'sanity'
import {presentationTool, type PreviewUrlResolverOptions} from 'sanity/presentation'

const theme = buildTheme({
  accent: '#1cb485',
  text: '#5c9199',
  background: {dark: '#0d1415', light: '#fcfdfd'},
})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const previewOrigin = process.env.NEXT_PUBLIC_TEST_PREVIEW_ORIGIN
const previewPath = process.env.NEXT_PUBLIC_TEST_PREVIEW_PATH || '/'

const previewMode = {
  enable: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/api/draft-mode/enable`,
} satisfies PreviewUrlResolverOptions['previewMode']

export default defineConfig({
  title: 'next-sanity',
  projectId,
  dataset,
  theme,
  plugins: [
    presentationTool({
      previewUrl: {
        origin: previewOrigin,
        preview: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}${previewPath}`,
        previewMode,
      },
    }),
    sharedConfig(),
  ],
  beta: {
    variants: {enabled: true},
  },
})
