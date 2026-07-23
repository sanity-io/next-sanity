'use client'

import {createContext} from 'react'

export const DraftModeVariantContext = createContext<'checking' | 'unknown' | (string & {}) | null>(
  'unknown',
)
