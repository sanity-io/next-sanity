import EventSource from 'eventsource'
import {memo} from 'react'

import {type PreviewSubscriptionProps, PreviewSubscription} from './PreviewSubscription'

// EventSource is a very chonky boi, that's why this is in a separate component
// eslint-disable-next-line no-warning-comments
// @TODO implement code-splitting and lazy loading for this component

export interface PreviewSubscriptionWithTokenProps
  // EventSource is provided by this component, if you're providing it then just use PreviewSubscription directly
  extends Omit<PreviewSubscriptionProps, 'EventSource' | 'token'> {
  token: string
}
const PreviewSubscriptionWithTokenComponent = ({
  token,
  ...props
}: PreviewSubscriptionWithTokenProps) => {
  if (!token) {
    throw new TypeError('token is required')
  }

  return <PreviewSubscription {...props} token={token} EventSource={EventSource} />
}

export const PreviewSubscriptionWithToken = memo(PreviewSubscriptionWithTokenComponent)

// Re-export as default to support React.lazy use cases
export default PreviewSubscriptionWithToken
