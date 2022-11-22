// Copied into dist/studio/ by the build process, to workaround `@sanity/icons` and other packages not using "type": "module"

import studioCjs from './index.cjs'

const {
  NextStudio,
  NextStudioFallback,
  NextStudioLayout,
  NextStudioNoScript,
  NextStudioSuspense,
  usePrefersColorScheme,
  useTheme,
} = studioCjs

export {
  NextStudio,
  NextStudioFallback,
  NextStudioLayout,
  NextStudioNoScript,
  NextStudioSuspense,
  usePrefersColorScheme,
  useTheme,
}
