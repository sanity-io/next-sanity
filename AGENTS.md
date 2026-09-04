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

- `react-server` is the implementation used by Server Components when `cacheComponents` is not enabled. It may read `cookies()`, so inside draft mode `sanityFetch` defaults `perspective` and `variant` from the Presentation Tool cookies when `defineLive` has no `perspective` resolver.
- `next-js` is the implementation used by Next.js when `cacheComponents: true` is enabled. `sanityFetch` runs inside `'use cache'`, where `cookies()` is not readable, so inside draft mode it defaults `perspective` from the `perspective` resolver and falls back to `'drafts'`, with no `variant`.

Both server conditions share `src/live/shared/resolveFetchOptions.ts`. `draftMode()` decides every default, an explicit option wins, and the draft mode source is the only thing each condition supplies. With a resolver configured neither condition reads cookies.

When adding, removing, or changing an export from `next-sanity/live`, update all three condition entry points together, verify their exported names match exactly, and preserve the condition-specific runtime behavior.

## AI Literacy Framework (AILF)

`packages/ailf` (`@repo/ailf`) holds the AILF evaluation setup: `.ailf/ailf.config.ts` plus `.ailf/tasks/*.task.ts` scenario tasks paired with `*.reference.tsx` answer keys (multi-file solutions separated by `// --- path ---` comments; these are graded artefacts, intentionally excluded from oxlint, oxfmt, and the package tsconfig). Evals run remotely via `.github/workflows/ailf-eval.yml` (requires the `AILF_API_KEY` repo secret) on PRs touching `packages/ailf/**`, weekly, and via manual dispatch. Validate task files locally with `pnpm --filter @repo/ailf run ailf:validate` (no API key needed). See `packages/ailf/README.md` for how to add tasks.

## Cursor Cloud specific instructions

This is a pnpm + Turborepo monorepo. The publishable library is `packages/next-sanity`; `apps/mvp` (port 3000) and `apps/static` (port 3001) are Next.js demo apps, and `fixtures/*/*` are CI build guardrails. Standard commands live in the root `package.json` scripts (`build`, `dev`, `lint`, `test`, `test:e2e`) and per-app `package.json`; use those rather than duplicating them here.

### Node version gotcha (important)

`pnpm build` compiles `packages/next-sanity` with `tsdown`, which loads its `.ts` config using Node's native TypeScript stripping (`process.features.typescript`). That requires Node >= 22.18 (or 24). The VM's default `node` (`/exec-daemon/node`, currently v22.14) lacks it, so tsdown falls back to the `unrun` config loader, which is not installed, and the build fails with `Failed to import module "unrun"`.

Use the pre-installed nvm Node (v22.22.2) for any build/dev/test work by prepending it to `PATH`:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
```

`nvm use` alone is not enough because `/exec-daemon` sits ahead of nvm's shims in `PATH`. This nvm node also bundles the correct `pnpm` (10.34.5), so prepending it fixes both `node` and `pnpm` in one step. `pnpm install` itself works on the default node; only building/running needs the newer node. `pnpm test:e2e` (Vitest browser project) needs Chromium: `pnpm playwright install chromium`.

### Demo app env

`apps/mvp` and `apps/static` need a gitignored `.env.local` with `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` (see each app's `.env.local.example`). The example project `pv8y60vp/production` is publicly readable, so published content renders without a token. `SANITY_API_READ_TOKEN` is only required for draft mode, Presentation/visual-editing preview, and authenticated live queries, not for basic rendering. Leave `SANITY_REVALIDATE_SECRET` and `SANITY_LIVE_WAIT_FOR_FUNCTION` unset in Cloud for `apps/mvp`. The demo project has no sync tag invalidate function deployed, so with `waitFor="function"` live events never arrive.

### Dev/runtime notes

- Run a single app instead of `pnpm dev` (which starts the library watcher plus both apps): `pnpm --filter mvp dev` or `pnpm --filter static dev`.
- `apps/mvp` runs Next.js 16 with Cache Components (`cacheComponents: true`) and the React Compiler. `next dev` auto-generates `apps/mvp/AGENTS.md` and `apps/mvp/CLAUDE.md` — these are generated artifacts, do not commit them.
- In dev, CMS content edits are reflected on the next page reload.
