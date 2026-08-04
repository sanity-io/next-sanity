import type {ComponentProps} from 'react'
import {describe, expectTypeOf, test} from 'vitest'

import type {DefinedFetchType} from '#live/types'

import type {
  InferComponents,
  InferStrictComponents,
  InferValue,
  SanityQueries,
  StegaBranded,
  StegaCleaned,
  StegaString,
} from 'next-sanity'
import {PortableText, stegaClean} from 'next-sanity'

/**
 * Mirrors the phantom marker `sanity typegen` puts on dereferenced references.
 * It only exists in the type system, never in the JSON returned by Content Lake.
 */
declare const internalGroqTypeReferenceTo: unique symbol

type SanityImageAssetReference = {
  _ref: string
  _type: 'reference'
  _weak?: boolean
  [internalGroqTypeReferenceTo]?: 'sanity.imageAsset'
}

/**
 * Shapes below mirror what `sanity typegen` generates for the
 * portable text fields in the `template-nextjs-personal-website` template.
 */
type TimelineItem = {
  title?: string
  milestones?: Array<{
    _key: string
    _type: 'milestone'
    title?: string
    description?: string
    image?: {
      asset?: SanityImageAssetReference
      media?: unknown
      _type: 'image'
    }
    tags?: Array<string>
  }>
  _type: 'item'
  _key: string
}

type PageBodyBlock = {
  children?: Array<{
    marks?: Array<string>
    text?: string
    _type: 'span'
    _key: string
  }>
  style?: 'normal'
  listItem?: 'bullet' | 'number'
  markDefs?: Array<{
    href?: string
    _type: 'link'
    _key: string
  }>
  level?: number
  _type: 'block'
  _key: string
}

type PageQueryResult = {
  _id: string
  _type: 'page'
  body: Array<
    | {_key: string; _type: 'timeline'; items?: Array<TimelineItem>}
    | PageBodyBlock
    | {
        asset?: SanityImageAssetReference
        media?: unknown
        caption?: string
        alt?: string
        _type: 'image'
        _key: string
      }
    | {
        _key: string
        _type: 'callout'
        tone?: 'positive' | 'critical'
        heading?: string
      }
  > | null
  title: string | null
} | null

declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "page" && slug.current == $slug][0]{_id,_type,body,title}': PageQueryResult
  }
}

const pageQuery = '*[_type == "page" && slug.current == $slug][0]{_id,_type,body,title}' as const

// Type-only bindings — erased at runtime; nested samples below are never called.
declare const sanityFetch: DefinedFetchType

type PortableTextValue = InferValue<SanityQueries[keyof SanityQueries]>

/**
 * Mirrors `<CustomPortableText>` in `template-nextjs-personal-website`:
 * a re-usable wrapper typed against every registered query.
 */
const components = {
  block: {
    normal: ({children}) => <p>{children}</p>,
  },
  marks: {
    link: ({children, value}) => {
      // `markDefs` on blocks are never stega encoded, `href` stays a plain string
      if (!value?.href) return children
      expectTypeOf(value.href).toEqualTypeOf<string>()
      return <a href={value.href}>{children}</a>
    },
  },
  types: {
    image: ({value}) => {
      // branded strings stay assignable to `string`, rendering keeps working
      return <figure data-caption={value.caption}>{value.alt}</figure>
    },
    timeline: ({value}) => {
      return <div>{value.items?.map((item) => <div key={item._key}>{item.title}</div>)}</div>
    },
    callout: ({value}) => {
      // literal unions that may be stega encoded must be cleaned before comparing
      const tone = stegaClean(value.tone)
      expectTypeOf(tone).toEqualTypeOf<'positive' | 'critical' | undefined>()
      return <aside data-critical={tone === 'critical'}>{value.heading}</aside>
    },
  },
} satisfies InferStrictComponents<PortableTextValue>

function CustomPortableText({value}: {value: PortableTextValue}) {
  return <PortableText components={components} value={value} />
}

describe('stega-aware InferValue', () => {
  test('accepts stega branded sanityFetch data without stegaClean', () => {
    async function Sample() {
      const {data} = await sanityFetch({query: pageQuery, stega: true})
      return Array.isArray(data?.body) && <CustomPortableText value={data.body} />
    }
    void Sample
  })

  test('accepts clean sanityFetch data when stega is disabled', () => {
    async function Sample() {
      const {data} = await sanityFetch({query: pageQuery, stega: false})
      return Array.isArray(data?.body) && <CustomPortableText value={data.body} />
    }
    void Sample
  })

  test('accepts data when stega is a non-literal boolean', () => {
    async function Sample(stega: boolean) {
      const {data} = await sanityFetch({query: pageQuery, stega})
      return Array.isArray(data?.body) && <CustomPortableText value={data.body} />
    }
    void Sample
  })

  test('both clean and branded portable text items are covered', () => {
    type CleanBody = Exclude<NonNullable<PageQueryResult>['body'], null>
    type BrandedBody = Exclude<NonNullable<StegaBranded<PageQueryResult>>['body'], null>

    expectTypeOf<CleanBody>().toExtend<PortableTextValue>()
    expectTypeOf<BrandedBody>().toExtend<PortableTextValue>()
    expectTypeOf<CleanBody[number]>().toExtend<PortableTextValue[number]>()
    expectTypeOf<BrandedBody[number]>().toExtend<PortableTextValue[number]>()

    // but not arbitrary values
    expectTypeOf<string[]>().not.toExtend<PortableTextValue>()
    expectTypeOf<Array<{_type: 'callout'}>>().not.toExtend<PortableTextValue>()
  })
})

describe('stega-aware InferStrictComponents', () => {
  type StrictComponents = InferStrictComponents<PortableTextValue>

  test('handler values keep the stega brand until cleaned', () => {
    type CalloutProps = ComponentProps<NonNullable<StrictComponents['types']['callout']>>
    type Tone = CalloutProps['value']['tone']

    // the branded variant is part of the union, so the value is not safe to
    // compare against literals until it's been cleaned with `stegaClean`
    expectTypeOf<Tone>().not.toEqualTypeOf<'positive' | 'critical' | undefined>()
    expectTypeOf<StegaString<'positive'>>().toExtend<Tone>()
    expectTypeOf<StegaCleaned<Tone>>().toEqualTypeOf<'positive' | 'critical' | undefined>()
  })

  test('still requires handlers for custom types', () => {
    // @ts-expect-error -- image, timeline and callout handlers are required
    const incomplete = {types: {}} satisfies StrictComponents
    void incomplete
  })

  test('still rejects handlers for unknown types', () => {
    const excess = {
      types: {
        image: () => null,
        timeline: () => null,
        callout: () => null,
        // @ts-expect-error -- "unknown" is not a type that appears in the value
        unknown: () => null,
      },
    } satisfies StrictComponents
    void excess
  })
})

describe('stega-aware InferComponents', () => {
  async function fetchBrandedPage() {
    return sanityFetch({query: pageQuery, stega: true})
  }
  type BrandedPageData = Awaited<ReturnType<typeof fetchBrandedPage>>['data']

  // the forgiving variant allows omitting handlers, and infers directly from
  // the branded `data` returned by `sanityFetch`
  const forgivingComponents = {
    types: {
      image: ({value}) => <figure>{value.alt}</figure>,
    },
  } satisfies InferComponents<NonNullable<BrandedPageData>['body']>

  test('infers from branded sanityFetch data directly', () => {
    async function Sample() {
      const {data} = await sanityFetch({query: pageQuery, stega: true})
      return (
        Array.isArray(data?.body) && (
          <PortableText components={forgivingComponents} value={data.body} />
        )
      )
    }
    void Sample
  })
})

describe('PortableText', () => {
  test('renders stega branded values without stegaClean', () => {
    async function Sample() {
      const {data} = await sanityFetch({query: pageQuery, stega: true})
      return Array.isArray(data?.body) && <PortableText value={data.body} />
    }
    void Sample
  })
})
