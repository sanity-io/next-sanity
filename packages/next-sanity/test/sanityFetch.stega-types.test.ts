import {describe, expectTypeOf, test} from 'vitest'

import type {DefinedFetchType, StrictDefinedFetchType} from '#live/types'

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
declare const strictFetch: StrictDefinedFetchType

describe('DefinedFetchType stega branding', () => {
  test('stega: true returns branded data', () => {
    async function sample() {
      return sanityFetch({query, stega: true})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString<string>>()
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
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString<string>>()
    expectTypeOf<Data['imageLocation']>().not.toEqualTypeOf<'left' | 'right'>()
  })

  test('omitted stega returns branded data', () => {
    async function sample() {
      return sanityFetch({query})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString<string>>()
  })
})

describe('StrictDefinedFetchType stega branding', () => {
  test('stega: true returns branded data', () => {
    async function sample() {
      return strictFetch({query, perspective: 'published', stega: true})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['imageLocation']>().not.toEqualTypeOf<'left' | 'right'>()
  })

  test('stega: false returns clean ClientReturn', () => {
    async function sample() {
      return strictFetch({query, perspective: 'published', stega: false})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<CleanData>()
    expectTypeOf<Data['imageLocation']>().toEqualTypeOf<'left' | 'right'>()
  })

  test('stega: boolean returns branded data', () => {
    async function sample() {
      const stega = false as boolean
      return strictFetch({query, perspective: 'drafts', stega})
    }
    type Data = Awaited<ReturnType<typeof sample>>['data']
    expectTypeOf<Data>().toEqualTypeOf<BrandedData>()
    expectTypeOf<Data['title']>().toEqualTypeOf<StegaString<string>>()
  })

  test('requires stega', () => {
    async function sample() {
      // @ts-expect-error stega is required in strict mode
      return strictFetch({query, perspective: 'published'})
    }
    void sample
  })
})
