'use client'

import {
  enableVisualEditing,
  type HistoryAdapterNavigate,
  type VisualEditingOptions,
} from '@sanity/visual-editing'
import {usePathname, useRouter, useSearchParams} from 'next/navigation.js'
import {useEffect, useRef, useState} from 'react'

import {revalidateRootLayout} from './actions'

/**
 * @public
 */
export interface VisualEditingProps extends Omit<VisualEditingOptions, 'history'> {
  /**
   * @deprecated The histoy adapter is already implemented
   */
  history?: never
}

export default function VisualEditing(props: VisualEditingProps): null {
  const {refresh, zIndex} = props

  const router = useRouter()
  const routerRef = useRef(router)
  const [navigate, setNavigate] = useState<HistoryAdapterNavigate | undefined>()

  useEffect(() => {
    routerRef.current = router
  }, [router])
  useEffect(() => {
    const disable = enableVisualEditing({
      zIndex,
      refresh: refresh
        ? refresh
        : (payload) => {
            switch (payload.source) {
              case 'manual':
                return payload.livePreviewEnabled ? manualFastRefresh() : manualFallbackRefresh()
              case 'mutation':
                return payload.livePreviewEnabled
                  ? mutationFastRefresh()
                  : mutationFallbackRefresh()
              default:
                throw new Error('Unknown refresh source', {cause: payload})
            }
          },
      history: {
        subscribe: (_navigate) => {
          setNavigate(() => _navigate)
          return () => setNavigate(undefined)
        },
        update: (update) => {
          switch (update.type) {
            case 'push':
              return routerRef.current.push(update.url)
            case 'pop':
              return routerRef.current.back()
            case 'replace':
              return routerRef.current.replace(update.url)
            default:
              throw new Error(`Unknown update type: ${update.type}`)
          }
        },
      },
    })

    function manualFastRefresh() {
      // eslint-disable-next-line no-console
      console.debug(
        'Live preview is setup, calling router.refresh() to refresh the server components without refetching cached data',
      )
      routerRef.current.refresh()
      return Promise.resolve()
    }
    function manualFallbackRefresh() {
      // eslint-disable-next-line no-console
      console.debug(
        'No loaders in live mode detected, or preview kit setup, revalidating root layout',
      )
      return revalidateRootLayout()
    }
    function mutationFastRefresh(): false {
      // eslint-disable-next-line no-console
      console.debug(
        'Live preview is setup, mutation is skipped assuming its handled by the live preview',
      )
      return false
    }
    function mutationFallbackRefresh() {
      // eslint-disable-next-line no-console
      console.debug(
        'No loaders in live mode detected, or preview kit setup, revalidating root layout',
      )
      return revalidateRootLayout()
    }

    return () => disable()
  }, [refresh, zIndex])

  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (navigate) {
      navigate({
        type: 'push',
        url: `${pathname}${searchParams?.size ? `?${searchParams}` : ''}`,
      })
    }
  }, [navigate, pathname, searchParams])

  return null
}
