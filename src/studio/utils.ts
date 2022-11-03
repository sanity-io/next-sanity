import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {
  type Config,
  type SingleWorkspace,
  type StudioTheme,
  type WorkspaceOptions,
  defaultTheme,
} from 'sanity'

/** @alpha */
export type WithTheme = {
  theme: StudioTheme
}
/** @alpha */
export type SingleWorkspaceWithTheme = Omit<SingleWorkspace, 'theme'> & WithTheme
/** @alpha */
export type WorkspaceOptionsWithTheme = Omit<WorkspaceOptions, 'theme'> & WithTheme
/** @alpha */
export type ConfigWithTheme = SingleWorkspaceWithTheme | WorkspaceOptionsWithTheme[]

/** @alpha */
export function isWorkspaces(config: Config): config is WorkspaceOptions[] {
  return Array.isArray(config)
}

/** @alpha */
export function isWorkspaceWithTheme(
  workspace: SingleWorkspace | WorkspaceOptions
): workspace is SingleWorkspaceWithTheme | WorkspaceOptionsWithTheme {
  return Boolean(workspace.theme)
}

/** @alpha */
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

/** @alpha */
export type MetaThemeColors = {
  themeColorLight: string
  themeColorDark: string
}
/** @alpha */
export const useBackgroundColorsFromTheme = (theme: StudioTheme): MetaThemeColors => {
  return useMemo<MetaThemeColors>(
    () => ({
      themeColorLight: theme.color.light.default.base.bg,
      themeColorDark: theme.color.dark.default.base.bg,
    }),
    [theme]
  )
}

/** @alpha */
export const useTextFontFamilyFromTheme = (theme: StudioTheme): string => {
  return useMemo<string>(() => theme.fonts.text.family, [theme])
}

/**
 * Parses the next route to determine the what the base path for Sanity Studio should be
 * @alpha
 */
export function useBasePath(): string {
  const router = useRouter()
  return useMemo(() => {
    const [basePath = '/'] = router.route.split('/[')
    return basePath
  }, [router.route])
}

/** @alpha */
export interface WorkspaceWithBasePath extends Omit<WorkspaceOptions, 'basePath'> {
  basePath: string
}
/** @alpha */
export type SingleWorkspaceWithBasePath = Omit<SingleWorkspace, 'basePath'> & {basePath: string}
/** @alpha */
export type ConfigWithBasePath = SingleWorkspaceWithBasePath | WorkspaceOptions[]
/**
 * Apply the base path from next to the config, prefixing any defined base path
 * @alpha
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
