import type {Metadata, Viewport} from 'next'

/**
 * In router segments (`/app/studio/[[...index]]/page.tsx`):
 * ```tsx
 * // If you don't want to change any defaults you can just re-export the viewport config directly:
 * export {viewport} from 'next-sanity/studio'
 *
 * // To customize the viewport config, spread it on the export:
 * import {viewport as studioViewport} from 'next-sanity/studio'
 * import type { Viewport } from 'next'
 *
 * export const viewport: Viewport = {
 *   ...studioViewport,
 *   // Overrides the viewport to resize behavior
 *   interactiveWidget: 'resizes-content'
 * })
 * ```
 * @public
 */
export const viewport = {
  width: 'device-width' as const,
  initialScale: 1 as const,
  // Studio implements display cutouts CSS (The iPhone Notch ™ ) and needs `viewport-fit=covered` for it to work correctly
  viewportFit: 'cover',
} satisfies Viewport

/**
 * In router segments (`/app/studio/[[...index]]/page.tsx`):
 * ```tsx
 * // If you don't want to change any defaults you can just re-export the metadata directly:
 * export {metadata} from 'next-sanity/studio'
 *
 * // To customize the metadata, spread it on the export:
 * import {metadata as studioMetadata} from 'next-sanity/studio'
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
