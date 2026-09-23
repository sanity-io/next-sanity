import type {BrowserCommand} from 'vitest/node'

const studioOrigin = 'http://localhost:3000'

export interface OpenPreviewResult {
  iframeOrigin: string
  popupDraftContent: string
  popupOrigin: string
  popupUrl: string
  studioOrigin: string
}

export const runOpenPreview: BrowserCommand<[], OpenPreviewResult> = async ({context}) => {
  const token = process.env['SANITY_TEST_STUDIO_AUTH_TOKEN']
  if (!token) {
    throw new Error('SANITY_TEST_STUDIO_AUTH_TOKEN is required')
  }

  const projectId = process.env['SANITY_E2E_PROJECT_ID'] || 'ppsg7ml5'
  const existingPages = new Set(context.pages())
  const studioPage = await context.newPage()

  try {
    await studioPage.addInitScript(
      ({authKey, authValue}) => {
        if (location.hostname === 'localhost') {
          localStorage.setItem(authKey, authValue)
        }
      },
      {
        authKey: `__studio_auth_token_${projectId}`,
        authValue: JSON.stringify({token, time: new Date().toISOString()}),
      },
    )
    await studioPage.goto(`${studioOrigin}/studio#/presentation`, {waitUntil: 'domcontentloaded'})

    const root = studioPage.getByTestId('presentation-root')
    try {
      await root.waitFor({state: 'visible', timeout: 60_000})
    } catch (cause) {
      const body = await studioPage.locator('body').innerText()
      throw new Error(
        `Presentation did not load at ${studioPage.url()}. Page content:\n${body.slice(0, 2_000)}`,
        {cause},
      )
    }

    const previewFrame = root.locator('iframe').first()
    await previewFrame.waitFor({state: 'attached'})
    const previewContent = previewFrame.contentFrame()
    try {
      await previewContent.getByTestId('open-preview-draft-mode').waitFor({
        state: 'visible',
        timeout: 60_000,
      })
    } catch (cause) {
      const body = await previewContent.locator('body').innerText()
      throw new Error(`Presentation preview fixture did not load. Frame content:\n${body}`, {
        cause,
      })
    }

    const iframeUrl = await previewFrame.getAttribute('src')
    if (!iframeUrl) {
      throw new Error('Presentation preview iframe has no src')
    }
    const openPreview = studioPage.getByRole('link', {name: 'Open preview'})
    await openPreview.waitFor({state: 'visible'})

    const popupPromise = context.waitForEvent('page')
    await openPreview.click()
    const popup = await popupPromise
    await popup.waitForLoadState('domcontentloaded')

    const draftContent = popup.getByTestId('open-preview-draft-mode')
    await draftContent.waitFor({state: 'visible'})

    return {
      iframeOrigin: new URL(iframeUrl).origin,
      popupDraftContent: (await draftContent.textContent()) || '',
      popupOrigin: new URL(popup.url()).origin,
      popupUrl: popup.url(),
      studioOrigin,
    }
  } finally {
    await Promise.all(
      context
        .pages()
        .filter((page) => !existingPages.has(page))
        .map((page) => page.close()),
    )
  }
}
