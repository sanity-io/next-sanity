// https://nextjs.org/docs/app/building-your-application/styling/css-in-js#styled-components
import {useServerInsertedHTML} from 'next/navigation.js'
import {useState} from 'react'
import {ServerStyleSheet, StyleSheetManager} from 'styled-components'

export function StyledComponentsRegistry({
  children,
  isMounted,
}: {
  children: React.ReactNode
  isMounted: boolean
}): React.JSX.Element {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  if (isMounted) return <>{children}</>

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>{children}</StyleSheetManager>
  )
}
