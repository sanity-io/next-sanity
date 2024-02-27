'use server'
/**
 * The code in this file will be ported to `next-sanity`
 */
import {revalidatePath} from 'next/cache.js'
import {draftMode} from 'next/headers.js'

export async function revalidateRootLayout(): Promise<void> {
  if (!draftMode().isEnabled) {
    // eslint-disable-next-line no-console
    console.debug('Skipped revalidatePath request because draft mode is not enabled')
    return
  }
  await revalidatePath('/', 'layout')
}
