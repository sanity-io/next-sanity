import {memo} from 'react'
import {type StudioProps, Studio} from 'sanity'

import {
  type NextStudioHeadProps,
  NextStudioGlobalStyle,
  NextStudioGlobalStyleProps,
  NextStudioHead,
  useBackgroundColorsFromTheme,
  useTheme,
} from '.'

export interface NextStudioProps extends StudioProps {
  /**
   * Override how the Studio renders by passing children.
   * This is useful for advanced use cases where you're using StudioProvider and StudioLayout instead of Studio:
   * import {StudioProvider, StudioLayout} from 'sanity'
   * import {NextStudio} from 'next-sanity/studio'
   * <NextStudio config={config}>
   *   <StudioProvider config={config}>
   *     <CustomComponentThatUsesContextFromStudioProvider />
   *     <StudioLayout />
   *   </StudioProvider>
   * </NextStudio>
   */
  children?: React.ReactNode
  /**
   * Turns off the default global styling
   */
  unstable__noGlobalStyle?: boolean
  /**
   * Apply fix with SVG icon centering that happens if TailwindCSS is loaded, on by defautl
   */
  unstable__noTailwindSvgFix?: NextStudioGlobalStyleProps['unstable__tailwindSvgFix']
  /**
   * Add stuff to the head with next/head
   */
  unstable__head?: NextStudioHeadProps['children']
  /**
   * Sets the document title
   */
  unstable__document_title?: NextStudioHeadProps['title']
  /**
   * Sets the background color of <html>
   */
  unstable__bg?: NextStudioGlobalStyleProps['bg']
  /**
   * Don't load the favicon meta tags
   */
  unstable__noFavicons?: boolean
}
/**
 * Intended to render at the root of a page, letting the Studio own that page and render much like it would if you used `npx sanity start` to render
 * It's a drop-in replacement for `import {Studio} from 'sanity'`
 */
const NextStudioComponent = ({
  children,
  config,
  unstable__noGlobalStyle,
  unstable__noTailwindSvgFix,
  unstable__head,
  unstable__document_title,
  unstable__bg,
  unstable__noFavicons,
  ...props
}: NextStudioProps) => {
  const theme = useTheme(config)
  const {themeColorLight, themeColorDark} = useBackgroundColorsFromTheme(theme)
  return (
    <>
      {children || <Studio config={config} {...props} />}
      <NextStudioHead
        themeColorLight={themeColorLight}
        themeColorDark={themeColorDark}
        title={unstable__document_title}
        favicons={!unstable__noFavicons}
      >
        {unstable__head}
      </NextStudioHead>
      {!unstable__noGlobalStyle && (
        <NextStudioGlobalStyle
          bg={unstable__bg ?? themeColorLight}
          unstable__tailwindSvgFix={!unstable__noTailwindSvgFix}
        />
      )}
    </>
  )
}
export const NextStudio = memo(NextStudioComponent)
