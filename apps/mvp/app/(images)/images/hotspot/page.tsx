import type {Metadata} from 'next'

import {DemoPage, DemoSection, Figure} from '../components'
import {getHeroPost} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Hotspot & crop'}

const aspects = [
  {label: 'Banner', width: 800, height: 280},
  {label: 'Square', width: 420, height: 420},
  {label: 'Tall', width: 320, height: 480},
] as const

export default async function HotspotPage() {
  const post = await getHeroPost()
  if (!post?.image?.asset) return null
  const {image} = post
  const alt = image.alt?.trim() || `Poster for ${post.title}`

  return (
    <DemoPage
      title="Hotspot & crop"
      lede={
        <>
          Editors mark the important part of an image once, in the Studio. Pass the image object —{' '}
          <code>{'mainImage{asset, crop, hotspot}'}</code> — and every rendition keeps that part in
          frame: when the requested aspect ratio differs, the crop region is positioned around the
          hotspot instead of blindly taking the center.
        </>
      }
    >
      <DemoSection
        title="One asset, three aspect ratios"
        description={
          <>
            The hotspot on this poster sits on the astronaut. Top row: hotspot and crop applied.
            Bottom row: the same asset with the Studio metadata stripped, cropping to the center.
          </>
        }
        code={`<Image src={post.image} width={800} height={280} alt="…" />          // hotspot aware
<Image src={{asset: post.image.asset}} width={800} height={280} alt="…" /> // centered`}
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="font-mono text-xs font-semibold text-emerald-600">
              with hotspot &amp; crop
            </p>
            <div className="flex flex-wrap items-start gap-4">
              {aspects.map((aspect) => (
                <Figure
                  key={aspect.label}
                  caption={`${aspect.label} · ${aspect.width}×${aspect.height}`}
                >
                  <Image
                    src={image}
                    width={aspect.width}
                    height={aspect.height}
                    sizes="(min-width: 896px) 50vw, 100vw"
                    className="h-auto max-w-full rounded-lg"
                    alt={alt}
                  />
                </Figure>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-xs font-semibold text-rose-600">without (centered crop)</p>
            <div className="flex flex-wrap items-start gap-4">
              {aspects.map((aspect) => (
                <Figure
                  key={aspect.label}
                  caption={`${aspect.label} · ${aspect.width}×${aspect.height}`}
                >
                  <Image
                    src={{asset: image.asset}}
                    width={aspect.width}
                    height={aspect.height}
                    sizes="(min-width: 896px) 50vw, 100vw"
                    className="h-auto max-w-full rounded-lg"
                    alt={alt}
                  />
                </Figure>
              ))}
            </div>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="No dimensions? No problem"
        description={
          <>
            Without <code>width</code>/<code>height</code> the Studio crop still applies, and the
            display dimensions are inferred from the cropped region — so the image renders at the
            aspect ratio editors chose.
          </>
        }
        code={`<Image src={post.image} alt="…" />`}
      >
        <Image
          src={image}
          sizes="(min-width: 896px) 832px, 100vw"
          className="h-auto w-full rounded-lg"
          alt={alt}
        />
      </DemoSection>
    </DemoPage>
  )
}
