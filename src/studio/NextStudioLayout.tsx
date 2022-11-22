/* eslint-disable camelcase */
import {memo} from 'react'
import type {StudioProps} from 'sanity'
import styled, {css} from 'styled-components'

import {useTheme} from './useTheme'

/** @alpha */
export interface NextStudioLayoutProps extends Pick<StudioProps, 'config' | 'scheme'> {
  children: React.ReactNode
  /**
   * Apply fix with SVG icon centering that happens if TailwindCSS is loaded
   * @defaultValue true
   */
  unstable__tailwindSvgFix?: boolean
}

type LayoutProps = {
  $unstable__tailwindSvgFix: NextStudioLayoutProps['unstable__tailwindSvgFix']
  $bg: string
  $fontFamily: string
}
const Layout = styled.div<LayoutProps>`
  font-family: ${({$fontFamily}) => $fontFamily};
  background-color: ${({$bg}: any) => $bg};
  height: 100vh;
  max-height: 100dvh;
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
  overflow: auto;

  ${({$unstable__tailwindSvgFix}: any) =>
    $unstable__tailwindSvgFix
      ? css`
          /* override tailwind reset */
          *:not([data-ui='Popover__arrow']):not([data-ui='Tooltip__arrow']) > svg {
            display: inline;
          }
        `
      : ''}
`

const NextStudioLayoutComponent = ({
  children,
  config,
  scheme = 'light',
  unstable__tailwindSvgFix = true,
}: NextStudioLayoutProps) => {
  const theme = useTheme(config)

  return (
    <Layout
      data-ui="NextStudioLayout"
      $unstable__tailwindSvgFix={unstable__tailwindSvgFix}
      $fontFamily={theme.fonts.text.family}
      $bg={theme.color[scheme].default.base.bg}
    >
      {children}
    </Layout>
  )
}

/** @alpha */
export const NextStudioLayout = memo(NextStudioLayoutComponent)
