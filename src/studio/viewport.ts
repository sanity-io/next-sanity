import type {Viewport} from 'next'

import {viewport as _viewport} from './head'

/**
 * @public
 * @deprecated use `export {viewport} from 'next-sanity/studio'` instead
 */
export const viewport = _viewport satisfies Viewport
