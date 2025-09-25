import {useDraftModeEnvironment} from './useDraftMode'

/**
 * Detects if the application is being previewed inside Sanity Presentation Tool.
 * Presentation Tool can open the application in an iframe, or in a new window.
 * When in this context there are some UI you usually don't want to show,
 * for example a Draft Mode toggle, or a "Viewing draft content" indicators, these are unnecessary and add clutter to
 * the editorial experience.
 * The hook returns `null` initially, when it's not yet sure if the application is running inside Presentation Tool,
 * then `true` if it is, and `false` otherwise.
 * @public
 */
export function useIsPresentationTool(): boolean | null {
  const environment = useDraftModeEnvironment()
  return environment === 'checking'
    ? null
    : environment === 'presentation-iframe' || environment === 'presentation-window'
}
