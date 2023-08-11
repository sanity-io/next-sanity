// Tests the pattern used by next-sanity

import type {LiveQueryProviderProps} from '@sanity/preview-kit'
import dynamic from 'next/dynamic'

export type {CacheOptions, LiveQueryProviderProps, Logger} from '@sanity/preview-kit'

const GroqStoreProvider = dynamic(
  () => import('@sanity/preview-kit/internals/groq-store-provider'),
)
const LiveStoreProvider = dynamic(
  () => import('@sanity/preview-kit/internals/live-store-provider'),
)
const DynamicLiveQueryProvider = dynamic(
  () => import('@sanity/preview-kit/internals/live-query-provider'),
)

// eslint-disable-next-line no-console
console.log('app/LazyLiveQueryProvider.tsx')

export default function LiveQueryProvider(props: LiveQueryProviderProps): React.JSX.Element {
  return (
    <DynamicLiveQueryProvider
      {...props}
      GroqStoreProvider={GroqStoreProvider}
      LiveStoreProvider={LiveStoreProvider}
    />
  )
}
