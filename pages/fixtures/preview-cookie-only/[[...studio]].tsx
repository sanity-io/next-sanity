import {useMemo} from 'react'
import type {WorkspaceOptions} from 'sanity'
import _config from 'sanity.config'
import {NextStudio, useBasePath} from 'src/studio'

export default function StudioPage() {
  const basePath = useBasePath()
  const config = useMemo<WorkspaceOptions>(() => {
    return {
      ..._config,
      basePath,
      document: {
        // eslint-disable-next-line require-await
        productionUrl: async (prev) => {
          // eslint-disable-next-line no-restricted-globals
          const url = new URL('/api/preview-cookie-only', location.origin)
          // eslint-disable-next-line no-warning-comments
          // @TODO grab secret with client
          const secret = process.env.NEXT_PUBLIC_PREVIEW_SECRET
          if (secret) {
            url.searchParams.set('secret', secret)
          } else if (process.env.NODE_ENV === 'production') {
            console.warn('No preview secret set. Previews disabled.')
            return prev
          }

          return url.toString()
        },
      },
    }
  }, [basePath])

  return <NextStudio config={config} />
}
