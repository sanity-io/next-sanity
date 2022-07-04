import {useEffect, useState} from 'react'
import {CurrentUser} from './types'
import {getAborter, Aborter} from './aborter'

export function createCurrentUserHook({projectId}: {projectId: string; dataset?: string}) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return () => useCurrentUser(projectId)
}

export function getCurrentUser(
  projectId: string,
  abort: Aborter,
  token?: string
): Promise<CurrentUser | null> {
  const headers = token ? {Authorization: `Bearer ${token}`} : undefined
  return fetch(`https://${projectId}.api.sanity.io/v1/users/me`, {
    credentials: 'include',
    signal: abort.signal,
    headers,
  })
    .then((res) => res.json())
    .then((res) => (res?.id ? res : null))
}

function useCurrentUser(projectId: string) {
  const [data, setUser] = useState<CurrentUser | null>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const aborter = getAborter()
    getCurrentUser(projectId, aborter)
      .then(setUser)
      .catch((err: Error) => err.name !== 'AbortError' && setError(err))

    return () => {
      aborter.abort()
    }
  }, [projectId])

  return {data, error, loading: data !== null || !error}
}
