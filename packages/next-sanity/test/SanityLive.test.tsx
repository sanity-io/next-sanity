import {createClient} from 'next-sanity'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {afterEach, beforeAll, describe, expect, test, vi} from 'vitest'

import {apiVersion, dataset, projectId, renderToString} from './helpers'

let isDraftMode = false
let isDraftModeCalled = false
vi.mock(import('next/headers'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
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
})

vi.mock('next-sanity/live/client-components', {spy: true})

describe.each([
  // {cacheComponents: true},
  {cacheComponents: false},
])('SanityLive when %o', async ({cacheComponents}) => {
  const {defineLive} = cacheComponents
    ? await import('../src/live/conditions/next-js')
    : await import('../src/live/conditions/react-server')
  const browserToken = 'sk123'

  describe('minimum required config', () => {
    let html: string
    beforeAll(async () => {
      const client = createClient({projectId, dataset, apiVersion, useCdn: false})
      const {SanityLive} = defineLive({client})
      html = await renderToString(<SanityLive />)
    })

    test('renders SanityLiveClientComponent with minimal props', () => {
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            projectId,
            dataset,
            apiVersion,
          }),
          requestTag: expect.stringContaining('next-loader'),
        }),
        undefined,
      )
    })

    test('preconnects to API origin', async () => {
      expect(html).toContain('preconnect')
      expect(html).not.toContain('apicdn')
      expect(html).toMatchInlineSnapshot(
        `"<link rel="preconnect" href="https://pv8y60vp.api.sanity.io"/>"`,
      )
    })
  })
  describe('supports custom api host', () => {
    const apiHost = 'https://api.example.com'
    let html: string
    beforeAll(async () => {
      const client = createClient({
        apiHost,
        useProjectHostname: false,
        dataset,
        apiVersion,
        useCdn: false,
      })
      const {SanityLive} = defineLive({client})
      html = await renderToString(<SanityLive />)
    })

    test('renders SanityLiveClientComponent with minimal props', () => {
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            apiHost,
            dataset,
            apiVersion,
            useProjectHostname: false,
          }),
          requestTag: expect.stringContaining('next-loader'),
        }),
        undefined,
      )
    })

    test('preconnects to API origin', async () => {
      expect(html).toContain('preconnect')
      expect(html).toContain(apiHost)
      expect(html).toMatchInlineSnapshot(
        `"<link rel="preconnect" href="https://api.example.com"/>"`,
      )
    })
  })
  describe('includeDrafts', () => {
    test('includeDrafts is false by default', async () => {
      const client = createClient({projectId, dataset, apiVersion, useCdn: true})
      const {SanityLive} = defineLive({client, browserToken})
      await renderToString(<SanityLive />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            token: undefined,
          }),
          includeDrafts: undefined,
        }),
        undefined,
      )
    })
    test.runIf(!cacheComponents)(
      'includeDrafts is true by default if draftMode is enabled',
      async () => {
        const client = createClient({projectId, dataset, apiVersion, useCdn: true})
        const {SanityLive} = defineLive({client, browserToken})
        isDraftMode = true
        await renderToString(<SanityLive />)
        expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
          expect.objectContaining({
            config: expect.objectContaining({
              token: browserToken,
            }),
            includeDrafts: true,
          }),
          undefined,
        )
      },
    )
    test('includeDrafts is never true if browserToken is not set', async () => {
      const client = createClient({projectId, dataset, apiVersion, useCdn: true})
      const {SanityLive} = defineLive({client})
      isDraftMode = true
      await renderToString(<SanityLive includeDrafts />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            token: undefined,
          }),
          includeDrafts: undefined,
        }),
        undefined,
      )
    })
    test(`if no browserToken is provided then draftMode isn't checked`, async () => {
      const client = createClient({projectId, dataset, apiVersion, useCdn: true})
      const {SanityLive} = defineLive({client})
      await renderToString(<SanityLive />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            token: undefined,
          }),
          includeDrafts: undefined,
        }),
        undefined,
      )
      expect(isDraftModeCalled).not.toBe(true)
    })
    test('never forwards token from client config', async () => {
      const client = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: true,
        token: browserToken,
      })
      const {SanityLive} = defineLive({client})
      await renderToString(<SanityLive />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            token: undefined,
          }),
          includeDrafts: undefined,
        }),
        undefined,
      )
    })
    test('does not forward browserToken if includeDrafts is false', async () => {
      const client = createClient({projectId, dataset, apiVersion, useCdn: true})
      const {SanityLive} = defineLive({client, browserToken})
      isDraftMode = true
      await renderToString(<SanityLive includeDrafts={false} />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            token: undefined,
          }),
          includeDrafts: undefined,
        }),
        undefined,
      )
    })
  })
  describe('waitFor', () => {
    const client = createClient({projectId, dataset, apiVersion, useCdn: true})
    const {SanityLive} = defineLive({client, browserToken})
    test('undefined by default', async () => {
      await renderToString(<SanityLive />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          waitFor: undefined,
        }),
        undefined,
      )
    })
    test(`if includeDrafts is true then waitFor="function" is ignored`, async () => {
      await renderToString(<SanityLive includeDrafts waitFor="function" />)
      expect(SanityLiveClientComponent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          waitFor: undefined,
        }),
        undefined,
      )
    })
  })
})
