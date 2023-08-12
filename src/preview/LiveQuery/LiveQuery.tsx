import type {QueryParams as ClientQueryParams} from '@sanity/client'
// import dynamic from 'next/dynamic'
import {Children, isValidElement} from 'react'

// import LiveQueryEnabled, {type LiveQueryEnabledProps} from './LiveQueryEnabled'
import {type LiveQueryReadyProps} from './LiveQueryReady'
import LiveQueryEnabled from './LiveQueryReadyLazy'

export type {ClientQueryParams, LiveQueryReadyProps}

/*
const LiveQueryEnabled = dynamic(
  () => import('./LiveQueryEnabledLazy'),
) as typeof import('./LiveQueryEnabled').default
// */

export interface LiveQueryProps<
  QueryResult,
  QueryParams extends ClientQueryParams = ClientQueryParams,
> extends LiveQueryReadyProps<QueryResult, QueryParams> {
  enabled: boolean
  // eslint-disable-next-line no-warning-comments
  // @TODO fix typing of this
  as?: any
}

const DEFAULT_PARAMS = {} as ClientQueryParams

// Component just renders its children if preview mode is not enabled
export function LiveQuery<QueryResult, QueryParams extends ClientQueryParams = ClientQueryParams>(
  props: LiveQueryProps<QueryResult, QueryParams>,
) {
  // Always passthrough when not enabled
  if (!props.enabled) {
    return props.children
  }

  const {query, params = DEFAULT_PARAMS, initialData, as: LiveComponent} = props
  // If we have an `as` prop it means we're likely working around a `children` that is RSC, and the `as` prop provides a Client Component
  if (LiveComponent) {
    if (Children.count(props.children) > 1) {
      throw new Error('LiveQuery: `as` prop can only be used with a single child')
    }
    if (!isValidElement(props.children)) {
      throw new Error('LiveQuery: `as` prop requires a valid `children` prop')
    }

    // All together now
    return (
      <LiveQueryEnabled<typeof initialData, typeof params>
        initialData={initialData}
        query={query}
        params={params}
      >
        <LiveComponent key={query} {...props.children.props} />
      </LiveQueryEnabled>
    )
  }

  // Setup a `useLiveQuery` wrapper and override the `data` prop on the children component
  return (
    <LiveQueryEnabled<typeof initialData, typeof params>
      initialData={initialData}
      query={query}
      params={params}
    >
      {props.children}
    </LiveQueryEnabled>
  )
}
