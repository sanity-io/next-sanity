import dynamic from 'next/dynamic.js'

export {metadata, viewport} from './head'
export * from './NextStudioLayout'
export * from './NextStudioNoScript'
export type {NextStudioProps} from 'next-sanity/studio/client-component'
export const NextStudio = dynamic(() => import('next-sanity/studio/client-component'), {ssr: false})
