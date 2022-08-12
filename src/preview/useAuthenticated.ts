import {useEffect, useReducer, useRef} from 'react'

import {getAborter} from '../aborter'
import {getCurrentUser} from '../currentUser'

export type AuthMode = 'dual' | 'token' | 'cookie'

export const getAuthMode = (authMode: string): AuthMode => {
  switch (authMode) {
    case 'cookie':
    case 'dual':
    case 'token':
      return authMode
    default:
      return 'dual'
  }
}

export type AuthenticatedState = 'token' | 'cookie' | 'failed' | 'checking'

export type AuthenticatedHookProps = {
  projectId: string
  authMode: AuthMode
  token?: string
}
export const useAuthenticated = ({
  projectId,
  authMode: _authMode,
  token,
}: AuthenticatedHookProps): AuthenticatedState => {
  const authMode = getAuthMode(_authMode)
  const [, checked] = useReducer(() => true, false)
  const ref = useRef<AuthenticatedState>('checking')

  if ((authMode === 'dual' || authMode === 'token') && !token) {
    throw new Error(`Token is required for token auth mode: ${JSON.stringify(authMode)}`)
  }

  useEffect(() => {
    if (ref.current !== 'checking') return

    const aborter = getAborter()
    async function check() {
      if (authMode === 'dual' || authMode === 'cookie') {
        const user = await getCurrentUser(projectId, aborter)
        if (user) {
          ref.current = 'cookie'
          return
        }
      }
      if (authMode === 'dual' || authMode === 'token') {
        const user = await getCurrentUser(projectId, aborter, token)
        if (user) {
          ref.current = 'token'
          return
        }
      }

      ref.current = 'failed'
    }
    check()
      .catch((reason) => {
        console.error('Failed to check auth', reason)
        ref.current = 'failed'
      })
      .finally(checked)
    // eslint-disable-next-line consistent-return
    return () => aborter.abort()
  }, [authMode, projectId, token])

  return ref.current
}
