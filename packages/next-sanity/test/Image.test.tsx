/**
 * Comprehensive coverage of how `next-sanity/image` drives `next/image`.
 *
 * `<Image>` is a thin wrapper: it encodes the `width`/`height` props as `w`/`h`
 * params on the Sanity CDN URL, then delegates rendering to `next/image` with
 * `imageLoader` as the `loader`. That means the rendered `<img>` markup is
 * produced by `next/image` itself, so these tests pin down the full contract:
 * which of the many `next/image` options work through the wrapper, what URLs
 * the loader generates for each `srcset` candidate, and which dev-mode
 * validations still fire.
 *
 * The scenarios mirror the areas covered by the `next/image` test suites in
 * the vercel/next.js repo (test/unit/next-image-new.test.ts and
 * test/integration/image-component/*) and its image-component demo app.
 */
import {vercelStegaCombine} from '@vercel/stega'
import {Image, imageLoader, type ImageProps} from 'next-sanity/image'
import NextImage, {getImageProps, type ImageProps as NextImageProps} from 'next/image'
import type {ComponentProps} from 'react'
import {afterEach, describe, expect, expectTypeOf, test, vi} from 'vitest'

import {
  parseSrcSet,
  parseStyle,
  renderImage,
  renderImageError,
  sanityImageUrl,
  searchParamsOf,
} from './helpers.image'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

/**
 * The `next/image` defaults from `imageConfigDefault`, which apply when no
 * `next.config.ts` image options are set:
 * - `deviceSizes`: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
 * - `imageSizes`: [32, 48, 64, 96, 128, 256, 384]
 * - `qualities`: [75]
 */
const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
const allSizes = [32, 48, 64, 96, 128, 256, 384, ...deviceSizes]

describe('basic rendering', () => {
  test('renders a plain <img> element with next/image defaults', async () => {
    const src = sanityImageUrl('basic-2000x1000.jpg')
    const {img, links} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    expect(img).toEqual({
      'alt': '',
      // Images are lazy-loaded unless `loading`, `priority` or `preload` says otherwise
      'loading': 'lazy',
      'width': '800',
      'height': '400',
      'decoding': 'async',
      'data-nimg': '1',
      // Hides the alt text while the image loads
      'style': 'color:transparent',
      // No `sizes` prop means a x-descriptor srcset: the nearest configured
      // sizes that cover 1x and 2x pixel densities for an 800px wide image
      'srcset': `${src}?h=414&w=828&auto=format&fit=min 1x, ${src}?h=960&w=1920&auto=format&fit=min 2x`,
      // The `src` attribute is the largest candidate, used by browsers without srcset support
      'src': `${src}?h=960&w=1920&auto=format&fit=min`,
    })
    expect(links).toEqual([])
  })

  test('renders the alt text', async () => {
    const {img} = await renderImage(
      <Image src={sanityImageUrl('alt-100x100.png')} width={50} height={50} alt="A description" />,
    )

    expect(img.alt).toBe('A description')
  })

  test('passes arbitrary <img> attributes through next/image', async () => {
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('passthrough-100x100.png')}
        width={50}
        height={50}
        alt=""
        id="hero"
        title="Hello"
        className="rounded"
        data-testid="sanity-image"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        draggable={false}
      />,
    )

    expect(img.id).toBe('hero')
    expect(img.title).toBe('Hello')
    expect(img.class).toBe('rounded')
    expect(img['data-testid']).toBe('sanity-image')
    expect(img.crossorigin).toBe('anonymous')
    expect(img.referrerpolicy).toBe('no-referrer')
    expect(img.draggable).toBe('false')
  })

  test('merges a custom style with the next/image style', async () => {
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('styled-100x100.png')}
        width={50}
        height={50}
        alt=""
        style={{borderRadius: '50%', objectFit: 'cover'}}
      />,
    )

    expect(parseStyle(img.style)).toEqual({
      'color': 'transparent',
      'border-radius': '50%',
      'object-fit': 'cover',
    })
  })

  test('accepts width and height as strings', async () => {
    const src = sanityImageUrl('stringly-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} width="800" height="400" alt="" />)

    expect(img.width).toBe('800')
    expect(img.height).toBe('400')
    expect(searchParamsOf(img.src)).toEqual({
      h: '960',
      w: '1920',
      auto: 'format',
      fit: 'min',
    })
  })

  test('renders no warnings for a correctly configured image', async () => {
    const warn = vi.spyOn(console, 'warn')
    await renderImage(
      <Image
        src={sanityImageUrl('warning-free-2000x1000.jpg')}
        width={800}
        height={400}
        quality={75}
        alt="All good"
      />,
    )

    expect(warn).not.toHaveBeenCalled()
  })
})

describe('src URL construction', () => {
  test('encodes the width and height props as w/h params so every srcset candidate keeps the aspect ratio', async () => {
    const src = sanityImageUrl('aspect-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} width={800} height={200} alt="" />)

    // 800x200 is a 4:1 aspect ratio: each candidate scales h to w / 4
    expect(parseSrcSet(img.srcset)).toEqual([
      expect.objectContaining({
        descriptor: '1x',
        params: expect.objectContaining({w: '828', h: '207'}),
      }),
      expect.objectContaining({
        descriptor: '2x',
        params: expect.objectContaining({w: '1920', h: '480'}),
      }),
    ])
  })

  test('preserves crop and hotspot params produced by @sanity/image-url', async () => {
    // urlFor(image).width(800).height(400).url() with a hotspot/crop encodes
    // `rect`, `fp-x` and `fp-y` into the URL
    const src = sanityImageUrl('hotspot-2000x1000.jpg', '?rect=40,20,1000,500&fp-x=0.75&fp-y=0.25')
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    for (const candidate of parseSrcSet(img.srcset)) {
      expect(candidate.params).toMatchObject({
        // Note: appending w/h params re-serializes the query string, so the
        // commas in `rect` become percent-encoded (the CDN decodes them back)
        'rect': '40,20,1000,500',
        'fp-x': '0.75',
        'fp-y': '0.25',
      })
    }
    expect(img.src).toContain('rect=40%2C20%2C1000%2C500')
  })

  test('width and height props override w/h params already present on the src URL', async () => {
    const src = sanityImageUrl('override-2000x1000.jpg', '?w=500&h=250')
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    expect(searchParamsOf(img.src)).toEqual({
      w: '1920',
      h: '960',
      auto: 'format',
      fit: 'min',
    })
  })

  test('keeps other params from the src URL in every candidate', async () => {
    const src = sanityImageUrl('params-2000x1000.jpg', '?blur=50&sat=-100')
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    for (const candidate of parseSrcSet(img.srcset)) {
      expect(candidate.params).toMatchObject({blur: '50', sat: '-100'})
    }
  })

  test('respects a fit param already present on the src URL', async () => {
    const src = sanityImageUrl('fitted-2000x1000.jpg', '?fit=crop')
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    for (const candidate of parseSrcSet(img.srcset)) {
      expect(candidate.params.fit).toBe('crop')
    }
  })

  test('strips stega-encoded metadata from the src', async () => {
    // Content Source Maps embed invisible characters into strings. The
    // default stega filter skips URLs (which is why `skip: false` is forced
    // here), but custom `stega.filter` setups can encode them, which would
    // corrupt the CDN request
    const src = sanityImageUrl('stega-2000x1000.jpg')
    const encoded = vercelStegaCombine(src, {origin: 'sanity.io', href: '/studio'}, false)
    expect(encoded).not.toBe(src)

    const {img} = await renderImage(<Image src={encoded} width={800} height={400} alt="" />)

    expect(img.src).toBe(`${src}?h=960&w=1920&auto=format&fit=min`)
  })

  test('passes data: URLs through untouched, rendered unoptimized by next/image', async () => {
    const src = 'data:image/png;base64,SGVsbG8='
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    expect(img.src).toBe(src)
    expect(img.srcset).toBeUndefined()
    // data: URLs also disable lazy loading
    expect(img.loading).toBeUndefined()
  })

  test('passes blob: URLs through untouched, rendered unoptimized by next/image', async () => {
    const src = 'blob:https://example.com/9115d58c-bcda-ff47-86e5-083e9a2bcdbf'
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    expect(img.src).toBe(src)
    expect(img.srcset).toBeUndefined()
  })

  test('throws a TypeError for a relative src, unlike next/image which supports them', async () => {
    const error = await renderImageError(
      <Image src="/images/local.jpg" width={800} height={400} alt="" />,
    )

    expect(error).toBeInstanceOf(TypeError)
    expect(error).toMatchObject({
      message: 'The `src` prop must be a valid URL to an image on the Sanity Image CDN.',
      cause: expect.any(TypeError),
    })
  })

  test('throws a TypeError when a custom loader is passed', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('loader-2000x1000.jpg')}
        width={800}
        height={400}
        alt=""
        // @ts-expect-error -- the loader prop is intentionally not supported
        loader={imageLoader}
      />,
    )

    expect(error).toBeInstanceOf(TypeError)
    expect(error).toMatchObject({
      message:
        'The `loader` prop is not supported on `Image` components. Use `next/image` directly to use a custom loader.',
    })
  })

  test('accepts non-Sanity URLs without validation (the CDN params just have no effect elsewhere)', async () => {
    const {img} = await renderImage(
      <Image src="https://example.com/image.jpg" width={800} height={400} alt="" />,
    )

    expect(img.src).toBe('https://example.com/image.jpg?h=960&w=1920&auto=format&fit=min')
  })
})

describe('srcset and sizes', () => {
  test('no sizes prop: 1x/2x candidates snap to the next configured size', async () => {
    const src = sanityImageUrl('densities-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} width={640} height={320} alt="" />)

    // 640 is a configured size; 2x (1280) snaps up to 1920
    expect(
      parseSrcSet(img.srcset).map(({descriptor, params}) => `${params.w} ${descriptor}`),
    ).toEqual(['640 1x', '1920 2x'])
    // No sizes attribute is rendered for x-descriptor srcsets
    expect(img.sizes).toBeUndefined()
  })

  test('widths at the top of the configured range collapse into a single candidate', async () => {
    const src = sanityImageUrl('huge-8000x4000.jpg')
    const {img} = await renderImage(<Image src={src} width={3840} height={1920} alt="" />)

    expect(
      parseSrcSet(img.srcset).map(({descriptor, params}) => `${params.w} ${descriptor}`),
    ).toEqual(['3840 1x'])
  })

  test('sizes="100vw": every deviceSize becomes a w-descriptor candidate', async () => {
    const src = sanityImageUrl('fullwidth-2000x1000.jpg')
    const {img} = await renderImage(
      <Image src={src} width={800} height={400} sizes="100vw" alt="" />,
    )

    expect(img.sizes).toBe('100vw')
    expect(parseSrcSet(img.srcset).map(({descriptor}) => descriptor)).toEqual(
      deviceSizes.map((w) => `${w}w`),
    )
    // Every candidate keeps the 2:1 aspect ratio from the width/height props
    expect(parseSrcSet(img.srcset).map(({params}) => `${params.w}x${params.h}`)).toEqual(
      deviceSizes.map((w) => `${w}x${w / 2}`),
    )
  })

  test('sizes with vw units: candidates below the smallest viewport fraction are dropped', async () => {
    const src = sanityImageUrl('responsive-2000x1000.jpg')
    const {img} = await renderImage(
      <Image src={src} width={800} height={400} sizes="(max-width: 768px) 100vw, 50vw" alt="" />,
    )

    // Smallest fraction is 50vw: candidates start at 50% of the smallest
    // deviceSize (640 * 0.5 = 320), so 384 is the first configured size
    expect(parseSrcSet(img.srcset).map(({params}) => Number(params.w))).toEqual(
      allSizes.filter((size) => size >= 320),
    )
  })

  test('sizes without vw units: all configured sizes become candidates', async () => {
    const src = sanityImageUrl('fixed-2000x1000.jpg')
    const {img} = await renderImage(
      <Image src={src} width={800} height={400} sizes="800px" alt="" />,
    )

    expect(img.sizes).toBe('800px')
    expect(parseSrcSet(img.srcset).map(({params}) => Number(params.w))).toEqual(allSizes)
  })

  test('the src attribute always matches the largest srcset candidate', async () => {
    const src = sanityImageUrl('largest-2000x1000.jpg')
    const {img} = await renderImage(
      <Image src={src} width={800} height={400} sizes="100vw" alt="" />,
    )

    const candidates = parseSrcSet(img.srcset)
    expect(img.src).toBe(candidates.at(-1)?.url)
  })
})

describe('fill', () => {
  test('renders absolute positioning styles instead of width/height attributes', async () => {
    const src = sanityImageUrl('fill-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} fill alt="" />)

    expect(img.width).toBeUndefined()
    expect(img.height).toBeUndefined()
    expect(img['data-nimg']).toBe('fill')
    expect(parseStyle(img.style)).toEqual({
      position: 'absolute',
      height: '100%',
      width: '100%',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
      color: 'transparent',
    })
  })

  test('defaults sizes to 100vw and uses deviceSizes as candidates', async () => {
    const src = sanityImageUrl('fill-sizes-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} fill alt="" />)

    expect(img.sizes).toBe('100vw')
    expect(parseSrcSet(img.srcset).map(({params}) => Number(params.w))).toEqual(deviceSizes)
    // Without width/height props there are no w/h params on the src URL,
    // so the loader falls back to fit=max and no h param
    expect(searchParamsOf(img.src)).toEqual({auto: 'format', fit: 'max', w: '3840'})
  })

  test('a sizes prop narrows the candidates like in non-fill mode', async () => {
    const src = sanityImageUrl('fill-narrow-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} fill sizes="25vw" alt="" />)

    expect(img.sizes).toBe('25vw')
    expect(parseSrcSet(img.srcset).map(({params}) => Number(params.w))).toEqual(
      // 25% of the smallest deviceSize (640 * 0.25 = 160)
      allSizes.filter((size) => size >= 160),
    )
  })

  test('merges object-fit styling into the fill styles', async () => {
    const src = sanityImageUrl('fill-cover-2000x1000.jpg')
    const {img} = await renderImage(
      <Image src={src} fill style={{objectFit: 'cover', objectPosition: 'top left'}} alt="" />,
    )

    expect(parseStyle(img.style)).toMatchObject({
      'position': 'absolute',
      'object-fit': 'cover',
      'object-position': 'top left',
    })
  })
})

describe('quality', () => {
  test('adds the q param to the src and every srcset candidate', async () => {
    const src = sanityImageUrl('quality-2000x1000.jpg')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const {img} = await renderImage(
      <Image src={src} width={800} height={400} quality={90} alt="" />,
    )

    expect(searchParamsOf(img.src).q).toBe('90')
    for (const candidate of parseSrcSet(img.srcset)) {
      expect(candidate.params.q).toBe('90')
    }
    // Since Next.js 16, `images.qualities` defaults to [75]: any other value
    // logs a dev-mode warning asking to add it to the config
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Image with src "${src}?h=400&w=800" is using quality "90" which is not configured in images.qualities [75]`,
      ),
    )
  })

  test('quality 75 matches the default images.qualities config and does not warn', async () => {
    const warn = vi.spyOn(console, 'warn')
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('quality-default-2000x1000.jpg')}
        width={800}
        height={400}
        quality={75}
        alt=""
      />,
    )

    expect(searchParamsOf(img.src).q).toBe('75')
    expect(warn).not.toHaveBeenCalled()
  })

  test('accepts quality as a string', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('quality-string-2000x1000.jpg')}
        width={800}
        height={400}
        quality="50"
        alt=""
      />,
    )

    expect(searchParamsOf(img.src).q).toBe('50')
    warn.mockRestore()
  })

  test('no quality prop leaves the q param off, deferring to the CDN default', async () => {
    const {img} = await renderImage(
      <Image src={sanityImageUrl('quality-none-2000x1000.jpg')} width={800} height={400} alt="" />,
    )

    expect(searchParamsOf(img.src).q).toBeUndefined()
  })
})

describe('loading, priority, preload and fetchPriority', () => {
  test('loading="eager" replaces the default lazy loading', async () => {
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('eager-2000x1000.jpg')}
        width={800}
        height={400}
        loading="eager"
        alt=""
      />,
    )

    expect(img.loading).toBe('eager')
  })

  test('priority drops the loading attribute and emits a preload link', async () => {
    const src = sanityImageUrl('priority-2000x1000.jpg')
    const {img, links} = await renderImage(
      <Image src={src} width={800} height={400} priority alt="" />,
    )

    expect(img.loading).toBeUndefined()
    // Unlike older Next.js versions, priority no longer sets fetchpriority="high"
    expect(img.fetchpriority).toBeUndefined()
    expect(links).toEqual([
      {
        rel: 'preload',
        as: 'image',
        // The link intentionally has no `href`: `imagesrcset` takes precedence
        // in browsers that support it, and a `href` would double-preload
        imagesrcset: img.srcset,
      },
    ])
  })

  test('the preload prop (stable since Next.js 16.3, replacing priority) emits the same link', async () => {
    const src = sanityImageUrl('preload-2000x1000.jpg')
    const {img, links} = await renderImage(
      <Image src={src} width={800} height={400} preload alt="" />,
    )

    expect(img.loading).toBeUndefined()
    expect(links).toEqual([{rel: 'preload', as: 'image', imagesrcset: img.srcset}])
  })

  test('preload links include imagesizes when the sizes prop is set', async () => {
    const {links} = await renderImage(
      <Image
        src={sanityImageUrl('preload-sizes-2000x1000.jpg')}
        width={800}
        height={400}
        sizes="100vw"
        priority
        alt=""
      />,
    )

    expect(links[0]?.imagesizes).toBe('100vw')
  })

  test('fetchPriority renders as the fetchpriority attribute and is forwarded to the preload link', async () => {
    const {img, links} = await renderImage(
      <Image
        src={sanityImageUrl('fetchpriority-2000x1000.jpg')}
        width={800}
        height={400}
        fetchPriority="high"
        priority
        alt=""
      />,
    )

    expect(img.fetchpriority).toBe('high')
    expect(links[0]?.fetchpriority).toBe('high')
  })

  test('throws when priority is combined with loading="lazy"', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('priority-lazy-2000x1000.jpg')}
        width={800}
        height={400}
        priority
        loading="lazy"
        alt=""
      />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has both "priority" and "loading=\'lazy\'" properties'),
    })
  })

  test('throws when preload is combined with the deprecated priority prop', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('preload-priority-2000x1000.jpg')}
        width={800}
        height={400}
        preload
        priority
        alt=""
      />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has both "preload" and "priority" properties'),
    })
  })
})

describe('placeholder', () => {
  const blurDataURL = 'data:image/jpeg;base64,SGVsbG8='

  test('placeholder="blur" inlines the blurDataURL in a blurred SVG background', async () => {
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('blur-2000x1000.jpg')}
        width={800}
        height={400}
        placeholder="blur"
        blurDataURL={blurDataURL}
        alt=""
      />,
    )

    const style = parseStyle(img.style)
    expect(style['background-image']).toContain('data:image/svg+xml')
    expect(style['background-image']).toContain(blurDataURL)
    expect(style).toMatchObject({
      'background-size': 'cover',
      'background-position': '50% 50%',
      'background-repeat': 'no-repeat',
    })
  })

  test('object-fit contain changes the placeholder background-size', async () => {
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('blur-contain-2000x1000.jpg')}
        width={800}
        height={400}
        placeholder="blur"
        blurDataURL={blurDataURL}
        style={{objectFit: 'contain'}}
        alt=""
      />,
    )

    expect(parseStyle(img.style)['background-size']).toBe('contain')
  })

  test('a data URL placeholder is used as the background image directly', async () => {
    const placeholder = 'data:image/png;base64,SGVsbG8='
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('lqip-2000x1000.jpg')}
        width={800}
        height={400}
        placeholder={placeholder}
        alt=""
      />,
    )

    expect(parseStyle(img.style)['background-image']).toBe(`url("${placeholder}")`)
  })

  test('the default empty placeholder renders no background styles', async () => {
    const {img} = await renderImage(
      <Image src={sanityImageUrl('empty-2000x1000.jpg')} width={800} height={400} alt="" />,
    )

    expect(parseStyle(img.style)['background-image']).toBeUndefined()
  })

  test('throws when placeholder="blur" is used without a blurDataURL', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('blur-missing-2000x1000.jpg')}
        width={800}
        height={400}
        placeholder="blur"
        alt=""
      />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining(
        `has "placeholder='blur'" property but is missing the "blurDataURL" property`,
      ),
    })
  })

  test('warns when a placeholder is used on a tiny image', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await renderImage(
      <Image
        src={sanityImageUrl('tiny-30x30.jpg')}
        width={30}
        height={30}
        placeholder="blur"
        blurDataURL={blurDataURL}
        alt=""
      />,
    )

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('is smaller than 40x40'))
  })
})

describe('unoptimized', () => {
  test('drops srcset and sizes, but the w/h params are still added to the src', async () => {
    const src = sanityImageUrl('unoptimized-2000x1000.jpg')
    const {img} = await renderImage(<Image src={src} width={800} height={400} unoptimized alt="" />)

    expect(img.srcset).toBeUndefined()
    expect(img.sizes).toBeUndefined()
    // The loader never runs, but the wrapper has already encoded the
    // width/height props onto the URL
    expect(img.src).toBe(`${src}?h=400&w=800`)
    expect(img.loading).toBe('lazy')
  })
})

describe('other next/image props', () => {
  test('overrideSrc replaces the src attribute but keeps the generated srcset', async () => {
    const src = sanityImageUrl('override-src-2000x1000.jpg')
    const overrideSrc = sanityImageUrl('seo-stable.jpg')
    const {img} = await renderImage(
      <Image src={src} width={800} height={400} overrideSrc={overrideSrc} alt="" />,
    )

    expect(img.src).toBe(overrideSrc)
    expect(img.srcset).toContain(`${src}?h=414&w=828`)
  })

  test('decoding can be overridden', async () => {
    const {img} = await renderImage(
      <Image
        src={sanityImageUrl('decoding-2000x1000.jpg')}
        width={800}
        height={400}
        decoding="sync"
        alt=""
      />,
    )

    expect(img.decoding).toBe('sync')
  })

  test('the deprecated onLoadingComplete prop logs a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await renderImage(
      <Image
        src={sanityImageUrl('loading-complete-2000x1000.jpg')}
        width={800}
        height={400}
        onLoadingComplete={vi.fn()}
        alt=""
      />,
    )

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('is using deprecated "onLoadingComplete" property'),
    )
  })
})

describe('next/image dev-mode validation still applies', () => {
  test('throws when width and height are missing without fill', async () => {
    const error = await renderImageError(
      <Image src={sanityImageUrl('missing-dims-2000x1000.jpg')} alt="" />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('is missing required "width" property'),
    })
  })

  test('throws when only width is provided', async () => {
    const error = await renderImageError(
      <Image src={sanityImageUrl('missing-height-2000x1000.jpg')} width={800} alt="" />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('is missing required "height" property'),
    })
  })

  test('throws when fill is combined with width', async () => {
    const error = await renderImageError(
      <Image src={sanityImageUrl('fill-width-2000x1000.jpg')} fill width={800} alt="" />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has both "width" and "fill" properties'),
    })
  })

  test('throws when fill is combined with height', async () => {
    const error = await renderImageError(
      <Image src={sanityImageUrl('fill-height-2000x1000.jpg')} fill height={400} alt="" />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has both "height" and "fill" properties'),
    })
  })

  test('throws when fill styles are overridden with an incompatible position', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('fill-position-2000x1000.jpg')}
        fill
        style={{position: 'static'}}
        alt=""
      />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has both "fill" and "style.position" properties'),
    })
  })

  test('throws for a width that is not a number', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('nan-width-2000x1000.jpg')}
        width={Number.NaN}
        height={400}
        alt=""
      />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has invalid "width" property'),
    })
  })

  test('throws for an invalid loading value', async () => {
    const error = await renderImageError(
      <Image
        src={sanityImageUrl('invalid-loading-2000x1000.jpg')}
        width={800}
        height={400}
        // @ts-expect-error -- testing the runtime validation of invalid values
        loading="invalid"
        alt=""
      />,
    )

    expect(error).toMatchObject({
      message: expect.stringContaining('has invalid "loading" property'),
    })
  })

  test('validation is skipped in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    // fill + width throws in dev, but renders in production
    const {img} = await renderImage(
      <Image src={sanityImageUrl('prod-2000x1000.jpg')} fill width={800} alt="" />,
    )

    expect(img['data-nimg']).toBe('fill')
  })
})

describe('documented quirks', () => {
  test('SVGs are not exempted from optimization, unlike the default next/image loader', async () => {
    // The default next/image loader serves `.svg` files unoptimized (unless
    // `dangerouslyAllowSVG` is set), but custom loaders like ours are always
    // applied. The Sanity CDN ignores most params for SVGs, so this is
    // harmless, but worth documenting.
    const src = sanityImageUrl('vector.svg')
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    expect(img.srcset).toBeDefined()
    expect(searchParamsOf(img.src)).toMatchObject({auto: 'format', w: '1920'})
  })
})

describe('composing imageLoader with getImageProps', () => {
  test('generates the same candidate widths, but without the aspect-ratio preservation of <Image>', () => {
    // imageLoader can be used with getImageProps for art direction or
    // <picture> markup. Note the difference to the <Image> component: the
    // width/height props are NOT encoded as URL params, so candidates get
    // fit=max and no h param (the CDN keeps the original aspect ratio
    // instead of cropping to the requested one)
    const src = sanityImageUrl('composed-2000x1000.jpg')
    const {props} = getImageProps({src, width: 800, height: 400, alt: '', loader: imageLoader})

    expect(props.srcSet).toBe(
      `${src}?auto=format&fit=max&w=828 1x, ${src}?auto=format&fit=max&w=1920 2x`,
    )
    expect(props.src).toBe(`${src}?auto=format&fit=max&w=1920`)
    expect(props.width).toBe(800)
    expect(props.height).toBe(400)
  })

  test('matches the <Image> component output when w/h params are pre-encoded on the URL', async () => {
    const src = sanityImageUrl('parity-2000x1000.jpg')
    const {props} = getImageProps({
      src: `${src}?h=400&w=800`,
      width: 800,
      height: 400,
      alt: '',
      loader: imageLoader,
    })
    const {img} = await renderImage(<Image src={src} width={800} height={400} alt="" />)

    expect(props.srcSet).toBe(img.srcset)
    expect(props.src).toBe(img.src)
  })

  test('the wrapped component rejects props at the type level that plain next/image accepts', () => {
    // A static import (the primary next/image src type besides strings)
    const staticImport = {src: '/static.png', width: 2000, height: 1000}

    const nextElement = <NextImage src={staticImport} alt="" />
    const sanityElement = (
      // @ts-expect-error -- next-sanity/image only accepts Sanity CDN URL strings
      <Image src={staticImport} alt="" />
    )
    expect(nextElement).toBeDefined()
    expect(sanityElement).toBeDefined()
  })
})

describe('type-level contract with next/image', () => {
  test('src only accepts strings, not static imports', () => {
    expectTypeOf<ImageProps['src']>().toEqualTypeOf<string>()
  })

  test('alt is required, like in next/image', () => {
    expectTypeOf<Pick<ImageProps, 'alt'>>().toEqualTypeOf<{alt: string}>()
  })

  test('the loader prop is banned', () => {
    expectTypeOf<Required<ImageProps>['loader']>().toBeNever()
  })

  test('ref is typed the same way next/image accepts it', () => {
    expectTypeOf<ImageProps['ref']>().toEqualTypeOf<ComponentProps<typeof NextImage>['ref']>()
  })

  test('every other next/image prop is accepted unchanged', () => {
    expectTypeOf<Omit<ImageProps, 'src' | 'loader' | 'ref'>>().toEqualTypeOf<
      Omit<NextImageProps, 'src' | 'loader' | 'ref'>
    >()
  })
})
