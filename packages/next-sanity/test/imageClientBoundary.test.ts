import {readFileSync} from 'node:fs'

import {expect, test} from 'vitest'

const hasUseClientDirective = (path: string) =>
  /^\s*(['"])use client\1/.test(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('the client boundary is on the Image component entry, not the shared entry', () => {
  expect(hasUseClientDirective('../src/image/client-component/index.ts')).toBe(true)
  expect(hasUseClientDirective('../src/image/index.ts')).toBe(false)
  expect(hasUseClientDirective('../src/image/Image.tsx')).toBe(false)
})
