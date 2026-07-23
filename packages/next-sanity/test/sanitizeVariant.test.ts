import {describe, expect, test, vi} from 'vitest'

import {sanitizeVariant} from '#live/sanitizeVariant'

describe('sanitizeVariant', () => {
  test('returns valid bare variant ids', () => {
    expect(sanitizeVariant('Ab12cd34')).toBe('Ab12cd34')
    expect(sanitizeVariant('variant-with-chars_09')).toBe('variant-with-chars_09')
  })

  test('trims surrounding whitespace', () => {
    expect(sanitizeVariant('  Ab12cd34  ')).toBe('Ab12cd34')
  })

  test('returns undefined for undefined and null without warning', () => {
    expect(sanitizeVariant(undefined)).toBeUndefined()
    expect(sanitizeVariant(null)).toBeUndefined()
  })

  test('returns undefined for empty strings without warning', () => {
    expect(sanitizeVariant('')).toBeUndefined()
    expect(sanitizeVariant('   ')).toBeUndefined()
  })

  test('returns undefined and warns for garbage strings', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeVariant('not a valid variant!')).toBeUndefined()
    expect(sanitizeVariant('a,b')).toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledTimes(2)
    consoleWarn.mockRestore()
  })

  test('returns undefined and warns for dots, including full variant document ids', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeVariant('variant.with-dots')).toBeUndefined()
    expect(sanitizeVariant('_.variants.Ab12cd34')).toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledTimes(2)
    consoleWarn.mockRestore()
  })

  test('returns undefined and warns for non-string values', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeVariant(['Ab12cd34'])).toBeUndefined()
    expect(sanitizeVariant(42)).toBeUndefined()
    expect(sanitizeVariant({variant: 'Ab12cd34'})).toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledTimes(3)
    consoleWarn.mockRestore()
  })
})
