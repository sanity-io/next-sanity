/**
 * React's Flight protocol forwards a `_debugInfo` array attached to thenables,
 * letting third-party libraries attribute their I/O so React DevTools and the
 * Performance "Server Requests" track surface a meaningful name and the
 * "Suspended by" panel knows what each component is waiting on.
 *
 * @see https://github.com/facebook/react/pull/33388 (track awaits on I/O)
 * @see https://github.com/facebook/react/pull/33392 (track function name for I/O entries)
 * @see https://github.com/facebook/react/pull/33415 (forward debugInfo from awaited instrumented Promises)
 *
 * Structural mirror of {@link https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js | React's `ReactIOInfo`}.
 * Only the fields we actually populate are listed.
 */
interface ReactIOInfo {
  name: string
  start: number
  end: number
  value?: null | Promise<unknown>
}

/** Structural mirror of React's `ReactAsyncInfo`. */
interface ReactAsyncInfo {
  awaited: ReactIOInfo
}

type ReactDebugInfo = ReadonlyArray<ReactAsyncInfo>

interface AnnotatedPromise<T> extends Promise<T> {
  displayName?: string
  _debugInfo?: ReactDebugInfo
}

export function isThenable<T = unknown>(promise: Promise<T> | T): promise is AnnotatedPromise<T> {
  return (
    promise !== null &&
    typeof promise === 'object' &&
    'then' in promise &&
    typeof promise.then === 'function'
  )
}

export const shouldAttachDebugInfo = process.env['NODE_ENV'] === 'development'

/**
 * Attaches `displayName` and a minimal `_debugInfo` entry to the Promise returned
 * by `sanityFetch` so React DevTools attributes the await to Sanity:
 *
 * - `displayName = 'sanityFetch'` names the entry on the Performance
 *   "Server Requests" track.
 * - `_debugInfo` contains a single `ReactAsyncInfo` wrapping a `ReactIOInfo`,
 *   which creates a row in the Components inspector's "Suspended by" panel for
 *   both Server Components that `await` the Promise and Client Components that
 *   consume it via `use(props.promise)`.
 *
 * The `start`/`end` timings on the `ReactIOInfo` are collapsed to a single
 * `performance.now()`: the inside of `sanityFetch` (network, optional stega
 * encoding, the second sync-tags round trip in the `cacheComponents: false`
 * variant) is opaque, so we don't pretend to report a span duration. React's
 * automatic I/O tracking still attributes the underlying `fetch(...)` calls
 * accurately.
 *
 * Setting `value: promise` lets DevTools surface the resolved
 * `{data, sourceMap, tags}` when the "Suspended by" entry is clicked.
 *
 * Strictly DEV-only — the entire body is short-circuited under
 * `process.env.NODE_ENV === 'production'`, so production builds pay nothing.
 *
 * The properties are non-enumerable so they don't leak into `console.log`,
 * JSON snapshots, or test object equality checks.
 */
export function attachSanityFetchDebugInfo<T>(
  name: string,
  thenable: () => AnnotatedPromise<T>,
): AnnotatedPromise<T> {
  if (!shouldAttachDebugInfo) return thenable()
  const startTime = performance.now()
  const promise = thenable()
  if (promise.displayName === undefined) {
    promise.displayName = name
  }

  const ioInfo: ReactIOInfo = {
    name,
    start: startTime,
    end: startTime,
    value: promise,
  }
  const asyncInfo: ReactAsyncInfo = {awaited: ioInfo}

  if (Array.isArray(promise._debugInfo)) {
    promise._debugInfo.push(asyncInfo)
  } else {
    promise._debugInfo = [asyncInfo] satisfies ReactDebugInfo
  }

  // // Track when we resolved the Promise as the approximate end time.
  // @ts-expect-error - status is not typed
  if (promise.status !== 'fulfilled' && promise.status !== 'rejected') {
    const trackEndTime = () => {
      ioInfo.end = performance.now()
    }
    promise.then(trackEndTime, trackEndTime)
  }

  return promise
}
