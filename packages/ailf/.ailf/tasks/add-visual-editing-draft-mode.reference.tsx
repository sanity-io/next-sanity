// Add Draft Mode and Visual Editing to a Next.js App Router app that already
// uses Sanity Live, plus the Presentation Tool on the Studio side.
//
// The flow: the Presentation Tool loads the frontend in an iframe and calls
// the draft mode enable route. With draft mode active, `sanityFetch` returns
// draft content with stega-encoded strings, and `<VisualEditing />` turns
// those into click-to-edit overlays that navigate the Studio to the right
// field.

// --- sanity/client.ts ---
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
  stega: {
    // Where click-to-edit overlays send editors. Point at the deployed
    // Studio URL in production.
    studioUrl: 'http://localhost:3333',
  },
})

// --- sanity/live.ts ---
import {defineLive} from 'next-sanity/live'

import {client} from '@/sanity/client'

// Server-only Viewer token: lets `sanityFetch` read draft content, and is
// securely shared with the browser during draft mode for live draft updates.
const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

// --- app/api/draft-mode/enable/route.ts ---
import {defineEnableDraftMode} from 'next-sanity/draft-mode'

import {client} from '@/sanity/client'

export const {GET} = defineEnableDraftMode({
  client: client.withConfig({
    token: process.env.SANITY_API_READ_TOKEN,
  }),
})

// --- app/api/draft-mode/disable/route.ts ---
import {draftMode} from 'next/headers'
import {NextResponse} from 'next/server'

export async function GET(request: Request) {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', request.url))
}

// --- components/DisableDraftMode.tsx ---
'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()

  // Inside the Presentation Tool the Studio controls draft mode.
  if (isPresentationTool) return null

  return <a href="/api/draft-mode/disable">Disable Draft Mode</a>
}

// --- app/layout.tsx ---
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

import {DisableDraftMode} from '@/components/DisableDraftMode'
import {SanityLive} from '@/sanity/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {(await draftMode()).isEnabled && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  )
}

// --- app/posts/[slug]/page.tsx ---
// Unchanged: `sanityFetch` automatically switches to the drafts perspective
// and enables stega encoding while draft mode is active.

// --- studio/sanity.config.ts ---
import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './src/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Blog Studio',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: {
        // Required when the frontend is a separate app; use the deployed URL
        // in production.
        origin: 'http://localhost:3000',
        previewMode: {
          // Must match the frontend's enable route.
          enable: '/api/draft-mode/enable',
        },
      },
    }),
  ],
  schema: {types: schemaTypes},
})

// --- .env.local (documentation only) ---
// The frontend origin must also be added as a CORS origin with credentials
// allowed: `npx sanity cors add http://localhost:3000 --credentials`
//
// NEXT_PUBLIC_SANITY_PROJECT_ID="<project-id>"
// NEXT_PUBLIC_SANITY_DATASET="production"
// SANITY_API_READ_TOKEN="<viewer-token>"
