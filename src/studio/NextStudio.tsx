'use client'

import {memo} from 'react'
import {Studio, type StudioProps} from 'sanity'

import {NextStudioLayout} from './NextStudioLayout'
import {NextStudioNoScript} from './NextStudioNoScript'
import {StyledComponentsRegistry} from './registry'

/** @public */
export interface NextStudioProps extends StudioProps {
  children?: React.ReactNode
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
  unstable__noScript = true,
  scheme,
  ...props
}: NextStudioProps) => {
  return (
    <>
      {unstable__noScript && <NextStudioNoScript />}
      <StyledComponentsRegistry>
        <NextStudioLayout>
          {children || (
            <Studio config={config} scheme={scheme} unstable_globalStyles {...props} />
          )}
        </NextStudioLayout>
      </StyledComponentsRegistry>
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
 * @public
 */
export const NextStudio = memo(NextStudioComponent)
