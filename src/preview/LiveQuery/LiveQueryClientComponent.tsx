'use client'

import {lazy} from 'react'

// Re-exporting in a file with `use client` ensures the component stays server-only
// and isn't preloaded in the client bundle, instead it's loaded only on demand.

export default lazy(() => import('@sanity/preview-kit/internals/live-query'))
