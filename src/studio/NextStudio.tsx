import {lazy, memo} from 'react'
import type {StudioProps} from 'sanity'

import {NextStudioFallback} from './NextStudioFallback'
import {type NextStudioLayoutProps, NextStudioLayout} from './NextStudioLayout'
import {NextStudioNoScript} from './NextStudioNoScript'
import {NextStudioSuspense} from './NextStudioSuspense'

const Studio = memo(lazy(() => import('./LazyStudio')))

/** @beta */
export interface NextStudioProps extends StudioProps {
  children?: React.ReactNode
  /**
   * Apply fix with SVG icon centering that happens if TailwindCSS is loaded
   * @defaultValue true
   * @alpha
   */
  unstable__tailwindSvgFix?: NextStudioLayoutProps['unstable__tailwindSvgFix']
  /**
   * Render the <noscript> tag
   * @defaultValue true
   * @alpha
   */
  unstable__noScript?: boolean
}
/**
 * Intended to render at the root of a page, letting the Studio own that page and render much like it would if you used `npx sanity start` to render
 * It's a drop-in replacement for `import {Studio} from 'sanity'`
 */
const NextStudioComponent = ({
  children,
  config,
  unstable__tailwindSvgFix = true,
  unstable__noScript = true,
  scheme,
  ...props
}: NextStudioProps) => {
  return (
    <>
      {!unstable__noScript && <NextStudioNoScript />}
      <NextStudioSuspense fallback={<NextStudioFallback config={config} scheme={scheme} />}>
        <NextStudioLayout
          config={config}
          scheme={scheme}
          unstable__tailwindSvgFix={unstable__tailwindSvgFix}
        >
          {children || (
            <Studio config={config} scheme={scheme} unstable_globalStyles {...props} />
          )}
        </NextStudioLayout>
      </NextStudioSuspense>
    </>
  )
}

/**
 * Override how the Studio renders by passing children.
 * This is useful for advanced use cases where you're using StudioProvider and StudioLayout instead of Studio:
 * ```
 * import {StudioProvider, StudioLayout} from 'sanity'
 * import {NextStudio} from 'next-sanity/studio'
 * <NextStudio config={config}>
 *   <StudioProvider config={config}>
 *     <CustomComponentThatUsesContextFromStudioProvider />
 *     <StudioLayout />
 *   </StudioProvider>
 * </NextStudio>
 * ```
 * @beta
 */
export const NextStudio = memo(NextStudioComponent)
