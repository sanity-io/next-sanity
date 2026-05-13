import {createClient} from 'next-sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {apiVersion, dataset, getSanityFetchMock, projectId} from './helpers'

let isDraftMode = false
vi.mock(import('next/headers'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    draftMode: vi.fn(async () => ({
      isEnabled: isDraftMode,
      enable: vi.fn(() => {
        isDraftMode = true
      }),
      disable: vi.fn(() => {
        isDraftMode = false
      }),
    })),
  }
})
afterEach(() => {
  isDraftMode = false
})

vi.mock('next/cache')

describe.each([{cacheComponents: true, b: 1}, {cacheComponents: false}])(
  'sanityFetch when %o',
  {concurrent: true},
  async ({cacheComponents}) => {
    const {defineLive} = cacheComponents
      ? await import('../src/live/conditions/next-js')
      : await import('../src/live/conditions/react-server')

    test.each([
      [{useCdn: true, perspective: undefined}, true],
      [{useCdn: false, perspective: undefined}, true],
      [{useCdn: true, perspective: 'raw' as const}, true],
      [{useCdn: false, perspective: 'raw' as const}, true],
      [{useCdn: true, perspective: 'published' as const}, false],
      [{useCdn: false, perspective: 'published' as const}, true],
      [{useCdn: false, perspective: ['published']}, true],
      // TODO: the @sanity/client should handle using apicdn if the perspective is ["published"] just as it does if it's "published", but it doesn't yet
      // [{useCdn: true, perspective: ['published']}, false],
      [{useCdn: false, perspective: ['published', 'r5RGhbQN9']}, true],
      [{useCdn: false, perspective: ['r5RGhbQN9', 'drafts']}, true],
    ])(
      'sets perspective: "published" when client config is %j',
      async (overrides, shouldNotEqual) => {
        const client = createClient({projectId, dataset, apiVersion, ...overrides})
        const {sanityFetch} = defineLive({client, browserToken: false, serverToken: false})
        const {query, params} = getSanityFetchMock(
          '{"perspective": $perspective, "useCdn": $useCdn}',
          {
            perspective: 'published',
            useCdn: true,
          },
        )

        // First prove that the mock server throws if it's expected to, or resolves
        if (shouldNotEqual) {
          await expect(client.fetch(query, params)).resolves.not.toEqual(params)
        } else {
          await expect(client.fetch(query, params)).resolves.toEqual(params)
        }

        // Then prove that the sanityFetch wrapper works correctly
        const {data, sourceMap, tags} = await sanityFetch({query, params})
        expect(tags.length).toBe(1)
        expect(sourceMap).toBeNull()
        expect(data).toEqual(params)
      },
    )

    describe('handles client config edge cases', () => {
      test.each([{resultSourceMap: true}, {resultSourceMap: 'withKeyArraySelector' as const}])(
        'handles %o',
        async ({resultSourceMap}) => {
          const client = createClient({
            projectId,
            dataset,
            apiVersion,
            useCdn: true,
            perspective: 'published',
            // There are valid userland cases where content source maps are fetched in production,
            // which requires a token in the config which is not related to the `serverToken` setting
            token: 'sk123',
            resultSourceMap,
          })
          const {sanityFetch} = defineLive({client, browserToken: false, serverToken: false})
          const {query, params} = getSanityFetchMock('{"resultSourceMap": $resultSourceMap}', {
            resultSourceMap,
          })

          // When using client.fetch directly it respects the `resultSourceMap` setting
          await expect(client.fetch(query, params, {resultSourceMap})).resolves.toEqual(params)

          // Then prove that the sanityFetch wrapper works correctly
          const {data} = await sanityFetch({query, params})
          expect(data).toEqual(params)
        },
      )
    })
  },
)
