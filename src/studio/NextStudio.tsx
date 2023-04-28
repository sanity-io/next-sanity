import {memo} from 'react'
import {Studio, type StudioProps} from 'sanity'

import {NextStudioClientOnly} from './NextStudioClientOnly'
import {NextStudioLayout} from './NextStudioLayout'
import {NextStudioLoading} from './NextStudioLoading'
import {NextStudioNoScript} from './NextStudioNoScript'

export type {NextStudioLoadingProps} from './NextStudioLoading'

/** @beta */
export interface NextStudioProps extends StudioProps {
  children?: React.ReactNode
  /**
   * Render the <noscript> tag
   * @defaultValue true
   * @alpha
   */
  unstable__noScript?: boolean
  /**
   * Render in a faster mode that requires `styled-components` SSR to be setup.
   * @defaultValue false
   * @alpha
   */
  unstable__fastRender?: boolean
}
/**
 * Intended to render at the root of a page, letting the Studio own that page and render much like it would if you used `npx sanity start` to render
 * It's a drop-in replacement for `import {Studio} from 'sanity'`
 */
const NextStudioComponent = ({
  children,
  config,
  unstable__noScript = true,
  unstable__fastRender,
  scheme,
  ...props
}: NextStudioProps) => {
  if (unstable__fastRender) {
    return (
      <>
        {unstable__noScript && <NextStudioNoScript />}
        <NextStudioLayout config={config} scheme={scheme}>
          {children || (
            <Studio config={config} scheme={scheme} unstable_globalStyles {...props} />
          )}
        </NextStudioLayout>
      </>
    )
  }

  return (
    <>
      {unstable__noScript && <NextStudioNoScript />}
      <NextStudioClientOnly
        fallback={
          <NextStudioLoading
            unstable__noScript={unstable__noScript}
            config={config}
            scheme={scheme}
          />
        }
      >
        <NextStudioLayout config={config} scheme={scheme}>
          {children || (
            <Studio config={config} scheme={scheme} unstable_globalStyles {...props} />
          )}
        </NextStudioLayout>
      </NextStudioClientOnly>
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
