import {defineQuery} from 'groq'
import {describe, expectTypeOf, test} from 'vitest'

import type {DefinedFetchType, StrictDefinedFetchType} from '#live/types'

import {
  createClient,
  type ClientReturn,
  type QueryParams,
  type StegaBranded,
  type StegaString,
} from '../src/client'

// The brand `@sanity-labs/groq-content-mapper` puts on the default export of an imported `.groq`
// file. Declared here rather than imported: `@sanity/client` reads the brand structurally, so
// next-sanity must not depend on the package that produces it either.
type GroqQuery<Query extends string, Result, Params> = Query & {
  readonly __groqParams?: Params
  readonly __groqResult?: Result
}

type PostsBySearchResult = Array<{_id: string; title: string}>
type PostsBySearchParams = {searchQuery: string; start: number; end: number}

declare const postsBySearch: GroqQuery<
  '*[_type == "post" && title match $searchQuery][$start...$end]{_id, title}',
  PostsBySearchResult,
  PostsBySearchParams
>
declare const allPosts: GroqQuery<
  '*[_type == "post"]{_id, title}',
  PostsBySearchResult,
  Record<string, never>
>

const registeredQuery = defineQuery('*[_type == "author"][0]{name}')
declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "author"][0]{name}': {name: string} | null
  }
}

const params: PostsBySearchParams = {searchQuery: 'foo', start: 0, end: 10}

// Type-only bindings — erased at runtime; nested samples below are never called.
declare const sanityFetch: DefinedFetchType
declare const strictFetch: StrictDefinedFetchType

describe('DefinedFetchType with a branded query', () => {
  test('infers the result from the brand', () => {
    async function clean() {
      return sanityFetch({query: postsBySearch, params, stega: false})
    }
    async function branded() {
      return sanityFetch({query: postsBySearch, params})
    }
    expectTypeOf<Awaited<ReturnType<typeof clean>>['data']>().toEqualTypeOf<PostsBySearchResult>()
    type Data = Awaited<ReturnType<typeof branded>>['data']
    expectTypeOf<Data>().toEqualTypeOf<StegaBranded<PostsBySearchResult>>()
    expectTypeOf<Data[number]['title']>().toEqualTypeOf<StegaString>()
  })

  test('accepts matching params, inline or as a promise', () => {
    async function sample() {
      await sanityFetch({query: postsBySearch, params: {searchQuery: 'foo', start: 0, end: 10}})
      await sanityFetch({query: postsBySearch, params: Promise.resolve(params)})
      // Leaving params out is accepted, as it is for `client.fetch`
      await sanityFetch({query: postsBySearch})
      await sanityFetch({query: allPosts, params: {}})
    }
    void sample
  })

  test('rejects excess, missing and mistyped params', () => {
    async function sample() {
      await sanityFetch({
        query: postsBySearch,
        // @ts-expect-error `extra` is not a param of the query
        params: {searchQuery: 'foo', start: 0, end: 10, extra: true},
      })
      await sanityFetch({
        query: postsBySearch,
        // @ts-expect-error `start` and `end` are missing
        params: {searchQuery: 'foo'},
      })
      await sanityFetch({
        query: postsBySearch,
        // @ts-expect-error `start` must be a number
        params: {searchQuery: 'foo', start: '0', end: 10},
      })
      await sanityFetch({
        query: postsBySearch,
        // @ts-expect-error the awaited params must match too
        params: Promise.resolve({searchQuery: 'foo'}),
      })
      // @ts-expect-error the query takes no params
      await sanityFetch({query: allPosts, params: {slug: 'foo'}})
    }
    void sample
  })
})

describe('StrictDefinedFetchType with a branded query', () => {
  test('infers the result and checks params', () => {
    async function sample() {
      return strictFetch({query: postsBySearch, params, perspective: 'published', stega: false})
    }
    expectTypeOf<Awaited<ReturnType<typeof sample>>['data']>().toEqualTypeOf<PostsBySearchResult>()

    async function invalid() {
      return strictFetch({
        query: postsBySearch,
        // @ts-expect-error `end` is missing
        params: {searchQuery: 'foo', start: 0},
        perspective: 'published',
        stega: false,
      })
    }
    void invalid
  })
})

describe('queries without a brand keep their existing types', () => {
  test('a plain string resolves to unknown and accepts any params', () => {
    async function sample(query: string) {
      return sanityFetch({query, params: {anything: 'goes', n: 1}, stega: false})
    }
    expectTypeOf<Awaited<ReturnType<typeof sample>>['data']>().toEqualTypeOf<unknown>()
  })

  test('a defineQuery query registered in SanityQueries resolves through TypeGen', () => {
    async function sample() {
      return sanityFetch({query: registeredQuery, params: {anything: 'goes'}, stega: false})
    }
    expectTypeOf<Awaited<ReturnType<typeof sample>>['data']>().toEqualTypeOf<{
      name: string
    } | null>()
    expectTypeOf<Awaited<ReturnType<typeof sample>>['data']>().toEqualTypeOf<
      ClientReturn<typeof registeredQuery, unknown>
    >()
  })

  test('wrappers generic over the query string still compile', () => {
    async function load<const Q extends string>(query: Q, params: QueryParams) {
      return sanityFetch({query, params, stega: false})
    }
    async function loadAsync<const Q extends string>(query: Q, params: Promise<QueryParams>) {
      return strictFetch({query, params, perspective: 'published', stega: false})
    }
    void load
    void loadAsync
  })
})

describe('client.fetch re-exported from next-sanity', () => {
  test('infers result and params from the brand', () => {
    const client = createClient({projectId: 'abc123', dataset: 'production', useCdn: true})
    async function sample() {
      return client.fetch(postsBySearch, params)
    }
    expectTypeOf<Awaited<ReturnType<typeof sample>>>().toEqualTypeOf<PostsBySearchResult>()

    async function invalid() {
      // @ts-expect-error `end` is missing
      return client.fetch(postsBySearch, {searchQuery: 'foo', start: 0})
    }
    void invalid
  })
})
