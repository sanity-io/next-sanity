// PreviewWrapper.tsx

import {Slot} from '@radix-ui/react-slot'
import {QueryParams} from '@sanity/client'
import {PropsWithChildren} from 'react'

import {PreviewData} from './PreviewData'

type PreviewWrapperProps<T> = PropsWithChildren<{
  initialData: T
  preview?: boolean
  query?: string
  params?: QueryParams
}>

// Component just renders its children if preview mode is not enabled
export function PreviewWrapper<T>(props: PreviewWrapperProps<T>) {
  const {
    // Is preview mode active?
    preview = false,
    // If so, listen to this query
    query = null,
    // With these params
    params = {},
    // Separate remaining props to pass to the child
    ...rest
  } = props

  // Render child, with the wrapper's initial data and props
  if (!preview || !query) {
    const nonPreviewProps = {...rest, data: props.initialData}

    return <Slot {...nonPreviewProps} />
  }

  // Swap initialData for live data
  return (
    <PreviewData<typeof props.initialData>
      initialData={props.initialData}
      query={query}
      params={params}
    >
      {props.children}
    </PreviewData>
  )
}
