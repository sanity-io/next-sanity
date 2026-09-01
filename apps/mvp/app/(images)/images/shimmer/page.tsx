import type {Metadata} from 'next'

import {DemoPage, DemoSection, Figure} from '../components'
import {getMovies} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Shimmer'}

/**
 * An animated shimmer SVG, from the next/image example gallery.
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e4e4e7" offset="20%" />
      <stop stop-color="#d4d4d8" offset="50%" />
      <stop stop-color="#e4e4e7" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#e4e4e7" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const shimmerDataUrl = (w: number, h: number) =>
  `data:image/svg+xml;base64,${Buffer.from(shimmer(w, h)).toString('base64')}` as const

export default async function ShimmerPage() {
  const movies = await getMovies(3)

  return (
    <DemoPage
      title="Shimmer"
      lede={
        <>
          The <code>placeholder</code> prop accepts any <code>data:image/</code> URL, so a tiny
          animated SVG makes a classic loading shimmer. Throttle the network in dev tools (and
          disable cache) to see it.
        </>
      }
    >
      <DemoSection
        title="Animated SVG placeholder"
        code={`<Image
  src={movie.poster}
  width={420}
  placeholder={\`data:image/svg+xml;base64,\${toBase64(shimmer(420, 630))}\`}
  alt="…"
/>`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {movies.map((movie) =>
            movie.poster ? (
              <Figure key={movie.title} caption={movie.title}>
                <Image
                  src={movie.poster}
                  width={420}
                  placeholder={shimmerDataUrl(420, 630)}
                  className="h-auto w-full rounded-lg"
                  alt={`Poster for ${movie.title}`}
                />
              </Figure>
            ) : null,
          )}
        </div>
      </DemoSection>
    </DemoPage>
  )
}
