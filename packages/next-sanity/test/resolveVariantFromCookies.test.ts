import {variantCookieName} from '@sanity/preview-url-secret/constants'
import type {cookies} from 'next/headers'
import {describe, expect, test, vi} from 'vitest'

import {resolveVariantFromCookies} from '#live/resolveVariantFromCookies'

function createCookieJar(variant: string | null) {
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {
    has: (key: string) => key === variantCookieName && variant !== null,
    get: (key: string) =>
      key === variantCookieName && variant !== null ? {value: variant} : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>
}

describe('resolveVariantFromCookies', () => {
  test('returns the variant when the cookie is set', async () => {
    await expect(resolveVariantFromCookies({cookies: createCookieJar('Ab12cd34')})).resolves.toBe(
      'Ab12cd34',
    )
  })

  test('returns undefined when the cookie is absent', async () => {
    await expect(resolveVariantFromCookies({cookies: createCookieJar(null)})).resolves.toBe(
      undefined,
    )
  })

  test('returns undefined when the cookie value is invalid', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(
      resolveVariantFromCookies({cookies: createCookieJar('not a valid variant!')}),
    ).resolves.toBe(undefined)
    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })

  test('returns undefined when the cookie value is empty', async () => {
    await expect(resolveVariantFromCookies({cookies: createCookieJar('')})).resolves.toBe(undefined)
  })
})
