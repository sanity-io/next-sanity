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

export default function StudioLayout({children}: {children: React.ReactNode}) {
  return children
}
