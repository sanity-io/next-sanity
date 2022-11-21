// Intentionally not using `styled-components` to ensure it works in any `next` setup.
// Wether 'styled-components' SSR is setup or not.

import {SpinnerIcon} from '@sanity/icons'
import {_responsive, rem} from '@sanity/ui'
import {memo} from 'react'
import type {StudioProps} from 'sanity'

import {useTheme} from './useTheme'

/** @alpha */
export type NextStudioFallbackProps = Pick<StudioProps, 'config' | 'scheme'>

const keyframes = `
from {
  transform: rotate(0deg);
}

to {
  transform: rotate(360deg);
}
`

function NextStudioFallbackComponent(props: NextStudioFallbackProps) {
  const {config, scheme = 'light'} = props
  const id = 'next-sanity-spinner'
  const theme = useTheme(config)
  const {fonts, media} = theme

  const styles: any = _responsive(media, [2], (size: number) => {
    const {ascenderHeight, descenderHeight, lineHeight, iconSize} = fonts.text.sizes[size]
    const capHeight = lineHeight - ascenderHeight - descenderHeight

    return {
      wrapper: {
        animation: `${id} 500ms linear infinite`,
        color: theme.color[scheme].default.muted.default.enabled.muted.fg,
        width: rem(capHeight),
        height: rem(capHeight),
      },
      svg: {
        display: 'block',
        width: rem(iconSize),
        height: rem(iconSize),
        margin: (capHeight - iconSize) / 2,
      },
    }
  })[0]

  return (
    <div
      style={{
        fontFamily: fonts.text.family,
        backgroundColor: theme.color[scheme].default.base.bg,
        height: '100vh',
        maxHeight: '100dvh',
        overscrollBehavior: 'none',
        WebkitFontSmoothing: 'antialiased',
        overflow: 'auto',
      }}
    >
      <div
        data-ui="Flex"
        style={{
          display: 'flex',
          minWidth: 0,
          minHeight: 0,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        <style key={scheme}>{`@keyframes ${id} {${keyframes}}`}</style>
        <div data-ui="Spinner" style={styles.wrapper}>
          <SpinnerIcon style={styles.svg} />
        </div>
      </div>
    </div>
  )
}

/** @alpha */
export const NextStudioFallback = memo(NextStudioFallbackComponent)
