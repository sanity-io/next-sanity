import type {Metadata} from 'next'

/**
 * In App Router segments (`/app/studio/[[...index]]/page.tsx`):
 * ```tsx
 * // If you don't want to change any defaults you can just re-export the metadata directly:
 * export {metadata} from 'next-sanity/studio/metadata'
 *
 * // To customize the metadata, spread it on the export:
 * import {metadata as studioMetadata} from 'next-sanity/studio/metadata'
 * import type { Metadata } from 'next'
 *
 * export const metadata: Metadata = {
 *   ...studioMetadata,
 *   // Set another title
 *   title: 'My Studio',
 * })
 * ```
 * @public
 */
export const metadata = {
  referrer: 'same-origin' as const,
  robots: 'noindex' as const,
} satisfies Metadata
