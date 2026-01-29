---
name: features-optimization
description: tsdown tree shaking, minification, and sourcemaps
---

# Optimization Features

## Tree Shaking

**Enabled by default.** Removes unused code from the bundle.

```bash
tsdown --no-treeshake  # Disable if needed
```

### Example

```ts
// src/util.ts
export function unused() {
  console.log("I'm unused.")
}

export function hello(x: number) {
  console.log('Hello', x)
}
```

```ts
// src/index.ts
import { hello } from './util'
hello(1)
```

**With tree shaking:** `unused()` is removed from output.

## Minification

Compresses code by removing whitespace, comments, and shortening names.

```bash
tsdown --minify
```

> **Note:** Minification uses Oxc (currently alpha). Test thoroughly in production.

### Example

Input:
```ts
const x = 1
function hello(x: number) {
  console.log('Hello World')
  console.log(x)
}
hello(x)
```

Output (minified):
```js
const e=1;function t(e){console.log(`Hello World`),console.log(e)}t(e);
```

## Source Maps

Enable for debugging:

```bash
tsdown --sourcemap
```

Source maps are auto-enabled if `declarationMap: true` in `tsconfig.json`.

Source maps allow:
- Tracing errors to original source files
- Debugging bundled code in dev tools

<!-- 
Source references:
- https://tsdown.dev/options/tree-shaking
- https://tsdown.dev/options/minification
- https://tsdown.dev/options/sourcemap
-->
