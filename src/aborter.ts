export interface Aborter {
  abort(): void
  signal?: AbortSignal
}

export function getAborter(): Aborter {
  return typeof AbortController === 'undefined'
    ? {signal: undefined, abort: noop}
    : new AbortController()
}

function noop() {
  // intentional noop
}
