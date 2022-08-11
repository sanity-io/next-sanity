/* eslint-disable max-nested-callbacks */
import asyncFn, {AsyncFnMock} from '@async-fn/jest'
import {act, renderHook} from '@testing-library/react-hooks'
import EventSource from 'eventsource'

import {createPreviewSubscriptionHook} from '../src/useSubscription'

jest.mock('../src/currentUser', () => ({getCurrentUser: () => Promise.resolve({id: 'id'})}))

type MockStore = {
  subscribe: (
    query: string,
    params: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (err: Error | undefined, result: any) => void
  ) => void
  unsubscribe: () => void
}
let mockGroqStore: AsyncFnMock<() => MockStore>
jest.doMock('@sanity/groq-store', () => ({
  groqStore: async (options) => {
    // Since module imports are cached we update the mock returned by it, instead of having to deal with purging the module cache between test files
    const qroqStore = await mockGroqStore()
    return qroqStore(options)
  },
}))

beforeEach(() => {
  mockGroqStore = asyncFn()
})

describe('createPreviewSubscriptionHook', () => {
  test('enabled: false', () => {
    const useQuerySubscription = createPreviewSubscriptionHook({projectId: 'a', dataset: 'b'})
    const {result} = renderHook(() => useQuerySubscription('query', {enabled: false}))
    expect(result.current).toEqual({data: undefined, error: undefined, loading: false})
    expect(mockGroqStore).not.toBeCalled()
  })

  describe('getStore', () => {
    test('reject', async () => {
      const useQuerySubscription = createPreviewSubscriptionHook({projectId: 'a', dataset: 'b'})
      const {result, waitForValueToChange} = renderHook(() =>
        useQuerySubscription('query', {enabled: true})
      )
      expect(result.current.loading).toBe(true)

      await waitForValueToChange(() => mockGroqStore.mock.calls.length)

      const error = new TypeError('Failed to fetch')
      await act(() => mockGroqStore.reject(error))

      expect(result.current.error).toBe(error)
      expect(result.current.loading).toBe(false)
    })

    test('resolve', async () => {
      const useQuerySubscription = createPreviewSubscriptionHook({projectId: 'a', dataset: 'b'})
      const {result, waitForValueToChange} = renderHook(() =>
        useQuerySubscription('query', {enabled: true})
      )
      expect(result.current.loading).toBe(true)

      await waitForValueToChange(() => mockGroqStore.mock.calls.length)

      const subscribe = jest.fn()
      await act(() => mockGroqStore.resolve(() => ({subscribe})))

      expect(subscribe).toBeCalled()
      expect(result.current.loading).toBe(false)
    })

    test('can pass token and EventSource', async () => {
      const useQuerySubscription = createPreviewSubscriptionHook({
        projectId: 'a',
        dataset: 'b',
        token: 'abc',
        EventSource: EventSource,
      })
      const {waitForValueToChange} = renderHook(() =>
        useQuerySubscription('query', {enabled: true})
      )
      await waitForValueToChange(() => mockGroqStore.mock.calls.length)

      const subscribe = jest.fn()
      await act(() => mockGroqStore.resolve(() => ({subscribe})))

      expect(subscribe).toBeCalled()
    })
  })

  test('store.subscribe error', async () => {
    const useQuerySubscription = createPreviewSubscriptionHook({projectId: 'a', dataset: 'b'})
    const {result, waitForValueToChange} = renderHook(() =>
      useQuerySubscription('query', {enabled: true})
    )
    expect(result.current.loading).toBe(true)

    await waitForValueToChange(() => mockGroqStore.mock.calls.length)

    const error = new TypeError('Failed to subscribe')
    const subscribe = (query, params, cb) => {
      cb(error)
      // eslint-disable-next-line @typescript-eslint/no-empty-function, no-empty-function
      return {unsubscribe: () => {}}
    }
    await act(() => mockGroqStore.resolve(() => ({subscribe})))

    expect(result.current.error).toBe(error)
  })

  test('store.subscribe success', async () => {
    const useQuerySubscription = createPreviewSubscriptionHook({projectId: 'a', dataset: 'b'})
    const {result, waitForValueToChange} = renderHook(() =>
      useQuerySubscription('query', {enabled: true})
    )
    expect(result.current.loading).toBe(true)

    await waitForValueToChange(() => mockGroqStore.mock.calls.length)

    const data = {}
    const subscribe = (query, params, cb) => {
      cb(null, data)
      // eslint-disable-next-line @typescript-eslint/no-empty-function, no-empty-function
      return {unsubscribe: () => {}}
    }
    await act(() => mockGroqStore.resolve(() => ({subscribe})))

    expect(result.current.data).toBe(data)
  })

  test('updating params are deep equaled', async () => {
    const useQuerySubscription = createPreviewSubscriptionHook({projectId: 'a', dataset: 'b'})
    const {result, waitForValueToChange, rerender} = renderHook(
      ({params}) => useQuerySubscription('query', {enabled: true, params}),
      {
        initialProps: {params: {slug: 'abc'}},
      }
    )
    expect(result.current.loading).toBe(true)

    await waitForValueToChange(() => mockGroqStore.mock.calls.length)

    const unsubscribe = jest.fn()
    const subscribe = jest.fn(() => ({unsubscribe}))
    await act(() => mockGroqStore.resolve(() => ({subscribe})))

    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(unsubscribe).not.toBeCalled()

    // eslint-disable-next-line require-await
    await act(async () => rerender({params: {slug: 'abc'}}))
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(unsubscribe).not.toBeCalled()

    // eslint-disable-next-line require-await
    await act(async () => rerender({params: {slug: '123'}}))
    expect(subscribe).toHaveBeenCalledTimes(2)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
