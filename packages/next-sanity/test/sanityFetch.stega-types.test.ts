import {describe, expectTypeOf, test} from 'vitest'

import type {
  DefinedFetchMetadataType,
  DefinedFetchType,
  DefineLiveOptions,
  LivePerspective,
} from '#live/types'

import type {ClientReturn, StegaBranded, StegaString} from '../src/client'

declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type=="post"][0]{title,imageLocation}': {
      _type: 'post'
      title: string
      imageLocation: 'left' | 'right'
    }
  }
}

const query = '*[_type=="post"][0]{title,imageLocation}' as const

type CleanData = ClientReturn<typeof query, unknown>
type BrandedData = StegaBranded<CleanData>

// Type-only bindings — erased at runtime; nested samples below are never called.
declare const sanityFetch: DefinedFetchType
declare const sanityFetchMetadata: DefinedFetchMetadataType

describe('DefinedFetchType stega branding', () => {
  test('stega: true returns branded data', () => {
    async function sample() {
      return sanityFetch({query, stega: true})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString>()
    expectTypeOf<Data['_type']>().toEqualTypeOf<'post'>()
    expectTypeOf<Data['imageLocation']>().not.toEqualTypeOf<'left' | 'right'>()
  })

  test('stega: false returns clean ClientReturn', () => {
    async function sample() {
      return sanityFetch({query, stega: false})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<CleanData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<string>()
    expectTypeOf<Data['imageLocation']>().toEqualTypeOf<'left' | 'right'>()
  })

  test('stega: boolean returns branded data', () => {
    async function sample() {
      const stega = true as boolean
      return sanityFetch({query, stega})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString>()
    expectTypeOf<Data['imageLocation']>().not.toEqualTypeOf<'left' | 'right'>()
  })

  test('omitted stega returns branded data', () => {
    async function sample() {
      return sanityFetch({query})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString>()
  })
})

describe('DefineLiveOptions', () => {
  test('perspective is optional on every sanityFetch call', () => {
    expectTypeOf<Parameters<DefinedFetchType>[0]['perspective']>().toEqualTypeOf<
      LivePerspective | undefined
    >()
  })

  test('has no strict option', () => {
    expectTypeOf<DefineLiveOptions>().not.toHaveProperty('strict')
  })
})

describe('DefinedFetchMetadataType', () => {
  test('returns clean ClientReturn and rejects stega', () => {
    async function sample() {
      return sanityFetchMetadata({query})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<CleanData>()
    expectTypeOf<Data['imageLocation']>().toEqualTypeOf<'left' | 'right'>()

    async function rejected() {
      // @ts-expect-error stega is always false for metadata
      return sanityFetchMetadata({query, stega: true})
    }
    void rejected
  })

  test('perspective is optional', () => {
    expectTypeOf<Parameters<DefinedFetchMetadataType>[0]['perspective']>().toEqualTypeOf<
      LivePerspective | undefined
    >()
  })
})
