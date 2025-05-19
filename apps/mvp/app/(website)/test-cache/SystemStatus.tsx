'use client'

import useSWR from 'swr'

type StatusResponse = {
  page?: {
    id?: string
    name?: string
    url?: string
    time_zone?: string
    updated_at?: string
  }
  status?: {
    description?: string
    indicator?: string
  }
}

const statusStyleMap: Record<string, string> = {
  pending: '!text-gray-500-dynamic',
  none: '!text-green-700-dynamic',
  critical: '!text-red-700-dynamic',
  major: '!text-yellow-700-dynamic',
  minor: '!text-orange-700-dynamic',
}

export function SystemStatus() {
  const url = 'https://qzkkn6cg4njg.statuspage.io/api/v2/status.json'
  const {data} = useJSON<StatusResponse>(url)
  const isPending = !!data?.status?.indicator

  return (
    <a href={data?.page?.url}>
      {isPending ? data?.status?.description : 'Loading system status...'}
    </a>
  )
}

function fetchJSON(url: string) {
  return fetch(url).then((res) => res.json())
}

export function useJSON<T>(url: Parameters<typeof useSWR>[0]) {
  return useSWR<T>(url, fetchJSON)
}
