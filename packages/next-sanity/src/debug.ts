import {cacheTag} from 'next/cache'

const tag = 'sanity:debug'

export async function debug(): Promise<{data: number; cacheTags: [typeof tag]}> {
  const {resolve, promise} = Promise.withResolvers<number>()
  
  cacheTag(tag)

  setTimeout(() => resolve(Math.random()), 1_000)

  return {
    data: await promise,
    cacheTags: [tag],
  }
}