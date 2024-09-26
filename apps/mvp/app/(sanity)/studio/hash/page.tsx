import {NextStudio} from 'next-sanity/studio'

import config from '@/sanity.config'

export const dynamic = 'force-static'

export default function StudioPage() {
  return (
    <NextStudio
      config={config}
      basePath={`${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/studio/hash`}
    />
  )
}
