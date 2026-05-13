import {createClient} from 'next-sanity'
import {describe, expect, vi} from 'vitest'
import {render} from 'vitest-browser-react'

import SanityLiveClientComponent from '../src/live/client-components/SanityLive'
import {apiVersion, dataset, projectId} from './helpers'
import {test} from './helpers.browser'

vi.mock(import('next/navigation'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    useRouter: vi.fn(),
  }
})

describe('SanityLiveClientComponent', () => {
  const onWelcome = vi.fn()
  const onError = vi.fn()
  const client = createClient({projectId, dataset, apiVersion, useCdn: true})
  const {apiHost, useProjectHostname, requestTagPrefix} = client.config()
  test('renders without crashing', async () => {
    await render(
      <SanityLiveClientComponent
        action="refresh"
        config={{
          projectId,
          dataset,
          apiVersion,
          apiHost,
          useProjectHostname,
          requestTagPrefix,
        }}
        includeDrafts={undefined}
        onError={onError}
        onGoAway={undefined}
        onReconnect={undefined}
        onRestart={undefined}
        onWelcome={onWelcome}
        requestTag="next-loader.live"
        waitFor={undefined}
      />,
    )

    await vi.waitUntil(() => onWelcome.mock.calls.length > 0 || onError.mock.calls.length > 0)
    expect(onError).not.toHaveBeenCalled()
    expect(onWelcome).toHaveBeenCalled()
  })
})
