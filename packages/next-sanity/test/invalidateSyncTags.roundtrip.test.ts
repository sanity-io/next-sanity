import {invalidateSyncTags} from '@sanity/next-sanity-functions'
import {expect, test, vi} from 'vitest'

import {defineInvalidateSyncTags} from '../src/live/invalidate'

const revalidateTag = vi.hoisted(() => vi.fn())

vi.mock(import('next/cache'), async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...originalModule,
    revalidateTag,
  }
})

const secret = 'shared-secret'
const url = 'https://www.example.com/api/revalidate'

function fetchInto(handler: (request: Request) => Promise<Response>): typeof fetch {
  return async (input, init) => handler(new Request(input, init))
}

test('a payload signed by the sender is accepted by the receiver', async () => {
  const {POST} = defineInvalidateSyncTags({secret})

  const [delivery] = await invalidateSyncTags(['s1:abc', 's1:def'], {
    secret,
    urls: url,
    fetch: fetchInto(POST),
  })

  expect(delivery).toEqual({url, ok: true, status: 200})
  expect(revalidateTag.mock.calls).toEqual([
    ['sanity:s1:abc', {expire: 0}],
    ['sanity:s1:def', {expire: 0}],
  ])
})

test('a payload signed with another secret is rejected by the receiver', async () => {
  const {POST} = defineInvalidateSyncTags({secret})

  const [delivery] = await invalidateSyncTags(['s1:abc'], {
    secret: 'not-the-shared-secret',
    urls: url,
    fetch: fetchInto(POST),
  })

  expect(delivery).toEqual({url, ok: false, status: 401, error: '{"message":"Invalid signature"}'})
})
