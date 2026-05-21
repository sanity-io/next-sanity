---
name: sanity-live-cache-components
description: Integrates Sanity Live with Next.js Cache Components in next-sanity v13+ apps. Sets up sanityFetch, <SanityLive>, Visual Editing, Presentation Tool, draft mode handling, and the three-layer (Page/Dynamic/Cached) component pattern with explicit perspective/stega prop-drilling. Use when configuring or migrating a Next.js app to cacheComponents with Sanity, when adding sanityFetch, when wiring <SanityLive>/<VisualEditing>, or when refactoring components that hardcode perspective/stega.
---

# Sanity Live + Cache Components

Wires `next-sanity` into a Next.js 16+ app with `cacheComponents: true`. Data is fetched with `sanityFetch` (which calls `cacheTag`/`cacheLife` internally), and `<SanityLive>` in the root layout revalidates cached content over an EventSource connection to Sanity Content Lake. Visual Editing and Presentation Tool are fully supported when draft mode is enabled.

Read the relevant guide in `node_modules/next/dist/docs/` (when available) before writing code. If a guide conflicts with this skill, follow this skill.

This skill assumes familiarity with the `next-cache-components` skill — it covers `'use cache'`, `cacheLife`, `cacheTag`, and the cookies/headers/params rule. The only Sanity-relevant exception: `await draftMode()` is allowed inside `'use cache'` (Next.js bypasses caching when draft mode is enabled — see [the `use cache` reference](https://nextjs.org/docs/app/api-reference/directives/use-cache#draft-mode)).

## Prerequisites

- Next.js 16.2+ installed in the project (check `package.json` or run `pnpm list next` / `npm ls next` — don't use `pnpm view next version`, that reports the registry's latest, not what's installed).
- `AGENTS.md` exists, or [follow the guide](https://nextjs.org/docs/app/guides/ai-agents#existing-projects).
- These environment variables are set:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_READ_TOKEN`
- Embedded Sanity Studio configuration (`sanity.config.ts`, `sanity.cli.ts`, anything under `sanity/`) needs no changes — this skill only touches the Next.js app surface.

## Reference files

| File                                                                 | When to read                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [reference/live-helpers.md](reference/live-helpers.md)               | Full `client.ts` / `live.ts`, `sanityFetch*` and `getDynamicFetchOptions` details                                              |
| [reference/three-layer-pattern.md](reference/three-layer-pattern.md) | The Page → Dynamic → Cached pattern for `page.tsx`, including the `searchParams` variant                                       |
| [reference/layouts.md](reference/layouts.md)                         | Non-blocking data fetching inside `layout.tsx` with a shared `'use cache'` helper                                              |
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
- **Search for `sanityFetch` calls inside `generateStaticParams`** → swap for `sanityFetchStaticParams`.
- **Search for `sanityFetch` calls inside `generateMetadata` / `sitemap.ts` / `opengraph-image.tsx` / etc.** → swap for `sanityFetchMetadata`.
- **Search for `sanityFetch` calls directly inside a `'use server'` function** → split into a separate `'use cache'` helper.
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

Create `src/sanity/lib/client.ts` and `src/sanity/lib/live.ts`. The minimal `defineLive` call:

```ts
// src/sanity/lib/live.ts (excerpt)
export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
})
```

Full file contents (including `client.ts`, `getDynamicFetchOptions`, `sanityFetchMetadata`, `sanityFetchStaticParams`) and per-helper guidance: [reference/live-helpers.md](reference/live-helpers.md).

The helpers exported from `live.ts`:

| Helper                    | Used in                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `sanityFetch`             | `'use cache'` components rendered from `page.tsx` / `layout.tsx`                               |
| `sanityFetchMetadata`     | `generateMetadata`, `generateViewport`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, etc. |
| `sanityFetchStaticParams` | `generateStaticParams` only                                                                    |
| `getDynamicFetchOptions`  | Resolving `perspective`/`stega` outside any `'use cache'` boundary                             |
| `SanityLive`              | Rendered once in a root layout                                                                 |

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
                        └── <CachedX perspective={p} stega={s} />  (Layer 3: 'use cache')
```

**Critical rule**: Only Layer 3 carries `'use cache'`. The top-level `Page` / `Layout` must **not** have `'use cache'` — it awaits `params`, `searchParams`, or `cookies()` (via `getDynamicFetchOptions`), and those dynamic APIs are forbidden inside `'use cache'`. Layer 3 carrying `'use cache'` is enough for the whole route to prerender into the static shell. Adding `'use cache'` to the top-level function is the most common failure mode — TypeScript and the runtime will both complain.

Pick the right reference for the file you're editing:

- **`page.tsx`** with static or `generateStaticParams`-backed params → [reference/three-layer-pattern.md](reference/three-layer-pattern.md).
- **`page.tsx`** that uses `searchParams` or other dynamic APIs → the `searchParams` variant in [reference/three-layer-pattern.md](reference/three-layer-pattern.md).
- **`layout.tsx`** that fetches its own data → [reference/layouts.md](reference/layouts.md).
- **Dynamic `[slug]` route** that needs the `loading.tsx` + partial `generateStaticParams` optimization, or a layout that needs non-blocking `params` → [reference/dynamic-segments.md](reference/dynamic-segments.md).

---

## Anti-patterns to grep for

When auditing an app, search for these and refactor:

- `perspective: 'published'` and `stega: false` hardcoded together in a `sanityFetch` call → use the three-layer pattern, source `perspective`/`stega` via `getDynamicFetchOptions`.
- `sanityFetch(` directly inside a function whose body begins with `'use server'` → split into a separate `'use cache'` helper.
- `sanityFetch(` inside `generateStaticParams` → swap for `sanityFetchStaticParams`.
- `sanityFetch(` inside `generateMetadata` / `generateViewport` / `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` etc. → swap for `sanityFetchMetadata` and resolve `perspective` via `getDynamicFetchOptions`.
- `await draftMode()` immediately followed by `await getDynamicFetchOptions()` at the top of a `page.tsx` or `layout.tsx` without a sibling `loading.tsx` → move those dynamic-API calls into a child component wrapped in `<Suspense>` so the static shell can prerender.
- More than one `<SanityLive>` or `<VisualEditing>` rendered in the tree → consolidate to a single render in the right layout.
