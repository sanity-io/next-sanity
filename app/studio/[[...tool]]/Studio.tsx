'use client'

import {use} from 'react'
import {NextStudio} from 'src/studio'

export default function Studio() {
  const {default: config} = use(import('sanity.config'))
  return (
    <NextStudio
      config={config}
      // Turn off login in production so that anyone can look around in the Studio and see how it works
      // eslint-disable-next-line no-process-env
      unstable_noAuthBoundary={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
    />
  )
}
