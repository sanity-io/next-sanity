import type {SanityDocument} from '@sanity/types'
import sanityWebhook from '@sanity/webhook'
import type {NextApiRequest} from 'next'
import {NextRequest} from 'next/server'

// As `@sanity/webhook` isn't shipping ESM, extracting from the default export have the best ecosystem support
const {isValidSignature, SIGNATURE_HEADER_NAME} = sanityWebhook

import {_readBody as readBody} from './readBody'

/** @public */
export type ParseBody = {
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
export async function parseBody(
  req: NextApiRequest | NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true
): Promise<ParseBody> {
  let signature
  if (req instanceof NextRequest) {
    signature = req.headers.get(SIGNATURE_HEADER_NAME)!
  } else {
    signature = req.headers[SIGNATURE_HEADER_NAME]!
  }
  if (Array.isArray(signature)) {
    signature = signature[0]
  }
  let body
  if (req instanceof NextRequest) {
    body = JSON.stringify(await req.json())
  } else {
    body = await readBody(req)
  }
  const validSignature = secret ? isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    body: body.trim() && JSON.parse(body),
    isValidSignature: validSignature,
  }
}
