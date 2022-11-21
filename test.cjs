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
  NextStudioGlobalStyle,
  NextStudioHead,
  NextStudioNoScript,
  ServerStyleSheetDocument,
  isWorkspaceWithTheme,
  isWorkspaces,
  useBackgroundColorsFromTheme,
  useBasePath,
  useConfigWithBasePath,
  useTextFontFamilyFromTheme,
  useTheme,
} = nextSanityStudio
assert.equal(typeof NextStudio?.type, 'function')
assert.equal(typeof NextStudioGlobalStyle?.type, 'function')
assert.equal(typeof NextStudioHead?.type, 'function')
assert.equal(typeof NextStudioNoScript, 'function')
assert.equal(typeof ServerStyleSheetDocument, 'function')
assert.equal(typeof isWorkspaceWithTheme, 'function')
assert.equal(typeof isWorkspaces, 'function')
assert.equal(typeof useBackgroundColorsFromTheme, 'function')
assert.equal(typeof useBasePath, 'function')
assert.equal(typeof useConfigWithBasePath, 'function')
assert.equal(typeof useTextFontFamilyFromTheme, 'function')
assert.equal(typeof useTheme, 'function')

// Testing pkg.exports[./webhook]
const nextSanityWebhook = require('next-sanity/webhook')
const {config, parseBody} = nextSanityWebhook
assert.equal(typeof config, 'object')
assert.equal(typeof parseBody, 'function')

// Ensure it's possible to check what version of next-sanity is being used
const pkg = require('next-sanity/package.json')

assert.equal(typeof pkg.version, 'string')
