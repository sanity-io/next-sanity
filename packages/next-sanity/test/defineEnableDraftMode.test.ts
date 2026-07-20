import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {partitionedCookieName} from '#live/constants'

const cookieSet = vi.fn()
const cookieHas = vi.fn()
const cookieGet = vi.fn()
const draftModeEnable = vi.fn()
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
const validatePreviewUrl = vi.fn()
const refreshMock = vi.fn()

let isDraftMode = false
let perspectiveCookieValue: string | null = null
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
  if (key === partitionedCookieName) {
    return hasPartitionedFlag ? {value: '1'} : undefined
  }
  return undefined
})

beforeEach(() => {
  isDraftMode = false
  perspectiveCookieValue = null
  hasPartitionedFlag = false
  bypassCookieValue = 'bypass-secret'
  cookieSet.mockClear()
  cookieHas.mockClear()
  cookieGet.mockClear()
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
