import type {Metadata} from 'next'

import {DemoPage, DemoSection, Figure} from '../components'
import {getHeroPost} from '../data'
import {Image} from '../Image'

export const metadata: Metadata = {title: 'Transformations'}

const variants = [
  {label: 'original', queryParams: undefined},
  {label: '{blur: 60}', queryParams: {blur: 60}},
  {label: '{sat: -100}', queryParams: {sat: -100}},
  {label: "{invert: 'true'}", queryParams: {invert: 'true'}},
  {label: "{flip: 'h'}", queryParams: {flip: 'h'}},
  {label: '{sharpen: 100}', queryParams: {sharpen: 100}},
] as const

export default async function TransformationsPage() {
  const post = await getHeroPost()
  if (!post?.image) return null
  const image = post.image
  const alt = image.alt?.trim() || `Poster for ${post.title}`

  return (
    <DemoPage
      title="Transformations"
      lede={
        <>
          The <code>queryParams</code> prop merges extra{' '}
          <a href="https://www.sanity.io/docs/image-urls" className="underline">
            Sanity Image CDN params
          </a>{' '}
          into every srcset candidate — visual effects without any image processing in your app.
          Sizing stays managed by the component: <code>w</code>, <code>h</code>, <code>fit</code>{' '}
          and <code>auto=format</code> are still set by the loader.
        </>
      }
    >
      <DemoSection
        title="One asset, six renditions"
        code={`<Image src={post.image} width={420} height={420} queryParams={{blur: 60}} alt="…" />`}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {variants.map((variant) => (
            <Figure key={variant.label} caption={<code>{variant.label}</code>}>
              <Image
                src={image}
                width={420}
                height={420}
                sizes="(min-width: 896px) 33vw, 50vw"
                queryParams={variant.queryParams}
                className="h-auto w-full rounded-lg"
                alt={`${alt} (${variant.label})`}
              />
            </Figure>
          ))}
        </div>
      </DemoSection>
    </DemoPage>
  )
}
