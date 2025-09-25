/**
 * This file works around a new restriction in Next v15 where server components are not allowed
 * to use dynamic(() => import('...), {ssr: false})
 * only Client Components can set ssr: false.
 */

import dynamic from 'next/dynamic'
import type {SanityLiveStreamProps} from './SanityLiveStream'

const SanityLiveStreamClientComponent = dynamic(() => import('./SanityLiveStream'), {ssr: false})

export function SanityLiveStreamLazyClientComponent(props: SanityLiveStreamProps): React.ReactNode {
  return <SanityLiveStreamClientComponent {...props} />
}
