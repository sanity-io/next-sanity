---
name: sanity-live-cache-components
description: Integrates Sanity Live with Next.js Cache Components in next-sanity v14+ apps. Sets up defineLive with strict mode and a [perspective] root param resolver, the definePerspectiveProxy rewrite, sanityFetch inside 'use cache', <SanityLive>, Visual Editing, Presentation Tool, and draft mode handling. Sequences with the official Next.js skills (next-cache-components-adoption, next-cache-components-optimizer, next-partial-prefetching-adoption, next-dev-loop). Use when configuring or migrating a Next.js app to cacheComponents with Sanity, when adding sanityFetch, when wiring <SanityLive>/<VisualEditing>, or when removing v13 perspective/stega prop-drilling.
---

# Sanity Live + Cache Components

Wires `next-sanity` into a Next.js 16.3+ app with `cacheComponents: true`. Data is fetched with `sanityFetch` inside `'use cache'` scopes, and `<SanityLive>` in the root layout revalidates cached content over an EventSource connection to Sanity Content Lake. Visual Editing and Presentation Tool work when draft mode is enabled.

Read the relevant guide in `node_modules/next/dist/docs/` (when available) before writing code. If a guide conflicts with this skill, follow this skill.

This skill assumes familiarity with Cache Components fundamentals. `'use cache'`, `cacheLife`, `cacheTag`, and the cookies/headers/params rule are covered by the [Cache Components guide](https://nextjs.org/docs/app/getting-started/cache-components) (bundled offline under `node_modules/next/dist/docs/`). Two facts carry the whole Sanity pattern:

- `await draftMode()` is allowed inside `'use cache'`, and Next.js bypasses caching when draft mode is enabled ([`use cache` reference](https://nextjs.org/docs/app/api-reference/directives/use-cache#draft-mode)). `sanityFetch` in strict mode reads it for you.
- Root param getters from `next/root-params` are allowed inside `'use cache'` and only join the cache key when called ([`next/root-params` reference](https://nextjs.org/docs/app/api-reference/functions/next-root-params)). `sanityFetch` calls the `perspective` getter only inside draft mode.

## Where this skill fits

Next.js ships official skills for the framework-generic workflows (see [Setting up your project for AI coding agents](https://nextjs.org/docs/app/guides/ai-agents)). This skill covers only the Sanity surface and defers everything else to them. Install them from the Next.js repository:

```bash
npx skills add vercel/next.js --skill next-dev-loop
npx skills add vercel/next.js --skill next-cache-components-adoption
npx skills add vercel/next.js --skill next-cache-components-optimizer
npx skills add vercel/next.js --skill next-partial-prefetching-adoption
```

When their rules apply (blocking-route triage, `<Suspense>` placement, loading-UI reuse, `instant()` regression tests, link prefetch audits) follow them. Don't re-derive that guidance from here.

Recommended sequence when migrating an app:

1. **[`next-cache-components-adoption`](https://github.com/vercel/next.js/tree/canary/skills/next-cache-components-adoption)** enables `cacheComponents: true` and works the app to a passing build, route by route. Tell it to leave the Sanity surface to this skill:

   > Adopt Cache Components in this project using the next-cache-components-adoption Skill. Defer draft mode handling and every `sanityFetch` / `<SanityLive>` call site to the sanity-live-cache-components skill: leave those routes opted out (`export const instant = false`) rather than refactoring the Sanity data fetching.

2. **This skill** sets up `defineLive`, `proxy.ts`, and the `[perspective]` root segment, moves `sanityFetch` calls into `'use cache'` leaves, wires `<SanityLive>`/`<VisualEditing>` and draft mode, then removes the remaining opt-outs on the deferred Sanity routes. Use the adoption skill's per-route loop and success bar for that removal (dev overlay clean, browser-verified, `next build` passes). This skill supplies the Sanity-specific fixes, the loop mechanics are the adoption skill's.

3. **Either or both, optional follow-ups:**
   - [`next-cache-components-optimizer`](https://github.com/vercel/next.js/tree/canary/skills/next-cache-components-optimizer) grows a route's static shell and guards it with an `@next/playwright` `instant()` test. Prompt: _"Make the navigation to `/<route>` instant using the next-cache-components-optimizer Skill."_
   - [`next-partial-prefetching-adoption`](https://github.com/vercel/next.js/tree/canary/skills/next-partial-prefetching-adoption) enables `partialPrefetching` and audits `<Link prefetch={true}>` usage. Prompt: _"Adopt Partial Prefetching in this project using the next-partial-prefetching-adoption Skill."_

   Nothing in this skill blocks either one. The `/published` tree prerenders fully, which is exactly the shell those skills grow and prefetch. Sanity content cached through `sanityFetch` also satisfies the "cached URL-dependent content" requirement for [runtime prefetching](https://nextjs.org/docs/app/guides/runtime-prefetching).

Throughout all of it, verify changes at runtime with [`next-dev-loop`](https://github.com/vercel/next.js/tree/canary/skills/next-dev-loop). A passing compile doesn't prove what ended up in the static shell versus streamed.

## Prerequisites

- Next.js 16.3+ installed in the project (check `package.json` or run `pnpm list next` / `npm ls next`, not `pnpm view next version`, which reports the registry's latest). `next/root-params` and `proxy.ts` both need 16.3+.
- `AGENTS.md` exists. On Next.js 16.3+, `next dev` auto-generates it (pointing agents at the bundled docs).
- These environment variables are set:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_READ_TOKEN`
- Embedded Sanity Studio configuration (`sanity.config.ts`, `sanity.cli.ts`, anything under `sanity/`) needs no changes. This skill only touches the Next.js app surface.

## Reference files

| File                                                           | When to read                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [reference/live-helpers.md](reference/live-helpers.md)         | Full `client.ts`, `live.ts`, `proxy.ts`, the `[perspective]` root layout, and the no-resolver variant |
| [reference/pages.md](reference/pages.md)                       | `page.tsx` shapes, including `params`, `searchParams`, and server actions                             |
| [reference/layouts.md](reference/layouts.md)                   | Non-blocking data fetching inside `layout.tsx`                                                        |
| [reference/dynamic-segments.md](reference/dynamic-segments.md) | High-performance `[slug]` routes with `loading.tsx` and partial `generateStaticParams`                |

---

## 1. Install `next-sanity@^14`

```bash
npm install next-sanity@^14 --save-exact
```

### Migrating an existing Sanity Live setup

If the app is already using `defineLive`, this skill is a refactor, not a rewrite. The 5-step sequence below still applies, but watch for these specific differences:

- **Don't overwrite `client.ts` or `live.ts`** if they exist. Append missing options. Preserve any existing `token` and `stega.*` settings. See [reference/live-helpers.md](reference/live-helpers.md).
- **Delete v13 plumbing.** `getDynamicFetchOptions`, `DynamicFetchOptions`, `cachedSanity`, `withDraftMode`, `normalizePerspective`, and `perspective`/`stega` props on components all go. `sanityFetch` reads draft mode and the perspective itself.
- **Search for `includeDrafts={...}` on `<SanityLive>`** and remove the prop. It derives from draft mode.
- **Search for `sanityFetch` calls inside `generateStaticParams`** and swap for the plain `client.fetch` with `perspective: 'published'`. Build-time code has no draft mode.
- **Verify there is exactly one `<SanityLive>` and one `<VisualEditing>` in the tree.** Multiple renders are undefined behavior.

The "Anti-patterns to grep for" section at the bottom of this file lists the search patterns.

---

## 2. Configure `next.config.ts`

Enable `cacheComponents` and set `cacheLife.default` to `sanity` so default revalidation is 1 year (instead of 15 minutes). `sanityFetch` is optimized for on-demand revalidation and doesn't need time-based revalidation.

```ts
// next.config.ts
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {default: sanity},
}

export default nextConfig
```

---

## 3. Configure `defineLive`, `proxy.ts`, and the `[perspective]` root segment

Every page route moves under `app/[perspective]/`. A `proxy.ts` rewrites incoming `/x` requests to `/<perspective>/x`, where the perspective is `published` outside draft mode and the Presentation Tool perspective cookie inside it. `defineLive` receives the `perspective` root param getter so `sanityFetch` can read it inside `'use cache'`.

```ts
// src/sanity/lib/live.ts (excerpt)
import {defineLive} from 'next-sanity/live'
import {perspective} from 'next/root-params'

export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
  perspective,
})
```

```ts
// proxy.ts
import {definePerspectiveProxy} from 'next-sanity/live/proxy'

export const proxy = definePerspectiveProxy()

// Next.js needs the matcher as a literal in this file.
export const config = {
  matcher: [
    '/((?!_next|_vercel|api|studio|favicon|\\.well-known|robots\\.|sitemap\\.|[^/]*\\.).*)?',
  ],
}
```

Full file contents (including `client.ts`, the root layout with `generateStaticParams`, and what to do when the app cannot add a `[perspective]` segment) live in [reference/live-helpers.md](reference/live-helpers.md).

What strict mode does:

| Situation          | `perspective`                                  | `stega`               | `variant`           |
| ------------------ | ---------------------------------------------- | --------------------- | ------------------- |
| Outside draft mode | `'published'`, whatever the caller passed      | `false` unless passed | dropped             |
| Inside draft mode  | the explicit option, else the resolver's value | `true` unless passed  | forwarded if passed |

Without a `perspective` resolver, `sanityFetch` requires `perspective` on every call (a type error and a runtime throw when missing). Only the draft mode value matters, so `perspective: 'drafts'` is the usual literal.

---

## 4. Render `<SanityLive>` in the `[perspective]` root layout

`<SanityLive>` and `<VisualEditing>` both belong in a `layout.tsx`, never a `page.tsx`. Both must be rendered at most once across the whole tree. Duplicate renders are undefined behavior.

- `includeDrafts` is derived from `draftMode()`. Only pass it to override.
- Preserve any existing optional callback props on `<SanityLive>` when migrating: `onError`, `onWelcome`, `onReconnect`. They are commonly wired to a toast/notification helper and silently dropping them regresses UX.
- `generateStaticParams` returning `published` is required. Cache Components needs at least one value for a root param, and it is the tree that prerenders.

```tsx
// src/app/[perspective]/layout.tsx
import {SanityLive} from '@/sanity/lib/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

export function generateStaticParams() {
  return [{perspective: 'published'}]
}

export default async function RootLayout({children}: LayoutProps<'/[perspective]'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

### With an embedded Sanity Studio

If a route mounts an embedded Studio (for example `app/studio/[[...index]]/page.tsx`), keep it outside `app/[perspective]/` with its own root layout, and keep `studio` in the proxy matcher's exclusion list so those requests are never rewritten.

---

## 5. Move `sanityFetch` calls into `'use cache'` leaves

Every route that should be statically prerendered uses the same shape:

```text
Page/Layout (no 'use cache', awaits nothing dynamic)
  └── <Suspense fallback={...}>
        <CachedX slug={...} />   ('use cache', calls sanityFetch)
```

**Critical rules**:

- `sanityFetch` calls `cacheTag`/`cacheLife` and needs a surrounding `'use cache'` scope. Put the directive on the leaf component or on a shared wrapper (see `cachedSanity` in [reference/live-helpers.md](reference/live-helpers.md)).
- The top-level `Page` / `Layout` must **not** have `'use cache'` when it awaits `params`, `searchParams`, `cookies()`, or `headers()`. Pass the `params` promise into the Suspense boundary and await it inside.
- Never pass `perspective` or `stega` props around. Strict mode resolves them inside the cached leaf, and the resolver only joins the cache key inside draft mode, where nothing is cached anyway.
- `draftMode()` is the only dynamic API a cached leaf may call, and `sanityFetch` already does.

Pick the right reference for the file you're editing:

- **`page.tsx`** with static or `generateStaticParams`-backed params, `searchParams`, or server actions, see [reference/pages.md](reference/pages.md).
- **`layout.tsx`** that fetches its own data, see [reference/layouts.md](reference/layouts.md).
- **Dynamic `[slug]` route** that needs the `loading.tsx` + partial `generateStaticParams` optimization, see [reference/dynamic-segments.md](reference/dynamic-segments.md).

---

## Verifying the Sanity surface

Use [`next-dev-loop`](https://github.com/vercel/next.js/tree/canary/skills/next-dev-loop) after each refactor. The loop mechanics and success bar live in the official skills. The Sanity-specific things to confirm:

- Published branch: `/published/...` routes show `○` in the build's route table and `[perspective]/...` routes show `◐`. `curl /` returns `x-nextjs-prerender: 1` and published content.
- Proxy: `ƒ Proxy (Middleware)` appears in the build output, `/studio` and `/api/...` still resolve without a rewrite.
- Draft mode: enabling it streams draft content, `<VisualEditing>` overlays appear, and switching perspectives in Presentation Tool changes the rendered content.
- Live updates: editing published content in the Studio revalidates the route (through `<SanityLive>`) without a rebuild.

## Anti-patterns to grep for

When auditing an app, search for these and refactor:

- `getDynamicFetchOptions`, `DynamicFetchOptions`, `withDraftMode`, `normalizePerspective`, `resolvePerspectiveFromCookies` in app code. Delete them, strict mode owns that logic.
- `perspective={` or `stega={` props on a component that calls `sanityFetch`. Remove the props and call `sanityFetch({query, params})`.
- `includeDrafts={` on `<SanityLive>`. Remove it unless you are deliberately overriding draft mode.
- `sanityFetch(` inside `generateStaticParams`. Swap for `client.fetch(query, params, {perspective: 'published'})`.
- `sanityFetch(` in a component without a `'use cache'` directive and without a `cachedSanity` wrapper. Add the directive or use the wrapper.
- `await draftMode()` at the top of a `page.tsx` used to branch between a cached and a dynamic subtree. Delete the branch and render the cached leaf inside `<Suspense>` unconditionally.
- More than one `<SanityLive>` or `<VisualEditing>` rendered in the tree. Consolidate to a single render in the `[perspective]` root layout.
