import {createClient} from 'next-sanity'
import {describe, expect, vi} from 'vitest'
import {render} from 'vitest-browser-react'

import SanityLiveClientComponent, {
  type SanityLiveProps,
} from '../src/live/client-components/SanityLive'
import {apiVersion, dataset, projectId} from './helpers'
import {test} from './helpers.browser'
import type {SseMockTags} from './mocks/browser'

// @ts-expect-error - fix later
vi.mock(import('next/navigation'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    useRouter: vi.fn(() => ({refresh: vi.fn()})),
  }
})

async function renderMock(
  overrides: Partial<SanityLiveProps>,
  configOverrides?: Partial<SanityLiveProps['config']>,
) {
  const client = createClient({projectId, dataset, apiVersion, useCdn: true})
  const {apiHost, useProjectHostname, requestTagPrefix} = client.config()
  return render(
    <SanityLiveClientComponent
      action="refresh"
      config={{
        projectId,
        dataset,
        apiVersion,
        apiHost,
        useProjectHostname,
        requestTagPrefix,
        ...configOverrides,
      }}
      includeDrafts={undefined}
      onError={undefined}
      onGoAway={undefined}
      onReconnect={undefined}
      onRestart={undefined}
      onWelcome={undefined}
      requestTag="next-loader.live"
      waitFor={undefined}
      {...overrides}
    />,
  )
}

describe('SanityLiveClientComponent', () => {
  test('renders without crashing', async () => {
    const onWelcome = vi.fn()
    const onError = vi.fn()

    await renderMock({onWelcome, onError})

    await vi.waitUntil(() => onWelcome.mock.calls.length > 0 || onError.mock.calls.length > 0)
    expect(onError).not.toHaveBeenCalled()
    expect(onWelcome).toHaveBeenCalled()
  })

  test('calls action when a live event is received', async () => {
    const action = vi.fn(async () => {})
    await renderMock({action, requestTag: 'mock.sends-live-event' satisfies SseMockTags})
    await vi.waitFor(() => expect(action).toHaveBeenCalled())
    expect(action.mock.lastCall).toMatchInlineSnapshot(`
      [
        [
          "sanity:s1:01cWIQ",
          "sanity:s1:57Y4Uw",
          "sanity:s1:EiHmwQ",
        ],
      ]
    `)
  })
})
