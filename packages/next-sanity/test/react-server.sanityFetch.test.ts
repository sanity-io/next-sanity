import {createClient} from 'next-sanity'
import {describe, expect, test, vi} from 'vitest'

import {defineLive} from '../src/live/conditions/react-server'

const projectId = 'pv8y60vp'
const dataset = 'production'
const apiVersion = '2026-05-12'
// const stega = {studioUrl: '/studio'}

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

describe.concurrent('sanityFetch when cacheComponents is false', () => {
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
  ])('sets perspective: "published" when client config is %j', async (overrides, shouldThrow) => {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      ...overrides,
    })

    const {sanityFetch} = defineLive({client, browserToken: false, serverToken: false})
    const query = '{"perspective": $perspective, "useCdn": $useCdn}'
    const params = {['perspective' as string]: 'published', ['useCdn' as string]: true}

    // First prove that the mock server throws if it's expected to, or resolves
    if (shouldThrow) {
      await expect(client.fetch(query, params)).resolves.not.toEqual(params)
    } else {
      await expect(client.fetch(query, params)).resolves.toEqual(params)
    }

    // Then prove that the sanityFetch wrapper works correctly
    const {data, sourceMap, tags} = await sanityFetch({query, params})
    expect(tags.length).toBe(1)
    expect(sourceMap).toBeNull()
    expect(data).toEqual({perspective: 'published', useCdn: true})
  })

  describe('handles client config edge cases', () => {
    test.skip('resultSourceMap: "withKeyArraySelector"', () => {
      // const client = createClient({
      //   projectId,
      //   dataset,
      //   apiVersion,
      //   useCdn: true,
      //   // useCdn: true,
      //   // perspective: 'published',
      //   // resultSourceMap: 'withKeyArraySelector',
      //   // stega: {
      //   //   studioUrl: '/studio',
      //   // },
      // })
    })

    test.skip('resultSourceMap: "withKeyArraySelector", stega: {studioUrl}', () => {
      // const client = createClient({
      //   projectId,
      //   dataset,
      //   apiVersion,
      //   // useCdn: true,
      //   // perspective: 'published',
      //   // resultSourceMap: 'withKeyArraySelector',
      //   // stega: {
      //   //   studioUrl: '/studio',
      //   // },
      // })
    })

    test.skip('resultSourceMap: "withKeyArraySelector", stega: false', () => {
      // const client = createClient({
      //   projectId,
      //   dataset,
      //   apiVersion,
      //   // useCdn: true,
      //   // perspective: 'published',
      //   // resultSourceMap: 'withKeyArraySelector',
      //   // stega: {
      //   //   studioUrl: '/studio',
      //   // },
      // })
    })
  })
})
