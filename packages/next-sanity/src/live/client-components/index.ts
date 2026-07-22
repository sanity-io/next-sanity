'use client'

import type {SanityLiveProps} from './SanityLive'
import {SanityLiveLazyClientComponent} from './SanityLiveLazy'

/**
 * @internal CAUTION: this is an internal component and does not follow semver. Using it directly is at your own risk.
 */
export const SanityLive: React.ComponentType<SanityLiveProps> = SanityLiveLazyClientComponent
