## Migrate

### Minimum required `@sanity/ui` is now `2.0.11`

Upgrade to the latest v2 stable using the following command:

```bash
npm install @sanity/ui@latest --save-exact
```

### Minumum required `styled-components` is now `6.1.0`

Upgrade using:

```bash
npm install styled-components@^6.1.0
```

And make sure to remove `@types/styled-components` as `styled-components` now ship with its own types:

```bash
npm uninstall @types/styled-components
```

You can also remove `react-is` from your dependencies, unless you're using them in your own code.

### The deprecated export `next-sanity/studio/metadata` has been removed

Use the `metadata` export from `next-sanity/studio` instead:

```diff
-export {metadata} from 'next-sanity/studio/metadata'
+export {metadata} from 'next-sanity/studio'
```
