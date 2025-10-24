import {refresh} from 'next/cache'

export function RefreshButton() {
  return (
    <button
      className="bg-blue-500 text-white px-2 py-1 rounded font-medium"
      onClick={async function () {
        'use server'
        refresh()
      }}
    >
      Refresh
    </button>
  )
}
