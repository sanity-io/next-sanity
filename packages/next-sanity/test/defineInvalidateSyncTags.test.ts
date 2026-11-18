import {encodeSignatureHeader, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {defaultSignatureMaxAge, defineInvalidateSyncTags} from '../src/live/invalidate'

const revalidateTag = vi.hoisted(() => vi.fn())

vi.mock(import('next/cache'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    revalidateTag,
  }
})

const secret = 'test-secret'
const url = 'http://localhost/api/revalidate'

async function signedRequest(
  body: string,
  {
    timestamp = Date.now(),
    signingSecret = secret,
  }: {timestamp?: number; signingSecret?: string} = {},
): Promise<Request> {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [SIGNATURE_HEADER_NAME]: await encodeSignatureHeader(body, timestamp, signingSecret),
    },
    body,
  })
}

afterEach(() => {
  revalidateTag.mockClear()
})

describe('defineInvalidateSyncTags', () => {
  const {POST} = defineInvalidateSyncTags({secret})
  const body = JSON.stringify({syncTags: ['s1:abc', 's1:def']})

  test('expires the prefixed tags for a signed request', async () => {
    const response = await POST(await signedRequest(body))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      revalidated: true,
      tags: ['sanity:s1:abc', 'sanity:s1:def'],
    })
    expect(revalidateTag.mock.calls).toEqual([
      ['sanity:s1:abc', {expire: 0}],
      ['sanity:s1:def', {expire: 0}],
    ])
  })

  test('passes a custom profile to revalidateTag', async () => {
    const {POST: withProfile} = defineInvalidateSyncTags({secret, profile: 'max'})
    const response = await withProfile(await signedRequest(body))

    expect(response.status).toBe(200)
    expect(revalidateTag.mock.calls).toEqual([
      ['sanity:s1:abc', 'max'],
      ['sanity:s1:def', 'max'],
    ])
  })

  test('responds 503 when no secret is configured', async () => {
    const {POST: unconfigured} = defineInvalidateSyncTags({secret: undefined})
    const response = await unconfigured(await signedRequest(body))

    expect(response.status).toBe(503)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  test('responds 401 when the signature header is missing', async () => {
    const response = await POST(new Request(url, {method: 'POST', body}))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: `Missing ${SIGNATURE_HEADER_NAME} header`,
    })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  test('responds 401 when the signature header is malformed', async () => {
    const response = await POST(
      new Request(url, {method: 'POST', headers: {[SIGNATURE_HEADER_NAME]: 'nope'}, body}),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({message: 'Malformed signature header'})
  })

  test('responds 401 when the signature was made with another secret', async () => {
    const response = await POST(await signedRequest(body, {signingSecret: 'other-secret'}))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({message: 'Invalid signature'})
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  test('responds 401 when the body was changed after signing', async () => {
    const signed = await signedRequest(body)
    const tampered = new Request(url, {
      method: 'POST',
      headers: signed.headers,
      body: JSON.stringify({syncTags: ['s1:evil']}),
    })
    const response = await POST(tampered)

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  test('responds 401 when the signature is older than maxAge', async () => {
    const stale = Date.now() - defaultSignatureMaxAge - 1000
    const response = await POST(await signedRequest(body, {timestamp: stale}))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Signature timestamp is outside the accepted window',
    })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  test('accepts a signature within a custom maxAge', async () => {
    const {POST: lenient} = defineInvalidateSyncTags({secret, maxAge: 60 * 60 * 1000})
    const response = await lenient(
      await signedRequest(body, {timestamp: Date.now() - defaultSignatureMaxAge - 1000}),
    )

    expect(response.status).toBe(200)
  })

  test('responds 400 when the signed body is not JSON', async () => {
    const response = await POST(await signedRequest('not json'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({message: 'Request body must be JSON'})
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  test.each([
    ['missing', {}],
    ['empty', {syncTags: []}],
    ['not strings', {syncTags: [1, 2]}],
    ['not an array', {syncTags: 's1:abc'}],
    ['null body', null],
  ])('responds 400 when syncTags is %s', async (_, payload) => {
    const response = await POST(await signedRequest(JSON.stringify(payload)))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: '`syncTags` must be a non-empty array of strings',
    })
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
