// Test that exports works when node runs in native ESM mode

const {strict: assert} = require('node:assert')

const nextSanity = require('next-sanity')
const {createClient, groq} = nextSanity

// Testing pkg.exports[.]
assert.equal(typeof createClient, 'function')
assert.equal(typeof groq, 'function')

// Testing pkg.exports[./preview]
const nextSanityPreview = require('next-sanity/preview')
const {LiveQueryProvider, useLiveQuery} = nextSanityPreview
assert.equal(typeof LiveQueryProvider, 'object')
assert.equal(typeof useLiveQuery, 'function')

// Testing pkg.exports[./studio]
const nextSanityStudio = require('next-sanity/studio')
const {
  NextStudio,
  NextStudioClientOnly,
  NextStudioLayout,
  NextStudioNoScript,
  usePrefersColorScheme,
  useTheme,
} = nextSanityStudio
assert.equal(typeof NextStudio?.type, 'function')
assert.equal(typeof NextStudioClientOnly, 'function')
assert.equal(typeof NextStudioLayout?.type, 'function')
assert.equal(typeof NextStudioNoScript, 'function')
assert.equal(typeof usePrefersColorScheme, 'function')
assert.equal(typeof useTheme, 'function')

// Testing pkg.exports[./studio/loading]
const nextSanityStudioLoading = require('next-sanity/studio/loading')
const {NextStudioLoading} = nextSanityStudioLoading
assert.equal(typeof NextStudioLoading, 'function')

// Testing pkg.exports[./webhook]
const nextSanityWebhook = require('next-sanity/webhook')
const {config, parseBody} = nextSanityWebhook
assert.equal(typeof config, 'object')
assert.equal(typeof parseBody, 'function')

// Ensure it's possible to check what version of next-sanity is being used
const pkg = require('next-sanity/package.json')

assert.equal(typeof pkg.version, 'string')
