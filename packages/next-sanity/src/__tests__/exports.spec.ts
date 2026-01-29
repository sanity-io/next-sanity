import {env} from '#env'
import * as yaml from 'js-yaml'
import {fileURLToPath} from 'node:url'
import {expect, test, vi} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

vi.mock('react/jsx-dev-runtime', () => ({}))
vi.mock('react-dom', () => ({preconnect: vi.fn(), preloadModule: vi.fn()}))
vi.mock('server-only', () => ({}))

test(`exports snapshot for the ${JSON.stringify(env)} condition`, {timeout: 15_000}, async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'dist',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(yaml.dump(manifest.exports, {sortKeys: (a, b) => a.localeCompare(b)}))
    .toMatchInlineSnapshot(`
      ".:
        createClient: function
        createDataAttribute: function
        defaultComponents: object
        defineQuery: function
        groq: function
        isCorsOriginError: function
        mergeComponents: function
        PortableText: function
        stegaClean: function
        toPlainText: function
        unstable__adapter: string
        unstable__environment: string
      ./draft-mode:
        defineEnableDraftMode: function
      ./experimental/client-components/live:
        default: function
      ./experimental/live:
        defineLive: function
        resolvePerspectiveFromCookies: function
      ./hooks:
        useDraftModeEnvironment: function
        useDraftModePerspective: function
        useIsLivePreview: function
        useIsPresentationTool: function
        useOptimistic: function
        usePresentationQuery: function
      ./image:
        Image: function
        imageLoader: function
      ./live:
        defineLive: function
        isCorsOriginError: function
      ./live/client-components/live:
        default: function
      ./live/client-components/live-stream:
        default: function
      ./live/server-actions:
        revalidateSyncTags: function
        setPerspectiveCookie: function
      ./studio:
        metadata: object
        NextStudio: function
        NextStudioLayout: function
        NextStudioNoScript: function
        viewport: object
      ./studio/client-component:
        NextStudio: function
      ./visual-editing:
        VisualEditing: function
      ./visual-editing/client-component:
        default: function
      ./visual-editing/server-actions:
        revalidateRootLayout: function
      ./webhook:
        parseBody: function
      "
    `)
})
