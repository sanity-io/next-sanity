/* eslint-disable no-process-env */
import Head from 'next/head'
import {type ComponentProps, memo, useCallback} from 'react'

// @ts-ignore
import iconApple from './apple-touch-icon.png'
// @ts-ignore
import iconIco from './favicon.ico'
// @ts-ignore
import iconSvg from './favicon.svg'
// @ts-ignore
import icon192 from './favicon-192.png'
// @ts-ignore
import icon512 from './favicon-512.png'
import type {MetaThemeColors} from './utils'
import webmanifest from './webmanifest.json'

// Interop between how Parcel and Next deals with asset imports
const interop = (href: string | {src: string}): string =>
  typeof href === 'string' ? href : href.src

export interface NextStudioHeadProps extends Partial<MetaThemeColors> {
  children?: ComponentProps<typeof Head>['children']
  title?: string
  favicons?: boolean
}
const NextStudioHeadComponent = ({
  children,
  themeColorDark,
  themeColorLight,
  title = 'Sanity Studio',
  favicons,
}: NextStudioHeadProps) => {
  const inlineWebmanifest = useCallback(() => {
    const manifest = JSON.parse(JSON.stringify(webmanifest))
    const icons = manifest.icons.map((icon: any) => {
      // Inline manifests works best when URLs are absolute
      const src =
        // eslint-disable-next-line no-nested-ternary
        icon.src === './favicon-192.png'
          ? interop(icon192)
          : icon.src === './favicon-512.png'
          ? interop(icon512)
          : icon.src
      return {
        ...icon,
        src: process.env.NEXT_PUBLIC_VERCEL_URL
          ? new URL(src, `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`).toString()
          : src,
      }
    })
    return `data:application/manifest+json,${encodeURIComponent(
      JSON.stringify({...manifest, icons})
    )}`
  }, [])

  return (
    <Head>
      <meta
        name="viewport"
        // Studio implements display cutouts CSS (The iPhone Notch ™ ) and needs `viewport-fit=covered` for it to work correctly
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta name="robots" content="noindex" />
      <meta name="referrer" content="same-origin" />
      {title && <title>{title}</title>}
      {favicons && <link rel="icon" href={interop(iconIco)} sizes="any" />}
      {favicons && <link rel="icon" href={interop(iconSvg)} type="image/svg+xml" />}
      {favicons && <link rel="apple-touch-icon" href={interop(iconApple)} />}
      {favicons && (
        <link
          rel="manifest"
          // eslint-disable-next-line no-warning-comments
          // @TODO until parcel fixes https://github.com/parcel-bundler/parcel/issues/8025 and stops stripping process.env.NEXT_PUBLIC_VERCEL_URL from the compiled code, use the remove webmanifest
          href={
            process.env.NEXT_PUBLIC_VERCEL_URL
              ? inlineWebmanifest()
              : 'https://next.sanity.build/manifest.webmanifest'
          }
        />
      )}
      {/* These theme-color tags makes the Studio look really really good on devices like iPads as the browser chrome adopts the Studio background */}
      {themeColorLight && (
        <meta
          key="theme-color-light"
          name="theme-color"
          content={themeColorLight}
          media="(prefers-color-scheme: light)"
        />
      )}
      {themeColorDark && (
        <meta
          key="theme-color-dark"
          name="theme-color"
          content={themeColorDark}
          media="(prefers-color-scheme: dark)"
        />
      )}
      {children}
    </Head>
  )
}

export const NextStudioHead = memo(NextStudioHeadComponent)
