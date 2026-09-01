import type {Metadata} from 'next'
import Link from 'next/link'

import {DemoPage, DemoSection, Figure} from '../components'
import {getHeroPost} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Fill'}

export default async function FillPage() {
  const post = await getHeroPost()
  if (!post?.image) return null
  const alt = post.image.alt?.trim() || `Poster for ${post.title}`

  return (
    <DemoPage
      title="Fill"
      lede={
        <>
          <code>fill</code> makes the image stretch to its parent element — the parent just needs{' '}
          <code>position: relative</code> and a size. How the image fits the box is regular CSS:{' '}
          <code>object-fit</code> and <code>object-position</code>.
        </>
      }
    >
      <DemoSection
        title="object-fit"
        code={`<div className="relative h-64">
  <Image src={post.image} fill sizes="33vw" className="object-cover" alt="…" />
</div>`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Figure caption="object-cover">
            <div className="relative h-64 overflow-hidden rounded-lg">
              <Image src={post.image} fill sizes="33vw" className="object-cover" alt={alt} />
            </div>
          </Figure>
          <Figure caption="object-contain">
            <div className="relative h-64 overflow-hidden rounded-lg bg-zinc-100">
              <Image src={post.image} fill sizes="33vw" className="object-contain" alt={alt} />
            </div>
          </Figure>
          <Figure caption="object-cover + object-top">
            <div className="relative h-64 overflow-hidden rounded-lg">
              <Image
                src={post.image}
                fill
                sizes="33vw"
                className="object-cover object-top"
                alt={alt}
              />
            </div>
          </Figure>
        </div>
      </DemoSection>

      <DemoSection
        title="How it works"
        description={
          <>
            With <code>fill</code> there are no <code>width</code>/<code>height</code> attributes:
            the srcset covers every configured device size, the Studio crop still applies via the{' '}
            <code>rect</code> param, and <code>sizes</code> keeps the downloads honest. Prefer the{' '}
            <Link href="/images/hotspot" className="underline">
              hotspot demo
            </Link>{' '}
            when the box has a known aspect ratio — the CDN can crop towards the hotspot instead of
            the browser cropping blindly.
          </>
        }
        code={`<img
  data-nimg="fill"
  style="position:absolute;height:100%;width:100%;…"
  sizes="33vw"
  srcset="….jpg?rect=…&auto=format&fit=max&w=640 640w, … 3840w"
/>`}
      >
        <p className="font-mono text-xs text-zinc-500">
          Inspect any image on this page to see the markup next/image renders for fill mode.
        </p>
      </DemoSection>
    </DemoPage>
  )
}
