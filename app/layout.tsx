import './globals.css'

import ConditionalPreviewProvider from './ConditionalPreviewProvider'
import StyledComponentsRegistry from './registry'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        <StyledComponentsRegistry>
          <ConditionalPreviewProvider>{children}</ConditionalPreviewProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
