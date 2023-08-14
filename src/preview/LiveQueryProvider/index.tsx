'use client'

import {createLiveQueryProvider} from '@sanity/preview-kit/internals/create-live-query-provider'
import dynamic from 'next/dynamic'

export type {CacheOptions, LiveQueryProviderProps, Logger} from '@sanity/preview-kit'

const GroqStoreProvider = dynamic(
  () => import('@sanity/preview-kit/internals/groq-store-provider'),
)
const LiveStoreProvider = dynamic(
  () => import('@sanity/preview-kit/internals/live-store-provider'),
)

export const LiveQueryProvider = createLiveQueryProvider({GroqStoreProvider, LiveStoreProvider})
export default LiveQueryProvider
