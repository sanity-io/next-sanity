import sanityJson from 'sanity/package.json' with {type: 'json'}
import {expect, test} from 'vitest'

import nextSanityJson from '../package.json' with {type: 'json'}

/**
 * It's important that the `history` package used by `sanity` to underpin its router is the same we use to implement hash history support
 */

test('verify that next-sanity requires the same history version as sanity', () => {
  expect(nextSanityJson.dependencies.history).toBe(sanityJson.dependencies.history)
})
