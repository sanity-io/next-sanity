import {assist} from '@sanity/assist'
import {themerTool} from '@sanity/themer/tool'
import {visionTool} from '@sanity/vision'
import {definePlugin} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

export default definePlugin({
  name: '@repo/sanity-config',
  plugins: [assist(), structureTool(), visionTool(), themerTool()],
  schema: {
    types: schemaTypes,
  },
})
