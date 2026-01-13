import {env} from '#env'
import yaml from 'js-yaml'
import {fileURLToPath} from 'node:url'
import {expect, it, vi} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

vi.mock('react/jsx-dev-runtime', () => ({}))
vi.mock('react-dom', () => ({preconnect: vi.fn(), preloadModule: vi.fn()}))

it(`exports snapshot for the ${JSON.stringify(env)} condition`, async () => {
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
      ./cache-life:
        sanity: object
      ./draft-mode:
        defineEnableDraftMode: function
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
        resolvePerspectiveFromCookies: function
      ./live/client-components:
        SanityLive: function
      ./live/server-actions:
        actionLiveEvent: function
        actionLiveEventIncludingDrafts: function
        actionStudioPerspective: function
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
