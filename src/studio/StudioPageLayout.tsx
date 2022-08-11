import { memo } from 'react'
import { type StudioProps, Studio } from 'sanity'

import {
  type StudioPageHeadProps,
  StudioPageGlobalStyle,
  StudioPageGlobalStyleProps,
  StudioPageHead,
  useBackgroundColorsFromTheme,
  useTheme,
} from '.'

export interface StudioPageLayoutProps extends StudioProps {
  /**
   * Override how the Studio renders by passing children.
   * This is useful for advanced use cases where you're using StudioProvider and StudioLayout instead of Studio:
   * import {StudioProvider, StudioLayout} from 'sanity'
   * import {StudioPageLayout} from '@sanity/next-studio-layout'
   * <StudioPageLayout config={config}>
   *   <StudioProvider config={config}>
   *     <CustomComponentThatUsesContextFromStudioProvider />
   *     <StudioLayout />
   *   </StudioProvider>
   * </StudioPageLayout>
   */
  children?: React.ReactNode
  /**
   * Turns off the default global styling
   */
  unstable__noGlobalStyle?: boolean
  /**
   * Apply fix with SVG icon centering that happens if TailwindCSS is loaded, on by defautl
   */
  unstable__noTailwindSvgFix?: StudioPageGlobalStyleProps['unstable__tailwindSvgFix']
  /**
   * Add stuff to the head with next/head
   */
  unstable__head?: StudioPageHeadProps['children']
  /**
   * Sets the document title
   */
  unstable__document_title?: StudioPageHeadProps['title']
  /**
   * Sets the background color of <html>
   */
  unstable__bg?: StudioPageGlobalStyleProps['bg']
  /**
   * Don't load the favicon meta tags
   */
  unstable__noFavicons?: boolean
}
/**
 * Intended to render at the root of a page, letting the Studio own that page and render much like it would if you used `npx sanity start` to render
 */
export const StudioPageLayout = memo(function StudioPageLayout({
  children,
  config,
  unstable__noGlobalStyle,
  unstable__noTailwindSvgFix,
  unstable__head,
  unstable__document_title,
  unstable__bg,
  unstable__noFavicons,
  ...props
}: StudioPageLayoutProps) {
  const theme = useTheme(config)
  const { themeColorLight, themeColorDark } =
    useBackgroundColorsFromTheme(theme)
  return (
    <>
      {children || <Studio config={config} {...props} />}
      <StudioPageHead
        themeColorLight={themeColorLight}
        themeColorDark={themeColorDark}
        title={unstable__document_title}
        favicons={!unstable__noFavicons}
      >
        {unstable__head}
      </StudioPageHead>
      {!unstable__noGlobalStyle && (
        <StudioPageGlobalStyle
          bg={unstable__bg ?? themeColorLight}
          unstable__tailwindSvgFix={!unstable__noTailwindSvgFix}
        />
      )}
    </>
  )
})
