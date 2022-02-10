import asyncFn from '@async-fn/jest'
import {renderHook, act} from '@testing-library/react-hooks'
import {createCurrentUserHook} from '../src/currentUser'

global.fetch = () => Promise.reject(new Error('Forgot to mock fetch'))

describe('createCurrentUserHook', () => {
  test('setError', async () => {
    const fetchMock = asyncFn()
    global.fetch = () => fetchMock()

    const useCurrentUser = createCurrentUserHook({projectId: 'projectId'})
    const {result} = renderHook(() => useCurrentUser())
    expect(result.current).toEqual({data: undefined, error: undefined, loading: true})

    const error = new Error('Mock failed API response')
    await act(() => fetchMock.reject(error))

    expect(result.current).toEqual({data: undefined, error, loading: true})
  })

  test('setUser', async () => {
    const fetchMock = asyncFn()
    global.fetch = () => fetchMock()

    const useCurrentUser = createCurrentUserHook({projectId: 'projectId'})
    const {result} = renderHook(() => useCurrentUser())
    expect(result.current).toEqual({data: undefined, error: undefined, loading: true})

    const data = {id: 'id', name: 'name'}
    await act(() => fetchMock.resolve({json: () => data}))

    expect(result.current).toEqual({data, error: undefined, loading: true})
  })

  test('abort on unmount', async () => {
    const fetchMock = asyncFn()
    let abortSignal: AbortSignal
    // @ts-expect-error no need to type it in this test
    global.fetch = (url: string, {signal}) => {
      abortSignal = signal
      return fetchMock()
    }

    const useCurrentUser = createCurrentUserHook({projectId: 'projectId'})
    const {unmount} = renderHook(() => useCurrentUser())
    // Sanity check, making sure we remembered to provide an abort signal
    expect(abortSignal.aborted).toBe(false)

    unmount()

    expect(abortSignal.aborted).toBe(true)
  })

  // Since AbortController is only fired by us we can safely ignore this error and there's no point in giving it to setError
  test('setError skips AbortError', async () => {
    const fetchMock = asyncFn()
    let abortSignal: AbortSignal
    // @ts-expect-error no need to type it in this test
    global.fetch = (url: string, {signal}) => {
      // This is called twice, but we only care about the abort signal of the first fetch
      if (!abortSignal) abortSignal = signal
      return fetchMock()
    }

    const {result, rerender} = renderHook(
      ({projectId}) => {
        const useCurrentUser = createCurrentUserHook({projectId})
        return useCurrentUser()
      },
      {
        initialProps: {projectId: 'one'},
      }
    )
    expect(result.current.error).toBe(undefined)
    expect(abortSignal.aborted).toBe(false)

    // projectId is in the deps array of useEffect, and will run the teardown before running the second execution of the useEffect callback
    rerender({projectId: 'two'})
    // Ensure we aborted in the teardown
    expect(abortSignal.aborted).toBe(true)
    // When a fetch is cancelled using an AbortController it will fire an Error with the name 'AbortError'
    // More info https://gist.github.com/stipsan/23bdb234ac71d3d2bc8351623dcc0dd0
    class MockAbortError extends Error {
      name = 'AbortError'
    }
    await act(() => fetchMock.reject(new MockAbortError()))
    // Make sure we didn't call setError as consider cancellations intentional, they're not unexpected runtime errors
    expect(result.current.error).toBe(undefined)
  })
})
