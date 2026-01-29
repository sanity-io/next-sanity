---
name: features-shims
description: tsdown CJS/ESM compatibility shims
---

# Shims

Shims provide compatibility between CommonJS and ESM module systems.

## CJS Variables in ESM

`__dirname` and `__filename` are not available in ESM. Enable shims:

```bash
tsdown --shims
```

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  shims: true,
})
```

Usage in ESM output:
```js
console.log(__dirname)   // Available with shims
console.log(__filename)  // Available with shims
```

> **Note:** Shims add minimal runtime overhead. Unused shims are tree-shaken.

## `require` in ESM (Auto-injected)

When `platform: 'node'`, tsdown automatically injects a `require` shim using `createRequire`:

```js
// Auto-injected:
// const require = createRequire(import.meta.url)

const someModule = require('some-module')
```

This is always enabled for ESM output targeting Node.js.

## ESM Variables in CJS (Always enabled)

These ESM variables are automatically shimmed in CJS output:

```js
console.log(import.meta.url)       // Works in CJS
console.log(import.meta.dirname)   // Works in CJS
console.log(import.meta.filename)  // Works in CJS
```

No configuration needed.

## CJS Default Export

When output is CJS and module has only a default export:

**Enabled by default.** Transforms:

```ts
// Source
export default function greet() {
  console.log('Hello!')
}
```

```js
// CJS Output
function greet() {
  console.log('Hello!')
}
module.exports = greet
```

```ts
// Declaration Output
declare function greet(): void
export = greet
```

This improves compatibility with `require('your-module')` consumers.

<!-- 
Source references:
- https://tsdown.dev/options/shims
- https://tsdown.dev/options/cjs-default
-->
