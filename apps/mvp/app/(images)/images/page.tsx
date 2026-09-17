import {Image} from 'next-sanity/image'
import Link from 'next/link'

import {CodeBlock, DemoSection} from './components'
import {getHeroPost} from './data'

const demos = [
  {href: '/images/responsive', title: 'Responsive', description: 'Fluid layouts with `sizes`'},
  {href: '/images/fill', title: 'Fill', description: 'Fill a parent element, object-fit styling'},
  {href: '/images/background', title: 'Background', description: 'Full-bleed background images'},
  {
    href: '/images/placeholder',
    title: 'Placeholder',
    description: 'Blur-up with Sanity LQIP metadata',
  },
  {href: '/images/shimmer', title: 'Shimmer', description: 'Animated SVG placeholder'},
  {href: '/images/color', title: 'Color', description: 'Placeholder from the image palette'},
  {href: '/images/theme', title: 'Theme', description: 'Art direction with getImageProps'},
  {
    href: '/images/hotspot',
    title: 'Hotspot & crop',
    description: 'Studio crops at any aspect ratio',
  },
  {
    href: '/images/transformations',
    title: 'Transformations',
    description: 'CDN effects with queryParams',
  },
] as const

export default async function ImageGalleryIndexPage() {
  const post = await getHeroPost()

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          <code>next/image</code> with Sanity
        </h1>
        <p className="max-w-prose text-lg text-zinc-600">
          These pages demonstrate <code className="font-mono text-base">next-sanity/image</code>:
          the <code className="font-mono text-base">next/image</code> component preconfigured for
          the Sanity Image CDN. Every image on this page is optimized on demand as the browser
          requests it — right-sized for its layout, auto-negotiated to AVIF/WebP, and cropped by the
          rules editors set in the Studio.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Examples</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <li key={demo.href}>
              <Link
                href={demo.href}
                className="block h-full rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-400 hover:text-blue-600"
              >
                <span className="font-semibold">{demo.title}</span>
                <span className="mt-1 block font-mono text-xs text-zinc-500">
                  {demo.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DemoSection
        title="Image objects from GROQ"
        description={
          <>
            The equivalent of the gallery&apos;s &ldquo;internal image&rdquo;: an image object
            straight from a query — <code>mainImage{'{asset, crop, hotspot, alt}'}</code> — with the
            crop and hotspot set in the Studio applied, and the dimensions inferred from the asset.
            This one is marked <code>priority</code> since it&apos;s the largest thing above the
            fold.
          </>
        }
        code={`const post = await getHeroPost()

<Image src={post.image} projectId={projectId} dataset={dataset} width={880} priority alt="…" />`}
      >
        {post?.image ? (
          <Image
            src={post.image}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            width={880}
            priority
            className="w-full rounded-lg"
            alt={post.image.alt?.trim() || `Poster for ${post.title}`}
          />
        ) : (
          <p className="text-sm text-zinc-500">No post with an image found in the dataset.</p>
        )}
      </DemoSection>

      <DemoSection
        title="URL strings"
        description={
          <>
            The equivalent of the gallery&apos;s &ldquo;external image&rdquo;: any Sanity Image CDN
            URL works as <code>src</code> — from <code>asset-&gt;url</code> or an{' '}
            <code>@sanity/image-url</code> builder. No <code>remotePatterns</code> config needed,
            because the loader talks straight to the CDN. Width and height are read from the URL
            (every Sanity asset filename ends in its dimensions).
          </>
        }
        code={`<Image
  src="https://cdn.sanity.io/images/pv8y60vp/production/dd1b3f1277b35e35d889395d0d9577cee8417a18-694x691.png"
  width={320}
  alt="Buzz Lightyear"
/>`}
      >
        <Image
          src="https://cdn.sanity.io/images/pv8y60vp/production/dd1b3f1277b35e35d889395d0d9577cee8417a18-694x691.png"
          width={320}
          className="rounded-lg"
          alt="Buzz Lightyear"
        />
      </DemoSection>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Learn more</h2>
        <CodeBlock code={`import {Image} from 'next-sanity/image'`} />
        <ul className="list-inside list-disc text-sm text-zinc-600">
          <li>
            <a
              href="https://github.com/sanity-io/next-sanity#rendering-images-alpha"
              className="underline hover:text-blue-600"
            >
              next-sanity/image documentation
            </a>
          </li>
          <li>
            <a
              href="https://nextjs.org/docs/app/api-reference/components/image"
              className="underline hover:text-blue-600"
            >
              next/image API reference
            </a>
          </li>
          <li>
            <a
              href="https://www.sanity.io/docs/image-urls"
              className="underline hover:text-blue-600"
            >
              Sanity Image CDN transformation reference
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
