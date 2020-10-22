import {useEffect, useState} from 'react'
import {CurrentUser} from './types'
import {getAborter, Aborter} from './aborter'

export function createCurrentUserHook({projectId}: {projectId: string; dataset?: string}) {
  return () => useCurrentUser(projectId)
}

export function getCurrentUser(projectId: string, abort?: Aborter): Promise<CurrentUser | null> {
  return fetch(`https://${projectId}.api.sanity.io/v1/users/me`, {
    credentials: 'include',
    signal: abort?.signal,
  })
    .then((res) => res.json())
    .then((res) => (res?.id ? res : null))
    .catch((err: Error) => (err.name === 'AbortError' ? null : Promise.reject(err)))
}

function useCurrentUser(projectId: string) {
  const [data, setUser] = useState<CurrentUser | null>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const aborter = getAborter()
    getCurrentUser(projectId, aborter).then(setUser).catch(setError)
    return () => aborter.abort()
  }, [projectId])

  return {data, error, loading: data !== null || !error}
}
