import {useSyncExternalStore} from 'react'

/** @internal */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}
// eslint-disable-next-line no-empty-function
const emptySubscribe = () => () => {}
