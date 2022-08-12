/* eslint-disable no-process-env */
import {createConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default createConfig({
  name: 'next-sanity',
  title: 'next-sanity',
  basePath: '/studio',

  projectId,
  dataset,

  plugins: [deskTool()],

  schema: {
    types: schemaTypes,
  },
  document: {
    // eslint-disable-next-line require-await
    productionUrl: async (prev) => {
      // eslint-disable-next-line no-restricted-globals
      const url = new URL('/api/preview', location.origin)
      // eslint-disable-next-line no-warning-comments
      // @TODO grab secret with client
      const secret = process.env.NEXT_PUBLIC_PREVIEW_SECRET
      if (secret) {
        url.searchParams.set('secret', secret)
      } else if (process.env.NODE_ENV === 'production') {
        console.warn('No preview secret set. Previews disabled.')
        return prev
      }

      return url.toString()
    },
  },
})
