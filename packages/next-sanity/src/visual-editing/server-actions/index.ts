'use server'
import {revalidatePath} from 'next/cache'
import {draftMode} from 'next/headers'

export async function revalidateRootLayout(): Promise<void> {
  if (!(await draftMode()).isEnabled) {
    console.warn('Skipped revalidatePath request because draft mode is not enabled')
    return
  }
  revalidatePath('/', 'layout')
}
