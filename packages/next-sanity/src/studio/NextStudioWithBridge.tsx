import {NextStudio, type NextStudioProps} from 'next-sanity/studio/client-component'
import {preloadModule} from 'react-dom'

/**
 * Loads the bridge script the same way Sanity Studio does:
 * https://github.com/sanity-io/sanity/blob/bd5b1acb5015baaddd8d96c2abd1eaf579b3c904/packages/sanity/src/_internal/cli/server/renderDocument.tsx#L124-L139
 */

const bridgeScript = 'https://core.sanity-cdn.com/bridge.js'

export function NextStudioWithBridge(props: NextStudioProps): React.JSX.Element {
  preloadModule(bridgeScript, {as: 'script'})

  return (
    <>
      <script src={bridgeScript} async type="module" data-sanity-core />
      <NextStudio {...props} />
    </>
  )
}
