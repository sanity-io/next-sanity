/* eslint-disable camelcase */
import {memo} from 'react'
import type {StudioProps} from 'sanity'

import {useTheme} from './useTheme'

/** @alpha */
export interface NextStudioLayoutProps extends Pick<StudioProps, 'config' | 'scheme'> {
  children: React.ReactNode
}

const NextStudioLayoutComponent = ({
  children,
  config,
  scheme = 'light',
}: NextStudioLayoutProps) => {
  const theme = useTheme(config)

  return (
    <div
      data-ui="NextStudioLayout"
      style={{
        fontFamily: theme.fonts.text.family,
        backgroundColor: theme.color[scheme === 'dark' ? 'dark' : 'light'].default.base.bg,
        height: '100vh',
        maxHeight: '100dvh',
        overscrollBehavior: 'none',
        WebkitFontSmoothing: 'antialiased',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  )
}

/** @alpha */
export const NextStudioLayout = memo(NextStudioLayoutComponent)
