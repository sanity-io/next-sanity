import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {
  type Config,
  type SingleWorkspace,
  type StudioTheme,
  type WorkspaceOptions,
  defaultTheme,
} from 'sanity'

export type WithTheme = {
  theme: StudioTheme
}
export type SingleWorkspaceWithTheme = Omit<SingleWorkspace, 'theme'> & WithTheme
export type WorkspaceOptionsWithTheme = Omit<WorkspaceOptions, 'theme'> & WithTheme
export type ConfigWithTheme = SingleWorkspaceWithTheme | WorkspaceOptionsWithTheme[]

export function isWorkspaces(config: Config): config is WorkspaceOptions[] {
  return Array.isArray(config)
}

export function isWorkspaceWithTheme(
  workspace: SingleWorkspace | WorkspaceOptions
): workspace is SingleWorkspaceWithTheme | WorkspaceOptionsWithTheme {
  return Boolean(workspace.theme)
}

export function useTheme(config: Config): StudioTheme {
  const workspace = useMemo<SingleWorkspace | WorkspaceOptions>(
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

export const useTextFontFamilyFromTheme = (theme: StudioTheme): string => {
  return useMemo<string>(() => theme.fonts.text.family, [theme])
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
export type SingleWorkspaceWithBasePath = Omit<SingleWorkspace, 'basePath'> & {basePath: string}
export type ConfigWithBasePath = SingleWorkspaceWithBasePath | WorkspaceOptions[]
/**
 * Apply the base path from next to the config, prefixing any defined base path
 */
export function useConfigWithBasePath(config: Config): ConfigWithBasePath {
  const basePath = useBasePath()
  return useMemo(() => {
    if (isWorkspaces(config)) {
      return config.map((workspace) => ({
        ...workspace,
        basePath: workspace.basePath === '/' ? basePath : `${basePath}${workspace.basePath}`,
      }))
    }
    return {
      ...config,
      basePath: config.basePath === '/' ? basePath : `${basePath}${config.basePath || ''}`,
    }
  }, [config, basePath])
}
