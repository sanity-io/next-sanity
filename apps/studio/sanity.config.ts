import {assist} from '@sanity/assist'
import {buildTheme} from '@sanity/themer'
import {themerTool} from '@sanity/themer/tool'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

const theme = buildTheme({
  dark: {accent: '#1cb485', text: '#5c9199', background: '#0d1415'},
  light: {accent: '#1cb485', text: '#5c9199', background: '#fcfdfd'},
})

export default defineConfig({
  title: 'next-sanity',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  theme,
  plugins: [
    presentationTool({
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000',
        preview: process.env.SANITY_STUDIO_PREVIEW_PATH || '/',
        previewMode: {enable: '/api/draft-mode/enable'},
      },
    }),
    structureTool(),
    visionTool(),
    assist(),
    themerTool(),
  ],
  schema: {
    types: schemaTypes,
  },
  beta: {
    variants: {enabled: true},
  },
})
