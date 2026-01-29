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
      ./cache-life:
        sanity: object
      ./draft-mode:
        defineEnableDraftMode: function
      ./hooks:
        useIsLivePreview: function
        useIsPresentationTool: function
        useLiveEnvironment: function
        useOptimistic: function
        usePresentationQuery: function
        useVisualEditingEnvironment: function
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
        actionRefresh: function
        actionUpdateTags: function
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
        VisualEditing: function
      ./visual-editing/server-actions:
        actionPerspectiveChange: function
        actionRefresh: function
      ./webhook:
        parseBody: function
      "
    `)
})
