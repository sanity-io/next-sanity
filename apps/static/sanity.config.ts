'use client'

/* eslint-disable no-restricted-globals */
/* eslint-disable no-process-env */
import {assist} from '@sanity/assist'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  projectId,
  dataset,

  plugins: [assist(), structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
