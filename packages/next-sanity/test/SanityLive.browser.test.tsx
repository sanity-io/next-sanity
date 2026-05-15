import {createClient} from 'next-sanity'
import {Component, type ReactNode} from 'react'
import {beforeEach, describe, expect, vi} from 'vitest'
import {render} from 'vitest-browser-react'

import SanityLiveClientComponent, {
  type SanityLiveProps,
} from '../src/live/client-components/SanityLive'
import type {
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
} from '../src/live/shared/types'
import {apiVersion, dataset, projectId, type SseMockTags} from './helpers'
import {test} from './helpers.browser'

type OnRestartFn = Exclude<SanityLiveOnRestart, 'refresh'>
type OnReconnectFn = Exclude<SanityLiveOnReconnect, 'refresh'>

// A stable spy that every `useRouter()` call shares so tests can assert  `router.refresh()` was invoked
const refresh = vi.fn()
const router = {
  refresh,
  back: vi.fn(),
  forward: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
} satisfies ReturnType<typeof import('next/navigation').useRouter>
vi.mock(import('next/navigation'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    useRouter: vi.fn(() => router),
  }
})

beforeEach(() => {
  refresh.mockClear()
})

interface TestErrorBoundaryProps {
  onError?: (error: unknown) => void
  children: ReactNode
}
interface TestErrorBoundaryState {
  error: unknown
}
class TestErrorBoundary extends Component<TestErrorBoundaryProps, TestErrorBoundaryState> {
  override state: TestErrorBoundaryState = {error: undefined}
  static getDerivedStateFromError(error: unknown): TestErrorBoundaryState {
    return {error}
  }
  override componentDidCatch(error: unknown): void {
    this.props.onError?.(error)
  }
  override render(): ReactNode {
    return this.state.error === undefined ? this.props.children : null
  }
}

function defineSanityLiveClientComponent(
  overrides: Partial<SanityLiveProps>,
  configOverrides?: Partial<SanityLiveProps['config']>,
) {
  const client = createClient({projectId, dataset, apiVersion, useCdn: true})
  const {apiHost, useProjectHostname, requestTagPrefix} = client.config()
  return (
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
      onWelcome={false}
      requestTag="next-loader.live"
      waitFor={undefined}
      {...overrides}
    />
  )
}
async function renderMock(
  overrides: Partial<SanityLiveProps>,
  configOverrides?: Partial<SanityLiveProps['config']>,
) {
  return render(defineSanityLiveClientComponent(overrides, configOverrides))
}
async function renderMockInBoundary(
  boundaryOnError: (error: unknown) => void,
  overrides: Partial<SanityLiveProps>,
  configOverrides?: Partial<SanityLiveProps['config']>,
) {
  const children = defineSanityLiveClientComponent(overrides, configOverrides)
  return render(<TestErrorBoundary onError={boundaryOnError}>{children}</TestErrorBoundary>)
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

  describe('action', () => {
    const requestTag = 'mock.sends-live-event' satisfies SseMockTags

    test(`action='refresh' triggers router.refresh()`, async () => {
      await renderMock({action: 'refresh', requestTag})
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    })

    test('action={fn} is called with prefixed tags', async () => {
      const action = vi.fn(async () => {})
      await renderMock({action, requestTag})
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
      expect(refresh).not.toHaveBeenCalled()
    })

    test(`action returning 'refresh' triggers router.refresh()`, async () => {
      const action = vi.fn(async () => 'refresh' as const)
      await renderMock({action, requestTag})
      await vi.waitFor(() => expect(action).toHaveBeenCalled())
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    })
  })

  describe('onRestart', () => {
    const requestTag = 'mock.sends-restart-event' satisfies SseMockTags

    test(`onRestart='refresh' triggers router.refresh()`, async () => {
      await renderMock({onRestart: 'refresh', requestTag})
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    })

    test(`onRestart returning 'refresh' triggers router.refresh()`, async () => {
      const onRestart = vi.fn<OnRestartFn>(async () => 'refresh' as const)
      await renderMock({onRestart, requestTag})
      await vi.waitFor(() => expect(onRestart).toHaveBeenCalled())
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
      const [event, context] = onRestart.mock.lastCall!
      expect(event.type).toBe('restart')
      expect(context).toEqual({includeDrafts: false, waitFor: undefined})
    })

    test('onRestart returning void does not trigger router.refresh()', async () => {
      const onRestart = vi.fn<OnRestartFn>(async () => {})
      const onWelcome = vi.fn()
      await renderMock({onRestart, onWelcome, requestTag})
      await vi.waitFor(() => expect(onRestart).toHaveBeenCalled())
      // Wait for the welcome we know is also delivered to ensure all events have
      // been processed before asserting `refresh` was *not* called.
      await vi.waitFor(() => expect(onWelcome).toHaveBeenCalled())
      expect(refresh).not.toHaveBeenCalled()
    })

    test('onRestart={false} does not trigger router.refresh()', async () => {
      const onWelcome = vi.fn()
      await renderMock({onRestart: false, onWelcome, requestTag})
      await vi.waitFor(() => expect(onWelcome).toHaveBeenCalled())
      expect(refresh).not.toHaveBeenCalled()
    })
  })

  describe.each([
    {requestTag: 'mock.closes-after-welcome' satisfies SseMockTags},
    {requestTag: 'mock.fails-with-500' satisfies SseMockTags},
  ])('onReconnect (via $requestTag)', ({requestTag}) => {
    test(`onReconnect='refresh' triggers router.refresh()`, async () => {
      await renderMock({onReconnect: 'refresh', requestTag})
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    })

    test(`onReconnect returning 'refresh' triggers router.refresh()`, async () => {
      const onReconnect = vi.fn<OnReconnectFn>(async () => 'refresh' as const)
      await renderMock({onReconnect, requestTag})
      await vi.waitFor(() => expect(onReconnect).toHaveBeenCalled())
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
      const [event, context] = onReconnect.mock.lastCall!
      expect(event.type).toBe('reconnect')
      expect(context).toEqual({includeDrafts: false, waitFor: undefined})
    })

    test('onReconnect returning void does not trigger router.refresh()', async () => {
      const onReconnect = vi.fn<OnReconnectFn>(async () => {})
      await renderMock({onReconnect, requestTag})
      await vi.waitFor(() => expect(onReconnect).toHaveBeenCalled())
      expect(refresh).not.toHaveBeenCalled()
    })

    test('onReconnect={false} does not trigger router.refresh()', async () => {
      await renderMock({onReconnect: false, requestTag})
      // Both reconnect tags emit at least one reconnect event well under
      // 250ms; for `mock.fails-with-500` there's no welcome to sync on, so we
      // give the SDK a fixed window to process the failure and verify the
      // disabled handler kept `refresh` untouched.
      await new Promise<void>((resolve) => setTimeout(resolve, 250))
      expect(refresh).not.toHaveBeenCalled()
    })
  })

  describe('onGoAway', () => {
    const requestTag = 'mock.sends-goaway-event' satisfies SseMockTags

    test('custom handler is called with (event, context, setPollingInterval) and polling triggers refresh', async () => {
      const onGoAway = vi.fn<SanityLiveOnGoaway>((_event, _context, setPollingInterval) => {
        setPollingInterval(50)
      })
      await renderMock({onGoAway, requestTag})
      await vi.waitFor(() => expect(onGoAway).toHaveBeenCalled())
      const [event, context, setPollingInterval] = onGoAway.mock.lastCall!
      expect(event.type).toBe('goaway')
      expect(context).toEqual({includeDrafts: false, waitFor: undefined})
      expect(typeof setPollingInterval).toBe('function')
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    })

    test('onGoAway={false} with onError surfaces the error via onError', async () => {
      const onError = vi.fn()
      await renderMock({onGoAway: false, onError, requestTag})
      await vi.waitFor(() => expect(onError).toHaveBeenCalled())
      const [error, context] = onError.mock.lastCall!
      expect(error).toBeInstanceOf(Error)
      expect(error).toMatchObject({
        message: expect.stringContaining('Sanity Live connection closed'),
        cause: {type: 'goaway'},
      })
      expect(context).toEqual({includeDrafts: false, waitFor: undefined})
    })

    test('onGoAway={false} without onError throws to the nearest ErrorBoundary', async () => {
      const boundaryOnError = vi.fn()
      await renderMockInBoundary(boundaryOnError, {onGoAway: false, requestTag})
      await vi.waitFor(() => expect(boundaryOnError).toHaveBeenCalled())
      const [caught] = boundaryOnError.mock.lastCall!
      expect(caught).toBeInstanceOf(Error)
      expect(caught).toMatchObject({
        message: expect.stringContaining('Sanity Live connection closed'),
        cause: {type: 'goaway'},
      })
    })
  })

  describe('connection-failure → reconnect', () => {
    test('mock.aborts-connection surfaces a reconnect event to onReconnect', async () => {
      const onReconnect = vi.fn<OnReconnectFn>(async () => {})
      await renderMock({
        onReconnect,
        requestTag: 'mock.aborts-connection' satisfies SseMockTags,
      })
      await vi.waitFor(() => expect(onReconnect).toHaveBeenCalled())
      const [event] = onReconnect.mock.lastCall!
      expect(event.type).toBe('reconnect')
    })
  })

  describe('stream error event', () => {
    const requestTag = 'mock.sends-stream-error-event' satisfies SseMockTags

    test('onError receives the server-sent error', async () => {
      const onError = vi.fn()
      await renderMock({onError, requestTag})
      await vi.waitFor(() => expect(onError).toHaveBeenCalled())
      const [error, context] = onError.mock.lastCall!
      expect(error).toBeInstanceOf(Error)
      expect(error).toMatchObject({message: 'Unfortunate error'})
      expect(context).toEqual({includeDrafts: false, waitFor: undefined})
    })

    test('without onError the server-sent error throws to the nearest ErrorBoundary', async () => {
      const boundaryOnError = vi.fn()
      await renderMockInBoundary(boundaryOnError, {requestTag})
      await vi.waitFor(() => expect(boundaryOnError).toHaveBeenCalled())
      const [caught] = boundaryOnError.mock.lastCall!
      expect(caught).toBeInstanceOf(Error)
      expect(caught).toMatchObject({message: 'Unfortunate error'})
    })
  })
})
