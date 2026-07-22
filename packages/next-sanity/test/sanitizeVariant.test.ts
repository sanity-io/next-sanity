import {afterEach, describe, expect, test, vi} from 'vitest'

import {sanitizeVariant} from '#live/sanitizeVariant'

const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

afterEach(() => {
  consoleWarn.mockClear()
})

describe('sanitizeVariant', () => {
  test('returns valid bare variant ids', () => {
    expect(sanitizeVariant('Ab12cd34')).toBe('Ab12cd34')
    expect(sanitizeVariant('variant-with-chars_09')).toBe('variant-with-chars_09')
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  test('trims surrounding whitespace', () => {
    expect(sanitizeVariant('  Ab12cd34  ')).toBe('Ab12cd34')
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  test('returns undefined for undefined and null without warning', () => {
    expect(sanitizeVariant(undefined)).toBeUndefined()
    expect(sanitizeVariant(null)).toBeUndefined()
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  test('returns undefined for empty strings without warning', () => {
    expect(sanitizeVariant('')).toBeUndefined()
    expect(sanitizeVariant('   ')).toBeUndefined()
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  test('returns undefined and warns for garbage strings', () => {
    expect(sanitizeVariant('not a valid variant!')).toBeUndefined()
    expect(sanitizeVariant('a,b')).toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledTimes(2)
  })

  test('returns undefined and warns for dots, including full variant document ids', () => {
    expect(sanitizeVariant('variant.with-dots')).toBeUndefined()
    expect(sanitizeVariant('_.variants.Ab12cd34')).toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledTimes(2)
  })

  test('returns undefined and warns for non-string values', () => {
    expect(sanitizeVariant(['Ab12cd34'])).toBeUndefined()
    expect(sanitizeVariant(42)).toBeUndefined()
    expect(sanitizeVariant({variant: 'Ab12cd34'})).toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledTimes(3)
  })
})
