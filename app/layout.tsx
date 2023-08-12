import './globals.css'

import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'

import {getDraftModeToken} from './getDraftModeToken'
import StyledComponentsRegistry from './registry'

const PreviewProvider = dynamic(() => import('./PreviewProvider'))

export default function RootLayout({children}: {children: React.ReactNode}) {
  const isDraftMode = draftMode().isEnabled
  return (
    <html lang="en">
      <head />
      <body>
        <StyledComponentsRegistry>
          {isDraftMode ? (
            <PreviewProvider token={getDraftModeToken()!}>{children}</PreviewProvider>
          ) : (
            children
          )}
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
