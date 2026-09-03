import type {Metadata, Viewport} from 'next'

export const metadata: Metadata = {
  referrer: 'same-origin',
  robots: 'noindex',
}

// The Studio draws into display cutouts, so viewport-fit=cover keeps its
// navbar clear of the iPhone notch.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function StudioLayout({children}: {children: React.ReactNode}) {
  return children
}
