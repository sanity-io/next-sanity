import {createRequire} from 'node:module'

import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {describe, expect, test} from 'vitest'

const require = createRequire(import.meta.url)
// oxlint-disable-next-line no-unsafe-type-assertion -- CJS compiled Next cookie helpers
const {parseCookie, RequestCookies, ResponseCookies} =
  require('next/dist/compiled/@edge-runtime/cookies') as typeof import('next/dist/compiled/@edge-runtime/cookies')

const attrs = {
  httpOnly: true,
  path: '/',
  secure: true,
  sameSite: 'none' as const,
}

describe('Next ResponseCookies / RequestCookies vs CHIPS dual-write', () => {
  test('ResponseCookies.set collapses same name/domain/path cookies that differ only by Partitioned', () => {
    const partitionedThenPlain = new Headers()
    const partitionedThenPlainJar = new ResponseCookies(partitionedThenPlain)
    partitionedThenPlainJar.set({
      name: '__prerender_bypass',
      value: 'chips',
      ...attrs,
      partitioned: true,
    })
    partitionedThenPlainJar.set({
      name: '__prerender_bypass',
      value: 'plain',
      ...attrs,
      partitioned: false,
    })

    expect(partitionedThenPlain.getSetCookie()).toEqual([
      '__prerender_bypass=plain; Path=/; Secure; HttpOnly; SameSite=none',
    ])
    expect(partitionedThenPlainJar.getAll('__prerender_bypass')).toHaveLength(1)
    expect(partitionedThenPlainJar.get('__prerender_bypass')).toMatchObject({
      value: 'plain',
      partitioned: false,
    })

    const plainThenPartitioned = new Headers()
    const plainThenPartitionedJar = new ResponseCookies(plainThenPartitioned)
    plainThenPartitionedJar.set({
      name: '__prerender_bypass',
      value: 'plain',
      ...attrs,
      partitioned: false,
    })
    plainThenPartitionedJar.set({
      name: '__prerender_bypass',
      value: 'chips',
      ...attrs,
      partitioned: true,
    })

    expect(plainThenPartitioned.getSetCookie()).toEqual([
      '__prerender_bypass=chips; Path=/; Secure; HttpOnly; SameSite=none; Partitioned',
    ])
    expect(plainThenPartitionedJar.get('__prerender_bypass')).toMatchObject({
      value: 'chips',
      partitioned: true,
    })
  })

  test('constructing ResponseCookies from two same-name Set-Cookie lines keeps one map entry (last parse wins)', () => {
    const headers = new Headers()
    headers.append(
      'set-cookie',
      '__prerender_bypass=chips; Path=/; Secure; HttpOnly; SameSite=none; Partitioned',
    )
    headers.append(
      'set-cookie',
      '__prerender_bypass=plain; Path=/; Secure; HttpOnly; SameSite=none',
    )

    expect(headers.getSetCookie()).toHaveLength(2)

    const jar = new ResponseCookies(headers)
    expect(jar.getAll('__prerender_bypass')).toHaveLength(1)
    expect(jar.get('__prerender_bypass')?.value).toBe('plain')

    // A later set() rewrites every Set-Cookie from the name-keyed map.
    jar.set({
      name: 'sanity-preview-partitioned',
      value: '1',
      ...attrs,
      partitioned: true,
    })
    expect(headers.getSetCookie()).toEqual([
      '__prerender_bypass=plain; Path=/; Secure; HttpOnly; SameSite=none',
      'sanity-preview-partitioned=1; Path=/; Secure; HttpOnly; SameSite=none; Partitioned',
    ])
  })

  test('RequestCookies and parseCookie keep the last duplicate Cookie name, so mixed jars cannot stay coherent', () => {
    const cookie = [
      `__prerender_bypass=plain`,
      `${perspectiveCookieName}=drafts`,
      `__prerender_bypass=chips`,
      `${perspectiveCookieName}=published`,
    ].join('; ')

    expect([...parseCookie(cookie).entries()]).toEqual([
      ['__prerender_bypass', 'chips'],
      [perspectiveCookieName, 'published'],
    ])

    const request = new RequestCookies(new Headers({cookie}))
    expect(request.size).toBe(2)
    expect(request.getAll()).toHaveLength(2)
    expect(request.getAll('__prerender_bypass')).toEqual([
      {name: '__prerender_bypass', value: 'chips'},
    ])
    expect(request.get(perspectiveCookieName)?.value).toBe('published')
  })
})
