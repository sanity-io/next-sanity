import './globals.css'

import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'

import ConditionalPreviewProvider from './ConditionalPreviewProvider'
import StyledComponentsRegistry from './registry'

const VisualEditing = dynamic(() => import('./VisualEditing'))

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        <StyledComponentsRegistry>
          <ConditionalPreviewProvider>{children}</ConditionalPreviewProvider>
        </StyledComponentsRegistry>
        {draftMode().isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
