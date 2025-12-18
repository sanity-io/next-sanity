import type {ClientPerspective} from '@sanity/client'
import type {Node} from '@sanity/comlink'
import type {LoaderControllerMsg, LoaderNodeMsg} from '@sanity/presentation-comlink'

export type LivePerspective = 'checking' | 'unknown' | ClientPerspective

export const perspectiveListeners: Set<() => void> = new Set()
export let perspective: LivePerspective = 'checking'
export function setPerspective(nextPerspective: LivePerspective): void {
  if (perspective.toString() === nextPerspective.toString()) return
  perspective = nextPerspective
  for (const onPerspectiveChange of perspectiveListeners) {
    onPerspectiveChange()
  }
}

export type LiveEnvironment =
  | 'checking'
  | 'presentation-iframe'
  | 'presentation-window'
  | 'live'
  | 'static'
  | 'unknown'

export const environmentListeners: Set<() => void> = new Set()
export let environment: LiveEnvironment = 'checking'
export function setEnvironment(nextEnvironment: LiveEnvironment): void {
  environment = nextEnvironment
  for (const onEnvironmentChange of environmentListeners) {
    onEnvironmentChange()
  }
}

export const comlinkListeners: Set<() => void> = new Set()
export let comlink: Node<LoaderNodeMsg, LoaderControllerMsg> | null = null
export let comlinkProjectId: string | null = null
export let comlinkDataset: string | null = null
export function setComlink(nextComlink: Node<LoaderNodeMsg, LoaderControllerMsg> | null): void {
  comlink = nextComlink
  for (const onComlinkChange of comlinkListeners) {
    onComlinkChange()
  }
}
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
