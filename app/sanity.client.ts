/* eslint-disable no-process-env */
import {createClient, type SanityClient} from 'src'

export function getClient(preview?: {token: string}): SanityClient {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    // apiVersion: '2022-11-11',
    // eslint-disable-next-line no-warning-comments
    // @TODO perspectives require vX for now
    apiVersion: 'X',
    useCdn: true,    
    perspective: 'published',
    studioUrl: '/studio',
    logger: console,
  })
  if (preview) {
    if (!preview.token) {
      throw new Error('You must provide a token to preview drafts')
    }
    return client.withConfig({
      token: preview.token,
      useCdn: false,
      ignoreBrowserTokenWarning: true,
      perspective: 'previewDrafts',
    })
  }
  return client
}
