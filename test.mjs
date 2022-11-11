// Test that exports works when node runs in native ESM mode

import {strict as assert} from 'node:assert'

import {createClient, groq} from 'next-sanity'

// Testing pkg.exports[.]
assert.equal(typeof createClient, 'function')
assert.equal(typeof groq, 'function')

// Testing pkg.exports[./studio]
import {
  isWorkspaces,
  isWorkspaceWithTheme,
  NextStudio,
  NextStudioGlobalStyle,
  NextStudioHead,
  NextStudioNoScript,
  ServerStyleSheetDocument,
  useBackgroundColorsFromTheme,
  useBasePath,
  useConfigWithBasePath,
  useTextFontFamilyFromTheme,
  useTheme,
} from 'next-sanity/studio'

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

// Ensure it's possible to check what version of next-sanity is being used
import pkg from 'next-sanity/package.json' assert {type: 'json'}

assert.equal(typeof pkg.version, 'string')
