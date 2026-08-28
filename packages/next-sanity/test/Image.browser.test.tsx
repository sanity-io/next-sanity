/**
 * Real-DOM coverage of `next-sanity/image`, complementing the server-rendering
 * matrix in `Image.test.tsx` with the interactive behavior that only exists in
 * the browser: load and error events, blur placeholder removal, alt text
 * reveal, preload link injection and ref forwarding.
 *
 * The Sanity Image CDN is mocked in `mocks/browser.ts`, which serves a real
 * 1x1 PNG so the browser goes through genuine fetch/decode work.
 */
import {Image} from 'next-sanity/image'
import {createRef} from 'react'
import {describe, expect, vi} from 'vitest'
import {render} from 'vitest-browser-react'

import {test} from './helpers.browser'
import {sanityImageUrl} from './helpers.image'

const blurDataURL = 'data:image/jpeg;base64,SGVsbG8='

function queryImg(container: HTMLElement): HTMLImageElement {
  const img = container.querySelector('img')
  if (!img) throw new Error('Expected an <img> element to be rendered')
  return img
}

describe('loading', () => {
  test('loads the image from the CDN and fires onLoad exactly once', async () => {
    const onLoad = vi.fn<React.ReactEventHandler<HTMLImageElement>>()
    const screen = await render(
      <Image
        src={sanityImageUrl('loads-2000x1000.jpg')}
        width={800}
        height={400}
        loading="eager"
        onLoad={onLoad}
        alt="Loads"
      />,
    )
    const img = queryImg(screen.container)

    await vi.waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1))

    expect(img.complete).toBe(true)
    // Headless Chromium runs at devicePixelRatio 1, so the browser picks the
    // 1x candidate from the srcset instead of the src attribute (2x)
    expect(img.currentSrc).toContain('w=828')
    const event = onLoad.mock.calls[0]?.[0]
    expect(event?.target).toBe(img)
    // onLoad only fires again for a new src, not on unrelated re-renders
    await screen.rerender(
      <Image
        src={sanityImageUrl('loads-2000x1000.jpg')}
        width={800}
        height={400}
        loading="eager"
        onLoad={onLoad}
        alt="Loads again"
      />,
    )
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  test('lazy loads by default', async () => {
    const screen = await render(
      <Image src={sanityImageUrl('lazy-2000x1000.jpg')} width={800} height={400} alt="" />,
    )
    const img = queryImg(screen.container)

    expect(img.loading).toBe('lazy')
    expect(img.decoding).toBe('async')
  })

  test('renders the fetchpriority attribute in the DOM', async () => {
    const screen = await render(
      <Image
        src={sanityImageUrl('fetchpriority-dom-2000x1000.jpg')}
        width={800}
        height={400}
        fetchPriority="high"
        alt=""
      />,
    )
    const img = queryImg(screen.container)

    expect(img.getAttribute('fetchpriority')).toBe('high')
  })
})

describe('blur placeholder', () => {
  test('shows the blur placeholder while loading and removes it after load', async () => {
    const screen = await render(
      <Image
        // The mock delays `slow-*` responses so the loading state is observable
        src={sanityImageUrl('slow-blur-2000x1000.jpg')}
        width={800}
        height={400}
        loading="eager"
        placeholder="blur"
        blurDataURL={blurDataURL}
        alt=""
      />,
    )
    const img = queryImg(screen.container)

    expect(img.style.backgroundImage).toContain('data:image/svg+xml')

    await vi.waitFor(() => expect(img.style.backgroundImage).toBe(''), {timeout: 5000})
  })
})

describe('error handling', () => {
  test('fires onError and reveals the alt text when the image fails to load', async () => {
    const onError = vi.fn()
    const screen = await render(
      <Image
        // The mock responds with a 404 for `missing-*` filenames
        src={sanityImageUrl('missing-2000x1000.jpg')}
        width={800}
        height={400}
        loading="eager"
        onError={onError}
        alt="Broken image"
      />,
    )
    const img = queryImg(screen.container)

    // The alt text is hidden with a transparent color while loading
    expect(img.style.color).toBe('transparent')

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    // After the error, next/image removes the transparent color so the
    // alt text becomes visible
    await vi.waitFor(() => expect(img.style.color).toBe(''))
  })
})

describe('preload', () => {
  test('priority injects a preload link into the document head', async () => {
    const src = sanityImageUrl('priority-dom-2000x1000.jpg')
    await render(<Image src={src} width={800} height={400} priority alt="" />)

    const link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="preload"][as="image"][imagesrcset*="priority-dom-2000x1000.jpg"]',
    )
    expect(link).not.toBeNull()
    expect(link?.getAttribute('imagesrcset')).toContain('w=828&auto=format&fit=min 1x')
  })
})

describe('sanity image objects', () => {
  test('loads an image built from an asset reference with crop and hotspot', async () => {
    const onLoad = vi.fn()
    const screen = await render(
      <Image
        src={{
          asset: {_ref: 'image-objectload-2000x3000-jpg'},
          crop: {top: 0.1, bottom: 0.1, left: 0.1, right: 0.1},
          hotspot: {x: 0.75, y: 0.25},
        }}
        projectId="pv8y60vp"
        dataset="production"
        width={800}
        height={400}
        loading="eager"
        onLoad={onLoad}
        alt=""
      />,
    )
    const img = queryImg(screen.container)

    await vi.waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1))

    expect(img.currentSrc).toContain('/images/pv8y60vp/production/objectload-2000x3000.jpg')
    expect(img.currentSrc).toContain('rect=')
  })
})

describe('refs', () => {
  test('forwards ref to the underlying <img> element', async () => {
    const ref = createRef<HTMLImageElement>()
    await render(
      <Image ref={ref} src={sanityImageUrl('ref-2000x1000.jpg')} width={800} height={400} alt="" />,
    )

    expect(ref.current).toBeInstanceOf(HTMLImageElement)
    expect(ref.current?.getAttribute('data-nimg')).toBe('1')
  })
})
