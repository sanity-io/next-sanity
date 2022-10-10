import {memo, useEffect} from 'react'

import {type SyncGroqStoreHookProps, useSyncGroqStore} from './useSyncGroqStore'

export interface PreviewSubscriptionProps extends SyncGroqStoreHookProps {
  onChange: (data: any) => void
}
const PreviewSubscriptionComponent = ({onChange, ...props}: PreviewSubscriptionProps) => {
  const data = useSyncGroqStore(props)
  useEffect(() => {
    onChange(data)
  }, [data, onChange])

  return null
}

export const PreviewSubscription = memo(PreviewSubscriptionComponent)
