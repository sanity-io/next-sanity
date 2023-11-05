import type {Viewport} from 'next'

/**
 * In Next 13 appDir mode (`/app/studio/[[...index]]/page.tsx`):
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
  width: 'device-width',
  initialScale: 1,
  // Studio implements display cutouts CSS (The iPhone Notch ™ ) and needs `viewport-fit=covered` for it to work correctly
  viewportFit: 'cover',
} satisfies Viewport
