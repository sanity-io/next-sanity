'use client'

import type {LivePerspective} from 'next-sanity/live'
import {createContext} from 'react'

export const DraftModePerspectiveContext = createContext<'checking' | 'unknown' | LivePerspective>(
  'unknown',
)
