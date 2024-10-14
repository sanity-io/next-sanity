'use server'
import {revalidatePath} from 'next/cache.js'
import {draftMode} from 'next/headers.js'

export async function revalidateRootLayout(): Promise<void> {
  if (!(await draftMode()).isEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Skipped revalidatePath request because draft mode is not enabled')
    return
  }
  await revalidatePath('/', 'layout')
}
