import {memo, Suspense, useEffect} from 'react'

import {
  type PreviewSubscriptionProps,
  PreviewSubscription,
  PreviewSubscriptionWithToken,
  useAuthenticated,
} from '.'

export interface PreviewModeProps extends PreviewSubscriptionProps {
  authMode: 'dual' | 'token' | 'cookie'
  onAuth: (authState: 'token' | 'cookie' | 'failed') => void
}
const PreviewModeComponent = ({authMode, onAuth, token, ...props}: PreviewModeProps) => {
  const {projectId} = props
  const authState = useAuthenticated({projectId, authMode, token})

  useEffect(() => {
    if (onAuth && authState !== 'checking') {
      onAuth(authState)
    }
  }, [authState, onAuth])

  if (authState === 'failed' && !onAuth) {
    throw new Error('Failed to authenticate, provide an onAuth callback to silence this error')
  }

  switch (authState) {
    case 'checking':
    case 'failed':
      return null
    case 'token':
      return !props.EventSource && token ? (
        <Suspense fallback={null}>
          <PreviewSubscriptionWithToken {...props} token={token!} />
        </Suspense>
      ) : (
        <PreviewSubscription {...props} />
      )
    case 'cookie':
      return <PreviewSubscription {...props} />
    default:
      throw new Error(`Unknown auth state: ${authState}`)
  }
}

export const PreviewMode = memo(PreviewModeComponent)
