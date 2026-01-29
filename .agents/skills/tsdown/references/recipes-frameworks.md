---
name: recipes-frameworks
description: Building Vue and React component libraries with tsdown
---

# Framework Support

## React

Rolldown natively supports JSX/TSX. No additional plugins needed.

### Quick Start

```bash
npx create-tsdown@latest -t react
npx create-tsdown@latest -t react-compiler  # With React Compiler
```

### Minimal Config

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  dts: true,
})
```

### Classic JSX Transform

```ts
export default defineConfig({
  inputOptions: {
    transform: {
      jsx: 'react',
    },
  },
})
```

### React Compiler

```bash
pnpm add -D @rollup/plugin-babel babel-plugin-react-compiler
```

```ts
import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig({
  plugins: [
    pluginBabel({
      babelHelpers: 'bundled',
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      plugins: ['babel-plugin-react-compiler'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
})
```

## Vue

Uses `unplugin-vue` and `rolldown-plugin-dts`.

### Quick Start

```bash
npx create-tsdown@latest -t vue
```

### Minimal Config

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  plugins: [Vue({ isProduction: true })],
  dts: { vue: true },
})
```

### Dependencies

```bash
pnpm add -D unplugin-vue vue-tsc
```

- **`unplugin-vue`** - Compiles `.vue` SFCs
- **`vue-tsc`** - Generates accurate TypeScript declarations

> **Tip:** Use `platform: 'neutral'` for libraries that may run in both browser and Node.js.

<!-- 
Source references:
- https://tsdown.dev/recipes/react-support
- https://tsdown.dev/recipes/vue-support
-->
