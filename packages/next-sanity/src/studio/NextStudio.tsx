'use client'

import {memo, useMemo} from 'react'
import {Studio, type StudioProps} from 'sanity'

import {createHashHistoryForStudio} from './createHashHistoryForStudio'
import {NextStudioLayout} from './NextStudioLayout'
import {NextStudioNoScript} from './NextStudioNoScript'
import {StyledComponentsRegistry} from './registry'
import {useIsMounted} from './useIsMounted'

/** @public */
export interface NextStudioProps extends StudioProps {
  children?: React.ReactNode
  /**
   * Render the <noscript> tag
   * @defaultValue true
   * @alpha
   */
  unstable__noScript?: boolean
  /**
   * The 'hash' option is new feature that is not yet stable for production, but is available for testing and its API won't change in a breaking way.
   * If 'hash' doesn't work for you, or if you want to use a memory based history, you can use the `unstable_history` prop instead.
   * @alpha
   * @defaultValue 'browser'
   */
  history?: 'browser' | 'hash'
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
  history,
  ...props
}: NextStudioProps) => {
  const isMounted = useIsMounted()
  const unstableHistory = useMemo<typeof props.unstable_history>(() => {
    if (props.unstable_history && history) {
      throw new Error('Cannot use both `unstable_history` and `history` props at the same time')
    }

    if (isMounted && history === 'hash') {
      return createHashHistoryForStudio()
    }
    return props.unstable_history
  }, [history, isMounted, props.unstable_history])

  return (
    <>
      {unstable__noScript && <NextStudioNoScript />}
      <StyledComponentsRegistry isMounted={isMounted}>
        <NextStudioLayout>
          {history === 'hash' && !isMounted
            ? null
            : children || (
                <Studio
                  config={config}
                  scheme={scheme}
                  unstable_globalStyles
                  {...props}
                  unstable_history={unstableHistory}
                />
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
