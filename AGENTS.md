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
