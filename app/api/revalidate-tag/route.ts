/* eslint-disable no-process-env */
import {revalidateTag} from 'next/cache'
import {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {parseBody} from 'src/webhook'

// Triggers a revalidation of the static data in the example above
export async function POST(req: NextRequest): Promise<any> {
  try {
    const {body, isValidSignature} = await parseBody<{
      _type: string
      _id: string
      slug?: string | undefined
    }>(req as any, process.env.SANITY_REVALIDATE_SECRET)
    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(message, {status: 401})
    }

    if (!body?._type) {
      return new Response('Bad Request', {status: 400})
    }

    await Promise.all(
      [body.slug, body._type, body._id].map(
        (tag) => typeof tag === 'string' && revalidateTag(tag),
      ),
    )
    return NextResponse.json({...body, router: 'app'})
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, {status: 500})
  }
}
