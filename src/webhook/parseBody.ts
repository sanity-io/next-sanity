import type {SanityDocument} from '@sanity/types'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import type {NextApiRequest} from 'next'
import type {NextRequest} from 'next/server'

import {_readBody as readBody} from './readBody'

/** @public */
export type ParsedBody<T> = {
  /**
   * If a secret is given then it returns a boolean. If no secret is provided then no validation is done on the signature, and it'll return `null`
   */
  isValidSignature: boolean | null
  body: T | null
}

/**
 * @deprecated Use `ParsedBody` instead
 * @public
 */
export type ParseBody<Body = SanityDocument> = ParsedBody<Body>
/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 */
export async function parseBody<Body = SanityDocument>(
  req: NextApiRequest,
  secret?: string,
  waitForContentLakeEventualConsistency?: boolean,
): Promise<ParsedBody<Body>>
/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 */
export async function parseBody<Body = SanityDocument>(
  req: NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency?: boolean,
): Promise<ParsedBody<Body>>
/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 */
// eslint-disable-next-line require-await
export async function parseBody<Body = SanityDocument>(
  req: NextApiRequest | NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true,
): Promise<ParsedBody<Body>> {
  // @ts-expect-error -- add global typings for EdgeRuntime
  if (typeof EdgeRuntime !== 'undefined') {
    throw new TypeError(
      `The edge runtime isn't supported. You'll have to use the 'nodejs' runtime until the underlying \`@sanity/webhook\` package is updated to support it.`,
    )
  }
  return 'text' in req
    ? parseAppBody(req, secret, waitForContentLakeEventualConsistency)
    : parsePageBody(req, secret, waitForContentLakeEventualConsistency)
}

async function parsePageBody<Body = SanityDocument>(
  req: NextApiRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true,
): Promise<ParsedBody<Body>> {
  let signature = req.headers[SIGNATURE_HEADER_NAME]
  if (Array.isArray(signature)) {
    signature = signature[0]
  }
  if (!signature) {
    console.error('Missing signature header')
    return {body: null, isValidSignature: null}
  }

  if (req.readableEnded) {
    throw new Error(
      `Request already ended and the POST body can't be read. Have you setup \`export {config} from 'next-sanity/webhook' in your webhook API handler?\``,
    )
  }

  const body = await readBody(req)
  const validSignature = secret ? isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    body: body.trim() ? JSON.parse(body) : null,
    isValidSignature: validSignature,
  }
}

/**
 * @deprecated Use `ParsedBody` instead
 * @public
 */
export type ParseAppBody<Body = SanityDocument> = ParsedBody<Body>
/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @deprecated Use `parseBody` instead
 * @public
 */
export async function parseAppBody<Body = SanityDocument>(
  req: NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true,
): Promise<ParsedBody<Body>> {
  const signature = req.headers.get(SIGNATURE_HEADER_NAME)!
  if (!signature) {
    console.error('Missing signature header')
    return {body: null, isValidSignature: null}
  }

  const body = await req.text()
  const validSignature = secret ? isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    body: body.trim() ? JSON.parse(body) : null,
    isValidSignature: validSignature,
  }
}
