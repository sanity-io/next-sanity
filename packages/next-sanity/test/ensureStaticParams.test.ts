import {ensureStaticParams} from 'next-sanity/static-params'
import {expect, expectTypeOf, test} from 'vitest'

test('passes a non-empty list through untouched', () => {
  const params = [{slug: 'a'}, {slug: 'b'}]
  expect(ensureStaticParams(params, {slug: '_'})).toBe(params)
})

test('returns the fallback for an empty list, null, and undefined', () => {
  const empty: {slug: string}[] = []
  expect(ensureStaticParams(empty, {slug: '_'})).toEqual([{slug: '_'}])
  expect(ensureStaticParams(null, {slug: '_'})).toEqual([{slug: '_'}])
  expect(ensureStaticParams(undefined, {slug: '_'})).toEqual([{slug: '_'}])
})

test('infers the param shape from the list, not the fallback', () => {
  const result = ensureStaticParams([{article: 'a', section: ['s']}], {
    article: '_',
    section: ['_'],
  })
  expectTypeOf(result).toEqualTypeOf<{article: string; section: string[]}[]>()
  // @ts-expect-error the fallback must match the list's shape
  ensureStaticParams([{article: 'a'}], {slug: '_'})
})
