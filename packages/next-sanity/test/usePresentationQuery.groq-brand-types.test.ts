import type {UsePresentationQueryReturnsActive} from '@sanity/visual-editing/react'
import {defineQuery} from 'groq'
import {describe, expectTypeOf, test, vi} from 'vitest'

import type {ClientReturn} from '../src/client'
import {usePresentationQuery} from '../src/hooks'

// Matches the mocks `src/__tests__/exports.spec.ts` uses to import the same module graph
// in a Node test environment without a DOM.
vi.mock('react/jsx-dev-runtime', () => ({}))
vi.mock('react-dom', () => ({preconnect: vi.fn(), preloadModule: vi.fn()}))

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

// The hooks below are only referenced through `typeof`, never called. They are named `use...`
// so `react/rules-of-hooks` accepts the `usePresentationQuery` calls inside them.
function usePlainQuery(query: string) {
  return usePresentationQuery({query, params: {anything: 'goes', n: 1}})
}

describe('usePresentationQuery with a branded query', () => {
  test('infers the active result from the brand', () => {
    type Active = UsePresentationQueryReturnsActive<typeof postsBySearch>
    expectTypeOf<Active['data']>().toEqualTypeOf<PostsBySearchResult>()
  })

  test('the hook call narrows to the branded result when active', () => {
    function useSample() {
      const result = usePresentationQuery({query: postsBySearch, params})
      // The inactive branch types `perspective` as `null`; narrowing on it picks the active branch.
      if (result.perspective != null) {
        return result.data
      }
      return result.data
    }
    expectTypeOf<ReturnType<typeof useSample>>().toEqualTypeOf<PostsBySearchResult | null>()
  })

  test('accepts matching params, inline or as a promise', () => {
    function useSample() {
      usePresentationQuery({query: postsBySearch, params: {searchQuery: 'foo', start: 0, end: 10}})
      usePresentationQuery({query: postsBySearch, params: Promise.resolve(params)})
      // Leaving params out is accepted, as it is for `client.fetch`
      usePresentationQuery({query: postsBySearch})
      usePresentationQuery({query: allPosts, params: {}})
    }
    void useSample
  })

  test('rejects excess, missing and mistyped params', () => {
    function useSample() {
      usePresentationQuery({
        query: postsBySearch,
        // @ts-expect-error `extra` is not a param of the query
        params: {searchQuery: 'foo', start: 0, end: 10, extra: true},
      })
      usePresentationQuery({
        query: postsBySearch,
        // @ts-expect-error `start` and `end` are missing
        params: {searchQuery: 'foo'},
      })
      usePresentationQuery({
        query: postsBySearch,
        // @ts-expect-error `start` must be a number
        params: {searchQuery: 'foo', start: '0', end: 10},
      })
      // @ts-expect-error the query takes no params
      usePresentationQuery({query: allPosts, params: {slug: 'foo'}})
    }
    void useSample
  })
})

describe('usePresentationQuery without a brand keeps its existing behavior', () => {
  test('a plain string falls back to ClientReturn and accepts any params', () => {
    type Data = ReturnType<typeof usePlainQuery>['data']
    // `ClientReturn<string>` is `any`, which already absorbs the inactive branch's `null`.
    expectTypeOf<Data>().toEqualTypeOf<ClientReturn<string>>()
  })

  test('a defineQuery query registered in SanityQueries resolves through TypeGen', () => {
    function useSample() {
      return usePresentationQuery({query: registeredQuery, params: {anything: 'goes'}})
    }
    type Data = ReturnType<typeof useSample>['data']
    expectTypeOf<Data>().toEqualTypeOf<{name: string} | null>()
  })

  test('an explicit query type argument resolves as before', () => {
    function useSample() {
      return usePresentationQuery<'*[_type == "author"][0]{name}'>({query: registeredQuery})
    }
    type Data = ReturnType<typeof useSample>['data']
    expectTypeOf<Data>().toEqualTypeOf<{name: string} | null>()
  })
})
