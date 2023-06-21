import type {SanityDocument} from '@sanity/types'
import sanityWebhook from '@sanity/webhook'
import {NextRequest} from 'next/server'

// As `@sanity/webhook` isn't shipping ESM, extracting from the default export have the best ecosystem support
const {isValidSignature, SIGNATURE_HEADER_NAME} = sanityWebhook

/** @public */
export type ParseAppBody = {
  /**
   * If a secret is given then it returns a boolean. If no secret is provided then no validation is done on the signature, and it'll return `null`
   */
  isValidSignature: boolean | null
  body: SanityDocument
}
/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 */
export async function parseAppBody(
  req: NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true
): Promise<ParseAppBody> {
  let signature = req.headers.get(SIGNATURE_HEADER_NAME)!

  const body = JSON.stringify(await req.json())
  const validSignature = secret ? isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    body: body.trim() && JSON.parse(body),
    isValidSignature: validSignature,
  }
}
