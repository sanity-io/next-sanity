import {memo} from 'react'

/** @public */
export interface NextStudioLayoutProps {
  children: React.ReactNode
}

const NextStudioLayoutComponent = ({children}: NextStudioLayoutProps) => {
  return (
    <div
      id="sanity"
      data-ui="NextStudioLayout"
      style={{
        height: '100vh',
        maxHeight: '100dvh',
        overscrollBehavior: 'none',
        WebkitFontSmoothing: 'antialiased',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  )
}

/** @public */
export const NextStudioLayout = memo(NextStudioLayoutComponent)
