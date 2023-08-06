import {revalidateTag} from 'next/cache'
import {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {parseAppBody} from 'src/webhook'

// Triggers a revalidation of the static data in the example above
export async function POST(req: NextRequest): Promise<any> {
  try {
    // eslint-disable-next-line no-process-env
    const {body, isValidSignature} = await parseAppBody(req, process.env.SANITY_REVALIDATE_SECRET)
    if (isValidSignature === false) {
      const message = 'Invalid signature'
      return new Response(message, {status: 401})
    }

    if (!body._type) {
      return new Response('Bad Request', {status: 400})
    }

    await revalidateTag(body._type)
    return NextResponse.json(body)
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, {status: 500})
  }
}
