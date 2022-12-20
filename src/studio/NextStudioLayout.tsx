/* eslint-disable camelcase */
import {memo} from 'react'
import type {StudioProps} from 'sanity'
import styled from 'styled-components'

import {useTheme} from './useTheme'

/** @alpha */
export interface NextStudioLayoutProps extends Pick<StudioProps, 'config' | 'scheme'> {
  children: React.ReactNode
}

type LayoutProps = {
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
`

const NextStudioLayoutComponent = ({
  children,
  config,
  scheme = 'light',
}: NextStudioLayoutProps) => {
  const theme = useTheme(config)

  return (
    <Layout
      data-ui="NextStudioLayout"
      $fontFamily={theme.fonts.text.family}
      $bg={theme.color[scheme].default.base.bg}
    >
      {children}
    </Layout>
  )
}

/** @alpha */
export const NextStudioLayout = memo(NextStudioLayoutComponent)
