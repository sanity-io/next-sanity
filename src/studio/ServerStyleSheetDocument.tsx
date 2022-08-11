// We can disable this rule safely as we're not trying to use it outside pages/document, we're shipping a wrapper
// eslint-disable-next-line @next/next/no-document-import-in-page
import Document, {type DocumentContext} from 'next/document'
import {ServerStyleSheet} from 'styled-components'

/**
 * Usage, from a pages/_document.tsx file:
 * import {ServerStyleSheetDocument} from 'next-sanity/studio'
 *
 * export default class MyDocument extends ServerStyleSheetDocument {}
 *
 * To do extra stuff in getInitialProps:
 * import {ServerStyleSheetDocument} from 'next-sanity/studio'
 * import { type DocumentContext } from 'next/document'
 *
 * export default class MyDocument extends ServerStyleSheetDocument {
 *  static async getInitialProps(ctx: DocumentContext) {
 *    // You can still override renderPage:
 *    const originalRenderPage = ctx.renderPage
 *    ctx.renderPage = () => originalRenderPage({
 *       enhanceApp: (App) => (props) => <App {...props} />
 *    })
 *
 *    const initialProps = await ServerStyleSheetDocument.getInitialProps(ctx)
 *    const extraStyles = await getStyles()
 *    return {
 *      ...initialProps,
 *      styles: [initialProps.styles, extraStyles],
 *    }
 *  }
 * }
 */

export class ServerStyleSheetDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      }
    } finally {
      sheet.seal()
    }
  }
}
