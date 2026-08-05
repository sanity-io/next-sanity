---
name: sanity-live-cache-components
description: Integrates Sanity Live with Next.js Cache Components in next-sanity v13+ apps. Sets up sanityFetch, a shared cachedSanity 'use cache' boundary, <SanityLive>, Visual Editing, Presentation Tool, draft mode handling, and the three-layer (Page/Dynamic/Cached) component pattern with explicit perspective/stega prop-drilling. Sequences with the official Next.js skills (next-cache-components-adoption, next-cache-components-optimizer, next-partial-prefetching-adoption, next-dev-loop). Use when configuring or migrating a Next.js app to cacheComponents with Sanity, when adding sanityFetch, when wiring <SanityLive>/<VisualEditing>, or when refactoring components that hardcode perspective/stega.
---

# Sanity Live + Cache Components

Wires `next-sanity` into a Next.js 16+ app with `cacheComponents: true`. Data is fetched with `sanityFetch` through a single shared `'use cache'` boundary (`cachedSanity`), and `<SanityLive>` in the root layout revalidates cached content over an EventSource connection to Sanity Content Lake. Visual Editing and Presentation Tool are fully supported when draft mode is enabled.

Read the relevant guide in `node_modules/next/dist/docs/` (when available) before writing code. If a guide conflicts with this skill, follow this skill.

This skill assumes familiarity with Cache Components fundamentals — `'use cache'`, `cacheLife`, `cacheTag`, and the cookies/headers/params rule — covered by the [Cache Components guide](https://nextjs.org/docs/app/getting-started/cache-components) (bundled offline under `node_modules/next/dist/docs/`). The only Sanity-relevant exception: `await draftMode()` is allowed inside `'use cache'` (Next.js bypasses caching when draft mode is enabled — see [the `use cache` reference](https://nextjs.org/docs/app/api-reference/directives/use-cache#draft-mode)).

## Where this skill fits

Next.js ships official skills for the framework-generic workflows (see [Setting up your project for AI coding agents](https://nextjs.org/docs/app/guides/ai-agents)). This skill covers only the Sanity surface and defers everything else to them. Install them from the Next.js repository:

```bash
npx skills add vercel/next.js --skill next-dev-loop
npx skills add vercel/next.js --skill next-cache-components-adoption
npx skills add vercel/next.js --skill next-cache-components-optimizer
npx skills add vercel/next.js --skill next-partial-prefetching-adoption
```

When their rules apply — blocking-route triage, `<Suspense>` placement, loading-UI reuse, `instant()` regression tests, link prefetch audits — follow them; don't re-derive that guidance from here.

Recommended sequence when migrating an app:

1. **[`next-cache-components-adoption`](https://github.com/vercel/next.js/tree/canary/skills/next-cache-components-adoption)** — enables `cacheComponents: true` and works the app to a passing build, route by route. Tell it to leave the Sanity surface to this skill:

   > Adopt Cache Components in this project using the next-cache-components-adoption Skill. Defer draft mode handling and every `sanityFetch` / `<SanityLive>` call site to the sanity-live-cache-components skill: leave those routes opted out (`export const instant = false`) rather than refactoring the Sanity data fetching.

2. **This skill** — set up `defineLive` and the `live.ts` helpers, refactor `sanityFetch` call sites to source `perspective`/`stega` correctly, wire `<SanityLive>`/`<VisualEditing>` and draft mode, then remove the remaining opt-outs on the deferred Sanity routes. Use the adoption skill's per-route loop and success bar for that removal (dev overlay clean, browser-verified, `next build` passes) — this skill supplies the Sanity-specific fixes, the loop mechanics are the adoption skill's.

3. **Either or both, optional follow-ups:**
   - [`next-cache-components-optimizer`](https://github.com/vercel/next.js/tree/canary/skills/next-cache-components-optimizer) — grows a route's static shell and guards it with an `@next/playwright` `instant()` test. Prompt: _"Make the navigation to `/<route>` instant using the next-cache-components-optimizer Skill."_
   - [`next-partial-prefetching-adoption`](https://github.com/vercel/next.js/tree/canary/skills/next-partial-prefetching-adoption) — enables `partialPrefetching` and audits `<Link prefetch={true}>` usage. Prompt: _"Adopt Partial Prefetching in this project using the next-partial-prefetching-adoption Skill."_

   Nothing in this skill blocks either one: the [three-layer pattern](#5-apply-the-three-layer-pattern-to-pages-and-layouts) keeps routes fully prerenderable in the published branch, which is exactly the shell those skills grow and prefetch. Sanity content cached via `cachedSanity` also satisfies the "cached URL-dependent content" requirement for [runtime prefetching](https://nextjs.org/docs/app/guides/runtime-prefetching).

Throughout all of it, verify changes at runtime with [`next-dev-loop`](https://github.com/vercel/next.js/tree/canary/skills/next-dev-loop) — a passing compile doesn't prove what ended up in the static shell versus streamed.

## Prerequisites

- Next.js 16.3+ installed in the project (check `package.json` or run `pnpm list next` / `npm ls next` — don't use `pnpm view next version`, that reports the registry's latest, not what's installed). `next-sanity` v13 supports Next.js 16, but the official skills this skill sequences with require 16.3+.
- `AGENTS.md` exists. On Next.js 16.3+, `next dev` auto-generates it (pointing agents at the bundled docs); on older versions [follow the guide](https://nextjs.org/docs/app/guides/ai-agents#existing-projects).
- These environment variables are set:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_READ_TOKEN`
- Embedded Sanity Studio configuration (`sanity.config.ts`, `sanity.cli.ts`, anything under `sanity/`) needs no changes — this skill only touches the Next.js app surface.

## Reference files

| File                                                                 | When to read                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [reference/live-helpers.md](reference/live-helpers.md)               | Full `client.ts` / `live.ts`, `cachedSanity`, `sanityFetch*` and `getDynamicFetchOptions` details                              |
| [reference/three-layer-pattern.md](reference/three-layer-pattern.md) | The Page → Dynamic → Cached pattern for `page.tsx`, including the `searchParams` variant                                       |
| [reference/layouts.md](reference/layouts.md)                         | Non-blocking data fetching inside `layout.tsx`                                                                                 |
| [reference/dynamic-segments.md](reference/dynamic-segments.md)       | High-performance `[slug]` routes: `loading.tsx` + partial `generateStaticParams`, or non-blocking dynamic `params` in a layout |

---

## 1. Install `next-sanity@^13`

```bash
npm install next-sanity@^13 --save-exact
```

### Migrating an existing Sanity Live setup

If the app is already using `defineLive`, this skill is a refactor, not a rewrite. The 5-step sequence below still applies, but watch for these specific differences:

- **Don't overwrite `client.ts` or `live.ts`** if they exist. Append missing options. Preserve any existing `token` and `stega.*` settings — see [reference/live-helpers.md](reference/live-helpers.md).
- **Search the codebase for hardcoded `perspective: 'published'` and `stega: false`** in `sanityFetch` callsites and refactor them to source `perspective`/`stega` via `getDynamicFetchOptions` and the three-layer pattern.
- **Search for `sanityFetch` calls inside `generateStaticParams`** → swap for `cachedSanityStaticParams`.
- **Search for `sanityFetch` calls inside `generateMetadata` / `sitemap.ts` / `opengraph-image.tsx` / etc.** → swap for `cachedSanityMetadata`.
- **Search for `sanityFetch` calls directly inside a `'use server'` function** → swap for `cachedSanity`.
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

## 3. Configure `defineLive` and export helpers

Create `src/sanity/lib/client.ts` and `src/sanity/lib/live.ts`. The core of `live.ts`:

```ts
// src/sanity/lib/live.ts (excerpt)
export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
})

// The app's one shared 'use cache' boundary. `sanityFetch` calls
// `cacheTag`/`cacheLife` internally but doesn't create the boundary —
// this wrapper provides it once, so callers don't add their own.
export const cachedSanity: StrictDefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}
```

Full file contents (including `client.ts`, `getDynamicFetchOptions`, `cachedSanityMetadata`, `cachedSanityStaticParams`) and per-helper guidance: [reference/live-helpers.md](reference/live-helpers.md).

The helpers exported from `live.ts`:

| Helper                     | Used in                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `cachedSanity`             | The default for fetching content anywhere server-side: pages, layouts, components, server actions |
| `sanityFetch`              | Only inside a component that carries its own `'use cache'` (also caches the rendered JSX)         |
| `cachedSanityMetadata`     | `generateMetadata`, `generateViewport`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, etc.    |
| `cachedSanityStaticParams` | `generateStaticParams` only                                                                       |
| `getDynamicFetchOptions`   | Resolving `perspective`/`stega` outside any `'use cache'` boundary                                |
| `SanityLive`               | Rendered once in a root layout                                                                    |

---

## 4. Render `<SanityLive>` in a root layout

`<SanityLive>` and `<VisualEditing>` both belong in a `layout.tsx`, never a `page.tsx`. Both must be rendered at most once across the whole tree — duplicate renders are undefined behavior.

- `includeDrafts` is **required** when `defineLive` is configured with `strict: true` (the recommended setup). TypeScript will surface the error if it's missing; pass `includeDrafts={isDraftMode}` so live revalidation includes drafts only in draft mode.
- Preserve any existing optional callback props on `<SanityLive>` when migrating: `onError`, `onWelcome`, `onReconnect`. They are commonly wired to a toast/notification helper and silently dropping them regresses UX.

```tsx
// src/app/layout.tsx
import {SanityLive} from '@/sanity/lib/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

export default async function RootLayout({children}: LayoutProps<'/'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

### With an embedded Sanity Studio

If a route mounts `NextStudio` from `next-sanity/studio` (e.g. `app/studio/[[...index]]/page.tsx`), `<SanityLive>` must live in a layout the embedded studio doesn't share. Use [route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups): put `<SanityLive>` in `src/app/(website)/layout.tsx` and keep the rest of the app under `src/app/(website)`.

---

## 5. Apply the three-layer pattern to pages and layouts

Every route that should be statically prerendered uses the same shape:

```text
Page/Layout (Layer 1: draftMode branch)
  ├── NOT draft mode → <CachedX perspective="published" stega={false} />  (no Suspense)
  └── draft mode → <Suspense fallback={...}>
                      <DynamicX params={params} />  (Layer 2: awaits dynamic APIs)
                        └── <CachedX perspective={p} stega={s} />  (Layer 3: fetches via cachedSanity)
```

**Critical rules**:

- The cache boundary lives in `live.ts` (`cachedSanity`), so route files usually carry no `'use cache'` directive at all. In particular the top-level `Page` / `Layout` must **not** have `'use cache'` — it awaits `params`, `searchParams`, or `cookies()` (via `getDynamicFetchOptions`), and those dynamic APIs are forbidden inside `'use cache'`. Adding `'use cache'` to the top-level function is the most common failure mode — TypeScript and the runtime will both complain.
- Layer 3 awaiting `cachedSanity` is enough for the whole route to prerender into the static shell — no `<Suspense>` needed in the published branch. `perspective` and `stega` are part of the wrapper's cache key automatically, so published and draft content never share a cache entry.
- Only Layer 2 (rendered inside `<Suspense>`, draft mode only) touches dynamic APIs.

Pick the right reference for the file you're editing:

- **`page.tsx`** with static or `generateStaticParams`-backed params → [reference/three-layer-pattern.md](reference/three-layer-pattern.md).
- **`page.tsx`** that uses `searchParams` or other dynamic APIs → the `searchParams` variant in [reference/three-layer-pattern.md](reference/three-layer-pattern.md).
- **`layout.tsx`** that fetches its own data → [reference/layouts.md](reference/layouts.md).
- **Dynamic `[slug]` route** that needs the `loading.tsx` + partial `generateStaticParams` optimization, or a layout that needs non-blocking `params` → [reference/dynamic-segments.md](reference/dynamic-segments.md).

---

## Verifying the Sanity surface

Use [`next-dev-loop`](https://github.com/vercel/next.js/tree/canary/skills/next-dev-loop) after each refactor; the loop mechanics and success bar live in the official skills. The Sanity-specific things to confirm:

- Published branch: the route prerenders fully (`◐` or `○` in the build's route table) and content renders without a `<Suspense>` fallback flash.
- Draft mode: enabling it streams draft content, `<VisualEditing>` overlays appear, and switching perspectives in Presentation Tool changes the rendered content.
- Live updates: editing published content in the Studio revalidates the route (via `<SanityLive>`) without a rebuild.

## Anti-patterns to grep for

When auditing an app, search for these and refactor:

- `perspective: 'published'` and `stega: false` hardcoded together in a `sanityFetch` / `cachedSanity` call inside a shared component → use the three-layer pattern, source `perspective`/`stega` via `getDynamicFetchOptions`. (Layer 1's non-draft branch passing literal `perspective="published" stega={false}` props is the pattern, not a violation.)
- `sanityFetch(` directly inside a function whose body begins with `'use server'` → swap for `cachedSanity` (resolve `perspective`/`stega` via `getDynamicFetchOptions` first).
- `sanityFetch(` inside `generateStaticParams` → swap for `cachedSanityStaticParams`.
- `sanityFetch(` inside `generateMetadata` / `generateViewport` / `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` etc. → swap for `cachedSanityMetadata` and resolve `perspective` via `getDynamicFetchOptions`.
- `sanityFetch(` in a component without its own `'use cache'` directive → swap for `cachedSanity` (or add the directive if caching the rendered JSX is intended).
- `await draftMode()` immediately followed by `await getDynamicFetchOptions()` at the top of a `page.tsx` or `layout.tsx` without a sibling `loading.tsx` → move those dynamic-API calls into a child component wrapped in `<Suspense>` so the static shell can prerender.
- More than one `<SanityLive>` or `<VisualEditing>` rendered in the tree → consolidate to a single render in the right layout.
