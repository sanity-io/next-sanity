import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {type Config, type StudioTheme, type WorkspaceOptions, defaultTheme} from 'sanity'

export function isWorkspaces(config: Config): config is WorkspaceOptions[] {
  return Array.isArray(config)
}

export interface WorkspaceWithTheme extends Omit<WorkspaceOptions, 'theme'> {
  theme: StudioTheme
}

export function isWorkspaceWithTheme(
  workspace: WorkspaceOptions
): workspace is WorkspaceWithTheme {
  return Boolean(workspace.theme)
}

export function useTheme(config: Config): StudioTheme {
  const workspace = useMemo<WorkspaceOptions>(
    () => (isWorkspaces(config) ? config[0] : config),
    [config]
  )
  return useMemo<StudioTheme>(
    () => (isWorkspaceWithTheme(workspace) ? workspace.theme : defaultTheme),
    [workspace]
  )
}

export type MetaThemeColors = {
  themeColorLight: string
  themeColorDark: string
}
export const useBackgroundColorsFromTheme = (theme: StudioTheme): MetaThemeColors => {
  return useMemo<MetaThemeColors>(
    () => ({
      themeColorLight: theme.color.light.default.base.bg,
      themeColorDark: theme.color.dark.default.base.bg,
    }),
    [theme]
  )
}

/**
 * Parses the next route to determine the what the base path for Sanity Studio should be
 */
export function useBasePath(): string {
  const router = useRouter()
  return useMemo(() => {
    const [basePath = '/'] = router.route.split('/[')
    return basePath
  }, [router.route])
}

export interface WorkspaceWithBasePath extends Omit<WorkspaceOptions, 'basePath'> {
  basePath: string
}
export type ConfigWithBasePath = WorkspaceWithBasePath | WorkspaceWithBasePath[]
/**
 * Apply the base path from next to the config, prefixing any defined base path
 */
export function useConfigWithBasePath(config: Config): ConfigWithBasePath {
  const basePath = useBasePath()
  return useMemo(() => {
    if (isWorkspaces(config)) {
      return config.map((workspace) => ({
        ...workspace,
        basePath:
          workspace.basePath === '/' ? basePath : `${basePath}${workspace.basePath || ''}`,
      }))
    }
    return {
      ...config,
      basePath: config.basePath === '/' ? basePath : `${basePath}${config.basePath || ''}`,
    }
  }, [config, basePath])
}
