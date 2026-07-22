import {perspectiveCookieName, variantCookieName} from '@sanity/preview-url-secret/constants'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {partitionedCookieName} from '#live/constants'

const cookieSet = vi.fn()
const cookieHas = vi.fn()
const cookieGet = vi.fn()
const cookieDelete = vi.fn()
const draftModeEnable = vi.fn()
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
const validatePreviewUrl = vi.fn()
const refreshMock = vi.fn()

let isDraftMode = false
let perspectiveCookieValue: string | null = null
let variantCookieValue: string | null = null
let hasPartitionedFlag = false
let bypassCookieValue = 'bypass-secret'

vi.mock(import('next/headers'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    cookies: vi.fn(
      async () =>
        // oxlint-disable-next-line no-unsafe-type-assertion
        ({
          has: cookieHas,
          get: cookieGet,
          set: cookieSet,
          delete: cookieDelete,
        }) as unknown as Awaited<ReturnType<(typeof originalModule)['cookies']>>,
    ),
    draftMode: vi.fn(async () => ({
      get isEnabled() {
        return isDraftMode
      },
      enable: draftModeEnable.mockImplementation(() => {
        isDraftMode = true
      }),
      disable: vi.fn(() => {
        isDraftMode = false
      }),
    })),
  }
})

vi.mock(import('next/navigation'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    redirect: redirectMock,
  }
})

vi.mock(import('@sanity/preview-url-secret'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    validatePreviewUrl,
  }
})

vi.mock(import('next/cache'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    refresh: refreshMock,
  }
})

cookieHas.mockImplementation((key: string) => {
  if (key === perspectiveCookieName) {
    return perspectiveCookieValue !== null
  }
  if (key === variantCookieName) {
    return variantCookieValue !== null
  }
  if (key === partitionedCookieName) {
    return hasPartitionedFlag
  }
  return false
})

cookieGet.mockImplementation((key: string) => {
  if (key === '__prerender_bypass') {
    return {value: bypassCookieValue}
  }
  if (key === perspectiveCookieName) {
    return perspectiveCookieValue === null ? undefined : {value: perspectiveCookieValue}
  }
  if (key === variantCookieName) {
    return variantCookieValue === null ? undefined : {value: variantCookieValue}
  }
  if (key === partitionedCookieName) {
    return hasPartitionedFlag ? {value: '1'} : undefined
  }
  return undefined
})

beforeEach(() => {
  isDraftMode = false
  perspectiveCookieValue = null
  variantCookieValue = null
  hasPartitionedFlag = false
  bypassCookieValue = 'bypass-secret'
  cookieSet.mockClear()
  cookieHas.mockClear()
  cookieGet.mockClear()
  cookieDelete.mockClear()
  draftModeEnable.mockClear()
  redirectMock.mockClear()
  validatePreviewUrl.mockReset()
  refreshMock.mockClear()
  validatePreviewUrl.mockResolvedValue({
    isValid: true,
    redirectTo: '/preview',
    studioPreviewPerspective: 'drafts',
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

function createRequest(headers?: Record<string, string>) {
  return new Request('https://example.com/api/draft-mode/enable?sanity-preview-secret=secret', {
    headers,
  })
}

describe('defineEnableDraftMode', () => {
  test('sets Partitioned cookies and flag cookie for cross-site iframe in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    await expect(
      GET(
        createRequest({
          'sec-fetch-dest': 'iframe',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/preview')

    expect(draftModeEnable).toHaveBeenCalledOnce()
    expect(cookieSet).toHaveBeenCalledWith({
      name: '__prerender_bypass',
      value: 'bypass-secret',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(cookieSet).toHaveBeenCalledWith({
      name: perspectiveCookieName,
      value: 'drafts',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(cookieSet).toHaveBeenCalledWith({
      name: partitionedCookieName,
      value: '1',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
  })

  test('does not partition cookies for top-level document requests', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    await expect(
      GET(
        createRequest({
          'sec-fetch-dest': 'document',
          'sec-fetch-site': 'none',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/preview')

    expect(cookieSet).toHaveBeenCalledWith({
      name: '__prerender_bypass',
      value: 'bypass-secret',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: false,
    })
    expect(cookieSet).toHaveBeenCalledWith({
      name: perspectiveCookieName,
      value: 'drafts',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: false,
    })
    expect(cookieSet.mock.calls.some((call) => call[0]?.name === partitionedCookieName)).toBe(false)
  })

  test('does not partition cookies when Sec-Fetch headers are missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    await expect(GET(createRequest())).rejects.toThrow('REDIRECT:/preview')

    expect(cookieSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '__prerender_bypass',
        partitioned: false,
      }),
    )
    expect(cookieSet.mock.calls.some((call) => call[0]?.name === partitionedCookieName)).toBe(false)
  })

  test('uses SameSite=Lax without Partitioned in insecure development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    await expect(
      GET(
        createRequest({
          'sec-fetch-dest': 'iframe',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/preview')

    expect(cookieSet).toHaveBeenCalledWith({
      name: '__prerender_bypass',
      value: 'bypass-secret',
      httpOnly: true,
      path: '/',
      secure: false,
      sameSite: 'lax',
      partitioned: false,
    })
    expect(cookieSet.mock.calls.some((call) => call[0]?.name === partitionedCookieName)).toBe(false)
  })

  test('secureDevMode enables secure partitioned cookies in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
      secureDevMode: true,
    })

    await expect(
      GET(
        createRequest({
          'sec-fetch-dest': 'iframe',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/preview')

    expect(cookieSet).toHaveBeenCalledWith({
      name: '__prerender_bypass',
      value: 'bypass-secret',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(cookieSet).toHaveBeenCalledWith({
      name: partitionedCookieName,
      value: '1',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
  })

  test('returns 401 when the preview secret is invalid', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    validatePreviewUrl.mockResolvedValue({isValid: false})
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    const response = await GET(createRequest())
    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Invalid secret')
    expect(cookieSet).not.toHaveBeenCalled()
  })

  test('sets the variant cookie when the studio provides a variant', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    validatePreviewUrl.mockResolvedValue({
      isValid: true,
      redirectTo: '/preview',
      studioPreviewPerspective: 'drafts',
      studioPreviewVariant: 'Ab12cd34',
    })
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    await expect(
      GET(
        createRequest({
          'sec-fetch-dest': 'iframe',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/preview')

    expect(cookieSet).toHaveBeenCalledWith({
      name: variantCookieName,
      value: 'Ab12cd34',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(cookieDelete).not.toHaveBeenCalled()
  })

  test('deletes the variant cookie when the studio provides no variant', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    variantCookieValue = 'stale-variant'
    const {defineEnableDraftMode} = await import('../src/draft-mode/define-enable-draft-mode')
    const {GET} = defineEnableDraftMode({
      // oxlint-disable-next-line no-unsafe-type-assertion
      client: {} as never,
    })

    await expect(
      GET(
        createRequest({
          'sec-fetch-dest': 'iframe',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/preview')

    expect(cookieSet.mock.calls.some((call) => call[0]?.name === variantCookieName)).toBe(false)
    expect(cookieDelete).toHaveBeenCalledWith({
      name: variantCookieName,
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
  })
})

describe('perspectiveChangeAction', () => {
  test('sets Partitioned on the perspective cookie when the flag cookie is present', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    hasPartitionedFlag = true
    const {perspectiveChangeAction} = await import('../src/visual-editing/server-actions')

    await perspectiveChangeAction('published')

    expect(cookieSet).toHaveBeenCalledWith(perspectiveCookieName, 'published', {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  test('keeps the perspective cookie unpartitioned when the flag cookie is absent', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    hasPartitionedFlag = false
    const {perspectiveChangeAction} = await import('../src/visual-editing/server-actions')

    await perspectiveChangeAction('published')

    expect(cookieSet).toHaveBeenCalledWith(perspectiveCookieName, 'published', {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: false,
    })
    expect(refreshMock).toHaveBeenCalledOnce()
  })
})

describe('variantChangeAction', () => {
  test('sets Partitioned on the variant cookie when the flag cookie is present', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    hasPartitionedFlag = true
    const {variantChangeAction} = await import('../src/visual-editing/server-actions')

    await variantChangeAction('Ab12cd34')

    expect(cookieSet).toHaveBeenCalledWith(variantCookieName, 'Ab12cd34', {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  test('keeps the variant cookie unpartitioned when the flag cookie is absent', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    hasPartitionedFlag = false
    const {variantChangeAction} = await import('../src/visual-editing/server-actions')

    await variantChangeAction('Ab12cd34')

    expect(cookieSet).toHaveBeenCalledWith(variantCookieName, 'Ab12cd34', {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: false,
    })
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  test('deletes the variant cookie when the variant is cleared', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    variantCookieValue = 'Ab12cd34'
    hasPartitionedFlag = true
    const {variantChangeAction} = await import('../src/visual-editing/server-actions')

    await variantChangeAction(undefined)

    expect(cookieSet).not.toHaveBeenCalled()
    expect(cookieDelete).toHaveBeenCalledWith({
      name: variantCookieName,
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  test('is a no-op when the variant is cleared and no cookie exists', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const {variantChangeAction} = await import('../src/visual-editing/server-actions')

    await variantChangeAction(undefined)

    expect(cookieSet).not.toHaveBeenCalled()
    expect(cookieDelete).not.toHaveBeenCalled()
    expect(refreshMock).not.toHaveBeenCalled()
  })

  test('skips when the variant is unchanged outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    variantCookieValue = 'Ab12cd34'
    const {variantChangeAction} = await import('../src/visual-editing/server-actions')

    await variantChangeAction('Ab12cd34')

    expect(cookieSet).not.toHaveBeenCalled()
    expect(refreshMock).not.toHaveBeenCalled()
    consoleDebug.mockRestore()
  })

  test('ignores invalid variants', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    variantCookieValue = 'Ab12cd34'
    hasPartitionedFlag = false
    const {variantChangeAction} = await import('../src/visual-editing/server-actions')

    // An invalid variant is sanitized to `undefined`, which clears the stale cookie
    await variantChangeAction('not a valid variant!')

    expect(cookieSet).not.toHaveBeenCalled()
    expect(cookieDelete).toHaveBeenCalledWith({
      name: variantCookieName,
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: false,
    })
    expect(refreshMock).toHaveBeenCalledOnce()
    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })
})
