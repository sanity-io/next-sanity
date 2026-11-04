import '../globals.css'
import type {Metadata, Viewport} from 'next'

export const metadata: Metadata = {
  referrer: 'same-origin',
  robots: 'noindex',
}

// Studio's display-cutout CSS only applies under viewport-fit=cover.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  )
}
