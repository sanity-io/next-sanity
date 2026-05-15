import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {vercelStegaDecodeAll} from '@vercel/stega'
import {createClient} from 'next-sanity'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {afterEach, describe, expect, test, vi} from 'vitest'

import type {LivePerspective} from '#live/types'

import {apiVersion, dataset, getSanityFetchMock, projectId} from './helpers'

let isDraftMode = false
let isDraftModeCalled = false
let perspectiveCookieValue: LivePerspective | null = null
vi.mock(import('next/headers'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    cookies: vi.fn(
      async () =>
        // oxlint-disable-next-line no-unsafe-type-assertion
        ({
          has: vi.fn((key) => {
            if (key === perspectiveCookieName) {
              return perspectiveCookieValue !== null
            }
            return false
          }),
          get: vi.fn((key) => {
            if (key === perspectiveCookieName) {
              return {value: perspectiveCookieValue}
            }
            return null
          }),
        }) as unknown as ReturnType<(typeof originalModule)['cookies']>,
    ),
    draftMode: vi.fn(async () => {
      isDraftModeCalled = true
      return {
        isEnabled: isDraftMode,
        enable: vi.fn(() => {
          isDraftMode = true
        }),
        disable: vi.fn(() => {
          isDraftMode = false
        }),
      }
    }),
  }
})
afterEach(() => {
  isDraftMode = false
  isDraftModeCalled = false
  perspectiveCookieValue = null
})

vi.mock('next/cache')

describe.each([
  // {cacheComponents: true},
  {cacheComponents: false},
])('sanityFetch when %o', async ({cacheComponents}) => {
  const {defineLive} = cacheComponents
    ? await import('../src/live/conditions/next-js')
    : await import('../src/live/conditions/react-server')

  describe('sets perspective: "published"', () => {
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
    ])('when client config is %j', async (overrides, shouldNotEqual) => {
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
    })
  })

  describe('cacheMode', () => {
    afterEach(() => {
      delete process.env['NEXT_PHASE']
    })
    const client = createClient({projectId, dataset, apiVersion, useCdn: true})
    const {sanityFetch} = defineLive({client, serverToken: 'sk123'})
    test('is set to "noStale" in production', async () => {
      const {query, params} = getSanityFetchMock('{"cacheMode": $cacheMode}', {
        cacheMode: 'noStale',
      })

      // When using client.fetch directly it respects the `cacheMode` setting
      await expect(client.fetch(query, params, {cacheMode: 'noStale'})).resolves.toEqual(params)

      // Then prove that the sanityFetch wrapper works correctly
      const {data} = await sanityFetch({query, params})
      expect(data).toEqual(params)
    })
    test('is not set during "next build"', async () => {
      process.env['NEXT_PHASE'] = PHASE_PRODUCTION_BUILD

      // We don't set cacheMode=noStale during "next build", because the build phase might spawn a large amount of concurrent requests.
      // See https://nextjs.org/docs/app/api-reference/config/next-config-js/staticGeneration, the more routes returned by generateStaticParams, the more concurrent requests are spawned.
      // When cacheMode=noStale is set it treats STALE content the same way it treats MISS:
      // - you can do maximum 500 requests per second per IP before you see 429 HTTP errors: https://www.sanity.io/docs/content-lake/technical-limits#k407cb716dbcd
      // - you can do maximum 500 concurrent requests for each dataset: https://www.sanity.io/docs/content-lake/technical-limits#k93d86b1bb761
      // - when cacheMode=noStale is set, each STALE query is treated as a MISS, it might not happen frequently but when it does it could block a deployment.
      // Thus we work around it by checking if we are in the "next build" phase using an undocumented technique that the vercel team shared with us,
      // by not setting cacheMode=noStale when NEXT_PHASE=phase-production-build we benefit from STALE responses having unlimited concurrent requests and call rates.
      // The trade-off is that there is a small chance that `next build` could capture stale content, but if so a redeploy will fix it.
      const {query, params} = getSanityFetchMock('{"cacheMode": $cacheMode}', {
        cacheMode: undefined,
      })

      const {data} = await sanityFetch({query, params})
      expect(data).not.toEqual({cacheMode: 'noStale'})
    })

    // At the moment API does not complain if cacheMode=noStale is set, even though it's only understood by APICDN
    test.skip('is not set when perspective is "drafts"', async () => {
      const {query, params} = getSanityFetchMock('{"cacheMode": $cacheMode}', {
        cacheMode: undefined,
      })

      // When using client.fetch directly it respects the `cacheMode` setting
      await expect(client.fetch(query, params, {cacheMode: 'noStale'})).resolves.toEqual(params)

      // Then prove that the sanityFetch wrapper works correctly
      const {data} = await sanityFetch({query, params, perspective: 'drafts'})
      expect(data).not.toEqual({cacheMode: 'noStale'})
    })
  })

  describe('stega', () => {
    const token = 'sk123'
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      stega: {enabled: true, studioUrl: '/studio'},
      token,
    })
    const serverToken = 'sk456'
    const {sanityFetch} = defineLive({client, serverToken})
    const decodedStega = [
      {
        href: '/studio/intent/edit/mode=presentation;id=test;type=test;path=title?baseUrl=%2Fstudio&id=test&type=test&path=title&perspective=published',
        origin: 'sanity.io',
      },
    ]

    test('stega is disabled by default', async () => {
      const {query, params} = getSanityFetchMock('{"stega": $stega}', {stega: true})

      // When using client.fetch directly it returns stega, as we set it to true
      const reference = await client.fetch(query, params, {stega: true})
      expect(vercelStegaDecodeAll(JSON.stringify(reference))).toEqual(decodedStega)

      // Not setting `stega: true` on `sanityFetch` should not return stega
      const {data} = await sanityFetch({query, params})
      expect(vercelStegaDecodeAll(JSON.stringify(data))).not.toEqual(decodedStega)
    })
    test('stega can be enabled if client config has token', async () => {
      const {sanityFetch} = defineLive({client, serverToken: false})
      const {query, params} = getSanityFetchMock('{"stega": $stega}', {stega: true})

      // When using client.fetch directly it returns stega
      const reference = await client.fetch(query, params, {stega: true})
      expect(vercelStegaDecodeAll(JSON.stringify(reference))).toEqual(decodedStega)

      const {data} = await sanityFetch({query, params, stega: true})
      expect(vercelStegaDecodeAll(JSON.stringify(data))).toEqual(decodedStega)
    })
    test('stega can be enabled if serverToken is provided', async () => {
      const client = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: true,
        stega: {studioUrl: '/studio'},
      })
      const {sanityFetch} = defineLive({client, serverToken})
      const {query, params} = getSanityFetchMock('{"stega": $stega}', {stega: true})

      // When using client.fetch directly it returns stega
      const reference = await client.fetch(query, params, {stega: true, token: serverToken})
      expect(vercelStegaDecodeAll(JSON.stringify(reference))).toEqual(decodedStega)

      const {data} = await sanityFetch({query, params, stega: true})
      expect(vercelStegaDecodeAll(JSON.stringify(data))).toEqual(decodedStega)
    })
    test.runIf(!cacheComponents)('stega is enabled by default when in draft mode', async () => {
      const {query, params} = getSanityFetchMock('{"stega": $stega}', {stega: true})

      isDraftMode = true

      // Not setting `stega: true` on `sanityFetch` should still return stega as draft mode is enabled
      const {data} = await sanityFetch({query, params})
      expect(vercelStegaDecodeAll(JSON.stringify(data))).toEqual(decodedStega)
    })
    test.runIf(!cacheComponents)(
      'does not check draftMode if no stega.studioUrl is set',
      async () => {
        const client = createClient({
          projectId,
          dataset,
          apiVersion,
          useCdn: true,
        })
        const {sanityFetch} = defineLive({client, serverToken})
        const {query, params} = getSanityFetchMock('{"stega": $stega}', {stega: true})

        await sanityFetch({query, params, perspective: 'published'})
        expect(isDraftModeCalled).not.toBe(true)
      },
    )
    test.runIf(!cacheComponents)(
      'does not check draftMode if serverToken is not provided',
      async () => {
        const {sanityFetch} = defineLive({client, serverToken: false})
        const {query, params} = getSanityFetchMock('{"stega": $stega}', {stega: true})

        await sanityFetch({query, params, perspective: 'published'})
        expect(isDraftModeCalled).not.toBe(true)
      },
    )
  })

  describe('perspective', () => {
    const token = 'sk123'
    const serverToken = 'sk456'
    const client = createClient({projectId, dataset, apiVersion, useCdn: true, token})
    const {sanityFetch} = defineLive({client, serverToken})
    test('is set to "published" by default', async () => {
      const {query, params} = getSanityFetchMock('{"perspective": $perspective, "token": $token}', {
        perspective: 'published',
        token: `Bearer ${token}`,
      })

      // When using client.fetch directly it respects the `perspective` and `token` settings
      await expect(client.fetch(query, params, {perspective: 'published', token})).resolves.toEqual(
        params,
      )

      // Then prove that the sanityFetch wrapper works correctly
      const {data} = await sanityFetch({query, params})
      expect(data).toEqual(params)
    })
    test.runIf(!cacheComponents)(
      'is set to "drafts" by default when draft mode is enabled and no preview cookie exists',
      async () => {
        const {query, params} = getSanityFetchMock(
          '{"perspective": $perspective, "token": $token}',
          {perspective: 'drafts', token: `Bearer ${serverToken}`},
        )
        isDraftMode = true

        // When using client.fetch directly it respects the `perspective` and `token` settings
        await expect(
          client.fetch(query, params, {perspective: 'drafts', token: serverToken, useCdn: false}),
        ).resolves.toEqual(params)

        // Then prove that the sanityFetch wrapper works correctly
        const {data} = await sanityFetch({query, params})
        expect(data).toEqual(params)
      },
    )
    test.runIf(!cacheComponents)(
      'is resolved from cookies by default when draft mode is enabled',
      async () => {
        isDraftMode = true
        perspectiveCookieValue = ['drafts', 'r5RGhbQN9']
        const {query, params} = getSanityFetchMock(
          '{"perspective": $perspective, "token": $token}',
          {perspective: perspectiveCookieValue, token: `Bearer ${serverToken}`},
        )
        // When using client.fetch directly it respects the `perspective` and `token` settings
        await expect(
          client.fetch(query, params, {
            perspective: perspectiveCookieValue,
            token: serverToken,
            useCdn: false,
          }),
        ).resolves.toEqual(params)

        // Then prove that the sanityFetch wrapper works correctly
        const {data} = await sanityFetch({query, params})
        expect(data).toEqual(params)
      },
    )
    test('does not call draftMode() if no serverToken is provided', async () => {
      const {sanityFetch} = defineLive({client, serverToken: false})
      const {query, params} = getSanityFetchMock(
        '{"perspective": $perspective, "useCdn": $useCdn}',
        {perspective: 'published', useCdn: true},
      )
      await sanityFetch({query, params})
      expect(isDraftModeCalled).not.toBe(true)
    })
    test('reuses client config token if no serverToken is provided', async () => {
      const {sanityFetch} = defineLive({client, serverToken: false})
      const perspective = ['drafts', 'r5RGhbQN9']
      const {query, params} = getSanityFetchMock('{"perspective": $perspective, "token": $token}', {
        perspective,
        token: `Bearer ${token}`,
      })
      // When using client.fetch directly it respects the `perspective` and `token` settings
      await expect(
        client.fetch(query, params, {perspective, token, useCdn: false}),
      ).resolves.toEqual(params)

      // Then prove that the sanityFetch wrapper works correctly
      const {data} = await sanityFetch({query, params, perspective})
      expect(data).toEqual(params)
    })
  })

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
})
