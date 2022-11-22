import {useMemo} from 'react'
import {
  type Config,
  type SingleWorkspace,
  type StudioTheme,
  type WorkspaceOptions,
  defaultTheme,
} from 'sanity'

type WithTheme = {
  theme: StudioTheme
}
type SingleWorkspaceWithTheme = Omit<SingleWorkspace, 'theme'> & WithTheme
type WorkspaceOptionsWithTheme = Omit<WorkspaceOptions, 'theme'> & WithTheme

function isWorkspaces(config: Config): config is WorkspaceOptions[] {
  return Array.isArray(config)
}

function isWorkspaceWithTheme(
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
