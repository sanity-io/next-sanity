import {useDraftModeEnvironment} from './useDraftMode'

/**
 * Detects if the application is considered to be in a "Live Preview" mode.
 * Live Preview means that the application is either:
 * - being previewed inside Sanity Presentation Tool
 * - being previewed in Draft Mode, with a `browserToken` given to `defineLive`, also known as "Standalone Live Preview'"
 * When in Live Preview mode, you typically want UI to update as new content comes in, without any manual intervention.
 * This is very different from Live Production mode, where you usually want to delay updates that might cause layout shifts,
 * to avoid interrupting the user that is consuming your content.
 * This hook lets you adapt to this difference, making sure production doesn't cause layout shifts that worsen the UX,
 * while in Live Preview mode layout shift is less of an issue and it's better for the editorial experience to auto refresh in real time.
 *
 * The hook returns `null` initially, to signal it doesn't yet know if it's live previewing or not.
 * Then `true` if it is, and `false` otherwise.
 * @public
 */
export function useIsLivePreview(): boolean | null {
  const environment = useDraftModeEnvironment()
  return environment === 'checking'
    ? null
    : environment === 'presentation-iframe' ||
        environment === 'presentation-window' ||
        environment === 'live'
}
