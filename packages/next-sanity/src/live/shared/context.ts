import type {ClientPerspective} from '@sanity/client'
import type {Node} from '@sanity/comlink'
import type {LoaderControllerMsg, LoaderNodeMsg} from '@sanity/presentation-comlink'

export const comlinkListeners: Set<() => void> = new Set()
export let comlink: Node<LoaderNodeMsg, LoaderControllerMsg> | null = null
export let comlinkProjectId: string | null = null
export let comlinkDataset: string | null = null
export let comlinkPerspective: ClientPerspective | null = null
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
export function setComlinkPerspective(nextComlinkPerspective: ClientPerspective | null): void {
  if (comlinkPerspective?.toString() === nextComlinkPerspective?.toString()) return
  comlinkPerspective = nextComlinkPerspective
  for (const onComlinkChange of comlinkListeners) {
    onComlinkChange()
  }
}
