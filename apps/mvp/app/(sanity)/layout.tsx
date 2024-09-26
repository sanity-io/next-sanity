import '../globals.css'

export {metadata, viewport} from 'next-sanity/studio'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  )
}
