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

// /*
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
// */

/*
// Ensure it's possible to check what version of next-sanity is being used
import {version} from 'next-sanity/package.json' assert {type: 'json'}

console.log(version)
// */
