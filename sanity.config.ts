/* eslint-disable no-process-env */
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  title: 'next-sanity',
  basePath: '/studio',

  projectId,
  dataset,

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
