import {NextStudio, type NextStudioProps} from 'next-sanity/studio/client-component'
import {preloadModule} from 'react-dom'

const bridgeScript = 'https://core.sanity-cdn.com/bridge.js'

export function NextStudioWithBridge(props: NextStudioProps): React.JSX.Element {
  preloadModule(bridgeScript, {as: 'script'})

  return (
    <>
      <NextStudio {...props} />
    </>
  )
}
