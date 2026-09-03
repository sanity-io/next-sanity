import {refresh} from 'next/cache'

export function RefreshButton() {
  return (
    <button
      className="rounded bg-blue-500 px-2 py-1 font-medium text-white"
      onClick={async function () {
        'use server'
        refresh()
      }}
    >
      Refresh
    </button>
  )
}
