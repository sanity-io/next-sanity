import {useDeferredValue, useSyncExternalStore} from 'react'

/** @internal */
export function useIsMounted(): boolean {
  return useDeferredValue(
    useSyncExternalStore(
      emptySubscribe,
      () => true,
      () => false,
    ),
    false,
  )
}
const emptySubscribe = () => () => {}
