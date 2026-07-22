'use client'

import dynamic from 'next/dynamic'
import {startTransition, useEffect, useState} from 'react'

import type {SanityLiveProps} from './SanityLive'

const SanityLiveClientComponent: React.ComponentType<SanityLiveProps> = dynamic(
  () => import('./SanityLive'),
  {ssr: false},
)

/**
 * Renders `<SanityLive>` in the browser only, after hydration. `next/dynamic` with
 * `ssr: false` keeps `@sanity/client` and the live event machinery in a separate chunk
 * that's only downloaded if the component actually renders
 * (https://github.com/sanity-io/next-sanity/issues/3306), and gives the Next.js bundler
 * better optimization opportunities than `React.lazy`.
 *
 * The mount gate exists because `next/dynamic` implements `ssr: false` by throwing a
 * `BailoutToCSRError` during server rendering, which leaves
 * `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` markers (empty,
 * client-rendered suspense boundaries) in otherwise fully prerendered HTML:
 * https://github.com/sanity-io/next-sanity/issues/2525
 * Gated behind the mount check the component only ever renders in the browser,
 * where `next/dynamic` doesn't throw.
 */
export function SanityLiveLazyClientComponent(props: SanityLiveProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // The transition keeps the previously committed UI (nothing) while the lazy chunk loads,
    // instead of committing the suspense fallback of `next/dynamic`'s own suspense boundary
    startTransition(() => setMounted(true))
  }, [])

  // On the server, and on the client during hydration, render nothing instead of throwing
  if (!mounted) return null

  return <SanityLiveClientComponent {...props} />
}
