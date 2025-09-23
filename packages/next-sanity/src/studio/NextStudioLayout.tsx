/** @public */
export interface NextStudioLayoutProps {
  children: React.ReactNode
}

const style = {
  height: '100vh',
  maxHeight: '100dvh',
  overscrollBehavior: 'none',
  WebkitFontSmoothing: 'antialiased',
  overflow: 'auto',
} satisfies React.CSSProperties

/** @public */
export const NextStudioLayout = ({children}: NextStudioLayoutProps): React.JSX.Element => {
  return (
    <div id="sanity" data-ui="NextStudioLayout" style={style}>
      {children}
    </div>
  )
}
