import {useCallback, useSyncExternalStore} from 'react'
import {
  environment,
  environmentListeners,
  perspective,
  perspectiveListeners,
  type DraftEnvironment,
  type DraftPerspective,
} from './context'

/**
 * Reports the current draft mode environment.
 * Use it to determine how to adapt the UI based on wether:
 * - Your app is previewed in a iframe, inside Presentation Tool in a Sanity Studio.
 * - Your app is previewed in a new window, spawned from Presentation Tool in a Sanity Studio.
 * - Your app is live previewing drafts in a standalone context.
 * - Your app is previewing drafts, but not live.
 * - Your app is not previewing anything (that could be detected).
 * @public
 */
export function useDraftModeEnvironment(): DraftEnvironment {
  const subscribe = useCallback((listener: () => void) => {
    environmentListeners.add(listener)
    return () => environmentListeners.delete(listener)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => environment,
    () => 'checking',
  )
}

/**
 * Reports the Sanity Client perspective used to fetch data in `sanityFetch` used on the page.
 * If the hook is used outside Draft Mode it will resolve to `'unknown'`.
 * If the hook is used but the `<SanityLive />` component is not present then it'll stay in `'checking'` and console warn after a timeout that it seems like you're missing the component.
 * @public
 */
export function useDraftModePerspective(): DraftPerspective {
  const subscribe = useCallback((listener: () => void) => {
    perspectiveListeners.add(listener)
    return () => perspectiveListeners.delete(listener)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => perspective,
    () => 'checking',
  )
}
