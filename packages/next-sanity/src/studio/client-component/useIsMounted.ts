import {useSyncExternalStore} from 'react'

/** @internal */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}
const emptySubscribe = () => () => {}
