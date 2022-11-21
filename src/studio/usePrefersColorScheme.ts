/* eslint-disable @typescript-eslint/no-empty-function */
import type {ThemeColorSchemeKey} from '@sanity/ui'
import {useSyncExternalStore} from 'react'

function createStore() {
  if (typeof document === 'undefined') {
    return {
      subscribe: () => () => {},
      getSnapshot: () => 'light' as const,
      getServerSnapshot: () => 'light' as const,
    }
  }

  const matchMedia = window.matchMedia('(prefers-color-scheme: dark)')

  return {
    subscribe: (onStoreChange: () => void) => {
      matchMedia.addEventListener('change', onStoreChange)
      return () => matchMedia.removeEventListener('change', onStoreChange)
    },
    getSnapshot: () => (matchMedia.matches ? 'dark' : 'light'),
    getServerSnapshot: () => 'light' as const,
  }
}
const store = createStore()

/** @alpha */
export function usePrefersColorScheme(): ThemeColorSchemeKey {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
