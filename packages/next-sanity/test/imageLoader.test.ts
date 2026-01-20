import {imageLoader} from 'next-sanity/image'
import {expect, test} from 'vitest'

test('adds basic width and format parameters', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg',
    width: 800,
    quality: undefined,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?auto=format&fit=max&w=800',
  )
})

test('preserves existing URL parameters', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg?blur=50',
    width: 800,
    quality: undefined,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?blur=50&auto=format&fit=max&w=800',
  )
})

test('adds quality parameter when specified', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg',
    width: 800,
    quality: 75,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?auto=format&fit=max&w=800&q=75',
  )
})

test('uses min fit when height parameter exists', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg?h=600',
    width: 800,
    quality: undefined,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?h=600&auto=format&fit=min&w=800',
  )
})

test('calculates proportional height when both width and height exist', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg?w=1000&h=500',
    width: 800,
    quality: undefined,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?w=800&h=400&auto=format&fit=min',
  )
})

test('respects existing fit parameter', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg?fit=crop',
    width: 800,
    quality: undefined,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?fit=crop&auto=format&w=800',
  )
})

test('handles URLs with hash fragments', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg#fragment',
    width: 800,
    quality: undefined,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?auto=format&fit=max&w=800#fragment',
  )
})

test('handles complex URLs with multiple parameters', () => {
  const result = imageLoader({
    src: 'https://cdn.sanity.io/images/project/dataset/image.jpg?blur=50&sat=-100&w=1000&h=500',
    width: 800,
    quality: 90,
  })

  expect(result).toBe(
    'https://cdn.sanity.io/images/project/dataset/image.jpg?blur=50&sat=-100&w=800&h=400&auto=format&fit=min&q=90',
  )
})
