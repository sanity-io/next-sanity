# Agent Notes

## `next-sanity/live` Export Conditions

The public `next-sanity/live` export is implemented by three condition-specific entry points:

- `packages/next-sanity/src/live/conditions/default/index.ts`
- `packages/next-sanity/src/live/conditions/react-server/index.ts`
- `packages/next-sanity/src/live/conditions/next-js/index.ts`

Keep these files in lockstep. They should expose the same public runtime exports and type exports, even when their implementations differ.

`packages/next-sanity/tsdown.config.ts` wires these files into the published `./live` export. The three condition files are listed as separate entries, then `customExports` rewrites them into:

```ts
pkg['./live'] = {
  'next-js': pkg['./live/conditions/next-js'],
  'react-server': pkg['./live/conditions/react-server'],
  'default': pkg['./live/conditions/default'],
}
```

That means `conditions/default/index.ts` is the fallback condition for `import 'next-sanity/live'`. It is also the declaration file IDEs and TypeScript users usually see by default unless they configure `customConditions` in `tsconfig.json`. Put the highest-quality TSDoc and overload typings there first.

The `react-server` and `next-js` condition files should carry matching TSDoc comments and types. Users with `customConditions: ["react-server"]` or `customConditions: ["next-js"]` should not lose documentation, overloads, or accurate typings.

## Runtime Nuance

The three condition files must expose the same public surface, but their runtime behavior is intentionally different:

- `default` is the safe fallback for places that should not import server-only APIs. Some exports are allowed in Client Components, for example:

  ```tsx
  'use client'
  import {isCorsOriginError} from 'next-sanity/live'
  ```

- Server-only exports in the `default` condition must fail loudly at runtime. For example, this must not work from a Client Component:

  ```tsx
  'use client'
  import {defineLive} from 'next-sanity/live'

  defineLive({client})
  ```

- `react-server` is the implementation used by Server Components when `cacheComponents` is not enabled.
- `next-js` is the implementation used by Next.js when `cacheComponents: true` is enabled.

When adding, removing, or changing an export from `next-sanity/live`, update all three condition entry points together, verify their exported names match exactly, and preserve the condition-specific runtime behavior.

## `next-sanity/image` Test Suite

Coverage of how `next-sanity/image` drives `next/image` lives in `packages/next-sanity/test`:

- `Image.test.tsx` — server-rendering matrix across the `next/image` options (srcset/sizes generation, fill, quality, priority/preload, placeholders, dev-mode validation, documented quirks), the Sanity-specific behavior (image object srcs with hotspot/crop, dimension inference, queryParams) plus type-level contract tests. The rendering and HTML-parsing helpers live in `helpers.image.ts`.
- `Image.browser.test.tsx` — real-DOM behavior (onLoad/onError, blur placeholder removal, preload link injection, ref forwarding). The Sanity Image CDN is mocked in `test/mocks/browser.ts`: it serves a real 1x1 PNG and `missing-*` filenames return a 404. To assert in-flight state, hold the response with `holdCdnResponse` instead of relying on timing.
- `imageLoader.test.ts` — pure URL-building behavior of the loader.

Browser tests alias `next/image` to Next's ESM build (see `vitest.config.ts`) because the CommonJS interop hack in `next/image` breaks under vite's dependency optimizer, and `test/setupBrowser.ts` shims the `process`/`require` globals that Next.js bundlers normally provide. These tests intentionally pin current `next/image` behavior (default `deviceSizes`/`imageSizes`/`qualities`, preload link shape, deprecations), so expect to update them when bumping the `next` catalog version.

## Draft Mode E2E Fixture

`fixtures/e2e/draft-mode` is a Cache Components app that runs `defineEnableDraftMode`, `defineLive` (`sanityFetch` inside `'use cache'`, `SanityLive`), `VisualEditing` and a Server Action draft mode toggle against a real `next build` + `next start` and `next dev`. `test/mock-sanity.mjs` stands in for the Sanity APIs (queries with Content Source Maps, preview URL secrets, Live events), and `src/app/presentation` emulates the Studio side of the Presentation comlink handshake from `127.0.0.1` so the preview on `localhost` loads in a cross-site iframe, optionally with third-party cookies blocked. It runs as part of `pnpm test:e2e` (its `test:e2e` script uses `node --test` and Playwright's Chromium, and needs the `next-sanity` build); set `E2E_MODES=start` or `E2E_MODES=dev` to run one mode. Because the `next` catalog follows `canary`, this is the guard for Next.js draft mode regressions, including the "Unexpected cache miss" warnings draft mode used to log with `partialPrefetching`.

## AI Literacy Framework (AILF)

`packages/ailf` (`@repo/ailf`) holds the AILF evaluation setup: `.ailf/ailf.config.ts` plus `.ailf/tasks/*.task.ts` scenario tasks paired with `*.reference.tsx` answer keys (multi-file solutions separated by `// --- path ---` comments; these are graded artefacts, intentionally excluded from oxlint, oxfmt, and the package tsconfig). Evals run remotely via `.github/workflows/ailf-eval.yml` (requires the `AILF_API_KEY` repo secret) on PRs touching `packages/ailf/**`, weekly, and via manual dispatch. Validate task files locally with `pnpm --filter @repo/ailf run ailf:validate` (no API key needed). See `packages/ailf/README.md` for how to add tasks.

## Cursor Cloud specific instructions

This is a pnpm + Turborepo monorepo. The publishable library is `packages/next-sanity`; `apps/mvp` (port 3000) and `apps/static` (port 3001) are Next.js demo apps, `apps/studio` (port 3333) is the standalone Sanity Studio they share, and `fixtures/*/*` are CI build guardrails. Standard commands live in the root `package.json` scripts (`build`, `dev`, `lint`, `test`, `test:e2e`) and per-app `package.json`; use those rather than duplicating them here.

### Node version gotcha (important)

`pnpm build` compiles `packages/next-sanity` with `tsdown`, which loads its `.ts` config using Node's native TypeScript stripping (`process.features.typescript`). That requires Node >= 22.18 (or 24). The VM's default `node` (`/exec-daemon/node`, currently v22.14) lacks it, so tsdown falls back to the `unrun` config loader, which is not installed, and the build fails with `Failed to import module "unrun"`.

Use the pre-installed nvm Node (v22.22.2) for any build/dev/test work by prepending it to `PATH`:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
```

`nvm use` alone is not enough because `/exec-daemon` sits ahead of nvm's shims in `PATH`. This nvm node also bundles a pnpm, but the repo pins pnpm 12 via `packageManager`. Activate that version with Corepack (`corepack enable && corepack prepare`) after prepending nvm. `pnpm install` itself works on the default node; only building/running needs the newer node. `pnpm test:e2e` (the Vitest browser project plus the draft mode fixture) needs Chromium: `pnpm playwright install chromium`. Turbo fails to spawn tasks on this VM with `Exec format error` (this affects `pnpm build` and `pnpm test:e2e`), so run the steps directly: `pnpm --filter next-sanity build`, then `pnpm -r --workspace-concurrency=1 run test:e2e`.

### Demo app env

`apps/mvp` and `apps/static` need a gitignored `.env.local` with `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`, and `apps/studio` needs `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` (see each app's `.env.local.example`). The example project `pv8y60vp/production` is publicly readable, so published content renders without a token. `SANITY_API_READ_TOKEN` is only required for draft mode, Presentation/visual-editing preview, and authenticated live queries — not for basic rendering.

### Dev/runtime notes

- Run a single app instead of `pnpm dev` (which starts the library watcher plus all apps): `pnpm --filter mvp dev`, `pnpm --filter static dev` or `pnpm --filter studio dev`.
- `apps/mvp` runs Next.js 16 with Cache Components (`cacheComponents: true`) and the React Compiler. `next dev` auto-generates `apps/mvp/AGENTS.md` and `apps/mvp/CLAUDE.md` — these are generated artifacts and are gitignored.
- The Studio is not embedded in either Next.js app. Locally the apps link to it through `NEXT_PUBLIC_SANITY_STUDIO_URL` (default `http://localhost:3333`), and its Presentation tool previews `SANITY_STUDIO_PREVIEW_ORIGIN` (default `http://localhost:3000`). On Vercel, `@vercel/related-projects` replaces those with the matching preview or production deployment: lookups match by Vercel project id, not name. `apps/mvp` (`prj_01qQA71qtcOv7dx28IEI2fQKRIve`) and `apps/static` (`prj_ZODdw5nJDFFowVFTc9rJACGod0ib`) list the Studio (`prj_jWPnVeIEPKmKzDLTSf1Sx7sl9wHu`) in `relatedProjects`, and the Studio lists `apps/mvp`, the only app it previews. Keep each `vercel.json` and the id in the matching `next.config.ts` or `sanity.cli.ts` in sync. The Studio Vercel project uses `apps/studio` as its root. `apps/studio/vercel.json` sets the build command to `pnpm turbo run build && npx sanity schema deploy` and the output directory to `dist`. `pnpm turbo` is required because the `turbo` binary lives on the workspace root, not in `apps/studio`. Schema deploy needs a deploy token in `SANITY_AUTH_TOKEN` on that Vercel project, plus `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`.
- `apps/studio/schema.json` is committed and is the schema both Next.js apps run TypeGen against. After changing `apps/studio/schemas/**`, run `pnpm typegen` (it extracts the schema first, then regenerates each app's `sanity.types.ts`) and commit the results; CI fails when `schema.json` is stale. `sanity dev` and `sanity build` in `apps/studio` also refresh it.
- In dev, CMS content edits are reflected on the next page reload.
