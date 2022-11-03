// Test that exports works when node runs in native ESM mode

import {strict as assert} from 'node:assert'

import {
  createClient,
  createCurrentUserHook,
  createPreviewSubscriptionHook,
  groq,
} from 'next-sanity'

// Testing pkg.exports[.]
assert.equal(typeof createClient, 'function')
assert.equal(typeof createCurrentUserHook, 'function')
assert.equal(typeof createPreviewSubscriptionHook, 'function')
assert.equal(typeof groq, 'function')

/*
// Commented out due to `next.head` not being declared in `next/package.json` exports.
// Testing pkg.exports[./studio]
import {
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
// */

/*
// Ensure it's possible to check what version of next-sanity is being used
import {version} from 'next-sanity/package.json' assert {type: 'json'}

assert.equal(typeof version, 'string')
// */
