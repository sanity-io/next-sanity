import {useCallback, useDeferredValue, useSyncExternalStore} from 'react'

import {environment, environmentListeners, type DraftEnvironment} from './context'

/**
 * Reports the current draft mode environment.
 * Use it to determine how to adapt the UI based on wether:
 * - Your app is previewed in a iframe, inside Presentation Tool in a Sanity Studio.
 * - Your app is previewed in a new window, spawned from Presentation Tool in a Sanity Studio.
 * - Your app is live previewing drafts in a standalone context.
 * - Your app is previewing drafts, but not live.
 * - Your app is not previewing anything (that could be detected).
 * @public
 * @deprecated this hook will be removed in the next major version
 */
export function useDraftModeEnvironment(): DraftEnvironment {
  const subscribe = useCallback((listener: () => void) => {
    environmentListeners.add(listener)
    return () => environmentListeners.delete(listener)
  }, [])

  return useDeferredValue(
    useSyncExternalStore(
      subscribe,
      () => environment,
      () => 'checking',
    ),
    'checking',
  )
}
