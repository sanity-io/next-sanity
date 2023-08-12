'use client'

import type {QueryParams as ClientQueryParams} from '@sanity/client'
import {useLiveQuery} from '@sanity/preview-kit/use-live-query'
import type {PropsWithChildren} from 'react'
import {Children, cloneElement, isValidElement} from 'react'

export type {ClientQueryParams}

export type LiveQueryReadyProps<QueryResult, QueryParams> = PropsWithChildren<{
  initialData: QueryResult
  query: string
  params?: QueryParams | undefined
}>

// eslint-disable-next-line no-console
console.log('LiveQueryReady.tsx')

// Browser-only preview component, overwrites the data prop with live data on-demand
export default function LiveQueryReady<
  QueryResult,
  QueryParams extends ClientQueryParams = ClientQueryParams,
>(props: LiveQueryReadyProps<QueryResult, QueryParams>) {
  const {initialData, query, params, children} = props
  const [data] = useLiveQuery<QueryResult, QueryParams>(initialData, query, params)

  return <Slot data={data}>{children}</Slot>
}

/**
 * Original source for `Slot` is `@radix-ui/react-slot`: https://github.com/radix-ui/primitives/blob/3e0642e40038386d58da9fb1d812c2fbfe9f67c1/packages/react/slot/src/Slot.tsx
 * It's copied and modified here as the original doesn't override the props on children, which would require us to use this pattern:
 * ```<LiveQuery initialData={data}><Posts /></LiveQuery>```
 * However, we want to use this pattern as it preserves the same type safety as before live queries are added:
 * ```<LiveQuery initialData={data}><Posts data={data} /></LiveQuery>```
 *
 * It also made sense to modify the original as our use case is smaller than radix, for example we don't have to worry about merging `style` props
 */

interface SlotProps {
  children: React.ReactNode
  data: any
}

const Slot = (props: SlotProps) => {
  const {children, ...slotProps} = props

  if (isValidElement(children)) {
    return cloneElement(children, {
      ...mergeProps(slotProps, children.props),
      // eslint-disable-next-line no-warning-comments
      // @ts-expect-error -- @todo fix the typings
      ref: children.ref,
    })
  }

  return Children.count(children) > 1 ? Children.only(null) : null
}

/* ---------------------------------------------------------------------------------------------- */

type AnyProps = Record<string, any>

function mergeProps({data, ...slotProps}: Omit<SlotProps, 'children'>, childProps: AnyProps) {
  // all child props should override, except for `data`
  return {...slotProps, ...childProps, data}
}
