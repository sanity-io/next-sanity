'use server'
/**
 * The code in this file will be ported to `next-sanity`
 */
import {revalidatePath} from 'next/cache.js'
import {draftMode} from 'next/headers.js'

export async function revalidateRootLayout(): Promise<void> {
  try {
    if (!draftMode().isEnabled) {
      // eslint-disable-next-line no-console
      console.debug('Skipped revalidatePath request because draft mode is not enabled')
      return
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error while checking if Draft Mode is enabled', err)
    if (!(err as Error)?.message.includes('requestAsyncStorage')) {
      console.warn('Ignoring')
      return
    }
  }
  await revalidatePath('/', 'layout')
}
