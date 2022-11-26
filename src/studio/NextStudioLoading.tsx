/* eslint-disable no-warning-comments */
// Intentionally not using `styled-components` to ensure it works in any `next` setup.
// Wether 'styled-components' SSR is setup or not.

import {SpinnerIcon} from '@sanity/icons'
import {_responsive, rem} from '@sanity/ui'
import type {Config, SingleWorkspace, StudioProps} from 'sanity'

import {NextStudioNoScript} from './NextStudioNoScript'
import {useTheme} from './useTheme'

/** @alpha */
export interface NextStudioLoadingProps extends Pick<StudioProps, 'scheme'> {
  /**
   * If your Studio Config has a custom theme you can pass it here to ensure the loading screen matches your theme.
   */
  config?: Config | Required<Pick<SingleWorkspace, 'theme'>>
  /**
   * Render the <noscript> tag
   * @defaultValue true
   * @alpha
   */
  unstable__noScript?: boolean
}

const keyframes = `
from {
  transform: rotate(0deg);
}

to {
  transform: rotate(360deg);
}
`

export function NextStudioLoading(props: NextStudioLoadingProps) {
  const {config, scheme = 'light', unstable__noScript = true} = props
  const id = 'next-sanity-spinner'
  const theme = useTheme(config)
  const {fonts, media} = theme

  const styles: any = _responsive(media, [2], (size: number) => {
    const {ascenderHeight, descenderHeight, lineHeight, iconSize} = fonts.text.sizes[size]
    const capHeight = lineHeight - ascenderHeight - descenderHeight

    return {
      wrapper: {
        display: 'block',
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
    <>
      {unstable__noScript && <NextStudioNoScript />}
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
            // @TODO use rem calc
            gap: '10px',
          }}
        >
          <style key={scheme}>{`@keyframes ${id} {${keyframes}}`}</style>
          <div
            data-ui="Text"
            style={{
              position: 'relative',
              // @TODO read from theme
              fontWeight: 400,
              // @TODO read from theme
              padding: '1px 0px',
              // @TODO use rem calc
              fontSize: '1rem',
              // @TODO use rem calc
              lineHeight: 'calc(1.3125)',
              // @TODO use rem calc
              transform: 'translateY(-5px)',
              color: theme.color[scheme].default.muted.default.enabled.muted.fg,
            }}
          >
            <span>Loading…</span>
          </div>
          <div data-ui="Spinner" style={styles.wrapper}>
            <SpinnerIcon style={styles.svg} />
          </div>
        </div>
      </div>
    </>
  )
}
