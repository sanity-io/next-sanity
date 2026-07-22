'use client'

import {lazy, startTransition, Suspense, useEffect, useState} from 'react'

import type {SanityLiveProps} from './SanityLive'

const SanityLiveClientComponent = lazy(() => import('./SanityLive'))

/**
 * Renders `<SanityLive>` in the browser only, after hydration, while keeping `@sanity/client`
 * and the live event machinery in a separate chunk that's only downloaded if the component
 * actually renders (like `next/dynamic` with `ssr: false`, https://github.com/sanity-io/next-sanity/issues/3306).
 *
 * `next/dynamic` with `ssr: false` isn't used here as it works by throwing a
 * `BailoutToCSRError` during server rendering, which leaves
 * `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` markers in otherwise fully
 * prerendered HTML, and reports the suspense boundary as client-rendered:
 * https://github.com/sanity-io/next-sanity/issues/2525
 */
export function SanityLiveLazyClientComponent(props: SanityLiveProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // The transition keeps the previously committed UI (nothing) while the lazy chunk loads,
    // instead of committing the suspense fallback
    startTransition(() => setMounted(true))
  }, [])

  // On the server, and on the client during hydration, render nothing instead of throwing
  if (!mounted) return null

  return (
    <Suspense fallback={null}>
      <SanityLiveClientComponent {...props} />
    </Suspense>
  )
}
