import type {Metadata} from 'next'

import {DemoPage, DemoSection} from '../components'
import {getHeroPost} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Background'}

export default async function BackgroundPage() {
  const post = await getHeroPost()
  if (!post?.image) return null

  return (
    <DemoPage
      title="Background"
      lede={
        <>
          A full-bleed background is a <code>fill</code> image behind stacked content — with all the
          optimization benefits CSS <code>background-image</code> can&apos;t give you: responsive
          candidates, lazy loading, AVIF/WebP negotiation, and <code>preload</code> for the hero.
        </>
      }
    >
      <DemoSection
        title="Hero section"
        description={
          <>
            The backdrop is the same poster, art-directed by the CDN: blurred, desaturated and
            darkened through the <code>queryParams</code> prop, and marked <code>preload</code>{' '}
            since it&apos;s above the fold.
          </>
        }
        code={`<section className="relative isolate flex h-96 items-center justify-center">
  <Image
    src={post.image}
    fill
    preload
    sizes="100vw"
    queryParams={{blur: 60, sat: -60}}
    className="-z-10 object-cover brightness-50"
    alt=""
  />
  <h3 className="text-white">{post.title}</h3>
</section>`}
      >
        <section className="relative isolate flex h-96 items-center justify-center overflow-hidden rounded-lg">
          <Image
            src={post.image}
            fill
            preload
            sizes="100vw"
            queryParams={{blur: 60, sat: -60}}
            className="-z-10 object-cover brightness-50"
            alt=""
          />
          <div className="px-6 text-center text-white">
            <p className="font-mono text-xs tracking-widest uppercase opacity-80">Now showing</p>
            <h3 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h3>
          </div>
        </section>
      </DemoSection>
    </DemoPage>
  )
}
