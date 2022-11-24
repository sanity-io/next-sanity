import type {PageConfig} from 'next/types'

/**
 * Configurates the API function with the right runtime and body parsing to handle Sanity Webhook events.
 * @public
 */
export const config: PageConfig = {
  api: {
    /**
     * Next.js will by default parse the body, which can lead to invalid signatures.
     */
    bodyParser: false,
  },
  /**
   * `@sanity/webhook` isn't updated to support the edge runtime yet, and currently requires Node.js APIs such as Buffer.
   */
  runtime: 'nodejs',
}
