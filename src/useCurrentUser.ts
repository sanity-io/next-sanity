import {useEffect, useState} from 'react'
import {CurrentUser} from './types'

export function createCurrentUserHook({projectId}: {projectId: string; dataset?: string}) {
  return () => useCurrentUser(projectId)
}

function useCurrentUser(projectId: string) {
  const [data, setUser] = useState<CurrentUser | null>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`https://${projectId}.api.sanity.io/v1/users/me`, {credentials: 'include'})
      .then((res) => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [projectId])

  return {data, error, loading}
}
