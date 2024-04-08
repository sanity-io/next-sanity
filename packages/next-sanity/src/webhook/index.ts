import type {SanityDocument} from '@sanity/types'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import type {NextRequest} from 'next/server'

/** @public */
export type ParsedBody<T> = {
  /**
   * If a secret is given then it returns a boolean. If no secret is provided then no validation is done on the signature, and it'll return `null`
   */
  isValidSignature: boolean | null
  body: T | null
}

/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 */
export async function parseBody<Body = SanityDocument>(
  req: NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency = true,
): Promise<ParsedBody<Body>> {
  const signature = req.headers.get(SIGNATURE_HEADER_NAME)
  if (!signature) {
    console.error('Missing signature header')
    return {body: null, isValidSignature: null}
  }

  const body = await req.text()
  const validSignature = secret ? await isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return {
    body: body.trim() ? JSON.parse(body) : null,
    isValidSignature: validSignature,
  }
}
