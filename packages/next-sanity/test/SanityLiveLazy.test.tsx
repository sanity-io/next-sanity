import {expect, test, vi} from 'vitest'

import {SanityLive} from '../src/live/client-components'
import {apiVersion, dataset, projectId, renderToString} from './helpers'

/**
 * In the App Router the Next.js compiler aliases `next/dynamic` to
 * `next/dist/shared/lib/app-dynamic.js`, where `ssr: false` works by throwing a
 * `BailoutToCSRError` during server rendering. Mimic that resolution so this test
 * exercises what would happen in Next.js if the wrapper regressed to
 * `dynamic(() => import('./SanityLive'), {ssr: false})`.
 */
vi.mock('next/dynamic', async () => {
  const mod = await import('next/dist/shared/lib/app-dynamic.js')
  return {default: mod.default}
})

// Regression test for https://github.com/sanity-io/next-sanity/issues/2525
// `next/dynamic` with `ssr: false` throws a `BailoutToCSRError` during server rendering,
// which leaves `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` markers
// (empty, client-rendered suspense boundaries) in otherwise fully prerendered HTML.
test('prerenders to nothing, without bailing out to client-side rendering', async () => {
  const html = await renderToString(
    <main>
      <SanityLive
        action="refresh"
        config={{
          projectId,
          dataset,
          apiVersion,
          apiHost: undefined,
          useProjectHostname: undefined,
        }}
        includeDrafts={undefined}
        onError={undefined}
        onGoAway={undefined}
        onReconnect={undefined}
        onRestart={undefined}
        onWelcome={false}
        requestTag="next-loader.live"
        waitFor={undefined}
      />
    </main>,
  )
  expect(html).not.toContain('BAILOUT_TO_CLIENT_SIDE_RENDERING')
  expect(html).toBe('<main></main>')
})
