'use client'

import config from 'sanity.config'
import {NextStudioLoading} from 'src/studio/loading'

export default function Loading() {
  return <NextStudioLoading config={config} />
}
