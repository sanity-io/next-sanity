'use cache'

// oxlint-disable-next-line no-unassigned-import
import '../globals.css'

import {unstable_cacheLife as cacheLife} from 'next/cache'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  cacheLife('max')
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="same-origin" />
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  )
}
