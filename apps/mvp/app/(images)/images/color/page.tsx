import type {Metadata} from 'next'

import {DemoPage, DemoSection, Figure} from '../components'
import {getAssetsWithMetadata} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Color'}

const colorDataUrl = (color: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/></svg>`,
  ).toString('base64')}` as const

export default async function ColorPage() {
  const assets = await getAssetsWithMetadata()

  return (
    <DemoPage
      title="Color"
      lede={
        <>
          Sanity extracts a color palette from every asset at upload time. Query{' '}
          <code>asset-&gt;metadata.palette.dominant.background</code> and use it as a solid-color
          placeholder — a CMS-powered take on the gallery&apos;s color demo. Throttle the network in
          dev tools to see it.
        </>
      }
    >
      <DemoSection
        title="Dominant color from the palette"
        code={`const {palette} = asset.metadata

<Image
  src={{asset}}
  width={420}
  placeholder={colorDataUrl(palette.dominant.background)}
  alt="…"
/>`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {assets.map((asset) => (
            <Figure
              key={asset._id}
              caption={
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full border border-zinc-300"
                    style={{backgroundColor: asset.paletteBackground ?? undefined}}
                  />
                  {asset.paletteBackground}
                </span>
              }
            >
              <Image
                src={{asset: {_id: asset._id}}}
                width={420}
                placeholder={
                  asset.paletteBackground ? colorDataUrl(asset.paletteBackground) : 'empty'
                }
                className="h-auto w-full rounded-lg"
                alt="Asset colored by its dominant palette color while loading"
              />
            </Figure>
          ))}
        </div>
      </DemoSection>
    </DemoPage>
  )
}
