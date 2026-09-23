import {expect, test} from 'vitest'
import {commands} from 'vitest/browser'

import type {OpenPreviewResult} from './open-preview/command'

declare module 'vitest/browser' {
  interface BrowserCommands {
    runOpenPreview: () => Promise<OpenPreviewResult>
  }
}

test('Open preview enables first-party draft mode on a cross-site frontend', async () => {
  const result = await commands.runOpenPreview()

  expect(result.studioOrigin).toBe('http://localhost:3000')
  expect(result.iframeOrigin).toBe('http://127.0.0.1:3000')
  expect(result.popupOrigin).toBe('http://127.0.0.1:3000')
  expect(result.popupUrl).toContain('sanity-preview-perspective=drafts')
  expect(result.popupDraftContent).toBe('Draft content: visible')
})
