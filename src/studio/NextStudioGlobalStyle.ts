import {createGlobalStyle, css} from 'styled-components'

export interface NextStudioGlobalStyleProps {
  fontFamily?: string
  bg?: string
  unstable__tailwindSvgFix?: boolean
}
export const NextStudioGlobalStyle = createGlobalStyle<NextStudioGlobalStyleProps>`
${({bg}) =>
  bg
    ? css`
        html {
          background-color: ${bg};
        }
      `
    : ''}
html,
body,
#__next {
  height: 100%;
}
body {
  margin: 0;
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
}
${({fontFamily}) =>
  fontFamily
    ? css`
        #__next {
          font-family: ${fontFamily};
        }
      `
    : ''}
${({unstable__tailwindSvgFix}) =>
  unstable__tailwindSvgFix
    ? css`
        /* override tailwind reset */
        :root svg {
          display: inline;
        }
      `
    : ''}`
