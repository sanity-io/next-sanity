import {vi} from 'vitest'

// `next/image` is a Client Component that reads `process.env` at module scope
// (e.g. `__NEXT_IMAGE_OPTS` and `NODE_ENV`). In a Next.js app the bundler
// injects these; in vitest browser mode we shim the global instead.
if (typeof process === 'undefined') {
  vi.stubGlobal('process', {env: {NODE_ENV: 'test'}})
}

// The dev-mode branches of `next/image` lazily `require('…/warn-once')`,
// which Next.js bundlers transform. Map those calls to `console.warn` so the
// dev-mode validation works (and stays observable) in browser tests too.
if (typeof globalThis.require === 'undefined') {
  vi.stubGlobal('require', (id: string) => {
    if (id.endsWith('/warn-once')) {
      return {warnOnce: console.warn}
    }
    throw new Error(`Unexpected require("${id}") in browser tests`)
  })
}
