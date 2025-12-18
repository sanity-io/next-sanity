import type {SanityClient} from 'next-sanity'
import {preconnect as reactDomPreconnect} from 'react-dom'

/**
 * Uses the React DOM `preconnect` function to preconnect to the Live Event API origin early, nextjs will set the right headers and meta tags to speedup the connection.
 */
export function preconnect(client: SanityClient): void {
  const {origin} = new URL(client.getUrl('', false))
  reactDomPreconnect(origin)
}
