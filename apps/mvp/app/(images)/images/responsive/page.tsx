import type {Metadata} from 'next'

import {DemoPage, DemoSection, Figure} from '../components'
import {getHeroPost, getMovies} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Responsive'}

export default async function ResponsivePage() {
  const [post, movies] = await Promise.all([getHeroPost(), getMovies(8)])

  return (
    <DemoPage
      title="Responsive"
      lede={
        <>
          Resize the viewport: the browser picks the best candidate from the generated{' '}
          <code>srcset</code>, and the Sanity CDN serves exactly that width. The <code>sizes</code>{' '}
          prop tells the browser how large the image will render, so small screens never download
          desktop-sized files.
        </>
      }
    >
      <DemoSection
        title="Full width"
        description={
          <>
            <code>sizes=&quot;100vw&quot;</code> generates a <code>w</code>-descriptor srcset across
            every configured device size, each candidate keeping the aspect ratio of the Studio
            crop.
          </>
        }
        code={`<Image
  src={post.image}
  sizes="100vw"
  className="h-auto w-full"
  alt="…"
/>`}
      >
        {post?.image ? (
          <Image
            src={post.image}
            sizes="100vw"
            className="h-auto w-full rounded-lg"
            alt={post.image.alt?.trim() || `Poster for ${post.title}`}
          />
        ) : null}
      </DemoSection>

      <DemoSection
        title="Grid"
        description={
          <>
            In a grid each image only ever spans a fraction of the viewport, so <code>sizes</code>{' '}
            trims the small candidates out of the srcset. The dimensions come from each asset — no{' '}
            <code>width</code>/<code>height</code> props needed.
          </>
        }
        code={`{movies.map((movie) => (
  <Image
    src={movie.poster}
    sizes="(min-width: 1024px) 25vw, 50vw"
    className="h-auto w-full"
    alt={\`Poster for \${movie.title}\`}
  />
))}`}
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {movies.map((movie) =>
            movie.poster ? (
              <Figure key={movie.title} caption={movie.title}>
                <Image
                  src={movie.poster}
                  sizes="(min-width: 1024px) 25vw, 50vw"
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
