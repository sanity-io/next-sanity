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
  env?: string
  start: number
  end: number
  value?: null | Promise<unknown>
}

/** Structural mirror of React's `ReactAsyncInfo`. */
interface ReactAsyncInfo {
  awaited: ReactIOInfo
  env?: string
}

type ReactDebugInfo = ReadonlyArray<ReactAsyncInfo>

interface AnnotatedPromise<T> extends Promise<T> {
  displayName?: string
  _debugInfo?: ReactDebugInfo
}

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
export function attachSanityFetchDebugInfo<T>(promise: Promise<T>): Promise<T> {
  if (process.env['NODE_ENV'] === 'production') return promise

  const annotated = promise as AnnotatedPromise<T>

  // `void` discards the Promise that `Object.defineProperty` returns
  // (its first argument) so it doesn't trip the `no-floating-promises` lint.
  void Object.defineProperty(annotated, 'displayName', {
    value: 'sanityFetch',
    configurable: true,
    writable: true,
    enumerable: false,
  })

  const now = performance.now()
  const ioInfo: ReactIOInfo = {
    name: 'sanityFetch',
    env: 'Sanity',
    start: now,
    end: now,
    value: promise,
  }
  const asyncInfo: ReactAsyncInfo = {awaited: ioInfo, env: 'Sanity'}

  void Object.defineProperty(annotated, '_debugInfo', {
    value: [asyncInfo] satisfies ReactDebugInfo,
    configurable: true,
    writable: true,
    enumerable: false,
  })

  return annotated
}
