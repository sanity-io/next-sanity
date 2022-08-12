import {useSyncExternalStore} from 'use-sync-external-store/shim'

import {type GroqStoreHookProps, useGroqStore} from './useGroqStore'

export type SyncGroqStoreHookProps = GroqStoreHookProps

export const useSyncGroqStore = (props: SyncGroqStoreHookProps): any => {
  const store = useGroqStore(props)
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
