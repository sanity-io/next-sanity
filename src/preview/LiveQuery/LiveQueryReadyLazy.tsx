'use client'

import dynamic from 'next/dynamic'

// Re-exporting in a file with `use client` ensures the layout stays server-only
// when we're not in preview mode.

export default dynamic(
  () => import('./LiveQueryReady'),
) as typeof import('./LiveQueryReady').default
