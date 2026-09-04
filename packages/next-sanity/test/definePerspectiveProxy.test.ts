import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {NextRequest} from 'next/server'
import {describe, expect, test} from 'vitest'

import {definePerspectiveProxy} from '../src/live/proxy'

const proxy = definePerspectiveProxy()

function rewriteTarget(pathname: string, cookies: Record<string, string> = {}): string {
  const request = new NextRequest(`https://example.com${pathname}`)
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value)
  }
  const rewrite = proxy(request).headers.get('x-middleware-rewrite')
  if (!rewrite) {
    throw new Error('expected a rewrite response')
  }
  return new URL(rewrite).pathname
}

describe('definePerspectiveProxy', () => {
  test('rewrites into the published tree when no cookies are set', () => {
    expect(rewriteTarget('/about')).toBe('/published/about')
  })

  test('rewrites the root into the published segment without a trailing slash', () => {
    expect(rewriteTarget('/')).toBe('/published')
  })

  test('rewrites into drafts when only the draft mode bypass cookie is set', () => {
    expect(rewriteTarget('/about', {__prerender_bypass: 'x'})).toBe('/drafts/about')
  })

  test('joins a release stack into one segment', () => {
    expect(
      rewriteTarget('/about', {__prerender_bypass: 'x', [perspectiveCookieName]: 'r1,r2'}),
    ).toBe('/r1,r2/about')
  })

  test('ignores the perspective cookie without the draft mode bypass cookie', () => {
    expect(rewriteTarget('/about', {[perspectiveCookieName]: 'drafts'})).toBe('/published/about')
  })

  test.each(['../api/x', 'foo/bar', 'a b', 'raw'])(
    'falls back to drafts for the cookie value %j',
    (value) => {
      expect(
        rewriteTarget('/about', {__prerender_bypass: 'x', [perspectiveCookieName]: value}),
      ).toBe('/drafts/about')
    },
  )
})
