import {parseTags} from 'next-sanity/live'
import {describe, expect, test} from 'vitest'

describe('input validation', () => {
  test('throws TypeError if input is not an array', () => {
    expect(() => parseTags('not-an-array')).toThrow(TypeError)
    expect(() => parseTags(null)).toThrow(TypeError)
    expect(() => parseTags(undefined)).toThrow(TypeError)
    expect(() => parseTags(42)).toThrow(TypeError)
    expect(() => parseTags({})).toThrow(TypeError)
  })

  test('throws TypeError if array is empty', () => {
    expect(() => parseTags([])).toThrow('tags must be an non-empty array')
  })

  test('throws TypeError if array contains non-strings', () => {
    expect(() => parseTags([1, 2])).toThrow('tags must be an array of strings')
    expect(() => parseTags(['sanity:s1:abc', 123])).toThrow('tags must be an array of strings')
  })
})

describe('published tags', () => {
  test('parses a single published tag', () => {
    const result = parseTags(['sanity:s1:abc'])
    expect(result).toEqual({
      tags: ['sanity:s1:abc'],
      prefix: 'sanity:',
      prefixType: 'published',
    })
  })

  test('parses multiple published tags', () => {
    const result = parseTags(['sanity:s1:abc', 'sanity:s1:def', 'sanity:s1:ghi'])
    expect(result).toEqual({
      tags: ['sanity:s1:abc', 'sanity:s1:def', 'sanity:s1:ghi'],
      prefix: 'sanity:',
      prefixType: 'published',
    })
  })
})

describe('draft tags', () => {
  test('parses a single drafts tag', () => {
    const result = parseTags(['sanity-drafts:s1:abc'])
    expect(result).toEqual({
      tags: ['sanity-drafts:s1:abc'],
      prefix: 'sanity-drafts:',
      prefixType: 'drafts',
    })
  })

  test('parses multiple drafts tags', () => {
    const result = parseTags([
      'sanity-drafts:s1:abc',
      'sanity-drafts:s1:def',
      'sanity-drafts:s1:ghi',
    ])
    expect(result).toEqual({
      tags: ['sanity-drafts:s1:abc', 'sanity-drafts:s1:def', 'sanity-drafts:s1:ghi'],
      prefix: 'sanity-drafts:',
      prefixType: 'drafts',
    })
  })
})

describe('mixing prefixes', () => {
  test('throws when a drafts tag appears among published tags', () => {
    expect(() => parseTags(['sanity:s1:abc', 'sanity-drafts:s1:def'])).toThrow(
      'cannot mix published and drafts tags',
    )
  })

  test('throws when a published tag appears among drafts tags', () => {
    expect(() => parseTags(['sanity-drafts:s1:abc', 'sanity:s1:def'])).toThrow(
      'cannot mix published and drafts tags',
    )
  })
})

describe('unprefixed / invalid tags', () => {
  test('throws when tags have no recognized prefix', () => {
    expect(() => parseTags(['unknown:s1:abc'])).toThrow('no valid prefix found')
  })

  test('throws when an unprefixed tag appears among published tags', () => {
    expect(() => parseTags(['sanity:s1:abc', 'no-prefix'])).toThrow(
      'tag must start with a valid prefix',
    )
  })

  test('throws when an unprefixed tag appears among drafts tags', () => {
    expect(() => parseTags(['sanity-drafts:s1:abc', 'no-prefix'])).toThrow(
      'tag must start with a valid prefix',
    )
  })
})

describe('prefix boundaries', () => {
  test('does not confuse "sanity:" with "sanity-drafts:" prefix', () => {
    const result = parseTags(['sanity-drafts:s1:abc'])
    expect(result.prefixType).toBe('drafts')
  })

  test('does not treat "sanity:" as matching a "sanity-" string', () => {
    expect(() => parseTags(['sanity-other:s1:abc'])).toThrow('no valid prefix found')
  })
})
