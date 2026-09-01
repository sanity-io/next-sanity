import type {Metadata} from 'next'
import {imageLoader} from 'next-sanity/image'
import {getImageProps} from 'next/image'

import {DemoPage, DemoSection} from '../components'

export const metadata: Metadata = {title: 'Theme'}

const poster =
  'https://cdn.sanity.io/images/pv8y60vp/production/7aa06723bb01a7a79055b6d6f5be80329a0e5b58-780x1170.jpg'

/**
 * `imageLoader` composes with `getImageProps` for art direction: here a
 * `<picture>` element picks a CDN-inverted rendition in dark mode. The `w`/`h`
 * params on the URL make the loader crop every candidate to the same wide
 * aspect ratio (`getImageProps` alone doesn't encode them like `<Image>` does).
 */
function themedImageProps(invert: boolean) {
  return getImageProps({
    src: `${poster}?w=780&h=585${invert ? '&invert=true' : ''}`,
    loader: imageLoader,
    width: 780,
    height: 585,
    sizes: '(min-width: 896px) 832px, 100vw',
    alt: 'Poster for Interstellar, inverted when the browser prefers a dark color scheme',
  })
}

export default function ThemePage() {
  const {
    props: {srcSet: darkSrcSet},
  } = themedImageProps(true)
  const {props: lightProps} = themedImageProps(false)

  return (
    <DemoPage
      title="Theme"
      lede={
        <>
          For art direction, compose <code>imageLoader</code> with <code>getImageProps</code> from{' '}
          <code>next/image</code> and spread the result onto a <code>&lt;picture&gt;</code> element.
          Here dark mode gets a different rendition — same asset, inverted by the CDN. Toggle your
          OS or dev tools color scheme to switch.
        </>
      }
    >
      <DemoSection
        title="prefers-color-scheme"
        code={`import {getImageProps} from 'next/image'
import {imageLoader} from 'next-sanity/image'

const common = {loader: imageLoader, width: 780, height: 585, alt: '…'}
const {props: {srcSet: dark}} = getImageProps({...common, src: \`\${poster}?invert=true\`})
const {props: light} = getImageProps({...common, src: poster})

<picture>
  <source media="(prefers-color-scheme: dark)" srcSet={dark} />
  <img {...light} />
</picture>`}
      >
        <picture>
          <source media="(prefers-color-scheme: dark)" srcSet={darkSrcSet} />
          {/* alt is part of lightProps, returned by getImageProps */}
          <img {...lightProps} className="h-auto w-full rounded-lg" />
        </picture>
      </DemoSection>
    </DemoPage>
  )
}
