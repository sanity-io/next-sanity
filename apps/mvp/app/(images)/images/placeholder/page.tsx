import type {Metadata} from 'next'

import {CodeBlock, DemoPage, DemoSection, Figure} from '../components'
import {getAssetsWithMetadata} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Placeholder'}

export default async function PlaceholderPage() {
  const assets = await getAssetsWithMetadata()

  return (
    <DemoPage
      title="Placeholder"
      lede={
        <>
          Sanity computes a base64 low-quality image preview (LQIP) for every asset at upload time.
          Query it — <code>asset-&gt;metadata.lqip</code> — and{' '}
          <code>placeholder=&quot;blur&quot;</code> uses it automatically, no{' '}
          <code>blurDataURL</code> wiring or build-time generation needed. Throttle the network in
          dev tools (and disable cache) to watch the blur-up.
        </>
      }
    >
      <DemoSection
        title="Blur-up from LQIP metadata"
        code={`const asset = await client.fetch(\`*[_id == $id][0]{_id, metadata{lqip}}\`, {id})

<Image src={{asset}} width={420} placeholder="blur" alt="…" />`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {assets.map((asset) => (
            <Figure key={asset._id} caption={`${asset.width}×${asset.height}`}>
              <Image
                src={{asset: {_id: asset._id, metadata: {lqip: asset.lqip}}}}
                width={420}
                placeholder="blur"
                className="h-auto w-full rounded-lg"
                alt="Asset with a low-quality image preview from the demo dataset"
              />
            </Figure>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="The preview itself"
        description={
          <>
            The LQIP is a ~20px thumbnail inlined as a data URL, upscaled and blurred by next/image
            while the real image loads:
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          {assets.map((asset) =>
            asset.lqip ? (
              // data: URLs pass through untouched and render unoptimized
              <Image
                key={asset._id}
                src={asset.lqip}
                width={80}
                height={80}
                className="rounded object-cover"
                alt=""
              />
            ) : null,
          )}
        </div>
        <CodeBlock code={assets[0]?.lqip ? `${assets[0].lqip.slice(0, 96)}…` : ''} />
      </DemoSection>
    </DemoPage>
  )
}
