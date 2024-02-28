// https://nextjs.org/docs/app/building-your-application/styling/css-in-js#styled-components
import {useServerInsertedHTML} from 'next/navigation.js'
import {useState, useSyncExternalStore} from 'react'
import {ServerStyleSheet, StyleSheetManager} from 'styled-components'

export function StyledComponentsRegistry({children}: {children: React.ReactNode}): JSX.Element {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  if (isMounted) return <>{children}</>

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>{children}</StyleSheetManager>
  )
}
// eslint-disable-next-line no-empty-function
const subscribe = () => () => {}
