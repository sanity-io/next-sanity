import type {ClientPerspective} from '@sanity/client'
import {type Node} from '@sanity/comlink'
import {type LoaderControllerMsg, type LoaderNodeMsg} from '@sanity/presentation-comlink'

/**
 * The Sanity Client perspective used when fetching data in Draft Mode, in the `sanityFetch` calls
 * used by React Server Components on the page. Note that some of them might set the `perspective` to a different value.
 * This value is what's used by default.
 * @public
 */
export type DraftPerspective = 'checking' | 'unknown' | ClientPerspective

/** @internal */
export const perspectiveListeners: Set<() => void> = new Set()
/** @internal */
export let perspective: DraftPerspective = 'checking'
/** @internal */
export function setPerspective(nextPerspective: DraftPerspective): void {
  if (perspective.toString() === nextPerspective.toString()) return
  perspective = nextPerspective
  for (const onPerspectiveChange of perspectiveListeners) {
    onPerspectiveChange()
  }
}

/**
 *
 * @public
 */
export type DraftEnvironment =
  | 'checking'
  | 'presentation-iframe'
  | 'presentation-window'
  | 'live'
  | 'static'
  | 'unknown'

/** @internal */
export const environmentListeners: Set<() => void> = new Set()
/** @internal */
export let environment: DraftEnvironment = 'checking'
/** @internal */
export function setEnvironment(nextEnvironment: DraftEnvironment): void {
  environment = nextEnvironment
  for (const onEnvironmentChange of environmentListeners) {
    onEnvironmentChange()
  }
}

/** @internal */
export const comlinkListeners: Set<() => void> = new Set()
/** @internal */
export let comlink: Node<LoaderNodeMsg, LoaderControllerMsg> | null = null
/** @internal */
export let comlinkProjectId: string | null = null
/** @internal */
export let comlinkDataset: string | null = null
/** @internal */
export function setComlink(nextComlink: Node<LoaderNodeMsg, LoaderControllerMsg> | null): void {
  comlink = nextComlink
  for (const onComlinkChange of comlinkListeners) {
    onComlinkChange()
  }
}
/** @internal */
export function setComlinkClientConfig(
  nextComlinkProjectId: string | null,
  nextComlinkDataset: string | null,
): void {
  comlinkProjectId = nextComlinkProjectId
  comlinkDataset = nextComlinkDataset
  for (const onComlinkChange of comlinkListeners) {
    onComlinkChange()
  }
}
