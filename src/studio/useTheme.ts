import {useMemo} from 'react'
import {type Config, type SingleWorkspace, type StudioTheme, defaultTheme} from 'sanity'

/** @alpha */
export function useTheme(
  config?: Config | Required<Pick<SingleWorkspace, 'theme'>>
): StudioTheme {
  const workspace = useMemo<
    SingleWorkspace | Required<Pick<SingleWorkspace, 'theme'>> | undefined
  >(() => (Array.isArray(config) ? config[0] : config), [config])
  return useMemo<StudioTheme>(() => workspace?.theme || defaultTheme, [workspace])
}
