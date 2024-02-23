'use client'

import {NextStudio} from 'next-sanity/studio'

import config from '@/sanity.config'

export default function Studio() {
  return (
    <NextStudio
      config={config}
      // Turn off login in production so that anyone can look around in the Studio and see how it works
      // eslint-disable-next-line no-process-env
      unstable_noAuthBoundary={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
    />
  )
}
