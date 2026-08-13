import {createOverlayController, type OverlayMsg} from '@sanity/visual-editing'
import {afterEach, describe, expect, vi} from 'vitest'

import {createDataAttribute} from '../src/create-data-attribute'
import {test} from './helpers.browser'

/**
 * Presentation overlays used to `preventDefault()` + `stopPropagation()` on
 * capture-phase clicks for hovered `data-sanity` nodes. Next.js `<Link>`
 * treats that as already handled and skips `router.push`, which is why apps
 * grew capture-phase navigation workarounds.
 */
describe('visual-editing overlay clicks', () => {
  const cleanups: Array<() => void> = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.replaceChildren()
  })

  async function mountHoveredLink() {
    const messages: OverlayMsg['type'][] = []
    const overlayRoot = document.createElement('div')
    document.body.append(overlayRoot)

    const controller = createOverlayController({
      handler: (message) => {
        messages.push(message.type)
      },
      overlayElement: overlayRoot,
      inFrame: true,
      inPopUp: false,
      optimisticActorReady: false,
    })
    cleanups.push(() => controller.destroy())

    const link = document.createElement('a')
    link.href = '/projects/project-bravo'
    link.textContent = 'Project Bravo'
    link.dataset.sanity = createDataAttribute({
      id: 'project-bravo',
      type: 'project',
      path: 'title',
    }).toString()
    // Append after create() so MutationObserver registers the node while
    // `activated` is already true (avoids the IntersectionObserver race in
    // activate(), which observes before flipping that flag).
    document.body.append(link)

    await vi.waitFor(() => {
      expect(messages).toContain('element/activate')
    })

    link.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, cancelable: true}))

    return {link, messages}
  }

  test('does not cancel clicks on hovered data-sanity links', async () => {
    const {link, messages} = await mountHoveredLink()

    let bubbleReached = false
    let defaultPreventedAtBubble = true
    link.addEventListener('click', (event) => {
      bubbleReached = true
      defaultPreventedAtBubble = event.defaultPrevented
    })

    const click = new MouseEvent('click', {bubbles: true, cancelable: true})
    link.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(false)
    expect(bubbleReached).toBe(true)
    expect(defaultPreventedAtBubble).toBe(false)
    expect(messages).toContain('element/click')
    expect(messages).not.toContain('overlay/blur')
  })

  test('still blurs when clicking outside registered nodes', async () => {
    const {messages} = await mountHoveredLink()

    const outside = document.createElement('button')
    outside.type = 'button'
    outside.textContent = 'Outside'
    document.body.append(outside)

    outside.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))

    expect(messages).toContain('overlay/blur')
  })
})
