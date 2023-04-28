import type {Metadata} from 'next'

/**
 * In Next 13 appDir mode (`/app/studio/[[...index]]/page.tsx`):
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
 *   // Overrides the viewport to resize behavior
 *   viewport: `${studioMetadata.viewport}, interactive-widget=resizes-content`,
 * })
 * ```
 * If you're using Next 12 or the `pages` folder (`/pages/studio/[[...index]].tsx`):
 * ```tsx
 * import Head from 'next/head'
 * import {NextStudio, metadata} from 'next-sanity/studio'
 *
 * export default function StudioPage() {
 *   return (
 *     <>
 *       <Head>
 *         {Object.entries(metadata).map(([key, value]) => (
 *           <meta key={key} name={key} content={value} />
 *         ))}
 *       </Head>
 *       <NextStudio config={config} />
 *     </>
 *   )
 * }
 * ```
 * @public
 */
export const metadata = {
  // Studio implements display cutouts CSS (The iPhone Notch ™ ) and needs `viewport-fit=covered` for it to work correctly
  viewport: 'width=device-width,initial-scale=1,viewport-fit=cover' as const,
  referrer: 'same-origin' as const,
  robots: 'noindex' as const,
} satisfies Metadata
