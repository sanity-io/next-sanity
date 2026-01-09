'use client'

import dynamic from 'next/dynamic'

import type {SanityLiveProps} from './SanityLive'
export const SanityLive: React.ComponentType<SanityLiveProps> = dynamic(
  () => import('./SanityLive'),
  {ssr: false},
)
