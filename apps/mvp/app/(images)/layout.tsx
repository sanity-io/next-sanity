import '../globals.css'
import type {Metadata} from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    template: '%s · next-sanity/image gallery',
    default: 'next-sanity/image gallery',
  },
  description:
    'Live examples of rendering Sanity Image CDN assets with next/image through next-sanity/image.',
}

export default function ImageGalleryLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-baseline justify-between gap-4 px-6 py-4">
            <Link href="/images" className="font-semibold tracking-tight hover:text-blue-600">
              <code className="font-mono text-sm">next-sanity/image</code>{' '}
              <span className="text-zinc-500">gallery</span>
            </Link>
            <nav className="flex gap-4 font-mono text-xs text-zinc-500">
              <Link href="/" className="hover:text-blue-600">
                demo app
              </Link>
              <a
                href="https://github.com/sanity-io/next-sanity#rendering-images-alpha"
                className="hover:text-blue-600"
              >
                docs
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
        <footer className="border-t border-zinc-200 py-8 text-center font-mono text-xs text-zinc-400">
          <p>
            Images served from the Sanity Image CDN · project pv8y60vp · dataset production ·
            inspired by{' '}
            <a href="https://image-component.nextjs.gallery" className="underline">
              image-component.nextjs.gallery
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
