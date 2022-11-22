// Test that exports works when node runs in native ESM mode

const {strict: assert} = require('node:assert')

const nextSanity = require('next-sanity')
const {createClient, groq} = nextSanity

// Testing pkg.exports[.]
assert.equal(typeof createClient, 'function')
assert.equal(typeof groq, 'function')

// Testing pkg.exports[./preview]
const nextSanityPreview = require('next-sanity/preview')
const {definePreview, PreviewSuspense} = nextSanityPreview
assert.equal(typeof definePreview, 'function')
assert.equal(typeof PreviewSuspense, 'function')

// Testing pkg.exports[./studio]
const nextSanityStudio = require('next-sanity/studio')
const {
  NextStudio,
  NextStudioFallback,
  NextStudioLayout,
  NextStudioNoScript,
  NextStudioSuspense,
  usePrefersColorScheme,
  useTheme,
} = nextSanityStudio
assert.equal(typeof NextStudio?.type, 'function')
assert.equal(typeof NextStudioFallback?.type, 'function')
assert.equal(typeof NextStudioLayout?.type, 'function')
assert.equal(typeof NextStudioNoScript, 'function')
assert.equal(typeof NextStudioSuspense, 'function')
assert.equal(typeof usePrefersColorScheme, 'function')
assert.equal(typeof useTheme, 'function')

// Testing pkg.exports[./studio/head]
const nextSanityStudioHead = require('next-sanity/studio/head')
const {NextStudioHead} = nextSanityStudioHead
assert.equal(typeof NextStudioHead, 'function')

// Testing pkg.exports[./webhook]
const nextSanityWebhook = require('next-sanity/webhook')
const {config, parseBody} = nextSanityWebhook
assert.equal(typeof config, 'object')
assert.equal(typeof parseBody, 'function')

// Ensure it's possible to check what version of next-sanity is being used
const pkg = require('next-sanity/package.json')

assert.equal(typeof pkg.version, 'string')
