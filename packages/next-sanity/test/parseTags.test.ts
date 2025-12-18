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

describe('prefixed tags', () => {
  test('parses a single prefixed tag', () => {
    const result = parseTags(['sanity:s1:abc'])
    expect(result).toEqual({
      tags: ['sanity:s1:abc'],
      tagsWithoutPrefix: ['s1:abc'],
      prefix: 'sanity:',
    })
  })

  test('parses multiple prefixed tags', () => {
    const result = parseTags(['sanity:s1:abc', 'sanity:s1:def', 'sanity:s1:ghi'])
    expect(result).toEqual({
      tags: ['sanity:s1:abc', 'sanity:s1:def', 'sanity:s1:ghi'],
      tagsWithoutPrefix: ['s1:abc', 's1:def', 's1:ghi'],
      prefix: 'sanity:',
    })
  })
})

describe('unprefixed / invalid tags', () => {
  test('throws when tags have unknown prefixes', () => {
    expect(() => parseTags(['unknown:s1:abc'])).toThrow('tag must start with a valid prefix')
    expect(() => parseTags(['sanity-drafts:s1:abc'])).toThrow('tag must start with a valid prefix')
  })

  test('throws when an unprefixed tag appears among valid tags', () => {
    expect(() => parseTags(['sanity:s1:abc', 'no-prefix'])).toThrow(
      'tag must start with a valid prefix',
    )
  })
})
