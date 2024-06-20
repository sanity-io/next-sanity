import {definePlugin} from 'sanity'
import {assist} from '@sanity/assist'
import {visionTool} from '@sanity/vision'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

export default definePlugin({
  name: '@repo/sanity-config',
  plugins: [assist(), structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
