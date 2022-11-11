'use client'

import {type UsePreview} from '@sanity/preview-kit'
import {dataset, projectId} from 'app/config'
import {definePreview} from 'src/preview'

export const usePreview: UsePreview = definePreview({
  projectId,
  dataset,
})

// Re-exporting as this file defines 'use client', which is necessary for it to be usable in a server component
export {PreviewSuspense} from 'src/preview'
