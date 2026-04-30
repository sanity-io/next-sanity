'use client'

import dynamic from 'next/dynamic'

import type {SanityLiveProps} from './SanityLive'
/**
 * @alpha CAUTION: this is an internal component and does not follow semver. Using it directly is at your own risk.
 */
export const SanityLive: React.ComponentType<SanityLiveProps> = dynamic(
  () => import('./SanityLive'),
  {ssr: false},
)
