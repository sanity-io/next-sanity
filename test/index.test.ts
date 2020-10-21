import * as exported from '../src'

const expected = ['createClient', 'createImageUrlBuilder', 'createPreviewSubscriptionHook', 'groq']

test('index: provides all expected exports', () => {
  expected.forEach((thing) => {
    expect(Object.keys(exported)).toContain(thing)
  })
})
