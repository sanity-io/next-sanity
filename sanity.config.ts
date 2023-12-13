/* eslint-disable no-restricted-globals */
/* eslint-disable no-process-env */
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {presentationTool} from 'sanity/presentation'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  title: 'next-sanity',
  basePath: '/studio',

  projectId,
  dataset,

  plugins: [
    deskTool(),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: '/api/draft',
        },
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
