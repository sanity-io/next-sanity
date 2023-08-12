'use client'

import dynamic from 'next/dynamic'

// Re-exporting in a file with `use client` ensures the component stays server-only
// and isn't preloaded in the client bundle, instead it's loaded only on demand.

export default dynamic(
  () => import('./LiveQueryReady'),
) as typeof import('./LiveQueryReady').default
