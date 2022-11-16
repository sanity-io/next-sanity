/*
import type {GroqStore} from '@sanity/groq-store'
import {
  type Params,
  type PreviewConfig,
  type UsePreview,
  _checkAuth,
  _definePreview,
  _lazyEventSourcePolyfill,
  _lazyGroqStore,
} from '@sanity/preview-kit'
import {cache, use} from 'react'

const lazyEventSourcePolyfill = cache(_lazyEventSourcePolyfill)
const lazyGroqStore = cache(_lazyGroqStore)
const checkAuth = cache(_checkAuth)
const preload = cache((store: GroqStore, query: string, params?: Params) =>
  store.query<any>(query, params)
)
// */

/**
 * @public
 */
/*
export const definePreview = (config: PreviewConfig): UsePreview =>
  _definePreview({
    ...config,
    importEventSourcePolyfill: () => use(lazyEventSourcePolyfill()),
    importGroqStore: () => use(lazyGroqStore()),
    checkAuth: (projectId, token) => use(checkAuth(projectId, token)),
    preload: (store, query, params) => use(preload(store, query, params)),
  })
// */

export type {Params, PreviewConfig, UsePreview} from '@sanity/preview-kit'
export {definePreview} from '@sanity/preview-kit'
