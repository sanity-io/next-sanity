import {
  type HistoryAdapter,
  type HistoryAdapterNavigate,
  type HistoryRefresh,
  VisualEditing as VisualEditingComponent,
  type VisualEditingOptions,
} from '@sanity/visual-editing/react'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useCallback, useEffect, useMemo, useState} from 'react'

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
  const {
    basePath = '',
    plugins,
    components,
    refresh,
    trailingSlash = false,
    zIndex,
    onPerspectiveChange,
    onVariantChange,
    keepStegaOnCopy,
    onSuspiciousStega,
  } = props

  const router = useRouter()
  const [navigate, setNavigate] = useState<HistoryAdapterNavigate | undefined>()

  // When draft mode was enabled through the Storage Access API fallback in
  // `defineEnableDraftMode` (browsers that reject cross-site cookies even with
  // CHIPS, e.g. Firefox with strict Enhanced Tracking Protection), the
  // draft-mode cookies live in the unpartitioned jar. Storage access is
  // granted per document in some browsers, so re-activate the existing grant
  // for this document to keep the cookies flowing on RSC requests and server
  // actions. This never prompts: without a prior grant `requestStorageAccess`
  // rejects and the partitioned-cookie behavior stays untouched.
  // https://github.com/sanity-io/next-sanity/issues/3919
  useEffect(() => {
    if (
      window.self === window.top ||
      typeof document.hasStorageAccess !== 'function' ||
      typeof document.requestStorageAccess !== 'function'
    ) {
      return undefined
    }
    const controller = new AbortController()
    document
      .hasStorageAccess()
      .then(async (hasAccess) => {
        if (hasAccess || controller.signal.aborted) return
        const permission = await navigator.permissions.query({name: 'storage-access'})
        if (permission.state !== 'granted' || controller.signal.aborted) return
        await document.requestStorageAccess()
      })
      .catch(() => {
        // Not granted or unsupported - cookies keep using the partitioned jar.
      })
    return () => controller.abort()
  }, [])

  const history = useMemo<HistoryAdapter>(
    () => ({
      subscribe: (_navigate) => {
        setNavigate(() => _navigate)
        return () => setNavigate(undefined)
      },
      update: (update) => {
        switch (update.type) {
          case 'push':
            return router.push(removePathPrefix(update.url, basePath))
          case 'pop':
            return router.back()
          case 'replace':
            return router.replace(removePathPrefix(update.url, basePath))
          default:
            throw new Error(`Unknown update type`, {cause: update})
        }
      },
    }),
    [basePath, router],
  )

  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (navigate) {
      navigate({
        type: 'push',
        url: normalizePathTrailingSlash(
          addPathPrefix(
            `${pathname}${searchParams?.size ? `?${searchParams.toString()}` : ''}`,
            basePath,
          ),
          trailingSlash,
        ),
      })
    }
  }, [basePath, navigate, pathname, searchParams, trailingSlash])

  const handleRefresh = useCallback(
    (payload: HistoryRefresh): false | Promise<void> => {
      switch (payload.source) {
        case 'manual':
          router.refresh()
          break
        case 'mutation': {
          // oxlint-disable-next-line no-console
          console.debug(
            '<VisualEditing /> refresh called with source "mutation", if you want automatic refresh when this happens, or silence this message, provide your own handler to the refresh prop',
          )
          return false
        }
        default:
          throw new Error('Unknown refresh source', {cause: payload})
      }
      return new Promise((resolve) => setTimeout(resolve, 1_000))
    },
    [router],
  )

  return (
    <VisualEditingComponent
      plugins={plugins}
      components={components}
      history={history}
      portal
      refresh={refresh ?? handleRefresh}
      onPerspectiveChange={onPerspectiveChange}
      onVariantChange={onVariantChange}
      keepStegaOnCopy={keepStegaOnCopy}
      onSuspiciousStega={onSuspiciousStega}
      zIndex={zIndex}
    />
  )
}
