import {createClient} from 'next-sanity'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {afterEach, expect, test, vi} from 'vitest'

import {defineLive} from '../src/live/conditions/next-js'
import {apiVersion, dataset, projectId, renderToString} from './helpers'

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

vi.mock('next-sanity/live/client-components', {spy: true})

test('SanityLive preconnects to API origin', async () => {
  const client = createClient({projectId, dataset, apiVersion, useCdn: true})
  const {SanityLive} = defineLive({client, browserToken: false, serverToken: false})
  const html = await renderToString(<SanityLive />)

  expect(html).toContain('preconnect')
  expect(html).toMatchInlineSnapshot(
    `"<link rel="preconnect" href="https://pv8y60vp.api.sanity.io"/>"`,
  )
  expect(SanityLiveClientComponent).toHaveBeenLastCalledWith({
    config: {
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    },
  })
})
