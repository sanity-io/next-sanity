// Copied into dist/ by the build process, to workaround `next/head` not being available to native Nodejs ESM

import studioCjs from './studio.cjs'

const {
  isWorkspaces,
  isWorkspaceWithTheme,
  NextStudio,
  NextStudioGlobalStyle,
  NextStudioHead,
  NextStudioNoScript,
  ServerStyleSheetDocument,
  useBackgroundColorsFromTheme,
  useBasePath,
  useConfigWithBasePath,
  useTextFontFamilyFromTheme,
  useTheme,
} = studioCjs

export {
  isWorkspaces,
  isWorkspaceWithTheme,
  NextStudio,
  NextStudioGlobalStyle,
  NextStudioHead,
  NextStudioNoScript,
  ServerStyleSheetDocument,
  useBackgroundColorsFromTheme,
  useBasePath,
  useConfigWithBasePath,
  useTextFontFamilyFromTheme,
  useTheme,
}
