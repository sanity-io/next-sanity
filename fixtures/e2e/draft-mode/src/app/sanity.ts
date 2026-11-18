import {createClient} from 'next-sanity'
import {defineLive} from 'next-sanity/live'

const port = process.env.MOCK_SANITY_PORT || '3211'

export const client = createClient({
  projectId: 'mock',
  dataset: 'production',
  apiHost: `http://127.0.0.1:${port}`,
  useProjectHostname: false,
  apiVersion: '2025-02-19',
  useCdn: false,
  perspective: 'published',
  stega: {studioUrl: '/presentation'},
})

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: 'server-token',
  browserToken: 'browser-token',
})

export const postQuery = `*[_type == "post" && slug.current == $slug][0]{_id, _type, title}`
