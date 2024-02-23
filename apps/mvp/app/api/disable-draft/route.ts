import {draftMode} from 'next/headers'
import {redirect} from 'next/navigation'

export function GET(): void {
  draftMode().disable()
  redirect('/')
}
