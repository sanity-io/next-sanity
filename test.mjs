// Test that exports works when node runs in native ESM mode

import {strict as assert} from 'node:assert'

import {createClient, groq} from 'next-sanity'

// Testing pkg.exports[.]
assert.equal(typeof createClient, 'function')
assert.equal(typeof groq, 'function')

// Testing pkg.exports[./preview]
import {LiveQueryProvider, useLiveQuery} from 'next-sanity/preview'

assert.equal(typeof LiveQueryProvider, 'object')
assert.equal(typeof useLiveQuery, 'function')

// Testing pkg.exports[./studio]
import {NextStudio, NextStudioLayout, NextStudioNoScript} from 'next-sanity/studio'

assert.equal(typeof NextStudio?.type, 'function')
assert.equal(typeof NextStudioLayout?.type, 'function')
assert.equal(typeof NextStudioNoScript, 'function')

// Testing pkg.exports[./webhook]
import {config, parseBody} from 'next-sanity/webhook'
assert.equal(typeof config, 'object')
assert.equal(typeof parseBody, 'function')

// Ensure it's possible to check what version of next-sanity is being used
import pkg from 'next-sanity/package.json' assert {type: 'json'}

assert.equal(typeof pkg.version, 'string')
