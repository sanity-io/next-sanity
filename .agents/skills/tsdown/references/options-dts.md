---
name: options-dts
description: tsdown declaration file (.d.ts) generation configuration
---

# Declaration Files (dts)

tsdown generates `.d.ts` files using `rolldown-plugin-dts`.

## Enabling dts

Auto-enabled if `package.json` has `types` or `typings` field. Explicitly enable:

```bash
tsdown --dts
```

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: true,
})
```

> **Note:** Requires `typescript` installed in your project.

## Performance with isolatedDeclarations

For fastest `.d.ts` generation, enable `isolatedDeclarations` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "isolatedDeclarations": true
  }
}
```

This uses **oxc-transform** which is extremely fast. Without it, tsdown falls back to the slower TypeScript compiler.

## Declaration Maps

Enable `.d.ts.map` files for source navigation (useful in monorepos):

### Via tsconfig.json

```json
{
  "compilerOptions": {
    "declarationMap": true
  }
}
```

### Via tsdown Config

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: {
    sourcemap: true,
  },
})
```

## TypeScript Resolver

For complex third-party types (e.g., `@types/babel__generator`), use the TypeScript resolver:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: {
    resolver: 'tsc',  // Slower but more compatible
  },
})
```

## Vue Support

For Vue component libraries:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: { vue: true },
})
```

Requires `vue-tsc` installed.

## Build Process

- **ESM output:** `.js` and `.d.ts` generated in same build process
- **CJS output:** Separate build process for `.d.ts` to ensure compatibility

<!-- 
Source references:
- https://tsdown.dev/options/dts
-->
