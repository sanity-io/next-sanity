/**
 * Original source is `@radix-ui/react-slot`: https://github.com/radix-ui/primitives/blob/3e0642e40038386d58da9fb1d812c2fbfe9f67c1/packages/react/slot/src/Slot.tsx
 * It's copied and modified here as the original doesn't override the props on children, which would require us to use this pattern:
 * ```<LiveQuery initialData={data}><Posts /></LiveQuery>```
 * However, we want to use this pattern as it preserves the same type safety as before live queries are added:
 * ```<LiveQuery initialData={data}><Posts data={data} /></LiveQuery>```
 *
 * It also made sense to modify the original as our use case is smaller than radix, for example we don't have to worry about merging `style` props
 */

import {composeRefs} from '@radix-ui/react-compose-refs'
import {Children, cloneElement, forwardRef, isValidElement} from 'react'

/* -------------------------------------------------------------------------------------------------
 * Slot
 * -----------------------------------------------------------------------------------------------*/

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
  as?: React.ElementType
}

export const Slot = forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
  const {children, ...slotProps} = props
  return (
    <SlotClone {...slotProps} ref={forwardedRef}>
      {children}
    </SlotClone>
  )
})

Slot.displayName = 'Slot'

/* -------------------------------------------------------------------------------------------------
 * SlotClone
 * -----------------------------------------------------------------------------------------------*/

export interface SlotCloneProps {
  children: React.ReactNode
}

export const SlotClone = forwardRef<any, SlotCloneProps>((props, forwardedRef) => {
  const {children, ...slotProps} = props

  if (isValidElement(children)) {
    return cloneElement(children, {
      ...mergeProps(slotProps, children.props),
      // @ts-expect-error -- mot sure how to satisfy the typings here
      ref: forwardedRef
        ? composeRefs(forwardedRef, (children as any).ref)
        : (children as any).ref,
    })
  }

  return Children.count(children) > 1 ? Children.only(null) : null
})

SlotClone.displayName = 'SlotClone'

/* ---------------------------------------------------------------------------------------------- */

type AnyProps = Record<string, any>

function mergeProps({data, ...slotProps}: AnyProps, childProps: AnyProps) {
  // all child props should override, except for `data`
  return {...slotProps, ...childProps, data}
}
