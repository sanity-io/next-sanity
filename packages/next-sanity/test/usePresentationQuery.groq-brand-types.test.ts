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

const registeredQuery = defineQuery('*[_type == "author"][0]{name}')
declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "author"][0]{name}': {name: string} | null
  }
}

function usePlainQuery(query: string) {
  return usePresentationQuery({query})
}

describe('usePresentationQuery with a branded query', () => {
  test('infers the active result from the brand', () => {
    type Active = UsePresentationQueryReturnsActive<typeof postsBySearch>
    expectTypeOf<Active['data']>().toEqualTypeOf<PostsBySearchResult>()
  })

  test('the hook call itself narrows to the branded result when active', () => {
    // Named `use...` and never called: it is only used through `typeof` below, so it is
    // type-checked as a custom hook without actually running React hook rules at runtime.
    function useSample() {
      const result = usePresentationQuery({query: postsBySearch})
      // The inactive branch types `perspective` as `null`; narrowing on it picks the active branch.
      if (result.perspective != null) {
        return result.data
      }
      return result.data
    }
    expectTypeOf<ReturnType<typeof useSample>>().toEqualTypeOf<PostsBySearchResult | null>()
  })

  test('params still accept any QueryParams, unbranded by the query', () => {
    function useSample() {
      // `usePresentationQuery`'s own params type isn't sourced from the query brand, so
      // params checking is unaffected by this feature: only `data` is branded.
      return usePresentationQuery({query: postsBySearch, params: {anything: 'goes'}})
    }
    void useSample
  })
})

describe('usePresentationQuery without a brand keeps its existing behavior', () => {
  test('a plain string resolves the same as ClientReturn with no brand', () => {
    type Data = ReturnType<typeof usePlainQuery>['data']
    // `ClientReturn<string>` falls back to `any` here, which already absorbs the inactive
    // branch's `null`, matching `usePresentationQuery`'s pre-existing (unbranded) behavior.
    expectTypeOf<Data>().toEqualTypeOf<ClientReturn<string>>()
  })

  test('a defineQuery query registered in SanityQueries resolves through TypeGen, as before', () => {
    function useSample() {
      return usePresentationQuery({query: registeredQuery})
    }
    type Data = ReturnType<typeof useSample>['data']
    expectTypeOf<Data>().toEqualTypeOf<ClientReturn<typeof registeredQuery> | null>()
  })
})
