import {
  type HistoryAdapter,
  type HistoryAdapterNavigate,
  type HistoryRefresh,
  VisualEditing as VisualEditingComponent,
  type VisualEditingOptions,
} from '@sanity/visual-editing/react'
import {usePathname, useRouter, useSearchParams} from 'next/navigation.js'
import {revalidateRootLayout} from 'next-sanity/visual-editing/server-actions'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {addPathPrefix, normalizePathTrailingSlash, removePathPrefix} from './utils'

/**
 * @public
 */
export interface VisualEditingProps extends Omit<VisualEditingOptions, 'history'> {
  /**
   * @deprecated The histoy adapter is already implemented
   */
  history?: never
  /**
   * If next.config.ts is configured with a basePath we try to configure it automatically,
   * you can disable this by setting basePath to ''.
   * @example basePath="/my-custom-base-path"
   * @alpha experimental and may change without notice
   * @defaultValue process.env.__NEXT_ROUTER_BASEPATH || ''
   */
  basePath?: string
  /**
   * If next.config.ts is configured with a `trailingSlash` we try to detect it automatically,
   * it can be controlled manually by passing a boolean.
   * @example trailingSlash={true}
   * @alpha experimental and may change without notice
   * @defaultValue Boolean(process.env.__NEXT_TRAILING_SLASH)
   */
  trailingSlash?: boolean
}

export default function VisualEditing(props: VisualEditingProps): React.JSX.Element | null {
  const {basePath = '', components, refresh, trailingSlash = false, zIndex} = props

  const router = useRouter()
  const routerRef = useRef(router)
  const [navigate, setNavigate] = useState<HistoryAdapterNavigate | undefined>()

  useEffect(() => {
    routerRef.current = router
  }, [router])

  const history = useMemo<HistoryAdapter>(
    () => ({
      subscribe: (_navigate) => {
        setNavigate(() => _navigate)
        return () => setNavigate(undefined)
      },
      update: (update) => {
        switch (update.type) {
          case 'push':
            return routerRef.current.push(removePathPrefix(update.url, basePath))
          case 'pop':
            return routerRef.current.back()
          case 'replace':
            return routerRef.current.replace(removePathPrefix(update.url, basePath))
          default:
            throw new Error(`Unknown update type: ${update.type}`)
        }
      },
    }),
    [basePath],
  )

  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (navigate) {
      navigate({
        type: 'push',
        url: normalizePathTrailingSlash(
          addPathPrefix(`${pathname}${searchParams?.size ? `?${searchParams}` : ''}`, basePath),
          trailingSlash,
        ),
      })
    }
  }, [basePath, navigate, pathname, searchParams, trailingSlash])

  const handleRefresh = useCallback(
    (payload: HistoryRefresh) => {
      if (refresh) return refresh(payload)

      const manualFastRefresh = () => {
        // eslint-disable-next-line no-console
        console.debug(
          'Live preview is setup, calling router.refresh() to refresh the server components without refetching cached data',
        )
        routerRef.current.refresh()
        return Promise.resolve()
      }
      const manualFallbackRefresh = () => {
        // eslint-disable-next-line no-console
        console.debug(
          'No loaders in live mode detected, or preview kit setup, revalidating root layout',
        )
        return revalidateRootLayout()
      }
      const mutationFastRefresh = (): false => {
        // eslint-disable-next-line no-console
        console.debug(
          'Live preview is setup, mutation is skipped assuming its handled by the live preview',
        )
        return false
      }
      const mutationFallbackRefresh = () => {
        // eslint-disable-next-line no-console
        console.debug(
          'No loaders in live mode detected, or preview kit setup, revalidating root layout',
        )
        return revalidateRootLayout()
      }

      switch (payload.source) {
        case 'manual':
          return payload.livePreviewEnabled ? manualFastRefresh() : manualFallbackRefresh()
        case 'mutation':
          return payload.livePreviewEnabled ? mutationFastRefresh() : mutationFallbackRefresh()
        default:
          throw new Error('Unknown refresh source', {cause: payload})
      }
    },
    [refresh],
  )

  return (
    <VisualEditingComponent
      components={components}
      history={history}
      portal
      refresh={handleRefresh}
      zIndex={zIndex}
    />
  )
}
