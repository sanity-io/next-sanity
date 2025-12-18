'use client'

import dynamic from 'next/dynamic'

import type {VisualEditingProps} from './VisualEditing'

export const VisualEditing: React.ComponentType<VisualEditingProps> = dynamic(
  () => import('./VisualEditing'),
  {ssr: false},
)
export type {VisualEditingProps}
