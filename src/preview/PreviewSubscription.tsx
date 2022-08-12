import {memo, useEffect} from 'react'
import {unstable_batchedUpdates} from 'react-dom'

import {type SyncGroqStoreHookProps, useSyncGroqStore} from '.'

export interface PreviewSubscriptionProps extends SyncGroqStoreHookProps {
  onChange: (data: any) => void
}
const PreviewSubscriptionComponent = ({onChange, ...props}: PreviewSubscriptionProps) => {
  const data = useSyncGroqStore(props)
  useEffect(() => {
    unstable_batchedUpdates(() => onChange(data))
  }, [data, onChange])

  return null
}

export const PreviewSubscription = memo(PreviewSubscriptionComponent)
