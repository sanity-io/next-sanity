import {draftMode} from 'next/headers'
import {redirect} from 'next/navigation'

export async function GET(request: Request) {
  ;(await draftMode()).disable()
  redirect(new URL(request.url).searchParams.get('redirect') || '/p/a')
}
