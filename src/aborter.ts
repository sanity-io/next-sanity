export interface Aborter {
  abort(): void
  signal: AbortSignal
}

class MockAbortController {
  _signal = {aborted: false}
  get signal() {
    return this._signal as AbortSignal
  }
  abort() {
    this._signal.aborted = true
  }
}

export function getAborter(): Aborter {
  return typeof AbortController === 'undefined'
    ? new MockAbortController()
    : new AbortController()
}
