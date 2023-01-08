import _faviconPng from './apple-touch-icon.png'
import _faviconIco from './favicon.ico'
import _faviconSvg from './favicon.svg'

const faviconPng = typeof _faviconPng === 'string' ? _faviconPng : _faviconPng.default
const faviconIco = typeof _faviconIco === 'string' ? _faviconIco : _faviconIco.default
const faviconSvg = typeof _faviconSvg === 'string' ? _faviconSvg : _faviconSvg.default

/** @public */
export interface NextStudioHeadProps {
  /**
   * @defaultValue 'utf-8'
   */
  charSet?: false | string
  /**
   * Sets the viewport to `viewport-fit=cover` to integrate with iOS devices with display cutouts (The Notch, Dynamic Island).
   * Also sets `width=device-width, initial-scale=1` to make the studio page responsive.
   * @defaultValue true
   */
  viewport?: boolean
  /**
   * It's common practice to hide the address to your Sanity Studio from search engines by setting `robots` to `noindex`
   * @defaultValue 'noindex'
   */
  robots?: false | string
  /**
   * @defaultValue 'same-origin'
   */
  referrer?: false | string
  /**
   * Adds the same favicons as the `npx sanity dev` pipeline.
   * @defaultValue true
   */
  favicons?: boolean
  /**
   * @defaultValue 'Sanity'
   */
  title?: false | string
}

/**
 * In Next 13 appDir mode (`/app/studio/[[...index]]/head.tsx`):
 * ```tsx
 * // If you don't want to change any defaults you can just re-export the head component directly:
 * export {NextStudioHead as default} from 'next-sanity/studio/head'
 *
 * // To customize it, use it as a children component:
 * import {NextStudioHead} from 'next-sanity/studio/head'
 *
 * export default function CustomStudioHead() {
 *   return (
 *     <>
 *       <NextStudioHead favicons={false} />
 *       <link
 *         rel="icon"
 *         type="image/png"
 *         sizes="32x32"
 *         href="https://www.sanity.io/static/images/favicons/favicon-32x32.png"
 *       />
 *     </>
 *   )
 * }
 * ```
 * If you're using Next 12 or the `pages` folder (`/pages/studio/[[...index]].tsx`):
 * ```tsx
 * import Head from 'next/head'
 * import {NextStudio} from 'next-sanity/studio'
 * import {NextStudioHead} from 'next-sanity/studio/head'
 *
 * export default function StudioPage() {
 *   return (
 *     <>
 *       <Head>
 *         <NextStudioHead />
 *       </Head>
 *       <NextStudio config={config} />
 *     </>
 *   )
 * }
 * ```
 * @public
 */
export function NextStudioHead(props: NextStudioHeadProps) {
  const {
    charSet = 'utf-8',
    viewport = true,
    robots = 'noindex',
    referrer = 'same-origin',
    favicons = true,
    title = 'Sanity',
  } = props

  return (
    <>
      {charSet && <meta key="charset" charSet={charSet} />}
      {viewport && (
        <meta
          key="viewport"
          name="viewport"
          // Studio implements display cutouts CSS (The iPhone Notch ™ ) and needs `viewport-fit=covered` for it to work correctly
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
      )}
      {robots && <meta key="robots" name="robots" content={robots} />}
      {referrer && <meta key="referrer" name="referrer" content={referrer} />}
      {title && <title>{title}</title>}
      {favicons && <link key="favicon.ico" rel="icon" href={faviconIco} sizes="any" />}
      {favicons && <link key="apple-touch-icon.png" rel="apple-touch-icon" href={faviconPng} />}
      {favicons && <link key="favicon.svg" rel="icon" href={faviconSvg} type="image/svg+xml" />}
    </>
  )
}
